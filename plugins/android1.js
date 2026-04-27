'use strict';
const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

const APIS = [
  (q) => `https://api.giftedtech.my.id/api/search/apkpure?apikey=gifted&q=${encodeURIComponent(q)}`,
  (q) => `https://api.siputzx.my.id/api/s/apkpure?q=${encodeURIComponent(q)}`,
];

module.exports = {
  command: 'android',
  aliases: ['an1', 'an1apk', 'apksearch'],
  category: 'apks',
  description: 'sᴇᴀʀᴄʜ & ᴅᴏᴡɴʟᴏᴀᴅ ᴀᴘᴋs',
  usage: '.android <ᴀᴘᴘ ɴᴀᴍᴇ>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query  = args.join(' ').trim();
    if (!query) return await sock.sendMessage(chatId, { text: '✧ ᴘʀᴏᴠɪᴅᴇ ᴀɴ ᴀᴘᴘ ɴᴀᴍᴇ.\n𖤐 ᴇxᴀᴍᴘʟᴇ: .ᴀɴᴅʀᴏɪᴅ ᴛᴇʟᴇɢʀᴀᴍ', ...channelInfo }, { quoted: message });

    await sock.sendMessage(chatId, { text: '✧ sᴇᴀʀᴄʜɪɴɢ ᴀᴘᴋs...', ...channelInfo }, { quoted: message });

    let apps = null;
    for (const fn of APIS) {
      try { const { data } = await axios.get(fn(query), { timeout: 12000 }); apps = data?.result || data?.data; if (apps?.length) break; } catch {}
    }

    if (!apps?.length) return await sock.sendMessage(chatId, { text: `𖤐 ɴᴏ ᴀᴘᴋs ꜰᴏᴜɴᴅ ꜰᴏʀ *${query}*`, ...channelInfo }, { quoted: message });

    const text = apps.slice(0, 6).map((a, i) =>
      `${i+1}. *${a.name || a.title}*\n   ✧ v${a.version || '?'} | ${a.size || '?'}\n   𖤐 ${a.developer || ''}`
    ).join('\n\n');

    await sock.sendMessage(chatId, {
      text: `╔══════════════════════════╗\n║  🟡 ᴀᴘᴋ sᴇᴀʀᴄʜ ʀᴇsᴜʟᴛs  ║\n╚══════════════════════════╝\n\n${text}`,
      ...channelInfo
    }, { quoted: message });
  }
};
