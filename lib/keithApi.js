'use strict';
/**
 * EXODILE XD — Keith API Helper v3 (FIXED)
 * Base: https://apiskeith.top
 * All endpoints verified from apiskeith.top endpoint pages.
 *
 * Response shape: { "status": true, "creator": "Keithkeizzah", "result": <any> }
 *
 * FIX: keith() already unwraps d.result — so every download function's
 *      fallback chain must NOT check r?.result (that would be d.result.result).
 *      r IS the result. Check r?.url, r?.audio, r?.video etc. directly.
 */

const axios = require('axios');

const BASE = 'https://apiskeith.top';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

/**
 * Core GET to Keith API.
 * Returns the `result` field directly, or null on any failure.
 */
async function keith(path, params = {}, timeout = 20000) {
  try {
    const r = await axios.get(BASE + path, { params, headers: HEADERS, timeout });
    const d = r.data;
    if (d && (d.status === true || d.result !== undefined)) {
      return d.result ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

// ── AI ────────────────────────────────────────────────────────
async function keithAI(prompt) {
  const endpoints = ['/ai/chatgpt4', '/ai/gemini', '/ai/llama', '/ai/deepseek', '/ai/blackbox'];
  for (const ep of endpoints) {
    try {
      const r = await keith(ep, { q: prompt }, 25000);
      if (r && typeof r === 'string' && r.length > 2) return r;
      if (r?.answer) return r.answer;
      if (r?.response) return r.response;
    } catch {}
  }
  return null;
}

// ── SEARCH ────────────────────────────────────────────────────
async function keithImages(query)    { return keith('/search/images',  { query }); }
async function keithBing(query)      { return keith('/search/bing',    { q: query }); }
async function keithYTSearch(query)  { return keith('/search/youtube', { q: query }); }
async function keithBible(query)     { return keith('/search/bible',   { q: query }); }
async function keithBrave(query)     { return keith('/search/brave',   { q: query }); }
async function keithApkSearch(query) { return keith('/search/apk',     { q: query }); }
async function keithTGSearch(query)  { return keith('/search/telegram',{ q: query }); }
async function keithWALinks(query)   { return keith('/search/walinks', { q: query }); }

async function keithLyrics(query) {
  for (const ep of ['/search/lyrics2', '/search/lyrics3', '/search/lyrics']) {
    const r = await keith(ep, { q: query }, 15000);
    if (r) return r;
  }
  return null;
}

// ── FUN ───────────────────────────────────────────────────────
async function keithTruth()        { return keith('/fun/truth'); }
async function keithDare()         { return keith('/fun/dare'); }
async function keithWYR()          { return keith('/fun/wyr'); }
async function keithParanoia()     { return keith('/fun/paranoia'); }
async function keithPickupLine()   { return keith('/fun/pickupline'); }
async function keithFact()         { return keith('/fun/fact'); }
async function keithInsult()       { return keith('/fun/insult'); }
async function keithJoke()         { return keith('/fun/jokes'); }
async function keithMeme()         { return keith('/fun/meme'); }
async function keithQuestion()     { return keith('/fun/question'); }
async function keithQuote()        { return keith('/fun/quote'); }
async function keithQuoteAudio()   { return keith('/fun/quoteaudio'); }
async function keithNHIE()         { return keith('/fun/neverhaveiever'); }

// ── STALKER ───────────────────────────────────────────────────
async function keithTTStalk(user)       { return keith('/stalker/tiktok',   { user }); }
async function keithTTStalk2(user)      { return keith('/stalker/tiktok2',  { user }); }
async function keithIGStalk(user)       { return keith('/stalker/ig',       { user }); }
async function keithGHRepoStalk(repo)   { return keith('/stalker/github',   { repo }); }
async function keithGHStalk(user)       { return keith('/stalker/github',   { user }); }
async function keithGHTrends()          { return keith('/stalker/githubtrends'); }
async function keithTWStalk(user)       { return keith('/stalker/twitter',  { user }); }
async function keithYTChannelStalk(user){ return keith('/stalker/youtube',  { user }); }
async function keithIPLookup(ip)        { return keith('/stalker/iplookup', { ip }); }
async function keithIPStalk(ip)         { return keith('/stalker/ip',       { ip }); }
async function keithWAChannelStalk(url) { return keith('/stalker/wachannel2',{ url }); }
async function keithCountryStalk(country){ return keith('/stalker/country', { country }); }
async function keithNPMStalk(pkg)       { return keith('/stalker/npm',      { pkg }); }
async function keithPinterestStalk(user){ return keith('/stalker/pinterest',{ user }); }

// ── SPIRITUAL ────────────────────────────────────────────────
async function keithBibleSearch(q)      { return keith('/spiritual/bible',           { q }); }
async function keithHymnal(q, lang)     { return keith('/spiritual/hymnal',          { q, lang }); }
async function keithAdventistHymnal(q)  { return keith('/spiritual/adventisthymnal', { q }); }
async function keithAIBible(q)          { return keith('/spiritual/aibible',         { q }, 25000); }
async function keithSurahList()         { return keith('/spiritual/surahlist'); }
async function keithQuranSurah(number)  { return keith('/spiritual/quransurah',      { number }); }
async function keithQuranAudio(number)  { return keith('/spiritual/quranaudio',      { number }); }
async function keithAIMuslim(q)         { return keith('/spiritual/aimuslim',        { q }, 25000); }

// ── EDUCATION ────────────────────────────────────────────────
async function keithFruitInfo(fruit)    { return keith('/education/fruit',           { fruit }); }
async function keithPoem()              { return keith('/education/poem'); }
async function keithGrammarCheck(text)  { return keith('/education/grammar',         { text }); }
async function keithDictionary(word)    { return keith('/education/dictionary',      { word }); }
async function keithPhysicsAI(q)        { return keith('/education/physicsai',       { q }, 25000); }
async function keithMathsAI(q)          { return keith('/education/mathsai',         { q }, 25000); }
async function keithChemistryAI(q)      { return keith('/education/chemistryai',     { q }, 25000); }
async function keithKCSE(name)          { return keith('/education/kcse',            { name }); }
async function keithBookSearch(q)       { return keith('/education/booksearch',      { q }); }
async function keithBookScript(id)      { return keith('/education/booksearchid',    { id }); }

// ── MOVIE ─────────────────────────────────────────────────────
async function keithDramaboxTrending()     { return keith('/movie/dramaboxtrending'); }
async function keithDramaboxSearch(q)      { return keith('/movie/dramaboxsearch',   { q }); }
async function keithDramaboxDetails(id)    { return keith('/movie/dramaboxdetails',  { id }); }
async function keithDramaboxDownload(id)   { return keith('/movie/downloaddramabox', { id }); }
async function keithMovieActorSearch(q)    { return keith('/movie/actorsearch',      { q }); }
async function keithMovieSearch(q)         { return keith('/movie/moviesearch',      { q }); }
async function keithMovieTrailer(q)        { return keith('/movie/movietrailer',     { q }); }

// ── SPORTS ───────────────────────────────────────────────────
async function keithFootballNews()         { return keith('/football/news'); }
async function keithLivescore()            { return keith('/livescore2'); }
async function keithLivescoreHL()          { return keith('/livescore2/highlights'); }
async function keithPlayerSearch(q)        { return keith('/football/playersearch',  { q }); }
async function keithTeamSearch(q)          { return keith('/football/teamsearch',    { q }); }
async function keithVenueSearch(q)         { return keith('/football/venuesearch',   { q }); }
async function keithGameHistory(q)         { return keith('/football/gamehistory',   { q }); }
async function keithEPLUpcoming()          { return keith('/football/eplupcoming'); }
async function keithEPLMatches()           { return keith('/football/eplmatches'); }
async function keithEPLStandings()         { return keith('/football/eplstandings'); }
async function keithEPLTopScorers()        { return keith('/football/epltopscorers'); }
async function keithBundesligaUpcoming()   { return keith('/football/bundesligaupcoming'); }
async function keithBundesligaMatches()    { return keith('/football/bundesligamatches'); }
async function keithBundesligaStandings()  { return keith('/football/bundesligastandings'); }
async function keithBundesligaTopScorers() { return keith('/football/bundesligatopscorers'); }

// ── IMAGE ─────────────────────────────────────────────────────
async function keithImageEditor(image, prompt) { return keith('/images/imageeditor',   { image, prompt }); }
async function keithImageEnhance(image)        { return keith('/images/imageenhancer', { image }); }
async function keithWallpaper(text, page = 1)  { return keith('/download/wallpaper',   { text, page }); }
async function keithPhotofunia(effect, text, image) { return keith('/images/photofunia',{ effect, text, image }); }
async function keithMagicStudio(prompt)        { return keith('/images/magicstudio',   { prompt }, 30000); }
async function keithRemoveBg(url)              { return keith('/images/removebg',      { url }, 30000); }
async function keithEphotoLogo(text1, text2, text3) { return keith('/images/ephotologo',{ text1, text2, text3 }); }

// ── ANIME ─────────────────────────────────────────────────────
async function keithAnimeSearch(q)  { return keith('/anime/animu/search', { q }); }
async function keithAnimeInfo(q)    { return keith('/anime/animu',        { q }); }

// ── ADULT (18+) ───────────────────────────────────────────────
async function keithXvidSearch(q)  { return keith('/search/xvideos',  { q }); }
async function keithXnxxSearch(q)  { return keith('/search/xnxx',     { q }); }
async function keithXvidDL(url)    { return keith('/adult/xvideo',    { url }); }
async function keithXnxxDL(url)    { return keith('/adult/xnxx',      { url }); }
async function keithHentai()       { return keith('/adult/hentai'); }

// ── TOOLS ─────────────────────────────────────────────────────
async function keithShorten(url, type = 'tinyurl') {
  const r = await keith(`/shortener/${type}`, { url }, 12000);
  if (!r) return null;
  return typeof r === 'string' ? r : r?.shortened || r?.url || null;
}
async function keithFancyText(text)  { return keith('/tools/fancytext',  { text }); }
async function keithScreenshot(url)  { return keith('/tools/screenshot', { url }, 30000); }

// ── DOWNLOADS ─────────────────────────────────────────────────
// Confirmed from apiskeith.top/download (36 endpoints)
//
// CRITICAL FIX: keith() already returns d.result (unwrapped from the API response).
// `r` here IS d.result — either a URL string or an object { url, audio, video, ... }.
// WRONG: r?.result  → that equals d.result.result which is always undefined.
// RIGHT: r?.url / r?.audio / r?.video / r?.download / r?.link

async function keithYTMP3(url) {
  for (const ep of ['/download/ytmp3', '/download/ytmp3v2', '/download/ytmp3v3',
                    '/download/dlmp3', '/download/ytaudio', '/download/yta', '/download/ytv']) {
    const r = await keith(ep, { url }, 60000);
    if (!r) continue;
    if (typeof r === 'string' && r.startsWith('http')) return r;
    const u = r?.url || r?.audio || r?.download || r?.link;
    if (u && typeof u === 'string' && u.startsWith('http')) return u;
  }
  return null;
}

async function keithYTMP4(url) {
  for (const ep of ['/download/ytmp4', '/download/ytmp4v2', '/download/ytmp4v3',
                    '/download/dlmp4', '/download/ytvideo']) {
    const r = await keith(ep, { url }, 60000);
    if (!r) continue;
    if (typeof r === 'string' && r.startsWith('http')) return r;
    const u = r?.url || r?.video || r?.download || r?.link;
    if (u && typeof u === 'string' && u.startsWith('http')) return u;
  }
  return null;
}

async function keithTikTok(url) {
  const r = await keith('/download/tiktok', { url }, 45000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return { video: r };
  if (r?.video) return r;
  if (r?.play) return { video: r.play, audio: r.music, title: r.desc, author: r.author?.nickname };
  return null;
}

async function keithInstagram(url) {
  for (const ep of ['/download/igdl', '/download/instagramdl',
                    '/download/instagramposts', '/download/instagramstories',
                    '/download/instagram']) {
    const r = await keith(ep, { url }, 45000);
    if (!r) continue;
    if (typeof r === 'string' && r.startsWith('http')) return r;
    if (Array.isArray(r) && r.length) return r;
    const u = r?.media || r?.url || r?.download;
    if (u) return u;
  }
  return null;
}

async function keithSpotify(url) {
  const r = await keith('/download/spotify', { url }, 60000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return r;
  return r?.audio || r?.download || r?.link || r?.url || null;
}

async function keithFacebook(url) {
  for (const ep of ['/download/fbdl', '/download/facebookdl', '/download/facebook1', '/download/facebook2']) {
    const r = await keith(ep, { url }, 45000);
    if (!r) continue;
    if (typeof r === 'string' && r.startsWith('http')) return r;
    const u = r?.hd || r?.sd || r?.video || r?.download || r?.url;
    if (u && typeof u === 'string' && u.startsWith('http')) return u;
  }
  return null;
}

async function keithTwitter(url) {
  const r = await keith('/download/twitter', { url }, 45000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return r;
  return r?.video || r?.url || r?.download || null;
}

async function keithMediaFire(url) {
  const r = await keith('/download/mediafire', { url }, 45000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return r;
  return r?.download || r?.link || r?.url || null;
}

async function keithSoundCloud(url) {
  const r = await keith('/download/soundcloud', { url }, 45000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return r;
  return r?.audio || r?.download || r?.link || r?.url || null;
}

async function keithTelegramStories(url) {
  const r = await keith('/download/telegramstories', { url }, 45000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return r;
  return r?.url || null;
}

async function keithTelegramMedia(url) {
  const r = await keith('/download/telegrammedia', { url }, 45000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return r;
  return r?.url || null;
}

async function keithGDrive(url) {
  const r = await keith('/download/gdrive', { url }, 45000);
  if (!r) return null;
  if (typeof r === 'string' && r.startsWith('http')) return r;
  return r?.download || r?.link || r?.url || null;
}

async function keithAPK4All(q) {
  return keith('/download/apk4all', { q }, 20000);
}

async function keithAPKPure(q) {
  return keith('/download/apkpure', { q }, 20000);
}

async function keithSoundCloudDL(url) {
  return keithSoundCloud(url);
}

module.exports = {
  keith,
  keithAI,
  // Search
  keithImages, keithBing, keithYTSearch, keithLyrics, keithBible,
  keithBrave, keithApkSearch, keithTGSearch, keithWALinks,
  // Fun
  keithTruth, keithDare, keithWYR, keithParanoia, keithPickupLine,
  keithFact, keithInsult, keithJoke, keithMeme, keithQuestion,
  keithQuote, keithQuoteAudio, keithNHIE,
  // Stalker
  keithIGStalk, keithTTStalk, keithTTStalk2, keithTWStalk,
  keithGHStalk, keithGHRepoStalk, keithGHTrends,
  keithYTChannelStalk, keithIPLookup, keithIPStalk,
  keithWAChannelStalk, keithCountryStalk, keithNPMStalk, keithPinterestStalk,
  // Spiritual
  keithBibleSearch, keithHymnal, keithAdventistHymnal, keithAIBible,
  keithSurahList, keithQuranSurah, keithQuranAudio, keithAIMuslim,
  // Education
  keithFruitInfo, keithPoem, keithGrammarCheck, keithDictionary,
  keithPhysicsAI, keithMathsAI, keithChemistryAI, keithKCSE,
  keithBookSearch, keithBookScript,
  // Movie
  keithDramaboxTrending, keithDramaboxSearch, keithDramaboxDetails,
  keithDramaboxDownload, keithMovieActorSearch, keithMovieSearch, keithMovieTrailer,
  // Sports
  keithFootballNews, keithLivescore, keithLivescoreHL,
  keithPlayerSearch, keithTeamSearch, keithVenueSearch, keithGameHistory,
  keithEPLUpcoming, keithEPLMatches, keithEPLStandings, keithEPLTopScorers,
  keithBundesligaUpcoming, keithBundesligaMatches,
  keithBundesligaStandings, keithBundesligaTopScorers,
  // Images
  keithImageEditor, keithImageEnhance, keithWallpaper,
  keithPhotofunia, keithMagicStudio, keithRemoveBg, keithEphotoLogo,
  // Anime
  keithAnimeSearch, keithAnimeInfo,
  // Adult
  keithXvidSearch, keithXnxxSearch, keithXvidDL, keithXnxxDL, keithHentai,
  // Tools
  keithShorten, keithFancyText, keithScreenshot,
  // Downloads
  keithYTMP3, keithYTMP4, keithTikTok, keithInstagram, keithSpotify,
  keithFacebook, keithTwitter, keithMediaFire, keithSoundCloud,
  keithTelegramStories, keithTelegramMedia, keithGDrive,
  keithAPK4All, keithAPKPure, keithSoundCloudDL,
};
