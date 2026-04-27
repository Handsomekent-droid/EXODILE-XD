'use strict';
/**
 * EXODILE XD — .tosgroup & .tosmedia
 *
 * .tosgroup <text>          — post a custom text as WhatsApp Status from group
 * .tosgroup                 — reply to any message → posts its text as status
 * .tosmedia                 — reply to image/video → posts as media status
 *
 * What you saw in the screenshot:
 *   1. Someone sends .tosgroup in a group (with text or reply)
 *   2. Bot posts it to status@broadcast (visible to ALL contacts)
 *   3. Bot confirms in the group: "✅ Text status posted to group!"
 *      showing the content and "Visible to all group members"
 *   — This matches exactly the WhatsApp system message style shown
 */

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getChannelInfo } = require('../lib/messageConfig');
const store = require('../lib/lightweight_store');

// ── Helpers ────────────────────────────────────────────────────
function randomBg() {
  const colors = [
    '#FF6B6B','#4ECDC4','#45B7D1','#FECA57','#FF9FF3',
    '#54A0FF','#5F27CD','#00D2D3','#FF9F43','#EA2027',
    '#006266','#1e3799','#b71540','#079992','#e55039',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function getJidList(sock) {
  try {
    const contacts = Object.keys(store?.contacts || {});
    const jids = contacts.filter(j => j.endsWith('@s.whatsapp.net') && j !== sock?.user?.id);
    if (jids.length === 0) {
      const own = (sock?.user?.id || '').split(':')[0] + '@s.whatsapp.net';
      return [own];
    }
    return jids.slice(0, 500);
  } catch {
    const own = (sock?.user?.id || '').split(':')[0] + '@s.whatsapp.net';
    return [own];
  }
}

function getQuoted(message) {
  const ctx =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    null;
  if (!ctx?.quotedMessage) return null;
  const q = ctx.quotedMessage;
  const k = Object.keys(q)[0];
  if (k === 'viewOnceMessage' || k === 'viewOnceMessageV2') return q[k]?.message || null;
  return q;
}

async function dlMedia(msg, type) {
  const stream = await downloadContentFromMessage(msg, type);
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  const buf = Buffer.concat(chunks);
  if (!buf || buf.length < 50) throw new Error('Empty media');
  return buf;
}

// ── Confirmation card sent in the group (matches screenshot style) ─
function confirmCard(label, preview) {
  return (
    `✅ *${label}*\n\n` +
    `📄 "${preview}"\n\n` +
    `👥 Visible to all group members\n\n` +
    `> 🔥 Exodile XD | Dev Prime Killer Nova Kent`
  );
}

// ── .tosgroup ──────────────────────────────────────────────────
const tosgroup = {
  command: 'tosgroup',
  aliases: ['tostatus', 'textstatus', 'statustext', 'tos'],
  category: 'owner',
  description: '📤 Post text as WhatsApp Status from group',
  usage: '.tosgroup <text> OR reply to a message',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    // Determine the text to post
    let text = args.join(' ').trim();

    // If no text typed, try quoted message
    if (!text) {
      const quoted = getQuoted(message);
      if (quoted) {
        text =
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          '';
      }
    }

    if (!text) {
      return sock.sendMessage(chatId, {
        text:
          `╔═══════════════════════════╗\n` +
          `║  📤 .tosgroup — Text Status  ║\n` +
          `╚═══════════════════════════╝\n\n` +
          `*Usage:*\n` +
          `• .tosgroup Hello world!  — posts that text\n` +
          `• Reply to any text with .tosgroup\n\n` +
          `*For media use:*\n` +
          `• .tosmedia — reply to image/video\n\n` +
          `> 🔥 Exodile XD | Dev Prime Killer Nova Kent`,
        ...ci
      }, { quoted: message });
    }

    // React to show it's working
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    try {
      const jidList = await getJidList(sock);

      await sock.sendMessage('status@broadcast', {
        text,
        backgroundColor: randomBg(),
        font: Math.floor(Math.random() * 5),
        statusJidList: jidList,
      });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

      // Send the confirmation card exactly like in the screenshot
      await sock.sendMessage(chatId, {
        text: confirmCard(
          'Text status posted to group!',
          text.slice(0, 80) + (text.length > 80 ? '...' : '')
        ),
        ...ci
      }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text:
          `❌ *Failed to post status*\n\n` +
          `Error: ${err.message.slice(0, 80)}\n\n` +
          `💡 Make sure the bot is properly connected and has contacts.`,
        ...ci
      }, { quoted: message });
    }
  }
};

// ── .tosmedia ─────────────────────────────────────────────────
const tosmedia = {
  command: 'tosmedia',
  aliases: ['mediastatus', 'imgstatus', 'vidstatus', 'mediatogroup'],
  category: 'owner',
  description: '📤 Post image/video as WhatsApp Status from group',
  usage: '.tosmedia (reply to image or video)',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const caption = args.join(' ').trim();

    const quoted = getQuoted(message);

    if (!quoted) {
      return sock.sendMessage(chatId, {
        text:
          `╔════════════════════════════╗\n` +
          `║  📤 .tosmedia — Media Status  ║\n` +
          `╚════════════════════════════╝\n\n` +
          `Reply to an *image* or *video* with *.tosmedia*\n` +
          `Optionally add caption: *.tosmedia My caption*\n\n` +
          `> 🔥 Exodile XD | Dev Prime Killer Nova Kent`,
        ...ci
      }, { quoted: message });
    }

    const isImage = !!quoted.imageMessage;
    const isVideo = !!quoted.videoMessage;

    if (!isImage && !isVideo) {
      return sock.sendMessage(chatId, {
        text: `❌ Reply to an *image* or *video*.\nFor text use *.tosgroup <text>*`,
        ...ci
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    await sock.sendMessage(chatId, {
      text: `⏳ Uploading ${isImage ? 'image' : 'video'} to status...`,
      ...ci
    }, { quoted: message });

    try {
      const jidList = await getJidList(sock);
      const cap = caption || (isImage ? quoted.imageMessage?.caption : quoted.videoMessage?.caption) || '';

      if (isImage) {
        const buf = await dlMedia(quoted.imageMessage, 'image');
        await sock.sendMessage('status@broadcast', {
          image: buf,
          caption: cap,
          statusJidList: jidList,
        });
      } else {
        const buf = await dlMedia(quoted.videoMessage, 'video');
        await sock.sendMessage('status@broadcast', {
          video: buf,
          caption: cap,
          gifPlayback: false,
          mimetype: 'video/mp4',
          statusJidList: jidList,
        });
      }

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

      await sock.sendMessage(chatId, {
        text: confirmCard(
          `${isImage ? 'Image' : 'Video'} status posted to group!`,
          cap ? `Caption: ${cap.slice(0, 60)}` : `No caption — posted as ${isImage ? 'image' : 'video'}`
        ),
        ...ci
      }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text:
          `❌ *Failed to post media status*\n\n` +
          `Error: ${err.message.slice(0, 80)}\n\n` +
          `💡 Tips:\n` +
          `• Make sure you reply to the media directly\n` +
          `• Video must be under 15MB for WhatsApp status\n` +
          `• Try with an image first`,
        ...ci
      }, { quoted: message });
    }
  }
};

module.exports = [tosgroup, tosmedia];
