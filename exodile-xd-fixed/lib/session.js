'use strict';
const path  = require('path');
const fs    = require('fs');
const axios = require('axios');

const ROOT_DIR    = path.join(__dirname, '..');
const GITHUB_USERNAME = 'stormfiber';

/**
 * Download credentials from a GitHub Gist and save them.
 * Supports multi-session: pass a sessionPath to save into a specific session folder.
 *
 * @param {string} txt          - Gist ID, optionally prefixed with 'ᴢᴇɴᴛʀɪx ᴛᴇᴄʜ/ᴢᴇɴᴛʀɪx-ᴍᴅ_'
 * @param {string} [sessionPath] - Absolute path to the session directory (default: <root>/session)
 */
async function SaveCreds(txt, sessionPath) {
    const gistId  = (txt || '').replace('ᴇxᴏᴅɪᴄ ᴇᴍᴘɪʀᴇ/ᴇxᴏᴅɪʟᴇ xᴅ', '').trim();
    if (!gistId) throw new Error('No session ID provided');

    const gistUrl = `https://gist.githubusercontent.com/${GITHUB_USERNAME}/${gistId}/raw/creds.json`;

    let data;
    try {
        const response = await axios.get(gistUrl, { timeout: 15000 });
        data = typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data, null, 2);
    } catch (error) {
        console.error('❌ Failed to fetch session from Gist:', error.message);
        if (error.response) {
            console.error('❌ HTTP Status:', error.response.status);
        }
        throw error;
    }

    // Validate the downloaded JSON contains required Baileys keys
    try {
        const parsed = JSON.parse(data);
        if (!parsed.noiseKey || !parsed.signedIdentityKey) {
            throw new Error('Downloaded creds.json is missing required Baileys keys');
        }
    } catch (e) {
        throw new Error(`Invalid creds.json from Gist: ${e.message}`);
    }

    // Resolve target directory
    const targetDir = sessionPath || path.join(ROOT_DIR, 'sessions', 'primary');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const credsPath = path.join(targetDir, 'creds.json');
    fs.writeFileSync(credsPath, data, 'utf8');
    console.log(`✅ Session saved to: ${credsPath}`);
}

module.exports = SaveCreds;
