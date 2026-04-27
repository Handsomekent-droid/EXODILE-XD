'use strict';
const fs   = require('fs');
const path = require('path');
const settings       = require('../settings');
const store          = require('./lightweight_store');
const prefixStore    = require('./prefixStore');
const commandHandler = require('./commandHandler');
const { printMessage, printLog } = require('./print');
const { isBanned }   = require('./isBanned');
const { isSudo }     = require('./index');
const isOwnerOrSudo  = require('./isOwner');
const isAdmin        = require('./isAdmin');
const { handleAutoread }  = require('../plugins/autoread');
const { handleAutotypingForMessage, showTypingAfterCommand } = require('../plugins/autotyping');
const { storeMessage, handleMessageRevocation } = require('../plugins/antidelete');
const { handleAutoReact } = require('../plugins/areact');
const { handleBadwordDetection } = require('./antibadword');
const { handleLinkDetection }    = require('../plugins/antilink');
const { handleFilterDetection }  = require('../plugins/filter');
const { handleAntiGroupMention } = require('../plugins/antigroupmention');
const { handleTagDetection }     = require('../plugins/antitag');
const { handleMentionDetection } = require('../plugins/mention');
const { handleChatbotResponse }  = require('../plugins/chatbot');
const { handleTicTacToeMove }    = require('../plugins/tictactoe');
const { addCommandReaction } = require('./reactions');
const { getChannelInfo }         = require('./messageConfig');
const { withGuard }              = require('./rateguard');
const { sessionStore }           = require('./sessionStore'); // FIX: was used but never imported — caused silent ReferenceError on every message

let _blockPlugin = null;
function getBlockPlugin() {
  if (!_blockPlugin) {
    try { _blockPlugin = require('../plugins/blockplugin'); } catch { _blockPlugin = []; }
  }
  // find the one with isUserBlocked
  const arr = Array.isArray(_blockPlugin) ? _blockPlugin : [_blockPlugin];
  const found = arr.find(p => typeof p.isUserBlocked === 'function');
  return found || { isUserBlocked: () => false, isCmdBlocked: () => false };
}

const STICKER_FILE = path.join(__dirname, '../data/sticker_commands.json');

function channelInfo() { return getChannelInfo(); }

async function getStickerCommands() {
  try {
    const _ss = sessionStore(sock);
    const d = await _ss.getSetting('global', 'stickerCommands');
    if (d) return d;
    if (!fs.existsSync(STICKER_FILE)) return {};
    return JSON.parse(fs.readFileSync(STICKER_FILE, 'utf8'));
  } catch { return {}; }
}

async function handleMessages(sock, messageUpdate) {
  try {
    const { messages, type } = messageUpdate;
    if (type !== 'notify') return;
    const message = messages[0];
    if (!message?.message) return;

    await printMessage(message, sock);
    // addOwnerReaction removed — was firing unsolicited reactions on every message

    try {
      const ghost = await sessionStore(sock).getSetting('global', 'stealthMode');
      if (!ghost?.enabled) await handleAutoread(sock, message);
    } catch { await handleAutoread(sock, message).catch(()=>{}); }

    const chatId  = message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    if (message.message?.protocolMessage?.type === 0) {
      await handleMessageRevocation(sock, message); return;
    }

    await storeMessage(sock, message);
    // ── ᴀᴜᴛᴏ-ʀᴇᴀᴄᴛ ─────────────────────────────────────────────
    handleAutoReact(sock, message).catch(() => {});

    const senderId = message.key.participant || message.key.remoteJid;

    // ── sᴛɪᴄᴋᴇʀ ᴄᴏᴍᴍᴀɴᴅs ──────────────────────────────────────
    if (message.message?.stickerMessage) {
      const sha = message.message.stickerMessage.fileSha256;
      if (sha) {
        const hash = Buffer.from(sha).toString('base64');
        const stickers = await getStickerCommands();
        if (stickers[hash]) {
          const cmdText = stickers[hash].text;
          const [cmdName, ...cmdArgs] = cmdText.split(' ');
          for (const prefix of prefixStore.getPrefixes(prefixStore.getBotNum(sock))) {
            const found = commandHandler.getCommand(prefix+cmdName.toLowerCase(), prefixStore.getPrefixes(prefixStore.getBotNum(sock)));
            if (found) {
              const ctx = await buildContext(sock, message, chatId, senderId, isGroup, found);
              if (!ctx) return;
              await found.handler(sock, message, cmdArgs, ctx);
              await addCommandReaction(sock, message);
              return;
            }
          }
        }
      }
    }

    const msg = message.message || {};
    const rawText =
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      msg.videoMessage?.caption ||
      msg.documentWithCaptionMessage?.message?.imageMessage?.caption ||
      msg.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      msg.buttonsResponseMessage?.selectedButtonId ||
      msg.templateButtonReplyMessage?.selectedId ||
      msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
      msg.editedMessage?.message?.protocolMessage?.editedMessage?.conversation ||
      msg.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
      '';
    const messageText = rawText.trim();
    const userMessage = messageText.toLowerCase();

    const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
    const isOwnerCheck = message.key.fromMe || senderIsOwnerOrSudo;
    const senderIsSudo = await isSudo(senderId);

    // ── ʙᴀɴ ᴄʜᴇᴄᴋ ───────────────────────────────────────────
    const userBanned = await isBanned(senderId);
    if (userBanned && !userMessage.startsWith('.unban')) {
      if (Math.random() < 0.1) await sock.sendMessage(chatId, { text: 'ʏᴏᴜ ᴀʀᴇ ʙᴀɴɴᴇᴅ. ᴄᴏɴᴛᴀᴄᴛ ᴀɴ ᴀᴅᴍɪɴ.', ...channelInfo() });
      return;
    }

    // ── ʙʟᴏᴄᴋ ᴘʟᴜɢɪɴ ᴄʜᴇᴄᴋ ─────────────────────────────────
    const blockPlugin = getBlockPlugin();
    if (!isOwnerCheck && blockPlugin.isUserBlocked(senderId)) return; // silently drop blocked users

    // ── ᴛɪᴄᴛᴀᴄᴛᴏᴇ ─────────────────────────────────────────────
    if (/^[1-9]$/.test(userMessage) || userMessage === 'surrender') {
      await handleTicTacToeMove(sock, chatId, senderId, userMessage); return;
    }

    if (!message.key.fromMe) await store.incrementMessageCount(chatId, senderId);

    // ── ᴀɴᴛɪ-sᴘᴀᴍ — ᴄʜᴇᴄᴋ ᴀʟʟ ɪɴᴄᴏᴍɪɴɢ ᴍᴇssᴀɢᴇs ──────────────
    if (isGroup && !message.key.fromMe) {
      try {
        const { handleAntiSpam } = require('../plugins/antispam');
        await handleAntiSpam(sock, chatId, message, senderId);
      } catch {}
    }

    // ── ɢʀᴏᴜᴘ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ ────────────────────────────────────
    if (isGroup && userMessage) {
      await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
      await handleLinkDetection(sock, chatId, message, userMessage, senderId);
      await handleAntiGroupMention(sock, chatId, message, userMessage, senderId);
      await handleFilterDetection(sock, chatId, message, userMessage, senderId).catch(() => {});
    }

    // ── ᴅᴍ ᴘᴍ ʙʟᴏᴄᴋᴇʀ ──────────────────────────────────────
    if (!isGroup && !message.key.fromMe && !senderIsSudo) {
      try {
        const pm = require('../plugins/pmblocker');
        const state = await pm.readState?.();
        if (state?.enabled) {
          await sock.sendMessage(chatId, { text: state.message || 'ᴘʀɪᴠᴀᴛᴇ ᴍᴇssᴀɢᴇs ᴀʀᴇ ᴅɪsᴀʙʟᴇᴅ.' });
          await new Promise(r=>setTimeout(r,1500));
          await sock.updateBlockStatus(chatId, 'block');
          return;
        }
      } catch {}
    }

    const usedPrefix = prefixStore.getPrefixes(prefixStore.getBotNum(sock)).find(p => userMessage.startsWith(p));
    const command    = commandHandler.getCommand(userMessage, prefixStore.getPrefixes(prefixStore.getBotNum(sock)));

    if (!usedPrefix && !command) {
      await handleAutotypingForMessage(sock, chatId, userMessage);
      if (isGroup) {
        await handleTagDetection(sock, chatId, message, senderId);
        await handleMentionDetection(sock, chatId, message);
      }
      // ᴄʜᴀᴛʙᴏᴛ — ᴅᴍ: ᴀʟᴡᴀʏs | ɢᴄ: ᴍᴇɴᴛɪᴏɴ/ʀᴇᴘʟʏ ᴏɴʟʏ
      await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
      return;
    }

    if (!command) {
      if (isGroup) {
        await handleTagDetection(sock, chatId, message, senderId);
        await handleMentionDetection(sock, chatId, message);
      }
      await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
      return;
    }

    const ss = sessionStore(sock);
    const botMode = await ss.getBotMode();
    const allowed = (() => {
      if (isOwnerCheck) return true;
      switch (botMode) {
        case 'public':  return true;
        case 'private': return false;
        case 'self':    return senderIsSudo; // sudo users CAN use bot in self mode
        case 'groups':  return isGroup;
        case 'inbox':   return !isGroup;
        default:        return true;
      }
    })();
    if (!allowed) {
      let _modeMsg = '';
      if (botMode === 'private') {
        // Silent — do not reveal bot existence
        return;
      } else if (botMode === 'self') {
        // In self mode, completely silent — do not reveal bot to non-owners
        return;
      } else if (botMode === 'groups' && !isGroup) {
        _modeMsg =
          '\u256d\u2500\u300c \ud83d\udc65 *GROUPS ONLY* \u300d\n' +
          '\u2502\n' +
          '\u2502  \u26d4 Bot only responds in *Groups*\n' +
          '\u2502  \ud83d\udcf2 Add me to a group to use commands\n' +
          '\u2502\n' +
          '\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
      } else if (botMode === 'inbox' && isGroup) {
        _modeMsg =
          '\u256d\u2500\u300c \ud83d\udce5 *INBOX ONLY* \u300d\n' +
          '\u2502\n' +
          '\u2502  \u26d4 Bot only responds in *DMs*\n' +
          '\u2502  \ud83d\udcac Message me privately to use commands\n' +
          '\u2502\n' +
          '\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
      }
      if (_modeMsg) {
        await sock.sendMessage(chatId, { text: _modeMsg, ...channelInfo() }, { quoted: message }).catch(() => {});
      }
      return;
    }

    const args = usedPrefix
      ? messageText.slice(usedPrefix.length).trim().split(/\s+/).slice(1)
      : messageText.trim().split(/\s+/).slice(1);

    if (command.strictOwnerOnly) {
      const { isOwnerOnly } = require('./isOwner');
      if (!message.key.fromMe && !isOwnerOnly(senderId)) {
        return await sock.sendMessage(chatId, {
          text:
            '\u256d\u2500\u300c \u2620\ufe0f *OWNER ONLY* \u300d\n' +
            '\u2502\n' +
            '\u2502  \u26d4 This command is *strictly restricted*\n' +
            '\u2502  \ud83d\udc80 Only the *device owner* can run this\n' +
            '\u2502  \u2620\ufe0f Not available to sudo or renters\n' +
            '\u2502\n' +
            '\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
          ...channelInfo()
        }, { quoted: message });
      }
    }

    if (command.ownerOnly && !message.key.fromMe && !senderIsOwnerOrSudo) {
      return await sock.sendMessage(chatId, {
        text:
          '\u256d\u2500\u300c \ud83d\udd10 *RESTRICTED* \u300d\n' +
          '\u2502\n' +
          '\u2502  \u26d4 *Owner / Sudo only* command\n' +
          '\u2502  \ud83d\udc80 You are not authorized\n' +
          '\u2502\n' +
          '\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
        ...channelInfo()
      }, { quoted: message });
    }

    if (command.groupOnly && !isGroup) {
      return await sock.sendMessage(chatId, {
        text:
          '\u256d\u2500\u300c \ud83d\udc65 *GROUPS ONLY* \u300d\n' +
          '\u2502\n' +
          '\u2502  \u26d4 This command only works in *Groups*\n' +
          '\u2502\n' +
          '\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
        ...channelInfo()
      }, { quoted: message });
    }

    let isSenderAdmin = false, isBotAdmin = false;
    if (command.adminOnly && isGroup) {
      const adminStatus = await isAdmin(sock, chatId, senderId);
      isSenderAdmin = adminStatus.isSenderAdmin;
      isBotAdmin    = adminStatus.isBotAdmin;
      // fromMe = bot itself is running the command, always trust it's admin
      if (!isBotAdmin && !message.key.fromMe) {
        return await sock.sendMessage(chatId, { text: '𖤐 ʙᴏᴛ ɴᴇᴇᴅs ᴀᴅᴍɪɴ ʀɪɢʜᴛs ᴛᴏ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.', ...channelInfo() }, { quoted: message });
      }
      if (!isBotAdmin && message.key.fromMe) isBotAdmin = true; // bot sent it, trust
      if (!isSenderAdmin && !message.key.fromMe && !senderIsOwnerOrSudo)
        return await sock.sendMessage(chatId, { text: '𖤐 ᴀᴅᴍɪɴs ᴏɴʟʏ.', ...channelInfo() }, { quoted: message });
    }

    const context = {
      chatId, senderId, isGroup, isSenderAdmin, isBotAdmin,
      senderIsOwnerOrSudo, isOwnerOrSudoCheck: isOwnerCheck,
      channelInfo: channelInfo(), rawText, userMessage, messageText,
    };

    // ── ᴄᴏᴍᴍᴀɴᴅ ʙʟᴏᴄᴋ ᴄʜᴇᴄᴋ ─────────────────────────────────
    if (!isOwnerCheck && command.command && blockPlugin.isCmdBlocked(command.command)) {
      return await sock.sendMessage(chatId, { text: '🚫 This command is currently disabled.' }, { quoted: message });
    }

    await withGuard(senderId, async () => {
      try {
        await command.handler(sock, message, args, context);
        await addCommandReaction(sock, message).catch(() => {});
        await showTypingAfterCommand(sock, chatId).catch(() => {});
      } catch (err) {
        printLog('error', `ᴄᴍᴅ [${command.command}]: ${err.message}`);
        await sock.sendMessage(chatId, { text: `𖤐 ᴇʀʀᴏʀ: ${err.message}`, ...channelInfo() }, { quoted: message }).catch(() => {});
        try { fs.appendFileSync('./error.log', JSON.stringify({ cmd: command.command, err: err.message, ts: new Date().toISOString() }) + '\n'); } catch {}
      }
    });
  } catch (err) {
    printLog('error', `ᴍsɢ ʜᴀɴᴅʟᴇʀ: ${err.message}`);
  }
}

async function buildContext(sock, message, chatId, senderId, isGroup, command) {
  const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
  const isOwnerCheck = message.key.fromMe || senderIsOwnerOrSudo;
  let isSenderAdmin = false, isBotAdmin = false;
  if (command.adminOnly && isGroup) {
    const a = await isAdmin(sock, chatId, senderId);
    isSenderAdmin = a.isSenderAdmin; isBotAdmin = a.isBotAdmin;
    if (!isBotAdmin || (!isSenderAdmin && !isOwnerCheck)) return null;
  }
  return { chatId, senderId, isGroup, isSenderAdmin, isBotAdmin, senderIsOwnerOrSudo, isOwnerOrSudoCheck: isOwnerCheck, channelInfo: getChannelInfo(), rawText: '', userMessage: '', messageText: '' };
}

async function handleGroupParticipantUpdate(sock, update) {
  try {
    const { id, participants, action, author } = update;
    if (!id.endsWith('@g.us')) return;
    printLog('info', `ɢʀᴏᴜᴘ ᴜᴘᴅᴀᴛᴇ: ${action}`);
    switch (action) {
      case 'add':    { 
        const { handleJoinEvent }      = require('../plugins/welcome');  
        await handleJoinEvent(sock, id, participants);
        // Anti-bot: check and kick bots that join
        const { handleAntibotJoin } = require('../plugins/antibot');
        handleAntibotJoin(sock, id, participants).catch(() => {});
        break; 
      }
      case 'remove': { const { handleLeaveEvent }     = require('../plugins/goodbye');  await handleLeaveEvent(sock, id, participants);      break; }
      case 'promote':{ 
        const { handlePromotionEvent } = require('../plugins/promote');  
        await handlePromotionEvent(sock, id, participants, author);
        // Anti-promote check
        try {
          const { handleAntiPromote } = require('../plugins/antipromote');
          await handleAntiPromote(sock, id, participants, author);
        } catch {}
        break; 
      }
      case 'demote': { 
        const { handleDemotionEvent }  = require('../plugins/demote');   
        await handleDemotionEvent(sock, id, participants, author);
        // Anti-demote check
        try {
          const { handleAntiDemote } = require('../plugins/antidemote');
          await handleAntiDemote(sock, id, participants, author);
        } catch {}
        break; 
      }
    }
  } catch (e) { printLog('error', `ɢʀᴏᴜᴘ ᴜᴘᴅᴀᴛᴇ: ${e.message}`); }
}

// Load autostatus once — per-session config is handled inside the plugin
const _autostatus = require('../plugins/autostatus');

async function handleStatus(sock, evt) {
  try {
    if (typeof _autostatus.handleStatusUpdate === 'function') {
      await _autostatus.handleStatusUpdate(sock, evt);
    }
  } catch {}
}

async function handleCall(sock, calls) {
  try {
    const ac = require('../plugins/anticall');
    const state = ac.readState ? await ac.readState() : { enabled: false };
    if (!state.enabled) return;
    for (const call of calls) {
      const from = call.from || call.peerJid;
      if (!from) continue;
      try { await sock.rejectCall?.(call.id, from); } catch {}
      await sock.sendMessage(from, { text: '𖤐 ᴀɴᴛɪᴄᴀʟʟ ɪs ᴇɴᴀʙʟᴇᴅ. ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ʀᴇᴊᴇᴄᴛᴇᴅ.' });
      setTimeout(() => sock.updateBlockStatus(from, 'block').catch(()=>{}), 800);
    }
  } catch (e) { printLog('error', `ᴄᴀʟʟ: ${e.message}`); }
}

module.exports = { handleMessages, handleGroupParticipantUpdate, handleStatus, handleCall };
