'use strict';
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

/**
 * ☠️ EXODILE MD — Plugin Installer
 * .install <url>   — install a plugin from a raw JS URL
 * .plugins         — list all installed plugins
 * .uninstall <cmd> — remove a plugin by its command name
 */
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const commandHandler = require('../lib/commandHandler');

const PLUGINS_DIR = path.join(__dirname);

// ── helpers ────────────────────────────────────────────────────
function sanitizeFilename(url) {
  const base = url.split('/').pop().replace(/[^a-zA-Z0-9._-]/g, '').replace(/\.js$/, '');
  return base.slice(0, 40) + '.js';
}

function findPluginFile(cmdName) {
  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(PLUGINS_DIR, f), 'utf8');
      const m = content.match(/command:\s*['"]([^'"]+)['"]/);
      if (m && m[1].toLowerCase() === cmdName.toLowerCase()) return f;
    } catch {}
  }
  return null;
}

module.exports = [
  // ── INSTALL ────────────────────────────────────────────────
  {
    command: 'install',
    aliases: ['addplugin', 'loadplugin', 'installplugin'],
    category: 'owner',
    description: '☠️ Install a plugin from a raw URL',
    usage: '.install <raw_js_url>',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
      const ci     = getChannelInfo();

      const url = args[0];
      if (!url) {
        return sock.sendMessage(chatId, {
          text:
            `┏▣ ◈ 💀 *PLUGIN INSTALLER* ◈\n` +
            `┃\n` +
            `┃ *Usage:* .install <raw_url>\n` +
            `┃\n` +
            `┃ *Examples:*\n` +
            `┃ ➽ GitHub raw URL\n` +
            `┃ ➽ Pastebin raw URL\n` +
            `┃ ➽ Any direct .js URL\n` +
            `┃\n` +
            `┃ 💀 Plugin will be hot-loaded instantly\n` +
            `┗▣`,
          ...ci,
        }, { quoted: message });
      }

      // Validate URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return sock.sendMessage(chatId, { text: `☠️ Invalid URL. Must start with http:// or https://`, ...ci }, { quoted: message });
      }

      await sock.sendMessage(chatId, { text: `⏳ Downloading plugin...`, ...ci }, { quoted: message });

      try {
        const res = await axios.get(url, { timeout: 15000, responseType: 'text' });
        const code = res.data;

        // Basic safety check — reject if no module.exports
        if (!code.includes('module.exports')) {
          return sock.sendMessage(chatId, { text: `☠️ Invalid plugin — missing module.exports`, ...ci }, { quoted: message });
        }

        // Extract command name for display
        const cmdMatch = code.match(/command:\s*['"]([^'"]+)['"]/);
        const cmdName  = cmdMatch ? cmdMatch[1] : 'unknown';

        // Save file
        const filename  = sanitizeFilename(url) || `plugin_${Date.now()}.js`;
        const savePath  = path.join(PLUGINS_DIR, filename);

        // Don't overwrite core files
        const coreFiles = ['smartmenu.js','alive.js','index.js','settings.js'];
        if (coreFiles.includes(filename)) {
          return sock.sendMessage(chatId, { text: `☠️ Cannot overwrite core plugin: *${filename}*`, ...ci }, { quoted: message });
        }

        fs.writeFileSync(savePath, code, 'utf8');

        // Hot-reload
        try {
          delete require.cache[require.resolve(savePath)];
          const mod = require(savePath);
          const plugins = Array.isArray(mod) ? mod : [mod];
          let loaded = 0;
          for (const p of plugins) {
            if (p && p.command && typeof p.handler === 'function') {
              commandHandler.registerCommand(p);
              loaded++;
            }
          }

          return sock.sendMessage(chatId, {
            text:
              `┏▣ ◈ ☠️ *PLUGIN INSTALLED* ◈\n` +
              `┃\n` +
              `┃ 📦 *File*    : ${filename}\n` +
              `┃ 💀 *Command* : .${cmdName}\n` +
              `┃ ✅ *Loaded*  : ${loaded} command(s)\n` +
              `┃\n` +
              `┃ 🔥 Plugin is live — no restart needed!\n` +
              `┗▣`,
            ...ci,
          }, { quoted: message });
        } catch (loadErr) {
          fs.unlinkSync(savePath); // remove bad file
          return sock.sendMessage(chatId, {
            text: `☠️ Plugin downloaded but failed to load:\n\`${loadErr.message}\`\n\nFile removed.`,
            ...ci,
          }, { quoted: message });
        }
      } catch (err) {
        return sock.sendMessage(chatId, {
          text: `☠️ Failed to download plugin:\n\`${err.message}\``,
          ...ci,
        }, { quoted: message });
      }
    },
  },

  // ── UNINSTALL ──────────────────────────────────────────────
  {
    command: 'uninstall',
    aliases: ['removeplugin', 'deleteplugin2'],
    category: 'owner',
    description: '☠️ Remove an installed plugin by command name',
    usage: '.uninstall <command>',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();

      const cmdName = args[0]?.toLowerCase();
      if (!cmdName) {
        return sock.sendMessage(chatId, {
          text: `☠️ Usage: .uninstall <command_name>\n\nExample: .uninstall myplugin`,
          ...ci,
        }, { quoted: message });
      }

      const filename = findPluginFile(cmdName);
      if (!filename) {
        return sock.sendMessage(chatId, {
          text: `☠️ No plugin file found for command: *.${cmdName}*`,
          ...ci,
        }, { quoted: message });
      }

      // Protect core plugins
      const coreFiles = ['smartmenu.js','alive.js','ping.js','installplugin.js'];
      if (coreFiles.includes(filename)) {
        return sock.sendMessage(chatId, {
          text: `☠️ Cannot uninstall core plugin: *${filename}*`,
          ...ci,
        }, { quoted: message });
      }

      const filePath = path.join(PLUGINS_DIR, filename);
      try {
        delete require.cache[require.resolve(filePath)];
        fs.unlinkSync(filePath);
        // Remove from commandHandler
        commandHandler.commands.delete(cmdName);
        commandHandler.aliases.forEach((v, k) => { if (v === cmdName) commandHandler.aliases.delete(k); });
        commandHandler.categories.forEach((cmds, cat) => {
          const idx = cmds.indexOf(cmdName);
          if (idx !== -1) cmds.splice(idx, 1);
        });

        return sock.sendMessage(chatId, {
          text:
            `┏▣ ◈ ☠️ *PLUGIN REMOVED* ◈\n` +
            `┃\n` +
            `┃ 💀 *Command* : .${cmdName}\n` +
            `┃ 📦 *File*    : ${filename}\n` +
            `┃ ✅ *Status*  : Unloaded & deleted\n` +
            `┗▣`,
          ...ci,
        }, { quoted: message });
      } catch (err) {
        return sock.sendMessage(chatId, {
          text: `☠️ Failed to uninstall:\n\`${err.message}\``,
          ...ci,
        }, { quoted: message });
      }
    },
  },

  // ── LIST PLUGINS ───────────────────────────────────────────
  {
    command: 'plugins',
    aliases: ['listplugins', 'pluginlist'],
    category: 'owner',
    description: '☠️ List all loaded plugins',
    usage: '.plugins',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();

      const total = commandHandler.commands.size;
      const cats  = Array.from(commandHandler.categories.entries())
        .filter(([,cmds]) => cmds.length > 0)
        .sort((a,b) => b[1].length - a[1].length);

      let text =
        `┏▣ ◈ ☠️ *LOADED PLUGINS* ◈\n` +
        `┃\n` +
        `┃ 📦 *Total commands* : ${total}\n` +
        `┃ 📂 *Categories*     : ${cats.length}\n` +
        `┃\n`;

      for (const [cat, cmds] of cats) {
        text += `┃ ${catIcon(cat)} *${catLabel(cat)}* (${cmds.length})\n`;
      }

      text += `┃\n┃ 🔥 Use .install <url> to add more\n┗▣`;

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    },
  },
];

function catIcon(cat) {
  const icons = { general:'☠️',owner:'💀',admin:'⚔️',group:'👥',download:'🔻',
    ai:'🤖',search:'🔍',apks:'📦',info:'🕯️',fun:'💢',stalk:'👁️',
    games:'🎮',images:'🖤',tools:'🔧',stickers:'💣',quotes:'🩸',music:'🎵',menu:'📜',nsfw:'🔞' };
  return icons[cat?.toLowerCase()] || '💀';
}
function catLabel(cat) {
  const labels = { general:'GENERAL',owner:'OWNER',admin:'ADMIN',group:'GROUP',
    download:'DOWNLOAD',ai:'AI',search:'SEARCH',apks:'APKS',info:'INFO',fun:'FUN',
    stalk:'STALK',games:'GAMES',images:'IMAGES',tools:'TOOLS',stickers:'STICKERS',
    quotes:'QUOTES',music:'MUSIC',menu:'EXTRAS',nsfw:'NSFW' };
  return labels[cat?.toLowerCase()] || (cat||'MISC').toUpperCase();
}
