'use strict';
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

// some-random-api updated their domain — no longer "api." subdomain
const SRA_BASE    = 'https://some-random-api.com/animu';
// nekos.best as reliable fallback
const NEKOS_BASE  = 'https://nekos.best/api/v2';

const NEKOS_MAP = {
  nom: 'nom', poke: 'poke', cry: 'cry', kiss: 'kiss',
  pat: 'pat', hug: 'hug', wink: 'wink', 'face-palm': 'facepalm',
};

function normalizeType(input) {
  const lower = (input || '').toLowerCase();
  if (lower === 'facepalm' || lower === 'face_palm') return 'face-palm';
  if (lower === 'quote' || lower === 'animu-quote' || lower === 'animuquote') return 'quote';
  return lower;
}

async function convertMediaToSticker(mediaBuffer, isAnimated) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const inputExt = isAnimated ? 'gif' : 'jpg';
  const input  = path.join(tmpDir, `animu_${Date.now()}.${inputExt}`);
  const output = path.join(tmpDir, `animu_${Date.now()}.webp`);
  fs.writeFileSync(input, mediaBuffer);

  const ffmpegCmd = isAnimated
    ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=15" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 60 -compression_level 6 "${output}"`
    : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${output}"`;

  await new Promise((resolve, reject) => {
    exec(ffmpegCmd, (err) => (err ? reject(err) : resolve()));
  });

  let webpBuffer = fs.readFileSync(output);
  const img = new webp.Image();
  await img.load(webpBuffer);

  const json = {
    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
    'sticker-pack-name': '𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 Anime',
    'emojis': ['🎌']
  };
  const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);
  img.exif = exif;

  const finalBuffer = await img.save(null);
  try { fs.unlinkSync(input); } catch {}
  try { fs.unlinkSync(output); } catch {}
  return finalBuffer;
}

/**
 * Fetch image URL — tries some-random-api first, then nekos.best fallback
 */
async function fetchAnimeUrl(type) {
  // 1️⃣ Try some-random-api.com (updated domain — no "api." prefix)
  try {
    const res = await axios.get(`${SRA_BASE}/${type}`, { timeout: 10000 });
    const data = res.data || {};
    if (data.link) return { url: data.link, isGif: data.link.toLowerCase().endsWith('.gif') };
    if (data.quote) return { quote: data.quote };
  } catch {}

  // 2️⃣ Fallback to nekos.best
  const nekosType = NEKOS_MAP[type];
  if (nekosType) {
    try {
      const res = await axios.get(`${NEKOS_BASE}/${nekosType}`, { timeout: 10000 });
      const results = res.data?.results;
      if (results && results[0]) {
        const item = results[0];
        const url = item.url;
        return { url, isGif: url.toLowerCase().endsWith('.gif') };
      }
    } catch {}
  }

  return null;
}

async function sendAnimu(sock, chatId, message, type) {
  try {
    const result = await fetchAnimeUrl(type);

    if (!result) {
      return await sock.sendMessage(chatId, { text: '❌ ᴀɴɪᴍᴇ ᴀᴘɪ ɪs ᴅᴏᴡɴ ʀɪɢʜᴛ ɴᴏᴡ, ᴛʀʏ ʟᴀᴛᴇʀ.' }, { quoted: message });
    }

    if (result.quote) {
      return await sock.sendMessage(chatId, { text: result.quote }, { quoted: message });
    }

    if (result.url) {
      const link = result.url;
      const lower = link.toLowerCase();
      const isGif = lower.endsWith('.gif');
      const isImage = lower.match(/\.(jpg|jpeg|png|webp)$/);

      if (isGif || isImage) {
        try {
          const resp = await axios.get(link, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          const stickerBuf = await convertMediaToSticker(Buffer.from(resp.data), isGif);
          return await sock.sendMessage(chatId, { sticker: stickerBuf }, { quoted: message });
        } catch {
          // sticker convert failed — send as image instead
          return await sock.sendMessage(chatId, { image: { url: link }, caption: `🎌 *${type.toUpperCase()}*` }, { quoted: message });
        }
      }

      return await sock.sendMessage(chatId, { image: { url: link }, caption: `🎌 *${type.toUpperCase()}*` }, { quoted: message });
    }

    return await sock.sendMessage(chatId, { text: '❌ ᴄᴏᴜʟᴅ ɴᴏᴛ ꜰᴇᴛᴄʜ ᴀɴɪᴍᴇ ᴄᴏɴᴛᴇɴᴛ.' }, { quoted: message });
  } catch (err) {
    console.error('error sending animu:', err.message);
    await sock.sendMessage(chatId, { text: '❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ ᴡʜɪʟᴇ ꜰᴇᴛᴄʜɪɴɢ ᴀɴɪᴍᴜ.' }, { quoted: message });
  }
}

module.exports = {
  command: 'animu',
  aliases: ['anime'],
  category: 'menu',
  description: 'Send anime stickers or GIFs',
  usage: '.animu <type> | types: nom, poke, cry, kiss, pat, hug, wink, face-palm, quote',
  async handler(sock, message, args, context = {}) {
    const chatId  = context.chatId || message.key.remoteJid;
    const subArg  = args && args[0] ? args[0] : '';
    const type    = normalizeType(subArg);
    const supported = ['nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'];

    try {
      if (!type) {
        return await sock.sendMessage(chatId, {
          text:
            `┌─━─━─━〔 🎌 𝗔𝗡𝗜𝗠𝗘 〕━─━─━─┐\n` +
            `│ Usage: .animu <type>\n│\n` +
            supported.map(t => `│  • ${t}`).join('\n') + '\n' +
            `└─━─━─━─━─━─━─━─━─━─━─━─━─━─┘`
        }, { quoted: message });
      }

      if (!supported.includes(type)) {
        return await sock.sendMessage(chatId, {
          text: `❌ Unknown type: *${type}*\n\nSupported: ${supported.join(', ')}`
        }, { quoted: message });
      }

      await sendAnimu(sock, chatId, message, type);
    } catch (err) {
      console.error('error in animu handler:', err.message);
      await sock.sendMessage(chatId, { text: '❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ.' }, { quoted: message });
    }
  }
};
