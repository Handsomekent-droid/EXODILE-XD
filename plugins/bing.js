'use strict';
const { keithBing } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'bing', aliases: ['bingsearch'], category: 'search',
  description: 'Search something on Bing', usage: '.bing <query>',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    const q = args.join(' ').trim();
    if (!q) return sock.sendMessage(chatId, { text: '🔍 Usage: .bing <query>' }, { quoted: m });
    try {
      let results = await keithBing(q);
      // Keith bing returns array of results
      if (!results || !Array.isArray(results) || !results.length) {
        // fallback
        const r = await axios.get(`https://api.giftedtech.my.id/api/search/bing?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 12000 });
        results = r.data?.result || r.data?.data || [];
      }
      if (!results?.length) return sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: m });
      const text = `🔍 *Bing Search: ${q}*\n\n` +
        results.slice(0, 5).map((r, i) => {
          const title = r.title || r.name || '';
          const desc = (r.description || r.snippet || r.desc || '').slice(0, 100);
          const url = r.url || r.link || '';
          return `「 ${i+1} 」 *${title}*\n${desc}\n🔗 ${url}`;
        }).join('\n\n') + FOOTER;
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: '❌ Bing search failed. Try again!' }, { quoted: m }); }
  }
};
