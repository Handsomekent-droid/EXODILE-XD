const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: 'setgpp',
    aliases: ['setgpic', 'ɢʀᴏᴜᴘpp', 'setɢʀᴏᴜᴘpic'],
    category: 'admin',
    description: 'Change ɢʀᴏᴜᴘ profile picture',
    usage: '.setgpp (reply to image)',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quoted?.imageMessage || quoted?.stickerMessage;

        if (!imageMessage) {
            await sock.sendMessage(chatId, {
                text: '❌ *ᴘʟᴇᴀsᴇ reply to an image or sticker*\n\nUsage: Reply to an image with `.setgpp`'
            }, { quoted: message });
            return;
        }

        try {
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
            fs.writeFileSync(imgPath, buffer);

            await sock.updateProfilePicture(chatId, { url: imgPath });

            try {
                fs.unlinkSync(imgPath);
            } catch (e) {}

            await sock.sendMessage(chatId, {
                text: '✅ *ɢʀᴏᴜᴘ profile picture updated successfully!*'
            }, { quoted: message });

        } catch (error) {
            console.error(error);
            await sock.sendMessage(chatId, {
                text: '❌ *ꜰᴀɪʟᴇᴅ to update ɢʀᴏᴜᴘ profile picture*\n\nMake sure the bot is an ᴀᴅᴍɪɴ and the image is valid.'
            }, { quoted: message });
        }
    }
};
