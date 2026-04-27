'use strict';
const { handleGoodbye } = require('../lib/welcome');
const { isGoodByeOn, getGoodbye } = require('../lib/index');
const fetch = require('node-fetch');

async function handleLeaveEvent(sock, id, participants) {
  try {
    const isGoodbyeEnabled = await isGoodByeOn(id);
    if (!isGoodbyeEnabled) return;

    const customMessage = await getGoodbye(id);
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;

    const channelInfo = {
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: process.env.NEWSLETTER_JID || '120363405838689446@newsletter',
          newsletterName: '𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿',
          serverMessageId: -1
        }
      }
    };

    for (const participant of participants) {
      try {
        const participantJid = typeof participant === 'string'
          ? participant
          : (participant.id || participant.toString());

        const user = participantJid.split('@')[0];

        let finalMessage;
        if (customMessage) {
          finalMessage = customMessage
            .replace(/{user}/g, `@${user}`)
            .replace(/{group}/g, groupName)
            .replace(/{ɢʀᴏᴜᴘ}/g, groupName);
        } else {
          finalMessage = `╭╼━≪•𝙼𝙴𝙼𝙱𝙴𝚁 𝙻𝙴𝙵𝚃•≫━╾╮\n┃𝙶𝙾𝙾𝙳𝙱𝚈𝙴: @${user} 👋\n┃Members left: ${groupMetadata.participants.length}\n╰━━━━━━━━━━━━━━━╯\n\n*@${user}* has left *${groupName}*. Goodbye! 👋\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝘌𝘟𝘖𝘋𝘐𝘓𝘌 𝘟𝘋*`;
        }

        // Try goodbye image first
        let sentWithImage = false;
        try {
          let profilePicUrl = `https://img.pyrocdn.com/dbKUgahg.png`;
          try {
            const pp = await sock.profilePictureUrl(participantJid, 'image');
            if (pp) profilePicUrl = pp;
          } catch {}

          const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming1?type=leave&textcolor=red&username=${encodeURIComponent(user)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
          const response = await fetch(apiUrl, { timeout: 10000 });
          if (response.ok) {
            const imageBuffer = await response.buffer();
            await sock.sendMessage(id, {
              image: imageBuffer,
              caption: finalMessage,
              mentions: [participantJid],
              ...channelInfo
            });
            sentWithImage = true;
          }
        } catch {}

        // Fallback to text with proper @mention tag
        if (!sentWithImage) {
          await sock.sendMessage(id, {
            text: finalMessage,
            mentions: [participantJid],
            ...channelInfo
          });
        }
      } catch (err) {
        console.error('[goodbye] participant error:', err?.message || err);
        try {
          const participantJid = typeof participant === 'string'
            ? participant : (participant.id || participant.toString());
          const user = participantJid.split('@')[0];
          await sock.sendMessage(id, {
            text: `Goodbye @${user}! 👋`,
            mentions: [participantJid],
            ...channelInfo
          });
        } catch {}
      }
    }
  } catch (err) {
    console.error('[goodbye] handleLeaveEvent error:', err?.message || err);
  }
}

module.exports = {
  command: 'goodbye',
  aliases: ['bye', 'setgoodbye'],
  category: 'admin',
  description: 'Configure goodbye messages for leaving members',
  usage: '.goodbye <on|off|set message>',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const matchText = args.join(' ');
    await handleGoodbye(sock, chatId, message, matchText);
  },

  handleLeaveEvent
};
