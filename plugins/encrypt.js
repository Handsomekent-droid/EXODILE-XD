const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'encryptjs',
  aliases: ['encobf', 'encjs'],
  category: 'owner',
  ownerOnly: true,
  description: 'Obfuscate a replied JavaScript file',
  usage: '.encryptjs (reply to a .js file)',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    const quoted =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    // ❌ Must reply
    if (!quoted) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Reply to a JavaScript (.js) file.' },
        { quoted: message }
      );
    }

    // ❌ Must be document
    if (!quoted.documentMessage) {
      return sock.sendMessage(
        chatId,
        { text: '❌ The replied message is not a file.' },
        { quoted: message }
      );
    }

    const doc = quoted.documentMessage;
    const fileName = doc.fileName || '';

    // ❌ Must be JS file
    if (!fileName.endsWith('.js')) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Only .js files are supported.' },
        { quoted: message }
      );
    }

    try {
      // 📥 Download file (Baileys v6 way)
      const stream = await downloadContentFromMessage(doc, 'document');
      let buffer = Buffer.alloc(0);

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const sourceCode = buffer.toString('utf8');

      // 🔐 Obfuscate
      const obfuscated = JavaScriptObfuscator.obfuscate(sourceCode, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 1,
        selfDefending: true,
        renameGlobals: false
      });

      const encryptedCode = obfuscated.getObfuscatedCode();

      // 📤 Send encrypted file
      await sock.sendMessage(
        chatId,
        {
          document: Buffer.from(encryptedCode),
          fileName: `encrypted-${fileName}`,
          mimetype: 'application/javascript',
          caption: '🔐 JavaScript file encrypted successfully'
        },
        { quoted: message }
      );

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(
        chatId,
        { text: `❌ Encryption ꜰᴀɪʟᴇᴅ: ${err.message}` },
        { quoted: message }
      );
    }
  }
};