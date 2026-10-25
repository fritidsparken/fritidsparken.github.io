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
  function gallery(){return `<section class="bike-page arcade-shell"><header class="bike-heading"><div><span class="bike-eyebrow">FRITIDSPARKEN ORIGINAL · 3D TRIALS</span><h2>Stuntcykel <em>Stadens tak</em></h2><p>Sju stadsdelar. Två hjul. Ditt nästa perfekta hopp.</p></div><div class="bike-tools">${action('garage','Garage')}${action('sound','Ljud av')}${action('pause','Ⅱ Paus')}</div></header><div class="bike-track-tabs" aria-label="Välj bana">${tracks.map((t,i)=>`<button data-bike-level="${i}" aria-pressed="${i===0}"><b>0${i+1}</b>${t.name}</button>`).join('')}</div><div class="bike-field"><canvas id="bikeCanvas" tabindex="0" aria-label="Stuntcykel i sidovy. Piltangenter styr. Mellanslag hoppar. P pausar."></canvas><div class="bike-hud"><div><small>HASTIGHET</small><strong id="bikeSpeed">0 <i>km/h</i></strong></div><div><small id="bikeTrackName"></small><strong id="bikeTime">0.0 s</strong></div><div><small>TRICKPOÄNG</small><strong id="bikeScore">0</strong></div></div><div class="bike-progress"><i id="bikeProgress"></i></div><div class="bike-toast" id="bikeToast" aria-live="polite"></div><div class="bike-bottom"><span id="bikeRecord"></span><span id="bikeRenderer"></span></div><div class="bike-overlay" id="bikeOverlay"></div></div><div class="bike-controls"><div>${control('left','↶','Bakåt')}${control('right','↷','Framåt')}</div>${control('jump','↑','Hoppa')}<div>${control('brake','↓','Broms')}${control('gas','»','Gas')}</div></div><footer class="bike-footer"><span>↑ W gas · ↓ S broms/backa · ← → A D balans · Mellanslag hopp · R kontrollpunkt · P paus</span>${action('retry','↻ Kontrollpunkt')}</footer><details class="bike-legacy"><summary>Tidigare rekord · Skog & sten</summary><div id="bikeLegacy"></div></details></section>`;}
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
    if(a==='start'||a==='resume')resume();if(a==='retry')retry();if(a==='restart'){setup();resume();}if(a==='pause'){state==='paused'?resume():pause();}if(a==='next'){level=(level+1)%7;setup();}if(a==='sound'){muted=!muted;save.muted=muted;persist();soundStart();updateSound();}if(a==='garage'){pause();garage();}if(a==='back'){setup();}if(a==='rotate-left')garageYaw-=.4;if(a==='rotate-right')garageYaw+=.4;
  }
  function setup(){clearKeys();ride=newRide(tracks[level]);state='ready';acc=0;clock=0;fx=[];camX=ride.x+5;camY=ride.y+3;zoom=1;buildWorld();rebuildBike();root.querySelectorAll('[data-bike-level]').forEach((b,i)=>b.setAttribute('aria-pressed',i===level));$('#bikeTrackName').textContent=tracks[level].name;modal(tracks[level].name,tracks[level].tag+'. Gasa, balansera och hoppa. Landa säkert för att behålla trickpoängen.',action('start','Kör genom staden →','bike-primary'));hud();resize();}
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
  const materials=new Map(), geometries=new Map();
  function mat(color,metal=0,emissive=0){const key=color+':'+metal+':'+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:metal?.32:.78,metalness:metal,emissive,emissiveIntensity:emissive?.7:0}));return materials.get(key);}
  function geo(key,fn){if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key);}
  function box(parent,w,h,d,x,y,z,color,metal=0){const o=new THREE.Mesh(geo('box',()=>new THREE.BoxGeometry(1,1,1)),mat(color,metal));o.scale.set(w,h,d);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function rod(parent,a,b,r,color){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const o=new THREE.Mesh(geo('rod',()=>new THREE.CylinderGeometry(1,1,1,8)),mat(color,.4));o.scale.set(r,dir.length(),r);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());o.castShadow=true;parent.add(o);return o;}
  function sphere(parent,r,x,y,z,color){const o=new THREE.Mesh(geo('sphere',()=>new THREE.SphereGeometry(1,14,10)),mat(color,.15));o.scale.setScalar(r);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
  function sign(parent,text,x,y,z,color=0x193b4e,w=4){const cn=document.createElement('canvas');cn.width=256;cn.height=64;const c=cn.getContext('2d');c.fillStyle='#'+color.toString(16).padStart(6,'0');c.fillRect(0,0,256,64);c.fillStyle='#f7f7e9';c.font='bold 26px system-ui';c.textAlign='center';c.fillText(text,128,42);const tex=new THREE.CanvasTexture(cn),m=new THREE.MeshBasicMaterial({map:tex}),o=new THREE.Mesh(new THREE.PlaneGeometry(w,1),m);o.position.set(x,y,z);o.userData.owned=true;parent.add(o);return o;}
  function initRenderer(){if(!window.THREE)return;try{if(ctx){const old=canvas;canvas=old.cloneNode();old.replaceWith(canvas);ctx=null;observer?.disconnect();observer?.observe(canvas);}renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=window.innerWidth>650;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(39,1,.1,350);scene.add(new THREE.HemisphereLight(0xe9f5ff,0x6c5b58,2.1));lights=new THREE.DirectionalLight(0xffedd3,3.2);lights.position.set(-10,35,18);lights.castShadow=true;lights.shadow.mapSize.set(1024,1024);Object.assign(lights.shadow.camera,{left:-30,right:30,top:25,bottom:-25,near:1,far:100});lights.shadow.bias=-.001;scene.add(lights,lights.target);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();renderer?.dispose();renderer=null;scene=null;initFallback();resize();toast('WebGL tappades · enkel grafik är aktiverad');},{signal:abort.signal});$('#bikeRenderer').textContent='3D · FAST SIDOVY';if(ride){buildWorld();rebuildBike();}resize();}catch{renderer=null;initFallback();}}
  function initFallback(){if(ctx)return;const old=canvas;canvas=old.cloneNode();old.replaceWith(canvas);ctx=canvas.getContext('2d');observer?.disconnect();observer?.observe(canvas);$('#bikeRenderer').textContent='ENKEL GRAFIK · WEBGL SAKNAS';}
  function disposeGroup(group){if(!group)return;group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.owned){o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();}});scene?.remove(group);}
  function buildWorld(){if(!scene)return;disposeGroup(world);world=new THREE.Group();scene.add(world);traffic=[];const t=tracks[level],night=level===4;scene.background=new THREE.Color(t.sky);scene.fog=new THREE.Fog(t.sky,60,190);lights.intensity=night?.8:3.2;
    const p=t.points;
    for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b[0]-a[0],dy=b[1]-a[1];if(dx<.2)continue;const road=box(world,Math.hypot(dx,dy),.32,4,(a[0]+b[0])/2,(a[1]+b[1])/2-.16,0,0x354756);road.rotation.z=Math.atan2(dy,dx);const edge=box(world,Math.hypot(dx,dy),.12,.16,(a[0]+b[0])/2,(a[1]+b[1])/2+.03,2.06,t.accent);edge.rotation.z=road.rotation.z;for(let x=a[0]+1;x<b[0]-1;x+=4){const y=surface(t,x).y;const line=box(world,1.2,.015,.12,x,y+.015,.5,0xebe7ca);line.rotation.z=road.rotation.z;}if(i%2===0)box(world,.6,Math.max(1,(a[1]+b[1])/2+5),3.6,(a[0]+b[0])/2,((a[1]+b[1])/2-5)/2,0,0x71828c);}
    // Three depth layers give perspective parallax without rotating the gameplay camera.
    for(let layer=0;layer<3;layer++)for(let x=-65;x<t.length+100;x+=layer===0?17:11){const seed=Math.abs(Math.sin(x*12.989+layer*78.2)),h=5+seed*(layer===2?12:30),w=6+seed*7,z=-65+layer*23;const col=layer===0?0x7e9eac:layer===1?0x678491:0x466475;const y=-5+h/2;box(world,w,h,7,x,y,z,col,layer===2?.25:0);box(world,w+.3,.3,7.3,x,y+h/2,z,0xc0cbd0);if(seed>.55)rod(world,[x,y+h/2,z],[x,y+h/2+4,z],.07,0xd4dce0);
      // Window strips: one mesh per row instead of a mesh per window.
      for(let yy=-2;yy<h-5;yy+=2.3){const win=box(world,w-.7,.85,.06,x,yy,z+3.54,night?0xffcd87:0x9ec8d8,.5);if(night)win.material=mat(0xffd49a,0,0xd78d48);}
      if(layer===2){for(let mx=-w/2+1;mx<w/2;mx+=1.8)box(world,.11,h,.09,x+mx,y,z+3.6,0x526b78);box(world,w,.85,.6,x,-3.8,z+4,0xe7c6a5);if(Math.floor(x)%3===0)sign(world,['CAFÉ','CYKELVERKSTAD','STADENS TAK','BAGERI'][Math.abs(Math.floor(x))%4],x,-3.1,z+4.35,0x294e5b,w-.4);}
    }
    box(world,t.length+150,.5,10,t.length/2,-5.5,-8,0x73858a);for(let x=-10;x<t.length+25;x+=20){const y=t.base;rod(world,[x,y,-3],[x,y+6,-3],.09,0x3b5360);rod(world,[x,y+6,-3],[x+1.2,y+6,-3],.08,0x3b5360);const lamp=box(world,.9,.15,.4,x+1,y+5.95,-3,0xfff0b0);lamp.material=mat(0xffe5ac,0,0xffd699);if(Math.round(x/20)%3===0){rod(world,[x+3,y,-3],[x+3,y+3,-3],.1,0x41545c);box(world,.4,1,.35,x+3,y+3,-3,0x1c2a35);sphere(world,.11,x+3,y+3.25,-2.8,0xff5855);sphere(world,.11,x+3,y+2.8,-2.8,0x6affb2);}}
    for(const [j,jump] of t.jumps.entries()){
      const x=jump.x-2,y=t.base;
      if(level===1||level===6&&j%3===1){crane(x+4,y-3,-10);vehicle(x,y-2,-6,0xffb53e,'truck');for(let k=0;k<3;k++)box(world,3,1.4,2,x+k*3,y-3,-4,0xa9b3b7);}
      else if(level===3){for(let k=0;k<3;k++){box(world,6,2.3,3,x+k*4,y-3+k%2*2.3,-6,[0xc85f4c,0x3e8892,0xccab5c][k]);for(let q=0;q<8;q++)box(world,.07,2.1,.05,x+k*4-2.7+q*.75,y-3+k%2*2.3,-4.47,0xe6c79d);}box(world,14,1,5,x+12,-7,-16,0x324d65);box(world,5,2.5,3,x+14,-5.5,-16,0xeeeecc);}
      else vehicle(x,y-1.5,-5,j%2?0xe1b96b:0x55a8b8,j%3===0?'bus':'car');
      if(level===2)box(world,14,14,8,x,2,-4,0x526976);
      sign(world,'↗ '+(j+1).toString().padStart(2,'0'),x-6,surface(t,x-6).y+2,-2.3,0x204653,2.5);
      if(j%2===0){sphere(world,1.5,x+10,y+1,-9,0x5a8f79);rod(world,[x+10,y-4,-9],[x+10,y+1,-9],.25,0x726854);}
    }
    if(level===3){const water=box(world,t.length+100,.1,35,t.length/2,-6,-3,0x287f9e,.7);water.material.roughness=.15;}
    for(let i=0;i<7;i++){const car=vehicle(i*39,t.base-4,-11,i%2?0xecb472:0x8dc9c9,'car');traffic.push({mesh:car,speed:3+i*.4,start:i*39});}
    for(const cp of t.checkpoints.slice(1)){rod(world,[cp,t.base, -1.7],[cp,t.base+4,-1.7],.07,0xf2eee0);box(world,1.3,.8,.07,cp+.65,t.base+3.6,-1.7,0x62dfc3);}
    for(let cx=14;cx<t.length;cx+=95)for(let stripe=0;stripe<6;stripe++)box(world,.45,.02,3,cx+stripe*.8,surface(t,cx+stripe*.8).y+.025,0,0xd2ddd9); if(level===0||level===6){const tx=t.length*.36;box(world,10,.6,7,tx,t.base+8,-7,0x778c98);for(const side of [-5,5])box(world,.8,8,7,tx+side,t.base+4,-7,0x657c89);} if(night){for(let nx=20;nx<t.length;nx+=55){const ns=sign(world,'STADENS TAK',nx,8,-6,0x652f70,7);ns.material.color.set(0xf6a9ed);}} const end=t.length;for(const side of [-2,2])box(world,.5,6,.5,end,t.base+3,side,0xf0e5c8);box(world,.5,.8,4.5,end,t.base+6,0,t.accent);sign(world,'MÅL',end,t.base+6.1,2.35,0x173e50,3);for(let i=0;i<12;i++)box(world,.5,.025,.33,end+(i%2)*.5,t.base+.025,-1.8+Math.floor(i/2)*.66,i%2?0xeeeeea:0x182d3b);
    batchStatic();
  }
  function batchStatic(){const batches=new Map();for(const o of [...world.children]){if(!o.isMesh||o.userData.owned)continue;const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}for(const list of batches.values()){if(list.length<3)continue;const m=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();m.setMatrixAt(i,o.matrix);world.remove(o);});m.castShadow=true;m.receiveShadow=true;m.computeBoundingSphere?.();world.add(m);}}
  function crane(x,y,z){box(world,.7,23,.7,x,y+11.5,z,0xeab557);for(let h=0;h<23;h+=2)rod(world,[x-.35,y+h,z+.4],[x+.35,y+h+2,z+.4],.05,0x4e6470);box(world,17,.5,.7,x+4,y+23,z,0xeab557);rod(world,[x,y+27,z],[x+12,y+23,z],.06,0x73838c);rod(world,[x+9,y+23,z],[x+9,y+15,z],.04,0x73838c);box(world,2,1.5,1.5,x+1,y+23.5,z,0x324957);}
  function vehicle(x,y,z,color,type){const g=new THREE.Group();world.add(g);g.position.set(x,y,z);const len=type==='bus'?7:type==='truck'?6:3.5;box(g,len,1.25,1.6,0,.7,0,color,.25);box(g,type==='car'?2:len*.8,1,1.45,-.2,1.7,0,0x91b9cd,.45);box(g,len+.1,.2,1.7,0,.2,0,0x263b4a);for(const wx of [-len*.32,len*.32])for(const wz of [-.85,.85]){const wheel=new THREE.Mesh(geo('carwheel',()=>new THREE.CylinderGeometry(.43,.43,.18,12)),mat(0x1c2b35));wheel.rotation.x=Math.PI/2;wheel.position.set(wx,.3,wz);g.add(wheel);}return g;}
  function rebuildBike(){if(!scene)return;disposeGroup(bike);bike=new THREE.Group();scene.add(bike);const color=bikes[save.selected][1];bike.userData.wheels=[];bike.userData.forks=[];
    for(const dx of [-1.05,1.05]){const w=new THREE.Group();w.position.set(dx,-.45,0);bike.add(w);const tire=new THREE.Mesh(geo('tire',()=>new THREE.TorusGeometry(.34,.105,10,24)),mat(0x17232d));w.add(tire);const rim=new THREE.Mesh(geo('rim',()=>new THREE.TorusGeometry(.275,.028,6,24)),mat(0xd7e1e3,.8));w.add(rim);for(let i=0;i<12;i++){const a=i*TAU/12;rod(w,[0,0,.04],[Math.cos(a)*.28,Math.sin(a)*.28,.04],.012,0xb9cbd3);}sphere(w,.08,0,0,.1,0x829aa5);const disc=new THREE.Mesh(geo('disc',()=>new THREE.CylinderGeometry(.16,.16,.035,18)),mat(0xa6b6bd,.8));disc.rotation.x=Math.PI/2;disc.position.z=.12;w.add(disc);for(let i=0;i<16;i++){const a=i*TAU/16;const tread=box(w,.11,.05,.18,Math.cos(a)*.43,Math.sin(a)*.43,0,0x1e2931);tread.rotation.z=a-Math.PI/2;}bike.userData.wheels.push(w);}
    for(const z of [-.19,.19]){rod(bike,[-1.05,-.45,z],[-.4,.45,z],.045,color);rod(bike,[-.4,.45,z],[.48,.4,z],.05,color);rod(bike,[.48,.4,z],[-.1,-.35,z],.045,color);rod(bike,[-.1,-.35,z],[-1.05,-.45,z],.045,color);rod(bike,[-.4,.45,z],[-.1,-.35,z],.045,color);const fork=rod(bike,[.65,.65,z],[1.05,-.45,z],.055,0xd3dcdd);bike.userData.forks.push(fork);}
    rod(bike,[-.75,-.3,.22],[-.25,.35,.22],.075,0xffce64);for(let i=0;i<7;i++){const ring=new THREE.Mesh(geo('spring',()=>new THREE.TorusGeometry(.085,.018,5,10)),mat(0xf5db8a,.65));ring.position.set(-.7+i*.06,-.23+i*.075,.24);ring.rotation.z=-.6;ring.rotation.x=Math.PI/2;bike.add(ring);}
    box(bike,.48,.46,.5,-.05,-.05,0,0x687d88,.65);for(let i=0;i<5;i++)box(bike,.51,.035,.53,-.05,-.23+i*.085,0,0xb6c3ca,.6);
    const tank=box(bike,.7,.36,.42,.08,.42,0,color,.35);tank.rotation.z=-.15;box(bike,.85,.13,.43,-.5,.58,0,0x243441);const back=box(bike,.75,.09,.42,-.98,.43,0,color,.2);back.rotation.z=.15;const front=box(bike,.8,.09,.45,1.03,.3,0,color,.2);front.rotation.z=-.1;
    rod(bike,[.52,.6,0],[.6,.95,0],.045,0xb9c8d0);rod(bike,[.6,.95,-.38],[.6,.95,.38],.045,0x263a46);rod(bike,[-.12,-.25,-.3],[-.75,.25,-.3],.07,0xb1b8bf);rod(bike,[-.75,.25,-.3],[-1.2,.3,-.3],.11,0xc6c9cb);
    rod(bike,[-1.05,-.44,.25],[-.05,-.3,.25],.018,0x53636b);rod(bike,[-1.05,-.55,.25],[-.05,-.4,.25],.018,0x53636b);
    const rider=new THREE.Group();bike.add(rider);bike.userData.rider=rider;box(rider,.38,.58,.4,-.28,1.03,0,0x2a5269);box(rider,.3,.18,.43,-.29,.76,0,0x18384c);sphere(rider,.29,-.12,1.56,0,color);const visor=box(rider,.27,.13,.48,.05,1.6,.01,0x173a53,.6);visor.rotation.z=-.1;box(rider,.35,.07,.48,.08,1.77,0,color);for(const z of [-.25,.25]){rod(rider,[-.4,.75,z],[-.1,.35,z],.09,0x284961);rod(rider,[-.1,.35,z],[.16,-.18,z],.075,0x354553);box(rider,.3,.15,.19,.22,-.23,z,0x152d3c);rod(rider,[-.2,1.24,z],[.12,.92,z],.07,0xf5b67a);rod(rider,[.12,.92,z],[.6,.94,z],.065,0x2a5269);sphere(rider,.075,.6,.94,z,0x213742);}
  }
  function particles(color,n){if(!scene)return;for(let i=0;i<n&&fx.length<70;i++){const o=new THREE.Mesh(geo('particle',()=>new THREE.SphereGeometry(.06,5,4)),mat(color));o.position.set(ride.x-1,ride.y-.6,.5);scene.add(o);fx.push({o,vx:(Math.random()-.8)*4,vy:Math.random()*4,life:.5+Math.random()*.5});}}
  function resize(){if(!canvas||!root)return;const r=canvas.getBoundingClientRect();if(r.width<=0||r.height<=0)return;if(renderer){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}else if(ctx){canvas.width=r.width*Math.min(devicePixelRatio||1,2);canvas.height=r.height*Math.min(devicePixelRatio||1,2);}}
  function render(dt){if(!ride)return;const t=tracks[level];if(renderer&&bike){const garageMode=state==='garage';world.visible=!garageMode;root.dataset.mode=state;scene.background.set(garageMode?0x243b4c:t.sky);bike.position.set(ride.x,ride.y,0);bike.rotation.set(0,garageMode?garageYaw:0,(garageMode?0:ride.a)+(state==='crashed'?Math.min(1,clock-ride.crashClock)*.65:0));bike.userData.wheels.forEach((w,i)=>{w.position.y=-.45+ride.compression[i];w.rotation.z=-ride.x/.43;});bike.userData.forks.forEach((f,i)=>{const a=new THREE.Vector3(.65,.65,i? .19:-.19),b=new THREE.Vector3(1.05,-.45+ride.compression[1],i? .19:-.19),d=b.clone().sub(a);f.position.copy(a.add(b).multiplyScalar(.5));f.scale.y=d.length();f.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());});bike.userData.rider.rotation.z=clamp(-ride.av*.04+(keys.gas?-.07:keys.brake?.1:0),-.18,.18);bike.userData.rider.position.y=-Math.max(...ride.compression)*.35;if(state==='crashed'){const tumble=Math.min(1,(clock-ride.crashClock)*2);bike.userData.rider.position.x=tumble*.6;bike.userData.rider.position.y+=Math.sin(tumble*Math.PI)*.5;bike.userData.rider.rotation.z=-tumble*.8;}else bike.userData.rider.position.x=0;
      const desiredX=ride.x+5+clamp(ride.vx*.15,0,3),desiredY=ride.y+2.5;
      camX+=(desiredX-camX)*(1-Math.exp(-dt*4));camY+=(desiredY-camY)*(1-Math.exp(-dt*4));zoom+=((ride.air>.55?1.18:1)-zoom)*(1-Math.exp(-dt*2));
      const distance=Math.max(23,26/camera.aspect)*zoom;camera.position.set(garageMode?(camera.aspect<1?ride.x:ride.x-1.8):camX,garageMode?(camera.aspect<1?ride.y-4:ride.y+1.2):camY,garageMode?(camera.aspect<1?15:10):distance);camera.lookAt(camera.position.x,camera.position.y,0); // Always +Z: never follows behind the motorcycle.
      lights.position.set(ride.x-10,35+t.base,18);lights.target.position.set(ride.x,t.base,0);for(const car of traffic)car.mesh.position.x=(car.start+clock*car.speed)%(t.length+80)-30;
      for(const p of fx){p.life-=dt;p.o.position.x+=p.vx*dt;p.o.position.y+=p.vy*dt;p.vy-=6*dt;p.o.scale.setScalar(Math.max(0,p.life));}fx=fx.filter(p=>{if(p.life<=0){scene.remove(p.o);return false;}return true;});renderer.render(scene,camera);
    }else if(ctx)renderFallback();}
  function renderFallback(){const w=canvas.width,h=canvas.height,c=ctx,t=tracks[level],scale=Math.min(w/28,h/18),cx=ride.x-8,cy=ride.y+7;const X=x=>(x-cx)*scale,Y=y=>(cy-y)*scale;const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#'+t.sky.toString(16).padStart(6,'0'));gradient.addColorStop(1,level===4?'#273f5d':'#f0e4d1');c.fillStyle=gradient;c.fillRect(0,0,w,h);for(let i=-2;i<14;i++){const x=i*90-(ride.x*8%90);c.fillStyle=i%2?'#6e8a9a':'#8ba4b0';const bh=80+Math.abs(Math.sin(i*8))*150;c.fillRect(x,h*.65-bh,70,bh);c.fillStyle='#d3e1dd';for(let j=0;j<4;j++)c.fillRect(x+8,h*.65-bh+15+j*25,50,8);}c.fillStyle='#344957';c.beginPath();c.moveTo(0,h);for(let x=cx;x<cx+w/scale+.4;x+=.25)c.lineTo(X(x),Y(surface(t,x).y));c.lineTo(w,h);c.fill();c.strokeStyle='#ffd590';c.lineWidth=3;c.stroke();c.save();c.translate(X(ride.x),Y(ride.y));c.rotate(-ride.a);c.scale(scale,scale);for(let i=0;i<2;i++){const x=i?1.05:-1.05,y=.45-ride.compression[i];c.fillStyle='#182c3c';c.beginPath();c.arc(x,y,.43,0,TAU);c.fill();c.strokeStyle='#d5e0dc';c.lineWidth=.05;c.stroke();}c.strokeStyle='#'+bikes[save.selected][1].toString(16);c.lineWidth=.12;c.beginPath();c.moveTo(-1.05,.45);c.lineTo(-.4,-.4);c.lineTo(.6,-.4);c.lineTo(1.05,.45);c.lineTo(-.1,.35);c.closePath();c.stroke();c.strokeStyle='#294c61';c.lineWidth=.25;c.beginPath();c.moveTo(.1,.1);c.lineTo(-.4,-.7);c.lineTo(-.1,-1.3);c.lineTo(.6,-.9);c.stroke();c.fillStyle='#ffb677';c.beginPath();c.arc(-.1,-1.55,.28,0,TAU);c.fill();c.restore();}
  function loop(now){if(!root?.isConnected){destroy();return;}const dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;clock+=dt;if(state==='playing'){acc+=dt;while(acc>=1/120&&state==='playing'){step(ride,tracks[level],keys,1/120);processEvents();acc-=1/120;}if(keys.gas&&ride.contact[0]&&Math.random()<.2)particles(0xc6c6b5,1);}engine();hud();render(dt);raf=requestAnimationFrame(loop);}
  function destroy(){cancelAnimationFrame(raf);clearTimeout(loading);observer?.disconnect();abort?.abort();if(audio){audio.ac.close().catch(()=>{});audio=null;}disposeGroup(world);disposeGroup(bike);for(const p of fx)scene?.remove(p.o);fx=[];materials.forEach(m=>m.dispose());materials.clear();geometries.forEach(g=>g.dispose());geometries.clear();renderer?.dispose();renderer=null;scene=null;ctx=null;world=null;bike=null;root=null;canvas=null;keys={};keyboard={};pointers.clear();state='ready';}
  window.FPStuntBike={gallery,start,destroy};
})();
