"use strict";
const el = id => document.getElementById(id);
const canvas = el('scene'), ctx = canvas.getContext('2d'), images = {};
const chapters = [
  {key:'05_akvedukten', name:'Bron över månravinen', hint:'Ta sats vid brokanten. Tryck på hopp igen i luften för att nå längre.', hazards:[['stone',835,1,74,43]]},
  {key:'03_vattenpalatset', name:'De två vattenvägarna', hint:'Följ kanalen eller hoppa upp på den gamla servicebron.', extras:[[370,525,538],[570,1060,519],[1100,1285,540]], hazards:[['jet',845,1,45,100]]},
  {key:'09_kungabron', name:'Månslussen', hint:'Spring fram till mässingsspaken för att öppna slussen.', hazards:[]}
];
for (const room of chapters) {
  const base = ROOMS.find(r => r.key === room.key);
  Object.assign(room,{floors:base.floors,exit:base.exit});
  const index = ROOMS.length;
  ROOMS.push(room);
  trials[index] = room.hazards;
  HANGING_BOXES[index] = [];
}
const key = 'lostWorlds.moon.v1';
let saved = {};
try {saved = JSON.parse(localStorage.getItem(key)) || {}} catch {}
let stage = Number.isInteger(saved.stage) ? clamp(saved.stage,0,2) : 0;
const menu=el("overlay"), route={get game(){return game}};
let paused=true;
let game, wave, active = false, finished = false, loaded = false;
let side = 0, jump = false, last = 0, acc = 0;
const keys = new Set();
function save(cp) {
  try {localStorage.setItem(key,JSON.stringify({stage,cp,finished}))} catch {}
}
function enter(cp=0) {
  wave = null;
  const room = chapters[stage];
  game = new Chamber(room,Number.isInteger(cp) ? cp : 0,(event,value) => {
    actionSound(event,value);
    if (event === 'checkpoint') save(value);
    if (event === 'respawn') {wave=null;el('hint').textContent=room.hint}
  });
  // Raised service spans are one-way platforms, so Navid can also run beneath them.
  game.lips=game.lips.filter(lip=>lip.to<game.floors.length);
  el('chapter').textContent='MÅNENS AKVEDUKT · '+(stage+1)+' / 3';
  el('name').textContent=room.name;
  el('hint').textContent=room.hint;
}
function stop(title, message, button) {
  active=false; paused=true;stopEffects();keys.clear(); side=0; jump=false; acc=0;
  el('music').pause();
  el('heading').textContent=title; el('message').textContent=message;
  el('go').textContent=button; el('overlay').hidden=false;
}
function pause(){if(active)stop('Paus','Ditt senaste fäste sparas automatiskt.','Fortsätt')}
el('pause').onclick=pause;
addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
el('go').onclick=()=>{
  if(!loaded){location.reload();return}
  if(finished){stage=0;finished=false;enter();save(0)}
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
  const axis=side || Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));
  game.step(dt,{axis,jump});jump=false;
  const p=game.p;
  if(p.dead>0)return;
  if(stage===2 && p.x>=340 && wave===null){
    wave=Math.max(24,p.x-360);el('hint').textContent='Slussen är öppen! Håll dig före flodvågen.';
  }
  if(wave!==null){wave+=160*dt;if(wave>p.x){game.fail('water');return}}
  if(p.x<game.room.exit || !p.ground)return;
  if(stage<2){stage++;enter();save(0)}
  else{finished=true;save(0);stop('Månporten är öppen','Navid har lett vattnet tillbaka till palatset.','Spela igen')}
}
function stroke(x,y,x2,y2,color,width){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
}
function render(){
  const w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d)}
  const zoom=Math.max(w/1672,h/941), view=w/zoom;
  const left=clamp(game.p.x-view*.43,0,1672-view);
  ctx.setTransform(d*zoom,0,0,d*zoom,-left*d*zoom,(h-941*zoom)*d*.5);
  const art=images[game.room.key], t=game.clock;
  ctx.drawImage(art,0,0,1672,941);
  const sky=ctx.createLinearGradient(0,0,0,941);
  sky.addColorStop(0,'rgba(12,29,68,.70)');sky.addColorStop(.65,'rgba(43,58,95,.23)');sky.addColorStop(1,'rgba(10,35,57,.55)');
  ctx.fillStyle=sky;ctx.fillRect(0,0,1672,941);
  const mx=[980,440,1130][stage],my=125;
  const halo=ctx.createRadialGradient(mx,my,12,mx,my,100);
  halo.addColorStop(0,'#ffefbc99');halo.addColorStop(1,'#fff4cb00');
  ctx.fillStyle=halo;ctx.fillRect(mx-100,my-100,200,200);
  ctx.fillStyle='#fff0ce';ctx.beginPath();ctx.arc(mx,my,18,0,Math.PI*2);ctx.fill();
  for(const [a,b,y] of game.room.extras||[]){
    ctx.drawImage(art,80,633,Math.min(270,b-a),26,a,y-3,b-a,26);
    stroke(a,y-3,b,y-3,'#e3cdae',3);
    for(let x=a+12;x<b;x+=82){stroke(x,y+23,x,y+71,'#554943',9);stroke(x,y+56,x+22,y+23,'#88705c',5)}
  }
  if(stage===2){
    const x=340,y=476;
    ctx.fillStyle='#544639';ctx.fillRect(x-13,y-29,26,30);
    stroke(x,y-25,x+(wave===null?-19:19),y-68,'#e9bd77',8);
    if(wave!==null){
      ctx.beginPath();ctx.moveTo(-4,941);ctx.lineTo(-4,411);
      for(let x=0;x<wave;x+=8)ctx.lineTo(x,418+8*Math.sin(x*.04-t*5));
      ctx.quadraticCurveTo(wave+12,440,wave-4,512);ctx.lineTo(wave+12,941);ctx.closePath();
      const water=ctx.createLinearGradient(0,405,0,800);water.addColorStop(0,'#bbebe9df');water.addColorStop(.16,'#398d9cda');water.addColorStop(1,'#14394eca');
      ctx.fillStyle=water;ctx.fill();
    }
  }
  paintTrials(game);paintPalacePlayer(game);
  for(let i=0;i<32;i++){
    const x=(i*193.4+12*Math.sin(t*.4+i))%1672,y=172+(i*53)%605+10*Math.sin(t+i);
    ctx.fillStyle='rgba(255,232,178,'+(.24+.18*Math.sin(t*1.6+i))+')';ctx.fillRect(x,y,2,2);
  }
}
function animate(now){
  if(active){acc+=Math.min(.06,(now-last)/1000);while(active && acc>=1/120){acc-=1/120;tick(1/120)}}
  last=now;render();requestAnimationFrame(animate);
}
loadSoundEffects();
Promise.all([...chapters.map(r=>r.key),'idle','climb','run','jumpSoft','jumpStride','jumpTuck'].map(async id=>{
  const image=new Image();image.src=PALACE_ART[id];await image.decode();images[id]=image;
})).then(()=>{
  loaded=true;finished=Boolean(saved.finished);enter(saved.cp);
  stop(finished?'Månporten är öppen':'Månens akvedukt',finished?'Du har klarat värld III.':'Led vattnet genom palatset. Styr med pilarna och hoppa med mellanslag eller hoppknappen.',finished?'Spela igen':'Spela');
  el('go').disabled=false;requestAnimationFrame(animate);
}).catch(()=>{stop('Palatset kunde inte öppnas','Kontrollera anslutningen och försök igen.','Försök igen');el('go').disabled=false});
