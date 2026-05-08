/ ============================================================
//  MALZZ HOSTING — CONFIG
//  Edit bagian ini sesuai kebutuhan kamu
// ============================================================

module.exports = {

  // ── ADMIN CREDENTIALS ──────────────────────────────────────
  // Tambah sebanyak yang kamu mau
  admins: [
    {
      username: "admin",
      email: "stokmalzganteng@gmail.com",
      password: "malzz123",       // ganti password kamu
      displayName: "Malzz Admin",
      avatar: "M"
    },
    // {
    //   username: "admin2",
    //   email: "admin2@malzz.hosting",
    //   password: "password2",
    //   displayName: "Admin 2",
    //   avatar: "A"
    // }
  ],

  // ── PTERODACTYL ─────────────────────────────────────────────
  // Ini punya kamu — user TIDAK perlu tahu/isi ini
  pterodactyl: {
    domain: process.env.PTERO_DOMAIN || "https://ayramlbb.id.alfamarket2.web.id",
    appKey: process.env.PTERO_APP_KEY || "ptla_CjvlIMsk81ufHeFp3KCztxllLySimy65ykIXRNVjqqQ",
    clientKey: process.env.PTERO_CLIENT_KEY || "ptlc_x95jjauvsg21Qq8dFXcI4qZOEoDJ8KmbFwHxGy0QtMK",
    // Default server config
    nodeId: parseInt(process.env.PTERO_NODE_ID) || 1,
    nestId: parseInt(process.env.PTERO_NEST_ID) || 1,
    eggId: parseInt(process.env.PTERO_EGG_ID) || 15,
    locationId: parseInt(process.env.PTERO_LOCATION_ID) || 1,
    allocationId: parseInt(process.env.PTERO_ALLOC_ID) || 1,
    dockerImage: "ghcr.io/pterodactyl/yolks:java_17",
    startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}",
    environment: {
      SERVER_JARFILE: "server.jar",
      BUILD_NUMBER: "latest"
    }
  },

  // ── PLAN LIMITS ─────────────────────────────────────────────
  plans: {
    free: {
      maxCpu: 400,      // 400% = 4 core max
      maxRam: 4096,     // 4GB RAM max
      maxDisk: 10240,   // 10GB disk max
      maxServers: 1,
      label: "Free"
    },
    premium: {
      maxCpu: 0,        // 0 = unlimited di pterodactyl
      maxRam: 0,        // 0 = unlimited
      maxDisk: 0,       // 0 = unlimited
      maxServers: 999,
      label: "Premium"
    }
  },

  // ── GITHUB DATABASE ─────────────────────────────────────────
  github: {
    owner: process.env.GH_OWNER || "malzzganz-cyber",
    repo: process.env.GH_REPO || "database-malz",
    branch: process.env.GH_BRANCH || "main",
    token: process.env.GH_TOKEN || "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"
  },

  // ── JWT ─────────────────────────────────────────────────────
  jwtSecret: process.env.JWT_SECRET || "malzz_super_secret_key_change_this_2024",
  jwtExpiry: "7d",

  // ── SITE ────────────────────────────────────────────────────
  site: {
    name: "Malzz Hosting",
    telegramAdmin: "https://t.me/malzznih",
    telegramChannel: "https://t.me/malzznih"
  }

};
