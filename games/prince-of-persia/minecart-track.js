/** Fixed world-space mine rail graph and deterministic fixed-step cart physics.
 * Travel is +Z; camera screen-right is -X when looking forward with Y up.
 * No renderer, DOM, animation-clock or external dependency is used here.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const vec=(x=0,y=0,z=0)=>({x,y,z});
const add=(a,b)=>vec(a.x+b.x,a.y+b.y,a.z+b.z);
const mul=(a,k)=>vec(a.x*k,a.y*k,a.z*k);
const sub=(a,b)=>vec(a.x-b.x,a.y-b.y,a.z-b.z);
const norm=a=>{const n=Math.hypot(a.x,a.y,a.z)||1;return mul(a,1/n)};
const lerp=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const smooth=t=>(t=clamp(t,0,1),t*t*(3-2*t));
const GRAVITY=18;
const safePatterns=[[-1,1,-1],[1,-1,-1,1],[-1,1,1,-1],[1,1,-1,1,-1],[-1,1,-1,-1,1]];
const names=['Lyktgången','Blådjupet','Kristallvalvet','Koppargruvan','Flöjtens källa'];
function makeRoute(id,kind,from,to,fn){
 const steps=Math.max(2,Math.ceil((to-from)*4)),points=[],arc=[0],tangents=[];
 for(let i=0;i<=steps;i++){const t=from+(to-from)*i/steps;points.push(fn(t));tangents.push(norm(sub(fn(t+.02),fn(t-.02))));if(i)arc.push(arc[i-1]+Math.hypot(...Object.values(sub(points[i],points[i-1]))))}
 const route={id,kind,points,arc,length:arc.at(-1),gaps:[],progressStart:0};
 route.sample=s=>{s=clamp(s,0,route.length);let a=0,b=arc.length-1;while(a+1<b){const m=(a+b)>>1;if(arc[m]<=s)a=m;else b=m}const t=(s-arc[a])/(arc[b]-arc[a]||1);return{position:lerp(points[a],points[b],t),tangent:norm(lerp(tangents[a],tangents[b],t))}};
 return route;
}
export function createCourse(level=0){
 level=clamp(Math.floor(level)||0,0,4);const phase=level*.56;
 const base=z=>vec(6*Math.sin(z/47+phase)-6*Math.sin(phase)+3*Math.sin(z/113),1.4*Math.sin(z/37+phase)-1.4*Math.sin(phase)+.52*Math.sin(z/13),z);
 const routes=[],routeMap=new Map(),junctions=[],pits=[];let cursor=0,progress=0;
 const push=r=>{routes.push(r);routeMap.set(r.id,r);return r};
 const branchFn=(at,side,safe)=>z=>{const t=z-at,offset=t<24?smooth(t/24):safe?1-smooth((t-36)/26):1;const p=base(z);p.x-=side*7.5*offset;return p};
 for(let i=0;i<safePatterns[level].length;i++){
  const at=60+i*98,safeSide=safePatterns[level][i];
  const main=push(makeRoute('main-'+i,'main',cursor,at,base));main.progressStart=progress;progress+=main.length;
  const safe=push(makeRoute('safe-'+i,'safe',at,at+62,branchFn(at,safeSide,true)));safe.progressStart=progress;
  const dead=push(makeRoute('dead-'+i,'dead',at,at+32,branchFn(at,-safeSide,false)));dead.progressStart=progress;
  const junction={id:i,position:main.sample(main.length).position,safeSide,entryRoute:main.id,safeRoute:safe.id,deadRoute:dead.id};
  main.fork=junction;safe.next='main-'+(i+1);junctions.push(junction);
  const tip=dead.sample(dead.length);pits.push({position:tip.position,direction:tip.tangent,width:12,depth:55,routeId:dead.id});
  progress+=safe.length;cursor=at+62;
 }
 const terminal=push(makeRoute('main-'+safePatterns[level].length,'main',cursor,cursor+88,base));terminal.progressStart=progress;
 // One clearly marked jumpable break per cavern. Ordinary dead ends cannot be jumped.
 const start=31,end=35;terminal.gaps.push({start,end,worldStart:terminal.sample(start).position,worldEnd:terminal.sample(end).position});
 progress+=terminal.length;
 return {level,name:names[level],routes,routeMap,startRoute:'main-0',finish:terminal.sample(terminal.length).position,finishTangent:terminal.sample(terminal.length).tangent,junctions,pits,length:progress,baseSpeed:14+level*1.2,maxSpeed:23+level*1.4,minSpeed:6};
}
export class CartPhysics{
 constructor(course){this.course=course;this.checkpoint={routeId:course.startRoute,s:0};this.respawns=0;this.travel=0;this.restart(false)}
 get route(){return this.course.routeMap.get(this.routeId)}
 restart(count=false){this.routeId=this.checkpoint.routeId;this.s=this.checkpoint.s;this.status='run';this.speed=0;this.choice=0;this.locked=false;this.jumpHeight=0;this.jumpVelocity=0;this.jumpQueued=false;this.fallTime=0;this.fallVelocity=vec();this.fallPosition=null;this.distanceSinceReset=0;if(count)this.respawns++;return this.snapshot()}
 snapshotCheckpoint(){return {...this.checkpoint}}
 restoreCheckpoint(cp){if(!cp||typeof cp.routeId!=='string')return false;const r=this.course.routeMap.get(cp.routeId);if(!r||r.kind!=='main')return false;/* Only route starts are genuine checkpoints. */this.checkpoint={routeId:r.id,s:0};this.restart(false);return true}
 pendingFork(){const r=this.route;if(this.status!=='run'||!r.fork)return null;const distance=r.length-this.s;return distance<=48?{...r.fork,distance,choice:this.choice,defaultSide:-1}:null}
 nextGap(){const g=this.route.gaps.find(g=>g.end>=this.s);return g?{...g,distance:g.start-this.s,length:g.end-g.start}:null}
 choose(side){if((side!==-1&&side!==1)||!this.pendingFork()||this.locked)return false;this.choice=side;return true}
 jump(){const gap=this.nextGap();if(this.status!=='run'||this.jumpHeight>0||!gap||gap.distance<0||gap.distance>14)return false;this.jumpQueued=true;return true}
 beginFall(position,tangent,vertical=0){this.status='falling';this.fallTime=0;this.fallPosition={...position};this.fallVelocity=add(mul(tangent,this.speed),vec(0,vertical,0));this.fallTangent={...tangent};this.jumpQueued=false}
 update(dt,input={}){
  if(!Number.isFinite(dt)||dt<=0||this.status==='finished')return;
  if(this.status==='falling'){this.fallTime+=dt;this.fallVelocity.y-=GRAVITY*dt;this.fallPosition=add(this.fallPosition,mul(this.fallVelocity,dt));if(this.fallTime>=2.6)this.restart(true);return}
  const target=input.brake?this.course.minSpeed:input.accelerate?this.course.maxSpeed:this.course.baseSpeed;
  const accel=input.brake?14:input.accelerate?7:5;this.speed+=clamp(target-this.speed,-accel*dt,accel*dt);
  const gap=this.nextGap();
  if(this.jumpQueued&&gap&&gap.distance<=1.6&&gap.distance>=-.5){this.jumpQueued=false;this.jumpVelocity=Math.max(5.4,GRAVITY*(gap.length+5)/(2*Math.max(this.speed,6)));this.jumpHeight=.001}
  const ds=this.speed*dt;this.s+=ds;this.travel+=ds;this.distanceSinceReset+=ds;
  if(this.jumpHeight>0){this.jumpVelocity-=GRAVITY*dt;this.jumpHeight+=this.jumpVelocity*dt}
  const r=this.route,inside=r.gaps.some(g=>this.s>=g.start&&this.s<g.end);
  if(inside&&this.jumpHeight<=.04){const p=r.sample(this.s);this.beginFall(add(p.position,vec(0,Math.max(0,this.jumpHeight),0)),p.tangent,this.jumpVelocity);return}
  if(this.jumpHeight<0){this.jumpHeight=0;this.jumpVelocity=0}
  if(this.s>=r.length){const overflow=this.s-r.length;if(r.fork){const side=this.choice||-1;this.choice=side;this.routeId=side===r.fork.safeSide?r.fork.safeRoute:r.fork.deadRoute;this.s=overflow;this.locked=true;this.jumpQueued=false}
   else if(r.next){this.routeId=r.next;this.s=overflow;this.checkpoint={routeId:r.next,s:0};this.choice=0;this.locked=false;this.jumpQueued=false}
   else if(r.kind==='dead'){const tip=r.sample(r.length);this.beginFall(tip.position,tip.tangent);return}
   else{this.s=r.length;this.status='finished';this.speed=0}
  }
 }
 snapshot(){const sample=this.route.sample(this.s),gap=this.nextGap(),pending=this.pendingFork();return{position:this.status==='falling'?{...this.fallPosition}:add(sample.position,vec(0,Math.max(0,this.jumpHeight),0)),trackPosition:sample.position,tangent:this.status==='falling'?norm(this.fallVelocity):sample.tangent,railTangent:sample.tangent,speed:this.speed,routeId:this.routeId,s:this.s,choice:this.choice,pending,locked:this.locked,jumpHeight:Math.max(0,this.jumpHeight),jumpQueued:this.jumpQueued,nextGap:gap,canJump:this.status==='run'&&this.jumpHeight===0&&!!gap&&gap.distance>=0&&gap.distance<=14,status:this.status,fallTime:this.fallTime,progress:clamp((this.route.progressStart+this.s)/this.course.length,0,1),respawns:this.respawns,travel:this.travel,checkpoint:this.snapshotCheckpoint()}}
}
