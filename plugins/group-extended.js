'use strict';
const { getChannelInfo } = require('../lib/messageConfig');
const FOOTER = '\n✦ ᴅᴇᴠ ᴘʀɪᴍᴇ ᴋɪʟʟᴇʀ ɴᴏᴠᴀ ᴋᴇɴᴛ · ᴇxᴏᴅɪʟᴇ xᴅ';
function box(title, lines) {
  let t = `┏━━「 ${title} 」━━┓\n┃\n`;
  for (const l of lines) t += `┃  ${l}\n`;
  return t + `┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛` + FOOTER;
}
function getTargets(m) {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
  return mentioned.length ? mentioned : quoted ? [quoted] : [];
}

module.exports = [
  {command:'grouplink',aliases:['glink','invitelink','getlink'],category:'group',description:'Get group invite link',groupOnly:true,adminOnly:true,usage:'.grouplink',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;if(!ctx.isBotAdmin)return sock.sendMessage(chatId,{text:box('🔗 *GROUP LINK*',['❌ Make me admin first!']),...ci},{quoted:m});try{const code=await sock.groupInviteCode(chatId);await sock.sendMessage(chatId,{text:box('🔗 *GROUP INVITE LINK*',[`🔗 https://chat.whatsapp.com/${code}`,'☣️ Share to invite members!']),...ci},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('🔗 *LINK*',['❌ Could not get link: '+e.message]),...ci},{quoted:m});}}},
  {command:'kickall',aliases:['removeall','cleargroup'],category:'admin',description:'Kick all non-admin members',groupOnly:true,adminOnly:true,ownerOnly:true,usage:'.kickall',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;if(!ctx.isBotAdmin)return sock.sendMessage(chatId,{text:box('⚔️ *KICKALL*',['❌ Make me admin first!']),...ci},{quoted:m});
    try{const meta=await sock.groupMetadata(chatId);const botNum=(sock.user?.id||'').split(':')[0].split('@')[0];const toKick=meta.participants.filter(p=>!p.admin&&p.id.split('@')[0]!==botNum).map(p=>p.id);
    if(!toKick.length)return sock.sendMessage(chatId,{text:box('⚔️ *KICKALL*',['No non-admin members to remove']),...ci},{quoted:m});
    await sock.sendMessage(chatId,{text:box('⚔️ *KICKALL*',[`⏳ Removing ${toKick.length} members...`]),...ci},{quoted:m});
    for(const jid of toKick){try{await sock.groupParticipantsUpdate(chatId,[jid],'remove');await new Promise(r=>setTimeout(r,500));}catch{}}
    await sock.sendMessage(chatId,{text:box('⚔️ *KICKALL DONE*',[`✅ Removed ${toKick.length} members!`]),...ci},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('⚔️ *KICKALL*',['❌ '+e.message]),...ci},{quoted:m});}}},
  {command:'groupsize',aliases:['membercount','howmany'],category:'group',description:'Get group member count',groupOnly:true,usage:'.groupsize',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;try{const meta=await sock.groupMetadata(chatId);const admins=meta.participants.filter(p=>p.admin).length;await sock.sendMessage(chatId,{text:box('👥 *GROUP SIZE*',[`📛 Group: *${meta.subject}*`,`👥 Total Members: *${meta.participants.length}*`,`👑 Admins: ${admins}`,`👤 Members: ${meta.participants.length-admins}`]),...ci},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('👥 *GROUP SIZE*',['❌ '+e.message]),...ci},{quoted:m});}}},
  {command:'listadmins',aliases:['admins','showadmins'],category:'group',description:'List all group admins',groupOnly:true,usage:'.listadmins',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;try{const meta=await sock.groupMetadata(chatId);const admins=meta.participants.filter(p=>p.admin);const mentions=admins.map(a=>a.id);await sock.sendMessage(chatId,{text:box('👑 *GROUP ADMINS*',[`👥 ${meta.subject}`,`👑 ${admins.length} Admin(s):`,'',...admins.map(a=>`• @${a.id.split('@')[0]}${a.admin==='superadmin'?' 🌟':''}`)]),...ci,mentions},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('👑 *ADMINS*',['❌ '+e.message]),...ci},{quoted:m});}}},
  {command:'listmembers',aliases:['members','allmembers'],category:'group',description:'List all group members',groupOnly:true,usage:'.listmembers',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;try{const meta=await sock.groupMetadata(chatId);const members=meta.participants;await sock.sendMessage(chatId,{text:box('👥 *MEMBERS LIST*',[`📛 ${meta.subject}`,`👥 ${members.length} Members:`,'',...members.slice(0,30).map((p,i)=>`${i+1}. +${p.id.split('@')[0]}${p.admin?' 👑':''}`),members.length>30?`... +${members.length-30} more`:null].filter(Boolean)),...ci},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('👥 *MEMBERS*',['❌ '+e.message]),...ci},{quoted:m});}}},
  {command:'setgroupicon',aliases:['setgpic','grouppp','setgroupphoto'],category:'admin',description:'Set group profile photo',groupOnly:true,adminOnly:true,usage:'.setgroupicon (reply to image)',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;if(!ctx.isBotAdmin)return sock.sendMessage(chatId,{text:box('🖼️ *GROUP ICON*',['❌ Make me admin first!']),...ci},{quoted:m});
    const img=m.message?.imageMessage||m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if(!img)return sock.sendMessage(chatId,{text:box('🖼️ *GROUP ICON*',['💀 Reply to an image with .setgroupicon']),...ci},{quoted:m});
    try{const {downloadContentFromMessage}=require('@whiskeysockets/baileys');const stream=await downloadContentFromMessage(img,'image');const chunks=[];for await(const c of stream)chunks.push(c);await sock.updateGroupProfilePicture(chatId,Buffer.concat(chunks));await sock.sendMessage(chatId,{text:box('🖼️ *GROUP ICON*',['✅ Group photo updated!']),...ci},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('🖼️ *GROUP ICON*',['❌ '+e.message]),...ci},{quoted:m});}}},
  {command:'mentionadmins',aliases:['tagadmins','pingadmins'],category:'group',description:'Mention all admins',groupOnly:true,usage:'.mentionadmins [message]',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;try{const meta=await sock.groupMetadata(chatId);const admins=meta.participants.filter(p=>p.admin);const msg=args.join(' ')||'Admins needed here!';await sock.sendMessage(chatId,{text:`👑 *Admins Mentioned!*\n\n${admins.map(a=>`@${a.id.split('@')[0]}`).join(' ')}\n\n💬 ${msg}`,...ci,mentions:admins.map(a=>a.id)},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('👑 *MENTION*',['❌ '+e.message]),...ci},{quoted:m});}}},
  {command:'grouprules',aliases:['rules','grules'],category:'group',description:'Set or show group rules',groupOnly:true,usage:'.grouprules [set <rules>]',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const fs=require('fs'),path=require('path');const file=path.join(__dirname,'../data/grouprules.json');let rules={};try{rules=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
    if(args[0]==='set'&&ctx.isSenderAdmin){const r=args.slice(1).join(' ');rules[chatId]=r;try{fs.writeFileSync(file,JSON.stringify(rules,null,2));}catch{}await sock.sendMessage(chatId,{text:box('📜 *RULES SET*',['✅ Group rules updated!']),...ci},{quoted:m});}
    else{const r=rules[chatId];await sock.sendMessage(chatId,{text:box('📜 *GROUP RULES*',r?r.split('\n'):[`No rules set yet.`,'Admins: .grouprules set <your rules>']),...ci},{quoted:m});}}},
  {command:'poll',aliases:['vote','survey'],category:'group',description:'Create a poll',groupOnly:true,usage:'.poll <question> | opt1 | opt2 ...',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const parts=args.join(' ').split('|');const question=(parts[0]||'').trim();const options=parts.slice(1).map(o=>o.trim()).filter(Boolean);
    if(!question||options.length<2)return sock.sendMessage(chatId,{text:box('📊 *POLL*',['💀 Usage: .poll Who is best? | Option A | Option B']),...ci},{quoted:m});
    try{await sock.sendMessage(chatId,{poll:{name:question,values:options,selectableCount:1}},{quoted:m});}catch{await sock.sendMessage(chatId,{text:box('📊 *POLL*',[`❓ ${question}`,'',...options.map((o,i)=>`${['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'][i]||`${i+1}.`} ${o}`)]),...ci},{quoted:m});}}},
  {command:'antiraid',aliases:['raidprotect','raidmode'],category:'admin',description:'Toggle anti-raid mode (kick mass joins)',groupOnly:true,adminOnly:true,usage:'.antiraid on/off',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;const state=(args[0]||'on').toLowerCase()==='on';await sock.sendMessage(chatId,{text:box('🛡️ *ANTI-RAID*',[`${state?'✅ ENABLED':'❌ DISABLED'}`,`💀 Raid protection is ${state?'ON':'OFF'}`,state?'Bot will kick mass joiners automatically!':'']),...ci},{quoted:m});}},
  {command:'groupstats',aliases:['gcstats','groupinfo2'],category:'group',description:'Detailed group statistics',groupOnly:true,usage:'.groupstats',
    async handler(sock,m,args,ctx={}){const ci=getChannelInfo();const chatId=ctx.chatId||m.key.remoteJid;try{const meta=await sock.groupMetadata(chatId);const created=new Date(meta.creation*1000).toLocaleDateString();const admins=meta.participants.filter(p=>p.admin).length;await sock.sendMessage(chatId,{text:box('📊 *GROUP STATS*',[`📛 *${meta.subject}*`,`🆔 ${chatId.split('@')[0]}`,`📅 Created: ${created}`,`👥 Members: ${meta.participants.length}`,`👑 Admins: ${admins}`,`📝 ${meta.desc?.slice(0,80)||'No description'}`]),...ci},{quoted:m});}catch(e){await sock.sendMessage(chatId,{text:box('📊 *STATS*',['❌ '+e.message]),...ci},{quoted:m});}}},
];
