'use strict';
/**
 * ☠️ EXODILE XD — Always Online Plugin
 * .alwaysonline on/off — keeps bot presence as "available" 24/7
 */
const fs   = require('fs');
const path = require('path');
const { getChannelInfo } = require('../lib/messageConfig');

const CONFIG_PATH = path.join(__dirname, '../data/alwaysonline.json');
const FOOTER = `\n\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ\n ɪɴ ᴀssᴏᴄɪᴀᴛɪᴏɴ ᴡɪᴛʜ ᴢᴇɴᴛʀɪx ɪɴᴄ\n ᴇxᴏᴅɪʟᴇ xᴅ ᴠᴀᴜʟᴛ ɪɴᴄ.\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`;

let _interval  = null;
let _sock      = null;

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {}
  return { enabled: false };
}

function saveConfig(cfg) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  } catch {}
}

function startPresenceLoop(sock) {
  if (_interval) clearInterval(_interval);
  _sock = sock;
  _interval = setInterval(async () => {
    try {
      const cfg = loadConfig();
      if (!cfg.enabled) { stopPresenceLoop(); return; }
      await sock.sendPresenceUpdate('available');
    } catch {}
  }, 10000); // every 10s ping available
}

function stopPresenceLoop() {
  if (_interval) { clearInterval(_interval); _interval = null; }
}

// Called on bot connect to restore state
async function initAlwaysOnline(sock) {
  try {
    const cfg = loadConfig();
    if (cfg.enabled) {
      await sock.sendPresenceUpdate('available');
      startPresenceLoop(sock);
    }
  } catch {}
}

module.exports = {
  command: 'alwaysonline',
  aliases: ['always-online', 'aonline', 'onlinemode'],
  category: 'owner',
  description: '🟢 Keep bot always visible as Online',
  usage: '.alwaysonline on/off',
  ownerOnly: true,
  initAlwaysOnline,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const cfg    = loadConfig();
    const sub    = args[0]?.toLowerCase();

    function box(title, lines) {
      let t = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      t += `┃  ${title}\n`;
      t += `┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      for (const l of lines) t += `┃  ${l}\n`;
      t += `┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
      return t + FOOTER;
    }

    if (sub === 'on') {
      cfg.enabled = true;
      saveConfig(cfg);
      await sock.sendPresenceUpdate('available');
      startPresenceLoop(sock);
      return sock.sendMessage(chatId, {
        text: box('🟢 *ᴀʟᴡᴀʏs ᴏɴʟɪɴᴇ*', [
          '✅ *Status: ACTIVATED*',
          '',
          '🌐 Bot is now always visible as Online',
          '⚡ Presence ping every 10 seconds',
          '💀 Nobody can see you offline!',
          '',
          '💡 Turn off: .alwaysonline off',
        ]), ...ci
      }, { quoted: message });
    }

    if (sub === 'off') {
      cfg.enabled = false;
      saveConfig(cfg);
      stopPresenceLoop();
      try { await sock.sendPresenceUpdate('unavailable'); } catch {}
      return sock.sendMessage(chatId, {
        text: box('🔴 *ᴀʟᴡᴀʏs ᴏɴʟɪɴᴇ*', [
          '❌ *Status: DEACTIVATED*',
          '',
          '😴 Bot presence now returns to normal',
          '💡 Turn on: .alwaysonline on',
        ]), ...ci
      }, { quoted: message });
    }

    // Status display
    return sock.sendMessage(chatId, {
      text: box('🟢 *ᴀʟᴡᴀʏs ᴏɴʟɪɴᴇ ᴍᴏᴅᴇ*', [
        `🌐 Status: ${cfg.enabled ? '✅ *ON* — Always Visible' : '❌ *OFF*'}`,
        '',
        '📋 *Commands:*',
        '  ➽ .alwaysonline on',
        '  ➽ .alwaysonline off',
        '',
        '💡 Keeps your WhatsApp shown as Online',
        '   at all times while bot is running.',
      ]), ...ci
    }, { quoted: message });
  }
};
