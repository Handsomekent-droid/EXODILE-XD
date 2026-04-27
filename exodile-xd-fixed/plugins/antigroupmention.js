'use strict';
const { sessionStore } = require('../lib/sessionStore');
/**
 * EXODILE XD — Anti Group Mention
 * Detects when someone sends @everyone / @all / group mention tags
 * and responds with: delete | warn | kick  based on config
 */
const store        = require('../lib/lightweight_store');
const isOwnerOrSudo = require('../lib/isOwner');
const isAdmin      = require('../lib/isAdmin');
const { getChannelInfo } = require('../lib/messageConfig');

// ── Store helpers ──────────────────────────────────────────────
async function getConfig(chatId) {
  try {
    const c = await store.getSetting(chatId, 'antigroupmention');
    return c || { enabled: false, action: 'delete' };
  } catch { return { enabled: false, action: 'delete' }; }
}

async function setConfig(chatId, enabled, action) {
  await store.saveSetting(chatId, 'antigroupmention', { enabled, action });
}

// ── Detection hook (called from messageHandler) ────────────────
async function handleAntiGroupMention(sock, chatId, message, userMessage, senderId) {
  try {
    const config = await getConfig(chatId);
    if (!config.enabled) return;

    // Skip owner/sudo/admin
    const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (isOwnerSudo) return;
    try {
      const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
      if (isSenderAdmin) return;
    } catch {}

    // Detect group mention — Baileys passes it as contextInfo.mentionedJid containing the group JID
    // OR the message body contains @all / @everyone text
    const proto = message.message || {};
    const ctxInfo =
      proto.extendedTextMessage?.contextInfo ||
      proto.imageMessage?.contextInfo ||
      proto.videoMessage?.contextInfo ||
      proto.documentMessage?.contextInfo ||
      {};

    const mentionedJids = ctxInfo?.mentionedJid || [];
    const textLower = userMessage.toLowerCase();

    // A "group mention" = mentioning the group JID itself OR typing @all / @everyone / @everyone@s
    const mentionsGroup = mentionedJids.some(jid => jid === chatId || jid.endsWith('@broadcast'));
    const hasKeyword    = /\@all\b|\@everyone\b|\@here\b/.test(textLower);

    if (!mentionsGroup && !hasKeyword) return;

    const action      = config.action || 'delete';
    const participant = message.key.participant || senderId;
    const tag         = `@${senderId.split('@')[0]}`;

    // Delete the message
    if (action === 'delete' || action === 'kick') {
      try {
        await sock.sendMessage(chatId, {
          delete: {
            remoteJid:   chatId,
            fromMe:      false,
            id:          message.key.id,
            participant: participant,
          }
        });
      } catch {}
    }

    // Warn
    if (action === 'warn' || action === 'delete') {
      await sock.sendMessage(chatId, {
        text: `⚠️ *Anti Group Mention*\n\n${tag}, tagging the entire group is *not allowed* here ☠️`,
        mentions: [senderId]
      });
    }

    // Kick
    if (action === 'kick') {
      try {
        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
        await sock.sendMessage(chatId, {
          text: `🚫 ${tag} has been *removed* for mentioning the entire group.`,
          mentions: [senderId]
        });
      } catch {
        await sock.sendMessage(chatId, {
          text: `⚠️ ꜰᴀɪʟᴇᴅ to remove — bot needs admin rights.`
        });
      }
    }
  } catch (e) {
    console.error('[antigroupmention]', e.message);
  }
}

// ── Command handler ────────────────────────────────────────────
module.exports = [
  {
    command: 'antigroupmention',
    aliases: ['agm', 'antieveryone'],
    category: 'admin',
    description: 'Detect & act on group-wide @mentions',
    usage: '.antigroupmention set delete|warn|kick  OR  .antigroupmention off',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();
      const sub    = (args[0] || '').toLowerCase();
      const arg2   = (args[1] || '').toLowerCase();

      const config = await getConfig(chatId);

      // ── .antigroupmention (no args) — show status ──────────
      if (!sub) {
        const status = config.enabled
          ? `🟢 *ON* — action: *${config.action}*`
          : '🔴 *OFF*';
        return sock.sendMessage(chatId, {
          text:
            `┌─━─━─━〔 🛡️ *ANTI GROUP MENTION* 〕━─━─━─┐\n` +
            `│\n` +
            `│  Status  : ${status}\n` +
            `│\n` +
            `│  Usage:\n` +
            `│  • .agm set delete  — delete msg + warn\n` +
            `│  • .agm set warn    — warn only\n` +
            `│  • .agm set kick    — delete msg + kick\n` +
            `│  • .agm off         — disable\n` +
            `│\n` +
            `└─━─━─━─━─━─━─━─━─━─━─━─━─━─┘`,
          ...ci
        }, { quoted: message });
      }

      // ── .antigroupmention off ──────────────────────────────
      if (sub === 'off' || sub === 'disable') {
        await setConfig(chatId, false, config.action || 'delete');
        return sock.sendMessage(chatId, {
          text: '🔴 *Anti Group Mention disabled.*',
          ...ci
        }, { quoted: message });
      }

      // ── .antigroupmention set <action> ────────────────────
      if (sub === 'set' || sub === 'on') {
        const validActions = ['delete', 'warn', 'kick'];
        const action = validActions.includes(arg2) ? arg2 : 'delete';
        await setConfig(chatId, true, action);
        const desc = {
          delete: 'delete the message & warn the user',
          warn:   'warn the user only',
          kick:   'delete the message & remove the user',
        };
        return sock.sendMessage(chatId, {
          text:
            `✅ *Anti Group Mention enabled*\n\n` +
            `⚙️ Action : *${action}*\n` +
            `📝 Effect : ${desc[action]}`,
          ...ci
        }, { quoted: message });
      }

      // fallback
      return sock.sendMessage(chatId, {
        text: `❓ Unknown option. Use: .agm set delete|warn|kick  or  .agm off`,
        ...ci
      }, { quoted: message });
    }
  }
];

// Export the hook so messageHandler can call it
module.exports.handleAntiGroupMention = handleAntiGroupMention;
