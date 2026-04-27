'use strict';
const { File } = require('megajs');
const path = require('path');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

function fmtBytes(b) {
  if (!b) return '0B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}
function bar(pct) {
  const f = Math.round(pct / 10);
  return '█'.repeat(f) + '░'.repeat(10 - f);
}

module.exports = {
  command: 'mega', aliases: ['megadl'],
  category: 'download', description: '🌩️ Download from MEGA', usage: '.mega <mega-url>',

  async handler(sock, message, args, context = {}) {
    const { chatId } = context;
    const ci  = getChannelInfo();
    const url = args.join(' ').trim();

    if (!url)
      return sock.sendMessage(chatId, { text: dlBox('🌩️ 𝗠𝗘𝗚𝗔 𝗗𝗟', ['💀 Usage: .mega <mega.nz URL>', '⚡ Example: .mega https://mega.nz/file/xxx#xxx']), ...ci }, { quoted: message });

    try {
      const file = File.fromURL(url);
      await file.loadAttributes();

      if (file.size >= 500 * 1024 * 1024)
        return sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗜𝗟𝗘 𝗧𝗢𝗢 𝗟𝗔𝗥𝗚𝗘', [`📦 Size: ${fmtBytes(file.size)}`, '❌ Limit: 500MB']), ...ci }, { quoted: message });

      const { key } = await sock.sendMessage(chatId, {
        text: dlBox('⬇️ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚...', [`📦 File: ${file.name}`, `💾 Size: ${fmtBytes(file.size)}`, `⏳ Progress: 0% [${bar(0)}]`]), ...ci
      }, { quoted: message });

      const stream = file.download();
      const chunks = [];
      let lastUpdate = Date.now();

      stream.on('progress', async ({ bytesLoaded, bytesTotal }) => {
        const pct = Math.floor((bytesLoaded / bytesTotal) * 100);
        if (Date.now() - lastUpdate > 3000 || pct === 100) {
          await sock.sendMessage(chatId, {
            text: dlBox('⬇️ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚...', [`📦 File: ${file.name}`, `💾 Size: ${fmtBytes(bytesTotal)}`, `⚡ Progress: ${pct}% [${bar(pct)}]`]),
            edit: key
          });
          lastUpdate = Date.now();
        }
      });

      stream.on('data', c => chunks.push(c));

      stream.on('end', async () => {
        const buf = Buffer.concat(chunks);
        const ext = path.extname(file.name).toLowerCase();
        const mimes = { '.mp4':'video/mp4','.mp3':'audio/mpeg','.pdf':'application/pdf','.zip':'application/zip','.apk':'application/vnd.android.package-archive','.png':'image/png','.jpg':'image/jpeg' };
        const mime = mimes[ext] || 'application/octet-stream';
        const cap  = dlBox('✅ 𝗠𝗘𝗚𝗔 𝗗𝗢𝗡𝗘', [`📦 ${file.name}`, `💾 ${fmtBytes(file.size)}`, '🔥 Enjoy!']);

        if (ext === '.mp4') {
          await sock.sendMessage(chatId, { video: buf, mimetype: 'video/mp4', caption: cap, ...ci }, { quoted: message });
        } else if (ext === '.mp3') {
          await sock.sendMessage(chatId, { audio: buf, mimetype: 'audio/mpeg', fileName: file.name, ptt: false, ...ci }, { quoted: message });
        } else if (['.jpg','.jpeg','.png','.webp'].includes(ext)) {
          await sock.sendMessage(chatId, { image: buf, caption: cap, ...ci }, { quoted: message });
        } else {
          await sock.sendMessage(chatId, { document: buf, fileName: file.name, mimetype: mime, caption: cap, ...ci }, { quoted: message });
        }
      });

      stream.on('error', async err => {
        await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗘𝗥𝗥𝗢𝗥', [`❌ ${err.message.slice(0, 80)}`]), ...ci }, { quoted: message });
      });

    } catch (e) {
      await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', [`❌ ${e.message.slice(0, 80)}`, '💡 Check the link is valid and public']), ...ci }, { quoted: message });
    }
  }
};
