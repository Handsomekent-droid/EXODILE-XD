'use strict';
/**
 * EXODILE XD — listactive / listinactive / listonline plugins
 * Active   = members with recorded message count in this group
 * Inactive = group members with zero messages recorded
 * Online   = attempt presence check (best-effort via presenceSubscribe)
 */

const store = require('../lib/lightweight_store');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

function box(title, lines) {
  return (
    `┌─━─━〔 ${title} 〕━─━─┐\n` +
    lines.map(l => `│ ${l}`).join('\n') + '\n' +
    `└─━─━─━─━─━─━─━─━─┘` + FOOTER
  );
}

// ─── shared helper: get message counts for this group ────────
async function getGroupCounts(chatId) {
  try {
    const all = await store.getAllMessageCounts();
    return all?.messageCount?.[chatId] || {};
  } catch {
    return {};
  }
}

// ─── .listactive ─────────────────────────────────────────────
const listActive = {
  command: 'listactive',
  aliases: ['activemembers', 'activeusers', 'topactive'],
  category: 'group',
  description: '📊 List active members ranked by message count',
  usage: '.listactive [top N]',
  groupOnly: true,

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();

    try {
      // optional: .listactive 20  → show top 20
      const limit = Math.min(Math.max(parseInt(args[0]) || 20, 5), 50);

      const [meta, counts] = await Promise.all([
        sock.groupMetadata(chatId),
        getGroupCounts(chatId),
      ]);

      const participants = meta.participants || [];

      // only include members that are still in the group
      const memberJids = new Set(participants.map(p => p.id));

      const ranked = Object.entries(counts)
        .filter(([jid]) => memberJids.has(jid))
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      if (!ranked.length) {
        return sock.sendMessage(chatId, {
          text: box('📊 𝗔𝗖𝗧𝗜𝗩𝗘 𝗠𝗘𝗠𝗕𝗘𝗥𝗦', [
            '❌ No activity recorded yet.',
            '💡 Members need to send messages first.',
          ]),
          ...ci,
        }, { quoted: m });
      }

      const medals = ['🥇','🥈','🥉'];
      const lines = ranked.map(([jid, count], i) => {
        const num = jid.split('@')[0];
        const badge = medals[i] || `${i + 1}.`;
        return `${badge} @${num} — ${count} msg${count !== 1 ? 's' : ''}`;
      });

      const header = [
        `👥 Group: ${meta.subject}`,
        `📊 Showing top ${ranked.length} active members`,
        `─────────────────────`,
        ...lines,
      ];

      await sock.sendMessage(chatId, {
        text: box('📊 𝗔𝗖𝗧𝗜𝗩𝗘 𝗠𝗘𝗠𝗕𝗘𝗥𝗦', header),
        mentions: ranked.map(([jid]) => jid),
        ...ci,
      }, { quoted: m });

    } catch (err) {
      console.error('[listactive]', err?.message);
      await sock.sendMessage(chatId, {
        text: box('⚠️ 𝗘𝗥𝗥𝗢𝗥', ['❌ Could not fetch active members.', `💡 ${err?.message?.slice(0, 60) || 'Unknown error'}`]),
        ...ci,
      }, { quoted: m });
    }
  },
};

// ─── .listinactive ───────────────────────────────────────────
const listInactive = {
  command: 'listinactive',
  aliases: ['inactivemembers', 'inactiveusers', 'ghosts'],
  category: 'group',
  description: '👻 List members who have never sent a message',
  usage: '.listinactive',
  groupOnly: true,

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();

    try {
      const [meta, counts] = await Promise.all([
        sock.groupMetadata(chatId),
        getGroupCounts(chatId),
      ]);

      const participants = meta.participants || [];
      const botJid = sock.user?.id?.replace(/:.*@/, '@') || '';

      // inactive = in the group but zero recorded messages (excluding bot itself)
      const inactive = participants.filter(p => {
        if (p.id === botJid) return false;
        return !counts[p.id] || counts[p.id] === 0;
      });

      if (!inactive.length) {
        return sock.sendMessage(chatId, {
          text: box('👻 𝗜𝗡𝗔𝗖𝗧𝗜𝗩𝗘 𝗠𝗘𝗠𝗕𝗘𝗥𝗦', [
            '✅ No inactive members found!',
            '🎉 Everyone has been chatting.',
          ]),
          ...ci,
        }, { quoted: m });
      }

      const lines = inactive.map((p, i) => {
        const num = p.id.split('@')[0];
        const role = p.admin === 'superadmin' ? ' 👑' : p.admin ? ' 🛡️' : '';
        return `${i + 1}. @${num}${role}`;
      });

      // split into pages of 25 if very large
      const chunks = [];
      for (let i = 0; i < lines.length; i += 25) chunks.push(lines.slice(i, i + 25));

      for (let pi = 0; pi < chunks.length; pi++) {
        const pageNote = chunks.length > 1 ? `Page ${pi + 1}/${chunks.length} · ` : '';
        const header = [
          `👥 Group: ${meta.subject}`,
          `👻 ${pageNote}${inactive.length} inactive member${inactive.length !== 1 ? 's' : ''}`,
          `─────────────────────`,
          ...chunks[pi],
        ];
        await sock.sendMessage(chatId, {
          text: box('👻 𝗜𝗡𝗔𝗖𝗧𝗜𝗩𝗘 𝗠𝗘𝗠𝗕𝗘𝗥𝗦', header),
          mentions: inactive.slice(pi * 25, pi * 25 + 25).map(p => p.id),
          ...ci,
        }, { quoted: m });
        if (pi < chunks.length - 1) await new Promise(r => setTimeout(r, 800));
      }

    } catch (err) {
      console.error('[listinactive]', err?.message);
      await sock.sendMessage(chatId, {
        text: box('⚠️ 𝗘𝗥𝗥𝗢𝗥', ['❌ Could not fetch inactive members.', `💡 ${err?.message?.slice(0, 60) || 'Unknown error'}`]),
        ...ci,
      }, { quoted: m });
    }
  },
};

// ─── .listonline ─────────────────────────────────────────────
const listOnline = {
  command: 'listonline',
  aliases: ['onlinemembers', 'whosonline', 'online'],
  category: 'group',
  description: '🟢 List members currently online in the group',
  usage: '.listonline',
  groupOnly: true,

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();

    try {
      const meta = await sock.groupMetadata(chatId);
      const participants = meta.participants || [];
      const botJid = sock.user?.id?.replace(/:.*@/, '@') || '';

      await sock.sendMessage(chatId, {
        text: box('🔍 𝗖𝗛𝗘𝗖𝗞𝗜𝗡𝗚...', [
          `👥 Checking ${participants.length} members...`,
          '⏳ This may take a few seconds.',
        ]),
        ...ci,
      }, { quoted: m });

      // Subscribe to presence for all members, collect results
      const presenceMap = {};
      const timeout = 6000; // 6s window

      // Set up presence listener BEFORE subscribing
      const presenceHandler = ({ id, presences }) => {
        if (!id) return;
        for (const [jid, data] of Object.entries(presences || {})) {
          presenceMap[jid] = data?.lastKnownPresence || 'unavailable';
        }
      };

      sock.ev.on('presence.update', presenceHandler);

      // Subscribe to all members in parallel (batch of 10 to avoid flooding)
      const members = participants.filter(p => p.id !== botJid);
      const batchSize = 10;
      for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(p =>
          sock.presenceSubscribe(p.id).catch(() => {})
        ));
        if (i + batchSize < members.length) await new Promise(r => setTimeout(r, 300));
      }

      // Wait for presence updates to arrive
      await new Promise(r => setTimeout(r, timeout));
      sock.ev.off('presence.update', presenceHandler);

      // Classify
      const online  = members.filter(p => ['available', 'composing', 'recording'].includes(presenceMap[p.id]));
      const typing  = members.filter(p => ['composing', 'recording'].includes(presenceMap[p.id]));

      if (!online.length) {
        return sock.sendMessage(chatId, {
          text: box('🟢 𝗢𝗡𝗟𝗜𝗡𝗘 𝗠𝗘𝗠𝗕𝗘𝗥𝗦', [
            '😴 No members detected online right now.',
            '💡 Note: Members with privacy settings',
            '   enabled may not show as online.',
          ]),
          ...ci,
        }, { quoted: m });
      }

      const lines = online.map((p, i) => {
        const num = p.id.split('@')[0];
        const role = p.admin === 'superadmin' ? ' 👑' : p.admin ? ' 🛡️' : '';
        const status = typing.some(t => t.id === p.id) ? ' ✍️' : ' 🟢';
        return `${i + 1}. @${num}${role}${status}`;
      });

      const header = [
        `👥 Group: ${meta.subject}`,
        `🟢 ${online.length} member${online.length !== 1 ? 's' : ''} online`,
        typing.length ? `✍️ ${typing.length} currently typing/recording` : null,
        `─────────────────────`,
        ...lines,
        `─────────────────────`,
        '🟢 Online  ✍️ Typing/Recording',
        '💡 Privacy mode users not shown',
      ].filter(Boolean);

      await sock.sendMessage(chatId, {
        text: box('🟢 𝗢𝗡𝗟𝗜𝗡𝗘 𝗠𝗘𝗠𝗕𝗘𝗥𝗦', header),
        mentions: online.map(p => p.id),
        ...ci,
      }, { quoted: m });

    } catch (err) {
      console.error('[listonline]', err?.message);
      await sock.sendMessage(chatId, {
        text: box('⚠️ 𝗘𝗥𝗥𝗢𝗥', ['❌ Could not check online status.', `💡 ${err?.message?.slice(0, 60) || 'Unknown error'}`]),
        ...ci,
      }, { quoted: m });
    }
  },
};

module.exports = [listActive, listInactive, listOnline];
