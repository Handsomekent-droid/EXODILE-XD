const store = require('../lib/lightweight_store');
const axios = require('axios');

const QUOTE_URLS = [
  'https://raw.githubusercontent.com/ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ/Islamic-Database/main/TXT-DATA/Quotes.txt',
  'https://raw.githubusercontent.com/ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ/Islamic-Database/main/TXT-DATA/Motivational.txt',
  'https://raw.githubusercontent.com/ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ/Islamic-Database/main/TXT-DATA/PickupLines.txt'
];

let cachedQuotes = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchQuotes() {
  try {
    if (cachedQuotes.length > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
      return cachedQuotes;
    }

    const allQuotes = [];

    for (const url of QUOTE_URLS) {
      try {
        const response = await axios.get(url, { timeout: 15000 });
        const lines = response.data
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10);
        
        allQuotes.push(...lines);
      } catch (error) {
      }
    }

    if (allQuotes.length === 0) {
      // Fallback quotes if fetch fails
      return [
        '💎 𝐛𝐲 𝐄𝐱𝐨𝐝𝐢𝐥𝐞 𝐯𝐚𝐮𝐥𝐭 𝐱𝐝 - Your WhatsApp ʙᴏᴛ',
        '🌟 Stay positive, work hard, make it happen.',
        '✨ Believe in yourself and all that you are.',
        '🚀 The future belongs to those who believe in the beauty of their dreams.',
        '💪 success is not final, failure is not fatal.',
        '🎯 Dream big, work hard, stay focused.',
        '⭐ Every day is a new beginning.',
        '🌈 Be the reason someone smiles today.'
      ];
    }

    cachedQuotes = allQuotes;
    lastFetchTime = Date.now();
    
    return allQuotes;
  } catch (error) {
    return cachedQuotes.length > 0 ? cachedQuotes : ['𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐝 - Your WhatsApp ʙᴏᴛ'];
  }
}

function getRandomQuote(quotes) {
  if (!quotes || quotes.length === 0) return '💎 By 𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃';
  return quotes[Math.floor(Math.random() * quotes.length)];
}

async function updateAutoBio(sock) {
  try {
    const autoBioSettings = await _ss.getSetting('global', 'autoBio');
    if (!autoBioSettings?.enabled) return;

    const quotes = await fetchQuotes();
    const randomQuote = getRandomQuote(quotes);
    
    let bio;
    if (autoBioSettings.customBio) {
      bio = autoBioSettings.customBio.replace('{quote}', randomQuote);
    } else {
      bio = `${randomQuote}\n\n🥳𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃`;
    }
    if (bio.length > 139) {
      bio = bio.substring(0, 136) + '...';
    }

    await sock.updateProfileStatus(bio);
  } catch (error) {
  }
}

let autoBioInterval = null;

function startAutoBio(sock) {
  if (autoBioInterval) return;
  fetchQuotes().then(() => {
  });
  autoBioInterval = setInterval(() => {
    updateAutoBio(sock);
  }, 10 * 60 * 1000);
  updateAutoBio(sock);
}
function stopAutoBio() {
  if (autoBioInterval) {
    clearInterval(autoBioInterval);
    autoBioInterval = null;
  }
}

module.exports = {
  command: 'setbio',
  aliases: ['autobio', 'bio'],
  category: 'owner',
  description: 'Set custom WhatsApp bio with random quotes',
  usage: '.setbio <on|off|set|reset>',
  ownerOnly: true,

  async handler(sock, message, args, context = {}) {
    const _ss = sessionStore(sock);
    const chatId = context.chatId || message.key.remoteJid;
    const action = args[0]?.toLowerCase();

    try {
      const autoBioSettings = await _ss.getSetting('global', 'autoBio') || { enabled: false, customBio: null };

      if (!action) {
        const quotes = await fetchQuotes();
        return await sock.sendMessage(chatId, {
          text: `*📝 AUTO BIO SETTINGS*\n\n` +
                `*status:* ${autoBioSettings.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                `*Custom Bio:* ${autoBioSettings.customBio ? 'Set' : 'Default'}\n` +
                `*Quotes Loaded:* ${quotes.length}\n` +
                `*Update Interval:* Every 10 minute\n\n` +
                `*ᴄᴏᴍᴍᴀɴᴅs:*\n` +
                `• \`.setbio on\` - Enable auto bio\n` +
                `• \`.setbio off\` - Disable auto bio\n` +
                `• \`.setbio set <text>\` - Set custom bio\n` +
                `• \`.setbio reset\` - Reset to default bio\n` +
                `• \`.setbio preview\` - Preview random quote\n\n` +
                `*Default Bio:*\n{quote}\n💎😇𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃\n\n` +
                `*Custom Bio:*\n${autoBioSettings.customBio || 'Not set'}\n\n` +
                `*Note:* Use \`{quote}\` in custom bio to insert random quotes.\n\n` +
                `*Sources:*\n• Famous Quotes\n• Motivational Quotes\n• Pickup Lines`
        }, { quoted: message });
      }

      if (action === 'preview') {
        const quotes = await fetchQuotes();
        const randomQuote = getRandomQuote(quotes);
        return await sock.sendMessage(chatId, {
          text: `*📝 Preview Quote*\n\n${randomQuote}\n\n😎𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃\n\n_This is how your bio will look with random quotes_`
        }, { quoted: message });
      }

      if (action === 'on') {
        if (autoBioSettings.enabled) {
          return await sock.sendMessage(chatId, {
            text: '⚠️ *Auto bio is already enabled*'
          }, { quoted: message });
        }

        autoBioSettings.enabled = true;
        await _ss.saveSetting('global', 'autoBio', autoBioSettings);
        startAutoBio(sock);

        return await sock.sendMessage(chatId, {
          text: '✅ *Auto bio enabled!*\n\nYour bio will now update every 1 minute with random quotes from:\n• Islamic Quotes\n• Motivational Quotes\n• Pickup Lines'
        }, { quoted: message });
      }

      if (action === 'off') {
        if (!autoBioSettings.enabled) {
          return await sock.sendMessage(chatId, {
            text: '⚠️ *Auto bio is already disabled*'
          }, { quoted: message });
        }

        autoBioSettings.enabled = false;
        await _ss.saveSetting('global', 'autoBio', autoBioSettings);
        stopAutoBio();

        return await sock.sendMessage(chatId, {
          text: '❌ *Auto bio disabled!*\n\nYour bio will no longer auto-update.'
        }, { quoted: message });
      }

      if (action === 'set') {
        let customBio = null;
        
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted) {
          customBio = quoted.conversation || 
                     quoted.extendedTextMessage?.text || 
                     null;
        } else {
          customBio = args.slice(1).join(' ').trim();
        }

        if (!customBio) {
          return await sock.sendMessage(chatId, {
            text: '❌ *ᴘʟᴇᴀsᴇ provide bio text!*\n\n*Usage:*\n• `.setbio set Your bio here`\n• Reply to a message with `.setbio set`\n\n*Tip:* Use `{quote}` to insert random quotes in your bio.'
          }, { quoted: message });
        }

        autoBioSettings.customBio = customBio;
        await _ss.saveSetting('global', 'autoBio', autoBioSettings);

        if (autoBioSettings.enabled) {
          await updateAutoBio(sock);
        }

        return await sock.sendMessage(chatId, {
          text: `✅ *Custom bio set!*\n\n*Your bio:*\n${customBio}\n\n${autoBioSettings.enabled ? '✅ Auto bio is enabled - Bio updated!' : '⚠️ Auto bio is disabled - Use `.setbio on` to enable'}`
        }, { quoted: message });
      }

      if (action === 'reset') {
        autoBioSettings.customBio = null;
        await _ss.saveSetting('global', 'autoBio', autoBioSettings);

        if (autoBioSettings.enabled) {
          await updateAutoBio(sock);
        }

        return await sock.sendMessage(chatId, {
          text: '✅ *Bio reset to default!*\n\n*Default bio:*\n{quote}\n👺𝐄𝐗𝐎𝐃𝐈𝐋𝐄 𝐗𝐃'
        }, { quoted: message });
      }

      return await sock.sendMessage(chatId, {
        text: '❌ *Invalid ᴄᴏᴍᴍᴀɴᴅ!*\n\nUse `.setbio` to see available options.'
      }, { quoted: message });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, {
        text: `❌ *ᴇʀʀᴏʀ:* ${error.message}`
      }, { quoted: message });
    }
  },

  startAutoBio,
  stopAutoBio,
  updateAutoBio
};

