'use strict';
/**
 * EXODILE XD — Per-session Prefix Store
 * Each paired bot number gets its OWN prefix, completely independent.
 * One bot changing prefix NEVER affects another paired bot.
 */
const fs       = require('fs');
const path     = require('path');
const settings = require('../settings');

const PREFIX_FILE = path.join(__dirname, '../data/prefixes_per_session.json');

// In-memory map: botNumber → [prefix array]
const _map = new Map();

function _load() {
  try {
    if (fs.existsSync(PREFIX_FILE)) {
      const raw = JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8'));
      for (const [num, arr] of Object.entries(raw)) {
        if (Array.isArray(arr) && arr.length) _map.set(num, arr);
      }
    }
  } catch {}
}

function _save() {
  try {
    const obj = {};
    _map.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(PREFIX_FILE, JSON.stringify(obj, null, 2));
  } catch {}
}

_load();

/**
 * Get the prefix array for a given bot number.
 * Falls back to settings.prefixes if no custom prefix is set.
 * @param {string} botNumber  e.g. "254784747151"
 * @returns {string[]}
 */
function getPrefixes(botNumber) {
  const num = (botNumber || '').replace(/\D/g, '').split(':')[0];
  return _map.get(num) || settings.prefixes || ['.'];
}

/**
 * Set the prefix array for a given bot number.
 * @param {string} botNumber
 * @param {string[]} prefixArr
 */
function setPrefixes(botNumber, prefixArr) {
  const num = (botNumber || '').replace(/\D/g, '').split(':')[0];
  _map.set(num, prefixArr);
  _save();
}

/**
 * Reset a bot's prefix back to the global default.
 * @param {string} botNumber
 */
function resetPrefixes(botNumber) {
  const num = (botNumber || '').replace(/\D/g, '').split(':')[0];
  _map.delete(num);
  _save();
}

/**
 * Get bot number string from a sock object.
 * @param {object} sock
 * @returns {string}
 */
function getBotNum(sock) {
  return (sock?.user?.id || '').split(':')[0].split('@')[0];
}

module.exports = { getPrefixes, setPrefixes, resetPrefixes, getBotNum };
