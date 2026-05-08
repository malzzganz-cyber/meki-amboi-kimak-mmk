# 🚀 Malzz Hosting — Premium Pterodactyl Panel

Platform management Pterodactyl modern. Deploy ke **Vercel**, database di **GitHub**, login auto-detect admin vs user.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔐 Auto-detect Login | Satu form login, admin → panel admin, user → dashboard user |
| 👑 Admin Panel | Kelola semua server, buat/edit/hapus user, activity log lengkap |
| 🖥️ User Dashboard | Buat server sendiri, lihat server sendiri, monitoring |
| 🗄️ GitHub Database | Data user/server/log tersimpan di repo GitHub (zero cost) |
| 🌐 Vercel Ready | Deploy backend + frontend ke Vercel tanpa konfigurasi extra |
| 💎 Plan System | Free (CPU max 400%) vs Premium (CPU 0 = unlimited) |
| 📊 Realtime Status | Status server langsung dari Pterodactyl API |

---

## 📁 Struktur File

```
malzz-panel/
├── api/                    # Backend (Vercel Serverless Functions)
│   ├── auth.js             # Login endpoint — auto detect admin/user
│   ├── servers.js          # GET & POST servers
│   ├── servers/[id].js     # DELETE server
│   ├── users.js            # GET & POST users (admin only)
│   ├── users/[id].js       # PATCH & DELETE user (admin only)
│   ├── dashboard.js        # Dashboard stats & data
│   ├── activity.js         # Activity logs
│   ├── db.js               # GitHub database helper
│   ├── ptero.js            # Pterodactyl API service
│   └── middleware.js       # JWT auth middleware
├── public/
│   ├── css/main.css        # Global styles (glassmorphism dark)
│   ├── js/api.js           # Frontend API client + utilities
│   ├── pages/
│   │   ├── login.html      # Login page (animated)
│   │   ├── dashboard.html  # User dashboard
│   │   └── admin.html      # Admin panel
│   └── index.html          # Landing page
├── config.js               # ⚙️ EDIT INI — admin credentials & defaults
├── vercel.json             # Vercel routing config
├── .env.example            # Template environment variables
└── README.md
```

---

## 🚀 Deploy ke Vercel

### 1. Fork / Upload ke GitHub

Upload semua file ke GitHub repo baru (bisa private).

### 2. Buat GitHub DB Repo

Buat repo **baru terpisah** untuk database (misal: `malzz-db`). Bisa private.

### 3. Edit `config.js`

```js
admins: [
  {
    username: "namaadminlo",       // username login
    email: "admin@domain.com",     // email alternatif login
    password: "passwordkuat123",   // password
    displayName: "Nama Admin",
    avatar: "A"
  }
],

pterodactyl: {
  domain: "https://panel.yourdomain.com",  // domain panel ptero kamu
  appKey: "ptla_xxx...",                   // Application API key
  clientKey: "ptlc_xxx...",               // Client API key
  nodeId: 1,
  nestId: 1,
  eggId: 15,
  locationId: 1,
  allocationId: 1
}
```

### 4. Connect ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Tambahkan Environment Variables:

| Key | Value |
|---|---|
| `PTERO_DOMAIN` | `https://panel.yourdomain.com` |
| `PTERO_APP_KEY` | `ptla_xxx...` |
| `PTERO_CLIENT_KEY` | `ptlc_xxx...` |
| `PTERO_NODE_ID` | `1` |
| `PTERO_NEST_ID` | `1` |
| `PTERO_EGG_ID` | `15` |
| `PTERO_LOCATION_ID` | `1` |
| `PTERO_ALLOC_ID` | `1` |
| `GH_OWNER` | Username GitHub kamu |
| `GH_REPO` | Nama repo DB (misal: `malzz-db`) |
| `GH_BRANCH` | `main` |
| `GH_TOKEN` | GitHub Personal Access Token |
| `JWT_SECRET` | String random panjang |

4. Deploy → Done! 🎉

---

## 🔑 Cara Login

### Admin
- Username: sesuai `config.js` → masuk ke `/pages/admin.html`
- Email: sesuai `config.js` → masuk ke `/pages/admin.html`

### User Biasa
- Harus dibuat dulu oleh admin lewat Admin Panel → "Kelola User" → "Buat User Baru"
- Login dengan username/email yang dibuat admin
- Masuk ke `/pages/dashboard.html`

---

## 💎 Plan System

| | Free | Premium |
|---|---|---|
| CPU | Max 400% (4 core) | 0 = Unlimited |
| RAM | Max 4096 MB | Unlimited |
| Server | Max 1 | Unlimited |
| Admin Panel | ❌ | ❌ (hanya admin config) |
| Beli premium | — | via [@malzznih](https://t.me/malzznih) |

Admin set plan user lewat Admin Panel → Edit User → ubah plan ke `premium`.

---

## 🛡️ Keamanan

- JWT token untuk semua request API
- Admin credentials di `config.js` (tidak exposed ke client)
- Pterodactyl API key hanya di server-side
- GitHub token untuk DB hanya di env vars
- User tidak pernah lihat domain/API Pterodactyl

---

## 🐛 Troubleshooting

**Login gagal**
- Cek username/password di `config.js`
- Pastikan JWT_SECRET sudah di-set

**Server gagal dibuat**
- Cek PTERO_DOMAIN, PTERO_APP_KEY di env vars
- Pastikan PTERO_ALLOC_ID adalah allocation yang kosong
- Cek PTERO_EGG_ID sesuai game yang kamu pakai

**GitHub DB error**
- GH_TOKEN harus punya akses `repo` (full control)
- GH_REPO harus sudah dibuat di GitHub
- GH_OWNER adalah username GitHub, bukan email

---

## 📞 Support

Telegram: [@malzznih](https://t.me/malzznih)
