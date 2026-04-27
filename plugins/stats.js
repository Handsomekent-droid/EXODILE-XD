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
const settings = require("../settings");

module.exports = {
  command: 'perf',
  aliases: ['metrics', 'diagnostics'],
  category: 'general',
  description: 'View ᴄᴏᴍᴍᴀɴᴅ performance and ᴇʀʀᴏʀ metrics',
  usage: '.perf',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const report = commandHandler.getDiagnostics();
      
      if (!report || report.length === 0) {
        return await sock.sendMessage(chatId, { text: '_No performance data collected yet._' }, { quoted: message });
      }

      let text = `📊 *PLUGINS PERFORMANCE*\n\n`;
      
      report.forEach((cmd, index) => {
        const ᴇʀʀᴏʀText = cmd.errors > 0 ? `❗ errors: ${cmd.errors}` : `✅ Smooth`;
        text += `${index + 1}. *${cmd.command.toUpperCase()}*\n`;
        text += `   ↳ Calls: ${cmd.usage}\n`;
        text += `   ↳ Latency: ${cmd.average_speed}\n`;
        text += `   ↳ status: ${ᴇʀʀᴏʀText}\n\n`;
      });

      await sock.sendMessage(chatId, {
        text: text.trim(),
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: process.env.NEWSLETTER_JID||'120363405838689446@newsletter',
            newsletterName: 'ᎬХϴᎠᏆᏞᎬ ХᎠ',
            serverMessageId: -1
          }
        }
      }, { quoted: message });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to fetch performance metrics.' }, { quoted: message });
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
    
