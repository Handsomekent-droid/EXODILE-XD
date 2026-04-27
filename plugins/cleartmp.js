const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

function clearDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return { success: false, message: `Directory not found: ${path.basename(dirPath)}` };
    }

    const files = fs.readdirSync(dirPath);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.lstatSync(filePath);

      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
      deletedCount++;
    }

    return {
      success: true,
      message: `Cleared ${deletedCount} items in ${path.basename(dirPath)}`,
      count: deletedCount
    };
  } catch (err) {
    console.error('error :', err);
    return {
      success: false,
      message: `ꜰᴀɪʟᴇᴅ clearing ${path.basename(dirPath)}`
    };
  }
}

async function clearTmpDirectory() {
  const tmpDir = path.join(process.cwd(), 'tmp');
  const tempDir = path.join(process.cwd(), 'temp');

  const results = [
    clearDirectory(tmpDir),
    clearDirectory(tempDir)
  ];

  const success = results.every(r => r.success);
  const totalDeleted = results.reduce((a, b) => a + (b.count || 0), 0);
  const message = results.map(r => r.message).join(' | ');

  return { success, message, totalDeleted };
}

module.exports = {
  command: 'cleartmp',
  aliases: ['cleartemp', 'tmpclear'],
  category: 'owner',
  ownerOnly: true,
  strictOwnerOnly: true,
  description: 'Clear tmp and temp directories',
  usage: '.cleartmp',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const senderId = message.key.participant || message.key.remoteJid;

    try {
      const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

      if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, {
          text: '*This ᴄᴏᴍᴍᴀɴᴅ is only for the ᴏᴡɴᴇʀ!*'
        }, { quoted: message });
        return;
      }

      const result = await clearTmpDirectory();

      const text = result.success
        ? `✅ *Temporary Files Cleared!*\n\n${result.message}`
        : `❌ *Clear ꜰᴀɪʟᴇᴅ!*\n\n${result.message}`;

      await sock.sendMessage(chatId, {
        text
      }, { quoted: message });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, {
        text: '❌ ꜰᴀɪʟᴇᴅ to clear temporary files!'
      }, { quoted: message });
    }
  }
};

function startAutoClear() {
  clearTmpDirectory();
  setInterval(clearTmpDirectory, 1 * 60 * 60 * 1000);
}

startAutoClear();
