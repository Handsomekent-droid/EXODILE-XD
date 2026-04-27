module.exports = {
  command: 'resetlink',
  aliases: ['revoke', 'newlink'],
  category: 'admin',
  description: 'Reset ɢʀᴏᴜᴘ invite link',
  usage: '.resetlink',
  groupOnly: true,
  adminOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      const newCode = await sock.groupRevokeInvite(chatId);
      
      await sock.sendMessage(chatId, { 
        text: `✅ ɢʀᴏᴜᴘ link has been successfully reset\n\n🔗 New link:\nhttps://chat.whatsapp.com/${newCode}`,
        ...channelInfo
      }, { quoted: message });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { 
        text: 'ꜰᴀɪʟᴇᴅ to reset ɢʀᴏᴜᴘ link!',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
