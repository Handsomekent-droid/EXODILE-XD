'use strict';
const { fetchImageUrl } = require('../lib/apiFallback');
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'cyberpunkai',
  aliases: ['cyberpunk', 'aicyber'],
  category: 'images',
  description: 'ɢᴇɴᴇʀᴀᴛᴇ ᴄʏʙᴇʀᴘᴜɴᴋ ᴀɪ ɪᴍᴀɢᴇ',
  usage: '.cyberpunkai <ᴘʀᴏᴍᴘᴛ>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    const H = '╔═══════════════════════════╗\n║   𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿 — 𝘼𝙄  ║\n╚═══════════════════════════╝\n\n';
    let prompt = args.join(' ').trim();
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!prompt && quoted) prompt = quoted.conversation || quoted.extendedTextMessage?.text || '';
    prompt = prompt.replace(/^\.\w+\s*/, '').trim();
    if (!prompt) return sock.sendMessage(chatId, { text: '𖤐 ᴘʀᴏᴠɪᴅᴇ ᴀ ᴘʀᴏᴍᴘᴛ', ...ci }, { quoted: message });
    await sock.sendMessage(chatId, { text: `𖤐 ɢᴇɴᴇʀᴀᴛɪɴɢ *ᴄʏʙᴇʀᴘᴜɴᴋ* ɪᴍᴀɢᴇ...`, ...ci }, { quoted: message });
    try {
      const imgUrl = await fetchImageUrl(prompt, 'cyberpunk');
      if (!imgUrl) throw new Error('ɴᴏ ɪᴍᴀɢᴇ ʀᴇᴛᴜʀɴᴇᴅ');
      if (imgUrl.startsWith('http')) {
        const axios = require('axios');
        const { data } = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
        await sock.sendMessage(chatId, { image: Buffer.from(data), caption: H + `𖤐 *ᴄʏʙᴇʀᴘᴜɴᴋ*\n𖤐 ᴘʀᴏᴍᴘᴛ: ${prompt}`, ...ci }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: H + `𖤐 *ᴄʏʙᴇʀᴘᴜɴᴋ*\n𖤐 ᴘʀᴏᴍᴘᴛ: ${prompt}`, ...ci }, { quoted: message });
      }
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ᴀɪ ɪᴍᴀɢᴇ ꜰᴀɪʟᴇᴅ: ${e.message}`, ...ci }, { quoted: message });
    }
  }
};
