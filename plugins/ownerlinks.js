'use strict';
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

const CHANNELS = [
  { name: '🔥 𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 — 𝗠𝗔𝗜𝗡',     url: 'https://whatsapp.com/channel/0029VbCjCq80LKZ4i4iWHq22' },
  { name: '☠️ 𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 — 𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟',  url: 'https://whatsapp.com/channel/0029VbCMoQ105MUWi87guK2B' },
  { name: '💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 — 𝗨𝗣𝗗𝗔𝗧𝗘𝗦',  url: 'https://whatsapp.com/channel/0029Vb6HKlII7BeChUFC2k2H' },
];

const GROUPS = [
  { name: '⚡ 𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 — 𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗚𝗥𝗢𝗨𝗣', url: 'https://chat.whatsapp.com/GKQHsvi2nO1I867WW8QgND?mode=gi_t' },
];

module.exports = [
  // ── .ownerchannels ────────────────────────────────────────────
  {
    command: 'ownerchannels',
    aliases: ['channels', 'bchannels', 'officialchannels'],
    category: 'info',
    description: '📡 Official EXODILE XD channels',
    usage: '.ownerchannels',
    isPrefixless: false,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();

      let text =
        `┏━━「 ☠️🦠 *𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗖𝗛𝗔𝗡𝗡𝗘𝗟𝗦* 🦠☠️ 」━━┓\n` +
        `┃\n` +
        `┃  📡 Follow to stay updated!\n` +
        `┃\n`;

      CHANNELS.forEach((ch, i) => {
        text += `┃  ${i + 1}. ${ch.name}\n`;
        text += `┃     ➤ ${ch.url}\n`;
        text += `┃\n`;
      });

      text +=
        `┗━━「 ☣️ 𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 ☣️ 」━━┛` +
        FOOTER;

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    },
  },

  // ── .ownergroups ──────────────────────────────────────────────
  {
    command: 'ownergroups',
    aliases: ['groups', 'bgroups', 'officialgroups', 'joingroups'],
    category: 'info',
    description: '👥 Official EXODILE XD group',
    usage: '.ownergroups',
    isPrefixless: false,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();

      let text =
        `┏━━「 ⚔️💀 *𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗚𝗥𝗢𝗨𝗣* 💀⚔️ 」━━┓\n` +
        `┃\n` +
        `┃  👥 Join our community!\n` +
        `┃\n`;

      GROUPS.forEach((g, i) => {
        text += `┃  ${i + 1}. ${g.name}\n`;
        text += `┃     ➤ ${g.url}\n`;
        text += `┃\n`;
      });

      text +=
        `┗━━「 ☣️ 𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 ☣️ 」━━┛` +
        FOOTER;

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    },
  },
];
