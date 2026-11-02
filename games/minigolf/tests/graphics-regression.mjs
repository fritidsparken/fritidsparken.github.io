import assert from 'node:assert/strict';
import {boundarySegments} from '../boundary.mjs';
import {courses} from '../courses.mjs';import {Physics,nearest} from '../physics.mjs';
function simulate(p,a,power){const q=new Physics(p.c);Object.assign(q,p);q.events=[];q.safe=[p.x,p.y,p.z];q.shoot(Math.sin(a),-Math.cos(a),power);for(let i=0;i<3300&&!q.rest;i++)q.step(1/120);return q;}
for(const c of courses){for(const offset of [-.9,0,.9]){const degree=new Map();for(const line of boundarySegments(c,.3,offset))for(const p of line){assert(p.every(Number.isFinite));const key=[p[0],p[2]].map(n=>n.toFixed(5)).join(',');degree.set(key,(degree.get(key)||0)+1);}assert([...degree.values()].every(n=>n%2===0),c.name+' closed contour');}let p=new Physics(c),strokes=0,target=1;const log=[];while(!p.sunk&&strokes<60){while(target<c.path.length-1&&Math.hypot(p.x-c.path[target][0],p.z-c.path[target][2])<2)target++;
 const n=nearest(c,p.x,p.z);if(n.i>target)target=n.i+1;target=Math.min(target,c.path.length-1);
 let best=null,score=Infinity;const goal=c.path[target],base=Math.atan2(goal[0]-p.x,-(goal[2]-p.z));
 for(const offset of [0,-.06,.06,-.15,.15,-.3,.3])for(let power=.02;power<=1.001;power+=.035){const q=simulate(p,base+offset,power);let d=Math.hypot(q.x-goal[0],q.z-goal[2]);if(q.events.includes('reset'))d+=100;if(q.sunk)d=-10000;const nn=nearest(c,q.x,q.z);if(nn.i>=target)d-=30+(nn.i-target)*5;if(d<score){score=d;best=q;}}
 if(!best)break;p=best;strokes++;log.push([+p.x.toFixed(1),+p.z.toFixed(1)]);if(p.events.some(e=>['cannon','portal','loop','logShortcut'].includes(e))){const nn=nearest(c,p.x,p.z);target=Math.max(target,nn.i+1);}}
 assert(p.sunk,c.name+' must be completable');console.log(JSON.stringify({hole:c.id+1,complete:p.sunk,strokes,last:log.slice(-3)}));}
