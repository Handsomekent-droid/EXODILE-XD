'use strict';
const { getChannelInfo } = require('../lib/messageConfig');

// In-memory poll store
const polls = new Map();
const EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

module.exports = [
  {
    command: 'poll',
    aliases: ['createpoll', 'startpoll'],
    category: 'group',
    description: '📊 Create a group poll',
    usage: '.poll Question | Option1 | Option2 | Option3',
    groupOnly: true,

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const ci = getChannelInfo();
      const input = args.join(' ');

      if (!input.includes('|')) {
        return sock.sendMessage(chatId, {
          text: `📊 *Create a Poll*\n\nUsage: .poll Question | Option1 | Option2 | Option3\n\nExample:\n.poll Favorite fruit? | 🍎 Apple | 🍌 Banana | 🍇 Grapes\n\n• Min 2 options, max 10 options\n• Members vote by replying with the number`,
        }, { quoted: m });
      }

      const parts = input.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length < 3) {
        return sock.sendMessage(chatId, {
          text: `❌ Need at least *1 question + 2 options*.\nExample: .poll Best color? | Red | Blue | Green`,
        }, { quoted: m });
      }
      if (parts.length > 11) {
        return sock.sendMessage(chatId, { text: `❌ Maximum 10 options allowed.` }, { quoted: m });
      }

      const question = parts[0];
      const options = parts.slice(1, 11);

      const pollId = chatId;
      polls.set(pollId, {
        question,
        options,
        votes: {},
        voters: {},
        createdAt: Date.now(),
      });

      let text = `📊 *POLL*\n\n❓ *${question}*\n\n`;
      options.forEach((opt, i) => {
        text += `${EMOJIS[i]} ${opt}\n`;
      });
      text += `\n💬 Reply with the number to vote!\nType *.pollresult* to see current results\nType *.endpoll* to close (admin only)`;

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: m });
    },
  },

  {
    command: 'vote',
    aliases: ['v'],
    category: 'group',
    description: '🗳️ Vote in the current poll',
    usage: '.vote <number>',
    groupOnly: true,

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const senderId = ctx.senderId || m.key.participant || m.key.remoteJid;
      const ci = getChannelInfo();

      const poll = polls.get(chatId);
      if (!poll) {
        return sock.sendMessage(chatId, { text: `❌ No active poll. Create one with *.poll*` }, { quoted: m });
      }

      const choice = parseInt(args[0]);
      if (isNaN(choice) || choice < 1 || choice > poll.options.length) {
        return sock.sendMessage(chatId, {
          text: `❌ Invalid choice. Vote with a number from 1 to ${poll.options.length}`,
        }, { quoted: m });
      }

      // Remove previous vote if exists
      const prev = poll.voters[senderId];
      if (prev !== undefined) {
        poll.votes[prev] = (poll.votes[prev] || 1) - 1;
      }

      poll.voters[senderId] = choice - 1;
      poll.votes[choice - 1] = (poll.votes[choice - 1] || 0) + 1;

      const optionText = poll.options[choice - 1];
      await sock.sendMessage(chatId, {
        text: `✅ @${senderId.split('@')[0]} voted for *${EMOJIS[choice-1]} ${optionText}*${prev !== undefined ? ' (changed)' : ''}`,
        mentions: [senderId],
        ...ci,
      }, { quoted: m });
    },
  },

  {
    command: 'pollresult',
    aliases: ['pollresults', 'presult'],
    category: 'group',
    description: '📊 See current poll results',
    usage: '.pollresult',
    groupOnly: true,

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const ci = getChannelInfo();

      const poll = polls.get(chatId);
      if (!poll) {
        return sock.sendMessage(chatId, { text: `❌ No active poll.` }, { quoted: m });
      }

      const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);
      let text = `📊 *Poll Results*\n\n❓ *${poll.question}*\n\n`;

      poll.options.forEach((opt, i) => {
        const count = poll.votes[i] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
        text += `${EMOJIS[i]} *${opt}*\n${bar} ${pct}% (${count} vote${count !== 1 ? 's' : ''})\n\n`;
      });

      text += `👥 *Total votes:* ${totalVotes}`;
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: m });
    },
  },

  {
    command: 'endpoll',
    aliases: ['closepoll', 'stoppoll'],
    category: 'group',
    description: '🛑 End the current poll and show final results',
    usage: '.endpoll',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const ci = getChannelInfo();

      const poll = polls.get(chatId);
      if (!poll) {
        return sock.sendMessage(chatId, { text: `❌ No active poll to end.` }, { quoted: m });
      }

      const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);
      let winner = null;
      let winnerVotes = 0;

      poll.options.forEach((opt, i) => {
        const count = poll.votes[i] || 0;
        if (count > winnerVotes) { winnerVotes = count; winner = opt; }
      });

      let text = `🏁 *Poll Ended!*\n\n❓ *${poll.question}*\n\n`;
      poll.options.forEach((opt, i) => {
        const count = poll.votes[i] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
        text += `${EMOJIS[i]} *${opt}*\n${bar} ${pct}% (${count} votes)\n\n`;
      });

      if (winner) text += `🏆 *Winner: ${winner}* with ${winnerVotes} votes!\n`;
      text += `👥 *Total votes:* ${totalVotes}`;

      polls.delete(chatId);
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: m });
    },
  },
];
