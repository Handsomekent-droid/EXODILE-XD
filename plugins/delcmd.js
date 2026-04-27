'use strict';
const { sessionStore } = require('../lib/sessionStore');
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

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
    fs.writeFileSync(STICKER_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

module.exports = {
  command: 'delcmd',
  aliases: ['removecmd'],
  category: 'owner',
  description: 'ᴅᴇʟᴇᴛᴇ ᴀ sᴛɪᴄᴋᴇʀ ᴄᴏᴍᴍᴀɴᴅ',
  usage: '.delcmd  (ʀᴇᴘʟʏ ᴛᴏ sᴛɪᴄᴋᴇʀ)',
  ownerOnly: true,
  strictOwnerOnly: true,

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId  = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const ci      = getChannelInfo();
    const stickers = await getStickerCommands();

    // If reply to sticker — delete by hash
    const quotedSticker = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
    if (quotedSticker?.fileSha256) {
      const hash = Buffer.from(quotedSticker.fileSha256).toString('base64');
      if (!stickers[hash]) return sock.sendMessage(chatId, { text: '❒ ɴᴏ ᴄᴏᴍᴍᴀɴᴅ ꜰᴏᴜɴᴅ ꜰᴏʀ ᴛʜɪs sᴛɪᴄᴋᴇʀ.', ...ci }, { quoted: message });
      const old = stickers[hash].text;
      delete stickers[hash];
      await saveStickerCommands(stickers);
      return sock.sendMessage(chatId, { text: `✦ ᴄᴏᴍᴍᴀɴᴅ *${old}* ᴅᴇʟᴇᴛᴇᴅ.`, ...ci }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '᭄ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ ᴛᴏ ᴅᴇʟᴇᴛᴇ ɪᴛs ᴄᴏᴍᴍᴀɴᴅ.', ...ci }, { quoted: message });
  }
};
