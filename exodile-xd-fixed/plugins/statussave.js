'use strict';
/**
 * 𝗭𝗘𝗡𝗧𝗥𝗜𝗫 𝗠𝗗 𝗩𝟭
 * .ssave — sᴀᴠᴇ ᴀ status ᴛᴏ ʏᴏᴜʀ ᴅᴍ ᴀɴᴅ ᴅᴇʟᴇᴛᴇ ᴛʜᴇ ᴄᴏɴꜰɪʀᴍ ᴍᴇssᴀɢᴇ
 */
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'ssave',
  aliases: ['savestatus', 'svstatus', 'statusave', 'dlstatus', 'statusdl'],
  category: 'general',
  description: 'sᴀᴠᴇ ᴀ status ᴛᴏ ʏᴏᴜʀ ᴅᴍ',
  usage: '.ssave (ʀᴇᴘʟʏ ᴛᴏ ᴀ status)',

  async handler(sock, message, args, context = {}) {
    const chatId   = context.chatId || message.key.remoteJid;
    const ci       = getChannelInfo();
    const senderId = message.key.participant || message.key.remoteJid;
    const dmId     = senderId.includes('@') ? senderId : senderId + '@s.whatsapp.net';

    const m    = message.message;
    const type = Object.keys(m || {})[0];
    const ctx  = m?.[type]?.contextInfo;

    // ᴄʜᴇᴄᴋ ɪꜰ ʀᴇᴘʟʏɪɴɢ ᴛᴏ ᴀ status
    if (!ctx || ctx.remoteJid !== 'status@broadcast') {
      return sock.sendMessage(chatId, {
        text: `𖤐 ʀᴇᴘʟʏ ᴛᴏ ᴀ status ᴡɪᴛʜ *.ssave* ᴛᴏ sᴀᴠᴇ ɪᴛ`,
        ...ci,
      }, { quoted: message });
    }

    const quoted = ctx.quotedMessage;
    if (!quoted) return sock.sendMessage(chatId, { text: `𖤐 ɴᴏ ᴍᴇᴅɪᴀ ꜰᴏᴜɴᴅ ɪɴ ᴛʜᴀᴛ status`, ...ci }, { quoted: message });

    // sᴇɴᴅ ᴄᴏɴꜰɪʀᴍ ᴛʜᴇɴ ᴅᴇʟᴇᴛᴇ ɪᴛ
    let confirmMsg;
    try {
      const sentConfirm = await sock.sendMessage(chatId, {
        text: `𖤐 sᴀᴠɪɴɢ ᴛᴏ ʏᴏᴜʀ ᴘᴍ...`,
        ...ci,
      }, { quoted: message });
      confirmMsg = sentConfirm;
    } catch {}

    try {
      const qtype = Object.keys(quoted)[0];
      const media = quoted[qtype];

      let caption = `╔═══════════════════════════╗\n║  𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿  — status sᴀᴠᴇ ║\n╚═══════════════════════════╝\n\n𖤐 status sᴀᴠᴇᴅ`;

      if (qtype === 'conversation' || qtype === 'extendedTextMessage') {
        const text = quoted.conversation || quoted.extendedTextMessage?.text || '';
        await sock.sendMessage(dmId, { text: `${caption}\n\n${text}`, ...ci });

      } else if (qtype === 'imageMessage' || qtype === 'videoMessage') {
        const isImg = qtype === 'imageMessage';
        const stream = await downloadContentFromMessage(media, isImg ? 'image' : 'video');
        let buf = Buffer.alloc(0);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        const msgCaption = media.caption || '';
        if (isImg) {
          await sock.sendMessage(dmId, { image: buf, caption: `${caption}\n${msgCaption}`, ...ci });
        } else {
          await sock.sendMessage(dmId, { video: buf, caption: `${caption}\n${msgCaption}`, ...ci });
        }

      } else if (qtype === 'audioMessage') {
        const stream = await downloadContentFromMessage(media, 'audio');
        let buf = Buffer.alloc(0);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        await sock.sendMessage(dmId, { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true, ...ci });

      } else {
        await sock.sendMessage(dmId, { text: `${caption}\n𖤐 ᴍᴇᴅɪᴀ ᴛʏᴘᴇ ɴᴏᴛ sᴜᴘᴘᴏʀᴛᴇᴅ ꜰᴏʀ sᴀᴠɪɴɢ`, ...ci });
      }

      // ᴅᴇʟᴇᴛᴇ ᴛʜᴇ ᴄᴏɴꜰɪʀᴍ ᴍsɢ
      if (confirmMsg?.key) {
        setTimeout(async () => {
          try { await sock.sendMessage(chatId, { delete: confirmMsg.key }); } catch {}
        }, 2000);
      }

    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ᴄᴏᴜʟᴅɴᴛ sᴀᴠᴇ ᴛʜᴀᴛ status`, ...ci }, { quoted: message });
    }
  },
};
