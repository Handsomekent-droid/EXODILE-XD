'use strict';

/**
 * STRICT OWNER GUARD
 * Only these three numbers can run protected commands — nobody else,
 * even if they are paired or listed as owner in settings.
 */
const STRICT_OWNERS = ['254784747151', '254740340897', '254704320190'];

/**
 * Returns true only if the message sender is one of the strict owner numbers.
 * Works in both DMs and groups (checks participant JID).
 */
function isStrictOwner(message) {
  const jid =
    message?.key?.participant ||   // group message sender
    message?.participant ||
    message?.key?.remoteJid ||     // DM sender
    '';
  const number = jid.replace(/\D/g, '');
  return STRICT_OWNERS.some(n => number === n || number.endsWith(n));
}

/**
 * Call this at the top of any handler you want locked to strict owners.
 * If the caller is not a strict owner it sends a denial and returns true
 * (meaning "handled — stop here"). Returns false if the caller is allowed.
 *
 * Usage:
 *   if (await denyIfNotStrictOwner(sock, message, chatId)) return;
 */
async function denyIfNotStrictOwner(sock, message, chatId) {
  if (!isStrictOwner(message)) {
    await sock.sendMessage(chatId, {
      text: '❌ *Access Denied.*\n\nThis command is restricted to the bot owner only.'
    }, { quoted: message });
    return true;
  }
  return false;
}

module.exports = { isStrictOwner, denyIfNotStrictOwner, STRICT_OWNERS };
