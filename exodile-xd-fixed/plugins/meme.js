'use strict';
const { keithMeme } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'meme', aliases: ['memes', 'randmeme'], category: 'fun',
  description: 'Get a random meme image', usage: '.meme',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    try {
      const r = await keithMeme();
      const imgUrl = typeof r === 'string' ? r : r?.url || r?.image;
      if (!imgUrl) throw new Error('no image');
      await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: `😂 *Random Meme*${FOOTER}`, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: '❌ Could not fetch meme. Try again!', ...getChannelInfo() }, { quoted: m }); }
  }
};
