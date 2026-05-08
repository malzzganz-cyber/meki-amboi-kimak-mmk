// ── API Client ────────────────────────────────────────────────
const API = {
  base: '/api',

  token() { return localStorage.getItem('mz_token') },
  user() { try { return JSON.parse(localStorage.getItem('mz_user')) } catch { return null } },
  setSession(token, user) {
    localStorage.setItem('mz_token', token);
    localStorage.setItem('mz_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('mz_token');
    localStorage.removeItem('mz_user');
  },
  isAdmin() { return this.user()?.role === 'admin' },
  isPremium() { const u = this.user(); return u?.role === 'admin' || u?.plan === 'premium' },

  async req(endpoint, opts = {}) {
    const token = this.token();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers
    };
    try {
      const res = await fetch(this.base + endpoint, {
        ...opts,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
      const data = await res.json();
      if (res.status === 401) {
        this.clearSession();
        if (!location.pathname.includes('login')) location.href = '/pages/login.html';
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Network error. Cek koneksi kamu.' };
    }
  },

  get: (ep) => API.req(ep, { method: 'GET' }),
  post: (ep, body) => API.req(ep, { method: 'POST', body }),
  patch: (ep, body) => API.req(ep, { method: 'PATCH', body }),
  del: (ep) => API.req(ep, { method: 'DELETE' }),
};

// ── Toast ─────────────────────────────────────────────────────
const Toast = {
  _init() {
    if (!document.getElementById('toasts')) {
      const d = document.createElement('div');
      d.id = 'toasts';
      document.body.appendChild(d);
    }
  },
  show(title, msg = '', type = 'i', dur = 4000) {
    this._init();
    const icons = { s: '✅', e: '❌', i: 'ℹ️', w: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
      <div style="flex:1">
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
      </div>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0 2px;line-height:1;margin-top:-1px">×</button>
    `;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, dur);
  },
  ok: (t, m) => Toast.show(t, m, 's'),
  err: (t, m) => Toast.show(t, m, 'e'),
  info: (t, m) => Toast.show(t, m, 'i'),
  warn: (t, m) => Toast.show(t, m, 'w'),
};

// ── Modal ─────────────────────────────────────────────────────
const Modal = {
  confirm(title, msg, danger = true) {
    return new Promise(resolve => {
      document.getElementById('_confirm')?.remove();
      const ov = document.createElement('div');
      ov.id = '_confirm';
      ov.className = 'modal-overlay';
      ov.innerHTML = `
        <div class="modal" style="max-width:400px">
          <div class="modal-body" style="padding:28px 28px 24px;text-align:center">
            <div class="confirm-icon" style="background:${danger ? 'var(--rose-d)' : 'var(--blue-d)'};margin:0 auto 16px">
              ${danger ? '🗑️' : '❓'}
            </div>
            <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:700;margin-bottom:8px">${title}</div>
            <div style="font-size:13px;color:var(--dim);line-height:1.6;margin-bottom:24px">${msg}</div>
            <div style="display:flex;gap:10px;justify-content:center">
              <button id="_no" class="btn btn-ghost">Batal</button>
              <button id="_yes" class="btn" style="background:${danger ? 'var(--rose)' : 'var(--blue)'};color:#fff;min-width:90px">
                ${danger ? 'Hapus' : 'Ya, lanjut'}
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('open'));
      const close = (v) => {
        ov.classList.remove('open');
        setTimeout(() => ov.remove(), 300);
        resolve(v);
      };
      ov.querySelector('#_no').onclick = () => close(false);
      ov.querySelector('#_yes').onclick = () => close(true);
      ov.onclick = e => { if (e.target === ov) close(false); };
    });
  }
};

// ── Utils ─────────────────────────────────────────────────────
const Utils = {
  fmtRam(mb) { if (!mb && mb !== 0) return '—'; if (mb === 0) return '∞'; return mb >= 1024 ? `${(mb/1024).toFixed(1)} GB` : `${mb} MB`; },
  fmtDisk(mb) { if (!mb && mb !== 0) return '—'; if (mb === 0) return '∞'; return mb >= 1024 ? `${(mb/1024).toFixed(1)} GB` : `${mb} MB`; },
  fmtCpu(c) { if (c === 0 || c === '0') return '∞ Unlimited'; return `${c}%`; },
  timeAgo(d) {
    if (!d) return '';
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff/60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff/3600)}j lalu`;
    return `${Math.floor(diff/86400)}h lalu`;
  },
  truncate(s, n = 28) { return s?.length > n ? s.slice(0, n) + '…' : (s || '—'); },
  debounce(fn, ms = 280) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
  setLoading(btn, on = true) {
    const sp = btn.querySelector('.btn-spinner');
    if (on) { btn.classList.add('btn-loading'); if (sp) sp.style.display = 'inline-block'; btn._orig = btn.innerHTML; }
    else { btn.classList.remove('btn-loading'); if (btn._orig) btn.innerHTML = btn._orig; }
  },
  planBadge(plan) {
    const map = { admin: 'badge-admin', premium: 'badge-premium', free: 'badge-free' };
    const labels = { admin: '👑 Admin', premium: '⚡ Premium', free: 'Free' };
    return `<span class="badge ${map[plan] || 'badge-free'}">${labels[plan] || plan}</span>`;
  },
  statusBadge(status) {
    const map = { running: 'badge-running', offline: 'badge-offline', starting: 'badge-starting', stopping: 'badge-offline' };
    const labels = { running: 'Online', offline: 'Offline', starting: 'Starting...', stopping: 'Stopping' };
    return `<span class="badge ${map[status] || 'badge-offline'}"><span class="badge-dot"></span>${labels[status] || status}</span>`;
  }
};

// ── Auth Guard ────────────────────────────────────────────────
function requireAuth(adminOnly = false) {
  const token = API.token();
  const user = API.user();
  if (!token || !user) { location.href = '/pages/login.html'; return false; }
  if (adminOnly && user.role !== 'admin') { location.href = '/pages/dashboard.html'; return false; }
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('toasts')) {
    const d = document.createElement('div'); d.id = 'toasts'; document.body.appendChild(d);
  }
});
