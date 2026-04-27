'use strict';
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'credits',
  aliases: ['developers', 'devs'],
  category: 'info',
  description: '📜 Show bot developers and contributors',
  usage: '.credits',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();

    const text = 
`┏━━━〔 📜 *𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 𝗖𝗥𝗘𝗗𝗜𝗧𝗦* 〕━━━┓
┃
┃ 👑 *Main Developers:*
┃ ✦ Dev Prime killer NOVA KENT
┃ ✦ Dev Leo VALLOR
┃
┃ 🛠️ *Contributors:*
┃ ✦ Unknown
┃ ✦ Junior
┃ ✦ Night wing
┃ ✦ Executor
┃
┃ 💀 *Powered by EXODILE XD Team*
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
  }
};
