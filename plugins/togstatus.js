'use strict';
/**
 * EXODILE XD — .togstatus
 *
 * Reply to ANY message (text, image, or video) with .togstatus
 * → Bot posts that content to status@broadcast so every contact/member can see it.
 *
 * Works with:
 *   - Text messages   → posted as coloured text status
 *   - Image messages  → posted as image status (caption preserved)
 *   - Video messages  → posted as video status (caption preserved)
 *
 * Usage:
 *   Reply to a message → .togstatus
 *   OR: .togstatus <type some text>  → posts that text directly
 */

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getChannelInfo } = require('../lib/messageConfig');
const store = require('../lib/lightweight_store');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

const BG_COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#FECA57','#FF9FF3',
  '#54A0FF','#5F27CD','#00D2D3','#FF9F43','#EA2027',
  '#006266','#1e3799','#b71540','#079992','#e55039',
];

function randomBg() {
  return BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
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

async function dlMedia(msgContent, type) {
  const stream = await downloadContentFromMessage(msgContent, type);
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  const buf = Buffer.concat(chunks);
  if (!buf || buf.length < 50) throw new Error('Empty media buffer');
  return buf;
}

function confirmCard(label, preview) {
  return (
    `✅ *${label}*\n\n` +
    `📄 "${preview}"\n\n` +
    `👥 Visible to all contacts\n` +
    FOOTER
  );
}

module.exports = {
  command: 'togstatus',
  aliases: ['poststatus', 'statusup', 'upstatus', 'gcstatus'],
  category: 'owner',
  description: '📤 Reply to text/image/video → post it to WhatsApp Status',
  usage: '.togstatus (reply to message) OR .togstatus <text>',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    const quoted = getQuoted(message);
    const typedText = args.join(' ').trim();

    // ── No reply and no text → show usage ─────────────────────
    if (!quoted && !typedText) {
      return sock.sendMessage(chatId, {
        text:
          `╔══════════════════════════════╗\n` +
          `║   📤 .togstatus — Post Status   ║\n` +
          `╚══════════════════════════════╝\n\n` +
          `*Reply* to any message with *.togstatus* to post it to your WhatsApp Status so every contact can see it.\n\n` +
          `*Supports:*\n` +
          `• 💬 Text messages\n` +
          `• 🖼️ Images (with caption)\n` +
          `• 🎥 Videos (with caption)\n\n` +
          `*Or type text directly:*\n` +
          `• .togstatus Hello world!\n` +
          FOOTER,
        ...ci
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    try {
      const jidList = await getJidList(sock);

      // ── Image ─────────────────────────────────────────────────
      if (quoted?.imageMessage) {
        await sock.sendMessage(chatId, {
          text: `⏳ Uploading image to status...`, ...ci
        }, { quoted: message });

        const cap = quoted.imageMessage.caption || typedText || '';
        const buf = await dlMedia(quoted.imageMessage, 'image');

        await sock.sendMessage('status@broadcast', {
          image: buf,
          caption: cap,
          statusJidList: jidList,
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        return sock.sendMessage(chatId, {
          text: confirmCard(
            'Image posted to Status!',
            cap ? `Caption: ${cap.slice(0, 60)}` : 'No caption'
          ),
          ...ci
        }, { quoted: message });
      }

      // ── Video ─────────────────────────────────────────────────
      if (quoted?.videoMessage) {
        const size = quoted.videoMessage.fileLength || 0;
        if (size > 15 * 1024 * 1024) {
          await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
          return sock.sendMessage(chatId, {
            text: `❌ Video is too large for WhatsApp Status (max 15MB).\nTry a shorter clip.`,
            ...ci
          }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
          text: `⏳ Uploading video to status...`, ...ci
        }, { quoted: message });

        const cap = quoted.videoMessage.caption || typedText || '';
        const buf = await dlMedia(quoted.videoMessage, 'video');

        await sock.sendMessage('status@broadcast', {
          video: buf,
          caption: cap,
          gifPlayback: false,
          mimetype: 'video/mp4',
          statusJidList: jidList,
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        return sock.sendMessage(chatId, {
          text: confirmCard(
            'Video posted to Status!',
            cap ? `Caption: ${cap.slice(0, 60)}` : 'No caption'
          ),
          ...ci
        }, { quoted: message });
      }

      // ── Text (from reply or typed directly) ───────────────────
      const text =
        typedText ||
        quoted?.conversation ||
        quoted?.extendedTextMessage?.text ||
        '';

      if (!text) {
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        return sock.sendMessage(chatId, {
          text: `❌ No text found.\nReply to a text/image/video message or type: *.togstatus <your text>*`,
          ...ci
        }, { quoted: message });
      }

      await sock.sendMessage('status@broadcast', {
        text: text.slice(0, 700),
        backgroundColor: randomBg(),
        font: Math.floor(Math.random() * 5),
        statusJidList: jidList,
      });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      return sock.sendMessage(chatId, {
        text: confirmCard(
          'Text posted to Status!',
          text.slice(0, 80) + (text.length > 80 ? '...' : '')
        ),
        ...ci
      }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      return sock.sendMessage(chatId, {
        text:
          `❌ *Failed to post status*\n\n` +
          `Error: ${err.message.slice(0, 80)}\n\n` +
          `💡 Tips:\n` +
          `• Make sure bot is connected\n` +
          `• Video must be under 15MB\n` +
          `• Reply directly to the message`,
        ...ci
      }, { quoted: message });
    }
  }
};
