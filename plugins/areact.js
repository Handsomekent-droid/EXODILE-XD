'use strict';
/**
 * ☠️ EXODILE XD — AutoReact Plugin v2
 * Auto-react to all messages with random emojis
 * Persistent state saved to file/store
 */
const fs   = require('fs');
const path = require('path');
const store = require('../lib/lightweight_store');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n\n☣️ *𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝘾𝙍𝘼𝙎𝙃𝙀𝙍 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍*';
// FIX: per-botNum config so multiple paired sessions don't share/overwrite each other
function getConfigPath(botNum) {
  return path.join(__dirname, `../data/autoreact_${botNum || 'global'}.json`);
}
const CONFIG_PATH = path.join(__dirname, '../data/autoreact.json'); // legacy fallback

const REACT_EMOJIS = [
  '💘','💝','💖','💗','💓','💞','💕','❤️',
  '🧡','💛','💚','💙','💜','🖤','🤍','♥️',
  '🔥','⚡','💀','☠️','🎯','✨','🌟','⭐',
  '😍','🤩','🥰','😎','👏','🙌','💪','🫡',
  '🎉','🎊','🎈','🎁','🏆','👑','💎','🔮',
];

// ── Config helpers ─────────────────────────────────────────────
function loadConfig(botNum) {
  const p = botNum ? getConfigPath(botNum) : CONFIG_PATH;
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    // migrate legacy global config if exists
    if (botNum && fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {}
  return { enabled: false, groupsOnly: false, lastReact: 0 };
}

function saveConfig(cfg, botNum) {
  const p = botNum ? getConfigPath(botNum) : CONFIG_PATH;
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
  } catch {}
}

function randomEmoji() {
  return REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
}

// Dedup set — prevents double-reacting same message ID
const _aredIds = new Set();
function _trackAred(id) {
  _aredIds.add(id);
  if (_aredIds.size > 200) {
    _aredIds.delete(_aredIds.values().next().value);
  }
}

// ── Auto-react handler — called from messageHandler ────────────
async function handleAutoReact(sock, message) {
  try {
    // Load per-session config using botNum
    const botNum = (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
    const _cfg = loadConfig(botNum);
    if (!_cfg.enabled) return;
    if (!message?.message) return;
    if (message.key.fromMe) return;

    // Dedup — don't react to same message twice
    const msgId = message.key.id;
    if (!msgId || _aredIds.has(msgId)) return;

    const chatId = message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    // If groupsOnly mode, skip DMs
    if (_cfg.groupsOnly && !isGroup) return;

    // Rate limit: max 1 react per 1.5 seconds
    const now = Date.now();
    if (now - (_cfg.lastReact || 0) < 1500) return;
    _cfg.lastReact = now;
    saveConfig(_cfg, botNum);

    // Only react to text messages
    const text = message.message?.conversation ||
                 message.message?.extendedTextMessage?.text ||
                 message.message?.imageMessage?.caption ||
                 message.message?.videoMessage?.caption || '';

    if (!text) return;

    // Don't react to commands
    if (/^[.!/#$%^&*+=?<>@]/.test(text.trim())) return;

    _trackAred(msgId);

    await sock.sendMessage(chatId, {
      react: { text: randomEmoji(), key: message.key }
    });
  } catch {}
}

module.exports = {
  command: 'autoreact',
  aliases: ['areact', 'autolike', 'reactall'],
  category: 'owner',
  description: '💫 Auto-react to messages with random emojis',
  usage: '.autoreact on/off | groups',
  ownerOnly: true,
  handleAutoReact,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const botNum = (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
    const cfg    = loadConfig(botNum);

    function box(title, lines) {
      let t = `┏━━「 ${title} 」━━┓\n┃\n`;
      for (const l of lines) t += `┃  ${l}\n`;
      return t + `┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER;
    }

    const sub = args[0]?.toLowerCase();

    if (sub === 'on') {
      cfg.enabled = true;
      saveConfig(cfg, botNum);
      return sock.sendMessage(chatId, {
        text: box('💫 *ᴀᴜᴛᴏ-ʀᴇᴀᴄᴛ*', [
          '✅ *Auto-react: ON*',
          '',
          '🔥 Will react to all messages!',
          `📊 Mode: ${cfg.groupsOnly ? 'Groups only' : 'All chats'}`,
          '',
          '💡 Use .autoreact groups to limit to groups',
        ]), ...ci
      }, { quoted: message });
    }

    if (sub === 'off') {
      cfg.enabled = false;
      saveConfig(cfg, botNum);
      return sock.sendMessage(chatId, {
        text: box('💫 *ᴀᴜᴛᴏ-ʀᴇᴀᴄᴛ*', [
          '❌ *Auto-react: OFF*',
          '',
          '💀 Reactions disabled.',
        ]), ...ci
      }, { quoted: message });
    }

    if (sub === 'groups') {
      cfg.groupsOnly = !cfg.groupsOnly;
      saveConfig(cfg, botNum);
      return sock.sendMessage(chatId, {
        text: box('💫 *ᴀᴜᴛᴏ-ʀᴇᴀᴄᴛ*', [
          `📊 Groups only: ${cfg.groupsOnly ? '✅ ON' : '❌ OFF'}`,
          '',
          cfg.groupsOnly ? '🔥 Only reacting in groups now' : '🔥 Reacting in all chats',
        ]), ...ci
      }, { quoted: message });
    }

    // Status
    return sock.sendMessage(chatId, {
      text: box('💫 *ᴀᴜᴛᴏ-ʀᴇᴀᴄᴛ sᴛᴀᴛᴜs*', [
        `💫 Status: ${cfg.enabled ? '✅ ON' : '❌ OFF'}`,
        `📊 Groups only: ${cfg.groupsOnly ? '✅ YES' : '❌ NO'}`,
        '',
        '📋 *Commands:*',
        '  ➽ .autoreact on',
        '  ➽ .autoreact off',
        '  ➽ .autoreact groups (toggle)',
      ]), ...ci
    }, { quoted: message });
  }
};
