'use strict';
/**
 * EXODILE XD — Admin checker v2
 * Fixed: LID matching, fromMe bypass, robust bot detection
 */

async function isAdmin(sock, chatId, senderId) {
  try {
    const metadata     = await sock.groupMetadata(chatId);
    const participants = metadata.participants || [];

    // ── Build bot identity set ────────────────────────────────
    const rawBotId  = sock.user?.id  || '';
    const rawBotLid = sock.user?.lid || '';

    // Extract bare numbers/ids — handle id:X@domain format
    function bare(jid) {
      if (!jid) return '';
      return jid.replace(/:.*@/, '@').split('@')[0];
    }
    function num(jid) {
      if (!jid) return '';
      return jid.split(':')[0].split('@')[0];
    }

    const botBare = bare(rawBotId);
    const botNum  = num(rawBotId);
    const botLid  = bare(rawBotLid);
    const botLidN = num(rawBotLid);

    // ── Bot admin check ───────────────────────────────────────
    const isBotAdmin = participants.some(p => {
      if (!p.admin) return false; // not admin at all
      const pBare = bare(p.id  || '');
      const pNum  = num(p.id   || '');
      const pLid  = bare(p.lid || '');
      const pLidN = num(p.lid  || '');
      const pPhone = (p.phoneNumber || '').split('@')[0];

      return (
        pBare  === botBare  ||
        pNum   === botNum   ||
        pLid   === botLid   ||
        pLidN  === botLidN  ||
        pPhone === botNum   ||
        pPhone === botBare  ||
        // full match
        (p.id  && (p.id  === rawBotId  || p.id  === rawBotLid)) ||
        (p.lid && (p.lid === rawBotLid || p.lid === rawBotId))
      );
    });

    // ── Sender admin check ────────────────────────────────────
    const senderBare = bare(senderId);
    const senderNum  = num(senderId);

    const isSenderAdmin = participants.some(p => {
      if (!p.admin) return false;
      const pBare  = bare(p.id  || '');
      const pNum   = num(p.id   || '');
      const pLid   = bare(p.lid || '');
      const pPhone = (p.phoneNumber || '').split('@')[0];

      return (
        pBare  === senderBare ||
        pNum   === senderNum  ||
        pLid   === senderBare ||
        pPhone === senderNum  ||
        pPhone === senderBare ||
        (p.id  && p.id  === senderId) ||
        (p.lid && p.lid === senderId)
      );
    });

    return { isSenderAdmin, isBotAdmin };

  } catch (err) {
    console.error('[isAdmin] error:', err?.message);
    return { isSenderAdmin: false, isBotAdmin: false };
  }
}

module.exports = isAdmin;
