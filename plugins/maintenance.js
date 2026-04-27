const { denyIfNotStrictOwner } = require('../lib/strictOwner');
// EXODILE XD — maintenance plugin


const commandHandler = require('../lib/commandHandler');

let activeMaintenanceTimer = null;

module.exports = {
  command: 'maintenance',
  aliases: ['mtnc', 'lockdown'],
  category: 'owner',
  description: 'Disable non-ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅs for a duration or stop it early',
  usage: '.maintenance [minutes / stop]',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    const input = args[0]?.toLowerCase();

    if (input === 'stop' || input === 'off') {
      if (activeMaintenanceTimer) {
        clearTimeout(activeMaintenanceTimer);
        activeMaintenanceTimer = null;
      }
      
      const allCommands = Array.from(commandHandler.commands.values());
      allCommands.forEach(cmd => {
        if (cmd.category !== 'owner') {
          commandHandler.disabledCommands.delete(cmd.command.toLowerCase());
        }
      });

      return await sock.sendMessage(chatId, { text: '✅ *MAINTENANCE ENDED EARLY*\nAll ᴄᴏᴍᴍᴀɴᴅs are now active.' }, { quoted: message });
    }
    
    const minutes = parseInt(input);
    if (isNaN(minutes) || minutes <= 0) {
      return await sock.sendMessage(chatId, { text: '❌ Usage: .maintenance [minutes] OR .maintenance stop' }, { quoted: message });
    }

    try {
      if (activeMaintenanceTimer) clearTimeout(activeMaintenanceTimer);

      const allCommands = Array.from(commandHandler.commands.values());
      let affectedCount = 0;

      allCommands.forEach(cmd => {
        if (cmd.category !== 'owner' && cmd.command !== 'maintenance') {
          const key = cmd.command.toLowerCase();
          if (!commandHandler.disabledCommands.has(key)) {
            commandHandler.disabledCommands.add(key);
            affectedCount++;
          }
        }
      });

      await sock.sendMessage(chatId, { 
        text: `⚠️ *MAINTENANCE MODE STARTING*\n\n` +
              `Locked: ${affectedCount} ᴄᴏᴍᴍᴀɴᴅs\n` +
              `Duration: ${minutes}m\n\n` +
              `_Type ".maintenance stop" to enable ᴄᴏᴍᴍᴀɴᴅs early._`
      }, { quoted: message });

      activeMaintenanceTimer = setTimeout(async () => {
        allCommands.forEach(cmd => {
          if (cmd.category !== 'owner') {
            commandHandler.disabledCommands.delete(cmd.command.toLowerCase());
          }
        });
        activeMaintenanceTimer = null;
        await sock.sendMessage(chatId, { text: '✅ *MAINTENANCE FINISHED*\nᴄᴏᴍᴍᴀɴᴅs re-enabled automatically.' });
      }, minutes * 60000);

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { text: '❌ Action ꜰᴀɪʟᴇᴅ.' }, { quoted: message });
    }
  }
};

// EXODILE XD — maintenance plugin

