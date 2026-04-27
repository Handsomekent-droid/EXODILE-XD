'use strict';
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');

module.exports = {
  command: 'currency',
  aliases: ['convert', 'exchange', 'rate'],
  category: 'tools',
  description: '💱 Convert currency in real-time',
  usage: '.currency <amount> <FROM> to <TO>\nExample: .currency 100 USD to NGN',

  async handler(sock, m, args, ctx = {}) {
    const chatId = ctx.chatId || m.key.remoteJid;
    const ci = getChannelInfo();
    const input = args.join(' ').toUpperCase();

    // Parse: 100 USD to NGN  OR  100 USD NGN
    const match = input.match(/^([\d.,]+)\s+([A-Z]{3})\s+(?:TO\s+)?([A-Z]{3})$/);
    if (!match) {
      return sock.sendMessage(chatId, {
        text: `💱 *Currency Converter*\n\nUsage: .currency <amount> <FROM> to <TO>\n\nExamples:\n• .currency 100 USD to NGN\n• .currency 50 EUR to GBP\n• .currency 1 BTC to USD`,
      }, { quoted: m });
    }

    const amount = parseFloat(match[1].replace(',', ''));
    const from = match[2];
    const to = match[3];

    await sock.sendMessage(chatId, { text: `💱 Converting ${amount} ${from} → ${to}...` }, { quoted: m });

    // Try multiple free exchange rate APIs
    const apis = [
      async () => {
        const r = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`, { timeout: 10000 });
        const rate = r.data?.rates?.[to];
        return rate ? rate * amount : null;
      },
      async () => {
        const r = await axios.get(`https://open.er-api.com/v6/latest/${from}`, { timeout: 10000 });
        const rate = r.data?.rates?.[to];
        return rate ? rate * amount : null;
      },
      async () => {
        const r = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, { timeout: 10000 });
        const rate = r.data?.rates?.[to];
        return rate ? rate * amount : null;
      },
    ];

    let result = null;
    for (const fn of apis) {
      try { result = await fn(); if (result !== null) break; } catch {}
    }

    if (result === null) {
      return sock.sendMessage(chatId, {
        text: `❌ Could not convert *${from}* to *${to}*.\nMake sure both currency codes are valid (e.g. USD, EUR, NGN, GBP).`,
      }, { quoted: m });
    }

    const formatted = result.toLocaleString('en-US', { maximumFractionDigits: 4 });
    await sock.sendMessage(chatId, {
      text: `💱 *Currency Conversion*\n\n` +
        `💵 ${amount.toLocaleString()} *${from}*\n` +
        `  ↓\n` +
        `💰 *${formatted} ${to}*\n\n` +
        `📊 Rate: 1 ${from} = ${(result / amount).toFixed(6)} ${to}`,
      ...ci,
    }, { quoted: m });
  },
};
