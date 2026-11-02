export const R=.22;
export function surfaces(c){return c.path.slice(1).flatMap((b,i)=>c.features.some(f=>f.gap&&f.node===i)?[]:[{a:c.path[i],b,i}]);}
export function nearest(c,x,z){let best=null;for(const s of surfaces(c)){const {a,b}=s,dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(len*len))),px=a[0]+dx*t,pz=a[2]+dz*t,d=Math.hypot(x-px,z-pz);if(!best||d<best.d)best={...s,t,x:px,z:pz,y:a[1]+(b[1]-a[1])*t,d,dx:dx/len,dz:dz/len,slope:(b[1]-a[1])/len};}return best;}
export function obstacle(c,f,time){const a=c.path[f.node];return {x:a[0]+(f.type==='bumper'?0:Math.sin(time*(f.type==='windmill'?1.6:.75))*(c.width/2-.45)),z:a[2],r:f.type==='bumper'?.65:.42};}
export class Physics{
 constructor(c){this.c=c;[this.x,this.y,this.z]=c.path[0];this.y+=R;this.vx=this.vz=0;this.rest=true;this.sunk=false;this.time=0;this.cooldown=0;this.events=[];this.safe=[this.x,this.y,this.z];this.travel=null;this.elapsed=0;}
 shoot(dx,dz,p){const l=Math.hypot(dx,dz);if(!this.rest||this.sunk||p<.01||!l)return false;this.safe=[this.x,this.y,this.z];this.vx=dx/l*(.5+Math.min(1,p)*20);this.vz=dz/l*(.5+Math.min(1,p)*20);this.rest=false;this.elapsed=0;return true;}
 reset(){[this.x,this.y,this.z]=this.safe;this.vx=this.vz=0;this.rest=true;this.travel=null;this.cooldown=1;this.events.push('reset');}
 step(dt){this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);if(this.sunk)return;
 if(this.travel){const t=this.travel;t.time+=dt;const u=Math.min(1,t.time/t.duration),a=t.a,b=t.b;this.x=a[0]+(b[0]-a[0])*u;this.z=a[2]+(b[2]-a[2])*u;this.y=a[1]+(b[1]-a[1])*u+R+Math.sin(u*Math.PI)*t.height;
 if(t.type==='loop'){this.y=a[1]+R+(1-Math.cos(u*2*Math.PI))*3.1;this.z=a[2]+(b[2]-a[2])*u-Math.sin(u*2*Math.PI)*3.1;}
 if(u===1){this.travel=null;this.cooldown=1.2;const next=this.c.path[Math.min(t.exit+1,this.c.path.length-1)],dx=next[0]-b[0],dz=next[2]-b[2],l=Math.hypot(dx,dz)||1;this.vx=dx/l*4;this.vz=dz/l*4;this.safe=[this.x,this.y,this.z];}return;}
 if(this.rest)return;this.elapsed+=dt;let n=nearest(this.c,this.x,this.z);this.vx-=this.c.gravity*n.slope*n.dx*dt;this.vz-=this.c.gravity*n.slope*n.dz*dt;let speed=Math.hypot(this.vx,this.vz),factor=Math.max(0,1-(1.15+.07*speed)*dt/Math.max(speed,.001));this.vx*=factor;this.vz*=factor;this.x+=this.vx*dt;this.z+=this.vz*dt;n=nearest(this.c,this.x,this.z);this.y=n.y+R;
 for(const f of this.c.features){const a=this.c.path[f.node],b=this.c.path[f.exit??f.node],dist=Math.hypot(this.x-a[0]-(f.offset||0),this.z-a[2]);
 if(['bumper','barrel','windmill'].includes(f.type)){const o=obstacle(this.c,f,this.time),dx=this.x-o.x,dz=this.z-o.z,l=Math.hypot(dx,dz);if(l<o.r+R){const nx=l?dx/l:1,nz=l?dz/l:0;this.x=o.x+nx*(o.r+R+.01);this.z=o.z+nz*(o.r+R+.01);const dot=this.vx*nx+this.vz*nz;if(dot<0){this.vx-=1.75*dot*nx;this.vz-=1.75*dot*nz;this.events.push('wood');}}}
 if(f.type==='movingBridge'&&n.i===f.node&&n.t>.12&&n.t<.88&&Math.abs(this.x-n.x-Math.sin(this.time*.65)*.9)>1.05){this.reset();return;}
 if(this.cooldown||dist>.8)continue;
 if(f.type==='portal'||f.type==='returnPortal'){this.x=b[0];this.z=b[2]-.9;this.y=b[1]+R;this.cooldown=1.4;this.safe=[this.x,this.y,this.z];this.events.push('portal');return;}
 if(['cannon','jump','loop','logShortcut'].includes(f.type)){
 if(f.type==='loop'&&speed<9){this.vz=Math.abs(this.vz)*.65;this.cooldown=1;this.events.push('weak');continue;}
 if(f.type==='jump'&&speed<6){this.reset();return;}
 if(f.type==='logShortcut'&&(speed<12||Math.abs(this.vx)>2))continue;
 this.travel={type:f.type,exit:f.exit,a:[this.x,this.y-R,this.z],b,time:0,duration:f.type==='cannon'?2.6:1.6,height:f.type==='cannon'?13:4};this.events.push(f.type);return;}
 }
 if(n.d>this.c.width/2-R){if(n.d>this.c.width/2+1){this.reset();return;}const nx=(this.x-n.x)/(n.d||1),nz=(this.z-n.z)/(n.d||1);this.x=n.x+nx*(this.c.width/2-R);this.z=n.z+nz*(this.c.width/2-R);const dot=this.vx*nx+this.vz*nz;if(dot>0){this.vx-=1.65*dot*nx;this.vz-=1.65*dot*nz;this.events.push('stone');}}
 const cup=this.c.path.at(-1);if(Math.hypot(this.x-cup[0],this.z-cup[2])<.38&&Math.hypot(this.vx,this.vz)<5){this.x=cup[0];this.z=cup[2];this.y=cup[1]-.12;this.sunk=this.rest=true;this.vx=this.vz=0;this.events.push('cup');return;}
 if(Math.hypot(this.vx,this.vz)<.12||this.elapsed>25){this.vx=this.vz=0;this.rest=true;}
 }
}
