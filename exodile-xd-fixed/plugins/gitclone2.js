const { denyIfNotStrictOwner } = require('../lib/strictOwner');
// ── DISABLED ─────────────────────────────────────────────────────
// gitclone2 / githubdl2 / clone2 commands have been removed for security.
module.exports = {
  command: 'gitclone2',
  aliases: ['githubdl2', 'clone2'],
  category: 'download',
  ownerOnly: true,
  description: 'Disabled',
  usage: '',
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    await sock.sendMessage(chatId, {
      text: '❌ This command has been disabled.'
    }, { quoted: message });
  }
};
