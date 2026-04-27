'use strict';
const axios = require('axios');
const { keithBrave } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

module.exports = {
  command: 'wiki',
  aliases: ['wikipedia', 'wikisearch'],
  category: 'search',
  description: 'Search Wikipedia for a topic',
  usage: '.wiki <query>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    const query = args.join(' ').trim();

    if (!query) {
      return sock.sendMessage(chatId, { text: '📖 Usage: .wiki <topic>\nExample: .wiki Nigeria' }, { quoted: message });
    }

    try {
      const res = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`,
        { headers: { 'User-Agent': 'EXODILE-XD/2.0' }, timeout: 12000 }
      );
      const d = res.data;
      if (!d?.extract) throw new Error('no extract');

      const text =
        `📖 *Wikipedia: ${d.title}*\n\n` +
        `${d.extract.slice(0, 900)}${d.extract.length > 900 ? '...' : ''}\n\n` +
        `🔗 ${d.content_urls?.desktop?.page || ''}` +
        FOOTER;

      if (d.thumbnail?.source) {
        await sock.sendMessage(chatId, { image: { url: d.thumbnail.source }, caption: text, ...ci }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
      }
    } catch {
      // Fallback: Keith Brave search
      try {
        const results = await keithBrave(query);
        const items = Array.isArray(results) ? results : [];
        if (!items.length) throw new Error('no results');
        const text = `🔍 *Search: ${query}*\n\n` +
          items.slice(0, 4).map((r, i) => `${i+1}. *${r.title||r.name||''}*\n${(r.description||r.snippet||'').slice(0,120)}\n🔗 ${r.url||r.link||''}`).join('\n\n') +
          FOOTER;
        await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
      } catch {
        await sock.sendMessage(chatId, { text: '❌ No results found. Try a different query.' }, { quoted: message });
      }
    }
  }
};
