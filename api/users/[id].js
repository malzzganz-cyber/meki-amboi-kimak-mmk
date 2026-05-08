const DB = require('../db');
const { cors, requireAdmin } = require('../middleware');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;

  // ── DELETE user ───────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      await DB.deleteUser(id);
      await DB.addActivity({
        type: 'user_deleted',
        actor: admin.username,
        role: 'admin',
        detail: `Hapus user ID ${id}`
      });
      return res.json({ success: true, message: 'User berhasil dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PATCH update user (plan, ban, etc) ────────────────────
  if (req.method === 'PATCH') {
    try {
      const updates = req.body || {};
      // Hapus password dari update kalau kosong
      if (!updates.password) delete updates.password;

      await DB.updateUser(id, updates);
      await DB.addActivity({
        type: 'user_updated',
        actor: admin.username,
        role: 'admin',
        detail: `Update user ID ${id}: ${JSON.stringify(updates)}`
      });
      return res.json({ success: true, message: 'User berhasil diupdate' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
