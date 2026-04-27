'use strict';
/**
 * 𝗭𝗘𝗡𝗧𝗥𝗜𝗫 𝗠𝗗 𝗩𝟭 — ᴀᴅᴠᴀɴᴄᴇᴅ ɢʀᴏᴜᴘ ᴛᴏᴏʟs
 * ᴏɴᴇ ꜰɪʟᴇ — ᴍᴜʟᴛɪᴘʟᴇ ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅs
 */
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

const H = (title, t) =>
  `╔═══════════════════════════╗\n` +
  `║   ‼️ 𝙀𝙓𝙊𝘿𝙄𝙇𝙀 𝙓𝘿 ‼️ — ${title.padEnd(11)}║\n` +
  `╚═══════════════════════════╝\n\n` + t;

// ── ʜᴇʟᴘᴇʀ: ɢᴇᴛ ᴀʟʟ ᴍᴇᴍʙᴇʀs ──────────────────────────────────
async function getMembers(sock, chatId) {
  const meta = await sock.groupMetadata(chatId);
  return meta?.participants || [];
}

// ═══════════════════════════════════════════
//  .poll — ᴄʀᴇᴀᴛᴇ ᴀ ᴄᴜsᴛᴏᴍ ᴘᴏʟʟ
// ═══════════════════════════════════════════
const pollCmd = {
  command: 'poll',
  aliases: ['vote', 'createpoll'],
  category: 'group',
  description: 'ᴄʀᴇᴀᴛᴇ ᴀ ᴘᴏʟʟ | .poll Question | opt1 | opt2 | opt3',
  usage: '.poll ʙᴇsᴛ ꜰᴏᴏᴅ? | ᴘɪᴢᴢᴀ | ʙᴜʀɢᴇʀ | sᴜsʜɪ',
  groupOnly: true,
  adminOnly: false,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const full   = args.join(' ').trim();
    const parts  = full.split('|').map(p => p.trim()).filter(Boolean);

    if (parts.length < 3) {
      return sock.sendMessage(chatId, {
        text: H('ᴘᴏʟʟ', `𖤐 ꜰᴏʀᴍᴀᴛ: .poll ʏᴏᴜʀ Qᴜᴇsᴛɪᴏɴ? | ᴏᴘᴛ1 | ᴏᴘᴛ2\n𖤐 ᴇx: .poll ʙᴇsᴛ ʟᴀɴɢᴜᴀɢᴇ? | ᴘʏᴛʜᴏɴ | ᴊs | ʀᴜsᴛ`),
        ...ci,
      }, { quoted: message });
    }

    const question = parts[0];
    const options  = parts.slice(1).slice(0, 10); // ᴍᴀx 10 ᴏᴘᴛɪᴏɴs

    try {
      await sock.sendMessage(chatId, {
        poll: {
          name: `${question}\n\n— ${settings.botName}`,
          values: options,
          selectableCount: 1,
        },
      }, { quoted: message });
    } catch {
      const text = H('ᴘᴏʟʟ',
        `𖤐 *${question}*\n\n` +
        options.map((o,i) => `𖤐 ${i+1}. ${o}`).join('\n') +
        `\n\n— ${settings.botName}`
      );
      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    }
  },
};

// ═══════════════════════════════════════════
//  .inactive — ꜰɪɴᴅ ɪɴᴀᴄᴛɪᴠᴇ ᴍᴇᴍʙᴇʀs
// ═══════════════════════════════════════════
const inactiveCmd = {
  command: 'inactive',
  aliases: ['ghostcheck', 'ghostmembers'],
  category: 'group',
  description: 'ꜰɪɴᴅ ɪɴᴀᴄᴛɪᴠᴇ ᴍᴇᴍʙᴇʀs',
  usage: '.inactive',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId  = context.chatId || message.key.remoteJid;
    const ci      = getChannelInfo();
    const members = await getMembers(sock, chatId);
    const admins  = members.filter(m => m.admin).map(m => m.id);
    const ghosts  = members.filter(m => !admins.includes(m.id));

    if (!ghosts.length) {
      return sock.sendMessage(chatId, {
        text: H('ɢʜᴏsᴛ', `𖤐 ɴᴏ ɪɴᴀᴄᴛɪᴠᴇ ᴍᴇᴍʙᴇʀs ꜰᴏᴜɴᴅ ✓`),
        ...ci,
      }, { quoted: message });
    }

    const list = ghosts.slice(0, 20).map((m,i) => `𖤐 ${i+1}. @${m.id.split('@')[0]}`).join('\n');
    const mentions = ghosts.slice(0, 20).map(m => m.id);

    await sock.sendMessage(chatId, {
      text: H('ɢʜᴏsᴛ', `𖤐 ɪɴᴀᴄᴛɪᴠᴇ ᴍᴇᴍʙᴇʀs (${ghosts.length})\n\n${list}` + (ghosts.length > 20 ? `\n𖤐 ...ᴀɴᴅ ${ghosts.length-20} ᴍᴏʀᴇ` : '')),
      mentions,
      ...ci,
    }, { quoted: message });
  },
};

// ═══════════════════════════════════════════
//  .revoke — ʀᴇsᴇᴛ ɢʀᴏᴜᴘ ɪɴᴠɪᴛᴇ ʟɪɴᴋ
// ═══════════════════════════════════════════
const revokeCmd = {
  command: 'revoke',
  aliases: ['resetlink', 'newlink'],
  category: 'group',
  description: 'ʀᴇsᴇᴛ ɢʀᴏᴜᴘ ɪɴᴠɪᴛᴇ ʟɪɴᴋ',
  usage: '.revoke',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    try {
      const code = await sock.groupRevokeInvite(chatId);
      await sock.sendMessage(chatId, {
        text: H('ʀᴇᴠᴏᴋᴇ', `𖤐 ɪɴᴠɪᴛᴇ ʟɪɴᴋ ʀᴇsᴇᴛ ✓\n𖤐 ɴᴇᴡ ʟɪɴᴋ: https://chat.whatsapp.com/${code}`),
        ...ci,
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ꜰᴀɪʟᴇᴅ: ${e.message}`, ...ci }, { quoted: message });
    }
  },
};

// ═══════════════════════════════════════════
//  .invitelink — ɢᴇᴛ ɢʀᴏᴜᴘ ʟɪɴᴋ
// ═══════════════════════════════════════════
const invitelinkCmd = {
  command: 'invitelink',
  aliases: ['getlink', 'glink'],
  category: 'group',
  description: 'ɢᴇᴛ ɢʀᴏᴜᴘ ɪɴᴠɪᴛᴇ ʟɪɴᴋ',
  usage: '.invitelink',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    try {
      const code = await sock.groupInviteCode(chatId);
      await sock.sendMessage(chatId, {
        text: H('ʟɪɴᴋ', `𖤐 ɪɴᴠɪᴛᴇ ʟɪɴᴋ:\nhttps://chat.whatsapp.com/${code}`),
        ...ci,
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ꜰᴀɪʟᴇᴅ: ${e.message}`, ...ci }, { quoted: message });
    }
  },
};

// ═══════════════════════════════════════════
//  .lockchat / .unlockchat — ʀᴇsᴛʀɪᴄᴛ ɢʀᴏᴜᴘ
// ═══════════════════════════════════════════
const lockchatCmd = {
  command: 'lockchat',
  aliases: ['lockɢʀᴏᴜᴘ', 'restrict'],
  category: 'group',
  description: 'ʀᴇsᴛʀɪᴄᴛ ɢʀᴏᴜᴘ — ᴏɴʟʏ admins ᴄᴀɴ sᴇɴᴅ',
  usage: '.lockchat',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    try {
      await sock.groupSettingUpdate(chatId, 'announcement');
      await sock.sendMessage(chatId, {
        text: H('ʟᴏᴄᴋ', `𖤐 ɢʀᴏᴜᴘ ʟᴏᴄᴋᴇᴅ ✓\n𖤐 ᴏɴʟʏ admins ᴄᴀɴ sᴇɴᴅ ᴍᴇssᴀɢᴇs`),
        ...ci,
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ꜰᴀɪʟᴇᴅ: ${e.message}`, ...ci }, { quoted: message });
    }
  },
};

const unlockchatCmd = {
  command: 'unlockchat',
  aliases: ['unlockɢʀᴏᴜᴘ', 'unrestrict'],
  category: 'group',
  description: 'ᴜɴʀᴇsᴛʀɪᴄᴛ ɢʀᴏᴜᴘ — ᴀʟʟ ᴄᴀɴ sᴇɴᴅ',
  usage: '.unlockchat',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    try {
      await sock.groupSettingUpdate(chatId, 'not_announcement');
      await sock.sendMessage(chatId, {
        text: H('ᴜɴʟᴏᴄᴋ', `𖤐 ɢʀᴏᴜᴘ ᴜɴʟᴏᴄᴋᴇᴅ ✓\n𖤐 ᴀʟʟ ᴍᴇᴍʙᴇʀs ᴄᴀɴ sᴇɴᴅ ᴍᴇssᴀɢᴇs`),
        ...ci,
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ꜰᴀɪʟᴇᴅ: ${e.message}`, ...ci }, { quoted: message });
    }
  },
};

// ═══════════════════════════════════════════
//  .kickall — ᴋɪᴄᴋ ᴀʟʟ ɴᴏɴ-admins
// ═══════════════════════════════════════════
const kickallCmd = {
  command: 'kickall',
  aliases: ['removeall', 'clearɢʀᴏᴜᴘ'],
  category: 'group',
  description: 'ᴋɪᴄᴋ ᴀʟʟ ɴᴏɴ-ᴀᴅᴍɪɴ ᴍᴇᴍʙᴇʀs',
  usage: '.kickall',
  groupOnly: true,
  adminOnly: true,
  strictownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId  = context.chatId || message.key.remoteJid;
    const ci      = getChannelInfo();
    const members = await getMembers(sock, chatId);
    const admins  = members.filter(m => m.admin).map(m => m.id);
    const targets = members.filter(m => !admins.includes(m.id)).map(m => m.id);

    if (!targets.length) {
      return sock.sendMessage(chatId, {
        text: H('ᴋɪᴄᴋ', `𖤐 ɴᴏ ɴᴏɴ-admins ᴛᴏ ᴋɪᴄᴋ`),
        ...ci,
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: H('ᴋɪᴄᴋ', `𖤐 ᴋɪᴄᴋɪɴɢ ${targets.length} ᴍᴇᴍʙᴇʀs...`),
      ...ci,
    }, { quoted: message });

    let done = 0;
    for (const jid of targets) {
      try { await sock.groupParticipantsUpdate(chatId, [jid], 'remove'); done++; await new Promise(r=>setTimeout(r,500)); } catch {}
    }

    await sock.sendMessage(chatId, {
      text: H('ᴋɪᴄᴋ', `𖤐 ᴋɪᴄᴋᴇᴅ ${done}/${targets.length} ᴍᴇᴍʙᴇʀs ✓`),
      ...ci,
    }, { quoted: message });
  },
};

// ═══════════════════════════════════════════
//  .listAdmins — ʟɪsᴛ ᴀʟʟ ɢʀᴏᴜᴘ admins
// ═══════════════════════════════════════════
const listAdminsCmd = {
  command: 'listAdmins',
  aliases: ['admins', 'showᴀᴅᴍɪɴs'],
  category: 'group',
  description: 'ʟɪsᴛ ᴀʟʟ ɢʀᴏᴜᴘ admins',
  usage: '.listAdmins',
  groupOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId  = context.chatId || message.key.remoteJid;
    const ci      = getChannelInfo();
    const members = await getMembers(sock, chatId);
    const admins  = members.filter(m => m.admin);

    const list = admins.map((a,i) =>
      `𖤐 ${i+1}. @${a.id.split('@')[0]}${a.admin === 'superᴀᴅᴍɪɴ' ? ' *(sᴜᴘᴇʀ)*' : ''}`
    ).join('\n');

    await sock.sendMessage(chatId, {
      text: H('admins', `𖤐 *${admins.length}* admins\n\n${list}`),
      mentions: admins.map(a => a.id),
      ...ci,
    }, { quoted: message });
  },
};

// ═══════════════════════════════════════════
//  .groupinfo — ᴅᴇᴛᴀɪʟᴇᴅ ɢʀᴏᴜᴘ ɪɴꜰᴏ
// ═══════════════════════════════════════════
const ɢʀᴏᴜᴘinfoCmd = {
  command: 'ginfo',
  aliases: ['ɢʀᴏᴜᴘinfo', 'gcinfo'],
  category: 'group',
  description: 'ᴅᴇᴛᴀɪʟᴇᴅ ɢʀᴏᴜᴘ ɪɴꜰᴏ',
  usage: '.ginfo',
  groupOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    try {
      const meta    = await sock.groupMetadata(chatId);
      const admins  = meta.participants.filter(p => p.admin).length;
      const members = meta.participants.length;
      const created = new Date(meta.creation * 1000).toLocaleDateString('en-GB');

      await sock.sendMessage(chatId, {
        text: H('group',
          `🤖 *ɴᴀᴍᴇ:* ${meta.subject}\n` +
          `🆔 *ɪᴅ:* ${chatId.split('@')[0]}\n` +
          `🕎 *ᴍᴇᴍʙᴇʀs:* ${members}\n` +
          `☢️ *admins:* ${admins}\n` +
          `🩻 *ᴄʀᴇᴀᴛᴇᴅ:* ${created}\n` +
          `🫰 *ᴅᴇsᴄ:* ${(meta.desc||'ɴ/ᴀ').slice(0,100)}`
        ),
        ...ci,
      }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ꜰᴀɪʟᴇᴅ: ${e.message}`, ...ci }, { quoted: message });
    }
  },
};

// ═══════════════════════════════════════════
//  .massmention — ᴍᴇɴᴛɪᴏɴ ᴀʟʟ ᴍᴇᴍʙᴇʀs
// ═══════════════════════════════════════════
const massmentionCmd = {
  command: 'massmention',
  aliases: ['mentionall', 'mentioneveryone'],
  category: 'group',
  description: 'ᴍᴇɴᴛɪᴏɴ ᴇᴠᴇʀʏ ɢʀᴏᴜᴘ ᴍᴇᴍʙᴇʀ',
  usage: '.massmention [ᴍᴇssᴀɢᴇ]',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId  = context.chatId || message.key.remoteJid;
    const ci      = getChannelInfo();
    const members = await getMembers(sock, chatId);
    const msg     = args.join(' ') || '𖤐 ᴀᴛᴛᴇɴᴛɪᴏɴ ᴇᴠᴇʀʏᴏɴᴇ!';

    const mentions = members.map(m => m.id);
    const tagsList = members.map(m => `@${m.id.split('@')[0]}`).join(' ');

    await sock.sendMessage(chatId, {
      text: `${msg}\n\n${tagsList}`,
      mentions,
      ...ci,
    }, { quoted: message });
  },
};

// ═══════════════════════════════════════════
//  .setdesc — sᴇᴛ ɢʀᴏᴜᴘ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ
// ═══════════════════════════════════════════
const setdescCmd = {
  command: 'setdesc',
  aliases: ['setɢʀᴏᴜᴘdesc', 'gdesc'],
  category: 'group',
  description: 'sᴇᴛ ɢʀᴏᴜᴘ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ',
  usage: '.setdesc <ᴛᴇxᴛ>',
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci     = getChannelInfo();
    const desc   = args.join(' ').trim();
    if (!desc) return sock.sendMessage(chatId, { text: `𖤐 ᴘʀᴏᴠɪᴅᴇ ᴀ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ`, ...ci }, { quoted: message });
    try {
      await sock.groupUpdateDescription(chatId, desc);
      await sock.sendMessage(chatId, { text: H('ᴅᴇsᴄ', `𖤐 ᴅᴇsᴄʀɪᴘᴛɪᴏɴ ᴜᴘᴅᴀᴛᴇᴅ ✓`), ...ci }, { quoted: message });
    } catch (e) {
      await sock.sendMessage(chatId, { text: `𖤐 ꜰᴀɪʟᴇᴅ: ${e.message}`, ...ci }, { quoted: message });
    }
  },
};

// ═══════════════════════════════════════════
//  .reportmsg — ʀᴇᴘᴏʀᴛ ᴀ ᴍᴇssᴀɢᴇ ᴛᴏ admins
// ═══════════════════════════════════════════
const reportCmd = {
  command: 'report',
  aliases: ['flag'],
  category: 'group',
  description: 'ʀᴇᴘᴏʀᴛ ᴀ ᴍᴇssᴀɢᴇ ᴛᴏ admins',
  usage: '.report <ʀᴇᴀsᴏɴ>',
  groupOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId  = context.chatId || message.key.remoteJid;
    const ci      = getChannelInfo();
    const reason  = args.join(' ').trim() || 'ɴᴏ ʀᴇᴀsᴏɴ';
    const sender  = message.key.participant || message.key.remoteJid;
    const members = await getMembers(sock, chatId);
    const admins  = members.filter(m => m.admin).map(m => m.id);

    const text =
      `🤺 *ʀᴇᴘᴏʀᴛ ꜰʀᴏᴍ* @${sender.split('@')[0]}\n` +
      `🧘‍♀️ *ʀᴇᴀsᴏɴ:* ${reason}\n` +
      `🥋 admins ᴘʟᴇᴀsᴇ ᴄʜᴇᴄᴋ`;

    await sock.sendMessage(chatId, { text, mentions: [...admins, sender], ...ci }, { quoted: message });
  },
};

// ═══════════════════════════════════════════
//  ᴇxᴘᴏʀᴛ ᴀʟʟ — ᴏɴᴇ ꜰɪʟᴇ, ᴍᴀɴʏ ᴄᴏᴍᴍᴀɴᴅs
// ═══════════════════════════════════════════
module.exports = [
  pollCmd, inactiveCmd, revokeCmd, invitelinkCmd,
  lockchatCmd, unlockchatCmd, kickallCmd,
  listAdminsCmd, ɢʀᴏᴜᴘinfoCmd, massmentionCmd,
  setdescCmd, reportCmd,
];
