'use strict';
const { sessionStore } = require('../lib/sessionStore');
const isOwnerOrSudo = require('../lib/isOwner');
const store = require('../lib/lightweight_store');
const { cleanJid } = require('../lib/isOwner');
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'settings',
  aliases: ['config', 'setting', 'panel', 'systempanel'],
  category: 'owner',
  ownerOnly: true,
  description: 'Show full bot system panel & config',
  usage: '.settings',

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId   = context.chatId || message.key.remoteJid;
    const senderId = message.key.participant || message.key.remoteJid;
    const ci       = getChannelInfo();

    try {
      const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
      if (!message.key.fromMe && !isOwner) {
        return sock.sendMessage(chatId, { text: '❌ *Access Denied:* Only owner/sudo can view settings.' }, { quoted: message });
      }

      const isGroup  = chatId.endsWith('@g.us');
      const botMode  = await _ss.getBotMode();
      const allSettings = await store.getAllSettings('global');

      const autostatus   = allSettings?.autostatus   || { enabled: false };
      const autoread     = allSettings?.autoread     || { enabled: false };
      const autotyping   = allSettings?.autotyping   || { enabled: false };
      const pmblocker    = allSettings?.pmblocker    || { enabled: false };
      const anticall     = allSettings?.anticall     || { enabled: false };
      const autoReaction = allSettings?.autoReaction || false;
      const antidelete   = allSettings?.antidelete   || { enabled: false };
      const alwaysonline = allSettings?.alwaysonline || { enabled: false };
      const autoread2    = allSettings?.autoReadStatus || { enabled: false };

      const upSec = Math.floor(process.uptime());
      const d  = Math.floor(upSec / 86400);
      const h  = Math.floor((upSec % 86400) / 3600);
      const mn = Math.floor((upSec % 3600) / 60);
      const s  = upSec % 60;
      const uptime = [d && `${d}d`, h && `${h}h`, mn && `${mn}m`, `${s}s`].filter(Boolean).join(' ');
      const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);

      const on  = v => v ? '✅' : '❌';

      let txt = '';
      txt += `╔═══════════════════════╗\n`;
      txt += `║  💀 *EXODILE XD — SYSTEM PANEL*  ║\n`;
      txt += `╚═══════════════════════╝\n\n`;

      txt += `┌─〔 ⚙️ *BOT STATUS* 〕\n`;
      txt += `│ 👤 User: @${cleanJid(senderId)}\n`;
      txt += `│ 🤖 Mode: *${botMode.toUpperCase()}*\n`;
      txt += `│ ⏱️ Uptime: ${uptime}\n`;
      txt += `│ 💾 RAM: ${ram}MB\n`;
      txt += `│ 🔋 Node: ${process.version}\n`;
      txt += `│ 🔖 Version: v${require('../settings').version}\n`;
      txt += `└──────────────────────\n\n`;

      txt += `┌─〔 🌐 *GLOBAL CONFIG* 〕\n`;
      txt += `│ ${on(autostatus?.enabled)} Auto Status\n`;
      txt += `│ ${on(autoread?.enabled)} Auto Read\n`;
      txt += `│ ${on(autotyping?.enabled)} Auto Typing\n`;
      txt += `│ ${on(pmblocker?.enabled)} PM Blocker\n`;
      txt += `│ ${on(anticall?.enabled)} Anti Call\n`;
      txt += `│ ${on(autoReaction)} Auto Reaction\n`;
      txt += `│ ${on(antidelete?.enabled)} Anti Delete\n`;
      txt += `│ ${on(alwaysonline?.enabled)} Always Online\n`;
      txt += `│ ${on(autoread2?.enabled)} Auto View Status\n`;
      txt += `└──────────────────────\n\n`;

      if (isGroup) {
        const gs = await store.getAllSettings(chatId);
        const antilink   = gs?.antilink     || { enabled: false };
        const badword    = gs?.antibadword  || { enabled: false };
        const antitag    = gs?.antitag      || { enabled: false };
        const chatbot    = gs?.chatbot      || false;
        const welcome    = gs?.welcome      || false;
        const goodbye    = gs?.goodbye      || false;
        const antimentn  = gs?.antigroupmention || { enabled: false };
        const antibot    = gs?.antibot      || { enabled: false };
        const antidemote  = gs?.antidemote  || { enabled: false };
        const antipromote = gs?.antipromote || { enabled: false };
        const antispam    = (await _ss.getSetting('global', 'antispam')) || { enabled: false };

        txt += `┌─〔 👥 *GROUP CONFIG* 〕\n`;
        txt += `│ ${on(antilink?.enabled)} Antilink\n`;
        txt += `│ ${on(badword?.enabled)} Antibadword\n`;
        txt += `│ ${on(antitag?.enabled)} Antitag\n`;
        txt += `│ ${on(antimentn?.enabled)} Anti Group Mention\n`;
        txt += `│ ${on(antibot?.enabled)} Anti-Bot\n`;
        txt += `│ ${on(antidemote?.enabled)} Anti-Demote\n`;
        txt += `│ ${on(antipromote?.enabled)} Anti-Promote\n`;
        txt += `│ ${on(antispam?.enabled)} Anti-Spam\n`;
        txt += `│ ${on(chatbot)} Chatbot\n`;
        txt += `│ ${on(welcome)} Welcome\n`;
        txt += `│ ${on(goodbye)} Goodbye\n`;
        txt += `└──────────────────────\n\n`;
      }

      txt += `┌─〔 🆕 *NEW FEATURES v2.0* 〕\n`;
      txt += `│ ✅ Auto View-Once: .autoviewonce on/off — saves to DM\n`;
      txt += `│ ✅ Keith API — Primary source (36+ endpoints)\n`;
      txt += `│ ✅ AI: .ai .chatbot — GPT4 + Gemini + Llama\n`;
      txt += `│ ✅ Downloads: YT · TikTok · IG · Twitter · FB · SC\n`;
      txt += `│ ✅ Music: .music .play .soundcloud — Keith primary\n`;
      txt += `│ ✅ APK: .apk .apkdl — Keith /search/apk endpoint\n`;
      txt += `│ ✅ Image Search: .gimage — Keith Google Images\n`;
      txt += `│ ✅ Stalker: .igstalk .ttstalk .twitterstalk .githubstalk\n`;
      txt += `│ ✅ Fun: .truth .dare .fact .joke .insult .meme .quote\n`;
      txt += `│ ✅ Sports: .footballnews .livescores — Keith live data\n`;
      txt += `│ ✅ Link Shortener: .shortlink — Keith TinyURL+Bitly\n`;
      txt += `│ ✅ Lyrics: .lyrics — Keith multi-source\n`;
      txt += `│ ✅ Group: .listactive .listinactive .listonline\n`;
      txt += `│ ✅ Owner Protection: kick/demote can't affect owner\n`;
      txt += `│ ✅ Welcome/Goodbye — now properly tags @users\n`;
      txt += `│ ✅ Message limit: Infinity (no more stop-replying)\n`;
      txt += `│ ✅ Settings persist across bot restarts\n`;
      txt += `│ ✅ .add (gcadd) — logout bug fixed\n`;
      txt += `└──────────────────────\n\n`;

      txt += `┌─〔 📋 *QUICK COMMANDS* 〕\n`;
      txt += `│ .menu — full command list\n`;
      txt += `│ .groupmenu — group commands\n`;
      txt += `│ .adminmenu — admin commands\n`;
      txt += `│ .downloadmenu — download cmds\n`;
      txt += `│ .imagemenu — image commands\n`;
      txt += `│ .mode public/private/groups/inbox/self\n`;
      txt += `│ .self — owner-only mode\n`;
      txt += `│ .public — open bot to everyone\n`;
      txt += `│ .antispam on/off — spam protection\n`;
      txt += `│ .antidemote on/off — demote guard\n`;
      txt += `│ .antipromote on/off — promote guard\n`;
      txt += `│ .setgstatus — post media to status\n`;
      txt += `│ .autoviewonce on/off — save view-once\n`;
      txt += `│ .autostatus on/off — auto view statuses\n`;
      txt += `│ .setprefix <symbol> — change prefix\n`;
      txt += `│ .reload — reload all plugins\n`;
      txt += `│ .cleartmp — clear temp files\n`;
      txt += `└──────────────────────\n`;
      txt += `> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧`;

      await sock.sendMessage(chatId, {
        image: { url: 'https://i.postimg.cc/59sJ2MQp/IMG-20251217-WA0158.jpg' },
        caption: txt,
        mentions: [senderId],
        ...ci
      }, { quoted: message });

    } catch (e) {
      console.error('[settings]', e?.message);
      await sock.sendMessage(chatId, { text: '❌ Failed to load settings panel.' }, { quoted: message });
    }
  }
};
