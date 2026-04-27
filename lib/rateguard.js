'use strict';
/**
 * EXODILE XD — Rate Guard v2
 * Handles 100+ concurrent sessions without crashing
 * - Per-user cooldown
 * - Global semaphore (max concurrent handlers)
 * - Memory pressure check
 * - Auto-cleanup of stale cooldown entries
 */

class Semaphore {
  constructor(max) {
    this._max     = max;
    this._current = 0;
    this._queue   = [];
  }
  acquire() {
    return new Promise(resolve => {
      if (this._current < this._max) { this._current++; resolve(); }
      else this._queue.push(resolve);
    });
  }
  release() {
    this._current--;
    if (this._queue.length > 0) { this._current++; this._queue.shift()(); }
  }
  get waiting() { return this._queue.length; }
  get active()  { return this._current; }
}

// 150 concurrent handlers — enough for 100 sessions
const cmdSemaphore = new Semaphore(150);

// Per-user cooldown: 200ms between commands (prevents flood)
const userCooldowns  = new Map();
const USER_COOLDOWN  = 200;

// Per-user command burst limiter: max 30 cmds in 10s window
const burstTrackers  = new Map();
const BURST_WINDOW   = 10000;
const BURST_MAX      = 30;

function checkBurst(userId) {
  const now  = Date.now();
  const data = burstTrackers.get(userId) || { count: 0, reset: now + BURST_WINDOW };
  if (now > data.reset) { data.count = 0; data.reset = now + BURST_WINDOW; }
  data.count++;
  burstTrackers.set(userId, data);
  return data.count <= BURST_MAX;
}

function checkUserCooldown(userId) {
  const last = userCooldowns.get(userId) || 0;
  const now  = Date.now();
  if (now - last < USER_COOLDOWN) return false;
  userCooldowns.set(userId, now);
  return true;
}

// Cleanup stale entries every 2 min
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [k, v] of userCooldowns) if (v < cutoff) userCooldowns.delete(k);
  for (const [k, v] of burstTrackers) if (v.reset < cutoff) burstTrackers.delete(k);
}, 2 * 60 * 1000);

// Memory pressure guard — if RAM > 400MB, drop non-critical ops
function isMemoryOk() {
  const mb = process.memoryUsage().rss / 1024 / 1024;
  return mb < 400;
}

async function withGuard(userId, fn, { skipCooldown = false } = {}) {
  if (!skipCooldown) {
    if (!checkUserCooldown(userId)) return; // drop — too fast
    if (!checkBurst(userId)) return;        // drop — burst limit
  }
  if (cmdSemaphore.waiting > 200) return;   // overloaded — drop
  await cmdSemaphore.acquire();
  try {
    await fn();
  } catch (e) {
    // swallow — individual command errors shouldn't crash the session
    console.error('◈ cmd error:', e?.message || e);
  } finally {
    cmdSemaphore.release();
  }
}

module.exports = { withGuard, checkUserCooldown, cmdSemaphore, isMemoryOk };
