module.exports = {
    command: 'setgname',
    aliases: ['setname', 'ɢʀᴏᴜᴘname'],
    category: 'admin',
    description: 'Change ɢʀᴏᴜᴘ name',
    usage: '.setgname <new name>',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        const name = args.join(' ').trim();

        if (!name) {
            await sock.sendMessage(chatId, {
                text: '❌ *ᴘʟᴇᴀsᴇ provide a ɢʀᴏᴜᴘ name*\n\nUsage: `.setgname <new name>`'
            }, { quoted: message });
            return;
        }

        try {
            await sock.groupUpdateSubject(chatId, name);
            await sock.sendMessage(chatId, {
                text: `✅ *ɢʀᴏᴜᴘ name updated to:*\n${name}`
            }, { quoted: message });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(chatId, {
                text: '❌ *ꜰᴀɪʟᴇᴅ to update ɢʀᴏᴜᴘ name*\n\nMake sure the bot is an ᴀᴅᴍɪɴ.'
            }, { quoted: message });
        }
    }
};
