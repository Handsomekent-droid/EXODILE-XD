const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

module.exports = {
  command: 'rule34home',
  aliases: ['r34home', 'rule34'],
  category: 'nsfw',
  description: 'Fetch latest Rule34 video listings (links only)',
  usage: '.rule34home',

  async handler(sock, message) {
    const chatId = message.key.remoteJid;

    try {
      // prexzy has 0 active endpoints — use rule34video API directly
      const res = await axios.get(
        'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=5&tags=video',
        { timeout: 15000, headers: { 'User-Agent': UA } }
      );

      const posts = Array.isArray(res.data) ? res.data : [];

      if (!posts.length) {
        return sock.sendMessage(chatId, {
          text: '❌ No videos found.'
        }, { quoted: message });
      }

      let text = '🔞 *Rule34 – Latest Posts*\n\n';
      let count = 0;
      for (const v of posts) {
        if (!v.file_url) continue;
        count++;
        text +=
          `*${count}.* ID: ${v.id}\n` +
          `👁 Score: ${v.score}\n` +
          `🔗 Link: https://rule34.xxx/index.php?page=post&s=view&id=${v.id}\n\n`;
        if (count >= 5) break;
      }

      await sock.sendMessage(chatId, { text }, { quoted: message });

    } catch (err) {
      console.error('rule34home error:', err.message);
      await sock.sendMessage(chatId, {
        text: `❌ ꜰᴀɪʟᴇᴅ to fetch data.\n${err.message}`
      }, { quoted: message });
    }
  }
};