import assert from 'node:assert/strict';
import {PhotoWorkshop} from '../games/hemlyckan/photo-workshop.js';
import {ROOMS} from '../games/hemlyckan/data.js';
let imageDraws=[];const ctx=new Proxy({drawImage:(image,...args)=>imageDraws.push({src:image.src,args})},{get:(target,key)=>target[key]||(()=>{})});
globalThis.Image=class{complete=true;naturalWidth=1200;};globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
const canvas={getContext:()=>ctx,addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:1200,height:750}),setPointerCapture(){}};
for(const room of ROOMS)for(let step=0;step<room.tasks.length;step++){
 let workshop;const work=[];imageDraws=[];
 workshop=new PhotoWorkshop({canvas,room,step,tier:3,work,onWork:(i,amount)=>{work[i]=Math.min(1,(work[i]||0)+amount);workshop.sync(work);}});
 assert.equal(imageDraws.length,1);assert.equal(imageDraws[0].src,`assets/${room.id}-0.webp`);assert.deepEqual(imageDraws[0].args,[0,0,1200,750]);
 const event=p=>({pointerId:1,button:0,clientX:p.x*1200,clientY:p.y*750,preventDefault(){}});
 if(room.tasks[step].tool==='connect')for(const pair of workshop.pairs()){workshop.down(event(pair.a));workshop.move(event(pair.b));workshop.up(event(pair.b));}
 else for(const cell of workshop.cells()){workshop.down(event(cell));workshop.up(event(cell));}
 assert.equal(work.filter(v=>v===1).length,workshop.count(),`${room.id} ${step} can finish with direct touch`);
 assert(imageDraws.every(d=>d.src===`assets/${room.id}-0.webp`),'never composites an after image over before');
 workshop.dispose();assert.equal(workshop.disposed,true);
}
console.log('PASS: all 76 photo tasks preserve the original before image and support direct touch/connection controls.');
