"use strict";
const el = id => document.getElementById(id);
const canvas = el('scene'), ctx = canvas.getContext('2d'), images = {};
const key = 'lostWorlds.moon.v2';
let saved = {};
try {
  saved=JSON.parse(localStorage.getItem(key));
  if(!saved){
    const old=JSON.parse(localStorage.getItem('lostWorlds.moon.v1')) || {};
    const previous=Number.isInteger(old.stage)?clamp(old.stage,0,2):0;
    saved={stage:0,unlocked:old.finished?3:previous};
  }
} catch {saved={}}
let stage = Number.isInteger(saved.stage) ? clamp(saved.stage,0,chapters.length-1) : 0;
let unlocked=Number.isInteger(saved.unlocked)?clamp(saved.unlocked,stage,9):stage;
const picker=el('levelSelect');
function refreshPicker(){
  picker.replaceChildren();
  chapters.forEach((r,i)=>{
    const option=document.createElement('option');option.value=i;option.disabled=i>unlocked;
    option.textContent=(i+1)+'. '+r.name+(option.disabled?' · låst':'');
    picker.append(option);
  });
  picker.value=String(stage);
}
picker.onchange=()=>{
  const i=Number(picker.value);
  if(!Number.isInteger(i)||i<0||i>unlocked)return;
  stage=i;finished=false;enter();save(0);
  stop(game.room.name,game.room.hint,'Spela');
};
// The same treasure painter and pickup choreography as Solportens väg.
// A collected ID survives deaths/checkpoints; revisiting it cannot award it again.
const validCoinId = id => typeof id === 'string' && /^(?:[0-9]):(?:[0-9]|1[0-9]):[0-9]{1,2}$/.test(id);
const collectedCoins = new Set(Array.isArray(saved.coins) ? saved.coins.filter(validCoinId) : []);
const menu=el("overlay"), route={
  get game(){return game}, index:0, elapsed:0, points:collectedCoins.size,
  pickups:[], combo:1, lastPickup:-Infinity
};
let coins=[], transitioning=false, recoveryHandoff=false;
const requestedFromMenu=new URLSearchParams(location.search).get('from')==='menu';
let paused=true;
let warden;
let game, wave, active = false, finished = Boolean(saved.finished), loaded = false;
let side = 0, jump = false, last = 0, acc = 0;
const keys = new Set();
function save(cp) {
  try {localStorage.setItem(key,JSON.stringify({stage,cp,finished,introPlayed,unlocked,coins:[...collectedCoins],bossHits:warden?[...warden.hits]:[]}))} catch {}
}
class MoonChamber extends Chamber {
  fail(cause) {
    const checkpoint=this.checkpoint;
    super.fail(cause);
    this.checkpoint=checkpoint;
  }
}
function enter(cp=0,resumeBoss=false) {
  unlocked=Math.max(unlocked,stage);
  wave = null;
  warden=chapters[stage].boss ? newWarden() : null;
  if(warden && resumeBoss && Array.isArray(saved.bossHits)){
    warden.hits=new Set(saved.bossHits.filter(x=>locks.includes(x)));
    if(warden.hits.size===locks.length)warden.phase='defeated';
  }
  const room = chapters[stage];
  game = new MoonChamber(room,Number.isInteger(cp) ? cp : 0,(event,value) => {
    actionSound(event,value);
    if (event === 'checkpoint') save(value);
    if (event === 'respawn') {
      wave=null;
      if(warden){
        const hits=warden.hits;
        warden=newWarden();warden.hits=hits;
        if(hits.size===locks.length)warden.phase='defeated';
      }
      el('hint').textContent=warden?.phase==='defeated'?'Porten är öppen. Spring till höger!':room.hint;
    }
  });
  // Raised service spans are one-way platforms, so Navid can also run beneath them.
  game.lips=game.lips.filter(lip=>lip.to<game.floors.length);
  coins=makeMoonCoins(game,stage);route.pickups=[];
  lastDraw='';
  el('chapter').textContent='MÅNENS AKVEDUKT · '+(stage+1)+' / '+chapters.length;
  el('name').textContent=room.name;
  el('hint').textContent=warden?.phase==='defeated'?'Porten är öppen. Spring till höger!':room.hint;
}
function stop(title, message, button) {
  active=false; paused=true;stopEffects();keys.clear(); side=0; jump=false; acc=0;
  el('music').pause();
  if(loaded){refreshPicker();el('selectWrap').hidden=false}
  el('heading').textContent=title; el('message').textContent=message;
  el('go').textContent=button; el('overlay').hidden=false;
}
function pause(){if(active)stop('Paus','Ditt senaste fäste sparas automatiskt.','Fortsätt')}
el('pause').onclick=pause;
addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
el('go').onclick=()=>{
  if(finished){continueToCave();return}
  if(!loaded){location.reload();return}
  if(!introPlayed){startIntro();return}
  startPlay();
};
function startPlay(){
  active=true;paused=false;enablePickupAudio();last=performance.now();el('overlay').hidden=true;
  el('music').volume=.35;el('music').play().catch(()=>{});
};
addEventListener('keydown',e=>{
  if(e.code==='Escape')pause();
  if(!active || !['ArrowLeft','KeyA','ArrowRight','KeyD','Space','ArrowUp','KeyW'].includes(e.code))return;
  e.preventDefault();keys.add(e.code);
  if(!e.repeat && ['Space','ArrowUp','KeyW'].includes(e.code))jump=true;
});
addEventListener('keyup',e=>keys.delete(e.code));
const stick=el('stick');
function steer(e){side=Math.sign(e.clientX-stick.getBoundingClientRect().left-stick.offsetWidth/2)}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);steer(e)};
stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))steer(e)};
stick.onlostpointercapture=()=>side=0;
el('hop').onpointerdown=e=>{e.preventDefault();if(active)jump=true};
function tick(dt) {
  if(!active || transitioning || finished)return;
  route.elapsed+=dt;
  while(route.pickups.length && route.elapsed-route.pickups[0].start>1.1)route.pickups.shift();
  const before=game.p, previousPosition={x:before.x,y:before.y,dead:before.dead};
  const axis=side || Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));
  game.step(dt,{axis,jump});jump=false;
  const p=game.p;
  if(p.dead>0)return;
  if(p===before && !previousPosition.dead)collectMoonCoins(previousPosition,p);
  if(game.room.surge && p.x>=340 && wave===null){
    wave=Math.max(24,p.x-360);el('hint').textContent='Slussen är öppen! Håll dig före flodvågen.';
  }
  if(wave!==null){wave+=160*dt;if(wave>p.x){game.fail('water');return}}
  if(warden){
    const hits=warden.hits.size;
    stepWarden(warden,dt);
    if(warden.hits.size!==hits)save(game.checkpoint);
    if(p.dead>0 || warden.phase!=='defeated')return;
  }
  // Both ordinary rooms and the cleared boss arena finish at their real exit.
  // A jump across the threshold counts too; requiring one exact grounded frame
  // made the handoff unnecessarily fragile near the portal.
  const exitFloor=game.floors[game.floors.length-1];
  if(p.x<game.room.exit || p.y>H(exitFloor,p.x)+20)return;
  if(stage<chapters.length-1){stage++;enter();save(0)}
  else continueToCave();
}
function continueToCave(resume=recoveryHandoff){
  if(transitioning)return;
  recoveryHandoff=resume;
  transitioning=true;finished=true;active=false;paused=true;keys.clear();jump=false;side=0;acc=0;
  try{stopEffects()}catch{}
  el('music').pause();save(0);
  try{localStorage.setItem('lostWorlds.cave','1')}catch{}
  // Do not wait for an end overlay, click, audio event, or storage to succeed.
  const destination='cave.html?from=aqueduct'+(resume?'&resume=1':'');
  try{location.replace(destination)}
  catch(error){
    try{location.assign(destination)}
    catch{transitioning=false;stop('Vägen till Flöjtens eko','Tryck för att fortsätta genom porten.','Till värld 4')}
  }
}
function makeMoonCoins(chamber,chapter){
  const result=[];
  chamber.all.forEach((floor,surface)=>{
    let slot=0,lastX=-Infinity;
    for(let x=floor[0]+40;x<Math.min(floor[1]-40,1550);x+=40,slot++){
      if(x<170 || x-lastX<110)continue;
      // Coins invite the player along walkable stone, not inside a crusher or saw.
      if(chamber.hazards.some(h=>h.surface===surface&&Math.abs(h.x-x)<h.width/2+48))continue;
      if(chamber.cubes.some(c=>Math.abs(c.x-x)<85))continue;
      lastX=x;
      result.push({id:chapter+':'+surface+':'+slot,x,y:H(floor,x)-84,surface,phase:result.length});
    }
  });
  return result;
}
function collectMoonCoins(a,p){
  const dx=p.x-a.x,dy=p.y-a.y,scale=game.scale;
  let changed=false;
  for(const coin of coins){
    if(collectedCoins.has(coin.id))continue;
    // Swept player body: a quick run or jump cannot skip a coin between ticks.
    const midY=94*scale, vx=coin.x-a.x,vy=coin.y-(a.y-midY),length=dx*dx+dy*dy;
    const u=length?clamp((vx*dx+vy*dy)/length,0,1):1;
    const x=a.x+dx*u,y=a.y+dy*u;
    if(Math.hypot(coin.x-x,Math.max(0,y-143*scale-coin.y,coin.y-y))>34)continue;
    collectedCoins.add(coin.id);route.points=collectedCoins.size;route.lastPickup=route.elapsed;
    route.pickups.push({room:0,start:route.elapsed,x:coin.x,y:coin.y,hitX:p.x,hitY:p.y-94*scale,combo:1});
    pickupChime(1);changed=true;
  }
  if(changed)save(game.checkpoint);
}
function paintMoonCoins(){
  for(const coin of coins)if(!collectedCoins.has(coin.id)){
    drawTreasure(coin.x,coin.y+Math.sin(game.clock*2+coin.phase)*3,'coin','#ffcb58',ctx);
  }
}

function stroke(x,y,x2,y2,color,width){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
}
function drawSpan([a,b,y]){
  const n=Math.ceil((b-a)/315),w=(b-a)/n;
  for(let j=0;j<n;j++)ctx.drawImage(images.span,a+j*w,y-4,w+1,w*.455);
}
function crusher(x,bottom,w,warning){
  const height=w*1.10,top=bottom-height;
  stroke(x,0,x,top+6,'#443729',5);
  ctx.save();ctx.setLineDash([6,6]);stroke(x,0,x,top+6,'#bba47a',3);ctx.restore();
  ctx.drawImage(images.crusher,x-w/2,top,w,height);
  if(warning){ctx.fillStyle='#ffd09b';ctx.beginPath();ctx.arc(x,bottom-height*.45,5+2*Math.sin(game.clock*18),0,Math.PI*2);ctx.fill()}
}
const movingWater=waterPainter();
let lastDraw='';
function render(){
  const w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(devicePixelRatio||1,2);
  const stamp=[stage,game.clock,w,h,d].join('/');
  if(stamp===lastDraw)return;
  lastDraw=stamp;
  if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d)}
  const zoom=Math.max(w/1672,h/941), view=w/zoom;
  const left=clamp(game.p.x-view*.43,0,1672-view);
  ctx.setTransform(d*zoom,0,0,d*zoom,-left*d*zoom,(h-941*zoom)*d*.5);
  const art=images[game.room.key], t=game.clock;
  ctx.drawImage(movingWater?movingWater(stage,art,t):art,0,0,1672,941);
  if(!movingWater)paintWaterFallback(ctx,stage,art,t);
  for(const floor of game.all)drawSpan(floor);
  for(const c of game.cubes)crusher(c.x,c.top+c.dy+c.h,c.w,c.phase==='release');
  if(warden)drawWarden(warden);
  if(game.room.surge){
    const x=340,y=game.floors[0][2];
    ctx.fillStyle='#544639';ctx.fillRect(x-13,y-29,26,30);
    stroke(x,y-25,x+(wave===null?-19:19),y-68,'#e9bd77',8);
    if(wave!==null){
      ctx.beginPath();ctx.moveTo(-4,941);ctx.lineTo(-4,411);
      for(let x=0;x<wave;x+=8)ctx.lineTo(x,418+8*Math.sin(x*.04-t*5));
      ctx.quadraticCurveTo(wave+12,440,wave-4,512);ctx.lineTo(wave+12,941);ctx.closePath();
      const water=ctx.createLinearGradient(0,405,0,800);water.addColorStop(0,'#bbebe9df');water.addColorStop(.16,'#398d9cda');water.addColorStop(1,'#14394eca');
      ctx.fillStyle=water;ctx.fill();
      ctx.save();ctx.clip();
      // Refract the underlying scene in narrow bands inside the moving front.
      ctx.globalAlpha=.22;
      for(let y=410;y<941;y+=9){
        const bend=4*Math.sin(y*.046-t*3)+2*Math.sin(y*.11+t*2);
        ctx.drawImage(art,0,y,1672,9,bend,y,1672,9);
      }
      ctx.globalAlpha=.8;ctx.strokeStyle='#d2f0e7';ctx.lineWidth=2;
      ctx.beginPath();for(let x=0;x<wave;x+=5){const y=419+8*Math.sin(x*.04-t*5)+1.6*Math.sin(x*.13+t*3);ctx[x?'lineTo':'moveTo'](x,y)}
      ctx.stroke();ctx.restore();
    }
  }
  paintTrials(game);paintMoonCoins();paintPalacePlayer(game);
  for(let i=0;i<32;i++){
    const x=(i*193.4+12*Math.sin(t*.4+i))%1672,y=172+(i*53)%605+10*Math.sin(t+i);
    ctx.fillStyle='rgba(255,232,178,'+(.24+.18*Math.sin(t*1.6+i))+')';ctx.fillRect(x,y,2,2);
  }
  // This is the original magnet → burst → HUD-flight animation, not a new effect.
  const hudX=left+(w-106*Math.min(zoom,1.15))/zoom;
  const hudY=(94-(h-941*zoom)*.5)/zoom;
  drawPickupFeedback(ctx,route,hudX,hudY);
}
function animate(now){

  if(active){acc+=Math.min(.06,(now-last)/1000);while(active && acc>=1/120){acc-=1/120;tick(1/120)}}
  last=now;if(!moonReader.playing)render();requestAnimationFrame(animate);
}
introPlayed=Boolean(saved.introPlayed);
if(finished && !requestedFromMenu){continueToCave(true)}else{
loadSoundEffects();
Promise.all([...chapters.map(r=>r.key),'span','crusher','warden','idle','climb','run','jumpSoft','jumpStride','jumpTuck'].map(async id=>{
  const image=new Image();image.src=PALACE_ART[id] || "moon-art/"+id+".webp";await image.decode();images[id]=image;
})).then(()=>{
  loaded=true;enter(saved.cp,true);
  stop(finished?'Månporten är öppen':'Månens akvedukt',finished?'Du har klarat värld III.':'Led vattnet genom palatset. Styr med pilarna och hoppa med mellanslag eller hoppknappen.',finished?'Till värld 4':'Spela');
  el('go').disabled=false;requestAnimationFrame(animate);
}).catch(()=>{stop('Palatset kunde inte öppnas','Kontrollera anslutningen och försök igen.','Försök igen');el('go').disabled=false});
}
