const { denyIfNotStrictOwner } = require('../lib/strictOwner');
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


const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'inspect',
  aliases: ['cat', 'readcode', 'getplugin'],
  category: 'owner',
  description: 'Read the source code of a specific plugin',
  usage: '.inspect [plugin_name]',
  ownerOnly: true,
  strictOwnerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    const pluginName = args[0];
    if (!pluginName) {
      return await sock.sendMessage(chatId, { text: 'Which plugin do you want to inspect? Example: *.inspect convert*' }, { quoted: message });
    }

    try {
      const pluginsDir = path.join(__dirname, '../plugins');
      
      const fileName = pluginName.endsWith('.js') ? pluginName : `${pluginName}.js`;
      const filePath = path.join(pluginsDir, fileName);

      if (!fs.existsSync(filePath)) {
        return await sock.sendMessage(chatId, { text: `❌ Plugin "${fileName}" not found.` }, { quoted: message });
      }

      const code = fs.readFileSync(filePath, 'utf8');

      const formattedCode = `💻 *SOURCE CODE: ${fileName}*\n\n\`\`\`javascript\n${code}\n\`\`\``;

      if (formattedCode.length > 4000) {
        await sock.sendMessage(chatId, {
          document: Buffer.from(code),
          fileName: fileName,
          mimetype: 'text/javascript',
          caption: `📄 Code for *${fileName}* (File too large for text message)`
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: formattedCode }, { quoted: message });
      }

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to read the plugin file.' });
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
 
