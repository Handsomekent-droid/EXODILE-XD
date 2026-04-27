'use strict';
/**
 * EXODILE XD — Auto View-Once Saver v3 (FIXED)
 *
 * IMPORTANT: Must be called with the ORIGINAL (wrapped) message BEFORE
 * index.js strips the viewOnceMessage/viewOnceMessageV2 container.
 * This is because downloadContentFromMessage needs the original keys.
 *
 * Called from index.js BEFORE unwrapping.
 */

const fs   = require('fs');
const path = require('path');

const CONFIG_DIR  = path.join(__dirname, '../data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'autoViewOnce.json'); // legacy global fallback
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗔𝗨𝗧𝗢 𝗩𝗜𝗘𝗪𝗢𝗡𝗖𝗘';

// Per-session config: data/autoViewOnce_<botNum>.json
function cfgPath(botNum) {
  return path.join(CONFIG_DIR, `autoViewOnce_${botNum || 'global'}.json`);
}

function loadConfig(botNum) {
  const p = botNum ? cfgPath(botNum) : CONFIG_PATH;
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8').trim();
      if (raw) return JSON.parse(raw);
    }
    // migrate from legacy global file
    if (botNum && fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8').trim();
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return { enabled: false };
}

function saveConfig(cfg, botNum) {
  const p = botNum ? cfgPath(botNum) : CONFIG_PATH;
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
  } catch (e) { console.error('[autoViewOnce] saveConfig error:', e?.message); }
}

function isEnabled(botNum) {
  return loadConfig(botNum).enabled === true;
}

/**
 * Called with the ORIGINAL message (before unwrapping).
 * message.message must still contain viewOnceMessage or viewOnceMessageV2.
 */
async function handleViewOnce(sock, message) {
  try {
    const botNum = (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
    if (!isEnabled(botNum)) return;

    const msg = message.message;
    if (!msg) return;

    // Support both viewOnceMessage and viewOnceMessageV2
    const voInner =
      msg.viewOnceMessageV2?.message ||
      msg.viewOnceMessageV2Extension?.message ||
      msg.viewOnceMessage?.message;

    if (!voInner) return; // not a view-once

    const isImage = !!voInner.imageMessage;
    const isVideo = !!voInner.videoMessage;
    if (!isImage && !isVideo) return;

    const mediaMsg  = isImage ? voInner.imageMessage : voInner.videoMessage;
    const mediaType = isImage ? 'image' : 'video';

    // Get sender + owner info
    const sender    = message.key.participant || message.key.remoteJid;
    const senderNum = sender.split('@')[0];
    const chatId    = message.key.remoteJid;
    const isGroup   = chatId.endsWith('@g.us');
    const rawId = sock.user?.id || '';
    const ownerJid = rawId.includes(':') ? rawId.split(':')[0] + '@s.whatsapp.net' : rawId.includes('@') ? rawId : rawId + '@s.whatsapp.net';

    // Don't forward if owner is the sender in own DM
    if (!isGroup && chatId === ownerJid) return;

    // Get group name if applicable
    let groupName = '';
    if (isGroup) {
      try {
        const meta = await sock.groupMetadata(chatId);
        groupName  = meta.subject || '';
      } catch {}
    }

    // Download the media
    let buf;
    try {
      const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
      const stream = await downloadContentFromMessage(mediaMsg, mediaType);
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      buf = Buffer.concat(chunks);
    } catch (e) {
      console.error('[autoViewOnce] download error:', e?.message);
      return;
    }

    if (!buf || buf.length < 100) return;

    const timeStr = new Date().toLocaleString('en-US', {
      hour12: true, hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: 'short',
    });

    const caption =
      `╔══════════════════════╗\n` +
      `║  👁️ *VIEW-ONCE SAVED*  ║\n` +
      `╚══════════════════════╝\n\n` +
      `👤 *From:* @${senderNum}\n` +
      (groupName ? `👥 *Group:* ${groupName}\n` : `💬 *DM Chat*\n`) +
      `📁 *Type:* ${isImage ? '🖼️ Image' : '🎬 Video'}\n` +
      `🕒 *Time:* ${timeStr}` +
      FOOTER;

    if (isImage) {
      await sock.sendMessage(ownerJid, { image: buf, caption, mentions: [sender] });
    } else {
      await sock.sendMessage(ownerJid, { video: buf, caption, mimetype: 'video/mp4', mentions: [sender] });
    }

    console.log(`[autoViewOnce] ✅ Saved ${mediaType} from @${senderNum} → owner DM`);

  } catch (err) {
    console.error('[autoViewOnce] error:', err?.message);
  }
}

module.exports = { handleViewOnce, isEnabled, loadConfig, saveConfig };
