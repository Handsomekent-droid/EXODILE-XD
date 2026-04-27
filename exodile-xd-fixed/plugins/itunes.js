const fetch = require('node-fetch');

module.exports = {
  command: 'itunes',
  aliases: ['itunessong', 'itunesmusic', 'track'],
  category: 'info',
  description: 'Get detailed information about a song from iTunes',
  usage: '.itunes <song name>',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      await sock.sendMessage(chatId, {
        text: '*ᴘʟᴇᴀsᴇ provide a song name.*\nExample: `.itunes Blinding Lights`',
        quoted: message
      });
      return;
    }
    try {
      const url = `https://api.popcat.xyz/itunes?q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) throw `API request ꜰᴀɪʟᴇᴅ with status ${res.status}`;
      const json = await res.json();
      const songInfo = `
🎵 *${json.name || 'N/A'}*
👤 *Artist:* ${json.artist || 'N/A'}
💿 *Album:* ${json.album || 'N/A'}
📅 *Release Date:* ${json.release_date || 'N/A'}
💰 *Price:* ${json.price || 'N/A'}
⏱️ *Length:* ${json.length || 'N/A'}
🎼 *Genre:* ${json.genre || 'N/A'}
🔗 *URL:* ${json.url || 'N/A'}
      `.trim();
      if (json.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: json.thumbnail },
          caption: songInfo,
          quoted: message
        });
      } else {
        await sock.sendMessage(chatId, { text: songInfo, quoted: message });
      }
    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, {
        text: '❌ An ᴇʀʀᴏʀ occurred while fetching the song info. ᴘʟᴇᴀsᴇ try again later.',
        quoted: message
      });
    }
  }
};
