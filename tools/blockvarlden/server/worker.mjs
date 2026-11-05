import {skateRoute} from './skate-room.mjs';
export {SkateRoom} from './skate-room.mjs';
const origins=new Set(['https://fritidsparken.se','https://www.fritidsparken.se']);
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export default {
 async fetch(request,env){
  if(!origins.has(request.headers.get('Origin')))return new Response('Forbidden',{status:403});
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
  const path=new URL(request.url).pathname;
  if(path.startsWith('/skate/'))return skateRoute(new URL(request.url),env);
  const create=path==='/create';
  const code=create?Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>alphabet[b%32]).join(''):path.slice(1);
  if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))return new Response('Unknown room',{status:404});
  return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request,{headers:{Upgrade:'websocket','X-Code':code,'X-Create':String(create)}});
 }
};
export class Room {
 constructor(ctx){this.ctx=ctx;this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS blocks(x INTEGER,y INTEGER,z INTEGER,id INTEGER,PRIMARY KEY(x,y,z))')}
 async fetch(req){
  const code=req.headers.get('X-Code');
  let owner=await this.ctx.storage.get('owner');
  const create=req.headers.get('X-Create')==='true';
  if(create===!!owner)return new Response('Room unavailable',{status:404});
  if(create){owner=crypto.randomUUID();await this.ctx.storage.put('owner',owner)}
  if(this.ctx.getWebSockets().length>=8)return new Response('Room full',{status:409});
  const pair=new WebSocketPair(),ws=pair[1],id=crypto.randomUUID();
  this.ctx.acceptWebSocket(ws);
  ws.serializeAttachment({id,last:0});
  ws.send(JSON.stringify({type:'welcome',code,id,owner:create?owner:undefined,locked:!!(await this.ctx.storage.get('locked'))}));
  return new Response(null,{status:101,webSocket:pair[0]});
 }
 broadcast(msg){const data=JSON.stringify(msg);for(const ws of this.ctx.getWebSockets())try{if(ws.deserializeAttachment()?.joined)ws.send(data)}catch{}}
 async webSocketMessage(ws,raw){
  if(typeof raw!=='string'||raw.length>512)return ws.close(1008,'Invalid');
  let m;try{m=JSON.parse(raw)}catch{return ws.close(1008,'Invalid')}
  const peer=ws.deserializeAttachment();
  if(!m||typeof m!=='object')return;
  if(!peer.joined){
   if(m.type!=='join')return ws.close(1008,'Join required');
   if(await this.ctx.storage.get('locked')&&m.owner!==await this.ctx.storage.get('owner'))return ws.close(1008,'Locked');
   peer.joined=true;ws.serializeAttachment(peer);
  let cells=[];
  for(const r of this.sql.exec('SELECT x,y,z,id FROM blocks')){cells.push([r.x,r.y,r.z,r.id]);if(cells.length===500){ws.send(JSON.stringify({type:'cells',cells}));cells=[]}}
  ws.send(JSON.stringify({type:'ready',cells}));
   return ws.send('{"type":"joined"}');
  }
  if(m.type==='lock'&&m.owner===await this.ctx.storage.get('owner')){await this.ctx.storage.put('locked',!!m.value);this.broadcast({type:'locked',value:!!m.value});return}
  const now=Date.now();if(now-(peer.window||0)>1000){peer.window=now;peer.count=0}
  if(++peer.count>40)return ws.close(1008,'Too fast');
  ws.serializeAttachment(peer);
  if(m.type==='pose'&&Array.isArray(m.p)&&m.p.length===4&&m.p.every(n=>Number.isFinite(n)&&Math.abs(n)<1e6)){
   this.broadcast({type:'pose',id:peer.id,p:m.p});return;
  }
  if(m.type!=='edit'||!Array.isArray(m.cell)||m.cell.length!==4||!m.cell.every(Number.isSafeInteger))return;
  const [x,y,z,id]=m.cell;
  if(Math.abs(x)>1e6||Math.abs(z)>1e6||y<1||y>=80||id<0||id>144)return;
  this.sql.exec('INSERT OR REPLACE INTO blocks VALUES(?,?,?,?)',x,y,z,id);
  this.broadcast({type:'edit',cell:m.cell});
 }
 webSocketClose(ws){this.broadcast({type:'leave',id:ws.deserializeAttachment().id})}
}
