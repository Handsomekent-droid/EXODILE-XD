'use strict';
/**
 * ☠️ EXODILE XD — TagAll Plugin v2 (IMPROVED)
 * Tag all group members with styled message
 */
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

const FOOTER = '\n\n☣️ *𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙋𝙍𝙄𝙈𝙀 𝙆𝙄𝙇𝙇𝙀𝙍 𝘾𝙍𝘼𝙎𝙃𝙀𝙍 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍*';

module.exports = {
  command: 'tagall',
  aliases: ['mentionall', 'tageveryone', 'everyone', 'all'],
  category: 'group',
  description: '📢 Tag all group members',
  usage: '.tagall [message]',
  groupOnly: true,
  adminOnly: false,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    try {
      const meta  = await sock.groupMetadata(chatId);
      const pList = meta.participants || [];
      const total = pList.length;
      const msg   = args.join(' ').trim();

      if (total === 0) throw new Error('No participants found.');

      // Build the styled tag message
      let txt = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      txt += `┃  📢 *TAG ALL — ${meta.subject || 'GROUP'}*\n`;
      txt += `┃  👥 *Members:* ${total}\n`;
      txt += `┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `┃\n`;

      // Split into chunks if group is very large (WhatsApp mention limit is ~100-200)
      // But for simplicity, we'll just tag all and let Baileys handle it.
      // We'll format the text nicely.
      
      let mentionText = '';
      pList.forEach((p, i) => {
        const num = p.id.split('@')[0];
        const role = p.admin ? (p.admin === 'superadmin' ? '👑' : '⚔️') : '👤';
        mentionText += `┃  ${role} @${num}\n`;
      });

      txt += mentionText;
      txt += `┃\n`;
      txt += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

      if (msg) {
        txt += `\n\n💬 *Message:*\n${msg}`;
      }

      txt += FOOTER;

      await sock.sendMessage(chatId, {
        text: txt,
        mentions: pList.map(p => p.id),
        ...ci
      }, { quoted: message });

    } catch (err) {
      console.error('[TAGALL ERROR]', err);
      await sock.sendMessage(chatId, {
        text: `❌ *TagAll Failed*\n\n${err.message || 'Unknown error occurred'}`,
        ...ci
      }, { quoted: message });
    }
  }
};
