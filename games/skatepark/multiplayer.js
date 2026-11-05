import {loadSunnyRider} from './sunny-rider.js?v=rail-3';
const server='wss://fritidsparken-github-io.th8kdfmyr7.workers.dev/skate/';
const colors=[0x59aacc,0xff9944,0x995ed3,0x39ac79];
function packet(p,k){
 const phase=v=>v?Math.min(1,v.t/v.duration):0;
 return [p.x,p.y,p.z,p.dir,p.stance,p.spin,p.speed,p.vy,+p.air,p.slope||0,p.deckYaw,p.recover,p.settle,p.manual??-1,p.rail?.id??-1,p.flip?.id??-1,phase(p.flip),p.stunt?.id??-1,phase(p.stunt),p.loop?.a||0,p.loop?.sign||0,p.loop?.track.r||1,p.loop?.track.drift||0,p.spinCount,Number(k.go)||0,(k.right||0)-(k.left||0),p.total,p.combo.at(-1)??-1].map(n=>Math.round(n*1000)/1000);
}
function unpack(v){
 const [x,y,z,dir,stance,spin,speed,vy,air,slope,deckYaw,recover,settle,manual,rail,flip,ft,stunt,st,a,sign,r,drift,spinCount,go,steer]=v;
 return {x,y,z,dir,stance,spin,speed,vy,air,slope,deckYaw,recover,settle,spinCount,manual:manual<0?null:manual,rail:rail<0?null:{id:rail},flip:flip<0?null:{id:flip,t:ft,duration:1},stunt:stunt<0?null:{id:stunt,t:st,duration:1},loop:sign?{a,sign,track:{r,drift}}:null,controls:{go,right:steer,left:0}};
}
function release(peer){
 peer.rider?.dispose();peer.group.removeFromParent();
 peer.group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of [].concat(o.material))m.dispose()}o.skeleton?.dispose()});
}
export function openSession(code,park,api){
 const socket=new WebSocket(server+(code||'create?park='+park));
 const peers=new Map(),latest=new Map();
 let room='',scene=null,last=0,previous='',ended=false;
 const timer=setTimeout(()=>socket.close(),12000);
 function remove(id){latest.delete(id);const peer=peers.get(id);if(peer){peers.delete(id);release(peer)}}
 function renderPeer(id,v){
  if(!scene)return;
  let peer=peers.get(id);
  if(!peer){
   const group=new THREE.Group();scene.add(group);peer={group};peers.set(id,peer);
   const tint=colors[parseInt(id[0],16)%colors.length];
   loadSunnyRider(group,true,tint,null).then(rider=>{peer.rider=rider;if(!group.parent)release(peer)}).catch(()=>{release(peer)});
  }
  peer.target=unpack(v);
 }
 socket.onmessage=async e=>{
  const m=JSON.parse(e.data);
  if(m.kind==='room'){
   room=m.code;clearTimeout(timer);
   try{const built=await api.start(m.park);if(ended)return;scene=built;for(const [id,v] of latest)renderPeer(id,v);api.status(room,latest.size+1)}
   catch{socket.close()}
  }else if(m.kind==='ride'){const fresh=!latest.has(m.id);latest.set(m.id,m.pose);renderPeer(m.id,m.pose);if(fresh&&scene)api.status(room,latest.size+1)}
  else if(m.kind==='leave'){remove(m.id);if(scene)api.status(room,latest.size+1)}
 };
 function dispose(){clearTimeout(timer);for(const id of [...latest.keys()])remove(id);ended=true}
 socket.onclose=()=>{if(!ended){dispose();api.lost(room)}};
 return {close(){dispose();socket.close()},frame(p,k,dt,now){
  if(!scene)return;
  for(const peer of peers.values()){
   const t=peer.target;if(!peer.rider||!t)continue;
   const curr=peer.position??={x:t.x,y:t.y,z:t.z};
   for(const key of ['x','y','z'])curr[key]+=(t[key]-curr[key])*(1-Math.exp(-dt*22));
   peer.rider.update({...t,...curr},t.controls,dt,false);
  }
  if(now-last<110||socket.readyState!==1)return;
  const msg=JSON.stringify(packet(p,k));if(msg!==previous){socket.send(msg);previous=msg}last=now;
 }};
}
