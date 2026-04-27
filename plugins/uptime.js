'use strict';
const { sessionStore } = require('../lib/sessionStore');
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

module.exports = {
  command: 'uptime',
  aliases: ['runtime', 'botstats'],
  category: 'general',
  description: '⏱️ Bot uptime & system stats',
  usage: '.uptime',
  isPrefixless: false,

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const cmdHandler = require('../lib/commandHandler');

    const upSec  = Math.floor(process.uptime());
    const d  = Math.floor(upSec / 86400);
    const h  = Math.floor((upSec % 86400) / 3600);
    const mn = Math.floor((upSec % 3600) / 60);
    const s  = upSec % 60;
    const uptime = [d && `${d}d`, h && `${h}h`, mn && `${mn}m`, `${s}s`].filter(Boolean).join(' ');

    const ram   = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);
    const pct   = Math.min(100, Math.round(+ram / 640 * 100));
    const bar   = '█'.repeat(Math.round(pct / 10)) + '▒'.repeat(10 - Math.round(pct / 10));
    const cmds  = cmdHandler.commands.size;
    const start = new Date(Date.now() - upSec * 1000).toLocaleString('en-GB', { timeZone: settings.timeZone });
    const store = require('../lib/lightweight_store');
    const mode  = await _ss.getBotMode().catch(() => 'public');

    const text =
      `┌─━─━〔 ⏱️ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗦𝗧𝗔𝗧𝗦 〕━─━─┐\n` +
      `│ 🟢 Status   :: ONLINE\n` +
      `│ 🕐 Uptime   :: ${uptime}\n` +
      `│ 📅 Started  :: ${start}\n` +
      `│ 💾 RAM      :: ${ram}MB  [${bar}]\n` +
      `│ 📦 Plugins  :: ${cmds} loaded\n` +
      `│ 🔌 Mode     :: ${mode.toUpperCase()}\n` +
      `│ ☢️ Node     :: ${process.version}\n` +
      `│ 🔖 Version  :: v${settings.version}\n` +
      `└─━─━─━─━─━─━─━─━─━─━─┘\n` +
      `> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ`;

    await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
  }
};
