const axios = require('axios');

module.exports = {
  command: 'coding',
  aliases: ['codingimg', 'programming', 'programmingimg'],
  category: 'images',
  description: 'Get a random programming image',
  usage: '.coding',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const res = await axios.get('https://discardapi.dpdns.org/api/img/programming?apikey=guru');

      if (!res.data || res.data.status !== true || !res.data.result) {
        return await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to fetch image.' }, { quoted: message });
      }

      const imageUrl = res.data.result;

      await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: '💻 Programming Image' }, { quoted: message });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, { text: '❌ ᴇʀʀᴏʀ while fetching image.' }, { quoted: message });
    }
  }
};
