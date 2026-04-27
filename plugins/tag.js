'use strict';
const { sessionStore } = require('../lib/sessionStore');
/**
 * 𝗭𝗘𝗡𝗧𝗥𝗜𝗫 𝗠𝗗 𝗩𝟭 — .tag
 * ᴛᴏɢɢʟᴇᴀʙʟᴇ ʙʏ ʙᴏᴛ ᴜsᴇʀ ᴀɴᴅ ᴀᴅᴍɪɴ
 */
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs   = require('fs');
const path = require('path');
const store = require('../lib/lightweight_store');
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

async function dlMedia(msg, type) {
  const stream = await downloadContentFromMessage(msg, type);
  let buf = Buffer.alloc(0);
  for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
  const tmp = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
  const fp = path.join(tmp, `${Date.now()}.${type}`);
  fs.writeFileSync(fp, buf);
  return fp;
}

// tag toggle state
async function getTagState(chatId) {
  try {
    const d = await _ss.getSetting('global', 'tagToggle');
    if (d && typeof d[chatId] !== 'undefined') return d[chatId];
  } catch {}
  return true; // default on
}

async function setTagState(chatId, state) {
  try {
    let d = await _ss.getSetting('global', 'tagToggle') || {};
    d[chatId] = state;
    await _ss.saveSetting('global', 'tagToggle', d);
  } catch {}
}

module.exports = {
  command: 'tag',
  aliases: ['tagall', 'everyone', 'all'],
  category: 'admin',
  description: 'ᴛᴀɢ ᴀʟʟ ɢʀᴏᴜᴘ ᴍᴇᴍʙᴇʀs',
  usage: '.tag [message] | .tag on/off',
  groupOnly: true,

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId   = context.chatId || message.key.remoteJid;
    const ci       = getChannelInfo();
    const isAdmin  = context.isSenderAdmin || context.senderIsOwnerOrSudo;
    const fromMe   = message.key.fromMe;

    const sub = (args[0] || '').toLowerCase();

    // Toggle on/off — admin or owner only
    if (sub === 'on' || sub === 'off') {
      if (!isAdmin && !fromMe) {
        return sock.sendMessage(chatId, { text: '᭄ admins ᴏɴʟʏ ᴄᴀɴ ᴛᴏɢɢʟᴇ ᴛᴀɢ.', ...ci }, { quoted: message });
      }
      const state = sub === 'on';
      await setTagState(chatId, state);
      return sock.sendMessage(chatId, {
        text: state
          ? `✦ *.tag* ᴄᴏᴍᴍᴀɴᴅ ᴇɴᴀʙʟᴇᴅ ꜰᴏʀ ᴛʜɪs ɢʀᴏᴜᴘ.`
          : `❒ *.tag* ᴄᴏᴍᴍᴀɴᴅ ᴅɪsᴀʙʟᴇᴅ ꜰᴏʀ ᴛʜɪs ɢʀᴏᴜᴘ.`,
        ...ci,
      }, { quoted: message });
    }

    // Check if tag is enabled
    const enabled = await getTagState(chatId);
    if (!enabled) {
      return sock.sendMessage(chatId, { text: '❒ .tag ɪs ᴅɪsᴀʙʟᴇᴅ ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ. ᴀᴅᴍɪɴ ᴄᴀɴ ᴜsᴇ *.tag on*.', ...ci }, { quoted: message });
    }

    // Only admin or owner can actually tag — REMOVED, anyone can tag
    // if (!isAdmin && !fromMe) {
    //   return sock.sendMessage(chatId, { text: '᭄ admins ᴏɴʟʏ.', ...ci }, { quoted: message });
    // }

    const meta   = await sock.groupMetadata(chatId);
    const pList  = meta.participants.map(p => p.id);
    const tagText = args.join(' ');
    const quoted  = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (quoted) {
      try {
        if (quoted.imageMessage) {
          const fp = await dlMedia(quoted.imageMessage, 'image');
          return sock.sendMessage(chatId, { image: { url: fp }, caption: tagText || '', mentions: pList, ...ci });
        }
        if (quoted.videoMessage) {
          const fp = await dlMedia(quoted.videoMessage, 'video');
          return sock.sendMessage(chatId, { video: { url: fp }, caption: tagText || '', mentions: pList, ...ci });
        }
        if (quoted.conversation || quoted.extendedTextMessage) {
          return sock.sendMessage(chatId, { text: quoted.conversation || quoted.extendedTextMessage.text, mentions: pList, ...ci });
        }
      } catch {}
    }

    const mentionList = pList.map(j => `@${j.split('@')[0]}`).join('\n');
    await sock.sendMessage(chatId, {
      text: `᭄ *${settings.botName}*\n\n${tagText || '✦ ʜᴇʏ ᴇᴠᴇʀʏᴏɴᴇ!'}\n\n${mentionList}`,
      mentions: pList,
      ...ci,
    });
  }
};
