'use strict';
const axios  = require('axios');
const webp   = require('node-webpmux');
const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');
const { getChannelInfo } = require('../lib/messageConfig');

const AUTHOR   = 'Տᕼᗩᑎ KᗴᑎT';
const PACKNAME = 'ᗴ᙭OᗪIᑕ ᗴ᙭TᖇᗩᑕTIOᑎ';
const TEMP     = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

function buildExif(packname, author) {
  const json = {
    'sticker-pack-id':        crypto.randomBytes(16).toString('hex'),
    'sticker-pack-name':      packname,
    'sticker-pack-publisher': author,
    'emojis':                 ['✨'],
  };
  const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
  const jsonBuf  = Buffer.from(JSON.stringify(json), 'utf8');
  const exif     = Buffer.concat([exifAttr, jsonBuf]);
  exif.writeUIntLE(jsonBuf.length, 14, 4);
  return exif;
}

async function toStickerBuf(buf) {
  const img = new webp.Image();
  await img.load(buf);
  img.exif = buildExif(PACKNAME, AUTHOR);
  return await img.save(null);
}

function parseSlug(input) {
  input = input.trim();
  const m = input.match(/(?:t\.me\/addstickers\/|t\.me\/)([A-Za-z0-9_]+)/) || input.match(/^([A-Za-z0-9_]+)$/);
  return m ? m[1] : null;
}

async function fetchPack(slug) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${token}/getStickerSet?name=${slug}`, { timeout: 15000 });
    return data.ok ? data.result : null;
  } catch { return null; }
}

async function getFileUrl(fileId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`, { timeout: 10000 });
    return data.ok ? `https://api.telegram.org/file/bot${token}/${data.result.file_path}` : null;
  } catch { return null; }
}

module.exports = {
  command: 'tgsticker',
  aliases: ['tgs', 'tgpack', 'telesticker'],
  category: 'stickers',
  description: 'ɢᴇᴛ ᴛᴇʟᴇɢʀᴀᴍ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ',
  usage: '.tgsticker <ʟɪɴᴋ ᴏʀ ᴘᴀᴄᴋ ɴᴀᴍᴇ>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const input  = args.join(' ').trim();

    if (!input) {
      return sock.sendMessage(chatId, {
        text: `𖤐 sᴇɴᴅ ᴀ ᴛᴇʟᴇɢʀᴀᴍ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ ʟɪɴᴋ ᴏʀ ᴘᴀᴄᴋ ɴᴀᴍᴇ\n𖤐 ᴇxᴀᴍᴘʟᴇ: .tgsticker https://t.me/addstickers/PackName`,
        ...ci,
      }, { quoted: message });
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return sock.sendMessage(chatId, {
        text: `𖤐 ᴀᴅᴅ *TELEGRAM_BOT_TOKEN* ᴛᴏ ʏᴏᴜʀ .ᴇɴᴠ ꜰɪʟᴇ ᴛᴏ ᴜsᴇ ᴛʜɪs`,
        ...ci,
      }, { quoted: message });
    }

    const slug = parseSlug(input);
    if (!slug) {
      return sock.sendMessage(chatId, {
        text: `𖤐 ᴄᴏᴜʟᴅɴᴛ ʀᴇᴀᴅ ᴛʜᴀᴛ ʟɪɴᴋ — ᴛʀʏ ᴛʜᴇ ᴘᴀᴄᴋ ɴᴀᴍᴇ ᴅɪʀᴇᴄᴛʟʏ`,
        ...ci,
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: `𖤐 ꜰᴇᴛᴄʜɪɴɢ *${slug}* — ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ...`,
      ...ci,
    }, { quoted: message });

    try {
      const pack = await fetchPack(slug);
      if (!pack) throw new Error(`ᴘᴀᴄᴋ ɴᴏᴛ ꜰᴏᴜɴᴅ ᴏʀ ᴛᴏᴋᴇɴ ɪɴᴠᴀʟɪᴅ`);

      const stickers = pack.stickers || [];
      const MAX      = Math.min(stickers.length, 30);

      await sock.sendMessage(chatId, {
        text: `𖤐 ꜰᴏᴜɴᴅ *${pack.title}* — ${stickers.length} sᴛɪᴄᴋᴇʀs\n𖤐 sᴇɴᴅɪɴɢ ꜰɪʀsᴛ ${MAX}...`,
        ...ci,
      }, { quoted: message });

      let sent = 0, ꜰᴀɪʟᴇᴅ = 0;
      for (let i = 0; i < MAX; i++) {
        try {
          const url = await getFileUrl(stickers[i].file_id);
          if (!url) { ꜰᴀɪʟᴇᴅ++; continue; }
          const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
          let buf;
          try { buf = await toStickerBuf(Buffer.from(data)); } catch { buf = Buffer.from(data); }
          await sock.sendMessage(chatId, { sticker: buf, ...ci });
          sent++;
          await new Promise(r => setTimeout(r, 500));
        } catch { ꜰᴀɪʟᴇᴅ++; }
      }

      await sock.sendMessage(chatId, {
        text: `╔═══════════════════════════╗\n` +
              `║   ᗴ᙭ODILE ᙭ᗪ — ᴛɢ sᴛɪᴄᴋᴇʀ  ║\n` +
              `╚═══════════════════════════╝\n\n` +
              `𖤐 ᴘᴀᴄᴋ: *${PACKNAME}*\n` +
              `𖤐 ᴀᴜᴛʜᴏʀ: *${AUTHOR}*\n` +
              `𖤐 sᴇɴᴛ: ${sent} | ꜰᴀɪʟᴇᴅ: ${ꜰᴀɪʟᴇᴅ}` +
              (stickers.length > 30 ? `\n𖤐 ꜰɪʀsᴛ 30 ᴏɴʟʏ` : ''),
        ...ci,
      }, { quoted: message });

    } catch (e) {
      await sock.sendMessage(chatId, {
        text: `𖤐 ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ᴛʜᴀᴛ ᴘᴀᴄᴋ — ${e.message}`,
        ...ci,
      }, { quoted: message });
    }
  },
};
