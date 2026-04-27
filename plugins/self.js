'use strict';
const { sessionStore } = require('../lib/sessionStore');
const store  = require('../lib/lightweight_store');
const { getChannelInfo } = require('../lib/messageConfig');

// Only the paired device itself (fromMe) OR one of the 3 strict owner numbers
function isPairedUser(message) {
  if (message.key.fromMe) return true;
  const { STRICT_OWNERS } = require('../lib/strictOwner');
  const jid = message?.key?.participant || message?.participant || message?.key?.remoteJid || '';
  const number = jid.replace(/\D/g, '');
  return STRICT_OWNERS.some(n => number === n || number.endsWith(n));
}

async function denyIfNotPaired(sock, message, chatId) {
  if (!isPairedUser(message)) {
    await sock.sendMessage(chatId, {
      text: '❌ *Access Denied.*\n\nOnly the *paired device owner* can use this command.',
    }, { quoted: message });
    return true;
  }
  return false;
}

module.exports = [
  {
    command: 'self',
    aliases: ['selfmode', 'ownermode'],
    category: 'owner',
    description: 'Lock bot to owner/sudo only',
    usage: '.self',
    ownerOnly: true,

    async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();
      if (await denyIfNotPaired(sock, message, chatId)) return;
      await _ss.setBotMode('self');
      await sock.sendMessage(chatId, {
        text:
          `┌─━─━─━〔 🔒 𝗠𝗢𝗗𝗘 𝗦𝗪𝗜𝗧𝗖𝗛 〕━─━─━─┐\n` +
          `│ 🔴 𝗦𝗧𝗔𝗧𝗨𝗦  :: 𝗣𝗥𝗜𝗩𝗔𝗧𝗘\n` +
          `│ 👑 𝗔𝗖𝗖𝗘𝗦𝗦  :: 𝗢𝗪𝗡𝗘𝗥 + 𝗦𝗨𝗗𝗢 𝗢𝗡𝗟𝗬\n` +
          `│ 🚫 𝗢𝗧𝗛𝗘𝗥𝗦  :: 𝗕𝗟𝗢𝗖𝗞𝗘𝗗\n` +
          `└─━─━─━─━─━─━─━─━─━─━─━─━─━─┘\n` +
          `> ᴜsᴇ *.public* ᴛᴏ ᴏᴘᴇɴ ᴀɢᴀɪɴ`,
        ...ci,
      }, { quoted: message });
    }
  },

  {
    command: 'public',
    aliases: ['publicmode', 'openbot'],
    category: 'owner',
    description: 'Make bot public for everyone',
    usage: '.public',
    ownerOnly: true,

    async handler(sock, message, args, context = {}) {
      const _ss = sessionStore(sock);
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();
      if (await denyIfNotPaired(sock, message, chatId)) return;
      await _ss.setBotMode('public');
      await sock.sendMessage(chatId, {
        text:
          `┌─━─━─━〔 🌐 𝗠𝗢𝗗𝗘 𝗦𝗪𝗜𝗧𝗖𝗛 〕━─━─━─┐\n` +
          `│ 🟢 𝗦𝗧𝗔𝗧𝗨𝗦  :: 𝗣𝗨𝗕𝗟𝗜𝗖\n` +
          `│ 👥 𝗔𝗖𝗖𝗘𝗦𝗦  :: 𝗘𝗩𝗘𝗥𝗬𝗢𝗡𝗘\n` +
          `│ ✅ 𝗕𝗢𝗧     :: 𝗢𝗣𝗘𝗡\n` +
          `└─━─━─━─━─━─━─━─━─━─━─━─━─━─┘\n` +
          `> ᴜsᴇ *.self* ᴛᴏ ʀᴇsᴛʀɪᴄᴛ ᴀɢᴀɪɴ`,
        ...ci,
      }, { quoted: message });
    }
  },
];
