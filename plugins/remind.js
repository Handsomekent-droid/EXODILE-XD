'use strict';
const { getChannelInfo } = require('../lib/messageConfig');

// In-memory store (survives until bot restart)
const reminders = new Map();

function parseTime(str) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  return parseInt(match[1]) * units[match[2].toLowerCase()];
}

function formatDuration(ms) {
  if (ms < 60000) return `${ms / 1000}s`;
  if (ms < 3600000) return `${ms / 60000}m`;
  if (ms < 86400000) return `${ms / 3600000}h`;
  return `${ms / 86400000}d`;
}

module.exports = {
  command: 'remind',
  aliases: ['reminder', 'remindme', 'setreminder'],
  category: 'tools',
  description: '⏰ Set a reminder — bot will ping you after the time',
  usage: '.remind <time> <message>\nExample: .remind 30m drink water',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const senderId = ctx.senderId || m.key.participant || m.key.remoteJid;
    const ci = getChannelInfo();

    if (!args.length) {
      return sock.sendMessage(chatId, {
        text: `⏰ *Reminder*\n\nUsage: .remind <time> <message>\n\nTime formats:\n• *30s* — 30 seconds\n• *5m* — 5 minutes\n• *2h* — 2 hours\n• *1d* — 1 day\n\nExamples:\n• .remind 30m drink water\n• .remind 1h call boss\n• .remind 2h meeting with team`,
      }, { quoted: m });
    }

    const timeStr = args[0];
    const reminderText = args.slice(1).join(' ').trim();

    if (!reminderText) {
      return sock.sendMessage(chatId, {
        text: `⏰ Please include a reminder message!\nExample: .remind 30m drink water`,
      }, { quoted: m });
    }

    const delay = parseTime(timeStr);
    if (!delay) {
      return sock.sendMessage(chatId, {
        text: `❌ Invalid time format. Use: *30s*, *5m*, *2h*, *1d*\nExample: .remind 30m drink water`,
      }, { quoted: m });
    }

    if (delay > 86400000 * 7) {
      return sock.sendMessage(chatId, {
        text: `❌ Maximum reminder time is *7 days*.`,
      }, { quoted: m });
    }

    const remindAt = new Date(Date.now() + delay);
    const timeStr12 = remindAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await sock.sendMessage(chatId, {
      text: `⏰ *Reminder Set!*\n\n📝 *Message:* ${reminderText}\n⏱ *In:* ${formatDuration(delay)}\n🕐 *At:* ${timeStr12}\n\nI'll ping you when the time comes!`,
      mentions: [senderId],
      ...ci,
    }, { quoted: m });

    const timeout = setTimeout(async () => {
      try {
        await sock.sendMessage(chatId, {
          text: `⏰ *REMINDER!*\n\n@${senderId.split('@')[0]}, you asked me to remind you:\n\n📝 *${reminderText}*`,
          mentions: [senderId],
          ...ci,
        });
      } catch (e) {
        console.error('[remind] Failed to send reminder:', e.message);
      }
      reminders.delete(`${senderId}-${Date.now()}`);
    }, delay);

    reminders.set(`${senderId}-${Date.now()}`, timeout);
  },
};
