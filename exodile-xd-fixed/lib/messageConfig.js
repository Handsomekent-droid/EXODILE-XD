'use strict';
/**
 * 𝗭𝗘𝗡𝗧𝗥𝗜𝗫 𝗠𝗗 𝗩𝟭 — ᴄʜᴀɴɴᴇʟ ɪɴꜰᴏ
 * ᴀʟʟ ᴘʟᴜɢɪɴs ɪᴍᴘᴏʀᴛ ꜰʀᴏᴍ ʜᴇʀᴇ — ɴᴇᴠᴇʀ ʜᴀʀᴅᴄᴏᴅᴇ ᴊɪᴅs
 */
const settings = require('../settings');

function getChannelInfo() {
  return {
    contextInfo: {
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid:   process.env.NEWSLETTER_JID  || settings.newsletterJid,
        newsletterName:  process.env.NEWSLETTER_NAME || settings.newsletterName,
        serverMessageId: -1,
      }
    }
  };
}

// Proxy so spread of channelInfo object works AND calling getChannelInfo() works
const channelInfo = new Proxy({}, {
  get(_, prop) { return getChannelInfo()[prop]; }
});

module.exports = { channelInfo, getChannelInfo };
