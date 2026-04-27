'use strict';
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

module.exports = {
  command: 'pair',
  aliases: ['paircode', 'getpair', 'connect', 'linkdevice'],
  category: 'general',
  description: '☠️ Generate WhatsApp pairing code for a new session',
  usage: '.pair <number>',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const ci = getChannelInfo();

    const num = (args.join('') || '').replace(/[^0-9]/g, '').trim();

    if (!num || num.length < 7 || num.length > 15) {
      return sock.sendMessage(chatId, {
        text:
          `┏━━「 ☠️ *𝗣𝗔𝗜𝗥 𝗗𝗘𝗩𝗜𝗖𝗘* ☠️ 」━━┓\n` +
          `┃\n` +
          `┃  💀 *Usage:*   .pair <number>\n` +
          `┃  ⚡ *Example:* .pair 254704320190\n` +
          `┃\n` +
          `┃  ☣️  Include country code\n` +
          `┃  🦠 No + or spaces\n` +
          `┃\n` +
          `┗━━「 ☣️ *𝗫𝗗 𝗩𝗔𝗨𝗟𝗧* ☣️ 」━━┛` + FOOTER,
        ...ci
      }, { quoted: message });
    }

    // IMPORTANT: We spawn a TEMPORARY separate socket just for pairing.
    // This means the main bot session is NEVER touched and NEVER logs out.
    // The temporary socket is destroyed after getting the code.
    await sock.sendMessage(chatId, {
      text:
        `┏━━「 ⏳ *𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗜𝗡𝗚* ⏳ 」━━┓\n` +
        `┃\n` +
        `┃  ☠️ Number: *+${num}*\n` +
        `┃  💀 Spawning temp session...\n` +
        `┃  ⚡ Please wait ~5 seconds\n` +
        `┃\n` +
        `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      ...ci
    }, { quoted: message });

    let tempSock = null;
    try {
      // Dynamically import Baileys to create a throw-away socket
      const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        makeCacheableSignalKeyStore,
      } = require('@whiskeysockets/baileys');
      const { fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
      const pino   = require('pino');
      const path   = require('path');
      const fs     = require('fs');
      const NodeCache = require('node-cache');

      // Temp session stored in a unique temp dir - destroyed after
      const tmpDir = path.join(__dirname, `../sessions/pair_tmp_${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const { version }       = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState(tmpDir);
      const msgRetryCache     = new NodeCache();

      tempSock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '120.0.0'],
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        msgRetryCounterCache: msgRetryCache,
        connectTimeoutMs: 20000,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
      });

      // Wait for socket to be ready enough to request a code
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 15000);
        tempSock.ev.on('connection.update', (update) => {
          if (update.connection === 'open' || update.isNewLogin) {
            clearTimeout(timeout); resolve();
          }
          // For pairing code, we just need the socket to init - doesn't need to open
          if (!update.connection) { clearTimeout(timeout); resolve(); }
        });
        // Resolve quickly once creds exist
        setTimeout(() => { clearTimeout(timeout); resolve(); }, 3000);
      });

      let code = await tempSock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join('-') || code;

      // Clean up temp socket and directory immediately
      try { tempSock.end(); tempSock.ev?.removeAllListeners?.(); } catch {}
      try {
        const { rmSync } = require('fs');
        rmSync(tmpDir, { recursive: true, force: true });
      } catch {}

      await sock.sendMessage(chatId, {
        text:
          `┏━━「 ☠️ *𝗣𝗔𝗜𝗥𝗜𝗡𝗚 𝗖𝗢𝗗𝗘* ☠️ 」━━┓\n` +
          `┃\n` +
          `┃  📱 *Number:* +${num}\n` +
          `┃\n` +
          `┃  🔑 *Your Code:*\n` +
          `┃  ┌─────────────────┐\n` +
          `┃  │   \`${code}\`   │\n` +
          `┃  └─────────────────┘\n` +
          `┃\n` +
          `┃  📋 *How to link:*\n` +
          `┃  ➽ Open WhatsApp Settings\n` +
          `┃  ➽ Tap *Linked Devices*\n` +
          `┃  ➽ Tap *Link a Device*\n` +
          `┃  ➽ Choose *Link with phone*\n` +
          `┃     *number instead*\n` +
          `┃  ➽ Enter the code above\n` +
          `┃\n` +
          `┃  ⚠️  Code expires in ~60s\n` +
          `┃  ✅  Bot session NOT affected\n` +
          `┃\n` +
          `┗━━「 ☣️ *𝗫𝗗 𝗩𝗔𝗨𝗟𝗧* ☣️ 」━━┛` + FOOTER,
        ...ci
      }, { quoted: message });

    } catch (e) {
      // Cleanup on error
      if (tempSock) {
        try { tempSock.end(); tempSock.ev?.removeAllListeners?.(); } catch {}
      }

      let reason = e.message || 'Unknown error';
      if (reason.includes('rate') || reason.includes('429')) reason = 'Rate limited — wait 1 minute';
      else if (reason.includes('invalid') || reason.includes('400')) reason = 'Invalid number format';
      else if (reason.includes('timeout')) reason = 'Connection timeout — try again';

      await sock.sendMessage(chatId, {
        text:
          `┏━━「 ☠️ *𝗣𝗔𝗜𝗥 𝗙𝗔𝗜𝗟𝗘𝗗* ☠️ 」━━┓\n` +
          `┃\n` +
          `┃  ❌ ${reason}\n` +
          `┃\n` +
          `┃  💀 Try again or use\n` +
          `┃  Telegram bot to pair.\n` +
          `┃\n` +
          `┗━━「 ☣️ *𝗫𝗗 𝗩𝗔𝗨𝗟𝗧* ☣️ 」━━┛` + FOOTER,
        ...ci
      }, { quoted: message });
    }
  }
};
