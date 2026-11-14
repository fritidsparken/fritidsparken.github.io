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
export const COURSE_NAMES=['Lyktornas nedfärd','Färden mot blådjupet','Kristallernas tunnel','Koppargruvans kurvor','Ekoklyftans stup','De glömda spåren','Elddjupets ras','Månstenens mörker','Avgrundens växlar','Färden till flöjtens källa'];
export const COURSE_COUNT=COURSE_NAMES.length;
// Profiles change geometry, rhythm and elevation, not just a title or random seed.
const profiles=[
 {turn:4.0,wave:70,secondary:1.6,height:1.2,vertical:64,descent:0,approach:62,branch:68,spread:6.8,speed:12.0,sides:[-1,1],gaps:1},
 {turn:5.5,wave:61,secondary:2.0,height:1.8,vertical:58,descent:-.010,approach:60,branch:70,spread:7.0,speed:12.5,sides:[1,-1,1],gaps:1},
 {turn:7.0,wave:57,secondary:2.4,height:2.3,vertical:53,descent:0,approach:57,branch:70,spread:7.4,speed:13.0,sides:[-1,1,1],gaps:2},
 {turn:6.0,wave:49,secondary:3.8,height:2.0,vertical:47,descent:-.013,approach:58,branch:72,spread:7.5,speed:13.5,sides:[1,1,-1,1],gaps:2},
 {turn:8.4,wave:62,secondary:3.2,height:3.4,vertical:60,descent:-.016,approach:56,branch:74,spread:8.0,speed:14.0,sides:[-1,1,-1,-1],gaps:2},
 {turn:8.0,wave:51,secondary:4.2,height:3.0,vertical:46,descent:.007,approach:55,branch:72,spread:7.7,speed:14.5,sides:[1,-1,-1,1,-1],gaps:3},
 {turn:9.5,wave:58,secondary:3.7,height:3.6,vertical:50,descent:-.020,approach:54,branch:76,spread:8.4,speed:15.0,sides:[-1,-1,1,-1,1],gaps:3},
 {turn:8.7,wave:45,secondary:4.6,height:4.0,vertical:55,descent:0,approach:52,branch:74,spread:8.2,speed:15.5,sides:[1,-1,1,1,-1,1],gaps:3},
 {turn:10.0,wave:52,secondary:4.2,height:4.5,vertical:48,descent:-.023,approach:51,branch:76,spread:8.8,speed:16.0,sides:[-1,1,-1,-1,1,-1],gaps:4},
 {turn:10.5,wave:47,secondary:4.8,height:4.2,vertical:52,descent:-.010,approach:50,branch:78,spread:9.0,speed:16.5,sides:[1,-1,1,-1,-1,1,-1],gaps:4}
];
const JUMP_WINDOW=14,GAP_WARNING=40;
function makeRoute(id,kind,from,to,fn){
 const steps=Math.max(2,Math.ceil((to-from)*4)),points=[],arc=[0],tangents=[];
 for(let i=0;i<=steps;i++){const t=from+(to-from)*i/steps;points.push(fn(t));tangents.push(norm(sub(fn(t+.02),fn(t-.02))));if(i)arc.push(arc[i-1]+Math.hypot(...Object.values(sub(points[i],points[i-1]))))}
 const route={id,kind,points,arc,length:arc.at(-1),gaps:[],progressStart:0};
 route.sample=s=>{s=clamp(s,0,route.length);let a=0,b=arc.length-1;while(a+1<b){const m=(a+b)>>1;if(arc[m]<=s)a=m;else b=m}const t=(s-arc[a])/(arc[b]-arc[a]||1);return{position:lerp(points[a],points[b],t),tangent:norm(lerp(tangents[a],tangents[b],t))}};
 return route;
}
export function createCourse(level=0){
 level=clamp(Math.floor(level)||0,0,COURSE_COUNT-1);const cfg={...profiles[level],turn:profiles[level].turn*1.8,wave:profiles[level].wave*.75},phase=level*.71;
 const base=z=>vec(cfg.turn*(Math.sin(z/cfg.wave+phase)-Math.sin(phase))+cfg.secondary*Math.sin(z/(cfg.wave*2.23)),cfg.height*(Math.sin(z/cfg.vertical+phase)-Math.sin(phase))+.40*Math.sin(z/17)-.19*z+12*Math.sin(z/42),z);
 const routes=[],routeMap=new Map(),junctions=[],pits=[];let cursor=0,progress=0,pendingGap=null;
 const push=r=>{routes.push(r);routeMap.set(r.id,r);return r};
 const branchFn=(at,side,safe,span,spread)=>z=>{const t=z-at,rise=span*.35,merge=span*.57,offset=t<rise?smooth(t/rise):safe?1-smooth((t-merge)/(span-merge)):1;const p=base(z);p.x-=side*spread*offset;return p};
 const addGap=(route,start,length)=>{const end=start+length;route.gaps.push({start,end,worldStart:route.sample(start).position,worldEnd:route.sample(end).position})};
 const jumpingBranches=new Set(Array.from({length:cfg.gaps-1},(_,i)=>Math.round(i*(cfg.sides.length-2)/Math.max(1,cfg.gaps-2))));
 for(let i=0;i<cfg.sides.length;i++){
  const approach=2*((i===0?70:cfg.approach)+((i+level)%3-1)*6),at=cursor+approach,safeSide=cfg.sides[i],span=2*(cfg.branch+(i%2)*6),spread=cfg.spread+(i%3)*.3;
  const main=push(makeRoute('main-'+i,'main',cursor,at,base));main.progressStart=progress;progress+=main.length;
  if(pendingGap!==null){addGap(main,56,pendingGap);pendingGap=null;}
  const safe=push(makeRoute('safe-'+i,'safe',at,at+span,branchFn(at,safeSide,true,span,spread)));safe.progressStart=progress;
  const dead=push(makeRoute('dead-'+i,'dead',at,at+span*.35+12,branchFn(at,-safeSide,false,span,spread)));dead.progressStart=progress;
  const junction={id:i,position:main.sample(main.length).position,safeSide,entryRoute:main.id,safeRoute:safe.id,deadRoute:dead.id};
  main.fork=junction;safe.next='main-'+(i+1);junctions.push(junction);
  const tip=dead.sample(dead.length);pits.push({position:tip.position,direction:tip.tangent,width:12,depth:55+level*2,routeId:dead.id});
  if(jumpingBranches.has(i))pendingGap=10+level*.3+(i%2);
  progress+=safe.length;cursor=at+span;
 }
 const terminal=push(makeRoute('main-'+cfg.sides.length,'main',cursor,cursor+200+level*4,base));terminal.progressStart=progress;
 addGap(terminal,56,10+level*.3);
 if(pendingGap!==null)addGap(terminal,115,pendingGap);
 progress+=terminal.length;
 return {level,name:COURSE_NAMES[level],theme:level%5,routes,routeMap,startRoute:'main-0',finish:terminal.sample(terminal.length).position,finishTangent:terminal.sample(terminal.length).tangent,junctions,pits,length:progress,baseSpeed:cfg.speed,maxSpeed:cfg.speed*2.0,minSpeed:cfg.speed*.75,gapCount:cfg.gaps};
}
export class CartPhysics{
 constructor(course,random=Math.random){this.random=random;this.course=course;this.checkpoint={routeId:course.startRoute,s:0};this.respawns=0;this.travel=0;this.restart(false)}
 get route(){return this.course.routeMap.get(this.routeId)}
 restart(count=false){this.routeId=this.checkpoint.routeId;this.s=this.checkpoint.s;this.status='run';this.speed=0;this.choice=0;this.locked=false;this.jumpHeight=0;this.jumpVelocity=0;this.jumpQueued=false;this.fallTime=0;this.fallVelocity=vec();this.fallPosition=null;this.distanceSinceReset=0;if(count)this.respawns++;return this.snapshot()}
 snapshotCheckpoint(){return {...this.checkpoint}}
 restoreCheckpoint(cp){if(!cp||typeof cp.routeId!=='string')return false;const r=this.course.routeMap.get(cp.routeId);if(!r||r.kind==='dead')return false;const at=Number(cp.s)||0;const valid=r.kind==='main'&&at===0||r.gaps.some(g=>Math.abs(at-(g.end+12))<.001);if(!valid)return false;this.checkpoint={routeId:r.id,s:at};this.restart(false);return true}
 pendingFork(){const r=this.route;if(this.status!=='run'||!r.fork)return null;const distance=r.length-this.s;return distance<=48?{...r.fork,distance,choice:this.choice,defaultSide:null}:null}
 nextGap(){
  let route=this.route,at=this.s,ahead=0;
  // Include the next already-determined rail segment, so a warning does not pop
  // into existence only when crossing a route boundary. Never guess across an
  // unselected junction: the branch itself has >=42m of approach to its gap.
  for(let i=0;i<3;i++){
   const g=route.gaps.find(g=>g.end>=at);
   if(g){const distance=ahead+g.start-at;return{...g,routeId:route.id,distance,length:g.end-g.start,warning:distance>=0&&distance<=GAP_WARNING,warningDistance:GAP_WARNING,seconds:Math.max(0,distance)/Math.max(this.speed,this.course.baseSpeed*.6)}}
   ahead+=route.length-at;if(ahead>GAP_WARNING||!route.next)return null;route=this.course.routeMap.get(route.next);at=0;
  }return null;
 }
 choose(side){if((side!==-1&&side!==1)||!this.pendingFork()||this.locked)return false;this.choice=side;return true}
 jump(){const gap=this.nextGap();if(this.status!=='run'||this.jumpHeight>0||!gap||gap.distance<0||gap.distance>JUMP_WINDOW)return false;this.jumpQueued=true;return true}
 beginFall(position,tangent,vertical=0){this.status='falling';this.fallTime=0;this.fallPosition={...position};this.fallVelocity=add(mul(tangent,this.speed),vec(0,vertical,0));this.fallTangent={...tangent};this.jumpQueued=false}
 update(dt,input={}){
  if(!Number.isFinite(dt)||dt<=0||this.status==='finished')return;
  if(this.status==='falling'){this.fallTime+=dt;this.fallVelocity.y-=GRAVITY*dt;this.fallVelocity.x*=Math.exp(-6*dt);this.fallVelocity.z*=Math.exp(-6*dt);this.fallPosition=add(this.fallPosition,mul(this.fallVelocity,dt));if(this.fallTime>=2.6)this.restart(true);return}
  // Automatic forward motion only. Legacy input arguments are intentionally
  // ignored; slopes gently alter the target without a throttle or brake mode.
  const slope=this.route.sample(this.s).tangent.y;
  const target=this.course.baseSpeed*(1-clamp(slope*3.6,-1.0,.25));
  this.speed+=clamp(target-this.speed,-7*dt,9*dt);
  const gap=this.nextGap();
  if(this.jumpQueued&&gap&&gap.distance<=1.6&&gap.distance>=-.5){this.jumpQueued=false;this.jumpVelocity=Math.max(5.4,GRAVITY*(gap.length+5)/(2*Math.max(this.speed,6)));this.jumpHeight=.001}
  const ds=this.speed*dt;this.s+=ds;this.travel+=ds;this.distanceSinceReset+=ds;
  if(this.jumpHeight>0){this.jumpVelocity-=GRAVITY*dt;this.jumpHeight+=this.jumpVelocity*dt}
  const r=this.route,inside=r.gaps.some(g=>this.s>=g.start&&this.s<g.end);
  if(inside&&this.jumpHeight<=.04){const p=r.sample(this.s);this.beginFall(add(p.position,vec(0,Math.max(0,this.jumpHeight),0)),p.tangent,this.jumpVelocity);return}
  if(this.jumpHeight<0){this.jumpHeight=0;this.jumpVelocity=0}
  if(this.jumpHeight===0)for(const g of r.gaps){const at=g.end+12;if(this.s>=at&&this.s<at+2&&(this.checkpoint.routeId!==r.id||this.checkpoint.s<at))this.checkpoint={routeId:r.id,s:at};}
  if(this.s>=r.length){const overflow=this.s-r.length;if(r.fork){const side=this.choice||(this.random()<.5?-1:1);this.choice=side;this.routeId=side===r.fork.safeSide?r.fork.safeRoute:r.fork.deadRoute;this.s=overflow;this.locked=true;this.jumpQueued=false}
   else if(r.next){this.routeId=r.next;this.s=overflow;this.checkpoint={routeId:r.next,s:0};this.choice=0;this.locked=false;this.jumpQueued=false}
   else if(r.kind==='dead'){const tip=r.sample(r.length);this.beginFall(tip.position,tip.tangent);return}
   else{this.s=r.length;this.status='finished';this.speed=0}
  }
 }
 snapshot(){const sample=this.route.sample(this.s),gap=this.nextGap(),pending=this.pendingFork();return{position:this.status==='falling'?{...this.fallPosition}:add(sample.position,vec(0,Math.max(0,this.jumpHeight),0)),trackPosition:sample.position,tangent:this.status==='falling'?norm(this.fallVelocity):sample.tangent,railTangent:sample.tangent,speed:this.speed,routeId:this.routeId,s:this.s,choice:this.choice,pending,locked:this.locked,jumpHeight:Math.max(0,this.jumpHeight),jumpQueued:this.jumpQueued,nextGap:gap,jumpWarning:!!gap?.warning,jumpWindow:JUMP_WINDOW,canJump:this.status==='run'&&this.jumpHeight===0&&!!gap&&gap.distance>=0&&gap.distance<=JUMP_WINDOW,status:this.status,fallTime:this.fallTime,progress:clamp((this.route.progressStart+this.s)/this.course.length,0,1),respawns:this.respawns,travel:this.travel,checkpoint:this.snapshotCheckpoint()}}
}

