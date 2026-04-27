'use strict';
const { keithQuote } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'quote', aliases: ['quotes', 'quotetext'], category: 'fun',
  description: 'Get a random quote', usage: '.quote',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    try {
      const r = await keithQuote();
      const text = typeof r === 'string' ? r : r?.quote || r?.text || 'No quote found';
      await sock.sendMessage(chatId, { text: `💬 *QUOTE*\n\n_"${text}"_${FOOTER}`, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: '❌ Could not get quote. Try again!' }, { quoted: m }); }
  }
};
