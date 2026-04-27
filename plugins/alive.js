'use strict';
const fs   = require('fs');
const path = require('path');
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

module.exports = {
  command: 'alive',
  aliases: ['status', 'online'],
  category: 'general',
  description: '☠️ Check bot is alive',
  usage: '.alive',
  isPrefixless: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    const start  = Date.now();
    const mem    = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);
    const ping   = Date.now() - start;

    const upSec  = Math.floor(process.uptime());
    const d  = Math.floor(upSec / 86400);
    const h  = Math.floor((upSec % 86400) / 3600);
    const mn = Math.floor((upSec % 3600) / 60);
    const s  = upSec % 60;
    const uptime = [d && `${d}d`, h && `${h}h`, mn && `${mn}m`, `${s}s`].filter(Boolean).join(' ');

    const text =
      `┌─━─━〔 ☠️ 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 〕━─━─┐\n` +
      `│ 🟢 Status  :: ONLINE ✅\n` +
      `│ ⚡ Ping    :: ${ping}ms\n` +
      `│ 💾 RAM     :: ${mem}MB\n` +
      `│ 🕐 Uptime  :: ${uptime}\n` +
      `│ 📦 Version :: v${settings.version}\n` +
      `└─━─━─━─━─━─━─━─━─━─━─┘\n` +
      `> 💀 Type *.menu* for all commands`;

    try {
      let imgBuf = null;
      const mediaFile = path.join(__dirname, '../media/media.json');
      if (fs.existsSync(mediaFile)) {
        try {
          const m   = JSON.parse(fs.readFileSync(mediaFile, 'utf8'));
          const url = m?.whatsapp?.alive_photo;
          if (url && !url.includes('REPLACE')) {
            const ax = require('axios');
            const r  = await ax.get(url, { responseType: 'arraybuffer', timeout: 8000 });
            imgBuf   = Buffer.from(r.data);
          }
        } catch {}
      }
      if (!imgBuf) {
        const local = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(local)) imgBuf = fs.readFileSync(local);
      }
      if (imgBuf) {
        await sock.sendMessage(chatId, { image: imgBuf, caption: text, ...ci }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
      }
    } catch {
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    }
  }
};
