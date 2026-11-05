import {decodeActor} from '../entities/actors.js';
let avatar;
export async function connect(server,code,api){
 avatar??=fetch('../../assets/blockvarlden/actors/stigfinnare.glb').then(r=>r.arrayBuffer()).then(decodeActor).catch(e=>{avatar=null;throw e});
 const model=await avatar;
 const ws=new WebSocket(server+'/'+(code||'create')),peers=new Map(),cells=[],queued=[];
 let id,room,owner,locked=false,active=false,closed=false,last=0,previous='',started=false;
 const send=m=>{if(ws.readyState===1)ws.send(JSON.stringify(m))};
 function update(m){
  if(m.type==='edit')api.edit(m.cell);
  if(m.type==='locked'){locked=m.value;api.status(room,!!owner,locked)}
  if(m.type==='leave'){peers.get(m.id)?.dispose();peers.delete(m.id)}
  if(m.type==='pose'&&m.id!==id){
   let peer=peers.get(m.id);
   if(!peer){peer=model.instantiate();api.scene().add(peer.root);peer.play('idle');peers.set(m.id,peer)}
   const [x,y,z,yaw]=m.p;peer.walk=peer.root.position.distanceTo(new THREE.Vector3(x,y,z))>.03?.3:0;
   peer.root.position.set(x,y,z);peer.root.rotation.y=yaw+Math.PI;
  }
 }
 const session={
  edit:cell=>send({type:'edit',cell}),
  lock:()=>send({type:'lock',owner,value:!locked}),
  frame(dt,p,yaw){
   for(const peer of peers.values()){peer.walk-=dt;peer.play(peer.walk>0?'walk':'idle');peer.mixer.update(dt)}
   if(performance.now()-last<170)return;
   const pose=[p.x,p.y,p.z,yaw].map(n=>Math.round(n*100)/100),key=pose.join();
   if(key===previous&&performance.now()-last<3000)return;
   previous=key;last=performance.now();send({type:'pose',p:pose});
  },
  close(){closed=true;ws.close();for(const peer of peers.values())peer.dispose();peers.clear()}
 };
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>ws.close(),15000);
  ws.onclose=()=>{clearTimeout(timeout);if(!active)reject(Error('Rummet gick inte att öppna. Kontrollera koden. Rummet kan vara fullt eller låst.'));if(!closed&&started)api.lost()};
  ws.onmessage=async e=>{
   try{
    const m=JSON.parse(e.data);
    if(m.type==='welcome'){id=m.id;room=m.code;locked=m.locked;owner=m.owner||localStorage.getItem('bv-owner-'+room);if(m.owner)localStorage.setItem('bv-owner-'+room,owner);send({type:'join',owner});return}
    if(m.type==='cells'||m.type==='ready'){cells.push(...m.cells);return}
    if(m.type==='joined'){clearTimeout(timeout);started=true;await api.start(room,cells,session);if(ws.readyState!==1)return;active=true;api.status(room,!!owner,locked);for(const msg of queued)update(msg);resolve();return}
    if(active)update(m);else queued.push(m);
   }catch(err){reject(err);ws.close()}
  };
 });
}
