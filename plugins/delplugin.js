const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const { join } = require('path');
const { unlinkSync, readdirSync } = require('fs');

module.exports = {
  command: 'delplugin',
  aliases: ['deleteplugin', 'rmplugin'],
  category: 'owner',
  ownerOnly: true,
  strictOwnerOnly: true,
  description: 'Delete a plugin by name (ᴏᴡɴᴇʀ only)',
  usage: '.delplugin <plugin_name>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    try {
      if (!args || !args[0]) {
        return await sock.sendMessage(chatId, { 
          text: `*🌟Example usage:*\n.delplugin main-menu` 
        }, { quoted: message });
      }

      const pluginDir = join(__dirname, '..', 'plugins');
      const pluginFiles = readdirSync(pluginDir).filter(f => f.endsWith('.js'));
      const pluginNames = pluginFiles.map(f => f.replace('.js', ''));

      if (!pluginNames.includes(args[0])) {
        return await sock.sendMessage(chatId, {
          text: `🗃️ This plugin doesn't exist!\n\nAvailable plugins:\n${pluginNames.join('\n')}`
        }, { quoted: message });
      }

      const filePath = join(pluginDir, args[0] + '.js');
      unlinkSync(filePath);

      await sock.sendMessage(chatId, { text: `⚠️ Plugin "${args[0]}.js" has been deleted.` }, { quoted: message });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, {  text: `❌ ꜰᴀɪʟᴇᴅ to delete plugin: ${err.message}` 
      }, { quoted: message });
    }
  }
};
