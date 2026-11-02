/** Minigolf course authoring data. Coordinates are metres [x, y, z].
 * Surfaces are explicit; disconnected launch/landing areas must never be
 * silently bridged by the renderer or collision generator.
 */
const course=(name,par,path,width,features=[])=>({name,par,path,width,features});
export const worlds=['Klassiska parken','Piratviken','Djungeln','Godislandet','Rymden','Vulkanön'];
export const courses=[
 course('Första putten',2,[[0,0,0],[0,0,-7],[2,0,-14],[1,0,-22]],5),
 course('Tunneln',2,[[0,2,0],[0,2,-9],[0,0,-17],[5,0,-23]],4.8,[{type:'tunnel',node:1}]),
 course('Väderkvarnen',3,[[0,0,0],[0,0,-10],[0,0,-20],[-5,0,-26]],5,[{type:'windmill',node:1}]),
 course('Piratbron',3,[[0,1,0],[0,2,-9],[5,2,-17],[5,1,-26]],3.3,[{type:'bridge',node:1}]),
 course('Piratskeppet',3,[[0,0,0],[0,3,-10],[0,3,-23],[5,0,-32]],4.6,[{type:'ship',node:1},{type:'barrel',node:2}]),
 course('Kanonen',3,[[0,1,0],[0,1,-10],[0,1,-40],[4,1,-48]],5,[{type:'cannon',node:1,exit:2,gap:true}]),
 course('Djungelstigen',3,[[0,0,0],[-7,0,-6],[-7,0,-15],[5,0,-20],[5,0,-29],[-1,0,-35]],4),
 course('Vattenfallet',4,[[0,0,0],[0,4,-12],[0,4,-23],[7,1,-30],[10,1,-37]],4.7,[{type:'waterfall',node:2},{type:'tunnel',node:2}]),
 course('Apans genväg',3,[[0,0,0],[-9,0,-8],[-9,0,-22],[0,0,-29],[7,0,-34]],4,[{type:'logShortcut',node:0,exit:3}]),
 course('Godisvägen',3,[[0,0,0],[6,0,-8],[-4,1,-17],[6,1,-26],[0,0,-34]],5,[{type:'bumper',node:2}]),
 course('Donutloopen',3,[[0,0,0],[0,0,-12],[0,0,-23],[5,0,-31]],5,[{type:'loop',node:1,exit:2,radius:3.1}]),
 course('Chokladfloden',4,[[0,1,0],[0,1,-9],[0,1,-17],[7,2,-24],[7,2,-32],[0,1,-39]],3.8,[{type:'movingBridge',node:1,exit:2},{type:'bumper',node:4}]),
 course('Månbasen',3,[[0,0,0],[0,2,-10],[8,2,-19],[8,0,-30],[0,0,-36]],5,[{type:'bumper',node:2}]),
 course('Planethoppet',4,[[0,0,0],[0,2,-10],[0,1,-22],[5,3,-32],[5,1,-44],[0,1,-51]],4.5,[{type:'jump',node:1,exit:2,gap:true},{type:'jump',node:3,exit:4,gap:true}]),
 course('Portalen',4,[[0,0,0],[0,0,-10],[8,1,-25],[8,1,-35],[-6,0,-47],[-6,0,-56]],5,[{type:'portal',node:1,exit:2,gap:true},{type:'portal',node:3,exit:4,gap:true},{type:'returnPortal',node:4,exit:2,offset:1.8}]),
 course('Vulkangrottan',4,[[0,3,0],[0,1,-12],[-6,1,-19],[-6,0,-29],[4,0,-37]],4,[{type:'tunnel',node:2},{type:'bumper',node:3}]),
 course('Lavabron',4,[[0,1,0],[0,1,-10],[0,1,-19],[8,1,-26],[8,1,-35],[0,1,-42]],3,[{type:'movingBridge',node:1,exit:2},{type:'barrel',node:3}]),
 course('Den stora finalen',5,[[0,14,0],[0,5,-22],[12,4,-27],[18,3,-17],[10,2,-10],[3,1,-19],[3,1,-34],[3,1,-45],[3,1,-57],[3,0,-90],[3,-2,-103],[3,0,-115],[3,2,-124],[3,1,-134]],5,[{type:'barrel',node:3},{type:'tunnel',node:6},{type:'loop',node:7,exit:8,radius:3.1},{type:'cannon',node:8,exit:9,gap:true},{type:'underwaterTunnel',node:10}])
].map((c,id)=>({...c,id,world:Math.floor(id/3),gravity:id>=12&&id<=14?6:9.81}));
export const totalPar=courses.reduce((sum,c)=>sum+c.par,0);
export function validateCourses(list=courses){
 if(list.length!==18)throw Error('Exactly 18 holes are required');
 const names=new Set();
 for(const [i,c] of list.entries()){
  if(c.id!==i||c.world!==Math.floor(i/3))throw Error(`Invalid ordering: ${i}`);
  if(names.has(c.name))throw Error(`Duplicate name: ${c.name}`);names.add(c.name);
  if(!Number.isInteger(c.par)||c.par<2||c.par>5||c.width<2)throw Error(`Invalid dimensions: ${i}`);
  if(c.path.length<2||c.path.some(p=>p.length!==3||p.some(n=>!Number.isFinite(n))))throw Error(`Invalid path: ${i}`);
  for(let j=1;j<c.path.length;j++)if(Math.hypot(...c.path[j].map((v,k)=>v-c.path[j-1][k]))<.1)throw Error(`Zero segment: ${i}`);
  for(const f of c.features)for(const k of ['node','exit'])if(f[k]!==undefined&&(!Number.isInteger(f[k])||f[k]<0||f[k]>=c.path.length))throw Error(`Invalid feature: ${i}`);
 }
 return true;
}
