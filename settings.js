'use strict';
require('dotenv').config();

const settings = {
  prefixes: (process.env.BOT_PREFIX
    ? [...process.env.BOT_PREFIX]
    : ['.', '!', '/', '#']),

  botName:       '𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿',
  botNameInline: 'ＥＸＯＤＩＬＥ ＸＤ',

  packname:  '𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿',
  author:    '𝘿𝙀𝙑 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝙉𝙊𝙑𝘼 𝙆𝙀𝙉𝙏',
  timeZone:  process.env.TZ || 'Africa/Lagos',
  botOwner:  process.env.BOT_OWNER_NAME || '𝘿𝙀𝙑 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝙉𝙊𝙑𝘼 𝙆𝙀𝙉𝙏',

  ownerNumber: process.env.OWNER_NUMBER || '254784747151',

  creatorNumbers: ['254784747151', '254704320190'],
  get auraNumbers() {
    const extra = (process.env.AURA_NUMBERS || '')
      .split(',').map(n => n.trim().replace(/\D/g, '')).filter(Boolean);
    return [...new Set([...this.creatorNumbers, ...extra])];
  },

  giphyApiKey:         'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode:         'public',
  maxStoreMessages:    200,
  tempCleanupInterval: 1 * 60 * 60 * 1000,
  storeWriteInterval:  60000,

  description:   '𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿 — 𝘞𝘩𝘢𝘵𝘴𝘢𝘱𝘱 𝘢𝘶𝘵𝘰𝘮𝘢𝘵𝘦𝘥',
  version:       '2.0.0',
  updateZipUrl:  '',
  channelLink:   'https://whatsapp.com/channel/0029VbCMoQ105MUWi87guK2B',
  ytch:          '𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃',
  newsletterJid:  process.env.NEWSLETTER_JID  || '120363425412882254@newsletter',
  newsletterName: process.env.NEWSLETTER_NAME || '𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃',
};

const BOT_FOOTER = '\n\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

settings.footer = BOT_FOOTER;

module.exports = settings;
