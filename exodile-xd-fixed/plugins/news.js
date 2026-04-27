'use strict';
const axios = require('axios');
const { keithBrave } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

module.exports = {
  command: 'news',
  aliases: ['headlines', 'latestnews'],
  category: 'info',
  description: 'Get the latest news headlines',
  usage: '.news [topic]',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    const topic = args.join(' ').trim() || 'world';
    const enc = encodeURIComponent(topic + ' news today');

    await sock.sendMessage(chatId, { text: `📰 Fetching news for: *${topic}*...`, ...ci }, { quoted: message });

    let articles = null;

    // Keith Brave search primary
    try {
      const r = await keithBrave(topic + ' news');
      if (Array.isArray(r) && r.length) {
        articles = r.slice(0, 5).map(a => ({
          title: a.title || a.name || '',
          description: (a.description || a.snippet || '').slice(0, 120),
          url: a.url || a.link || ''
        }));
      }
    } catch {}

    // Fallback: GNews
    if (!articles?.length) {
      try {
        const r = await axios.get(`https://gnews.io/api/v4/search?q=${enc}&lang=en&max=5`, { timeout: 12000 });
        const items = r.data?.articles;
        if (items?.length) articles = items.slice(0, 5).map(a => ({ title: a.title, description: (a.description||'').slice(0,120), url: a.url }));
      } catch {}
    }

    // Fallback: BBC RSS via AllOrigins
    if (!articles?.length) {
      try {
        const r = await axios.get('https://feeds.bbci.co.uk/news/rss.xml', { timeout: 10000, responseType: 'text' });
        const matches = r.data.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>/g);
        articles = [];
        for (const m of matches) {
          articles.push({ title: m[1], description: '', url: m[2] });
          if (articles.length >= 5) break;
        }
      } catch {}
    }

    if (!articles?.length) {
      return sock.sendMessage(chatId, { text: `❌ Could not fetch news for *${topic}*. Try again later.` }, { quoted: message });
    }

    let msg = `📰 *News — ${topic.toUpperCase()}*\n\n`;
    articles.forEach((a, i) => {
      msg += `*${i + 1}. ${a.title}*\n`;
      if (a.description) msg += `${a.description}...\n`;
      if (a.url) msg += `🔗 ${a.url}\n`;
      msg += '\n';
    });
    msg += FOOTER;

    await sock.sendMessage(chatId, { text: msg.trim(), ...ci }, { quoted: message });
  }
};
