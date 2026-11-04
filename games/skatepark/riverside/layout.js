// Coordinates in metres: entrance to the south, river to the east.
export const riverside = {
 name:"Riverside Skatepark", area:"RIVERSIDE", desc:"Kvällsåkning med tre vägloopar, gap och långa rails.",sky:0x27314a,floor:0xe3d5bf,ink:0x807665,rail:0x42545c,
 shapes:[
 ["bowl",18,20,37,27,-4.4],["bowl",-4,8,24,21,-3.2],["bowl",22,-2,37,24,-3.6],["bowl",37,5,19,20,-2.9],
 ["steps",-15,35,18,14,1.65],["manual",-26,35,2,13,1.3],["manual",-4,35,2,13,1.5],
 ["steps",-44,-11,7,17,3.3],["steps",-19,-13,7,15,3.3],
 ["mega",31,-33,19,29,13],["half",0,-34,16,17,3.0],["quarter",-15,-29,12,12,2.3],["funbox",9,-18,9,11,1.65],["pyramid",-4,-18,7,8,1.4],["quarter",-31,-4,9,9,1.7],
 ["manual",-32,15,3,12,.8],["manual",-17,21,3,9,.68],["manual",43,-10,4,11,.85]
 ],rails:[[-15,29,-15,41,.73],[-26,31,-26,39,.24],[-4,31,-4,39,.25],[-32,11,-32,19,.24],[-17,18,-17,24,.25],[-26,1,-19,1,.65],[-31,6,-24,6,.66],[-40,-17,-40,-5,.8],[5,-10,14,-10,.68],[44,-14,44,-6,.23]]
};
// The road runs east-west. Each loop's exit aligns with the following jump.
export const road = {xMin:-82,xMax:82,zMin:52,zMax:82,innerRail:59,outerRail:77};
export const loops=[
  {x:-43,z:65,r:4.3,drift:5},
  {x:0,z:70,r:5.6,drift:-5},
  {x:43,z:65,r:6.5,drift:5}
];
export const jumps=[{x:-21.5,z:70,gap:3.8,h:1.6},{x:21.5,z:65,gap:4.5,h:1.85}];
export const laneHalf=2.05, tau=Math.PI*2;
export function loopPoint(loop,a,lateral=0,outer=0){
  const r=loop.r+outer;
  return {x:loop.x+r*Math.sin(a), y:.035+loop.r-r*Math.cos(a),
    z:loop.z+loop.drift*(a-Math.sin(a))/tau+lateral};
}
export function jumpHeight(x,z){
  for(const j of jumps){
    const d=Math.abs(x-j.x)-j.gap/2;
    if(d>=0&&d<=5.5&&Math.abs(z-j.z)<=2.65)return j.h*(1-d/5.5);
  }
  return 0;
}
for(const z of [road.innerRail,road.outerRail])riverside.rails.push([-74,z,74,z,.58]);
export const lamps=[];
for(const z of [59,78])for(let x=-78;x<=78;x+=13)lamps.push([x,z+(z===59?-1:1),6.8]);
for(const z of [-44,-19,4,28,47])for(const x of [-49,-22,5,42]){
 if(riverside.shapes.some(([,cx,cz,w,d])=>Math.abs(x-cx)<w/2+.9&&Math.abs(z-cz)<d/2+.9))continue;
 lamps.push([x,z,6.1]);
}
