'use strict';
const { fetchAI } = require('../lib/apiFallback');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

const FALLBACK_RESPONSES = [
  "I'm thinking through that... give me a moment and try again shortly. 🤔",
  "Hmm, my brain needs a quick reboot. Ask me again in a few seconds! ⚡",
  "Network hiccup on my end. Try rephrasing or ask again shortly! 🔄",
  "I'm temporarily overloaded. Please retry in a moment! 💭",
];

module.exports = {
  command: 'gpt',
  aliases: ['gemini', 'ai', 'chat', 'ask', 'claude', 'llm', 'think'],
  category: 'ai',
  description: '🤖 Ask the AI anything',
  usage: '.ai <your question>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const query  = args.join(' ').trim();

    if (!query) {
      return sock.sendMessage(chatId, {
        text:
          `┏━━「 🤖 *𝗔𝗜 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧* 」━━┓\n` +
          `┃\n` +
          `┃  💀 *Usage:* .ai <question>\n` +
          `┃  ⚡ *Example:* .ai What is AI?\n` +
          `┃\n` +
          `┃  🔥 Powered by multiple AI models\n` +
          `┃  ☣️  Always has an answer!\n` +
          `┃\n` +
          `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER,
        ...ci
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

    let answer = null;
    try {
      answer = await fetchAI(query);
    } catch {}

    if (!answer || answer.trim().length < 2) {
      answer = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    }

    await sock.sendMessage(chatId, {
      text:
        `┏━━「 🤖 *𝗔𝗜 𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘* 」━━┓\n` +
        `┃\n` +
        `┃  ❓ *Q:* ${query.slice(0, 60)}${query.length > 60 ? '...' : ''}\n` +
        `┃\n` +
        `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
        `${answer}` + FOOTER,
      ...ci
    }, { quoted: message });

    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
  }
};
