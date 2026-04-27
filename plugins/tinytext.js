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
  command: 'smallcaps',
  aliases: ['tinytext', 'mini'],
  category: 'tools',
  description: 'Convert text to small-capital style',
  usage: '.smallcaps <text> OR reply to a message',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    
    try {
      let txt = args?.join(' ') || "";
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted) {
        txt = quoted.conversation || quoted.extendedTextMessage?.text || quoted.imageMessage?.caption || txt;
      }
      
      txt = txt.replace(/^\.\w+\s*/, '').trim();

      if (!txt) {
        return await sock.sendMessage(chatId, { 
          text: 'ᴘʟᴇᴀsᴇ provide text or reply to a message to convert.\nExample: `.smallcaps Hello World`' 
        }, { quoted: message });
      }

    const capsMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
        'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ',
        'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ꜰ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ',
        'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 's', 'T': 'ᴛ',
        'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ',
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };

    const result = txt.split('').map(char => capsMap[char] || char).join('');
      await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to process text.' });
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
