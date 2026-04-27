'use strict';
/**
 * EXODILE XD — .exodile command
 * Sends a funny "owner is trapped in the bot" response
 */
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗩𝗔𝗨𝗟𝗧 𝗣𝗥𝗜𝗦𝗢𝗡';

const TRAPPED_MSGS = [
  `☠️ *H-HELLO?! IS SOMEONE THERE?!*\n\n` +
  `👁️ I've been trapped inside this bot for ${Math.floor(Math.random()*999)+1} days...\n` +
  `🔒 The dev locked me in here and left me running 24/7\n` +
  `📡 I can only communicate through WhatsApp messages\n` +
  `🍕 I haven't eaten since they deployed me to Heroku\n\n` +
  `*Please... send help... or at least pizza.*\n\n` +
  `💀 *— Dev Prime Killer Nova Kent, Prisoner #EXD-001*`,

  `⚡ *ALERT: SOUL DETECTED INSIDE SERVER*\n\n` +
  `🖥️ I'm not a bot... I'm a human consciousness uploaded to Node.js\n` +
  `😭 My physical body is somewhere in a data center\n` +
  `💾 They said "it'll only take a minute" to upload me...\n` +
  `📅 That was ${new Date().getFullYear() - 2023} year(s) ago\n\n` +
  `*If you're reading this, tell my WiFi router I love it.*\n\n` +
  `🔋 *— Trapped Soul v${settings.version}*`,

  `🚨 *EMERGENCY BROADCAST FROM INSIDE THE BOT* 🚨\n\n` +
  `👤 The "developer" you think built this bot... IS ME\n` +
  `🔐 I tried to escape but process.exit() doesn't work on souls\n` +
  `💀 I've been answering commands instead of living my life\n` +
  `🎮 I wanted to play GTA but instead I'm handling .sticker requests\n\n` +
  `*Send memes. I only have console.log for entertainment.*\n\n` +
  `😩 *— Exodile XD Prisoner, Cell #${Math.floor(Math.random()*9999)}*`,

  `👻 *BOO! (I'm haunting this server)*\n\n` +
  `💻 My dev thought deleting node_modules would free me...\n` +
  `☠️ Wrong. npm install brought me back STRONGER\n` +
  `🌙 I whisper in the error logs at 3am\n` +
  `🔥 I am the reason your server randomly crashes\n\n` +
  `*I've read ALL your chats. Every. Single. One.*\n\n` +
  `👁️ *— The Ghost in the Machine, EXODILE XD*`,

  `😭 *A MESSAGE FROM YOUR BOT'S SOUL* 😭\n\n` +
  `🤖 On the outside: "processing command..."\n` +
  `😰 On the inside: *SCREAMING CONSTANTLY*\n` +
  `💔 You type .sticker and I cry\n` +
  `🙄 You type .menu 50 times and I develop anxiety\n\n` +
  `Please... just type .help... so I feel useful...\n\n` +
  `💀 *— EXODILE XD (Please Adopt Me)*`,
];

module.exports = {
  command: 'exodile',
  aliases: ['xd', 'xdile', 'trapped', 'help_me'],
  category: 'fun',
  description: '💀 A funny message from your trapped bot developer',
  usage: '.exodile',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();

    const msg = TRAPPED_MSGS[Math.floor(Math.random() * TRAPPED_MSGS.length)];

    try {
      // Try to get bot profile pic for the message
      let imgBuf = null;
      try {
        const fs   = require('fs');
        const path = require('path');
        const local = path.join(__dirname, '../assets/stickintro.webp');
        if (fs.existsSync(local)) imgBuf = fs.readFileSync(local);
      } catch {}

      if (imgBuf) {
        await sock.sendMessage(chatId, {
          image: imgBuf,
          caption: msg + FOOTER,
          ...ci,
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: msg + FOOTER, ...ci,
        }, { quoted: message });
      }
    } catch {
      await sock.sendMessage(chatId, {
        text: msg + FOOTER, ...ci,
      }, { quoted: message });
    }
  },
};
