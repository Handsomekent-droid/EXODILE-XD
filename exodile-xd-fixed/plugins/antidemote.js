'use strict';
/**
 * EXODILE XD — Anti-Demote Plugin
 * Automatically re-promotes bot or protects admins from unauthorized demotion
 * .antidemote on/off
 */
const store = require('../lib/lightweight_store');
const isOwnerOrSudo = require('../lib/isOwner');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗔𝗡𝗧𝗜-𝗗𝗘𝗠𝗢𝗧𝗘';

/**
 * Called from messageHandler when action === 'demote'
 */
async function handleAntiDemote(sock, groupId, participants, author) {
  try {
    const cfg = await store.getSetting(groupId, 'antidemote');
    if (!cfg?.enabled) return;

    const botJid = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
    const authorJid = typeof author === 'string' ? author : author?.id || '';

    // If author is owner/sudo they can demote
    const isProtectedAuthor = await isOwnerOrSudo(authorJid, sock, groupId);
    if (isProtectedAuthor) return;

    for (const jid of participants) {
      const participantJid = typeof jid === 'string' ? jid : jid?.id || '';

      // If bot was demoted — re-promote it
      if (participantJid === botJid) {
        try {
          await sock.groupParticipantsUpdate(groupId, [botJid], 'promote');
          await sock.sendMessage(groupId, {
            text: `🛡️ *ANTI-DEMOTE* — I re-promoted myself!\n\n☠️ @${authorJid.split('@')[0]} tried to demote me but failed.`,
            mentions: [authorJid],
          });
        } catch {}
        continue;
      }

      // If another admin was demoted by non-owner — re-promote and warn
      const isVictimProtected = await isOwnerOrSudo(participantJid, sock, groupId);
      if (isVictimProtected) {
        try {
          await sock.groupParticipantsUpdate(groupId, [participantJid], 'promote');
          await sock.sendMessage(groupId, {
            text:
              `🛡️ *ANTI-DEMOTE TRIGGERED*\n\n` +
              `@${authorJid.split('@')[0]} tried to demote @${participantJid.split('@')[0]}\n` +
              `🔒 Action reversed — protected admin re-promoted.`,
            mentions: [authorJid, participantJid],
          });
          // Demote the attacker instead
          try {
            await sock.groupParticipantsUpdate(groupId, [authorJid], 'demote');
          } catch {}
        } catch {}
      }
    }
  } catch {}
}

module.exports = {
  command: 'antidemote',
  aliases: ['nodemote', 'antidmt'],
  category: 'admin',
  description: '🛡️ Prevent unauthorized demotion of admins',
  usage: '.antidemote on/off',
  groupOnly: true,
  adminOnly: true,
  handleAntiDemote,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const sub    = args[0]?.toLowerCase();

    const cfg = (await store.getSetting(chatId, 'antidemote')) || { enabled: false };

    if (!sub) {
      return sock.sendMessage(chatId, {
        text:
          `┌─━─━〔 🛡️ 𝗔𝗡𝗧𝗜-𝗗𝗘𝗠𝗢𝗧𝗘 〕━─━─┐\n` +
          `│ Status: ${cfg.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
          `│\n` +
          `│ 📌 Protection:\n` +
          `│ • Re-promotes bot if demoted\n` +
          `│ • Protects owner/sudo admins\n` +
          `│ • Demotes the attacker\n` +
          `│\n` +
          `│ • .antidemote on  — Enable\n` +
          `│ • .antidemote off — Disable\n` +
          `└─━─━─━─━─━─━─━─━─━─━─┘` + FOOTER,
        ...ci,
      }, { quoted: message });
    }

    if (sub === 'on') {
      await store.saveSetting(chatId, 'antidemote', { enabled: true });
      return sock.sendMessage(chatId, {
        text: `✅ *Anti-Demote: ENABLED*\n\nBot will auto-reverse unauthorized demotions.` + FOOTER,
        ...ci,
      }, { quoted: message });
    }

    if (sub === 'off') {
      await store.saveSetting(chatId, 'antidemote', { enabled: false });
      return sock.sendMessage(chatId, {
        text: `❌ *Anti-Demote: DISABLED*` + FOOTER, ...ci,
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: `❓ Usage: .antidemote on | off` + FOOTER, ...ci,
    }, { quoted: message });
  },
};
