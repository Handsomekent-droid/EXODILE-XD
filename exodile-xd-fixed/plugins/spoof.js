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
  command: 'spoof',
  aliases: ['fakesᴛᴀᴛᴜs', 'mocksᴛᴀᴛᴜs'],
  category: 'tools',
  description: 'Send a message replying to a fake status',
  usage: '.spoof @user | statusText | YourReply',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const input = args.join(' ');
    
    if (!input.includes('|')) {
      return await sock.sendMessage(chatId, { 
        text: '*Usage:* .spoof @user | status Content | Your Message' 
      }, { quoted: message });
    }

    const parts = input.split('|').map(t => t.trim());
    if (parts.length < 3) return await sock.sendMessage(chatId, { text: 'Missing parts. Use: User | status | Reply' });

    const [user, statusText, replyText] = parts;
    const jid = user.replace('@', '') + '@s.whatsapp.net';

    try {
      await sock.sendMessage(chatId, { 
        text: replyText,
        contextInfo: {
          externalAdReply: {
            title: 'status', 
            body: statusText,
            mediaType: 1,
            previewType: 0,
            showAdAttribution: false,
            thumbnail: Buffer.alloc(0), 
            sourceUrl: 'https://whatsapp.com' 
          },
          participant: jid,
          quotedMessage: {
            conversation: statusText
          }
        }
      });
    } catch (err) {
      console.error('error :', err);
      await sock.sendMessage(chatId, { text: '❌ ꜰᴀɪʟᴇᴅ to spoof. Protocol rejected.' });
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
