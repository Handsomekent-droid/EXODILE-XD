'use strict';
const { keithTruth } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'truth', aliases: ['truthdare'], category: 'games',
  description: 'Get a random truth question', usage: '.truth',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    try {
      const r = await keithTruth();
      const text = typeof r === 'string' ? r : r?.question || r?.text || 'No truth found';
      await sock.sendMessage(chatId, { text: `🎯 *TRUTH*\n\n${text}${FOOTER}`, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: '❌ Failed to get truth. Try again!' }, { quoted: m }); }
  }
};
