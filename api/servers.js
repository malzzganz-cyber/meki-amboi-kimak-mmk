const Ptero = require('./ptero');
const DB = require('./db');
const cfg = require('../config');
const { cors, requireAuth } = require('./middleware');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  // ── GET /api/servers ──────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const pteroData = await Ptero.getServers();
      const dbServers = await DB.getServers();

      // Merge ptero data dengan db records
      const servers = (pteroData.data || []).map(s => {
        const a = s.attributes;
        const dbRec = dbServers.find(d => String(d.pteroId) === String(a.id));
        return {
          id: a.id,
          uuid: a.uuid,
          name: a.name,
          status: a.status || 'offline',
          ram: a.limits?.memory,
          disk: a.limits?.disk,
          cpu: a.limits?.cpu,
          node: a.node,
          owner: dbRec?.ownerUsername || '—',
          ownerEmail: dbRec?.ownerEmail || '—',
          plan: dbRec?.plan || 'free',
          telegramId: dbRec?.telegramId || null,
          createdAt: dbRec?.createdAt || null
        };
      });

      // Kalau user biasa, hanya tampilkan server miliknya
      const filtered = user.role === 'admin'
        ? servers
        : servers.filter(s => s.owner === user.username);

      return res.json({ success: true, data: filtered, meta: pteroData.meta });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/servers ─────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { username, email, displayName, telegramId, serverName, ram, disk, cpu, databases, backups } = req.body || {};

      if (!username || !email) {
        return res.status(400).json({ success: false, message: 'Username dan email wajib diisi' });
      }

      // Cek plan limit
      const plan = user.plan || 'free';
      const limits = cfg.plans[plan] || cfg.plans.free;

      const reqCpu = parseInt(cpu) || 100;
      const reqRam = parseInt(ram) || 1024;
      const reqDisk = parseInt(disk) || 5120;

      if (plan === 'free') {
        if (limits.maxCpu > 0 && reqCpu > limits.maxCpu) {
          return res.status(400).json({
            success: false,
            message: `Free plan maksimal CPU ${limits.maxCpu}%. Upgrade ke Premium untuk unlimited!`,
            upgradeNeeded: true
          });
        }
        if (limits.maxRam > 0 && reqRam > limits.maxRam) {
          return res.status(400).json({
            success: false,
            message: `Free plan maksimal RAM ${limits.maxRam}MB.`,
            upgradeNeeded: true
          });
        }
      }

      // 1. Create Pterodactyl user
      const pteroUser = await Ptero.createUser({
        username,
        email,
        firstName: displayName?.split(' ')[0] || 'Malzz',
        lastName: displayName?.split(' ')[1] || 'User'
      });

      // 2. Create server
      const name = serverName || `${username}-server`;
      const pteroServer = await Ptero.createServer({
        userId: pteroUser.id,
        name,
        ram: reqRam,
        disk: reqDisk,
        cpu: plan === 'premium' ? 0 : reqCpu, // premium = 0 (unlimited)
        databases: databases || 1,
        backups: backups || 1
      });

      // 3. Save ke GitHub DB
      await DB.saveServer({
        pteroId: pteroServer.id,
        uuid: pteroServer.uuid,
        name: pteroServer.name,
        ownerUsername: username,
        ownerEmail: email,
        createdBy: user.username,
        telegramId: telegramId || null,
        plan,
        ram: reqRam,
        disk: reqDisk,
        cpu: reqCpu
      });

      // 4. Stats + activity
      const stats = await DB.getStats();
      await DB.updateStats({ totalCreated: (stats.totalCreated || 0) + 1 });
      await DB.addActivity({
        type: 'server_created',
        actor: user.username,
        role: user.role,
        detail: `Buat server "${name}" untuk ${username} (${email})`,
        plan
      });
      await DB.addNotification({
        title: '✅ Server Dibuat',
        message: `Server "${name}" untuk ${username} berhasil dibuat`,
        type: 'success'
      });

      return res.status(201).json({
        success: true,
        message: 'Server berhasil dibuat!',
        data: { server: pteroServer, pteroUser }
      });

    } catch (err) {
      console.error('[servers POST] error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
