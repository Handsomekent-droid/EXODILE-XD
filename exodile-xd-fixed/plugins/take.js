'use strict';
/**
 * .take / .steal — ʀᴇɴᴀᴍᴇ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ
 * Bot name always included in pack metadata
 */
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp   = require('node-webpmux');
const crypto = require('crypto');
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

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
  const jBuf = Buffer.from(JSON.stringify(json), 'utf8');
  const exif = Buffer.concat([exifAttr, jBuf]);
  exif.writeUIntLE(jBuf.length, 14, 4);
  return exif;
}

module.exports = {
  command: 'take',
  aliases: ['steal', 'rename', 'wm'],
  category: 'stickers',
  description: 'ʀᴇɴᴀᴍᴇ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ',
  usage: '.take <ᴘᴀᴄᴋ ɴᴀᴍᴇ>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.stickerMessage)
      return sock.sendMessage(chatId, { text: `᭄ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ\n᭄ ᴇx: .take ᴇxᴏᴅɪᴄ ᴘᴏᴛᴇɴᴛɪᴀʟ`, ...ci }, { quoted: message });

    const userPack = args.join(' ').trim();
    // Always embed bot name so every sticker has bot branding
    const packname = userPack
      ? `${userPack} | ${settings.packname}`
      : settings.packname;
    const author = settings.author;

    try {
      await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

      const stickerBuf = await downloadMediaMessage(
        {
          key:     { ...message.key, id: message.message.extendedTextMessage.contextInfo.stanzaId },
          message: quoted,
        },
        'buffer', {},
        {
          logger: { info(){},warn(){},error(){},debug(){},trace(){},child(){ return this; } },
          reuploadRequest: sock.updateMediaMessage,
        }
      );

      if (!stickerBuf?.length) throw new Error('Download failed');

      const img = new webp.Image();
      await img.load(stickerBuf);
      img.exif = buildExif(packname, author);
      const final = await img.save(null);

      await sock.sendMessage(chatId, { sticker: final, ...ci }, { quoted: message });
      await sock.sendMessage(chatId, {
        text:
          `╔══════════════════════════════╗\n` +
          `║  𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿 — *.take*        ║\n` +
          `╚══════════════════════════════╝\n\n` +
          `᭄ ᴘᴀᴄᴋ: *${packname}*\n` +
          `᭄ ᴀᴜᴛʜᴏʀ: *${author}*`,
        ...ci,
      }, { quoted: message });
      await sock.sendMessage(chatId, { react: { text: '✦', key: message.key } });
    } catch (err) {
      await sock.sendMessage(chatId, { text: `❒ ꜰᴀɪʟᴇᴅ: ${err.message}`, ...ci }, { quoted: message });
    }
  }
};
