'use strict';
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'del',
  aliases: ['d', 'delete'],
  category: 'general',
  description: 'Delete a replied-to message',
  usage: '.del (reply to any message)',
  // NOT adminOnly — works even without bot being admin
  // Bot's own messages are always deletable; others' messages attempted regardless

  async handler(sock, message, args, context = {}) {
    const chatId     = context.chatId || message.key.remoteJid;
    const ci         = getChannelInfo();
    const isGroup    = chatId.endsWith('@g.us');
    const isBotAdmin = context.isBotAdmin;

    // Must reply to a message
    const ctx =
      message.message?.extendedTextMessage?.contextInfo  ||
      message.message?.imageMessage?.contextInfo         ||
      message.message?.videoMessage?.contextInfo         ||
      message.message?.documentMessage?.contextInfo      ||
      message.message?.stickerMessage?.contextInfo       ||
      message.message?.audioMessage?.contextInfo         ||
      null;

    if (!ctx?.stanzaId) {
      return sock.sendMessage(chatId, {
        text: '↩️ *Reply to a message* to delete it.',
        ...ci
      }, { quoted: message });
    }

    // Figure out if the quoted message belongs to the bot
    const botNumber = (sock.user?.id || '').split(':')[0].split('@')[0];
    const quotedParticipant = ctx.participant || '';
    const quotedNumber = quotedParticipant.split(':')[0].split('@')[0];
    const isQuotedFromBot = message.key.fromMe || (botNumber && quotedNumber === botNumber);

    let deleted = false;

    // Attempt 1: delete with correct fromMe flag
    try {
      await sock.sendMessage(chatId, {
        delete: {
          remoteJid:   chatId,
          fromMe:      isQuotedFromBot,
          id:          ctx.stanzaId,
          participant: isGroup ? (ctx.participant || undefined) : undefined,
        }
      });
      deleted = true;
    } catch {}

    // Attempt 2: flip fromMe if first try failed (handles misdetection)
    if (!deleted) {
      try {
        await sock.sendMessage(chatId, {
          delete: {
            remoteJid:   chatId,
            fromMe:      !isQuotedFromBot,
            id:          ctx.stanzaId,
            participant: isGroup ? (ctx.participant || undefined) : undefined,
          }
        });
        deleted = true;
      } catch {}
    }

    // Always clean up the .del command itself (fromMe = true, always works)
    try {
      await sock.sendMessage(chatId, {
        delete: {
          remoteJid:   chatId,
          fromMe:      true,
          id:          message.key.id,
          participant: isGroup ? (message.key.participant || undefined) : undefined,
        }
      });
    } catch {}

    if (!deleted) {
      await sock.sendMessage(chatId, {
        text: "❌ Couldn't delete that message.\n\n💡 For others' messages in groups, the bot needs *admin* rights.",
        ...ci
      }, { quoted: message });
    }
  }
};
