'use strict';
const { soundcloud: fetchSC } = require('../lib/downloader');
const { ytdlpDownload } = require('../lib/ytdlp-helper');
const { getChannelInfo } = require('../lib/messageConfig');
const axios = require('axios');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

module.exports = {
  command: 'soundcloud', aliases: ['sc', 'scdl', 'sandcloud'],
  category: 'download', description: '🎵 Download SoundCloud track', usage: '.soundcloud <URL or track name>',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const q      = args.join(' ').trim();

    if (!q)
      return sock.sendMessage(chatId, { text: dlBox('🎵 𝗦𝗢𝗨𝗡𝗗𝗖𝗟𝗢𝗨𝗗', ['💀 Usage: .sc <URL or track name>', '⚡ Example: .sc Porter Robinson Shelter']), ...ci }, { quoted: m });

    await sock.sendMessage(chatId, { text: dlBox('🔍 𝗦𝗘𝗔𝗥𝗖𝗛𝗜𝗡𝗚...', [`🎵 ${q.slice(0, 50)}`, '⏳ Please wait...']), ...ci }, { quoted: m });

    const cap = dlBox('✅ 𝗦𝗢𝗨𝗡𝗗𝗖𝗟𝗢𝗨𝗗 𝗥𝗘𝗔𝗗𝗬', [`🎵 ${q.slice(0, 45)}`, '🔥 Enjoy!']);

    // 1. Keith + multi-API fallback via downloader
    try {
      const dlUrl = await fetchSC(q);
      if (dlUrl) {
        const buf = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 120000 }).then(r => Buffer.from(r.data));
        await sock.sendMessage(chatId, { audio: buf, mimetype: 'audio/mpeg', fileName: `${q.slice(0,40)}.mp3`, ptt: false, ...ci }, { quoted: m });
        return await sock.sendMessage(chatId, { text: cap, ...ci }, { quoted: m });
      }
    } catch {}

    // 2. yt-dlp fallback
    const scUrl = q.includes('soundcloud.com') ? q : `scsearch1:${q}`;
    try {
      const ok = await ytdlpDownload(sock, chatId, [scUrl], 'audio', m, ci, cap);
      if (ok) return;
    } catch {}

    await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not download', '💡 Try a direct SoundCloud URL']), ...ci }, { quoted: m });
  }
};
