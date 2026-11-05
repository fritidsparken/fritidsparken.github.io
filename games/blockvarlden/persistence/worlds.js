import {sanitizeFauna} from '../entities/actors.js';
const db=new Promise((resolve,reject)=>{const req=indexedDB.open('blockvarlden-expedition',1);req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore('worlds',{keyPath:'id'});d.createObjectStore('edits',{keyPath:['world','key']}).createIndex('world','world')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
const result=req=>new Promise((ok,no)=>{req.onsuccess=()=>ok(req.result);req.onerror=()=>no(req.error)});
async function write(fn){const d=await db;return new Promise((ok,no)=>{const tx=d.transaction(['worlds','edits'],'readwrite');tx.oncomplete=ok;tx.onabort=()=>no(tx.error||Error('Skrivningen avbröts'));fn(tx.objectStore('worlds'),tx.objectStore('edits'))})}
export async function list(){const d=await db;return (await result(d.transaction('worlds').objectStore('worlds').getAll())).sort((a,b)=>b.updated-a.updated)}
export async function readEdits(id){const d=await db;return (await result(d.transaction('edits').objectStore('edits').index('world').getAll(id))).map(e=>e.value)}
export function save(meta,changes=[]){const copy=structuredClone({...meta,updated:Date.now()});return write((w,e)=>{w.put(copy);for(const value of changes)e.put({world:meta.id,key:value.slice(0,3).join(','),value})})}
export function remove(id){return write((w,e)=>{w.delete(id);const req=e.index('world').openCursor(IDBKeyRange.only(id));req.onsuccess=()=>{const c=req.result;if(c){c.delete();c.continue()}}})}
export function fresh(name,mode,seed,difficulty){return {id:crypto.randomUUID(),name:name.trim().slice(0,64)||'Min blockvärld',mode,seed:String(seed||Math.floor(Math.random()*1e8)),difficulty,updated:Date.now(),bag:{2:12,3:10,31:8},slots:[1,2,3,4,6,31,88,106,139],props:[],life:10,food:10,time:.33}}
export async function migrate(){const key='fritidsparken-blockvarlden-v1',raw=localStorage.getItem(key);if(!raw||localStorage.getItem(key+'-imported'))return;const s=JSON.parse(raw);if(s.v!==1||!Array.isArray(s.blocks))return;
 const m=fresh('Min tidigare blockvärld',s.mode,'Min första värld','Lätt');m.id='legacy-v1';if(!(await list()).some(w=>w.id===m.id)){m.legacy=true;if(s.person)m.position=[s.person[0]+.5,s.person[1]-1.05,s.person[2]+.5];m.bag=Object.fromEntries((s.inventory||[]).map((n,i)=>[i+1,n]));await save(m,s.blocks.filter(([k,t])=>/^-?\d+,-?\d+,-?\d+$/.test(k)&&t>=0&&t<6).map(([k,t])=>[...k.split(',').map(Number),t+1]))}localStorage.setItem(key+'-imported','1')}
export function validateImport(v,defs,props){if(v?.version!==2||!v.world||!Array.isArray(v.edits)||v.edits.length>500000)throw Error('Okänt filformat');const s=v.world;
 if(!['survival','creative'].includes(s.mode)||typeof s.name!=='string'||typeof s.seed!=='string'||!v.edits.every(e=>Array.isArray(e)&&e.length===4&&e.every(Number.isSafeInteger)&&e[1]>=0&&e[1]<80&&(e[3]===0||defs[e[3]])))throw Error('Ogiltig värld');
 const m=fresh(s.name,s.mode,s.seed,['Lätt','Normal','Utmanande'].includes(s.difficulty)?s.difficulty:'Lätt'),point=p=>Array.isArray(p)&&p.length===3&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<1e7);
 const validId=k=>Object.hasOwn(defs,k)||props.includes(k);
 const counts=obj=>Object.fromEntries(Object.entries(obj||{}).filter(([k,n])=>validId(k)&&Number.isSafeInteger(n)&&n>=0));
 m.fly=s.fly===true;m.quiet=s.quiet===true;m.fauna=sanitizeFauna(s.fauna);
 m.drops=Array.isArray(s.drops)?s.drops.filter(r=>r&&validId(r.id)&&point(r.p)&&Number.isInteger(r.count)&&r.count>0&&r.count<=64).map(r=>({id:r.id,count:r.count,p:r.p,ready:0})):[];
 if(point(s.position))m.position=s.position;
 for(const k of ['yaw','pitch'])if(Number.isFinite(s[k]))m[k]=s[k];
 m.wear=counts(s.wear);m.removed=Array.isArray(s.removed)?s.removed.filter(k=>typeof k==='string'&&/^-?\d+,-?\d+$/.test(k)):[];
 m.containers=Object.fromEntries(Object.entries(s.containers||{}).filter(([k])=>/^-?\d+,\d+,-?\d+$/.test(k)).map(([k,v])=>[k,{items:counts(v?.items)}]));
 m.crops=Object.fromEntries(Object.entries(s.crops||{}).filter(([k,v])=>/^-?\d+,\d+,-?\d+$/.test(k)&&Number.isFinite(v)));
 if(Number.isFinite(s.time))m.time=s.time%1;m.legacy=s.legacy===true;m.props=Array.isArray(s.props)?s.props.filter(p=>p&&props.includes(p.id)&&point(p.p)).map(p=>({id:p.id,p:p.p,rot:Number.isFinite(p.rot)?p.rot:0,open:p.open===true,items:counts(p.items),crop:Number.isFinite(p.crop)?p.crop:0})):[];m.bag=Object.fromEntries(Object.entries(s.bag||{}).filter(([k,n])=>(defs[k]||props.includes(k))&&Number.isSafeInteger(n)&&n>=0));if(Array.isArray(s.slots)&&s.slots.length===9&&s.slots.every(k=>defs[k]||props.includes(k)))m.slots=s.slots;
 for(const k of ['life','food'])if(Number.isFinite(s[k]))m[k]=Math.max(0,Math.min(10,s[k]));return m}
