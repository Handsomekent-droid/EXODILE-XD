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


const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: 'vnote',
    aliases: ['voicenote', 'vn'],
    category: 'tools',
    description: 'Convert any audio message into a live-looking voice note',
    usage: 'Reply to an audio file with .vnote',

    async handler(sock, message, args, context = {}) {
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || chatId;

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.audioMessage) {
            return sock.sendMessage(chatId, { text: "ᴘʟᴇᴀsᴇ reply to an *audio file* to convert it to a PTT." }, { quoted: message });
        }

        try {
            const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            await sock.sendMessage(chatId, { 
                audio: buffer, 
                ptt: true, 
                mimetype: 'audio/ogg; codecs=opus' 
            }, { quoted: message });

        } catch (error) {
            console.error(error);
            await sock.sendMessage(chatId, { text: "❌ ꜰᴀɪʟᴇᴅ to convert audio to voice note." });
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
