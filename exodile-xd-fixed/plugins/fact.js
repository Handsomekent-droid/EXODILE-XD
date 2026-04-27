'use strict';
const { keithFact } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'fact', aliases: ['randomfact', 'uselessfact'], category: 'fun',
  description: 'Get a random interesting fact', usage: '.fact',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    try {
      let text = await keithFact();
      if (!text) {
        const r = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 10000 });
        text = r.data?.text;
      }
      text = typeof text === 'string' ? text : JSON.stringify(text);
      await sock.sendMessage(chatId, { text: `💡 *RANDOM FACT*\n\n${text}${FOOTER}`, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: '❌ Could not fetch a fact. Try again!' }, { quoted: m }); }
  }
};
