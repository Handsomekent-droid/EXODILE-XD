'use strict';
/**
 * EXODILE XD — .setprefix
 * Each paired bot keeps its OWN prefix — completely independent.
 * Changing prefix on one paired bot NEVER affects any other paired bot.
 */
const { getPrefixes, setPrefixes, resetPrefixes, getBotNum } = require('../lib/prefixStore');
const settings = require('../settings');
const { getChannelInfo } = require('../lib/messageConfig');

function H(t) {
  return (
    `╔══════════════════════════════╗\n` +
    `   ꜱᴇᴛᴘʀᴇꜰɪx — ᴇxᴏᴅɪʟᴇ xᴅ ᴠᴀᴜʟᴛ\n` +
    `╚══════════════════════════════╝\n\n` + t
  );
}

module.exports = {
  command: 'setprefix',
  aliases: ['changeprefix', 'prefix'],
  category: 'owner',
  description: 'Change THIS bot\'s prefix (only affects your paired bot)',
  usage: '.setprefix <symbol/emoji>  OR  .setprefix reset',
  ownerOnly: true,   // only the paired owner can use it

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const botNum = getBotNum(sock);  // this specific paired bot's number

    const cur = getPrefixes(botNum);

    if (!args[0]) {
      return sock.sendMessage(chatId, {
        text: H(
          `┃ ᴄᴜʀʀᴇɴᴛ ᴘʀᴇꜰɪx : ${cur.join('  ')}\n` +
          `┃ ʙᴏᴛ ɴᴜᴍʙᴇʀ    : ${botNum}\n\n` +
          `┃ ᴜꜱᴀɢᴇ:\n` +
          `┃  .setprefix !       — single symbol\n` +
          `┃  .setprefix .! #    — multiple symbols\n` +
          `┃  .setprefix 😂      — emoji prefix\n` +
          `┃  .setprefix reset   — restore default\n\n` +
          `> ⚠️ Only changes YOUR paired bot — not other users' bots`
        ), ...ci
      }, { quoted: message });
    }

    const input = args.join(' ').trim();

    if (input.toLowerCase() === 'reset') {
      resetPrefixes(botNum);
      const def = settings.prefixes || ['.'];
      return sock.sendMessage(chatId, {
        text: H(
          `✅ Prefix reset to default: *${def.join('  ')}*\n\n` +
          `┃ ʙᴏᴛ : ${botNum}\n` +
          `┃ ꜱᴛᴀᴛᴜꜱ : ᴏɴʟʏ ʏᴏᴜʀ ʙᴏᴛ ᴡᴀs ᴄʜᴀɴɢᴇᴅ`
        ), ...ci
      }, { quoted: message });
    }

    // Split by spaces for multiple prefixes, else each char
    const spaceParts = input.split(/\s+/).filter(Boolean);
    let newPrefixes = spaceParts.length > 1
      ? spaceParts
      : [...input].filter(Boolean);

    // Deduplicate and cap at 5
    newPrefixes = [...new Set(newPrefixes)].slice(0, 5);

    if (!newPrefixes.length) {
      return sock.sendMessage(chatId, {
        text: H('❌ Invalid prefix. Provide a symbol or emoji.')
      }, { quoted: message });
    }

    setPrefixes(botNum, newPrefixes);

    return sock.sendMessage(chatId, {
      text: H(
        `✅ *Prefix updated!*\n\n` +
        `┃ ɴᴇᴡ ᴘʀᴇꜰɪx : *${newPrefixes.join('  ')}*\n` +
        `┃ ʙᴏᴛ ɴᴜᴍʙᴇʀ : ${botNum}\n` +
        `┃ ᴇxᴀᴍᴘʟᴇ    : ${newPrefixes[0]}menu\n\n` +
        `> ✅ Only YOUR paired bot was changed\n` +
        `> Other people's bots are NOT affected\n` +
        `> Use *.setprefix reset* to restore default`
      ), ...ci
    }, { quoted: message });
  },

  // Exposed so menu and other plugins can read this bot's prefix
  getPrefixes,
  getBotNum,
};
