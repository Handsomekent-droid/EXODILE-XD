'use strict';
const { sessionStore } = require('../lib/sessionStore');
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

/**
 * OWNER/SUDO RESTRICTED COMMANDS — hacker slim style
 * Replaces big box style for restricted-access responses
 */
const { getChannelInfo } = require('../lib/messageConfig');
const settings  = require('../settings');
const isOwner   = require('../lib/isOwner');
const store     = require('../lib/lightweight_store');
const FOOTER    = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

function slim(text) { return text + FOOTER; }

function isOwn(m) {
  const id = m.key.participant || m.key.remoteJid;
  return m.key.fromMe || isOwner.isOwnerOnly(id);
}

module.exports = [
  // ─── .botstatus ──────────────────────────────────────────────
  {
    command: 'botstatus',
    aliases: ['status2', 'syscheck'],
    category: 'owner',
    description: 'check all bot systems',
    usage: '.botstatus',
    async handler(sock, m, args, ctx = {}) {
    const _ss = sessionStore(sock);
    const chatId = context.chatId || message.key.remoteJid;
    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      const ch     = require('../lib/commandHandler');
      const mem    = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const up     = Math.floor(process.uptime());
      const d=Math.floor(up/86400),h=Math.floor((up%86400)/3600),mn=Math.floor((up%3600)/60),s=up%60;
      const upStr  = [d&&`${d}d`,h&&`${h}h`,mn&&`${mn}m`,`${s}s`].filter(Boolean).join(' ');
      const mode   = await _ss.getBotMode().catch(() => 'public');
      await sock.sendMessage(chatId, {
        text: slim(
          `◈ *system status*\n` +
          `│ online ✓  mode: ${mode}\n` +
          `│ cmds: ${ch.commands.size}  ram: ${mem}mb\n` +
          `│ uptime: ${upStr}  node: ${process.version}`
        ), ...ci
      }, { quoted: m });
    }
  },

  // ─── .modestatus ─────────────────────────────────────────────
  {
    command: 'modestatus',
    aliases: ['checkmode'],
    category: 'owner',
    description: 'show current bot mode',
    usage: '.modestatus',
    async handler(sock, m, args, ctx = {}) {
      const _ss = sessionStore(sock);
      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      const mode   = await _ss.getBotMode().catch(() => 'public');
      await sock.sendMessage(chatId, {
        text: slim(`◈ *mode* — ${mode}\nchange with .mode public/private/group`), ...ci
      }, { quoted: m });
    }
  },

  // ─── .disk ───────────────────────────────────────────────────
  {
    command: 'disk',
    aliases: ['diskusage', 'storage'],
    category: 'owner',
    description: 'check disk/memory usage',
    usage: '.disk',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      if (!isOwn(m)) return sock.sendMessage(chatId, {
        text: slim('◈ owner only'), ...ci
      }, { quoted: m });
      const mem = process.memoryUsage();
      const heap = (mem.heapUsed/1024/1024).toFixed(1);
      const rss  = (mem.rss/1024/1024).toFixed(1);
      await sock.sendMessage(chatId, {
        text: slim(`◈ *ram*\n│ heap: ${heap}mb  rss: ${rss}mb\n│ external: ${(mem.external/1024/1024).toFixed(1)}mb`),
        ...ci
      }, { quoted: m });
    }
  },

  // ─── .hostip ─────────────────────────────────────────────────
  {
    command: 'hostip',
    aliases: ['serverip', 'myip'],
    category: 'owner',
    description: 'check server ip',
    usage: '.hostip',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      if (!isOwn(m)) return sock.sendMessage(chatId, {
        text: slim('◈ owner only'), ...ci
      }, { quoted: m });
      try {
        const axios = require('axios');
        const r = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        await sock.sendMessage(chatId, {
          text: slim(`◈ *server ip* — ${r.data?.ip || 'unavailable'}`), ...ci
        }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, {
          text: slim('◈ could not fetch ip'), ...ci
        }, { quoted: m });
      }
    }
  },

  // ─── .listsudo ───────────────────────────────────────────────
  {
    command: 'listsudo',
    aliases: ['sudolist2', 'showsudo'],
    category: 'owner',
    description: 'list all sudo users',
    usage: '.listsudo',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      if (!isOwn(m)) return sock.sendMessage(chatId, {
        text: slim('◈ owner only'), ...ci
      }, { quoted: m });
      const { getSudoList } = require('../lib/index');
      const list = await getSudoList();
      if (!list.length) return sock.sendMessage(chatId, {
        text: slim('◈ no sudo users set'), ...ci
      }, { quoted: m });
      const lines = list.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n');
      await sock.sendMessage(chatId, {
        text: slim(`◈ *sudo users*\n${lines}`),
        mentions: list, ...ci
      }, { quoted: m });
    }
  },

  // ─── .listblocked ────────────────────────────────────────────
  {
    command: 'listblocked',
    aliases: ['blocked', 'blocklist'],
    category: 'owner',
    description: 'list blocked users',
    usage: '.listblocked',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      if (!isOwn(m)) return sock.sendMessage(chatId, {
        text: slim('◈ owner only'), ...ci
      }, { quoted: m });
      try {
        const bl = await sock.fetchBlocklist();
        if (!bl.length) return sock.sendMessage(chatId, {
          text: slim('◈ no blocked users'), ...ci
        }, { quoted: m });
        const lines = bl.slice(0, 20).map((j, i) => `${i + 1}. +${j.split('@')[0]}`).join('\n');
        await sock.sendMessage(chatId, {
          text: slim(`◈ *blocked* (${bl.length})\n${lines}`), ...ci
        }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, {
          text: slim('◈ failed to fetch blocked list'), ...ci
        }, { quoted: m });
      }
    }
  },

  // ─── .restart ────────────────────────────────────────────────
  {
    command: 'restart',
    aliases: ['reboot', 'reload2'],
    category: 'owner',
    description: 'restart the bot process',
    usage: '.restart',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      if (!isOwn(m)) return sock.sendMessage(chatId, {
        text: slim('◈ owner only'), ...ci
      }, { quoted: m });
      await sock.sendMessage(chatId, {
        text: slim('◈ *restarting* — back in a sec 💀'), ...ci
      }, { quoted: m });
      setTimeout(() => process.exit(0), 2000);
    }
  },

  // ─── .groupid ────────────────────────────────────────────────
  {
    command: 'groupid',
    aliases: ['gcid2', 'getgcid'],
    category: 'owner',
    description: 'get current group id',
    usage: '.groupid',
    async handler(sock, m, args, ctx = {}) {
      const ci     = getChannelInfo();
      // chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, {
        text: slim(`◈ *id* — ${chatId}`), ...ci
      }, { quoted: m });
    }
  },
];
