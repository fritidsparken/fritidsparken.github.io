export const SAVE_KEY='fp-glow-studio-v1';
export function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s?.version===1)return{version:1,xp:Math.max(0,Number(s.xp)||0),visits:Math.max(0,Number(s.visits)||0),muted:!!s.muted,portfolio:Array.isArray(s.portfolio)?s.portfolio.filter(x=>typeof x==='string'&&x.startsWith('data:image/jpeg')).slice(-6):[]};}catch{}return{version:1,xp:0,visits:0,muted:false,portfolio:[]};}
export function save(state){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export const level=xp=>1+Math.floor(xp/150);
