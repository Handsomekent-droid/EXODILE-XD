'use strict';
const { denyIfNotStrictOwner } = require('../lib/strictOwner');

const settings = require('../settings');
const { addSudo, removeSudo, getSudoList } = require('../lib/index');
const isOwnerOrSudo = require('../lib/isOwner');
const { cleanJid } = require('../lib/isOwner');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';

function extractTargetJid(message, args) {
  if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0])
    return message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage)
    return message.message.extendedTextMessage.contextInfo.participant;
  const text = args.join(' ');
  const match = text.match(/\b(\d{7,15})\b/);
  if (match) return match[1] + '@s.whatsapp.net';
  return null;
}

module.exports = {
  command: 'sudo',
  aliases: ['sudoadd', 'sudolist', 'sudodel', 'addsudo', 'removesudo', 'listsudo'],
  category: 'owner',
  description: 'add/remove/list sudo users',
  usage: '.sudo add|del|list <@user|number>',
  strictOwnerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId    = context.chatId || message.key.remoteJid;

    if (await denyIfNotStrictOwner(sock, message, chatId)) return;
    const senderJid = message.key.participant || message.key.remoteJid;
    const ci        = getChannelInfo();
    const isOwner   = message.key.fromMe || isOwnerOrSudo.isOwnerOnly(senderJid);
    const sub       = (args[0] || '').toLowerCase();

    if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
      return sock.sendMessage(chatId, {
        text: `◈ *sudo*\n│ .sudo add <@user>\n│ .sudo del <@user>\n│ .sudo list` + FOOTER,
        ...ci
      }, { quoted: message });
    }

    if (sub === 'list') {
      const list = await getSudoList();
      if (!list.length) return sock.sendMessage(chatId, {
        text: `◈ no sudo users yet` + FOOTER, ...ci
      }, { quoted: message });
      const txt = list.map((j, i) => `│ ${i + 1}. @${cleanJid(j)}`).join('\n');
      return sock.sendMessage(chatId, {
        text: `◈ *sudo list*\n${txt}`,
        mentions: list, ...ci
      }, { quoted: message });
    }

    if (!isOwner) return sock.sendMessage(chatId, {
      text: `◈ owner only` + FOOTER, ...ci
    }, { quoted: message });

    const targetJid = extractTargetJid(message, args.slice(1));
    if (!targetJid) return sock.sendMessage(chatId, {
      text: `◈ mention a user or provide a number` + FOOTER, ...ci
    }, { quoted: message });

    let displayId = cleanJid(targetJid);
    if (targetJid.includes('@lid') && chatId.endsWith('@g.us')) {
      try {
        const meta = await sock.groupMetadata(chatId);
        const found = meta.participants.find(p => p.lid === targetJid || p.id === targetJid);
        if (found?.id && !found.id.includes('@lid')) displayId = cleanJid(found.id);
      } catch {}
    }

    if (sub === 'add') {
      const ok = await addSudo(targetJid);
      return sock.sendMessage(chatId, {
        text: (ok ? `◈ @${displayId} added as sudo ✓` : `◈ failed to add`) + FOOTER,
        mentions: [targetJid], ...ci
      }, { quoted: message });
    }

    if (sub === 'del' || sub === 'remove') {
      if (displayId === cleanJid(settings.ownerNumber))
        return sock.sendMessage(chatId, {
          text: `◈ cannot remove main owner` + FOOTER, ...ci
        }, { quoted: message });
      const ok = await removeSudo(targetJid);
      return sock.sendMessage(chatId, {
        text: (ok ? `◈ sudo revoked from @${displayId} ✓` : `◈ failed`) + FOOTER,
        mentions: [targetJid], ...ci
      }, { quoted: message });
    }
  }
};
