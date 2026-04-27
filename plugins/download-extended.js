'use strict';
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// slim response helper — no big boxes
function slim(text) { return text + FOOTER; }

async function fetchUrl(apis) {
  for (const { url, get } of apis) {
    try {
      const r = await axios.get(url, { timeout: 20000, headers: { 'User-Agent': UA } });
      const v = get(r.data);
      if (v && typeof v === 'string' && v.startsWith('http')) return v;
    } catch {}
  }
  return null;
}

module.exports = [

  { command: 'pinterest', aliases: ['pin', 'pindl'], category: 'download', description: 'download pinterest image/video', usage: '.pinterest <URL>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const url = args[0];
      if (!url || !url.includes('pin')) return sock.sendMessage(chatId, { text: slim('◈ usage: .pinterest <pinterest URL>'), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: '◈ downloading...', ...ci }, { quoted: m });
      const enc = encodeURIComponent(url);
      const mediaUrl = await fetchUrl([
        { url: `https://api.giftedtech.my.id/api/download/pinterest?apikey=gifted&url=${enc}`, get: d => d?.result?.url || d?.result?.video || d?.result?.image },
        { url: `https://api.ryzendesu.vip/api/downloader/pinterest?url=${enc}`, get: d => d?.url || d?.data?.url },
      ]);
      if (!mediaUrl) return sock.sendMessage(chatId, { text: slim('◈ pinterest — could not download, try another link'), ...ci }, { quoted: m });
      const isVid = /\.(mp4|mov|webm)/i.test(mediaUrl);
      await sock.sendMessage(chatId, isVid
        ? { video: { url: mediaUrl }, mimetype: 'video/mp4', caption: slim('◈ pinterest ✓'), ...ci }
        : { image: { url: mediaUrl }, caption: slim('◈ pinterest ✓'), ...ci }, { quoted: m });
    }},

  // youtube moved to plugins/youtube-dl.js

  // soundcloud moved to plugins/soundcloud.js

  { command: 'apk', aliases: ['apkdl', 'downloadapk'], category: 'apks', description: 'search APK', usage: '.apk <app name>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' ');
      if (!q) return sock.sendMessage(chatId, { text: slim('◈ usage: .apk <app name>'), ...ci }, { quoted: m });
      try {
        const r = await axios.get(`https://api.giftedtech.my.id/api/search/apkpure?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 12000 });
        const d = (r.data?.result || r.data?.data || [])[0];
        if (!d) throw new Error('not found');
        await sock.sendMessage(chatId, {
          text: `◈ *${d.name || d.title || q}*\nversion: ${d.version || 'N/A'} · size: ${d.size || 'N/A'} · rating: ${d.rating || 'N/A'}\n${d.link || d.url || 'apkpure.com'}` + FOOTER,
          ...ci
        }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, { text: slim(`◈ apk not found\nhttps://apkpure.com/search?q=${encodeURIComponent(q)}`), ...ci }, { quoted: m });
      }
    }},

  { command: 'wallpaper', aliases: ['wall', 'hdwall', 'wallpapers'], category: 'images', description: 'get HD wallpaper', usage: '.wallpaper <topic>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' ') || 'nature';
      try {
        const r = await axios.get(`https://api.giftedtech.my.id/api/search/wallpaper?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 12000 });
        const items = r.data?.result || r.data?.data || [];
        const img = items[Math.floor(Math.random() * Math.min(items.length, 5))];
        const url = img?.url || img?.src || img?.image || img?.link;
        if (!url) throw new Error('no image');
        await sock.sendMessage(chatId, { image: { url }, caption: `◈ wallpaper — ${q}` + FOOTER, ...ci }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, { text: slim('◈ no wallpaper found — try another topic'), ...ci }, { quoted: m });
      }
    }},

  { command: 'gif', aliases: ['gifsearch', 'getgif'], category: 'images', description: 'search & send GIF', usage: '.gif <topic>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' ') || 'funny';
      try {
        const r = await axios.get(`https://api.giftedtech.my.id/api/search/giphy?apikey=gifted&q=${encodeURIComponent(q)}`, { timeout: 12000 });
        const items = r.data?.result || r.data?.data || [];
        const item = items[Math.floor(Math.random() * Math.min(items.length, 10))];
        const url = item?.url || item?.src || item?.gif;
        if (!url) throw new Error('no gif');
        await sock.sendMessage(chatId, { video: { url }, mimetype: 'video/mp4', gifPlayback: true, caption: `◈ ${q}` + FOOTER, ...ci }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, { text: slim('◈ gif not found'), ...ci }, { quoted: m });
      }
    }},

  { command: 'pdfdownload', aliases: ['pdf', 'getpdf'], category: 'download', description: 'download PDF from URL', usage: '.pdf <URL>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const url = args[0];
      if (!url?.startsWith('http')) return sock.sendMessage(chatId, { text: slim('◈ usage: .pdf <direct PDF URL>'), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: '◈ downloading pdf...', ...ci }, { quoted: m });
      try {
        const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
        const fname = url.split('/').pop().split('?')[0] || 'document.pdf';
        await sock.sendMessage(chatId, { document: Buffer.from(r.data), mimetype: 'application/pdf', fileName: fname, ...ci }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, { text: slim('◈ pdf download failed'), ...ci }, { quoted: m });
      }
    }},

  { command: 'webimage', aliases: ['imgfrom', 'fetchimage'], category: 'images', description: 'fetch image from URL', usage: '.webimage <URL>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const url = args[0];
      if (!url?.startsWith('http')) return sock.sendMessage(chatId, { text: slim('◈ usage: .webimage <image URL>'), ...ci }, { quoted: m });
      try {
        await sock.sendMessage(chatId, { image: { url }, caption: '◈ ✓' + FOOTER, ...ci }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, { text: slim('◈ could not load image'), ...ci }, { quoted: m });
      }
    }},

  // freetouse API music search
  { command: 'freemusic', aliases: ['freetune', 'ftmusic'], category: 'music', description: 'search free music via freetouse API', usage: '.freemusic <query>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' ');
      if (!q) return sock.sendMessage(chatId, { text: slim('◈ usage: .freemusic <song name>'), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: `◈ searching — ${q}...`, ...ci }, { quoted: m });
      try {
        // freetouse.com music search
        const r = await axios.get(`https://freetouse.com/api/music/search?q=${encodeURIComponent(q)}`, {
          timeout: 20000, headers: { 'User-Agent': UA }
        });
        const tracks = r.data?.tracks || r.data?.results || r.data?.data || [];
        if (!tracks.length) throw new Error('no results');
        const track = tracks[0];
        const dlUrl = track?.url || track?.download || track?.audio || track?.mp3;
        if (!dlUrl) throw new Error('no download url');
        await sock.sendMessage(chatId, {
          audio: { url: dlUrl }, mimetype: 'audio/mpeg',
          fileName: `${(track.title || q).slice(0, 50)}.mp3`, ptt: false, ...ci
        }, { quoted: m });
        await sock.sendMessage(chatId, { text: `◈ *${track.title || q}*` + FOOTER, ...ci }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(chatId, { text: slim(`◈ freemusic failed — ${e.message.slice(0, 60)}`), ...ci }, { quoted: m });
      }
    }},

];
