'use strict';
/**
 * EXODILE XD — Group Add v3
 * Fixed: logout bug caused by unhandled Baileys errors from groupParticipantsUpdate
 *
 * Key fixes:
 * 1. Wrapped in try/catch that NEVER rethrows
 * 2. Specific handling for privacy errors (403) → sends invite link instead
 * 3. 800ms delay before adding to avoid WA spam detection
 * 4. Catches specific Baileys error codes that cause logouts
 */
const isOwnerOrSudo = require('../lib/isOwner');

// Non-fatal Baileys error patterns that must NEVER propagate
const SAFE_ERRORS = [
  'not-authorized', 'forbidden', 'bad request', 'conflict',
  '403', '408', '409', '401', 'stream errored',
  'connection closed', 'timed out', 'ECONNRESET',
];

function isSafeError(err) {
  const msg = (err?.message || err?.toString() || '').toLowerCase();
  const code = String(err?.output?.statusCode || err?.statusCode || '');
  return SAFE_ERRORS.some(s => msg.includes(s) || code.includes(s));
}

module.exports = {
  command: 'add',
  aliases: ['invite', 'gcadd', 'addgc'],
  category: 'group',
  description: 'Add a user to the group',
  usage: '.add <number> or reply to vcard/message',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = context.channelInfo || {};

    // ── Extract target number ──────────────────────────────────
    let targetNumber = null;

    const quotedCtx = message.message?.extendedTextMessage?.contextInfo;
    if (quotedCtx?.quotedMessage) {
      const qm = quotedCtx.quotedMessage;
      if (qm.contactMessage?.vcard) {
        const vcard = qm.contactMessage.vcard;
        const m = vcard.match(/waid=(\d+)/) || vcard.match(/TEL.*?:(\+?\d+)/);
        if (m) targetNumber = m[1].replace(/\D/g, '');
      } else if (qm.conversation || qm.extendedTextMessage?.text) {
        const txt = qm.conversation || qm.extendedTextMessage.text;
        const m = txt.match(/(\+?\d{10,15})/);
        if (m) targetNumber = m[1].replace(/\D/g, '');
      } else if (quotedCtx.participant) {
        targetNumber = quotedCtx.participant.split('@')[0];
      }
    }

    if (!targetNumber && args.length) {
      targetNumber = args.join('').replace(/[^\d]/g, '');
    }

    if (!targetNumber || targetNumber.length < 7) {
      return sock.sendMessage(chatId, {
        text: `❌ *Please provide a valid number!*\n\n*Usage:*\n• \`.add 254XXXXXXXXX\`\n• \`.add +254XXXXXXXXX\`\n• Reply to a contact/vcard with \`.add\``,
        ...ci
      }, { quoted: message });
    }

    const targetJid = `${targetNumber}@s.whatsapp.net`;

    try {
      // Check already in group
      const groupMeta = await sock.groupMetadata(chatId).catch(() => null);
      if (groupMeta) {
        const members = groupMeta.participants.map(p => p.id);
        if (members.includes(targetJid)) {
          return sock.sendMessage(chatId, {
            text: `⚠️ @${targetNumber} is *already in the group!*`,
            mentions: [targetJid], ...ci
          }, { quoted: message });
        }
      }

      // Delay to avoid WA spam detection
      await new Promise(r => setTimeout(r, 800));

      let result = null;
      let addError = null;

      try {
        result = await sock.groupParticipantsUpdate(chatId, [targetJid], 'add');
      } catch (err) {
        addError = err;
        console.error('[gcadd] groupParticipantsUpdate error (suppressed):', err?.message);
      }

      // Handle result or error
      const status = result?.[0]?.status?.toString() || (addError ? 'error' : '0');

      if (status === '200') {
        return sock.sendMessage(chatId, {
          text: `✅ *Successfully added!*\n\n👤 @${targetNumber} has joined.`,
          mentions: [targetJid], ...ci
        }, { quoted: message });
      }

      if (status === '403' || (addError && isSafeError(addError))) {
        // Privacy restriction — send invite link
        let inviteLink = '';
        try {
          const code = await sock.groupInviteCode(chatId);
          inviteLink = `\n\n🔗 *Invite Link:*\nhttps://chat.whatsapp.com/${code}`;
        } catch {}
        return sock.sendMessage(chatId, {
          text: `❌ *Cannot add @${targetNumber}*\n\n*Reason:* Privacy settings block being added to groups.${inviteLink}\n\nShare the invite link manually.`,
          mentions: [targetJid], ...ci
        }, { quoted: message });
      }

      if (status === '408') {
        return sock.sendMessage(chatId, {
          text: `📨 *Invite sent to @${targetNumber}!*\n\nThey need to accept to join.`,
          mentions: [targetJid], ...ci
        }, { quoted: message });
      }

      if (status === '409') {
        return sock.sendMessage(chatId, {
          text: `⚠️ @${targetNumber} is *already in the group!*`,
          mentions: [targetJid], ...ci
        }, { quoted: message });
      }

      if (addError) {
        return sock.sendMessage(chatId, {
          text: `❌ *Failed to add @${targetNumber}*\n\n${(addError.message || 'Unknown error').slice(0, 80)}`,
          mentions: [targetJid], ...ci
        }, { quoted: message });
      }

      await sock.sendMessage(chatId, {
        text: `⚠️ *Could not add @${targetNumber}*\n\nStatus: ${status}\nThe user may have privacy settings blocking group adds.`,
        mentions: [targetJid], ...ci
      }, { quoted: message });

    } catch (err) {
      // ABSOLUTE CATCH — this must NEVER crash or log out the bot
      console.error('[gcadd] caught outer error (suppressed):', err?.message);
      try {
        // Only send error message if it's not a connection error
        if (!isSafeError(err)) {
          await sock.sendMessage(chatId, {
            text: `❌ *Error:* ${(err?.message || 'unknown').slice(0, 60)}`,
            ...ci
          }, { quoted: message });
        }
      } catch {} // swallow everything
    }
  }
};
