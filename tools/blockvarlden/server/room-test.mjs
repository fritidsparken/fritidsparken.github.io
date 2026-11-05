import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {Room} from './worker.mjs';
const db=new DatabaseSync(':memory:'),values=new Map(),sockets=[];
const ctx={storage:{get:k=>values.get(k),put:(k,v)=>values.set(k,v),sql:{exec(sql,...args){return db.prepare(sql).all(...args)}}},acceptWebSocket:s=>sockets.push(s),getWebSockets:()=>sockets.filter(s=>!s.closed)};
class Socket{
 messages=[];
 send(m){this.messages.push(JSON.parse(m))}
 serializeAttachment(v){this.peer=structuredClone(v)}
 deserializeAttachment(){return structuredClone(this.peer)}
 close(){this.closed=true}
}
globalThis.WebSocketPair=class{constructor(){this[0]={};this[1]=new Socket()}};
globalThis.Response=class{constructor(_,opts){Object.assign(this,opts)}};
let room=new Room(ctx);
const open=create=>room.fetch(new Request('https://test/',{headers:{'X-Code':'ABCDEFGH','X-Create':String(create)}}));
const msg=(s,m)=>room.webSocketMessage(s,JSON.stringify(m));
await open(true);const a=sockets[0],owner=a.messages[0].owner;
await msg(a,{type:'join',owner});await open(false);const b=sockets[1];await msg(b,{type:'join'});
const cell=[2,32,3,4];await msg(a,{type:'edit',cell});assert.deepEqual(b.messages.at(-1).cell,cell);
await msg(b,{type:'pose',p:[1,32,2,0]});assert.equal(a.messages.at(-1).type,'pose');
await msg(a,{type:'lock',owner,value:true});await open(false);const c=sockets[2];await msg(c,{type:'join'});assert.ok(c.closed);assert.equal(c.messages.length,1);
await msg(a,{type:'lock',owner,value:false});a.close();b.close();room=new Room(ctx);
await open(false);const d=sockets.at(-1);await msg(d,{type:'join'});assert.deepEqual(d.messages.find(m=>m.type==='ready').cells,[cell]);
for(let i=1;i<8;i++)await open(false);assert.equal((await open(false)).status,409);
console.log('Shared edits, movement, lock, stored world and eight-player cap passed.');
