module.exports = {
  command: 'base64decode',
  aliases: ['b64decode', 'decode'],
  category: 'tools',
  description: 'Decode Base64 text to normal text',
  usage: '.base64decode <base64> OR reply to a message',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      let txt = args?.join(' ') || "";

      // Get replied message text if available
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted) {
        txt = quoted.conversation ||
              quoted.extendedTextMessage?.text ||
              quoted.imageMessage?.caption ||
              quoted.videoMessage?.caption ||
              txt;
      }

      // Remove ᴄᴏᴍᴍᴀɴᴅ prefix if included
      txt = txt.replace(/^\.\w+\s*/, '').trim();

      if (!txt) {
        return await sock.sendMessage(
          chatId,
          { text: '*ᴘʟᴇᴀsᴇ provide Base64 text to decode or reply to a message.*\nExample: .base64decode SGVsbG8gV29ybGQ=' },
          { quoted: message }
        );
      }

      let decoded;
      try {
        decoded = Buffer.from(txt, 'base64').toString('utf-8');
      } catch {
        return await sock.sendMessage(
          chatId,
          { text: '❌ Invalid Base64 input.' },
          { quoted: message }
        );
      }

      const response =
        `*🔓 Base64 Decoded:*\n\n${decoded}`;

      await sock.sendMessage(chatId, { text: response }, { quoted: message });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(
        chatId,
        { text: '❌ ꜰᴀɪʟᴇᴅ to decode Base64 text.' },
        { quoted: message }
      );
    }
  }
};