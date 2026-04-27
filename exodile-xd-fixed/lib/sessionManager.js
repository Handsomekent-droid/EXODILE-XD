'use strict';
/**
 * EXODILE XD — Multi-session manager
 */
const fs   = require('fs');
const path = require('path');
const { printLog } = require('./print');
const { clearSession } = require('./sessionStore');

const SESSIONS_DIR  = path.join(__dirname, '..', 'sessions');
const DATA_DIR      = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR))     fs.mkdirSync(DATA_DIR,     { recursive: true });
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, '{}', 'utf8');

// In-memory map: sessionId -> { sock, info, startedAt }
const activeSessions = new Map();

function loadMeta() {
    try {
        const raw = fs.readFileSync(SESSIONS_FILE, 'utf8').trim();
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveMeta(meta) {
    try { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(meta, null, 2), 'utf8'); } catch {}
}

function sessionDirExists(sessionId) {
    if (!sessionId || sessionId === '_pairtemp') return false;
    const credsPath = path.join(SESSIONS_DIR, sessionId, 'creds.json');
    if (!fs.existsSync(credsPath)) return false;
    try {
        const parsed = JSON.parse(fs.readFileSync(credsPath, 'utf8').trim());
        return !!(parsed.noiseKey && parsed.signedIdentityKey);
    } catch { return false; }
}

function sessionPath(sessionId) {
    const p = path.join(SESSIONS_DIR, sessionId);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    return p;
}

// Get all session IDs that have valid creds on disk
function getDiskSessions() {
    try {
        return fs.readdirSync(SESSIONS_DIR).filter(id => sessionDirExists(id));
    } catch { return []; }
}

function registerSession(sessionId, sock, info = {}) {
    activeSessions.set(sessionId, { sock, info, startedAt: Date.now() });

    sessionPath(sessionId);

    const meta = loadMeta();
    meta[sessionId] = {
        ...info,
        sessionId,
        pairedAt: meta[sessionId]?.pairedAt || new Date().toISOString(),
        status: 'active',
    };
    saveMeta(meta);

    global._activeSessions = activeSessions.size;
    printLog('session', `registered: ${sessionId} (total: ${activeSessions.size})`);
}

function removeSession(sessionId) {
    activeSessions.delete(sessionId);

    // ── Delete session creds dir ─────────────────────────────────
    const sessionDir = path.join(SESSIONS_DIR, sessionId);
    try { if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}

    // ── Delete per-session data files ────────────────────────────
    // Extract bot number from sessionId (format: number_timestamp or just number)
    const botNum = sessionId.split('_')[0].replace(/\D/g, '');
    if (botNum) {
        // Remove autostatus config
        const autostatusFile = path.join(DATA_DIR, `autostatus_${botNum}.json`);
        try { if (fs.existsSync(autostatusFile)) fs.unlinkSync(autostatusFile); } catch {}
        // Remove prefix config
        const prefixFile = path.join(DATA_DIR, 'prefixes_per_session.json');
        try {
            if (fs.existsSync(prefixFile)) {
                const pdata = JSON.parse(fs.readFileSync(prefixFile, 'utf8'));
                delete pdata[botNum];
                fs.writeFileSync(prefixFile, JSON.stringify(pdata, null, 2));
            }
        } catch {}
    }

    const meta = loadMeta();
    delete meta[sessionId];
    saveMeta(meta);
    global._activeSessions = activeSessions.size;
    // Wipe all session-scoped data (mode, settings, autostatus, prefix)
    if (botNum) try { clearSession(botNum); } catch {}
    printLog('session', `removed + data cleaned: ${sessionId}`);
}

function getSession(sessionId) {
    return activeSessions.get(sessionId) || null;
}

/**
 * List all sessions — merges disk dirs + metadata + live status.
 * A session with valid creds on disk is shown even if not yet connected.
 */
function listSessions() {
    const meta    = loadMeta();
    const onDisk  = getDiskSessions();

    // Merge: any dir on disk gets an entry
    for (const id of onDisk) {
        if (!meta[id]) {
            meta[id] = { sessionId: id, pairedAt: null, status: 'active' };
        }
    }
    // Persist newly discovered sessions
    if (onDisk.length > 0) saveMeta(meta);

    return Object.values(meta).map(s => {
        const isOnline = activeSessions.has(s.sessionId);
        const existsOnDisk = onDisk.includes(s.sessionId);
        return {
            ...s,
            online:     isOnline,
            connecting: !isOnline && existsOnDisk, // has creds but socket not open yet
            uptime: isOnline
                ? Math.floor((Date.now() - activeSessions.get(s.sessionId).startedAt) / 1000)
                : 0,
        };
    });
}

/**
 * Active count — returns count of sockets actually open.
 * Falls back to disk count if no sockets registered yet (e.g. still connecting).
 */
function activeCount() {
    if (activeSessions.size > 0) return activeSessions.size;
    // Fallback: count valid creds dirs (connecting but not open yet)
    return getDiskSessions().length;
}

async function broadcastAll(fn) {
    const results = [];
    for (const [id, { sock }] of activeSessions) {
        try { results.push({ id, result: await fn(sock, id) }); }
        catch (e) { results.push({ id, error: e.message }); }
    }
    return results;
}

async function bootAllSessions(startBot) {
    const sessionIds = getDiskSessions();
    if (sessionIds.length === 0) {
        printLog('session', 'no saved sessions found');
        return;
    }
    printLog('session', `booting ${sessionIds.length} session(s)...`);
    for (const id of sessionIds) {
        try { await startBot(path.join(SESSIONS_DIR, id)); }
        catch (e) { printLog('error', `failed to boot ${id}: ${e.message}`); }
    }
}

// Mark session as offline without deleting creds (used on disconnect)
function deregisterSession(sessionId) {
    activeSessions.delete(sessionId);
    global._activeSessions = activeSessions.size;
    printLog('session', `deregistered (offline): ${sessionId}`);
}

module.exports = {
    registerSession, deregisterSession, removeSession, getSession,
    listSessions, sessionDirExists, sessionPath,
    activeCount, broadcastAll, bootAllSessions,
    SESSIONS_DIR, SESSIONS_FILE,
};
