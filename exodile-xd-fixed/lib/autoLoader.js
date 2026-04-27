'use strict';
const fs   = require('fs');
const path = require('path');
const { printLog } = require('./print');
const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

function startAutoLoader(commandHandler) {
  if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true });
  const mtimes = new Map();
  try {
    fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js')).forEach(f => {
      try { mtimes.set(f, fs.statSync(path.join(PLUGINS_DIR, f)).mtimeMs); } catch {}
    });
  } catch {}

  const interval = setInterval(() => {
    try {
      const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
      for (const f of files) {
        const fp = path.join(PLUGINS_DIR, f);
        let mtime;
        try { mtime = fs.statSync(fp).mtimeMs; } catch { continue; }
        const prev  = mtimes.get(f);
        if (prev === mtime) continue;
        const isNew = prev === undefined;
        mtimes.set(f, mtime);
        try {
          const resolved = require.resolve(fp);
          if (require.cache[resolved]) delete require.cache[resolved];
          const exported = require(fp);
          const plugins  = Array.isArray(exported) ? exported : [exported];
          for (const plugin of plugins) {
            if (plugin && plugin.command && typeof plugin.handler === 'function') {
              commandHandler.registerCommand(plugin);
              if (plugin.isPrefixless) {
                const k = plugin.command.toLowerCase();
                commandHandler.prefixlessCommands.set(k, k);
                (plugin.aliases || []).forEach(a => commandHandler.prefixlessCommands.set(a.toLowerCase(), k));
              }
            }
          }
          const names = plugins.filter(p => p && p.command).map(p => `.${p.command}`).join(', ');
          if (names) printLog(isNew ? 'success' : 'info', isNew ? `ᴀᴜᴛᴏ-ʟᴏᴀᴅᴇᴅ: ${names}` : `ʜᴏᴛ-ʀᴇʟᴏᴀᴅᴇᴅ: ${names}`);
        } catch (e) {
          printLog('error', `ᴀᴜᴛᴏ-ʟᴏᴀᴅ [${f}]: ${e.message}`);
        }
      }
    } catch {}
  }, 3000);

  interval.unref();
  printLog('success', `ᴀᴜᴛᴏ-ʟᴏᴀᴅᴇʀ ᴀᴄᴛɪᴠᴇ — ᴅʀᴏᴘ .ᴊs ꜰɪʟᴇs ɪɴᴛᴏ ᴘʟᴜɢɪɴs/ ᴛᴏ ᴀᴜᴛᴏ-ᴀᴅᴅ`);
  return interval;
}

module.exports = { startAutoLoader };
