'use strict';
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

const fs   = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

module.exports = {
  command: 'script',
  aliases: ['repo', 'sc', 'scriptsrc'],
  category: 'info',
  description: 'ⓔⓧⓞⓓⓘⓛⓔ ⓧⓓ ᴏꜰꜰɪᴄɪᴀʟ sᴄʀɪᴘᴛ ɪɴꜰᴏ',
  usage: '.script',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const caption =
      `╔══════════════════════════╗\n` +
      `║  ✦ ᎬХϴᎠᏆᏞᎬ ХᎠ    ║\n` +
      `╚══════════════════════════╝\n\n` +
      `𖤐 *ᴘʀᴇᴍɪᴜᴍ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ*\n\n` +
      `✧ ꜰᴀsᴛ • sᴇᴄᴜʀᴇ • ᴍᴜʟᴛɪ-sᴇssɪᴏɴ\n` +
      `❖ ꜰᴜʟʟʏ ᴄᴜsᴛᴏᴍɪsᴀʙʟᴇ & sᴛᴀʙʟᴇ\n` +
      `✯ ᴀᴜᴛᴏ-ʟᴏᴀᴅ ᴘʟᴜɢɪɴs • ᴛᴇʟᴇɢʀᴀᴍ ᴍɢʀ\n\n` +
      `𖤐 *ᴅᴇᴠ:* ᴱˣᴼᴰᴵᴸᴱ ᴱᴾᴵᶜ ˢᴴᴬᴺ\n` +
      `✦ *ᴠᴇʀsɪᴏɴ:* ${settings.version}\n\n` +
      `❖ ᴄᴏɴᴛᴀᴄᴛ: ${settings.channelLink}`;
    const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
    try {
      const buf = fs.readFileSync(imgPath);
      await sock.sendMessage(chatId, { image: buf, caption, ...channelInfo }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: caption, ...channelInfo }, { quoted: message });
    }
  }
};
