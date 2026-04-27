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
  command: 'unshorten',
  aliases: ['expand', 'trace'],
  category: 'tools',
  description: 'See where a short link actually goes',
  usage: '.unshorten <short_url>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];

    if (!url) {
      return await sock.sendMessage(chatId, { 
        text: '*ᴘʟᴇᴀsᴇ provide a URL*\n\n*Usage:* .unshorten <url>' 
      }, { quoted: message });
    }

    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = 'https://' + url;
    }

    try {

      const res = await axios.get(targetUrl, { 
        maxRedirects: 10,
        timeout: 15000,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });

      const finalUrl = res.request.res.responseUrl || res.config.url || targetUrl;
      const redirectCount = res.request._redirectable._redirectCount || 0;

      let report = `*🔗 LINK TRACE RESULTS*\n\n`;
      report += `*Original:*\n${url}\n\n`;
      report += `*Destination:*\n${finalUrl}\n\n`;
      report += `*Redirects:* ${redirectCount}\n`;
      report += `*status:* ${res.status} ${res.statusText || 'OK'}`;

      await sock.sendMessage(chatId, { text: report }, { quoted: message });

    } catch (err) {
      let ᴇʀʀᴏʀMsg = '❌ *ꜰᴀɪʟᴇᴅ to trace URL*\n\n';
      
      if (err.code === 'ENOTFOUND') {
        ᴇʀʀᴏʀMsg += '*Reason:* Domain not found';
      } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
        ᴇʀʀᴏʀMsg += '*Reason:* Connection timeout';
      } else if (err.response) {
        ᴇʀʀᴏʀMsg += `*status:* ${err.response.status} ${err.response.statusText}`;
      } else {
        ᴇʀʀᴏʀMsg += `*ᴇʀʀᴏʀ:* ${err.message}`;
      }

      await sock.sendMessage(chatId, { text: ᴇʀʀᴏʀMsg }, { quoted: message });
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
