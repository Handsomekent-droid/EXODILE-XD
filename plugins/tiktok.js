'use strict';
const { tiktok: fetchTT }      = require('../lib/downloader');
const { keithTikTok }          = require('../lib/keithApi');
const { ytdlpDownload }        = require('../lib/ytdlp-helper');
const { getChannelInfo }       = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

module.exports = {
  command: 'tiktok', aliases: ['tt', 'ttdl', 'tiktokdl'],
  category: 'download', description: '🎵 Download TikTok (no watermark)', usage: '.tiktok <URL>',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const url    = args.join(' ').trim();

    if (!url || !url.match(/tiktok\.com|vm\.tiktok|vt\.tiktok/i))
      return sock.sendMessage(chatId, { text: dlBox('🎵 𝗧𝗜𝗞𝗧𝗢𝗞 𝗗𝗟', ['💀 Usage: .tiktok <TikTok URL>', '⚡ Example: .tiktok https://vm.tiktok.com/xxx']), ...ci }, { quoted: m });

    await sock.sendMessage(chatId, { text: dlBox('⬇️ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚...', ['🎵 Fetching TikTok...', '⏳ No watermark processing...']), ...ci }, { quoted: m });

    // 1. Keith API (primary)
    try {
      const kt = await keithTikTok(url);
      const videoUrl = kt?.video || (typeof kt === 'string' ? kt : null);
      if (videoUrl) {
        return await sock.sendMessage(chatId, {
          video: { url: videoUrl }, mimetype: 'video/mp4',
          caption: dlBox('✅ 𝗧𝗜𝗞𝗧𝗢𝗞 𝗥𝗘𝗔𝗗𝗬', ['🎵 No watermark!', '🔥 Enjoy!']), ...ci
        }, { quoted: m });
      }
    } catch {}

    // 2. Downloader API fallback
    try {
      const dlUrl = await fetchTT(url);
      return await sock.sendMessage(chatId, {
        video: { url: dlUrl }, mimetype: 'video/mp4',
        caption: dlBox('✅ 𝗧𝗜𝗞𝗧𝗢𝗞 𝗥𝗘𝗔𝗗𝗬', ['🎵 No watermark!', '🔥 Enjoy!']), ...ci
      }, { quoted: m });
    } catch {}

    // 3. yt-dlp fallback
    try {
      const ok = await ytdlpDownload(sock, chatId, [url], 'video', m, ci, dlBox('✅ 𝗧𝗜𝗞𝗧𝗢𝗞 𝗥𝗘𝗔𝗗𝗬', ['🎵 Downloaded via yt-dlp', '🔥 Enjoy!']));
      if (ok) return;
    } catch {}

    await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not download TikTok', '💡 Make sure URL is public', '🔗 Try again with full URL']), ...ci }, { quoted: m });
  }
};
