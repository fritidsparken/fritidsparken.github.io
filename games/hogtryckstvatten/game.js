(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('scene'),ctx=canvas.getContext('2d'),W=1600,H=900;
const dirt=document.createElement('canvas');dirt.width=W;dirt.height=H;const dc=dirt.getContext('2d',{willReadFrequently:true});
const sample=document.createElement('canvas');sample.width=200;sample.height=113;const sc=sample.getContext('2d',{willReadFrequently:true});
const levels=window.WASH_LEVELS,KEY='fp-pressure-wash-v1';let save={best:{},tool:0,sound:true},stored=null;
try{stored=JSON.parse(localStorage.getItem(KEY));if(stored&&typeof stored==='object')save={...save,...stored,best:stored.best||{}}}catch{}
const kit=[{name:'Standard',symbol:'💧',radius:25,power:1,need:0,desc:'En stadig stråle för ditt första uppdrag.'},{name:'Bredstråle',symbol:'💦',radius:41,power:.9,need:1,desc:'Bredare stråle för stora ytor.'},{name:'Turbomunstycke',symbol:'🌀',radius:48,power:1.5,need:3,desc:'Mer kraft mot envis smuts.'},{name:'Regnbågskraft',symbol:'🌈',radius:62,power:1.8,need:6,desc:'Din starkaste tvätt. Ett färgglatt vattenmoln!'}];
let level=0,img=null,character=new Image(),ready=false,playing=false,done=false,elapsed=0,percent=0,initial=1,holding=false,last=null,aim={x:950,y:480},particles=[],clock=performance.now(),lastMeasure=0,lastSave=0,highlight=0,transform={s:1,x:0,y:0},audio=null,noise=null,gain=null,muted=save.sound===false,keys=new Set(),toastTime=0;
let currentSnapshot=null,loadedToken=0;const images=new Map();
character.src='assets/character-body.webp';
const gun=new Image();gun.src='assets/gun-hand.webp';
let menuPage=0, cameraX=800, pointerScreen=null;
// Shared transform drives both the articulated washer and the water origin.
function nozzlePose(px,py,tx,ty,width,anchor,tip){const dx=tx-px,dy=ty-py,angle=Math.atan2(dy,dx)-Math.asin(Math.max(-1,Math.min(1,(tip.y-anchor.y)*width/Math.max(1,Math.hypot(dx,dy))))),c=Math.cos(angle),s=Math.sin(angle);const lx=(tip.x-anchor.x)*width,ly=(tip.y-anchor.y)*width;return {angle,x:px+c*lx-s*ly,y:py+s*lx+c*ly}}
// Two-bone arms: fixed limb lengths, continuous elbow bend and shared torso anchors.
let rigAngle=0,rigLean=0,sprayAim={x:950,y:480};
function armJoint(a,b,l1,l2){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.0001,Math.hypot(dx,dy));
 const reach=Math.min(l1+l2-.001,Math.max(Math.abs(l1-l2)+.001,d));
 const along=(l1*l1-l2*l2+reach*reach)/(2*reach),bend=Math.sqrt(Math.max(0,l1*l1-along*along));
 return {x:a.x+dx/d*along-dy/d*bend,y:a.y+dy/d*along+dx/d*bend};
}
function sleeve(a,b,width,dark=false){
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
 ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));
 const g=ctx.createLinearGradient(0,-width/2,0,width/2);
 g.addColorStop(0,dark?'#9c292b':'#d95049');g.addColorStop(.4,dark?'#bd3e39':'#cf423b');g.addColorStop(1,'#812428');
 ctx.lineCap='round';ctx.strokeStyle='#79282a';ctx.lineWidth=width+2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,0);ctx.stroke();
 ctx.strokeStyle=g;ctx.lineWidth=width;ctx.stroke();
 ctx.strokeStyle='rgba(255,153,128,.2)';ctx.lineWidth=width*.06;ctx.beginPath();ctx.moveTo(width*.15,-width*.26);ctx.lineTo(len-width*.1,-width*.26);ctx.stroke();ctx.restore();
}
function drawArm(shoulder,wrist,h,dark){const e=armJoint(shoulder,wrist,h*.115,h*.125);sleeve(shoulder,e,h*.068,dark);sleeve(e,wrist,h*.059,dark);}
function drawWasher(charX,charY,charW,charH,target,dt){
 const k=charH/1480,hip={x:charX+300*k,y:charY+870*k};
 const desired=Math.atan2(target.y-(charY+620*k),target.x-(charX+430*k));
 rigAngle+=Math.atan2(Math.sin(desired-rigAngle),Math.cos(desired-rigAngle))*(1-Math.exp(-14*dt));
 rigLean+=(Math.max(-.055,Math.min(.055,rigAngle*.045))-rigLean)*(1-Math.exp(-8*dt));
 const bodyPoint=(x,y)=>({x:hip.x+((x-300)*Math.cos(rigLean)-(y-870)*Math.sin(rigLean))*k,y:hip.y+((x-300)*Math.sin(rigLean)+(y-870)*Math.cos(rigLean))*k});
 const near=bodyPoint(405,585),far=bodyPoint(355,595);
 const pivot={x:near.x+Math.cos(rigAngle)*charH*.13,y:near.y+charH*.065+Math.sin(rigAngle)*charH*.13};
 const gunW=charH*.43,anchor={x:.16,y:.24},tip={x:.9503,y:.1068};
 const pose=nozzlePose(pivot.x,pivot.y,target.x,target.y,gunW,anchor,tip);
 const cuff=(x,y)=>({x:pivot.x+((x-anchor.x)*Math.cos(pose.angle)-(y-anchor.y)*Math.sin(pose.angle))*gunW,y:pivot.y+((x-anchor.x)*Math.sin(pose.angle)+(y-anchor.y)*Math.cos(pose.angle))*gunW});
 drawArm(far,cuff(.066,.14),charH,true);
 if(character.complete&&character.naturalWidth){
 // Legs remain planted. The torso turns about the hips, carrying the shoulders.
 ctx.save();ctx.beginPath();ctx.rect(charX,charY+870*k,charW,charH-870*k);ctx.clip();ctx.drawImage(character,charX,charY,charW,charH);ctx.restore();
 ctx.save();ctx.translate(hip.x,hip.y);ctx.rotate(rigLean);ctx.scale(k,k);ctx.translate(-300,-870);
 // Exclude the baked-in near sleeve and loose hose; both are articulated below.
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1080,0);ctx.lineTo(1080,500);ctx.lineTo(415,540);ctx.lineTo(368,615);ctx.lineTo(390,710);ctx.lineTo(455,850);ctx.lineTo(455,870);ctx.lineTo(0,870);ctx.closePath();ctx.clip();ctx.drawImage(character,0,0,1080,1480);ctx.restore();
 }
 const hose={x:charX+530*k,y:charY+870*k},end=cuff(.32,.27);
 ctx.lineCap='round';ctx.strokeStyle='#32363a';ctx.lineWidth=charH*.021;ctx.beginPath();ctx.moveTo(hose.x,hose.y);ctx.bezierCurveTo(hose.x+charH*.04,hose.y-charH*.08,end.x-charH*.04,end.y+charH*.18,end.x,end.y);ctx.stroke();ctx.strokeStyle='#7b8188';ctx.lineWidth=charH*.009;ctx.stroke();
 drawArm(near,cuff(.16,.24),charH,false);
 if(gun.complete&&gun.naturalWidth){ctx.save();ctx.translate(pivot.x,pivot.y);ctx.rotate(pose.angle);ctx.drawImage(gun,-anchor.x*gunW,-anchor.y*gunW,gunW,gunW*gun.naturalHeight/gun.naturalWidth);ctx.restore();}
 return pose;
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save))}catch{}}
function golds(){return levels.filter(l=>Number.isFinite(save.best[l.id])&&save.best[l.id]<=l.goal).length}
function unlocked(i){return i===0||Number.isFinite(save.best[levels[i-1].id])}
function tool(){if(!kit[save.tool]||golds()<kit[save.tool].need)save.tool=0;return kit[save.tool]}
function time(n){return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`}
function stars(i,t){return t<=levels[i].goal?3:t<=levels[i].goal*1.6?2:1}
function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;toastTime=3}
function getImage(id){if(images.has(id))return images.get(id);const p=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=`assets/${id}.webp`});images.set(id,p);p.catch(()=>images.delete(id));return p}
function polyPath(c){c.beginPath();for(const p of levels[level].polygons){p.forEach(([x,y],i)=>i?c.lineTo(x*W,y*H):c.moveTo(x*W,y*H));c.closePath()}}
let seed=1;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function makeDirt(){seed=12345+level*923;dc.clearRect(0,0,W,H);dc.save();polyPath(dc);dc.clip();dc.fillStyle='rgba(67,65,24,.75)';dc.fillRect(0,0,W,H);
 for(let i=0;i<9000;i++){const x=rand()*W,y=rand()*H,r=1+rand()*24;dc.fillStyle=`rgba(${25+rand()*40|0},${35+rand()*43|0},${10+rand()*20|0},${.08+rand()*.22})`;dc.beginPath();dc.ellipse(x,y,r,r*(.4+rand()),0,0,Math.PI*2);dc.fill()}
 for(let i=0;i<520;i++){let x=rand()*W,y=rand()*H;dc.strokeStyle=`rgba(37,48,17,${.06+rand()*.23})`;dc.lineWidth=1+rand()*5;dc.beginPath();dc.moveTo(x,y);dc.lineTo(x+rand()*7,y+20+rand()*80);dc.stroke()}dc.restore();initial=mass();}
function mass(){sc.clearRect(0,0,200,113);sc.drawImage(dirt,0,0,200,113);let sum=0;const data=sc.getImageData(0,0,200,113).data;for(let i=3;i<data.length;i+=4)sum+=data[i];return sum}
function measure(){percent=Math.min(100,Math.max(0,100*(1-mass()/initial)));if(percent>=98.4&&!done)finish();$('fill').style.width=percent+'%';$('progressLabel').textContent=`${levels[level].label}: ${Math.floor(percent)}% rent`}
async function load(i,resume=false){const token=++loadedToken;playing=false;holding=false;ready=false;$('loading').hidden=false;if($('panel').open)$('panel').close();try{const im=await getImage(levels[i].id);if(token!==loadedToken)return;level=i;cameraX=800;pointerScreen=null;img=im;elapsed=0;percent=0;done=false;makeDirt();
 if(resume&&save.active?.id===levels[i].id){elapsed=Number(save.active.elapsed)||0;const snap=new Image();await new Promise(resolve=>{snap.onload=()=>{dc.clearRect(0,0,W,H);dc.drawImage(snap,0,0,W,H);resolve()};snap.onerror=resolve;snap.src=save.active.mask});}
 ready=true;measure();$('levelName').textContent=levels[i].name;$('target').textContent=`★ Tidsmål ${time(levels[i].goal)}`;$('hint').style.opacity=1;$('hint').textContent=innerHeight>innerWidth?'Tvätta vid skärmkanten för att flytta vyn':'Håll in och dra för att tvätta';updateTool();$('loading').hidden=true;if(!done){playing=true;clock=performance.now()}if(i+1<levels.length)getImage(levels[i+1].id).catch(()=>{});
 }catch{$('loading').hidden=true;openPanel('<h2>Bilden kunde inte laddas</h2><p>Kontrollera anslutningen och försök igen.</p><div class="actions"><button class="primary" data-retry="'+i+'">Försök igen</button></div>')}}
function snapshot(){if(!ready||done)return;save.active={id:levels[level].id,elapsed,mask:dirt.toDataURL('image/png')};persist()}
function updateTool(){$('toolName').textContent=tool().name;$('toolDetail').textContent='Håll in och spruta';$('sound').textContent=muted?'♫':'♪';$('sound').setAttribute('aria-label',muted?'Slå på ljud':'Stäng av ljud')}
function openPanel(html){holding=false;last=null;playing=false;setNoise(false);$('panelBody').innerHTML=html;if(!$('panel').open)$('panel').showModal()}
function menu(page=menuPage){menuPage=Math.max(0,Math.min(Math.ceil(levels.length/6)-1,page));snapshot();openPanel(`<h2>Välj ditt nästa uppdrag</h2><p>Gör allt rent för att öppna nästa bana. Klara tidsmålet för tre stjärnor och nya tillbehör.</p><div class="cards">${levels.slice(menuPage*6,menuPage*6+6).map((l,n)=>{const i=menuPage*6+n;const best=save.best[l.id];return `<button class="card" data-level="${i}" ${!unlocked(i)?'disabled':''}><img src="assets/${l.id}.webp" alt="${l.name}" loading="lazy"><span class="copy"><strong>${unlocked(i)?'':'🔒 '}${l.name}</strong><small>★ ${time(l.goal)} ${Number.isFinite(best)?'· Bäst '+time(best):''}</small><span class="stars">${Number.isFinite(best)?'★'.repeat(stars(i,best))+'☆'.repeat(3-stars(i,best)):unlocked(i)?'Redo att tvätta':'Klara föregående bana'}</span></span></button>`}).join('')}</div><div class="actions"><button class="secondary" data-page="${menuPage-1}" ${menuPage===0?'disabled':''}>← Föregående</button><span>Sida ${menuPage+1} / ${Math.ceil(levels.length/6)}</span><button class="secondary" data-page="${menuPage+1}" ${menuPage>=Math.ceil(levels.length/6)-1?'disabled':''}>Nästa →</button></div>`)}
function toolsMenu(){openPanel(`<h2>Din högtryckstvätt</h2><p>${golds()} av ${levels.length} tidsmål klarade. Klara tidsmålen på olika banor för att låsa upp mer kraft.</p><div class="tool-grid">${kit.map((k,i)=>`<button class="card tool-card ${save.tool===i?'selected':''}" data-tool="${i}" ${golds()<k.need?'disabled':''}><div class="symbol">${k.symbol}</div><strong>${k.name}${save.tool===i?' ✓':''}</strong><p>${k.desc}</p><small>${golds()>=k.need?'Välj munstycke':`🔒 Klara ${k.need} olika tidsmål`}</small></button>`).join('')}</div>`)}
function finish(){done=true;playing=false;holding=false;percent=100;dc.clearRect(0,0,W,H);const l=levels[level],oldGold=golds();save.best[l.id]=Math.min(save.best[l.id]??Infinity,elapsed);delete save.active;persist();setNoise(false);chime();const newly=kit.filter(k=>k.need>oldGold&&k.need<=golds());openPanel(`<div class="welcome"><div class="big">✨</div><h2>Skinande rent!</h2><div class="stars" style="font-size:42px">${'★'.repeat(stars(level,elapsed))}${'☆'.repeat(3-stars(level,elapsed))}</div><p><b>${l.name}</b> är klar på <b>${time(elapsed)}</b>.<br>Tidsmål: ${time(l.goal)} · Ditt rekord: ${time(save.best[l.id])}</p>${newly.length?`<p><b>🔓 ${newly.map(k=>k.name).join(', ')} upplåst!</b></p>`:elapsed>l.goal?'<p>Testa igen och slå tidsmålet för att låsa upp bättre tillbehör.</p>':'<p>Du klarade tidsmålet. Snyggt tvättat!</p>'}<div class="actions">${level<levels.length-1?`<button class="primary" data-level="${level+1}">Nästa uppdrag →</button>`:'<button class="primary" data-menu>Alla uppdrag</button>'}<button class="secondary" data-level="${level}">Spela igen</button><button class="secondary" data-tools>Verktyg</button></div></div>`)}
function initAudio(){if(audio)return;try{audio=new(window.AudioContext||window.webkitAudioContext)();let b=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);let d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.25;noise=audio.createBufferSource();noise.buffer=b;noise.loop=true;let filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1600;gain=audio.createGain();gain.gain.value=0;noise.connect(filter).connect(gain).connect(audio.destination);noise.start()}catch{}}
function setNoise(on){if(gain)gain.gain.setTargetAtTime(on&&!muted?.22:0,audio.currentTime,.06)}
function chime(){if(muted||!audio)return;[523,659,784,1046].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.12,audio.currentTime+i*.12);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.12+.6);o.connect(g).connect(audio.destination);o.start(audio.currentTime+i*.12);o.stop(audio.currentTime+i*.12+.7)})}
function wash(dt,p=aim){const k=tool(),r=k.radius*1.25;dc.save();dc.globalCompositeOperation='destination-out';const from=last||p,dist=Math.hypot(p.x-from.x,p.y-from.y),steps=Math.max(1,Math.ceil(dist/(r*.25)));for(let n=0;n<=steps;n++){const x=from.x+(p.x-from.x)*n/steps,y=from.y+(p.y-from.y)*n/steps;const g=dc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${Math.min(.85,dt*12*k.power)})`);g.addColorStop(.65,`rgba(0,0,0,${Math.min(.65,dt*8*k.power)})`);g.addColorStop(1,'transparent');dc.fillStyle=g;dc.fillRect(x-r,y-r,2*r,2*r)}dc.restore();last={...p};for(let n=0;n<6;n++)particles.push({x:p.x+(Math.random()-.5)*r,y:p.y+(Math.random()-.5)*r,vx:(Math.random()-.5)*260,vy:-50-Math.random()*160,life:.3+Math.random()*.3,max:.6});}
function resize(){canvas.width=Math.round(innerWidth*Math.min(devicePixelRatio,2));canvas.height=Math.round(innerHeight*Math.min(devicePixelRatio,2));}
window.addEventListener('resize',resize);resize();
function render(now){const wallDt=Math.max(0,(now-clock)/1000),dt=Math.min(.04,wallDt);clock=now;const cw=canvas.width,ch=canvas.height;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);const portrait=innerHeight>innerWidth;const scale=Math.max(cw/W,ch/H),scaleX=scale,scaleY=scale,dpr=cw/innerWidth,viewW=cw/scale;
 if(holding&&pointerScreen&&portrait){const edge=innerWidth*.16;let pan=pointerScreen.x<edge?-(edge-pointerScreen.x)/edge:pointerScreen.x>innerWidth-edge?(pointerScreen.x-innerWidth+edge)/edge:0;cameraX+=pan*350*dt;}
 cameraX=Math.max(viewW/2,Math.min(W-viewW/2,cameraX));const ox=cw/2-cameraX*scale,oy=(ch-H*scale)/2;transform={sx:scale/dpr,sy:scale/dpr,x:ox/dpr,y:oy/dpr};
 if(holding&&pointerScreen){aim.x=(pointerScreen.x-transform.x)/transform.sx;aim.y=(pointerScreen.y-transform.y)/transform.sy;}
 if(img){ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.drawImage(img,0,0,W,H);ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(dirt,0,0);ctx.restore();
 if(highlight>0){highlight-=dt;ctx.save();ctx.globalAlpha=.35+.15*Math.sin(now/140);ctx.globalCompositeOperation='source-over';ctx.drawImage(dirt,0,0);ctx.restore();sc.clearRect(0,0,200,113);sc.drawImage(dirt,0,0,200,113);const pix=sc.getImageData(0,0,200,113).data;ctx.strokeStyle='#ffe341';ctx.lineWidth=3;for(let y=0;y<113;y+=7)for(let x=0;x<200;x+=7)if(pix[(y*200+x)*4+3]>45){ctx.beginPath();ctx.arc(x*8,y*H/113,13,0,Math.PI*2);ctx.stroke()}}
 if(playing&&!done){elapsed+=wallDt;const speed=420*dt;if(keys.has('ArrowLeft'))aim.x-=speed;if(keys.has('ArrowRight'))aim.x+=speed;if(keys.has('ArrowUp'))aim.y-=speed;if(keys.has('ArrowDown'))aim.y+=speed;aim.x=Math.max(0,Math.min(W,aim.x));aim.y=Math.max(0,Math.min(H,aim.y));const follow=1-Math.exp(-24*dt);sprayAim.x+=(aim.x-sprayAim.x)*follow;sprayAim.y+=(aim.y-sprayAim.y)*follow;if(holding){wash(dt,sprayAim);$('hint').style.opacity=0}if(now-lastMeasure>250){measure();lastMeasure=now}if(now-lastSave>5000){snapshot();lastSave=now}}
 ctx.save();ctx.scale(1,scaleX/scaleY);const artAim={x:sprayAim.x,y:sprayAim.y*scaleY/scaleX};
 const charH=portrait?180:620,charW=character.naturalWidth?charH*character.naturalWidth/character.naturalHeight:300,charX=-ox/scale+10,charY=H*scaleY/scaleX-charH-(portrait?160:20)/transform.sx;
 const pose=drawWasher(charX,charY,charW,charH,artAim,dt);
 if(holding&&playing){const sx=pose.x,sy=pose.y;const radius=tool().radius*1.25;let grad=ctx.createLinearGradient(sx,sy,artAim.x,artAim.y);grad.addColorStop(0,'#e2ffffdd');grad.addColorStop(1,save.tool===3?'#9df9ff88':'#a5edff99');ctx.fillStyle=grad;const a=Math.atan2(artAim.y-sy,artAim.x-sx),nx=-Math.sin(a)*radius*.6,ny=Math.cos(a)*radius*.6;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(artAim.x+nx,artAim.y+ny);ctx.quadraticCurveTo(artAim.x+Math.cos(a)*radius,artAim.y+Math.sin(a)*radius,artAim.x-nx,artAim.y-ny);ctx.closePath();ctx.fill();ctx.strokeStyle='#f0ffffbb';ctx.lineWidth=3;for(let j=0;j<9;j++){ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(artAim.x+(Math.random()-.5)*radius,artAim.y+(Math.random()-.5)*radius);ctx.stroke()}}
 ctx.restore();
 particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=450*dt;ctx.fillStyle=`rgba(225,254,255,${Math.max(0,p.life/p.max)})`;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill()}
 if(ready&&!done&&!$('panel').open){ctx.strokeStyle='#ffffffcc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(aim.x,aim.y,tool().radius*1.25,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(aim.x,aim.y,3,0,Math.PI*2);ctx.fill()}ctx.restore()}
 $('timer').textContent=time(elapsed);setNoise(holding&&playing);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').style.opacity=0}requestAnimationFrame(render)}
function pointer(e){const r=canvas.getBoundingClientRect();pointerScreen={x:e.clientX-r.left,y:e.clientY-r.top};aim={x:(e.clientX-r.left-transform.x)/transform.sx,y:(e.clientY-r.top-transform.y)/transform.sy};return aim.x>=0&&aim.x<=W&&aim.y>=0&&aim.y<=H}
canvas.addEventListener('pointerdown',e=>{if(!playing||!ready||!pointer(e))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);holding=true;last=null;initAudio();audio?.resume();canvas.focus({preventScroll:true})});canvas.addEventListener('pointermove',e=>{if(!playing)return;pointer(e)});function release(){pointerScreen=null;holding=false;last=null;setNoise(false)}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);window.addEventListener('blur',()=>{release();keys.clear();if(playing)pause()});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();keys.add(e.key);if(e.key===' '&&playing){pointerScreen=null;holding=true;initAudio();audio?.resume()}}});canvas.addEventListener('keyup',e=>{keys.delete(e.key);if(e.key===' ')release()});
function pause(){snapshot();openPanel('<div class="welcome"><div class="big">💧</div><h2>En liten tvättpaus</h2><p>Din tid står stilla. Fortsätt precis där du var.</p><div class="actions"><button class="primary" data-resume>Fortsätt tvätta</button><button class="secondary" data-menu>Uppdrag</button><button class="secondary" data-restart>Börja om banan</button></div></div>')}
function resume(){if(!ready||done){menu();return}$('panel').close();playing=true;clock=performance.now();canvas.focus({preventScroll:true})}
$('panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-page'))return menu(+b.dataset.page);if(b.hasAttribute('data-level')){const i=+b.dataset.level;if(unlocked(i))load(i,save.active?.id===levels[i].id);return}if(b.hasAttribute('data-retry'))return load(+b.dataset.retry);if(b.hasAttribute('data-menu'))return menu();if(b.hasAttribute('data-tools'))return toolsMenu();if(b.hasAttribute('data-resume'))return resume();if(b.hasAttribute('data-start')){const i=levels.findIndex(l=>l.id===save.active?.id);return load(i<0?0:i,i>=0)}if(b.hasAttribute('data-restart'))return openPanel('<h2>Börja om uppdraget?</h2><p>Smutsen och tiden på den här banan börjar om. Dina rekord och verktyg finns kvar.</p><div class="actions"><button class="secondary" data-resume>Fortsätt</button><button class="primary" data-confirm-restart>Börja om</button></div>');if(b.hasAttribute('data-confirm-restart')){delete save.active;persist();return load(level)}if(b.hasAttribute('data-tool')){const i=+b.dataset.tool;if(golds()>=kit[i].need){save.tool=i;persist();updateTool();toast(kit[i].name+' valt');ready&&!done?resume():toolsMenu()}}});
$('closePanel').onclick=()=>ready&&!done?resume():menu();$('panel').addEventListener('cancel',e=>{e.preventDefault();if(ready&&!done)resume()});$('levels').onclick=()=>menu(Math.floor(level/6));$('tools').onclick=toolsMenu;$('pause').onclick=pause;$('reveal').onclick=()=>{if(!ready)return;highlight=4;toast('Gula ringar visar smuts som finns kvar')};$('sound').onclick=()=>{muted=!muted;save.sound=!muted;persist();initAudio();audio?.resume();updateTool()};
document.addEventListener('visibilitychange',()=>{if(document.hidden){snapshot();release();keys.clear();if(playing)pause()}});window.addEventListener('pagehide',snapshot);
updateTool();getImage('house').then(im=>{if(!img)img=im}).catch(()=>{});openPanel(`<div class="welcome"><div class="big">💦</div><h2>Lite smuts.<br>Massor av tvättglädje.</h2><p>${levels.length} soliga uppdrag väntar. Håll in och dra över smutsen – se färgerna komma fram! Slå tidsmålen för att låsa upp bättre munstycken.</p><div class="actions"><button class="primary" data-start>${save.active?'Fortsätt tvätta':'Nu gör vi rent!'} →</button><button class="secondary" data-menu>Välj uppdrag</button></div><p><small>Mus eller finger · Pilar + mellanslag · Sparas på denna enhet</small></p></div>`);requestAnimationFrame(render);
})();
