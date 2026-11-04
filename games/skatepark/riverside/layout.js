// Coordinates in metres: entrance to the south, river to the east.
export const riverside = {
 name:"Riverside Skatepark", area:"RIVERSIDE", desc:"Flodparken med bergsutsikt och en åkbar loop.",sky:0xbad8ed,floor:0xe3d5bf,ink:0x807665,rail:0x42545c,
 shapes:[
 ["bowl",18,20,37,27,-4.4],["bowl",-4,8,24,21,-3.2],["bowl",22,-2,37,24,-3.6],["bowl",37,5,19,20,-2.9],
 ["steps",-15,35,18,14,1.65],["manual",-26,35,2,13,1.3],["manual",-4,35,2,13,1.5],
 ["steps",-44,-11,7,17,3.3],["steps",-19,-13,7,15,3.3],
 ["mega",31,-33,19,29,13],["half",0,-34,16,17,3.0],["quarter",-15,-29,12,12,2.3],["funbox",9,-18,9,11,1.65],["pyramid",-4,-18,7,8,1.4],["quarter",-31,-4,9,9,1.7],
 ["manual",-32,15,3,12,.8],["manual",-17,21,3,9,.68],["manual",43,-10,4,11,.85]
 ],rails:[[-15,29,-15,41,.73],[-26,31,-26,39,.24],[-4,31,-4,39,.25],[-32,11,-32,19,.24],[-17,18,-17,24,.25],[-26,1,-19,1,.65],[-31,6,-24,6,.66],[-40,-17,-40,-5,.8],[5,-10,14,-10,.68],[44,-14,44,-6,.23]]
};
export const loopRadius=5.6;
export function loopPoint(a){
 return {x:-13+8*(a-Math.sin(a))/(Math.PI*2), y:loopRadius*(1-Math.cos(a))+.065,z:2-loopRadius*Math.sin(a)};
}
