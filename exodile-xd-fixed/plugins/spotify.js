'use strict';
const { spotify: fetchSP } = require('../lib/downloader');
const { ytdlpDownload }    = require('../lib/ytdlp-helper');
const { getChannelInfo }   = require('../lib/messageConfig');
const axios                = require('axios');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

module.exports = {
  command: 'spotify', aliases: ['sp', 'spotifydl', 'spotifysong'],
  category: 'download', description: '🎧 Download Spotify song', usage: '.spotify <song name or URL>',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const query  = args.join(' ').trim();

    if (!query)
      return sock.sendMessage(chatId, { text: dlBox('🎧 𝗦𝗣𝗢𝗧𝗜𝗙𝗬 𝗗𝗟', ['💀 Usage: .spotify <song name>', '⚡ Example: .spotify Blinding Lights', '🔗 Or paste a Spotify track URL']), ...ci }, { quoted: m });

    await sock.sendMessage(chatId, { text: dlBox('🔍 𝗦𝗘𝗔𝗥𝗖𝗛𝗜𝗡𝗚...', [`🎧 ${query.slice(0, 50)}`, '⏳ Please wait...']), ...ci }, { quoted: m });

    // 1. API approach
    try {
      const { audio, title, artist, thumb } = await fetchSP(query);
      const cap = dlBox('✅ 𝗦𝗣𝗢𝗧𝗜𝗙𝗬 𝗥𝗘𝗔𝗗𝗬', [`🎧 ${(title || query).slice(0, 45)}`, `👤 ${artist || 'Unknown'}`, '🔥 Enjoy!']);
      if (thumb) { try { await sock.sendMessage(chatId, { image: { url: thumb }, caption: cap, ...ci }, { quoted: m }); } catch {} }
      await sock.sendMessage(chatId, { audio: { url: audio }, mimetype: 'audio/mpeg', fileName: `${(title || query).replace(/[^\w ]/g, '').slice(0, 50)}.mp3`, ptt: false, ...ci }, { quoted: m });
      if (!thumb) await sock.sendMessage(chatId, { text: cap, ...ci }, { quoted: m });
      return;
    } catch {}

    // 2. yt-dlp search fallback (searches YouTube for the song)
    try {
      const ok = await ytdlpDownload(sock, chatId, [`ytsearch1:${query}`], 'audio', m, ci, dlBox('✅ 𝗦𝗣𝗢𝗧𝗜𝗙𝗬 𝗥𝗘𝗔𝗗𝗬', ['🎧 Audio ready!', '🔥 Enjoy!']));
      if (ok) return;
    } catch {}

    await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not find/download', '💡 Try exact song name + artist', '🎧 Example: .spotify Shape of You Ed Sheeran']), ...ci }, { quoted: m });
  }
};
