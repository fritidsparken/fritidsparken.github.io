export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const R=.11, HALF=3.66, HEIGHT=2.44;
export function winner(a,b){
 const x=a.filter(Boolean).length,y=b.filter(Boolean).length;
 if(a.length<=5&&b.length<=5){if(x>y+Math.max(0,5-b.length))return 0;if(y>x+Math.max(0,5-a.length))return 1;}
 if(a.length>=5&&a.length===b.length&&x!==y)return x>y?0:1;
 return null;
}
export function launch(x,y,speed=22,spin=0){
 // Linear drag has an analytic flight time. Compensate the launch vector so the
 // cursor still predicts the crossing point, regardless of charge or spin.
 const drag=.09, t=-Math.log(1-drag*11/speed)/drag;
 const response=(1-Math.exp(-drag*t))/drag, correction=(t-response)/drag;
 const ax=spin*5;
 return {x:0,y:R,z:11,vx:(x-ax*correction)/response,vy:(y-R+9.81*correction)/response,vz:-speed,ax,age:0,goal:false,hit:null,saved:false,net:false,done:false};
}
export function keeperPose(k){
 const t=clamp(k.time/.42,0,1),s=t*t*(3-2*t),land=clamp((k.time-.9)/.55,0,1);
 const start=k.startX??0;
 const x=start+(k.tx-start)*s,y=(.94+(k.ty-.94)*s)*(1-land)+.38*land;
 const angle=-Math.sign(k.tx-start)*Math.min(1,Math.abs(k.tx-start)/1.4)*s*1.25;
 const part=(dx,dy,r)=>({x:x+dx*Math.cos(angle)-dy*Math.sin(angle),y:y+dx*Math.sin(angle)+dy*Math.cos(angle),z:.48,r});
 return {x,y,angle,parts:[part(0,0,.32),part(0,.48,.23),part(-.53,.35,.22),part(.53,.35,.22),part(0,-.45,.25)]};
}
function reflect(b,nx,ny,nz,restitution){const dot=b.vx*nx+b.vy*ny+b.vz*nz;if(dot<0){b.vx-=(1+restitution)*dot*nx;b.vy-=(1+restitution)*dot*ny;b.vz-=(1+restitution)*dot*nz;}}
export function step(b,dt,parts=[]){
 if(b.done)return;const prevZ=b.z,prevX=b.x,prevY=b.y;b.age+=dt;b.vx+=(b.ax-.09*b.vx)*dt;b.vy-=(9.81+.09*b.vy)*dt;b.vz-=.09*b.vz*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
 if(b.y<R){b.y=R;if(b.vy<-.4){b.bounce=(b.bounce||0)+1;b.vy=-b.vy*.53;}else b.vy=0;b.vx*=Math.pow(.45,dt);b.vz*=Math.pow(.6,dt);}
 for(const side of [-1,1])if(b.y<HEIGHT+.06){const dx=b.x-side*HALF,dz=b.z,d=Math.hypot(dx,dz),r=R+.065;if(d<r&&d>0){reflect(b,dx/d,0,dz/d,.76);b.x=side*HALF+dx/d*r;b.z=dz/d*r;b.hit='post';b.ax=0;}}
 if(Math.abs(b.x)<HALF+.06){const dy=b.y-HEIGHT,dz=b.z,d=Math.hypot(dy,dz),r=R+.065;if(d<r&&d>0){reflect(b,0,dy/d,dz/d,.73);b.y=HEIGHT+dy/d*r;b.z=dz/d*r;b.hit='bar';b.ax=0;}}
 if(!b.saved&&!b.goal)for(const p of parts){const dx=b.x-p.x,dy=b.y-p.y,dz=b.z-p.z,d=Math.hypot(dx,dy,dz);if(d<p.r+R&&d>0){b.saved=true;b.ax=0;reflect(b,dx/d,dy/d,dz/d,.64);b.z=p.z+dz/d*(p.r+R);b.x=p.x+dx/d*(p.r+R);b.y=p.y+dy/d*(p.r+R);break;}}
 if(!b.goal&&prevZ>=-R&&b.z< -R){
   const u=(-R-prevZ)/(b.z-prevZ), x=prevX+(b.x-prevX)*u, y=prevY+(b.y-prevY)*u;
   if(Math.abs(x)<HALF-R&&y<HEIGHT-R){b.goal=true;b.crossing={x,y};}
 }
 if(b.goal){if(b.z< -1.55+R&&b.vz<0){b.z=-1.55+R;b.vz*=-.18;b.vx*=.4;b.ax=0;b.net=true;}if(Math.abs(b.x)>HALF-R){b.x=Math.sign(b.x)*(HALF-R);b.vx*=-.15;b.net=true;}if(b.y>HEIGHT-R){b.y=HEIGHT-R;b.vy=-Math.abs(b.vy)*.2;b.net=true;}}
 if(b.age>4||Math.abs(b.x)>18||b.z>16||b.z< -5)b.done=true;
}
export function swipe(points,aim){const first=points[0],last=points.at(-1),d=Math.hypot(last.x-first.x,last.y-first.y);if(d<16)return null;
 const duration=Math.max(80,last.t-first.t),speed=clamp(14+d/duration*8,14,29);
 let bend=0;for(const p of points){const u=clamp((p.y-first.y)/(last.y-first.y||1),0,1);bend+=p.x-(first.x+(last.x-first.x)*u);}bend/=points.length;
 return {x:clamp(aim.x,-4.8,4.8),y:clamp(aim.y,.14,3.5),speed,spin:clamp(bend/65,-1,1)};}
