const { denyIfNotStrictOwner } = require('../lib/strictOwner');
// ── DISABLED ─────────────────────────────────────────────────────
// gitclone / githubdl / clone commands have been removed for security.
// This file intentionally exports nothing usable.
module.exports = {
  command: 'gitclone',
  aliases: ['githubdl', 'clone'],
  category: 'owner',
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
