'use strict';
/**
 * EXODILE XD — .setgstatus
 * ✅ Group-only
 * ✅ Reply to media (image/video) or text → posts to status@broadcast
 * ✅ All group members can view
 * ✅ Correct Baileys quoted message extraction
 */
const { downloadContentFromMessage, proto } = require('@whiskeysockets/baileys');
const { getChannelInfo } = require('../lib/messageConfig');

// Get all contacts to include in statusJidList so they can see the status
// Without this, the status is posted but invisible to contacts
async function getStatusJidList(sock) {
  try {
    const store = require('../lib/lightweight_store');
    const contacts = Object.keys(store?.contacts || {});
    const jids = contacts.filter(j => j.endsWith('@s.whatsapp.net') && j !== sock?.user?.id);
    // WhatsApp requires at least 1 JID in the list
    if (jids.length === 0) {
      // fallback: use own JID so at least it posts
      const own = (sock?.user?.id || '').split(':')[0] + '@s.whatsapp.net';
      return [own];
    }
    return jids.slice(0, 500); // WA cap
  } catch {
    const own = (sock?.user?.id || '').split(':')[0] + '@s.whatsapp.net';
    return [own];
  }
}

const FOOTER =
  '\n\n> Exodile XD\n> Exodile Empire Inc.\n> Powered by Prime Killer Nova Kent';

function BOX(body) {
  return (
    `╔══════════════════════════════╗\n` +
    `   📤 ꜱᴇᴛ ɢʀᴏᴜᴘ ꜱᴛᴀᴛᴜꜱ\n` +
    `╚══════════════════════════════╝\n\n` +
    body + FOOTER
  );
}

// Download any media message to a Buffer
async function downloadMedia(mediaMsg, type) {
  const stream = await downloadContentFromMessage(mediaMsg, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buf = Buffer.concat(chunks);
  if (!buf || buf.length < 100) throw new Error('Empty media buffer');
  return buf;
}

// Extract the real quoted message from Baileys' contextInfo
function getQuoted(message) {
  const ctx =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.audioMessage?.contextInfo ||
    message?.message?.stickerMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo ||
    null;

  if (!ctx?.quotedMessage) return null;

  // Unwrap viewOnce if needed
  const qMsg = ctx.quotedMessage;
  const keys  = Object.keys(qMsg);
  const first = keys[0];

  if (first === 'viewOnceMessage' || first === 'viewOnceMessageV2') {
    const inner = qMsg[first]?.message;
    return inner || null;
  }
  return qMsg;
}

module.exports = {
  command: 'setgstatus',
  aliases: ['setstatus', 'poststatus', 'gstatus', 'setwastatus'],
  category: 'group',
  description: '📤 Reply to media/text in group → post it as WhatsApp Status',
  usage: '.setgstatus (reply to image/video/text)',
  groupOnly: true,    // ← only works in groups
  adminOnly: false,   // any group member can trigger (owner check is inside)
  ownerOnly: true,    // only bot owner/paired user

  async handler(sock, message, args, context = {}) {
    const chatId   = context.chatId || message.key.remoteJid;
    const ci       = getChannelInfo();
    const caption  = args.join(' ').trim();

    // ── Must be in a group ──────────────────────────────────────
    if (!chatId.endsWith('@g.us')) {
      return sock.sendMessage(chatId, {
        text: BOX('❌ This command only works in *groups*.\n\nUse it inside a group by replying to a message.'),
        ...ci
      }, { quoted: message });
    }

    // ── Extract quoted message ──────────────────────────────────
    const quoted = getQuoted(message);

    // ── No reply — show usage ───────────────────────────────────
    if (!quoted) {
      return sock.sendMessage(chatId, {
        text: BOX(
          '📌 *How to use:*\n\n' +
          '1️⃣ Find an image/video/text in the group\n' +
          '2️⃣ Reply to it with *.setgstatus*\n' +
          '3️⃣ It gets posted to your WhatsApp Status\n\n' +
          '• *.setgstatus* — reply to image\n' +
          '• *.setgstatus* — reply to video\n' +
          '• *.setgstatus Hello world* — reply to text with custom text'
        ), ...ci
      }, { quoted: message });
    }

    // ── Detect media type ───────────────────────────────────────
    const isImage   = !!(quoted.imageMessage);
    const isVideo   = !!(quoted.videoMessage);
    const isAudio   = !!(quoted.audioMessage);
    const isText    = !!(quoted.conversation || quoted.extendedTextMessage?.text);
    const isSticker = !!(quoted.stickerMessage);

    // ── TEXT STATUS ─────────────────────────────────────────────
    if (isText) {
      const text = caption ||
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        '';
      if (!text.trim()) {
        return sock.sendMessage(chatId, {
          text: BOX('❌ No text found in the quoted message.'), ...ci
        }, { quoted: message });
      }
      try {
        const jidList = await getStatusJidList(sock);
        await sock.sendMessage('status@broadcast', {
          text,
          backgroundColor: randomColor(),
          font: Math.floor(Math.random() * 5),
          statusJidList: jidList,
        });
        return sock.sendMessage(chatId, {
          text: BOX(`✅ *Text status posted!*\n\n📝 "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`),
          ...ci
        }, { quoted: message });
      } catch (e) {
        return sock.sendMessage(chatId, {
          text: BOX(`❌ Failed to post text status:\n${e.message}`), ...ci
        }, { quoted: message });
      }
    }

    // ── IMAGE STATUS ────────────────────────────────────────────
    if (isImage) {
      try {
        await sock.sendMessage(chatId, {
          text: '⏳ Posting image to status...', ...ci
        }, { quoted: message });

        const buf = await downloadMedia(quoted.imageMessage, 'image');
        const cap = caption || quoted.imageMessage?.caption || '';

        const jidList = await getStatusJidList(sock);
        await sock.sendMessage('status@broadcast', {
          image: buf,
          caption: cap,
          statusJidList: jidList,
        });

        return sock.sendMessage(chatId, {
          text: BOX(`✅ *Image status posted!*\n\n🖼️ Posted to your WhatsApp Status\n${cap ? `📝 Caption: ${cap.slice(0, 60)}` : ''}`),
          ...ci
        }, { quoted: message });
      } catch (e) {
        return sock.sendMessage(chatId, {
          text: BOX(`❌ Failed to post image status:\n${e.message}`), ...ci
        }, { quoted: message });
      }
    }

    // ── VIDEO STATUS ────────────────────────────────────────────
    if (isVideo) {
      try {
        await sock.sendMessage(chatId, {
          text: '⏳ Posting video to status... (this may take a moment)', ...ci
        }, { quoted: message });

        const buf = await downloadMedia(quoted.videoMessage, 'video');
        const cap = caption || quoted.videoMessage?.caption || '';

        const jidList = await getStatusJidList(sock);
        await sock.sendMessage('status@broadcast', {
          video: buf,
          caption: cap,
          gifPlayback: false,
          mimetype: 'video/mp4',
          statusJidList: jidList,
        });

        return sock.sendMessage(chatId, {
          text: BOX(`✅ *Video status posted!*\n\n🎬 Posted to your WhatsApp Status\n${cap ? `📝 Caption: ${cap.slice(0, 60)}` : ''}`),
          ...ci
        }, { quoted: message });
      } catch (e) {
        return sock.sendMessage(chatId, {
          text: BOX(`❌ Failed to post video status:\n${e.message}`), ...ci
        }, { quoted: message });
      }
    }

    // ── AUDIO STATUS ────────────────────────────────────────────
    if (isAudio) {
      try {
        await sock.sendMessage(chatId, {
          text: '⏳ Posting audio to status...', ...ci
        }, { quoted: message });

        const buf = await downloadMedia(quoted.audioMessage, 'audio');

        const jidList = await getStatusJidList(sock);
        await sock.sendMessage('status@broadcast', {
          audio: buf,
          mimetype: 'audio/mp4',
          ptt: false,
          statusJidList: jidList,
        });

        return sock.sendMessage(chatId, {
          text: BOX('✅ *Audio status posted!*\n\n🎵 Posted to your WhatsApp Status'),
          ...ci
        }, { quoted: message });
      } catch (e) {
        return sock.sendMessage(chatId, {
          text: BOX(`❌ Failed to post audio status:\n${e.message}`), ...ci
        }, { quoted: message });
      }
    }

    // ── STICKER → convert to image status ──────────────────────
    if (isSticker) {
      try {
        await sock.sendMessage(chatId, {
          text: '⏳ Converting sticker to status...', ...ci
        }, { quoted: message });

        const buf = await downloadMedia(quoted.stickerMessage, 'sticker');

        const jidList = await getStatusJidList(sock);
        await sock.sendMessage('status@broadcast', {
          image: buf,
          caption: caption || '',
          statusJidList: jidList,
        });

        return sock.sendMessage(chatId, {
          text: BOX('✅ *Sticker posted as status!*\n\n🎭 Posted to your WhatsApp Status'),
          ...ci
        }, { quoted: message });
      } catch (e) {
        return sock.sendMessage(chatId, {
          text: BOX(`❌ Failed to post sticker status:\n${e.message}`), ...ci
        }, { quoted: message });
      }
    }

    return sock.sendMessage(chatId, {
      text: BOX('❌ Unsupported media type.\n\nReply to an *image*, *video*, *audio*, or *text*.'),
      ...ci
    }, { quoted: message });
  }
};

function randomColor() {
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FECA57','#FF9FF3','#54A0FF','#5F27CD','#00D2D3','#FF9F43','#EA2027','#006266'];
  return colors[Math.floor(Math.random() * colors.length)];
}
