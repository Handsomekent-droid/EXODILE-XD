'use strict';
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

/**
 * ☠️ EXODILE MD — .addplugin
 * Owner sends a .js file quoted/attached, bot saves and hot-loads it
 */
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getChannelInfo } = require('../lib/messageConfig');
const commandHandler = require('../lib/commandHandler');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
const PLUGINS = path.join(__dirname);

module.exports = {
  command: 'addplugin',
  aliases: ['uploadplugin', 'newplugin', 'plug'],
  category: 'owner',
  description: '📎 Upload a .js file to install as plugin',
  usage: '.addplugin (attach/reply to .js file) OR .addplugin <url>',
  ownerOnly: true,
  strictOwnerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const ci = getChannelInfo();

    // Check for URL argument first
    const urlArg = args.find(a => a.startsWith('http'));
    if (urlArg) {
      // Delegate to install command logic
      try {
        const res  = await axios.get(urlArg, { timeout: 15000, responseType: 'text' });
        const code = res.data;
        if (!code.includes('module.exports')) throw new Error('Not a valid plugin (missing module.exports)');

        const fn   = urlArg.split('/').pop().replace(/[^a-zA-Z0-9._-]/g, '').replace(/\.js$/, '') + '.js';
        const dest = path.join(PLUGINS, fn);
        fs.writeFileSync(dest, code, 'utf8');

        delete require.cache[require.resolve(dest)];
        const mod     = require(dest);
        const plugins = Array.isArray(mod) ? mod : [mod];
        let loaded = 0;
        for (const p of plugins) {
          if (p?.command && typeof p.handler === 'function') { commandHandler.registerCommand(p); loaded++; }
        }
        return sock.sendMessage(chatId, {
          text: `┏━━「 ✅ *PLUGIN INSTALLED* 」━━┓\n┃\n┃  📎 File: ${fn}\n┃  💀 Loaded: ${loaded} command(s)\n┃  🔥 Live instantly!\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
        }, { quoted: message });
      } catch (e) {
        return sock.sendMessage(chatId, {
          text: `┏━━「 ❌ *INSTALL ERROR* 」━━┓\n┃\n┃  ☠️ ${e.message}\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
        }, { quoted: message });
      }
    }

    // Check for attached/quoted document
    const msg = message.message;
    const doc = msg?.documentMessage ||
                msg?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage;

    if (!doc) {
      return sock.sendMessage(chatId, {
        text:
          `┏━━「 📎 *ADD PLUGIN* 」━━┓\n` +
          `┃\n` +
          `┃  💀 *Method 1:* Attach .js file\n` +
          `┃     Then type .addplugin\n` +
          `┃\n` +
          `┃  ⚡ *Method 2:* .addplugin <url>\n` +
          `┃     Direct raw JS URL\n` +
          `┃\n` +
          `┃  🔥 Hot-loaded, no restart!\n` +
          `┃\n` +
          `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });
    }

    const filename = doc.fileName || `plugin_${Date.now()}.js`;
    if (!filename.endsWith('.js')) {
      return sock.sendMessage(chatId, { text: `☠️ Only .js plugin files are supported!`, ...ci }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: `⏳ Downloading plugin file...`, ...ci }, { quoted: message });

    try {
      const stream = await downloadContentFromMessage(doc, 'document');
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const code = Buffer.concat(chunks).toString('utf8');

      if (!code.includes('module.exports')) throw new Error('Not a valid plugin (missing module.exports)');

      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const dest     = path.join(PLUGINS, safeName);

      const coreFiles = ['smartmenu.js','alive.js','ping.js','addplugin.js','installplugin.js','index.js'];
      if (coreFiles.includes(safeName)) throw new Error(`Cannot overwrite core file: ${safeName}`);

      fs.writeFileSync(dest, code, 'utf8');

      delete require.cache[require.resolve(dest)];
      const mod     = require(dest);
      const plugins = Array.isArray(mod) ? mod : [mod];
      const cmdMatch = code.match(/command:\s*['"]([^'"]+)['"]/);
      const cmdName  = cmdMatch ? cmdMatch[1] : 'unknown';
      let loaded = 0;
      for (const p of plugins) {
        if (p?.command && typeof p.handler === 'function') { commandHandler.registerCommand(p); loaded++; }
      }

      await sock.sendMessage(chatId, {
        text:
          `┏━━「 ✅ *PLUGIN ADDED* 」━━┓\n` +
          `┃\n` +
          `┃  📎 *File:*    ${safeName}\n` +
          `┃  💀 *Command:* .${cmdName}\n` +
          `┃  🔥 *Loaded:*  ${loaded} command(s)\n` +
          `┃  ⚡ Live instantly!\n` +
          `┃\n` +
          `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, {
        text: `┏━━「 ❌ *ERROR* 」━━┓\n┃\n┃  ☠️ ${e.message}\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });
    }
  }
};
