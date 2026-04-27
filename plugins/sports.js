'use strict';
const { keithFootballNews, keithLivescore } = require('../lib/keithApi');
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
function box(title, lines) {
  return `┏━━「 ${title} 」━━┓\n┃\n` + lines.filter(Boolean).map(l => `┃  ${l}`).join('\n') + `\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER;
}

module.exports = [
  {
    command: 'footballnews', aliases: ['fnews', 'soccernews', 'sportnews'], category: 'sports',
    description: '⚽ Latest football news', usage: '.footballnews',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, { text: '⏳ Fetching football news...', ...ci }, { quoted: m });
      try {
        const d = await keithFootballNews();
        // Keith response: { result: { data: { items: [...] } } }
        const items = d?.data?.items || d?.items || (Array.isArray(d) ? d : []);
        if (!items.length) throw new Error('no news');
        const lines = items.slice(0, 6).map((n, i) => `${i+1}. *${n.title || n.headline}*\n   ${(n.summary || '').slice(0, 80)}${n.summary?.length > 80 ? '...' : ''}`);
        await sock.sendMessage(chatId, { text: box('⚽ FOOTBALL NEWS', lines), ...ci }, { quoted: m });
      } catch {
        // ESPN fallback
        try {
          const r = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news', { timeout: 10000 });
          const articles = r.data?.articles?.slice(0, 5) || [];
          if (!articles.length) throw new Error('no news');
          const lines = articles.map((a, i) => `${i+1}. *${a.headline}*\n   ${(a.description || '').slice(0, 80)}`);
          await sock.sendMessage(chatId, { text: box('⚽ FOOTBALL NEWS', lines), ...ci }, { quoted: m });
        } catch {
          await sock.sendMessage(chatId, { text: '❌ Could not fetch football news.' }, { quoted: m });
        }
      }
    }
  },
  {
    command: 'livescores', aliases: ['live', 'scores', 'livefoot', 'livescore'], category: 'sports',
    description: '⚽ Live football scores', usage: '.livescores',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, { text: '⏳ Fetching live scores...', ...ci }, { quoted: m });
      try {
        const d = await keithLivescore();
        // Keith livescore2: { result: { data: { list: [...] } } }
        const list = d?.data?.list || d?.list || (Array.isArray(d) ? d : []);
        if (!list.length) throw new Error('no scores');
        const lines = list.slice(0, 10).map(match => {
          const t1 = match.team1?.name || '?';
          const t2 = match.team2?.name || '?';
          const s1 = match.team1?.score ?? '-';
          const s2 = match.team2?.score ?? '-';
          const status = match.status || '';
          const league = match.league || match.matchRound || '';
          return `⚽ *${t1}* ${s1} - ${s2} *${t2}*\n   ${league} ${status}`;
        });
        await sock.sendMessage(chatId, { text: box('⚽ LIVE SCORES', lines), ...ci }, { quoted: m });
      } catch {
        // ESPN fallback
        try {
          const r = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', { timeout: 10000 });
          const events = r.data?.events?.slice(0, 8) || [];
          if (!events.length) { await sock.sendMessage(chatId, { text: '⚽ No live matches right now.' }, { quoted: m }); return; }
          const lines = events.map(ev => {
            const comp = ev.competitions?.[0];
            const home = comp?.competitors?.find(t => t.homeAway === 'home');
            const away = comp?.competitors?.find(t => t.homeAway === 'away');
            return `⚽ *${home?.team?.shortDisplayName||'?'}* ${home?.score||0} - ${away?.score||0} *${away?.team?.shortDisplayName||'?'}*`;
          });
          await sock.sendMessage(chatId, { text: box('⚽ EPL SCORES', lines), ...ci }, { quoted: m });
        } catch {
          await sock.sendMessage(chatId, { text: '❌ Could not fetch live scores.' }, { quoted: m });
        }
      }
    }
  },
];
