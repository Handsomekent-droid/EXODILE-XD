'use strict';
/**
 * EXODILE XD — multi-session keepalive & stability engine
 * Supports 100+ concurrent sessions without crashing
 * Dev: Prime Killer Nova Kent
 */
const settings = require('../settings');

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY_MS          = 3000;   // 3s
const MAX_DELAY_MS           = 120000; // 2min cap

// ── per-session reconnect state ────────────────────────────────
const reconnectState = new Map(); // sessionId -> { attempts, lastAt }

function getReconnectDelay(attempts) {
  // exponential backoff with jitter, capped at 2 min
  const base = Math.min(BASE_DELAY_MS * Math.pow(2, attempts), MAX_DELAY_MS);
  const jitter = Math.floor(Math.random() * 1000);
  return base + jitter;
}

function resetReconnectState(sessionId) {
  reconnectState.set(sessionId, { attempts: 0, lastAt: Date.now() });
}

function shouldReconnect(sessionId) {
  const s = reconnectState.get(sessionId) || { attempts: 0 };
  return s.attempts < MAX_RECONNECT_ATTEMPTS;
}

function incrementAttempts(sessionId) {
  const s = reconnectState.get(sessionId) || { attempts: 0 };
  s.attempts++;
  s.lastAt = Date.now();
  reconnectState.set(sessionId, s);
  return s.attempts;
}

// ── connection event handler ───────────────────────────────────
function attachKeepAlive(sock, sessionId = 'main', onReconnect = null) {
  resetReconnectState(sessionId);

  // heartbeat presence update every 25s keeps connection alive
  let heartbeatTimer = null;
  function startHeartbeat() {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(async () => {
      try {
        await sock.sendPresenceUpdate('available');
      } catch {}
    }, 25000);
  }

  function stopHeartbeat() {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (connection === 'open') {
      resetReconnectState(sessionId);
      startHeartbeat();
      console.log(`✦ [${sessionId}] connected`);
    }

    if (connection === 'close') {
      stopHeartbeat();
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason     = lastDisconnect?.error?.message || 'unknown';

      // 401 = logged out, 403 = banned — do NOT reconnect
      if (statusCode === 401 || statusCode === 403) {
        console.log(`✦ [${sessionId}] logged out (${statusCode}) — not reconnecting`);
        return;
      }

      if (!shouldReconnect(sessionId)) {
        console.log(`✦ [${sessionId}] max reconnect attempts reached`);
        return;
      }

      const attempts = incrementAttempts(sessionId);
      const delay    = getReconnectDelay(attempts - 1);
      console.log(`✦ [${sessionId}] disconnected (${reason}) — reconnect #${attempts} in ${delay}ms`);

      setTimeout(() => {
        if (typeof onReconnect === 'function') onReconnect(sessionId);
      }, delay);
    }
  });

  // clean up stale message store entries to prevent memory bloat
  let cleanupCounter = 0;
  sock.ev.on('messages.upsert', () => {
    cleanupCounter++;
    if (cleanupCounter >= 500) {
      cleanupCounter = 0;
      if (global.gc) {
        try { global.gc(); } catch {}
      }
    }
  });

  return { stopHeartbeat };
}

// ── global crash guard ─────────────────────────────────────────
// Prevents ONE bad message from killing the whole process
process.on('uncaughtException', (err) => {
  console.error('✦ uncaughtException (caught):', err?.message || err);
  // do NOT exit — keep bot alive
});

process.on('unhandledRejection', (reason) => {
  console.error('✦ unhandledRejection (caught):', reason?.message || reason);
  // do NOT exit — keep bot alive
});

// ── memory watchdog — scales based on available RAM ──────────
setInterval(() => {
  const mbUsed = process.memoryUsage().rss / 1024 / 1024;
  // Warn at 80% of max-old-space-size (default 3072MB)
  const threshold = parseInt(process.env.MEMORY_THRESHOLD_MB || '2400');
  if (mbUsed > threshold) {
    console.warn(`✦ memory watchdog: ${mbUsed.toFixed(0)}MB — clearing caches`);
    Object.keys(require.cache).forEach(k => {
      if (!k.includes('node_modules') && !k.includes('lib/') && !k.includes('settings')) {
        try { delete require.cache[k]; } catch {}
      }
    });
    if (global.gc) try { global.gc(); } catch {}
  }
}, 60000);

// ── startKeepAlive — simple alias used by index.js ────────────
function startKeepAlive(sock, sessionId = 'main') {
  return attachKeepAlive(sock, sessionId);
}

module.exports = { attachKeepAlive, startKeepAlive, resetReconnectState, shouldReconnect };
