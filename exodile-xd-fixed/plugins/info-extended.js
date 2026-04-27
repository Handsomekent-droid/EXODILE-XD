'use strict';
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
function box(title, lines) {
  let t = `┏━━「 ${title} 」━━┓\n┃\n`;
  for (const l of lines) t += `┃  ${l}\n`;
  return t + `┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER;
}
async function get(url, parse) {
  try { const r = await axios.get(url, { timeout: 12000, headers: { 'User-Agent': UA } }); return parse(r.data); } catch { return null; }
}

module.exports = [
  {command:'crypto',aliases:['cryptoprice','coin','btc','eth'],category:'info',description:'Live cryptocurrency price',usage:'.crypto <symbol>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const sym=(args[0]||'bitcoin').toLowerCase();
    const d=await get(`https://api.coingecko.com/api/v3/simple/price?ids=${sym}&vs_currencies=usd,kes&include_24hr_change=true`,r=>r?.[sym]);
    if(d)await sock.sendMessage(chatId,{text:box(`💰 *${sym.toUpperCase()} PRICE*`,[`💵 USD: $${d.usd?.toLocaleString()}`,`🇰🇪 KES: KES ${d.kes?.toLocaleString()}`,`📈 24h: ${d.usd_24h_change?.toFixed(2)}%`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('💰 *CRYPTO*',['❌ Symbol not found. Try: bitcoin, ethereum, dogecoin']),...ci},{quoted:m});}},
  {command:'stock',aliases:['stockprice','shares','market'],category:'info',description:'Stock price lookup',usage:'.stock <symbol>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const sym=(args[0]||'AAPL').toUpperCase();
    const d=await get(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`,r=>r?.chart?.result?.[0]);
    if(d){const p=d.meta?.regularMarketPrice;const ch=d.meta?.regularMarketChangePercent?.toFixed(2);await sock.sendMessage(chatId,{text:box(`📈 *${sym} STOCK*`,[`💵 Price: $${p?.toLocaleString()}`,`📊 Change: ${ch}%`,`📅 Market: ${d.meta?.exchangeName||'NYSE'}`]),...ci},{quoted:m});}
    else await sock.sendMessage(chatId,{text:box('📈 *STOCK*',['❌ Symbol not found. Try: AAPL, TSLA, GOOG']),...ci},{quoted:m});}},
  {command:'covid',aliases:['covidstats','corona'],category:'info',description:'COVID-19 global stats',usage:'.covid [country]',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const country=args.join(' ')||'world';
    const d=await get(`https://disease.sh/v3/covid-19/${country==='world'?'all':'countries/'+encodeURIComponent(country)}`,r=>r);
    if(d)await sock.sendMessage(chatId,{text:box('🦠 *COVID-19 STATS*',[`🌍 ${d.country||'World'}`,`😷 Cases: ${(d.cases||0).toLocaleString()}`,`💀 Deaths: ${(d.deaths||0).toLocaleString()}`,`✅ Recovered: ${(d.recovered||0).toLocaleString()}`,`📅 Updated: ${new Date(d.updated||Date.now()).toLocaleDateString()}`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('🦠 *COVID*',['❌ Country not found']),...ci},{quoted:m});}},
  {command:'news',aliases:['headlines','latestnews'],category:'info',description:'Latest news headlines',usage:'.news [topic]',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const topic=args.join(' ')||'technology';
    const d=await get(`https://api.giftedtech.my.id/api/news/headlines?apikey=gifted&q=${encodeURIComponent(topic)}`,r=>r?.result||r?.articles);
    const items=Array.isArray(d)?d.slice(0,5):null;
    if(items?.length)await sock.sendMessage(chatId,{text:box(`📰 *${topic.toUpperCase()} NEWS*`,items.map((a,i)=>`${i+1}. ${(a.title||a.headline||'').slice(0,60)}`)),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('📰 *NEWS*',['❌ No headlines found — try: technology, sports, crypto']),...ci},{quoted:m});}},
  {command:'country',aliases:['countryinfo','nation'],category:'info',description:'Country information',usage:'.country <name>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const name=args.join(' ');if(!name)return sock.sendMessage(chatId,{text:box('🌍 *COUNTRY INFO*',['💀 Usage: .country Kenya']),...ci},{quoted:m});
    const d=await get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,capital,region,population,languages,currencies,flags`,r=>r?.[0]);
    if(d){const lang=Object.values(d.languages||{}).join(', ');const cur=Object.values(d.currencies||{}).map(c=>c.name).join(', ');await sock.sendMessage(chatId,{text:box('🌍 *COUNTRY INFO*',[`${d.flags?.emoji||'🌐'} *${d.name?.common}*`,`🏛️ Capital: ${d.capital?.[0]||'N/A'}`,`🌐 Region: ${d.region}`,`👥 Population: ${(d.population||0).toLocaleString()}`,`🗣️ Language: ${lang}`,`💰 Currency: ${cur}`]),...ci},{quoted:m});}
    else await sock.sendMessage(chatId,{text:box('🌍 *COUNTRY*',['❌ Country not found']),...ci},{quoted:m});}},
  {command:'anime',aliases:['animeinfo','anisearch'],category:'info',description:'Anime information lookup',usage:'.anime <title>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const q=args.join(' ');if(!q)return sock.sendMessage(chatId,{text:box('🎌 *ANIME*',['💀 Usage: .anime Naruto']),...ci},{quoted:m});
    const d=await get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`,r=>r?.data?.[0]);
    if(d)await sock.sendMessage(chatId,{text:box('🎌 *ANIME INFO*',[`📺 *${d.title}*`,`⭐ Score: ${d.score||'N/A'}`,`📊 Status: ${d.status||'N/A'}`,`📅 Episodes: ${d.episodes||'N/A'}`,`📖 ${(d.synopsis||'').slice(0,120)}...`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('🎌 *ANIME*',['❌ Anime not found']),...ci},{quoted:m});}},
  {command:'manga',aliases:['mangainfo','mangasearch'],category:'info',description:'Manga information lookup',usage:'.manga <title>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const q=args.join(' ');if(!q)return sock.sendMessage(chatId,{text:box('📚 *MANGA*',['💀 Usage: .manga One Piece']),...ci},{quoted:m});
    const d=await get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=1`,r=>r?.data?.[0]);
    if(d)await sock.sendMessage(chatId,{text:box('📚 *MANGA INFO*',[`📖 *${d.title}*`,`⭐ Score: ${d.score||'N/A'}`,`📊 Status: ${d.status||'N/A'}`,`📚 Volumes: ${d.volumes||'N/A'}`,`📖 ${(d.synopsis||'').slice(0,120)}...`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('📚 *MANGA*',['❌ Manga not found']),...ci},{quoted:m});}},
  {command:'recipe',aliases:['food','cookrecipe','meal'],category:'info',description:'Get a recipe',usage:'.recipe <food name>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const q=args.join(' ');if(!q)return sock.sendMessage(chatId,{text:box('🍽️ *RECIPE*',['💀 Usage: .recipe chicken']),...ci},{quoted:m});
    const d=await get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,r=>r?.meals?.[0]);
    if(d){const ingredients=[];for(let i=1;i<=5;i++){if(d[`strIngredient${i}`])ingredients.push(`• ${d[`strIngredient${i}`]} - ${d[`strMeasure${i}`]||''}`);} await sock.sendMessage(chatId,{text:box('🍽️ *RECIPE*',[`🍳 *${d.strMeal}*`,`🌍 Cuisine: ${d.strArea}`,`📋 Category: ${d.strCategory}`,``,`🥘 *Ingredients (first 5):*`,...ingredients]),...ci},{quoted:m});}
    else await sock.sendMessage(chatId,{text:box('🍽️ *RECIPE*',['❌ Recipe not found']),...ci},{quoted:m});}},
  {command:'movie',aliases:['movieinfo','film','filminfo'],category:'info',description:'Movie information',usage:'.movie <title>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const q=args.join(' ');if(!q)return sock.sendMessage(chatId,{text:box('🎬 *MOVIE*',['💀 Usage: .movie Avengers']),...ci},{quoted:m});
    const d=await get(`https://www.omdbapi.com/?apikey=thewdb&t=${encodeURIComponent(q)}`,r=>r?.Response==='True'?r:null);
    if(d)await sock.sendMessage(chatId,{text:box('🎬 *MOVIE INFO*',[`🎬 *${d.Title}* (${d.Year})`,`⭐ IMDb: ${d.imdbRating}/10`,`🎭 Genre: ${d.Genre}`,`⏱️ Runtime: ${d.Runtime}`,`🎬 Director: ${d.Director}`,`📖 ${(d.Plot||'').slice(0,120)}...`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('🎬 *MOVIE*',['❌ Movie not found']),...ci},{quoted:m});}},
  {command:'book',aliases:['bookinfo','booksearch'],category:'info',description:'Book information',usage:'.book <title>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const q=args.join(' ');if(!q)return sock.sendMessage(chatId,{text:box('📚 *BOOK*',['💀 Usage: .book Harry Potter']),...ci},{quoted:m});
    const d=await get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=title,author_name,first_publish_year,number_of_pages_median&limit=1`,r=>r?.docs?.[0]);
    if(d)await sock.sendMessage(chatId,{text:box('📚 *BOOK INFO*',[`📖 *${d.title}*`,`✍️ Author: ${(d.author_name||[]).join(', ')||'N/A'}`,`📅 Published: ${d.first_publish_year||'N/A'}`,`📄 Pages: ${d.number_of_pages_median||'N/A'}`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('📚 *BOOK*',['❌ Book not found']),...ci},{quoted:m});}},
  {command:'game',aliases:['gameinfo','gamesearch'],category:'info',description:'Video game info',usage:'.game <title>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const q=args.join(' ');if(!q)return sock.sendMessage(chatId,{text:box('🎮 *GAME INFO*',['💀 Usage: .game GTA V']),...ci},{quoted:m});
    const d=await get(`https://api.rawg.io/api/games?key=f7dc5d7c6b4c4a8a9f5c8e2f4e9d6b0c&search=${encodeURIComponent(q)}&page_size=1`,r=>r?.results?.[0]);
    if(d)await sock.sendMessage(chatId,{text:box('🎮 *GAME INFO*',[`🎮 *${d.name}*`,`⭐ Rating: ${d.rating}/5`,`📅 Released: ${d.released||'N/A'}`,`🖥️ Platforms: ${(d.platforms||[]).slice(0,3).map(p=>p.platform.name).join(', ')}`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('🎮 *GAME*',['❌ Game not found']),...ci},{quoted:m});}},
  {command:'definition',aliases:['define2','dict','dictionary'],category:'info',description:'Dictionary definition',usage:'.define2 <word>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const word=args[0];if(!word)return sock.sendMessage(chatId,{text:box('📖 *DICTIONARY*',['💀 Usage: .define2 resilient']),...ci},{quoted:m});
    const d=await get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,r=>r?.[0]);
    if(d){const meaning=d.meanings?.[0];const def=meaning?.definitions?.[0];await sock.sendMessage(chatId,{text:box('📖 *DICTIONARY*',[`📝 *${d.word}*`,`🔊 Phonetic: ${d.phonetic||'N/A'}`,`📋 Type: ${meaning?.partOfSpeech||'N/A'}`,`📖 Definition: ${def?.definition?.slice(0,150)||'N/A'}`,def?.example?`💬 Example: ${def.example}`:null].filter(Boolean)),...ci},{quoted:m});}
    else await sock.sendMessage(chatId,{text:box('📖 *DICTIONARY*',[`❌ "${word}" not found`]),...ci},{quoted:m});}},
  {command:'holidays',aliases:['publicholiday','holiday'],category:'info',description:'Public holidays for a country',usage:'.holidays <country_code> [year]',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const code=(args[0]||'KE').toUpperCase();const year=args[1]||new Date().getFullYear();
    const d=await get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`,r=>Array.isArray(r)?r:null);
    if(d?.length)await sock.sendMessage(chatId,{text:box(`📅 *${code} HOLIDAYS ${year}*`,d.slice(0,10).map(h=>`${h.date} — ${h.name}`)),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('📅 *HOLIDAYS*',['❌ Not found. Use ISO code: KE, NG, US, GB']),...ci},{quoted:m});}},
  {command:'football',aliases:['soccer','epl','premierleague'],category:'info',description:'Football match info',usage:'.football',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const d=await get(`https://api.giftedtech.my.id/api/sports/football?apikey=gifted`,r=>r?.result||r?.matches);
    if(Array.isArray(d)&&d.length)await sock.sendMessage(chatId,{text:box('⚽ *FOOTBALL SCORES*',d.slice(0,8).map(match=>`${match.home||''} ${match.score||'vs'} ${match.away||''}`)),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('⚽ *FOOTBALL*',['📅 No live matches right now','Check back during match time!']),...ci},{quoted:m});}},
  {command:'github',aliases:['ghrepo','gitrepo','ghprofile'],category:'stalk',description:'GitHub profile/repo lookup',usage:'.github <username>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const user=args[0];if(!user)return sock.sendMessage(chatId,{text:box('🐱 *GITHUB*',['💀 Usage: .github <username>']),...ci},{quoted:m});
    const d=await get(`https://api.github.com/users/${user}`,r=>r?.login?r:null);
    if(d)await sock.sendMessage(chatId,{text:box('🐱 *GITHUB PROFILE*',[`👤 *${d.name||d.login}*`,`📛 Username: @${d.login}`,`📝 Bio: ${d.bio||'N/A'}`,`📦 Repos: ${d.public_repos}`,`👥 Followers: ${d.followers}`,`👤 Following: ${d.following}`,`🌐 ${d.html_url}`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('🐱 *GITHUB*',['❌ User not found']),...ci},{quoted:m});}},
  {command:'npmpackage',aliases:['npm','npmsearch'],category:'info',description:'NPM package info',usage:'.npm <package>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const pkg=args[0];if(!pkg)return sock.sendMessage(chatId,{text:box('📦 *NPM*',['💀 Usage: .npm express']),...ci},{quoted:m});
    const d=await get(`https://registry.npmjs.org/${pkg}/latest`,r=>r?.name?r:null);
    if(d)await sock.sendMessage(chatId,{text:box('📦 *NPM PACKAGE*',[`📦 *${d.name}* v${d.version}`,`📝 ${(d.description||'').slice(0,100)}`,`👤 Author: ${d.author?.name||'N/A'}`,`📄 License: ${d.license||'N/A'}`,`🔗 npm.im/${d.name}`]),...ci},{quoted:m});
    else await sock.sendMessage(chatId,{text:box('📦 *NPM*',['❌ Package not found']),...ci},{quoted:m});}},
];
