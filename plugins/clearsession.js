const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: process.env.NEWSLETTER_JID||'120363407808106286@newsletter',
      newsletterName: '𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿',
      serverMessageId: -1
    }
  }
};

module.exports = {
  command: 'clearsession',
  aliases: ['clearses', 'csession'],
  category: 'owner',
  ownerOnly: true,
  strictOwnerOnly: true,
  description: 'Clear session files',
  usage: '.clearsession',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    try {
      const senderId = message.key.participant || message.key.remoteJid;
      const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

      if (!message.key.fromMe && !isOwner) {
        return await sock.sendMessage(chatId, { text: '*This ᴄᴏᴍᴍᴀɴᴅ can only be used by the ᴏᴡɴᴇʀ!*', ...channelInfo });
      }

      const sessionDir = path.join(__dirname, '../sessions/primary');
      if (!fs.existsSync(sessionDir)) {
        return await sock.sendMessage(chatId, { text: '*Session directory not found!*', ...channelInfo });
      }

      let filesCleared = 0;
      let errCount = 0;
      let errDetails = [];

      await sock.sendMessage(chatId, { text: '🔍 Optimizing session files for better performance...', ...channelInfo });

      const files = fs.readdirSync(sessionDir);
      let appStateSyncCount = 0;
      let preKeyCount = 0;

      for (const file of files) {
        if (file.startsWith('app-state-sync-')) appStateSyncCount++;
        if (file.startsWith('pre-key-')) preKeyCount++;
      }

      for (const file of files) {
        if (file === 'creds.json') continue;
        try {
          fs.unlinkSync(path.join(sessionDir, file));
          filesCleared++;
        } catch (err) {
          errCount++;
          errDetails.push(`ꜰᴀɪʟᴇᴅ to delete ${file}: ${err.message}`);
        }
      }

      const msgText = `✅ Session files cleared successfully!\n\n` +
                      `📊 Statistics:\n` +
                      `• Total files cleared: ${filesCleared}\n` +
                      `• App state sync files: ${appStateSyncCount}\n` +
                      `• Pre-key files: ${preKeyCount}\n` +
                      (errCount > 0 ? `\n⚠️ ᴇʀʀᴏʀs encountered: ${errCount}\n${errDetails.join('\n')}` : '');

      await sock.sendMessage(chatId, { text: msgText, ...channelInfo });

    } catch {
      await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to clear session files!', ...channelInfo });
    }
  }
};
