import {decodeActor} from '../entities/actors.js?v=varld2';
let avatar;
const localGet=key=>{try{return localStorage.getItem(key)}catch{return null}};
const localSet=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
export async function connect(server,options,api){
 const code=String(options.code||'').trim().toUpperCase(),creating=options.action==='create';
 if(!/^[A-Z0-9-]{3,24}$/.test(code))throw Error('Koden ska innehålla 3–24 bokstäver, siffror eller bindestreck.');
 const name=String(options.name||'Spelare').trim().slice(0,20)||'Spelare';
 avatar??=fetch('../../assets/blockvarlden/actors/stigfinnare.glb').then(r=>r.arrayBuffer()).then(decodeActor).catch(e=>{avatar=null;throw e});
 const model=await avatar;
 const params=new URLSearchParams({v:'3'});
 if(creating){const s=options.settings||{};params.set('quiet',s.quiet===true?'1':'0');params.set('mode',s.mode==='survival'?'survival':'creative');params.set('difficulty',s.difficulty||'Lätt')}
 const ws=new WebSocket(server.replace(/\/$/,'')+'/'+(creating?'create/':'')+encodeURIComponent(code)+'?'+params),peers=new Map(),pendingHarvest=new Map(),cells=[],queued=[];
 let id,room,owner,isHost=false,locked=false,active=false,closed=false,last=-Infinity,previous='',started=false,roomSettings,errorMessage='';
 const send=m=>{if(ws.readyState===1)ws.send(JSON.stringify(m))};
 const disposePeers=()=>{for(const peer of peers.values())peer.dispose();peers.clear();for(const request of pendingHarvest.values()){clearTimeout(request.timer);request.resolve(false)}pendingHarvest.clear()};
 function update(m){
  if(m.type==='edit')api.edit(m.cell);
  if(m.type==='harvest'||m.type==='harvest-denied'){
   if(m.type==='harvest')api.harvest?.(m.key);
   const pending=pendingHarvest.get(m.key);if(pending){clearTimeout(pending.timer);pendingHarvest.delete(m.key);pending.resolve(m.type==='harvest'&&m.id===id)}
  }
  if(m.type==='locked'){locked=m.value;api.status(room,isHost,locked)}
  if(m.type==='leave'){peers.get(m.id)?.dispose();peers.delete(m.id)}
  if(m.type==='pose'&&m.id!==id&&Array.isArray(m.p)&&m.p.length===4&&m.p.every(Number.isFinite)){
   let peer=peers.get(m.id);
   if(!peer){peer=model.instantiate();api.scene().add(peer.root);peer.play('idle');peer.walk=0;peers.set(m.id,peer)}
   const [x,y,z,yaw]=m.p;peer.name=String(m.name||'Spelare').slice(0,20);peer.p=[x,y,z];peer.yaw=yaw;
   peer.walk=peer.root.position.distanceTo(new THREE.Vector3(x,y,z))>.03?.3:0;
   peer.root.position.set(x,y,z);peer.root.rotation.y=yaw+Math.PI;
  }
 }
 const session={
  code,name,removed:[],
  players:()=>Array.from(peers,([id,p])=>({id,name:p.name,p:[...p.p],yaw:p.yaw})),
  edit:cell=>send({type:'edit',cell}),
  harvest(key){
   if(ws.readyState!==1||pendingHarvest.has(key))return Promise.resolve(false);
   return new Promise(resolve=>{const timer=setTimeout(()=>{pendingHarvest.delete(key);resolve(false)},7000);pendingHarvest.set(key,{resolve,timer});send({type:'harvest',key})});
  },
  lock:()=>{if(isHost)send({type:'lock',owner,value:!locked})},
  frame(dt,p,yaw){
   for(const peer of peers.values()){peer.walk-=dt;peer.play(peer.walk>0?'walk':'idle');peer.mixer.update(dt)}
   if(performance.now()-last<170)return;
   const pose=[p.x,p.y,p.z,yaw].map(n=>Math.round(n*100)/100),key=pose.join();
   if(key===previous&&performance.now()-last<3000)return;
   previous=key;last=performance.now();send({type:'pose',p:pose});
  },
  close(){closed=true;ws.close();disposePeers()}
 };
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{errorMessage='Anslutningen tog för lång tid. Försök igen.';ws.close()},15000);
  ws.onclose=()=>{clearTimeout(timeout);disposePeers();if(!active)reject(Error(errorMessage||'Det gick inte att ansluta till världen. Kontrollera anslutningen och försök igen.'));if(!closed&&started)api.lost()};
  ws.onmessage=async e=>{
   try{
    const m=JSON.parse(e.data);
    if(m.type==='error'){errorMessage=String(m.message||'Det gick inte att öppna världen.');reject(Error(errorMessage));ws.close();return}
    if(m.type==='welcome'){
     if(m.protocol!==3||!m.settings)throw Error('Spelservern uppdateras. Vänta en stund och försök igen.');
     id=m.id;room=m.code;locked=!!m.locked;roomSettings=m.settings;owner=m.owner||localGet('bv-owner-'+room);
     if(m.owner)localSet('bv-owner-'+room,owner);send({type:'join',owner,name});return;
    }
    if(m.type==='harvested'){session.removed.push(...m.removed);return}
    if(m.type==='cells'||m.type==='ready'){cells.push(...m.cells);if(m.settings)roomSettings=m.settings;return}
    if(m.type==='joined'){
     if(started)return;started=true;isHost=m.host===true;roomSettings=m.settings||roomSettings;
     if(!roomSettings||typeof roomSettings.quiet!=='boolean'||!['creative','survival'].includes(roomSettings.mode))throw Error('Världens inställningar kunde inte hämtas.');
     clearTimeout(timeout);await api.start(room,cells,session,roomSettings);
     if(ws.readyState!==1)return;
     active=true;api.status(room,isHost,locked);for(const msg of queued)update(msg);queued.length=0;resolve();return;
    }
    if(active)update(m);else queued.push(m);
   }catch(err){errorMessage=err.message;reject(err);ws.close()}
  };
 });
}
