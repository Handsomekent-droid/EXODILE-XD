/*****************************************************************************
 *                                                                           *
 *                     𝔏𝔢𝔬 𝔳𝔞𝔩𝔩𝔬𝔯 ✦                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ                         *
 *  ▶️  YouTube  : https://youtube.com/@ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the ᴢᴇɴᴛʀɪx-ᴍᴅ Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/

const commandHandler = require('../lib/commandHandler');

module.exports = {
  command: 'find',
  aliases: ['lookup', 'searchcmd'],
  category: 'general',
  description: 'Find a ᴄᴏᴍᴍᴀɴᴅ by keyword or description',
  usage: '.find [keyword]',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(' ').toLowerCase();

    if (!query) {
      return await sock.sendMessage(chatId, { text: 'What are you looking for? Example: *.find status*' }, { quoted: message });
    }

    try {
      const allCommands = Array.from(commandHandler.commands.values());

      const results = allCommands.filter(commandObject => {
        const nameMatch = commandObject.command?.toLowerCase().includes(query);
        const descMatch = commandObject.description?.toLowerCase().includes(query);
        const aliasMatch = commandObject.aliases?.some(a => a.toLowerCase().includes(query));

        return nameMatch || descMatch || aliasMatch;
      });

      if (results.length === 0) {
        const suggestion = commandHandler.findSuggestion(query);
        let failText = `❌ No ᴄᴏᴍᴍᴀɴᴅs found matching *"${query}"*`;
        if (suggestion) failText += `\n\nDid you mean: *.${suggestion}*?`;
        
        return await sock.sendMessage(chatId, { text: failText }, { quoted: message });
      }

      let resultText = `🔍 *SEARCH RESULTS FOR:* "${query.toUpperCase()}"\n\n`;

      results.forEach((res, index) => {
        const status = commandHandler.disabledCommands.has(res.command.toLowerCase()) ? '🔸' : '🔹';
        resultText += `${index + 1}. ${status} *.${res.command}*\n`;
        resultText += `📝 _${res.description || 'No description available.'}_\n`;
        if (res.aliases && res.aliases.length > 0) {
          resultText += `🔗 Aliases: ${res.aliases.join(', ')}\n`;
        }
        resultText += `\n`;
      });

      resultText += `💡 _Tip: Use the prefix before the ᴄᴏᴍᴍᴀɴᴅ name to run it._`;

      await sock.sendMessage(chatId, { text: resultText }, { quoted: message });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { text: '❌ An ᴇʀʀᴏʀ occurred during the search.' });
    }
  }
};

/*****************************************************************************
 *                                                                           *
 *                     𝔏𝔢𝔬 𝔳𝔞𝔩𝔩𝔬𝔯 ✦                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ                         *
 *  ▶️  YouTube  : https://youtube.com/@ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the ᴢᴇɴᴛʀɪx-ᴍᴅ Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
