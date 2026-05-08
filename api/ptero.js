// ── Pterodactyl Service ─────────────────────────────────────
// Semua request ke Pterodactyl API pakai config admin
// User tidak perlu tau domain / API key

const cfg = require('../config');

const { domain, appKey, clientKey } = cfg.pterodactyl;

function appApi(path, method = 'GET', body = null) {
  return fetch(`${domain}/api/application${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${appKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

function clientApi(path, method = 'GET', body = null) {
  return fetch(`${domain}/api/client${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${clientKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

function pteroErr(err) {
  return err?.errors?.[0]?.detail || err?.message || 'Pterodactyl error';
}

const Ptero = {

  // ── CREATE USER ──
  async createUser({ username, email, firstName = 'Malzz', lastName = 'User' }) {
    const res = await appApi('/users', 'POST', {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      password: genPassword()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(pteroErr(data));
    return data.attributes;
  },

  // ── CREATE SERVER ──
  async createServer({ userId, name, ram, disk, cpu, databases = 1, backups = 1 }) {
    const p = cfg.pterodactyl;
    const res = await appApi('/servers', 'POST', {
      name,
      user: userId,
      egg: p.eggId,
      docker_image: p.dockerImage,
      startup: p.startup,
      environment: p.environment,
      limits: {
        memory: parseInt(ram),
        swap: 0,
        disk: parseInt(disk),
        io: 500,
        cpu: parseInt(cpu)
      },
      feature_limits: {
        databases: parseInt(databases),
        backups: parseInt(backups),
        allocations: 1
      },
      deploy: {
        locations: [p.locationId],
        dedicated_ip: false,
        port_range: []
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(pteroErr(data));
    return data.attributes;
  },

  // ── GET ALL SERVERS ──
  async getServers(page = 1) {
    const res = await appApi(`/servers?page=${page}&per_page=50`);
    const data = await res.json();
    if (!res.ok) throw new Error(pteroErr(data));
    return data;
  },

  // ── GET SERVER RESOURCES ──
  async getServerResources(uuid) {
    try {
      const res = await clientApi(`/servers/${uuid}/resources`);
      const data = await res.json();
      if (!res.ok) return null;
      return data.attributes;
    } catch { return null; }
  },

  // ── DELETE SERVER ──
  async deleteServer(id) {
    const res = await appApi(`/servers/${id}`, 'DELETE');
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      throw new Error(pteroErr(data));
    }
    return true;
  },

  // ── GET ALL USERS ──
  async getUsers(page = 1) {
    const res = await appApi(`/users?page=${page}&per_page=50`);
    const data = await res.json();
    if (!res.ok) throw new Error(pteroErr(data));
    return data;
  },

  // ── DELETE USER ──
  async deleteUser(id) {
    const res = await appApi(`/users/${id}`, 'DELETE');
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      throw new Error(pteroErr(data));
    }
    return true;
  },

  // ── GET NODES ──
  async getNodes() {
    const res = await appApi('/nodes');
    const data = await res.json();
    if (!res.ok) throw new Error(pteroErr(data));
    return data;
  }
};

function genPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = Ptero;
