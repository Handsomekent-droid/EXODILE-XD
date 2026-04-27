'use strict';
/**
 * EXODILE XD — Session-Scoped Store
 * ─────────────────────────────────────────────────────────────────
 * Wraps the global lightweight_store so that EVERY setting is
 * namespaced by the paired bot's WhatsApp number.
 *
 * When bot A (254784747151) sets mode=self   → key: "254784747151:botMode"
 * When bot B (254711223344) sets mode=public → key: "254711223344:botMode"
 * They NEVER collide.
 *
 * Usage (in any plugin):
 *   const { sessionStore } = require('../lib/sessionStore');
 *   const ss = sessionStore(sock);          // or sessionStore(botNum)
 *   await ss.getBotMode();
 *   await ss.setBotMode('self');
 *   await ss.getSetting(chatId, key);
 *   await ss.saveSetting(chatId, key, val);
 *
 * 100+ sessions: each bot gets its own data island.
 * On logout: removeSession() in sessionManager wipes all keys for that bot.
 */

const store = require('./lightweight_store');
const fs    = require('fs');
const path  = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// ── Bot number extraction ──────────────────────────────────────
function botNumFromSock(sockOrNum) {
  if (typeof sockOrNum === 'string') {
    return sockOrNum.replace(/\D/g, '').split(':')[0] || 'global';
  }
  return (sockOrNum?.user?.id || '').split(':')[0].split('@')[0] || 'global';
}

// ── Per-session flat JSON store ────────────────────────────────
// data/session_<botNum>.json → { key: value, ... }
function sessionFilePath(botNum) {
  return path.join(DATA_DIR, `session_${botNum}.json`);
}

function readSessionFile(botNum) {
  try {
    const p = sessionFilePath(botNum);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return {};
}

function writeSessionFile(botNum, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(sessionFilePath(botNum), JSON.stringify(data, null, 2));
  } catch {}
}

function getVal(botNum, ns) {
  return readSessionFile(botNum)[ns] ?? null;
}

function setVal(botNum, ns, val) {
  const d = readSessionFile(botNum);
  d[ns] = val;
  writeSessionFile(botNum, d);
}

function delVal(botNum, ns) {
  const d = readSessionFile(botNum);
  delete d[ns];
  writeSessionFile(botNum, d);
}

// ── Delete entire session data file on logout ──────────────────
function clearSession(botNum) {
  try {
    const p = sessionFilePath(botNum);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
  // Also clear autostatus file
  try {
    const ap = path.join(DATA_DIR, `autostatus_${botNum}.json`);
    if (fs.existsSync(ap)) fs.unlinkSync(ap);
  } catch {}
  // Clear prefix entry
  try {
    const pp = path.join(DATA_DIR, 'prefixes_per_session.json');
    if (fs.existsSync(pp)) {
      const pdata = JSON.parse(fs.readFileSync(pp, 'utf8'));
      delete pdata[botNum];
      fs.writeFileSync(pp, JSON.stringify(pdata, null, 2));
    }
  } catch {}
}

// ── Default bot modes per session ─────────────────────────────
const DEFAULT_MODE = 'public';

// ── The session-scoped interface ───────────────────────────────
function sessionStore(sockOrNum) {
  const botNum = botNumFromSock(sockOrNum);

  return {
    botNum,

    // ── Bot mode (public / self / private) ─────────────────────
    async getBotMode() {
      const v = getVal(botNum, 'botMode');
      return v || DEFAULT_MODE;
    },

    async setBotMode(mode) {
      setVal(botNum, 'botMode', mode);
    },

    // ── Generic settings (scoped to chatId + key per bot) ──────
    async getSetting(chatId, key) {
      const ns = `${chatId}:${key}`;
      return getVal(botNum, ns);
    },

    async saveSetting(chatId, key, value) {
      const ns = `${chatId}:${key}`;
      setVal(botNum, ns, value);
    },

    async deleteSetting(chatId, key) {
      const ns = `${chatId}:${key}`;
      delVal(botNum, ns);
    },

    // ── Banned users per bot ────────────────────────────────────
    async getBanned() {
      return getVal(botNum, 'banned') || [];
    },

    async setBanned(arr) {
      setVal(botNum, 'banned', arr);
    },

    // ── Warnings per bot ────────────────────────────────────────
    async getWarnings() {
      return getVal(botNum, 'warnings') || {};
    },

    async setWarnings(obj) {
      setVal(botNum, 'warnings', obj);
    },

    // ── Passthrough to global store for things that ARE global ──
    // (message counts, group metadata, etc.)
    async incrementMessageCount(chatId, senderId) {
      return store.incrementMessageCount(chatId, senderId);
    },

    async getAllSettings(chatId) {
      // Merge session settings with global
      const sessionData = readSessionFile(botNum);
      const prefix = `${chatId}:`;
      const result = {};
      for (const [k, v] of Object.entries(sessionData)) {
        if (k.startsWith(prefix)) result[k.replace(prefix, '')] = v;
      }
      return result;
    },
  };
}

module.exports = { sessionStore, botNumFromSock, clearSession };
