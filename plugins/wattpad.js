'use strict';
const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

const APIS = [
  (q) => `https://api.giftedtech.my.id/api/search/wattpad?apikey=gifted&q=${encodeURIComponent(q)}`,
  (q) => `https://api.siputzx.my.id/api/s/wattpad?q=${encodeURIComponent(q)}`,
];

module.exports = {
  command: 'wattpad',
  aliases: ['wattpadsearch', 'searchwattpad'],
  category: 'search',
  description: 'sᴇᴀʀᴄʜ ᴡᴀᴛᴛᴘᴀᴅ sᴛᴏʀɪᴇs',
  usage: '.wattpad <ǫᴜᴇʀʏ>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query  = args.join(' ').trim();
    if (!query) return await sock.sendMessage(chatId, { text: '✧ ᴘʀᴏᴠɪᴅᴇ ᴀ sᴇᴀʀᴄʜ ᴛᴇʀᴍ.\n𖤐 ᴇxᴀᴍᴘʟᴇ: .ᴡᴀᴛᴛᴘᴀᴅ ʜᴜɴɢᴇʀ ɢᴀᴍᴇs', ...channelInfo }, { quoted: message });

    await sock.sendMessage(chatId, { text: '✧ sᴇᴀʀᴄʜɪɴɢ ᴡᴀᴛᴛᴘᴀᴅ...', ...channelInfo }, { quoted: message });

    let results = null;
    for (const apiFn of APIS) {
      try {
        const { data } = await axios.get(apiFn(query), { timeout: 12000 });
        const list = data?.result || data?.data || data;
        if (Array.isArray(list) && list.length) { results = list; break; }
      } catch {}
    }

    if (!results || !results.length) {
      return await sock.sendMessage(chatId, { text: `𖤐 ɴᴏ ʀᴇsᴜʟᴛs ꜰᴏᴜɴᴅ ꜰᴏʀ *${query}*`, ...channelInfo }, { quoted: message });
    }

    const text = results.slice(0, 8).map((s, i) =>
      `${i+1}. *${s.title || s.name}*\n   ✧ ${s.author || s.username || 'ᴜɴᴋɴᴏᴡɴ'} | ${s.reads || ''}\n   𖤐 ${(s.description||'').slice(0,80)}...`
    ).join('\n\n');

    await sock.sendMessage(chatId, {
      text: `╔══════════════════════════╗\n║  ✦ ᴡᴀᴛᴛᴘᴀᴅ sᴇᴀʀᴄʜ      ║\n╚══════════════════════════╝\n\n${text}`,
      ...channelInfo
    }, { quoted: message });
  }
};
