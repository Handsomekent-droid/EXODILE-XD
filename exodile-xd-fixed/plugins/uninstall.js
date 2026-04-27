'use strict';
const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const { join } = require('path');
const { unlinkSync, readdirSync, existsSync } = require('fs');
const { getChannelInfo } = require('../lib/messageConfig');

const PROTECTED = new Set([
  'list','self','uninstall','commandHandler',
  'messageHandler','strictOwner','isOwner','sessionManager',
]);

module.exports = {
  command: 'uninstall',
  aliases: ['removeplugin', 'uninstallplugin'],
  category: 'owner',
  ownerOnly: true,
  strictOwnerOnly: true,
  description: 'Uninstall (delete) a plugin by name — owner only',
  usage: '.uninstall <pluginname>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    const pluginDir = join(__dirname);
    const allFiles  = readdirSync(pluginDir).filter(f => f.endsWith('.js'));
    const allNames  = allFiles.map(f => f.replace('.js', ''));

    // No args — list all removable plugins
    if (!args || !args[0]) {
      const removable = allNames.filter(n => !PROTECTED.has(n)).sort();
      return sock.sendMessage(chatId, {
        text:
          `┌─━─━〔 🗑️ *UNINSTALL PLUGIN* 〕━─━─┐\n` +
          `│\n` +
          `│  Usage: .uninstall <name>\n` +
          `│\n` +
          `│  *Removable plugins:*\n` +
          removable.map(n => `│  • ${n}`).join('\n') + '\n' +
          `│\n` +
          `└─━─━─━─━─━─━─━─━─━─━─━─━─━─┘`,
        ...ci
      }, { quoted: message });
    }

    const target = args[0].toLowerCase().replace('.js', '');

    if (PROTECTED.has(target)) {
      return sock.sendMessage(chatId, {
        text: `🔒 *${target}* is a protected core plugin and cannot be removed.`,
        ...ci
      }, { quoted: message });
    }

    if (!allNames.includes(target)) {
      return sock.sendMessage(chatId, {
        text: `❌ Plugin *"${target}"* not found.\n\nUse *.uninstall* (no args) to see all plugins.`,
        ...ci
      }, { quoted: message });
    }

    try {
      const filePath = join(pluginDir, target + '.js');
      unlinkSync(filePath);

      // Remove from commandHandler cache
      try {
        const ch = require('../lib/commandHandler');
        ch.commands.forEach((cmd, key) => {
          // find all commands that came from this plugin file
        });
        ch.reloadCommands();
      } catch {}

      await sock.sendMessage(chatId, {
        text:
          `✅ *Plugin Uninstalled*\n\n` +
          `🗑️ *${target}.js* has been removed.\n` +
          `♻️ Commands reloaded automatically.`,
        ...ci
      }, { quoted: message });
    } catch (err) {
      await sock.sendMessage(chatId, {
        text: `❌ Failed to uninstall: ${err.message}`,
        ...ci
      }, { quoted: message });
    }
  }
};
