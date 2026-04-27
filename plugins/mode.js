const { denyIfNotStrictOwner } = require('../lib/strictOwner');
const store = require('../lib/lightweight_store')

/**
 * Advanced bot mode system with multiple access control options
 * Modes:
 * - public: Everyone can use (ɢʀᴏᴜᴘs + private)
 * - private: ᴏᴡɴᴇʀ/sudo only
 * - ɢʀᴏᴜᴘs: Only works in ɢʀᴏᴜᴘs (everyone in ɢʀᴏᴜᴘs)
 * - inbox: Only works in private chats (everyone in DM)
 * - self: ᴏᴡɴᴇʀ/sudo only (alias for private)
 */
async function modeCommand(sock, message, args, context) {
    const { chatId, channelInfo } = context
    
    if (await denyIfNotStrictOwner(sock, message, chatId)) return;

    const subcmd = args[0]?.toLowerCase()
    const currentMode = await _ss.getBotMode() || 'public'

    if (!subcmd || subcmd === 'status' || subcmd === 'check') {
        const modeEmojis = {
            public: '🌍',
            private: '🔒',
            ɢʀᴏᴜᴘs: '👥',
            inbox: '💬',
            self: '👤'
        }

        const modeDescriptions = {
            public: 'Everyone can use bot (ɢʀᴏᴜᴘs + private chats)',
            private: 'Only ᴏᴡɴᴇʀ and sudo users can use bot',
            ɢʀᴏᴜᴘs: 'Only works in ɢʀᴏᴜᴘ chats (everyone in ɢʀᴏᴜᴘs)',
            inbox: 'Only works in private chats (everyone in DMs)',
            self: 'ᴏᴡɴᴇʀ and sudo only (same as private)'
        }

        let statusText = `📊 *BOT MODE STATUS*\n\n`
        statusText += `Current Mode: ${modeEmojis[currentMode]} *${currentMode.toUpperCase()}*\n`
        statusText += `Description: ${modeDescriptions[currentMode]}\n\n`
        statusText += `━━━━━━━━━━━━━━━━━━━━\n\n`
        statusText += `*Available Modes:*\n\n`
        
        Object.entries(modeDescriptions).forEach(([mode, desc]) => {
            const current = mode === currentMode ? '✓ ' : ''
            statusText += `${current}${modeEmojis[mode]} \`${mode}\`\n${desc}\n\n`
        })

        statusText += `*Usage:*\n`
        statusText += `• \`.mode <mode>\` - Change mode\n`
        statusText += `• \`.mode status\` - Show current mode\n\n`
        statusText += `*Examples:*\n`
        statusText += `• \`.mode public\` - Enable for everyone\n`
        statusText += `• \`.mode ɢʀᴏᴜᴘs\` - ɢʀᴏᴜᴘs only\n`
        statusText += `• \`.mode inbox\` - Private chats only\n`
        statusText += `• \`.mode private\` - ᴏᴡɴᴇʀ/sudo only`

        return await sock.sendMessage(chatId, {
            text: statusText,
            ...channelInfo
        }, { quoted: message })
    }

    const validModes = ['public', 'private', 'groups', 'inbox', 'self']
    
    if (!validModes.includes(subcmd)) {
        return await sock.sendMessage(chatId, {
            text: `❌ Invalid mode: *${subcmd}*\n\nValid modes: ${validModes.join(', ')}\n\nUse \`.mode\` to see all available modes.`,
            ...channelInfo
        }, { quoted: message })
    }

    await _ss.setBotMode(subcmd)

    const modeEmojis = {
        public: '🌍',
        private: '🔒',
        ɢʀᴏᴜᴘs: '👥',
        inbox: '💬',
        self: '👤'
    }

    const modeMessages = {
        public: 'ʙᴏᴛ is now accessible to *everyone* in ɢʀᴏᴜᴘs and private chats.',
        private: 'ʙᴏᴛ is now restricted to *ᴏᴡɴᴇʀ and sudo users only*.',
        ɢʀᴏᴜᴘs: 'ʙᴏᴛ now works *only in ɢʀᴏᴜᴘ chats* (all ɢʀᴏᴜᴘ members can use it).',
        inbox: 'ʙᴏᴛ now works *only in private chats* (all users can DM the bot).',
        self: 'ʙᴏᴛ is now restricted to *ᴏᴡɴᴇʀ and sudo users only*.'
    }

    await sock.sendMessage(chatId, {
        text: `${modeEmojis[subcmd]} *Mode Changed to ${subcmd.toUpperCase()}*\n\n${modeMessages[subcmd]}\n\n_Use \`.mode status\` to check current mode._`,
        ...channelInfo
    }, { quoted: message })
}

module.exports = {
    command: 'mode',
    aliases: ['botmode', 'setmode'],
    category: 'owner',
    description: 'Advanced bot access control - Set who can use the bot and where',
    usage: '.mode [public|private|ɢʀᴏᴜᴘs|inbox|self|status]',
    ownerOnly: true,
    handler: modeCommand
}

