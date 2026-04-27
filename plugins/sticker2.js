'use strict';
/**
 * 𝗭𝗘𝗡𝗧𝗥𝗜𝗫 𝗠𝗗 𝗩𝟭 — sticker2
 * ᴄᴏɴᴠᴇʀᴛ ɪᴍᴀɢᴇ/ᴠɪᴅᴇᴏ → sᴛɪᴄᴋᴇʀ ᴡɪᴛʜ ʙᴏᴛ ʙʀᴀɴᴅɪɴɢ
 */
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const settings = require('../settings');
const webp   = require('node-webpmux');
const crypto = require('crypto');
const { getChannelInfo } = require('../lib/messageConfig');

function buildExif(packname, author) {
  const json = {
    'sticker-pack-id':        crypto.randomBytes(16).toString('hex'),
    'sticker-pack-name':      packname,
    'sticker-pack-publisher': author,
    'emojis': ['✦'],
  };
  const exifAttr = Buffer.from([
    0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
    0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
    0x00,0x00,0x16,0x00,0x00,0x00,
  ]);
  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  const exif    = Buffer.concat([exifAttr, jsonBuf]);
  exif.writeUIntLE(jsonBuf.length, 14, 4);
  return exif;
}

module.exports = {
  command: 'sticker2',
  aliases: ['s2', 'stik2'],
  category: 'stickers',
  description: 'ᴄᴏɴᴠᴇʀᴛ ɪᴍᴀɢᴇ/ᴠɪᴅᴇᴏ ᴛᴏ sᴛɪᴄᴋᴇʀ',
  usage: '.sticker2 (ʀᴇᴘʟʏ ᴛᴏ ɪᴍᴀɢᴇ/ᴠɪᴅᴇᴏ)',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    let   target = message;

    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const ctx = message.message.extendedTextMessage.contextInfo;
      target = { key: { remoteJid: chatId, id: ctx.stanzaId, participant: ctx.participant }, message: ctx.quotedMessage };
    }

    const media = target.message?.imageMessage || target.message?.videoMessage;
    if (!media) return sock.sendMessage(chatId, { text: '᭄ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ ᴏʀ ᴠɪᴅᴇᴏ.', ...ci }, { quoted: message });

    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    try {
      const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: { info(){},warn(){},error(){},debug(){},trace(){},child(){ return this; } }, reuploadRequest: sock.updateMediaMessage });
      if (!buf) throw new Error('Download failed');

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const inp = path.join(tmpDir, `si_${Date.now()}`);
      const out = path.join(tmpDir, `so_${Date.now()}.webp`);
      fs.writeFileSync(inp, buf);

      const isAnim = media.mimetype?.includes('video') || media.mimetype?.includes('gif') || (media.seconds > 0);

      const ffCmd = isAnim
        ? `ffmpeg -y -i "${inp}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 "${out}"`
        : `ffmpeg -y -i "${inp}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -pix_fmt yuva420p -quality 80 "${out}"`;

      await new Promise((res, rej) => exec(ffCmd, e => e ? rej(e) : res()));

      let webpBuf = fs.readFileSync(out);
      try {
        const img = new webp.Image();
        await img.load(webpBuf);
        img.exif = buildExif(settings.packname, settings.author);
        webpBuf = await img.save(null);
      } catch {}

      await sock.sendMessage(chatId, { sticker: webpBuf, ...ci }, { quoted: message });
      await sock.sendMessage(chatId, { react: { text: '✦', key: message.key } });

      try { fs.unlinkSync(inp); fs.unlinkSync(out); } catch {}
    } catch (err) {
      await sock.sendMessage(chatId, { text: `❒ sᴛɪᴄᴋᴇʀ ꜰᴀɪʟᴇᴅ: ${err.message}`, ...ci }, { quoted: message });
    }
  }
};
