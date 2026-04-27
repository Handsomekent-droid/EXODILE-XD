'use strict';
const { sessionStore } = require('../lib/sessionStore');
/**
 * EXODILE XD — Filter Plugin
 * Add/remove keyword filters in groups
 * Bot auto-deletes messages containing filtered words
 */
const store = require('../lib/lightweight_store');
const isOwnerOrSudo = require('../lib/isOwner');
const isAdmin = require('../lib/isAdmin');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

async function getFilters(chatId) {
  try {
    const f = await store.getSetting(chatId, 'filters');
    return f || { enabled: true, words: [] };
  } catch { return { enabled: true, words: [] }; }
}

async function saveFilters(chatId, data) {
  try { await store.saveSetting(chatId, 'filters', data); } catch {}
}

// Called from messageHandler for every group message
async function handleFilterDetection(sock, chatId, message, userMessage, senderId) {
  try {
    const data = await getFilters(chatId);
    if (!data?.enabled || !data?.words?.length) return;

    const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (isOwnerSudo) return;

    try {
      const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
      if (isSenderAdmin) return;
    } catch {}

    const lower = userMessage.toLowerCase();
    const matched = data.words.find(w => lower.includes(w.toLowerCase()));
    if (!matched) return;

    const msgId = message.key.id;
    const participant = message.key.participant || senderId;

    // Delete the message
    try {
      await sock.sendMessage(chatId, {
        delete: { remoteJid: chatId, fromMe: false, id: msgId, participant }
      });
    } catch {}

    await sock.sendMessage(chatId, {
      text: `⚠️ @${senderId.split('@')[0]}, the word "*${matched}*" is filtered here.`,
      mentions: [senderId]
    });
  } catch (err) {
    console.error('[filter]', err?.message);
  }
}

module.exports = {
  command: 'filter',
  aliases: ['addfilter', 'setfilter', 'filters'],
  category: 'admin',
  description: 'Add/remove keyword filters in the group',
  usage: '.filter add <word> | .filter remove <word> | .filter list | .filter clear',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    const action = args[0]?.toLowerCase();
    const word = args.slice(1).join(' ').trim().toLowerCase();

    const data = await getFilters(chatId);

    if (!action) {
      const wordList = data.words.length
        ? data.words.map((w, i) => `${i + 1}. ${w}`).join('\n')
        : '• No filters set';
      return sock.sendMessage(chatId, {
        text:
          `╔══〔 🔒 *FILTER SETTINGS* 〕══╗\n` +
          `║ Status: ${data.enabled ? '✅ Active' : '❌ Off'}\n` +
          `║ Filters: ${data.words.length}\n` +
          `╚══════════════════════════╝\n\n` +
          `*Current Filters:*\n${wordList}\n\n` +
          `*Commands:*\n` +
          `• .filter add <word>\n` +
          `• .filter remove <word>\n` +
          `• .filter list\n` +
          `• .filter clear\n` +
          `• .filter on/off` + FOOTER
      }, { quoted: message });
    }

    if (action === 'add') {
      if (!word) return sock.sendMessage(chatId, { text: '❌ Usage: .filter add <word>' }, { quoted: message });
      if (data.words.includes(word)) return sock.sendMessage(chatId, { text: `⚠️ "*${word}*" is already filtered.` }, { quoted: message });
      data.words.push(word);
      await saveFilters(chatId, data);
      return sock.sendMessage(chatId, { text: `✅ Added "*${word}*" to filters.\nTotal filters: ${data.words.length}` + FOOTER }, { quoted: message });
    }

    if (action === 'remove' || action === 'del') {
      if (!word) return sock.sendMessage(chatId, { text: '❌ Usage: .filter remove <word>' }, { quoted: message });
      const idx = data.words.indexOf(word);
      if (idx === -1) return sock.sendMessage(chatId, { text: `❌ "*${word}*" is not in the filter list.` }, { quoted: message });
      data.words.splice(idx, 1);
      await saveFilters(chatId, data);
      return sock.sendMessage(chatId, { text: `✅ Removed "*${word}*" from filters.\nRemaining: ${data.words.length}` + FOOTER }, { quoted: message });
    }

    if (action === 'list') {
      if (!data.words.length) return sock.sendMessage(chatId, { text: '📋 No filters set yet.' }, { quoted: message });
      const list = data.words.map((w, i) => `${i + 1}. ${w}`).join('\n');
      return sock.sendMessage(chatId, { text: `🔒 *Filter List (${data.words.length}):*\n\n${list}` + FOOTER }, { quoted: message });
    }

    if (action === 'clear') {
      data.words = [];
      await saveFilters(chatId, data);
      return sock.sendMessage(chatId, { text: '✅ All filters cleared.' + FOOTER }, { quoted: message });
    }

    if (action === 'on') {
      data.enabled = true;
      await saveFilters(chatId, data);
      return sock.sendMessage(chatId, { text: '✅ Filter enabled. Blocked words will be deleted.' + FOOTER }, { quoted: message });
    }

    if (action === 'off') {
      data.enabled = false;
      await saveFilters(chatId, data);
      return sock.sendMessage(chatId, { text: '❌ Filter disabled.' + FOOTER }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Unknown action. Use: add | remove | list | clear | on | off' }, { quoted: message });
  },

  handleFilterDetection,
  getFilters
};
