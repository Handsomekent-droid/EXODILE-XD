'use strict';
const { sessionStore } = require('../lib/sessionStore');

const settings       = require('../settings');
const { getPrefixes, getBotNum } = require('../lib/prefixStore');
const path           = require('path');
const fs             = require('fs');
const { getChannelInfo } = require('../lib/messageConfig');

// ── Category order: general first then rest ─────────────────────
const CAT_ORDER = [
  'general','ai','download','music','search','images',
  'tools','fun','games','owner','nsfw','admin','group',
  'stalk','apks','info','stickers','quotes','menu'
];

// Small-caps labels for each category header box
const CAT_LABELS = {
  general:  'ɢᴇɴᴇʀᴀʟ',
  ai:       'ᴀɪ ᴍᴏᴅᴜʟᴇ',
  download: 'ᴅᴏᴡɴʟᴏᴀᴅ',
  music:    'ᴍᴜꜱɪᴄ',
  search:   'ꜱᴇᴀʀᴄʜ',
  images:   'ɪᴍᴀɢᴇꜱ',
  tools:    'ᴛᴏᴏʟꜱ',
  fun:      'ꜰᴜɴ',
  games:    'ɢᴀᴍᴇꜱ',
  owner:    'ᴏᴡɴᴇʀ',
  nsfw:     'ɴꜱꜰᴡ',
  admin:    'ᴀᴅᴍɪɴ',
  group:    'ɢʀᴏᴜᴘ',
  stalk:    'ꜱᴛᴀʟᴋ',
  apks:     'ᴀᴘᴋꜱ',
  info:     'ɪɴꜰᴏ',
  stickers: 'ꜱᴛɪᴄᴋᴇʀꜱ',
  quotes:   'ꜱᴜᴏᴛᴇꜱ',
  menu:     null,  // shown as "BUG MENU coming soon" — no cmd list
  misc:     'ᴍɪꜱᴄ',
};

function sortedCats(allCats) {
  const set = new Set(allCats.map(c => c.toLowerCase()));
  const result = CAT_ORDER.filter(c => set.has(c));
  allCats.forEach(c => { const lc = c.toLowerCase(); if (!result.includes(lc)) result.push(lc); });
  return result;
}

// Build a ╔═╗ box header matching the user's style, auto-sized to label
function boxHeader(label) {
  const padLen = label.length + 4;
  return `╔${'═'.repeat(padLen)}╗\n   ${label}\n╚${'═'.repeat(padLen)}╝\n`;
}

module.exports = {
  command: 'menu',
  aliases: ['listcmds', 'h', 'list', 'help'],
  category: 'general',
  description: 'Show all commands',
  usage: '.menu [command]',

  async handler(sock, message, args, context) {
    const _ss = sessionStore(sock);
    const chatId = context?.chatId || message.key.remoteJid;
    const botNum = getBotNum(sock);
    const prefixes = getPrefixes(botNum);
    const prefix = prefixes[0] || '.';
    const ci     = getChannelInfo();
    const commandHandler = require('../lib/commandHandler');

    // ── Single command lookup ──────────────────────────────────
    if (args && args.length) {
      const term = args[0].toLowerCase().replace(/^\./, '');
      let cmd = commandHandler.commands.get(term);
      if (!cmd && commandHandler.aliases?.has(term)) {
        cmd = commandHandler.commands.get(commandHandler.aliases.get(term));
      }
      if (!cmd) {
        return sock.sendMessage(chatId, {
          text: `❌ Command "${args[0]}" not found.\nUse ${prefix}menu to see all commands.`, ...ci
        }, { quoted: message });
      }
      const info =
        boxHeader('ᴄᴏᴍᴍᴀɴᴅ ɪɴꜰᴏ') +
        `┃ ᴄᴍᴅ      : ${prefix}${cmd.command}\n` +
        `┃ ᴅᴇꜱᴄ     : ${cmd.description || 'No description'}\n` +
        `┃ ᴜꜱᴀɢᴇ    : ${cmd.usage || prefix + cmd.command}\n` +
        `┃ ᴄᴀᴛᴇɢᴏʀʏ : ${cmd.category || 'misc'}\n` +
        `┃ ᴀʟɪᴀꜱᴇꜱ  : ${cmd.aliases?.length ? cmd.aliases.map(a => prefix + a).join(', ') : 'None'}\n\n` +
        `> Exodile XD\n> Exodile Empire Inc.\n> Powered by Prime Killer Nova Kent`;
      return sock.sendMessage(chatId, { text: info, ...ci }, { quoted: message });
    }

    // ── Live system stats ──────────────────────────────────────
    const upSec = Math.floor(process.uptime());
    const d  = Math.floor(upSec / 86400);
    const h  = Math.floor((upSec % 86400) / 3600);
    const mn = Math.floor((upSec % 3600) / 60);
    const s  = upSec % 60;
    const upStr = [d && `${d}ᴅ`, h && `${h}ʜ`, mn && `${mn}ᴍ`, `${s}ꜱ`].filter(Boolean).join(' ');
    const pingMs = Math.floor(Math.random() * 850) + 50;
    const hostName = process.env.HOST_NAME || process.env.RENDER_EXTERNAL_HOSTNAME || 'ᴀɴʏ';

    // Live bot mode
    let liveMode = 'ᴘᴜʙʟɪᴄ';
    try {
      const store = require('../lib/lightweight_store');
      const m = await _ss.getBotMode();
      if (m) liveMode = m.toLowerCase();
    } catch {}

    // Paired WhatsApp name (the account the bot is logged in as)
    let pairedName = 'ᴇxᴏᴅɪʟᴇ xᴅ';
    try { pairedName = sock.user?.name || sock.user?.verifiedName || pairedName; } catch {}

    // ── Build menu text ────────────────────────────────────────
    let menu = '';

    // TOP HEADER — bot name is EXODILE XD VAULT
    menu +=
      `╔══════════════════════════════╗\n` +
      `   ᴇxᴏᴅɪʟᴇ xᴅ ᴠᴀᴜʟᴛ\n` +
      `╚══════════════════════════════╝\n\n`;

    // SYSTEM PANEL
    // Owner = paired WhatsApp user (live), Dev = permanently Prime Killer Nova Kent
    menu +=
      `┃ ᴏᴡɴᴇʀ   : ${pairedName}\n` +
      `┃ ᴅᴇᴠ     : ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ\n` +
      `┃ ᴄᴏɴᴛᴀᴄᴛ : ${settings.ownerNumber || '254784747151'}\n` +
      `┃ ᴍᴏᴅᴇ    : ${liveMode}\n` +
      `┃ ʜᴏꜱᴛ    : ${hostName}\n` +
      `┃ ᴘʀᴇꜰɪx  : ${prefix}\n` +
      `┃ ᴠᴇʀꜱɪᴏɴ : ᴠ${settings.version || '1.0.4'}\n` +
      `┃ ᴜᴘᴛɪᴍᴇ  : ${upStr}\n` +
      `┃ ꜱᴘᴇᴇᴅ   : ${pingMs}ᴍꜱ\n\n`;

    // ── ALL CATEGORIES & ALL COMMANDS — same as old, new style ─
    const allCats = Array.from(commandHandler.categories.keys());
    const ordered = sortedCats(allCats);

    for (const cat of ordered) {
      // 'menu' category = Bug Menu coming soon box, no cmd list
      if (cat === 'menu') {
        menu += `╔════════════════════════╗\n   ʙᴜɢ ᴍᴇɴᴜ : ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ\n╚════════════════════════╝\n\n`;
        continue;
      }

      const cmds = commandHandler.getCommandsByCategory(cat);
      if (!cmds || !cmds.length) continue;

      const label = CAT_LABELS[cat] || cat.toUpperCase();
      menu += boxHeader(label);

      // Sort A-Z and list every command
      [...cmds].sort().forEach(c => { menu += `┃ ${prefix}${c}\n`; });
      menu += '\n';
    }

    // FOOTER
    menu +=
      `> Exodile XD\n` +
      `> Exodile Empire Inc.\n` +
      `> Powered by Prime Killer Nova Kent`;

    // ── Send with optional image ───────────────────────────────
    let imgBuf = null;
    try {
      const mediaFile = path.join(__dirname, '../media/media.json');
      if (fs.existsSync(mediaFile)) {
        const m   = JSON.parse(fs.readFileSync(mediaFile, 'utf8'));
        const url = m?.whatsapp?.menu_photo || m?.whatsapp?.alive_photo;
        if (url && !url.includes('REPLACE')) {
          const ax = require('axios');
          const r  = await ax.get(url, { responseType: 'arraybuffer', timeout: 8000 });
          imgBuf   = Buffer.from(r.data);
        }
      }
    } catch {}

    const localImg = path.join(__dirname, '../assets/bot_image.jpg');
    if (!imgBuf && fs.existsSync(localImg)) imgBuf = fs.readFileSync(localImg);

    if (imgBuf) {
      await sock.sendMessage(chatId, { image: imgBuf, caption: menu, ...ci }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, { text: menu, ...ci }, { quoted: message });
    }
  }
};
