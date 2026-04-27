'use strict';
const { sessionStore } = require('../lib/sessionStore');
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

/**
 * .setcmd — ʙɪɴᴅ ᴀ sᴛɪᴄᴋᴇʀ ᴛᴏ ᴀ ᴄᴏᴍᴍᴀɴᴅ
 * Fixed: uses ASCII key name for JSON storage
 */
const store = require('../lib/lightweight_store');
const fs    = require('fs');
const path  = require('path');
const { getChannelInfo } = require('../lib/messageConfig');

const STICKER_FILE = path.join(__dirname, '../data/sticker_commands.json');

async function getStickerCommands() {
  try {
    const d = await _ss.getSetting('global', 'stickerCommands');
    if (d) return d;
    if (fs.existsSync(STICKER_FILE)) return JSON.parse(fs.readFileSync(STICKER_FILE, 'utf8'));
  } catch {}
  return {};
}

async function saveStickerCommands(data) {
  try {
    await _ss.saveSetting('global', 'stickerCommands', data);
    const dir = path.dirname(STICKER_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STICKER_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

module.exports = {
  command: 'setcmd',
  aliases: ['addcmd'],
  category: 'owner',
  description: 'sᴇᴛ ᴀ sᴛɪᴄᴋᴇʀ ᴄᴏᴍᴍᴀɴᴅ',
  usage: '.setcmd <text>  (ʀᴇᴘʟʏ ᴛᴏ sᴛɪᴄᴋᴇʀ)',
  ownerOnly: true,
  strictOwnerOnly: true,

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const ci     = getChannelInfo();

    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return sock.sendMessage(chatId, { text: '᭄ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ.', ...ci }, { quoted: message });
    if (!quotedMsg.stickerMessage) return sock.sendMessage(chatId, { text: '᭄ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ, ɴᴏᴛ ᴀ ʀᴇɢᴜʟᴀʀ ᴍᴇssᴀɢᴇ.', ...ci }, { quoted: message });

    const sha256 = quotedMsg.stickerMessage.fileSha256;
    if (!sha256) return sock.sendMessage(chatId, { text: '❒ sᴛɪᴄᴋᴇʀ ʜᴀsʜ ɴᴏᴛ ꜰᴏᴜɴᴅ.', ...ci }, { quoted: message });

    const cmdText = args.join(' ').trim();
    if (!cmdText) return sock.sendMessage(chatId, { text: '᭄ ᴘʀᴏᴠɪᴅᴇ ᴄᴏᴍᴍᴀɴᴅ ᴛᴇxᴛ.', ...ci }, { quoted: message });

    const hash     = Buffer.from(sha256).toString('base64');
    const stickers = await getStickerCommands();
    stickers[hash] = { text: cmdText, creator: context.senderId, at: Date.now() };
    await saveStickerCommands(stickers);

    await sock.sendMessage(chatId, {
      text: `✦ ᴄᴏᴍᴍᴀɴᴅ sᴀᴠᴇᴅ!\n᭄ sᴛɪᴄᴋᴇʀ → *${cmdText}*`, ...ci
    }, { quoted: message });
  }
};
