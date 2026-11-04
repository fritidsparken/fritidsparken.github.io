export const eye=1.55;
export function occupied(world,p){for(const x of [p.x-.28,p.x+.28])for(const z of [p.z-.28,p.z+.28])for(const y of [p.y+.02,p.y+.88,p.y+1.73])if(world.solid(x,y,z))return true;return false}
export function move(player,world,dt,input,mode,onLand,collideProp,stepProp){
 const {p}=player;if(world.at(p.x,0,p.z)===null)return;
 const swim=world.at(p.x,p.y+.7,p.z)===25,fly=mode==='creative'&&player.fly,speed=fly?8:swim?2.7:input.sprint?6:4.5;
 const norm=Math.max(1,Math.hypot(input.f,input.r)),x=(-Math.sin(player.yaw)*input.f+Math.cos(player.yaw)*input.r)/norm,z=(-Math.cos(player.yaw)*input.f-Math.sin(player.yaw)*input.r)/norm;
 if(!fly&&!swim&&player.grounded&&input.up)player.v=7.4;
 player.v=fly?(Number(input.up)-Number(input.down))*speed:swim?(input.up?3:input.down?-3:-.5):Math.max(-30,player.v-20*dt);
 const hit=()=>occupied(world,p)||collideProp?.(p);
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(player.v),speed)*dt/.18));
 for(let i=0;i<steps;i++){for(const [axis,delta] of [['x',x*speed],['z',z*speed],['y',player.v]]){if(!delta)continue;const prev=p[axis];p[axis]+=delta*dt/steps;if(hit()){if(axis!=='y'&&!fly&&player.grounded&&stepProp){const before=p.y;p.y=stepProp(p);if(p.y>before&&!hit())continue;p.y=before}p[axis]=prev;if(axis==='y'){if(player.v<0){if(!player.grounded)onLand(-player.v);player.grounded=true}player.v=0}}else if(axis==='y')player.grounded=false}}
 p.y=Math.min(95,Math.max(.05,p.y));player.swim=swim;player.moving=Math.abs(x)+Math.abs(z)>.05;
}
// Traverse voxel boundaries exactly, including negative world coordinates.
export function target(world,origin,dir,reach=7){const cell=origin.toArray().map(Math.floor),d=dir.toArray(),o=origin.toArray(),step=d.map(Math.sign),delta=d.map(v=>v?Math.abs(1/v):Infinity),t=d.map((v,i)=>v?((cell[i]+(v>0?1:0))-o[i])/v:Infinity);let distance=0,prev=[...cell];
 while(distance<=reach){const id=world.at(...cell);if(id===null)return null;if(id&&id!==25)return {cell:[...cell],prev,id,distance};let axis=t[0]<t[1]?0:1;if(t[2]<t[axis])axis=2;prev=[...cell];cell[axis]+=step[axis];distance=t[axis];t[axis]+=delta[axis]}return null}
