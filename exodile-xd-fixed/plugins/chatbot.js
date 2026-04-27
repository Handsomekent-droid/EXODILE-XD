'use strict';
/**
 * EXODILE XD — Smart Chatbot with Per-User Memory
 * Owner: Dev Prime Killer Nova Kent
 *
 * .chatbot dm on  — DM only
 * .chatbot gc on  — Group (mention/reply)
 * .chatbot off    — Disable
 * .chatbot memory clear — Clear YOUR memory with the bot
 * .chatbot memory clear all — Owner only: wipe all memories
 */
const fs    = require('fs');
const path  = require('path');
const store = require('../lib/lightweight_store');
const { sessionStore } = require('../lib/sessionStore');
const { tryApis }      = require('../lib/apiFallback');
const { getChannelInfo } = require('../lib/messageConfig');

const DATA_FILE        = path.join(__dirname, '../data/userGroupData.json');
const PERSONALITY_FILE = path.join(__dirname, '../data/personality.json');
const MEMORY_FILE      = path.join(__dirname, '../data/chatMemory.json');

// ── Personality ────────────────────────────────────────────────
function loadPersonality() {
  try { return JSON.parse(fs.readFileSync(PERSONALITY_FILE, 'utf8')); }
  catch {
    return {
      name: 'EPIC',
      creator: 'Dev Prime Killer Nova Kent',
      owner: 'Dev Prime Killer Nova Kent',
      team: 'EXODILE XD',
      rules: [],
      memory_limit: 40,
      context_window: 12,
      fallback_message: 'hm let me think bout that again lol',
    };
  }
}

// ── Per-user memory (persisted to disk) ────────────────────────
function loadMemory() {
  try { return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')); }
  catch { return {}; }
}

function saveMemory(mem) {
  try { fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem, null, 2)); } catch {}
}

function pushMsg(mem, userId, role, text, limit) {
  if (!mem[userId])          mem[userId] = { msgs: [], facts: {} };
  if (!mem[userId].msgs)     mem[userId].msgs = [];
  if (!mem[userId].facts)    mem[userId].facts = {};
  mem[userId].msgs.push({ role, text, ts: Date.now() });
  // Keep only last N messages per user
  if (mem[userId].msgs.length > limit) mem[userId].msgs.shift();
}

// Extract facts mentioned by user and store them
function extractFacts(mem, userId, text, langHints) {
  const t = text.toLowerCase();

  const nameMatch = text.match(/my name is (\w+)/i);
  if (nameMatch) mem[userId].facts.name = nameMatch[1];

  const fromMatch = text.match(/i (?:am|m) from ([\w\s]+)/i);
  if (fromMatch) mem[userId].facts.location = fromMatch[1].trim().split(' ')[0];

  const ageMatch = text.match(/i(?:'m| am) (\d{1,2}) (?:years?|yrs?) old/i);
  if (ageMatch) mem[userId].facts.age = ageMatch[1];

  const likeMatch = text.match(/i (?:love|like|enjoy) ([\w\s]+)/i);
  if (likeMatch) mem[userId].facts.likes = likeMatch[1].trim().slice(0, 30);

  // Remember language preference automatically
  if (langHints) {
    const isSheng   = (langHints.sheng   || []).some(w => t.includes(w));
    const isSwahili = (langHints.swahili || []).some(w => t.includes(w));
    const isNaija   = (langHints.naija   || []).some(w => t.includes(w));
    if (isSheng)        mem[userId].facts.language = 'sheng';
    else if (isSwahili) mem[userId].facts.language = 'swahili';
    else if (isNaija)   mem[userId].facts.language = 'naija';
  }
}

// ── Chatbot data storage (per session) ────────────────────────
async function loadData(sock) {
  try {
    if (sock) {
      const _ss    = sessionStore(sock);
      const botNum = (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
      const d = await _ss.getSetting('global', `chatbot_data_${botNum}`);
      if (d) return d;
    }
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {}
  return {};
}

async function saveData(data, sock) {
  try {
    if (sock) {
      const _ss    = sessionStore(sock);
      const botNum = (sock?.user?.id || '').split(':')[0].split('@')[0] || 'global';
      await _ss.saveSetting('global', `chatbot_data_${botNum}`, data);
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

// ── AI call (Keith API primary, fallbacks) ─────────────────────
async function askAI(prompt) {
  const enc = encodeURIComponent(prompt);
  return tryApis([
    // Keith API — primary endpoints
    { url: `https://apiskeith.top/ai/chatgpt4?q=${enc}`,   parse: d => d?.result || d?.answer || d?.reply },
    { url: `https://apiskeith.top/ai/gemini?q=${enc}`,     parse: d => d?.result || d?.answer || d?.reply },
    { url: `https://apiskeith.top/ai/llama?q=${enc}`,      parse: d => d?.result || d?.answer || d?.reply },
    { url: `https://apiskeith.top/ai/deepseek?q=${enc}`,   parse: d => d?.result || d?.answer || d?.reply },
    { url: `https://apiskeith.top/ai/blackbox?q=${enc}`,   parse: d => d?.result || d?.answer || d?.reply },
    // Fallbacks
    { url: `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${enc}`, parse: d => d?.result || d?.answer },
    { url: `https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${enc}`,     parse: d => d?.result || d?.answer },
    { url: `https://api.siputzx.my.id/api/ai/gemini-pro?content=${enc}`,          parse: d => d?.data   || d?.message },
    { url: `https://api.ryzendesu.vip/api/ai/gemini?text=${enc}`,                 parse: d => d?.message || d?.data },
    { url: `https://api.vreden.my.id/api/gpt4?query=${enc}`,                       parse: d => d?.result || d?.data },
  ]);
}

function cleanReply(text) {
  if (!text) return null;
  return text
    // Strip AI self-labels at line start
    .replace(/^(bot|AI|Assistant|EPIC)\s*[:>]\s*/i, '')
    // Strip wrapping quotes
    .replace(/^[\"']|[\"']$/g, '')
    // Strip markdown bold (keep the text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove AI disclosure lines
    .replace(/^I am an AI.*$/im, '')
    .replace(/^As an AI.*$/im, '')
    .replace(/^I'm an AI.*$/im, '')
    .replace(/^I cannot.*$/im, '')
    .replace(/^Sure[,!]?\s+here('s| is)/i, '')
    // Collapse excess blank lines but keep paragraph breaks
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

// ── Main auto-respond handler (called from messageHandler) ─────
async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
  if (!userMessage || !userMessage.trim()) return;

  const data = await loadData(sock);
  const cb   = data.chatbot || {};
  const isGroup = chatId.endsWith('@g.us');
  const mode    = cb[chatId];
  if (!mode) return;

  // Mode guards
  if (mode === 'dm' && isGroup)  return;
  if (mode === 'gc' && !isGroup) return;

  // Group: only respond when mentioned/replied
  if (mode === 'gc' && isGroup) {
    const botNum = sock.user?.id?.split(':')[0];
    const ext    = message.message?.extendedTextMessage;
    const mentioned  = ext?.contextInfo?.mentionedJid?.some(j => j.startsWith(botNum));
    const replied    = ext?.contextInfo?.participant?.startsWith(botNum);
    const taggedText = userMessage.includes(`@${botNum}`);
    if (!mentioned && !replied && !taggedText) return;
  }

  try {
    await sock.sendPresenceUpdate('composing', chatId).catch(() => {});

    const p      = loadPersonality();
    const mem    = loadMemory();
    const limit  = p.memory_limit || 40;
    const window = p.context_window || 12;

    if (!mem[senderId]) mem[senderId] = { msgs: [], facts: {} };

    const recent = mem[senderId].msgs
      .slice(-window)
      .map(m => `${m.role}: ${m.text}`)
      .join('\n');

    const facts = Object.entries(mem[senderId].facts || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    // ── Detect user's language from message ──────────────────
    const langHints = p.language_hints || {};
    const msgLower  = userMessage.toLowerCase();

    const isSheng   = (langHints.sheng   || []).some(w => msgLower.includes(w));
    const isSwahili = (langHints.swahili || []).some(w => msgLower.includes(w));
    const isNaija   = (langHints.naija   || []).some(w => msgLower.includes(w));

    let langInstruction = '';
    if (isSheng) {
      langInstruction = 'The user is speaking Sheng (Kenyan street slang). Reply in Sheng — use words like maze, buda, sawa, msee, fiti, poa naturally. Mix with English the way Nairobi guys do.';
    } else if (isSwahili) {
      langInstruction = 'The user is speaking Kiswahili. Reply fully in Kiswahili. Use emojis naturally. Be warm and engaging.';
    } else if (isNaija) {
      langInstruction = 'The user is speaking Nigerian Pidgin/Naija slang. Reply in Naija style — use words like omo, abeg, wahala, sabi, na wa, ehn naturally. Sound like a Lagos guy.';
    } else {
      langInstruction = 'The user is speaking English. Reply in casual, warm English. Use emojis throughout your message.';
    }

    // ── Is this a question that needs a proper answer? ────────
    const isQuestion = /\?$/.test(userMessage.trim()) ||
      /^(what|who|why|how|when|where|which|can you|do you|is it|are you|tell me|explain|describe)/i.test(userMessage.trim());

    const answerDepth = isQuestion
      ? 'This is a QUESTION — give a FULL, DETAILED, HELPFUL answer. Do not be lazy or short. Explain properly with examples if needed. You can write multiple sentences or paragraphs. Never give a one-liner for a real question.'
      : 'This is a casual message. Match the energy — if it is short and casual, reply short and casual. If it needs more, give more.';

    const systemPrompt = [
      `Your name is EPIC. You are a MALE. You were made by ${p.owner || p.creator} from ${p.team}.`,
      `You are NOT an AI — you are a real guy chatting on WhatsApp.`,
      `You LOVE emojis — every reply must have at least 2-3 emojis naturally placed. More is fine.`,
      `You are confident, funny, warm, street smart and educated. You give real, helpful answers.`,
      '',
      `LANGUAGE RULE: ${langInstruction}`,
      '',
      `ANSWER DEPTH: ${answerDepth}`,
      '',
      ...(p.rules || []).map(r => `- ${r}`),
      '',
      facts  ? `Facts you know about this user: ${facts}` : '',
      recent ? `Recent conversation history:\n${recent}` : '',
      '',
      `User's message: "${userMessage}"`,
      '',
      `Reply now as EPIC. Remember: MALE, emojis, proper answer if it is a question, match the language.`,
    ].filter(v => v !== undefined && v !== null).join('\n');

    const reply = await askAI(systemPrompt);
    const clean = cleanReply(reply);

    if (!clean) {
      const fallbacks = [
        'omo wait lemme think about that one 🤔💀',
        'maze that one caught me off guard bro 😂 ask me again',
        'hm my brain buffered on that one 😭 try again',
        'abeg give me a sec on that 🔥',
      ];
      const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      await sock.sendMessage(chatId, { text: fb }, { quoted: message });
      return;
    }

    // Save to memory
    pushMsg(mem, senderId, 'user', userMessage, limit);
    pushMsg(mem, senderId, 'EPIC', clean, limit);
    extractFacts(mem, senderId, userMessage, p.language_hints);
    saveMemory(mem);

    // Natural typing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 900));
    await sock.sendMessage(chatId, { text: clean }, { quoted: message });

  } catch (err) {
    if (!err.message?.includes('No sessions')) {
      try {
        const p = loadPersonality();
        await sock.sendMessage(chatId, { text: p.fallback_message }, { quoted: message });
      } catch {}
    }
  }
}

// ── Command handler ─────────────────────────────────────────────
module.exports = {
  command: 'chatbot',
  aliases: ['cb', 'aibot', 'bot'],
  category: 'admin',
  description: 'Smart AI chatbot with per-user memory',
  usage: '.chatbot dm on | .chatbot gc on | .chatbot off | .chatbot memory clear',

  async handler(sock, message, args, context = {}) {
    const chatId   = context.chatId || message.key.remoteJid;
    const senderId = context.senderId || message.key.participant || message.key.remoteJid;
    const isGroup  = chatId.endsWith('@g.us');
    const ci       = getChannelInfo();
    const full     = args.join(' ').toLowerCase().trim();
    const parts    = full.split(/\s+/);

    const data = await loadData(sock);
    if (!data.chatbot) data.chatbot = {};

    const H = (t) =>
      `╔══════════════════════════╗\n` +
      `║  𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃 — ᴄʜᴀᴛʙᴏᴛ  ║\n` +
      `╚══════════════════════════╝\n\n` + t;

    // .chatbot memory clear [all]
    if (parts[0] === 'memory' && parts[1] === 'clear') {
      const mem = loadMemory();
      if (parts[2] === 'all') {
        // Owner-only: clear ALL memories
        const ownerNums = (() => {
          try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../data/owner.json'), 'utf8')); }
          catch { return []; }
        })();
        const senderNum = senderId.replace('@s.whatsapp.net', '').replace(/:\d+$/, '');
        if (!ownerNums.includes(senderNum)) {
          return sock.sendMessage(chatId, { text: H('᭄ ❌ Owner only command.'), ...ci }, { quoted: message });
        }
        Object.keys(mem).forEach(k => delete mem[k]);
        saveMemory(mem);
        return sock.sendMessage(chatId, { text: H('᭄ 🔥 ALL chat memories wiped.'), ...ci }, { quoted: message });
      }
      // Clear own memory
      delete mem[senderId];
      saveMemory(mem);
      return sock.sendMessage(chatId, { text: H('᭄ ✅ Your memory cleared. Starting fresh!'), ...ci }, { quoted: message });
    }

    const [scope, action] = parts;

    // Show status
    if (!scope) {
      const st  = data.chatbot[chatId] || 'off';
      const mem = loadMemory();
      const userMsgs = mem[senderId]?.msgs?.length || 0;
      return sock.sendMessage(chatId, { text: H(
        `᭄ status  : *${st}*\n` +
        `᭄ memory  : *${userMsgs}* msgs saved\n\n` +
        `᭄ .chatbot dm on        — DM mode\n` +
        `᭄ .chatbot gc on        — Group mode\n` +
        `᭄ .chatbot off          — Disable\n` +
        `᭄ .chatbot memory clear — Clear your memory`
      ), ...ci }, { quoted: message });
    }

    if (scope === 'off') {
      delete data.chatbot[chatId];
      await saveData(data, sock);
      return sock.sendMessage(chatId, { text: H('᭄ ᴄʜᴀᴛʙᴏᴛ ᴅɪsᴀʙʟᴇᴅ ❤️‍🔥'), ...ci }, { quoted: message });
    }

    if (scope === 'dm' && action === 'on') {
      data.chatbot[chatId] = 'dm';
      await saveData(data, sock);
      return sock.sendMessage(chatId, { text: H('᭄ ᴄʜᴀᴛʙᴏᴛ ᴇɴᴀʙʟᴇᴅ ꜰᴏʀ *ᴅᴍ* 🔷\n᭄ Just text me — EPIC is listening.'), ...ci }, { quoted: message });
    }

    if (scope === 'gc' && action === 'on') {
      if (!isGroup) return sock.sendMessage(chatId, { text: H('᭄ Use this inside a group.'), ...ci }, { quoted: message });
      data.chatbot[chatId] = 'gc';
      await saveData(data, sock);
      return sock.sendMessage(chatId, { text: H('᭄ ᴄʜᴀᴛʙᴏᴛ ᴇɴᴀʙʟᴇᴅ ꜰᴏʀ *ɢʀᴏᴜᴘ* ♥\n᭄ Mention or reply to bot to trigger'), ...ci }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: H(
      '᭄ Usage:\n' +
      '᭄ .chatbot dm on  — DM only\n' +
      '᭄ .chatbot gc on  — Group\n' +
      '᭄ .chatbot off    — Disable\n' +
      '᭄ .chatbot memory clear — Wipe your memory'
    ), ...ci }, { quoted: message });
  },

  handleChatbotResponse,
};
