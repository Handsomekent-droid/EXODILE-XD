module.exports = {
    command: 'setgdesc',
    aliases: ['setdesc', 'ɢʀᴏᴜᴘdesc'],
    category: 'admin',
    description: 'Change ɢʀᴏᴜᴘ description',
    usage: '.setgdesc <new description>',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const desc = args.join(' ').trim();

        if (!desc) {
            await sock.sendMessage(chatId, {
                text: '❌ *ᴘʟᴇᴀsᴇ provide a description*\n\nUsage: `.setgdesc <description>`'
            }, { quoted: message });
            return;
        }

        try {
            await sock.groupUpdateDescription(chatId, desc);
            await sock.sendMessage(chatId, {
                text: '✅ *ɢʀᴏᴜᴘ description updated successfully!*'
            }, { quoted: message });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(chatId, {
                text: '❌ *ꜰᴀɪʟᴇᴅ to update ɢʀᴏᴜᴘ description*\n\nMake sure the bot is an ᴀᴅᴍɪɴ.'
            }, { quoted: message });
        }
    }
};
