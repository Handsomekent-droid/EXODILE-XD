'use strict';
const { getChannelInfo } = require('../lib/messageConfig');

const SERVERS = [
  { id: '01', name: 'SERVER_ALPHA',   link: 'https://t.me/Exodilexd_bot',   status: 'ONLINE', ping: '12ms' },
  { id: '02', name: 'SERVER_BRAVO',   link: 'https://t.me/ExodilexdV2_bot', status: 'ONLINE', ping: '18ms' },
  { id: '03', name: 'SERVER_CHARLIE', link: 'https://t.me/ExodilexdV3_bot', status: 'ONLINE', ping: '9ms'  },
  { id: '04', name: 'SERVER_DELTA',   link: 'https://t.me/ExodilexdV4_bot', status: 'ONLINE', ping: '21ms' },
];

module.exports = {
  command: 'getbot',
  aliases: ['pairbot', 'mybots', 'botlist', 'deploybot'],
  category: 'general',
  description: '🤖 Pair your own EXODILE XD bot',
  usage: '.getbot',

  async handler(sock, message, args, ctx = {}) {
    const chatId = ctx.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const ts     = new Date().toISOString().replace('T', ' ').slice(0, 19);

    let t = '';
    t += `\`\`\`\n`;
    t += `╔══════════════════════════════╗\n`;
    t += `║  ☠  EXODILE-XD // DEPLOY HUB  ║\n`;
    t += `╚══════════════════════════════╝\n`;
    t += `  [${ts}]\n`;
    t += `  STATUS: ALL SYSTEMS OPERATIONAL\n`;
    t += `\`\`\`\n\n`;

    t += `*💀 TAP ANY SERVER BELOW TO PAIR YOUR BOT:*\n\n`;

    for (const s of SERVERS) {
      t += `\`[${s.id}]\` *${s.name}*\n`;
      t += `  ├ 🟢 ${s.status}  •  ⚡ ${s.ping}\n`;
      t += `  └ 🔗 ${s.link}\n\n`;
    }

    t += `\`\`\`\n`;
    t += `> HOW TO PAIR:\n`;
    t += `  1. Open any server link\n`;
    t += `  2. /start → send your number\n`;
    t += `  3. Get pairing code\n`;
    t += `  4. WA → Linked Devices → Link with Code\n`;
    t += `  5. Enter code → DONE ✓\n`;
    t += `\`\`\`\n`;
    t += `> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧`;

    await sock.sendMessage(chatId, { text: t, ...ci }, { quoted: message });
  }
};
