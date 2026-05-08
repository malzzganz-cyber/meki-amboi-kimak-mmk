const DB = require('./db');
const Ptero = require('./ptero');
const { cors, requireAuth } = require('./middleware');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const [pteroData, dbServers, dbUsers, activity, notifications, stats] = await Promise.all([
      Ptero.getServers().catch(() => ({ data: [] })),
      DB.getServers().catch(() => []),
      DB.getUsers().catch(() => []),
      DB.getActivity(10).catch(() => []),
      DB.getNotifications().catch(() => []),
      DB.getStats().catch(() => ({}))
    ]);

    const servers = pteroData.data || [];
    const totalServers = servers.length;
    const onlineServers = servers.filter(s => s.attributes?.status === 'running').length;

    // Kalau user biasa, filter hanya server miliknya
    const myServers = user.role === 'admin'
      ? servers
      : servers.filter(s => {
          const dbRec = dbServers.find(d => String(d.pteroId) === String(s.attributes?.id));
          return dbRec?.ownerUsername === user.username;
        });

    return res.json({
      success: true,
      data: {
        overview: {
          totalServers: user.role === 'admin' ? totalServers : myServers.length,
          onlineServers: user.role === 'admin' ? onlineServers : myServers.filter(s => s.attributes?.status === 'running').length,
          totalUsers: user.role === 'admin' ? dbUsers.length : null,
          totalCreated: stats.totalCreated || 0,
          totalDeleted: stats.totalDeleted || 0
        },
        recentServers: myServers.slice(0, 6).map(s => ({
          id: s.attributes?.id,
          uuid: s.attributes?.uuid,
          name: s.attributes?.name,
          status: s.attributes?.status || 'offline',
          ram: s.attributes?.limits?.memory,
          cpu: s.attributes?.limits?.cpu,
          disk: s.attributes?.limits?.disk
        })),
        activity: user.role === 'admin' ? activity : activity.filter(a => a.actor === user.username),
        notifications: user.role === 'admin' ? notifications.slice(0, 5) : notifications.filter(n => !n.userId || n.userId === user.id).slice(0, 5),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          plan: user.plan
        }
      }
    });
  } catch (err) {
    console.error('[dashboard] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
