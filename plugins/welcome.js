'use strict';
const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');
const fetch = require('node-fetch');

module.exports = {
  command: 'welcome',
  aliases: ['setwelcome'],
  category: 'admin',
  description: 'Configure welcome message for the group',
  usage: '.welcome [on/off/set <message>]',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const matchText = args.join(' ');
    await handleWelcome(sock, chatId, message, matchText);
  }
};

async function handleJoinEvent(sock, id, participants) {
  try {
    const isWelcomeEnabled = await isWelcomeOn(id);
    if (!isWelcomeEnabled) return;

    const customMessage = await getWelcome(id);
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'No description available';

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

        // Build the welcome message — always use @mention format
        let finalMessage;
        if (customMessage) {
          finalMessage = customMessage
            .replace(/{user}/g, `@${user}`)
            .replace(/{group}/g, groupName)
            .replace(/{ɢʀᴏᴜᴘ}/g, groupName)
            .replace(/{description}/g, groupDesc)
            .replace(/{desc}/g, groupDesc);
        } else {
          const now = new Date();
          const timeString = now.toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
          });
          finalMessage = `╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @${user} 👋\n┃Member count: ${groupMetadata.participants.length}\n┃𝚃𝙸𝙼𝙴: ${timeString} ⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@${user}* Welcome to *${groupName}*! 🎉\n*GROUP DESCRIPTION*\n${groupDesc}\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝘌𝘟𝘖𝘋𝘐𝘓𝘌 𝘟𝘋*`;
        }

        // Try welcome image first
        let sentWithImage = false;
        try {
          let profilePicUrl = `https://img.pyrocdn.com/dbKUgahg.png`;
          try {
            const pp = await sock.profilePictureUrl(participantJid, 'image');
            if (pp) profilePicUrl = pp;
          } catch {}

          const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming3?type=join&textcolor=green&username=${encodeURIComponent(user)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
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
        console.error('[welcome] participant error:', err?.message || err);
        // Last-resort fallback
        try {
          const participantJid = typeof participant === 'string'
            ? participant : (participant.id || participant.toString());
          const user = participantJid.split('@')[0];
          await sock.sendMessage(id, {
            text: `Welcome @${user} to ${groupMetadata?.subject || 'the group'}! 🎉`,
            mentions: [participantJid],
            ...channelInfo
          });
        } catch {}
      }
    }
  } catch (err) {
    console.error('[welcome] handleJoinEvent error:', err?.message || err);
  }
}

module.exports.handleJoinEvent = handleJoinEvent;
