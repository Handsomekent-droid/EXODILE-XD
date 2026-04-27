'use strict';
/**
 * EXODILE XD — Play (Audio Download) Fixed
 * Keith API primary → multi-fallback via downloader.js
 */
const axios = require('axios');
const { ytmp3, ytSearch } = require('../lib/downloader');
const { getChannelInfo }  = require('../lib/messageConfig');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

function box(title, lines) {
  return '╭─「 ' + title + ' 」\n│\n' +
    lines.filter(Boolean).map(l => '│  ' + l).join('\n') +
    '\n│\n╰──────────────────────' + FOOTER;
}

const isYtUrl = s => /youtu\.?be|youtube\.com/i.test(s);

module.exports = {
  command: 'play',
  aliases: ['plays', 'playsong', 'mp3', 'song'],
  category: 'music',
  description: '🎵 Search and play song as audio',
  usage: '.play <song name or YouTube URL>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const query  = args.join(' ').trim();

    if (!query) {
      return sock.sendMessage(chatId, {
        text: box('🎵 ᴘʟᴀʏ', [
          '💀 Usage: .play <song name>',
          '⚡ Example: .play Blinding Lights',
          '⚡ Example: .play https://youtu.be/xxx',
        ]), ...ci
      }, { quoted: message });
    }

    // Show processing
    await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
    await sock.sendMessage(chatId, {
      text: box('🔍 sᴇᴀʀᴄʜɪɴɢ', [`⏳ ${query.slice(0, 48)}`]), ...ci
    }, { quoted: message });

    try {
      let ytUrl  = null;
      let title  = query;
      let thumb  = null;
      let artist = null;
      let duration = null;

      if (isYtUrl(query)) {
        ytUrl = query;
      } else {
        const found = await ytSearch(query);
        if (found?.url) {
          ytUrl    = found.url;
          title    = found.title    || query;
          thumb    = found.thumbnail || found.thumb || null;
          artist   = found.channel  || found.author || null;
          duration = found.duration  || null;
        } else {
          await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
          return sock.sendMessage(chatId, {
            text: box('⚠️ ɴᴏᴛ ꜰᴏᴜɴᴅ', [
              `❌ Could not find: ${query.slice(0, 40)}`,
              '',
              '💡 Tips:',
              `  • Try: .song ${query.slice(0, 30)}`,
              '  • Or paste a direct YouTube URL',
              '  • .song uses a different search engine',
            ]), ...ci
          }, { quoted: message });
        }
      }

      const dlUrl = await ytmp3(ytUrl);
      if (!dlUrl) throw new Error('All audio sources failed. Try a direct YouTube URL.');

      const safeTitle = title.replace(/[^\w\s]/g, '').trim().slice(0, 50) || 'audio';

      // Buffer audio for reliable delivery
      let audioPayload;
      try {
        const resp = await axios.get(dlUrl, {
          responseType: 'arraybuffer',
          timeout: 120000,
          headers: { 'User-Agent': 'Mozilla/5.0' },
          maxContentLength: 50 * 1024 * 1024, // 50MB limit
        });
        const buf = Buffer.from(resp.data);
        audioPayload = {
          audio:    buf,
          mimetype: 'audio/mpeg',
          fileName: `${safeTitle}.mp3`,
          ptt:      false,
        };
      } catch {
        // Fallback to URL streaming
        audioPayload = {
          audio:    { url: dlUrl },
          mimetype: 'audio/mpeg',
          fileName: `${safeTitle}.mp3`,
          ptt:      false,
        };
      }

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      await sock.sendMessage(chatId, { ...audioPayload, ...ci }, { quoted: message });

      // Info card
      await sock.sendMessage(chatId, {
        text: box('✅ ɴᴏᴡ ᴘʟᴀʏɪɴɢ', [
          `🎵 ${title.slice(0, 45)}`,
          artist   ? `👤 ${artist.slice(0, 35)}`   : null,
          duration ? `⏱️ ${duration}`               : null,
          ytUrl    ? `🔗 ${ytUrl.slice(0, 45)}`     : null,
          '🔥 Enjoy!',
        ]), ...ci
      }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: box('⚠️ ꜰᴀɪʟᴇᴅ', [
          (err.message || 'Unknown error').slice(0, 80),
          '',
          '💡 Tips:',
          `  • Try: .song ${query.slice(0, 30)}`,
          '  • Or paste a direct YouTube URL',
          '  • .song uses a different search engine',
          '  • Age-restricted videos will always fail',
        ]), ...ci
      }, { quoted: message });
    }
  }
};
