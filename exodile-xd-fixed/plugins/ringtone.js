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


const axios = require('axios');

module.exports = {
  command: 'ringtone',
  aliases: ['ring', 'tone'],
  category: 'music',
  description: 'Search and download ringtones',
  usage: '.ringtone <search term>',
  
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const searchQuery = args.join(' ').trim();

    try {
      if (!searchQuery) {
        return await sock.sendMessage(chatId, {
          text: "*Which ringtone do you want to search?*\nUsage: .ringtone <name>\n\nExample: .ringtone Nokia"
        }, { quoted: message });
      }

      await sock.sendMessage(chatId, {
        text: "🔍 *Searching for ringtones...*"
      }, { quoted: message });

      await new Promise(resolve => setTimeout(resolve, 10000));

      const searchUrl = `https://discardapi.dpdns.org/api/dl/ringtone?apikey=guru&title=${encodeURIComponent(searchQuery)}`;
      const response = await axios.get(searchUrl, { timeout: 30000 });
      
      if (!response.data?.result || response.data.result.length === 0) {
        return await sock.sendMessage(chatId, {
          text: "❌ *No ringtones found!*\nTry a different search term."
        }, { quoted: message });
      }

      const ringtones = response.data.result;
      const totalFound = ringtones.length;

      const limit = Math.min(2, totalFound);

      for (let i = 0; i < limit; i++) {
        const audioUrl = ringtones[i].audio;
        
        try {
          await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${searchQuery}_${i + 1}.mp3`,
            contextInfo: {
              externalAdReply: {
                title: `${searchQuery} Ringtone ${i + 1}`,
                body: `Ringtone ${i + 1} of ${limit}`,
                mediaType: 2,
                thumbnail: null
              }
            }
          }, { quoted: message });

          if (i < limit - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (sendError) {
          console.error('error'.message);
          continue;
        }
      }

      await sock.sendMessage(chatId, {
        text: `✅ *Sent ${limit} ringtones!*\n\n${totalFound > limit ? `📊 *${totalFound - limit} more available*\nUse the same ᴄᴏᴍᴍᴀɴᴅ again for different results.` : ''}`
      }, { quoted: message });

    } catch (error) {
      console.error(error);
      
      let errorMsg = "❌ *Search ꜰᴀɪʟᴇᴅ!*\n\n";
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMsg += "*Reason:* Connection timeout\nThe API took too long to respond.";
      } else if (error.response) {
        errorMsg += `*status:* ${error.response.status}\n*ᴇʀʀᴏʀ:* ${error.response.statusText}`;
      } else {
        errorMsg += `*ᴇʀʀᴏʀ:* ${error.message}`;
      }
      
      errorMsg += "\n\nᴘʟᴇᴀsᴇ try again later.";

      await sock.sendMessage(chatId, {
        text: errorMsg
      }, { quoted: message });
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

