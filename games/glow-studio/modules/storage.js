export const SAVE_KEY='fp-glow-studio-v1';
const validCount=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(10000000,Math.floor(Number(v)))):0;
export function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s?.version===1)return{version:1,xp:validCount(s.xp),visits:validCount(s.visits),muted:!!s.muted,portfolio:Array.isArray(s.portfolio)?s.portfolio.filter(x=>typeof x==='string'&&x.startsWith('data:image/jpeg')).slice(-6):[]};}catch{}return{version:1,xp:0,visits:0,muted:false,portfolio:[]};}
export function save(state){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export const level=xp=>1+Math.floor(xp/150);
