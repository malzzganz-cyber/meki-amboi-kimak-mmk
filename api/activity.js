const DB = require('./db');
const { cors, requireAuth } = require('./middleware');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const limit = parseInt(req.query.limit) || 50;
    const all = await DB.getActivity(limit);
    const data = user.role === 'admin' ? all : all.filter(a => a.actor === user.username);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
