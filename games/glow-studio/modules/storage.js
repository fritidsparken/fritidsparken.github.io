export const SAVE_KEY='fp-glow-studio-v1';
const validCount=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(10000000,Math.floor(Number(v)))):0;
const base=s=>({version:2,xp:validCount(s?.xp),visits:validCount(s?.visits),muted:!!s?.muted,portfolio:[]});
export function load(){
 try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(s?.version===2)return{...base(s),portfolio:Array.isArray(s.portfolio)?s.portfolio.filter(x=>typeof x==='string'&&x.startsWith('data:image/jpeg')).slice(-6):[]};
  if(s?.version===1)return base(s);
 }catch{}
 return base(null);
}
export function save(state){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export const level=xp=>1+Math.floor(xp/150);
