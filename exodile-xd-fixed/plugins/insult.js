'use strict';
const { keithInsult } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const fallbacks = [
  "You're like a cloud — when you disappear, it's a beautiful day!",
  "I'd agree with you, but then we'd both be wrong.",
  "You bring everyone so much joy when you leave the room!",
  "I've seen better looking faces on a piñata.",
];
module.exports = {
  command: 'insult', aliases: ['roast', 'insults'], category: 'fun',
  description: 'Get a random insult/roast', usage: '.insult [@user]',
  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    const target = args[0] ? `@${args[0].replace('@', '')} ` : '';
    try {
      let text = await keithInsult();
      text = typeof text === 'string' ? text : fallbacks[Math.floor(Math.random() * fallbacks.length)];
      await sock.sendMessage(chatId, { text: `🔥 *ROAST*\n\n${target}${text}${FOOTER}`, ...ci }, { quoted: m });
    } catch { await sock.sendMessage(chatId, { text: `🔥 ${fallbacks[0]}` }, { quoted: m }); }
  }
};
