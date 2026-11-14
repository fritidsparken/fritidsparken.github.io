import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const read=p=>fs.readFileSync(path.join(root,'dist',p.replace(/^current\//,'')),'utf8');
async function boot(saved={},options={}){
 const calls={navigation:[],chimes:0,frames:[],sounds:[]}, storage=new Map([['lostWorlds.moon.v2',JSON.stringify(saved)]]),els=new Map();
 const ctx=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{})});
 const element=id=>{if(!els.has(id))els.set(id,{id,hidden:false,disabled:false,clientWidth:1280,clientHeight:720,width:1280,height:720,value:'0',style:{},textContent:'',append(){},replaceChildren(){},play:()=>Promise.resolve(),pause(){},getContext:()=>ctx,setPointerCapture(){},hasPointerCapture:()=>false,getBoundingClientRect:()=>({left:0}),offsetWidth:110});return els.get(id)};
 const sandbox={console,Math,Number,JSON,Set,Map,Array,URLSearchParams,performance:{now:()=>0},devicePixelRatio:1,Image:class{width=1672;height=941;decode(){return Promise.resolve()}},
  document:{getElementById:element,addEventListener(){},createElement:()=>({})},localStorage:{getItem:k=>{if(options.storageThrows)throw Error('closed');return storage.get(k)??null},setItem:(k,v)=>{if(options.storageThrows)throw Error('closed');storage.set(k,v)}},
  location:{search:options.search||'',replace:url=>{if(options.navigationThrows)throw Error('replace');calls.navigation.push(url)},assign:url=>{if(options.navigationThrows)throw Error('assign');calls.navigation.push(url)},reload:()=>calls.navigation.push('reload')},
  addEventListener(){},requestAnimationFrame:f=>calls.frames.push(f),waterPainter:()=>null,paintWaterFallback(){},loadSoundEffects(){},stopEffects(){},enablePickupAudio(){},movementSounds(){},playEffect:(...a)=>calls.sounds.push(a),actionSound(){},pickupChime(){calls.chimes++},PALACE_ART:{},moonReader:{playing:false},introPlayed:true,startIntro(){},
 };
 const context=vm.createContext(sandbox);
 for(const f of ['current/palace/rooms.js','current/palace/simulation.js','current/palace/render.js','current/moon-levels.js','current/moon-boss.js','moon.js'])vm.runInContext(read(f),context,{filename:f});
 await new Promise(r=>setImmediate(r));
 return {get:code=>vm.runInContext(code,context),run:code=>vm.runInContext(code,context),calls,storage,els};
}
// Main-world save resumes in actual boss arena; physics can walk all the way to
// the portal after defeat, and the navigation request occurs only once.
{
 const g=await boot({stage:9,unlocked:9,introPlayed:true,bossHits:[420,842,1300]});
 assert.equal(g.get('warden.phase'),'defeated');
 g.run("startPlay();Object.assign(game.p,{x:1300,y:654,ground:true});keys.add('ArrowRight')");
 for(let i=0;i<400&&g.calls.navigation.length===0;i++)g.run('tick(1/120)');
 assert.equal(g.calls.navigation[0],'cave.html?from=aqueduct');assert(g.get('game.p.x')>=1500);
 g.run('tick(1/120);continueToCave();continueToCave()');assert.equal(g.calls.navigation.length,1);
 const save=JSON.parse(g.storage.get('lostWorlds.moon.v2'));assert.equal(save.finished,true);assert.equal(g.storage.get('lostWorlds.cave'),'1');
 console.log('PASS defeated boss → actual reachable portal → exactly one automatic cave handoff');
}
// Reaching the far wall always starts the next world, including while jumping.
{
 const g=await boot({stage:9,unlocked:9,introPlayed:true});g.run('startPlay();game.p.x=1602;game.p.ground=false;game.p.y=635;game.p.vy=-20;tick(1/120)');assert.equal(g.calls.navigation.length,1,'Reaching the wall must start the next world');
 console.log('PASS far wall triggers handoff even during boss fight and while jumping');
}
{
 const g=await boot({stage:9,finished:true,introPlayed:true});assert.deepEqual(g.calls.navigation,['cave.html?from=aqueduct&resume=1']);assert.equal(g.calls.frames.length,0,'Completed-save handoff does not wait for image downloads');
 const replay=await boot({stage:9,finished:true,unlocked:9},{search:'?from=menu'});assert.equal(replay.calls.navigation.length,0);replay.els.get('levelSelect').value='0';replay.els.get('levelSelect').onchange();assert.equal(replay.get('finished'),false);assert.equal(replay.get('stage'),0);
 console.log('PASS stalled completed saves auto-continue; explicit menu selection still permits replay');
}
{
 const g=await boot({}, {storageThrows:true});g.run('stage=9;enter();warden.phase="defeated";warden.hits=new Set(locks);game.p.x=1602;startPlay();tick(1/120)');assert.equal(g.calls.navigation.length,1);
 console.log('PASS blocked localStorage cannot stop world handoff');
}
{
 const g=await boot({stage:9,finished:true},{navigationThrows:true});assert.equal(g.get('transitioning'),false);assert.equal(g.els.get('go').textContent,'Till värld 4');g.els.get('go').onclick();assert.equal(g.calls.navigation.length,0);assert.equal(g.get('transitioning'),false);
 console.log('PASS navigation failure offers retry without forcing reload loop');
}
// Every chapter has coins positioned above actual floors with stable IDs.
for(let stage=0;stage<10;stage++){
 const g=await boot({stage,unlocked:9,introPlayed:true});const count=g.get('coins.length');assert(count>=3,`Level${stage+1} needs reachable coins`);
 assert(g.get('coins.every(c=>game.all[c.surface]&&c.x>=game.all[c.surface][0]&&c.x<=game.all[c.surface][1]&&Math.abs(c.y-(H(game.all[c.surface],c.x)-84))<1e-8)'));
 const coin=g.get('coins[0]');g.run(`Object.assign(game.p,{x:${coin.x+80},y:${coin.y+84},dead:0});collectMoonCoins({x:${coin.x-80},y:${coin.y+84},dead:0},game.p)`);
 assert(g.get(`collectedCoins.has('${coin.id}')`));assert.equal(g.calls.chimes,1);assert.equal(g.get('route.pickups[0].combo'),1);
 const points=g.get('route.points');g.run(`game.fail('fall');game.spawn();collectMoonCoins({x:${coin.x},y:${coin.y+84},dead:0},{x:${coin.x},y:${coin.y+84},dead:0})`);assert.equal(g.get('route.points'),points);
 const reload=await boot(JSON.parse(g.storage.get('lostWorlds.moon.v2')));assert.equal(reload.get('route.points'),points);assert(reload.get(`collectedCoins.has('${coin.id}')`));
 console.log(`PASS chapter${stage+1}: ${count} reachable coins, swept pickup, checkpoint/reload persistence, no duplicate awards`);
}
{
 const g=await boot({stage:0,introPlayed:true});g.run('startPlay();const target=coins[0];Object.assign(game.p,{x:target.x,y:target.y+84,dead:.001});tick(1/120)');assert.equal(g.get('route.points'),0,'Respawn teleport cannot sweep coins');
 g.run('render()');assert(g.get('route.pickups.length')===0);
 assert(read('moon.js').includes('drawPickupFeedback(ctx,route,hudX,hudY)'));
 console.log('PASS respawn does not collect through world; original shared coin and pickup render functions run');
}
