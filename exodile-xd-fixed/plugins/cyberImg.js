const axios = require('axios');

module.exports = {
  command: 'cyberimg',
  aliases: ['cyber', 'cyberspace'],
  category: 'images',
  description: 'Get a random cyberspace image',
  usage: '.cyberimg',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const res = await axios.get('https://discardapi.dpdns.org/api/img/cyberspace?apikey=guru');

      if (!res.data || res.data.status !== true || !res.data.result) {
        return await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to fetch image.' }, { quoted: message });
      }

      const imageUrl = res.data.result;

      await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: '🌐 Cyberspace Image' }, { quoted: message });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, { text: '❌ ᴇʀʀᴏʀ while fetching image.' }, { quoted: message });
    }
  }
};
