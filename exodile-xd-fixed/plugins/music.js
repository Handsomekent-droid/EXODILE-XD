'use strict';
const axios = require('axios');
const { ytmp3, ytSearch, soundcloud } = require('../lib/downloader');
const { keith } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

function dlBox(title, lines) {
  return `┌─━─━〔 ${title} 〕━─━─┐\n` +
    lines.map(l => `│ ${l}`).join('\n') + '\n' +
    `└─━─━─━─━─━─━─━─━─┘` + FOOTER;
}

async function keithAudio(ytUrl) {
  // Keith confirmed endpoints for audio
  const enc = encodeURIComponent(ytUrl);
  for (const ep of ['/download/audio', '/download/ytmp3', '/download/dlmp3', '/download/mp3']) {
    try {
      const r = await keith(ep, { url: ytUrl }, 25000);
      if (typeof r === 'string' && r.startsWith('http')) return r;
      if (r?.url && r.url.startsWith('http')) return r.url;
    } catch {}
  }
  return null;
}

module.exports = {
  command: 'music',
  aliases: ['song', 'mp3', 'ytmp3', 'mp3dl', 'musics'],
  category: 'music',
  description: '🎵 Download music (YouTube/SoundCloud)',
  usage: '.music <song name or URL>',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const query  = args.join(' ').trim();

    if (!query) return sock.sendMessage(chatId, {
      text: dlBox('🎵 𝗠𝗨𝗦𝗜𝗖', ['Usage: .music <song name or YouTube URL>', 'Example: .music Blinding Lights']),
      ...ci
    }, { quoted: m });

    await sock.sendMessage(chatId, {
      text: dlBox('🔍 𝗦𝗘𝗔𝗥𝗖𝗛𝗜𝗡𝗚', [`🎵 ${query.slice(0, 48)}`, '⏳ Please wait...']),
      ...ci
    }, { quoted: m });

    try {
      let ytUrl = query, title = query, thumb = null;
      const isYT = /youtu\.?be|youtube\.com/i.test(query);
      const isSC = /soundcloud\.com/i.test(query);

      // ── SoundCloud path ─────────────────────────────────────
      if (isSC) {
        let dlUrl = null;
        try { dlUrl = await soundcloud(query); } catch {}
        if (!dlUrl) throw new Error('SoundCloud download failed');
        const buf = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 120000, headers: { 'User-Agent': UA } }).then(r => Buffer.from(r.data));
        await sock.sendMessage(chatId, { audio: buf, mimetype: 'audio/mpeg', fileName: 'soundcloud.mp3', ptt: false, ...ci }, { quoted: m });
        return await sock.sendMessage(chatId, { text: dlBox('✅ 𝗦𝗢𝗨𝗡𝗗𝗖𝗟𝗢𝗨𝗗 𝗥𝗘𝗔𝗗𝗬', ['🎵 Done!', '🔥 Enjoy!']), ...ci }, { quoted: m });
      }

      // ── Search if not YT URL ─────────────────────────────────
      if (!isYT) {
        try {
          const found = await ytSearch(query);
          if (found?.url) { ytUrl = found.url; title = found.title || query; thumb = found.thumbnail; }
          else { ytUrl = `ytsearch1:${query}`; }
        } catch {}
      }

      // ── Try Keith first (confirmed working from screenshots) ─
      let dlUrl = null;
      if (isYT || ytUrl.includes('youtube') || ytUrl.includes('youtu.be')) {
        dlUrl = await keithAudio(ytUrl);
      }

      // ── Fall through to downloader chain ────────────────────
      if (!dlUrl) {
        try { dlUrl = await ytmp3(ytUrl); } catch {}
      }

      if (!dlUrl) throw new Error('All download sources failed — try a direct YouTube URL');

      // ── Download buffer for reliable playback ────────────────
      let audioPayload;
      try {
        const resp = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 120000, headers: { 'User-Agent': UA } });
        audioPayload = { audio: Buffer.from(resp.data), mimetype: 'audio/mpeg', fileName: `${title.replace(/[^\w ]/g, '').slice(0, 50) || 'music'}.mp3`, ptt: false };
      } catch {
        audioPayload = { audio: { url: dlUrl }, mimetype: 'audio/mpeg', fileName: `${title.slice(0, 40)}.mp3`, ptt: false };
      }

      await sock.sendMessage(chatId, { ...audioPayload, ...ci }, { quoted: m });
      await sock.sendMessage(chatId, {
        text: dlBox('✅ 𝗠𝗨𝗦𝗜𝗖 𝗥𝗘𝗔𝗗𝗬', [`🎵 ${title.slice(0, 45)}`, '🔥 Enjoy!']),
        ...ci
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(chatId, {
        text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', [`❌ ${e.message.slice(0, 80)}`, '💡 Try: .music <YouTube URL>']),
        ...ci
      }, { quoted: m });
    }
  }
};
