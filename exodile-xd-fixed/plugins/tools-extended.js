'use strict';
/**
 * ☠️ EXODILE XD — Extended Tools Pack
 * 50+ utility commands
 */
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const settings = require('../settings');

const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function box(title, lines) {
  let t = `┏━━「 ${title} 」━━┓\n┃\n`;
  for (const l of lines) t += `┃  ${l}\n`;
  return t + `┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER;
}

async function fetchApi(url, parse, fallback = null) {
  try {
    const r = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA } });
    const v = parse(r.data);
    return v || fallback;
  } catch { return fallback; }
}

const commands = [
  // ── Text tools ──────────────────────────────────────────────
  {
    command: 'uppercase', aliases: ['upper', 'caps'],
    category: 'tools', description: 'Convert text to uppercase', usage: '.uppercase <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' '); if (!t) return sock.sendMessage(chatId, { text: box('🔤 *UPPERCASE*', ['💀 Usage: .uppercase <text>']), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('🔤 *UPPERCASE*', [`➤ ${t.toUpperCase()}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'lowercase', aliases: ['lower', 'small'],
    category: 'tools', description: 'Convert text to lowercase', usage: '.lowercase <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' '); if (!t) return sock.sendMessage(chatId, { text: box('🔡 *LOWERCASE*', ['💀 Usage: .lowercase <text>']), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('🔡 *LOWERCASE*', [`➤ ${t.toLowerCase()}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'count', aliases: ['charcount', 'wordcount', 'wc'],
    category: 'tools', description: 'Count characters and words', usage: '.count <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' '); if (!t) return sock.sendMessage(chatId, { text: box('🔢 *COUNT*', ['💀 Usage: .count <text>']), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('🔢 *TEXT COUNT*', [`📝 Characters: ${t.length}`, `💬 Words: ${t.split(/\s+/).filter(Boolean).length}`, `📄 Lines: ${t.split('\n').length}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'repeat', aliases: ['rep', 'spam'],
    category: 'tools', description: 'Repeat text N times', usage: '.repeat <n> <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const n = parseInt(args[0]); const t = args.slice(1).join(' ');
      if (!n || !t || n > 20) return sock.sendMessage(chatId, { text: box('🔁 *REPEAT*', ['💀 Usage: .repeat <1-20> <text>']), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('🔁 *REPEAT*', [Array(n).fill(t).join('\n')]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'password', aliases: ['genpass', 'passgen', 'randpass'],
    category: 'tools', description: 'Generate a secure password', usage: '.password [length]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const len = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
      const pass = Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      await sock.sendMessage(chatId, { text: box('🔐 *PASSWORD GENERATOR*', [`🔑 *${pass}*`, `📏 Length: ${len}`, `✅ Strong & Secure!`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'uuid', aliases: ['uid', 'guid'],
    category: 'tools', description: 'Generate a UUID', usage: '.uuid',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });
      await sock.sendMessage(chatId, { text: box('🆔 *UUID GENERATOR*', [`➤ \`${uuid}\``]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'timestamp', aliases: ['ts', 'unixtime', 'epoch'],
    category: 'tools', description: 'Get current Unix timestamp', usage: '.timestamp',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const now = Date.now();
      await sock.sendMessage(chatId, { text: box('⏱️ *TIMESTAMP*', [`🕐 Unix: ${Math.floor(now/1000)}`, `📅 ISO: ${new Date(now).toISOString()}`, `🌍 Local: ${new Date(now).toLocaleString()}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'randomnumber', aliases: ['rnum', 'randnum', 'dice'],
    category: 'tools', description: 'Generate random number', usage: '.rnum [min] [max]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const min = parseInt(args[0]) || 1, max = parseInt(args[1]) || 100;
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      await sock.sendMessage(chatId, { text: box('🎲 *RANDOM NUMBER*', [`🎯 Result: *${n}*`, `📊 Range: ${min} - ${max}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'coinflip', aliases: ['flip', 'coin', 'toss'],
    category: 'tools', description: 'Flip a coin', usage: '.coinflip',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const r = Math.random() > 0.5 ? '🪙 HEADS' : '🪙 TAILS';
      await sock.sendMessage(chatId, { text: box('🪙 *COIN FLIP*', [`Result: *${r}*`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'percentage', aliases: ['percent', 'pct'],
    category: 'tools', description: 'Calculate percentage', usage: '.percent <value> <total>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const v = parseFloat(args[0]), t = parseFloat(args[1]);
      if (isNaN(v) || isNaN(t) || t === 0) return sock.sendMessage(chatId, { text: box('📊 *PERCENTAGE*', ['💀 Usage: .percent <value> <total>']), ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: box('📊 *PERCENTAGE*', [`➤ ${v} of ${t} = *${((v/t)*100).toFixed(2)}%*`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'bmi', aliases: ['bodymass'],
    category: 'tools', description: 'Calculate BMI', usage: '.bmi <weight_kg> <height_cm>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const w = parseFloat(args[0]), h = parseFloat(args[1]) / 100;
      if (isNaN(w) || isNaN(h) || h === 0) return sock.sendMessage(chatId, { text: box('⚖️ *BMI*', ['💀 Usage: .bmi <weight_kg> <height_cm>']), ...ci }, { quoted: m });
      const bmi = (w / (h * h)).toFixed(1);
      const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal ✅' : bmi < 30 ? 'Overweight' : 'Obese';
      await sock.sendMessage(chatId, { text: box('⚖️ *BMI CALCULATOR*', [`🏋️ Weight: ${w}kg`, `📏 Height: ${args[1]}cm`, `📊 BMI: *${bmi}*`, `🏷️ Status: ${cat}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'temperature', aliases: ['temp', 'celsius', 'fahrenheit'],
    category: 'tools', description: 'Convert temperature', usage: '.temp <value> <C/F>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const v = parseFloat(args[0]), u = (args[1] || 'C').toUpperCase();
      if (isNaN(v)) return sock.sendMessage(chatId, { text: box('🌡️ *TEMPERATURE*', ['💀 Usage: .temp 100 C']), ...ci }, { quoted: m });
      if (u === 'C') { await sock.sendMessage(chatId, { text: box('🌡️ *TEMP CONVERT*', [`${v}°C = *${(v*9/5+32).toFixed(1)}°F*`, `${v}°C = *${(v+273.15).toFixed(1)}K*`]), ...ci }, { quoted: m }); }
      else { await sock.sendMessage(chatId, { text: box('🌡️ *TEMP CONVERT*', [`${v}°F = *${((v-32)*5/9).toFixed(1)}°C*`]), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'speed', aliases: ['speedtest', 'mps', 'kmph'],
    category: 'tools', description: 'Convert speed units', usage: '.speed <value> <kmh/mph/ms>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const v = parseFloat(args[0]), u = (args[1] || 'kmh').toLowerCase();
      if (isNaN(v)) return sock.sendMessage(chatId, { text: box('🚀 *SPEED*', ['💀 Usage: .speed 100 kmh']), ...ci }, { quoted: m });
      const kmh = u === 'mph' ? v * 1.60934 : u === 'ms' ? v * 3.6 : v;
      await sock.sendMessage(chatId, { text: box('🚀 *SPEED CONVERT*', [`⚡ km/h: *${kmh.toFixed(2)}*`, `🚗 mph: *${(kmh/1.60934).toFixed(2)}*`, `💨 m/s: *${(kmh/3.6).toFixed(2)}*`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'distance', aliases: ['dist', 'km', 'miles'],
    category: 'tools', description: 'Convert distance', usage: '.distance <value> <km/mi/m>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const v = parseFloat(args[0]), u = (args[1] || 'km').toLowerCase();
      if (isNaN(v)) return sock.sendMessage(chatId, { text: box('📏 *DISTANCE*', ['💀 Usage: .distance 10 km']), ...ci }, { quoted: m });
      const km = u === 'mi' ? v * 1.60934 : u === 'm' ? v / 1000 : v;
      await sock.sendMessage(chatId, { text: box('📏 *DISTANCE CONVERT*', [`📍 km: *${km.toFixed(3)}*`, `🗺️ miles: *${(km/1.60934).toFixed(3)}*`, `📐 meters: *${(km*1000).toFixed(1)}*`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'age', aliases: ['howold', 'myage'],
    category: 'tools', description: 'Calculate age from birthdate', usage: '.age DD/MM/YYYY',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const parts = (args[0] || '').split('/');
      if (parts.length !== 3) return sock.sendMessage(chatId, { text: box('🎂 *AGE CALCULATOR*', ['💀 Usage: .age DD/MM/YYYY']), ...ci }, { quoted: m });
      const [d, mo, y] = parts.map(Number); const dob = new Date(y, mo-1, d); const now = new Date();
      const age = now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), mo-1, d) ? 1 : 0);
      await sock.sendMessage(chatId, { text: box('🎂 *AGE CALCULATOR*', [`🎈 Age: *${age} years old*`, `📅 DOB: ${d}/${mo}/${y}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'calculator', aliases: ['calc', 'cal', 'compute'],
    category: 'tools', description: 'Evaluate math expression', usage: '.calc <expression>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const expr = args.join(' ');
      if (!expr) return sock.sendMessage(chatId, { text: box('🧮 *CALCULATOR*', ['💀 Usage: .calc 2+2*5']), ...ci }, { quoted: m });
      try {
        const safe = expr.replace(/[^0-9+\-*/.()%^ ]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${safe})`)();
        await sock.sendMessage(chatId, { text: box('🧮 *CALCULATOR*', [`📝 Expression: ${expr}`, `✅ Result: *${result}*`]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('🧮 *CALCULATOR*', ['❌ Invalid expression']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'binary', aliases: ['bin', 'tobinary'],
    category: 'tools', description: 'Convert to/from binary', usage: '.binary <text or number>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const input = args.join(' ');
      if (!input) return sock.sendMessage(chatId, { text: box('💻 *BINARY*', ['💀 Usage: .binary hello']), ...ci }, { quoted: m });
      const isBin = /^[01\s]+$/.test(input);
      if (isBin) {
        const text = input.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
        await sock.sendMessage(chatId, { text: box('💻 *BINARY → TEXT*', [`➤ ${text}`]), ...ci }, { quoted: m });
      } else {
        const bin = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
        await sock.sendMessage(chatId, { text: box('💻 *TEXT → BINARY*', [`➤ ${bin}`]), ...ci }, { quoted: m });
      }
    }
  },
  {
    command: 'hex', aliases: ['tohex', 'hexcode'],
    category: 'tools', description: 'Convert text to hex', usage: '.hex <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' ');
      if (!t) return sock.sendMessage(chatId, { text: box('🔣 *HEX*', ['💀 Usage: .hex hello']), ...ci }, { quoted: m });
      const hex = t.split('').map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
      await sock.sendMessage(chatId, { text: box('🔣 *HEX ENCODE*', [`➤ ${hex}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'morse', aliases: ['morseencode', 'morsecode'],
    category: 'tools', description: 'Encode text to morse code', usage: '.morse <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' ').toUpperCase();
      if (!t) return sock.sendMessage(chatId, { text: box('📡 *MORSE CODE*', ['💀 Usage: .morse hello']), ...ci }, { quoted: m });
      const MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',' ':'/'};
      const code = t.split('').map(c => MAP[c] || '?').join(' ');
      await sock.sendMessage(chatId, { text: box('📡 *MORSE CODE*', [`➤ ${code}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'caesar', aliases: ['rot', 'caesarcipher'],
    category: 'tools', description: 'Caesar cipher encode', usage: '.caesar <shift> <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const shift = parseInt(args[0]) || 13; const t = args.slice(1).join(' ');
      if (!t) return sock.sendMessage(chatId, { text: box('🔐 *CAESAR CIPHER*', ['💀 Usage: .caesar 3 hello']), ...ci }, { quoted: m });
      const enc = t.replace(/[a-z]/gi, c => String.fromCharCode(((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + shift) % 26) + (c <= 'Z' ? 65 : 97)));
      await sock.sendMessage(chatId, { text: box('🔐 *CAESAR CIPHER*', [`🔑 Shift: ${shift}`, `➤ ${enc}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'currency', aliases: ['convert', 'exchange', 'forex'],
    category: 'tools', description: 'Currency converter', usage: '.currency <amount> <FROM> <TO>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const [amt, from, to] = args; const amount = parseFloat(amt);
      if (!amount || !from || !to) return sock.sendMessage(chatId, { text: box('💱 *CURRENCY*', ['💀 Usage: .currency 100 USD KES']), ...ci }, { quoted: m });
      try {
        const r = await axios.get(`https://api.frankfurter.app/latest?from=${from.toUpperCase()}&to=${to.toUpperCase()}`, { timeout: 10000 });
        const rate = r.data?.rates?.[to.toUpperCase()];
        if (!rate) throw new Error('Invalid currency pair');
        await sock.sendMessage(chatId, { text: box('💱 *CURRENCY CONVERT*', [`💰 ${amount} ${from.toUpperCase()}`, `➤ *${(amount*rate).toFixed(4)} ${to.toUpperCase()}*`, `📊 Rate: 1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()}`]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('💱 *CURRENCY*', ['❌ Invalid pair or API unavailable']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'ip', aliases: ['myip', 'ipinfo', 'ipcheck'],
    category: 'tools', description: 'Lookup IP information', usage: '.ip <address>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const ip = args[0] || 'me';
      try {
        const r = await axios.get(`https://ipapi.co/${ip === 'me' ? '' : ip + '/'}json/`, { timeout: 10000 });
        const d = r.data;
        await sock.sendMessage(chatId, { text: box('🌐 *IP LOOKUP*', [`🔍 IP: ${d.ip}`, `🌍 Country: ${d.country_name}`, `🏙️ City: ${d.city}`, `🌐 ISP: ${d.org}`, `📍 Coords: ${d.latitude}, ${d.longitude}`]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('🌐 *IP LOOKUP*', ['❌ Could not fetch IP info']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'dns', aliases: ['dnslookup', 'nslookup'],
    category: 'tools', description: 'DNS lookup for a domain', usage: '.dns <domain>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const domain = args[0]; if (!domain) return sock.sendMessage(chatId, { text: box('🔍 *DNS LOOKUP*', ['💀 Usage: .dns example.com']), ...ci }, { quoted: m });
      try {
        const r = await axios.get(`https://dns.google/resolve?name=${domain}&type=A`, { timeout: 10000 });
        const ips = (r.data?.Answer || []).map(a => a.data).join(', ') || 'No A records';
        await sock.sendMessage(chatId, { text: box('🔍 *DNS LOOKUP*', [`🌐 Domain: ${domain}`, `📍 IPs: ${ips}`]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('🔍 *DNS LOOKUP*', ['❌ Lookup failed']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'whois', aliases: ['domaininfo', 'whoisdomain'],
    category: 'tools', description: 'WHOIS domain lookup', usage: '.whois <domain>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const domain = args[0]; if (!domain) return sock.sendMessage(chatId, { text: box('🕵️ *WHOIS*', ['💀 Usage: .whois example.com']), ...ci }, { quoted: m });
      try {
        const r = await axios.get(`https://api.giftedtech.my.id/api/tools/whois?apikey=gifted&domain=${domain}`, { timeout: 12000 });
        const d = r.data?.result || r.data;
        await sock.sendMessage(chatId, { text: box('🕵️ *WHOIS*', [`🌐 Domain: ${domain}`, `📋 Registrar: ${d?.registrar || 'N/A'}`, `📅 Created: ${d?.created || 'N/A'}`, `📅 Expires: ${d?.expires || 'N/A'}`]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('🕵️ *WHOIS*', [`🌐 ${domain}`, '❌ WHOIS info unavailable']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'hash', aliases: ['md5', 'sha256', 'hashtext'],
    category: 'tools', description: 'Hash text (SHA256/MD5)', usage: '.hash <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' '); if (!t) return sock.sendMessage(chatId, { text: box('🔒 *HASH*', ['💀 Usage: .hash <text>']), ...ci }, { quoted: m });
      const crypto = require('crypto');
      const sha256 = crypto.createHash('sha256').update(t).digest('hex');
      const md5    = crypto.createHash('md5').update(t).digest('hex');
      await sock.sendMessage(chatId, { text: box('🔒 *HASH GENERATOR*', [`🔐 SHA256:\n${sha256}`, `🔑 MD5:\n${md5}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'randomcolor', aliases: ['rcolor', 'colorgen', 'hexcolor'],
    category: 'tools', description: 'Generate random color', usage: '.randomcolor',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      await sock.sendMessage(chatId, { text: box('🎨 *RANDOM COLOR*', [`🎨 HEX: ${hex}`, `🔴 RGB: rgb(${r}, ${g}, ${b})`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'emoji', aliases: ['findemoji', 'emojisearch'],
    category: 'tools', description: 'Find emoji by name', usage: '.emoji <name>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const query = args.join(' ').toLowerCase();
      if (!query) return sock.sendMessage(chatId, { text: box('😀 *EMOJI SEARCH*', ['💀 Usage: .emoji fire']), ...ci }, { quoted: m });
      const emojiMap = { fire:'🔥', skull:'💀', heart:'❤️', star:'⭐', moon:'🌙', sun:'☀️', rain:'🌧️', snow:'❄️', thunder:'⚡', flower:'🌸', tree:'🌲', cat:'🐱', dog:'🐶', snake:'🐍', lion:'🦁', wolf:'🐺', ghost:'👻', robot:'🤖', sword:'⚔️', crown:'👑', diamond:'💎', money:'💰', bomb:'💣', virus:'🦠', alien:'👽' };
      const found = Object.entries(emojiMap).filter(([k]) => k.includes(query)).map(([k,v]) => `${v} ${k}`).slice(0,10);
      await sock.sendMessage(chatId, { text: box('😀 *EMOJI SEARCH*', found.length ? found : ['❌ No emoji found']), ...ci }, { quoted: m });
    }
  },
  {
    command: 'timezone', aliases: ['tz', 'time', 'worldtime'],
    category: 'tools', description: 'Get time in a timezone', usage: '.timezone <City/Region>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const tz = args.join('/') || 'Africa/Nairobi';
      try {
        const t = new Date().toLocaleString('en-GB', { timeZone: tz, hour:'2-digit', minute:'2-digit', second:'2-digit', day:'2-digit', month:'short', year:'numeric' });
        await sock.sendMessage(chatId, { text: box('🌍 *WORLD TIME*', [`🌐 Timezone: ${tz}`, `🕐 Time: *${t}*`]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('🌍 *WORLD TIME*', ['❌ Invalid timezone. Example: .timezone Africa/Nairobi']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'ytinfo', aliases: ['youtubeinfo', 'ytdata'],
    category: 'tools', description: 'Get YouTube video info', usage: '.ytinfo <URL or search>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' '); if (!q) return sock.sendMessage(chatId, { text: box('📺 *YT INFO*', ['💀 Usage: .ytinfo <url or query>']), ...ci }, { quoted: m });
      try {
        const enc = encodeURIComponent(q);
        const r = await axios.get(`https://api.giftedtech.my.id/api/search/ytsearch?apikey=gifted&q=${enc}`, { timeout: 15000 });
        const v = r.data?.result?.[0] || r.data?.data?.[0];
        if (!v) throw new Error('No results');
        await sock.sendMessage(chatId, { text: box('📺 *YOUTUBE INFO*', [`🎬 Title: ${(v.title||'').slice(0,40)}`, `👤 Channel: ${v.author||v.channel||'N/A'}`, `⏱️ Duration: ${v.duration||v.timestamp||'N/A'}`, `👁️ Views: ${v.views||'N/A'}`, `🔗 ${v.url||v.link||''}`]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('📺 *YT INFO*', ['❌ Could not fetch video info']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'joke', aliases: ['jokes', 'funny'],
    category: 'fun', description: 'Get a random joke', usage: '.joke',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      try {
        const r = await axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist', { timeout: 8000 });
        const j = r.data;
        const text = j.type === 'twopart' ? `${j.setup}\n\n${j.delivery}` : j.joke;
        await sock.sendMessage(chatId, { text: box('😂 *JOKE*', [text]), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('😂 *JOKE*', ['Why do programmers prefer dark mode? Because light attracts bugs! 🐛']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'advice', aliases: ['advise', 'lifetip'],
    category: 'fun', description: 'Get random life advice', usage: '.advice',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      try {
        const r = await axios.get('https://api.adviceslip.com/advice', { timeout: 8000 });
        await sock.sendMessage(chatId, { text: box('💡 *LIFE ADVICE*', [r.data?.slip?.advice || 'Keep pushing forward!']), ...ci }, { quoted: m });
      } catch { await sock.sendMessage(chatId, { text: box('💡 *LIFE ADVICE*', ['Stay consistent, success will follow! 🔥']), ...ci }, { quoted: m }); }
    }
  },
  {
    command: 'compliment', aliases: ['compliments', 'nice'],
    category: 'fun', description: 'Get a random compliment', usage: '.compliment',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const list = ['You are absolutely brilliant! ✨','Your energy is contagious! 🔥','You make the world better! 🌟','You are unstoppable! ⚡','Your potential is limitless! 💀','You are a legend! 👑'];
      await sock.sendMessage(chatId, { text: box('💬 *COMPLIMENT*', [list[Math.floor(Math.random()*list.length)]]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'roast', aliases: ['burn', 'savage'],
    category: 'fun', description: 'Get a savage roast', usage: '.roast [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'you';
      const list = [`${target} is so slow, even your internet feels fast! 🐌`,`${target} brings everyone down... to sleep. 😴`,`${target}'s WiFi password is "nocontent". 📶`,`${target} is the reason bots need a block feature. 🚫`,`${target} types ".help" but needs life help. 💀`];
      await sock.sendMessage(chatId, { text: box('🔥 *SAVAGE ROAST*', [list[Math.floor(Math.random()*list.length)]]), mentions: mentioned, ...ci }, { quoted: m });
    }
  },
  {
    command: 'riddle', aliases: ['puzzle', 'brainteaser'],
    category: 'fun', description: 'Get a random riddle', usage: '.riddle',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const riddles = [
        ['I speak without a mouth and hear without ears. What am I?', 'An echo'],
        ['The more you take, the more you leave behind. What am I?', 'Footsteps'],
        ['I have cities but no houses. I have mountains but no trees. What am I?', 'A map'],
        ['What has hands but can not clap?', 'A clock'],
        ['The more you have of it, the less you see. What is it?', 'Darkness'],
      ];
      const [q, a] = riddles[Math.floor(Math.random()*riddles.length)];
      await sock.sendMessage(chatId, { text: box('🧩 *RIDDLE*', [`❓ ${q}`, `\n💡 Answer: ||${a}||`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'would', aliases: ['wyr2', 'wouldyou'],
    category: 'fun', description: 'Would you rather question', usage: '.would',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const list = [['Have super speed','Have super strength'],['Be invisible','Be able to fly'],['Never eat food','Never sleep'],['Know the future','Change the past'],['Live without internet','Live without music']];
      const [a, b] = list[Math.floor(Math.random()*list.length)];
      await sock.sendMessage(chatId, { text: box('🤔 *WOULD YOU RATHER?*', [`🅰️ ${a}`, ``, `🆚`, ``, `🅱️ ${b}`]), ...ci }, { quoted: m });
    }
  },
  {
    command: 'hotornot', aliases: ['rate', 'rater'],
    category: 'fun', description: 'Rate a topic out of 10', usage: '.rate <topic>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const topic = args.join(' ') || 'You'; const score = Math.floor(Math.random()*11);
      const bar = '█'.repeat(score) + '░'.repeat(10-score);
      await sock.sendMessage(chatId, { text: box('🔥 *RATING*', [`📋 Topic: *${topic}*`, `📊 [${bar}] ${score}/10`, score >= 8 ? '🔥 Absolutely fire!' : score >= 5 ? '⚡ Pretty decent!' : '💀 Needs work...']), ...ci }, { quoted: m });
    }
  },
  {
    command: 'spiritanimal', aliases: ['myspirit', 'spirit'],
    category: 'fun', description: 'Find your spirit animal', usage: '.spiritanimal',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const animals = [['🦁 Lion','Bold, fearless, and a natural leader'],['🐺 Wolf','Loyal, instinctive, and a team player'],['🦅 Eagle','Vision, clarity, and high standards'],['🐍 Snake','Wise, patient, and always transforming'],['🐉 Dragon','Powerful, rare, and full of fire'],['🦊 Fox','Clever, adaptable, and always 3 steps ahead']];
      const [animal, trait] = animals[Math.floor(Math.random()*animals.length)];
      await sock.sendMessage(chatId, { text: box('🌟 *SPIRIT ANIMAL*', [`Your spirit animal is: *${animal}*`, `💀 Trait: ${trait}`]), ...ci }, { quoted: m });
    }
  },
];

module.exports = commands;
