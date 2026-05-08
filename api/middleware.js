const jwt = require('jsonwebtoken');
const cfg = require('../config');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.split(' ')[1], cfg.jwtSecret);
  } catch { return null; }
}

function requireAuth(req, res) {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized. Silakan login ulang.' });
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Forbidden. Admin only.' });
    return null;
  }
  return user;
}

module.exports = { cors, verifyToken, requireAuth, requireAdmin };
