const { denyIfNotStrictOwner } = require('../lib/strictOwner');
module.exports = {
  command: 'reload',
  aliases: ['refresh', 'reloadplugins'],
  category: 'owner',
  description: 'Reload all plugins',
  usage: '.reload',
  ownerOnly: true,
  strictOwnerOnly: true,
  
  async handler(sock, message, args) {
    const chatId = message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const commandHandler = require('../lib/commandHandler');
    
    try {
      const start = Date.now();
      commandHandler.reloadCommands();
      const end = Date.now();
      
      await sock.sendMessage(chatId, {
        text: `✅ Reloaded ${commandHandler.commands.size} ᴄᴏᴍᴍᴀɴᴅs in ${end - start}ms`
      });
    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ Reload ꜰᴀɪʟᴇᴅ: ${error.message}`
      });
    }
  }
};
