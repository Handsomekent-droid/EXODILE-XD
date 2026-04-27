const settings = require('../settings');
const { isSudo } = require('./index');

function cleanJid(jid) {
    if (!jid) return '';
    return jid.split(':')[0].split('@')[0];
}

// All numbers that count as "owner" for isOwnerOrSudo checks
function getOwnerNumbers() {
    const nums = new Set();
    // primary owner
    if (settings.ownerNumber) nums.add(cleanJid(settings.ownerNumber));
    // creator numbers (includes 254784747151, 254704320190)
    (settings.creatorNumbers || []).forEach(n => nums.add(n.replace(/\D/g, '')));
    // aura / extra numbers (includes 254740340897 if added via AURA_NUMBERS env)
    (settings.auraNumbers || []).forEach(n => nums.add(n.replace(/\D/g, '')));
    return nums;
}

/**
 * Check if user is owner or sudo
 */
async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    const senderIdClean = cleanJid(senderId);
    const ownerNums = getOwnerNumbers();

    // Direct number match
    for (const num of ownerNums) {
        if (senderIdClean === num || senderIdClean.endsWith(num) || num.endsWith(senderIdClean)) return true;
    }

    const isSudoUser = await isSudo(senderId);
    if (isSudoUser) return true;

    // LID fallback for groups
    if (sock && chatId && chatId.endsWith('@g.us') && senderId.includes('@lid')) {
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            const participant = participants.find(p => p.lid === senderId || p.id === senderId);
            if (participant) {
                const pRealIdClean = cleanJid(participant.id);
                for (const num of ownerNums) {
                    if (pRealIdClean === num) return true;
                }
                if (await isSudo(participant.id)) return true;
            }
        } catch (e) {}
    }

    return false;
}

/**
 * Check if user is ONLY owner (primary ownerNumber)
 */
function isOwnerOnly(senderId) {
    const senderIdClean = cleanJid(senderId);
    const ownerNums = getOwnerNumbers();
    for (const num of ownerNums) {
        if (senderIdClean === num || senderIdClean.endsWith(num) || num.endsWith(senderIdClean)) return true;
    }
    return false;
}

async function getCleanName(jid, sock) {
    if (!jid) return 'Unknown';
    const cleanNumber = cleanJid(jid);
    try {
        if (sock) {
            const contact = await sock.onWhatsApp(jid);
            if (contact && contact[0] && contact[0].exists) return cleanNumber;
        }
    } catch (e) {}
    return cleanNumber;
}

module.exports = isOwnerOrSudo;
module.exports.isOwnerOnly = isOwnerOnly;
module.exports.cleanJid = cleanJid;
module.exports.getCleanName = getCleanName;
