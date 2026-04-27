'use strict';
const music = require('./music');
module.exports = { ...music, command: 'song', aliases: ['audio', 'ytsong', 'songdl'] };
