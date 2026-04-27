'use strict';
const settings = require('../settings');
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'owner',
  aliases: ['creator', 'dev'],
  category: 'info',
  description: 'ɢᴇᴛ ᴄᴏɴᴛᴀᴄᴛ ᴏꜰ ᴛʜᴇ ʙᴏᴛ ᴄʀᴇᴀᴛᴏʀ',
  usage: '.owner',
  isPrefixless: false,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    try {
      const num = settings.ownerNumber.replace(/\D/g, '');
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.botOwner}\nTEL;waid=${num}:+${num}\nEND:VCARD`;
      await sock.sendMessage(chatId, {
        contacts: { displayName: settings.botOwner, contacts: [{ vcard }] },
        ...ci,
      }, { quoted: message });

      await sock.sendMessage(chatId, {
        text:
          `⫷߷𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿߷⫸*\n` +
          `༆ ᴄʀᴇᴀᴛᴏʀ: *${settings.botOwner}*\n` +
          `❒ ᴄʜᴀɴɴᴇʟ: ${settings.channelLink}\n` +
          `᭄ ᴠᴇʀsɪᴏɴ: ${settings.version}`,
        ...ci,
      }, { quoted: message });
    } catch (err) {
      await sock.sendMessage(chatId, { text: `✦ ${settings.botOwner} — ᴄᴏɴᴛᴀᴄᴛ ʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ: ${err.message}`, ...ci }, { quoted: message });
    }
  }
};
