const axios = require('axios');

module.exports = {
  command: 'string',
  aliases: ['textinfo', 'textstats'],
  category: 'info',
  description: 'Get detailed info about a text string',
  usage: '.string <text>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const textInput = args?.join(' ')?.trim();

    if (!textInput) {
      return await sock.sendMessage(chatId, { text: '*Provide some text to analyze.*\nExample: .string What is AI' }, { quoted: message });
    }

    try {
      const apiUrl = `https://discardapi.dpdns.org/api/tools/string?apikey=guru&text=${encodeURIComponent(textInput)}`;
      const { data } = await axios.get(apiUrl, { timeout: 10000 });

      if (!data?.status) {
        return await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to analyze text.' }, { quoted: message });
      }
      
      const reply = 
        `📝 *Text Analysis*\n\n` +
        `✏️ Text: ${textInput}\n` +
        `🔠 Letters: ${data.letters}\n` +
        `🔢 Characters (including spaces): ${data.length}\n` +
        `📄 Words: ${data.words}\n\n` +
        `💡 Tip: Keep your text concise for better readability!`;

      await sock.sendMessage(chatId, { text: reply }, { quoted: message });

    } catch (error) {
      console.error(error);

      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(chatId, { text: '❌ Request timed out. ᴘʟᴇᴀsᴇ try again later.' }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to fetch text information.' }, { quoted: message });
      }
    }
  }
};
