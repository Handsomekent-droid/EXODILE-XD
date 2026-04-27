'use strict';
const { sessionStore } = require('../lib/sessionStore');
/**
 * EXODILE XD — Anti-Spam Plugin
 * Tracks message frequency per user and auto-blocks spammers
 * .antispam on/off/status — owner/admin only
 */
const store = require('../lib/lightweight_store');
const isOwnerOrSudo = require('../lib/isOwner');
const isAdmin = require('../lib/isAdmin');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗔𝗡𝗧𝗜-𝗦𝗣𝗔𝗠';

// In-memory spam trackers: { jid => { count, window_start, warned } }
const spamTracker = new Map();
const SPAM_WINDOW = 5000;   // 5 seconds window
const SPAM_LIMIT  = 7;      // 7 messages in 5s = spam
const WARN_LIMIT  = 5;      // warn at 5 msgs

// Cleanup stale trackers every 30s
setInterval(() => {
  const cutoff = Date.now() - SPAM_WINDOW * 2;
  for (const [k, v] of spamTracker) {
    if (v.window_start < cutoff) spamTracker.delete(k);
  }
}, 30000);

async function handleAntiSpam(sock, chatId, message, senderId) {
  try {
    // Only in groups
    if (!chatId.endsWith('@g.us')) return;

    const cfg = await _ss.getSetting('global', 'antispam');
    if (!cfg?.enabled) return;

    // Exempt owner/sudo/admins
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    if (isOwner) return;
    try {
      const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
      if (isSenderAdmin) return;
    } catch {}

    const now = Date.now();
    const data = spamTracker.get(senderId) || { count: 0, window_start: now, warned: false };

    // Reset window if expired
    if (now - data.window_start > SPAM_WINDOW) {
      data.count = 0;
      data.window_start = now;
      data.warned = false;
    }

    data.count++;
    spamTracker.set(senderId, data);

    const senderNum = senderId.split('@')[0];

    // Warn at threshold
    if (data.count === WARN_LIMIT && !data.warned) {
      data.warned = true;
      spamTracker.set(senderId, data);
      await sock.sendMessage(chatId, {
        text:
          `⚠️ *ANTI-SPAM WARNING*\n\n` +
          `@${senderNum} — you're sending messages too fast!\n` +
          `Slow down or you'll be *blocked* automatically.`,
        mentions: [senderId],
      }, { quoted: message });
      return;
    }

    // Block at spam limit
    if (data.count >= SPAM_LIMIT) {
      spamTracker.delete(senderId);

      // Try to remove from group first
      try {
        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
      } catch {}

      // Block the user
      try {
        await sock.updateBlockStatus(senderId, 'block');
      } catch {}

      await sock.sendMessage(chatId, {
        text:
          `🚫 *SPAMMER BLOCKED*\n\n` +
          `@${senderNum} was *auto-blocked* for spamming.\n` +
          `💀 ${data.count} messages in 5 seconds.`,
        mentions: [senderId],
      });
    }
  } catch {}
}

module.exports = {
  command: 'antispam',
  aliases: ['spamblock', 'nospam'],
  category: 'admin',
  description: '🚫 Auto-block spammers in group',
  usage: '.antispam on/off/status',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const sub    = args[0]?.toLowerCase();

    const cfg = (await _ss.getSetting('global', 'antispam')) || { enabled: false };

    if (!sub) {
      return sock.sendMessage(chatId, {
        text:
          `┌─━─━〔 🚫 𝗔𝗡𝗧𝗜-𝗦𝗣𝗔𝗠 〕━─━─┐\n` +
          `│ Status: ${cfg.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
          `│\n` +
          `│ 📌 How it works:\n` +
          `│ • Warns at 5 msgs / 5 sec\n` +
          `│ • Blocks + kicks at 7 msgs / 5 sec\n` +
          `│ • Admins & owner are exempt\n` +
          `│\n` +
          `│ Commands:\n` +
          `│ • .antispam on  — Enable\n` +
          `│ • .antispam off — Disable\n` +
          `└─━─━─━─━─━─━─━─━─━─━─┘` + FOOTER,
        ...ci,
      }, { quoted: message });
    }

    if (sub === 'on') {
      await _ss.saveSetting('global', 'antispam', { enabled: true });
      return sock.sendMessage(chatId, {
        text: `✅ *Anti-Spam: ENABLED*\n\nSpammers will be warned, then auto-kicked & blocked.` + FOOTER,
        ...ci,
      }, { quoted: message });
    }

    if (sub === 'off') {
      await _ss.saveSetting('global', 'antispam', { enabled: false });
      return sock.sendMessage(chatId, {
        text: `❌ *Anti-Spam: DISABLED*\n\nSpam protection is now off.` + FOOTER,
        ...ci,
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: `❓ Usage: .antispam on | off` + FOOTER, ...ci,
    }, { quoted: message });
  },

  handleAntiSpam,
};
