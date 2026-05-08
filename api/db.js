// ── GitHub Database Helper ──────────────────────────────────
// Pakai GitHub repo sebagai "database" via GitHub API
// Semua data disimpan sebagai JSON files di repo

const cfg = require('../config');
const { owner, repo, branch, token } = cfg.github;

const BASE = `https://api.github.com/repos/${owner}/${repo}/contents`;
const HEADERS = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'malzz-hosting'
};

// ── Read file from GitHub ──
async function readFile(path) {
  try {
    const res = await fetch(`${BASE}/${path}?ref=${branch}`, { headers: HEADERS });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { data: JSON.parse(content), sha: data.sha };
  } catch (e) {
    if (e.message?.includes('404') || e.message?.includes('Not Found')) return null;
    console.error('[DB] readFile error:', e.message);
    return null;
  }
}

// ── Write file to GitHub ──
async function writeFile(path, content, sha = null) {
  try {
    const body = {
      message: `update: ${path}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${BASE}/${path}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `GitHub write error: ${res.status}`);
    }
    return true;
  } catch (e) {
    console.error('[DB] writeFile error:', e.message);
    throw e;
  }
}

// ── Collections ──────────────────────────────────────────────

const DB = {
  // Get all users
  async getUsers() {
    const result = await readFile('data/users.json');
    return result ? result.data : [];
  },

  // Get user by username or email
  async getUser(identifier) {
    const users = await this.getUsers();
    return users.find(u =>
      u.username?.toLowerCase() === identifier?.toLowerCase() ||
      u.email?.toLowerCase() === identifier?.toLowerCase()
    ) || null;
  },

  // Get user by ID
  async getUserById(id) {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  // Save new user
  async createUser(user) {
    const result = await readFile('data/users.json');
    const users = result ? result.data : [];
    const sha = result ? result.sha : null;
    users.push({ ...user, createdAt: new Date().toISOString() });
    await writeFile('data/users.json', users, sha);
    return user;
  },

  // Update user
  async updateUser(id, updates) {
    const result = await readFile('data/users.json');
    if (!result) return false;
    const users = result.data.map(u => u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u);
    await writeFile('data/users.json', users, result.sha);
    return true;
  },

  // Delete user
  async deleteUser(id) {
    const result = await readFile('data/users.json');
    if (!result) return false;
    const users = result.data.filter(u => u.id !== id);
    await writeFile('data/users.json', users, result.sha);
    return true;
  },

  // Get all servers
  async getServers() {
    const result = await readFile('data/servers.json');
    return result ? result.data : [];
  },

  // Save server
  async saveServer(server) {
    const result = await readFile('data/servers.json');
    const servers = result ? result.data : [];
    const sha = result ? result.sha : null;
    servers.push({ ...server, createdAt: new Date().toISOString() });
    await writeFile('data/servers.json', servers, sha);
    return server;
  },

  // Delete server record
  async deleteServer(pteroId) {
    const result = await readFile('data/servers.json');
    if (!result) return false;
    const servers = result.data.filter(s => String(s.pteroId) !== String(pteroId));
    await writeFile('data/servers.json', servers, result.sha);
    return true;
  },

  // Activity log
  async addActivity(entry) {
    const result = await readFile('data/activity.json');
    const logs = result ? result.data : [];
    const sha = result ? result.sha : null;
    logs.unshift({ ...entry, createdAt: new Date().toISOString() });
    const trimmed = logs.slice(0, 500); // keep last 500
    await writeFile('data/activity.json', trimmed, sha);
  },

  async getActivity(limit = 50) {
    const result = await readFile('data/activity.json');
    return result ? result.data.slice(0, limit) : [];
  },

  // Notifications
  async addNotification(notif) {
    const result = await readFile('data/notifications.json');
    const notifs = result ? result.data : [];
    const sha = result ? result.sha : null;
    notifs.unshift({ ...notif, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() });
    const trimmed = notifs.slice(0, 100);
    await writeFile('data/notifications.json', trimmed, sha);
  },

  async getNotifications() {
    const result = await readFile('data/notifications.json');
    return result ? result.data : [];
  },

  // Stats snapshot
  async getStats() {
    const result = await readFile('data/stats.json');
    return result ? result.data : { totalCreated: 0, totalDeleted: 0, lastUpdated: null };
  },

  async updateStats(updates) {
    const result = await readFile('data/stats.json');
    const stats = result ? result.data : { totalCreated: 0, totalDeleted: 0 };
    const sha = result ? result.sha : null;
    const updated = { ...stats, ...updates, lastUpdated: new Date().toISOString() };
    await writeFile('data/stats.json', updated, sha);
  },

  // Init DB files if not exist
  async init() {
    const files = [
      { path: 'data/users.json', default: [] },
      { path: 'data/servers.json', default: [] },
      { path: 'data/activity.json', default: [] },
      { path: 'data/notifications.json', default: [] },
      { path: 'data/stats.json', default: { totalCreated: 0, totalDeleted: 0, lastUpdated: null } }
    ];
    for (const f of files) {
      const existing = await readFile(f.path);
      if (!existing) {
        await writeFile(f.path, f.default);
      }
    }
  }
};

module.exports = DB;
