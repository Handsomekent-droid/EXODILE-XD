'use strict';
/**
 * EXODILE XD — Universal Downloader Engine v8
 *
 * Keith API (PRIMARY):
 *   Base URL  : https://apiskeith.top/download/<endpoint>?url=...
 *   Response  : { "status": true, "creator": "Keithkeizzah", "result": "https://..." }
 *               OR { "status": true, "result": [ { url, title, ... } ] }  (for lists/search)
 *
 * All other APIs are fallbacks only.
 */
const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function tryGet(url, parse, timeout = 25000) {
  try {
    const r = await axios.get(url, { timeout, headers: HEADERS });
    const v = parse(r.data);
    if (v && typeof v === 'string' && v.startsWith('http')) return v;
  } catch {}
  return null;
}

/**
 * Keith API direct result parser
 * Response: { status: true, creator: "Keithkeizzah", result: "https://..." }
 */
function keithResult(d) {
  if (!d) return null;
  // Direct string result (most common)
  if (typeof d.result === 'string' && d.result.startsWith('http')) return d.result;
  // result as object with url
  if (d.result?.url && d.result.url.startsWith('http')) return d.result.url;
  // result as array
  if (Array.isArray(d.result) && d.result[0]?.url) return d.result[0].url;
  // data.url fallback
  if (d.data?.url && d.data.url.startsWith('http')) return d.data.url;
  return null;
}

// ── YouTube Search ─────────────────────────────────────────────
async function ytSearch(query) {
  const enc = encodeURIComponent(query);
  const sources = [
    // 0. Keith API — search
    async () => {
      const r = await axios.get(
        `https://apiskeith.top/download/ytsearch?q=${enc}`,
        { timeout: 15000, headers: HEADERS }
      );
      // Result may be array of videos
      const list = Array.isArray(r.data?.result) ? r.data.result : (Array.isArray(r.data?.data) ? r.data.data : null);
      const v = list?.[0];
      if (v?.url) return { url: v.url, title: v.title || query };
      // Or a single object
      if (r.data?.result?.url) return { url: r.data.result.url, title: r.data.result.title || query };
      return null;
    },
    // 1. faa
    async () => {
      const r = await axios.get(`https://api-faa.my.id/faa/youtube?q=${enc}`, { timeout: 12000, headers: HEADERS });
      const v = r.data?.result?.[0] || r.data?.data?.[0] || r.data?.[0];
      return v ? { url: v.url || v.link, title: v.title || v.name } : null;
    },
    // 2. gifted
    async () => {
      const r = await axios.get(`https://api.giftedtech.my.id/api/search/ytsearch?apikey=gifted&q=${enc}`, { timeout: 12000, headers: HEADERS });
      const v = r.data?.result?.[0] || r.data?.data?.[0];
      return v ? { url: v.url || v.link, title: v.title || v.name } : null;
    },
    // 3. siputzx
    async () => {
      const r = await axios.get(`https://api.siputzx.my.id/api/s/youtube?q=${enc}`, { timeout: 12000, headers: HEADERS });
      const v = r.data?.data?.[0];
      return v ? { url: v.url, title: v.title } : null;
    },
    // 4. ryzendesu
    async () => {
      const r = await axios.get(`https://api.ryzendesu.vip/api/search/youtube?q=${enc}`, { timeout: 12000, headers: HEADERS });
      const v = r.data?.data?.[0] || r.data?.[0];
      return v ? { url: v.url || v.link, title: v.title } : null;
    },
  ];
  for (const fn of sources) {
    try {
      const v = await fn();
      if (v?.url && v.url.match(/youtu\.?be|youtube\.com/i)) return v;
    } catch {}
  }
  return null;
}

// ── YouTube MP3 ────────────────────────────────────────────────
async function ytmp3(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    // Keith API — all confirmed YT audio endpoints from apiskeith.top/download
    async () => tryGet(`https://apiskeith.top/download/ytmp3?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/ytmp3v2?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/ytmp3v3?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/dlmp3?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/ytaudio?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/yta?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/ytv?url=${enc}`, keithResult),
    // faa
    async () => tryGet(`https://api-faa.my.id/faa/ytmp3?url=${enc}`, d => d?.result?.url || d?.result?.downloadUrl || d?.data?.url || d?.url),
    async () => tryGet(`https://api-faa.my.id/faa/ytplay?query=${enc}`, d => d?.result?.url || d?.result?.audio || d?.data?.url || d?.url),
    // gifted
    async () => tryGet(`https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${enc}`, d => d?.result?.downloadUrl || d?.result?.url || d?.result?.audio || d?.result?.link),
    async () => tryGet(`https://api.giftedtech.my.id/api/download/ytmp3v2?apikey=gifted&url=${enc}`, d => d?.result?.downloadUrl || d?.result?.url || d?.result?.audio),
    // siputzx
    async () => tryGet(`https://api.siputzx.my.id/api/d/ytmp3?url=${enc}`, d => d?.data?.downloadUrl || d?.data?.url || d?.data?.audio),
    // ryzendesu
    async () => tryGet(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}`, d => d?.url || d?.link || d?.data?.url || d?.data?.audio),
    // vreden
    async () => tryGet(`https://api.vreden.my.id/api/ytdl?url=${enc}&quality=audio`, d => d?.result?.url || d?.data?.url),
  ];
  for (const fn of apis) {
    try { const r = await fn(); if (r && r.startsWith('http')) return r; } catch {}
  }
  throw new Error('all mp3 sources failed');
}

// ── YouTube MP4 ────────────────────────────────────────────────
async function ytmp4(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    // Keith API — all confirmed YT video endpoints from apiskeith.top/download
    async () => tryGet(`https://apiskeith.top/download/ytmp4?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/ytmp4v2?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/ytmp4v3?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/dlmp4?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/ytvideo?url=${enc}`, keithResult),
    // faa
    async () => tryGet(`https://api-faa.my.id/faa/ytmp4?url=${enc}`, d => d?.result?.url || d?.result?.downloadUrl || d?.data?.url || d?.url),
    // gifted
    async () => tryGet(`https://api.giftedtech.my.id/api/download/ytmp4?apikey=gifted&url=${enc}`, d => d?.result?.downloadUrl || d?.result?.url || d?.result?.video),
    async () => tryGet(`https://api.giftedtech.my.id/api/download/ytmp4v2?apikey=gifted&url=${enc}`, d => d?.result?.downloadUrl || d?.result?.url || d?.result?.video),
    // siputzx
    async () => tryGet(`https://api.siputzx.my.id/api/d/ytmp4?url=${enc}`, d => d?.data?.downloadUrl || d?.data?.url),
    // ryzendesu
    async () => tryGet(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${enc}`, d => d?.url || d?.data?.url),
    // vreden
    async () => tryGet(`https://api.vreden.my.id/api/ytdl?url=${enc}&quality=video`, d => d?.result?.url || d?.data?.url),
  ];
  for (const fn of apis) {
    try { const r = await fn(); if (r && r.startsWith('http')) return r; } catch {}
  }
  throw new Error('all mp4 sources failed');
}

// ── TikTok ─────────────────────────────────────────────────────
async function tiktok(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    async () => tryGet(`https://apiskeith.top/download/tiktok?url=${enc}`, keithResult),
    async () => {
      const r = await axios.post('https://www.tikwm.com/api/', `url=${enc}&hd=1`,
        { timeout: 18000, headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' } });
      return r.data?.data?.hdplay || r.data?.data?.play || null;
    },
    async () => tryGet(`https://api.giftedtech.my.id/api/download/tiktok?apikey=gifted&url=${enc}`, d => d?.result?.nowatermark || d?.result?.video || d?.result?.url),
    async () => tryGet(`https://api.siputzx.my.id/api/d/tiktok?url=${enc}`, d => d?.data?.play || d?.data?.nowatermark),
    async () => tryGet(`https://api.ryzendesu.vip/api/downloader/tiktok?url=${enc}`, d => d?.url || d?.data?.play || d?.data?.nowatermark),
    async () => tryGet(`https://api.vreden.my.id/api/tiktokdl?url=${enc}`, d => d?.result?.video || d?.result?.nowatermark || d?.data?.url),
  ];
  for (const fn of apis) {
    try { const r = await fn(); if (r && r.startsWith('http')) return r; } catch {}
  }
  throw new Error('tiktok download failed');
}

// ── Instagram ──────────────────────────────────────────────────
async function instagram(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    // Keith: igdl (general), instagramposts, instagramstories — all active per screenshots
    async () => {
      for (const ep of ['igdl', 'instagram', 'instagramposts', 'instagramstories', 'instagramdl']) {
        try {
          const r = await axios.get(`https://apiskeith.top/download/${ep}?url=${enc}`, { timeout: 20000, headers: HEADERS });
          const res = r.data;
          if (!res || (!res.status && !res.success && res.result === undefined)) continue;
          if (typeof res.result === 'string' && res.result.startsWith('http')) return [{ url: res.result, type: 'auto' }];
          if (Array.isArray(res.result) && res.result.length) return res.result.map(x => ({ url: x.url || x, type: 'auto' })).filter(x => x.url?.startsWith('http'));
          if (res.result?.url) return [{ url: res.result.url, type: 'auto' }];
        } catch {}
      }
      return null;
    },
    async () => {
      const r = await axios.get(`https://api-faa.my.id/faa/igdl?url=${enc}`, { timeout: 18000, headers: HEADERS });
      const d = r.data?.result || r.data?.data;
      if (Array.isArray(d) && d.length) return d.map(x => ({ url: x.url || x.link, type: 'auto' }));
      if (d?.url) return [{ url: d.url, type: 'auto' }];
      return null;
    },
    async () => {
      const r = await axios.get(`https://api.giftedtech.my.id/api/download/igdl?apikey=gifted&url=${enc}`, { timeout: 18000, headers: HEADERS });
      const d = r.data?.result;
      if (Array.isArray(d) && d.length) return d.map(x => ({ url: x.url || x.link, type: 'auto' }));
      if (d?.url) return [{ url: d.url, type: 'auto' }];
      return null;
    },
    async () => {
      const r = await axios.get(`https://api.siputzx.my.id/api/d/instagram?url=${enc}`, { timeout: 18000, headers: HEADERS });
      const d = r.data?.data;
      if (Array.isArray(d) && d.length) return d.map(x => ({ url: x.url, type: 'auto' }));
      return null;
    },
    async () => {
      const r = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${enc}`, { timeout: 18000, headers: HEADERS });
      const d = r.data?.data;
      if (Array.isArray(d) && d.length) return d.map(x => ({ url: x.url, type: 'auto' }));
      return null;
    },
  ];
  for (const fn of apis) {
    try { const v = await fn(); if (Array.isArray(v) && v.length && v[0]?.url) return v; } catch {}
  }
  throw new Error('ig download failed — make sure post is public');
}

// ── Twitter/X ──────────────────────────────────────────────────
async function twitter(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    async () => tryGet(`https://apiskeith.top/download/twitter?url=${enc}`, keithResult),
    async () => tryGet(`https://api.nexray.web.id/downloader/twitter?url=${enc}`, d => d?.result?.url || d?.result?.hd || d?.result?.sd || d?.data?.url || d?.url),
    async () => tryGet(`https://api.giftedtech.my.id/api/download/twitter?apikey=gifted&url=${enc}`, d => d?.result?.url || d?.result?.hd || d?.result?.sd),
    async () => tryGet(`https://api.siputzx.my.id/api/d/twitter?url=${enc}`, d => d?.data?.url || d?.data?.hd || d?.data?.sd),
    async () => tryGet(`https://api.ryzendesu.vip/api/downloader/twitter?url=${enc}`, d => d?.url || d?.data?.url),
  ];
  for (const fn of apis) {
    try { const r = await fn(); if (r && r.startsWith('http')) return r; } catch {}
  }
  throw new Error('twitter download failed — use public video link');
}

// ── Facebook ───────────────────────────────────────────────────
async function facebook(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    // Keith: facebook download 1 and 2 (both active per screenshot)
    async () => tryGet(`https://apiskeith.top/download/fbdl?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/facebook1?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/facebook2?url=${enc}`, keithResult),
    async () => tryGet(`https://apiskeith.top/download/facebookdl?url=${enc}`, keithResult),
    async () => tryGet(`https://api.giftedtech.my.id/api/download/fbdl?apikey=gifted&url=${enc}`, d => d?.result?.url || d?.result?.sd || d?.result?.hd),
    async () => tryGet(`https://api.siputzx.my.id/api/d/facebook?url=${enc}`, d => d?.data?.url || d?.data?.hd || d?.data?.sd),
    async () => tryGet(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${enc}`, d => d?.url || d?.data?.url),
    async () => tryGet(`https://api.vreden.my.id/api/fbdl?url=${enc}`, d => d?.result?.url || d?.result?.hd || d?.data?.url),
  ];
  for (const fn of apis) {
    try { const r = await fn(); if (r && r.startsWith('http')) return r; } catch {}
  }
  throw new Error('fb download failed — use public video link');
}

// ── SoundCloud ─────────────────────────────────────────────────
async function soundcloud(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    async () => tryGet(`https://apiskeith.top/download/soundcloud?url=${enc}`, keithResult),
    async () => tryGet(`https://api.giftedtech.my.id/api/download/soundcloud?apikey=gifted&url=${enc}`, d => d?.result?.downloadUrl || d?.result?.url || d?.result?.audio),
    async () => tryGet(`https://api.siputzx.my.id/api/d/soundcloud?url=${enc}`, d => d?.data?.url || d?.data?.audio),
    async () => tryGet(`https://api.ryzendesu.vip/api/downloader/soundcloud?url=${enc}`, d => d?.url || d?.data?.url),
  ];
  for (const fn of apis) {
    try { const r = await fn(); if (r && r.startsWith('http')) return r; } catch {}
  }
  throw new Error('soundcloud download failed');
}

module.exports = { ytmp3, ytmp4, ytSearch, tiktok, instagram, facebook, twitter, soundcloud };
