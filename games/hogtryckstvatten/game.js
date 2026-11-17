(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('scene'),ctx=canvas.getContext('2d'),W=1600,H=900;
const dirt=document.createElement('canvas');dirt.width=W;dirt.height=H;const dc=dirt.getContext('2d',{willReadFrequently:true});
const sample=document.createElement('canvas');sample.width=200;sample.height=113;const sc=sample.getContext('2d',{willReadFrequently:true});
const foam=document.createElement('canvas');foam.width=W;foam.height=H;const fc=foam.getContext('2d');
const foamDisplay=document.createElement('canvas');foamDisplay.width=W;foamDisplay.height=H;const fdc=foamDisplay.getContext('2d');
const foamTexture=document.createElement('canvas');foamTexture.width=W;foamTexture.height=H;const ftc=foamTexture.getContext('2d');let foamDirty=true;
function makeFoamTexture(){
 ftc.fillStyle='#fff';ftc.fillRect(0,0,W,H);let n=82731;const rnd=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296};
 for(let i=0;i<34000;i++){const x=rnd()*W,y=rnd()*H,r=.5+rnd()*3.5;const g=ftc.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.65,'#fff');g.addColorStop(1,'rgba(190,200,205,.23)');ftc.fillStyle=g;ftc.beginPath();ftc.arc(x,y,r,0,Math.PI*2);ftc.fill();}
}
makeFoamTexture();
function drawFoam(){if(foamDirty){fdc.clearRect(0,0,W,H);fdc.globalCompositeOperation='source-over';fdc.drawImage(foam,0,0);fdc.globalCompositeOperation='source-in';fdc.drawImage(foamTexture,0,0);fdc.globalCompositeOperation='source-over';foamDirty=false;}ctx.drawImage(foamDisplay,0,0);}
let phase='foam',foamPercent=0,foamReady=false,areaMass=1,areaMask=null,pointerValid=true;
const levels=window.WASH_LEVELS;levels.forEach(l=>l.goal=Math.round(l.goal*1.8));const KEY='fp-pressure-wash-v1';let save={best:{},tool:0,sound:true},stored=null;
try{stored=JSON.parse(localStorage.getItem(KEY));if(stored&&typeof stored==='object')save={...save,...stored,best:stored.best||{}}}catch{}
const kit=[{name:'Standard',symbol:'💧',radius:25,power:1,need:0,desc:'En stadig stråle för ditt första uppdrag.'},{name:'Bredstråle',symbol:'💦',radius:41,power:.9,need:1,desc:'Bredare stråle för stora ytor.'},{name:'Turbomunstycke',symbol:'🌀',radius:48,power:1.5,need:3,desc:'Mer kraft mot envis smuts.'},{name:'Regnbågskraft',symbol:'🌈',radius:62,power:1.8,need:6,desc:'Din starkaste tvätt. Ett färgglatt vattenmoln!'}];
let level=0,img=null,ready=false,playing=false,done=false,elapsed=0,percent=0,initial=1,holding=false,last=null,aim={x:950,y:480},particles=[],clock=performance.now(),lastMeasure=0,lastSave=0,highlight=0,transform={sx:1,sy:1,x:0,y:0},audio=null,noise=null,gain=null,muted=save.sound===false,keys=new Set(),toastTime=0;
let currentSnapshot=null,loadedToken=0;const images=new Map();

let menuPage=0, cameraX=800, pointerScreen=null;
// Single atlas rig owns both hands, torso and nozzle origin.
const washerRig=new window.WasherRig();let sprayAim={x:950,y:480};
function drawWasher(x,y,w,h,target,dt){return washerRig.draw(ctx,x,y,h,target,dt,holding&&playing)}
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
function mass(layer=dirt){sc.clearRect(0,0,200,113);sc.drawImage(layer,0,0,200,113);let sum=0;const data=sc.getImageData(0,0,200,113).data;for(let i=3;i<data.length;i+=4)sum+=data[i];return sum}
function updateStage(){
 $('foamMode').setAttribute('aria-pressed',String(phase==='foam'));
 $('rinseMode').setAttribute('aria-pressed',String(phase==='rinse'));
 $('foamMode').disabled=phase==='rinse';$('rinseMode').disabled=!foamReady;
 $('hint').textContent=phase==='foam'?(foamReady?'Hela ytan är skummad. Välj 2. Skölj.':'Håll in och dra för att täcka ytan med skumschampo.'):'Skölj bort allt lödder och all smuts.';

}
function measure(){
 if(phase==='foam'){
  foamPercent=Math.min(100,100*mass(foam)/areaMass);
  if(foamPercent>=97&&!foamReady){foamReady=true;foamPercent=100;fc.save();polyPath(fc);fc.clip();fc.globalCompositeOperation='destination-over';fc.fillStyle='#fff';fc.fillRect(0,0,W,H);fc.restore();foamDirty=true;release();updateStage();snapshot();}
  if(foamReady)foamPercent=100;
  $('fill').style.width=foamPercent+'%';$('progressLabel').textContent=`Skumschampo: ${Math.floor(foamPercent)}%`;
 }else{
  percent=Math.min(100,Math.max(0,100*(1-Math.max(mass()/initial,mass(foam)/areaMass))));
  if(percent>=98.4&&!done)finish();
  $('fill').style.width=percent+'%';$('progressLabel').textContent=`Avsköljt: ${Math.floor(percent)}%`;
 }
}
async function load(i,resume=false){const token=++loadedToken;playing=false;holding=false;ready=false;$('loading').hidden=false;if($('panel').open)$('panel').close();try{const [im]=await Promise.all([getImage(levels[i].id),window.WasherRig.ready]);if(token!==loadedToken)return;level=i;cameraX=800;pointerScreen=null;img=im;elapsed=0;percent=0;done=false;last=null;particles=[];aim={x:800,y:450};sprayAim={...aim};makeDirt();
 phase='foam';foamReady=false;foamPercent=0;fc.clearRect(0,0,W,H);fc.save();polyPath(fc);fc.clip();fc.fillStyle='#fff';fc.fillRect(0,0,W,H);fc.restore();areaMass=mass(foam);areaMask=sc.getImageData(0,0,200,113).data;fc.clearRect(0,0,W,H);
 if(resume&&save.active?.id===levels[i].id){elapsed=Number(save.active.elapsed)||0;const snap=new Image();await new Promise(resolve=>{snap.onload=()=>{dc.clearRect(0,0,W,H);dc.drawImage(snap,0,0,W,H);resolve()};snap.onerror=resolve;snap.src=save.active.mask});
  if(save.active.version>=2){phase=save.active.phase==='rinse'?'rinse':'foam';foamReady=!!save.active.foamReady;if(save.active.foam){const f=new Image();await new Promise(resolve=>{f.onload=()=>{fc.drawImage(f,0,0,W,H);resolve()};f.onerror=resolve;f.src=save.active.foam});}}
  else {phase='foam';foamReady=false;}
 }
 foamDirty=true;ready=true;measure();$('levelName').textContent=levels[i].name;$('target').textContent=`★ Tidsmål ${time(levels[i].goal)}`;$('hint').style.opacity=1;updateStage();updateTool();$('loading').hidden=true;if(!done){playing=true;clock=performance.now()}if(i+1<levels.length)getImage(levels[i+1].id).catch(()=>{});
 }catch{$('loading').hidden=true;openPanel('<h2>Bilden kunde inte laddas</h2><p>Kontrollera anslutningen och försök igen.</p><div class="actions"><button class="primary" data-retry="'+i+'">Försök igen</button></div>')}}
function snapshot(){if(!ready||done)return;save.active={version:3,id:levels[level].id,elapsed,phase,foamReady,foam:foam.toDataURL('image/png'),mask:dirt.toDataURL('image/png')};persist()}
function updateTool(){tool();updateStage();$('sound').textContent=muted?'♫':'♪';$('sound').setAttribute('aria-label',muted?'Slå på ljud':'Stäng av ljud')}
function openPanel(html){holding=false;last=null;playing=false;setNoise(false);$('panelBody').innerHTML=html;if(!$('panel').open)$('panel').showModal()}
function menu(page=menuPage){menuPage=Math.max(0,Math.min(Math.ceil(levels.length/6)-1,page));snapshot();openPanel(`<h2>Välj ditt nästa uppdrag</h2><p>Gör allt rent för att öppna nästa bana. Klara tidsmålet för tre stjärnor och nya tillbehör.</p><div class="cards">${levels.slice(menuPage*6,menuPage*6+6).map((l,n)=>{const i=menuPage*6+n;const best=save.best[l.id];return `<button class="card" data-level="${i}" ${!unlocked(i)?'disabled':''}><img src="assets/${l.id}.webp" alt="${l.name}" loading="lazy"><span class="copy"><strong>${unlocked(i)?'':'🔒 '}${l.name}</strong><small>★ ${time(l.goal)} ${Number.isFinite(best)?'· Bäst '+time(best):''}</small><span class="stars">${Number.isFinite(best)?'★'.repeat(stars(i,best))+'☆'.repeat(3-stars(i,best)):unlocked(i)?'Redo att tvätta':'Klara föregående bana'}</span></span></button>`}).join('')}</div><div class="actions"><button class="secondary" data-page="${menuPage-1}" ${menuPage===0?'disabled':''}>← Föregående</button><span>Sida ${menuPage+1} / ${Math.ceil(levels.length/6)}</span><button class="secondary" data-page="${menuPage+1}" ${menuPage>=Math.ceil(levels.length/6)-1?'disabled':''}>Nästa →</button></div>`)}
function toolsMenu(){openPanel(`<h2>Din högtryckstvätt</h2><p>${golds()} av ${levels.length} tidsmål klarade. Klara tidsmålen på olika banor för att låsa upp mer kraft.</p><div class="tool-grid">${kit.map((k,i)=>`<button class="card tool-card ${save.tool===i?'selected':''}" data-tool="${i}" ${golds()<k.need?'disabled':''}><div class="symbol">${k.symbol}</div><strong>${k.name}${save.tool===i?' ✓':''}</strong><p>${k.desc}</p><small>${golds()>=k.need?'Välj munstycke':`🔒 Klara ${k.need} olika tidsmål`}</small></button>`).join('')}</div>`)}
function finish(){done=true;playing=false;holding=false;percent=100;fc.clearRect(0,0,W,H);foamDirty=true;dc.clearRect(0,0,W,H);const l=levels[level],oldGold=golds();save.best[l.id]=Math.min(save.best[l.id]??Infinity,elapsed);delete save.active;persist();setNoise(false);chime();const newly=kit.filter(k=>k.need>oldGold&&k.need<=golds());openPanel(`<div class="welcome"><div class="big">✨</div><h2>Skinande rent!</h2><div class="stars" style="font-size:42px">${'★'.repeat(stars(level,elapsed))}${'☆'.repeat(3-stars(level,elapsed))}</div><p><b>${l.name}</b> är klar på <b>${time(elapsed)}</b>.<br>Tidsmål: ${time(l.goal)} · Ditt rekord: ${time(save.best[l.id])}</p>${newly.length?`<p><b>🔓 ${newly.map(k=>k.name).join(', ')} upplåst!</b></p>`:elapsed>l.goal?'<p>Testa igen och slå tidsmålet för att låsa upp bättre tillbehör.</p>':'<p>Du klarade tidsmålet. Snyggt tvättat!</p>'}<div class="actions">${level<levels.length-1?`<button class="primary" data-level="${level+1}">Nästa uppdrag →</button>`:'<button class="primary" data-menu>Alla uppdrag</button>'}<button class="secondary" data-level="${level}">Spela igen</button><button class="secondary" data-tools>Verktyg</button></div></div>`)}
function initAudio(){if(audio)return;try{audio=new(window.AudioContext||window.webkitAudioContext)();let b=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);let d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.25;noise=audio.createBufferSource();noise.buffer=b;noise.loop=true;let filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1600;gain=audio.createGain();gain.gain.value=0;noise.connect(filter).connect(gain).connect(audio.destination);noise.start()}catch{}}
function setNoise(on){if(gain)gain.gain.setTargetAtTime(on&&!muted?.22:0,audio.currentTime,.06)}
function chime(){if(muted||!audio)return;[523,659,784,1046].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.12,audio.currentTime+i*.12);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.12+.6);o.connect(g).connect(audio.destination);o.start(audio.currentTime+i*.12);o.stop(audio.currentTime+i*.12+.7)})}
function brushRadius(){return Math.max(tool().radius*(phase==='foam'?2:1.5),(phase==='foam'?17:13)/Math.max(.1,transform.sx));}
function wash(dt,p=aim){
 if(phase==='foam'&&foamReady)return;
 const r=brushRadius(),from=last||p,dist=Math.hypot(p.x-from.x,p.y-from.y),steps=Math.max(1,Math.ceil(dist/(r*.3))),k=tool();
 if(phase==='foam'){
  // A continuous opaque coverage mask; overlapping passes never leave stamp rings.
  fc.save();polyPath(fc);fc.clip();fc.fillStyle='#fff';fc.strokeStyle='#fff';fc.lineWidth=r*2;fc.lineCap='round';fc.lineJoin='round';fc.beginPath();fc.moveTo(from.x,from.y);fc.lineTo(p.x,p.y);fc.stroke();fc.beginPath();fc.arc(p.x,p.y,r,0,Math.PI*2);fc.fill();fc.restore();
 }else for(const c of [dc,fc]){c.save();c.globalCompositeOperation='destination-out';for(let n=0;n<=steps;n++){const x=from.x+(p.x-from.x)*n/steps,y=from.y+(p.y-from.y)*n/steps;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${Math.min(1,dt*30*k.power)})`);g.addColorStop(.75,`rgba(255,255,255,${Math.min(1,dt*25*k.power)})`);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}c.restore();}
 foamDirty=true;
 last={...p};for(let n=0;n<4;n++)particles.push({x:p.x+(Math.random()-.5)*r,y:p.y+(Math.random()-.5)*r,vx:(Math.random()-.5)*110,vy:phase==='foam'?-35-Math.random()*40:-80-Math.random()*110,life:.4+Math.random()*.35,max:.75,bubble:phase==='foam'});
}
function resize(){const b=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(b.width*d));canvas.height=Math.max(1,Math.round(b.height*d));last=null;}
window.addEventListener('resize',()=>{release();resize()});new ResizeObserver(resize).observe($('playArea'));resize();
function washBounds(){
 const points=levels[level].polygons.flat(),xs=points.map(p=>p[0]*W),ys=points.map(p=>p[1]*H),pad=28;
 const x=Math.max(1,Math.min(...xs)-pad),y=Math.max(1,Math.min(...ys)-pad);
 return {x,y,w:Math.min(W-1,Math.max(...xs)+pad)-x,h:Math.min(H-1,Math.max(...ys)+pad)-y};
}
function sceneLayout(cw,ch,insets){
 const portrait=cw<ch,bounds=washBounds();
 const top=insets?.top??(portrait?104:ch<550?64:128),bottom=insets?.bottom??ch-(portrait?104:ch<550?84:120);
 const usable=Math.max(60,bottom-top);
 const actorH=portrait?Math.min(185,usable*.32):Math.min(620,ch*.8),actorW=actorH*.68;
 const actor={x:0,y:portrait?bottom-actorH:ch-actorH*.88,w:actorW,h:actorH};
 const left=portrait?10:actorW+8,right=cw-10,low=portrait?actor.y-8:bottom;
 const s=Math.min((right-left)/bounds.w,Math.max(40,low-top)/bounds.h);
 const target={x:left+(right-left-bounds.w*s)/2,y:top+(low-top-bounds.h*s)/2,w:bounds.w*s,h:bounds.h*s};
 return {s,x:target.x-bounds.x*s,y:target.y-bounds.y*s,portrait,actor,target,bounds};
}
function drawScenery(layout,cw,ch){
 // One uniform transform for the entire original image: no sliced or stretched scenery.
 const {s,x,y}=layout,horizon=Math.max(0,Math.min(ch,y+H*s*.64));
 const sky=ctx.createLinearGradient(0,0,0,ch);sky.addColorStop(0,'#78cdf2');sky.addColorStop(Math.max(.01,Math.min(.99,horizon/ch)),'#d1eff9');sky.addColorStop(1,'#719d42');ctx.fillStyle=sky;ctx.fillRect(0,0,cw,ch);
 ctx.drawImage(img,x,y,W*s,H*s);
}
function uiInsets(rect){
 const header=document.querySelector('header').getBoundingClientRect(),footer=document.querySelector('footer').getBoundingClientRect();
 return {top:header.bottom-rect.top+10,bottom:footer.top-rect.top-10};
}
function render(now){
 const wallDt=Math.max(0,(now-clock)/1000),dt=Math.min(.04,wallDt);clock=now;
 const b=canvas.getBoundingClientRect(),dpr=canvas.width/Math.max(1,b.width),layout=sceneLayout(b.width,b.height,uiInsets(b)),{s:scale,x:ox,y:oy}=layout;
 transform={sx:scale,sy:scale,x:ox,y:oy};ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,b.width,b.height);
 if(img){
  drawScenery(layout,b.width,b.height);
  if(playing&&!done){elapsed+=wallDt;const speed=420*dt;if(keys.has('ArrowLeft'))aim.x-=speed;if(keys.has('ArrowRight'))aim.x+=speed;if(keys.has('ArrowUp'))aim.y-=speed;if(keys.has('ArrowDown'))aim.y+=speed;aim.x=Math.max(0,Math.min(W,aim.x));aim.y=Math.max(0,Math.min(H,aim.y));const follow=1-Math.exp(-24*dt);sprayAim.x+=(aim.x-sprayAim.x)*follow;sprayAim.y+=(aim.y-sprayAim.y)*follow;if(holding&&pointerValid)wash(dt,sprayAim);if(now-lastMeasure>200){measure();lastMeasure=now}if(now-lastSave>7000){snapshot();lastSave=now}}
  ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.beginPath();ctx.rect(layout.bounds.x,layout.bounds.y,layout.bounds.w,layout.bounds.h);ctx.clip();ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(dirt,0,0);ctx.restore();drawFoam();
  if(highlight>0){highlight-=dt;sc.clearRect(0,0,200,113);sc.drawImage(phase==='foam'?foam:dirt,0,0,200,113);const pix=sc.getImageData(0,0,200,113).data;ctx.strokeStyle='#ffc400';ctx.lineWidth=3/Math.max(.4,scale);for(let y=3;y<113;y+=8)for(let x=3;x<200;x+=8){const needed=phase==='foam'?pix[(y*200+x)*4+3]<200:pix[(y*200+x)*4+3]>40;if(needed){if(areaMask&&areaMask[(y*200+x)*4+3]>128){ctx.beginPath();ctx.arc(x*8,y*H/113,10,0,Math.PI*2);ctx.stroke()}}}}
  particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.bubble)p.vy+=350*dt;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.bubble?'#f8fdff':'#ceefff';ctx.beginPath();ctx.arc(p.x,p.y,p.bubble?5:2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  ctx.restore();
  const a=layout.actor;ctx.save();ctx.beginPath();ctx.rect(a.x,a.y,a.w,a.h);ctx.clip();const charH=a.h*.96;const target={x:ox+sprayAim.x*scale,y:oy+sprayAim.y*scale};const pose=drawWasher(a.x,a.y+a.h-charH,charH*.4,charH,target,dt);ctx.restore();
  if(holding&&playing&&pointerValid){ctx.save();ctx.beginPath();ctx.rect(0,0,b.width,b.height);ctx.clip();ctx.strokeStyle=phase==='foam'?'#f6faffb0':'#c8f4ff95';ctx.lineWidth=phase==='foam'?7:4;ctx.beginPath();ctx.moveTo(pose.x,pose.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.restore();}
 }
 $('timer').textContent=time(elapsed);setNoise(holding&&playing);if(toastTime>0){toastTime-=dt;if(toastTime<=0){$('toast').textContent='';$('toast').style.opacity=0}}requestAnimationFrame(render);
}
function pointer(e){const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left-transform.x)/transform.sx,y=(e.clientY-r.top-transform.y)/transform.sy;pointerValid=x>=0&&x<=W&&y>=0&&y<=H;if(pointerValid){pointerScreen={x:e.clientX-r.left,y:e.clientY-r.top};aim={x,y};}return pointerValid;}
canvas.addEventListener('pointerdown',e=>{if(!playing||!ready||!pointer(e))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);holding=true;last=null;initAudio();audio?.resume();canvas.focus({preventScroll:true})});canvas.addEventListener('pointermove',e=>{if(!playing)return;if(!pointer(e)){last=null;return;} });function release(){pointerScreen=null;holding=false;last=null;setNoise(false)}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);window.addEventListener('blur',()=>{release();keys.clear();if(playing)pause()});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();keys.add(e.key);if(e.key===' '&&playing){pointerScreen=null;pointerValid=true;holding=true;initAudio();audio?.resume()}}});canvas.addEventListener('keyup',e=>{keys.delete(e.key);if(e.key===' ')release()});
function pause(){snapshot();openPanel('<div class="welcome"><div class="big">💧</div><h2>En liten tvättpaus</h2><p>Din tid står stilla. Fortsätt precis där du var.</p><div class="actions"><button class="primary" data-resume>Fortsätt tvätta</button><button class="secondary" data-menu>Uppdrag</button><button class="secondary" data-restart>Börja om banan</button></div></div>')}
function resume(){if(!ready||done){menu();return}$('panel').close();playing=true;clock=performance.now();canvas.focus({preventScroll:true})}
$('panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-page'))return menu(+b.dataset.page);if(b.hasAttribute('data-level')){const i=+b.dataset.level;if(unlocked(i))load(i,save.active?.id===levels[i].id);return}if(b.hasAttribute('data-retry'))return load(+b.dataset.retry);if(b.hasAttribute('data-menu'))return menu();if(b.hasAttribute('data-tools'))return toolsMenu();if(b.hasAttribute('data-resume'))return resume();if(b.hasAttribute('data-start')){const i=levels.findIndex(l=>l.id===save.active?.id);return load(i<0?0:i,i>=0)}if(b.hasAttribute('data-restart'))return openPanel('<h2>Börja om uppdraget?</h2><p>Smutsen och tiden på den här banan börjar om. Dina rekord och verktyg finns kvar.</p><div class="actions"><button class="secondary" data-resume>Fortsätt</button><button class="primary" data-confirm-restart>Börja om</button></div>');if(b.hasAttribute('data-confirm-restart')){delete save.active;persist();return load(level)}if(b.hasAttribute('data-tool')){const i=+b.dataset.tool;if(golds()>=kit[i].need){save.tool=i;persist();updateTool();toast(kit[i].name+' valt');ready&&!done?resume():toolsMenu()}}});
function closePanel(){release();$('panel').close();if(ready){playing=!done;clock=performance.now();canvas.focus({preventScroll:true});}else{const i=levels.findIndex(l=>l.id===save.active?.id);return load(i<0?0:i,i>=0);}}
$('closePanel').onclick=closePanel;$('panel').addEventListener('cancel',e=>{e.preventDefault();closePanel()});$('levels').onclick=()=>menu(Math.floor(level/6));$('tools').onclick=toolsMenu;$('pause').onclick=pause;$('reveal').onclick=()=>{if(!ready)return;highlight=4;toast(phase==='foam'?'Gula ringar visar var schampo saknas':'Gula ringar visar smuts som finns kvar')};$('sound').onclick=()=>{muted=!muted;save.sound=!muted;persist();initAudio();audio?.resume();updateTool()};
$('rinseMode').onclick=()=>{if(!ready||!foamReady||phase==='rinse')return;release();phase='rinse';updateStage();measure();snapshot();canvas.focus({preventScroll:true})};
$('foamMode').onclick=()=>{if(phase==='foam')canvas.focus({preventScroll:true})};
document.addEventListener('visibilitychange',()=>{if(document.hidden){snapshot();release();keys.clear();if(playing)pause()}});window.addEventListener('pagehide',snapshot);
updateTool();getImage('house').then(im=>{if(!img)img=im}).catch(()=>{});openPanel(`<div class="welcome"><div class="big">💦</div><h2>Lite smuts.<br>Massor av tvättglädje.</h2><p>${levels.length} soliga uppdrag väntar. Täck först ytan med skumschampo. Välj sedan Skölj och spola bort löddret! Slå tidsmålen för att låsa upp bättre munstycken.</p><div class="actions"><button class="primary" data-start>${save.active?'Fortsätt tvätta':'Nu gör vi rent!'} →</button><button class="secondary" data-menu>Välj uppdrag</button></div><p><small>Mus eller finger · Pilar + mellanslag · Sparas på denna enhet</small></p></div>`);requestAnimationFrame(render);
})();

