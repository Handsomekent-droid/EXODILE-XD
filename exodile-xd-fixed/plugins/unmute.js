module.exports = {
  command: 'unmute',
  aliases: ['unsilence'],
  category: 'admin',
  description: 'Unmute the ɢʀᴏᴜᴘ',
  usage: '.unmute',
  groupOnly: true,
  adminOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      await sock.groupSettingUpdate(chatId, 'not_announcement');
      await sock.sendMessage(chatId, { 
        text: 'The ɢʀᴏᴜᴘ has been unmuted.',
        ...channelInfo
      }, { quoted: message });
    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { 
        text: 'ꜰᴀɪʟᴇᴅ to unmute the ɢʀᴏᴜᴘ.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
