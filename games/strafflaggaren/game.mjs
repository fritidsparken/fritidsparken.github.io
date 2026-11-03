import {clamp,winner,launch,step,swipe,keeperPose} from './physics.mjs?v=matchday-20261103';
import {arenaAudio} from './audio.mjs';
import {createWorld} from './scene.mjs?v=matchday-20261103';
const $=s=>document.querySelector(s), overlay=$('#overlay'),KEY='fp-strafflaggaren-v1';
let data={wins:0,xp:0,ball:0,kit:0,gloves:0,net:0,arena:0,record:0,completed:[],tutorial:false,sound:true};
let storedDifficulty;
try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&typeof d==='object'){for(const k of ['wins','xp','ball','kit','gloves','net','arena','record'])if(Number.isFinite(d[k])&&d[k]>=0)data[k]=Math.floor(d[k]);if(Array.isArray(d.completed))data.completed=d.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<5);data.tutorial=!!d.tutorial;data.sound=d.sound!==false;if(d.edition!==2)data.arena=[0,0,1,1,2,3][data.arena]??0;storedDifficulty=Number.isInteger(d.difficulty)?clamp(d.difficulty,0,3):undefined;}}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({...data,edition:2,difficulty}));}catch{$('#warning').hidden=false;}};
const arenas=['Skolplanen','Stadsarenan','Nationalarenan','Finalarenan'];
const ballNames=['Klassikern','Guldbollen','Eldbollen','Isbollen','Neonbollen'],unlocks=[0,8,20,35,55];
const tasks=['Sätt bollen i vänstra krysset','Gör tre mål i rad','Gör mål med skruv','Träffa stolpen eller ribban och gör mål','Rädda två straffar i rad'];
let world, mode='match',difficulty=storedDifficulty??data.arena,challenge=0,pendingMode=null,paused=false,match={a:[],b:[]},stats,streak=0,wonChallenge=false;
let state={phase:'menu',role:'shoot',ball:null,keeper:{tx:0,ty:.94,time:0},clock:0,power:20};let input=[],pointer=null,shot=null,aiActed=false,hitSound=false,saveSound=false,netSound=false,resultClock=0,slowFrames=0,savedPhase;
const audio=(kind,strength=1,pan=0)=>arenaAudio.play(kind,strength,pan);
arenaAudio.setEnabled(data.sound);
document.addEventListener('pointerdown',()=>arenaAudio.unlock(),{capture:true,once:true});
const levels=['LÄTT','MEDEL','SVÅR','MYCKET SVÅR'];
let keeperX=0,positionGoal=0,chargeStart=0,stepIndex=-1,landingSound=false;
let recording=[],replayCursor=-1,replayOffered=false,replayTime=0,lastFrameTime=0;
function resetPointer(){pointer=null;input=[];chargeStart=0;$('#charge').hidden=true;$('#swipePath').setAttribute('d','');world.target.visible=false;}
function stopReplay(){replayCursor=-1;$('#replay').hidden=true;$('#feedback').textContent=lastFeedback;}
let lastFeedback='';
function soundUI(){$('#sound').textContent=data.sound?'♫':'♪̸';$('#sound').setAttribute('aria-label',data.sound?'Stäng av ljud':'Slå på ljud');$('#sound').setAttribute('aria-pressed',String(!data.sound));}
function panel(html){overlay.innerHTML=`<section class="panel">${html}</section>`;overlay.querySelector('button')?.focus();}
function levelMax(){return arenas.length-1;}
function applyCosmetics(){data.ball=clamp(data.ball,0,4);data.kit=clamp(data.kit,0,2);data.gloves=clamp(data.gloves,0,2);data.net=clamp(data.net,0,1);world.cosmetics(data.ball,data.kit,data.gloves,data.net);}
function menu(){paused=false;arenaAudio.pause(false);resetPointer();replayCursor=-1;state.phase='menu';state.role='shoot';state.ball=null;state.keeper={tx:0,ty:.94,time:0};$('#hud').hidden=true;$('#feedback').textContent='';world.view('shoot');data.arena=clamp(data.arena,0,levelMax());world.setArena(data.arena);applyCosmetics();
 panel(`<span class="eyebrow">FRITIDSPARKENS FOTBOLLSKLUBB</span><h1>STRAFF<span style="color:#d4f86e">LÄGGAREN</span></h1><p class="lead">Skjut för Fritidsparken och ställ dig sedan i mål.<br>Fem straffar var avgör matchen.</p><button class="primary wide" data-play="match">SPELA MATCH <span style="float:right">⚽ →</span></button><div class="grid"><button data-play="practice">🎯 Träning<small>Hitta ditt perfekta skott</small></button><button data-play="keeper">🧤 Målvaktsträning<small>Gör matchens räddning</small></button><button data-action="challenges">✨ Utmaningar<small>${data.completed.length} av 5 avklarade</small></button><button data-action="collection">⚽ Mina bollar & ställ<small>Spela och lås upp</small></button></div><label>Svårighet<select id="difficulty"><option value="0">Lätt</option><option value="1">Medel</option><option value="2">Svår</option><option value="3">Mycket svår</option></select></label><label>Arena<select id="arena">${arenas.map((a,i)=>`<option value="${i}" ${i>levelMax()?'disabled':''}>${a}${i>levelMax()?` · ${i*12} poäng 🔒`:''}</option>`).join('')}</select></label><button class="wide" data-action="help">Så spelar du →</button>${arenaAudio.controls()}<p class="footnote">${data.wins} vunna matcher · ${data.xp} spelpoäng · Rekord ${data.record} km/h<br>Inga köp. Inget konto. Bara fotboll.</p>`);$('#difficulty').value=difficulty;$('#arena').value=data.arena;}
function help(nextMode=null){pendingMode=nextMode;panel(`<span class="eyebrow">EN MINUT TILL AVSPARK</span><h1>DIN <em>TUR!</em></h1><ol class="tutorial"><li><strong>Sikta.</strong> Peka mot målet med musen. På pekskärm börjar du ditt svep vid bollen.</li><li><strong>Skjut.</strong> Håll musknappen för att ladda och släpp för att skjuta. På pekskärm ger ett längre svep mer kraft.</li><li><strong>Skruva.</strong> Böj ditt svep för skruv. Med musen kan du också hålla Skift och dra i sidled.</li><li><strong>Rädda.</strong> Tryck ”Jag är redo”. Flytta dig med musen eller piltangenterna. Klicka, svep eller tryck mellanslag för att kasta dig. Tidpunkten spelar roll.</li></ol><p>Fem straffar var. Flest mål vinner! Vid lika resultat får båda ett nytt försök. Matchen slutar tidigare om ett lag inte kan komma ikapp.</p><button class="primary wide" data-action="tutorialDone">${nextMode?'DIN TUR!':'TILLBAKA'}</button>${nextMode?'<button class="wide" data-action="tutorialDone">Hoppa över</button>':''}`);}
function start(m){mode=m;paused=false;overlay.innerHTML='';match={a:[],b:[]};stats={shots:0,goals:0,saves:0,faced:0,best:0};streak=0;wonChallenge=false;$('#hud').hidden=false;prepare();}
function prepare(){resetPointer();keeperX=positionGoal=0;recording=[];replayCursor=-1;replayOffered=false;landingSound=false;stepIndex=-1;$('#replay').hidden=true;state.role=mode==='keeper'||(mode==='challenge'&&challenge===4)||(mode==='match'&&match.a.length>match.b.length)?'save':'shoot';state.phase='aim';state.clock=0;state.ball=null;state.keeper={tx:0,ty:.94,time:0};state.power=20;shot=null;aiActed=false;hitSound=false;saveSound=false;netSound=false;input=[];pointer=null;$('#swipePath').setAttribute('d','');$('#feedback').textContent='';$('#next').hidden=true;$('#ready').hidden=false;$('#ready').textContent=state.role==='shoot'?'JAG ÄR REDO ⚽':'JAG ÄR REDO 🧤';world.view(state.role);world.target.visible=false;hud();audio('whistle');}
function decisive(){if(mode!=='match')return false;const a=match.a.filter(Boolean).length,b=match.b.filter(Boolean).length;const aa=[...match.a],bb=[...match.b];(state.role==='shoot'?aa:bb).push(true);if(winner(aa,bb)!==null)return true;(state.role==='shoot'?aa:bb)[(state.role==='shoot'?aa:bb).length-1]=false;return winner(aa,bb)!==null;}
function hud(){const a=match.a.filter(Boolean).length,b=match.b.filter(Boolean).length;$('#score').textContent=mode==='match'?`${a} : ${b}`:`${stats.goals} ⚽ ${stats.saves} 🧤`;const dots=ar=>Array.from({length:Math.max(5,ar.length)},(_,i)=>`<i class="dot ${i<ar.length?(ar[i]?'goal':'miss'):''}" title="${i<ar.length?(ar[i]?'Mål':'Miss'):'Återstår'}"></i>`).join('');
$('#homeDots').innerHTML=dots(match.a);$('#awayDots').innerHTML=dots(match.b);world.score(a,b);$('#badge').textContent=mode==='challenge'?tasks[challenge]:decisive()?'AVGÖRANDE STRAFF!':mode==='match'&&match.b.length>=5?'SUDDEN DEATH · ETT FÖRSÖK VAR':arenas[data.arena]+' · '+levels[difficulty];$('#round').textContent=mode==='match'?`STRAFF ${Math.min(match.a.length,match.b.length)+1} · ${match.b.length>=5?'SUDDEN DEATH':'FEM FÖRSÖK VAR'}`:`${stats.shots} SKOTT · ${stats.faced} MÖTTA · ${stats.shots?Math.round(stats.goals/stats.shots*100):0}% MÅL`;$('#turn').textContent=state.role==='shoot'?'SKJUT! ⚽':'RÄDDA! 🧤';$('#hint').textContent=state.role==='shoot'?(matchMedia('(pointer: coarse)').matches?'Svep från bollen mot målet. Böj för skruv.':'Sikta med musen. Håll för kraft och släpp för att skjuta.'):'Tryck redo. Läs skottet och svep åt rätt håll!';}
function beginRun(s){shot=s;state.phase='run';state.clock=0;state.power=s.speed;world.target.visible=false;$('#ready').hidden=true;$('#hint').textContent=state.role==='save'?'Läs ansatsen. Svep åt rätt håll – eller stå kvar!':'Vilket skott blir det?';}
function dive(tx,ty){if(aiActed)return;aiActed=true;state.keeper.startX=keeperX;state.keeper.tx=clamp(tx,-3,3);state.keeper.ty=clamp(ty,.35,2.1);state.keeper.time=.001;}
function resolve(){if(state.phase!=='flight')return;const b=state.ball;const wasDecisive=decisive();state.phase='result';resultClock=0;const goal=b.goal,own=state.role==='shoot',beforeArena=levelMax(),beforeBalls=unlocks.filter(n=>data.xp>=n).length;
 if(own){stats.shots++;if(goal)stats.goals++;stats.best=Math.max(stats.best,Math.round(state.power*3.6));data.record=Math.max(data.record,stats.best);}else{stats.faced++;if(b.saved&&!goal)stats.saves++;}
 if(mode==='match')(own?match.a:match.b).push(goal);
 streak=(own?goal:b.saved&&!goal)?streak+1:0;data.xp+=goal&&own||b.saved&&!own&&!goal?2:1;
 const complete=mode==='challenge'&&[goal&&b.crossing?.x< -2&&b.crossing?.y>1.65,streak>=3,goal&&Math.abs(shot.spin)>.28,goal&&!!b.hit,streak>=2][challenge];
 if(complete){wonChallenge=true;if(!data.completed.includes(challenge)){data.completed.push(challenge);data.xp+=5;}}
 save();const msg=goal?(b.hit==='bar'?'RIBBA IN!':b.hit?'STOLPE IN!':'MÅÅÅL!'):b.saved?(own?'RÄDDAD!':'VILKEN RÄDDNING!'):b.hit==='bar'?'RIBBAN!':b.hit?'STOLPEN!':'NÄSTAN!';lastFeedback=msg;$('#feedback').textContent=msg;audio(goal?'goal':b.saved?'applause':'miss');replayOffered=!!(b.hit||wasDecisive||b.saved||goal&&Math.abs(shot.x)>2.3);hud();$('#hint').textContent=complete?'Utmaning klar! +5 spelpoäng':levelMax()>beforeArena?'Ny arena upplåst! '+arenas[levelMax()]:unlocks.filter(n=>data.xp>=n).length>beforeBalls?'En ny boll är upplåst!':own?`${Math.round(state.power*3.6)} km/h · ${Math.abs(shot.spin)>.28?'Skruvat skott':'Rakt skott'}`:b.saved&&!goal?'Du läste skottet!':'Nästa boll är din.';$('#next').hidden=false;$('#next').textContent=mode==='match'&&winner(match.a,match.b)!==null?'VISA RESULTAT →':complete?'UTMANING KLAR →':'NÄSTA STRAFF →';}
function finish(){const won=winner(match.a,match.b)===0;if(won){data.wins++;data.xp+=5;save();audio('win');confetti();}state.phase='end';const a=match.a.filter(Boolean).length,b=match.b.filter(Boolean).length;panel(`<span class="eyebrow">MATCHEN ÄR SLUT</span><h1>${won?'DU <em>VANN!</em> 🏆':'<em>NÄSTAN!</em>'}</h1><p class="lead">Fritidsparken <strong>${a}–${b}</strong> Motståndarna<br>${won?'Vilka nerver! Njut av segern.':'Bra kämpat! Nästa match kan bli din.'}</p><div style="font-size:28px;color:#d4f86e">${'★'.repeat(won?3:stats.goals>=2?2:1)}${'☆'.repeat(won?0:stats.goals>=2?1:2)}</div><div class="statrow"><div><b>${stats.goals}/${stats.shots}</b><small>MÅL</small></div><div><b>${stats.saves}</b><small>RÄDDNINGAR</small></div><div><b>${stats.best}</b><small>KM/H</small></div></div><p>Träffsäkerhet: ${Math.round(stats.goals/Math.max(1,stats.shots)*100)} % · ${data.wins} segrar totalt</p><button class="primary wide" data-play="match">SPELA IGEN →</button><button class="wide" data-action="nextMatch">NÄSTA MATCH →</button><button class="wide" data-action="menu">HUVUDMENY</button>`);}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<45;i++){const c=document.createElement('i');c.className='confetti';c.style.left=Math.random()*100+'%';c.style.background=['#dcf98a','#fbbb68','#82d6df','#ea88b1'][i%4];c.style.animationDelay=Math.random()*.5+'s';document.body.append(c);setTimeout(()=>c.remove(),4000);}}
function challenges(){state.phase='menu';panel(`<span class="eyebrow">FEM SÄTT ATT GLÄNSA</span><h1>STRAFF<em>UTMANINGEN</em></h1><p>Varje avklarat uppdrag ger fem extra spelpoäng.</p>${tasks.map((t,i)=>`<button class="wide" data-challenge="${i}">${data.completed.includes(i)?'✓':'○'} ${t}</button>`).join('')}<button class="wide" data-action="menu">← Huvudmeny</button>`);}
function collection(){panel(`<span class="eyebrow">DIN MATCH. DIN STIL.</span><h1>OMKLÄDNINGS<em>RUMMET</em></h1><p>${data.xp} spelpoäng · Allt låses upp genom att spela.</p><h3>Fotbollar</h3><div class="grid">${ballNames.map((n,i)=>`<button class="${data.ball===i?'chosen':''}" data-ball="${i}" ${data.xp<unlocks[i]?'disabled':''}>${['⚽','🟡','🔥','❄️','💚'][i]} ${n}<small>${data.xp<unlocks[i]?`${unlocks[i]} poäng 🔒`:'Samma bollfysik · ny stil'}</small></button>`).join('')}</div><h3>Matchställ</h3><div class="grid">${['Solgult','Mintgrönt','Lavendel'].map((n,i)=>`<button data-kit="${i}" ${data.xp<i*15?'disabled':''} class="${data.kit===i?'chosen':''}">${n} ${data.xp<i*15?'🔒 '+i*15+' p':''}</button>`).join('')}</div><h3>Handskar & nät</h3><div class="grid">${['Lime','Rosa','Isblå'].map((n,i)=>`<button data-gloves="${i}" ${data.xp<i*12?'disabled':''} class="${data.gloves===i?'chosen':''}">🧤 ${n} ${data.xp<i*12?'🔒 '+i*12+' p':''}</button>`).join('')}<button data-net="${1-data.net}" ${data.xp<18?'disabled':''}>🥅 ${data.net?'Vitt nät':'Isblått nät'} ${data.xp<18?'🔒 18 p':''}</button></div><button class="wide" data-action="menu">← Huvudmeny</button>`);}
function pause(){if(['menu','end'].includes(state.phase)||paused)return;paused=true;arenaAudio.pause(true);resetPointer();input=[];pointer=null;$('#swipePath').setAttribute('d','');world.target.visible=false;panel(`<span class="eyebrow">TA EN ANDNINGSPAUS</span><h1>TIME <em>OUT</em></h1><p>Matchen väntar på dig. Ingenting händer medan du pausar.</p><button class="primary wide" data-action="resume">FORTSÄTT →</button><button class="wide" data-action="menu">HUVUDMENY</button>${arenaAudio.controls()}`);}
function next(){stopReplay();if(state.phase!=='result')return;if(mode==='match'&&winner(match.a,match.b)!==null){finish();return;}if(wonChallenge){confetti();audio('win');challenges();return;}prepare();}
$('#next').onclick=next;$('#ready').onclick=()=>{if(state.role==='shoot'){ $('#ready').hidden=true;audio('tap');return; }if(state.phase==='aim'&&state.role==='save'){audio('tap');beginRun({x:(Math.random()<.5?-1:1)*(.3+Math.pow(Math.random(),1/(1+difficulty*.45))*3.25),y:.18+Math.random()*2.1,speed:[16,20,24,27][difficulty]+Math.random()*2,spin:(Math.random()-.5)*.8});}};
$('#pause').onclick=pause;$('#sound').onclick=()=>{data.sound=!data.sound;arenaAudio.setEnabled(data.sound);arenaAudio.unlock();save();soundUI();audio('tap');};
overlay.addEventListener('change',e=>{if(e.target.id==='difficulty'){difficulty=Number(e.target.value);save();}if(e.target.id==='arena'){data.arena=Number(e.target.value);difficulty=data.arena;$('#difficulty').value=difficulty;save();world.setArena(data.arena);applyCosmetics();}});
overlay.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;audio('tap');const d=el.dataset;if(d.play){if(!data.tutorial)help(d.play);else start(d.play);return;}if(d.challenge!==undefined){challenge=+d.challenge;start('challenge');return;}for(const k of ['ball','kit','gloves','net'])if(d[k]!==undefined){data[k]=+d[k];save();applyCosmetics();collection();return;}
 switch(d.action){case 'menu':menu();break;case 'help':help();break;case 'tutorialDone':data.tutorial=true;save();if(pendingMode)start(pendingMode);else menu();pendingMode=null;break;case 'challenges':challenges();break;case 'collection':collection();break;case 'resume':paused=false;arenaAudio.pause(false);overlay.innerHTML='';break;case 'nextMatch':data.arena=Math.min(levelMax(),data.arena+1);difficulty=data.arena;save();world.setArena(data.arena);applyCosmetics();start('match');break;}});
function point(e){return {x:e.clientX,y:e.clientY,t:performance.now()};}
function sight(e){
 const a=world.aim(e.clientX,e.clientY);
 world.target.position.set(clamp(a.x,-4.8,4.8),clamp(a.y,.14,3.5),.09);
 world.target.visible=true;return a;
}
function inputDown(e){
 if(pointer!==null||e.isPrimary===false||e.button>0||paused||overlay.innerHTML||replayCursor>=0)return;
 if(state.role==='shoot'){
   if(state.phase!=='aim')return;
   if(e.pointerType!=='mouse'){
     const ball=world.project({x:0,y:.11,z:11});
     if(Math.hypot(e.clientX-ball.x,e.clientY-ball.y)>Math.max(54,innerHeight*.13)){
       $('#hint').textContent='Börja svepet vid bollen.';return;
     }
   }else{chargeStart=performance.now();$('#charge').hidden=false;sight(e);}
 }else if(!['run','flight'].includes(state.phase))return;
 pointer=e.pointerId;input=[point(e)];e.currentTarget.setPointerCapture(pointer);
}
function inputMove(e){
 if(paused||overlay.innerHTML||replayCursor>=0)return;
 if(e.pointerType==='mouse'&&state.role==='save'&&!aiActed&&['aim','run','flight'].includes(state.phase))positionGoal=clamp(world.aim(e.clientX,e.clientY).x,-1.5,1.5);
 if(state.role==='shoot'&&state.phase==='aim'&&(e.pointerType==='mouse'||e.pointerId===pointer))sight(e);
 if(e.pointerId!==pointer)return;
 input.push(point(e));if(input.length>160)input.splice(1,1);
 if(e.pointerType!=='mouse')$('#swipePath').setAttribute('d',input.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' '));
}
function inputUp(e){
 if(e.pointerId!==pointer)return;
 const end=point(e),first=input[0];input.push(end);
 const a=world.aim(e.clientX,e.clientY),dx=end.x-first.x,dy=end.y-first.y;
 if(state.role==='shoot'&&state.phase==='aim'){
   const shotInput=swipe(input,a);
   if(e.pointerType==='mouse'){
     beginRun({x:clamp(a.x,-4.8,4.8),y:clamp(a.y,.14,3.5),speed:14+15*clamp((performance.now()-chargeStart)/1000,0,1),spin:e.shiftKey?clamp(dx/100,-1,1):(shotInput?.spin||0)});
   }else if(shotInput){
     shotInput.speed=14+15*clamp(Math.hypot(dx,dy)/(innerHeight*.45),0,1);beginRun(shotInput);
   }
 }else if(state.role==='save'&&['run','flight'].includes(state.phase)){
   // Behind the net screen-left corresponds to positive world X.
   if(e.pointerType!=='mouse'&&Math.hypot(dx,dy)>18)dive(keeperX-clamp(dx/(innerWidth*.24),-1,1)*3,clamp(.85-dy/(innerHeight*.23),.35,2.1));
   else dive(a.x,a.y);
 }
 resetPointer();
}
window.addEventListener('keydown',e=>{
 if(e.target.matches('input,select,textarea')||paused||overlay.innerHTML||state.role!=='save'||aiActed)return;
 if(!['aim','run','flight'].includes(state.phase))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
 if(e.key==='ArrowLeft')positionGoal=clamp(positionGoal+.35,-1.5,1.5);
 if(e.key==='ArrowRight')positionGoal=clamp(positionGoal-.35,-1.5,1.5);
 if(state.phase!=='aim'&&[' ','ArrowUp','ArrowDown'].includes(e.key))dive(positionGoal*2,e.key==='ArrowUp'?2:e.key==='ArrowDown'?.38:1);
});
$('#replay').onclick=stopReplay;
try{world=createWorld($('#world'));const canvas=world.renderer.domElement;canvas.addEventListener('pointerdown',inputDown);canvas.addEventListener('pointermove',inputMove);canvas.addEventListener('pointerup',inputUp);canvas.addEventListener('pointercancel',resetPointer);window.addEventListener('resize',()=>{world.resize();resetPointer();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('#hint').textContent='Grafiken pausades. Vänta en stund och fortsätt.';});canvas.addEventListener('webglcontextrestored',()=>world.resize());soundUI();menu();
 let prev=performance.now(),elapsed=0,acc=0;
 function frame(now){requestAnimationFrame(frame);let dt=Math.min((now-prev)/1000,.12);prev=now;if(dt>.033)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>120){world.lowQuality();slowFrames=-1e6;}if(paused)return;elapsed+=dt;
 if(replayCursor>=0){
   replayTime+=dt*.45;
   while(replayCursor+1<recording.length&&recording[replayCursor+1].time<=replayTime)replayCursor++;
   const clip=recording[replayCursor];
   world.update({...state,phase:'flight',ball:clip.ball,keeper:clip.keeper,replay:true},dt*.45,elapsed);
   if(replayTime>=recording.at(-1).time+.12)stopReplay();
   return;
 }
 if(chargeStart)$('#charge i').style.transform='scaleX('+clamp((performance.now()-chargeStart)/1000,0,1)+')';
 if(!aiActed&&state.role==='save'){
   keeperX+=(positionGoal-keeperX)*(1-Math.exp(-dt*6));
   state.keeper.startX=keeperX;
 }

 if(state.phase==='run'){state.clock+=dt;const stride=Math.floor(state.clock/.22);if(stride!==stepIndex){audio('step',.6);stepIndex=stride;}if(state.clock>=.65){state.ball=launch(shot.x,shot.y,shot.speed,shot.spin);state.phase='flight';state.clock=0;audio('kick',state.power/29);}}
 if(state.phase==='flight'||state.phase==='result'){const b=state.ball;const slow=state.phase==='flight'&&decisive()&&b.z<2&&b.z>-.3&&!matchMedia('(prefers-reduced-motion: reduce)').matches;acc+=dt*(slow?.48:1);while(acc>=1/240){acc-=1/240;if(aiActed)state.keeper.time+=1/240;if(state.phase==='flight'&&state.role==='shoot'&&!aiActed&&b.age>[.30,.22,.16,.13][difficulty]){const t=Math.max(0,(b.z-.48)/Math.max(1,-b.vz)),error=[1.15,.65,.3,.16][difficulty];dive(b.x+b.vx*t+(Math.random()-.5)*error*2,b.y+b.vy*t-4.905*t*t+(Math.random()-.5)*error);}
 const oldBounce=b.bounce;step(b,1/240,keeperPose(state.keeper).parts);if(oldBounce!==b.bounce)audio('bounce',clamp(Math.abs(b.vy)/5,.12,.82),b.x/4);}
 if(aiActed&&!landingSound&&state.keeper.time>.85){audio('land',.7,state.keeper.tx/4);landingSound=true;}
 if(b.hit&&!hitSound){audio(b.hit==='bar'?'bar':'post',1,b.x/4);hitSound=true;}if(b.saved&&!saveSound){audio('save',state.power/29,b.x/4);saveSound=true;}if(b.net&&!netSound){audio('net');netSound=true;}
 if((state.phase==='flight'||resultClock<.65)&&recording.length<450&&elapsed!==lastFrameTime){
    recording.push({time:elapsed,ball:{...b},keeper:{...state.keeper}});lastFrameTime=elapsed;
 }
 if(state.phase==='flight'&&(b.goal||b.done||(b.saved&&b.z>1&&b.vz>0&&b.age>.8)||(b.z<-.4&&!b.hit&&!b.goal)))resolve();if(state.phase==='result'){
   resultClock+=dt;
   if(replayOffered&&resultClock>.68&&recording.length>2&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
     replayOffered=false;replayCursor=0;replayTime=recording[0].time;$('#replay').hidden=false;$('#feedback').textContent='REPRIS';
   }
 }
 }else{acc=0;if(aiActed)state.keeper.time+=dt;}
 world.update(state,dt,elapsed);
 }
 requestAnimationFrame(frame);
}catch(e){console.error(e);panel('<h1>EN LITEN<br><em>TIME OUT</em></h1><p>Webbläsaren kunde inte starta 3D-grafiken. Prova att öppna spelet i en uppdaterad webbläsare med WebGL aktiverat.</p><a href="../../?view=games" target="_top">← Tillbaka till Fritidsparken</a>');}
