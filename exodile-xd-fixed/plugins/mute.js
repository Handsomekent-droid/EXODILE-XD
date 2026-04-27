module.exports = {
  command: 'mute',
  aliases: ['silence'],
  category: 'admin',
  description: 'Mute the ɢʀᴏᴜᴘ for a specified duration',
  usage: '.mute [duration in minutes]',
  groupOnly: true,
  adminOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    const durationInMinutes = args[0] ? parseInt(args[0]) : undefined;

    try {
      await sock.groupSettingUpdate(chatId, 'announcement');
      
      if (durationInMinutes !== undefined && durationInMinutes > 0) {
        const durationInMilliseconds = durationInMinutes * 60 * 1000;
        await sock.sendMessage(chatId, { 
          text: `The ɢʀᴏᴜᴘ has been muted for ${durationInMinutes} minutes.`,
          ...channelInfo 
        }, { quoted: message });
        
        setTimeout(async () => {
          try {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            await sock.sendMessage(chatId, { 
              text: 'The ɢʀᴏᴜᴘ has been unmuted.',
              ...channelInfo 
            });
          } catch (unmuteError) {
            console.error(error);
          }
        }, durationInMilliseconds);
      } else {
        await sock.sendMessage(chatId, { 
          text: 'The ɢʀᴏᴜᴘ has been muted.',
          ...channelInfo 
        }, { quoted: message });
      }
    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { 
        text: 'An ᴇʀʀᴏʀ occurred while muting/unmuting the ɢʀᴏᴜᴘ. ᴘʟᴇᴀsᴇ try again.',
        ...channelInfo 
      }, { quoted: message });
    }
  }
};
