'use strict';
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
function box(t,lines){let s=`┏━━「 ${t} 」━━┓\n┃\n`;for(const l of lines)s+=`┃  ${l}\n`;return s+`┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`+FOOTER;}

module.exports = [
  {command:'reverse',aliases:['reverse2'],category:'tools',description:'Reverse text',usage:'.reverse2 <text>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const t=args.join(' ');if(!t)return sock.sendMessage(chatId,{text:box('🔄 *REVERSE*',['💀 Usage: .reverse2 <text>']),...ci},{quoted:m});await sock.sendMessage(chatId,{text:box('🔄 *REVERSED*',[t.split('').reverse().join('')]),...ci},{quoted:m});
    }},
  {command:'scramble',aliases:['scrambletext'],category:'tools',description:'Scramble text letters',usage:'.scramble <text>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const t=args.join(' ');if(!t)return sock.sendMessage(chatId,{text:box('🔀 *SCRAMBLE*',['💀 .scramble <text>']),...ci},{quoted:m});const s=t.split(' ').map(w=>w.split('').sort(()=>Math.random()-.5).join('')).join(' ');await sock.sendMessage(chatId,{text:box('🔀 *SCRAMBLED*',[s]),...ci},{quoted:m});
    }},
  {command:'vowels',aliases:['removevowels'],category:'tools',description:'Remove vowels from text',usage:'.vowels <text>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const t=args.join(' ');await sock.sendMessage(chatId,{text:box('🔡 *NO VOWELS*',[t.replace(/[aeiouAEIOU]/g,'')|| '(empty)']),...ci},{quoted:m});
    }},
  {command:'initials',aliases:['getinit'],category:'tools',description:'Get text initials',usage:'.initials <text>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const t=args.join(' ');const i=t.split(' ').map(w=>w[0]?.toUpperCase()||'').join('');await sock.sendMessage(chatId,{text:box('🔤 *INITIALS*',[i||'No text given']),...ci},{quoted:m});
    }},
  {command:'palindrome',aliases:['ispalindrome'],category:'tools',description:'Check if text is palindrome',usage:'.palindrome <word>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const t=args[0]?.toLowerCase()||'';const r=t.split('').reverse().join('');await sock.sendMessage(chatId,{text:box('🔁 *PALINDROME CHECK*',[`Word: ${t}`,t===r?'✅ YES - It is a palindrome!':'❌ NO - Not a palindrome']),...ci},{quoted:m});
    }},
  {command:'anagram',aliases:['isanagram'],category:'tools',description:'Check if two words are anagrams',usage:'.anagram <w1> <w2>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const[a,b]=[args[0]?.toLowerCase(),args[1]?.toLowerCase()];if(!a||!b)return sock.sendMessage(chatId,{text:box('🔤 *ANAGRAM*',['💀 .anagram word1 word2']),...ci},{quoted:m});const s=w=>w.split('').sort().join('');await sock.sendMessage(chatId,{text:box('🔤 *ANAGRAM CHECK*',[`"${a}" and "${b}"`,s(a)===s(b)?'✅ They ARE anagrams!':'❌ Not anagrams']),...ci},{quoted:m});
    }},
  {command:'nato',aliases:['phonetic'],category:'tools',description:'NATO phonetic alphabet',usage:'.nato <text>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const MAP={A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliet',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'X-ray',Y:'Yankee',Z:'Zulu'};const t=args.join(' ').toUpperCase();const r=t.split('').map(c=>MAP[c]||c).join(' - ');await sock.sendMessage(chatId,{text:box('📻 *NATO ALPHABET*',[r]),...ci},{quoted:m});
    }},
  {command:'miles2km',aliases:['mileskm'],category:'tools',description:'Convert miles to km',usage:'.miles2km <n>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const n=parseFloat(args[0]);if(isNaN(n))return sock.sendMessage(chatId,{text:box('📏 *MILES TO KM*',['💀 .miles2km 10']),...ci},{quoted:m});await sock.sendMessage(chatId,{text:box('📏 *CONVERSION*',[`${n} miles = *${(n*1.60934).toFixed(3)} km*`]),...ci},{quoted:m});
    }},
  {command:'kg2lb',aliases:['kglbs'],category:'tools',description:'Convert kg to pounds',usage:'.kg2lb <n>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const n=parseFloat(args[0]);if(isNaN(n))return sock.sendMessage(chatId,{text:box('⚖️ *KG TO LBS*',['💀 .kg2lb 70']),...ci},{quoted:m});await sock.sendMessage(chatId,{text:box('⚖️ *CONVERSION*',[`${n} kg = *${(n*2.20462).toFixed(3)} lbs*`]),...ci},{quoted:m});
    }},
  {command:'roman',aliases:['toroman'],category:'tools',description:'Convert number to Roman numeral',usage:'.roman <n>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const n=parseInt(args[0]);if(!n||n<1||n>3999)return sock.sendMessage(chatId,{text:box('🏛️ *ROMAN*',['💀 .roman 42 (1-3999)']),...ci},{quoted:m});const v=[1000,900,500,400,100,90,50,40,10,9,5,4,1];const s=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];let r='',num=n;v.forEach((val,i)=>{while(num>=val){r+=s[i];num-=val;}});await sock.sendMessage(chatId,{text:box('🏛️ *ROMAN NUMERAL*',[`${n} → *${r}*`]),...ci},{quoted:m});
    }},
  {command:'factorial',aliases:['fact3'],category:'tools',description:'Calculate factorial',usage:'.factorial <n>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const n=parseInt(args[0]);if(isNaN(n)||n<0||n>20)return sock.sendMessage(chatId,{text:box('🔢 *FACTORIAL*',['💀 .factorial <0-20>']),...ci},{quoted:m});let r=1n;for(let i=2n;i<=BigInt(n);i++)r*=i;await sock.sendMessage(chatId,{text:box('🔢 *FACTORIAL*',[`${n}! = *${r}*`]),...ci},{quoted:m});
    }},
  {command:'fibonacci',aliases:['fib'],category:'tools',description:'Fibonacci sequence',usage:'.fibonacci <n>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const n=Math.min(parseInt(args[0])||10,30);const seq=[0,1];for(let i=2;i<n;i++)seq.push(seq[i-1]+seq[i-2]);await sock.sendMessage(chatId,{text:box('🔢 *FIBONACCI*',[`First ${n}: ${seq.join(', ')}`]),...ci},{quoted:m});
    }},
  {command:'prime',aliases:['isprime'],category:'tools',description:'Check if number is prime',usage:'.prime <n>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const n=parseInt(args[0]);if(isNaN(n)||n<2)return sock.sendMessage(chatId,{text:box('🔢 *PRIME CHECK*',['💀 .prime <number>=2']),...ci},{quoted:m});let isPrime=true;for(let i=2;i<=Math.sqrt(n);i++){if(n%i===0){isPrime=false;break;}}await sock.sendMessage(chatId,{text:box('🔢 *PRIME CHECK*',[`${n} is ${isPrime?'✅ PRIME':'❌ NOT prime'}`]),...ci},{quoted:m});
    }},
  {command:'gcd',aliases:['hcf'],category:'tools',description:'Greatest common divisor',usage:'.gcd <a> <b>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const[a,b]=[parseInt(args[0]),parseInt(args[1])];if(isNaN(a)||isNaN(b))return sock.sendMessage(chatId,{text:box('🔢 *GCD*',['💀 .gcd 12 18']),...ci},{quoted:m});const gcd=(x,y)=>y===0?x:gcd(y,x%y);await sock.sendMessage(chatId,{text:box('🔢 *GCD*',[`GCD(${a}, ${b}) = *${gcd(Math.abs(a),Math.abs(b))}*`]),...ci},{quoted:m});
    }},
  {command:'lcm',aliases:['leastcommon'],category:'tools',description:'Least common multiple',usage:'.lcm <a> <b>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const[a,b]=[parseInt(args[0]),parseInt(args[1])];if(isNaN(a)||isNaN(b))return sock.sendMessage(chatId,{text:box('🔢 *LCM*',['💀 .lcm 4 6']),...ci},{quoted:m});const gcd=(x,y)=>y===0?x:gcd(y,x%y);const lcm=Math.abs(a*b)/gcd(Math.abs(a),Math.abs(b));await sock.sendMessage(chatId,{text:box('🔢 *LCM*',[`LCM(${a}, ${b}) = *${lcm}*`]),...ci},{quoted:m});
    }},
  {command:'average',aliases:['avg'],category:'tools',description:'Calculate average of numbers',usage:'.average 1 2 3 4 5',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const nums=args.map(Number).filter(n=>!isNaN(n));if(!nums.length)return sock.sendMessage(chatId,{text:box('📊 *AVERAGE*',['💀 .average 10 20 30']),...ci},{quoted:m});const avg=nums.reduce((a,b)=>a+b,0)/nums.length;await sock.sendMessage(chatId,{text:box('📊 *AVERAGE*',[`Numbers: ${nums.join(', ')}`,`Sum: ${nums.reduce((a,b)=>a+b,0)}`,`Average: *${avg.toFixed(4)}*`]),...ci},{quoted:m});
    }},
  {command:'median',aliases:['findmedian'],category:'tools',description:'Find median of numbers',usage:'.median 1 2 3 4 5',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const nums=args.map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b);if(!nums.length)return sock.sendMessage(chatId,{text:box('📊 *MEDIAN*',['💀 .median 1 2 3 4 5']),...ci},{quoted:m});const med=nums.length%2===0?(nums[nums.length/2-1]+nums[nums.length/2])/2:nums[Math.floor(nums.length/2)];await sock.sendMessage(chatId,{text:box('📊 *MEDIAN*',[`Numbers: ${nums.join(', ')}`,`Median: *${med}*`]),...ci},{quoted:m});
    }},
  {command:'area',aliases:['calcarea'],category:'tools',description:'Calculate area of shapes',usage:'.area circle/square/rectangle <dims>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const shape=(args[0]||'').toLowerCase();const[a,b]=[parseFloat(args[1]),parseFloat(args[2])];if(!shape||isNaN(a))return sock.sendMessage(chatId,{text:box('📐 *AREA*',['💀 .area circle 5 OR .area rectangle 4 6']),...ci},{quoted:m});let r;if(shape==='circle')r=`Circle: π×${a}² = *${(Math.PI*a*a).toFixed(4)}*`;else if(shape==='square')r=`Square: ${a}² = *${(a*a).toFixed(4)}*`;else if(shape==='rectangle')r=`Rectangle: ${a}×${b} = *${(a*(b||a)).toFixed(4)}*`;else r='Shape not recognized. Try: circle, square, rectangle';await sock.sendMessage(chatId,{text:box('📐 *AREA CALCULATOR*',[r]),...ci},{quoted:m});
    }},
  {command:'power',aliases:['exponent'],category:'tools',description:'Calculate power/exponent',usage:'.power <base> <exp>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const[base,exp]=[parseFloat(args[0]),parseFloat(args[1])];if(isNaN(base)||isNaN(exp))return sock.sendMessage(chatId,{text:box('⚡ *POWER*',['💀 .power 2 10']),...ci},{quoted:m});await sock.sendMessage(chatId,{text:box('⚡ *POWER*',[`${base}^${exp} = *${Math.pow(base,exp)}*`]),...ci},{quoted:m});
    }},
  {command:'sqrt',aliases:['squareroot'],category:'tools',description:'Calculate square root',usage:'.sqrt <n>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const n=parseFloat(args[0]);if(isNaN(n)||n<0)return sock.sendMessage(chatId,{text:box('√ *SQRT*',['💀 .sqrt 144']),...ci},{quoted:m});await sock.sendMessage(chatId,{text:box('√ *SQUARE ROOT*',[`√${n} = *${Math.sqrt(n).toFixed(6)}*`]),...ci},{quoted:m});
    }},
  {command:'confession',aliases:['confess'],category:'fun',description:'Anonymous confession',usage:'.confession <text>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const t=args.join(' ');if(!t)return sock.sendMessage(chatId,{text:box('🤫 *CONFESSION*',['💀 .confession <your secret>']),...ci},{quoted:m});await sock.sendMessage(chatId,{text:box('🤫 *ANONYMOUS CONFESSION*',['📨 Someone just confessed:','',`"${t}"`,'','Identity: 🔒 Hidden']),...ci},{quoted:m});
    }},
  {command:'rps',aliases:['rockpaperscissors'],category:'games',description:'Rock Paper Scissors game',usage:'.rps rock/paper/scissors',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const choices=['rock','paper','scissors'];const user=(args[0]||'').toLowerCase();if(!choices.includes(user))return sock.sendMessage(chatId,{text:box('✂️ *ROCK PAPER SCISSORS*',['💀 .rps rock/paper/scissors']),...ci},{quoted:m});const bot=choices[Math.floor(Math.random()*3)];const beats={rock:'scissors',paper:'rock',scissors:'paper'};const result=user===bot?'🤝 TIE!':beats[user]===bot?'🎉 YOU WIN!':'💀 BOT WINS!';await sock.sendMessage(chatId,{text:box('✂️ *RPS*',[`🎯 You: ${user.toUpperCase()}`,`🤖 Bot: ${bot.toUpperCase()}`,``,result]),...ci},{quoted:m});
    }},
  {command:'hangman',aliases:['guessword'],category:'games',description:'Hangman word game',usage:'.hangman',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const words=['python','javascript','whatsapp','blockchain','universe','keyboard','umbrella','elephant','diamond','champion'];const w=words[Math.floor(Math.random()*words.length)];const hint=w.split('').map((c,i)=>i===0||i===w.length-1?c:'_').join(' ');await sock.sendMessage(chatId,{text:box('🎯 *HANGMAN*',[`Word: ${hint}`,`Letters: ${w.length}`,`Hint: Starts with '${w[0]}' ends with '${w[w.length-1]}'`,'Reply with .guess <letter> to play!']),...ci},{quoted:m});
    }},
  {command:'fortune',aliases:['fortunecookie'],category:'fun',description:'Get a fortune cookie message',usage:'.fortune',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const fortunes=['Great things are coming your way soon! 🌟','Trust your instincts — they are rarely wrong! ⚡','A surprise is just around the corner! 😮','Your hard work will pay off very soon! 💀','You are more powerful than you think! 🔥','The best is yet to come! ✨'];await sock.sendMessage(chatId,{text:box('🥠 *FORTUNE COOKIE*',[fortunes[Math.floor(Math.random()*fortunes.length)]]),...ci},{quoted:m});
    }},
  {command:'superpower',aliases:['mypow'],category:'fun',description:'Discover your superpower',usage:'.superpower',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const p=[['⚡ SUPER SPEED','You move faster than light!'],['🔥 FIRE CONTROL','You command the flames!'],['💀 DEATH STARE','One look and they freeze!'],['🌊 WATER BENDING','The seas obey you!'],['🧠 MIND READING','You know what they think!'],['👻 INVISIBILITY','Now you see me, now you dont!']];const[pow,desc]=p[Math.floor(Math.random()*p.length)];await sock.sendMessage(chatId,{text:box('🦸 *YOUR SUPERPOWER*',[`Power: *${pow}*`,``,desc]),...ci},{quoted:m});
    }},
  {command:'villain',aliases:['myvillain'],category:'fun',description:'Discover your villain identity',usage:'.villain',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const v=[['💀 THE DARK KNIGHT','Feared by all, loyal to none'],['🦠 THE VIRUS','You spread chaos everywhere'],['☠️ THE PHANTOM','No one knows your true face'],['🔥 THE DESTROYER','Nothing stands in your path'],['🧪 THE MAD GENIUS','Too smart for them to stop']];const[name,trait]=v[Math.floor(Math.random()*v.length)];await sock.sendMessage(chatId,{text:box('😈 *YOUR VILLAIN NAME*',[`Villain: *${name}*`,``,trait]),...ci},{quoted:m});
    }},
  {command:'fakepassword',aliases:['genpin'],category:'fun',description:'Generate a fake memorable password',usage:'.fakepassword',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const words=['Fire','Shadow','Dragon','Storm','Blade','Phantom','Venom','Chaos','Apex','Titan'];const nums=Math.floor(Math.random()*9000)+1000;const syms=['!','@','#','$','%','&'];const pass=words[Math.floor(Math.random()*words.length)]+words[Math.floor(Math.random()*words.length)]+nums+syms[Math.floor(Math.random()*syms.length)];await sock.sendMessage(chatId,{text:box('🔐 *MEMORABLE PASSWORD*',[`🔑 ${pass}`,`💀 Do NOT actually use this!`]),...ci},{quoted:m});
    }},
  {command:'tarotcard',aliases:['tarot'],category:'fun',description:'Get a tarot card reading',usage:'.tarotcard',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const cards=[['🌟 THE STAR','Hope, inspiration, and bright futures ahead'],['💀 THE DEATH','Transformation, endings, and new beginnings'],['⚡ THE TOWER','Sudden change and breakthrough revelation'],['🔥 THE SUN','Success, joy, and positive energy'],['🌙 THE MOON','Intuition, dreams, and hidden truths'],['⚔️ THE MAGICIAN','Willpower, skill, and resourcefulness']];const[card,meaning]=cards[Math.floor(Math.random()*cards.length)];await sock.sendMessage(chatId,{text:box('🎴 *TAROT READING*',[`Card: *${card}*`,``,meaning,'','✨ Trust the universe!']),...ci},{quoted:m});
    }},
  {command:'icebreaker',aliases:['startconvo'],category:'fun',description:'Random icebreaker question',usage:'.icebreaker',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const q=['If you could have dinner with anyone dead or alive, who? 🍽️','What is the most adventurous thing you have done? 🌍','If you won a billion dollars tomorrow, what would you do first? 💰','What skill do you wish you had? 🎯','What would your superpower be? ⚡','What is your hidden talent? 🎭'];await sock.sendMessage(chatId,{text:box('🧊 *ICEBREAKER*',[q[Math.floor(Math.random()*q.length)]]),...ci},{quoted:m});
    }},
  {command:'wordchain',aliases:['wchain'],category:'games',description:'Start a word chain game',usage:'.wordchain <word>',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const word=(args[0]||'').toLowerCase();if(!word)return sock.sendMessage(chatId,{text:box('🔗 *WORD CHAIN*',['💀 .wordchain <word>','Rules: next word must start with last letter!']),...ci},{quoted:m});const last=word[word.length-1].toUpperCase();await sock.sendMessage(chatId,{text:box('🔗 *WORD CHAIN*',[`Starting word: *${word}*`,`Next word must start with: *${last}*`,'Reply with your word!']),...ci},{quoted:m});
    }},
  {command:'lifequote',aliases:['lfquote'],category:'quotes',description:'Random life quote',usage:'.lifequote',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const q=[['Life is what happens when you are busy making other plans.','John Lennon'],['The only impossible journey is the one you never begin.','Tony Robbins'],['In the middle of difficulty lies opportunity.','Albert Einstein'],['It always seems impossible until it is done.','Nelson Mandela']];const[txt,auth]=q[Math.floor(Math.random()*q.length)];await sock.sendMessage(chatId,{text:box('💬 *LIFE QUOTE*',[`"${txt}"`,``,`— *${auth}*`]),...ci},{quoted:m});
    }},
  {command:'techquote',aliases:['devquote'],category:'quotes',description:'Developer/tech quote',usage:'.techquote',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const q=[['Any fool can write code that a computer can understand. Good programmers write code that humans can understand.','Martin Fowler'],['First, solve the problem. Then, write the code.','John Johnson'],['Code is like humor. When you have to explain it, it is bad.','Cory House'],['Make it work, make it right, make it fast.','Kent Beck']];const[txt,auth]=q[Math.floor(Math.random()*q.length)];await sock.sendMessage(chatId,{text:box('💻 *TECH QUOTE*',[`"${txt}"`,``,`— *${auth}*`]),...ci},{quoted:m});
    }},
  {command:'successquote',aliases:['winquote'],category:'quotes',description:'Success mindset quote',usage:'.successquote',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const q=[['Success is not the key to happiness. Happiness is the key to success.','Albert Schweitzer'],['The secret of success is to do the common thing uncommonly well.','John D. Rockefeller'],['The harder I work, the more luck I seem to have.','Thomas Jefferson']];const[txt,auth]=q[Math.floor(Math.random()*q.length)];await sock.sendMessage(chatId,{text:box('🏆 *SUCCESS QUOTE*',[`"${txt}"`,``,`— *${auth}*`]),...ci},{quoted:m});
    }},
  {command:'darkness',aliases:['darkquote'],category:'quotes',description:'Deep dark quote',usage:'.darkness',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const q=['In the darkest night, even the smallest flame defies the void. ☠️','They fear what they cannot break. 💀','Silence is the language of those who know too much. 🌑','The wolf does not lose sleep over the opinions of sheep. 🐺','Not all who wander are lost. Some are hunting. 🔥'];await sock.sendMessage(chatId,{text:box('🌑 *DARK QUOTE*',[q[Math.floor(Math.random()*q.length)]]),...ci},{quoted:m});
    }},
  {command:'wisdomeq',aliases:['wise'],category:'quotes',description:'Wisdom quote',usage:'.wisdomquote',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;
    const q=[['The wisest people are those who admit they know nothing.','Socrates'],['Knowing yourself is the beginning of all wisdom.','Aristotle'],['The only true wisdom is in knowing you know nothing.','Socrates'],['By three methods we may learn wisdom: reflection, imitation, experience.','Confucius']];const[txt,auth]=q[Math.floor(Math.random()*q.length)];await sock.sendMessage(chatId,{text:box('🧠 *WISDOM*',[`"${txt}"`,``,`— *${auth}*`]),...ci},{quoted:m});
    }},
];
