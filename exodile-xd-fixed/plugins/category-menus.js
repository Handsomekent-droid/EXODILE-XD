'use strict';
/**
 * EXODILE XD — Category Menus
 * .groupmenu, .adminmenu, .downloadmenu, .imagemenu
 * Each shows full related commands with descriptions
 */
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

const FOOTER = '\n\n> Exodile XD\n> Exodile Empire Inc.\n> Powered by Prime Killer Nova Kent';
const pfx = '.';

function box(icon, title, sections) {
  const hdr = `${icon} ${title}`;
  const padLen = hdr.length + 4;
  let t = `╔${'═'.repeat(padLen)}╗\n   ${hdr}\n╚${'═'.repeat(padLen)}╝\n`;
  for (const [header, cmds] of sections) {
    const subPad = header.length + 4;
    t += `\n╔${'═'.repeat(subPad)}╗\n   ${header}\n╚${'═'.repeat(subPad)}╝\n`;
    for (const [cmd, desc] of cmds) {
      t += `┃ ${pfx}${cmd} — ${desc}\n`;
    }
  }
  return t + FOOTER;
}

module.exports = [

  // ── GROUP MENU ────────────────────────────────────────────────
  {
    command: 'groupmenu',
    aliases: ['gmenu', 'groupcmds', 'gcmds'],
    category: 'group',
    description: '👥 All group management commands',
    usage: '.groupmenu',

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();

      const text = box('👥', 'GROUP MENU', [
        ['⚙️ Group Control', [
          ['kick @user', 'Kick a member from group'],
          ['add +number', 'Add a member to group'],
          ['promote @user', 'Make member an admin'],
          ['demote @user', 'Remove admin from member'],
          ['mute', 'Mute group (only admins can talk)'],
          ['unmute', 'Unmute group for everyone'],
          ['left', 'Leave group with goodbye msg'],
        ]],
        ['🔗 Links & Info', [
          ['grouplink', 'Get group invite link'],
          ['resetlink', 'Reset group invite link'],
          ['groupinfo', 'Show group details'],
          ['groupstats', 'Full group statistics'],
          ['groupsize', 'Show member count'],
          ['listmembers', 'List all members'],
          ['listadmins', 'List all group admins'],
        ]],
        ['📢 Broadcast', [
          ['tagall', 'Tag/mention all members'],
          ['mentionadmins', 'Ping all admins'],
          ['hidetag', 'Mention all silently'],
          ['poll <q> | opt1 | opt2', 'Create a poll'],
        ]],
        ['🛡️ Protections', [
          ['antilink on/off', 'Block links in group'],
          ['antidemote on/off', 'Prevent unauthorized demotion'],
          ['antipromote on/off', 'Prevent unauthorized promotion'],
          ['antispam on/off', 'Auto-block spammers'],
          ['antibadword on/off', 'Filter bad words'],
          ['antibot on/off', 'Kick bots that join'],
          ['antiraid on/off', 'Anti mass-join protection'],
        ]],
        ['🎉 Events', [
          ['welcome on/off', 'Welcome message on join'],
          ['goodbye on/off', 'Goodbye message on leave'],
          ['grouprules [set <r>]', 'Set/show group rules'],
          ['setgroupicon', 'Set group photo (reply to img)'],
          ['setgname <name>', 'Change group name'],
          ['setgdesc <text>', 'Set group description'],
        ]],
      ]);

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    },
  },

  // ── ADMIN MENU ────────────────────────────────────────────────
  {
    command: 'adminmenu',
    aliases: ['amenu', 'admincmds', 'adcmds'],
    category: 'admin',
    description: '🛡️ All admin & moderation commands',
    usage: '.adminmenu',

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();

      const text = box('🛡️', 'ADMIN MENU', [
        ['👤 User Management', [
          ['kick @user', 'Remove member from group'],
          ['ban @user', 'Ban user from bot'],
          ['unban @user', 'Unban a user'],
          ['warn @user', 'Warn a user'],
          ['warnings @user', 'Check user warnings'],
          ['block @user', 'Block a user (DM)'],
        ]],
        ['🔒 Anti-Features', [
          ['antilink on/off/set', 'Block & action on links'],
          ['antibadword on/off', 'Block & filter bad words'],
          ['antispam on/off', 'Auto-block spammers'],
          ['antidemote on/off', 'Reverse unauthorized demotions'],
          ['antipromote on/off', 'Reverse unauthorized promotions'],
          ['anticall on/off', 'Reject incoming calls'],
          ['antibot on/off', 'Remove bots that join'],
          ['antitag on/off', 'Block mass tagging'],
        ]],
        ['⚙️ Group Settings', [
          ['mute / unmute', 'Lock or open group chat'],
          ['setgname <n>', 'Change group name'],
          ['setgdesc <text>', 'Set group description'],
          ['setgroupicon', 'Set group photo'],
          ['grouprules set <r>', 'Set group rules'],
          ['setgstatus', 'Post replied media to status'],
        ]],
        ['📋 Moderation', [
          ['delete / del', 'Delete replied message'],
          ['clear', 'Clear bot messages'],
          ['kickall', 'Remove all non-admin members'],
          ['tagall', 'Tag all members'],
          ['tagnotadmin', 'Tag all non-admin members'],
        ]],
        ['📊 Stats & Info', [
          ['settings', 'Full system panel'],
          ['groupstats', 'Group analytics'],
          ['rank', 'Show user message ranks'],
          ['listactive', 'Most active members'],
          ['listinactive', 'Least active members'],
          ['warnings @user', 'View user warning count'],
        ]],
      ]);

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    },
  },

  // ── DOWNLOAD MENU ─────────────────────────────────────────────
  {
    command: 'downloadmenu',
    aliases: ['dlmenu', 'downloadcmds', 'dlcmds'],
    category: 'download',
    description: '📥 All download commands',
    usage: '.downloadmenu',

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();

      const text = box('📥', 'DOWNLOAD MENU', [
        ['🎵 Music & Audio', [
          ['music <name/URL>', 'Download music (YouTube)'],
          ['song <name/URL>', 'Alias for music command'],
          ['mp3 <URL>', 'Direct YouTube MP3 download'],
          ['soundcloud <URL>', 'SoundCloud audio download'],
          ['play <song name>', 'Search & play music'],
          ['lyrics <song>', 'Get song lyrics'],
          ['shazam', 'Identify song from audio (reply)'],
        ]],
        ['🎬 Video', [
          ['ytmp4 <URL>', 'YouTube video download'],
          ['video <URL>', 'Generic video download'],
          ['tiktok <URL>', 'TikTok video/audio download'],
          ['instagram <URL>', 'Instagram reel/photo download'],
          ['facebook <URL>', 'Facebook video download'],
          ['twitter <URL>', 'Twitter/X video download'],
          ['pinterest <URL>', 'Pinterest image/video download'],
          ['sharechat <URL>', 'ShareChat video download'],
        ]],
        ['💾 Files & Apps', [
          ['mediafire <URL>', 'MediaFire file download'],
          ['mega <URL>', 'MEGA file download'],
          ['apk <app name>', 'Search & get APK info'],
          ['apkpure <app>', 'APKPure app search'],
        ]],
        ['📸 Status & Media', [
          ['statusdl', 'Save a WhatsApp status (reply)'],
          ['setgstatus', 'Post replied media to status'],
          ['autoviewonce on/off', 'Auto-save view-once media'],
          ['autostatus on/off', 'Auto-view all statuses'],
        ]],
        ['🔗 Links', [
          ['shortlink <URL>', 'Shorten a URL'],
          ['unshort <URL>', 'Expand a short URL'],
          ['fetch <URL>', 'Fetch raw content from URL'],
        ]],
      ]);

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    },
  },

  // ── IMAGE MENU ────────────────────────────────────────────────
  {
    command: 'imagemenu',
    aliases: ['imgmenu', 'imagecmds', 'imcmds', 'imgcmds'],
    category: 'images',
    description: '🖼️ All image & media commands',
    usage: '.imagemenu',

    async handler(sock, message, args, context = {}) {
      const chatId = context.chatId || message.key.remoteJid;
      const ci     = getChannelInfo();

      const text = box('🖼️', 'IMAGE MENU', [
        ['🔍 Search & Fetch', [
          ['gimage <query>', 'Google image search'],
          ['wallpaper <topic>', 'HD wallpaper by topic'],
          ['gif <topic>', 'Search & send GIF'],
          ['meme', 'Random meme image'],
          ['imagine <prompt>', 'AI image generation'],
          ['random-img <topic>', 'Random image search'],
        ]],
        ['✏️ Edit & Filter', [
          ['sticker', 'Convert image to sticker (reply)'],
          ['sticker2', 'Advanced sticker maker'],
          ['resize <W>x<H>', 'Resize image (reply)'],
          ['grayscale', 'Convert to grayscale (reply)'],
          ['invert', 'Invert image colors (reply)'],
          ['sepia', 'Apply sepia filter (reply)'],
          ['sharpen', 'Sharpen image (reply)'],
          ['blur <level>', 'Blur image (reply)'],
          ['img-blur', 'Blur image background'],
          ['readqr', 'Read QR code from image'],
          ['tourl', 'Upload image and get URL'],
        ]],
        ['🤖 AI Image Tools', [
          ['sketchai', 'Convert image to sketch (AI)'],
          ['animeai', 'Anime-style image (AI)'],
          ['oilpaintingai', 'Oil painting filter (AI)'],
          ['cyberpunkai', 'Cyberpunk style (AI)'],
          ['pixelartai', 'Pixel art style (AI)'],
          ['watercolorai', 'Watercolor filter (AI)'],
          ['realistic', 'Enhance to realistic (AI)'],
        ]],
        ['💬 Text on Image', [
          ['textmaker <text>', 'Stylish text image'],
          ['tinytext <text>', 'Tiny text converter'],
          ['styletext <text>', 'Style text with fonts'],
          ['quozio <text>', 'Quote image card'],
          ['quote2 <text>', 'Fancy quote image'],
          ['emojimix A+B', 'Mix two emojis together'],
        ]],
        ['🖼️ Stickers', [
          ['sticker', 'Image → WhatsApp sticker'],
          ['sticker-alt', 'Alternative sticker maker'],
          ['attp <text>', 'Animated text sticker'],
          ['tgsticker <emoji>', 'Telegram-style sticker'],
          ['stickercrop', 'Crop sticker edges'],
          ['sfile', 'Send sticker as file'],
        ]],
        ['📸 Profile Pictures', [
          ['getpp @user', 'Get someone\'s profile pic'],
          ['setpp', 'Set your profile photo (reply)'],
          ['grouppp', 'Get group profile pic'],
          ['wasted', 'Add GTA wasted overlay'],
          ['goodnight', 'Send goodnight image'],
        ]],
      ]);

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    },
  },
];
