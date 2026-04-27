'use strict';
/**
 * EXODILE XD — AutoStatus v6 (Fixed)
 * ✅ Per-session config — each paired bot independent
 * ✅ Handles ALL Baileys status event shapes (A–F)
 * ✅ Auto-views + optional reactions
 * ✅ De-duplicates across rapid-fire events
 * ✅ Startup contact subscription (handled in index.js)
 *
 * FIX: Added Shape F (plain key object from status.update event)
 * FIX: readMessages now called with correct status@broadcast remoteJid
 * FIX: React uses correct key structure
 */
const fs   = require('fs');
const path = require('path');
const { getChannelInfo } = require('../lib/messageConfig');

const DATA_DIR     = path.join(__dirname, '../data');
const REACT_EMOJIS = ['💚','🔥','❤️','😍','👏','⚡','💀','🌟','🎯','💎','✨','🫡','👑','🫶','🥰'];

// ── Per-session config ─────────────────────────────────────────
function cfgPath(botNum) {
  return path.join(DATA_DIR, `autostatus_${botNum || 'global'}.json`);
}
function loadCfg(botNum) {
  try {
    const p = cfgPath(botNum);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return { enabled: false, reactOn: false, lastView: 0 };
}
function saveCfg(botNum, cfg) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(cfgPath(botNum), JSON.stringify(cfg, null, 2));
  } catch {}
}
function getBotNum(sock) {
  return (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
}

// ── Key extractor — handles every known Baileys event shape ────
function extractKeys(evt) {
  const seen = new Set();
  const keys = [];

  const push = (k) => {
    if (!k?.remoteJid && !k?.participant) return;
    // Accept if it's explicitly status@broadcast or has a participant (status sender)
    const isStatusJid   = k.remoteJid === 'status@broadcast';
    const hasParticipant = !!(k.participant && k.participant !== k.remoteJid);
    if (!isStatusJid && !hasParticipant) return;
    const uid = k.id || (k.remoteJid + k.participant);
    if (!uid || seen.has(uid)) return;
    seen.add(uid);
    // Always use status@broadcast as remoteJid for readMessages
    keys.push({ ...k, remoteJid: 'status@broadcast' });
  };

  // Shape A: messages.upsert → { messages: [{key, message}], type }
  if (Array.isArray(evt?.messages)) {
    evt.messages.forEach(m => push(m?.key));
  }
  // Shape B: status.update → { statuses: [{key, status}] }
  if (Array.isArray(evt?.statuses)) {
    evt.statuses.forEach(s => push(s?.key));
  }
  // Shape C: bare array (older Baileys)
  if (Array.isArray(evt) && !evt?.messages && !evt?.statuses) {
    evt.forEach(m => { push(m?.key); if (m?.message?.key) push(m.message.key); });
  }
  // Shape D: single message with key
  if (!Array.isArray(evt) && evt?.key) {
    push(evt.key);
  }
  // Shape E: chatUpdate with type:'notify'
  if (evt?.type === 'notify' && Array.isArray(evt?.messages)) {
    evt.messages.forEach(m => { if (m?.key?.remoteJid === 'status@broadcast') push(m.key); });
  }
  // Shape F: plain status.update — Baileys emits { id, status, participant/from }
  // e.g. { id: 'XXXX', status: 'played', participant: '2547xxx@s.whatsapp.net' }
  if (!Array.isArray(evt) && !evt?.key && !evt?.messages && !evt?.statuses) {
    if (evt?.id && (evt?.participant || evt?.from)) {
      const fakeKey = {
        remoteJid:   'status@broadcast',
        id:           evt.id,
        participant:  evt.participant || evt.from,
        fromMe:       false,
      };
      push(fakeKey);
    }
  }

  return keys;
}

// ── In-memory dedup set (per bot) ──────────────────────────────
const _viewedIds = new Map();
function getViewedSet(botNum) {
  if (!_viewedIds.has(botNum)) _viewedIds.set(botNum, new Set());
  return _viewedIds.get(botNum);
}

// ── Main handler ───────────────────────────────────────────────
async function handleStatusUpdate(sock, evt) {
  try {
    const botNum = getBotNum(sock);
    const cfg    = loadCfg(botNum);
    if (!cfg.enabled) return;

    const allKeys = extractKeys(evt);
    if (!allKeys.length) return;

    // Dedup
    const viewed = getViewedSet(botNum);
    const keys   = allKeys.filter(k => k.id && !viewed.has(`${botNum}:${k.id}`));
    if (!keys.length) return;

    keys.forEach(k => {
      viewed.add(`${botNum}:${k.id}`);
    });
    // Trim to avoid memory leak
    if (viewed.size > 1000) {
      const oldest = [...viewed].slice(0, viewed.size - 800);
      oldest.forEach(id => viewed.delete(id));
    }

    // Natural delay
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

    // View all keys in one batch
    try { await sock.readMessages(keys); } catch {}

    // React if enabled
    if (cfg.reactOn) {
      for (const key of keys) {
        try {
          await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
          const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
          await sock.sendMessage('status@broadcast', { react: { key, text: emoji } });
        } catch {}
      }
    }
  } catch {}
}

// ── Command ────────────────────────────────────────────────────
module.exports = {
  command: 'autostatus',
  aliases: ['autoview', 'statusview', 'viewstatus', 'autoviewstatus'],
  category: 'owner',
  description: '👁️ Auto view & react to statuses',
  usage: '.autostatus on/off | .autostatus react on/off',
  ownerOnly: true,
  handleStatusUpdate,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const botNum = getBotNum(sock);
    const cfg    = loadCfg(botNum);
    const sub    = args[0]?.toLowerCase();
    const sub2   = args[1]?.toLowerCase();

    const BOX = (body) =>
      `╔══════════════════════════════╗\n` +
      `   👁️ ᴀᴜᴛᴏ ꜱᴛᴀᴛᴜꜱ ꜱᴇᴛᴛɪɴɢꜱ\n` +
      `╚══════════════════════════════╝\n\n` +
      body + `\n\n` +
      `> Exodile XD | Dev Prime Killer Nova Kent`;

    const STATUS = () =>
      `┃ 👁️ ᴠɪᴇᴡ   : ${cfg.enabled  ? '✅ ON' : '❌ OFF'}\n` +
      `┃ 💚 ʀᴇᴀᴄᴛ  : ${cfg.reactOn  ? '✅ ON' : '❌ OFF'}\n` +
      `┃ ʙᴏᴛ ɴᴜᴍ  : ${botNum}`;

    if (sub === 'on' || sub === 'off') {
      cfg.enabled = sub === 'on';
      saveCfg(botNum, cfg);
      return sock.sendMessage(chatId, {
        text: BOX(STATUS() + `\n\n${cfg.enabled ? '🔥 Now auto-viewing all statuses!' : '💀 Disabled.'}`)
      , ...ci }, { quoted: message });
    }

    if (sub === 'react' && (sub2 === 'on' || sub2 === 'off')) {
      cfg.reactOn = sub2 === 'on';
      saveCfg(botNum, cfg);
      return sock.sendMessage(chatId, {
        text: BOX(STATUS() + `\n\n${cfg.reactOn ? '🔥 Now reacting to statuses!' : '💀 Reactions off.'}`)
      , ...ci }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
      text: BOX(
        STATUS() + `\n\n` +
        `┃ ᴜꜱᴀɢᴇ:\n` +
        `┃  .autostatus on        — enable\n` +
        `┃  .autostatus off       — disable\n` +
        `┃  .autostatus react on  — also react\n` +
        `┃  .autostatus react off — stop reacting`
      ), ...ci
    }, { quoted: message });
  }
};
