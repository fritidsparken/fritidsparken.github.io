// Image coordinates are shared by art and hit targets. No stretched or duplicated edges.
export const SCAN_SECONDS=3.8;
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*smooth(t);
export function fitScene(w,h,kind='store',focus=.5){
 const portrait=w/h<.85;
 if(portrait&&kind!=='store'){
  const scale=Math.min(w/1024,Math.max(100,h-192)/1536),sw=1024*scale,sh=1536*scale;
  return {x:(w-sw)/2,y:112+(h-192-sh)/2,w:sw,h:sh,portrait:true};
 }
 if(portrait){const sh=h,sw=sh*1672/941;return {x:Math.min(0,Math.max(w-sw,w*.5-focus*sw)),y:0,w:sw,h:sh,portrait:true};}
 // Every station stays in frame; spare space belongs to the interface, never a second image.
 const scale=Math.min(w/1672,h/941);
 return {x:(w-1672*scale)/2,y:(h-941*scale)/2,w:1672*scale,h:941*scale,portrait:false};
}
export function shelfSlots(index,portrait=false){
 if(portrait)return Array.from({length:8},(_,i)=>({x:i%2?.57:.09,y:[.165,.33,.495,.66][Math.floor(i/2)],w:.34,h:.145}));
 const xs=index===0?[.28,.45,.625,.805]:[.17,.39,.61,.83],bases=index===0?[.43,.60]:index===1?[.395,.605]:[.37,.58];
 return bases.flatMap(base=>xs.map(x=>({x:x-.072,y:base-.16,w:.144,h:.16})));
}
export function checkoutGeometry(portrait){return portrait?{
 pickup:{x:.29,y:.55},scanner:{x:.39,y:.73},bag:{x:.80,y:.55},inside:{x:.80,y:.68},rest:{x:.58,y:.91},size:.094,
 belt:[[0,.46],[.37,.46],[.34,.66],[0,.66]],lip:[[.635,.595],[.68,.62],[.78,.635],[.9,.63],[.978,.605],[.98,.85],[.64,.85]],
 display:{x:.75,y:.355,w:.18,h:.042},
 }:{
 pickup:{x:.31,y:.70},scanner:{x:.50,y:.75},bag:{x:.83,y:.60},inside:{x:.83,y:.79},rest:{x:.59,y:.90},size:.115,
 belt:[[0,.59],[.37,.59],[.345,.88],[0,.88]],lip:[[.705,.64],[.735,.70],[.79,.735],[.86,.744],[.93,.71],[.96,.68],[.95,.97],[.72,.97]],
 display:{x:.71,y:.218,w:.084,h:.075},
 };}
function move(a,b,t,arc=0){return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)-arc*Math.sin(Math.PI*smooth(t))};}
// One continuous clock drives both hands and their held item; reflow never restarts it.
export function checkoutPose(t,portrait=false){
 const g=checkoutGeometry(portrait);let hand,product=g.pickup,grip=0,alpha=1,stage='Plockar upp';
 if(t<.18)hand=move(g.rest,g.pickup,t/.18);
 else if(t<.26){hand=g.pickup;grip=smooth((t-.18)/.08);}
 else if(t<.43){hand=product=move(g.pickup,g.scanner,(t-.26)/.17,.075);grip=1;stage='För till skannern';}
 else if(t<.50){hand=product=g.scanner;grip=1;stage='Skannar';}
 else if(t<.73){hand=product=move(g.scanner,g.bag,(t-.50)/.23,.14);grip=1;stage='Lägger i kassen';}
 else if(t<.83){hand=product=move(g.bag,{x:g.bag.x,y:g.bag.y+.025},(t-.73)/.10);grip=1;stage='Packar';}
 else if(t<.89){hand={x:g.bag.x,y:g.bag.y+.025};product=move(hand,g.inside,(t-.83)/.06);grip=1-smooth((t-.83)/.06);alpha=1-smooth((t-.87)/.02);stage='Släpper varan';}
 else{hand=move({x:g.bag.x,y:g.bag.y+.025},g.rest,(t-.89)/.11,-.045);product=g.inside;alpha=0;stage='Klar';}
 return {hand,product,grip,alpha,stage,held:t>=.26&&t<.83,rotation:Math.sin(smooth(Math.max(0,(t-.26)/.57))*Math.PI)*-.13};
}
