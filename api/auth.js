const cfg = require('../config');
const DB = require('./db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    // ── CEK ADMIN DULU ──────────────────────────────────────
    const adminMatch = cfg.admins.find(a =>
      (a.username.toLowerCase() === username.toLowerCase() ||
       a.email.toLowerCase() === username.toLowerCase()) &&
      a.password === password
    );

    if (adminMatch) {
      const token = jwt.sign(
        {
          id: 'admin_' + adminMatch.username,
          username: adminMatch.username,
          email: adminMatch.email,
          displayName: adminMatch.displayName,
          avatar: adminMatch.avatar,
          role: 'admin',
          plan: 'admin'
        },
        cfg.jwtSecret,
        { expiresIn: cfg.jwtExpiry }
      );

      await DB.addActivity({
        type: 'login',
        actor: adminMatch.username,
        role: 'admin',
        detail: 'Admin login berhasil',
        ip: req.headers['x-forwarded-for'] || 'unknown'
      }).catch(() => {});

      return res.json({
        success: true,
        token,
        user: {
          id: 'admin_' + adminMatch.username,
          username: adminMatch.username,
          email: adminMatch.email,
          displayName: adminMatch.displayName,
          avatar: adminMatch.avatar,
          role: 'admin',
          plan: 'admin'
        }
      });
    }

    // ── CEK USER BIASA ──────────────────────────────────────
    const user = await DB.getUser(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    // Simple password check (in production gunakan bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    if (user.banned) {
      return res.status(403).json({ success: false, message: 'Akun kamu dibanned. Hubungi admin.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        avatar: (user.username || 'U')[0].toUpperCase(),
        role: 'user',
        plan: user.plan || 'free'
      },
      cfg.jwtSecret,
      { expiresIn: cfg.jwtExpiry }
    );

    await DB.addActivity({
      type: 'login',
      actor: user.username,
      role: 'user',
      detail: `User login (plan: ${user.plan || 'free'})`,
      ip: req.headers['x-forwarded-for'] || 'unknown'
    }).catch(() => {});

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        avatar: (user.username || 'U')[0].toUpperCase(),
        role: 'user',
        plan: user.plan || 'free'
      }
    });

  } catch (err) {
    console.error('[auth] error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error, coba lagi' });
  }
};
