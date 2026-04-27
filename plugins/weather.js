'use strict';
const axios = require('axios');
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n> 💀 𝗘𝗫𝗢𝗗𝗜𝗟𝗘-𝗫𝗗 // 𝗣𝗥𝗜𝗠𝗘 𝗞𝗘𝗡𝗧';

module.exports = {
  command: 'weather',
  aliases: ['forecast', 'climate'],
  category: 'info',
  description: 'Get the current weather for a city',
  usage: '.weather <city>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const ci = getChannelInfo();
    const city = args.join(' ').trim();

    if (!city) {
      return sock.sendMessage(chatId, { text: '🌤️ Usage: .weather <city>\nExample: .weather Lagos' }, { quoted: message });
    }

    try {
      // Step 1: Geocode city to lat/lon
      const geo = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`,
        { timeout: 10000 }
      );
      const loc = geo.data?.results?.[0];
      if (!loc) throw new Error('city not found');

      // Step 2: Get weather
      const wr = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&hourly=relative_humidity_2m,windspeed_10m&timezone=auto`,
        { timeout: 10000 }
      );
      const cw = wr.data?.current_weather;
      if (!cw) throw new Error('no weather data');

      const wCodes = { 0:'☀️ Clear', 1:'🌤️ Mostly clear', 2:'⛅ Partly cloudy', 3:'☁️ Overcast', 45:'🌫️ Foggy', 51:'🌦️ Light drizzle', 61:'🌧️ Rain', 71:'🌨️ Snow', 95:'⛈️ Thunderstorm' };
      const desc = wCodes[cw.weathercode] || `Code ${cw.weathercode}`;

      const text =
        `🌤️ *Weather — ${loc.name}, ${loc.country_code || ''}*\n\n` +
        `🌡️ Temperature: *${cw.temperature}°C*\n` +
        `☁️ Condition: *${desc}*\n` +
        `💨 Wind: *${cw.windspeed} km/h*\n` +
        `🌐 Coords: ${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}` +
        FOOTER;

      await sock.sendMessage(chatId, { text, ...ci }, { quoted: message });
    } catch (err) {
      console.error('[weather]', err?.message);
      await sock.sendMessage(chatId, { text: `❌ Could not fetch weather for *${city}*. Check the city name and try again.` }, { quoted: message });
    }
  }
};
