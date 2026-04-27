'use strict';
/**
 * EXODILE XD — Universal API Fallback Engine
 * Keith API is PRIMARY for all AI requests
 */
const axios = require('axios');
const { keithAI } = require('./keithApi');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function tryApis(apis, opts = {}) {
  const timeout = opts.timeout || 20000;
  const label   = opts.label || 'API';
  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    const apiName = api.name || `${label}[${i}]`;
    try {
      const url    = typeof api.url === 'function' ? api.url() : api.url;
      const method = (api.method || 'GET').toUpperCase();
      const res    = method === 'POST'
        ? await axios.post(url, api.body || {}, { timeout, headers: { ...DEFAULT_HEADERS, ...(api.headers || {}) } })
        : await axios.get(url, { timeout, headers: { ...DEFAULT_HEADERS, ...(api.headers || {}) }, responseType: api.binary ? 'arraybuffer' : 'json' });
      const result = api.parse ? api.parse(res.data) : res.data;
      if (result !== null && result !== undefined && result !== '' &&
          !(Array.isArray(result) && !result.length)) {
        return result;
      }
    } catch (e) {
      const reason = e.response ? `HTTP ${e.response.status}` : e.code || e.message?.slice(0, 60) || 'unknown';
      console.log(`[API] ${apiName} failed: ${reason}`);
    }
  }
  return null;
}

async function fetchAI(prompt, context = '') {
  const enc  = encodeURIComponent(prompt);
  const full = context ? encodeURIComponent(`${context}\n\nUser: ${prompt}`) : enc;

  // 0. Keith API — PRIMARY (fastest, confirmed working)
  try {
    const keithReply = await keithAI(prompt);
    if (keithReply) return keithReply;
  } catch {}

  // Fallbacks
  return tryApis([
    { name: 'vreden-gpt',         url: `https://api.vreden.my.id/api/gpt4?query=${enc}`,                               parse: d => d?.result || d?.data },
    { name: 'vreden-gemini',      url: `https://api.vreden.my.id/api/gemini?query=${enc}`,                             parse: d => d?.result || d?.data },
    { name: 'giftedtech-gemini',  url: `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${enc}`,           parse: d => d?.result || d?.answer },
    { name: 'siputzx-gemini',     url: `https://api.siputzx.my.id/api/ai/gemini-pro?content=${enc}`,                    parse: d => d?.data || d?.message },
    { name: 'ryzendesu-gemini',   url: `https://api.ryzendesu.vip/api/ai/gemini?text=${enc}`,                            parse: d => d?.message || d?.data },
    { name: 'giftedtech-gpt',     url: `https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${enc}`,               parse: d => d?.result || d?.answer },
    { name: 'siputzx-gpt',        url: `https://api.siputzx.my.id/api/ai/openai?content=${enc}`,                        parse: d => d?.data || d?.message },
    { name: 'ryzendesu-blackbox', url: `https://api.ryzendesu.vip/api/ai/blackbox?text=${enc}`,                         parse: d => d?.message || d?.data },
    { name: 'giftedtech-llama',   url: `https://api.giftedtech.my.id/api/ai/llama3?apikey=gifted&q=${enc}`,             parse: d => d?.result || d?.answer },
  ], { label: 'AI', timeout: 25000 });
}

async function fetchImageUrl(prompt, style = 'imagine') {
  const enc = encodeURIComponent(prompt);
  const styleMap = {
    imagine:     `https://api.giftedtech.my.id/api/ai/imagine?apikey=gifted&prompt=${enc}`,
    realistic:   `https://api.giftedtech.my.id/api/ai/realistic?apikey=gifted&prompt=${enc}`,
    anime:       `https://api.giftedtech.my.id/api/ai/animediff?apikey=gifted&prompt=${enc}`,
    sketch:      `https://api.giftedtech.my.id/api/ai/sketch?apikey=gifted&prompt=${enc}`,
    fantasy:     `https://api.giftedtech.my.id/api/ai/fantasy?apikey=gifted&prompt=${enc}`,
  };
  const primary = styleMap[style] || styleMap.imagine;
  return tryApis([
    { name: 'vreden-imagine',    url: `https://api.vreden.my.id/api/text2img?query=${enc}`,   parse: d => d?.result || d?.data },
    { name: `${style}-primary`,  url: primary,                                                  parse: d => d?.result || d?.url || d?.image },
    { name: 'ryzendesu-imagine', url: `https://api.ryzendesu.vip/api/ai/txt2img?text=${enc}`,  parse: d => d?.url || d?.image },
    { name: 'siputzx-imagine',   url: `https://api.siputzx.my.id/api/ai/imagine?prompt=${enc}`, parse: d => d?.data?.url || d?.url },
  ], { label: 'ImageGen', timeout: 30000 });
}

module.exports = { tryApis, fetchAI, fetchImageUrl };
