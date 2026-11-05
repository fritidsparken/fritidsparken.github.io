const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function skateRoute(url,env){
 const creating=url.pathname==='/skate/create';
 const code=creating?Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>alphabet[n%32]).join(''):url.pathname.slice(7);
 const park=url.searchParams.get('park');
 if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code)||creating&&!/^[0-3]$/.test(park))return new Response('Ogiltigt rum',{status:404});
 return env.SKATE.get(env.SKATE.idFromName(code)).fetch('https://room/'+code+(creating?'?park='+park:''),{headers:{Upgrade:'websocket'}});
}
export class SkateRoom{
 constructor(ctx){this.ctx=ctx}
 async fetch(req){
  const url=new URL(req.url),code=url.pathname.slice(1);
  let park=await this.ctx.storage.get('park');
  if(url.searchParams.has('park')){
   if(park!==undefined)return new Response('Upptaget',{status:409});
   park=Number(url.searchParams.get('park'));await this.ctx.storage.put('park',park);
  }
  if(park===undefined||this.ctx.getWebSockets().length>=8)return new Response('Saknas eller fullt',{status:409});
  const [client,ws]=Object.values(new WebSocketPair()),id=crypto.randomUUID();
  this.ctx.acceptWebSocket(ws);ws.serializeAttachment({id});
  ws.send(JSON.stringify({kind:'room',code,id,park}));
  for(const peer of this.ctx.getWebSockets()){const s=peer.deserializeAttachment();if(s.pose)ws.send(JSON.stringify({kind:'ride',id:s.id,pose:s.pose}))}
  return new Response(null,{status:101,webSocket:client});
 }
 broadcast(sender,m){const data=JSON.stringify(m);for(const ws of this.ctx.getWebSockets())if(ws!==sender)try{ws.send(data)}catch{}}
 webSocketMessage(ws,raw){
  if(typeof raw!=='string'||raw.length>1024)return ws.close(1008,'Format');
  let pose;try{pose=JSON.parse(raw)}catch{return ws.close(1008,'Format')}
  if(!Array.isArray(pose)||pose.length!==28||pose.some(n=>!Number.isFinite(n)||Math.abs(n)>1e8))return ws.close(1008,'Pose');
  const peer=ws.deserializeAttachment(),now=Date.now();
  if(now-peer.last<65)return;
  Object.assign(peer,{pose,last:now});ws.serializeAttachment(peer);this.broadcast(ws,{kind:'ride',id:peer.id,pose});
 }
 webSocketClose(ws){this.broadcast(ws,{kind:'leave',id:ws.deserializeAttachment().id})}
}
