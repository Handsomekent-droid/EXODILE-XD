'use strict';
const { twitter: fetchTW } = require('../lib/downloader');
const { ytdlpDownload }    = require('../lib/ytdlp-helper');
const { getChannelInfo }   = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

module.exports = {
  command: 'twitter', aliases: ['tw', 'twdl', 'xdl', 'xvideo'],
  category: 'download', description: '🐦 Download Twitter/X videos', usage: '.twitter <URL>',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const url    = args.join(' ').trim();

    if (!url || !url.match(/twitter\.com|x\.com|t\.co/i))
      return sock.sendMessage(chatId, { text: dlBox('🐦 𝗧𝗪𝗜𝗧𝗧𝗘𝗥 𝗗𝗟', ['💀 Usage: .twitter <Twitter/X URL>', '⚡ Supports: videos, GIFs']), ...ci }, { quoted: m });

    await sock.sendMessage(chatId, { text: dlBox('⬇️ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚...', ['🐦 Fetching Twitter/X...', '⏳ Please wait...']), ...ci }, { quoted: m });

    // 1. API approach
    try {
      const dlUrl = await fetchTW(url);
      return await sock.sendMessage(chatId, {
        video: { url: dlUrl }, mimetype: 'video/mp4',
        caption: dlBox('✅ 𝗧𝗪𝗜𝗧𝗧𝗘𝗥 𝗥𝗘𝗔𝗗𝗬', ['🐦 Video ready!', '🔥 Enjoy!']), ...ci
      }, { quoted: m });
    } catch {}

    // 2. yt-dlp fallback
    try {
      const ok = await ytdlpDownload(sock, chatId, [url], 'video', m, ci, dlBox('✅ 𝗧𝗪𝗜𝗧𝗧𝗘𝗥 𝗥𝗘𝗔𝗗𝗬', ['🐦 Downloaded!', '🔥 Enjoy!']));
      if (ok) return;
    } catch {}

    await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not download', '💡 Tweet must contain a video', '🔗 Make sure link is public']), ...ci }, { quoted: m });
  }
};
