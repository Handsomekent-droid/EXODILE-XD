'use strict';
require('./config');
require('./settings');

const { Boom }                     = require('@hapi/boom');
const fs                           = require('fs');
const chalk                        = require('chalk');
const FileType                     = require('file-type');
const syntaxerror                  = require('syntax-error');
const path                         = require('path');
const axios                        = require('axios');
const PhoneNumber                  = require('awesome-phonenumber');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  // Browsers import removed — using raw browser array to match pairing socket identity
  jidDecode,
  proto,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  delay,
} = require('@whiskeysockets/baileys');
const NodeCache    = require('node-cache');
const pino         = require('pino');
const readline     = require('readline');

// ── Suppress known Baileys noise (Bad MAC, Session errors) ───
// These are caused by encrypted msgs from old/expired sessions — not our code
const _origConsoleError = console.error;
console.error = (...a) => {
  const s = a.join(' ');
  if (s.includes('Bad MAC') || s.includes('Session error') ||
      s.includes('session_cipher') || s.includes('verifyMAC')) return;
  _origConsoleError.apply(console, a);
};
const { parsePhoneNumber } = require('libphonenumber-js');
const { PHONENUMBER_MCC }  = require('@whiskeysockets/baileys/lib/Utils/generics');
const { rmSync, existsSync, mkdirSync } = require('fs');
const { join }     = require('path');

const store          = require('./lib/lightweight_store');
const SaveCreds      = require('./lib/session');
const { app, server, PORT } = require('./lib/server');
const { printLog, printBanner, printStartSuccess } = require('./lib/print');
const {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall,
} = require('./lib/messageHandler');

const settings       = require('./settings');
const commandHandler = require('./lib/commandHandler');
const { startAutoLoader } = require('./lib/autoLoader');
const { startKeepAlive } = require('./lib/keepalive');
const sessionManager = require('./lib/sessionManager');

// ── boot ────────────────────────────────────────────────────────
store.readFromFile();
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);
commandHandler.loadCommands();
startAutoLoader(commandHandler); // ᴀᴜᴛᴏ-ʟᴏᴀᴅ ɴᴇᴡ plugins ᴡɪᴛʜᴏᴜᴛ ʀᴇsᴛᴀʀᴛ

// ── ᴍᴇᴍᴏʀʏ ᴍᴏɴɪᴛᴏʀ ────────────────────────────────────────────
setInterval(() => { if (global.gc) global.gc(); }, 60_000);
setInterval(() => {
  const used = process.memoryUsage().rss / 1024 / 1024;
  if (used > 700) {
    printLog('warning', `ʀᴀᴍ ᴛᴏᴏ ʜɪɢʜ (${used.toFixed(0)}ᴍʙ) — ɢᴄ...`);
    if (global.gc) { global.gc(); }
    // Only exit if STILL above 900MB after GC
    const after = process.memoryUsage().rss / 1024 / 1024;
    if (after > 900) { printLog('error', 'ʀᴀᴍ ᴄʀɪᴛɪᴄᴀʟ — ʀᴇsᴛᴀʀᴛ'); process.exit(1); }
  }
}, 30_000);

// ── ɢʟᴏʙᴀʟs ─────────────────────────────────────────────────────
let phoneNumber = global.PAIRING_NUMBER || process.env.PAIRING_NUMBER || settings.ownerNumber;
let owner       = JSON.parse(fs.readFileSync('./data/owner.json'));
global.botname   = process.env.BOT_NAME || settings.botName;
global.themeemoji = '✦';
const NEWSLETTER_JID  = process.env.NEWSLETTER_JID  || settings.newsletterJid;
const NEWSLETTER_NAME = process.env.NEWSLETTER_NAME || settings.newsletterName;

const pairingCode = !!phoneNumber || process.argv.includes('--pairing-code');
const useMobile   = process.argv.includes('--mobile');

// ── ᴛᴇʀᴍɪɴᴀʟ ɪɴᴘᴜᴛ ──────────────────────────────────────────────
let rl = null;
if (process.stdin.isTTY && !process.env.PAIRING_NUMBER) {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
}
const question = (text) => {
  if (rl && !rl.closed) return new Promise((res) => rl.question(text, res));
  return Promise.resolve(settings.ownerNumber || phoneNumber);
};
process.on('exit',   () => { if (rl && !rl.closed) rl.close(); });
process.on('SIGINT', () => { if (rl && !rl.closed) rl.close(); process.exit(0); });

// ── session ʜᴇʟᴘᴇʀs ──────────────────────────────────────────────
function ensureSessionDirectory(sessionPath) {
  const p = sessionPath || path.join(__dirname, 'sessions', 'primary');
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
  return p;
}

function hasValidSession(sessionPath) {
  try {
    const credsPath = path.join(sessionPath || path.join(__dirname, 'sessions', 'primary'), 'creds.json');
    if (!existsSync(credsPath)) return false;
    const content = fs.readFileSync(credsPath, 'utf8');
    if (!content || !content.trim()) return false;
    const creds = JSON.parse(content);
    if (!creds.noiseKey || !creds.signedIdentityKey || !creds.signedPreKey) return false;
    if (creds.registered === false) {
      try { rmSync(path.dirname(credsPath), { recursive: true, force: true }); } catch {}
      return false;
    }
    return true;
  } catch { return false; }
}

async function initializeSession(sessionPath) {
  ensureSessionDirectory(sessionPath);
  const txt = global.SESSION_ID || process.env.SESSION_ID;
  if (!txt) {
    if (hasValidSession(sessionPath)) { printLog('success', 'existing session found'); return true; }
    printLog('warning', 'ɴᴏ session — pairɪɴɢ ʀᴇQᴜɪʀᴇᴅ'); return false;
  }
  if (hasValidSession(sessionPath)) return true;
  try {
    await SaveCreds(txt, sessionPath);
    await delay(2000);
    return hasValidSession(sessionPath);
  } catch(e) {
    printLog('error', `session download failed: ${e.message}`);
    return false;
  }
}

// ── s sᴇʀᴠᴇʀ ────────────────────────────────────────────────────────
server.listen(PORT, () => printLog('success', `sᴇʀᴠᴇʀ ʟɪsᴛᴇɴɪɴɢ ᴏɴ ᴘᴏʀᴛ ${PORT}`));

// ── ᴍᴀɪɴ ʙᴏᴛ ꜰᴜɴᴄᴛɪᴏɴ ──────────────────────────────────────────
async function startBot(sessionDir) {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const sPath = sessionDir || path.join(__dirname, 'sessions', 'primary');
    ensureSessionDirectory(sPath);

    const { state, saveCreds } = await useMultiFileAuthState(sPath);
    const msgRetryCounterCache = new NodeCache();

    const ghostMode = await store.getSetting('global', 'stealthMode');
    const isGhost   = ghostMode && ghostMode.enabled;
    if (isGhost) printLog('info', '👻 sᴛᴇᴀʟᴛʜ ᴍᴏᴅᴇ ᴀᴄᴛɪᴠᴇ');

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: !pairingCode,
      // Must match the pairing socket browser string exactly
      browser: ['Ubuntu', 'Opera', '100.0.4815.0'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level:'fatal' }).child({ level:'fatal' })),
      },
      markOnlineOnConnect:            !isGhost,
      generateHighQualityLinkPreview: false,   // disabled — speeds up sync
      syncFullHistory:                false,   // never sync full history
      shouldIgnoreJid: jid => {
        // Always allow status@broadcast through for autoviewstatus
        if (jid === 'status@broadcast') return false;
        // Ignore other broadcast JIDs
        return jid?.endsWith('@broadcast');
      },
      getMessage: async (key) => {
        try {
          const jid = jidNormalizedUser(key.remoteJid);
          const msg = await store.loadMessage(jid, key.id);
          return msg?.message || undefined;
        } catch { return undefined; }
      },
      msgRetryCounterCache,
      defaultQueryTimeoutMs:  15000,  // 15s max per query (reduced from 20s)
      connectTimeoutMs:       25000,  // 25s connect timeout
      keepAliveIntervalMs:    10000,  // ping WA every 10s (more responsive)
      retryRequestDelayMs:    250,    // retry faster (250ms instead of 500ms)
      maxMsgRetryCount:       3,      // limit retries
      fireInitQueries:        true,
      emitOwnEvents:          true,
    });

    // ── sᴛᴇᴀʟᴛʜ ᴡʀᴀᴘᴘᴇʀs ─────────────────────────────────────
    const origPresence   = sock.sendPresenceUpdate.bind(sock);
    const origRead       = sock.readMessages.bind(sock);
    sock.sendPresenceUpdate = async (...a) => { const g = await store.getSetting('global','stealthMode'); if (g?.enabled) return; return origPresence(...a); };
    sock.readMessages       = async (...a) => { const g = await store.getSetting('global','stealthMode'); if (g?.enabled) return; return origRead(...a); };

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);

    // ── ᴍᴇssᴀɢᴇ ʜᴀɴᴅʟᴇʀ ─────────────────────────────────────
    sock.ev.on('messages.upsert', async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        // ── STATUS must be checked FIRST before any message filter ──
        if (mek.key?.remoteJid === 'status@broadcast') { await handleStatus(sock, chatUpdate); return; }
        if (!mek.message) return;
        // ── VIEW-ONCE: intercept BEFORE unwrapping (keys must be intact) ──
        const firstKeyCheck = Object.keys(mek.message)[0];
        if (firstKeyCheck === 'viewOnceMessage' || firstKeyCheck === 'viewOnceMessageV2' || firstKeyCheck === 'viewOnceMessageV2Extension') {
          // Pass original (wrapped) message to autoViewOnce BEFORE we strip the container
          const { handleViewOnce } = require('./lib/autoViewOnce');
          handleViewOnce(sock, mek).catch(() => {});
        }
        // Unwrap common message wrappers
        const firstKey = Object.keys(mek.message)[0];
        if (firstKey === 'ephemeralMessage') mek.message = mek.message.ephemeralMessage.message;
        else if (firstKey === 'viewOnceMessage') mek.message = mek.message.viewOnceMessage.message;
        else if (firstKey === 'viewOnceMessageV2') mek.message = mek.message.viewOnceMessageV2.message;
        else if (firstKey === 'viewOnceMessageV2Extension') mek.message = mek.message.viewOnceMessageV2Extension.message;
        else if (firstKey === 'documentWithCaptionMessage') mek.message = mek.message.documentWithCaptionMessage.message;
        if (!mek.message) return;
        // NOTE: sock.public was never set anywhere in the codebase, causing ALL
        // non-owner DM commands to be silently dropped. Mode enforcement (public /
        // self / private / groups / inbox) is already handled inside
        // messageHandler.js via botMode, so this extra gate is both broken and
        // redundant. Removed.
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
        try { await handleMessages(sock, chatUpdate); }
        catch (err) {
          printLog('error', `ᴍsɢ ʜᴀɴᴅʟᴇʀ: ${err.message}`);
          if (mek.key?.remoteJid) {
            await sock.sendMessage(mek.key.remoteJid, {
              text: '❌ ᴀɴ error ᴏᴄᴄᴜʀʀᴇᴅ ᴘʀᴏᴄᴇssɪɴɢ ʏᴏᴜʀ ᴍᴇssᴀɢᴇ.',
              contextInfo: { forwardingScore:1, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, newsletterName:NEWSLETTER_NAME, serverMessageId:-1 } },
            }).catch(()=>{});
          }
        }
      } catch(err) { printLog('error', `ᴜᴘsᴇʀᴛ: ${err.message}`); }
    });

    sock.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) { const d = jidDecode(jid)||{}; return (d.user&&d.server) ? d.user+'@'+d.server : jid; }
      return jid;
    };

    sock.ev.on('contacts.update', update => {
      for (const c of update) {
        const id = sock.decodeJid(c.id);
        if (store?.contacts) store.contacts[id] = { id, name: c.notify };
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr && !pairingCode) { printLog('info', 'sᴄᴀɴ ᴛʜᴇ QR ᴄᴏᴅᴇ ᴛᴏ ᴄᴏɴɴᴇᴄᴛ'); }
      if (connection === 'connecting') printLog('info', 'ᴄᴏɴɴᴇᴄᴛɪɴɢ ᴛᴏ ᴡʜᴀᴛsᴀᴘᴘ...');
      if (connection === 'open') {
        printLog('success', `ᴄᴏɴɴᴇᴄᴛᴇᴅ: ${sock.user.name || 'ʙᴏᴛ'}`);

        // ── ꜰᴏʀᴄᴇ ᴘʀᴇsᴇɴᴄᴇ ᴏɴʟɪɴᴇ ─────────────────────────────
        // Push 'available' immediately, then again after 3s to make sure
        // WhatsApp registers it (first push sometimes gets lost during handshake)
        try { await sock.sendPresenceUpdate('available'); } catch {}
        setTimeout(async () => {
          try { await sock.sendPresenceUpdate('available'); } catch {}
        }, 3000);

        // Heartbeat every 30s to keep status as Online and prevent "Connecting"
        if (global._presenceInterval) clearInterval(global._presenceInterval);
        global._presenceInterval = setInterval(async () => {
          try {
            const ghostMode = await store.getSetting('global', 'stealthMode');
            if (!ghostMode?.enabled) await sock.sendPresenceUpdate('available');
          } catch {}
        }, 30000);

        try { const { initAlwaysOnline } = require('./plugins/alwaysonline'); await initAlwaysOnline(sock); } catch {}

        // ── ᴀᴜᴛᴏsᴛᴀᴛᴜs: subscribe to ALL existing contacts on connect ──
        // This ensures status events are delivered even for contacts added before bot started
        setTimeout(async () => {
          try {
            const botNum  = (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
            const cfgFile = path.join(__dirname, 'data', `autostatus_${botNum}.json`);
            let cfg = { enabled: false };
            try { if (fs.existsSync(cfgFile)) cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); } catch {}
            if (!cfg.enabled) return;
            // Pull all known contacts from the store and subscribe to presence
            const allContacts = Object.keys(store?.contacts || {});
            let subCount = 0;
            for (const jid of allContacts) {
              if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') continue;
              try { await sock.presenceSubscribe(jid); subCount++; } catch {}
              // Small delay every 20 contacts to avoid rate-limiting
              if (subCount % 20 === 0) await new Promise(r => setTimeout(r, 300));
            }
            if (subCount > 0) printLog('success', `ᴀᴜᴛᴏsᴛᴀᴛᴜs: subscribed to ${subCount} contacts`);
          } catch {}
        }, 5000); // Wait 5s after connect before subscribing

        await delay(500);
        startKeepAlive(sock);
        printBanner({ commands: commandHandler.commands.size, backend: store.getStats?.()?.backend || 'ꜰɪʟᴇ', sessions: global._activeSessions || 1 });
        printStartSuccess({ commands: commandHandler.commands.size, sessions: global._activeSessions || 1 });

        // ── ʀᴇɢɪsᴛᴇʀ session as ONLINE in sessionManager ────────
        try {
          const sessionId = path.basename(sessionDir);
          const userNum   = (sock.user?.id || '').split(':')[0].split('@')[0];
          sessionManager.registerSession(sessionId, sock, {
            number: userNum || sessionId,
            name:   sock.user?.name || sessionId,
          });
          printLog('session', `session online: ${sessionId} (+${userNum})`);
        } catch (_e) {
          printLog('error', `registerSession failed: ${_e.message}`);
        }

        try {
          const botNumber = sock.user.id.split(':')[0]+'@s.whatsapp.net';
          const mediaFile = path.join(__dirname, 'media', 'media.json');
          let pairPhoto   = null;
          try { const m = JSON.parse(fs.readFileSync(mediaFile,'utf8')); pairPhoto = m?.whatsapp?.pair_photo || m?.whatsapp?.menu_photo || null; } catch {}

          // ── ᴀᴜᴛᴏ-ʙɪᴏ ᴏɴ ᴘᴀɪʀ ─────────────────────────────────
          try {
            const coolBio =
              `ᘿX𝕺ɖꙆ𝐿𝙀 𝓧𝓓\n᭄ ᏢϴᏔᎬᎡҽԃ ꍗꐞ χ∂ 𝐕𝐀𝐔𝐋𝐓 ✦\n巛 ${settings.channelLink}`;
            await sock.updateProfileStatus(coolBio.substring(0, 139));
          } catch {}

          const waMsg = {
            text:
              `✞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n` +
              `☠️  ⟨ ᴇxᴏᴅɪʟᴇ xᴅ — ᴄᴏɴɴᴇᴄᴛᴇᴅ ⟩  ☠️\n` +
              `✞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n\n` +
              `┃  🟢  *sᴛᴀᴛᴜs*   ┊  ᴏɴʟɪɴᴇ ✅\n` +
              `┃  📱  *ɴᴜᴍʙᴇʀ*  ┊  +${botNumber.replace('@s.whatsapp.net','')}\n` +
              `┃  🕐  *ᴛɪᴍᴇ*    ┊  ${new Date().toLocaleString()}\n` +
              `┃  📦  *ᴘʟᴜɢɪɴs* ┊  ${commandHandler.commands.size} ʟᴏᴀᴅᴇᴅ\n` +
              `┃  ⚡  *ᴘɪɴɢ*    ┊  ᴏɴʟɪɴᴇ 24/7\n\n` +
              `┃  💀 ᴛʏᴘᴇ *.menu* ᴛᴏ sᴇᴇ ᴀʟʟ ᴄᴍᴅs\n\n` +
              `✞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n` +
              `☣️ ᴇxᴏᴅɪʟᴇ xᴅᴍᴅ ᴛᴇᴄʜ 🔥💀⚡`,
            contextInfo: { forwardingScore:1, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, newsletterName:NEWSLETTER_NAME, serverMessageId:-1 } },
          };

          if (pairPhoto && !pairPhoto.includes('REPLACE')) {
            await sock.sendMessage(botNumber, { image: { url: pairPhoto }, caption: waMsg.text, contextInfo: waMsg.contextInfo });
          } else {
            await sock.sendMessage(botNumber, waMsg);
          }
        } catch {}

        // ── ᴀᴜᴛᴏꜰᴏʟʟᴏᴡ ɴᴇᴡsʟᴇᴛᴛᴇʀs ─────────────────────────────
        try {
          const autoFollowPath = path.join(__dirname,'data','autofollow.json');
          if (existsSync(autoFollowPath)) {
            const autoFollowData = JSON.parse(fs.readFileSync(autoFollowPath,'utf8'));
            const newsletters = autoFollowData.newsletters || (Array.isArray(autoFollowData) ? autoFollowData : []);
            for (const jid of newsletters) {
              try { await sock.followNewsletter(jid); printLog('success',`ᴀᴜᴛᴏꜰᴏʟʟᴏᴡ: ${jid}`); } catch {}
            }
          }
        } catch {}

        // ── ᴀᴜᴛᴏ-ᴊᴏɪɴ ᴄʜᴀɴɴᴇʟ + ɢʀᴏᴜᴘ ᴏɴ ᴘᴀɪʀ ──────────────────
        await delay(2000);
        // Follow EXODILE newsletter
        try {
          await sock.newsletterFollow('120363425412882254@newsletter');
          printLog('success', 'ᴀᴜᴛᴏ-ꜰᴏʟʟᴏᴡᴇᴅ: EXODILE ᴄʜᴀɴɴᴇʟ');
        } catch {}
        // Auto-join official EXODILE XD group (updated link)
        try {
          await sock.groupAcceptInvite('GKQHsvi2nO1I867WW8QgND');
          printLog('success', 'ᴀᴜᴛᴏ-ᴊᴏɪɴᴇᴅ: EXODILE XD ᴏꜰꜰɪᴄɪᴀʟ ɢʀᴏᴜᴘ');
        } catch {}
      }

      if (connection === 'close') {
        // Clear presence heartbeat
        if (global._presenceInterval) { clearInterval(global._presenceInterval); global._presenceInterval = null; }
        // Mark session as offline in sessionManager (keeps creds, just marks disconnected)
        try {
          sessionManager.deregisterSession(path.basename(sessionDir));
        } catch {}
        const statusCode  = lastDisconnect?.error?.output?.statusCode;
        const payloadErr  = lastDisconnect?.error?.output?.payload?.error || lastDisconnect?.error?.payload?.error;
        printLog('error', `connection ᴄʟᴏsᴇᴅ | sᴛᴀᴛᴜs: ${statusCode}`);

        // sᴀꜰᴇ: sᴇʀᴠᴇʀ error — ᴅᴏ ɴᴏᴛ ᴅᴇʟᴇᴛᴇ session
        if (typeof statusCode === 'number' && statusCode >= 500) {
          printLog('warning','ᴡᴀ sᴇʀᴠᴇʀ error — reconnecting...');
          return setTimeout(() => startBot(sessionDir), 3000);
        }

        const PERMA = [DisconnectReason.loggedOut, DisconnectReason.badSession, DisconnectReason.connectionReplaced, 401, 403];
        if (PERMA.includes(statusCode) || payloadErr === 'device_removed') {
          printLog('error','ᴘᴇʀᴍᴀɴᴇɴᴛ ʟᴏɢᴏᴜᴛ — deleting session');
          try { rmSync(sPath, { recursive:true, force:true }); } catch {}
          return;
        }

        printLog('connection',`ᴛᴇᴍᴘᴏʀᴀʀʏ disconnect (${statusCode||'ᴜɴᴋɴᴏᴡɴ'}) — retrying...`);
        // Exponential back-off: 3s → 6s → 12s → 24s → max 30s
        if (typeof startBot._retries !== 'number') startBot._retries = 0;
        startBot._retries++;
        const delay_ms = Math.min(3000 * Math.pow(2, startBot._retries - 1), 30000);
        setTimeout(() => { startBot._retries = 0; startBot(sessionDir); }, delay_ms);
      }
    });

    sock.ev.on('call',                    async (c) => handleCall(sock, c));
    sock.ev.on('group-participants.update', async (u) => handleGroupParticipantUpdate(sock, u));
    sock.ev.on('status.update',            async (s) => handleStatus(sock, s));
    sock.ev.on('messages.reaction',        async (r) => handleStatus(sock, r));

    // ── ᴀᴜᴛᴏsᴛᴀᴛᴜs: Subscribe to all contacts' presence so WhatsApp
    // delivers status@broadcast events for every paired contact.
    // Without this, Baileys only sees statuses from contacts whose
    // presence you've already subscribed to.
    sock.ev.on('contacts.upsert', async (contacts) => {
      try {
        const botNum = (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
        const cfgPath = path.join(__dirname, 'data', `autostatus_${botNum}.json`);
        let cfg = { enabled: false };
        try { if (fs.existsSync(cfgPath)) cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
        if (!cfg.enabled) return;
        for (const c of contacts) {
          if (!c.id || c.id.endsWith('@g.us') || c.id === 'status@broadcast') continue;
          try { await sock.presenceSubscribe(c.id); } catch {}
        }
      } catch {}
    });

    return sock;
  } catch(error) {
    printLog('error', `sᴛᴀʀᴛʙᴏᴛ ᴄʀᴀsʜ: ${error.message}`);
    if (rl&&!rl.closed) { rl.close(); rl=null; }
    await delay(5000);
    startBot(sessionDir);
  }
}

// ── ᴍᴀɪɴ ᴇɴᴛʀʏ ──────────────────────────────────────────────────
const { startTelegram } = require('./telegram');

async function main() {
  printLog('info', 'starting 𝙴𝚇𝙾𝙳𝙸𝙻𝙴 𝚇𝙳...');

  // ── ᴛᴇʟᴇɢʀᴀᴍ ʙᴏᴛ ────────────────────────────────────────────
  if (process.env.TELEGRAM_BOT_TOKEN) {
    startTelegram(startBot).catch(e => printLog('error', `telegram: ${e.message}`));
  }

  // ── ᴍᴜʟᴛɪ-session: ʙᴏᴏᴛ ᴀʟʟ saved sessions ─────────────────
  // If sessions/ has existing paired sessions, boot all of them
  const savedSessions = (() => {
    try {
      return require('fs').readdirSync(sessionManager.SESSIONS_DIR)
        .filter(id => sessionManager.sessionDirExists(id));
    } catch { return []; }
  })();

  if (savedSessions.length > 0) {
    printLog('session', `found ${savedSessions.length} saved session(s) — booting ᴀʟʟ...`);
    await sessionManager.bootAllSessions(startBot);
    return;
  }

  // ── sɪɴɢʟᴇ / ꜰɪʀsᴛ-ᴛɪᴍᴇ session ───────────────────────────────
  // Fall back to primary session init (SESSION_ID env or pairing)
  const primaryDir = path.join(sessionManager.SESSIONS_DIR, 'primary');
  const sessionReady = await initializeSession(primaryDir);
  if (sessionReady) printLog('success', 'session ready — booting...');
  else              printLog('warning', 'session ɴᴏᴛ ready — ᴀᴛᴛᴇᴍᴘᴛɪɴɢ pair...');

  await delay(3000);
  startBot(primaryDir).catch(e => {
    printLog('error', `ꜰᴀᴛᴀʟ: ${e.message}`);
    if (rl && !rl.closed) rl.close();
    process.exit(1);
  });
}

main();

// Export startBot so telegram.js can boot a new session after pairing
module.exports = { startBot };

// ── ᴛᴇᴍᴘ ᴅɪʀ ─────────────────────────────────────────────────────
const customTemp = path.join(process.cwd(),'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive:true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = customTemp;
setInterval(() => {
  fs.readdir(customTemp,(err,files) => {
    if (err) return;
    files.forEach(f => {
      const fp = path.join(customTemp,f);
      fs.stat(fp,(_,s) => { if (s && Date.now()-s.mtimeMs > 3*60*60*1000) fs.unlink(fp,()=>{}); });
    });
  });
}, 60*60*1000);

// ── error ʜᴀɴᴅʟᴇʀs ──────────────────────────────────────────────
// ── ᴄʀᴀsʜ ɢᴜᴀʀᴅ — ɴᴇᴠᴇʀ ᴅɪᴇ ────────────────────────────────────
// Log the error but do NOT call process.exit() — let the process live.
// The panel's keep-alive + Baileys auto-reconnect handles the rest.
let _crashCount = 0;
const _MAX_CRASHES = 50; // safety — exit only after 50 consecutive crashes
process.on('uncaughtException', (e) => {
  printLog('error', `ᴜɴᴄᴀᴜɢʜᴛ: ${e.message}`);
  console.error(e.stack);
  _crashCount++;
  if (_crashCount > _MAX_CRASHES) { printLog('error','ᴛᴏᴏ ᴍᴀɴʏ ᴄʀᴀsʜᴇs — ᴇxɪᴛɪɴɢ'); process.exit(1); }
  setTimeout(() => { _crashCount = Math.max(0, _crashCount - 1); }, 60_000);
});
process.on('unhandledRejection', (e) => {
  printLog('error', `ᴜɴʜᴀɴᴅʟᴇᴅ: ${e?.message||e}`);
  if (e?.stack) console.error(e.stack);
});
server.on('error', (e) => { if (e.code==='EADDRINUSE') { printLog('error',`ᴘᴏʀᴛ ${PORT} ɪɴ ᴜsᴇ`); server.close(); } else printLog('error',`sᴇʀᴠᴇʀ: ${e.message}`); });

// ── ʜᴏᴛ ʀᴇʟᴏᴀᴅ ──────────────────────────────────────────────────
const _self = require.resolve(__filename);
fs.watchFile(_self, () => {
  fs.unwatchFile(_self);
  printLog('info','ɪɴᴅᴇx.ᴊs ᴜᴘᴅᴀᴛᴇᴅ — ʀᴇʟᴏᴀᴅɪɴɢ...');
  delete require.cache[_self];
  require(_self);
});
