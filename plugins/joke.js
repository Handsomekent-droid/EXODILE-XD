'use strict';
const { keithJoke } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'joke', aliases: ['jokes', 'funny'], category: 'fun',
  description: 'Get a random joke', usage: '.joke',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    try {
      let text = await keithJoke();
      if (!text) {
        const r = await axios.get('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' }, timeout: 10000 });
        text = r.data?.joke;
      }
      text = typeof text === 'string' ? text : JSON.stringify(text);
      await sock.sendMessage(chatId, { text: `😂 *JOKE*\n\n${text}${FOOTER}`, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: '❌ Could not fetch a joke. Try again!' }, { quoted: m }); }
  }
};
