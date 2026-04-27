'use strict';
/**
 * yt-dlp helper for EXODILE-XD
 * Adapted from weskerty/dla.js gist — ported to Baileys sock.sendMessage() pattern
 */
const fs      = require('fs');
const fsp     = require('fs').promises;
const path    = require('path');
const os      = require('os');
const { promisify } = require('util');
const { execFile }  = require('child_process');
const execFileAsync = promisify(execFile);

const TIMEOUT_MS = 300000; // 5 min
const TEMP_DIR   = path.join(process.cwd(), 'temp');
const BIN_DIR    = path.join(process.cwd(), 'media', 'bin');

const FILE_TYPES = {
  video:    { exts: new Set(['mp4','mkv','avi','webm','mov','flv','m4v']),    mime: 'video/mp4' },
  audio:    { exts: new Set(['mp3','wav','ogg','flac','m4a','aac','wma']),    mime: 'audio/mpeg' },
  image:    { exts: new Set(['jpg','jpeg','png','gif','webp','bmp']),         mime: 'image/jpeg' },
  document: { exts: new Set(['pdf','zip','rar','apk','docx','txt','epub']),   mime: 'application/octet-stream' },
};

function getFileType(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  for (const [cat, info] of Object.entries(FILE_TYPES)) {
    if (info.exts.has(ext)) return { category: cat, mime: info.mime };
  }
  return { category: 'document', mime: 'application/octet-stream' };
}

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('Operation timed out')), ms)),
  ]);
}

let _ytdlpPath = null;

async function getYtDlpPath() {
  if (_ytdlpPath) return _ytdlpPath;
  // 1. system yt-dlp
  try {
    await execFileAsync('yt-dlp', ['--version'], { timeout: 8000 });
    _ytdlpPath = 'yt-dlp';
    return _ytdlpPath;
  } catch {}
  // 2. bundled binary
  const platform = os.platform();
  const arch     = os.arch();
  const nameMap  = {
    'linux-x64': 'yt-dlp_linux', 'linux-arm64': 'yt-dlp_linux_aarch64',
    'linux-arm':  'yt-dlp_linux_armv7l', 'darwin': 'yt-dlp_macos',
    'win32-x64':  'yt-dlp.exe',
  };
  const fname = nameMap[`${platform}-${arch}`] || 'yt-dlp';
  const fpath = path.join(BIN_DIR, fname);
  if (fs.existsSync(fpath)) { _ytdlpPath = fpath; return _ytdlpPath; }
  return null; // not available
}

async function ensureDirs() {
  await fsp.mkdir(TEMP_DIR, { recursive: true });
  await fsp.mkdir(BIN_DIR,  { recursive: true });
}

function getCookiesArgs() {
  const cp = path.join(BIN_DIR, 'yt-dlp.cookies.txt');
  if (fs.existsSync(cp)) return ['--cookies', cp];
  return [];
}

// ── Send a file via Baileys ────────────────────────────────────
async function sendFile(sock, chatId, filePath, caption, quotedMsg, ci) {
  const buf = await fsp.readFile(filePath);
  const { category, mime } = getFileType(filePath);
  const fname = path.basename(filePath);

  if (category === 'video') {
    await sock.sendMessage(chatId, { video: buf, mimetype: 'video/mp4', caption, ...ci }, { quoted: quotedMsg });
  } else if (category === 'audio') {
    await sock.sendMessage(chatId, { audio: buf, mimetype: 'audio/mpeg', fileName: fname, ptt: false, ...ci }, { quoted: quotedMsg });
  } else if (category === 'image') {
    await sock.sendMessage(chatId, { image: buf, caption, ...ci }, { quoted: quotedMsg });
  } else {
    await sock.sendMessage(chatId, { document: buf, mimetype: mime, fileName: fname, caption, ...ci }, { quoted: quotedMsg });
  }
}

// ── Core download function ─────────────────────────────────────
async function ytdlpDownload(sock, chatId, urls, formatType, quotedMsg, ci, caption = '') {
  const ytdlp = await getYtDlpPath();
  if (!ytdlp) return false; // yt-dlp not available, caller should fallback

  await ensureDirs();
  const sessionId = `ytdlp_${Date.now()}`;
  const outDir    = path.join(TEMP_DIR, sessionId);
  await fsp.mkdir(outDir, { recursive: true });

  const cookies = getCookiesArgs();
  const outTpl  = path.join(outDir, '%(title).60s.%(ext)s');

  const videoFmt = ['-f', 'bestvideo[height<=720][vcodec*=avc1]+bestaudio[acodec*=mp4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best', '--merge-output-format', 'mp4'];
  const audioFmt = ['-f', 'ba/best', '-x', '--audio-format', 'mp3', '--audio-quality', '0'];

  const commonArgs = [
    '--no-part', '--no-mtime', '--restrict-filenames',
    '--no-playlist', '--ignore-errors',
    '--extractor-retries', '3', '--fragment-retries', '3',
  ];

  const fmtArgs = formatType === 'audio' ? audioFmt : videoFmt;

  let ok = false;
  for (const url of urls) {
    const args = [...commonArgs, ...cookies, ...fmtArgs, '-o', outTpl, url];
    try {
      await withTimeout(execFileAsync(ytdlp, args, { maxBuffer: 1024 * 1024 * 100 }), TIMEOUT_MS);
    } catch {}
  }

  try {
    const files = (await fsp.readdir(outDir)).filter(f => !f.endsWith('.json') && !f.endsWith('.part'));
    if (!files.length) { await cleanup(outDir); return false; }

    for (const f of files) {
      await sendFile(sock, chatId, path.join(outDir, f), caption, quotedMsg, ci);
    }
    ok = true;
  } catch {}

  await cleanup(outDir);
  return ok;
}

async function cleanup(target) {
  try {
    const s = await fsp.stat(target);
    if (s.isDirectory()) await fsp.rm(target, { recursive: true, force: true });
    else await fsp.unlink(target);
  } catch {}
}

module.exports = { ytdlpDownload, getYtDlpPath };
