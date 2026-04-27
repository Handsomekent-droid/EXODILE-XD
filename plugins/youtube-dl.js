'use strict';
/**
 * YouTube download commands — .ytmp3 / .ytmp4
 * API multi-fallback + yt-dlp fallback
 */
const { ytmp3, ytmp4, ytSearch } = require('../lib/downloader');
const { ytdlpDownload }          = require('../lib/ytdlp-helper');
const { getChannelInfo }         = require('../lib/messageConfig');
const axios                      = require('axios');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

const isYtUrl = str => /youtube\.com|youtu\.be/i.test(str);

module.exports = [
  // ── .ytmp3 ─────────────────────────────────────────────────
  {
    command: 'ytmp3', aliases: ['song', 'music', 'mp3', 'play'],
    category: 'download', description: '🎵 Download YouTube audio (MP3)', usage: '.ytmp3 <URL or song name>',

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const ci     = getChannelInfo();
      let input    = args.join(' ').trim();

      if (!input)
        return sock.sendMessage(chatId, { text: dlBox('🎵 𝗬𝗧 𝗔𝗨𝗗𝗜𝗢', ['💀 Usage: .ytmp3 <URL or song name>', '⚡ Example: .ytmp3 Blinding Lights', '🔗 Or paste a YouTube URL']), ...ci }, { quoted: m });

      await sock.sendMessage(chatId, { text: dlBox('⬇️ 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚...', [`🎵 ${input.slice(0, 50)}`, '⏳ Fetching audio...']), ...ci }, { quoted: m });

      // resolve song name → URL if needed
      let url = input;
      if (!isYtUrl(input)) {
        try {
          const found = await ytSearch(input);
          if (found?.url) { url = found.url; input = found.title || input; }
          else { url = `ytsearch1:${input}`; }
        } catch { url = `ytsearch1:${input}`; }
      }

      const cap = dlBox('✅ 𝗬𝗧 𝗔𝗨𝗗𝗜𝗢 𝗥𝗘𝗔𝗗𝗬', [`🎵 ${input.slice(0, 45)}`, '🔥 Enjoy!']);

      // 1. API (only for real YouTube URLs)
      if (isYtUrl(url)) {
        try {
          const audioUrl = await ytmp3(url);
          await sock.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${input.replace(/[^\w ]/g, '').slice(0, 50)}.mp3`, ptt: false, ...ci }, { quoted: m });
          return await sock.sendMessage(chatId, { text: cap, ...ci }, { quoted: m });
        } catch {}
      }

      // 2. yt-dlp fallback
      try {
        const ok = await ytdlpDownload(sock, chatId, [url], 'audio', m, ci, cap);
        if (ok) return;
      } catch {}

      await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not download audio', '💡 Try a direct YouTube URL', '🔗 youtube.com/watch?v=...']), ...ci }, { quoted: m });
    }
  },

  // ── .ytmp4 ─────────────────────────────────────────────────
  {
    command: 'ytmp4', aliases: ['video', 'ytvideo', 'mp4', 'youtube'],
    category: 'download', description: '🎥 Download YouTube video (MP4)', usage: '.ytmp4 <URL or title>',

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const ci     = getChannelInfo();
      let input    = args.join(' ').trim();

      if (!input)
        return sock.sendMessage(chatId, { text: dlBox('🎥 𝗬𝗧 𝗩𝗜𝗗𝗘𝗢', ['💀 Usage: .ytmp4 <URL or video title>', '⚡ Example: .ytmp4 Rick Astley Never Gonna', '🔗 Or paste a YouTube URL']), ...ci }, { quoted: m });

      await sock.sendMessage(chatId, { text: dlBox('⬇️ 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚...', [`🎥 ${input.slice(0, 50)}`, '⏳ Fetching video (720p max)...']), ...ci }, { quoted: m });

      let url = input;
      if (!isYtUrl(input)) {
        try {
          const found = await ytSearch(input);
          if (found?.url) { url = found.url; input = found.title || input; }
          else { url = `ytsearch1:${input}`; }
        } catch { url = `ytsearch1:${input}`; }
      }

      const cap = dlBox('✅ 𝗬𝗧 𝗩𝗜𝗗𝗘𝗢 𝗥𝗘𝗔𝗗𝗬', [`🎥 ${input.slice(0, 45)}`, '🔥 Enjoy!']);

      // 1. API
      if (isYtUrl(url)) {
        try {
          const vidUrl = await ytmp4(url);
          return await sock.sendMessage(chatId, { video: { url: vidUrl }, mimetype: 'video/mp4', caption: cap, ...ci }, { quoted: m });
        } catch {}
      }

      // 2. yt-dlp fallback
      try {
        const ok = await ytdlpDownload(sock, chatId, [url], 'video', m, ci, cap);
        if (ok) return;
      } catch {}

      await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not download video', '💡 Try a direct YouTube URL', '🔗 youtube.com/watch?v=...']), ...ci }, { quoted: m });
    }
  },
];
