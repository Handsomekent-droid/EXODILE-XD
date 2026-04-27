'use strict';
const { keithImages } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'gimage', aliases: ['googleimage', 'gimg', 'imgsearch'], category: 'search',
  description: 'Search Google images', usage: '.gimage <query>',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    const q = args.join(' ').trim();
    if (!q) return sock.sendMessage(chatId, { text: '🖼️ Usage: .gimage <query>' }, { quoted: m });
    await sock.sendMessage(chatId, { text: `🔍 Searching images for: *${q}*...`, ...ci }, { quoted: m });
    try {
      // Keith images returns array of {url, width, height, thumbnail, description}
      let images = await keithImages(q);
      let urls = [];
      if (Array.isArray(images) && images.length) {
        urls = images.map(i => i?.url || i?.thumbnail).filter(u => u?.startsWith('http')).slice(0, 4);
      }
      if (!urls.length) {
        // fallback to gifted
        const r = await axios.get(`https://api.giftedtech.my.id/api/search/google/images?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 12000 });
        urls = (r.data?.result || r.data?.data || []).map(i => i?.url || i?.image).filter(u => u?.startsWith('http')).slice(0, 4);
      }
      if (!urls.length) return sock.sendMessage(chatId, { text: '❌ No images found.' }, { quoted: m });
      for (let i = 0; i < urls.length; i++) {
        try {
          await sock.sendMessage(chatId, { image: { url: urls[i] }, caption: i === 0 ? `🖼️ *${q}* (${urls.length} images)${FOOTER}` : '', ...ci }, { quoted: m });
          if (i < urls.length - 1) await new Promise(r => setTimeout(r, 600));
        } catch {}
      }
    } catch { await sock.sendMessage(chatId, { text: '❌ Image search failed. Try again!' }, { quoted: m }); }
  }
};
