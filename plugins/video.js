'use strict';
/**
 * EXODILE XD — Video Downloader (Fixed)
 * Uses Keith API (primary) → multi-API fallback chain via downloader.js
 * Handles: YouTube name/URL search → download → send as video
 */
const axios = require('axios');
const { ytmp4, ytSearch } = require('../lib/downloader');
const { getChannelInfo }  = require('../lib/messageConfig');

const FOOTER = '\n┃\n┃  🔥 𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝘿𝙀𝙑 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝙉𝙊𝙑𝘼 𝙆𝙀𝙉𝙏\n┃  ☣️ 𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿 🔥💀⚡';

function box(title, lines) {
  return `☠️  ⟨ ${title} ⟩  ☠️\n\n` + lines.map(l => `┃ ${l}`).join('\n') + FOOTER;
}

const isYtUrl = s => /youtu\.?be|youtube\.com/i.test(s);

module.exports = {
  command: 'video',
  aliases: ['ytmp4', 'ytdownload', 'ytvid', 'viddl', 'viddown'],
  category: 'download',
  description: '🎬 Download YouTube video',
  usage: '.video <name or YouTube URL>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const query  = args.join(' ').trim();

    if (!query) {
      return sock.sendMessage(chatId, {
        text: box('🎬 ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ', [
          '💀 Usage: .video <name or YouTube URL>',
          '⚡ Example: .video Shape of You',
          '⚡ Example: .video https://youtu.be/xxx',
        ]), ...ci
      }, { quoted: message });
    }

    // React to show processing
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    await sock.sendMessage(chatId, {
      text: box('🔍 sᴇᴀʀᴄʜɪɴɢ...', [
        `🎬 ${query.slice(0, 50)}`,
        '⏳ Please wait...',
      ]), ...ci
    }, { quoted: message });

    try {
      let ytUrl = query;
      let title = query;
      let thumb = null;
      let duration = null;

      // Search if not a direct URL
      if (!isYtUrl(query)) {
        const found = await ytSearch(query);
        if (found?.url) {
          ytUrl     = found.url;
          title     = found.title    || query;
          thumb     = found.thumbnail || found.thumb || null;
          duration  = found.duration  || null;
        } else {
          await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
          return sock.sendMessage(chatId, {
            text: box('⚠️ ɴᴏᴛ ꜰᴏᴜɴᴅ', [
              `❌ Could not find: ${query.slice(0, 40)}`,
              '💡 Try: .video <YouTube URL directly>',
            ]), ...ci
          }, { quoted: message });
        }
      }

      const dlUrl = await ytmp4(ytUrl);
      if (!dlUrl) throw new Error('All download sources failed. Try a direct YouTube URL.');

      const safeTitle = title.replace(/[^\w\s]/g, '').trim().slice(0, 50) || 'video';

      // Try to buffer the video first for reliability
      let videoPayload;
      try {
        const resp = await axios.get(dlUrl, {
          responseType: 'arraybuffer',
          timeout: 180000,
          headers: { 'User-Agent': 'Mozilla/5.0' },
          maxContentLength: 100 * 1024 * 1024, // 100MB limit
        });
        const buf = Buffer.from(resp.data);
        videoPayload = {
          video:    buf,
          mimetype: 'video/mp4',
          fileName: `${safeTitle}.mp4`,
          caption:  box('✅ ᴠɪᴅᴇᴏ ʀᴇᴀᴅʏ', [
            `🎬 ${title.slice(0, 45)}`,
            duration ? `⏱️ ${duration}` : null,
            '🔥 Enjoy!',
          ].filter(Boolean)),
          ...ci,
        };
      } catch {
        // Fall back to URL streaming if buffer fails
        videoPayload = {
          video:    { url: dlUrl },
          mimetype: 'video/mp4',
          fileName: `${safeTitle}.mp4`,
          caption:  box('✅ ᴠɪᴅᴇᴏ ʀᴇᴀᴅʏ', [
            `🎬 ${title.slice(0, 45)}`,
            '🔥 Enjoy!',
          ]),
          ...ci,
        };
      }

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      await sock.sendMessage(chatId, videoPayload, { quoted: message });

    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: box('⚠️ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ', [
          (err.message || 'Unknown error').slice(0, 80),
          '',
          '💡 Tips:',
          '  • Try a direct YouTube URL',
          '  • Make sure video is not age-restricted',
          '  • Try again in a moment',
        ]), ...ci
      }, { quoted: message });
    }
  }
};
