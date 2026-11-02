/* Stuntcykel — Stadens tak. Fixed 120 Hz physics; right-handed XY riding plane. */
(() => {
  'use strict';
  const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const META=[
    ['Stadskärnan','Lär känna staden',0xafdce8,0xf3bb76,5,2.4],
    ['Byggarbetsplatsen','Ta höjd bland kranarna',0xcbdde1,0xffbd52,6,3.6],
    ['Takracet','Hela staden under hjulen',0xb9d3ed,0xffa992,7,4.5],
    ['Hamnstaden','Flyg över kajerna',0x9bd3df,0x6de1cf,7,4.8],
    ['Nattstaden','Låt neonljusen visa vägen',0x101b38,0xe794ff,8,4.6],
    ['Stuntarenan','Stora hopp. Stora möjligheter.',0xc5dbed,0xff9870,9,5.3],
    ['Storstadens final','Ditt stora stadsäventyr',0xe8c9c0,0xffcc77,12,5.8]
  ];
  function makeTrack(i){
    const m=META[i], base=i===2?10:0, points=[[-30,base],[12,base]], checkpoints=[5], jumps=[];
    let x=12;
    for(let j=0;j<m[4];j++){
      const h=m[5]*(j%3===2?1.25:.8), run=10+h*1.5, gap=i<2?0:3+(j%3), top=base+(i===2?j%2*1.5:0);
      points.push([x+6,top],[x+6+run,top+h]);
      // Jump gaps have a lower recovery route: missed jumps remain forgiving.
      const lip=x+6+run;
      if(gap){points.push([lip+.12,base-5],[lip+gap,base-5],[lip+gap+.12,top+h*.75]);}
      points.push([lip+gap+run,base],[lip+gap+run+10,base]);
      jumps.push({x:lip,h:top+h,gap,kind:(j+i)%4});
      x=lip+gap+run+10;
      if(j%2===1)checkpoints.push(x-4);
    }
    points.push([x+22,base],[x+55,base]);
    return {id:'city-'+i,name:m[0],tag:m[1],sky:m[2],accent:m[3],points,checkpoints,jumps,length:x+20,base,medal:(x+20)/12+12};
  }
  const tracks=META.map((_,i)=>makeTrack(i));
  function surface(t,x){const p=t.points;for(let i=1;i<p.length;i++)if(x<=p[i][0]){const a=p[i-1],b=p[i],s=(b[1]-a[1])/(b[0]-a[0]);return {y:a[1]+clamp((x-a[0])/(b[0]-a[0]),0,1)*(b[1]-a[1]),s};}return {y:p.at(-1)[1],s:0};}
  function newRide(t,x=5){return {x,y:surface(t,x).y+.807,vx:0,vy:0,a:0,av:0,contact:[true,true],compression:[0,0],time:0,score:0,checkpoint:5,checkpointScore:0,air:0,airX:x,airA:0,peak:0,wheelie:0,stoppie:0,pending:0,jumpLatch:false,cooldown:0,landLock:0,combo:0,landing:null,perfect:0,tricks:0,doubles:0,failed:false,complete:false,events:[]};}
  function step(b,t,k,dt){
    if(b.failed||b.complete)return;
    b.events=[];b.time+=dt;b.cooldown=Math.max(0,b.cooldown-dt);b.landLock=Math.max(0,b.landLock-dt);
    const c=Math.cos(b.a),s=Math.sin(b.a),lean=(k.left?1:0)-(k.right?1:0), wasGround=b.contact.some(Boolean);
    let fy=-22,fx=-b.vx*.075,torque=-b.av*.7, n=0;
    const impact=b.vy, groundAngle=Math.atan(surface(t,b.x).s);
    for(let j=0;j<2;j++){
      const dx=j===0?-1.05:1.05,rx=c*dx+s*.45,ry=s*dx-c*.45;
      const wx=b.x+rx,wy=b.y+ry, g=surface(t,wx), pen=g.y+.43-wy;
      b.contact[j]=pen>0&&pen<1.1&&Math.abs(g.s)<5;
      b.compression[j]=clamp(pen,0,.35);
      if(b.contact[j]){
        n++;const vy=b.vy+b.av*rx, f=clamp(pen*150-vy*10,0,100);
        fy+=f;fx-=f*clamp(g.s,-.9,.9)*.48;torque+=rx*f;
      }
    }
    if(n){
      const drive=k.gas?19:0;fx+=drive;
      if(k.brake)fx+=b.vx>1?-32:-9;
      fx-=b.vx*(k.gas?.35:.65);
      torque+=lean*17+(k.gas?2:0)-(k.brake&&b.vx>2?4:0);
      // Gentle upright assist never snaps the body to the track.
      torque+=wrap(groundAngle-b.a)*8;
      if(k.jump&&!b.jumpLatch&&b.cooldown===0){b.vy=14+Math.max(0,b.vx*Math.sin(groundAngle))*.45;b.y+=.1;b.cooldown=.45;b.events.push({type:'jump'});}
    } else torque+=lean*42-(lean?0:b.av*3);
    b.jumpLatch=!!k.jump;
    b.vx=clamp(b.vx+fx*dt,-5,23);b.vy=clamp(b.vy+fy*dt,-35,24);b.av=clamp(b.av+torque/2.3*dt,-12,12);
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.av*dt;
    if(!n){if(wasGround||b.air===0){b.airX=b.x;b.airA=b.a;b.peak=b.y;}b.air+=dt;b.peak=Math.max(b.peak,b.y);}
    if(n&&b.air>.22&&!b.landing){
      const rotation=b.a-b.airA, turns=Math.floor((Math.abs(rotation)+.28)/TAU), distance=Math.abs(b.x-b.airX), aligned=Math.abs(wrap(b.a-groundAngle));
      if(aligned>1.25||(impact<-28&&aligned>.7)){b.failed=true;b.events.push({type:'crash'});return;}
      let points=distance>17?100:25,label=distance>17?'LÅNGT HOPP!':'SNYGGT HOPP!';
      if(turns){points+=turns>=2?750:rotation>0?300:250;label=turns>=2?'DUBBELVOLT!':'SNYGG VOLT!';}
      const perfect=aligned<.23&&Math.abs(b.av)<1.6&&impact>-16;
      if(perfect){points+=200;label=turns?label+' + PERFEKT!':'PERFEKT LANDNING!';}
      points+=b.pending;b.pending=0;b.landing={points,label,perfect,turns,wait:0};b.vy=Math.max(b.vy,-7);b.av*=.45;b.landLock=.2;b.air=0;
    }else if(n)b.air=0;
    if(b.landing){b.landing.wait+=dt;if(n===2&&b.landing.wait>.15&&Math.abs(wrap(b.a-groundAngle))<.65&&Math.abs(b.av)<2.5){const l=b.landing;b.combo=Math.min(4,b.combo+1);if(b.combo>1){l.points=Math.round(l.points*(1+(b.combo-1)*.25));l.label+=' KOMBO ×'+(1+(b.combo-1)*.25);}b.score+=l.points;b.perfect+=l.perfect?1:0;b.tricks+=l.turns;b.doubles+=l.turns>=2?1:0;b.events.push({type:'land',...l});b.landing=null;}else if(b.landing.wait>1.5)b.landing=null;}
    if(b.contact[0]&&!b.contact[1]&&b.vx>3){b.wheelie+=dt;b.pending=Math.floor(b.wheelie*35);}else if(b.contact[1]&&!b.contact[0]&&b.vx>2){b.stoppie+=dt;b.pending=Math.floor(b.stoppie*45);}else if(n===2&&b.pending&&b.air===0){b.score+=b.pending;b.events.push({type:'balance',points:b.pending,label:b.wheelie>b.stoppie?'WHEELIE!':'STOPPIE!'});b.pending=0;b.wheelie=b.stoppie=0;}
    for(const cp of t.checkpoints)if(cp>b.checkpoint&&b.x>cp&&n===2){b.checkpoint=cp;b.checkpointScore=b.score;b.events.push({type:'checkpoint'});}
    const hx=b.x-Math.sin(b.a)*1.45,hy=b.y+Math.cos(b.a)*1.45;
    if(hy<surface(t,hx).y+.15||b.y< t.base-12||b.x<-12||!Number.isFinite(b.y)){b.failed=true;b.events.push({type:'crash'});}
    if(b.x>=t.length&&!b.failed&&n){b.complete=true;b.events.push({type:'finish'});}
  }
  // Pure physics is also executable by the regression harness, without a browser.
  if(typeof module!=='undefined'&&module.exports){module.exports={tracks,surface,newRide,step,wrap};return;}
  const KEY='fp-stunt-bike-city-v2', LEGACY='fp-stunt-bike-v1';
  const bikes=[['Metro',0xff704e,'Alltid tillgänglig'],['Volt',0x49e8c5,'Klara tre banor'],['Precision',0x65b7ff,'Fem perfekta landningar'],['Neon',0xd786ff,'Gör en dubbelvolt'],['Legend',0xffd45b,'Klara alla sju banor']];
  let root,canvas,renderer,scene,camera,bike,world,lights,shadow,ctx,abort,observer,raf,ride,level=0,state='ready',keys={},pointers=new Map(),keyboard={},save={},legacy={},audio,muted=false,last=0,acc=0,clock=0,toastEnd=0,fx=[],traffic=[],camX=0,camY=0,zoom=1,garageYaw=0,loading=0,previousFocus;
  const $=s=>root?.querySelector(s),action=(a,label,cls='')=>`<button class="${cls}" data-bike-action="${a}">${label}</button>`;
  function gallery(){return `<section class="bike-page arcade-shell"><header class="bike-heading"><div><span class="bike-eyebrow">FRITIDSPARKEN ORIGINAL · 3D TRIALS</span><h2>Stuntcykel <em>Stadens tak</em></h2><p>Sju stadsdelar. Två hjul. Ditt nästa perfekta hopp.</p></div><div class="bike-tools">${action('quality','Grafik: Auto')}${action('garage','Garage')}${action('sound','Ljud av')}${action('pause','Ⅱ Paus')}</div></header><div class="bike-track-tabs" aria-label="Välj bana">${tracks.map((t,i)=>`<button data-bike-level="${i}" aria-pressed="${i===0}"><b>0${i+1}</b>${t.name}</button>`).join('')}</div><div class="bike-field"><canvas id="bikeCanvas" tabindex="0" aria-label="Stuntcykel i sidovy. Piltangenter styr. Mellanslag hoppar. P pausar."></canvas><div class="bike-hud"><div><small>HASTIGHET</small><strong id="bikeSpeed">0 <i>km/h</i></strong></div><div><small id="bikeTrackName"></small><strong id="bikeTime">0.0 s</strong></div><div><small>TRICKPOÄNG</small><strong id="bikeScore">0</strong></div></div><div class="bike-progress"><i id="bikeProgress"></i></div><div class="bike-toast" id="bikeToast" aria-live="polite"></div><div class="bike-bottom"><span id="bikeRecord"></span><span id="bikeRenderer"></span></div><div class="bike-overlay" id="bikeOverlay"></div></div><div class="bike-controls"><div>${control('left','↶','Bakåt')}${control('right','↷','Framåt')}</div>${control('jump','↑','Hoppa')}<div>${control('brake','↓','Broms')}${control('gas','»','Gas')}</div></div><footer class="bike-footer"><span>↑ W gas · ↓ S broms/backa · ← → A D balans · Mellanslag hopp · R kontrollpunkt · P paus</span>${action('retry','↻ Kontrollpunkt')}</footer><details class="bike-legacy"><summary>Tidigare rekord · Skog & sten</summary><div id="bikeLegacy"></div></details></section>`;}
  function control(k,icon,text){return `<button data-bike-control="${k}" aria-label="${text}"><b>${icon}</b><small>${text}</small></button>`;}
  function readSave(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');save=d&&typeof d==='object'&&!Array.isArray(d)?d:{};}catch{save={};}save.records=save.records&&typeof save.records==='object'?save.records:{};save.perfect=Number(save.perfect)||0;save.tricks=Number(save.tricks)||0;save.doubles=Number(save.doubles)||0;save.selected=clamp(Number(save.selected)||0,0,4);try{legacy=JSON.parse(localStorage.getItem(LEGACY)||'{}')||{};}catch{legacy={};}muted=save.muted!==false;}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch{toast('Rekord kan inte sparas i den här webbläsaren.');}}
  function unlocked(i){const count=Object.values(save.records).filter(r=>r.completed).length;return i===0||(i===1&&count>=3)||(i===2&&save.perfect>=5)||(i===3&&save.doubles>0)||(i===4&&count===7);}
  function start(){destroy();root=document.querySelector('.bike-page');if(!root)return;previousFocus=document.activeElement;canvas=$('canvas');abort=new AbortController();const signal=abort.signal;readSave();if(!unlocked(save.selected))save.selected=0;
    root.addEventListener('click',click,{signal});root.addEventListener('pointerdown',pointerDown,{signal});for(const e of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(e,pointerUp,{signal});
    window.addEventListener('keydown',key,{signal});window.addEventListener('keyup',key,{signal});window.addEventListener('blur',()=>pause(),{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal});
    window.addEventListener('fp-flight-engine-ready',()=>{if(root&&!renderer)initRenderer();},{signal});
    level=0;initRenderer();observer=new ResizeObserver(resize);observer.observe(canvas);setup();$('#bikeLegacy').textContent=['Skogsslingan','Stenbrottet','Bergspasset'].map((n,i)=>n+': '+(Number.isFinite(legacy[i])?legacy[i].toFixed(1)+' s':'—')).join(' · ');updateSound();last=0;raf=requestAnimationFrame(loop);
    if(!window.THREE)loading=setTimeout(()=>{if(root&&!renderer){initFallback();resize();}},2500);
  }
  function mergeKeys(){keys={...keyboard};for(const k of pointers.values())keys[k]=true;root?.querySelectorAll('[data-bike-control]').forEach(b=>b.classList.toggle('pressed',!!keys[b.dataset.bikeControl]));}
  function clearKeys(){keyboard={};pointers.clear();mergeKeys();}
  function pointerDown(e){const el=e.target.closest('[data-bike-control]');if(el&&state==='playing'){e.preventDefault();el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,el.dataset.bikeControl);mergeKeys();soundStart();}}
  function pointerUp(e){pointers.delete(e.pointerId);mergeKeys();}
  function key(e){if(!root?.isConnected||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase(),map={arrowup:'gas',w:'gas',arrowdown:'brake',s:'brake',arrowleft:'left',a:'left',arrowright:'right',d:'right',' ':'jump'};
    if(map[k]&&state==='playing'){e.preventDefault();keyboard[map[k]]=e.type==='keydown';mergeKeys();}
    if(e.type==='keydown'&&!e.repeat){if(k==='p'||k==='escape'){e.preventDefault();state==='paused'?resume():pause();}if(k==='r'&&['playing','crashed','paused'].includes(state)){e.preventDefault();retry();}}
  }
  function click(e){const l=e.target.closest('[data-bike-level]');if(l){level=+l.dataset.bikeLevel;setup();return;}const b=e.target.closest('[data-bike-select]');if(b&&unlocked(+b.dataset.bikeSelect)){save.selected=+b.dataset.bikeSelect;persist();rebuildBike();garage();return;}const a=e.target.closest('[data-bike-action]')?.dataset.bikeAction;
    if(a==='quality'&&renderer){qualityMode=qualityMode==='auto'?'manual':quality===2?'auto':'manual';quality=qualityMode==='auto'?(innerWidth<650?0:1):(quality+1)%3;applyQuality();scene.fog.far=qualityProfiles[quality].far;}if(a==='start'||a==='resume')resume();if(a==='retry')retry();if(a==='restart'){setup();resume();}if(a==='pause'){state==='paused'?resume():pause();}if(a==='next'){level=(level+1)%7;setup();}if(a==='sound'){muted=!muted;save.muted=muted;persist();soundStart();updateSound();}if(a==='garage'){pause();garage();}if(a==='back'){setup();}if(a==='rotate-left')garageYaw-=.4;if(a==='rotate-right')garageYaw+=.4;
  }
  function setup(){clearKeys();ride=newRide(tracks[level]);state='ready';acc=0;clock=0;for(const p of fx){scene?.remove(p.o);particlePool.push(p.o);}fx=[];camX=ride.x+5;camY=ride.y+3;zoom=1;buildWorld();rebuildBike();root.querySelectorAll('[data-bike-level]').forEach((b,i)=>b.setAttribute('aria-pressed',i===level));$('#bikeTrackName').textContent=tracks[level].name;modal(tracks[level].name,tracks[level].tag+'. Gasa, balansera och hoppa. Landa säkert för att behålla trickpoängen.',action('start','Kör genom staden →','bike-primary'));hud();resize();}
  function resume(){if(!ride||ride.failed||ride.complete)return;state='playing';clearKeys();$('#bikeOverlay').hidden=true;last=0;acc=0;soundStart();canvas.focus({preventScroll:true});}
  function retry(){if(!ride)return;const old=ride;ride=newRide(tracks[level],old.checkpoint);ride.checkpoint=old.checkpoint;ride.score=old.checkpointScore;ride.checkpointScore=old.checkpointScore;ride.time=old.time;ride.perfect=old.perfect;ride.tricks=old.tricks;ride.doubles=old.doubles;camX=ride.x+5;camY=ride.y+3;resume();}
  function pause(){if(state!=='playing')return;state='paused';clearKeys();modal('En liten paus','Ditt nästa hopp väntar.',action('resume','Fortsätt →','bike-primary')+action('retry','Från kontrollpunkten')+action('restart','Starta om banan'));}
  function modal(title,text,buttons){const el=$('#bikeOverlay');el.hidden=false;el.innerHTML=`<section class="bike-modal" role="dialog" aria-label="${title}"><span class="bike-eyebrow">STADENS TAK / 0${level+1}</span><h3>${title}</h3><p>${text}</p><div class="bike-modal-buttons">${buttons}</div></section>`;}
  function garage(){state='garage';clearKeys();garageYaw=.15;modal('Ditt garage','Alla cyklar har samma rättvisa köregenskaper. Lås upp nya färger genom dina prestationer.',`<div class="bike-garage-options">${bikes.map((b,i)=>`<button data-bike-select="${i}" ${!unlocked(i)?'disabled':''} aria-pressed="${save.selected===i}"><i style="background:#${b[1].toString(16).padStart(6,'0')}"></i><b>${b[0]}</b><small>${unlocked(i)?save.selected===i?'Vald':'Upplåst':b[2]}</small></button>`).join('')}</div><div>${action('rotate-left','↶ Rotera')}${action('rotate-right','Rotera ↷')}</div>${action('back','Till banan →','bike-primary')}`);}
  function toast(t){$('#bikeToast').textContent=t;toastEnd=clock+2.3;}
  function processEvents(){for(const e of ride.events){if(e.type==='land'||e.type==='balance'){toast(e.label+' +'+e.points);tone(e.perfect?740:420,.14);particles(e.perfect?0xffe9ac:0xc7d4cd,12);}if(e.type==='jump')tone(240,.08);if(e.type==='checkpoint'){toast('KONTROLLPUNKT SPARAD ✓');tone(620,.1);}if(e.type==='crash'){state='crashed';ride.crashClock=clock;clearKeys();particles(0xffc88b,20);tone(100,.25);modal('Oj då! Försök igen!','Borsta av hjälmen och hoppa upp igen. Du fortsätter från din senaste kontrollpunkt.',action('retry','Försök igen →','bike-primary')+action('retry','Från kontrollpunkten')+action('restart','Starta om banan'));}if(e.type==='finish')finish();}}
  function finish(){state='complete';clearKeys();const t=tracks[level],old=save.records[t.id]||{},record=!old.time||ride.time<old.time||ride.score>(old.score||0);save.records[t.id]={time:Math.min(old.time||Infinity,ride.time),score:Math.max(old.score||0,ride.score),completed:true,bestLandings:Math.max(old.bestLandings||0,ride.perfect)};save.perfect+=ride.perfect;save.tricks+=ride.tricks;save.doubles+=ride.doubles;persist();const stars=ride.time<t.medal&&ride.score>=500?'★★★':ride.time<t.medal*1.7?'★★':'★';tone(880,.4);modal(record?'Nytt rekord!':'Snyggt kört!',`${stars} · ${ride.time.toFixed(1)} sekunder · ${ride.score} poäng. ${ride.perfect} perfekta landningar.`,action('next','Nästa stadsdel →','bike-primary')+action('restart','Förbättra ditt rekord')+action('garage','Till garaget'));}
  function hud(){if(!ride)return;$('#bikeSpeed').innerHTML=Math.round(Math.abs(ride.vx)*3.6)+' <i>km/h</i>';$('#bikeTime').textContent=ride.time.toFixed(1)+' s';$('#bikeScore').textContent=ride.score.toLocaleString('sv-SE');$('#bikeProgress').style.width=clamp(ride.x/tracks[level].length*100,0,100)+'%';const r=save.records[tracks[level].id];$('#bikeRecord').textContent=r?`REKORD ${r.time.toFixed(1)} s · ${r.score} p`:'DIN FÖRSTA RUNDA · SÄTT REKORDET';if(clock>toastEnd)$('#bikeToast').textContent='';}
  function soundStart(){if(muted)return;try{if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ac=new A(),osc=ac.createOscillator(),gain=ac.createGain(),filter=ac.createBiquadFilter();osc.type='sawtooth';filter.type='lowpass';filter.frequency.value=420;gain.gain.value=0;osc.connect(filter);filter.connect(gain);gain.connect(ac.destination);osc.start();const buffer=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.5;const noise=ac.createBufferSource(),ng=ac.createGain(),nf=ac.createBiquadFilter();noise.buffer=buffer;noise.loop=true;nf.type='lowpass';nf.frequency.value=900;ng.gain.value=0;noise.connect(nf);nf.connect(ng);ng.connect(ac.destination);noise.start();audio={ac,osc,gain,ng};}audio.ac.resume().catch(()=>{});}catch{}}
  function updateSound(){const b=$('[data-bike-action="sound"]');if(b){b.textContent=muted?'Ljud av':'Ljud på';b.setAttribute('aria-pressed',!muted);}}
  function tone(f,d){if(muted||!audio)return;const {ac}=audio,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(f,ac.currentTime);o.frequency.exponentialRampToValueAtTime(f*.6,ac.currentTime+d);g.gain.setValueAtTime(.045,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d);o.onended=()=>{o.disconnect();g.disconnect();};}
  function engine(){if(!audio)return;const now=audio.ac.currentTime;audio.gain.gain.setTargetAtTime(!muted&&state==='playing'?.022+(keys.gas?.018:0):0,now,.08);audio.ng.gain.setTargetAtTime(!muted&&state==='playing'?(ride.air>.25?.025:keys.brake?.035:Math.abs(ride.vx)*.0003):0,now,.12);audio.osc.frequency.setTargetAtTime(48+Math.abs(ride?.vx||0)*6+(keys.gas?30:0),now,.1);}
  // Visual resources are independent of the fixed-step collision/score simulation.
  const materials=new Map(), geometries=new Map(), textures=new Map();
  const qualityProfiles=[
    {name:'LOW',dpr:1,shadow:512,far:125,detail:0,particles:10},
    {name:'MEDIUM',dpr:1.35,shadow:1024,far:180,detail:1,particles:20},
    {name:'HIGH',dpr:1.8,shadow:2048,far:240,detail:2,particles:36}
  ];
  let quality=1,qualityMode='auto',frameCost=16,qualityTimer=0,qualityWarmup=0,environmentTarget=null,skyDome=null,contactShadow=null,particlePool=[];
  const seeded=n=>{let s=n>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};};
  function materialMaps(kind){
    if(textures.has(kind))return textures.get(kind);
    const size=256,rand=seeded(81+kind.length*79+kind.charCodeAt(0)),c=document.createElement('canvas');c.width=c.height=size;
    const g=c.getContext('2d'),im=g.createImageData(size,size),heights=new Float32Array(size*size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,n=rand(),wave=Math.sin(x*.071+Math.sin(y*.042)*2)*Math.cos(y*.063),fine=(n-.5);
      let v=.64+fine*.16+wave*.05,h=v;
      if(kind==='asphalt'){v=.36+fine*.17+wave*.025;if(n>.98)v+=.2;h=v;}
      if(kind==='concrete'){v=.72+fine*.06+wave*.07;h=.5+fine*.1;if(x<2||y<2){v-=.2;h-=.25;}}
      if(kind==='brick'){const row=Math.floor(y/32),xx=(x+(row%2)*32)%64,mortar=xx<3||y%32<3;v=mortar?.74:.56+fine*.12+wave*.07;h=mortar?.2:.7+fine*.14;}
      if(kind==='wood'){v=.6+Math.sin(x*.42+Math.sin(y*.03)*1.5)*.09+fine*.045;h=v;if(x%64<2){v=.25;h=.15;}}
      if(kind==='metal'){v=.69+fine*.055+Math.sin(y*2)*.025;h=.5+fine*.025;}
      if(kind==='rust'){v=.49+wave*.2+fine*.15;h=v;}
      if(kind==='rubber'){v=.52+fine*.08;h=.5+fine*.1;}
      if(kind==='fabric'){v=.7+((x+y)%2)*.12+fine*.025;h=v;}
      if(kind==='grass'){v=.5+fine*.3+wave*.1;h=v;}
      if(kind==='gravel'){v=.63+fine*.35+wave*.04;h=v;}
      heights[i]=h;const b=Math.round(clamp(v,0,1)*255);im.data[i*4]=b;im.data[i*4+1]=b;im.data[i*4+2]=b;im.data[i*4+3]=255;
    }
    g.putImageData(im,0,0);
    if(kind==='asphalt'){
      g.strokeStyle='rgba(19,20,22,.5)';g.lineWidth=.7;
      for(let k=0;k<5;k++){g.beginPath();let x=rand()*256,y=rand()*256;g.moveTo(x,y);for(let j=0;j<7;j++){x+=rand()*13-4;y+=rand()*12-3;g.lineTo(x,y);}g.stroke();}
    }
    const nc=document.createElement('canvas');nc.width=nc.height=size;const ng=nc.getContext('2d'),ni=ng.createImageData(size,size);
    const rc=document.createElement('canvas');rc.width=rc.height=size;const rg=rc.getContext('2d'),ri=rg.createImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,dx=heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size],dy=heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x];
      ni.data.set([128-dx*110,128+dy*110,250,255],i*4);
      const value=Math.round(clamp((kind==='metal'?.38:kind==='rubber'?.8:.72)+heights[i]*.22,0,1)*255);ri.data.set([value,value,value,255],i*4);
    }
    ng.putImageData(ni,0,0);rg.putImageData(ri,0,0);
    const make=canvas=>{const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer?.capabilities.getMaxAnisotropy()||1);return t;};
    const maps={map:make(c),normalMap:make(nc),roughnessMap:make(rc)};maps.map.colorSpace=THREE.SRGBColorSpace;textures.set(kind,maps);return maps;
  }
  function pbr(kind,color,metal=0){const key=kind+':'+color+':'+metal;if(!materials.has(key)){
    const m=new THREE.MeshStandardMaterial({color,...materialMaps(kind),roughness:kind==='metal'?.65:.95,metalness:metal,normalScale:new THREE.Vector2(kind==='asphalt'?.35:.22,kind==='asphalt'?.35:.22),envMapIntensity:metal?.8:.35});materials.set(key,m);
  }return materials.get(key);}
  function mat(color,metal=0,emissive=0){const key=color+':'+metal+':'+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:metal?.3:.72,metalness:metal,emissive,emissiveIntensity:emissive?1.5:0,envMapIntensity:.75}));return materials.get(key);}
  function geo(key,fn){if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key);}
  function box(parent,w,h,d,x,y,z,color,metal=0){const o=new THREE.Mesh(geo('box',()=>new THREE.BoxGeometry(1,1,1)),typeof color==='object'?color:mat(color,metal));o.scale.set(w,h,d);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function rod(parent,a,b,r,color){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const o=new THREE.Mesh(geo('rod',()=>new THREE.CylinderGeometry(1,1,1,12)),typeof color==='object'?color:mat(color,.5));o.scale.set(r,dir.length(),r);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function sphere(parent,r,x,y,z,color){const o=new THREE.Mesh(geo('sphere',()=>new THREE.SphereGeometry(1,24,16)),typeof color==='object'?color:mat(color,.15));o.scale.setScalar(r);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
  function rounded(parent,w,h,d,x,y,z,material,r=.12){
    const key=['rounded',w,h,d,r].join(':'),geometry=geo(key,()=>{const s=new THREE.Shape(),a=-w/2,b=-h/2;r=Math.min(r,w/3,h/3);s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:Math.min(r*.4,d*.2),bevelThickness:Math.min(r*.4,d*.2),bevelSegments:3,steps:1,curveSegments:6});g.translate(0,0,-d/2);return g;});
    const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  function sign(parent,text,x,y,z,color=0x193b4e,w=4){const cn=document.createElement('canvas');cn.width=512;cn.height=128;const c=cn.getContext('2d');c.fillStyle='#'+color.toString(16).padStart(6,'0');c.fillRect(0,0,512,128);c.fillStyle='#f7f7e9';c.font='bold 48px system-ui';c.textAlign='center';c.fillText(text,256,82);const tex=new THREE.CanvasTexture(cn);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshStandardMaterial({map:tex,roughness:.7}),o=new THREE.Mesh(new THREE.PlaneGeometry(w,1),m);o.position.set(x,y,z);o.userData.owned=true;parent.add(o);return o;}
  function applyQuality(){if(!renderer)return;const q=qualityProfiles[quality];renderer.setPixelRatio(Math.min(devicePixelRatio||1,q.dpr));renderer.shadowMap.enabled=true;lights.shadow.mapSize.set(q.shadow,q.shadow);lights.shadow.map?.dispose();lights.shadow.map=null;camera.far=q.far+100;camera.updateProjectionMatrix();if(skyDome)skyDome.scale.setScalar((camera.far-60)/270);if(world)world.traverse(o=>{if(o.userData.detail!==undefined)o.visible=o.userData.detail<=q.detail;});resize();const b=$('[data-bike-action="quality"]');if(b)b.textContent='Grafik: '+(qualityMode==='auto'?'Auto · ':'')+q.name;$('#bikeRenderer').textContent='3D · '+q.name;}
  function initRenderer(){if(!window.THREE)return;try{
    if(ctx){const old=canvas;canvas=old.cloneNode();old.replaceWith(canvas);ctx=null;observer?.disconnect();observer?.observe(canvas);}
    quality=innerWidth<650?0:(navigator.hardwareConcurrency||4)<8?1:2;qualityMode='auto';qualityWarmup=3;
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(39,1,.1,350);
    const ambient=new THREE.HemisphereLight(0xd8e5f2,0x776b59,1.1);ambient.name='skyLight';scene.add(ambient);
    lights=new THREE.DirectionalLight(0xffe3b7,2.6);lights.position.set(-10,35,18);lights.castShadow=true;Object.assign(lights.shadow.camera,{left:-27,right:27,top:22,bottom:-22,near:1,far:110});lights.shadow.bias=-.00015;lights.shadow.normalBias=.035;lights.shadow.radius=2;scene.add(lights,lights.target);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();renderer?.dispose();renderer=null;scene=null;initFallback();resize();toast('WebGL tappades · enkel grafik är aktiverad');},{signal:abort.signal});
    applyQuality();if(ride){buildWorld();rebuildBike();}resize();
  }catch(error){console.warn('Stuntcykel WebGL:',error);renderer=null;initFallback();}}
  function buildAtmosphere(){
    const night=level===4,dusk=level===2||level===6;
    const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d'),gradient=g.createLinearGradient(0,0,0,512);
    gradient.addColorStop(0,night?'#071322':dusk?'#6b91b1':'#497b9d');gradient.addColorStop(.46,night?'#20354d':dusk?'#c5bbbc':'#a5c6d5');gradient.addColorStop(.61,night?'#59606b':dusk?'#efd1ad':'#e3ded0');gradient.addColorStop(1,night?'#17212a':'#8c978a');g.fillStyle=gradient;g.fillRect(0,0,1024,512);
    const rand=seeded(83);for(let i=0;i<90;i++){const x=rand()*1024,y=40+rand()*190,r=12+rand()*45;const cl=g.createRadialGradient(x,y,1,x,y,r);cl.addColorStop(0,night?'rgba(160,180,200,.05)':'rgba(255,250,236,.12)');cl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=cl;g.save();g.translate(x,y);g.scale(2.8,.4);g.translate(-x,-y);g.fillRect(x-r,y-r,2*r,2*r);g.restore();}
    const sun=g.createRadialGradient(730,170,0,730,170,85);sun.addColorStop(0,night?'#d4e5e9':'#fff7df');sun.addColorStop(.06,night?'#c6d4db':'#fff5d7');sun.addColorStop(.1,'rgba(255,233,191,.4)');sun.addColorStop(1,'rgba(255,225,185,0)');g.fillStyle=sun;g.fillRect(645,85,170,170);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.mapping=THREE.EquirectangularReflectionMapping;
    environmentTarget?.dispose();const pmrem=new THREE.PMREMGenerator(renderer);environmentTarget=pmrem.fromEquirectangular(tex);pmrem.dispose();scene.environment=environmentTarget.texture;
    const skyMaterial=new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false});skyDome=new THREE.Mesh(new THREE.SphereGeometry(270,32,16),skyMaterial);skyDome.userData.owned=true;skyDome.renderOrder=-100;world.add(skyDome);
    scene.fog=new THREE.Fog(night?0x27374b:dusk?0xc3b7ad:0xb7ccd1,48,qualityProfiles[quality].far);scene.background=new THREE.Color(night?0x132434:0xb7ccd1);
    scene.getObjectByName('skyLight').intensity=night?.65:1.1;lights.color.set(night?0xb4cbeb:0xffdfb4);lights.intensity=night?1.2:2.6;
  }

  function initFallback(){if(ctx)return;const old=canvas;canvas=old.cloneNode();old.replaceWith(canvas);ctx=canvas.getContext('2d');observer?.disconnect();observer?.observe(canvas);$('#bikeRenderer').textContent='ENKEL GRAFIK · WEBGL SAKNAS';const qualityButton=$('[data-bike-action="quality"]');if(qualityButton){qualityButton.disabled=true;qualityButton.textContent='Grafik: reservläge';}}
  function disposeGroup(group){if(!group)return;group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.owned){o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();}});scene?.remove(group);}
  function surfaceBox(parent,w,h,d,x,y,z,material,tile=3){
    const quant=v=>v<1?Math.max(.025,Math.round(v*20)/20):Math.max(1,Math.round(v/2)*2),qw=quant(w),qh=quant(h),qd=quant(d);
    const key=['surface',qw,qh,qd,tile].join(':');
    const geometry=geo(key,()=>{const g=new THREE.BoxGeometry(qw,qh,qd),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const face=Math.floor(i/4),u=face<2?qd:qw,v=face===2||face===3?qd:qh;uv.setXY(i,uv.getX(i)*u/tile,uv.getY(i)*v/tile);}return g;});
    const o=new THREE.Mesh(geometry,material);o.scale.set(w/qw,h/qh,d/qd);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  function buildWorld(){if(!scene)return;
    for(const p of fx){scene.remove(p.o);particlePool.push(p.o);}fx=[];
    disposeGroup(world);world=new THREE.Group();scene.add(world);traffic=[];const t=tracks[level],night=level===4;
    buildAtmosphere();
    const asphalt=pbr('asphalt',0x999da0),concrete=pbr('concrete',0xc9c4b8),steel=pbr('metal',0x8b9291,.8),darkSteel=pbr('rust',0x776354,.65),wood=pbr('wood',0xac8a59),earth=pbr('gravel',0xa69a82);
    surfaceBox(world,t.length+200,1,140,t.length/2,t.base-6.1,-35,earth,5);
    surfaceBox(world,t.length+180,.25,10,t.length/2,t.base-5.5,-12,asphalt,4);
    surfaceBox(world,t.length+180,.3,2,t.length/2,t.base-5.4,-6,concrete,3);
    const p=t.points;
    for(let i=1;i<p.length;i++){
      const a=p[i-1],b=p[i],dx=b[0]-a[0],dy=b[1]-a[1];if(dx<.2)continue;
      const len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),mid=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
      const ramp=Math.abs(dy)>.5;const road=surfaceBox(world,len,.32,4,mid,my-.16,0,ramp&&(level===1||level===5)?wood:asphalt,ramp?2.6:3.8);road.rotation.z=angle;
      for(const z of [-2.03,2.03]){const edge=surfaceBox(world,len,.24,.14,mid,my-.16,z,steel,2);edge.rotation.z=angle;}
      // Trusses and deck fasteners are decorative: surface() remains the sole collision surface.
      for(let x=a[0]+1.2;x<b[0]-.5;x+=4){const y=surface(t,x).y;
        const stripe=box(world,1.25,.012,.09,x,y+.015,.6,0xe2d9ba);stripe.rotation.z=angle;
        if(ramp){const foot=t.base-5.2,h=Math.max(.3,y-foot-.35);surfaceBox(world,.18,h,3.8,x,foot+h/2,0,darkSteel,2);rod(world,[x,foot,1.88],[Math.min(x+3,b[0]),surface(t,Math.min(x+3,b[0])).y-.4,1.88],.055,steel);}
        for(const z of [-1.88,1.88]){const bolt=sphere(world,.038,x,y+.01,z,steel);bolt.scale.y=.018;}
      }
      if(!ramp){const base=t.base-5.3,h=Math.max(.5,my-base);surfaceBox(world,len,h,3.8,mid,base+h/2,0,concrete,3);for(let x=a[0]+2;x<b[0]-1;x+=6){surfaceBox(world,.025,h,.02,x,base+h/2,1.91,darkSteel);}}
    }
    // All tall scenery is behind the riding plane. Nothing is placed between camera and rider.
    const rand=seeded(191+level*23);
    for(let layer=0;layer<3;layer++)for(let x=-55;x<t.length+65;x+=layer===0?23:17){
      const s=rand(),h=layer===0?10+s*34:layer===1?8+s*24:5+s*16,w=8+rand()*6,z=-83+layer*29,base=t.base-5;
      const brick=layer===2&&s>.48,wall=brick?pbr('brick',[0xbf9278,0xae8872,0xc0ad95][level%3]):pbr('concrete',layer===0?0xa8b2b5:layer===1?0xadb2b0:0xc0b7a4);
      const facade=surfaceBox(world,w,h,8,x,base+h/2,z,wall,brick?2.4:4);facade.castShadow=layer===2;
      surfaceBox(world,w+.4,.35,8.4,x,base+h,z,concrete,3);
      const glass=mat(night?0xf2c58d:0x7e9aa6,.55,night?0x664326:0);glass.roughness=.18;
      for(let yy=base+1.3;yy<base+h-1;yy+=2.5){
        box(world,w-.9,1.15,.08,x,yy,z+4.06,glass);
        surfaceBox(world,w-.6,.13,.35,x,yy-.66,z+4.15,steel,2);
      }
      for(let xx=x-w/2+.8;xx<x+w/2;xx+=1.7)box(world,.2,h-.6,.14,xx,base+h/2,z+4.14,wall);
      if(layer===2){
        surfaceBox(world,w+1,.2,2.7,x,base+.1,z+5.2,concrete,2);
        box(world,1.35,2,.12,x-2,base+1,z+4.2,mat(0x32444a,.4));
        if(s>.4){const canopy=surfaceBox(world,w*.7,.12,1.9,x,base+2.7,z+4.8,pbr('fabric',level===3?0x647e84:0x758577),3);canopy.rotation.x=.12;}
        if(s>.6)sign(world,['VERKSTAD','HAMNMAGASIN','STADENS TAK','CYKEL & SERVICE'][level%4],x,base+3.6,z+4.25,0x334a4d,w*.8);
        const ac=surfaceBox(world,1.8,.8,1.4,x-1,base+h+.6,z+1,steel,1);ac.userData.detail=1;
        for(let j=0;j<5;j++){const vent=box(world,1.6,.035,.03,x-1,base+h+.35+j*.12,z+1.72,0x454d4e);vent.userData.detail=1;}
        if(s>.7)rod(world,[x+2,base+h,z],[x+2,base+h+3,z],.05,steel);
      }
    }
    for(let x=-10;x<t.length+20;x+=24){
      const y=t.base-5.2;surfaceBox(world,.6,.2,.6,x,y,-5.2,concrete);rod(world,[x,y,-5.2],[x,y+7,-5.2],.065,steel);rod(world,[x,y+7,-5.2],[x+1.4,y+7,-5.2],.06,steel);
      rounded(world,.9,.12,.4,x+1.2,y+6.95,-5.2,steel,.04);box(world,.7,.025,.3,x+1.2,y+6.86,-5.2,mat(0xffe8bd,0,night?0xffc67a:0));
      if(night){const glow=new THREE.Mesh(geo('lampglow',()=>new THREE.PlaneGeometry(5,8)),glowMaterial());glow.position.set(x+1.2,y+3,-5.1);world.add(glow);}
      if(Math.round(x)%3===0){surfaceBox(world,1.8,.12,.45,x+4,y+.55,-5.4,wood);for(const xx of [x+3.3,x+4.7])rod(world,[xx,y,-5.4],[xx,y+.55,-5.4],.045,steel);}
    }
    for(const [j,jump] of t.jumps.entries()){
      const x=jump.x-2,y=t.base;
      if(level===1||level===6&&j%3===1){crane(x+6,y-5,-18);vehicle(x,y-5,-8,0xcda14d,'truck');for(let k=0;k<3;k++){surfaceBox(world,2.8,.8,.7,x+k*3,y-4.8,-4,concrete,2);box(world,2.5,.14,.025,x+k*3,y-4.4,-3.63,0xd0a544);}}
      else if(level===3){for(let k=0;k<3;k++){const cx=x+k*5.2,cy=y-4+k%2*2.5,col=[0xa75e48,0x47777c,0xa38f5d][k],m=pbr('metal',col,.5);surfaceBox(world,6,2.4,3,cx,cy,-9,m,3);for(let q=0;q<16;q++)box(world,.045,2.2,.07,cx-2.85+q*.37,cy,-7.46,m);for(const yy of [-1.1,1.1])box(world,6,.08,.12,cx,cy+yy,-7.4,darkSteel);}}
      else vehicle(x,y-5,-8,[0x78918e,0xc4b392,0x617c8a][j%3],j%3===0?'bus':'car');
      if(j%2===0&&level!==1&&level!==3)tree(x+9,y-5,-10,1+(j%3)*.18);
      if(level===5){for(let k=0;k<4;k++)surfaceBox(world,12,.5,1.5,x,y-4+k*.6,-8-k*1.5,concrete,3);}
      sign(world,'↗ '+(j+1).toString().padStart(2,'0'),x-6,surface(t,x-6).y+1.6,-2.8,0x334b50,1.8);
    }
    if(level===3){const water=surfaceBox(world,t.length+100,.08,38,t.length/2,-6,-33,pbr('metal',0x668d98,.65),14);water.material.roughness=.3;}
    for(let x=10;x<t.length;x+=31){
      surfaceBox(world,5,.12,2,x,t.base-5.2,-18,pbr('grass',0x88906c),2);
      if(level!==1&&level!==3)tree(x,t.base-5.2,-20,1.1);
      for(let k=0;k<3;k++){const bush=sphere(world,.7,x+k-1,t.base-4.9,-18,pbr('grass',0x83916b));bush.scale.y=.48;bush.userData.detail=1;}
    }
    for(let i=0;i<4;i++){const car=vehicle(i*69,t.base-5,-12,i%2?0xbda07e:0x718a8e,'car');traffic.push({mesh:car,speed:3+i*.4,start:i*69});}
    for(const cp of t.checkpoints.slice(1)){rod(world,[cp,t.base,-2.4],[cp,t.base+3,-2.4],.045,steel);surfaceBox(world,1,.6,.03,cp+.5,t.base+2.6,-2.4,pbr('fabric',0x74ac8d),1);}
    const end=t.length;for(const z of [-2.35,2.35]){rod(world,[end,t.base,z],[end,t.base+5,z],.1,steel);}box(world,.2,.22,4.9,end,t.base+5,0,steel);sign(world,'MÅL',end,t.base+5,2.5,0x233d43,2.6);
    for(let i=0;i<12;i++)box(world,.45,.015,.33,end+(i%2)*.45,t.base+.02,-1.8+Math.floor(i/2)*.66,i%2?0xe4e1d7:0x2d3437);
    // Soft local contact occlusion also remains visible on the low shadow preset.
    const shadowMat=glowMaterial(true);contactShadow=new THREE.Mesh(geo('contact',()=>new THREE.PlaneGeometry(4.2,2)),shadowMat);contactShadow.rotation.x=-Math.PI/2;contactShadow.renderOrder=2;world.add(contactShadow);
    batchStatic();applyQuality();
  }
  function glowMaterial(dark=false){const key=dark?'contact-ao':'lamp-haze';if(materials.has(key))return materials.get(key);const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,dark?'rgba(20,23,22,.48)':'rgba(255,215,153,.10)');r.addColorStop(1,dark?'rgba(20,23,22,0)':'rgba(255,215,153,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});materials.set(key,m);return m;}
  function batchStatic(){const batches=new Map();for(const o of [...world.children]){if(!o.isMesh||o.userData.owned||o===skyDome||o===contactShadow||o.material.transparent)continue;const key=Math.floor(o.position.x/45)+':'+o.geometry.uuid+':'+o.material.uuid+':'+(o.userData.detail||0);if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}for(const list of batches.values()){if(list.length<2)continue;const m=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();m.setMatrixAt(i,o.matrix);world.remove(o);});m.castShadow=true;m.receiveShadow=true;m.userData.detail=list[0].userData.detail||0;m.computeBoundingSphere?.();world.add(m);}}
  function batchModel(group){
    const bins=new Map();for(const o of [...group.children]){if(!o.isMesh||o.userData.dynamic||o.userData.owned)continue;const key=o.geometry.uuid+o.material.uuid;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(o);}
    for(const list of bins.values()){if(list.length<2)continue;const inst=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();inst.setMatrixAt(i,o.matrix);group.remove(o);});inst.castShadow=inst.receiveShadow=true;inst.computeBoundingSphere?.();group.add(inst);}
  }
  function tree(x,y,z,scale=1){
    const bark=pbr('wood',0x817461),leaf=pbr('grass',0x899571);rod(world,[x,y,z],[x+.15,y+4.3*scale,z],.15*scale,bark);
    const rand=seeded(Math.abs(x*100)|0);for(let i=0;i<7;i++){const a=rand()*TAU,r=.5+rand()*1.2,cx=x+Math.cos(a)*r*scale,cy=y+(3.2+rand()*1.8)*scale,cz=z+Math.sin(a)*r*scale;rod(world,[x,y+2.4*scale,z],[cx,cy,cz],.04*scale,bark);const o=sphere(world,(.7+rand()*.5)*scale,cx,cy,cz,leaf);o.scale.y*=.8;if(i>3)o.userData.detail=1;}
  }
  function crane(x,y,z){const steel=pbr('metal',0xbca15c,.6),dark=pbr('rust',0x626663,.65);for(const a of [-.45,.45])rod(world,[x+a,y,z],[x+a,y+23,z],.09,steel);for(let h=0;h<23;h+=1.8){rod(world,[x-.45,y+h,z],[x+.45,y+h+1.8,z],.045,steel);rod(world,[x-.45,y+h,z],[x+.45,y+h,z],.045,steel);}for(const yy of [23,24])rod(world,[x-5,y+yy,z],[x+16,y+yy,z],.09,steel);for(let q=-5;q<16;q+=2)rod(world,[x+q,y+23,z],[x+q+2,y+24,z],.05,steel);rod(world,[x,y+27,z],[x+15,y+24,z],.035,dark);rod(world,[x+11,y+23,z],[x+11,y+13,z],.025,dark);rounded(world,1.8,1.4,1.4,x+1,y+23.5,z,mat(0x718a92,.6));surfaceBox(world,2.5,2,2,x-4,y+23,z,pbr('concrete',0xaaa99c));}
  function vehicle(x,y,z,color,type){const g=new THREE.Group();world.add(g);g.position.set(x,y,z);const len=type==='bus'?7:type==='truck'?6:3.8;const paint=mat(color,.35),glass=mat(0x6c8793,.65);glass.roughness=.15;
    rounded(g,len,.85,1.65,0,.7,0,paint,.2);rounded(g,type==='car'?2.15:len*.76,.85,1.45,-.15,1.48,0,glass,.25);rounded(g,type==='car'?2:len*.78,.09,1.52,-.15,1.95,0,paint,.04);
    for(const xx of [-.8,.85])box(g,.1,.9,1.49,xx,1.45,0,paint);box(g,len+.08,.12,1.68,0,.35,0,mat(0x424c4e,.6));for(const wz of [-.85,.85])for(const wx of [-len*.32,len*.32]){const wheel=new THREE.Mesh(geo('carwheel',()=>new THREE.CylinderGeometry(.43,.43,.22,24)),pbr('rubber',0x343a3d));wheel.rotation.x=Math.PI/2;wheel.position.set(wx,.43,wz);g.add(wheel);const hub=sphere(g,.23,wx,.43,wz*1.1,mat(0xaeb8ba,.75));hub.scale.z=.06;}
    for(const zz of [-.56,.56]){box(g,.02,.2,.28,len/2+.04,.8,zz,mat(0xf7e9c8,0,level===4?0xffdcb3:0));box(g,.02,.15,.3,-len/2-.04,.8,zz,mat(0xa05147,0,0x4a0e09));}return g;}

  function rebuildBike(){if(!scene)return;disposeGroup(bike);bike=new THREE.Group();scene.add(bike);
    const color=bikes[save.selected][1],paint=mat(color,.38),rubber=pbr('rubber',0x373c3d),alloy=pbr('metal',0xc1c7c6,.85),dark=pbr('metal',0x59615f,.75),suit=pbr('fabric',0x526b78),blackFabric=pbr('fabric',0x343f47);
    paint.roughness=.24;bike.userData.wheels=[];bike.userData.forks=[];bike.userData.dynamicRods=[];bike.userData.calipers=[];
    for(const dx of [-1.05,1.05]){
      const w=new THREE.Group();w.position.set(dx,-.45,0);bike.add(w);
      const tire=new THREE.Mesh(geo('tire',()=>new THREE.TorusGeometry(.337,.095,16,48)),rubber);tire.scale.z=1.35;tire.castShadow=true;w.add(tire);
      for(const z of [-.07,.07]){const rim=new THREE.Mesh(geo('rim',()=>new THREE.TorusGeometry(.264,.023,8,48)),alloy);rim.position.z=z;w.add(rim);for(let i=0;i<20;i++){const a=i*TAU/20;rod(w,[Math.cos(a+.4)*.055,Math.sin(a+.4)*.055,z*.5],[Math.cos(a)*.26,Math.sin(a)*.26,z],.006,alloy);}}
      const hub=rod(w,[0,0,-.115],[0,0,.115],.055,alloy);hub.castShadow=true;
      const disc=new THREE.Mesh(geo('disc',()=>new THREE.RingGeometry(.06,.157,40)),dark);disc.material.side=THREE.DoubleSide;disc.position.z=.115;w.add(disc);
      for(let i=0;i<12;i++){const a=i*TAU/12;const slot=sphere(w,.016,Math.cos(a)*.12,Math.sin(a)*.12,.118,mat(0x262d30));slot.scale.z=.004;}
      for(let i=0;i<32;i++){const a=i*TAU/32;for(const z of [-.075,.075]){const tread=box(w,.055,.025,.085,Math.cos(a)*.431,Math.sin(a)*.431,z,rubber);tread.rotation.z=a-Math.PI/2;tread.rotation.y=z>0?.25:-.25;}}
      batchModel(w);bike.userData.wheels.push(w);
    }
    // Tubular frame, machined engine, shaped panels and a separate articulated swingarm.
    for(const z of [-.18,.18]){
      rod(bike,[-.42,.42,z],[.48,.45,z],.048,paint);rod(bike,[.48,.45,z],[.08,-.31,z],.046,paint);rod(bike,[.08,-.31,z],[-.45,.35,z],.045,paint);rod(bike,[-.45,.35,z],[-.78,.46,z],.032,dark);
      const swing=rod(bike,[-1.05,-.45,z],[-.2,-.18,z],.055,alloy);swing.userData.dynamic=true;bike.userData.dynamicRods.push({mesh:swing,a:[-.2,-.18,z],b:[-1.05,-.45,z],wheel:0});
      const fork=rod(bike,[.63,.63,z],[1.05,-.45,z],.04,alloy);fork.userData.dynamic=true;bike.userData.forks.push(fork);
      rod(bike,[.63,.63,z],[.79,.19,z],.061,pbr('metal',0xc5ad72,.8));
      const caliper=rounded(bike,.15,.22,.09,1.02,-.3,z*1.4,dark,.025);caliper.userData.dynamic=true;bike.userData.calipers.push(caliper);
      rod(bike,[-.18,-.2,z],[-.18,-.2,z*1.9],.04,dark);
    }
    rounded(bike,.46,.4,.46,-.08,-.06,0,dark,.1);for(let i=0;i<6;i++)rounded(bike,.5,.027,.52,-.08,-.2+i*.06,0,alloy,.01);
    const casing=sphere(bike,.19,-.26,-.12,.27,dark);casing.scale.z=.08;for(let i=0;i<6;i++){const a=i*TAU/6;sphere(bike,.018,-.26+Math.cos(a)*.14,-.12+Math.sin(a)*.14,.345,alloy);}
    const tank=rounded(bike,.73,.32,.43,.03,.4,0,paint,.12);tank.rotation.z=-.18;
    rounded(bike,.85,.12,.36,-.52,.56,0,rubber,.055);
    const tail=rounded(bike,.75,.065,.35,-1,.43,0,paint,.025);tail.rotation.z=.16;
    const fender=rounded(bike,.78,.06,.38,1.04,.2,0,paint,.025);fender.rotation.z=-.08;
    for(const z of [-.245,.245]){const panel=rounded(bike,.4,.23,.025,-.49,.27,z,paint,.05);panel.rotation.z=.3;box(bike,.19,.025,.032,-.48,.31,z*1.07,mat(0xe3e2d8));}
    rod(bike,[.56,.55,0],[.62,.85,0],.04,dark);rod(bike,[.62,.85,-.36],[.62,.85,.36],.026,alloy);for(const z of [-.3,.3])rod(bike,[.62,.85,z-.06],[.62,.85,z+.06],.043,rubber);
    rod(bike,[.62,.8,.18],[.87,-.23,.25],.009,mat(0x272f30));
    rod(bike,[.1,-.15,-.27],[-.7,.16,-.27],.055,dark);rod(bike,[-.7,.16,-.27],[-1.15,.27,-.27],.095,alloy);
    const spring=new THREE.Group();spring.position.set(-.58,-.08,.14);spring.rotation.z=-.55;bike.add(spring);rod(spring,[0,-.3,0],[0,.3,0],.027,alloy);
    const springPoints=[];for(let i=0;i<=120;i++){const a=i/120*TAU*7;springPoints.push(new THREE.Vector3(Math.cos(a)*.065,-.28+i/120*.56,Math.sin(a)*.065));}
    const coil=new THREE.Mesh(geo('coil',()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints),120,.012,6,false)),mat(0xd1ac60,.7));spring.add(coil);bike.userData.spring=spring;
    for(const yy of [-.43,-.55])rod(bike,[-1.05,yy,.15],[-.19,yy+.16,.15],.012,dark);
    const rider=new THREE.Group();bike.add(rider);bike.userData.rider=rider;bike.userData.pose={lean:0,squat:0};bike.userData.limbs=[];
    const torso=rounded(rider,.34,.49,.36,-.28,1.03,0,suit,.1);torso.rotation.z=-.15;bike.userData.torso=torso;
    const chest=rounded(rider,.075,.34,.31,-.075,1.08,0,blackFabric,.03);chest.rotation.z=-.15;bike.userData.chest=chest;
    const pelvis=rounded(rider,.3,.19,.35,-.35,.76,0,blackFabric,.07);bike.userData.pelvis=pelvis;
    const head=new THREE.Group();head.position.set(-.12,1.51,0);rider.add(head);bike.userData.head=head;
    const helmet=sphere(head,.275,0,0,0,paint);helmet.scale.y=.29;
    const visor=new THREE.Mesh(geo('visor',()=>new THREE.SphereGeometry(.281,24,12,0,Math.PI*.85,.75,1.05)),mat(0x354b55,.7));visor.rotation.y=-Math.PI*.38;visor.scale.set(1,.98,1.03);head.add(visor);
    rounded(head,.24,.08,.44,.17,-.14,0,paint,.035);rounded(head,.35,.035,.46,.13,.17,0,paint,.02);
    for(const z of [-.23,.23]){rod(head,[-.13,.12,z],[.12,.12,z],.012,mat(0xd9d8ce));
      const upperArm=rod(rider,[-.22,1.21,z],[.12,.95,z],.067,suit),lowerArm=rod(rider,[.12,.95,z],[.62,.85,z],.054,suit),thigh=rod(rider,[-.35,.76,z],[-.01,.33,z],.082,blackFabric),shin=rod(rider,[-.01,.33,z],[.13,-.15,z],.064,suit);
      const elbow=sphere(rider,.072,.12,.95,z,blackFabric),knee=sphere(rider,.088,-.01,.33,z,suit);sphere(rider,.064,.62,.85,z,rubber);rounded(rider,.31,.16,.16,.19,-.2,z,rubber,.045);
      bike.userData.limbs.push({z,upperArm,lowerArm,thigh,shin,elbow,knee});
    }
    batchModel(bike);
  }
  function setLimb(mesh,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz);mesh.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);mesh.scale.y=length;mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/length,dy/length,dz/length));}
  function animateBike(dt){const d=bike.userData,blend=1-Math.exp(-dt*12),pose=d.pose;
    pose.lean+=(clamp(-ride.av*.035+(keys.gas?-.065:keys.brake?.095:0),-.2,.2)-pose.lean)*blend;
    pose.squat+=((Math.max(...ride.compression)*.5+(ride.air>.15?.045:0))-pose.squat)*blend;
    const x=-pose.lean*1.3,y=-pose.squat;
    d.torso.position.set(-.28+x,1.03+y,0);d.torso.rotation.z=-.15+pose.lean;d.chest.position.set(-.075+x,1.08+y,0);d.chest.rotation.z=-.15+pose.lean;d.pelvis.position.set(-.35+x*.5,.76+y,0);d.head.position.set(-.12+x*1.25,1.51+y,0);d.head.rotation.z=pose.lean*.5;
    for(const l of d.limbs){const z=l.z,shoulder=[-.22+x,1.21+y,z],elbow=[.12+x*.5,.95+y*.65,z*1.15],hand=[.62,.85,z],hip=[-.35+x*.5,.76+y,z],knee=[-.01+x*.2+pose.squat*.3,.33+y*.45,z*1.15],foot=[.13,-.15,z];setLimb(l.upperArm,shoulder,elbow);setLimb(l.lowerArm,elbow,hand);setLimb(l.thigh,hip,knee);setLimb(l.shin,knee,foot);l.elbow.position.set(...elbow);l.knee.position.set(...knee);}
    for(const r of d.dynamicRods){const b=[...r.b];b[1]+=ride.compression[r.wheel];setLimb(r.mesh,r.a,b);}d.spring.scale.y=1-Math.max(...ride.compression)*.6;
    d.calipers.forEach(c=>{c.position.y=-.3+ride.compression[1];});d.wheels.forEach((w,i)=>{w.position.y=-.45+ride.compression[i];w.rotation.z=-ride.x/.43;});d.forks.forEach((f,i)=>setLimb(f,[.63,.63,i?.18:-.18],[1.05,-.45+ride.compression[1],i?.18:-.18]));
  }
  function particles(color,n){if(!scene||!ride)return;const cap=qualityProfiles[quality].particles;
    for(let i=0;i<Math.min(n,6)&&fx.length<cap;i++){const o=particlePool.pop()||new THREE.Mesh(geo('particle',()=>new THREE.SphereGeometry(.025,6,4)),pbr('gravel',0xb9ae96));o.position.set(ride.x-1,ride.y-.7,.15+Math.random()*.2);o.scale.setScalar(1);scene.add(o);fx.push({o,vx:-Math.abs(ride.vx)*.12-Math.random(),vy:.4+Math.random(),life:.2+Math.random()*.25});}}
  function adaptQuality(dt){if(!renderer||state!=='playing'||qualityMode!=='auto')return;if(qualityWarmup>0){qualityWarmup-=dt;return;}frameCost+=(dt*1000-frameCost)*.04;qualityTimer+=dt;if(qualityTimer>5){qualityTimer=0;if(frameCost>28&&quality>0){quality--;applyQuality();scene.fog.far=qualityProfiles[quality].far;qualityWarmup=5;}}}

  function resize(){if(!canvas||!root)return;const r=canvas.getBoundingClientRect();if(r.width<=0||r.height<=0)return;if(renderer){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}else if(ctx){canvas.width=r.width*Math.min(devicePixelRatio||1,2);canvas.height=r.height*Math.min(devicePixelRatio||1,2);}}
  function render(dt){if(!ride)return;const t=tracks[level];if(renderer&&bike){const garageMode=state==='garage';world.visible=!garageMode;root.dataset.mode=state;scene.background.set(garageMode?0x243b4c:level===4?0x132434:0xb7ccd1);bike.position.set(ride.x,ride.y,0);bike.rotation.set(0,garageMode?garageYaw:0,(garageMode?0:ride.a)+(state==='crashed'?Math.min(1,clock-ride.crashClock)*.65:0));animateBike(dt);if(state==='crashed'){const tumble=Math.min(1,(clock-ride.crashClock)*2);bike.userData.rider.position.x=tumble*.6;bike.userData.rider.position.y+=Math.sin(tumble*Math.PI)*.5;bike.userData.rider.rotation.z=-tumble*.8;}else{bike.userData.rider.position.x=0;bike.userData.rider.position.y=0;bike.userData.rider.rotation.z=0;}
      const desiredX=ride.x+5+clamp(ride.vx*.15,0,3),desiredY=ride.y+2.5;
      camX+=(desiredX-camX)*(1-Math.exp(-dt*4));camY+=(desiredY-camY)*(1-Math.exp(-dt*4));zoom+=((ride.air>.55?1.18:1)-zoom)*(1-Math.exp(-dt*2));
      const distance=Math.max(23,26/camera.aspect)*zoom;camera.position.set(garageMode?(camera.aspect<1?ride.x:ride.x-1.8):camX,garageMode?(camera.aspect<1?ride.y-4:ride.y+1.2):camY,garageMode?(camera.aspect<1?15:10):distance);camera.lookAt(camera.position.x,camera.position.y,0); // Always +Z: never follows behind the motorcycle.
      if(skyDome)skyDome.position.set(camX,t.base,0);if(contactShadow){const ground=surface(t,ride.x),height=Math.max(0,ride.y-ground.y-.8);contactShadow.position.set(ride.x,ground.y+.035,0);contactShadow.rotation.set(-Math.PI/2,0,0);contactShadow.rotation.y=-Math.atan(ground.s);contactShadow.material.opacity=clamp(1-height/5,0,.8);contactShadow.scale.setScalar(1+height*.12);}lights.position.set(ride.x-10,35+t.base,18);lights.target.position.set(ride.x,t.base,0);for(const car of traffic)car.mesh.position.x=(car.start+clock*car.speed)%(t.length+80)-30;
      for(const p of fx){p.life-=dt;p.o.position.x+=p.vx*dt;p.o.position.y+=p.vy*dt;p.vy-=6*dt;p.o.scale.setScalar(Math.max(0,p.life));}fx=fx.filter(p=>{if(p.life<=0){scene.remove(p.o);particlePool.push(p.o);return false;}return true;});renderer.render(scene,camera);
    }else if(ctx)renderFallback();}
  function renderFallback(){const w=canvas.width,h=canvas.height,c=ctx,t=tracks[level],scale=Math.min(w/28,h/18),cx=ride.x-8,cy=ride.y+7;const X=x=>(x-cx)*scale,Y=y=>(cy-y)*scale;const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#'+t.sky.toString(16).padStart(6,'0'));gradient.addColorStop(1,level===4?'#273f5d':'#f0e4d1');c.fillStyle=gradient;c.fillRect(0,0,w,h);for(let i=-2;i<14;i++){const x=i*90-(ride.x*8%90);c.fillStyle=i%2?'#6e8a9a':'#8ba4b0';const bh=80+Math.abs(Math.sin(i*8))*150;c.fillRect(x,h*.65-bh,70,bh);c.fillStyle='#d3e1dd';for(let j=0;j<4;j++)c.fillRect(x+8,h*.65-bh+15+j*25,50,8);}c.fillStyle='#344957';c.beginPath();c.moveTo(0,h);for(let x=cx;x<cx+w/scale+.4;x+=.25)c.lineTo(X(x),Y(surface(t,x).y));c.lineTo(w,h);c.fill();c.strokeStyle='#ffd590';c.lineWidth=3;c.stroke();c.save();c.translate(X(ride.x),Y(ride.y));c.rotate(-ride.a);c.scale(scale,scale);for(let i=0;i<2;i++){const x=i?1.05:-1.05,y=.45-ride.compression[i];c.fillStyle='#182c3c';c.beginPath();c.arc(x,y,.43,0,TAU);c.fill();c.strokeStyle='#d5e0dc';c.lineWidth=.05;c.stroke();}c.strokeStyle='#'+bikes[save.selected][1].toString(16);c.lineWidth=.12;c.beginPath();c.moveTo(-1.05,.45);c.lineTo(-.4,-.4);c.lineTo(.6,-.4);c.lineTo(1.05,.45);c.lineTo(-.1,.35);c.closePath();c.stroke();c.strokeStyle='#294c61';c.lineWidth=.25;c.beginPath();c.moveTo(.1,.1);c.lineTo(-.4,-.7);c.lineTo(-.1,-1.3);c.lineTo(.6,-.9);c.stroke();c.fillStyle='#ffb677';c.beginPath();c.arc(-.1,-1.55,.28,0,TAU);c.fill();c.restore();}
  function loop(now){if(!root?.isConnected){destroy();return;}const dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;clock+=dt;if(state==='playing'){acc+=dt;while(acc>=1/120&&state==='playing'){step(ride,tracks[level],keys,1/120);processEvents();acc-=1/120;}if(keys.brake&&ride.contact[0]&&ride.vx>10&&Math.random()<.04)particles(0xc6c6b5,1);}adaptQuality(dt);engine();hud();render(dt);raf=requestAnimationFrame(loop);}
  function destroy(){cancelAnimationFrame(raf);clearTimeout(loading);observer?.disconnect();abort?.abort();if(audio){audio.ac.close().catch(()=>{});audio=null;}disposeGroup(world);disposeGroup(bike);for(const p of fx)scene?.remove(p.o);fx=[];materials.forEach(m=>{if(m.transparent)m.map?.dispose();m.dispose();});materials.clear();textures.forEach(m=>Object.values(m).forEach(t=>t.dispose()));textures.clear();environmentTarget?.dispose();environmentTarget=null;skyDome=null;contactShadow=null;particlePool=[];geometries.forEach(g=>g.dispose());geometries.clear();renderer?.dispose();renderer=null;scene=null;ctx=null;world=null;bike=null;root=null;canvas=null;keys={};keyboard={};pointers.clear();state='ready';ride=null;}
  window.FPStuntBike={gallery,start,destroy};
})();

