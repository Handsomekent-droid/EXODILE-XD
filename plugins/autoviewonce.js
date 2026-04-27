'use strict';
/**
 * EXODILE XD — Auto View-Once Toggle
 * .autoviewonce on   — start saving all view-once to owner DM
 * .autoviewonce off  — stop
 * .autoviewonce      — check current status
 */
const { loadConfig, saveConfig } = require('../lib/autoViewOnce');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

function getBotNum(sock) {
  return (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
}

module.exports = {
  command: 'autoviewonce',
  aliases: ['autovo', 'autoview', 'viewoncesave', 'autosavevo'],
  category: 'owner',
  description: '👁️ Auto-save all view-once to owner DM',
  usage: '.autoviewonce <on|off>',
  ownerOnly: true,

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci     = getChannelInfo();
    const sub    = args[0]?.toLowerCase();
    const botNum = getBotNum(sock);
    const cfg    = loadConfig(botNum);

    if (!sub) {
      return sock.sendMessage(chatId, {
        text: `👁️ *Auto View-Once Saver*\n\n` +
          `Status: ${cfg.enabled ? '✅ *ON*' : '❌ *OFF*'}\n\n` +
          `📌 *What it does:*\n` +
          `Automatically saves any view-once photo/video sent in any group or DM directly to your private DM — silently, without anyone knowing.\n\n` +
          `📖 *Usage:*\n` +
          `• \`.autoviewonce on\`  — Enable\n` +
          `• \`.autoviewonce off\` — Disable` +
          FOOTER,
        ...ci
      }, { quoted: m });
    }

    if (sub === 'on') {
      saveConfig({ enabled: true }, botNum);
      return sock.sendMessage(chatId, {
        text: `✅ *Auto View-Once Saver: ON*\n\n` +
          `👁️ All view-once photos & videos in any group or DM will now be automatically saved to your private DM.\n\n` +
          `🔒 Silent — the sender won't know.` +
          FOOTER,
        ...ci
      }, { quoted: m });
    }

    if (sub === 'off') {
      saveConfig({ enabled: false }, botNum);
      return sock.sendMessage(chatId, {
        text: `❌ *Auto View-Once Saver: OFF*\n\n` +
          `View-once messages will no longer be auto-saved.` +
          FOOTER,
        ...ci
      }, { quoted: m });
    }

    await sock.sendMessage(chatId, {
      text: `❓ Invalid option. Use: \`.autoviewonce on\` or \`.autoviewonce off\`` +
        FOOTER,
      ...ci
    }, { quoted: m });
  }
};
