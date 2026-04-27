'use strict';
const { instagram: fetchIG } = require('../lib/downloader');
const { ytdlpDownload }      = require('../lib/ytdlp-helper');
const { getChannelInfo }     = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const dlBox = (title, lines) =>
  `┌─━─━〔 ${title} 〕━─━─┐\n` +
  lines.map(l => `│ ${l}`).join('\n') + '\n' +
  `└─━─━─━─━─━─━─━─━─┘` + FOOTER;

module.exports = {
  command: 'instagram', aliases: ['ig', 'igdl', 'insta', 'instadl'],
  category: 'download', description: '📸 Download Instagram posts/reels', usage: '.ig <URL>',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const url    = args.join(' ').trim();

    if (!url || !url.match(/instagram\.com|instagr\.am/i))
      return sock.sendMessage(chatId, { text: dlBox('📸 𝗜𝗚 𝗗𝗟', ['💀 Usage: .ig <Instagram URL>', '⚡ Works with: posts, reels, stories']), ...ci }, { quoted: m });

    await sock.sendMessage(chatId, { text: dlBox('🔍 𝗙𝗘𝗧𝗖𝗛𝗜𝗡𝗚...', ['📸 Downloading from Instagram...', '⏳ Please wait...']), ...ci }, { quoted: m });

    // 1. API approach
    try {
      const items = await fetchIG(url);
      let sent = 0;
      const cap = dlBox('✅ 𝗜𝗚 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗', [`📸 ${items.length} item(s) ready!`, '🔥 Enjoy!']);
      for (const item of items.slice(0, 10)) {
        if (!item?.url) continue;
        const isVid = item.type === 'video' || /\.(mp4|mov|webm)/i.test(item.url) || url.includes('/reel/') || url.includes('/tv/');
        try {
          await sock.sendMessage(chatId,
            isVid
              ? { video: { url: item.url }, mimetype: 'video/mp4', caption: sent === 0 ? cap : '', ...ci }
              : { image: { url: item.url }, caption: sent === 0 ? cap : '', ...ci },
            { quoted: m });
          sent++;
          if (sent < items.length) await new Promise(r => setTimeout(r, 800));
        } catch {}
      }
      if (sent) return;
    } catch {}

    // 2. yt-dlp fallback
    try {
      const ok = await ytdlpDownload(sock, chatId, [url], 'video', m, ci, dlBox('✅ 𝗜𝗚 𝗥𝗘𝗔𝗗𝗬', ['📸 Downloaded!', '🔥 Enjoy!']));
      if (ok) return;
    } catch {}

    await sock.sendMessage(chatId, { text: dlBox('⚠️ 𝗙𝗔𝗜𝗟𝗘𝗗', ['❌ Could not download', '💡 Post must be public', '🔗 Try again with full URL']), ...ci }, { quoted: m });
  }
};
