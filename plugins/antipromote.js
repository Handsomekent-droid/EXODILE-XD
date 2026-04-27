'use strict';
/**
 * EXODILE XD — Anti-Promote Plugin
 * Prevents unauthorized promotions to admin
 * .antipromote on/off
 */
const store = require('../lib/lightweight_store');
const isOwnerOrSudo = require('../lib/isOwner');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗔𝗡𝗧𝗜-𝗣𝗥𝗢𝗠𝗢𝗧𝗘';

/**
 * Called from messageHandler when action === 'promote'
 */
async function handleAntiPromote(sock, groupId, participants, author) {
  try {
    const cfg = await store.getSetting(groupId, 'antipromote');
    if (!cfg?.enabled) return;

    const authorJid = typeof author === 'string' ? author : author?.id || '';

    // If author is owner/sudo they can promote freely
    const isProtectedAuthor = await isOwnerOrSudo(authorJid, sock, groupId);
    if (isProtectedAuthor) return;

    for (const jid of participants) {
      const participantJid = typeof jid === 'string' ? jid : jid?.id || '';

      // Demote them back
      try {
        await sock.groupParticipantsUpdate(groupId, [participantJid], 'demote');
        await sock.sendMessage(groupId, {
          text:
            `🚫 *ANTI-PROMOTE TRIGGERED*\n\n` +
            `@${authorJid.split('@')[0]} tried to promote @${participantJid.split('@')[0]}\n` +
            `🔒 Action reversed — promotion denied.`,
          mentions: [authorJid, participantJid],
        });
        // Warn the promoter
        try {
          await sock.groupParticipantsUpdate(groupId, [authorJid], 'demote');
        } catch {}
      } catch {}
    }
  } catch {}
}

module.exports = {
  command: 'antipromote',
  aliases: ['nopromote', 'antipmt'],
  category: 'admin',
  description: '🚫 Prevent unauthorized promotions to admin',
  usage: '.antipromote on/off',
  groupOnly: true,
  adminOnly: true,
  handleAntiPromote,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const sub    = args[0]?.toLowerCase();

    const cfg = (await store.getSetting(chatId, 'antipromote')) || { enabled: false };

    if (!sub) {
      return sock.sendMessage(chatId, {
        text:
          `┌─━─━〔 🚫 𝗔𝗡𝗧𝗜-𝗣𝗥𝗢𝗠𝗢𝗧𝗘 〕━─━─┐\n` +
          `│ Status: ${cfg.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
          `│\n` +
          `│ 📌 Protection:\n` +
          `│ • Blocks unauthorized promotions\n` +
          `│ • Reverses the promotion\n` +
          `│ • Demotes the attacker\n` +
          `│ • Owner/sudo can still promote\n` +
          `│\n` +
          `│ • .antipromote on  — Enable\n` +
          `│ • .antipromote off — Disable\n` +
          `└─━─━─━─━─━─━─━─━─━─━─┘` + FOOTER,
        ...ci,
      }, { quoted: message });
    }

    if (sub === 'on') {
      await store.saveSetting(chatId, 'antipromote', { enabled: true });
      return sock.sendMessage(chatId, {
        text: `✅ *Anti-Promote: ENABLED*\n\nUnauthorized promotions will be auto-reversed.` + FOOTER,
        ...ci,
      }, { quoted: message });
    }

    if (sub === 'off') {
      await store.saveSetting(chatId, 'antipromote', { enabled: false });
      return sock.sendMessage(chatId, {
        text: `❌ *Anti-Promote: DISABLED*` + FOOTER, ...ci,
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: `❓ Usage: .antipromote on | off` + FOOTER, ...ci,
    }, { quoted: message });
  },
};
