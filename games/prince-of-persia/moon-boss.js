"use strict";
const locks=[420,842,1300], arenaY=654;
function newWarden(){return {phase:'aim',clock:0,x:840,hits:new Set(),pulse:null}}
function setPhase(boss,phase){boss.phase=phase;boss.clock=0}
function stepWarden(boss,dt){
  const p=game.p;boss.clock+=dt;
  if(boss.phase==='aim'){
    boss.x=clamp(p.x,80,1580);
    if(boss.clock>=1.65-boss.hits.size*.15)setPhase(boss,'warning');
  }else if(boss.phase==='warning' && boss.clock>=.87)setPhase(boss,'drop');
  else if(boss.phase==='drop' && boss.clock>=.40){
    setPhase(boss,'impact');
    const lock=locks.find(x=>Math.abs(x-boss.x)<74&&!boss.hits.has(x));
    if(lock!==undefined){
      boss.hits.add(lock);playEffect('chain',.5);
      el('hint').textContent='Brutna lås · '+boss.hits.size+' / 3. Hoppa över stötvågen!';
    }
    playEffect('slam',.65);
    boss.pulse={x:boss.x,r:0};
    if(Math.abs(p.x-boss.x)<60)game.fail('warden');
    if(boss.hits.size===3){boss.pulse=null;setPhase(boss,'defeated');el('hint').textContent='Låsen är brutna! Laleh väntar vid porten till höger.'}
  }else if(boss.phase==='impact' && boss.clock>.28)setPhase(boss,'rise');
  else if(boss.phase==='rise' && boss.clock>.95)setPhase(boss,'aim');
  if(boss.pulse){
    boss.pulse.r+=290*dt;
    if(Math.abs(Math.abs(p.x-boss.pulse.x)-boss.pulse.r)<13 && p.y>arenaY-29 && !p.dead)game.fail('wave');
    if(boss.pulse.r>1100)boss.pulse=null;
  }
}
function drawWarden(b){
  const defeated=b.phase==='defeated';
  // The gilded head of the ram rides below the great stone guardian in the mural.
  ctx.drawImage(images.warden,b.x-72,73,144,101);
  for(const x of locks){
    ctx.save();ctx.translate(x,arenaY-2);ctx.scale(1,.32);
    ctx.strokeStyle=b.hits.has(x)?'#526a69':'#ffdf8a';ctx.lineWidth=6;
    ctx.beginPath();ctx.arc(0,0,42,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  if(defeated){
    const glow=ctx.createRadialGradient(1594,564,8,1594,564,136);
    glow.addColorStop(0,'#fff1bcd9');glow.addColorStop(1,'#efbb5900');
    ctx.fillStyle=glow;ctx.fillRect(1458,428,272,272);
    ctx.beginPath();ctx.moveTo(1548,654);ctx.lineTo(1548,543);ctx.quadraticCurveTo(1592,457,1636,543);ctx.lineTo(1636,654);
    ctx.lineWidth=8;ctx.strokeStyle='#ffdda0';ctx.stroke();return;
  }
  const amount=b.phase==='impact'?1:b.phase==='drop'?Math.pow(b.clock/.40,2):b.phase==='rise'?Math.max(0,1-b.clock/.95):0;
  const bottom=196+clamp(amount,0,1)*(arenaY-196);
  crusher(b.x,bottom,114,b.phase==='warning');
  if(b.phase==='aim'||b.phase==='warning'){
    ctx.strokeStyle=b.phase==='warning'?'#ff8053':'#ffe5a9';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(b.x,arenaY,56,8,0,0,Math.PI*2);ctx.stroke();
  }
  if(b.pulse)for(const sign of [-1,1]){
    const x=b.pulse.x+sign*b.pulse.r;
    const grad=ctx.createLinearGradient(x-18,0,x+18,0);grad.addColorStop(0,'#90e7e900');grad.addColorStop(.5,'#dcffff');grad.addColorStop(1,'#90e7e900');ctx.fillStyle=grad;
    ctx.beginPath();ctx.moveTo(x-18,arenaY);ctx.quadraticCurveTo(x,arenaY-59,x+18,arenaY);ctx.fill();
  }
}
