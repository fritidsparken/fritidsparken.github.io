import {GOODS,total,canAdd,findPath,blocked,restoreStock} from './logic.js';
export const START_MONEY=150,WAGE=30,SHELF_X=[-7,0,7];
export const OBSTACLES=[...SHELF_X.map(x=>({x,z:-.8,w:3.5,d:5.2})),{x:6.9,z:5.6,w:5.9,d:3.3},{x:0,z:-8.8,w:6.5,d:1.3}];
export function restoreProfile(raw={}){const wallet=Number.isFinite(raw.wallet)?Math.max(0,Math.floor(raw.wallet)):START_MONEY;let basket=[];for(const id of (Array.isArray(raw.basket)?raw.basket:[]))if(canAdd(basket,id,wallet))basket.push(id);return {wallet,trips:Math.max(0,Number(raw.trips)||0),customers:Math.max(0,Number(raw.customers)||0),salary:Math.max(0,Number(raw.salary)||0),sound:raw.sound!==false,stock:restoreStock(raw.stock,basket),restockPending:raw.restockPending===true,basket,cartTaken:raw.cartTaken===true};}
export function settle(profile,mode,items){const value=total(items);if(mode==='shop'){if(value>profile.wallet)return false;profile.wallet-=value;profile.trips++;profile.basket=[];profile.cartTaken=false;profile.restockPending=true;}else{profile.wallet+=WAGE;profile.salary+=WAGE;profile.customers++;}return true;}
export function direction(angle){const n=(Math.round(angle/(Math.PI/4))+8)%8;return {key:n===0||n===4?'straight':n===2||n===6?'side':n===1||n===7?'front':'back',mirror:n>4,row:n===4?1:0};}
export function walkFrame(distance,count=8){return Math.floor((distance%1.65)/1.65*count)%count;}
export function makeBelt(ids){return ids.map((id,i)=>({id,x:-.09-i*.17,scan:0,done:false}));}
export function stepBelt(items,scanned,dt){let moving=false;for(let i=scanned;i<items.length;i++){const item=items[i];if(item.scan||item.done)continue;const target=.36-(i-scanned)*.155;const next=Math.min(target,item.x+dt*.15);if(next>item.x+1e-6)moving=true;item.x=next;}return moving;}
export function beltReady(items,scanned){return !!items[scanned]&&!items[scanned].scan&&items[scanned].x>=.359;}
export function route(start,end){return findPath(start,end,OBSTACLES);}
export function advance(player,path,input,dt){const old={x:player.x,z:player.z};let dx=input.x,dz=input.z;const manual=Math.hypot(dx,dz)>.08;if(manual)path.length=0;
 if(!manual&&path.length){let p=path[0];dx=p.x-player.x;dz=p.z-player.z;if(Math.hypot(dx,dz)<.04){player.x=p.x;player.z=p.z;path.shift();if(path.length){p=path[0];dx=p.x-player.x;dz=p.z-player.z;}else{dx=0;dz=0;}}}
 const len=Math.hypot(dx,dz);player.speed+=(len>.02?2.65:0)-player.speed>0?Math.min(dt*8,2.65-player.speed):-Math.min(dt*12,player.speed);
 if(len>.02){let step=player.speed*dt;if(!manual)step=Math.min(step,len);const wx=dx/len*step,wz=dz/len*step;if(!blocked(player.x+wx,player.z,OBSTACLES))player.x+=wx;if(!blocked(player.x,player.z+wz,OBSTACLES))player.z+=wz;const target=Math.atan2(dx,dz),diff=Math.atan2(Math.sin(target-player.angle),Math.cos(target-player.angle));player.angle+=diff*Math.min(1,dt*16);}
 const moved=Math.hypot(player.x-old.x,player.z-old.z);player.distance+=moved;player.moving=moved>.0001;return moved;}
