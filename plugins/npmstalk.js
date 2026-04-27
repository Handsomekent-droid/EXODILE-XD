'use strict';
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'npmstalk',
  aliases: ['npmstlk', 'npmlook'],
  category: 'stalk',
  description: 'ɢᴇᴛ ɴᴘᴍ ᴘᴀᴄᴋᴀɢᴇ ᴅᴇᴛᴀɪʟs',
  usage: '.npmstalk <ᴘᴀᴄᴋᴀɢᴇ>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    const H = '╔═══════════════════════════╗\n║   𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿 — ɴᴘᴍ sᴛᴀʟᴋ   ║\n╚═══════════════════════════╝\n\n';
    const pkg = args[0];
    if (!pkg) return sock.sendMessage(chatId, { text: '𖤐 ᴘʀᴏᴠɪᴅᴇ ᴀ ᴘᴀᴄᴋᴀɢᴇ ɴᴀᴍᴇ\n𖤐 ᴇxᴀᴍᴘʟᴇ: .npmstalk axios', ...ci }, { quoted: message });
    try {
      const { data } = await axios.get(`https://registry.npmjs.org/${pkg}`, { timeout: 12000 });
      const latest = data['dist-tags']?.latest;
      const info   = data.versions?.[latest] || {};
      const text = H +
        `𖤐 *${data.name}*\n` +
        `𖤐 ᴠᴇʀsɪᴏɴ: ${latest}\n` +
        `𖤐 ᴅᴇsᴄ: ${(data.description || 'ɴ/ᴀ').slice(0, 120)}\n` +
        `𖤐 ᴀᴜᴛʜᴏʀ: ${typeof data.author === 'object' ? data.author?.name : data.author || 'ᴜɴᴋɴᴏᴡɴ'}\n` +
        `𖤐 ʟɪᴄᴇɴsᴇ: ${info.license || 'ɴ/ᴀ'}\n` +
        `𖤐 ᴅᴇᴘs: ${Object.keys(info.dependencies || {}).length}\n` +
        `𖤐 ʟɪɴᴋ: https://npmjs.com/package/${pkg}`;
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ᴘᴀᴄᴋᴀɢᴇ ɴᴏᴛ ꜰᴏᴜɴᴅ: ${pkg}`, ...ci }, { quoted: message });
    }
  }
};
