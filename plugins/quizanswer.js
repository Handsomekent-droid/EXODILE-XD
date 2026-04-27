const { activeQuiz } = require('../lib/quizStore');

module.exports = {
  command: 'quizanswer',
  aliases: ['answer'],
  category: 'games',
  description: 'Reveal current quiz answer',

  async handler(sock, message) {
    const chatId = message.key.remoteJid;

    const quiz = activeQuiz.get(chatId);
    if (!quiz) {
      return sock.sendMessage(chatId, {
        text: '❌ No active quiz.'
      }, { quoted: message });
    }

    activeQuiz.delete(chatId);

    await sock.sendMessage(chatId, {
      text: `✅ *Answer:* ${quiz.answer.join(', ')}`
    }, { quoted: message });
  }
};