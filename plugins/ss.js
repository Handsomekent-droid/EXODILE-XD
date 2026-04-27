const axios = require('axios');

module.exports = {
  command: 'screenshot',
  aliases: ['ss', 'ssweb'],
  category: 'tools',
  description: 'Get a screenshot of a website',
  usage: '.screenshot <url>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    let url = args?.[0]?.trim();

    if (!url) {
      return await sock.sendMessage(chatId, { text: '*Provide a URL.*\nExample: .screenshot https://github.com' }, { quoted: message });
    }

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      new URL(url);
    } catch {
      return await sock.sendMessage(chatId, { text: '❌ Invalid URL provided.' }, { quoted: message });
    }

    const enc = encodeURIComponent(url);
    const apis = [
      `https://api.ryzendesu.vip/api/tools/ssweb?url=${enc}`,
      `https://api.giftedtech.my.id/api/tools/screenshot?apikey=gifted&url=${enc}`,
      `https://api.siputzx.my.id/api/tools/ssweb?url=${enc}`,
      `https://image.thum.io/get/width/1280/crop/720/noanimate/${url}`,
    ];

    let sent = false;
    for (const apiUrl of apis) {
      try {
        const { data } = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 15000 });
        if (!data || data.length < 1000) continue;
        const caption = `🌐 *Screenshot*\n${url}`;
        await sock.sendMessage(chatId, { image: Buffer.from(data), caption }, { quoted: message });
        sent = true;
        break;
      } catch {}
    }

    if (!sent) {
      await sock.sendMessage(chatId, { text: '❌ Could not take screenshot. The site may be down or blocking access.' }, { quoted: message });
    }
  }
};

