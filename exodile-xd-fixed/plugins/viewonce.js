'use strict';
/**
 * EXODILE XD — View-Once Commands
 * .vv    — open view-once in current chat
 * .vvdm  — save view-once to OWNER'S private DM (not sender's)
 *
 * NOTE: By the time these commands run, index.js has already unwrapped
 * the viewOnceMessage container. So we check for the already-unwrapped
 * imageMessage/videoMessage directly.
 */
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

/**
 * Download media from a quoted message.
 * Handles both unwrapped (already processed by index.js) and
 * still-wrapped view-once messages.
 */
async function downloadViewOnceMedia(quoted) {
  if (!quoted) return null;

  // After index.js unwraps: imageMessage or videoMessage directly
  const isImage = !!quoted.imageMessage;
  const isVideo = !!quoted.videoMessage;

  // Also handle if still wrapped (e.g. from viewOnceMessage container)
  const voInner = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message;
  const fromContainer = !isImage && !isVideo && voInner ? {
    isImage: !!voInner.imageMessage,
    isVideo: !!voInner.videoMessage,
    mediaMsg: voInner.imageMessage || voInner.videoMessage,
    mediaType: voInner.imageMessage ? 'image' : 'video',
  } : null;

  if (!isImage && !isVideo && !fromContainer) return null;

  let mediaMsg, mediaType;
  if (fromContainer) {
    mediaMsg  = fromContainer.mediaMsg;
    mediaType = fromContainer.mediaType;
  } else {
    mediaMsg  = isImage ? quoted.imageMessage : quoted.videoMessage;
    mediaType = isImage ? 'image' : 'video';
  }

  try {
    const stream = await downloadContentFromMessage(mediaMsg, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    return { buf, isImage: mediaType === 'image', mediaMsg, mediaType };
  } catch (e) {
    console.error('[viewonce] download error:', e?.message);
    return null;
  }
}

function isViewOnceQuoted(quoted) {
  if (!quoted) return false;
  // Already unwrapped by index.js
  if (quoted.imageMessage || quoted.videoMessage) return true;
  // Still wrapped
  if (quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message) return true;
  return false;
}

module.exports = [
  {
    command: 'vv',
    aliases: ['viewonce', 'viewmedia', 'openvv'],
    category: 'general',
    description: 'Open view-once in current chat',
    usage: '.vv (reply to view-once)',

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!isViewOnceQuoted(quoted)) {
        return sock.sendMessage(chatId, {
          text: `👁️ Reply to a *view-once* message with *.vv* to open it here.` + FOOTER,
          ...ci,
        }, { quoted: message });
      }

      try {
        const result = await downloadViewOnceMedia(quoted);
        if (!result) throw new Error('Could not download');
        const { buf, isImage, mediaMsg } = result;
        const caption = (mediaMsg?.caption || '') + FOOTER;

        if (isImage) {
          await sock.sendMessage(chatId, { image: buf, caption, ...ci }, { quoted: message });
        } else {
          await sock.sendMessage(chatId, { video: buf, caption, mimetype: 'video/mp4', ...ci }, { quoted: message });
        }
      } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Could not open view-once. Try again.` + FOOTER, ...ci }, { quoted: message });
      }
    },
  },

  {
    command: 'vvdm',
    aliases: ['viewdm', 'vvpm', 'openvvdm'],
    category: 'general',
    description: 'Save view-once to OWNER private DM',
    usage: '.vvdm (reply to view-once)',

    async handler(sock, message, args, context = {}) {
      const chatId  = context.chatId || message.key.remoteJid;
      const ci      = getChannelInfo();

      // Always send to OWNER's DM (the bot's own number)
      const ownerJid = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';

      const sender    = message.key.participant || message.key.remoteJid;
      const senderNum = sender.split('@')[0];
      const isGroup   = chatId.endsWith('@g.us');

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!isViewOnceQuoted(quoted)) {
        return sock.sendMessage(chatId, {
          text: `👁️ Reply to a *view-once* message with *.vvdm* to save it to owner DM.` + FOOTER,
          ...ci,
        }, { quoted: message });
      }

      await sock.sendMessage(chatId, {
        text: `⏳ Saving to owner DM...`,
        ...ci,
      }, { quoted: message });

      try {
        const result = await downloadViewOnceMedia(quoted);
        if (!result) throw new Error('Could not download media');
        const { buf, isImage, mediaMsg } = result;

        // Get group name if applicable
        let groupName = '';
        if (isGroup) {
          try {
            const meta = await sock.groupMetadata(chatId);
            groupName = meta.subject || '';
          } catch {}
        }

        const caption =
          `╔═══════════════════════╗\n` +
          `║  👁️ *VIEW-ONCE SAVED*   ║\n` +
          `╚═══════════════════════╝\n\n` +
          `👤 *From:* @${senderNum}\n` +
          (groupName ? `👥 *Group:* ${groupName}\n` : '') +
          `📁 *Type:* ${isImage ? '🖼️ Image' : '🎬 Video'}\n` +
          `🕒 *Time:* ${new Date().toLocaleTimeString()}` +
          FOOTER;

        if (isImage) {
          await sock.sendMessage(ownerJid, {
            image: buf,
            caption,
            mentions: [sender],
          });
        } else {
          await sock.sendMessage(ownerJid, {
            video: buf,
            caption,
            mimetype: 'video/mp4',
            mentions: [sender],
          });
        }

        await sock.sendMessage(chatId, {
          text: `✅ *Saved to owner DM!*` + FOOTER,
          ...ci,
        }, { quoted: message });

      } catch (e) {
        console.error('[vvdm] error:', e?.message);
        await sock.sendMessage(chatId, {
          text: `❌ Failed: ${e?.message?.slice(0, 60) || 'unknown error'}` + FOOTER,
          ...ci,
        }, { quoted: message });
      }
    },
  },
];
