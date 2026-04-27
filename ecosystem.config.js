/**
 * EXODILE XD — PM2 Ecosystem Config
 * Optimized for 100+ concurrent WhatsApp sessions
 *
 * Install PM2:  npm install -g pm2
 * Start:        pm2 start ecosystem.config.js
 * Monitor:      pm2 monit
 * Logs:         pm2 logs exodile
 * Restart:      pm2 restart exodile
 * Stop:         pm2 stop exodile
 */

module.exports = {
  apps: [
    {
      name: 'exodile',
      script: 'index.js',

      // ── Memory & CPU ────────────────────────────────────────
      // Each WhatsApp session uses ~80-150MB RAM
      // 100 sessions = ~10-15GB RAM minimum recommended
      // Adjust max_memory_restart based on your server RAM:
      //   512MB server  → '400M'   (max ~4 sessions)
      //   2GB server    → '1600M'  (max ~15 sessions)
      //   4GB server    → '3500M'  (max ~30 sessions)
      //   8GB server    → '7000M'  (max ~60 sessions)
      //   16GB server   → '14000M' (max ~100 sessions)
      //   32GB server   → '28000M' (max ~200 sessions)
      max_memory_restart: '3500M',

      // ── Node.js flags for large workloads ──────────────────
      node_args: [
        '--max-old-space-size=3072',   // 3GB heap (adjust to match your RAM)
        '--optimize-for-size',         // smaller footprint per session
        '--gc-interval=100',           // more frequent GC to free memory
        '--max-semi-space-size=64',    // smaller young gen = less GC pause
      ],

      // ── Process mode ───────────────────────────────────────
      // 'fork' mode — single process, best for WhatsApp bots
      // Do NOT use 'cluster' mode — Baileys sessions are stateful
      exec_mode: 'fork',
      instances: 1,

      // ── Auto-restart settings ──────────────────────────────
      autorestart: true,
      watch: false,              // never watch — causes restart loops
      restart_delay: 3000,       // wait 3s before restarting
      max_restarts: 10,          // stop trying after 10 crashes in a row
      min_uptime: '30s',         // must stay up 30s to count as stable

      // ── Logging ────────────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      merge_logs: true,

      // ── Environment variables ──────────────────────────────
      env: {
        NODE_ENV: 'production',
        UV_THREADPOOL_SIZE: '16',   // more threads for file I/O (sessions)
      },

      // ── Kill timeout ───────────────────────────────────────
      kill_timeout: 5000,   // give 5s for graceful shutdown
    },
  ],
};
