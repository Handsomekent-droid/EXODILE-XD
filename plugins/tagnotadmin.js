module.exports = {
  command: 'tagnotadmin',
  aliases: ['tagmembers', 'tagnon'],
  category: 'admin',
  description: 'Tag all non-ᴀᴅᴍɪɴ members in the ɢʀᴏᴜᴘ',
  usage: '.tagnotᴀᴅᴍɪɴ',
  groupOnly: true,
  adminOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const participants = groupMetadata.participants || [];

      const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);
      
      if (nonAdmins.length === 0) {
        await sock.sendMessage(chatId, { 
          text: 'No non-ᴀᴅᴍɪɴ members to tag.',
          ...channelInfo
        }, { quoted: message });
        return;
      }

      let text = '🔊 *Hello Everyone:*\n\n';
      nonAdmins.forEach(jid => {
        text += `@${jid.split('@')[0]}\n`;
      });

      await sock.sendMessage(chatId, { 
        text, 
        mentions: nonAdmins,
        ...channelInfo
      }, { quoted: message });
      
    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { 
        text: 'ꜰᴀɪʟᴇᴅ to tag non-ᴀᴅᴍɪɴ members.',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
