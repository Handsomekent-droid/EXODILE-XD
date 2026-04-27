const axios = require('axios');

module.exports = {
  command: 'sfile',
  aliases: ['sfl', 'sfileapk'],
  category: 'apks',
  description: 'Search APKs/files from SFile',
  usage: '.sfile <query>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (!args.length) {
      return await sock.sendMessage(chatId, {
        text: '*ᴘʟᴇᴀsᴇ provide a search query.*\nExample: .sfile telegram'
      }, { quoted: message });
    }
    const query = args.join(' ');
    try {
      const { data } = await axios.get(`https://discardapi.dpdns.org/api/apk/search/sfile`, {
        params: {
          apikey: 'guru',
          query: query
        }
      });

      if (!data?.result?.length) {
        return await sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: message });
      }

      let menuText = '';
      data.result.forEach((item, i) => {
        menuText += `*${i + 1}.* ${item.nama}\n💾 Size: ${item.size}\n🔗 Link: ${item.link}\n\n`;
      });

      await sock.sendMessage(chatId, { text: menuText }, { quoted: message });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to fetch files.' }, { quoted: message });
    }
  }
};
