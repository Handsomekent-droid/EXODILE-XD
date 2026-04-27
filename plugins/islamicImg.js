const axios = require('axios');

module.exports = {
  command: 'islamic',
  aliases: ['islampic', 'muslimpic'],
  category: 'images',
  description: 'Get a random Islamic image',
  usage: '.islamic',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const res = await axios.get('https://discardapi.dpdns.org/api/img/islamic?apikey=guru');

      if (!res.data || res.data.status !== true || !res.data.result) {
        return await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to fetch image.' }, { quoted: message });
      }

      const imageUrl = res.data.result;

      await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: '🕌 Islamic Image' }, { quoted: message });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, { text: '❌ ᴇʀʀᴏʀ while fetching image.' }, { quoted: message });
    }
  }
};
