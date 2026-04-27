'use strict';
const { keithDare } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'dare', aliases: ['truthordare', 'challenge'], category: 'games',
  description: 'Get a random dare', usage: '.dare',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    try {
      const r = await keithDare();
      const text = typeof r === 'string' ? r : r?.dare || r?.text || 'No dare found';
      await sock.sendMessage(chatId, { text: `🔥 *DARE*\n\n${text}${FOOTER}`, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: '❌ Failed to get dare. Try again!' }, { quoted: m }); }
  }
};
