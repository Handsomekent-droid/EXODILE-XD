'use strict';
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'ping',
  aliases: ['p', 'pong', 'speed'],
  category: 'general',
  description: '⚡ Check bot speed & status',
  usage: '.ping',
  isPrefixless: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const start  = Date.now();

    const upSec = Math.floor(process.uptime());
    const h  = Math.floor(upSec / 3600);
    const mn = Math.floor((upSec % 3600) / 60);
    const s  = upSec % 60;
    const uptime = (h ? `${h}h ` : '') + (mn ? `${mn}m ` : '') + `${s}s`;

    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);
    const ping = Date.now() - start;

    const text =
      `╔══〔 ☠️ *EXODILE XD* 〕══╗\n` +
      `║ ⚡ *${ping}ms*  🟢 ONLINE\n` +
      `║ ⏱ ${uptime}  💾 ${ram}MB\n` +
      `╚══════════════════════╝\n` +
      `> 💀 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧`;

    await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
  }
};
