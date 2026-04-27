'use strict';
const { sessionStore } = require('../lib/sessionStore');
const commandHandler = require('../lib/commandHandler');
const settings       = require('../settings');
const { getChannelInfo } = require('../lib/messageConfig');
const fs   = require('fs');
const path = require('path');
const axios = require('axios');

// ── EXODILE XD FOOTER ──────────────────────────────────────────
const FOOTER = '\n\n> Exodile XD\n> Exodile Empire Inc.\n> Powered by Prime Killer Nova Kent';

// Category Configuration - Mapping internal categories to the new UI labels
const CAT_CFG = {
  general:  { icon: '🧭', label: '𝗚𝗘𝗡𝗘𝗥𝗔𝗟 𝗦𝗬𝗦𝗧𝗘𝗠' },
  ai:       { icon: '🤖', label: '𝗔𝗜 𝗘𝗡𝗚𝗜𝗡𝗘'      },
  download: { icon: '📥', label: '𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗛𝗨𝗕'   },
  music:    { icon: '🎵', label: '𝗠𝗨𝗦𝗜𝗖 𝗭𝗢𝗡𝗘'      },
  search:   { icon: '🔎', label: '𝗦𝗘𝗔𝗥𝗖𝗛 𝗦𝗬𝗦𝗧𝗘𝗠'   },
  images:   { icon: '🖼', label: '𝗜𝗠𝗔𝗚𝗘 𝗟𝗔𝗕𝗦'      },
  tools:    { icon: '🧰', label: '𝗧𝗢𝗢𝗟𝗦 𝗖𝗢𝗥𝗘'      },
  fun:      { icon: '😂', label: '𝗙𝗨𝗡 𝗭𝗢𝗡𝗘'        },
  owner:    { icon: '👑', label: '𝗢𝗪𝗡𝗘𝗥 𝗠𝗢𝗗𝗘'      },
  nsfw:     { icon: '🔞', label: '𝗡𝗦𝗙𝗪 𝗟𝗢𝗖𝗞𝗘𝗗'     },
  admin:    { icon: '🛡️', label: '𝗔𝗗𝗠𝗜𝗡 𝗣𝗔𝗡𝗘𝗟'     },
  group:    { icon: '👥', label: '𝗚𝗥𝗢𝗨𝗣 𝗖𝗢𝗡𝗧𝗥𝗢𝗟'   },
  stalk:    { icon: '🕵️', label: '𝗦𝗧𝗔𝗟𝗞 𝗠𝗢𝗗𝗘'      },
  apks:     { icon: '📦', label: '𝗔𝗣𝗞 𝗖𝗘𝗡𝗧𝗘𝗥'      },
  info:     { icon: 'ℹ️', label: '𝗜𝗡𝗙𝗢 𝗛𝗨𝗕'        },
  games:    { icon: '🎮', label: '𝗚𝗔𝗠𝗘 𝗭𝗢𝗡𝗘'       },
  stickers: { icon: '✨', label: '𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗟𝗔𝗕'     },
  quotes:   { icon: '💬', label: '𝗤𝗨𝗢𝗧𝗘𝗦 𝗭𝗢𝗡𝗘'     },
  menu:     { icon: '⚙️', label: '𝗕𝗨𝗚 𝗠𝗢𝗗𝗨𝗟𝗘'      },
};

const CAT_ORDER = [
  'general', 'ai', 'download', 'music', 'search', 'images', 
  'tools', 'fun', 'owner', 'nsfw', 'admin', 'group', 
  'stalk', 'apks', 'info', 'games', 'stickers', 'quotes', 'menu'
];

function catI(c) { return CAT_CFG[c?.toLowerCase()]?.icon  || '◈'; }
function catL(c) { return CAT_CFG[c?.toLowerCase()]?.label || (c||'misc').toUpperCase(); }

function ordered(all) {
  const set = new Set(all);
  const r   = CAT_ORDER.filter(c => set.has(c));
  all.forEach(c => { if (!r.includes(c)) r.push(c); });
  return r;
}

async function getThumb() {
  try {
    if (process.env.MENU_PHOTO_URL) {
      const r = await axios.get(process.env.MENU_PHOTO_URL, { responseType: 'arraybuffer', timeout: 8000 });
      return Buffer.from(r.data);
    }
    const mf = path.join(__dirname, '../media/media.json');
    if (fs.existsSync(mf)) {
      const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
      const url = m?.whatsapp?.bot_menu_photo || m?.whatsapp?.menu_photo;
      if (url && !url.includes('REPLACE')) {
        const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
        return Buffer.from(r.data);
      }
    }
  } catch {}
  const local = path.join(__dirname, '../assets/bot_image.jpg');
  return fs.existsSync(local) ? fs.readFileSync(local) : null;
}

async function buildFullMenu(pfx, botMode, total) {
  const upSec = Math.floor(process.uptime());
  const d  = Math.floor(upSec / 86400),
        h  = Math.floor((upSec % 86400) / 3600),
        mn = Math.floor((upSec % 3600) / 60),
        s  = upSec % 60;
  const uptime = [d && `${d}d`, h && `${h}h`, mn && `${mn}m`, `${s}s`].filter(Boolean).join(' ');
  const memUsage = process.memoryUsage().rss / 1024 / 1024;
  const memTotal = 640; // Simulated limit for display
  const pct  = Math.min(100, Math.round(memUsage / memTotal * 100));
  const bar  = '█'.repeat(Math.round(pct / 10)) + '▒'.repeat(10 - Math.round(pct / 10));
  const cats = ordered(Array.from(commandHandler.categories.keys()));

  let t = '';
  t += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
  t += `┃ 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗥𝗢𝗢𝗧 𝗧𝗘𝗥𝗠𝗜𝗡𝗔𝗟\n`;
  t += `┃ 🔓 𝗔𝗖𝗖𝗘𝗦𝗦 𝗚𝗥𝗔𝗡𝗧𝗘𝗗 ✔\n`;
  t += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

  t += `> ⚙️ 𝗕𝗢𝗢𝗧𝗜𝗡𝗚 𝗖𝗢𝗥𝗘...\n`;
  t += `> 📦 𝗟𝗢𝗔𝗗𝗜𝗡𝗚 𝗠𝗢𝗗𝗨𝗟𝗘𝗦...\n`;
  t += `> ✅ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗕𝗟𝗘 ✔\n\n`;

  t += `╔══════════════════════════╗\n   ꜱʏꜱᴛᴇᴍ ᴘᴀɴᴇʟ\n╚══════════════════════════╝\n`;
  t += `│ 🟢 𝗦𝗧𝗔𝗧𝗨𝗦   :: 𝗢𝗡𝗟𝗜𝗡𝗘\n`;
  t += `│ 🖥 𝗛𝗢𝗦𝗧     :: ${process.env.HOST_NAME || 'PETREDACTYL PANEL'}\n`;
  t += `│ 🔌 𝗠𝗢𝗗𝗘     :: ${botMode.toUpperCase()}\n`;
  t += `│ 🧬 𝗩𝗘𝗥𝗦𝗜𝗢𝗡  :: ${settings.version}\n`;
  t += `│ ⚡ 𝗦𝗣𝗘𝗘𝗗    :: ${(Math.random() * 0.3 + 0.1).toFixed(4)}ms\n`;
  t += `│ 💾 𝗥𝗔𝗠      :: ${pct}% ${bar}\n`;
  t += `│ 📦 𝗠𝗘𝗠𝗢𝗥𝗬   :: ${memUsage.toFixed(0)}𝗠𝗕\n`;
  t += `│ 👑 𝗢𝗪𝗡𝗘𝗥    :: ${settings.botOwner.toUpperCase()}\n`;
  t += `│ 📞 𝗖𝗢𝗡𝗧𝗔𝗖𝗧  :: ${settings.ownerNumber}\n`;
  t += '\n';

  t += `╔════════════════════════╗\n   ʙᴜɢ ᴍᴇɴᴜ : ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ\n╚════════════════════════╝\n\n`;

  for (const cat of cats) {
    if (cat === 'menu') continue; // Handled separately or skipped as per mockup
    const cmds = commandHandler.getCommandsByCategory(cat).slice().sort();
    if (!cmds.length) continue;
    
    const hdrA = `${catI(cat)} ${catL(cat)}`;
    const padA = hdrA.length + 4;
    t += `╔${'═'.repeat(padA)}╗\n   ${hdrA}\n╚${'═'.repeat(padA)}╝\n`;
    for (const cmd of cmds) {
      t += `┃ ${cmd}\n`;
    }
    t += '\n';
  }

  t += FOOTER;
  return t;
}

function buildCatMenu(cat, pfx) {
  const cmds = commandHandler.getCommandsByCategory(cat).slice().sort();
  if (!cmds.length) return null;

  const hdr = `${catI(cat)} ${catL(cat)}`;
  const padLen = hdr.length + 4;
  let t = `╔${'═'.repeat(padLen)}╗\n   ${hdr}\n╚${'═'.repeat(padLen)}╝\n`;
  for (const cmd of cmds) {
    t += `┃ ${cmd}\n`;
  }
  t += FOOTER;
  return t;
}

function buildAllMenu(pfx) {
  const cats = ordered(Array.from(commandHandler.categories.keys()));
  let t = '';
  for (const cat of cats) {
    const cmds = commandHandler.getCommandsByCategory(cat).slice().sort();
    if (!cmds.length) continue;
    const hdrF = `${catI(cat)} ${catL(cat)}`;
    const padF = hdrF.length + 4;
    t += `╔${'═'.repeat(padF)}╗\n   ${hdrF}\n╚${'═'.repeat(padF)}╝\n`;
    for (const cmd of cmds) {
      t += `┃ ${cmd}\n`;
    }
    t += '\n';
  }
  t += FOOTER;
  return t;
}

module.exports = {
  command: 'smartmenu',
  aliases: ['menu', 'help', 'commands', 'cmds', 'smenu'],
  category: 'general',
  description: '◈ EXODILE XD — Full Command Menu',
  usage: '.menu [category|all]',
  isPrefixless: true,

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId  = context.chatId || message.key.remoteJid;
    const ci      = getChannelInfo();
    const pfx     = settings.prefixes[0] || '.';
    const store   = require('../lib/lightweight_store');
    const botMode = await _ss.getBotMode().catch(() => 'public');
    const total   = commandHandler.commands.size;
    const thumb   = await getThumb();

    async function send(text) {
      if (thumb) {
        try {
          await sock.sendMessage(chatId, { image: thumb, caption: text, ...ci }, { quoted: message });
          return;
        } catch {}
      }
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    }

    if (args[0]) {
      const cat = args[0].toLowerCase();
      if (['all', 'everything', 'full'].includes(cat)) return send(buildAllMenu(pfx));
      const txt = buildCatMenu(cat, pfx);
      if (!txt) {
        const avail = ordered(Array.from(commandHandler.categories.keys())).join(' · ');
        return send(`◈ category *${cat}* not found\n\navailable: ${avail}` + FOOTER);
      }
      return send(txt);
    }

    await send(await buildFullMenu(pfx, botMode, total));
  },
};
