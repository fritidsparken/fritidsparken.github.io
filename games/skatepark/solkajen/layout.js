// South is the entrance. The café overlooks the street line from the west.
export const solkajen={
 name:'Solkajen',area:'RIVERSIDE · KVÄLL',desc:'Solvarm betong, graffitiloop och en hög träramp.',sky:0xbddbed,floor:0xd8d3cb,ink:0xafaaa8,rail:0xb54a30,
 loops:[{x:-19,z:-29,r:4.4,drift:3.6}],
 shapes:[
 ['kidney',31,17,36,28,-4.6],['bowl',8,-30,23,18,-3.3],['bowl',-3,-33,14,14,-2],
 ['mega',36,-32,19,27,12],['mega',22,-32,9,20,6.2],
 ['steps',-16,9,15,14,1.85],['manual',-25,9,2.2,14,1.85],['manual',-7,9,2.2,14,1.85],
 ['funbox',5,-4,14,12,1.8],['funbox',9,12,7,9,1.25],['pyramid',-16,30,7,7,1.25],
 ['manual',-8,27,16,2.6,.68],['manual',-34,2,4,12,1.1],['quarter',-30,40,15,14,3.6],
 ['quarter',-37,-13,12,13,2.9],['quarter',7,-14,10,8,1.6],['half',-6,-8,14,11,1.8]
 ],
 rails:[[-16,3,-16,15,.75],[-25,4,-25,14,.19],[-7,4,-7,14,.19],[-1,31,13,31,.83],[-33,-5,-33,6,.6],[1,-6,10,-6,.68],[-12,-18,-3,-18,.69],[24,-7,36,-7,.72],[-15,27,-2,27,.18]]
};
export function bowlRadius(u,v){
 return Math.hypot(u,v+.2*Math.cos(u*Math.PI*1.3)*(1-v*v));
}

// Rounded corners connect the four straights into one continuous grind.
const rimPoints = [];
for (const [cx, cz, start] of [[47,43,0],[-47,43,90],[-47,-43,180],[47,-43,270]]) {
  for (let step=0; step<=8; step++) {
    const angle=(start+90*step/8)*Math.PI/180;
    rimPoints.push([cx+6*Math.cos(angle),cz+6*Math.sin(angle)]);
  }
}
const perimeter=rimPoints.map(([x,z],i)=>{
  const end=rimPoints[(i+1)%rimPoints.length];
  const rail=[x,z,...end,.66];
  rail.profile=[.66,0];
  rail.line='solkajen-perimeter';
  return rail;
});
perimeter.forEach((rail,i)=>{
  rail.next=perimeter[(i+1)%perimeter.length];
  rail.prev=perimeter[(i+perimeter.length-1)%perimeter.length];
});
solkajen.rails.push(...perimeter);
