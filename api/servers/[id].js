const Ptero = require('../ptero');
const DB = require('../db');
const { cors, requireAdmin } = require('../middleware');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;
  try {
    await Ptero.deleteServer(id);
    await DB.deleteServer(id);

    const stats = await DB.getStats();
    await DB.updateStats({ totalDeleted: (stats.totalDeleted || 0) + 1 });
    await DB.addActivity({
      type: 'server_deleted',
      actor: admin.username,
      role: 'admin',
      detail: `Hapus server ID ${id}`
    });

    return res.json({ success: true, message: 'Server berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
