const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const JSZip = require('jszip');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'encryptzip',
  aliases: ['enczip', 'obfzip'],
  category: 'owner',
  ownerOnly: true,
  strictOwnerOnly: true,
  description: 'Obfuscate all JS files inside a replied ZIP',
  usage: '.encryptzip (reply to a .zip file)',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    const quoted =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted || !quoted.documentMessage) {
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

        // 🔐 Encrypt JS files only
        if (filePath.endsWith('.js')) {
          const content = await file.async('string');

          const obfuscated = JavaScriptObfuscator.obfuscate(content, {
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

          newZip.file(filePath, obfuscated.getObfuscatedCode());
          encryptedCount++;
        } else {
          // 📄 Keep other files untouched
          const raw = await file.async('nodebuffer');
          newZip.file(filePath, raw);
        }
      }

      const finalZip = await newZip.generateAsync({ type: 'nodebuffer' });

      await sock.sendMessage(
        chatId,
        {
          document: finalZip,
          fileName: `encrypted-${fileName}`,
          mimetype: 'application/zip',
          caption: `🔐 ZIP encrypted successfully\n📦 JS files encrypted: ${encryptedCount}`
        },
        { quoted: message }
      );

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(
        chatId,
        { text: `❌ ZIP encryption ꜰᴀɪʟᴇᴅ: ${err.message}` },
        { quoted: message }
      );
    }
  }
};