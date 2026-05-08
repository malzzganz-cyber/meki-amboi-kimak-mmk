const DB = require('./db');
const { cors, requireAdmin } = require('./middleware');

function genId() {
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = requireAdmin(req, res);
  if (!admin) return;

  // ── GET all users ─────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const users = await DB.getUsers();
      // jangan kirim password ke frontend
      const safe = users.map(({ password, ...u }) => u);
      return res.json({ success: true, data: safe });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST create user ──────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { username, email, password, plan, displayName, telegramId } = req.body || {};
      if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email, dan password wajib diisi' });
      }

      // Cek duplikat
      const existing = await DB.getUser(username);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
      }
      const existingEmail = await DB.getUser(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      }

      const newUser = {
        id: genId(),
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password, // in production: hash this
        displayName: displayName || username,
        telegramId: telegramId || null,
        plan: plan || 'free',
        banned: false,
        createdBy: admin.username
      };

      await DB.createUser(newUser);
      await DB.addActivity({
        type: 'user_created',
        actor: admin.username,
        role: 'admin',
        detail: `Buat akun user ${username} (plan: ${plan || 'free'})`
      });
      await DB.addNotification({
        title: '👤 User Dibuat',
        message: `Akun ${username} (${plan || 'free'}) berhasil dibuat`,
        type: 'info'
      });

      const { password: _, ...safeUser } = newUser;
      return res.status(201).json({ success: true, data: safeUser });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
