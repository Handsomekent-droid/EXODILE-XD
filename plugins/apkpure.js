'use strict';
/**
 * EXODILE XD — APK Downloader
 * Primary: Keith API /search/apk + gifted fallback
 */
const axios = require('axios');
const { keith } = require('../lib/keithApi');
const { getChannelInfo } = require('../lib/messageConfig');

const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

function box(title, lines) {
  return `┌─━─━〔 ${title} 〕━─━─┐\n` +
    lines.filter(Boolean).map(l => `│ ${l}`).join('\n') + '\n' +
    `└─━─━─━─━─━─━─━─━─┘` + FOOTER;
}

async function searchAPK(query) {
  const enc = encodeURIComponent(query);

  // 1. Keith API — /search/apk (confirmed active from screenshots)
  try {
    const r = await keith('/search/apk', { q: query }, 15000);
    if (Array.isArray(r) && r.length) return r;
    if (r?.apps) return r.apps;
    if (r?.results) return r.results;
    // Single result
    if (r?.packageName || r?.downloadLink || r?.redirectLink) return [r];
  } catch {}

  // 2. Keith API — /download/apk4all (result has redirectLink + downloadLink)
  // Response: { version, developer, fileSize, redirectLink, downloadLink, playStoreLink }
  try {
    const r = await keith('/download/apk4all', { q: query }, 20000);
    if (r) return Array.isArray(r) ? r : [r];
  } catch {}

  // 3. Keith API — /download/apkpure
  try {
    const r = await keith('/download/apkpure', { q: query }, 20000);
    if (r) return Array.isArray(r) ? r : [r];
  } catch {}

  // 2. gifted fallback
  try {
    const r = await axios.get(`https://api.giftedtech.my.id/api/search/apkpure?apikey=gifted&q=${enc}`, { timeout: 15000, headers: { 'User-Agent': UA } });
    const d = r.data?.result || r.data?.data || [];
    if (Array.isArray(d) && d.length) return d;
  } catch {}

  // 3. siputzx fallback
  try {
    const r = await axios.get(`https://api.siputzx.my.id/api/s/apk?q=${enc}`, { timeout: 15000, headers: { 'User-Agent': UA } });
    const d = r.data?.data || r.data?.result || [];
    if (Array.isArray(d) && d.length) return d;
  } catch {}

  return [];
}

module.exports = [
  {
    command: 'apk',
    aliases: ['apkdl', 'apkpure', 'downloadapk', 'getapk'],
    category: 'tools',
    description: '📦 Search & get APK download link',
    usage: '.apk <app name>',

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const ci     = getChannelInfo();
      const query  = args.join(' ').trim();

      if (!query) return sock.sendMessage(chatId, {
        text: box('📦 𝗔𝗣𝗞 𝗦𝗘𝗔𝗥𝗖𝗛', ['Usage: .apk <app name>', 'Example: .apk WhatsApp', 'Example: .apk Spotify']),
        ...ci
      }, { quoted: m });

      await sock.sendMessage(chatId, { text: `🔎 Searching APK: *${query}*...`, ...ci }, { quoted: m });

      try {
        const results = await searchAPK(query);

        if (!results || !results.length) {
          return sock.sendMessage(chatId, {
            text: box('📦 𝗔𝗣𝗞', ['❌ No APK found for: ' + query.slice(0, 40), '💡 Try the exact app name']),
            ...ci
          }, { quoted: m });
        }

        const top = results.slice(0, 5);
        let caption = box('📦 𝗔𝗣𝗞 𝗥𝗘𝗦𝗨𝗟𝗧𝗦', [
          `🔍 Query: ${query}`,
          `📊 Found: ${results.length} results`,
          `─────────────────────`,
          ...top.map((v, i) => {
            // Handle both Keith APK shape and generic shape
            const name = v.name || v.title || v.appName || v.packageName || `App ${i+1}`;
            const dev  = v.developer || v.dev || '';
            const ver  = v.version || v.versionName || '';
            const size = v.fileSize || v.size || '';
            const cat  = v.categories || v.category || '';
            const pkg  = v.packageName || '';
            // Keith shape: redirectLink = human page, downloadLink = direct APK
            const dlLink  = v.downloadLink  || v.downloadUrl || v.url || v.link || '';
            const redLink = v.redirectLink  || v.playStoreLink || '';
            return [
              `*${i+1}. ${name}*`,
              pkg    ? `   📦 ${pkg}` : null,
              dev    ? `   👨‍💻 ${dev}` : null,
              ver    ? `   🏷️ v${ver}` : null,
              size   ? `   📏 ${size}` : null,
              cat    ? `   🗂️ ${cat}` : null,
              dlLink ? `   ⬇️ ${dlLink.slice(0, 80)}` : null,
              redLink && redLink !== dlLink ? `   🔗 ${redLink.slice(0, 80)}` : null,
            ].filter(Boolean).join('\n');
          }),
        ]);

        // Send list and wait for reply selection
        const sentMsg = await sock.sendMessage(chatId, {
          text: caption + '\n\n↩️ *Reply with a number (1-' + top.length + ') to get download link*',
          ...ci
        }, { quoted: m });

        // Auto-expire after 3 minutes
        const timeout = setTimeout(async () => {
          sock.ev.off('messages.upsert', listener);
          try { await sock.sendMessage(chatId, { text: '⌛ Selection expired. Search again.' }, { quoted: sentMsg }); } catch {}
        }, 3 * 60 * 1000);

        const listener = async ({ messages }) => {
          const msg = messages[0];
          if (!msg?.message || msg.key.remoteJid !== chatId) return;
          const replyCtx = msg.message?.extendedTextMessage?.contextInfo;
          if (!replyCtx?.stanzaId || replyCtx.stanzaId !== sentMsg.key.id) return;

          const replyText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
          const choice = parseInt(replyText.trim());
          if (isNaN(choice) || choice < 1 || choice > top.length) {
            return sock.sendMessage(chatId, { text: `❌ Pick a number between 1 and ${top.length}` }, { quoted: msg });
          }

          clearTimeout(timeout);
          sock.ev.off('messages.upsert', listener);

          const app = top[choice - 1];
          const name = app.name || app.title || `App`;
          const dlLink = app.url || app.link || app.downloadUrl || app.direct || '';

          await sock.sendMessage(chatId, {
            text: box('📦 𝗔𝗣𝗞 𝗜𝗡𝗙𝗢', [
              `📛 *${name}*`,
              app.developer ? `👨‍💻 Dev: ${app.developer}` : null,
              app.version   ? `📦 Version: ${app.version}` : null,
              app.size      ? `📏 Size: ${app.size}` : null,
              app.rating    ? `⭐ Rating: ${app.rating}` : null,
              `─────────────────────`,
              dlLink ? `🔗 *Download:*\n${dlLink}` : '⚠️ No direct link — open on APKPure.com',
            ]),
            ...ci
          }, { quoted: msg });
        };

        sock.ev.on('messages.upsert', listener);

      } catch (e) {
        console.error('[apk]', e?.message);
        await sock.sendMessage(chatId, {
          text: box('⚠️ 𝗘𝗥𝗥𝗢𝗥', ['❌ APK search failed', `${e?.message?.slice(0, 60) || 'Unknown error'}`]),
          ...ci
        }, { quoted: m });
      }
    }
  },

  {
    command: 'apkmirror',
    aliases: ['apkmi', 'mirrorapk'],
    category: 'tools',
    description: '📦 Search APKs from APKMirror',
    usage: '.apkmirror <app name>',

    async handler(sock, m, args, ctx = {}) {
      const chatId = ctx.chatId || m.key.remoteJid;
      const ci     = getChannelInfo();
      const query  = args.join(' ').trim();

      if (!query) return sock.sendMessage(chatId, {
        text: box('📦 𝗔𝗣𝗞𝗠𝗜𝗥𝗥𝗢𝗥', ['Usage: .apkmirror <app name>', 'Example: .apkmirror Telegram']),
        ...ci
      }, { quoted: m });

      await sock.sendMessage(chatId, { text: `🔎 Searching APKMirror: *${query}*...`, ...ci }, { quoted: m });

      try {
        const enc = encodeURIComponent(query);
        let results = [];

        // Try gifted APKMirror first
        try {
          const r = await axios.get(`https://api.giftedtech.my.id/api/search/apkmirror?apikey=gifted&q=${enc}`, { timeout: 15000, headers: { 'User-Agent': UA } });
          results = r.data?.result || r.data?.data || [];
        } catch {}

        // Keith fallback
        if (!results.length) {
          const r = await keith('/search/apk', { q: query }, 15000);
          if (Array.isArray(r) && r.length) results = r;
        }

        if (!results.length) return sock.sendMessage(chatId, {
          text: box('📦 𝗔𝗣𝗞𝗠𝗜𝗥𝗥𝗢𝗥', ['❌ No results found', '💡 Try the exact app name']),
          ...ci
        }, { quoted: m });

        const top = results.slice(0, 5);
        let caption = `📦 *APKMirror — ${query}*\n\n`;
        top.forEach((v, i) => {
          caption += `*${i+1}.* ${v.title || v.name}\n`;
          if (v.developer) caption += `   👨‍💻 ${v.developer}\n`;
          if (v.size)      caption += `   📏 ${v.size}\n`;
          if (v.updated)   caption += `   🕒 ${v.updated}\n`;
          if (v.url)       caption += `   🔗 ${v.url.slice(0, 60)}\n`;
          caption += '\n';
        });
        caption += `\n↩️ Reply with number (1-${top.length}) for download link` + FOOTER;

        const sentMsg = await sock.sendMessage(chatId, { text: caption, ...ci }, { quoted: m });

        const timeout = setTimeout(async () => {
          sock.ev.off('messages.upsert', listener);
          try { await sock.sendMessage(chatId, { text: '⌛ Expired. Search again.' }, { quoted: sentMsg }); } catch {}
        }, 3 * 60 * 1000);

        const listener = async ({ messages }) => {
          const msg = messages[0];
          if (!msg?.message || msg.key.remoteJid !== chatId) return;
          const rctx = msg.message?.extendedTextMessage?.contextInfo;
          if (!rctx?.stanzaId || rctx.stanzaId !== sentMsg.key.id) return;

          const replyText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
          const choice = parseInt(replyText.trim());
          if (isNaN(choice) || choice < 1 || choice > top.length) {
            return sock.sendMessage(chatId, { text: `❌ Pick 1-${top.length}` }, { quoted: msg });
          }

          clearTimeout(timeout);
          sock.ev.off('messages.upsert', listener);

          const app = top[choice - 1];
          const link = app.url || app.link || app.downloadUrl || '';

          await sock.sendMessage(chatId, {
            text: box('📦 𝗔𝗣𝗞 𝗜𝗡𝗙𝗢', [
              `📛 *${app.title || app.name}*`,
              app.developer ? `👨‍💻 ${app.developer}` : null,
              app.size      ? `📏 ${app.size}` : null,
              link ? `🔗 *Link:* ${link}` : '⚠️ Visit APKMirror.com',
            ]),
            ...ci
          }, { quoted: msg });
        };

        sock.ev.on('messages.upsert', listener);

      } catch (e) {
        console.error('[apkmirror]', e?.message);
        await sock.sendMessage(chatId, { text: '❌ APKMirror search failed. Try again!' }, { quoted: m });
      }
    }
  }
];
