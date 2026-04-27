'use strict';
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
const { execSync, spawn } = require('child_process');
const os   = require('os');
const fss  = require('fs');

/**
 * Convert a GIF buffer → MP4 buffer using ffmpeg.
 * WhatsApp requires real MP4 for gifPlayback — sending a GIF buffer
 * with mimetype video/mp4 produces an unplayable file.
 */
async function gifToMp4(gifBuf) {
  const tmp   = os.tmpdir();
  const inF   = `${tmp}/xd_gif_${Date.now()}.gif`;
  const outF  = `${tmp}/xd_gif_${Date.now()}.mp4`;
  try {
    fss.writeFileSync(inF, gifBuf);
    execSync(
      `ffmpeg -y -i "${inF}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outF}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
    const mp4 = fss.readFileSync(outF);
    return mp4;
  } catch { return null; }
  finally {
    try { fss.unlinkSync(inF); } catch {}
    try { fss.unlinkSync(outF); } catch {}
  }
}


// ── GIF sticker helper ──────────────────────────────────────────
// nekos.best API — returns animated gif per action type
const NEKO_ACTIONS = {
  hug:   'hug',   kiss:  'kiss',  slap:  'slap',
  punch: 'punch', pat:   'pat',   wave:  'wave',
  cry:   'cry',   dance: 'dance', laugh: 'laugh',
  blush: 'blush', poke:  'poke',  kill:  'kick',
  bite:  'bite',  cuddle:'cuddle',lick:  'lick',
};

async function getActionGif(action) {
  try {
    const type = NEKO_ACTIONS[action] || action;
    const r = await axios.get(`https://nekos.best/api/v2/${type}?amount=1`, { timeout: 10000 });
    const url = r.data?.results?.[0]?.url;
    if (url) {
      const gif = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
      return Buffer.from(gif.data);
    }
  } catch {}
  // fallback: waifu.pics
  try {
    const type = NEKO_ACTIONS[action] || 'hug';
    const r = await axios.post(`https://api.waifu.pics/sfw/${type}`, {}, { timeout: 10000 });
    const url = r.data?.url;
    if (url) {
      const gif = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
      return Buffer.from(gif.data);
    }
  } catch {}
  return null;
}

// ── send sticker gif + caption ──────────────────────────────────
async function sendActionSticker(sock, chatId, m, ci, action, caption, mentioned) {
  const gifBuf = await getActionGif(action);
  if (gifBuf) {
    // Convert GIF → MP4 so WhatsApp can play it with gifPlayback
    const mp4 = await gifToMp4(gifBuf);
    if (mp4) {
      try {
        await sock.sendMessage(chatId, {
          video: mp4, mimetype: 'video/mp4', gifPlayback: true,
          caption: caption + FOOTER, mentions: mentioned, ...ci
        }, { quoted: m });
        return;
      } catch {}
    }
    // Fallback: send raw GIF as document (always openable)
    try {
      await sock.sendMessage(chatId, {
        document: gifBuf, mimetype: 'image/gif',
        fileName: `${action}.gif`,
        caption: caption + FOOTER, mentions: mentioned, ...ci
      }, { quoted: m });
      return;
    } catch {}
  }
  await sock.sendMessage(chatId, {
    text: caption + FOOTER, mentions: mentioned, ...ci
  }, { quoted: m });
}

function getTarget(m) {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const target = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'you';
  return { mentioned, target };
}

module.exports = [
  { command: 'hug', aliases: ['hugging'], category: 'fun', description: 'hug someone — sends gif sticker', usage: '.hug [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'hug', `💝 hugging ${target} tight!`, mentioned);
    }},
  { command: 'kiss', aliases: ['kissing'], category: 'fun', description: 'kiss someone — sends gif sticker', usage: '.kiss [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'kiss', `💋 kissing ${target}!`, mentioned);
    }},
  { command: 'slap', aliases: ['slapping'], category: 'fun', description: 'slap someone — sends gif sticker', usage: '.slap [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'slap', `👋 *SLAP!* — ${target} got slapped!`, mentioned);
    }},
  { command: 'punch', aliases: ['punching'], category: 'fun', description: 'punch someone — sends gif sticker', usage: '.punch [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'punch', `👊 *POW!* — ${target} got punched!`, mentioned);
    }},
  { command: 'pat', aliases: ['patting'], category: 'fun', description: 'pat someone — sends gif sticker', usage: '.pat [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'pat', `🥺 patting ${target} gently`, mentioned);
    }},
  { command: 'wave', aliases: ['waving'], category: 'fun', description: 'wave at someone — sends gif sticker', usage: '.wave [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'wave', `👋 waving at ${target}!`, mentioned);
    }},
  { command: 'wink', aliases: ['winking'], category: 'fun', description: 'wink at someone', usage: '.wink [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `😉 winking at ${target}` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'blush', aliases: ['blushing'], category: 'fun', description: 'blush reaction', usage: '.blush [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'blush', `😳 blushing because of ${target}`, mentioned);
    }},
  { command: 'cry', aliases: ['crying'], category: 'fun', description: 'cry reaction — sends gif sticker', usage: '.cry [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'cry', `😭 ${target} made me cry!`, mentioned);
    }},
  { command: 'laugh', aliases: ['laughing'], category: 'fun', description: 'laugh reaction — sends gif sticker', usage: '.laugh [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'laugh', `😂 ${target} — HAHAHA!`, mentioned);
    }},
  { command: 'facepalm', aliases: ['fp'], category: 'fun', description: 'facepalm reaction', usage: '.facepalm [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `🤦 ${target} — *facepalm*` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'shrug', aliases: ['shrugit'], category: 'fun', description: 'shrug reaction', usage: '.shrug [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `🤷 ${target} — ¯\\_(ツ)_/¯` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'thumbsup', aliases: ['thumbup'], category: 'fun', description: 'thumbs up', usage: '.thumbsup [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `👍 ${target} — approved!` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'thumbsdown', aliases: ['thumbdown'], category: 'fun', description: 'thumbs down', usage: '.thumbsdown [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `👎 ${target} — nope!` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'clap', aliases: ['clapping'], category: 'fun', description: 'clap reaction', usage: '.clap [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `👏 ${target} — clap clap clap!` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'bow', aliases: ['bowing'], category: 'fun', description: 'bow respectfully', usage: '.bow [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `🙇 ${target} — bowing deeply` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'dance', aliases: ['dancing'], category: 'fun', description: 'dance reaction — gif sticker', usage: '.dance [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'dance', `💃 ${target} — let's dance!`, mentioned);
    }},
  { command: 'celebrate', aliases: ['congrats'], category: 'fun', description: 'celebration reaction', usage: '.celebrate [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `🎉 ${target} — congratulations! 🎊` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'rage', aliases: ['angry'], category: 'fun', description: 'rage reaction', usage: '.rage [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `😡 ${target} — ARGHHH! 💢` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'love', aliases: ['iloveyou'], category: 'fun', description: 'love reaction', usage: '.love [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'cuddle', `❤️ sending love to ${target}!`, mentioned);
    }},
  { command: 'highfive', aliases: ['hi5'], category: 'fun', description: 'high five reaction', usage: '.highfive [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `✋ ${target} — high five!` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'fist', aliases: ['fistbump'], category: 'fun', description: 'fist bump reaction', usage: '.fist [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `✊ ${target} — fist bump! 💥` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'stare', aliases: ['staring'], category: 'fun', description: 'stare intensely', usage: '.stare [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `👀 staring into ${target}'s soul...` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'smirk', aliases: ['smirking'], category: 'fun', description: 'smirk reaction', usage: '.smirk [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `😏 ${target} — *smirks*` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'think', aliases: ['thinking'], category: 'fun', description: 'thinking reaction', usage: '.think',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, { text: `🤔 hmmmm...` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'shock', aliases: ['shocked'], category: 'fun', description: 'shocked reaction', usage: '.shock [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `😱 ${target} — OMG WHAT!?` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'cringe', aliases: ['cringeworthy'], category: 'fun', description: 'cringe reaction', usage: '.cringe [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `😬 ${target} — *cringes*` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'chill', aliases: ['chilling'], category: 'fun', description: 'chill vibe', usage: '.chill',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, { text: `😎 just vibing...` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'dead', aliases: ['deadinside'], category: 'fun', description: 'dead inside reaction', usage: '.dead',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, { text: `💀 im dead. absolutely dead.` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'yawn', aliases: ['sleepy'], category: 'fun', description: 'yawn reaction', usage: '.yawn',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      await sock.sendMessage(chatId, { text: `😴 *yawns* so boring...` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'flex', aliases: ['flexing'], category: 'fun', description: 'flex on them', usage: '.flex [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `💪 ${target} — look at these gains! 🔥` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'ghost', aliases: ['ghosting'], category: 'fun', description: 'ghost someone', usage: '.ghost [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `👻 ${target} — poof! ghosted. 👻` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'sus', aliases: ['suspicious'], category: 'fun', description: 'sus reaction', usage: '.sus [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `🤨 ${target} seems very sus...` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'bye', aliases: ['goodbye'], category: 'fun', description: 'bye reaction', usage: '.bye [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sock.sendMessage(chatId, { text: `👋 ${target} — goodbye! 👋` + FOOTER, mentions: mentioned, ...ci }, { quoted: m });
    }},
  { command: 'bite', aliases: ['biting'], category: 'fun', description: 'bite someone — gif sticker', usage: '.bite [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'bite', `😈 biting ${target}!`, mentioned);
    }},
  { command: 'poke', aliases: ['poking'], category: 'fun', description: 'poke someone — gif sticker', usage: '.poke [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'poke', `👉 poking ${target}!`, mentioned);
    }},
  { command: 'lick', aliases: ['licking'], category: 'fun', description: 'lick reaction — gif sticker', usage: '.lick [@user]',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const { mentioned, target } = getTarget(m);
      await sendActionSticker(sock, chatId, m, ci, 'lick', `👅 licking ${target} lol`, mentioned);
    }},
  // ── text tools ─────────────────────────────────────────────────
  { command: 'bold', aliases: ['makebold'], category: 'tools', description: 'make text bold', usage: '.bold <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' ');
      await sock.sendMessage(chatId, { text: `*${t}*` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'italic', aliases: ['makeitalic'], category: 'tools', description: 'italic text', usage: '.italic <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' ');
      await sock.sendMessage(chatId, { text: `_${t}_` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'strikethrough', aliases: ['strike'], category: 'tools', description: 'strikethrough text', usage: '.strikethrough <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' ');
      await sock.sendMessage(chatId, { text: `~${t}~` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'monospace', aliases: ['mono'], category: 'tools', description: 'monospace text', usage: '.mono <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' ');
      await sock.sendMessage(chatId, { text: `\`\`\`${t}\`\`\`` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'clap2', aliases: ['claptext'], category: 'tools', description: 'add claps between words', usage: '.clap2 <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join('👏').toUpperCase();
      await sock.sendMessage(chatId, { text: t + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'spongebob', aliases: ['mocking'], category: 'tools', description: 'mocking spongebob text', usage: '.spongebob <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const t = args.join(' ').split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
      await sock.sendMessage(chatId, { text: t + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'bubble', aliases: ['circletext'], category: 'tools', description: 'circle bubble text', usage: '.bubble <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const MAP = 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ';
      const t = args.join(' ').toLowerCase().split('').map(c => c >= 'a' && c <= 'z' ? MAP[c.charCodeAt(0) - 97] : c).join('');
      await sock.sendMessage(chatId, { text: t + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'zalgo', aliases: ['glitchtext2'], category: 'tools', description: 'zalgo glitch text', usage: '.zalgo <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const cc = [768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780];
      const t = args.join(' ').split('').map(c => {
        let r = c; const n = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < n; i++) r += String.fromCharCode(cc[Math.floor(Math.random() * cc.length)]);
        return r;
      }).join('');
      await sock.sendMessage(chatId, { text: t.slice(0, 200) + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'encode64', aliases: ['base642'], category: 'tools', description: 'base64 encode', usage: '.encode64 <text>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const e = Buffer.from(args.join(' ')).toString('base64');
      await sock.sendMessage(chatId, { text: `🔒 \`${e}\`` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'decode64', aliases: ['base64dec2'], category: 'tools', description: 'base64 decode', usage: '.decode64 <base64>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      try {
        const d = Buffer.from(args.join(' '), 'base64').toString('utf8');
        await sock.sendMessage(chatId, { text: `🔓 ${d}` + FOOTER, ...ci }, { quoted: m });
      } catch {
        await sock.sendMessage(chatId, { text: `◈ invalid base64` + FOOTER, ...ci }, { quoted: m });
      }
    }},
  // ── search shortcuts ───────────────────────────────────────────
  { command: 'ddg', aliases: ['duckduckgo'], category: 'search', description: 'duckduckgo search', usage: '.ddg <query>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' ');
      if (!q) return sock.sendMessage(chatId, { text: `◈ usage: .ddg <query>` + FOOTER, ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: `🔍 *${q}*\nhttps://duckduckgo.com/?q=${encodeURIComponent(q)}` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'maps', aliases: ['googlemaps'], category: 'search', description: 'google maps search', usage: '.maps <location>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' ');
      if (!q) return sock.sendMessage(chatId, { text: `◈ usage: .maps <location>` + FOOTER, ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: `📍 *${q}*\nhttps://maps.google.com/?q=${encodeURIComponent(q)}` + FOOTER, ...ci }, { quoted: m });
    }},
  { command: 'playstore', aliases: ['appsearch'], category: 'search', description: 'search play store', usage: '.playstore <app>',
    async handler(sock, m, args, ctx = {}) {
      const ci = getChannelInfo(); const chatId = ctx.chatId || m.key.remoteJid;
      const q = args.join(' ');
      if (!q) return sock.sendMessage(chatId, { text: `◈ usage: .playstore <app>` + FOOTER, ...ci }, { quoted: m });
      await sock.sendMessage(chatId, { text: `📱 *${q}*\nhttps://play.google.com/store/search?q=${encodeURIComponent(q)}` + FOOTER, ...ci }, { quoted: m });
    }},
];
