const axios = require('axios');
const { activeQuiz } = require('../lib/quizStore');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Fallback quiz questions when API is unavailable
const FALLBACK_QUESTIONS = [
  { image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png', answer: ['dice'], timer: 30 },
  { image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bikesgray.jpg/320px-Bikesgray.jpg', answer: ['bicycle', 'bike'], timer: 30 },
];

module.exports = {
  command: 'quizpuzzle',
  aliases: ['quiz', 'puzzle'],
  category: 'games',
  description: 'Start an image-based quiz puzzle',
  usage: '.quizpuzzle [level]',

  async handler(sock, message, args) {
    const chatId = message.key.remoteJid;
    const level = args[0] || 1;

    let q = null;

    try {
      // Try gifted API first since prexzy has 0 active endpoints
      const res = await axios.get(
        `https://api.giftedtech.my.id/api/game/quiz?apikey=gifted&level=${level}`,
        { timeout: 12000, headers: { 'User-Agent': UA } }
      );
      const questions = res.data?.result || res.data?.data || [];
      if (questions.length) {
        q = questions[Math.floor(Math.random() * questions.length)];
      }
    } catch {}

    // Fallback to siputzx
    if (!q) {
      try {
        const res = await axios.get(
          `https://api.siputzx.my.id/api/game/tebakgambar`,
          { timeout: 12000, headers: { 'User-Agent': UA } }
        );
        const d = res.data?.data;
        if (d?.image) q = { image: d.image, answer: Array.isArray(d.answer) ? d.answer : [d.answer || d.jawaban], timer: 30 };
      } catch {}
    }

    // Fallback to ryzendesu
    if (!q) {
      try {
        const res = await axios.get(
          `https://api.ryzendesu.vip/api/game/quiz?level=${level}`,
          { timeout: 12000, headers: { 'User-Agent': UA } }
        );
        const d = res.data?.data || res.data;
        if (d?.image) q = { image: d.image, answer: Array.isArray(d.answer) ? d.answer : [d.answer], timer: 30 };
      } catch {}
    }

    if (!q) {
      return sock.sendMessage(chatId, {
        text: '❌ No questions found. All quiz APIs are currently down, try again later.'
      }, { quoted: message });
    }

    activeQuiz.set(chatId, {
      answer: q.answer,
      timer: q.timer
    });

    await sock.sendMessage(
      chatId,
      {
        image: { url: q.image },
        caption:
          `🧩 *QUIZ PUZZLE*\n` +
          `📊 Level: ${level}\n` +
          `⏱ Time: ${q.timer}s\n\n` +
          `✍️ Guess the answer!`
      },
      { quoted: message }
    );

    setTimeout(() => {
      if (activeQuiz.has(chatId)) {
        const quiz = activeQuiz.get(chatId);
        activeQuiz.delete(chatId);
        sock.sendMessage(chatId, {
          text: `⏰ Time's up!\n✅ Answer: *${quiz.answer.join(', ')}*`
        });
      }
    }, q.timer * 1000);
  }
};