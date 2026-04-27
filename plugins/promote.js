'use strict';
const { getChannelInfo } = require('../lib/messageConfig');

// Auto-event message removed — promote message only shows when .promote command is used
async function handlePromotionEvent(sock, groupId, participants, author) {
  // Intentionally silent — message is sent by the .promote command handler instead
}

module.exports = {
  command: 'promote',
  aliases: ['admin', 'makeadmin'],
  category: 'admin',
  description: '👑 Promote user to admin',
  usage: '.promote @user or reply',
  groupOnly: true,
  adminOnly: true,
  handlePromotionEvent,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();

    if (!context.isBotAdmin) {
      return sock.sendMessage(chatId, { text: `☠️ Make me admin first!`, ...ci }, { quoted: message });
    }

    let targets = [];
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted    = message.message?.extendedTextMessage?.contextInfo?.participant;
    if (mentioned.length) targets = [...mentioned];
    else if (quoted)      targets = [quoted];

    if (!targets.length) {
      return sock.sendMessage(chatId, {
        text: `┏▣ ◈ 👑 *PROMOTE* ◈\n┃\n┃ Mention or reply to user\n┃ *Usage:* .promote @user\n┗▣`, ...ci
      }, { quoted: message });
    }

    try {
      await sock.groupParticipantsUpdate(chatId, targets, 'promote');
      const names = targets.map(j => `@${j.split('@')[0]}`).join(', ');
      await sock.sendMessage(chatId, {
        text: `┏▣ ◈ 👑 *PROMOTED* ◈\n┃\n┃ 💀 ${names}\n┃ ⚔️ Now an Admin!\n┗▣`,
        mentions: targets, ...ci
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `☠️ Failed: ${e.message}`, ...ci }, { quoted: message });
    }
  }
};
