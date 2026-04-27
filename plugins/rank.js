const store = require('../lib/lightweight_store')

/**
 * Increment message count for a user in a chat
 * Now uses the unified store system (backward compatible)
 */
async function incrementMessageCount(chatId, userId) {
    try {
        await store.incrementMessageCount(chatId, userId)
    } catch (error) {
        console.error(error)
    }
}

/**
 * Load all message counts (backward compatible)
 * Returns same format as old JSON file
 */
async function loadMessageCounts() {
    try {
        const data = await store.getAllMessageCounts()
        return data.messageCount || {}
    } catch (error) {
        console.error(error)
        return {}
    }
}

/**
 * Save message counts (backward compatible, but now a no-op)
 * Data is auto-saved by the store system
 */
function saveMessageCounts(messageCounts) {
    console.log('[RANK] saveMessageCounts called (no-op - auto-saved by store)')
}

module.exports = {
    command: 'rank',
    aliases: ['top', 'topusers', 'leaderboard', 'ranks'],
    category: 'group',
    description: 'Show top 5 most active members based on message count',
    usage: '.rank',
    groupOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid
        
        try {
            const messageCounts = await loadMessageCounts()
            const ɢʀᴏᴜᴘCounts = messageCounts[chatId] || {}

            const sortedMembers = Object.entries(ɢʀᴏᴜᴘCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)

            if (sortedMembers.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '📊 *No message activity recorded yet*\n\nStart chatting to appear on the leaderboard!'
                }, { quoted: message })
                return
            }

            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
            let messageText = '🏆 *TOP MEMBERS LEADERBOARD*\n\n'
            
            sortedMembers.forEach(([userId, count], index) => {
                const username = userId.split('@')[0]
                messageText += `${medals[index]} @${username}\n💬 ${count} messages\n\n`
            })

            messageText += '_Keep chatting to climb the ranks!_'

            await sock.sendMessage(chatId, {
                text: messageText,
                mentions: sortedMembers.map(([userId]) => userId)
            }, { quoted: message })
            
        } catch (error) {
            console.error(error)
            await sock.sendMessage(chatId, {
                text: '❌ ꜰᴀɪʟᴇᴅ to load leaderboard. ᴘʟᴇᴀsᴇ try again later.'
            }, { quoted: message })
        }
    },

    incrementMessageCount,
    loadMessageCounts,
    saveMessageCounts
}


/*
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data', 'messageCount.json');

function loadMessageCounts() {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath);
        return JSON.parse(data);
    }
    return {};
}

function saveMessageCounts(messageCounts) {
    fs.writeFileSync(dataFilePath, JSON.stringify(messageCounts, null, 2));
}

function incrementMessageCount(groupId, userId) {
    const messageCounts = loadMessageCounts();

    if (!messageCounts[groupId]) {
        messageCounts[groupId] = {};
    }

    if (!messageCounts[groupId][userId]) {
        messageCounts[groupId][userId] = 0;
    }

    messageCounts[groupId][userId] += 1;

    saveMessageCounts(messageCounts);
}

module.exports = {
    command: 'rank',
    aliases: ['top', 'topusers', 'leaderboard', 'ranks'],
    category: 'group',
    description: 'Show top 5 most active members based on message count',
    usage: '.rank',
    groupOnly: true,

    async handler(sock, message, args, context = {}) {
        const chatId = context.chatId || message.key.remoteJid;
        
        const messageCounts = loadMessageCounts();
        const ɢʀᴏᴜᴘCounts = messageCounts[chatId] || {};

        const sortedMembers = Object.entries(ɢʀᴏᴜᴘCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        if (sortedMembers.length === 0) {
            await sock.sendMessage(chatId, {
                text: '📊 *No message activity recorded yet*\n\nStart chatting to appear on the leaderboard!'
            }, { quoted: message });
            return;
        }

        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        let messageText = '🏆 *TOP MEMBERS LEADERBOARD*\n\n';
        
        sortedMembers.forEach(([userId, count], index) => {
            const username = userId.split('@')[0];
            messageText += `${medals[index]} @${username}\n💬 ${count} messages\n\n`;
        });

        messageText += '_Keep chatting to climb the ranks!_';

        await sock.sendMessage(chatId, {
            text: messageText,
            mentions: sortedMembers.map(([userId]) => userId)
        }, { quoted: message });
    },

    incrementMessageCount,
    loadMessageCounts,
    saveMessageCounts
};
*/

