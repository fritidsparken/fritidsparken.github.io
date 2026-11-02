/* Stuntcykel — Stadens tak. Fixed 120 Hz physics; right-handed XY riding plane. */
(() => {
  'use strict';
  const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const META=[
    ['Stadskärnan','Lär känna staden',0xafdce8,0xf3bb76,5,2.4],
    ['Byggarbetsplatsen','Ta höjd bland kranarna',0xcbdde1,0xffbd52,6,3.6],
    ['Takracet','Hela staden under hjulen',0xb9d3ed,0xffa992,7,4.5],
    ['Hamnstaden','Flyg över kajerna',0x9bd3df,0x6de1cf,7,4.8],
    ['Nattstaden','Kör i mörkret med strålkastare och gatljus',0x101b38,0xe794ff,8,4.6],
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
  const tracks=META.map((_,i)=>({...makeTrack(i),night:i===4,loops:[],ravines:[]}));
  const EXPANSION=[
    ['Ravinparken',false,0,'En loop och breda språng över flodravinen'],
    ['Kopparbron',false,1,'Dubbla loopar bland koppartorn och broar'],
    ['Klipphoppet',false,2,'Långa hopp mellan klippornas utsiktsplatser'],
    ['Solkustens final',false,3,'Solbelysta stålringar och stora ravinhopp'],
    ['Neonravinen',true,0,'Följ ljusen över den mörka flodravinen'],
    ['Midnattsbron',true,1,'Två lysande loopar över nattstaden'],
    ['Månskenshamnen',true,2,'Hamnljus, höga ramper och öppet vatten'],
    ['Nattens stålverk',true,3,'Industrins glöd längs ravinens kant'],
    ['Stjärnpasset',true,4,'Höga klippor och breda språng i månsken'],
    ['Ljusdalens loopar',true,5,'Fyra ringar genom stadens ljusdal'],
    ['Skymningsklyftan',true,6,'Sväva över djupa klyftor bland höghusen'],
    ['Nattens höjder',true,7,'Tekniska loopar och långa landningar'],
    ['Midnattsfinalen',true,8,'Tre loopar och de största ravinhoppen']
  ];
  // Authored routes: each course has its own ordered terrain rhythm, not a repeated section.
  const ROUTES=[
    {theme:'park',landmark:'arches',plan:[['H',3,22],['H',5,28],['J',5,12],['U',4,28],['L',4.2],['H',7,34],['J',6,15],['U',0,32]]},
    {theme:'copper',landmark:'cables',plan:[['U',6,36],['H',9,25],['L',4.4],['J',5.5,13],['U',1,34],['H',5,20],['L',4.2],['U',8,40],['J',6,16],['U',0,38]]},
    {theme:'cliffs',landmark:'needles',plan:[['U',5,30],['J',6.5,16],['H',10,30],['U',-2,50],['H',3,24],['J',5,13],['U',6,45],['L',4.5],['J',7,18],['U',0,36]]},
    {theme:'coast',landmark:'lighthouse',plan:[['H',4,25],['J',5,14],['U',7,40],['L',4.7],['U',2,32],['H',8,34],['J',6.5,17],['H',5,21],['L',4.2],['U',0,32]]},
    {theme:'neon',landmark:'gates',plan:[['H',5,28],['U',-2,35],['J',6,15],['L',4.2],['U',6,42],['H',10,29],['J',7,18],['U',0,35]]},
    {theme:'bridge',landmark:'cables',plan:[['U',8,48],['L',4.5],['H',12,30],['J',5,13],['U',3,35],['L',4.7],['H',8,27],['J',6,16],['U',0,35]]},
    {theme:'harbor',landmark:'cranes',plan:[['H',2.8,20],['H',4,24],['J',5.5,14],['U',4,28],['H',7,24],['J',6,17],['L',4.4],['U',0,30],['H',5,30]]},
    {theme:'industrial',landmark:'stacks',plan:[['U',3,24],['L',4.2],['H',7,22],['J',5,12],['H',6,25],['U',8,36],['J',6.5,17],['U',2,38],['L',4.5],['U',0,24]]},
    {theme:'mountain',landmark:'needles',plan:[['U',9,52],['H',13,32],['J',6,16],['U',3,40],['H',8,27],['J',6.5,18],['U',-2,38],['L',4.3],['U',0,28]]},
    {theme:'garden',landmark:'arches',plan:[['H',4,24],['L',4.2],['U',5,32],['L',4.6],['J',5.5,14],['U',1,26],['H',6,30],['L',4.4],['J',6,16],['U',0,28]]},
    {theme:'canyon',landmark:'viaduct',plan:[['U',4,28],['J',6,17],['U',-2,42],['H',4,28],['L',4.7],['J',6.5,18],['U',7,48],['J',5.5,15],['H',10,26],['U',0,46]]},
    {theme:'rooftops',landmark:'towers',plan:[['U',7,42],['L',4.4],['U',12,32],['J',5.5,15],['U',5,44],['H',9,25],['J',6.5,18],['U',2,30],['L',4.6],['U',0,25]]},
    {theme:'festival',landmark:'gates',plan:[['H',4,22],['J',5,13],['U',6,38],['L',4.4],['H',10,28],['J',6,16],['U',1,40],['L',4.7],['U',8,45],['J',7,19],['H',12,30],['L',4.2],['U',0,50]]}
  ];
  function expedition(spec,index){
    const [name,night,variant]=spec,route=ROUTES[index],base=0,points=[[-30,0],[15,0]],checkpoints=[5],jumps=[],loops=[],ravines=[];
    let x=15,y=0;
    const flat=n=>{x+=n;points.push([x,y]);};
    const slope=(height,run)=>{x+=run;y=height;points.push([x,y]);};
    for(const [kind,a,b] of route.plan){
      if(kind==='U'){slope(a,b);flat(12);}
      if(kind==='H'){const old=y;slope(a,b);flat(3);slope(old,b*.9);flat(14);}
      if(kind==='L'){flat(8);checkpoints.push(x);flat(55);loops.push({x,y,r:a});flat(16);}
      if(kind==='J'){
        flat(8);checkpoints.push(x);flat(35);const floor=y; slope(y+a,21);const lip=x;
        points.push([lip+.05,base-28],[lip+b-.05,base-28],[lip+b,floor+a*.55]);
        ravines.push({from:lip,to:lip+b,depth:28});jumps.push({x:lip,h:y,gap:b,kind:index%4});x=lip+b;y=floor+a*.55;slope(floor,24);flat(24);
      }
    }
    if(y!==0)slope(0,Math.max(25,Math.abs(y)*7));flat(28);checkpoints.push(x-8);const length=x+25;flat(65);
    return {id:'expedition-v2-'+index,name,night,variant,theme:route.theme,landmark:route.landmark,routeIndex:index,tag:['Böljande parkramper, två raviner och en högre mittsektion','Klättra över kopparbroarna och dyk ner mellan två loopar','Från klippavsats till dalbotten med tre ravinhopp','Kustfyrar, två loopar och långa utförsramper','En låg dal följs av neonportar och en hög avslutning','Stig upp på brospannet, kör två loopar och hoppa ner','Korta kajramper växlar med stora hamnhopp','Ramper i flera våningar mellan skorstenar och stålringar','Lång bergsklättring följd av raviner och en djup utförsbacke','Tre loopar på olika höjder i en upplyst park','Tre klyftor och en dalgång före den sista höjden','Takplattformar på olika höjder med två loopar','Växlande ramper, tre loopar och tre stora finalhopp'][index]+'. Håll gasen i looparna',sky:night?0x101b38:0xaed9eb,accent:[0xffae55,0x74e6df,0xb0a5ff,0xeccf72][index%4],points,checkpoints,jumps,loops,ravines,length,base,medal:length/13+18};
  }
  EXPANSION.forEach((spec,i)=>tracks.push(expedition(spec,i)));
  const inRavine=(t,x)=>(t.ravines||[]).some(g=>x>g.from&&x<g.to);
  function loopStep(b,t,k,dt){
    if(!b.loop){const ring=(t.loops||[]).find(l=>!b.loopsDone.includes(l.x)&&b.x<=l.x&&b.x+Math.max(0,b.vx)*dt>=l.x&&Math.abs(b.y-l.y-.807)<.6&&b.contact.some(Boolean));
      if(!ring)return false;b.loop={ring,theta:0,speed:Math.max(0,b.vx)};b.loopsDone.push(ring.x);b.landing=null;b.pending=0;
    }
    const l=b.loop,r=l.ring.r-.807;
    l.speed+=((k.gas?8:0)-(k.brake?30:0)-l.speed*.06-22*Math.sin(l.theta))*dt;
    const detached=k.jump&&!b.jumpLatch||l.speed<1||l.speed*l.speed/r+22*Math.cos(l.theta)<0;
    b.jumpLatch=!!k.jump;
    if(detached){b.loop=null;b.contact=[false,false];b.air=.01;b.airA=b.a;b.airX=b.x;b.peak=b.y;b.vx=l.speed*Math.cos(l.theta);b.vy=l.speed*Math.sin(l.theta);b.av=l.speed/r;return false;}
    l.theta+=l.speed/r*dt;const a=Math.min(TAU,l.theta);
    b.x=l.ring.x+r*Math.sin(a);b.y=l.ring.y+l.ring.r-r*Math.cos(a);b.a=a;b.vx=l.speed*Math.cos(a);b.vy=l.speed*Math.sin(a);b.av=l.speed/r;b.contact=[true,true];b.compression=[.08,.08];b.air=0;
    if(l.theta>=TAU){b.x=l.ring.x+.2;b.a=0;b.av=0;b.vy=0;b.vx=Math.min(23,l.speed);b.loop=null;b.score+=400;b.tricks++;b.events.push({type:'land',points:400,label:'LOOP!',turns:1,perfect:false});}
    return true;
  }
  function surface(t,x){if(inRavine(t,x))return {y:t.base-28,s:0};const p=t.points;for(let i=1;i<p.length;i++)if(x<=p[i][0]){const a=p[i-1],b=p[i],s=(b[1]-a[1])/(b[0]-a[0]);return {y:a[1]+clamp((x-a[0])/(b[0]-a[0]),0,1)*(b[1]-a[1]),s};}return {y:p.at(-1)[1],s:0};}
  function newRide(t,x=5){return {x,y:surface(t,x).y+.807,vx:0,vy:0,a:0,av:0,contact:[true,true],compression:[0,0],time:0,score:0,checkpoint:5,checkpointScore:0,air:0,airX:x,airA:0,peak:0,wheelie:0,stoppie:0,pending:0,jumpLatch:false,cooldown:0,landLock:0,combo:0,landing:null,perfect:0,tricks:0,doubles:0,failed:false,complete:false,events:[],loop:null,loopsDone:(t.loops||[]).filter(l=>l.x<x).map(l=>l.x)};}
  function step(b,t,k,dt){
    if(b.failed||b.complete)return;
    b.events=[];b.time+=dt;if(loopStep(b,t,k,dt))return;b.cooldown=Math.max(0,b.cooldown-dt);b.landLock=Math.max(0,b.landLock-dt);
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
  const audioModuleURL=new URL('stunt-bike-audio.mjs?v=expedition-20261103-1',document.currentScript.src).href;
  let audioLoading=false,audioGeneration=0;
  const KEY='fp-stunt-bike-city-v2', LEGACY='fp-stunt-bike-v1';
  const bikes=[['Metro',0xff780b,'Alltid tillgänglig'],['Volt',0x49e8c5,'Klara tre banor'],['Precision',0x65b7ff,'Fem perfekta landningar'],['Neon',0xd786ff,'Gör en dubbelvolt'],['Legend',0xffd45b,'Klara sju banor']];
  let root,canvas,renderer,scene,camera,bike,world,lights,shadow,ctx,abort,observer,raf,ride,level=0,state='ready',keys={},pointers=new Map(),keyboard={},save={},legacy={},audio,muted=false,last=0,acc=0,clock=0,toastEnd=0,fx=[],traffic=[],camX=0,camY=0,zoom=1,garageYaw=0,loading=0,previousFocus;
  const $=s=>root?.querySelector(s),action=(a,label,cls='')=>`<button class="${cls}" data-bike-action="${a}">${label}</button>`;
  function gallery(){return `<section class="bike-page arcade-shell"><header class="bike-heading"><div><span class="bike-eyebrow">FRITIDSPARKEN ORIGINAL · 3D TRIALS</span><h2>Stuntcykel <em>Stadens tak</em></h2><p>20 banor · 10 dag & 10 natt · Loopar, raviner och stora hopp.</p></div><div class="bike-tools">${action('quality','Grafik: Auto')}${action('garage','Garage')}${action('sound','Ljud av')}${action('audio-menu','Ljudinställningar')}${action('pause','Ⅱ Paus')}</div></header><section class="bike-sound-panel" id="bikeAudioPanel" hidden aria-label="Ljudinställningar">${audioMenu()}</section><div class="bike-tools" aria-label="Tid på dygnet"><button data-bike-time="day" aria-pressed="false">☀ Dag · 10 banor</button><button data-bike-time="night" aria-pressed="false">☾ Natt · 10 banor</button><button data-bike-time="all" aria-pressed="true">Alla 20</button></div><div class="bike-track-tabs" aria-label="Välj bana">${tracks.map((t,i)=>`<button data-bike-level="${i}" aria-pressed="${i===0}"><b>${String(i+1).padStart(2,'0')} · ${t.night?'NATT':'DAG'}</b>${t.name}</button>`).join('')}</div><div class="bike-field"><canvas id="bikeCanvas" tabindex="0" aria-label="Stuntcykel i sidovy. Piltangenter styr. Mellanslag hoppar. P pausar."></canvas><div class="bike-hud"><div><small>HASTIGHET</small><strong id="bikeSpeed">0 <i>km/h</i></strong></div><div><small id="bikeTrackName"></small><strong id="bikeTime">0.0 s</strong></div><div><small>TRICKPOÄNG</small><strong id="bikeScore">0</strong></div></div><div class="bike-progress"><i id="bikeProgress"></i></div><div class="bike-toast" id="bikeToast" aria-live="polite"></div><div class="bike-bottom"><span id="bikeRecord"></span><span id="bikeRenderer"></span></div><div class="bike-overlay" id="bikeOverlay"></div></div><div class="bike-controls"><div>${control('left','↶','Bakåt')}${control('right','↷','Framåt')}</div>${control('jump','↑','Hoppa')}<div>${control('brake','↓','Broms')}${control('gas','»','Gas')}</div></div><footer class="bike-footer"><span>↑ W gas · ↓ S broms/backa · ← → A D balans · Mellanslag hopp · R kontrollpunkt · P paus</span>${action('retry','↻ Kontrollpunkt')}</footer><details class="bike-legacy"><summary>Tidigare rekord · Skog & sten</summary><div id="bikeLegacy"></div></details></section>`;}
  function control(k,icon,text){return `<button data-bike-control="${k}" aria-label="${text}"><b>${icon}</b><small>${text}</small></button>`;}
  function readSave(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');save=d&&typeof d==='object'&&!Array.isArray(d)?d:{};}catch{save={};}save.records=save.records&&typeof save.records==='object'?save.records:{};save.perfect=Number(save.perfect)||0;save.tricks=Number(save.tricks)||0;save.doubles=Number(save.doubles)||0;save.selected=clamp(Number(save.selected)||0,0,4);try{legacy=JSON.parse(localStorage.getItem(LEGACY)||'{}')||{};}catch{legacy={};}muted=save.muted===true;if(save.audioMixVersion!==2){save.audio={music:.75,motor:.06,effects:.04,musicOn:true};save.audioMixVersion=2;}save.audio={music:.75,motor:.06,effects:.04,musicOn:true,...save.audio};for(const k of ['music','motor','effects'])save.audio[k]=clamp(Number(save.audio[k])||0,0,1);persist();}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch{toast('Rekord kan inte sparas i den här webbläsaren.');}}
  function unlocked(i){const count=Object.values(save.records).filter(r=>r.completed).length;return i===0||(i===1&&count>=3)||(i===2&&save.perfect>=5)||(i===3&&save.doubles>0)||(i===4&&count>=7);}
  function start(){destroy();root=document.querySelector('.bike-page');if(!root)return;previousFocus=document.activeElement;canvas=$('canvas');abort=new AbortController();const signal=abort.signal;readSave();if(!unlocked(save.selected))save.selected=0;
    root.addEventListener('click',click,{signal});root.addEventListener('input',audioInput,{signal});root.addEventListener('pointerdown',pointerDown,{signal});for(const e of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(e,pointerUp,{signal});
    window.addEventListener('keydown',key,{signal});window.addEventListener('keyup',key,{signal});window.addEventListener('blur',()=>pause(),{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal});
    window.addEventListener('fp-flight-engine-ready',()=>{if(root&&!renderer)initRenderer();},{signal});
    $('#bikeAudioPanel').innerHTML=audioMenu();level=0;initRenderer();observer=new ResizeObserver(resize);observer.observe(canvas);setup();$('#bikeLegacy').textContent=['Skogsslingan','Stenbrottet','Bergspasset'].map((n,i)=>n+': '+(Number.isFinite(legacy[i])?legacy[i].toFixed(1)+' s':'—')).join(' · ');updateSound();last=0;raf=requestAnimationFrame(loop);
    if(!window.THREE)loading=setTimeout(()=>{if(root&&!renderer){initFallback();resize();}},2500);
  }
  function mergeKeys(){keys={...keyboard};for(const k of pointers.values())keys[k]=true;root?.querySelectorAll('[data-bike-control]').forEach(b=>b.classList.toggle('pressed',!!keys[b.dataset.bikeControl]));}
  function clearKeys(){keyboard={};pointers.clear();mergeKeys();}
  function pointerDown(e){const el=e.target.closest('[data-bike-control]');if(el&&state==='playing'){e.preventDefault();el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,el.dataset.bikeControl);mergeKeys();soundStart();}}
  function pointerUp(e){pointers.delete(e.pointerId);mergeKeys();}
  function key(e){if(!root?.isConnected||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase(),map={arrowup:'gas',w:'gas',arrowdown:'brake',s:'brake',arrowleft:'left',a:'left',arrowright:'right',d:'right',' ':'jump'};
    if(map[k]&&state==='playing'){e.preventDefault();keyboard[map[k]]=e.type==='keydown';mergeKeys();if(e.type==='keydown'&&!e.repeat)soundStart();}
    if(e.type==='keydown'&&!e.repeat){if(k==='p'||k==='escape'){e.preventDefault();state==='paused'?resume():pause();}if(k==='r'&&['playing','crashed','paused'].includes(state)){e.preventDefault();retry();}}
  }
  function click(e){const time=e.target.closest('[data-bike-time]');if(time){const mode=time.dataset.bikeTime;root.querySelectorAll('[data-bike-time]').forEach(b=>b.setAttribute('aria-pressed',b===time));root.querySelectorAll('[data-bike-level]').forEach(b=>b.hidden=mode!=='all'&&tracks[+b.dataset.bikeLevel].night!==(mode==='night'));if(mode!=='all'&&tracks[level].night!==(mode==='night')){level=tracks.findIndex(t=>t.night===(mode==='night'));setup();}return;}const l=e.target.closest('[data-bike-level]');if(l){level=+l.dataset.bikeLevel;setup();return;}const b=e.target.closest('[data-bike-select]');if(b&&unlocked(+b.dataset.bikeSelect)){save.selected=+b.dataset.bikeSelect;persist();rebuildBike();garage();return;}const a=e.target.closest('[data-bike-action]')?.dataset.bikeAction;
    if(a==='start-music'){muted=false;save.muted=false;save.audio.musicOn=true;if(!save.audio.music)save.audio.music=.75;persist();$('#bikeAudioPanel').innerHTML=audioMenu();soundStart();updateSound();}if(a==='audio-menu'){$('#bikeAudioPanel').hidden=!$('#bikeAudioPanel').hidden;}if(a==='music'){save.audio.musicOn=!save.audio.musicOn;if(save.audio.musicOn){muted=false;save.muted=false;updateSound();}persist();$('#bikeAudioPanel').innerHTML=audioMenu();soundStart();}if(a==='quality'&&renderer){qualityMode=qualityMode==='auto'?'manual':quality===2?'auto':'manual';quality=qualityMode==='auto'?(innerWidth<650?0:1):(quality+1)%3;applyQuality();scene.fog.far=qualityProfiles[quality].far;}if(a==='start'||a==='resume')resume();if(a==='retry')retry();if(a==='restart'){setup();resume();}if(a==='pause'){state==='paused'?resume():pause();}if(a==='next'){const visible=[...root.querySelectorAll('[data-bike-level]')].filter(b=>!b.hidden).map(b=>+b.dataset.bikeLevel);level=visible[(visible.indexOf(level)+1)%visible.length]??0;setup();}if(a==='sound'){muted=!muted;save.muted=muted;persist();soundStart();updateSound();}if(a==='garage'){pause();garage();}if(a==='back'){setup();}if(a==='rotate-left')garageYaw-=.4;if(a==='rotate-right')garageYaw+=.4;
  }
  function setup(){clearKeys();ride=newRide(tracks[level]);state='ready';acc=0;clock=0;for(const p of fx){scene?.remove(p.o);particlePool.push(p.o);}fx=[];camX=ride.x+5;camY=ride.y-.85+Math.tan(39*Math.PI/360)*Math.max(23,26/(camera?.aspect||1))*.44;zoom=1;buildWorld();rebuildBike();root.querySelectorAll('[data-bike-level]').forEach((b,i)=>b.setAttribute('aria-pressed',i===level));$('#bikeTrackName').textContent=tracks[level].name;modal(tracks[level].name,tracks[level].tag+'. Gasa, balansera och hoppa. Landa säkert för att behålla trickpoängen.',action('start','Kör genom staden →','bike-primary'));hud();resize();}
  function resume(){if(!ride||ride.failed||ride.complete)return;state='playing';clearKeys();$('#bikeOverlay').hidden=true;last=0;acc=0;soundStart();canvas.focus({preventScroll:true});}
  function retry(){if(!ride)return;const old=ride;ride=newRide(tracks[level],old.checkpoint);ride.checkpoint=old.checkpoint;ride.score=old.checkpointScore;ride.checkpointScore=old.checkpointScore;ride.time=old.time;ride.perfect=old.perfect;ride.tricks=old.tricks;ride.doubles=old.doubles;camX=ride.x+5;camY=ride.y-.85+Math.tan(39*Math.PI/360)*Math.max(23,26/(camera?.aspect||1))*.44;resume();}
  function pause(){if(state!=='playing')return;state='paused';clearKeys();modal('En liten paus','Ditt nästa hopp väntar.',action('resume','Fortsätt →','bike-primary')+action('retry','Från kontrollpunkten')+action('restart','Starta om banan'));}
  function modal(title,text,buttons){const el=$('#bikeOverlay');el.hidden=false;el.innerHTML=`<section class="bike-modal" role="dialog" aria-label="${title}"><span class="bike-eyebrow">STADENS TAK / ${String(level+1).padStart(2,'0')}</span><h3>${title}</h3><p>${text}</p><div class="bike-modal-buttons">${buttons}</div></section>`;}
  function garage(){state='garage';clearKeys();garageYaw=.15;modal('Ditt garage','Alla cyklar har samma rättvisa köregenskaper. Lås upp nya färger genom dina prestationer.',`<div class="bike-garage-options">${bikes.map((b,i)=>`<button data-bike-select="${i}" ${!unlocked(i)?'disabled':''} aria-pressed="${save.selected===i}"><i style="background:#${b[1].toString(16).padStart(6,'0')}"></i><b>${b[0]}</b><small>${unlocked(i)?save.selected===i?'Vald':'Upplåst':b[2]}</small></button>`).join('')}</div><div>${action('rotate-left','↶ Rotera')}${action('rotate-right','Rotera ↷')}</div>${action('back','Till banan →','bike-primary')}`);}
  function toast(t){$('#bikeToast').textContent=t;toastEnd=clock+2.3;}
  function processEvents(){for(const e of ride.events){if(e.type==='land'||e.type==='balance'){toast(e.label+' +'+e.points);tone(e.perfect?740:420,.14);particles(e.perfect?0xffe9ac:0xc7d4cd,12);}if(e.type==='jump')tone(240,.08);if(e.type==='checkpoint'){toast('KONTROLLPUNKT SPARAD ✓');tone(620,.1);}if(e.type==='crash'){state='crashed';ride.crashClock=clock;clearKeys();particles(0xffc88b,20);tone(100,.25);modal('Oj då! Försök igen!','Borsta av hjälmen och hoppa upp igen. Du fortsätter från din senaste kontrollpunkt.',action('retry','Försök igen →','bike-primary')+action('retry','Från kontrollpunkten')+action('restart','Starta om banan'));}if(e.type==='finish')finish();}}
  function finish(){state='complete';clearKeys();const t=tracks[level],old=save.records[t.id]||{},record=!old.time||ride.time<old.time||ride.score>(old.score||0);save.records[t.id]={time:Math.min(old.time||Infinity,ride.time),score:Math.max(old.score||0,ride.score),completed:true,bestLandings:Math.max(old.bestLandings||0,ride.perfect)};save.perfect+=ride.perfect;save.tricks+=ride.tricks;save.doubles+=ride.doubles;persist();const stars=ride.time<t.medal&&ride.score>=500?'★★★':ride.time<t.medal*1.7?'★★':'★';tone(880,.4);modal(record?'Nytt rekord!':'Snyggt kört!',`${stars} · ${ride.time.toFixed(1)} sekunder · ${ride.score} poäng. ${ride.perfect} perfekta landningar.`,action('next','Nästa stadsdel →','bike-primary')+action('restart','Förbättra ditt rekord')+action('garage','Till garaget'));}
  function hud(){if(!ride)return;$('#bikeSpeed').innerHTML=Math.round((ride.loop?ride.loop.speed:Math.abs(ride.vx))*3.6)+' <i>km/h</i>';$('#bikeTime').textContent=ride.time.toFixed(1)+' s';$('#bikeScore').textContent=ride.score.toLocaleString('sv-SE');$('#bikeProgress').style.width=clamp(ride.x/tracks[level].length*100,0,100)+'%';const r=save.records[tracks[level].id];$('#bikeRecord').textContent=r?`REKORD ${r.time.toFixed(1)} s · ${r.score} p`:'DIN FÖRSTA RUNDA · SÄTT REKORDET';if(clock>toastEnd)$('#bikeToast').textContent='';}
  function audioMenu(){const v=save.audio||{music:.75,motor:.06,effects:.04,musicOn:true};return `<b>Ljudinställningar</b>${[['music','Musik'],['motor','Motor'],['effects','Effekter']].map(([k,name])=>`<label>${name}<input type="range" min="0" max="100" value="${Math.round(v[k]*100)}" data-bike-volume="${k}" aria-label="${name}volym"><output>${Math.round(v[k]*100)}%</output></label>`).join('')}${action('music',v.musicOn?'Musik på':'Musik av')}${action('start-music','▶ Starta musik')}<p class="bike-sound-status" id="bikeAudioStatus" aria-live="polite"></p><details><summary>Musik och ljudkällor</summary><p>Musik: “Raving Energy” — Kevin MacLeod (incompetech.com), CC BY 4.0. Bearbetad loop.</p><p>Motor och metallkontakt: dklon, “Engines – Startup, Idle &amp; Rev”, CC BY-SA 3.0. Bearbetade inspelningar. Motorcykelmodell och cylindervolym är inte verifierade.</p><p>Trafik och vindfoley: Joseph SARDIN / BigSoundBank, CC0. Bearbetade loopar.</p><a href="/assets/stunt-bike/audio/LICENSES.md" target="_blank" rel="noopener">Alla filer, källor och licenser ↗</a></details>`;}
  function audioInput(e){const k=e.target.dataset.bikeVolume;if(!k)return;save.audio[k]=clamp(Number(e.target.value)/100,0,1);e.target.nextElementSibling.textContent=e.target.value+'%';persist();}
  async function soundStart(){
    if(muted)return;if(audio?.errors?.length){audio.dispose();audio.ac.close().catch(()=>{});audio=null;}if(audio){audio.ac.resume().catch(()=>{});return;}if(audioLoading)return;
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    // Resume the context synchronously inside the user gesture, including Safari.
    const ac=new A();ac.resume().catch(()=>{});audioLoading=true;const status=$('#bikeAudioStatus');if(status)status.textContent='Laddar musik…';const generation=audioGeneration;
    try{const {BikeAudio}=await import(audioModuleURL);if(generation!==audioGeneration){ac.close();return;}audio=new BikeAudio(ac);const instance=audio;const errors=await instance.load();if(audio!==instance)return;if(ac.state==='suspended')ac.resume().catch(()=>{});const status=$('#bikeAudioStatus');if(status)status.textContent=errors?.length?'Några ljud kunde inte hämtas. Prova att slå av och på ljudet.':'';}
    catch(error){console.warn('Stuntcykel audio:',error);if(generation===audioGeneration){audio?.dispose();audio=null;const status=$('#bikeAudioStatus');if(status)status.textContent='Ljudet kunde inte laddas. Slå av och på för att försöka igen.';}ac.close().catch(()=>{});}
    finally{if(generation===audioGeneration)audioLoading=false;}
  }
  function updateSound(){const b=$('[data-bike-action="sound"]');if(b){b.textContent=muted?'Ljud av':'Ljud på';b.setAttribute('aria-pressed',!muted);}}
  function tone(f,d){if(muted||!audio||state==='ready')return;if(f<=100||f===420||f===740)audio.impact(f<=100?.9:.35);}
  function engine(dt){audio?.mix(ride,keys,state==='playing',muted,save.audio,dt);
    const el=$('#bikeAudioStatus');if(!el)return;
    const message=muted?'Allt ljud är av. Tryck på Starta musik.':!save.audio.musicOn?'Musiken är av.':audioLoading?'Laddar musik…':audio?.errors?.some(e=>e.includes('raving-energy'))?'Musikfilen kunde inte laddas. Tryck på Starta musik för att försöka igen.':audio&&audio.ac.state!=='running'?'Webbläsaren har pausat ljudet. Tryck på Starta musik.':audio?.musicPlaying&&state==='playing'?'Spelar: Raving Energy — Kevin MacLeod':state==='paused'?'Musiken är pausad.':'Musiken startar när du kör.';
    el.dataset.context=audio?.ac.state||'not-started';el.dataset.musicTime=audio?.musicPlaying?String(Math.max(0,audio.ac.currentTime-audio.musicStart)):'0';if(el.textContent!==message)el.textContent=message;
  }
  // Visual resources are independent of the fixed-step collision/score simulation.
  const materials=new Map(), geometries=new Map(), textures=new Map();
  const qualityProfiles=[
    {name:'LOW',dpr:1,shadow:512,far:125,detail:0,particles:10},
    {name:'MEDIUM',dpr:1.35,shadow:1024,far:180,detail:1,particles:20},
    {name:'HIGH',dpr:1.8,shadow:2048,far:240,detail:2,particles:36}
  ];
  let windTime={value:0},birds=[],quality=1,qualityMode='auto',frameCost=16,qualityTimer=0,qualityWarmup=0,environmentTarget=null,skyDome=null,contactShadow=null,streetLights=[],particlePool=[];
  const seeded=n=>{let s=n>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};};
  function materialMaps(kind){
    if(textures.has(kind))return textures.get(kind);
    const size=512,rand=seeded(81+kind.length*79+kind.charCodeAt(0)),c=document.createElement('canvas');c.width=c.height=size;
    const g=c.getContext('2d'),im=g.createImageData(size,size),heights=new Float32Array(size*size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,n=rand(),wave=Math.sin(x*.071+Math.sin(y*.042)*2)*Math.cos(y*.063),fine=(n-.5);
      let v=.64+fine*.16+wave*.05,h=v;
      if(kind==='asphalt'){v=.36+fine*.17+wave*.025;if(n>.98)v+=.2;h=v;}
      if(kind==='concrete'){v=.72+fine*.06+wave*.07;h=.5+fine*.1;if(x<2||y<2){v-=.2;h-=.25;}}
      if(kind==='brick'){const row=Math.floor(y/32),xx=(x+(row%2)*32)%64,mortar=xx<3||y%32<3;v=mortar?.74:.56+fine*.12+wave*.07;h=mortar?.2:.7+fine*.14;}
      if(kind==='wood'){v=.6+Math.sin(x*.42+Math.sin(y*.03)*1.5)*.09+fine*.045;h=v;if(x%64<2){v=.25;h=.15;}}
      if(kind==='tread'){const xx=x%32,yy=y%32,ridge=Math.abs(xx-yy)<2||Math.abs(xx+yy-32)<2;v=ridge?.78:.44+fine*.08;h=ridge?.85:.25;}
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
  function applyQuality(){if(!renderer)return;const q=qualityProfiles[quality];renderer.setPixelRatio(Math.min(devicePixelRatio||1,q.dpr));renderer.shadowMap.enabled=true;renderer.shadowMap.type=quality===0?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;materials.forEach(m=>{if(m.isMeshStandardMaterial){m.envMapIntensity=quality===0?.25:quality===1?.65:1;m.needsUpdate=true;}});textures.forEach(maps=>Object.values(maps).forEach(tex=>{tex.anisotropy=Math.min(quality===0?1:quality===1?4:8,renderer.capabilities.getMaxAnisotropy());tex.needsUpdate=true;}));lights.shadow.mapSize.set(q.shadow,q.shadow);lights.shadow.map?.dispose();lights.shadow.map=null;camera.far=q.far+100;camera.updateProjectionMatrix();if(skyDome)skyDome.scale.setScalar((camera.far-60)/270);if(world)world.traverse(o=>{if(o.userData.detail!==undefined)o.visible=o.userData.detail<=q.detail;});resize();const b=$('[data-bike-action="quality"]');if(b)b.textContent='Grafik: '+(qualityMode==='auto'?'Auto · ':'')+q.name;$('#bikeRenderer').textContent='3D · '+q.name;}
  function initRenderer(){if(!window.THREE)return;try{
    if(ctx){const old=canvas;canvas=old.cloneNode();old.replaceWith(canvas);ctx=null;observer?.disconnect();observer?.observe(canvas);}
    quality=innerWidth<650?0:(navigator.hardwareConcurrency||4)<8?1:2;qualityMode='auto';qualityWarmup=3;
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(39,1,.3,350);
    const ambient=new THREE.HemisphereLight(0xd8e5f2,0x776b59,1.1);ambient.name='skyLight';scene.add(ambient);
    lights=new THREE.DirectionalLight(0xffe3b7,2.6);lights.position.set(-10,35,18);lights.castShadow=true;Object.assign(lights.shadow.camera,{left:-27,right:27,top:22,bottom:-22,near:1,far:110});lights.shadow.bias=-.00015;lights.shadow.normalBias=.035;lights.shadow.radius=2;scene.add(lights,lights.target);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();renderer?.dispose();renderer=null;scene=null;initFallback();resize();toast('WebGL tappades · enkel grafik är aktiverad');},{signal:abort.signal});
    applyQuality();if(ride){buildWorld();rebuildBike();}resize();
  }catch(error){console.warn('Stuntcykel WebGL:',error);renderer=null;initFallback();}}
  function buildAtmosphere(){
    const night=tracks[level].night,dusk=level===2||level===6;
    const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d'),gradient=g.createLinearGradient(0,0,0,512);
    gradient.addColorStop(0,night?'#071322':dusk?'#6b91b1':'#347cba');gradient.addColorStop(.46,night?'#20354d':dusk?'#c5bbbc':'#9bc6e5');gradient.addColorStop(.61,night?'#182639':dusk?'#efd1ad':'#e3ded0');gradient.addColorStop(1,night?'#17212a':'#8c978a');g.fillStyle=gradient;g.fillRect(0,0,1024,512);
    const rand=seeded(83);for(let i=0;i<90;i++){const x=rand()*1024,y=40+rand()*190,r=12+rand()*45;const cl=g.createRadialGradient(x,y,1,x,y,r);cl.addColorStop(0,night?'rgba(160,180,200,.05)':'rgba(255,250,244,.28)');cl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=cl;g.save();g.translate(x,y);g.scale(2.8,.4);g.translate(-x,-y);g.fillRect(x-r,y-r,2*r,2*r);g.restore();}
    const sun=g.createRadialGradient(730,170,0,730,170,85);sun.addColorStop(0,night?'#d4e5e9':'#fff7df');sun.addColorStop(.06,night?'#c6d4db':'#fff5d7');sun.addColorStop(.1,'rgba(255,233,191,.4)');sun.addColorStop(1,'rgba(255,225,185,0)');g.fillStyle=sun;g.fillRect(645,85,170,170);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.mapping=THREE.EquirectangularReflectionMapping;
    environmentTarget?.dispose();const pmrem=new THREE.PMREMGenerator(renderer);environmentTarget=pmrem.fromEquirectangular(tex);pmrem.dispose();scene.environment=environmentTarget.texture;
    const skyMaterial=new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false});skyDome=new THREE.Mesh(new THREE.SphereGeometry(270,32,16),skyMaterial);skyDome.userData.owned=true;skyDome.renderOrder=-100;world.add(skyDome);
    scene.fog=new THREE.Fog(night?0x101c2c:dusk?0xc3b7ad:0xb7ccd1,48,qualityProfiles[quality].far);scene.background=new THREE.Color(night?0x132434:0xb7ccd1);
    scene.getObjectByName('skyLight').intensity=night?.28:1.1;lights.color.set(night?0xb4cbeb:0xffdfb4);lights.intensity=night?.35:2.6;
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
    disposeGroup(world);world=new THREE.Group();scene.add(world);traffic=[];streetLights=[];birds=[];const t=tracks[level],night=tracks[level].night;
    buildAtmosphere();
    const asphalt=pbr('asphalt',0x999da0),concrete=pbr('concrete',0xc9c4b8),steel=pbr('metal',0x8b9291,.8),darkSteel=pbr('rust',0x776354,.65),wood=pbr('wood',0xac8a59),earth=pbr('gravel',0xa69a82);
    surfaceBox(world,t.length+200,1,110,t.length/2,t.base-6.1,-65,earth,5);
    let bank=-100;for(const g of [...(t.ravines||[]),{from:t.length+100,to:t.length+100}]){surfaceBox(world,g.from-bank,1,30,(bank+g.from)/2,t.base-6.1,5,earth,5);bank=g.to;}
    surfaceBox(world,t.length+180,.25,10,t.length/2,t.base-5.5,-12,asphalt,4);
    surfaceBox(world,t.length+180,.3,2,t.length/2,t.base-5.4,-6,concrete,3);
    const p=t.points;
    for(let i=1;i<p.length;i++){
      const a=p[i-1],b=p[i],dx=b[0]-a[0],dy=b[1]-a[1];if(dx<.2||inRavine(t,(a[0]+b[0])/2))continue;
      const len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),mid=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
      const ramp=Math.abs(dy)>.5;const road=surfaceBox(world,len,.32,4,mid+.16*Math.sin(angle),my-.16*Math.cos(angle),0,ramp?pbr('tread',0xa5a7a3,.72):asphalt,ramp?2.6:3.8);road.rotation.z=angle;
      for(const z of [-2.03,2.03]){const edge=surfaceBox(world,len,.24,.14,mid,my-.16,z,steel,2);edge.rotation.z=angle;}
      // Trusses and deck fasteners are decorative: surface() remains the sole collision surface.
      for(let x=a[0]+1.2;x<b[0]-.5;x+=4){const y=surface(t,x).y;
        const stripe=box(world,1.25,.012,.09,x,y+.015,.6,0xe2d9ba);stripe.rotation.z=angle;stripe.castShadow=false;
        if(ramp){const foot=t.base-5.2,h=Math.max(.3,y-foot-.35);for(const z of [-1.65,1.65])surfaceBox(world,.22,h,.22,x,foot+h/2,z,darkSteel,2);rod(world,[x,foot,1.88],[Math.min(x+3,b[0]),surface(t,Math.min(x+3,b[0])).y-.4,1.88],.055,steel);}
        for(const z of [-1.88,1.88]){const bolt=sphere(world,.038,x,y+.01,z,steel);bolt.scale.y=.018;}
      }
      if(ramp){for(const z of [-2.12,2.12]){const plate=surfaceBox(world,1.8,.38,.035,b[0]-.9,b[1]-.2,z,hazardMaterial(),1.8);plate.rotation.z=angle;}}
      if(!ramp){
        // Open viaduct: only a shallow deck and separated piers, never a solid wall.
        for(const z of [-1.65,1.65]){const beam=surfaceBox(world,len,.38,.22,mid,my-.53,z,steel,3);beam.name='bridge-girder';}
        const foot=t.base-5.55;
        for(let x=Math.ceil((a[0]+1)/14)*14;x<b[0]-1;x+=14){
          const h=Math.max(.2,my-.72-foot);
          for(const z of [-1.25,1.25]){const pier=surfaceBox(world,.62,h,.7,x,foot+h/2,z,concrete,2);pier.name='bridge-pier';surfaceBox(world,1.3,.24,1.35,x,foot+.12,z,concrete,2);}
          surfaceBox(world,.85,.28,3.7,x,my-.72,0,concrete,2);
        }
        // Rear railing gives the deck scale without hiding the motorcycle.
        for(let x=a[0]+.5;x<b[0];x+=2.8)rod(world,[x,my,-2.12],[x,my+.85,-2.12],.024,steel);
        for(const y of [.4,.85])rod(world,[a[0],my+y,-2.12],[b[0],my+y,-2.12],.028,steel);
      }
    }
    for(const ring of t.loops||[]){
      const count=96,step=TAU/count,rr=ring.r+.16;
      for(let j=0;j<count;j++){
        const a=(j+.5)*step,x=ring.x+rr*Math.sin(a),y=ring.y+ring.r-rr*Math.cos(a);
        const deck=surfaceBox(world,2*rr*Math.tan(step/2)+.012,.32,4,x,y,0,pbr('tread',0x92999c,.72),2);deck.rotation.z=a;deck.name='loop-deck';
        for(const z of [-2.04,2.04]){const rail=box(world,2*rr*Math.tan(step/2)+.015,.16,.14,x,y,z,steel);rail.rotation.z=a;}
        if(j%8===0)for(const z of [-2.15,2.15]){const marker=box(world,.36,.08,.08,x,y,z,mat(t.accent,.2,night?t.accent:0));marker.rotation.z=a;}
      }
      for(const z of [-1.7,1.7])for(const side of [-1,1]){
        rod(world,[ring.x+side*ring.r,ring.y-5.5,z],[ring.x+side*ring.r,ring.y+ring.r,z],.12,steel);
        rod(world,[ring.x+side*(ring.r+3),ring.y-5.5,z],[ring.x+side*ring.r,ring.y+ring.r,z],.09,steel);
        surfaceBox(world,2,.4,1.2,ring.x+side*ring.r,ring.y-5.4,z,concrete,2);
      }
      sign(world,'LOOP · HÅLL GASEN',ring.x-10,ring.y+2,-3,t.accent,4);
    }
    for(const gap of t.ravines||[]){
      const rock=pbr('concrete',0x777b79),mid=(gap.from+gap.to)/2;
      for(const side of [-1,1])for(let j=0;j<5;j++){
        const x=side<0?gap.from-3-j*.8:gap.to+3+j*.8;
        const cliff=surfaceBox(world,5,18+j*.7,7,x,t.base-15,0,rock,4);cliff.rotation.z=side*.03*(j%3);
      }
      surfaceBox(world,gap.to-gap.from+4,.12,10,mid,t.base-25,0,pbr('metal',0x397b8a,.45),4);
      for(const x of [gap.from-1,gap.to+1]){const y=surface(t,x).y;sign(world,x<mid?'RAVIN →':'LANDNING',x,y+2.5,-2.6,0xe9b64c,3);}
    }
    // Three dimensional layered city blocks with individual recessed window bays.
    const rand=seeded(191+level*23);
    for(let layer=0;layer<3;layer++)for(let x=-55;x<t.length+65;x+=layer===0?25:19){
      if(t.theme&&['park','cliffs','coast','mountain','garden','canyon'].includes(t.theme)&&(layer===2||Math.floor((x+55)/19)%3!==0))continue;
      const r=rand(),h=layer===0?22+r*34:layer===1?16+r*24:9+r*18,w=10+Math.floor(rand()*4),z=-81+layer*28,base=t.base-4.8;
      const wall=pbr(layer===2&&r>.6?'brick':'concrete',[0xd2c8b7,0xb3bab9,0xbba58d][Math.floor(rand()*3)]);
      surfaceBox(world,w,h,8,x,base+h/2,z,wall,3);
      const cols=Math.floor(w/1.7),bay=(w-.8)/cols;
      for(let yy=base+1.5;yy<base+h-.8;yy+=2.7){
        // Shadowed recess and horizontal projecting stone slabs give real depth.
        box(world,w-.4,2.25,.13,x,yy,z+4.06,mat(0x202d32));
        for(let col=0;col<cols;col++){
          const xx=x-w/2+.4+(col+.5)*bay,lit=rand()>(night?.62:.94);
          const glass=mat(lit?0xb2a58c:[0x72909b,0x879e9e,0x597b8b][Math.floor(rand()*3)],.65,lit?(night?0x9c6f35:0x332817):0);
          glass.roughness=.14;glass.envMapIntensity=1.35;
          box(world,bay-.12,2.02,.045,xx,yy,z+4.17,glass);
          box(world,.09,2.35,.3,xx-bay/2,yy,z+4.29,steel);
          if(layer===2&&rand()>.63){const blind=box(world,bay-.16,.35+rand()*.65,.04,xx,yy+.6,z+4.22,mat(lit?0xcac4af:0x526975));blind.userData.detail=1;}
        }
        surfaceBox(world,w+.15,.24,.55,x,yy-1.25,z+4.25,wall,3);
      }
      for(const xx of [x-w/2,x+w/2])surfaceBox(world,.32,h,.6,xx,base+h/2,z+4.2,wall,3);
      surfaceBox(world,w+.6,.35,8.5,x,base+h,z,concrete,3);
      if(layer===2){
        surfaceBox(world,w+1,.2,3,x,base+.1,z+5.4,concrete,2);
        box(world,1.9,2.6,.15,x-2,base+1.4,z+4.3,mat(0x354a50,.55));
        box(world,.07,2.5,.2,x-2,base+1.4,z+4.4,steel);
        surfaceBox(world,3.8,.16,2.1,x-2,base+3,z+4.9,steel,2);
        if(r>.5){for(let yy=base+5;yy<base+h-2;yy+=5.4){surfaceBox(world,3.4,.16,1.7,x+2,yy,z+4.8,concrete,2);for(const xx of [x+.5,x+3.5])rod(world,[xx,yy,z+5.55],[xx,yy+.95,z+5.55],.025,steel);rod(world,[x+.5,yy+.95,z+5.55],[x+3.5,yy+.95,z+5.55],.035,steel);}}
        for(let j=0;j<2;j++){surfaceBox(world,1.8,.8,1.4,x-2+j*3,base+h+.6,z+1,steel,1);for(let k=0;k<5;k++){const vent=box(world,1.6,.035,.03,x-2+j*3,base+h+.35+k*.12,z+1.72,mat(0x454d4e));vent.userData.detail=1;}}
        rod(world,[x+2,base+h,z],[x+2,base+h+3,z],.04,steel);
        for(let k=0;k<3;k++)rod(world,[x+1.4,base+h+2+k*.25,z],[x+2.6,base+h+2+k*.25,z],.015,steel);
      }
    }
    // Large three-dimensional landmarks distinguish each route from its opening view.
    if(t.theme){
      const stone=pbr('concrete',0x827d70),copper=pbr('metal',0xb88659,.65),trim=mat(t.accent,.3,night?t.accent:0);
      for(let x=22;x<t.length;x+=65+(t.routeIndex%4)*9){
        const y=surface(t,x).y,ground=t.base-5.4;
        if(['needles','viaduct'].includes(t.landmark)){
          for(let k=0;k<5;k++){const h=12+k*3+(t.routeIndex%3)*2;const rock=new THREE.Mesh(geo('rock-'+k,()=>new THREE.ConeGeometry(4+k*.5,h,5+k%3)),stone);rock.position.set(x+k*5,ground+h/2,-15-k*3);rock.rotation.y=k*.8;rock.castShadow=true;world.add(rock);}
        }
        if(['arches','gates','viaduct'].includes(t.landmark)){
          const h=t.landmark==='gates'?12:8;for(const xx of [x-6,x+6])rod(world,[xx,ground,-9],[xx,y+h,-9],.28,t.landmark==='arches'?copper:steel);
          rod(world,[x-6,y+h,-9],[x+6,y+h,-9],.3,steel);
          for(const xx of [x-6,x+6])box(world,.08,h, .1,xx,y+h/2,-8.65,trim);
        }
        if(t.landmark==='cables'){
          for(const xx of [x-9,x+9])surfaceBox(world,.8,20,1.2,xx,ground+10,-7,copper,3);
          rod(world,[x-9,ground+20,-7],[x+9,y+1,-7],.055,steel);rod(world,[x+9,ground+20,-7],[x-9,y+1,-7],.055,steel);
        }
        if(t.landmark==='lighthouse'){
          const tower=new THREE.Mesh(geo('lighthouse',()=>new THREE.CylinderGeometry(1.1,2,17,20)),pbr('concrete',0xe6dfcb));tower.position.set(x,ground+8.5,-14);tower.castShadow=true;world.add(tower);surfaceBox(world,3,.6,3,x,ground+17,-14,trim,2);
        }
        if(t.landmark==='cranes'){crane(x,ground,-19);for(let k=0;k<3;k++)surfaceBox(world,7,2.4,3,x+k*8,ground+1.2,-11,pbr('metal',[0xb06545,0x487b89,0xa99550][k],.4),3);}
        if(t.landmark==='stacks'){for(let k=0;k<3;k++){const chimney=new THREE.Mesh(geo('chimney-'+k,()=>new THREE.CylinderGeometry(.8,1.2,14+k*3,16)),pbr('brick',0x93735f));chimney.position.set(x+k*4,ground+7+k*1.5,-13);world.add(chimney);box(world,2,.2,2,x+k*4,ground+14+k*3,-13,trim);}}
        if(t.landmark==='towers'){for(let k=0;k<3;k++){surfaceBox(world,5,11+k*4,5,x+k*7,ground+5.5+k*2,-12,pbr('concrete',0xb1bdc2),3);rod(world,[x+k*7,ground+11+k*4,-12],[x+k*7,ground+17+k*4,-12],.06,steel);}}
        if(['park','garden'].includes(t.theme)){for(let k=0;k<6;k++)tree(x+k*4,ground,-13-k%2*5,.8+k*.1);}
      }
      if(['coast','harbor','canyon'].includes(t.theme))surfaceBox(world,t.length+80,.1,20,t.length/2,t.base-5.2,-22,pbr('metal',0x407f96,.5),8);
    }
    // Ground-level promenade behind the open bridge.
    surfaceBox(world,t.length+100,.3,6,t.length/2,t.base-5.45,-6,concrete,2);
    for(let x=-14;x<t.length+10;x+=15){
      const rr=seeded(700+Math.round(x)*31+level),yy=t.base-5.3;
      tree(x,yy,-7.8,.95+rr()*.65);
      surfaceBox(world,2,.65,1.3,x,yy+.2,-7.8,pbr('concrete',0xb4ad98),2);
      if(Math.round(x)%2){for(let k=0;k<4;k++)surfaceBox(world,2.5,.085,.12,x+5,yy+.6,-5.9+k*.16,wood,2);
        for(let k=0;k<3;k++)surfaceBox(world,2.5,.12,.08,x+5,yy+.95+k*.17,-6.0,wood,2);
        for(const xx of [x+4,x+6])rod(world,[xx,yy,-5.7],[xx,yy+.6,-5.7],.045,steel);
      }
      surfaceBox(world,4.7,.8,.3,x+7,yy+.3,-8.5,concrete,2);
      if(rr()>.45){const art=sign(world,['RIDE','FLOW','STUNT','CITY'][Math.floor(rr()*4)],x+7,yy+.35,-8.32,[0x556f70,0x7f625a,0x647783][Math.floor(rr()*3)],3);art.scale.y=.55;}
      if(rr()>.65){const cone=new THREE.Mesh(geo('cone',()=>new THREE.ConeGeometry(.18,.65,12)),mat(0xe87523));cone.position.set(x+9,yy+.32,-2.65);world.add(cone);box(world,.5,.08,.5,x+9,yy,-2.65,mat(0x292d2d));}
    }
    if(level===0)crane(45,t.base-4,-32);
    for(let i=0;i<6;i++){const flock=new THREE.Group();flock.userData={origin:i*32-20,height:t.base+24+(i%3)*2,phase:i*1.7};flock.position.set(flock.userData.origin,flock.userData.height,-45);for(const side of [-1,1]){const wing=box(flock,.5,.045,.16,side*.24,0,0,mat(0x53616b));wing.rotation.z=side*.3;}world.add(flock);birds.push(flock);}
    for(let x=-10;x<t.length+20;x+=night?12:24){
      const base=t.base-5.2,y=(inRavine(t,x+1.2)?t.base:surface(t,x+1.2).y)-.86;surfaceBox(world,.6,.2,.6,x,base,-5.2,concrete);rod(world,[x,base,-5.2],[x,y+7,-5.2],.065,steel);rod(world,[x,y+7,-5.2],[x+1.4,y+7,-5.2],.06,steel);
      rounded(world,.9,.12,.4,x+1.2,y+6.95,-5.2,steel,.04);box(world,.7,.025,.3,x+1.2,y+6.86,-5.2,mat(0xffe8bd,0,night?0xffc67a:0));
      if(night){const glow=new THREE.Mesh(geo('lampglow',()=>new THREE.PlaneGeometry(5,8)),glowMaterial());glow.position.set(x+1.2,y+3,-5.1);world.add(glow);}
      if(Math.round(x)%3===0){surfaceBox(world,1.8,.12,.45,x+4,base+.55,-5.4,wood);for(const xx of [x+3.3,x+4.7])rod(world,[xx,base,-5.4],[xx,base+.55,-5.4],.045,steel);}
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
    for(const cp of t.checkpoints.slice(1)){const cy=surface(t,cp).y;rod(world,[cp,cy,-2.4],[cp,cy+3,-2.4],.045,steel);surfaceBox(world,1,.6,.03,cp+.5,cy+2.6,-2.4,pbr('fabric',0x74ac8d),1);}
    const end=t.length;for(const z of [-2.35,2.35]){rod(world,[end,t.base,z],[end,t.base+5,z],.1,steel);}box(world,.2,.22,4.9,end,t.base+5,0,steel);sign(world,'MÅL',end,t.base+5,2.5,0x233d43,2.6);
    for(let i=0;i<12;i++)box(world,.45,.015,.33,end+(i%2)*.45,t.base+.02,-1.8+Math.floor(i/2)*.66,i%2?0xe4e1d7:0x2d3437);
    if(night)for(let i=0;i<6;i++){
      const lamp=new THREE.SpotLight(0xffdfad,340,32,Math.PI/3,.7,2);
      lamp.name='street-light-'+i;lamp.castShadow=false;world.add(lamp,lamp.target);streetLights.push(lamp);
    }
    // Soft local contact occlusion also remains visible on the low shadow preset.
    const shadowMat=glowMaterial(true);contactShadow=new THREE.Mesh(geo('contact',()=>new THREE.PlaneGeometry(4.2,2)),shadowMat);contactShadow.rotation.x=-Math.PI/2;contactShadow.renderOrder=2;world.add(contactShadow);
    batchStatic();applyQuality();
  }
  function glowMaterial(dark=false){const key=dark?'contact-ao':'lamp-haze';if(materials.has(key))return materials.get(key);const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,dark?'rgba(20,23,22,.48)':'rgba(255,215,153,.10)');r.addColorStop(1,dark?'rgba(20,23,22,0)':'rgba(255,215,153,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});materials.set(key,m);return m;}
  function batchStatic(){const batches=new Map();for(const o of [...world.children]){if(!o.isMesh||o.isInstancedMesh||o.userData.owned||o===skyDome||o===contactShadow||o.material.transparent)continue;const key=Math.floor(o.position.x/45)+':'+o.geometry.uuid+':'+o.material.uuid+':'+(o.userData.detail||0)+':'+o.castShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}for(const list of batches.values()){if(list.length<2)continue;const m=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();m.setMatrixAt(i,o.matrix);world.remove(o);});m.castShadow=list[0].castShadow;m.receiveShadow=true;m.userData.detail=list[0].userData.detail||0;m.computeBoundingSphere?.();world.add(m);}}
  function batchModel(group){
    const bins=new Map();for(const o of [...group.children]){if(!o.isMesh||o.userData.dynamic||o.userData.owned)continue;const key=o.geometry.uuid+o.material.uuid;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(o);}
    for(const list of bins.values()){if(list.length<2)continue;const inst=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();inst.setMatrixAt(i,o.matrix);group.remove(o);});inst.castShadow=inst.receiveShadow=true;inst.computeBoundingSphere?.();group.add(inst);}
  }
  function hazardMaterial(){
    if(materials.has('hazard'))return materials.get('hazard');
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#d4a523';g.fillRect(0,0,128,128);g.strokeStyle='#242a2c';g.lineWidth=22;
    for(let x=-128;x<256;x+=48){g.beginPath();g.moveTo(x,128);g.lineTo(x+80,0);g.stroke();}
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
    const m=new THREE.MeshStandardMaterial({map:tex,roughness:.85});materials.set('hazard',m);return m;
  }
  function tree(x,y,z,scale=1){
    const rand=seeded(Math.abs(Math.round(x*173+z*79+level*357))),bark=pbr('wood',0x8e7a5c);
    const height=(4.6+rand()*1.7)*scale,tilt=(rand()-.5)*.6;
    rod(world,[x,y,z],[x+tilt,y+height*.85,z],.13*scale,bark);
    const geometry=geo('leaf',()=>{const shape=new THREE.Shape();shape.moveTo(0,-.5);shape.quadraticCurveTo(.38,-.1,0,.5);shape.quadraticCurveTo(-.38,-.1,0,-.5);const g=new THREE.ShapeGeometry(shape,3);const pos=g.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.abs(pos.getX(i))*.5);g.computeVertexNormals();return g;});
    for(let crown=0;crown<5;crown++){
      const angle=rand()*TAU,cx=x+Math.cos(angle)*(1+rand())*scale,cz=z+Math.sin(angle)*(1+rand())*scale,cy=y+height*(.65+rand()*.28);
      rod(world,[x+tilt*.5,y+height*.45,z],[cx,cy,cz],.035*scale,bark);
      const key='leaves-'+crown;let m=materials.get(key);
      if(!m){m=new THREE.MeshStandardMaterial({color:[0x697d35,0x7d8b43,0x536c2f,0x909444,0x627b3e][crown],roughness:.9,side:THREE.DoubleSide});m.onBeforeCompile=shader=>{shader.uniforms.windTime=windTime;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x += sin(windTime*1.2+position.y*3.0)*0.035*abs(position.y);');};materials.set(key,m);}
      for(let tier=0;tier<3;tier++){
        const count=tier===0?60:45,mesh=new THREE.InstancedMesh(geometry,m,count),dummy=new THREE.Object3D();mesh.userData.detail=tier;
        for(let k=0;k<count;k++){const a=rand()*TAU,u=rand()*2-1,r=Math.cbrt(rand())*(1+rand()*.4)*scale;dummy.position.set(cx+Math.cos(a)*Math.sqrt(1-u*u)*r,cy+u*r*.85,cz+Math.sin(a)*Math.sqrt(1-u*u)*r);dummy.rotation.set(rand()*Math.PI,rand()*TAU,rand()*TAU);dummy.scale.setScalar((.28+rand()*.3)*scale);dummy.updateMatrix();mesh.setMatrixAt(k,dummy.matrix);}
        mesh.castShadow=tier===0;mesh.receiveShadow=true;mesh.computeBoundingSphere?.();world.add(mesh);
      }
    }
  }
  function crane(x,y,z){const steel=pbr('metal',0xbca15c,.6),dark=pbr('rust',0x626663,.65);for(const a of [-.45,.45])rod(world,[x+a,y,z],[x+a,y+23,z],.09,steel);for(let h=0;h<23;h+=1.8){rod(world,[x-.45,y+h,z],[x+.45,y+h+1.8,z],.045,steel);rod(world,[x-.45,y+h,z],[x+.45,y+h,z],.045,steel);}for(const yy of [23,24])rod(world,[x-5,y+yy,z],[x+16,y+yy,z],.09,steel);for(let q=-5;q<16;q+=2)rod(world,[x+q,y+23,z],[x+q+2,y+24,z],.05,steel);rod(world,[x,y+27,z],[x+15,y+24,z],.035,dark);rod(world,[x+11,y+23,z],[x+11,y+13,z],.025,dark);rounded(world,1.8,1.4,1.4,x+1,y+23.5,z,mat(0x718a92,.6));surfaceBox(world,2.5,2,2,x-4,y+23,z,pbr('concrete',0xaaa99c));}
  function vehicle(x,y,z,color,type){const g=new THREE.Group();world.add(g);g.position.set(x,y,z);const len=type==='bus'?7:type==='truck'?6:3.8;const paint=mat(color,.35),glass=mat(0x6c8793,.65);glass.roughness=.15;
    rounded(g,len,.85,1.65,0,.7,0,paint,.2);rounded(g,type==='car'?2.15:len*.76,.85,1.45,-.15,1.48,0,glass,.25);rounded(g,type==='car'?2:len*.78,.09,1.52,-.15,1.95,0,paint,.04);
    for(const xx of [-.8,.85])box(g,.1,.9,1.49,xx,1.45,0,paint);box(g,len+.08,.12,1.68,0,.35,0,mat(0x424c4e,.6));for(const wz of [-.85,.85])for(const wx of [-len*.32,len*.32]){const wheel=new THREE.Mesh(geo('carwheel',()=>new THREE.CylinderGeometry(.43,.43,.22,24)),pbr('rubber',0x343a3d));wheel.rotation.x=Math.PI/2;wheel.position.set(wx,.43,wz);g.add(wheel);const hub=sphere(g,.23,wx,.43,wz*1.1,mat(0xaeb8ba,.75));hub.scale.z=.06;}
    for(const zz of [-.56,.56]){box(g,.02,.2,.28,len/2+.04,.8,zz,mat(0xf7e9c8,0,tracks[level].night?0xffdcb3:0));box(g,.02,.15,.3,-len/2-.04,.8,zz,mat(0xa05147,0,0x4a0e09));}return g;}

  function rebuildBike(){if(!scene)return;disposeGroup(bike);bike=new THREE.Group();scene.add(bike);
    const color=bikes[save.selected][1],paint=mat(color,.38),rubber=pbr('rubber',0x373c3d),alloy=pbr('metal',0xc1c7c6,.85),dark=pbr('metal',0x59615f,.75),suit=pbr('fabric',0x526b78),blackFabric=pbr('fabric',0x343f47);
    const lens=sphere(bike,.14,.85,.65,0,mat(0xfff0cf,.1,tracks[level].night?0xffe5b0:0));lens.scale.x=.055;
    rounded(bike,.12,.34,.34,.77,.65,0,dark,.04);
    const headlight=new THREE.SpotLight(0xffedcc,tracks[level].night?100:0,30,.38,.65,2);
    headlight.name='motorcycle-headlight';headlight.position.set(.96,.65,0);headlight.target.position.set(13,-2.1,0);headlight.castShadow=false;bike.add(headlight,headlight.target);bike.userData.headlight=headlight;
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
    const tailLens=rounded(bike,.13,.12,.33,-1.35,.39,0,mat(0xc20c16,.15,tracks[level].night?0xff0715:0x270003),.035);
    tailLens.name='motorcycle-tail-lens';
    const tailLight=new THREE.PointLight(0xff1020,tracks[level].night?2.5:0,3,2);tailLight.name='motorcycle-taillight';tailLight.position.set(-1.46,.4,.12);bike.add(tailLight);
    const fender=rounded(bike,.78,.06,.38,1.04,.2,0,paint,.025);fender.rotation.z=-.08;
    for(const z of [-.245,.245]){const panel=rounded(bike,.4,.23,.025,-.49,.27,z,paint,.05);panel.rotation.z=.3;box(bike,.19,.025,.032,-.48,.31,z*1.07,mat(0xe3e2d8));}
    rod(bike,[.56,.55,0],[.62,.85,0],.04,dark);rod(bike,[.62,.85,-.36],[.62,.85,.36],.026,alloy);for(const z of [-.3,.3])rod(bike,[.62,.85,z-.06],[.62,.85,z+.06],.043,rubber);
    rod(bike,[.62,.8,.18],[.87,-.23,.25],.009,mat(0x272f30));
    rod(bike,[.1,-.15,-.27],[-.7,.16,-.27],.055,dark);rod(bike,[-.7,.16,-.27],[-1.15,.27,-.27],.095,alloy);
    // Number plates, radiator louvers, curved exhaust and sprocket are real geometry.
    for(const z of [-.29,.29]){
      const plate=rounded(bike,.44,.31,.035,-.56,.26,z,mat(0xe5e4dc),.08);plate.rotation.z=.18;
      for(let i=0;i<4;i++)box(bike,.24,.025,.035,.24,.15+i*.055,z,pbr('metal',0x8d9697,.75));
      rod(bike,[-.1,-.27,z],[.28,-.27,z],.025,alloy);
    }
    const exhaustPoints=[[.22,.02,.25],[.43,-.08,.31],[.35,-.32,.33],[-.12,-.32,.35],[-.6,.19,.34],[-1.03,.3,.34]].map(p=>new THREE.Vector3(...p));
    const pipe=new THREE.Mesh(geo('exhaust-pipe',()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(exhaustPoints),32,.038,8,false)),pbr('metal',0xa99a7a,.85));pipe.castShadow=true;bike.add(pipe);
    rod(bike,[-.72,.2,.34],[-1.13,.32,.34],.086,alloy);
    for(let i=0;i<18;i++){const a=i*TAU/18;box(bike,.025,.032,.025,-1.05+Math.cos(a)*.18,-.45+Math.sin(a)*.18,.14,alloy);}
    const frontPlate=rounded(bike,.12,.38,.34,.79,.55,0,mat(0xf0e9db),.04);frontPlate.rotation.z=.2;
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
    const visor=new THREE.Mesh(geo('visor',()=>new THREE.SphereGeometry(.281,24,12,0,Math.PI*.85,.75,1.05)),mat(0x203c4a,.7));visor.rotation.y=-Math.PI*.38;visor.scale.set(1,.98,1.03);head.add(visor);
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
  function updateLighting(t){
    // Snap the directional shadow projection to texels in light space, not camera space.
    const offset=new THREE.Vector3(-10,35,18),direction=offset.clone().normalize();
    const right=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right);
    const target=new THREE.Vector3(ride.x,t.base,0),sx=54/lights.shadow.mapSize.x,sy=44/lights.shadow.mapSize.y;
    target.addScaledVector(right,Math.round(target.dot(right)/sx)*sx-target.dot(right));
    target.addScaledVector(up,Math.round(target.dot(up)/sy)*sy-target.dot(up));
    lights.target.position.copy(target);lights.position.copy(target).add(offset);
    const start=Math.floor((ride.x+10)/12)-2;
    streetLights.forEach((lamp,i)=>{const x=-10+(start+i)*12,ground=inRavine(t,x+1.2)?t.base:surface(t,x+1.2).y;
      lamp.position.set(x+1.2,ground+6,-5.2);lamp.target.position.set(x+1.2,ground,0);
      lamp.intensity=x>=-10&&x<t.length+20?340:0;
    });
  }
  function render(dt){if(!ride)return;const t=tracks[level];if(renderer&&bike){const garageMode=state==='garage';world.visible=!garageMode;root.dataset.mode=state;scene.background.set(garageMode?0x243b4c:tracks[level].night?0x132434:0xb7ccd1);bike.position.set(ride.x,ride.y,0);bike.rotation.set(0,garageMode?garageYaw:0,(garageMode?0:ride.a)+(state==='crashed'?Math.min(1,clock-ride.crashClock)*.65:0));animateBike(dt);if(state==='crashed'){const tumble=Math.min(1,(clock-ride.crashClock)*2);bike.userData.rider.position.x=tumble*.6;bike.userData.rider.position.y+=Math.sin(tumble*Math.PI)*.5;bike.userData.rider.rotation.z=-tumble*.8;}else{bike.userData.rider.position.x=0;bike.userData.rider.position.y=0;bike.userData.rider.rotation.z=0;}
      // Compose the tyre contact at 72% of the canvas, independent of aspect ratio.
      const viewDistance=Math.max(23,26/camera.aspect)*zoom;
      const halfHeight=Math.tan(camera.fov*Math.PI/360)*viewDistance;
      const lookAhead=camera.aspect<1?2.2:5+clamp(ride.vx*.15,0,3);
      const landing=inRavine(t,ride.x+lookAhead)?t.base:surface(t,ride.x+lookAhead).y;
      const followY=ride.air>.25?ride.y*.82+(landing+.85)*.18:ride.y;
      const desiredX=ride.loop?ride.loop.ring.x+2:ride.x+lookAhead,desiredY=ride.loop?ride.loop.ring.y+ride.loop.ring.r+1:followY-.85+halfHeight*.44;
      camX+=(desiredX-camX)*(1-Math.exp(-dt*4));camY+=(desiredY-camY)*(1-Math.exp(-dt*4));zoom+=((ride.air>.55?1.18:1)-zoom)*(1-Math.exp(-dt*2));
      const distance=Math.max(23,26/camera.aspect)*zoom;camera.position.set(garageMode?(camera.aspect<1?ride.x:ride.x-1.8):camX,garageMode?(camera.aspect<1?ride.y-4:ride.y+1.2):camY,garageMode?(camera.aspect<1?15:10):distance);camera.lookAt(camera.position.x,camera.position.y,0); // Always +Z: never follows behind the motorcycle.
      if(skyDome){skyDome.position.set(camX,t.base,0);skyDome.rotation.y=clock*.0008;}windTime.value=clock;for(const b of birds){b.position.x=b.userData.origin+Math.sin(clock*.07+b.userData.phase)*22;b.position.y=b.userData.height+Math.sin(clock*.5+b.userData.phase)*.6;b.children.forEach((w,i)=>w.rotation.z=(i?1:-1)*(.2+Math.sin(clock*5+b.userData.phase)*.25));}if(contactShadow){contactShadow.visible=!ride.loop&&!inRavine(t,ride.x);const ground=surface(t,ride.x),height=Math.max(0,ride.y-ground.y-.8);contactShadow.visible=!ride.loop&&!inRavine(t,ride.x)&&Math.abs(surface(t,ride.x-2).s-ground.s)<.025&&Math.abs(surface(t,ride.x+2).s-ground.s)<.025;contactShadow.position.set(ride.x,ground.y+.045,0);contactShadow.rotation.set(-Math.PI/2,0,0);contactShadow.rotation.y=-Math.atan(ground.s);contactShadow.material.opacity=clamp(1-height/5,0,.8);contactShadow.scale.setScalar(1+height*.12);}updateLighting(t);for(const car of traffic)car.mesh.position.x=(car.start+clock*car.speed)%(t.length+80)-30;
      for(const p of fx){p.life-=dt;p.o.position.x+=p.vx*dt;p.o.position.y+=p.vy*dt;p.vy-=6*dt;p.o.scale.setScalar(Math.max(0,p.life));}fx=fx.filter(p=>{if(p.life<=0){scene.remove(p.o);particlePool.push(p.o);return false;}return true;});renderer.render(scene,camera);
    }else if(ctx)renderFallback();}
  function renderFallback(){const w=canvas.width,h=canvas.height,c=ctx,t=tracks[level],scale=Math.min(w/25,h/15),cx=ride.x-w*.32/scale,cy=ride.y-.85+h*.72/scale;const X=x=>(x-cx)*scale,Y=y=>(cy-y)*scale;const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#'+t.sky.toString(16).padStart(6,'0'));gradient.addColorStop(1,tracks[level].night?'#273f5d':'#f0e4d1');c.fillStyle=gradient;c.fillRect(0,0,w,h);for(let i=-2;i<14;i++){const x=i*90-(ride.x*8%90);c.fillStyle=i%2?'#6e8a9a':'#8ba4b0';const bh=80+Math.abs(Math.sin(i*8))*150;c.fillRect(x,h*.65-bh,70,bh);c.fillStyle='#d3e1dd';for(let j=0;j<4;j++)c.fillRect(x+8,h*.65-bh+15+j*25,50,8);}c.fillStyle=tracks[level].night?'#111c28':'#89988a';c.fillRect(0,Y(t.base-5.6),w,h);c.strokeStyle='#3c4950';c.lineWidth=Math.max(5,scale*.38);c.beginPath();for(let x=cx;x<cx+w/scale+.4;x+=.25){const y=Y(surface(t,x).y);if(inRavine(t,x)){c.moveTo(X(x),y);continue;}if(x===cx||inRavine(t,x-.25))c.moveTo(X(x),y);else c.lineTo(X(x),y);}c.stroke();c.strokeStyle='#c5bcaa';c.lineWidth=2;c.stroke();for(let x=Math.ceil(cx/14)*14;x<cx+w/scale;x+=14){if(inRavine(t,x))continue;const yy=surface(t,x).y;c.fillStyle='#9c9d93';c.fillRect(X(x)-scale*.32,Y(yy-.4),scale*.64,Math.max(0,Y(t.base-5.6)-Y(yy-.4)));c.fillStyle='#59666a';c.fillRect(X(x)-scale*.65,Y(yy-.4),scale*1.3,scale*.25);} for(const ring of t.loops||[]){c.strokeStyle='#606e78';c.lineWidth=scale*.32;c.beginPath();c.arc(X(ring.x),Y(ring.y+ring.r),ring.r*scale,0,TAU);c.stroke();} c.save();c.translate(X(ride.x),Y(ride.y));c.rotate(-ride.a);c.scale(scale,scale);for(let i=0;i<2;i++){const x=i?1.05:-1.05,y=.45-ride.compression[i];c.fillStyle='#182c3c';c.beginPath();c.arc(x,y,.43,0,TAU);c.fill();c.strokeStyle='#d5e0dc';c.lineWidth=.05;c.stroke();}c.strokeStyle='#'+bikes[save.selected][1].toString(16);c.lineWidth=.12;c.beginPath();c.moveTo(-1.05,.45);c.lineTo(-.4,-.4);c.lineTo(.6,-.4);c.lineTo(1.05,.45);c.lineTo(-.1,.35);c.closePath();c.stroke();c.strokeStyle='#294c61';c.lineWidth=.25;c.beginPath();c.moveTo(.1,.1);c.lineTo(-.4,-.7);c.lineTo(-.1,-1.3);c.lineTo(.6,-.9);c.stroke();c.fillStyle='#ffb677';c.beginPath();c.arc(-.1,-1.55,.28,0,TAU);c.fill();c.restore();}
  function loop(now){if(!root?.isConnected){destroy();return;}const dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;clock+=dt;if(state==='playing'){acc+=dt;while(acc>=1/120&&state==='playing'){step(ride,tracks[level],keys,1/120);processEvents();acc-=1/120;}if(keys.brake&&ride.contact[0]&&ride.vx>10&&Math.random()<.04)particles(0xc6c6b5,1);}adaptQuality(dt);engine(dt);hud();render(dt);raf=requestAnimationFrame(loop);}
  function destroy(){cancelAnimationFrame(raf);clearTimeout(loading);observer?.disconnect();abort?.abort();audioGeneration++;audioLoading=false;if(audio){audio.dispose();audio.ac.close().catch(()=>{});audio=null;}disposeGroup(world);disposeGroup(bike);for(const p of fx)scene?.remove(p.o);fx=[];materials.forEach(m=>{if(m.transparent||m===materials.get('hazard'))m.map?.dispose();m.dispose();});materials.clear();textures.forEach(m=>Object.values(m).forEach(t=>t.dispose()));textures.clear();environmentTarget?.dispose();environmentTarget=null;skyDome=null;contactShadow=null;particlePool=[];geometries.forEach(g=>g.dispose());geometries.clear();renderer?.dispose();renderer=null;scene=null;ctx=null;world=null;bike=null;root=null;canvas=null;keys={};keyboard={};pointers.clear();state='ready';ride=null;}
  window.FPStuntBike={gallery,start,destroy};
})();


