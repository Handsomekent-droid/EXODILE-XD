'use strict';
/**
 * NEW COMMANDS — .left .img .kill .kiss(sticker) .addsudo .comingsoon
 * Dev: Prime Killer Nova Kent
 */
const axios  = require('axios');
const { execSync, spawn } = require('child_process');
const os   = require('os');
const fss  = require('fs');

/**
 * Convert a GIF buffer → MP4 buffer using ffmpeg.
 * WhatsApp requires real MP4 for gifPlayback — sending a GIF buffer
 * with mimetype video/mp4 produces an unplayable file.
 */
async function gifToMp4(gifBuf) {
  const tmp   = os.tmpdir();
  const inF   = `${tmp}/xd_gif_${Date.now()}.gif`;
  const outF  = `${tmp}/xd_gif_${Date.now()}.mp4`;
  try {
    fss.writeFileSync(inF, gifBuf);
    execSync(
      `ffmpeg -y -i "${inF}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outF}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
    const mp4 = fss.readFileSync(outF);
    return mp4;
  } catch { return null; }
  finally {
    try { fss.unlinkSync(inF); } catch {}
    try { fss.unlinkSync(outF); } catch {}
  }
}

const fs     = require('fs');
const path   = require('path');
const { getChannelInfo } = require('../lib/messageConfig');
const { addSudo }        = require('../lib/index');
const isOwner            = require('../lib/isOwner');
const settings           = require('../settings');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

// ── helper: fetch gif from nekos.best ─────────────────────────
async function getActionGif(type) {
  try {
    const r = await axios.get(`https://nekos.best/api/v2/${type}?amount=1`, { timeout: 10000 });
    const url = r.data?.results?.[0]?.url;
    if (url) {
      const g = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
      return Buffer.from(g.data);
    }
  } catch {}
  try {
    const r = await axios.post(`https://api.waifu.pics/sfw/${type}`, {}, { timeout: 10000 });
    const url = r.data?.url;
    if (url) {
      const g = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
      return Buffer.from(g.data);
    }
  } catch {}
  return null;
}

async function sendGifAction(sock, chatId, m, ci, type, caption, mentioned = []) {
  const gifBuf = await getActionGif(type);
  if (gifBuf) {
    const mp4 = await gifToMp4(gifBuf);
    if (mp4) {
      try {
        return await sock.sendMessage(chatId, {
          video: mp4, mimetype: 'video/mp4', gifPlayback: true,
          caption: caption + FOOTER, mentions: mentioned, ...ci
        }, { quoted: m });
      } catch {}
    }
    // Fallback: send as GIF document (always openable)
    try {
      return await sock.sendMessage(chatId, {
        document: gifBuf, mimetype: 'image/gif',
        fileName: `${type}.gif`,
        caption: caption + FOOTER, mentions: mentioned, ...ci
      }, { quoted: m });
    } catch {}
  }
  await sock.sendMessage(chatId, { text: caption + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
}

// ── media store helper ─────────────────────────────────────────
const MEDIA_STORE_FILE = path.join(__dirname, '../data/named_media.json');
function loadMediaStore() {
  try { if (fs.existsSync(MEDIA_STORE_FILE)) return JSON.parse(fs.readFileSync(MEDIA_STORE_FILE, 'utf8')); } catch {}
  return {};
}
function saveMediaStore(store) {
  try { fs.writeFileSync(MEDIA_STORE_FILE, JSON.stringify(store, null, 2)); } catch {}
}

// ── coming soon list ───────────────────────────────────────────
const COMING_SOON = [
  '.tts2        — advanced voice text-to-speech (multiple voices)',
  '.asmr        — send ASMR sticker/audio',
  '.roast       — ai-powered roast of a tagged user',
  '.ship        — rate ship compatibility with gif',
  '.gm / .gn    — animated good morning / night sticker',
  '.compliment  — ai-generated compliment with gif',
  '.captions    — add caption to any image (ai)',
  '.dalle3      — dalle-3 image generation upgrade',
  '.voiceclone  — clone voice from audio message',
  '.aitalk      — multi-turn ai conversation mode',
  '.antiraid    — mass join / raid protection',
  '.slowmode    — group slow mode (x seconds)',
  '.groupstats  — full group statistics chart',
  '── 🐛 BUG FIXES IN PROGRESS ──',
  '.anime       — gif/image fix (api migration)',
  '.ytmp4       — video download stability fix',
  '.tiktok      — tiktok downloader api update',
  '.spotify     — spotify preview fetch fix',
  '.facebook    — fb video downloader fix',
  '.instagram   — ig reel downloader fix',
  '.weather     — weather provider switch',
  '.lyrics      — lyrics api endpoint update',
];

module.exports = [

  // ── .left — user exits group with goodbye ─────────────────
  {
    command: 'left',
    aliases: ['exit', 'selfleave'],
    category: 'group',
    description: 'leave the group with a goodbye message (any member)',
    usage: '.left',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      const chatId = ctx.chatId || m.key.remoteJid;
      const isGroup = chatId.endsWith('@g.us');

      if (!isGroup) return sock.sendMessage(chatId, {
        text: '◈ this command only works in groups' + FOOTER, ...ci
      }, { quoted: m });

      const senderJid = m.key.participant || m.key.remoteJid;
      const senderNum = senderJid.split('@')[0].split(':')[0];

      // send goodbye first
      const goodbyeMsgs = [
        `✦ @${senderNum} has left the building. 👋 we'll miss you... maybe.`,
        `💀 @${senderNum} just bounced. cya on the flip side.`,
        `◈ @${senderNum} said peace ✌️ goodbye king/queen!`,
        `☠️ @${senderNum} has logged off from this realm. farewell!`,
        `👻 @${senderNum} disappeared into the void. bye!`,
      ];
      const msg = goodbyeMsgs[Math.floor(Math.random() * goodbyeMsgs.length)];

      await sock.sendMessage(chatId, {
        text: msg + FOOTER,
        mentions: [senderJid],
        ...ci
      }, { quoted: m });

      // remove the sender from group
      setTimeout(async () => {
        try {
          await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
        } catch {
          // fallback: try to have them leave themselves (bot may not be admin)
          try { await sock.groupLeave(chatId); } catch {}
        }
      }, 1500);
    }
  },

  // ── .img — retrieve named media ───────────────────────────
  {
    command: 'img',
    aliases: ['getmedia', 'namedmedia'],
    category: 'tools',
    description: 'send or save named media — .img save <name> (reply) | .img <name>',
    usage: '.img <name> | .img save <name> (reply to media)',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      const chatId = ctx.chatId || m.key.remoteJid;
      const store  = loadMediaStore();

      // save mode: .img save <name> — reply to media
      if (args[0]?.toLowerCase() === 'save') {
        const name = args.slice(1).join(' ').toLowerCase().trim();
        if (!name) return sock.sendMessage(chatId, { text: `◈ usage: .img save <name> (reply to image/video/sticker)` + FOOTER, ...ci }, { quoted: m });

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return sock.sendMessage(chatId, { text: `◈ reply to a media message to save it` + FOOTER, ...ci }, { quoted: m });

        // determine media type and url from quoted
        let mediaType = null, mediaData = null;
        if (quoted.imageMessage) { mediaType = 'image'; mediaData = quoted.imageMessage; }
        else if (quoted.videoMessage) { mediaType = 'video'; mediaData = quoted.videoMessage; }
        else if (quoted.stickerMessage) { mediaType = 'sticker'; mediaData = quoted.stickerMessage; }
        else if (quoted.documentMessage) { mediaType = 'document'; mediaData = quoted.documentMessage; }

        if (!mediaType) return sock.sendMessage(chatId, { text: `◈ unsupported media type` + FOOTER, ...ci }, { quoted: m });

        store[name] = {
          type: mediaType,
          url: mediaData?.url || null,
          mimetype: mediaData?.mimetype || null,
          caption: mediaData?.caption || null,
          savedAt: Date.now()
        };
        saveMediaStore(store);
        return sock.sendMessage(chatId, { text: `◈ *${name}* saved! use .img ${name} to retrieve it` + FOOTER, ...ci }, { quoted: m });
      }

      // list mode
      if (args[0]?.toLowerCase() === 'list') {
        const keys = Object.keys(store);
        if (!keys.length) return sock.sendMessage(chatId, { text: `◈ no saved media yet. use .img save <name>` + FOOTER, ...ci }, { quoted: m });
        return sock.sendMessage(chatId, {
          text: `◈ *saved media* (${keys.length})\n${keys.map(k => `│➽ ${k}`).join('\n')}` + FOOTER, ...ci
        }, { quoted: m });
      }

      // retrieve mode
      const name = args.join(' ').toLowerCase().trim();
      if (!name) return sock.sendMessage(chatId, {
        text: `◈ *img*\n│➽ .img <name> — send named media\n│➽ .img save <name> — save (reply to media)\n│➽ .img list — list saved` + FOOTER, ...ci
      }, { quoted: m });

      const item = store[name];
      if (!item || !item.url) return sock.sendMessage(chatId, {
        text: `◈ *${name}* not found. try .img list` + FOOTER, ...ci
      }, { quoted: m });

      try {
        const msgContent = {};
        if (item.type === 'image') { msgContent.image = { url: item.url }; if (item.caption) msgContent.caption = item.caption; }
        else if (item.type === 'video') { msgContent.video = { url: item.url }; if (item.caption) msgContent.caption = item.caption; }
        else if (item.type === 'sticker') { msgContent.sticker = { url: item.url }; }
        else { msgContent.document = { url: item.url }; msgContent.mimetype = item.mimetype; msgContent.fileName = name; }
        await sock.sendMessage(chatId, { ...msgContent, ...ci }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(chatId, { text: `◈ failed to retrieve *${name}* — ${e.message.slice(0, 60)}` + FOOTER, ...ci }, { quoted: m });
      }
    }
  },

  // ── .kill — gif sticker action ────────────────────────────
  {
    command: 'kill',
    aliases: ['murder'],
    category: 'fun',
    description: 'kill someone — animated gif sticker',
    usage: '.kill [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci      = getChannelInfo();
      const chatId  = ctx.chatId || m.key.remoteJid;
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target    = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'someone';
      await sendGifAction(sock, chatId, m, ci, 'kick',
        `💀 *KILL!* — ${target} has been eliminated! ☠️`, mentioned);
    }
  },

  // ── .addsudo — anyone adds themselves as sudo ─────────────
  {
    command: 'addsudo',
    aliases: ['becomesudo', 'sudome'],
    category: 'owner',
    description: 'owner adds a user as sudo',
    usage: '.addsudo @user',
    async handler(sock, m, args, ctx = {}) {
      const ci        = getChannelInfo();
      const chatId    = ctx.chatId || m.key.remoteJid;
      const senderJid = m.key.participant || m.key.remoteJid;
      const isOwnerUser = m.key.fromMe || isOwner.isOwnerOnly(senderJid);

      if (!isOwnerUser) return sock.sendMessage(chatId, {
        text: `◈ owner only — use .sudo add @user instead` + FOOTER, ...ci
      }, { quoted: m });

      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      let targetJid = mentioned[0];

      // allow number as arg
      if (!targetJid && args[0]) {
        const num = args[0].replace(/\D/g, '');
        if (num) targetJid = num + '@s.whatsapp.net';
      }

      if (!targetJid) return sock.sendMessage(chatId, {
        text: `◈ usage: .addsudo @user or .addsudo <number>` + FOOTER, ...ci
      }, { quoted: m });

      const ok = await addSudo(targetJid);
      const displayNum = targetJid.split('@')[0];
      return sock.sendMessage(chatId, {
        text: (ok
          ? `◈ *@${displayNum}* added as sudo ✓`
          : `◈ failed to add — already sudo or error`) + FOOTER,
        mentions: [targetJid],
        ...ci
      }, { quoted: m });
    }
  },

  // ── .comingsoon — show upcoming features ──────────────────
  {
    command: 'comingsoon',
    aliases: ['upcoming', 'newfeatures', 'planned'],
    category: 'general',
    description: 'show upcoming commands and features',
    usage: '.comingsoon',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      const chatId = ctx.chatId || m.key.remoteJid;
      let t = `◈ *ᴄᴏᴍɪɴɢ sᴏᴏɴ* — ᴇxᴏᴅɪʟᴇ xᴅ\n\n`;
      for (const line of COMING_SOON) t += `│➽ ${line}\n`;
      t += `\n◈ stay tuned for updates!`;
      t += FOOTER;
      await sock.sendMessage(chatId, { text: t, ...ci }, { quoted: m });
    }
  },

];
