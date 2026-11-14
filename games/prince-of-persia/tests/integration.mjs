// Actual controller/story reader + real Three math, rail physics and coin geometry.
// Only GPU rendering, asset IO, DOM, sound output and illustration playback are stubbed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),read=name=>fs.readFileSync(new URL(name,root),'utf8');
const moduleFrom=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const Three=await moduleFrom(read('vendor/three.module.js')),track=await moduleFrom(read('minecart-track.js'));
const {createCartCamera}=await moduleFrom(read('minecart-camera.js')),{CoinState,buildCoins,createCoinLayout}=await moduleFrom(read('minecart-coins.js'));
const source=read('cave.js').replace(/^import .*;\n/gm,''),storySource=read('story-reader.js'),html=read('cave.html');
const KEY='lostWorlds.minecart3d.v2',MAIN_MENU='https://fritidsparken.se/games/prince-of-persia/',flush=()=>new Promise(setImmediate);
assert(!/\bid=["']junction(?:Text|Hint)?["']/.test(html),'no junction overlay or countdown element');
assert(/id="endTitle">SLUT</.test(html));assert(/#endingScreen\{[^}]*background:#000[;}]/.test(html),'ending backdrop is black');
function makeGame(saved,search=''){
 const elements={},globalEvents=new Map(),documentEvents=new Map(),intervals=new Map(),timeouts=new Map();let timerId=0,clock=0;
 const calls={builds:[],disposes:0,plays:[],errors:[],highlights:[],frames:0,loads:[],coinSounds:[],doors:[],motionShows:[],motionStops:0,motionResizes:0,active:[],audioUpdates:0,resumes:0};
 let holdNext=false,rejectNext=false;
 function element(id,tag='DIV'){
  const events=new Map(),classes=new Set();let value='';
  const e={id,tagName:tag.toUpperCase(),hidden:false,disabled:false,style:{},options:[],textContent:'',src:'',alt:'',paused:true,currentTime:0,volume:1,offsetWidth:1280,
   classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},toggle(x,on){on=on===undefined?!classes.has(x):on;if(on)classes.add(x);else classes.delete(x);return on},contains:x=>classes.has(x)},
   get value(){return value},set value(v){value=String(v)},setAttribute(k,v){this[k]=String(v)},append(item){this.options.push(item)},focus(){this.focused=true},
   getBoundingClientRect(){return{left:1100,top:12,width:150,height:50}},
   addEventListener(k,cb){if(!events.has(k))events.set(k,[]);events.get(k).push(cb)},
   async fire(k,event={}){for(const cb of events.get(k)||[])await cb({target:e,preventDefault(){},...event})},
   play(){this.paused=false;calls.plays.push(id);return Promise.resolve()},pause(){this.paused=true},
   getAnimations:()=>[],animate(){},closest(selector){return selector.toUpperCase().split(',').map(s=>s.trim()).includes(this.tagName)?this:null},
  };return e;
 }
 for(const match of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/gi)){const e=element(match[2],match[1]);e.hidden=/\bhidden\b/.test(match[0]);elements[match[2]]=e}
 const memory=saved?{[KEY]:JSON.stringify(saved)}:{};
 class Renderer{constructor(){this.shadowMap={}}setPixelRatio(){}setSize(){}render(){calls.frames++}}
 const context={...track,CoinState,buildCoins,createCartCamera,THREE:{...Three,WebGLRenderer:Renderer},console:{...console,error:e=>calls.errors.push(String(e))},URLSearchParams,Math,Set,Number,JSON,Promise,
  performance:{now:()=>0},devicePixelRatio:1,innerWidth:1280,innerHeight:720,
  location:{search,pathname:'/cave.html',href:'',reload(){calls.reloaded=true}},history:{replaceState(){}},
  localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v},
  document:{hidden:false,getElementById:id=>{assert(elements[id],`actual HTML must contain #${id}`);return elements[id]},createElement:tag=>element('',tag),addEventListener(k,cb){if(!documentEvents.has(k))documentEvents.set(k,[]);documentEvents.get(k).push(cb)}},
  addEventListener(k,cb){if(!globalEvents.has(k))globalEvents.set(k,[]);globalEvents.get(k).push(cb)},
  requestAnimationFrame(){},setInterval(cb){const id=++timerId;intervals.set(id,cb);return id},clearInterval:id=>intervals.delete(id),
  setTimeout(cb,ms){const id=++timerId;timeouts.set(id,{cb,at:clock+ms});return id},clearTimeout:id=>timeouts.delete(id),
  createCartAudio(){return{resume(){calls.resumes++},setActive:v=>calls.active.push(v),update(){calls.audioUpdates++},coin:c=>calls.coinSounds.push(c),door:()=>calls.doors.push(calls.builds.at(-1))}},
  createOutroMotion(){return{show(url,index){calls.motionShows.push({url,index});return Promise.resolve()},stop(){calls.motionStops++},resize(){calls.motionResizes++}}},
  renderCoursePreview:async()=>({texture:new Three.Texture(),dispose(){}}),
  buildCart(){return{group:new Three.Group(),ready:Promise.resolve(),update(){}}},
  buildRails(){return{highlight:id=>calls.highlights.push(id),dispose(){}}},
  buildCave(T,scene,course,level){calls.builds.push(level);let ready;
   if(rejectNext){rejectNext=false;ready=Promise.reject(new Error('fixture texture load failed'))}
   else if(holdNext){holdNext=false;let resolve,reject;ready=new Promise((yes,no)=>{resolve=yes;reject=no});calls.loads.push({resolve,reject})}
   else ready=Promise.resolve();return{ready,dispose(){calls.disposes++},update(){},setPreview(){}};
  }
 };
 context.window=context;vm.createContext(context);vm.runInContext(storySource,context);vm.runInContext(source,context);
 const run=code=>vm.runInContext(code,context);
 return {run,e:elements,calls,memory,context,hold(){holdNext=true},fail(){rejectNext=true},
  key(key,target=elements.view){let prevented=false;for(const cb of globalEvents.get('keydown')||[])cb({key,target,repeat:false,preventDefault(){prevented=true}});return prevented},
  endAudio(id){assert.equal(elements[id].paused,false,`${id} should be playing`);const cb=elements[id].onended;assert.equal(typeof cb,'function');cb()},
  finishOpening(){for(const end of [7.45,14.2,18.9]){elements.caveVoice.currentTime=end;for(const fn of [...intervals.values()])fn()}},
  elapse(ms){clock+=ms;for(const [id,t]of [...timeouts])if(t.at<=clock){timeouts.delete(id);t.cb()}},
  driveLevel(){run(`(()=>{let guard=0;while(mode==='run'&&guard++<18000){const s=physics.snapshot();if(s.pending)select(s.pending.safeSide);if(s.canJump&&!s.jumpQueued)physics.jump();time+=STEP;tick();if(mode==='run'&&!doorSounded&&course.length*(1-current.progress)<24){draw(STEP,1);draw(STEP,1);draw(STEP,1)}}if(guard>=18000)throw Error('Course did not complete')})()`)}
 };
}
{
 const g=makeGame();await flush();assert.equal(g.run('mode'),'ready');assert.equal(g.e.levelSelect.options.length,10);assert.equal(g.e.go.disabled,false);
 assert.equal(g.key('ArrowDown',g.e.levelSelect),false,'menu picker keyboard remains native');
 await g.e.go.onclick();assert.equal(g.run('mode'),'story');assert.equal(g.calls.plays.at(-1),'caveVoice');g.finishOpening();assert.equal(g.run('mode'),'run');assert.equal(g.run('seen'),true);
 for(let level=0;level<10;level++){
  assert.equal(g.run('level'),level);assert.equal(g.e.chapter.textContent,`FLÖJTENS EKO · ${level+1} / 10`);
  g.run('draw(1/60,.5)');g.context.innerWidth=390;g.context.innerHeight=844;g.run('resize();draw(1/60,.5)');g.context.innerWidth=844;g.context.innerHeight=390;g.run('resize();draw(1/60,.5)');
  g.driveLevel();await flush();assert.equal(g.run('physics.respawns'),0);
  const bank=JSON.parse(g.memory[KEY]).coins;assert.equal(bank[level].length,createCoinLayout(track.createCourse(level)).length,`all level${level+1} coins persisted`);
  if(level<9){assert.equal(g.run('mode'),'run');assert.equal(g.run('level'),level+1);assert.equal(g.calls.builds.length,level+2)}else{assert.equal(g.run('mode'),'story');assert.equal(g.run('outro'),true)}
 }
 assert.deepEqual(g.calls.builds,[0,1,2,3,4,5,6,7,8,9]);assert.deepEqual(g.calls.doors,[0,1,2,3,4,5,6,7,8,9],'door plays once per course, not each render');
 const banks=JSON.parse(g.memory[KEY]).coins;assert.equal(Object.keys(banks).length,10);assert.equal(Object.values(banks).flat().length,Array.from({length:10},(_,i)=>createCoinLayout(track.createCourse(i)).length).reduce((a,b)=>a+b,0));assert.equal(new Set(Object.values(banks).flat()).size,Object.values(banks).flat().length);assert.equal(g.calls.coinSounds.length,Object.values(banks).flat().length);assert.equal(g.run('totalCoins()'),Object.values(banks).flat().length);
 assert.equal(g.run('musicTarget'),.065);assert.equal(g.e.score.paused,false);g.run('for(let i=0;i<30;i++)frame(last+80)');assert(Math.abs(g.e.score.volume-.065)<.005);
 assert.equal(g.calls.plays.at(-1),'reunionVoice');assert.equal(g.e.storyArt.src,'echo-art/finale-1.webp');g.endAudio('reunionVoice');assert.equal(g.calls.plays.at(-1),'melodyVoice');g.endAudio('melodyVoice');assert.equal(g.calls.plays.at(-1),'homeVoice');assert.equal(g.e.storyArt.src,'echo-art/finale-3.webp');
 assert.deepEqual(g.calls.motionShows,[{url:'echo-art/finale-1.webp',index:0},{url:'echo-art/finale-2.webp',index:1},{url:'echo-art/finale-3.webp',index:2}]);const stops=g.calls.motionStops;
 g.endAudio('homeVoice');assert.equal(g.run('mode'),'fading');assert.equal(g.run('musicTarget'),0);assert.equal(g.run('completed'),true);assert.equal(g.run('outro'),false);assert.equal(g.e.endingScreen.hidden,false);assert(g.e.endingScreen.classList.contains('revealed'));assert(!g.e.endingScreen.classList.contains('complete'));assert.equal(g.calls.motionStops,stops,'illustration lives through fade');
 g.run('for(let i=0;i<43;i++)frame(last+80)');assert(g.e.score.volume<.001);g.elapse(3499);assert.equal(g.run('mode'),'fading');g.elapse(1);assert.equal(g.run('mode'),'finished');assert(g.e.endingScreen.classList.contains('complete'));assert.equal(g.e.score.paused,true);assert(g.calls.motionStops>stops);assert(g.e.playAgain.focused);assert.equal(g.e.menu.hidden,true);assert.equal(g.calls.errors.length,0);
 const builds=g.calls.builds.length;g.e.playAgain.onclick();assert.equal(g.context.location.href,MAIN_MENU);assert.equal(g.calls.builds.length,builds,'ending button navigates instead of local replay');assert.deepEqual(JSON.parse(g.memory[KEY]),{level:0,unlocked:9,seen:false,completed:false,outro:false,coins:{}});
 console.log('PASS actual controller: 10 unique transitions, 1020 persistent coins, door once/course,3 narrated/moving scenes, music duck/fade, timed black SLUT and reset-to-main-menu');
}
{
 const g=makeGame({level:0,seen:true,completed:false});await flush();g.hold();g.e.levelSelect.value='7';const change=g.e.levelSelect.fire('change');assert.equal(g.run('mode'),'loading');assert.equal(g.run('level'),7);assert.equal(g.e.levelSelect.disabled,true);g.calls.loads.at(-1).resolve();await change;assert.equal(g.run('mode'),'ready');assert.equal(g.e.title.textContent,track.COURSE_NAMES[7]);assert.equal(JSON.parse(g.memory[KEY]).level,7);await g.e.go.onclick();assert.equal(g.run('mode'),'run');assert.equal(g.e.chapter.textContent,'FLÖJTENS EKO · 8 / 10');
 g.run('while(!physics.pendingFork()){time+=STEP;tick()}');await g.e.left.fire('pointerdown');assert.equal(g.run('physics.choice'),-1);assert.equal(g.calls.highlights.at(-1),g.run("physics.pendingFork().safeSide===-1?physics.pendingFork().safeRoute:physics.pendingFork().deadRoute"));g.key('ArrowRight');assert.equal(g.run('physics.choice'),1);
 assert(!g.e.junction);assert(!g.e.junctionText);assert(!g.e.junctionHint);assert(!/sekunder till växeln/i.test(Object.values(g.e).map(e=>e.textContent).join(' ')));
 g.key('Escape');assert.equal(g.run('mode'),'pause');await g.e.go.onclick();assert.equal(g.run('mode'),'run');g.key('r');assert.equal(g.run('physics.s'),0);
 console.log('PASS loading/manual picker, immediate mobile/keyboard choices, rail-only selection feedback, pause and checkpoint restart');
}
{
 const g=makeGame({level:0,seen:true});await flush();await g.e.go.onclick();
 g.run(`while(physics.routeId!=='main-1'){const s=physics.snapshot();if(s.pending)select(s.pending.safeSide);if(s.canJump)physics.jump();time+=STEP;tick()}while(!physics.pendingFork()){time+=STEP;tick()}select(-physics.pendingFork().safeSide);while(physics.respawns===0){time+=STEP;tick()}`);
 assert.equal(g.run('physics.routeId'),'main-1');const saved=JSON.parse(g.memory[KEY]),count=saved.coins[0].length;assert(count>0);assert.equal(saved.cp.routeId,'main-1');const plays=g.calls.coinSounds.length;
 g.run(`while(!physics.pendingFork()){time+=STEP;tick()}select(-physics.pendingFork().safeSide);while(physics.respawns===1){time+=STEP;tick()}`);
 assert.equal(JSON.parse(g.memory[KEY]).coins[0].length,count);assert.equal(g.calls.coinSounds.length,plays,'retry cannot award the same coins');
 const reload=makeGame(JSON.parse(g.memory[KEY]));await flush();assert.equal(reload.run('coinState.summary().courseCount'),count);assert.equal(reload.run('physics.routeId'),'main-1');await reload.e.go.onclick();reload.run(`while(!physics.pendingFork()){time+=STEP;tick()}select(-physics.pendingFork().safeSide);while(physics.respawns===0){time+=STEP;tick()}`);assert.equal(reload.calls.coinSounds.length,0);assert.equal(JSON.parse(reload.memory[KEY]).coins[0].length,count);
 console.log('PASS coin bank survives real death, checkpoint retry and page reload without duplicate pickup/audio');
}
{
 const g=makeGame({level:9,seen:true,completed:true,outro:false,coins:{0:['cave-coin-v1/0/main-0/0']},cp:{routeId:'main-7',s:0}});await flush();assert.equal(g.run('mode'),'finished');assert.equal(g.e.endingScreen.hidden,false);assert(g.e.endingScreen.classList.contains('complete'));assert.equal(g.e.menu.hidden,true);assert.equal(g.e.score.paused,true);const builds=g.calls.builds.length;await g.e.go.onclick();assert.equal(g.calls.builds.length,builds);assert.equal(g.run('mode'),'finished');g.e.playAgain.onclick();assert.equal(g.context.location.href,MAIN_MENU);assert.equal(Object.keys(JSON.parse(g.memory[KEY]).coins).length,0);
 console.log('PASS completed save opens ending directly; replay clears cave round and navigates home');
}
{
 const g=makeGame({level:9,seen:true,completed:false,outro:true});await flush();await g.e.go.onclick();assert.equal(g.run('mode'),'story');assert.equal(g.calls.plays.at(-1),'reunionVoice');assert.equal(g.run('musicTarget'),.065);g.e.skip.onclick();assert.equal(g.run('mode'),'fading');g.elapse(3500);assert.equal(g.run('mode'),'finished');assert.equal(g.run('completed'),true);
 const arrived=makeGame({level:9,completed:true,seen:true,coins:{9:['cave-coin-v1/9/main-0/0']}},'?from=aqueduct');await flush();assert.equal(arrived.run('level'),0);assert.equal(arrived.run('mode'),'story');assert.equal(arrived.run('totalCoins()'),0);arrived.finishOpening();assert.equal(arrived.run('mode'),'run');
 console.log('PASS interrupted outro recovery/skip, automatic world3 arrival resets round and narrates intro');
}
{
 const g=makeGame({level:0,seen:true});await flush();g.fail();g.e.levelSelect.value='4';await g.e.levelSelect.fire('change');assert.equal(g.run('mode'),'error');assert.equal(g.e.go.disabled,false);await g.e.go.onclick();assert(g.calls.reloaded);
 console.log('PASS picker material error exposes working retry');
}
{
 const g=makeGame({level:0,seen:true});await flush();await g.e.go.onclick();g.fail();g.driveLevel();await flush();assert.equal(g.run('mode'),'error');assert.equal(g.e.title.textContent,'Nästa grotta kunde inte öppnas');assert.equal(g.e.go.disabled,false);
 console.log('PASS next-course material failure exposes retry without double advance');
}
{
 const earlier=createCoinLayout(track.createCourse(0)).slice(0,4).map(c=>c.id),later=createCoinLayout(track.createCourse(6)).slice(0,8).map(c=>c.id);
 const saved={level:6,seen:true,completed:false,outro:false,coins:{0:earlier,6:later},cp:{routeId:'main-2',s:0}};
 const g=makeGame(saved,'?from=aqueduct&resume=1');await flush();assert.equal(g.run('level'),6);assert.equal(g.run('mode'),'run');assert.equal(g.run('physics.routeId'),'main-2');assert.equal(g.run('physics.s'),0);assert.equal(g.run('seen'),true);assert.equal(g.run('coinState.summary().courseCount'),later.length);assert.equal(g.run('totalCoins()'),earlier.length+later.length);assert.equal(g.e.chapter.textContent,'FLÖJTENS EKO · 7 / 10');assert(!g.calls.plays.includes('caveVoice'),'recovery must not replay a completed intro');assert.deepEqual(g.calls.builds,[6]);
 const persisted=JSON.parse(g.memory[KEY]);assert.equal(persisted.level,6);assert.deepEqual(persisted.cp,saved.cp);assert.deepEqual([...persisted.coins[0]].sort(),[...earlier].sort());assert.deepEqual([...persisted.coins[6]].sort(),[...later].sort());assert.equal(persisted.completed,false);
 console.log('PASS aqueduct resume preserves later course, checkpoint and both existing coin banks, starts without redoing intro');
}
{
 const ids=createCoinLayout(track.createCourse(9)).map(c=>c.id),g=makeGame({level:9,seen:true,completed:true,outro:false,coins:{9:ids},cp:{routeId:'main-7',s:0}},'?from=aqueduct&resume=1');await flush();assert.equal(g.run('level'),9);assert.equal(g.run('mode'),'finished');assert.equal(g.run('completed'),true);assert.equal(g.run('physics.routeId'),'main-7');assert.equal(g.e.endingScreen.hidden,false);assert(g.e.endingScreen.classList.contains('complete'));assert.equal(g.e.menu.hidden,true);assert.equal(g.e.score.paused,true);assert.equal(g.run('totalCoins()'),ids.length);assert.equal(g.calls.motionShows.length,0);assert(!g.calls.plays.includes('caveVoice'));assert.deepEqual(g.calls.builds,[9]);assert.equal(JSON.parse(g.memory[KEY]).completed,true);
 console.log('PASS aqueduct resume of a completed save stays on black SLUT and retains collected coins');
}
{
 const g=makeGame(undefined,'?from=aqueduct&resume=1');await flush();assert.equal(g.run('level'),0);assert.equal(g.run('mode'),'story');assert.equal(g.run('physics.routeId'),'main-0');assert.equal(g.run('totalCoins()'),0);assert.equal(g.calls.plays.at(-1),'caveVoice');assert.equal(g.run('seen'),false);g.finishOpening();assert.equal(g.run('mode'),'run');assert.equal(g.run('seen'),true);assert.equal(g.e.chapter.textContent,'FLÖJTENS EKO · 1 / 10');
 // A save that has not actually watched the intro is also a fresh arrival.
 const unstarted=makeGame({level:5,seen:false,completed:false,coins:{5:['cave-coin-v1/5/main-0/0']},cp:{routeId:'main-2',s:0}},'?from=aqueduct&resume=1');await flush();assert.equal(unstarted.run('level'),0);assert.equal(unstarted.run('mode'),'story');assert.equal(unstarted.run('physics.routeId'),'main-0');assert.equal(unstarted.run('totalCoins()'),0);
 console.log('PASS aqueduct resume without an eligible save starts fresh and narrates the intro');
}
