'use strict';
/**
 * EXODILE XD — .toimg & .tovid
 * .toimg — convert a sticker (static WebP) → JPEG image
 * .tovid — convert an animated sticker (animated WebP) → MP4 video
 *
 * Both commands work by replying to a sticker message.
 */
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec }  = require('child_process');
const fs        = require('fs');
const path      = require('path');
const { getChannelInfo } = require('../lib/messageConfig');

const TMP_DIR = path.join(process.cwd(), 'tmp');
function ensureTmp() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function run(cmd) {
  return new Promise((res, rej) =>
    exec(cmd, { timeout: 60000 }, (err, stdout, stderr) =>
      err ? rej(new Error(stderr || err.message)) : res(stdout)
    )
  );
}

// Resolve quoted or current message for sticker
function resolveTarget(message) {
  const ext = message.message?.extendedTextMessage?.contextInfo;
  if (ext?.quotedMessage) {
    return {
      key: {
        remoteJid:   message.key.remoteJid,
        id:          ext.stanzaId,
        participant: ext.participant,
      },
      message: ext.quotedMessage,
    };
  }
  return message;
}

// ── .toimg ──────────────────────────────────────────────────────
const toimg = {
  command: 'toimg',
  aliases: ['stickertoimg', 'sticker2img', 'webp2img', 'unwebp'],
  category: 'stickers',
  description: '🖼️ Convert sticker → image (JPEG)',
  usage: '.toimg (reply to any sticker)',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    const target = resolveTarget(message);
    const sticker = target.message?.stickerMessage;

    if (!sticker) {
      return sock.sendMessage(chatId, {
        text:
          `╔══════════════════════╗\n` +
          `║  🖼️ sᴛɪᴄᴋᴇʀ → ɪᴍᴀɢᴇ  ║\n` +
          `╚══════════════════════╝\n\n` +
          `᭄ Reply to a *sticker* with *.toimg*\n` +
          `᭄ The sticker will be sent back as an image.\n\n` +
          `> Exodile XD | Dev Prime Killer Nova Kent`,
        ...ci
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    try {
      ensureTmp();
      const buf = await downloadMediaMessage(
        target, 'buffer', {},
        { logger: { info(){}, warn(){}, error(){}, debug(){}, trace(){}, child() { return this; } },
          reuploadRequest: sock.updateMediaMessage }
      );
      if (!buf) throw new Error('Failed to download sticker');

      const isAnimated = sticker.isAnimated || false;
      const inp = path.join(TMP_DIR, `toimg_in_${Date.now()}.webp`);
      const out = path.join(TMP_DIR, `toimg_out_${Date.now()}.jpg`);
      fs.writeFileSync(inp, buf);

      if (isAnimated) {
        // Grab first frame of animated sticker
        await run(`ffmpeg -y -i "${inp}" -vframes 1 -q:v 2 "${out}"`);
      } else {
        // Static webp → jpg
        await run(`ffmpeg -y -i "${inp}" -q:v 2 "${out}"`);
      }

      const imgBuf = fs.readFileSync(out);
      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      await sock.sendMessage(chatId, {
        image:   imgBuf,
        caption: `᭄ 🖼️ *Sticker → Image* done!\n> Exodile XD | Dev Prime Killer Nova Kent`,
        ...ci
      }, { quoted: message });

      try { fs.unlinkSync(inp); fs.unlinkSync(out); } catch {}

    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: `᭄ ❌ toimg failed: ${err.message.slice(0, 80)}\n᭄ Make sure you reply to a sticker.`,
        ...ci
      }, { quoted: message });
    }
  }
};

// ── .tovid ──────────────────────────────────────────────────────
const tovid = {
  command: 'tovid',
  aliases: ['stickertovid', 'sticker2vid', 'webp2mp4', 'stickvid'],
  category: 'stickers',
  description: '🎬 Convert animated sticker → MP4 video',
  usage: '.tovid (reply to animated sticker)',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    const target  = resolveTarget(message);
    const sticker = target.message?.stickerMessage;

    if (!sticker) {
      return sock.sendMessage(chatId, {
        text:
          `╔══════════════════════╗\n` +
          `║  🎬 sᴛɪᴄᴋᴇʀ → ᴠɪᴅᴇᴏ  ║\n` +
          `╚══════════════════════╝\n\n` +
          `᭄ Reply to an *animated sticker* with *.tovid*\n` +
          `᭄ The sticker will be sent as an MP4 video.\n\n` +
          `> Exodile XD | Dev Prime Killer Nova Kent`,
        ...ci
      }, { quoted: message });
    }

    if (!sticker.isAnimated) {
      return sock.sendMessage(chatId, {
        text:
          `᭄ ⚠️ That sticker is *not animated*.\n` +
          `᭄ Use *.toimg* to convert it to an image instead.\n` +
          `> Exodile XD`,
        ...ci
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    try {
      ensureTmp();
      const buf = await downloadMediaMessage(
        target, 'buffer', {},
        { logger: { info(){}, warn(){}, error(){}, debug(){}, trace(){}, child() { return this; } },
          reuploadRequest: sock.updateMediaMessage }
      );
      if (!buf) throw new Error('Failed to download sticker');

      const inp = path.join(TMP_DIR, `tovid_in_${Date.now()}.webp`);
      const out = path.join(TMP_DIR, `tovid_out_${Date.now()}.mp4`);
      fs.writeFileSync(inp, buf);

      // Convert animated WebP → MP4
      // Scale to 512x512 keeping aspect, add black background, re-encode as H264
      await run(
        `ffmpeg -y -i "${inp}" ` +
        `-vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" ` +
        `-c:v libx264 -preset fast -crf 23 -movflags +faststart "${out}"`
      );

      const vidBuf = fs.readFileSync(out);
      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      await sock.sendMessage(chatId, {
        video:    vidBuf,
        mimetype: 'video/mp4',
        fileName: 'sticker.mp4',
        caption:  `᭄ 🎬 *Sticker → Video* done!\n> Exodile XD | Dev Prime Killer Nova Kent`,
        ...ci
      }, { quoted: message });

      try { fs.unlinkSync(inp); fs.unlinkSync(out); } catch {}

    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: `᭄ ❌ tovid failed: ${err.message.slice(0, 80)}\n᭄ Make sure you reply to an *animated sticker*.`,
        ...ci
      }, { quoted: message });
    }
  }
};

// Export both commands from one file
module.exports = [toimg, tovid];
