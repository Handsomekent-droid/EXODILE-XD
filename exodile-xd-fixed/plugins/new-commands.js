'use strict';
/**
 * NEW COMMANDS — EXODILE XD v2
 * .left      — user exits group with goodbye
 * .img       — retrieve named saved media
 * .addsudo   — shortcut sudo add
 * .comingsoon — show upcoming/bug cmds
 */
const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const { getChannelInfo } = require('../lib/messageConfig');
const { addSudo }        = require('../lib/index');
const isOwner            = require('../lib/isOwner');
const settings           = require('../settings');
const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

// ── named media store ──────────────────────────────────────────
const MEDIA_STORE_FILE = path.join(__dirname, '../data/namedMedia.json');
function loadMediaStore() {
  try {
    if (!fs.existsSync(MEDIA_STORE_FILE)) { fs.writeFileSync(MEDIA_STORE_FILE, '{}'); return {}; }
    return JSON.parse(fs.readFileSync(MEDIA_STORE_FILE, 'utf8'));
  } catch { return {}; }
}
function saveMediaStore(store) {
  try { fs.writeFileSync(MEDIA_STORE_FILE, JSON.stringify(store, null, 2)); } catch {}
}

// ── upcoming / bug commands list ───────────────────────────────
const COMING_SOON = [
  '◈ *coming soon commands*',
  '',
  '⚡ .ai2        — smarter gpt-4o chat',
  '⚡ .tts2       — upgraded text to speech',
  '⚡ .deepfake   — face swap (processing)',
  '⚡ .aivideo    — ai video generator',
  '⚡ .voiceclone — clone any voice',
  '⚡ .removebg2  — hd background remove',
  '⚡ .upscale    — hd image upscaler',
  '',
  '🐛 *known bugs being fixed*',
  '',
  '🔧 .gdrive     — auth issue (wip)',
  '🔧 .facebook   — rate limit fix',
  '🔧 .instagram  — cookie refresh',
  '🔧 .xvideo     — blocked api rewrite',
  '🔧 .remini     — timeout increase',
  '',
  '💀 report bugs: .report <message>',
];

module.exports = [
  // ─── .left — user self-exits group with goodbye ──────────────
  {
    command: 'left',
    aliases: ['exitgroup', 'selfleave', 'getout'],
    category: 'group',
    description: 'leave the group with a goodbye message',
    usage: '.left',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      const chatId = ctx.chatId || m.key.remoteJid;
      const isGroup = chatId.endsWith('@g.us');

      if (!isGroup) {
        return sock.sendMessage(chatId, {
          text: '◈ this command only works in groups' + FOOTER, ...ci
        }, { quoted: m });
      }

      const senderId  = m.key.participant || m.key.remoteJid;
      const senderNum = senderId.split('@')[0].split(':')[0];

      const goodbyes = [
        `✦ @${senderNum} has left the chat. 💨 peace out fr fr 💀`,
        `✦ @${senderNum} has exited the building. 👋 ghost mode activated`,
        `✦ @${senderNum} said bye — gone like wifi signal in a tunnel 📶💀`,
        `✦ @${senderNum} left. no cap, we felt that. 🫡`,
        `✦ @${senderNum} vanished. 💨 they said nothing and left. respect.`,
      ];
      const msg = goodbyes[Math.floor(Math.random() * goodbyes.length)];

      await sock.sendMessage(chatId, {
        text: msg + FOOTER,
        mentions: [senderId],
        ...ci
      }, { quoted: m });

      // remove the sender from group
      try {
        await new Promise(r => setTimeout(r, 1500));
        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
      } catch {
        // if bot isn't admin, at least send the goodbye message
      }
    }
  },

  // ─── .img — retrieve saved named media ──────────────────────
  {
    command: 'img',
    aliases: ['getmedia', 'savedmedia', 'findmedia'],
    category: 'tools',
    description: 'get saved media by name, or save quoted media',
    usage: '.img <name>  |  .img save <name> (reply to media)',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      const chatId = ctx.chatId || m.key.remoteJid;
      const store  = loadMediaStore();

      const sub  = (args[0] || '').toLowerCase();
      const name = (args[1] || args[0] || '').toLowerCase().trim();

      // .img save <name> — save quoted media
      if (sub === 'save') {
        const saveName = (args[1] || '').toLowerCase().trim();
        if (!saveName) return sock.sendMessage(chatId, {
          text: '◈ usage: .img save <name> (reply to media)' + FOOTER, ...ci
        }, { quoted: m });

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgUrl = quoted?.imageMessage?.url || quoted?.videoMessage?.url
          || quoted?.stickerMessage?.url;
        const imgType = quoted?.imageMessage ? 'image' : quoted?.videoMessage ? 'video' : quoted?.stickerMessage ? 'sticker' : null;

        if (!imgType) return sock.sendMessage(chatId, {
          text: '◈ reply to an image/video/sticker to save it' + FOOTER, ...ci
        }, { quoted: m });

        store[saveName] = { url: imgUrl, type: imgType, saved: Date.now() };
        saveMediaStore(store);
        return sock.sendMessage(chatId, {
          text: `◈ saved as *${saveName}*` + FOOTER, ...ci
        }, { quoted: m });
      }

      // .img list
      if (sub === 'list') {
        const keys = Object.keys(store);
        if (!keys.length) return sock.sendMessage(chatId, {
          text: '◈ no saved media yet' + FOOTER, ...ci
        }, { quoted: m });
        return sock.sendMessage(chatId, {
          text: `◈ *saved media*\n\n${keys.map(k => `│➽ ${k}`).join('\n')}` + FOOTER, ...ci
        }, { quoted: m });
      }

      // .img delete <name>
      if (sub === 'delete' || sub === 'del') {
        const delName = (args[1] || '').toLowerCase().trim();
        if (!store[delName]) return sock.sendMessage(chatId, {
          text: `◈ *${delName}* not found` + FOOTER, ...ci
        }, { quoted: m });
        delete store[delName];
        saveMediaStore(store);
        return sock.sendMessage(chatId, {
          text: `◈ deleted *${delName}*` + FOOTER, ...ci
        }, { quoted: m });
      }

      // .img <name> — retrieve
      const entry = store[name];
      if (!entry) return sock.sendMessage(chatId, {
        text: `◈ *${name}* not found\nuse .img list to see all` + FOOTER, ...ci
      }, { quoted: m });

      try {
        const type = entry.type || 'image';
        await sock.sendMessage(chatId, {
          [type]: { url: entry.url },
          caption: `◈ *${name}*` + FOOTER,
          ...ci
        }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, {
          text: `◈ could not load *${name}* — media may have expired` + FOOTER, ...ci
        }, { quoted: m });
      }
    }
  },

  // ─── .addsudo — quick shortcut ──────────────────────────────
  {
    command: 'addsudo',
    aliases: ['sudoadd2', 'givesudo'],
    category: 'owner',
    description: 'quickly add a sudo user (owner only)',
    usage: '.addsudo @user or .addsudo <number>',
    async handler(sock, m, args, ctx = {}) {
      const ci       = getChannelInfo();
      const chatId   = ctx.chatId || m.key.remoteJid;
      const senderId = m.key.participant || m.key.remoteJid;
      const isOwn    = m.key.fromMe || isOwner.isOwnerOnly(senderId);

      if (!isOwn) return sock.sendMessage(chatId, {
        text: '◈ owner only' + FOOTER, ...ci
      }, { quoted: m });

      // get target
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      let targetJid = mentioned[0];
      if (!targetJid) {
        const num = (args[0] || '').replace(/\D/g, '');
        if (num.length < 7) return sock.sendMessage(chatId, {
          text: '◈ usage: .addsudo @user or .addsudo 2547xxxxxxx' + FOOTER, ...ci
        }, { quoted: m });
        targetJid = num + '@s.whatsapp.net';
      }

      const ok = await addSudo(targetJid);
      const num = targetJid.split('@')[0];
      return sock.sendMessage(chatId, {
        text: ok
          ? `◈ @${num} added as sudo ✦` + FOOTER
          : `◈ failed to add sudo` + FOOTER,
        mentions: [targetJid],
        ...ci
      }, { quoted: m });
    }
  },

  // ─── .comingsoon — upcoming & bugged commands ────────────────
  {
    command: 'comingsoon',
    aliases: ['upcoming', 'bugs', 'todolist', 'whatsnext'],
    category: 'general',
    description: 'see upcoming features and known bugs',
    usage: '.comingsoon',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      const chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, {
        text: COMING_SOON.join('\n') + FOOTER, ...ci
      }, { quoted: m });
    }
  },
];
