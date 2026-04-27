module.exports = {
  command: 'groupinfo',
  aliases: ['ginfo', 'gcinfo', 'infoɢʀᴏᴜᴘ'],
  category: 'group',
  description: 'Display detailed ɢʀᴏᴜᴘ information',
  usage: '.groupinfo',
  groupOnly: true,
  
  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      
      let pp;
      try {
        pp = await sock.profilePictureUrl(chatId, 'image');
      } catch {
        pp = 'https://i.imgur.com/2wzGhpF.jpeg';
      }
      
      const participants = groupMetadata.participants;
      const ɢʀᴏᴜᴘᴀᴅᴍɪɴs = participants.filter(p => p.admin);
      const listAdmin = ɢʀᴏᴜᴘᴀᴅᴍɪɴs.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
      
      const ᴏᴡɴᴇʀ = groupMetadata.owner || ɢʀᴏᴜᴘᴀᴅᴍɪɴs.find(p => p.admin === 'superᴀᴅᴍɪɴ')?.id || chatId.split('-')[0] + '@s.whatsapp.net';
      
      const text = `
┌──「 *INFO GROUP* 」
▢ *♻️ID:*
   • ${groupMetadata.id}
▢ *🔖NAME* : 
• ${groupMetadata.subject}
▢ *👥Members* :
• ${participants.length}
▢ *🤿ɢʀᴏᴜᴘ ᴏᴡɴᴇʀ:*
• @${ᴏᴡɴᴇʀ.split('@')[0]}
▢ *🕵🏻‍♂️admins:*
${listAdmin}

▢ *📌Description* :
   • ${groupMetadata.desc?.toString() || 'No description'}
`.trim();

      await sock.sendMessage(chatId, {
        image: { url: pp },
        caption: text,
        mentions: [...groupAdmins.map(v => v.id), ᴏᴡɴᴇʀ],
        ...channelInfo
      });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, { 
        text: 'ꜰᴀɪʟᴇᴅ to get ɢʀᴏᴜᴘ info!',
        ...channelInfo
      }, { quoted: message });
    }
  }
};
