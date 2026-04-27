'use strict';
const { keithShorten } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'shortlink', aliases: ['shorten', 'short', 'tinyurl', 'bitly'], category: 'tools',
  description: '🔗 Shorten a long URL', usage: '.shortlink <URL>',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    let url = args[0]?.trim();
    if (!url) return sock.sendMessage(chatId, { text: `🔗 *Link Shortener*\nUsage: .shortlink <URL>` }, { quoted: m });
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { new URL(url); } catch { return sock.sendMessage(chatId, { text: '❌ Invalid URL format.' }, { quoted: m }); }

    // Try Keith's multiple shorteners
    let short = null;
    for (const type of ['tinyurl', 'dagd', 'vgd', 'tinube', 'bitly', 'random']) {
      try {
        short = await keithShorten(url, type);
        if (short) break;
      } catch {}
    }
    // Fallbacks
    if (!short) {
      const enc = encodeURIComponent(url);
      for (const tryFn of [
        () => axios.get(`https://tinyurl.com/api-create.php?url=${enc}`, { timeout: 8000 }).then(r => typeof r.data === 'string' && r.data.startsWith('http') ? r.data : null),
        () => axios.get(`https://is.gd/create.php?format=simple&url=${enc}`, { timeout: 8000 }).then(r => typeof r.data === 'string' && r.data.startsWith('http') ? r.data : null),
      ]) {
        try { short = await tryFn(); if (short) break; } catch {}
      }
    }
    if (!short) return sock.sendMessage(chatId, { text: '❌ Failed to shorten URL. Try again!' }, { quoted: m });
    await sock.sendMessage(chatId, { text: `🔗 *Link Shortened!*\n\n📎 *Original:*\n${url}\n\n✂️ *Short Link:*\n${short}${FOOTER}`, ...ci }, { quoted: m });
  }
};
