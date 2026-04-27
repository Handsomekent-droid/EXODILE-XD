'use strict';
const { sessionStore } = require('../lib/sessionStore');
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

/**
 * ☠️ EXODILE MD — Block Plugin System
 * .blockuser @user    — block a user from using the bot
 * .unblockuser @user  — unblock a user
 * .blockcmd <cmd>     — block a command for non-owners
 * .unblockcmd <cmd>   — unblock a command
 * .blocklist          — show all blocks
 * .antispam on/off    — toggle spam protection
 */
const fs   = require('fs');
const path = require('path');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
const DATA   = path.join(__dirname, '../data/blockplugin.json');

function load() {
  try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); }
  catch { return { blockedUsers: [], blockedCmds: [], antispam: true }; }
}
function save(d) {
  try { fs.writeFileSync(DATA, JSON.stringify(d, null, 2)); } catch {}
}

// Export checker so messageHandler can use it
function isUserBlocked(jid) {
  const d = load();
  const num = jid.split('@')[0].split(':')[0];
  return d.blockedUsers.some(u => u.replace(/\D/g,'') === num.replace(/\D/g,''));
}
function isCmdBlocked(cmd) {
  const d = load();
  return d.blockedCmds.includes(cmd.toLowerCase());
}

function getTargets(message, args) {
  const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quoted    = message.message?.extendedTextMessage?.contextInfo?.participant;
  if (mentioned.length) return mentioned;
  if (quoted) return [quoted];
  if (args[0]?.includes('@')) return [args[0].replace('@','') + '@s.whatsapp.net'];
  if (args[0]?.match(/^\d+$/)) return [args[0] + '@s.whatsapp.net'];
  return [];
}

module.exports = [
  {
    command: 'blockuser',
    aliases: ['buser', 'banuser'],
    category: 'owner',
    description: '🚫 Block user from using bot',
    usage: '.blockuser @user',
    ownerOnly: true,
  strictOwnerOnly: true,
    isUserBlocked, isCmdBlocked,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
      const ci = getChannelInfo();
      const targets = getTargets(message, args);

      if (!targets.length) return sock.sendMessage(chatId, {
        text: `┏━━「 🚫 *BLOCK USER* 」━━┓\n┃\n┃  💀 *Usage:* .blockuser @user\n┃  ⚡ Mention or reply\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });

      const d = load();
      let added = 0;
      for (const jid of targets) {
        const num = jid.split('@')[0];
        if (!d.blockedUsers.includes(num)) { d.blockedUsers.push(num); added++; }
      }
      save(d);
      const names = targets.map(j => `@${j.split('@')[0]}`).join(', ');
      await sock.sendMessage(chatId, {
        text: `┏━━「 🚫 *BLOCKED* 」━━┓\n┃\n┃  ☠️ ${names}\n┃  💀 ${added} user(s) blocked!\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER,
        mentions: targets, ...ci
      }, { quoted: message });
    }
  },

  {
    command: 'unblockuser',
    aliases: ['ubuser', 'unbanuser'],
    category: 'owner',
    description: '✅ Unblock user',
    usage: '.unblockuser @user',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();
      const targets = getTargets(message, args);

      if (!targets.length) return sock.sendMessage(chatId, {
        text: `┏━━「 ✅ *UNBLOCK USER* 」━━┓\n┃\n┃  💀 *Usage:* .unblockuser @user\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });

      const d = load();
      const nums = targets.map(j => j.split('@')[0]);
      d.blockedUsers = d.blockedUsers.filter(u => !nums.includes(u));
      save(d);
      const names = targets.map(j => `@${j.split('@')[0]}`).join(', ');
      await sock.sendMessage(chatId, {
        text: `┏━━「 ✅ *UNBLOCKED* 」━━┓\n┃\n┃  🟢 ${names}\n┃  ⚡ Unblocked!\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER,
        mentions: targets, ...ci
      }, { quoted: message });
    }
  },

  {
    command: 'blockcmd',
    aliases: ['disablecmd', 'lockcommand'],
    category: 'owner',
    description: '🔒 Block a command from non-owners',
    usage: '.blockcmd <command>',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();
      const cmd = args[0]?.toLowerCase().replace(/^[.!#\/]/, '');
      if (!cmd) return sock.sendMessage(chatId, {
        text: `┏━━「 🔒 *BLOCK CMD* 」━━┓\n┃\n┃  💀 *Usage:* .blockcmd <cmd>\n┃  ⚡ *Example:* .blockcmd tiktok\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });

      const d = load();
      if (!d.blockedCmds.includes(cmd)) d.blockedCmds.push(cmd);
      save(d);
      await sock.sendMessage(chatId, {
        text: `┏━━「 🔒 *CMD LOCKED* 」━━┓\n┃\n┃  ☠️ *.${cmd}* is now locked!\n┃  💀 Only owner can use it\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });
    }
  },

  {
    command: 'unblockcmd',
    aliases: ['enablecmd', 'unlockcommand'],
    category: 'owner',
    description: '🔓 Unblock a command',
    usage: '.unblockcmd <command>',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();
      const cmd = args[0]?.toLowerCase().replace(/^[.!#\/]/, '');
      if (!cmd) return sock.sendMessage(chatId, {
        text: `┏━━「 🔓 *UNLOCK CMD* 」━━┓\n┃\n┃  💀 *Usage:* .unblockcmd <cmd>\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });

      const d = load();
      d.blockedCmds = d.blockedCmds.filter(c => c !== cmd);
      save(d);
      await sock.sendMessage(chatId, {
        text: `┏━━「 🔓 *CMD UNLOCKED* 」━━┓\n┃\n┃  ✅ *.${cmd}* is now public!\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });
    }
  },

  {
    command: 'blocklist',
    aliases: ['showblocks', 'blist'],
    category: 'owner',
    description: '📋 Show all blocks',
    usage: '.blocklist',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();
      const d = load();

      let text = `┏━━「 📋 *BLOCK LIST* 」━━┓\n┃\n`;
      text += `┃  🚫 *Blocked Users:* ${d.blockedUsers.length}\n`;
      d.blockedUsers.slice(0,15).forEach(u => { text += `┃  ➽ +${u}\n`; });
      if (d.blockedUsers.length > 15) text += `┃  ... +${d.blockedUsers.length - 15} more\n`;
      text += `┃\n┃  🔒 *Blocked Commands:* ${d.blockedCmds.length}\n`;
      d.blockedCmds.forEach(c => { text += `┃  ➽ .${c}\n`; });
      text += `┃\n┃  🛡️ *Anti-Spam:* ${d.antispam ? '✅ ON' : '❌ OFF'}\n`;
      text += `┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER;
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    }
  },

  {
    command: 'antispam',
    aliases: ['spamprotect', 'nospam'],
    category: 'owner',
    description: '🛡️ Toggle spam protection',
    usage: '.antispam on/off',
    ownerOnly: true,
  strictOwnerOnly: true,

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci = getChannelInfo();
      const d = load();
      const state = args[0]?.toLowerCase() === 'off' ? false : true;
      d.antispam = state;
      save(d);
      await sock.sendMessage(chatId, {
        text: `┏━━「 🛡️ *ANTI-SPAM* 」━━┓\n┃\n┃  ${state ? '✅ Enabled' : '❌ Disabled'}\n┃  💀 Spam protection is ${state ? 'ON' : 'OFF'}!\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER, ...ci
      }, { quoted: message });
    }
  },
];
