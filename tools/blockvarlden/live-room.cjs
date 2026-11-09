const WebSocket=require('ws');
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const origin='https://fritidsparken.se';
const host=process.env.BLOCKVARLDEN_ROOM_HOST||'fritidsparken-github-io.th8kdfmyr7.workers.dev';
const opened=new Set();
const code=()=>`QA-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`.toUpperCase();
function socket(path,options={}){
 const ws=new WebSocket('wss://'+host+path,{headers:{Origin:origin}}),events=[];
 const connection={ws,events,send:data=>ws.send(JSON.stringify(data)),close:()=>ws.close()};
 opened.add(ws);
 ws.on('message',raw=>{const msg=JSON.parse(String(raw));events.push(msg);if(msg.type==='welcome'&&options.join!==false)connection.send({type:'join',name:options.name||'QA-spelare',owner:options.owner||msg.owner})});
 ws.on('error',error=>{connection.error=error});
 connection.wait=(predicate,label)=>new Promise((resolve,reject)=>{
  const started=Date.now();
  const poll=()=>{
   const found=events.find(predicate);
   if(found)return resolve(found);
   if(connection.error)return reject(connection.error);
   if(ws.readyState===WebSocket.CLOSED)return reject(Error(`Connection closed while waiting for ${label}: ${JSON.stringify(events)}`));
   if(Date.now()-started>15000)return reject(Error(`Timed out waiting for ${label}: ${JSON.stringify(events)}`));
   setTimeout(poll,25);
  };poll();
 });
 connection.joined=()=>connection.wait(m=>m.type==='joined','joined');
 return connection;
}
function createPath(room,settings){return '/create/'+room+'?'+new URLSearchParams({v:'3',quiet:settings.quiet?'1':'0',mode:settings.mode,difficulty:settings.difficulty})}
const sameCell=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
async function testRoom(settings){
 const room=code(),a=socket(createPath(room,settings),{name:'QA-värd'});
 const joinedA=await a.joined(),welcomeA=a.events.find(m=>m.type==='welcome');
 assert.equal(welcomeA.protocol,3);assert.equal(welcomeA.code,room);assert.ok(welcomeA.owner);assert.equal(joinedA.host,true);
 assert.deepEqual(welcomeA.settings,settings);assert.deepEqual(joinedA.settings,settings);
 const duplicate=socket(createPath(room,settings),{join:false});
 assert.match((await duplicate.wait(m=>m.type==='error','duplicate code rejection')).message,/används/);duplicate.close();
 // Guests deliberately supply conflicting settings. Only the creator's stored settings may win.
 const b=socket('/'+room.toLowerCase()+'?'+new URLSearchParams({v:'3',quiet:settings.quiet?'0':'1',mode:settings.mode==='creative'?'survival':'creative',difficulty:'Utmanande'}),{name:'QA-kompis'});
 const joinedB=await b.joined(),welcomeB=b.events.find(m=>m.type==='welcome');
 assert.deepEqual(joinedB.settings,settings);assert.deepEqual(welcomeB.settings,settings);assert.equal(joinedB.host,false);assert.equal(welcomeB.owner,undefined);
 if(settings.mode==='survival'){
  const legacy=socket('/'+room,{join:false});assert.match((await legacy.wait(m=>m.type==='error','outdated client rejection')).message,/Ladda om/);legacy.close();
 }
 const harvestKey='6,9';a.send({type:'harvest',key:harvestKey});b.send({type:'harvest',key:harvestKey});
 const harvestA=await a.wait(m=>m.type==='harvest'&&m.key===harvestKey,'shared harvest winner');
 const harvestB=await b.wait(m=>m.type==='harvest'&&m.key===harvestKey,'shared harvest acknowledgement');
 assert.equal(harvestA.id,harvestB.id);assert.ok([welcomeA.id,welcomeB.id].includes(harvestA.id));
 const loser=harvestA.id===welcomeA.id?b:a;
 await loser.wait(m=>m.type==='harvest-denied'&&m.key===harvestKey,'duplicate harvest rejection');
 const pose=[12,37,-24,1.2];a.send({type:'pose',p:pose});
 const seen=await b.wait(m=>m.type==='pose'&&m.id===welcomeA.id,'named host position');
 assert.deepEqual(seen.p,pose);assert.equal(seen.name,'QA-värd');
 const cell=[2,38,2,4];a.send({type:'edit',cell});
 await b.wait(m=>m.type==='edit'&&sameCell(m.cell,cell),'shared block');
 const guestPose=[-4,39,22,-.4];b.send({type:'pose',p:guestPose});
 const seenB=await a.wait(m=>m.type==='pose'&&m.id===welcomeB.id,'named guest position');
 assert.deepEqual(seenB.p,guestPose);assert.equal(seenB.name,'QA-kompis');
 // Departing hosts must not remove the room or reset the creator's settings.
 a.close();await b.wait(m=>m.type==='leave'&&m.id===welcomeA.id,'host departure');
 const c=socket('/'+room+'?v=3',{name:'QA-sen-kompis'});
 assert.deepEqual((await c.joined()).settings,settings);
 assert.ok(c.events.some(m=>m.type==='harvested'&&m.removed.includes(harvestKey)),'late joiner sees harvested vegetation');
 const snapshot=c.events.flatMap(m=>m.cells||[]);assert.ok(snapshot.some(v=>sameCell(v,cell)),'saved block survives host departure');
 const existing=c.events.find(m=>m.type==='pose'&&m.id===welcomeB.id);assert.ok(existing,'late joiner sees already connected friend without waiting for movement');assert.deepEqual(existing.p,guestPose);assert.equal(existing.name,'QA-kompis');
 // Old hidden-settings writes must not override the authoritative settings.
 b.send({type:'edit',cell:[999999,79,999999,settings.quiet?1:2]});
 const d=socket('/'+room+'?v=3',{name:'QA-kontroll'});assert.deepEqual((await d.joined()).settings,settings);
 assert.ok(!d.events.flatMap(m=>m.cells||[]).some(v=>v[0]===999999&&v[1]===79&&v[2]===999999),'reserved setting stays outside the world');
 for(const peer of [b,c,d])peer.close();
 console.log(`PASS ${settings.mode}, ${settings.quiet?'without animals':'with animals'}, ${settings.difficulty}: custom code, authoritative settings, names, positions, shared block and host departure`);
}
async function testConcurrentCreate(){
 const room=code(),settings=[{quiet:true,mode:'survival',difficulty:'Normal'},{quiet:false,mode:'creative',difficulty:'Lätt'}];
 const peers=settings.map((setting,i)=>socket(createPath(room,setting),{name:'QA-create-'+i}));
 const first=await Promise.all(peers.map(peer=>peer.wait(m=>m.type==='welcome'||m.type==='error','competing create result')));
 assert.equal(first.filter(m=>m.type==='welcome').length,1,'exactly one concurrent creator wins');
 assert.equal(first.filter(m=>m.type==='error').length,1,'other concurrent creator is rejected');
 const winner=first.findIndex(m=>m.type==='welcome');assert.deepEqual((await peers[winner].joined()).settings,settings[winner]);
 const guest=socket('/'+room+'?v=3');assert.deepEqual((await guest.joined()).settings,settings[winner],'losing create never overwrites settings');
 for(const peer of [...peers,guest])peer.close();
 console.log('PASS simultaneous creation preserves one owner and one settings record');
}
async function run(){
 const response=await fetch('https://'+host+'/health');assert.equal(response.status,200);
 const health=await response.json();assert.equal(health.service,'blockvarlden-room');assert.equal(health.protocol,3,'the new multiplayer server must be deployed first');
 const unknown=socket('/'+code()+'?v=3',{join:false});assert.match((await unknown.wait(m=>m.type==='error','missing room rejection')).message,/Ingen värld/);unknown.close();
 await testConcurrentCreate();
 await testRoom({quiet:true,mode:'survival',difficulty:'Normal'});
 await testRoom({quiet:false,mode:'creative',difficulty:'Lätt'});
 console.log('All live multiplayer protocol checks passed. Only unique QA rooms were used.');
}
run().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{for(const ws of opened){if(ws.readyState!==WebSocket.CLOSED)ws.terminate()}});
