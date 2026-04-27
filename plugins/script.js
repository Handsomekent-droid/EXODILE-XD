'use strict';

const fs       = require('fs');
const path     = require('path');
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

// Rotating hype lines — one picked randomly each time
const HYPE = [
  `💀 *They copy. We create. There's a difference.*`,
  `⚡ *While others sleep, EXODILE XD evolves.*`,
  `🔥 *Not just a bot. A whole different species.*`,
  `💀 *Built in the dark. Hits different in the light.*`,
  `⚡ *The code is obfuscated. The drip is not.*`,
  `🔥 *Fork it. Study it. You still won't catch up.*`,
  `💀 *Every feature was a problem we solved ourselves.*`,
  `⚡ *Streets respect the ones who build, not copy.*`,
];

function randomHype() {
  return HYPE[Math.floor(Math.random() * HYPE.length)];
}

module.exports = {
  command: 'script',
  aliases: ['repo', 'sc', 'scriptsrc', 'source', 'exodile'],
  category: 'info',
  description: '💀 EXODILE XD repo & info',
  usage: '.repo',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    const caption =
      `┏━━━━━━━━━━━━━━━━━━━━━┓\n` +
      `┃  💀 ᴇxᴏᴅɪʟᴇ xᴅ — ʀᴇᴘᴏ  ┃\n` +
      `┗━━━━━━━━━━━━━━━━━━━━━┛\n\n` +

      `${randomHype()}\n\n` +

      `▸ 👑 *ᴅᴇᴠ* \n` +
      `  Dev Prime Killer Nova Kent\n\n` +

      `▸ 🔖 *ᴠᴇʀsɪᴏɴ*\n` +
      `  ${settings.version || 'v2.0.0'}\n\n` +

      `▸ 💻 *ɢɪᴛʜᴜʙ*\n` +
      `  github.com/Handsomekent-droid/EXODILE-XD\n\n` +

      `▸ 📢 *ᴄʜᴀɴɴᴇʟs*\n` +
      `  📱 wa.me/254784747151\n` +
      `  📣 t.me/exodileepicxd\n\n` +

      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *ꜰᴀsᴛ  •  sᴇᴄᴜʀᴇ  •  ᴅᴇᴀᴅʟʏ*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

      `🌐 *Star the repo. Join the movement.*\n` +
      `> 💀 ᴇxᴏᴅɪʟᴇ-xᴅ // ᴘʀɪᴍᴇ ᴋᴇɴᴛ`;

    const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
    try {
      const buf = fs.readFileSync(imgPath);
      await sock.sendMessage(chatId, { image: buf, caption, ...ci }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: caption, ...ci }, { quoted: message });
    }
  }
};
