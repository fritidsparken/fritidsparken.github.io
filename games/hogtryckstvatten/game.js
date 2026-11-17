(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('scene'),ctx=canvas.getContext('2d');
let W=1600,H=900,houseWide=null;
const surface=document.createElement('canvas');const surfaceContext=surface.getContext('2d');
const dirt=document.createElement('canvas');dirt.width=W;dirt.height=H;const dc=dirt.getContext('2d',{willReadFrequently:true});
const sample=document.createElement('canvas');sample.width=200;sample.height=113;const sc=sample.getContext('2d',{willReadFrequently:true});
let areaMask=null,pointerValid=true;
const levels=window.WASH_LEVELS;const KEY='fp-pressure-wash-v1';let save={best:{},tool:0,sound:true},stored=null;
try{stored=JSON.parse(localStorage.getItem(KEY));if(stored&&typeof stored==='object')save={...save,...stored,best:stored.best||{}}}catch{}
const kit=[{name:'Standard',symbol:'💧',radius:25,power:1,need:0,desc:'En stadig stråle för ditt första uppdrag.'},{name:'Bredstråle',symbol:'💦',radius:41,power:.9,need:1,desc:'Bredare stråle för stora ytor.'},{name:'Turbomunstycke',symbol:'🌀',radius:48,power:1.5,need:3,desc:'Mer kraft mot envis smuts.'},{name:'Superstråle',symbol:'🌈',radius:62,power:1.8,need:6,desc:'Din starkaste tvätt. En kraftfull bred vattenstråle!'}];
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
function getImage(id){if(images.has(id))return images.get(id);const p=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=`assets/${id==='house'?'house-portrait-v2':id==='house-wide'?'house-wide-v2':id}.webp`});images.set(id,p);p.catch(()=>images.delete(id));return p}
const housePolygons=[[[.2445,.3268],[.319,.299],[.319,.262],[.365,.262],[.365,.291],[.733,.261],[.802,.296],[.800,.307],[.2445,.335]],[[.279,.334],[.770,.305],[.770,.418],[.679,.394],[.568,.438],[.568,.541],[.453,.535],[.279,.554]],[[.570,.435],[.681,.395],[.795,.435],[.793,.553],[.774,.576],[.594,.576],[.594,.555],[.570,.550]]];
function regions(){return levels[level].id==='house'?housePolygons.map(p=>[p]):levels[level].regions||levels[level].polygons.map(p=>[p]);}
function polygons(){return regions().map(r=>r[0]);}
function polyPath(c,paths=polygons()){c.beginPath();for(const p of paths){p.forEach(([x,y],i)=>i?c.lineTo(x*W,y*H):c.moveTo(x*W,y*H));c.closePath()}}
let seed=1;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function makeDirt(){seed=12345+level*923;dc.clearRect(0,0,W,H);surface.width=W;surface.height=H;surfaceContext.fillStyle='#fff';for(const region of regions()){polyPath(surfaceContext,region);surfaceContext.fill('evenodd')}dc.save();dc.fillStyle='rgba(67,65,24,.75)';dc.fillRect(0,0,W,H);
 for(let i=0;i<9000;i++){const x=rand()*W,y=rand()*H,r=1+rand()*24;dc.fillStyle=`rgba(${25+rand()*40|0},${35+rand()*43|0},${10+rand()*20|0},${.08+rand()*.22})`;dc.beginPath();dc.ellipse(x,y,r,r*(.4+rand()),0,0,Math.PI*2);dc.fill()}
 for(let i=0;i<520;i++){let x=rand()*W,y=rand()*H;dc.strokeStyle=`rgba(37,48,17,${.06+rand()*.23})`;dc.lineWidth=1+rand()*5;dc.beginPath();dc.moveTo(x,y);dc.lineTo(x+rand()*7,y+20+rand()*80);dc.stroke()}dc.globalCompositeOperation='destination-in';dc.drawImage(surface,0,0);dc.restore();initial=mass();}
function mass(layer=dirt){sc.clearRect(0,0,200,113);sc.drawImage(layer,0,0,200,113);let sum=0;const data=sc.getImageData(0,0,200,113).data;for(let i=3;i<data.length;i+=4)sum+=data[i];return sum}
function updateStage(){$('hint').textContent='Håll in och dra för att tvätta bort smutsen.';}
function measure(){percent=Math.min(100,Math.max(0,100*(1-mass()/initial)));if(percent>=98.4&&!done)finish();$('fill').style.width=percent+'%';$('progressLabel').textContent=`Rent: ${Math.floor(percent)}%`;}
async function load(i,resume=false){const token=++loadedToken;playing=false;holding=false;ready=false;$('loading').hidden=false;if($('panel').open)$('panel').close();try{const [im,wide]=await Promise.all([getImage(levels[i].id),levels[i].id==='house'?getImage('house-wide'):Promise.resolve(null),window.WasherRig.ready]);if(token!==loadedToken)return;level=i;houseWide=wide;W=im.naturalWidth;H=im.naturalHeight;dirt.width=W;dirt.height=H;cameraX=800;pointerScreen=null;img=im;elapsed=0;percent=0;done=false;last=null;particles=[];aim={x:800,y:450};sprayAim={...aim};makeDirt();
 sc.clearRect(0,0,200,113);sc.drawImage(dirt,0,0,200,113);areaMask=sc.getImageData(0,0,200,113).data;
 if(resume&&save.active?.id===levels[i].id&&save.active.mask&&save.active.version===(levels[i].id==='house'?8:7)){elapsed=Number(save.active.elapsed)||0;const snap=new Image();await new Promise(resolve=>{snap.onload=()=>{dc.clearRect(0,0,W,H);dc.drawImage(snap,0,0,W,H);resolve()};snap.onerror=resolve;snap.src=save.active.mask});}
 ready=true;measure();$('levelName').textContent=levels[i].name;$('target').textContent=`★ Tidsmål ${time(levels[i].goal)}`;$('hint').style.opacity=1;updateStage();updateTool();$('loading').hidden=true;if(!done){playing=true;clock=performance.now()}if(i+1<levels.length)getImage(levels[i+1].id).catch(()=>{});
 }catch{$('loading').hidden=true;openPanel('<h2>Bilden kunde inte laddas</h2><p>Kontrollera anslutningen och försök igen.</p><div class="actions"><button class="primary" data-retry="'+i+'">Försök igen</button></div>')}}
function snapshot(){if(!ready||done)return;save.active={version:levels[level].id==='house'?8:7,id:levels[level].id,elapsed,mask:dirt.toDataURL('image/png')};persist()}
function updateTool(){tool();updateStage();$('sound').textContent=muted?'♫':'♪';$('sound').setAttribute('aria-label',muted?'Slå på ljud':'Stäng av ljud')}
function openPanel(html){holding=false;last=null;playing=false;setNoise(false);$('panelBody').innerHTML=html;if(!$('panel').open)$('panel').showModal()}
function menu(page=menuPage){menuPage=Math.max(0,Math.min(Math.ceil(levels.length/6)-1,page));snapshot();openPanel(`<h2>Välj ditt nästa uppdrag</h2><p>Gör allt rent för att öppna nästa bana. Klara tidsmålet för tre stjärnor och nya tillbehör.</p><div class="cards">${levels.slice(menuPage*6,menuPage*6+6).map((l,n)=>{const i=menuPage*6+n;const best=save.best[l.id];return `<button class="card" data-level="${i}" ${!unlocked(i)?'disabled':''}><img src="assets/${l.id==='house'?'house-portrait-v2':l.id}.webp" alt="${l.name}" loading="lazy"><span class="copy"><strong>${unlocked(i)?'':'🔒 '}${l.name}</strong><small>★ ${time(l.goal)} ${Number.isFinite(best)?'· Bäst '+time(best):''}</small><span class="stars">${Number.isFinite(best)?'★'.repeat(stars(i,best))+'☆'.repeat(3-stars(i,best)):unlocked(i)?'Redo att tvätta':'Klara föregående bana'}</span></span></button>`}).join('')}</div><div class="actions"><button class="secondary" data-page="${menuPage-1}" ${menuPage===0?'disabled':''}>← Föregående</button><span>Sida ${menuPage+1} / ${Math.ceil(levels.length/6)}</span><button class="secondary" data-page="${menuPage+1}" ${menuPage>=Math.ceil(levels.length/6)-1?'disabled':''}>Nästa →</button></div>`)}
function toolsMenu(){openPanel(`<h2>Din högtryckstvätt</h2><p>${golds()} av ${levels.length} tidsmål klarade. Klara tidsmålen på olika banor för att låsa upp mer kraft.</p><div class="tool-grid">${kit.map((k,i)=>`<button class="card tool-card ${save.tool===i?'selected':''}" data-tool="${i}" ${golds()<k.need?'disabled':''}><div class="symbol">${k.symbol}</div><strong>${k.name}${save.tool===i?' ✓':''}</strong><p>${k.desc}</p><small>${golds()>=k.need?'Välj munstycke':`🔒 Klara ${k.need} olika tidsmål`}</small></button>`).join('')}</div>`)}
function finish(){done=true;playing=false;holding=false;percent=100;dc.clearRect(0,0,W,H);const l=levels[level],oldGold=golds();save.best[l.id]=Math.min(save.best[l.id]??Infinity,elapsed);delete save.active;persist();setNoise(false);chime();const newly=kit.filter(k=>k.need>oldGold&&k.need<=golds());openPanel(`<div class="welcome"><div class="big">✨</div><h2>Skinande rent!</h2><div class="stars" style="font-size:42px">${'★'.repeat(stars(level,elapsed))}${'☆'.repeat(3-stars(level,elapsed))}</div><p><b>${l.name}</b> är klar på <b>${time(elapsed)}</b>.<br>Tidsmål: ${time(l.goal)} · Ditt rekord: ${time(save.best[l.id])}</p>${newly.length?`<p><b>🔓 ${newly.map(k=>k.name).join(', ')} upplåst!</b></p>`:elapsed>l.goal?'<p>Testa igen och slå tidsmålet för att låsa upp bättre tillbehör.</p>':'<p>Du klarade tidsmålet. Snyggt tvättat!</p>'}<div class="actions">${level<levels.length-1?`<button class="primary" data-level="${level+1}">Nästa uppdrag →</button>`:'<button class="primary" data-menu>Alla uppdrag</button>'}<button class="secondary" data-level="${level}">Spela igen</button><button class="secondary" data-tools>Verktyg</button></div></div>`)}
function initAudio(){if(audio)return;try{audio=new(window.AudioContext||window.webkitAudioContext)();let b=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);let d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.25;noise=audio.createBufferSource();noise.buffer=b;noise.loop=true;let filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1600;gain=audio.createGain();gain.gain.value=0;noise.connect(filter).connect(gain).connect(audio.destination);noise.start()}catch{}}
function setNoise(on){if(gain)gain.gain.setTargetAtTime(on&&!muted?.22:0,audio.currentTime,.06)}
function chime(){if(muted||!audio)return;[523,659,784,1046].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.12,audio.currentTime+i*.12);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.12+.6);o.connect(g).connect(audio.destination);o.start(audio.currentTime+i*.12);o.stop(audio.currentTime+i*.12+.7)})}
function brushRadius(){const desktop=matchMedia('(hover: hover) and (pointer: fine)').matches;return desktop?Math.max(tool().radius*.30,2.5/Math.max(.1,transform.sx)):Math.max(tool().radius*1.5,13/Math.max(.1,transform.sx));}
function wash(dt,p=aim){
 const r=brushRadius(),from=last||p,dist=Math.hypot(p.x-from.x,p.y-from.y),steps=Math.max(1,Math.ceil(dist/(r*.3))),k=tool();
 dc.save();dc.globalCompositeOperation='destination-out';for(let n=0;n<=steps;n++){const x=from.x+(p.x-from.x)*n/steps,y=from.y+(p.y-from.y)*n/steps;const g=dc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${Math.min(1,dt*30*k.power)})`);g.addColorStop(.75,`rgba(255,255,255,${Math.min(1,dt*25*k.power)})`);g.addColorStop(1,'transparent');dc.fillStyle=g;dc.fillRect(x-r,y-r,r*2,r*2);}dc.restore();
 last={...p};for(let n=0;n<4;n++)particles.push({x:p.x+(Math.random()-.5)*r,y:p.y+(Math.random()-.5)*r,vx:(Math.random()-.5)*110,vy:-80-Math.random()*110,life:.4+Math.random()*.35,max:.75,bubble:false});
}
function rotationNotice(){return typeof matchMedia==='function'&&matchMedia('(orientation: landscape) and (any-pointer: coarse)').matches;}
function resize(){const b=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(b.width*d));canvas.height=Math.max(1,Math.round(b.height*d));last=null;}
window.addEventListener('resize',()=>{release();resize()});new ResizeObserver(resize).observe($('playArea'));resize();
function washBounds(){
 if(levels[level].id==='house')return {x:275,y:350,w:650,h:465};
 const points=polygons().flat(),xs=points.map(p=>p[0]*W),ys=points.map(p=>p[1]*H),pad=levels[level].id==='house'?2:28;
 const x=Math.max(1,Math.min(...xs)-pad),y=Math.max(1,Math.min(...ys)-pad);
 return {x,y,w:Math.min(W-1,Math.max(...xs)+pad)-x,h:Math.min(H-1,Math.max(...ys)+pad)-y};
}
function sceneLayout(cw,ch,insets){
 if(levels[level].id==='house'){
  const portrait=cw<ch,bounds=washBounds(),top=insets?.top??100,bottom=insets?.bottom??ch-80;
  const bgW=portrait?1145:1672,bgH=portrait?1374:941;
  const bgScale=portrait?Math.min(Math.max(cw/bgW,ch/bgH),(cw-8)/bounds.w):Math.max(cw/bgW,ch/bgH),bx=portrait?Math.min(4-bounds.x*bgScale,Math.max(cw-4-(bounds.x+bounds.w)*bgScale,(cw-bgW*bgScale)/2)):(cw-bgW*bgScale)/2,by=portrait?Math.max(0,(ch-bgH*bgScale)/2):(ch-bgH*bgScale)/2;
  const s=portrait?bgScale:bgScale*.774,x=portrait?bx:bx+538*bgScale,y=portrait?by:by-61*bgScale;
  const target={x:x+bounds.x*s,y:y+bounds.y*s,w:bounds.w*s,h:bounds.h*s};
  const actorH=portrait?Math.min(ch*.19,145):Math.min(ch*.43,310),actor={x:Math.max(4,cw*.012),y:Math.min(ch-actorH-10,bottom-actorH),w:actorH*.68,h:actorH};
  return {s,x,y,portrait,actor,target,bounds,background:{x:bx,y:by,w:bgW*bgScale,h:bgH*bgScale}};
 }
 const portrait=cw<ch,bounds=washBounds();
 const top=insets?.top??(portrait?104:ch<550?64:128),bottom=insets?.bottom??ch-(portrait?104:ch<550?84:120);
 const usable=Math.max(60,bottom-top);
 const actorH=portrait?Math.min(185,usable*.32):Math.min(620,ch*.8),actorW=actorH*.68;
 const actor={x:0,y:bottom-actorH,w:actorW,h:actorH};
 const left=portrait?10:actorW+8,right=cw-10,low=portrait?actor.y-8:bottom;
 const s=Math.min((right-left)/bounds.w,Math.max(40,low-top)/bounds.h);
 const target={x:left+(right-left-bounds.w*s)/2,y:top+(low-top-bounds.h*s)/2,w:bounds.w*s,h:bounds.h*s};
 return {s,x:target.x-bounds.x*s,y:target.y-bounds.y*s,portrait,actor,target,bounds};
}
function drawScenery(layout,cw,ch){
 // Fill the outer screen with adjoining scenery, never stretching the wash image.
 if(levels[level].id==='house'){const b=layout.background;const picture=layout.portrait?img:houseWide;if(b.y>0)ctx.drawImage(picture,0,0,picture.width,30,0,0,cw,b.y+1);if(b.y+b.h<ch)ctx.drawImage(picture,0,picture.height-40,picture.width,40,0,b.y+b.h-1,cw,ch-(b.y+b.h)+1);ctx.drawImage(picture,b.x,b.y,b.w,b.h);return;}
 const {s,x,y}=layout;
 function segments(start,length,screen,edge){
  const out=[{at:start,size:length*s,src:0,len:length,flip:false}],step=edge*s;
  for(let at=start-step,n=0;at+step>0;at-=step,n++)out.push({at,size:step,src:0,len:edge,flip:n%2===0});
  for(let at=start+length*s,n=0;at<screen;at+=step,n++)out.push({at,size:step,src:length-edge,len:edge,flip:n%2===0});
  return out;
 }
 const xs=segments(x,W,cw,100),ys=segments(y,H,ch,60);
 for(const row of ys)for(const col of xs){ctx.save();ctx.translate(col.at+(col.flip?col.size:0),row.at+(row.flip?row.size:0));ctx.scale(col.flip?-1:1,row.flip?-1:1);ctx.drawImage(img,col.src,row.src,col.len,row.len,0,0,col.size,row.size);ctx.restore();}
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
  if(playing&&!done&&!rotationNotice()){elapsed+=wallDt;const speed=420*dt;if(keys.has('ArrowLeft'))aim.x-=speed;if(keys.has('ArrowRight'))aim.x+=speed;if(keys.has('ArrowUp'))aim.y-=speed;if(keys.has('ArrowDown'))aim.y+=speed;aim.x=Math.max(0,Math.min(W,aim.x));aim.y=Math.max(0,Math.min(H,aim.y));const follow=1-Math.exp(-24*dt);sprayAim.x+=(aim.x-sprayAim.x)*follow;sprayAim.y+=(aim.y-sprayAim.y)*follow;if(holding&&pointerValid)wash(dt,sprayAim);if(now-lastMeasure>200){measure();lastMeasure=now}if(now-lastSave>7000){snapshot();lastSave=now}}
  ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.beginPath();ctx.rect(layout.bounds.x,layout.bounds.y,layout.bounds.w,layout.bounds.h);ctx.clip();ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(dirt,0,0);ctx.restore();
  if(highlight>0){highlight-=dt;sc.clearRect(0,0,200,113);sc.drawImage(dirt,0,0,200,113);const pix=sc.getImageData(0,0,200,113).data;ctx.strokeStyle='#ffc400';ctx.lineWidth=3/Math.max(.4,scale);for(let y=3;y<113;y+=8)for(let x=3;x<200;x+=8){const needed=pix[(y*200+x)*4+3]>40;if(needed){if(areaMask&&areaMask[(y*200+x)*4+3]>128){ctx.beginPath();ctx.arc(x*W/200,y*H/113,10,0,Math.PI*2);ctx.stroke()}}}}
  particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.bubble)p.vy+=350*dt;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.bubble?'#f8fdff':'#ceefff';ctx.beginPath();ctx.arc(p.x,p.y,p.bubble?5:2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  ctx.restore();
  const a=layout.actor;ctx.save();ctx.beginPath();ctx.rect(a.x,a.y,a.w,a.h);ctx.clip();const charH=a.h*.96;const target={x:ox+sprayAim.x*scale,y:oy+sprayAim.y*scale};const pose=drawWasher(a.x,a.y+a.h-charH,charH*.4,charH,target,dt);ctx.restore();
  if(holding&&playing&&pointerValid){ctx.save();ctx.beginPath();ctx.rect(0,0,b.width,b.height);ctx.clip();ctx.strokeStyle='#c8f4ff95';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(pose.x,pose.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.restore();}
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
$('closePanel').onclick=closePanel;$('panel').addEventListener('cancel',e=>{e.preventDefault();closePanel()});$('levels').onclick=()=>menu(Math.floor(level/6));$('tools').onclick=toolsMenu;$('pause').onclick=pause;$('reveal').onclick=()=>{if(!ready)return;highlight=4;toast('Gula ringar visar smuts som finns kvar')};$('sound').onclick=()=>{muted=!muted;save.sound=!muted;persist();initAudio();audio?.resume();updateTool()};
document.addEventListener('visibilitychange',()=>{if(document.hidden){snapshot();release();keys.clear();if(playing)pause()}});window.addEventListener('pagehide',snapshot);
updateTool();openPanel(`<div class="welcome"><div class="big">💦</div><h2>Lite smuts.<br>Massor av tvättglädje.</h2><p>${levels.length} soliga uppdrag väntar. Spruta bort smutsen med högtryckstvätten! Slå tidsmålen för att låsa upp bättre munstycken.</p><div class="actions"><button class="primary" data-start>${save.active?'Fortsätt tvätta':'Nu gör vi rent!'} →</button><button class="secondary" data-menu>Välj uppdrag</button></div><p><small>Mus eller finger · Pilar + mellanslag · Sparas på denna enhet</small></p></div>`);requestAnimationFrame(render);
})();


