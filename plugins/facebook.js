'use strict';
const { facebook: fetchFB } = require('../lib/downloader');
const { ytdlpDownload }     = require('../lib/ytdlp-helper');
const { getChannelInfo }    = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

module.exports = {
  command: 'facebook', aliases: ['fb', 'fbdl', 'fbvideo'],
  category: 'download', description: '📘 Download Facebook videos', usage: '.fb <URL>',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const url    = args.join(' ').trim();

    if (!url || !url.match(/facebook\.com|fb\.watch|fb\.com/i))
      return sock.sendMessage(chatId, { text: dlBox('📘 𝗙𝗕 𝗗𝗟', ['💀 Usage: .fb <Facebook video URL>', '⚡ Must be a public video']), ...ci }, { quoted: m });

    await sock.sendMessage(chatId, { text: dlBox('⬇️ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚...', ['📘 Fetching Facebook video...', '⏳ Please wait...']), ...ci }, { quoted: m });

    // 1. API approach
    try {
      const dlUrl = await fetchFB(url);
      return await sock.sendMessage(chatId, {
        video: { url: dlUrl }, mimetype: 'video/mp4',
        caption: dlBox('✅ 𝗙𝗕 𝗥𝗘𝗔𝗗𝗬', ['📘 Facebook video ready!', '🔥 Enjoy!']), ...ci
      }, { quoted: m });
    } catch {}

    // 2. yt-dlp fallback
    try {
      const ok = await ytdlpDownload(sock, chatId, [url], 'video', m, ci, dlBox('✅ 𝗙𝗕 𝗥𝗘𝗔𝗗𝗬', ['📘 Downloaded!', '🔥 Enjoy!']));
      if (ok) return;
    } catch {}

    await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not download', '💡 Make sure video is public', '🔗 Try fb.watch short link']), ...ci }, { quoted: m });
  }
};
