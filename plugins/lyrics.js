'use strict';
const { keithLyrics } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
module.exports = {
  command: 'lyrics', aliases: ['lyric', 'songlyrics'], category: 'music',
  description: 'Get lyrics of a song', usage: '.lyrics <song name>',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    const q = args.join(' ').trim();
    if (!q) return sock.sendMessage(chatId, { text: '🎵 Usage: .lyrics <song name>' }, { quoted: m });
    await sock.sendMessage(chatId, { text: `🔍 Searching lyrics for: *${q}*...` }, { quoted: m });
    try {
      const r = await keithLyrics(q);
      if (!r) throw new Error('not found');
      // r may be object {title, artist, lyrics} or string
      let title = '', artist = '', lyrics = '', image = '';
      if (typeof r === 'string') {
        lyrics = r;
      } else if (r?.lyrics) {
        title = r.title || q; artist = r.artist || ''; lyrics = r.lyrics; image = r.image || r.thumbnail || '';
      } else if (Array.isArray(r) && r[0]?.lyrics) {
        title = r[0].title || q; artist = r[0].artist || ''; lyrics = r[0].lyrics; image = r[0].image || '';
      } else {
        lyrics = JSON.stringify(r).slice(0, 500);
      }
      const maxLen = 3800;
      const lyricsOut = lyrics.length > maxLen ? lyrics.slice(0, maxLen) + '\n...(truncated)' : lyrics;
      const caption = `🎵 *${title || q}*${artist ? `\n👤 *Artist:* ${artist}` : ''}\n\n📝 *Lyrics:*\n${lyricsOut}${FOOTER}`;
      if (image) {
        await sock.sendMessage(chatId, { image: { url: image }, caption, ...ci }, { quoted: m });
      } else {
        await sock.sendMessage(chatId, { text: caption, ...ci }, { quoted: m });
      }
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Lyrics not found for *${q}*. Try a more specific title!` }, { quoted: m });
    }
  }
};
