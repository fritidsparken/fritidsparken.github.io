import {skateRoute} from './skate-room.mjs';
export {SkateRoom} from './skate-room.mjs';
const origins=new Set(['https://fritidsparken.se','https://www.fritidsparken.se']);
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const legacySettingsCell=r=>r.x===999999&&r.y===79&&r.z===999999&&(r.id===1||r.id===2);
export const normalizeRoomCode=value=>String(value||'').trim().toUpperCase();
export const validRoomCode=value=>/^[A-Z0-9-]{3,24}$/.test(value);
const settingsFrom=value=>({quiet:value?.quiet===true,mode:value?.mode==='survival'?'survival':'creative',difficulty:['Lätt','Normal','Utmanande'].includes(value?.difficulty)?value.difficulty:'Lätt'});
const playerName=value=>String(value||'Spelare').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,20)||'Spelare';
function socketError(message){const pair=new WebSocketPair();pair[1].accept();pair[1].send(JSON.stringify({type:'error',message}));pair[1].close(1008,'Room unavailable');return new Response(null,{status:101,webSocket:pair[0]})}
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/health')return Response.json({service:'blockvarlden-room',protocol:3});
  if(!origins.has(request.headers.get('Origin')))return new Response('Forbidden',{status:403});
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
  if(path.startsWith('/skate/'))return skateRoute(url,env);
  const create=path==='/create'||path.startsWith('/create/');
  if(create&&url.searchParams.get('v')!=='3')return socketError('Ladda om Blockvärlden för att skapa en värld med de nya inställningarna.');
  let rawCode=path.startsWith('/create/')?path.slice(8):path.slice(1);
  try{rawCode=decodeURIComponent(rawCode)}catch{return new Response('Invalid code',{status:400})}
  const code=path==='/create'?Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>alphabet[b%32]).join(''):normalizeRoomCode(rawCode);
  if(!validRoomCode(code))return new Response('Invalid code',{status:400});
  const settings=settingsFrom({quiet:url.searchParams.get('quiet')==='1',mode:url.searchParams.get('mode'),difficulty:url.searchParams.get('difficulty')});
  return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request,{headers:{Upgrade:'websocket','X-Code':code,'X-Create':String(create),'X-Settings':JSON.stringify(settings),'X-Protocol':url.searchParams.get('v')==='3'?'3':'1'}});
 }
};
export class Room {
 constructor(ctx){this.ctx=ctx;this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS blocks(x INTEGER,y INTEGER,z INTEGER,id INTEGER,PRIMARY KEY(x,y,z))');this.sql.exec('CREATE TABLE IF NOT EXISTS harvested(key TEXT PRIMARY KEY)')}
 async settings(){
  let settings=await this.ctx.storage.get('settings');
  if(!settings){
   let quiet=false;
   for(const r of this.sql.exec('SELECT x,y,z,id FROM blocks WHERE x=? AND y=? AND z=?',999999,79,999999))if(legacySettingsCell(r))quiet=r.id===2;
   settings=settingsFrom({quiet});await this.ctx.storage.put('settings',settings);
  }
  return settingsFrom(settings);
 }
 async fetch(req){
  const code=req.headers.get('X-Code'),create=req.headers.get('X-Create')==='true';
  let owner=await this.ctx.storage.get('owner');
  if(create&&owner)return socketError('Koden används redan. Välj en annan kod eller gå med i världen.');
  if(!create&&!owner)return socketError('Ingen värld hittades med den koden. Kontrollera koden med den som skapade världen.');
  if(this.ctx.getWebSockets().length>=8)return socketError('Världen är full. Högst åtta spelare kan vara med samtidigt.');
  if(create){
   owner=await this.ctx.blockConcurrencyWhile(async()=>{
    if(await this.ctx.storage.get('owner'))return null;
    const token=crypto.randomUUID();let s={};try{s=JSON.parse(req.headers.get('X-Settings')||'{}')}catch{}
    await this.ctx.storage.put({owner:token,settings:settingsFrom(s)});return token;
   });
   if(!owner)return socketError('Koden används redan. Välj en annan kod eller gå med i världen.');
  }
  const settings=await this.settings();
  if(req.headers.get('X-Protocol')!=='3'&&settings.mode==='survival')return socketError('Ladda om Blockvärlden för att gå med i den här överlevnadsvärlden.');
  const pair=new WebSocketPair(),ws=pair[1],id=crypto.randomUUID();
  this.ctx.acceptWebSocket(ws);
  ws.serializeAttachment({id,last:0,protocol:req.headers.get('X-Protocol')==='3'?3:1});
  ws.send(JSON.stringify({type:'welcome',protocol:3,code,id,settings,owner:create?owner:undefined,locked:!!(await this.ctx.storage.get('locked'))}));
  return new Response(null,{status:101,webSocket:pair[0]});
 }
 broadcast(msg){const data=JSON.stringify(msg);for(const ws of this.ctx.getWebSockets())try{if(ws.deserializeAttachment()?.joined)ws.send(data)}catch{}}
 async webSocketMessage(ws,raw){
  if(typeof raw!=='string'||raw.length>512)return ws.close(1008,'Invalid');
  let m;try{m=JSON.parse(raw)}catch{return ws.close(1008,'Invalid')}
  const peer=ws.deserializeAttachment();
  if(!peer||!m||typeof m!=='object')return;
  if(!peer.joined){
   if(m.type!=='join')return ws.close(1008,'Join required');
   if(await this.ctx.storage.get('locked')&&m.owner!==await this.ctx.storage.get('owner')){ws.send(JSON.stringify({type:'error',message:'Världen är låst. Be skaparen att öppna den.'}));return ws.close(1008,'Locked')}
   peer.joined=true;peer.name=playerName(m.name);peer.host=m.owner===await this.ctx.storage.get('owner');ws.serializeAttachment(peer);
   const settings=await this.settings();let cells=[];
   for(const r of this.sql.exec('SELECT x,y,z,id FROM blocks')){if(legacySettingsCell(r))continue;cells.push([r.x,r.y,r.z,r.id]);if(cells.length===500){ws.send(JSON.stringify({type:'cells',cells}));cells=[]}}
   // Compatibility snapshot for older clients; new clients receive authoritative settings separately.
   if(peer.protocol<3)cells.push([999999,79,999999,settings.quiet?2:1]);
   let removed=[];for(const r of this.sql.exec('SELECT key FROM harvested')){removed.push(r.key);if(removed.length===500){ws.send(JSON.stringify({type:'harvested',removed}));removed=[]}}
   ws.send(JSON.stringify({type:'harvested',removed}));
   ws.send(JSON.stringify({type:'ready',cells,settings}));
   for(const other of this.ctx.getWebSockets()){const p=other.deserializeAttachment();if(other!==ws&&p?.joined&&p.p)ws.send(JSON.stringify({type:'pose',id:p.id,name:p.name,p:p.p}))}
   return ws.send(JSON.stringify({type:'joined',settings,host:peer.host}));
  }
  if(m.type==='lock'&&peer.host){await this.ctx.storage.put('locked',!!m.value);this.broadcast({type:'locked',value:!!m.value});return}
  const now=Date.now();if(now-(peer.window||0)>1000){peer.window=now;peer.count=0}
  if(++peer.count>40)return ws.close(1008,'Too fast');
  ws.serializeAttachment(peer);
  if(m.type==='pose'&&Array.isArray(m.p)&&m.p.length===4&&m.p.every(n=>Number.isFinite(n)&&Math.abs(n)<1e6)){
   peer.p=m.p;ws.serializeAttachment(peer);this.broadcast({type:'pose',id:peer.id,name:peer.name,p:m.p});return;
  }
  if(m.type==='harvest'){
   if(typeof m.key!=='string'||!/^(-?\d{1,7}),(-?\d{1,7})$/.test(m.key))return;
   const [x,z]=m.key.split(',').map(Number);if(Math.abs(x)>1e6||Math.abs(z)>1e6||m.key!==x+','+z)return;
   if([...this.sql.exec('SELECT key FROM harvested WHERE key=?',m.key)].length){ws.send(JSON.stringify({type:'harvest-denied',key:m.key}));return}
   this.sql.exec('INSERT OR IGNORE INTO harvested VALUES(?)',m.key);this.broadcast({type:'harvest',key:m.key,id:peer.id});return;
  }
  if(m.type!=='edit'||!Array.isArray(m.cell)||m.cell.length!==4||!m.cell.every(Number.isSafeInteger))return;
  const [x,y,z,id]=m.cell;
  if(Math.abs(x)>1e6||Math.abs(z)>1e6||y<1||y>=80||id<0||id>144)return;
  if(x===999999&&y===79&&z===999999)return;
  this.sql.exec('INSERT OR REPLACE INTO blocks VALUES(?,?,?,?)',x,y,z,id);
  this.broadcast({type:'edit',cell:m.cell});
 }
 webSocketClose(ws){const peer=ws.deserializeAttachment();if(peer?.joined)this.broadcast({type:'leave',id:peer.id})}
}
