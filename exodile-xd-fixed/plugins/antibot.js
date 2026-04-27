'use strict';
/**
 * EXODILE XD — Anti-Bot Plugin
 * Auto-kicks bots that join groups when antibot is enabled.
 * Only works if the paired user (owner/admin) has enabled it for that group.
 *
 * .antibot on    — enable for this group
 * .antibot off   — disable for this group
 * .antibot       — check status
 *
 * Detection: checks if joining member is a WhatsApp business/bot account
 * by looking at JID patterns, known bot numbers, and bot markers.
 */

const fs   = require('fs');
const path = require('path');
const store = require('../lib/lightweight_store');
const { getChannelInfo } = require('../lib/messageConfig');
const isOwnerOrSudo = require('../lib/isOwner');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗔𝗡𝗧𝗜𝗕𝗢𝗧';

// ── Known bot JID patterns ────────────────────────────────────
// WhatsApp bots typically have numbers starting with known ranges
// or have specific markers in their profile
const BOT_INDICATORS = [
  // JID number patterns commonly used by bots (Baileys/WA-Multi-Device)
  /^1345\d+/,     // some bot services
  /^9197\d+/,     // Indian bot numbers
  /^9198\d+/,
  /^9199\d+/,
];

// Common bot display names (case-insensitive)
const BOT_NAME_PATTERNS = [
  /bot/i, /\bmd\b/i, /whatsapp.?bot/i, /\bauto\b.*reply/i,
  /baileys/i, /exodile/i, /zenith/i, /flash.?md/i, /nekohacker/i,
];

function looksLikeBot(jid, displayName = '') {
  const num = jid.split('@')[0].split(':')[0];
  // Check number patterns
  for (const pat of BOT_INDICATORS) {
    if (pat.test(num)) return true;
  }
  // Check display name
  if (displayName) {
    for (const pat of BOT_NAME_PATTERNS) {
      if (pat.test(displayName)) return true;
    }
  }
  return false;
}

// ── Storage ───────────────────────────────────────────────────
async function getAntibotStatus(chatId) {
  try {
    const d = await store.getSetting(chatId, 'antibot');
    return d?.enabled === true;
  } catch { return false; }
}

async function setAntibotStatus(chatId, enabled) {
  try {
    await store.saveSetting(chatId, 'antibot', { enabled });
  } catch {}
}

// ── Bot join handler (called from group-update event) ─────────
async function handleAntibotJoin(sock, groupId, participants) {
  try {
    const enabled = await getAntibotStatus(groupId);
    if (!enabled) return;

    // Check if bot itself is admin (need admin to kick)
    let isBotAdmin = false;
    try {
      const meta = await sock.groupMetadata(groupId);
      const botNum = (sock.user?.id || '').split(':')[0].split('@')[0];
      isBotAdmin = meta.participants.some(p => {
        const pNum = (p.id || '').split('@')[0].split(':')[0];
        return pNum === botNum && (p.admin === 'admin' || p.admin === 'superadmin');
      });
    } catch {}

    if (!isBotAdmin) return; // can't kick without admin

    const ci = getChannelInfo();

    for (const participant of participants) {
      const jid = typeof participant === 'string' ? participant : (participant.id || '');
      if (!jid) continue;

      const num = jid.split('@')[0];

      // Skip the bot itself
      const botNum = (sock.user?.id || '').split(':')[0].split('@')[0];
      if (num === botNum || num.split(':')[0] === botNum) continue;

      // Try to get display name
      let displayName = '';
      try {
        const meta = await sock.groupMetadata(groupId);
        const p = meta.participants.find(p => p.id === jid);
        displayName = p?.name || p?.notify || '';
      } catch {}

      // Check if this looks like a bot
      if (looksLikeBot(jid, displayName)) {
        try {
          // Kick the bot
          await sock.groupParticipantsUpdate(groupId, [jid], 'remove');

          // Cold announcement
          const msgs = [
            `☠️ *SECURITY BREACH DETECTED*\n\n🤖 Unauthorized bot *@${num}* was detected and eliminated.\n🔒 This group is protected.`,
            `⚡ *BOT INTRUDER ELIMINATED*\n\n@${num} — Bots are not welcome here.\n🛡️ Anti-Bot shield active.`,
            `💀 *INTRUDER ALERT*\n\n@${num} — Identified as a bot and removed.\n🔐 Security protocol enforced.`,
          ];
          const msg = msgs[Math.floor(Math.random() * msgs.length)];

          await sock.sendMessage(groupId, {
            text: msg + FOOTER,
            mentions: [jid],
            ...ci
          });
        } catch (e) {
          console.error('[antibot] kick error:', e?.message);
        }
      }
    }
  } catch (err) {
    console.error('[antibot] handleAntibotJoin error:', err?.message);
  }
}

// ── Command ───────────────────────────────────────────────────
module.exports = {
  command: 'antibot',
  aliases: ['nobot', 'antibots', 'botban'],
  category: 'admin',
  description: '🤖 Auto-kick bots that join the group',
  usage: '.antibot <on|off>',
  groupOnly: true,
  adminOnly: true,

  handleAntibotJoin,

  async handler(sock, m, args, ctx = {}) {
    const chatId   = ctx.chatId || m.key.remoteJid;
    const senderId = ctx.senderId || m.key.participant || m.key.remoteJid;
    const ci       = getChannelInfo();
    const sub      = args[0]?.toLowerCase();
    const current  = await getAntibotStatus(chatId);

    if (!sub) {
      return sock.sendMessage(chatId, {
        text: `🤖 *Anti-Bot Protection*\n\n` +
          `Status: ${current ? '✅ *ENABLED*' : '❌ *DISABLED*'}\n\n` +
          `📌 *What it does:*\n` +
          `Automatically detects and kicks bots that join this group.\n\n` +
          `📖 *Usage:*\n` +
          `• \`.antibot on\`  — Enable\n` +
          `• \`.antibot off\` — Disable\n\n` +
          `⚠️ *Bot needs to be admin for this to work.*` +
          FOOTER,
        ...ci
      }, { quoted: m });
    }

    if (sub === 'on') {
      await setAntibotStatus(chatId, true);
      return sock.sendMessage(chatId, {
        text: `🛡️ *Anti-Bot: ENABLED*\n\n` +
          `☠️ Any bot that joins this group will be automatically kicked.\n` +
          `🔒 Group is now protected.` +
          FOOTER,
        ...ci
      }, { quoted: m });
    }

    if (sub === 'off') {
      await setAntibotStatus(chatId, false);
      return sock.sendMessage(chatId, {
        text: `❌ *Anti-Bot: DISABLED*\n\nBots can now join freely.` + FOOTER,
        ...ci
      }, { quoted: m });
    }

    await sock.sendMessage(chatId, {
      text: `❓ Use: \`.antibot on\` or \`.antibot off\`` + FOOTER,
      ...ci
    }, { quoted: m });
  }
};
