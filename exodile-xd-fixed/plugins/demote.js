'use strict';
const { getChannelInfo } = require('../lib/messageConfig');
const isOwnerOrSudo = require('../lib/isOwner');

async function handleDemotionEvent(sock, groupId, participants, author) {
  try {
    if (!Array.isArray(participants) || !participants.length) return;
    const names = participants.map(j => `@${(typeof j==='string'?j:j.id||'').split('@')[0]}`).join(', ');
    const by = author ? `@${(typeof author==='string'?author:author?.id||'').split('@')[0]}` : 'System';
    const mentions = [...participants.map(j=>typeof j==='string'?j:j.id||''), typeof author==='string'?author:author?.id||''].filter(Boolean);
    await sock.sendMessage(groupId, {
      text: `┏▣ ◈ 💀 *DEMOTED* ◈\n┃\n┃ ☠️ ${names}\n┃ ⚔️ By: ${by}\n┃ 📅 ${new Date().toLocaleString()}\n┗▣`,
      mentions
    });
  } catch {}
}

module.exports = {
  command: 'demote',
  aliases: ['dmt', 'removeadmin', 'unadmin'],
  category: 'admin',
  description: '💀 Demote admin to member',
  usage: '.demote @user or reply',
  groupOnly: true,
  adminOnly: true,
  handleDemotionEvent,

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
        text: `┏▣ ◈ 💀 *DEMOTE* ◈\n┃\n┃ Mention or reply to admin\n┃ *Usage:* .demote @user\n┗▣`, ...ci
      }, { quoted: message });
    }

    // Protect owner and sudo from being demoted
    const safeTargets = [];
    for (const jid of targets) {
      const isProtected = await isOwnerOrSudo(jid, sock, chatId);
      if (isProtected) {
        await sock.sendMessage(chatId, {
          text: `🔒 @${jid.split('@')[0]} is the *owner/sudo* and cannot be demoted!`,
          mentions: [jid], ...ci
        }, { quoted: message });
        continue;
      }
      safeTargets.push(jid);
    }

    if (!safeTargets.length) return;

    try {
      await sock.groupParticipantsUpdate(chatId, safeTargets, 'demote');
      const names = safeTargets.map(j => `@${j.split('@')[0]}`).join(', ');
      await sock.sendMessage(chatId, {
        text: `┏▣ ◈ 💀 *DEMOTED* ◈\n┃\n┃ ☠️ ${names}\n┃ ⚔️ Removed from admin!\n┗▣`,
        mentions: safeTargets, ...ci
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `☠️ Failed: ${e.message}`, ...ci }, { quoted: message });
    }
  }
};
