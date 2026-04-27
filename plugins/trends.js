'use strict';
const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'trends',
  aliases: ['trending', 'trend'],
  category: 'info',
  description: 'sʜᴏᴡ ᴛʀᴇɴᴅɪɴɢ ᴛᴏᴘɪᴄs',
  usage: '.trends',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const country = args[0] || 'KE';

    const APIS = [
      `https://api.giftedtech.my.id/api/info/googletrends?apikey=gifted&country=${country}`,
      `https://api.siputzx.my.id/api/info/trends?country=${country}`,
    ];

    let trends = null;
    for (const url of APIS) {
      try { const { data } = await axios.get(url, { timeout: 12000 }); trends = data?.result || data?.data || data?.trends; if (trends?.length) break; } catch {}
    }

    if (!trends?.length) return await sock.sendMessage(chatId, { text: '𖤐 ᴄᴏᴜʟᴅ ɴᴏᴛ ꜰᴇᴛᴄʜ ᴛʀᴇɴᴅs ʀɪɢʜᴛ ɴᴏᴡ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.', ...channelInfo }, { quoted: message });

    const list = trends.slice(0, 10).map((t, i) => `${i+1}. ✧ ${typeof t === 'string' ? t : t.title || t.name}`).join('\n');
    await sock.sendMessage(chatId, {
      text: `╔══════════════════════════╗\n║  ✦ ᴛʀᴇɴᴅɪɴɢ ᴛᴏᴘɪᴄs      ║\n╚══════════════════════════╝\n\n${list}`,
      ...channelInfo
    }, { quoted: message });
  }
};
