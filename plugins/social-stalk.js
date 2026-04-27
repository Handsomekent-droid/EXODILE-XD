'use strict';
const { keithIGStalk, keithTTStalk, keithTWStalk, keithGHStalk } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
function box(t, l) { return `◈ *${t}*\n` + l.filter(Boolean).map(i => `│ ${i}`).join('\n') + FOOTER; }
async function gifted(path, parse) {
  try { const r = await axios.get(`https://api.giftedtech.my.id/api${path}`, { timeout: 12000, headers: { 'User-Agent': UA } }); return parse(r.data); } catch { return null; }
}

module.exports = [
  {
    command: 'igstalk', aliases: ['instagramstalk', 'iginfo'], category: 'stalk',
    description: 'Stalk Instagram profile', usage: '.igstalk <username>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const u = args[0]; if (!u) return sock.sendMessage(chatId, { text: '📸 Usage: .igstalk <username>' }, { quoted: m });
      let d = await keithIGStalk(u);
      // Keith IG response: { profile: {username, fullName, avatars:{standard,hd}}, stats:{followers,following,mediaCount}, status:{isPrivate,isVerified} }
      if (d?.profile) {
        const p = d.profile; const s = d.stats || {}; const st = d.status || {};
        return sock.sendMessage(chatId, { text: box('📸 INSTAGRAM STALK', [
          `👤 ${p.fullName || u} (@${p.username || u})`,
          `👥 Followers: ${(s.followers||0).toLocaleString()}`,
          `👣 Following: ${(s.following||0).toLocaleString()}`,
          `📸 Posts: ${s.mediaCount || 'N/A'}`,
          `🔒 Private: ${st.isPrivate ? 'Yes' : 'No'}`,
          `✅ Verified: ${st.isVerified ? 'Yes' : 'No'}`,
          `🔗 https://instagram.com/${p.username || u}`,
        ]), ...ci }, { quoted: m });
      }
      // fallback gifted
      d = await gifted(`/stalk/ig?apikey=gifted&username=${u}`, r => r?.result || r?.data);
      if (d) return sock.sendMessage(chatId, { text: box('📸 INSTAGRAM STALK', [
        `👤 ${d.username||u}`, `📝 ${(d.bio||'').slice(0,80)}`,
        `👥 ${(d.followers||0).toLocaleString()} followers`, `👤 ${d.following||0} following`,
        `📸 Posts: ${d.posts||'N/A'}`, `✅ Verified: ${d.verified?'Yes':'No'}`,
      ]), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('📸 IG STALK', ['❌ Profile not found or private']), ...ci }, { quoted: m });
    }
  },
  {
    command: 'ttstalk', aliases: ['tiktokstalk', 'ttprofile'], category: 'stalk',
    description: 'Stalk TikTok profile', usage: '.ttstalk <username>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const u = args[0]; if (!u) return sock.sendMessage(chatId, { text: '🎵 Usage: .ttstalk <username>' }, { quoted: m });
      let d = await keithTTStalk(u);
      if (d) {
        const p = d?.profile || d; const s = d?.stats || d;
        return sock.sendMessage(chatId, { text: box('🎵 TIKTOK STALK', [
          `👤 ${p.nickname||p.username||u}`, `💬 ${(p.bio||p.signature||'').slice(0,80)}`,
          `❤️ Likes: ${(s.likes||s.heartCount||0).toLocaleString()}`,
          `👥 Followers: ${(s.followers||s.followerCount||0).toLocaleString()}`,
          `🎬 Videos: ${s.videos||s.videoCount||'N/A'}`,
        ]), ...ci }, { quoted: m });
      }
      d = await gifted(`/stalk/tiktok?apikey=gifted&username=${u}`, r => r?.result||r?.data);
      if (d) return sock.sendMessage(chatId, { text: box('🎵 TIKTOK STALK', [
        `👤 ${d.username||d.nickname||u}`, `💬 ${(d.bio||d.signature||'').slice(0,80)}`,
        `❤️ Likes: ${(d.likes||0).toLocaleString()}`, `👥 Followers: ${(d.followers||0).toLocaleString()}`,
      ]), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('🎵 TT STALK', ['❌ Profile not found']), ...ci }, { quoted: m });
    }
  },
  {
    command: 'twitterstalk', aliases: ['xstalk2', 'twstalk'], category: 'stalk',
    description: 'Stalk Twitter/X profile', usage: '.twitterstalk <username>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const u = args[0]; if (!u) return sock.sendMessage(chatId, { text: '🐦 Usage: .twitterstalk <username>' }, { quoted: m });
      let d = await keithTWStalk(u);
      if (d) {
        const p = d?.profile || d; const s = d?.stats || d;
        return sock.sendMessage(chatId, { text: box('🐦 TWITTER STALK', [
          `👤 ${p.fullName||p.name||u} (@${p.username||u})`,
          `📝 ${(p.bio||p.description||'').slice(0,80)}`,
          `👥 Followers: ${(s.followers||0).toLocaleString()}`,
          `👣 Following: ${(s.following||0).toLocaleString()}`,
          `✅ Verified: ${p.isVerified||p.verified ? 'Yes':'No'}`,
        ]), ...ci }, { quoted: m });
      }
      d = await gifted(`/stalk/twitter?apikey=gifted&username=${u}`, r => r?.result||r?.data);
      if (d) return sock.sendMessage(chatId, { text: box('🐦 TWITTER STALK', [
        `👤 ${d.name||u} (@${d.username||u})`, `📝 ${(d.bio||d.description||'').slice(0,80)}`,
        `👥 ${(d.followers||0).toLocaleString()} followers`,
      ]), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('🐦 TWITTER STALK', ['❌ Profile not found']), ...ci }, { quoted: m });
    }
  },
  {
    command: 'githubstalk', aliases: ['ghstalk', 'githubinfo'], category: 'stalk',
    description: 'Stalk GitHub profile', usage: '.githubstalk <username>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const u = args[0]; if (!u) return sock.sendMessage(chatId, { text: '🐙 Usage: .githubstalk <username>' }, { quoted: m });
      let d = await keithGHStalk(u);
      if (!d) {
        try { const r = await axios.get(`https://api.github.com/users/${u}`, { timeout: 10000 }); d = r.data; } catch {}
      }
      if (d) return sock.sendMessage(chatId, { text: box('🐙 GITHUB STALK', [
        `👤 ${d.name||d.login||u}`, `📝 ${(d.bio||'').slice(0,80)}`,
        `⭐ Repos: ${d.public_repos||d.repos||'N/A'}`,
        `👥 Followers: ${(d.followers||0).toLocaleString()}`,
        `👣 Following: ${d.following||0}`,
        `🔗 https://github.com/${d.login||u}`,
      ]), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('🐙 GITHUB STALK', ['❌ User not found']), ...ci }, { quoted: m });
    }
  },
  {
    command: 'youtubestalk', aliases: ['ytstalk', 'ytchannel'], category: 'stalk',
    description: 'Stalk YouTube channel', usage: '.youtubestalk <channel>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const u = args[0]; if (!u) return sock.sendMessage(chatId, { text: '📺 Usage: .youtubestalk <channel>' }, { quoted: m });
      const d = await gifted(`/stalk/youtube?apikey=gifted&username=${u}`, r => r?.result||r?.data);
      if (d) return sock.sendMessage(chatId, { text: box('📺 YOUTUBE STALK', [
        `📺 ${d.name||d.title||u}`, `👥 Subscribers: ${(d.subscribers||0).toLocaleString()}`,
        `🎬 Videos: ${d.videoCount||'N/A'}`, `👁️ Views: ${(d.views||0).toLocaleString()}`,
      ]), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('📺 YT STALK', ['❌ Channel not found']), ...ci }, { quoted: m });
    }
  },
];
