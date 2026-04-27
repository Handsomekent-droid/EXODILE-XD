'use strict';
const chalk  = require('chalk');
const PhoneNumber = require('awesome-phonenumber');
const settings = require('../settings');

// ── ᴘᴀʟᴇᴛᴛᴇ ────────────────────────────────────────────────────
const C = {
  border : chalk.hex('#7B2FFF'),
  title  : chalk.hex('#FF2EFF').bold,
  accent : chalk.hex('#00FFD0'),
  gold   : chalk.hex('#FFD700'),
  cyan   : chalk.hex('#00E5FF'),
  green  : chalk.hex('#39FF14'),
  purple : chalk.hex('#BF5FFF'),
  pink   : chalk.hex('#FF6EC7'),
  warn   : chalk.hex('#FFAA00'),
  err    : chalk.hex('#FF3355'),
  info   : chalk.hex('#4FC3F7'),
  dim    : chalk.hex('#555577'),
  white  : chalk.hex('#E8E8FF'),
  time   : chalk.bgHex('#0A0A1A').hex('#7B2FFF').bold,
};

function ts() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: settings.timeZone || 'Africa/Nairobi',
  });
}
function ds() {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: settings.timeZone || 'Africa/Nairobi',
  });
}

// ── ɢʟᴏᴡɪɴɢ sᴛᴀʀᴛᴜᴘ ʙᴀɴɴᴇʀ ───────────────────────────────────
function printBanner(info = {}) {
  const W = 58;
  const HL = C.border('║');
  const row = (txt) => {
    const plain = txt.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = Math.max(0, W - plain.length);
    const l = Math.floor(pad / 2), r = pad - l;
    return HL + ' '.repeat(l) + txt + ' '.repeat(r) + HL;
  };
  const hLine  = (l, m, r) => C.border(l + '═'.repeat(W) + r);
  const blank  = HL + ' '.repeat(W) + HL;

  console.log('\n');
  console.log(hLine('╔','','╗'));
  console.log(C.border(blank));
  console.log(row(C.title('  ཌ𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿ད  ')));
  console.log(row(C.purple(' ᴇxᴏᴅɪʟᴇ xᴅ ᴇᴍᴘɪʀᴇ ᴡʜᴀᴛsᴀᴘᴘ ᴀᴜᴛᴏᴍᴀᴛᴇᴅ ')));
  console.log(C.border(blank));
  console.log(hLine('╠','','╣'));
  console.log(row(C.cyan(' 🖥 ᴠᴇʀsɪᴏɴ  : ') + C.gold(settings.version || '3.0.0') + '                 '));
  console.log(row(C.cyan(' 👤 ᴏᴡɴᴇʀ    : ') + C.gold(settings.botOwner || 'ʟᴇᴏ') + '                  '));
  console.log(row(C.cyan(' 🛟 ᴘʀᴇꜰɪx   : ') + C.gold((settings.prefixes||['.']).join(' ')) + '                 '));
  console.log(row(C.cyan(' ⏱️ ᴛɪᴍᴇ     : ') + C.gold(ts()) + '                  '));
  console.log(row(C.cyan(' 🔮 ᴅᴀᴛᴇ     : ') + C.gold(ds()) + '                   '));
  if (info.commands !== undefined)
    console.log(row(C.cyan(' 𖤐 plugins  : ') + C.green(info.commands + ' loaded') + '              '));
  if (info.backend)
    console.log(row(C.cyan(' 𖤐 backend  : ') + C.green(info.backend) + '                '));
  if (info.sessions)
    console.log(row(C.cyan(' 𖤐 sessions : ') + C.green(info.sessions + ' ᴀᴄᴛɪᴠᴇ') + '               '));
  console.log(C.border(blank));
  console.log(hLine('╠','','╣'));
  console.log(row(C.accent(' ✧ ʙᴏᴛ ɪs ᴏɴʟɪɴᴇ ᴀɴᴅ ready ✧ ')));
  console.log(row(C.dim('   ᴘᴏᴡᴇʀᴇᴅ ʙʏ @ᴡʜɪsᴋᴇʏsᴏᴄᴋᴇᴛs/ʙᴀɪʟᴇʏs   ')));
  console.log(C.border(blank));
  console.log(hLine('╚','','╝'));
  console.log();
}

// ── ᴇxᴛʀᴀᴄᴛ ᴘʜᴏɴᴇ ──────────────────────────────────────────────
function extractPhone(jid) {
  if (!jid) return null;
  return jid.replace('@s.whatsapp.net','').replace('@lid','').replace('@g.us','').split(':')[0];
}

async function getName(jid, sock, pushName) {
  try {
    if (pushName && pushName.trim()) return pushName.trim();
    if (sock.store?.contacts?.[jid]) {
      const c = sock.store.contacts[jid];
      if (c.name || c.notify) return c.name || c.notify;
    }
    return jid.split('@')[0].split(':')[0];
  } catch { return jid.split('@')[0].split(':')[0]; }
}

// ── ᴍᴇssᴀɢᴇ ʟᴏɢɢᴇʀ ────────────────────────────────────────────
async function printMessage(message, sock) {
  try {
    if (!message?.key) return;
    const m       = message;
    const chatId  = m.key.remoteJid;
    const sender  = m.key.participant || m.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const fromMe  = m.key.fromMe;

    let sName = '', sPhone = '';
    try {
      if (fromMe) {
        sName  = sock.user?.name || 'ʙᴏᴛ';
        const bn = extractPhone(sock.user?.id || '');
        if (bn) { const pn = PhoneNumber('+'+bn); sPhone = pn.isValid() ? pn.getNumber('international') : bn; }
      } else {
        sName = await getName(sender, sock, m.pushName);
        const ph = extractPhone(sender);
        if (ph && ph.length >= 10) { const pn = PhoneNumber('+'+ph); sPhone = pn.isValid() ? pn.getNumber('international') : ph; }
        else sPhone = sender.split('@')[0].split(':')[0];
      }
    } catch(e) {
      sName  = m.pushName || sender.split('@')[0];
      sPhone = sender.split('@')[0].split(':')[0];
    }

    let chatName = null;
    try { if (isGroup) chatName = (await sock.groupMetadata(chatId).catch(()=>null))?.subject || null; } catch {}

    const mtype = Object.keys(m.message || {})[0];
    if (['senderKeyDistributionMessage','protocolMessage','reactionMessage'].includes(mtype)) return;

    const typeMap = {
      conversation:'ᴛᴇxᴛ', extendedTextMessage:'ᴛᴇxᴛ',
      imageMessage:'ɪᴍᴀɢᴇ', videoMessage:'ᴠɪᴅᴇᴏ',
      audioMessage:'ᴀᴜᴅɪᴏ', documentMessage:'ᴅᴏᴄ',
      stickerMessage:'sᴛɪᴄᴋᴇʀ', contactMessage:'ᴄᴏɴᴛᴀᴄᴛ', locationMessage:'ʟᴏᴄᴀᴛɪᴏɴ',
    };

    let msgText = '', fileSize = 0;
    if (m.message) {
      if      (mtype==='conversation')        msgText = m.message.conversation;
      else if (mtype==='extendedTextMessage') msgText = m.message.extendedTextMessage?.text||'';
      else if (mtype==='imageMessage')        { msgText = m.message.imageMessage?.caption||'[ɪᴍᴀɢᴇ]'; fileSize=m.message.imageMessage?.fileLength||0; }
      else if (mtype==='videoMessage')        { msgText = m.message.videoMessage?.caption||'[ᴠɪᴅᴇᴏ]'; fileSize=m.message.videoMessage?.fileLength||0; }
      else if (mtype==='audioMessage')        { const d=m.message.audioMessage?.seconds||0; msgText=`[ᴀᴜᴅɪᴏ ${Math.floor(d/60)}:${(d%60).toString().padStart(2,'0')}]`; fileSize=m.message.audioMessage?.fileLength||0; }
      else if (mtype==='documentMessage')     { msgText=`[📄 ${m.message.documentMessage?.fileName||'ᴅᴏᴄ'}]`; fileSize=m.message.documentMessage?.fileLength||0; }
      else if (mtype==='stickerMessage')      { msgText='[sᴛɪᴄᴋᴇʀ]'; fileSize=m.message.stickerMessage?.fileLength||0; }
      else if (mtype==='contactMessage')      msgText=`[👤 ${m.message.contactMessage?.displayName||'ᴄᴏɴᴛᴀᴄᴛ'}]`;
      else if (mtype==='locationMessage')     msgText='[📍 ʟᴏᴄᴀᴛɪᴏɴ]';
      else msgText=`[${mtype.replace('Message','')}]`;
    }

    let fsStr = '';
    if (fileSize > 0) { const u=['B','KB','MB','GB']; const i=Math.floor(Math.log(fileSize)/Math.log(1024)); fsStr=` (${(fileSize/Math.pow(1024,i)).toFixed(1)} ${u[i]})`; }

    const stamp = m.messageTimestamp ? new Date((m.messageTimestamp.low||m.messageTimestamp)*1000) : new Date();
    const tStr  = stamp.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:settings.timeZone||'Africa/Nairobi'});
    const dStr  = stamp.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:settings.timeZone||'Africa/Nairobi'});

    const isCmd     = msgText.startsWith('.')||msgText.startsWith('!')||msgText.startsWith('#')||msgText.startsWith('/');
    const dispType  = typeMap[mtype] || mtype.replace('Message','').toLowerCase();
    const dispSender = sName && sName !== sPhone ? `${sName} (${sPhone})` : sPhone;

    console.log(C.border('╭─✦──────────────────────────────────────────────────✦'));
    console.log(C.border('│') + ' ' + C.time(` ${tStr} `) + '  ' + C.gold(`❖ ${dStr}`) + '  ' + C.purple(`[${dispType}]`) + C.dim(fsStr));
    console.log(C.border('│') + ' ' + (fromMe ? C.green('✧ ʙᴏᴛ  ') : C.warn('✯ ꜰʀᴏᴍ ')) + C.white(dispSender));
    if (isGroup && chatName)
      console.log(C.border('│') + ' ' + C.info('𖤐 ɢʀᴘ   ') + C.cyan(chatName));
    else if (!isGroup)
      console.log(C.border('│') + ' ' + C.pink('❖ ᴅᴍ    ') + C.dim('ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ'));
    if (msgText) {
      const disp = msgText.length > 110 ? msgText.substring(0,110)+'…' : msgText;
      console.log(C.border('│') + ' ' + C.gold('✦ ᴍsɢ   ') + (isCmd ? C.green(disp) : fromMe ? C.cyan(disp) : C.white(disp)));
    }
    console.log(C.border('╰─✦──────────────────────────────────────────────────✦'));
    console.log();
  } catch(e) {
    console.log(C.err('❌ ʟᴏɢ error: ') + e.message);
  }
}

// ── ᴇᴠᴇɴᴛ ʟᴏɢɢᴇʀ ──────────────────────────────────────────────
function printLog(type, msg) {
  const now = ts();
  const map = {
    info:       [C.info,    '✧ info      '],
    success:    [C.green,   '✦ success   '],
    warning:    [C.warn,    '✯ warning   '],
    error:      [C.err,     '𖤐 error     '],
    connection: [C.cyan,    '❖ ᴄᴏɴɴᴇᴄᴛ   '],
    store:      [C.purple,  '✧ sᴛᴏʀᴇ     '],
    telegram:   [C.gold,    '✦ ᴛᴇʟᴇɢʀᴀᴍ  '],
    session:    [C.accent,  '𖤐 session   '],
  };
  const [color, icon] = map[type] || [C.white, '• ᴇᴠᴇɴᴛ     '];
  console.log(C.dim(`[${now}]`) + ' ' + color(icon) + color(msg));
}

module.exports = { printMessage, printLog, printBanner };

function printStartSuccess(info = {}) {
  const commands = info.commands || '?';
  const sessions = info.sessions || 1;
  const time     = new Date().toLocaleString('en-GB', { hour12: false });
  const lines = [
    '',
    '╔══════════════════════════════════════════════════════════════╗',
    '║                                                              ║',
    '║   ███████╗███████╗███╗   ██╗████████╗██████╗ ██╗██╗  ██╗   ║',
    '║      ███╔╝██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██║╚██╗██╔╝   ║',
    '║     ███╔╝ █████╗  ██╔██╗ ██║   ██║   ██████╔╝██║ ╚███╔╝    ║',
    '║    ███╔╝  ██╔══╝  ██║╚██╗██║   ██║   ██╔══██╗██║ ██╔██╗    ║',
    '║   ███████╗███████╗██║ ╚████║   ██║   ██║  ██║██║██╔╝ ██╗   ║',
    '║   ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝   ║',
    '║                   ᴇxᴏᴅɪʟᴇ xᴅ ʙʏ ᴇxᴏᴅɪᴄ ᴇᴍᴘɪʀᴇ                   ║',
    '║                                                              ║',
    '╠══════════════════════════════════════════════════════════════╣',
    `║  ✦  BOT IS ONLINE AND READY                                  ║`,
    `║  ✧  Plugins  : ${String(commands).padEnd(43)}║`,
    `║  ✧  Sessions : ${String(sessions).padEnd(43)}║`,
    `║  ✧  Time     : ${time.padEnd(43)}║`,
    '║                                                              ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
  ];
  lines.forEach(l => console.log(l));
}
module.exports.printStartSuccess = printStartSuccess;
