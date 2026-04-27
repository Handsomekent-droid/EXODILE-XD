'use strict';
/**
 * ☠️ EXODILE XD — Reaction System
 * Command reaction + aura emojis (only when enabled)
 */
'use strict';
const fs       = require('fs');
const path     = require('path');
const store    = require('./lightweight_store');
const settings = require('../settings');

const DATA_FILE = path.join(__dirname, '../data/userGroupData.json');

const AURA_POOL = ['✦','༆','᭄','✶','❒','❐','巛','✸','❋','✺','❖','✧','⟡','꧁','꧂','࿐'];

function pickAura() {
  return AURA_POOL[Math.floor(Math.random() * AURA_POOL.length)];
}

async function loadData() {
  try {
    const d = await store.getSetting('global', 'userGroupData');
    if (d) return d;
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {}
  return {};
}

/**
 * React to messages from creator/aura numbers — only if cmdReact is enabled
 */
async function addOwnerReaction(sock, message) {
  try {
    // Check if command reaction is enabled first
    const data = await loadData();
    if (!data?.autoReaction) return; // ← FIXED: don't fire if disabled

    const raw = message.key.participant || message.key.remoteJid || '';
    const senderId = raw.split('@')[0].split(':')[0].replace(/\D/g, '');
    const auraList = settings.auraNumbers;
    const isAura   = auraList.includes(senderId);
    const isFromMe = message.key.fromMe;

    if (isAura || isFromMe) {
      const e1 = pickAura();
      const e2 = pickAura();
      await sock.sendMessage(message.key.remoteJid, {
        react: { text: e1 + e2, key: message.key }
      });
    }
  } catch {}
}

// ── command reaction state ─────────────────────────────────────
let REACT_ENABLED = false;
// Dedup: track last 100 message IDs we already reacted to
const _reactedIds = new Set();
function _trackReacted(id) {
  _reactedIds.add(id);
  if (_reactedIds.size > 100) {
    const first = _reactedIds.values().next().value;
    _reactedIds.delete(first);
  }
}
(async () => {
  try {
    const data = await loadData();
    REACT_ENABLED = data?.autoReaction || false;
  } catch {}
})();

async function addCommandReaction(sock, message) {
  if (!REACT_ENABLED) return;
  if (!message?.key?.id) return;
  // Don't react to the same message twice
  if (_reactedIds.has(message.key.id)) return;
  _trackReacted(message.key.id);
  try {
    await sock.sendMessage(message.key.remoteJid, {
      react: { text: pickAura(), key: message.key }
    });
  } catch {}
}

async function setCommandReactState(state) {
  REACT_ENABLED = state;
  try {
    const data = await loadData();
    data.autoReaction = state;
    await store.saveSetting('global', 'userGroupData', data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

async function loadCommandReactState() {
  try { const d = await loadData(); return d?.autoReaction || false; } catch { return false; }
}

module.exports = { addCommandReaction, addOwnerReaction, setCommandReactState, loadCommandReactState };
