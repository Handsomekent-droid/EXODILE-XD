'use strict';
const { channelInfo } = require('../lib/messageConfig');

const STYLES = {
  bold:      t => [...t].map(c => {const o=c.charCodeAt(0); return o>=65&&o<=90?String.fromCodePoint(o+119743):o>=97&&o<=122?String.fromCodePoint(o+119737):c}).join(''),
  italic:    t => [...t].map(c => {const o=c.charCodeAt(0); return o>=65&&o<=90?String.fromCodePoint(o+119795):o>=97&&o<=122?String.fromCodePoint(o+119789):c}).join(''),
  bold_italic:t=> [...t].map(c => {const o=c.charCodeAt(0); return o>=65&&o<=90?String.fromCodePoint(o+119847):o>=97&&o<=122?String.fromCodePoint(o+119841):c}).join(''),
  smallcaps: t => t.replace(/[a-z]/g, c => 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀsᴛᴜᴠᴡxʏᴢ'['abcdefghijklmnopqrstuvwxyz'.indexOf(c)]),
  double:    t => [...t].map(c => {const o=c.charCodeAt(0); return o>=65&&o<=90?String.fromCodePoint(o+120211):o>=97&&o<=122?String.fromCodePoint(o+120205):c}).join(''),
  fraktur:   t => [...t].map(c => {const o=c.charCodeAt(0); return o>=65&&o<=90?String.fromCodePoint(o+120107):o>=97&&o<=122?String.fromCodePoint(o+120101):c}).join(''),
  mono:      t => [...t].map(c => {const o=c.charCodeAt(0); return o>=65&&o<=90?String.fromCodePoint(o+120367):o>=97&&o<=122?String.fromCodePoint(o+120361):c}).join(''),
  circle:    t => [...t].map(c => {const o=c.charCodeAt(0); return o>=65&&o<=90?String.fromCodePoint(o+9333):o>=97&&o<=122?String.fromCodePoint(o+9327):o>=48&&o<=57?String.fromCodePoint(o+9263):c}).join(''),
};

module.exports = {
  command: 'stext',
  aliases: ['styletext','fancytext','textstyle'],
  category: 'fun',
  description: 'sᴛʏʟᴇ ᴛᴇxᴛ ɪɴ ꜰᴀɴᴄʏ ꜰᴏʀᴍᴀᴛs',
  usage: '.stext <ᴛᴇxᴛ>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const text = args.join(' ').trim();
    if (!text) return await sock.sendMessage(chatId, { text: '✧ ᴘʀᴏᴠɪᴅᴇ ᴛᴇxᴛ.\n𖤐 ᴇxᴀᴍᴘʟᴇ: .sᴛᴇxᴛ ʜᴇʟʟᴏ ᴡᴏʀʟᴅ', ...channelInfo }, { quoted: message });

    const lines = Object.entries(STYLES).map(([name, fn]) =>
      `✧ *${name}:* ${fn(text)}`
    ).join('\n');

    await sock.sendMessage(chatId, {
      text: `╔══════════════════════════╗\n║  𖤂ꜰᴀɴᴄʏ ᴛᴇxᴛ sᴛʏʟᴇs   ║\n╚══════════════════════════╝\n\n${lines}`,
      ...channelInfo
    }, { quoted: message });
  }
};
