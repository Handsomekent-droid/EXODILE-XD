'use strict';
const { getChannelInfo } = require('../lib/messageConfig');
const isOwnerOrSudo = require('../lib/isOwner');

module.exports = {
  command: 'kick',
  aliases: ['kickmember', 'fire', 'remove'],
  category: 'admin',
  description: '☠️ Remove member(s) from group',
  usage: '.kick @user or reply',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId   = context.chatId || message.key.remoteJid;
    const ci       = getChannelInfo();
    const senderId = context.senderId || message.key.participant || message.key.remoteJid;

    if (!context.isBotAdmin) {
      return sock.sendMessage(chatId, {
        text: `┏▣ ◈ ⚔️ *KICK* ◈\n┃\n┃ ☠️ Bot needs admin rights.\n┗▣`, ...ci
      }, { quoted: message });
    }

    // Collect targets: mentions + quoted reply
    let targets = [];
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted    = message.message?.extendedTextMessage?.contextInfo?.participant;
    if (mentioned.length) targets = [...mentioned];
    else if (quoted)      targets = [quoted];

    if (!targets.length) {
      return sock.sendMessage(chatId, {
        text: `┏▣ ◈ ⚔️ *KICK* ◈\n┃\n┃ ➽ Reply to a message OR\n┃ ➽ Mention user(s) to kick\n┃\n┃ *Usage:* .kick @user\n┗▣`, ...ci
      }, { quoted: message });
    }

    // ── PROTECTION: never kick bot itself, owner, or sudo users ──
    const botNum = (sock.user?.id || '').split(':')[0].split('@')[0];

    const safeTargets = [];
    for (const jid of targets) {
      const num = jid.split('@')[0].split(':')[0];
      // Skip bot
      if (num === botNum) {
        await sock.sendMessage(chatId, { text: `☠️ I can't kick myself!`, ...ci }, { quoted: message });
        continue;
      }
      // Skip owner / sudo — CANNOT be kicked by anyone
      const isProtected = await isOwnerOrSudo(jid, sock, chatId);
      if (isProtected) {
        await sock.sendMessage(chatId, {
          text: `🔒 @${num} is the *owner/sudo* and cannot be kicked!`,
          mentions: [jid], ...ci
        }, { quoted: message });
        continue;
      }
      safeTargets.push(jid);
    }

    if (!safeTargets.length) return;

    try {
      await sock.groupParticipantsUpdate(chatId, safeTargets, 'remove');
      const names = safeTargets.map(j => `@${j.split('@')[0]}`).join(', ');
      await sock.sendMessage(chatId, {
        text: `┏▣ ◈ ⚔️ *KICKED* ◈\n┃\n┃ 💀 ${names}\n┃ ☠️ Removed from group!\n┗▣`,
        mentions: safeTargets, ...ci
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, {
        text: `┏▣ ◈ ☠️ *ERROR* ◈\n┃\n┃ Failed: ${e.message}\n┗▣`, ...ci
      }, { quoted: message });
    }
  }
};
