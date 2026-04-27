const axios = require('axios');

module.exports = {
  command: 'reverse',
  aliases: ['revt', 'reversetext'],
  category: 'tools',
  description: 'Reverse any text',
  usage: '.reverse <text>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const textToReverse = args?.join(' ')?.trim();

    if (!textToReverse) {
      return await sock.sendMessage(chatId, { text: 'ᴘʟᴇᴀsᴇ provide text to reverse.\nExample: .reverse Hello World' }, { quoted: message });
    }

    try {
      const apiUrl = `https://discardapi.dpdns.org/api/tools/reverse?apikey=guru&text=${encodeURIComponent(textToReverse)}`;
      const { data } = await axios.get(apiUrl, { timeout: 10000 });

      if (!data?.status || !data.result) {
        return await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to reverse the text.' }, { quoted: message });
      }

      const reply = `*Reversed:* ${data.result}`;

      await sock.sendMessage(chatId, { text: reply }, { quoted: message });

    } catch (error) {
      console.error(error);

      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(chatId, { text: '❌ Request timed out. ᴘʟᴇᴀsᴇ try again.' }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to reverse the text.' }, { quoted: message });
      }
    }
  }
};
