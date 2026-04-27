'use strict';
/**
 * EXODILE MD — Telegram Bot
 * Pairing logic ported from Leo (proven working reference bot)
 *
 * HOW PAIRING WORKS (Leo's proven method):
 *  1. User sends /pair <number> or taps "Pair WhatsApp Device" button
 *  2. Session directory is created: sessions/_pairtemp/pair_<num>/
 *  3. A temp Baileys socket is spun up with:
 *       browser: ["Ubuntu", "Opera", "100.0.4815.0"]  <- Leo's exact browser string
 *       defaultQueryTimeoutMs: undefined               <- Leo's setting (no timeout on requests)
 *  4. conn.authState.creds.registered is checked:
 *       - If already registered -> saveCreds() and skip pairing
 *       - If NOT registered -> requestPairingCode() called inside setTimeout(3000) <- Leo's pattern
 *  5. Code sent to Telegram user
 *  6. On connection === 'open': saveCreds(), move session to sessions/wa_<num>/, boot main bot
 *  7. On code === 515 (timeout): friendly retry message shown
 *
 * KEY DIFFERENCES FROM BROKEN VERSION:
 *  - requestPairingCode() called in setTimeout(3000) AFTER socket creation (Leo pattern)
 *    NOT inside 'connecting' event (which causes code 515 / race conditions)
 *  - defaultQueryTimeoutMs: undefined (matches Leo - no timeout on pairing request)
 *  - creds.registered check before requesting code (Leo pattern)
 *  - Reconnect loop on non-logout close (Leo pattern)
 */
require('dotenv').config();
const fs    = require('fs');
const path  = require('path');
const https = require('https');
const pino  = require('pino');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} = require('@whiskeysockets/baileys');

// ── Config ────────────────────────────────────────────────────
const TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.TELEGRAM_OWNER_ID;
const BOT_NAME = process.env.BOT_NAME || 'ᗴ᙭OᗪIᒪᗴ ᙭ᗪ';

const ROOT         = __dirname;
const SESSIONS_DIR = path.join(ROOT, 'sessions');
const PAIR_DIR     = path.join(ROOT, 'sessions', '_pairtemp');
const MEDIA_FILE   = path.join(ROOT, 'media', 'media.json');

const REQUIRED_CHANNELS = [
  { username: '@exodileepicxd',    name: 'ᗴ᙭OᗪIᒪᗴ ᙭ᗪ Official Channel', link: 'https://t.me/exodileepicxd'    },
  { username: '@exodile', name: 'ᗴ᙭OᗪIᒪᗴ ᙭ᗪ Official Group',   link: 'https://t.me/exodile' },
];

const PAIR_BIO = '\uD835\uDCD5\uD835\uDCEE\uD835\uDCF7\uD835\uDCFD\uD835\uDCFB\uD835\uDCF2\uD835\uDCFD \uD835\uDCF2\uD835\uDCFD \uD835\uDCFC\uD835\uDCF2\uD835\uDCFF\uD835\uDCEE\uD835\uDCF9\uD835\uDCF9\uD835\uDCEE\uD835\uDCED \uD835\uDE39\uFE0F';

if (!TOKEN) {
  console.log('[TELEGRAM] No TELEGRAM_BOT_TOKEN - skipping');
  module.exports = { startTelegram: () => {} };
  return;
}

// ── Dirs ──────────────────────────────────────────────────────
[SESSIONS_DIR, PAIR_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Media helper ──────────────────────────────────────────────
function getMedia(key) {
  try {
    const m = JSON.parse(fs.readFileSync(MEDIA_FILE, 'utf8'));
    const url = m && m.telegram && m.telegram[key]
      ? m.telegram[key]
      : (m && m.whatsapp && m.whatsapp[key] ? m.whatsapp[key] : null);
    return (url && !url.includes('REPLACE')) ? url : null;
  } catch { return null; }
}

// ── HTTP helper ───────────────────────────────────────────────
function httpPost(urlStr, body, timeoutMs) {
  timeoutMs = timeoutMs || 28000;
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify(body);
    var u    = new URL(urlStr);
    var req  = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: timeoutMs,
    }, function(res) {
      var raw = '';
      res.on('data', function(c) { raw += c; });
      res.on('end', function() { try { resolve(JSON.parse(raw)); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(); reject(new Error('timeout')); });
    req.write(data); req.end();
  });
}

async function tg(method, body) {
  body = body || {};
  try {
    return await httpPost('https://api.telegram.org/bot' + TOKEN + '/' + method, body);
  } catch (e) {
    if (!e.message || (!e.message.includes('timeout') && !e.message.includes('ENOTFOUND')))
      console.error('[TG] ' + method + ' failed:', e.message);
    return null;
  }
}

// ── API wrappers ──────────────────────────────────────────────
function sendMsg(chatId, text, extra) {
  extra = extra || {};
  return tg('sendMessage', Object.assign({ chat_id: chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true }, extra));
}

function sendPhoto(chatId, photo, caption, extra) {
  extra = extra || {};
  return tg('sendPhoto', Object.assign({ chat_id: chatId, photo: photo, caption: caption, parse_mode: 'HTML' }, extra));
}

function editText(chatId, msgId, text, extra) {
  extra = extra || {};
  return tg('editMessageText', Object.assign({ chat_id: chatId, message_id: msgId, text: text, parse_mode: 'HTML', disable_web_page_preview: true }, extra));
}

function editCaption(chatId, msgId, caption, extra) {
  extra = extra || {};
  return tg('editMessageCaption', Object.assign({ chat_id: chatId, message_id: msgId, caption: caption, parse_mode: 'HTML' }, extra));
}

function answerCB(id, text) {
  return tg('answerCallbackQuery', { callback_query_id: id, text: text || '' });
}

async function smartEdit(chatId, msgId, msgType, text, extra) {
  extra = extra || {};
  if (msgType === 'photo') {
    var r = await editCaption(chatId, msgId, text, extra);
    if (!r || !r.ok) return sendMsg(chatId, text, extra);
    return r;
  }
  var r2 = await editText(chatId, msgId, text, extra);
  if (!r2 || !r2.ok) return sendMsg(chatId, text, extra);
  return r2;
}

// ── Channel membership check ──────────────────────────────────
async function getMissingChannels(userId) {
  var missing = [];
  for (var i = 0; i < REQUIRED_CHANNELS.length; i++) {
    var ch = REQUIRED_CHANNELS[i];
    try {
      var r = await tg('getChatMember', { chat_id: ch.username, user_id: userId });
      var s = r && r.result ? r.result.status : null;
      if (!s || s === 'left' || s === 'kicked') missing.push(ch);
    } catch(e) { /* can't verify - don't block */ }
  }
  return missing;
}

// ── State ─────────────────────────────────────────────────────
var userState   = new Map();  // chatId -> { step, msgId, msgType }
var pairSockets = new Map();  // phoneNum -> { conn, timeoutId }
var OFFSET = 0;

// ── Keyboards ─────────────────────────────────────────────────
function mainKb(userId) {
  var isOwner = OWNER_ID && String(userId) === String(OWNER_ID);
  var kb = [
    [{ text: '📱 ᴘᴀɪʀ ᴡʜᴀᴛsᴀᴘᴘ ᴅᴇᴠɪᴄᴇ', callback_data: 'pair_start' }],
    [{ text: '💬 ᴄᴏɴᴛᴀᴄᴛ ʜᴇʟᴘ', url: 'https://t.me/Exodileepic' }],
  ];
  if (isOwner) {
    kb.splice(1, 0, [
      { text: '📊 sᴇssɪᴏɴs [ᴏᴡɴᴇʀ]', callback_data: 'sessions' },
      { text: '🗑️ ᴅᴇʟ sᴇssɪᴏɴ [ᴏᴡɴᴇʀ]', callback_data: 'del_session_menu' }
    ]);
    kb.splice(2, 0, [{ text: '⚡ sʏsᴛᴇᴍ sᴛᴀᴛᴜs [ᴏᴡɴᴇʀ]', callback_data: 'status' }]);
  }
  return { inline_keyboard: kb };
}
function mainKbOld() {
  return {
    inline_keyboard: [
      [{ text: '📱 Pair WhatsApp Device', callback_data: 'pair_start' }],
      [{ text: '📊 Sessions', callback_data: 'sessions' }, { text: '⚡ Status', callback_data: 'status' }],
      [{ text: '📢 Channel', url: REQUIRED_CHANNELS[0].link }, { text: '💬 Group', url: REQUIRED_CHANNELS[1].link }],
    ]
  };
}
function backKb() {
  return { inline_keyboard: [[{ text: '« Back', callback_data: 'menu' }]] };
}
function codeKb(code) {
  return {
    inline_keyboard: [
      [{ text: '📋 Copy Code: ' + code, switch_inline_query: code }],
      [{ text: '🔄 Try Again', callback_data: 'pair_start' }, { text: '« Back', callback_data: 'menu' }],
    ]
  };
}
function retryKb() {
  return {
    inline_keyboard: [
      [{ text: '🔄 Try Again', callback_data: 'pair_start' }],
      [{ text: '« Back', callback_data: 'menu' }],
    ]
  };
}

// ── Text helpers ──────────────────────────────────────────────
function welcomeTxt(name, isOwner) {
  var ownerBadge = isOwner ? '\n┃  👑 <b>ᴏᴡɴᴇʀ ᴀᴄᴄᴇss</b>: ᴀʟʟ ꜰᴇᴀᴛᴜʀᴇs ᴜɴʟᴏᴄᴋᴇᴅ' : '';
  return (
    '✞━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n' +
    '☠️  ⟨ <b>ᴇxᴏᴅɪʟᴇ xᴅ ᴄᴏɴᴛʀᴏʟ ᴘᴀɴᴇʟ</b> ⟩  ☠️\n' +
    '✞━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n\n' +
    '┃  💀 <b>ᴡᴇʟᴄᴏᴍᴇ, ' + (name || 'ᴜsᴇʀ') + '!</b>\n' +
    '┃\n' +
    '┃  🤖 <b>ʙᴏᴛ:</b>     ' + BOT_NAME + '\n' +
    '┃  ⚔️  <b>sᴛᴀᴛᴜs:</b>  ᴏɴʟɪɴᴇ & ᴀʀᴍᴇᴅ\n' +
    '┃  🔥 <b>ᴅᴇᴠ:</b>     ᴘʀɪᴍᴇ ᴋᴇɴᴛ xᴅ ᴠᴀᴜʟᴛ' +
    ownerBadge + '\n' +
    '┃\n' +
    '┃  📱 <b>ᴘᴀɪʀ ᴅᴇᴠɪᴄᴇ</b>  — ʟɪɴᴋ ᴡʜᴀᴛsᴀᴘᴘ\n' +
    '┃  ⚡ <b>sᴛᴀᴛᴜs</b>      — sʏsᴛᴇᴍ ʜᴇᴀʟᴛʜ\n' +
    '┃  💬 <b>ᴄᴏɴᴛᴀᴄᴛ</b>     — @Exodileepic\n' +
    (isOwner ? '┃  📊 <b>sᴇssɪᴏɴs</b>    — ᴍᴀɴᴀɢᴇ ᴀʟʟ\n' : '') +
    '┃\n' +
    '⚠️ <b>ᴊᴏɪɴ ᴄʜᴀɴɴᴇʟ & ɢʀᴏᴜᴘ ꜰɪʀsᴛ!</b>\n\n' +
    '☣️ <i>ᴇxᴏᴅɪʟᴇ xᴅ — ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ</i>'
  );
}
function welcomeTxtOld(name) {
  return (
    '✞━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n' +
    '☠️  ⟨ <b>𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 𝗖𝗢𝗡𝗧𝗥𝗢𝗟 𝗣𝗔𝗡𝗘𝗟</b> ⟩  ☠️\n' +
    '✞━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n\n' +
    '💀 <b>Welcome back, ' + (name || 'User') + '!</b>\n\n' +
    '┃  🤖 <b>Bot:</b>  ' + BOT_NAME + '\n' +
    '┃  ⚔️  <b>Status:</b>  Online &amp; Armed\n' +
    '┃  🦠 <b>Mode:</b>  Ready to Deploy\n' +
    '┃  ☣️  <b>Dev:</b>  PRIME KILLER CRASHER DEVELOPER\n\n' +
    '╔══════════════════════════╗\n' +
    '║  📱  Pair WhatsApp Device  ║\n' +
    '║  ⚡  Instant bot linking   ║\n' +
    '║  🔒  Secure &amp; Private     ║\n' +
    '╚══════════════════════════╝\n\n' +
    '⚠️ <b>Join our channel &amp; group first!</b>\n' +
    '☣️ <i>𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝘾𝙍𝘼𝙎𝙃𝙀𝙍 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍</i>'
  );
}

// ── /start ────────────────────────────────────────────────────
async function handleStart(chatId, firstName, userId) {
  var isOwner = OWNER_ID && String(userId) === String(OWNER_ID);
  var photo = getMedia('start_photo') || getMedia('menu_photo');
  var text  = welcomeTxt(firstName, isOwner);
  var r, msgType;
  if (photo) {
    r = await sendPhoto(chatId, photo, text, { reply_markup: mainKb(userId) });
    msgType = (r && r.ok) ? 'photo' : 'text';
  }
  if (!photo || !r || !r.ok) {
    r       = await sendMsg(chatId, text, { reply_markup: mainKb(userId) });
    msgType = 'text';
  }
  userState.set(String(chatId), { step: 'idle', msgId: r && r.result ? r.result.message_id : null, msgType: msgType });
}

// ── Pair step 1: check channels, ask for number ───────────────
async function handlePairStart(chatId, userId, curState) {
  var missing = await getMissingChannels(userId);
  if (missing.length) {
    var joinKb = {
      inline_keyboard: missing.map(function(c) {
        return [{ text: '➡️ Join: ' + c.name, url: c.link }];
      }).concat([[{ text: '✅ I Joined — Check Again', callback_data: 'pair_start' }]])
    };
    var text =
      '⛔ <b>Access Restricted</b>\n\n' +
      'Join these to use the bot:\n\n' +
      missing.map(function(c) { return '• <a href="' + c.link + '">' + c.name + '</a>'; }).join('\n') +
      '\n\nTap <b>I Joined</b> after joining.';
    if (curState && curState.msgId) return smartEdit(chatId, curState.msgId, curState.msgType, text, { reply_markup: joinKb });
    return sendMsg(chatId, text, { reply_markup: joinKb });
  }

  userState.set(String(chatId), Object.assign({}, curState || {}, { step: 'awaiting_number' }));
  var text2 =
    '📱 <b>Enter Your WhatsApp Number</b>\n\n' +
    'Include country code, no <code>+</code> or spaces:\n\n' +
    '<code>2547******</code>  (Kenya)\n' +
    '<code>2348******</code> (Nigeria)\n' +
    '<code>447********</code>  (UK)\n\n' +
    '👇 type your number:';
  if (curState && curState.msgId) return smartEdit(chatId, curState.msgId, curState.msgType, text2, { reply_markup: backKb() });
  return sendMsg(chatId, text2, { reply_markup: backKb() });
}

// ── Pair step 2: LEO's proven pairing logic ───────────────────
async function handlePairNumber(chatId, userId, rawNum, _startBotFn) {
  var num = rawNum.replace(/[^0-9]/g, '');
  if (!num || num.length < 7 || num.length > 15) {
    return sendMsg(chatId, '❌ Invalid number. Send digits only, e.g. <code>254784747151</code>', { reply_markup: backKb() });
  }

  var prevState = userState.get(String(chatId)) || {};
  userState.set(String(chatId), Object.assign({}, prevState, { step: 'idle' }));

  // -- "Connecting..." message
  var waitPhoto = getMedia('start_photo') || getMedia('menu_photo');
  var waitText  = '✞━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n' + '☠️  ⟨ <b>ᴄᴏɴɴᴇᴄᴛɪɴɢ ᴛᴏ ᴡʜᴀᴛsᴀᴘᴘ</b> ⟩  ☠️\n' + '✞━━━━━━━━━━━━━━━━━━━━━━━━━━━✞\n\n' + '📱 <b>ɴᴜᴍʙᴇʀ:</b>  <code>+' + num + '</code>\n' + '⏳ ɢᴇɴᴇʀᴀᴛɪɴɢ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ...\n' + '🔄 ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ~5 sᴇᴄᴏɴᴅs\n\n' + '☣️ <i>ᴇxᴏᴅɪʟᴇ xᴅ — ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ</i>';
  var waitRes, waitMsgType;
  if (waitPhoto) {
    waitRes     = await sendPhoto(chatId, waitPhoto, waitText);
    waitMsgType = (waitRes && waitRes.ok) ? 'photo' : 'text';
  }
  if (!waitPhoto || !waitRes || !waitRes.ok) {
    waitRes     = await sendMsg(chatId, waitText);
    waitMsgType = 'text';
  }
  var waitMsgId = waitRes && waitRes.result ? waitRes.result.message_id : null;

  // -- Clean up any stale socket for this number
  if (pairSockets.has(num)) {
    try { pairSockets.get(num).conn.ws.close(); } catch(e) {}
    clearTimeout(pairSockets.get(num).timeoutId);
    pairSockets.delete(num);
  }

  // -- Session paths
  var tempPath  = path.join(PAIR_DIR, 'pair_' + num);
  var finalPath = path.join(SESSIONS_DIR, 'wa_' + num);

  // Clean up any previous incomplete temp session
  if (fs.existsSync(tempPath)) {
    try { fs.rmSync(tempPath, { recursive: true, force: true }); } catch(e) {}
  }
  fs.mkdirSync(tempPath, { recursive: true });

  console.log('[PAIR] Session directory created for ' + num + '.');

  async function showError(msg) {
    var errText = '❌ <b>Pairing Failed</b>\n\n' + msg + '\n\nPlease try again.';
    if (waitMsgId) {
      await smartEdit(chatId, waitMsgId, waitMsgType, errText, { reply_markup: retryKb() }).catch(function() {});
    } else {
      await sendMsg(chatId, errText, { reply_markup: retryKb() });
    }
  }

  // Notify user that directory was created and code is generating
  if (waitMsgId) {
    await smartEdit(chatId, waitMsgId, waitMsgType,
      '✅ Session directory created for +' + num + '.\n\n⏳ Generating pairing code...'
    ).catch(function() {});
  }

  // ── Inner function matching Leo's startWhatsAppBot() exactly ──
  async function startPairSocket() {
    var openHandled   = false;
    var codeGenerated = false;

    try {
      var versionInfo = await fetchLatestBaileysVersion();
      var version = versionInfo.version;

      var authInfo = await useMultiFileAuthState(tempPath);
      var state    = authInfo.state;
      var saveCreds = authInfo.saveCreds;

      // ── EXACT socket config from Leo ──────────────────────────
      // Leo's EXACT socket options — verified line by line from Leo's working code.
      // connectTimeoutMs was the cause of code 515: it killed the socket after 60s
      // of WA handshake before the user could enter the code. Leo has NO connectTimeoutMs.
      var NodeCache = require('node-cache');
      var msgRetryCounterCache = new NodeCache();
      var conn = makeWASocket({
        version: version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Opera', '100.0.4815.0'],
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
        keepAliveIntervalMs: 5000,
      });

      conn.ev.on('creds.update', saveCreds);

      // No auto-kill timer — let the connection stay alive until WhatsApp
      // closes it or the user successfully pairs. A timer was causing the
      // socket to be destroyed before pairing completed (code 515 loop).
      var timeoutId = null;

      pairSockets.set(num, { conn: conn, timeoutId: timeoutId });

      // ── LEO's pairing pattern ─────────────────────────────────
      // Check if creds already registered OR if code was already generated
      // (reconnecting after WA's 515 close post code-entry — creds are now registered)
      if (conn.authState.creds.registered || codeGenerated) {
        // Already registered or code just accepted by WA — save and wait for 'open'
        await saveCreds();
        console.log('[PAIR] Creds confirmed for ' + num + ' — waiting for open...');
      } else {
        // NOT registered - request pairing code after 3000ms (Leo's exact pattern)
        setTimeout(async function() {
          if (codeGenerated || openHandled) return;
          try {
            var code = await conn.requestPairingCode(num);
            code = (code && code.match(/.{1,4}/g) ? code.match(/.{1,4}/g).join('-') : code);
            codeGenerated = true;

            console.log('[PAIR] Code for +' + num + ': ' + code);

            var codeText =
              '✞━━━━━━━━━━━━━━━━━━━━━━━━━✞\n' +
              '☠️  ⟨ <b>𝗘𝗫𝗢𝗗𝗜𝗟𝗘 𝗫𝗗 — 𝗣𝗔𝗜𝗥 𝗖𝗢𝗗𝗘</b> ⟩  ☠️\n' +
              '✞━━━━━━━━━━━━━━━━━━━━━━━━━✞\n\n' +
              '📱 <b>Number:</b>  <code>+' + num + '</code>\n\n' +
              '🔑 <b>Your Code:</b>\n' +
              '┌─────────────────────────┐\n' +
              '│   <code>' + code + '</code>   │\n' +
              '└─────────────────────────┘\n\n' +
              '📋 <b>How to link:</b>\n' +
              '➽  Open WhatsApp → <b>Settings</b>\n' +
              '➽  Tap <b>Linked Devices</b>\n' +
              '➽  Tap <b>Link a Device</b>\n' +
              '➽  Choose <b>Link with phone number</b>\n' +
              '➽  Enter the code above\n\n' +
              '⚠️  Code expires in <b>~60 seconds</b>\n' +
              '✅  Bot session stays safe!\n\n' +
              '☣️ <i>𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝘾𝙍𝘼𝙎𝙃𝙀𝙍 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍</i>';

            if (waitMsgId) {
              await smartEdit(chatId, waitMsgId, waitMsgType, codeText, { reply_markup: codeKb(code) }).catch(function() {});
            } else {
              await sendMsg(chatId, codeText, { reply_markup: codeKb(code) });
            }

          } catch (e) {
            console.error('[PAIR] requestPairingCode failed for ' + num + ':', e.message);
            if (!codeGenerated && !openHandled) {
              if (timeoutId) clearTimeout(timeoutId);
              pairSockets.delete(num);
              try { conn.ws.close(); } catch(e2) {}
              try { fs.rmSync(tempPath, { recursive: true, force: true }); } catch(e2) {}
              await showError('Failed to generate pairing code: ' + e.message);
            }
          }
        }, 1000); // reduced for faster pairing
      }

      // ── Connection event handler ──────────────────────────────
      conn.ev.on('connection.update', async function(update) {
        var connection     = update.connection;
        var lastDisconnect = update.lastDisconnect;

        // ── Paired successfully (Leo's pattern) ──────────────
        if (connection === 'open') {
          if (openHandled) return;
          openHandled = true;
          console.log('[PAIR] +' + num + ' successfully paired!');

          if (timeoutId) clearTimeout(timeoutId);
          pairSockets.delete(num);
          await saveCreds();

          // Set WA bio
          try {
            await conn.updateProfileStatus(PAIR_BIO);
            console.log('[PAIR] Bio updated for +' + num);
          } catch (e) {
            console.warn('[PAIR] Bio update skipped:', e.message);
          }

          // Move creds to final path
          try {
            if (fs.existsSync(finalPath)) fs.rmSync(finalPath, { recursive: true, force: true });
            fs.renameSync(tempPath, finalPath);
            console.log('[PAIR] Session moved -> ' + finalPath);
          } catch (e) {
            console.error('[PAIR] Session move error:', e.message);
            // Fallback: copy instead of rename
            try {
              if (typeof fs.cpSync === 'function') {
                fs.cpSync(tempPath, finalPath, { recursive: true });
              } else {
                // Manual copy for older Node versions
                fs.mkdirSync(finalPath, { recursive: true });
                fs.readdirSync(tempPath).forEach(function(file) {
                  fs.copyFileSync(path.join(tempPath, file), path.join(finalPath, file));
                });
              }
              fs.rmSync(tempPath, { recursive: true, force: true });
              console.log('[PAIR] Session copied -> ' + finalPath + ' (fallback)');
            } catch (e2) {
              console.error('[PAIR] Session copy fallback also failed:', e2.message);
            }
          }

          // Close temp socket
          try { conn.ws.close(); } catch(e) {}

          // Boot main bot with _startBotFn (NO circular require - passed from index.js)
          setTimeout(async function() {
            try {
              console.log('[PAIR] Booting main bot for +' + num + '...');
              await _startBotFn(finalPath);
            } catch (e) {
              console.error('[PAIR] startBot error:', e.message);
            }
          }, 500);

          // Notify user on Telegram
          var successPhoto = getMedia('start_photo') || getMedia('menu_photo');
          var successText  =
            '✞━━━━━━━━━━━━━━━━━━━━━━━━━✞\n' +
            '☠️  ⟨ <b>𝗣𝗔𝗜𝗥𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬</b> ⟩  ☠️\n' +
            '✞━━━━━━━━━━━━━━━━━━━━━━━━━✞\n\n' +
            '✅ <b>WhatsApp Connected!</b>\n\n' +
            '┃  📱 <b>Number:</b>  <code>+' + num + '</code>\n' +
            '┃  🤖 <b>Bot:</b>     ' + BOT_NAME + '\n' +
            '┃  ⚡ <b>Status:</b>  Online &amp; Armed\n' +
            '┃  🔥 <b>Mode:</b>   Public\n\n' +
            '💀 Send <b>.menu</b> in WhatsApp to begin!\n\n' +
            '☣️ <i>𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝘾𝙍𝘼𝙎𝙃𝙀𝙍 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍</i>';

          if (successPhoto) {
            await sendPhoto(chatId, successPhoto, successText, { reply_markup: mainKb() })
              .catch(function() { return sendMsg(chatId, successText, { reply_markup: mainKb() }); });
          } else {
            await sendMsg(chatId, successText, { reply_markup: mainKb() });
          }

          // Notify owner
          if (OWNER_ID && String(chatId) !== String(OWNER_ID)) {
            var ownerText =
              '🔔 <b>New Pair!</b>\n\n' +
              '📱 Number: <code>+' + num + '</code>\n' +
              '👤 Telegram user: <code>' + userId + '</code>\n' +
              '⏰ Time: ' + new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' });
            await sendMsg(OWNER_ID, ownerText).catch(function() {});
          }

          // Print ASCII banner to VPS console
          printPairSuccessBanner(num);
        }

        // ── Connection closed before pairing (Leo pattern) ───
        if (connection === 'close' && !openHandled) {
          var statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
            ? lastDisconnect.error.output.statusCode
            : null;
          console.log('[PAIR] Connection closed for ' + num + ', code:', statusCode);

          // Permanent failures - clean up and show error
          if (
            statusCode === DisconnectReason.loggedOut ||
            statusCode === 401 ||
            statusCode === 403
          ) {
            if (timeoutId) clearTimeout(timeoutId);
            pairSockets.delete(num);
            try { fs.rmSync(tempPath, { recursive: true, force: true }); } catch(e) {}
            await showError('Session rejected by WhatsApp. Please try again.');
            return;
          }

          // Code 515 has TWO completely different meanings depending on timing:
          //
          // CASE A — codeGenerated is FALSE (515 before user entered code):
          //   WA dropped the socket during the initial handshake.
          //   Wipe temp session, retry fresh to get a new code.
          //
          // CASE B — codeGenerated is TRUE (515 AFTER user entered the code in WA):
          //   This is NORMAL. WA intentionally closes the pairing socket once it accepts
          //   the code. The creds are now registered on WA's side. Do NOT delete the
          //   temp folder — reconnect the socket so it comes back as 'open'.
          //   Deleting the creds here was the real bug: "pairs but never fully connects".
          if (statusCode === 515) {
            if (timeoutId) clearTimeout(timeoutId);
            pairSockets.delete(num);

            if (codeGenerated) {
              // CASE B: code was entered — reconnect WITHOUT wiping creds
              console.log('[PAIR] Code 515 AFTER code entry for ' + num + ' — reconnecting to confirm...');
              if (waitMsgId) {
                await smartEdit(chatId, waitMsgId, waitMsgType,
                  '\u23f3 <b>Verifying pairing...</b>\n\nWhatsApp is confirming your code for <code>+' + num + '</code>. Please wait...'
                ).catch(function() {});
              }
              setTimeout(async function() {
                if (!openHandled) {
                  startPairSocket().catch(function(e) {
                    console.error('[PAIR] Post-515 confirm failed for ' + num + ':', e.message);
                  });
                }
              }, 1500);
            } else {
              // CASE A: 515 before code — socket dropped before user entered anything
              try { fs.rmSync(tempPath, { recursive: true, force: true }); } catch(e) {}
              console.log('[PAIR] Code 515 before code entry for ' + num + ' — retrying fresh...');
              if (waitMsgId) {
                await smartEdit(chatId, waitMsgId, waitMsgType,
                  '\ud83d\udd04 <b>Reconnecting...</b>\n\nGetting you a fresh pairing code for <code>+' + num + '</code>...'
                ).catch(function() {});
              }
              setTimeout(async function() {
                if (!openHandled) {
                  codeGenerated = false;
                  fs.mkdirSync(tempPath, { recursive: true });
                  startPairSocket().catch(function(e) {
                    console.error('[PAIR] 515 fresh retry failed for ' + num + ':', e.message);
                  });
                }
              }, 500);
            }
            return;
          }

          // Bad session
          if (statusCode === DisconnectReason.badSession || statusCode === 500) {
            if (timeoutId) clearTimeout(timeoutId);
            pairSockets.delete(num);
            try { fs.rmSync(tempPath, { recursive: true, force: true }); } catch(e) {}
            await showError('Bad session. Please try again.');
            return;
          }

          // ── Auto-reconnect on any non-fatal close ──────────
          console.log('[PAIR] Non-fatal disconnect (' + statusCode + ') for ' + num + ' - restarting socket...');
          setTimeout(async function() {
            if (!openHandled) {
              if (codeGenerated) {
                // Code was already sent to user — reconnect keeping creds so we
                // can reach 'open' without requesting a new code.
                startPairSocket().catch(function(e) {
                  console.error('[PAIR] Retry (keep creds) failed for ' + num + ':', e.message);
                });
              } else {
                // No code sent yet — wipe and start fresh
                try { fs.rmSync(tempPath, { recursive: true, force: true }); } catch(e) {}
                fs.mkdirSync(tempPath, { recursive: true });
                startPairSocket().catch(function(e) {
                  console.error('[PAIR] Retry (fresh) failed for ' + num + ':', e.message);
                });
              }
            }
          }, 500);
        }
      });

    } catch (e) {
      console.error('[PAIR] Socket init error:', e.message);
      await showError(e.message);
    }
  }

  // Start the pairing socket
  startPairSocket();
}

// ── ASCII banner to VPS console on successful pair ────────────
function printPairSuccessBanner(num) {
  var R  = '\x1b[0m';
  var b  = '\x1b[1m\x1b[35m';
  var g  = '\x1b[1m\x1b[32m';
  var cy = '\x1b[1m\x1b[36m';
  var gl = '\x1b[1m\x1b[33m';

  console.log('');
  console.log(b + '╔══════════════════════════════════════════════════════════════╗' + R);
  console.log(b + '║                                                              ║' + R);
  console.log(b + '║       ᎬХϴᎠᏆᏞᎬ ХᎠ connect successful              ║' + R);
  console.log(b + '║                                                              ║' + R);
  console.log(b + '╠══════════════════════════════════════════════════════════════╣' + R);
  console.log(g  + '║  Paired Successfully                                         ║' + R);
  console.log(cy + ('║  Number  : +' + String(num)).padEnd(63) + '║' + R);
  console.log(gl + ('║  Time    : '  + new Date().toLocaleString('en-GB', { hour12: false })).padEnd(63) + '║' + R);
  console.log(cy + '║  Bot is now booting on this session...                       ║' + R);
  console.log(b + '╚══════════════════════════════════════════════════════════════╝' + R);
  console.log('');
}

// ── Sessions ──────────────────────────────────────────────────
async function handleSessions(chatId, curState) {
  try {
    var mgr  = require('./lib/sessionManager');
    var list = mgr.listSessions();
    var text;
    if (!list.length) {
      text = '📊 <b>Sessions</b>\n\nNo sessions paired yet. Use 📱 Pair Device to connect.';
    } else {
      var onlineCount  = list.filter(function(s) { return s.online; }).length;
      var totalCount   = list.length;
      var rows = list.map(function(s, i) {
        var statusIcon, statusText;
        if (s.online) {
          var mins = Math.floor(s.uptime / 60);
          statusIcon = '🟢';
          statusText = 'Online' + (mins > 0 ? ' (' + mins + 'm)' : '');
        } else if (s.connecting) {
          statusIcon = '🟡';
          statusText = 'Connecting...';
        } else {
          statusIcon = '🔴';
          statusText = 'Offline';
        }
        var paired = s.pairedAt ? '\n   🗓 ' + new Date(s.pairedAt).toLocaleDateString() : '';
        return (i + 1) + '. <code>' + s.sessionId + '</code>\n' +
          '   ' + statusIcon + ' ' + statusText + paired;
      }).join('\n\n');
      text = '📊 <b>Sessions — ' + onlineCount + '/' + totalCount + ' online</b>\n\n' + rows;
    }
    if (curState && curState.msgId) return smartEdit(chatId, curState.msgId, curState.msgType, text, { reply_markup: backKb() });
    return sendMsg(chatId, text, { reply_markup: backKb() });
  } catch (e) {
    return sendMsg(chatId, '❌ Error: ' + e.message, { reply_markup: backKb() });
  }
}

// ── Status ────────────────────────────────────────────────────
async function handleDeleteSessionMenu(chatId, curState) {
  try {
    var mgr  = require('./lib/sessionManager');
    var list = mgr.listSessions ? mgr.listSessions() : [];
    if (!list.length) {
      var t = '📊 <b>sᴇssɪᴏɴs</b>\n\nNo sessions to delete.';
      if (curState && curState.msgId) return smartEdit(chatId, curState.msgId, curState.msgType, t, { reply_markup: backKb() });
      return sendMsg(chatId, t, { reply_markup: backKb() });
    }
    var kb = list.map(function(s) {
      return [{ text: '🗑️ Delete: ' + s.sessionId + (s.online ? ' 🟢' : ' 🔴'), callback_data: 'del_sess_' + s.sessionId }];
    });
    kb.push([{ text: '« ʙᴀᴄᴋ', callback_data: 'menu' }]);
    var text = '✞━━━━━━━━━━━━━━━━━━━━━━✞\n' +
               '🗑️  ⟨ <b>ᴅᴇʟᴇᴛᴇ sᴇssɪᴏɴ</b> ⟩  🗑️\n' +
               '✞━━━━━━━━━━━━━━━━━━━━━━✞\n\n' +
               '⚠️ Select a session to delete:\n\n' +
               list.map(function(s, i) {
                 return (i+1) + '. <code>' + s.sessionId + '</code> ' + (s.online ? '🟢' : '🔴');
               }).join('\n');
    if (curState && curState.msgId) return smartEdit(chatId, curState.msgId, curState.msgType, text, { reply_markup: { inline_keyboard: kb } });
    return sendMsg(chatId, text, { reply_markup: { inline_keyboard: kb } });
  } catch(e) {
    return sendMsg(chatId, '❌ Error: ' + e.message, { reply_markup: backKb() });
  }
}

async function handleDeleteSession(chatId, curState, sessId) {
  try {
    var sessPath = require('path').join(SESSIONS_DIR, sessId);
    var fs2 = require('fs');
    if (fs2.existsSync(sessPath)) {
      fs2.rmSync(sessPath, { recursive: true, force: true });
      var text = '✅ <b>Session Deleted</b>\n\n<code>' + sessId + '</code> has been removed.\n\n☣️ <i>ᴇxᴏᴅɪʟᴇ ᴢᴇɴᴛʀɪx xᴅᴍᴅ ᴛᴇᴄʜ</i>';
    } else {
      var text = '⚠️ Session <code>' + sessId + '</code> not found or already deleted.';
    }
    if (curState && curState.msgId) return smartEdit(chatId, curState.msgId, curState.msgType, text, { reply_markup: backKb() });
    return sendMsg(chatId, text, { reply_markup: backKb() });
  } catch(e) {
    return sendMsg(chatId, '❌ Error: ' + e.message, { reply_markup: backKb() });
  }
}

async function handleStatus(chatId, curState) {
  var up  = Math.floor(process.uptime());
  var h   = Math.floor(up / 3600);
  var m   = Math.floor((up % 3600) / 60);
  var s   = up % 60;
  var ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);
  var sessions = 0;
  try { sessions = require('./lib/sessionManager').activeCount(); } catch(e) {}
  var text =
    '✞━━━━━━━━━━━━━━━━━━━━━━━━━✞\n' +
    '⚡  ⟨ <b>sʏsᴛᴇᴍ sᴛᴀᴛᴜs</b> ⟩  ⚡\n' +
    '✞━━━━━━━━━━━━━━━━━━━━━━━━━✞\n\n' +
    '┃  🕐 <b>ᴜᴘᴛɪᴍᴇ:</b>   ' + h + 'ʜ ' + m + 'ᴍ ' + s + 's\n' +
    '┃  💾 <b>ʀᴀᴍ:</b>      ' + ram + ' ᴍʙ\n' +
    '┃  ☣️  <b>ɴᴏᴅᴇ:</b>    ' + process.version + '\n' +
    '┃  📊 <b>sᴇssɪᴏɴs:</b> ' + sessions + ' ᴀᴄᴛɪᴠᴇ\n' +
    '┃  🟢 <b>sᴛᴀᴛᴜs:</b>  ᴏɴʟɪɴᴇ ✅\n\n' +
    '☣️ <i>ᴇxᴏᴅɪʟᴇ xᴅ — ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ</i>';
  if (curState && curState.msgId) return smartEdit(chatId, curState.msgId, curState.msgType, text, { reply_markup: backKb() });
  return sendMsg(chatId, text, { reply_markup: backKb() });
}

// ── Update processor factory ──────────────────────────────────
function makeProcessor(_startBotFn) {
  return async function processUpdate(update) {
    try {
      var cb  = update.callback_query;
      var msg = update.message;

      if (cb) {
        var chatId  = String(cb.message && cb.message.chat ? cb.message.chat.id : '');
        var msgId   = cb.message ? cb.message.message_id : null;
        var userId  = cb.from ? cb.from.id : null;
        var msgType = (cb.message && cb.message.photo && cb.message.photo.length) ? 'photo' : 'text';
        var curSt   = { step: 'idle', msgId: msgId, msgType: msgType };
        await answerCB(cb.id);

        if (cb.data === 'menu') {
          var isOwner2 = OWNER_ID && String(userId) === String(OWNER_ID);
          var txt   = welcomeTxt(cb.from ? cb.from.first_name : null, isOwner2);
          var photo = getMedia('start_photo') || getMedia('menu_photo');
          if (photo && msgType === 'photo') {
            await editCaption(chatId, msgId, txt, { reply_markup: mainKb(userId) });
          } else {
            await editText(chatId, msgId, txt, { reply_markup: mainKb(userId) })
              .catch(function() { return sendMsg(chatId, txt, { reply_markup: mainKb(userId) }); });
          }
        } else if (cb.data === 'pair_start') {
          await handlePairStart(chatId, userId, curSt);
        } else if (cb.data === 'sessions') {
          if (!OWNER_ID || String(userId) !== String(OWNER_ID)) {
            await answerCB(cb.id, '⛔ Owner only!');
            return;
          }
          await handleSessions(chatId, curSt);
        } else if (cb.data === 'del_session_menu') {
          if (!OWNER_ID || String(userId) !== String(OWNER_ID)) {
            await answerCB(cb.id, '⛔ Owner only!');
            return;
          }
          await handleDeleteSessionMenu(chatId, curSt);
        } else if (cb.data.startsWith('del_sess_')) {
          if (!OWNER_ID || String(userId) !== String(OWNER_ID)) {
            await answerCB(cb.id, '⛔ Owner only!');
            return;
          }
          var sessId = cb.data.replace('del_sess_', '');
          await handleDeleteSession(chatId, curSt, sessId);
        } else if (cb.data === 'status') {
          if (!OWNER_ID || String(userId) !== String(OWNER_ID)) {
            await answerCB(cb.id, '⛔ Owner only!');
            return;
          }
          await handleStatus(chatId, curSt);
        }
        return;
      }

      if (!msg) return;
      var chatId2    = String(msg.chat.id);
      var userId2    = msg.from ? msg.from.id : null;
      var firstName  = (msg.from && msg.from.first_name) ? msg.from.first_name : 'User';
      var text       = (msg.text || '').trim();

      var st = userState.get(chatId2);
      if (st && st.step === 'awaiting_number' && text && !text.startsWith('/')) {
        return handlePairNumber(chatId2, userId2, text, _startBotFn);
      }

      if (text.startsWith('/start')) {
        return handleStart(chatId2, firstName);
      } else if (text.startsWith('/menu')) {
        return handleStart(chatId2, firstName);
      } else if (text.startsWith('/pair')) {
        var num = text.split(/\s+/)[1];
        var cs  = userState.get(chatId2) || { step: 'idle', msgType: 'text', msgId: null };
        if (num) return handlePairNumber(chatId2, userId2, num, _startBotFn);
        return handlePairStart(chatId2, userId2, cs);
      } else if (text.startsWith('/sessions')) {
        return handleSessions(chatId2, null);
      } else if (text.startsWith('/status')) {
        return handleStatus(chatId2, null);
      } else if (text.startsWith('/help')) {
        return handleStart(chatId2, firstName);
      } else if (text.startsWith('/')) {
        return sendMsg(chatId2, '❓ Unknown command. Use /start', { reply_markup: mainKb() });
      }

    } catch (e) {
      console.error('[TG] processUpdate error:', e.message);
    }
  };
}

// ── Long-polling ──────────────────────────────────────────────
var polling = false;
function startPolling(processUpdate) {
  async function poll() {
    if (polling) return;
    polling = true;
    try {
      var res = await httpPost(
        'https://api.telegram.org/bot' + TOKEN + '/getUpdates',
        { offset: OFFSET, timeout: 20, allowed_updates: ['message', 'callback_query'] },
        25000
      );
      var results = (res && res.result) ? res.result : [];
      for (var i = 0; i < results.length; i++) {
        var u = results[i];
        OFFSET = u.update_id + 1;
        processUpdate(u).catch(function(e) { console.error('[TG] Error:', e.message); });
      }
    } catch (e) {
      if (!e.message || (!e.message.includes('timeout') && !e.message.includes('ENOTFOUND') && !e.message.includes('ECONNRESET')))
        console.error('[TG] Poll error:', e.message);
    }
    polling = false;
    setTimeout(poll, 400);
  }
  poll();
}

// ── Startup banner to owner ───────────────────────────────────
async function sendStartBanner() {
  if (!OWNER_ID) return;
  var photo = getMedia('banner_photo') || getMedia('start_photo');
  var text  =
    '✦ <b>𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃 — Online!</b>\n\n' +
    '✧ Bot started successfully\n' +
    '✧ Pro: Exodile Shan\n' +
    '✧ Squad: Xd vault \n' +
    '✧ Time: ' + new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' });
  if (photo) {
    await sendPhoto(OWNER_ID, photo, text).catch(function() { return sendMsg(OWNER_ID, text); });
  } else {
    await sendMsg(OWNER_ID, text);
  }
}

// ── Start ─────────────────────────────────────────────────────
// Receives startBotFn as parameter from index.js - NO circular require
async function startTelegram(startBotFn) {
  console.log('[TELEGRAM] Starting...');

  // Clear stale queued updates
  try {
    var res = await httpPost('https://api.telegram.org/bot' + TOKEN + '/getUpdates', { offset: -1, timeout: 5 }, 8000);
    var r   = (res && res.result) ? res.result : [];
    if (r.length) OFFSET = r[r.length - 1].update_id + 1;
  } catch(e) {}

  await sendStartBanner();

  var processUpdate = makeProcessor(startBotFn);
  startPolling(processUpdate);

  console.log('[TELEGRAM] Ready and polling');
}

module.exports = { startTelegram: startTelegram };
