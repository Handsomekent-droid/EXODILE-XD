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


module.exports = {
  command: 'forwarded',
  aliases: ['viral', 'fakeforward'],
  category: 'tools',
  description: 'Send text with a fake "Frequently Forwarded" tag',
  usage: '.viral <text> OR reply to a message',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    
    try {
      let txt = "";
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (quoted) {
        txt = quoted.conversation || 
              quoted.extendedTextMessage?.text || 
              quoted.imageMessage?.caption || 
              quoted.videoMessage?.caption || 
              "";
      } 
      
      if (!txt || txt.trim() === "") {
        txt = args?.join(' ') || "";
      }

      if (!txt || txt.trim() === "") {
        return await sock.sendMessage(chatId, { 
          text: 'ᴘʟᴇᴀsᴇ provide text or reply to a message to forward.' 
        }, { quoted: message });
      }

      await sock.sendMessage(chatId, { 
        text: txt,
        contextInfo: { 
          isForwarded: true, 
          forwardingScore: 999 
        } 
      });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to spoof forwarding.' });
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

