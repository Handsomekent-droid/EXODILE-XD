'use strict';
const { keithYTSearch } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

module.exports = {
  command: 'ytsearch',
  aliases: ['yts', 'playlist', 'playlista'],
  category: 'music',
  description: 'Search YouTube for videos',
  usage: '.yts <query>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    const query = args.join(' ').trim();

    if (!query) {
      return sock.sendMessage(chatId, { text: '🔍 Usage: .yts <song or video name>' }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: `🔍 Searching YouTube for: *${query}*...`, ...ci }, { quoted: message });

    try {
      let videos = [];

      // Keith API primary
      const keithResult = await keithYTSearch(query);
      if (Array.isArray(keithResult) && keithResult.length) {
        videos = keithResult.slice(0, 8).map(v => ({
          title: v.title || v.name || 'Unknown',
          duration: v.duration?.timestamp || v.timestamp || v.duration || '?',
          views: v.views ? String(v.views) : '?',
          url: v.url || v.link || '',
          image: v.thumbnail?.url || v.thumbnail || v.image || ''
        }));
      }

      // Fallback: yt-search npm
      if (!videos.length) {
        try {
          const yts = require('yt-search');
          const r = await yts(query);
          videos = (r.videos || []).slice(0, 8).map(v => ({
            title: v.title,
            duration: v.timestamp,
            views: String(v.views),
            url: v.url,
            image: v.image || ''
          }));
        } catch {}
      }

      if (!videos.length) {
        return sock.sendMessage(chatId, { text: '❌ No results found for that query.' }, { quoted: message });
      }

      let text = `🎵 *YouTube Search: ${query}*\n\n`;
      videos.forEach((v, i) => {
        text += `*${i + 1}. ${v.title}*\n`;
        text += `⌚ ${v.duration}  👀 ${v.views}\n`;
        text += `🔗 ${v.url}\n`;
        text += `─────────────────\n`;
      });
      text += FOOTER;

      const thumb = videos[0]?.image;
      if (thumb && thumb.startsWith('http')) {
        await sock.sendMessage(chatId, { image: { url: thumb }, caption: text, ...ci }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
      }
    } catch (err) {
      console.error('[ytsearch]', err?.message);
      await sock.sendMessage(chatId, { text: '❌ YouTube search failed. Try again!' }, { quoted: message });
    }
  }
};
