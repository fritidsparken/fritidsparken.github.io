/* Flygpilot: deterministic world-space flight. No network or server required. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const stages=[
    {name:'Gröna dalen',length:1200,sky:'#9ed9ed',fog:'#c4e5db',grass:'#79ae62',sun:'#fff2d2',mountain:24,wind:6},
    {name:'Bergsäventyret',length:1500,sky:'#a9cde4',fog:'#b9d0d3',grass:'#719578',sun:'#fff2db',mountain:85,wind:10},
    {name:'Kustflygningen',length:1400,sky:'#8bd5ee',fog:'#bce5e6',grass:'#9aba6a',sun:'#fff1cf',mountain:35,wind:10,coast:true},
    {name:'Solnedgången',length:1600,sky:'#edb38e',fog:'#e9c2a3',grass:'#9ba569',sun:'#ffb66f',mountain:45,wind:14},
    {name:'Molnäventyret',length:1800,sky:'#91b9db',fog:'#c9d9e5',grass:'#72948b',sun:'#ffe8c6',mountain:110,wind:17}
  ];
  function terrain(x,d,stage=0){
    const c=stages[stage],edge=clamp((Math.abs(x)-24)/130,0,1),envelope=clamp((d-160)/140,0,1)*clamp((c.length-180-d)/170,0,1);
    const hills=5+8*Math.sin(d*.011+x*.009)**2+c.mountain*edge*(.35+.65*Math.sin(d*.006+x*.012)**2);
    let h=hills*envelope;
    if(c.coast)h-=clamp((Math.abs(x)-90)/110,0,1)*14;
    // Airports are level, including shoulders. A smooth valley remains navigable.
    return h;
  }
  function makeWorld(stage){
    const c=stages[stage],winds=[],coins=[];
    for(let i=0;i<c.wind;i++){
      const d=260+i*(c.length-560)/c.wind,x=Math.sin(i*2.31+stage)*48;
      winds.push({x,d,y:terrain(x,d,stage),height:24+(i%3)*6,radius:12,angle:i*1.73,speed:.65+(i%3)*.12});
    }
    for(let i=0;i<54;i++){
      const d=175+i*(c.length-390)/54,x=Math.sin(i*.24+stage)*32;
      let y=terrain(x,d,stage)+19+14*(.5+.5*Math.sin(i*.19));
      // Keep the reward route out of rotor discs, while retaining varied altitudes.
      for(const w of winds)if(Math.abs(d-w.d)<19&&Math.abs(x-w.x)<18)y=Math.max(y,w.y+w.height+w.radius+6);
      coins.push({x,d,y,taken:false});
    }
    return{stage,c,winds,coins};
  }
  function newFlight(stage=0){return{stage,x:0,y:1.05,d:0,vx:0,vy:0,speed:0,roll:0,pitch:0,heading:0,time:0,phase:'takeoff',coins:0,bonus:0,grade:'',timer:0,world:makeWorld(stage),event:null};}
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t,p.z-a.z-dz*t);}
  function planePoints(s){
    // Collision spheres cover fuselage, nose, tail and both wings, rotated with the model.
    return [[0,0,0,.65],[0,0,-1.65,.5],[0,0,1.5,.4],[-1.4,0,0,.45],[-2.8,0,0,.4],[1.4,0,0,.45],[2.8,0,0,.4]].map(([x,y,z,r])=>{
      let xx=x*Math.cos(s.roll)-y*Math.sin(s.roll),yy=x*Math.sin(s.roll)+y*Math.cos(s.roll);
      let zz=z*Math.cos(s.pitch)+yy*Math.sin(s.pitch);yy=yy*Math.cos(s.pitch)-z*Math.sin(s.pitch);
      return{x:s.x+xx*Math.cos(s.heading)+zz*Math.sin(s.heading),y:s.y+yy,z:-s.d-xx*Math.sin(s.heading)+zz*Math.cos(s.heading),r};
    });
  }
  function windHit(s,w){
    for(const p of planePoints(s)){
      if(segmentDistance(p,{x:w.x,y:w.y,z:-w.d},{x:w.x,y:w.y+w.height,z:-w.d})<p.r+.5)return true;
      for(let j=0;j<3;j++){
        const a=w.angle+j*Math.PI*2/3;
        if(segmentDistance(p,{x:w.x,y:w.y+w.height,z:-w.d+.7},{x:w.x-Math.sin(a)*w.radius,y:w.y+w.height+Math.cos(a)*w.radius,z:-w.d+.7})<p.r+.38)return true;
      }
    }return false;
  }
  function crash(s,reason){if(s.phase==='crash'||s.phase==='done')return;s.phase='crash';s.timer=0;s.reason=reason;s.event='crash';}
  function landing(s){
    const on=s.d>=s.world.c.length&&s.d<s.world.c.length+230&&Math.abs(s.x)<8.5;
    if(!on)return false;
    if(s.vy< -5.5||Math.abs(s.roll)>.23||Math.abs(s.heading)>.2){crash(s,'Lite mjukare nästa gång! Släpp nedåtpilen strax före marken.');return true;}
    const quality=Math.abs(s.x)<2.5&&s.vy> -2.1&&Math.abs(s.roll)<.09?15:Math.abs(s.x)<5&&s.vy> -3.6?10:5;
    s.bonus=quality;s.grade=quality===15?'Perfekt landning':quality===10?'Bra landning':'Godkänd landning';s.phase='rollout';s.y=1.05;s.vy=0;s.timer=0;s.event='landing';return true;
  }
  function step(s,input,dt){
    s.event=null;s.time+=dt;
    for(const w of s.world.winds)w.angle+=dt*w.speed;
    if(s.phase==='crash'){s.timer+=dt;s.roll+=dt*.4;return;}
    if(s.phase==='done')return;
    if(s.phase==='rollout'){
      s.timer+=dt;s.speed=Math.max(0,s.speed-7*dt);s.d+=s.speed*dt;s.y=1.05+Math.sin(s.timer*12)*.09*Math.exp(-s.timer*3);s.roll*=Math.exp(-dt*5);s.pitch*=Math.exp(-dt*5);s.heading*=Math.exp(-dt*5);
      if(s.speed===0){s.phase='done';s.event='complete';}return;
    }
    const cruise=s.d>s.world.c.length-450?25:32+s.stage*1.5;
    s.speed+=(cruise-s.speed)*Math.min(1,dt*.8);
    const turn=(input.right?1:0)-(input.left?1:0),lift=(input.up?1:0)-(input.down?1:0);
    s.vx+=(turn*17-s.vx)*(1-Math.exp(-dt*3));
    s.vy+=(lift*(lift>0?10:7)-s.vy)*(1-Math.exp(-dt*3.5));
    s.roll+=(-turn*.38-s.roll)*(1-Math.exp(-dt*4));
    s.heading=-Math.atan2(s.vx,s.speed||1);s.pitch+=(Math.atan2(s.vy,s.speed||1)-s.pitch)*(1-Math.exp(-dt*4));
    s.x=clamp(s.x+s.vx*dt,-190,190);s.d+=s.speed*dt;
    if(s.phase==='takeoff'){
      // Player initiates liftoff. Staying on the runway eventually reaches its end.
      if(s.speed>17&&lift>0){s.phase='flight';s.y+=Math.max(0,s.vy)*dt;}else{s.y=1.05;s.vy=0;s.pitch=0;if(Math.abs(s.x)>8.5||s.d>145)crash(s,'Håll uppåtpilen för att lyfta innan startbanan tar slut.');}
    }else s.y+=s.vy*dt;
    if(s.y>165){s.y=165;s.vy=Math.min(0,s.vy);}
    if(s.phase==='crash')return;
    if(s.phase==='flight'){
      if(s.y<=1.05&&landing(s))return;
      for(const p of planePoints(s))if(p.y-p.r<=Math.max(-.1,terrain(p.x,-p.z,s.stage))){crash(s,'Nästan! Håll lite högre över marken och bergen.');return;}
      if(s.y<1.05){crash(s,'Sikta på asfalten och sjunk mjukt när du är över banan.');return;}
      for(const w of s.world.winds)if(Math.abs(s.d-w.d)<4&&windHit(s,w)){crash(s,'Prova en fri väg runt tornet eller mellan rotorbladen.');return;}
    }
    for(const c of s.world.coins)if(!c.taken&&Math.hypot(s.x-c.x,s.y-c.y,s.d-c.d)<3.5){c.taken=true;s.coins++;s.event='coin';s.spark={x:c.x,y:c.y,d:c.d,time:s.time};}
    if(s.d>s.world.c.length+270)crash(s,'Du flög förbi flygplatsen. Börja sjunka tidigare nästa gång!');
  }
  window.FPFlightPhysics={stages,terrain,makeWorld,newFlight,step,windHit,landing,planePoints};
  const KEY='fp-plane-pilot-v2';
  const planes=[{id:'cloud',name:'Albatross',price:0,color:'#f4f5eb',trim:'#ed6652'},{id:'sunrise',name:'Solvinge',price:25,color:'#ffdc78',trim:'#f17d47'},{id:'ocean',name:'Havsörn',price:55,color:'#d6edf1',trim:'#238f9d'}];
  let root,canvas,view,resize,events,raf,data,s,state='menu',last=0,acc=0,keys={},pointers=new Map(),credited=0,preview=0,audio,muted=false,finished=false,baseDistance=0;
  const q=id=>root.querySelector('#'+id);
  function read(){try{const d=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('fp-plane-pilot-v1')||'{}');const unlocked=[...new Set(['cloud',...(Array.isArray(d.unlocked)?d.unlocked:[])])];return{...d,coins:Math.max(0,Number(d.coins)||0),best:Math.max(0,Number(d.best)||0),unlocked,plane:planes.some(p=>p.id===d.plane)&&unlocked.includes(d.plane)?d.plane:'cloud',completed:Array.isArray(d.completed)?d.completed:[],landings:d.landings&&typeof d.landings==='object'?d.landings:{}};}catch{return{coins:0,best:0,unlocked:['cloud'],plane:'cloud',completed:[],landings:{}};}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{q('pilotShopNote').textContent='Webbläsaren kan inte spara just nu. Mynten finns kvar under denna spelstund.';}}
  function gallery(){return `<section class="pilot-page arcade-shell"><header class="arcade-heading"><div><span class="arcade-kicker">FEM VÄRLDAR · ETT FLYGÄVENTYR</span><h2>Flygpilot <em>Molnjakten</em></h2><p>Lyft. Utforska. Hitta hem till nästa flygplats.</p></div><div class="pilot-tools"><button class="arcade-quiet" data-pilot-action="sound" aria-label="Stäng av ljud" aria-pressed="false">♫</button><button class="arcade-quiet" data-pilot-action="pause" aria-label="Pausa spelet">Ⅱ</button></div></header><div class="arcade-field pilot-field"><canvas id="pilotCanvas" tabindex="0" aria-label="Flygpilot. Upp eller W stiger, ned eller S sjunker. Vänster höger eller A D styr. P pausar."></canvas><div class="arcade-hud"><div><span>MYNT</span><strong id="pilotRunCoins" class="arcade-gold">✦ 0</strong></div><div class="arcade-hud-center"><span id="pilotPhase"></span><strong id="pilotGoal"></strong></div><div><span>HÖJD ÖVER MARK</span><strong id="pilotAltitude">0 m</strong></div></div><div class="pilot-course"><i id="pilotProgress"></i></div><div class="pilot-instruments"><span id="pilotDistance">0 m</span><span id="pilotDescent">↑ Håll för att lyfta</span></div><div class="arcade-overlay" id="pilotOverlay"></div><div class="pilot-message" id="pilotMessage" role="status"></div><div id="pilotRendererNote"></div></div><div class="arcade-controls"><div class="arcade-steer">${[['left','←','Vänster'],['right','→','Höger'],['up','↑','Upp'],['down','↓','Ned']].map(([key,icon,label])=>`<button data-flight-control="${key}" aria-label="${label}">${icon}<small>${label}</small></button>`).join('')}</div><span class="arcade-record">REKORD <b id="pilotBest">0 m</b></span></div><p class="pilot-instruction">↑ / W stig · ↓ / S sjunk · ← → / A D sväng · P pausa. Håll två knappar samtidigt för att svänga och stiga.</p><div class="pilot-hangar"><div><span class="arcade-kicker">DIN HANGAR</span><p>Välj flygplan <span class="pilot-wallet">✦ <b id="pilotWallet">0</b></span></p><button class="arcade-quiet" data-pilot-action="hangar">Titta i 3D ↻</button></div><div id="planeOptions" class="pilot-options"></div><p id="pilotShopNote" class="pilot-shop-note" role="status"></p></div></section>`;}
  function sound(){if(audio)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ctx=new A(),gain=ctx.createGain(),motor=ctx.createOscillator(),mg=ctx.createGain();gain.gain.value=muted?0:.14;gain.connect(ctx.destination);motor.type='sawtooth';motor.frequency.value=65;mg.gain.value=0;motor.connect(mg);mg.connect(gain);motor.start();audio={ctx,gain,motor,mg};}catch{}}
  function tone(freq,duration=.18){if(!audio||muted)return;const {ctx,gain}=audio,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.4,ctx.currentTime+duration);g.gain.setValueAtTime(.35,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g);g.connect(gain);o.start();o.stop(ctx.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
  function overlay(title,text,label,action){q('pilotOverlay').hidden=false;q('pilotOverlay').innerHTML=`<div class="arcade-modal"><span class="arcade-kicker">FLYGPILOT · MOLNJAKTEN</span><h3>${title}</h3><p>${text}</p><button class="arcade-primary" data-pilot-action="${action}">${label} →</button></div>`;}
  function hide(){q('pilotOverlay').hidden=true;}
  function shop(){q('pilotWallet').textContent=data.coins;q('pilotBest').textContent=data.best+' m';q('planeOptions').innerHTML=planes.map((p,i)=>`<button data-plane-select="${p.id}" class="pilot-option ${data.plane===p.id?'selected':''}" aria-pressed="${data.plane===p.id}"><span style="color:${p.trim};font-size:28px">✈</span><span>${p.name}<small>${data.unlocked.includes(p.id)?data.plane===p.id?'Valt':'Välj':p.price+' mynt'}</small></span></button>`).join('');}
  function start(){destroy();root=document.querySelector('.pilot-page');if(!root)return;data=read();canvas=q('pilotCanvas');s=newFlight();state='menu';finished=false;credited=0;preview=0;events=new AbortController();const signal=events.signal;
    function engine(){if(view)return;try{view=window.FPFlight3D?.create(canvas);}catch{}if(view){size();q('pilotRendererNote').textContent=view.software?'Förenklad 3D – WebGL saknas':'';}else{q('pilotRendererNote').textContent='3D-motorn kunde inte startas. Ladda om sidan för att försöka igen.';}}
    engine();window.addEventListener('fp-flight-engine-ready',engine,{signal});
    root.addEventListener('click',click,{signal});
    root.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-flight-control]');if(b){e.preventDefault();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,b.dataset.flightControl);b.classList.add('held');}else if(e.target===canvas&&state==='hangar'){canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX});}},{signal});
    root.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(state==='hangar'&&p&&typeof p==='object'){preview+=(e.clientX-p.x)*.015;p.x=e.clientX;}},{signal});
    const release=e=>{pointers.delete(e.pointerId);root.querySelectorAll('[data-flight-control]').forEach(b=>b.classList.toggle('held',[...pointers.values()].includes(b.dataset.flightControl)));};
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>root.addEventListener(type,release,{signal}));
    window.addEventListener('keydown',key,{signal});window.addEventListener('keyup',key,{signal});window.addEventListener('blur',pause,{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();},{signal});
    resize=new ResizeObserver(size);resize.observe(canvas);shop();hud();overlay('Redo för ett äventyr?','Håll ↑ för att lyfta. Samla guldmynt och undvik vindkraftverk. Styr själv ned mot nästa landningsbana.','Börja flyga','start');last=0;acc=0;raf=requestAnimationFrame(loop);
  }
  function size(){if(!canvas||!view)return;const r=canvas.getBoundingClientRect();if(r.width&&r.height)view.resize(r.width,r.height);}
  function clearInput(){keys={};pointers.clear();root?.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
  function key(e){if(!root?.isConnected||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'},k=map[e.key]||map[e.key.toLowerCase()];if(k&&state==='playing'){e.preventDefault();keys[k]=e.type==='keydown';}if(e.type==='keydown'&&!e.repeat&&(e.key==='Escape'||e.key.toLowerCase()==='p')){e.preventDefault();if(state==='paused')resume();else pause();}}
  function pause(){if(state!=='playing')return;state='paused';clearInput();if(audio)audio.mg.gain.value=0;overlay('En liten paus','Flygäventyret väntar på dig.','Fortsätt flyga','resume');}
  function resume(){if(!view)return;state='playing';clearInput();hide();last=0;acc=0;audio?.ctx.resume().catch(()=>{});canvas.focus({preventScroll:true});}
  function begin(stage=0){if(!view){q('pilotRendererNote').textContent='Vänta på 3D-motorn eller ladda om sidan.';return;}sound();audio?.ctx.resume().catch(()=>{});s=newFlight(stage);credited=0;finished=false;state='playing';clearInput();hide();last=0;acc=0;canvas.focus({preventScroll:true});}
  function click(e){const id=e.target.closest('[data-plane-select]')?.dataset.planeSelect;if(id){sound();if(state==='playing'||state==='paused')return;const p=planes.find(p=>p.id===id);preview=0;if(!data.unlocked.includes(id)){if(data.coins<p.price){q('pilotShopNote').textContent=`Du behöver ${p.price-data.coins} mynt till. Förhandsvisning i 3D.`;state='hangar';hide();s.previewPlane=id;return;}data.coins-=p.price;data.unlocked.push(id);tone(880,.35);}data.plane=id;s.previewPlane=id;save();shop();return;}
    const a=e.target.closest('[data-pilot-action]')?.dataset.pilotAction;
    if(a==='start'){baseDistance=0;begin(s?.stage||0);}if(a==='resume')resume();if(a==='pause'){if(state==='paused')resume();else pause();}
    if(a==='next'){baseDistance+=s.d;begin((s.stage+1)%5);}if(a==='sound'){sound();muted=!muted;if(audio)audio.gain.gain.value=muted?0:.14;const b=e.target.closest('button');b.textContent=muted?'♫̸':'♫';b.setAttribute('aria-pressed',String(muted));b.setAttribute('aria-label',muted?'Slå på ljud':'Stäng av ljud');}
    if(a==='hangar'&&state!=='playing'&&state!=='paused'){state='hangar';s.previewPlane=data.plane;hide();q('pilotMessage').textContent='Dra på planet för att rotera · välj flygplan nedanför';q('pilotOverlay').innerHTML='';q('pilotShopNote').innerHTML='<button class="arcade-primary" data-pilot-action="start">Börja flyga →</button>';}
  }
  function hud(){const c=s.world.c,remaining=Math.max(0,c.length-s.d),agl=Math.max(0,s.y-terrain(s.x,s.d,s.stage)-1.05);q('pilotAltitude').textContent=Math.round(agl)+' m';q('pilotDistance').textContent=Math.floor(baseDistance+s.d)+' m';q('pilotRunCoins').textContent='✦ '+s.coins;q('pilotPhase').textContent=(s.stage+1)+' / 5 · '+c.name;q('pilotGoal').textContent=remaining>0?Math.ceil(remaining)+' m till landningsbanan':'Över landningsbanan';q('pilotProgress').style.width=clamp(s.d/c.length*100,0,100)+'%';q('pilotDescent').textContent=s.phase==='takeoff'?'↑ Håll för att lyfta':(s.vy<-.6?'↓ ':'↑ ')+Math.abs(s.vy).toFixed(1)+' m/s';
    if(state==='playing')q('pilotMessage').textContent=s.phase==='takeoff'?'Håll ↑ för att lyfta':s.phase==='rollout'?'Fantastisk landning!':remaining<600?'Dags att landa! Sikta på landningsbanan.':'';
  }
  function account(){const delta=s.coins-credited;if(delta>0){data.coins+=delta;credited=s.coins;save();q('pilotWallet').textContent=data.coins;}data.best=Math.max(data.best,Math.floor(baseDistance+s.d));}
  function finish(){if(finished)return;finished=true;account();state='result';clearInput();if(s.phase==='done'){data.coins+=s.bonus;data.completed=[...new Set([...data.completed,s.stage+1])];data.landings[s.stage+1]=Math.max(Number(data.landings[s.stage+1])||0,s.bonus);overlay('Fantastisk landning!',`${s.grade} · ${s.bonus} bonusmynt<br>${Math.floor(s.d)} m · ${s.coins} insamlade mynt<br>Totalpoäng: ${Math.floor(s.d)+s.coins*10+s.bonus*10}`,s.stage===4?'Flyg de fem etapperna igen':'Nästa etapp','next');tone(660,.6);}else overlay('Vi provar igen!',`${s.reason}<br>Du flög ${Math.floor(s.d)} m och samlade ${s.coins} mynt.`,'Försök igen','start');save();shop();}
  function loop(now){if(!root?.isConnected){destroy();return;}const dt=last?Math.min(.1,(now-last)/1000):1/60;last=now;
    if(state==='playing'){
      acc+=dt;const input={...keys};for(const k of pointers.values())if(typeof k==='string')input[k]=true;
      while(acc>=1/120){step(s,input,1/120);acc-=1/120;if(s.event==='coin'){tone(1100);account();}if(s.event==='crash')tone(140,.3);if(s.event==='landing')tone(560,.4);if(s.phase==='done'||s.phase==='crash'&&s.timer>1.1){finish();break;}}
      if(audio){audio.motor.frequency.setTargetAtTime(65+s.speed+s.vy*2,audio.ctx.currentTime,.1);audio.mg.gain.value=s.phase==='crash'?0:.05;const near=s.world.winds.some(w=>Math.abs(w.d-s.d)<18&&Math.abs(w.x-s.x)<25);if(near&&!s.nearWind)tone(210,.5);s.nearWind=near;}hud();
    }else {if(audio)audio.mg.gain.value=0;if(state==='menu'||state==='hangar')preview+=dt*.22;}
    if(view)view.paint(s,planes.find(p=>p.id===(state==='hangar'?s.previewPlane:data.plane))||planes[0],{preview:state==='menu'||state==='hangar',angle:preview,dt,paused:state==='paused'});
    raf=requestAnimationFrame(loop);
  }
  function destroy(){cancelAnimationFrame(raf);if(data&&s&&root){account();save();}view?.destroy();view=null;resize?.disconnect();events?.abort();audio?.ctx.close().catch(()=>{});audio=null;root=null;canvas=null;keys={};pointers.clear();state='menu';}
  window.FPPlanePilot={gallery,start,destroy};
})();
