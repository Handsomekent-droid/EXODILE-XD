'use strict';
const axios   = require('axios');
const cheerio = require('cheerio');
const path    = require('path');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

async function mediafireParse(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': UA }, timeout: 15000 });
  const $    = cheerio.load(data);
  const link = $('#downloadButton').attr('href');
  const name = $('div.dl-info > div.promo-text').text().trim() || $('.dl-btn-label').attr('title') || 'file';
  const size = $('#downloadButton').text().replace(/Download|[()]\s*/g, '').trim() || 'Unknown';
  const ext  = name.split('.').pop().toLowerCase();
  return { name, size, link, ext };
}

module.exports = {
  command: 'mediafire', aliases: ['mfire', 'mf'],
  category: 'download', description: '📁 Download from MediaFire', usage: '.mediafire <url>',

  async handler(sock, message, args, context = {}) {
    const { chatId } = context;
    const ci  = getChannelInfo();
    const url = args.join(' ').trim();

    if (!url || !url.includes('mediafire'))
      return sock.sendMessage(chatId, { text: dlBox('📁 𝗠𝗘𝗗𝗜𝗔𝗙𝗜𝗥𝗘 𝗗𝗟', ['💀 Usage: .mediafire <MediaFire URL>', '⚡ Example: .mf https://mediafire.com/file/xxx']), ...ci }, { quoted: message });

    await sock.sendMessage(chatId, { text: dlBox('🔍 𝗣𝗔𝗥𝗦𝗜𝗡𝗚...', ['📁 Reading MediaFire page...', '⏳ Please wait...']), ...ci }, { quoted: message });

    try {
      const data = await mediafireParse(url);
      if (!data?.link)
        return sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not parse page', '💡 Link may be private or removed']), ...ci }, { quoted: message });

      await sock.sendMessage(chatId, {
        text: dlBox('⬇️ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚...', [`📦 File: ${data.name}`, `💾 Size: ${data.size}`, '⏳ Downloading...'])
        , ...ci
      }, { quoted: message });

      const res = await axios({ method: 'get', url: data.link, responseType: 'arraybuffer', headers: { 'User-Agent': UA, 'Referer': url }, timeout: 120000 });
      const buf = Buffer.from(res.data);

      if (buf.length < 1000)
        return sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗘𝗥𝗥𝗢𝗥', ['❌ File is corrupt or empty', '💡 Try the link directly in browser']), ...ci }, { quoted: message });

      const mimes = { zip:'application/zip', pdf:'application/pdf', apk:'application/vnd.android.package-archive', mp4:'video/mp4', mp3:'audio/mpeg', jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png' };
      const mime  = mimes[data.ext] || 'application/octet-stream';
      const cap   = dlBox('✅ 𝗠𝗘𝗗𝗜𝗔𝗙𝗜𝗥𝗘 𝗗𝗢𝗡𝗘', [`📦 ${data.name}`, `💾 ${data.size}`, '🔥 Enjoy!']);

      if (data.ext === 'mp4') {
        await sock.sendMessage(chatId, { video: buf, mimetype: 'video/mp4', caption: cap, ...ci }, { quoted: message });
      } else if (data.ext === 'mp3') {
        await sock.sendMessage(chatId, { audio: buf, mimetype: 'audio/mpeg', fileName: data.name, ptt: false, ...ci }, { quoted: message });
      } else if (['jpg','jpeg','png','webp'].includes(data.ext)) {
        await sock.sendMessage(chatId, { image: buf, caption: cap, ...ci }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { document: buf, fileName: data.name, mimetype: mime, caption: cap, ...ci }, { quoted: message });
      }

    } catch (e) {
      await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', [`❌ ${e.message.slice(0, 80)}`, '💡 Make sure the file is public']), ...ci }, { quoted: message });
    }
  }
};
