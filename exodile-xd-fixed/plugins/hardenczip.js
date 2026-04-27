const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const JSZip = require('jszip');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'hardenczip',
  aliases: ['hardzip', 'hardzip', 'hobfzip'],
  category: 'tools',
  description: 'Ultra-strong obfuscation of ALL JS files inside a ZIP',
  usage: '.hardenczip (reply to a .zip file)',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    const quoted =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted?.documentMessage) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Reply to a ZIP file.' },
        { quoted: message }
      );
    }

    const doc = quoted.documentMessage;
    const fileName = doc.fileName || '';

    if (!fileName.endsWith('.zip')) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Only .zip files are supported.' },
        { quoted: message }
      );
    }

    try {
      // 📥 Download ZIP
      const stream = await downloadContentFromMessage(doc, 'document');
      let zipBuffer = Buffer.alloc(0);

      for await (const chunk of stream) {
        zipBuffer = Buffer.concat([zipBuffer, chunk]);
      }

      const zip = await JSZip.loadAsync(zipBuffer);
      const newZip = new JSZip();

      let encryptedCount = 0;

      for (const [filePath, file] of Object.entries(zip.files)) {
        if (file.dir) {
          newZip.folder(filePath);
          continue;
        }

        // 🔥 HARD OBFUSCATION FOR JS FILES
        if (filePath.endsWith('.js')) {
          const source = await file.async('string');

          const obfuscated = JavaScriptObfuscator.obfuscate(source, {
            compact: true,

            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,

            deadCodeInjection: true,
            deadCodeInjectionThreshold: 1,

            stringArray: true,
            stringArrayEncoding: ['rc4'], // ✅ VALID
            stringArrayThreshold: 1,

            rotateStringArray: true,
            shuffleStringArray: true,

            numbersToExpressions: true,
            simplify: true,

            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: false,
            selfDefending: true,
          });

          newZip.file(filePath, obfuscated.getObfuscatedCode());
          encryptedCount++;
        } else {
          // 📄 Keep non-JS files untouched
          const raw = await file.async('nodebuffer');
          newZip.file(filePath, raw);
        }
      }

      const finalZip = await newZip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      await sock.sendMessage(
        chatId,
        {
          document: finalZip,
          fileName: `hardenc-${fileName}`,
          mimetype: 'application/zip',
          caption:
            `🔐 ZIP obfuscation complete\n📦 JS files encrypted: ${encryptedCount}`
        },
        { quoted: message }
      );

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(
        chatId,
        { text: `❌ ZIP encryption ꜰᴀɪʟᴇᴅ:\n${err.message}` },
        { quoted: message }
      );
    }
  }
};