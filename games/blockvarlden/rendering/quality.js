// Keep the HUD at native resolution while adapting only the 3D drawing buffer.
export function adaptiveGraphics(renderer){
 let ceiling=1,level=1,scale=1,samples=[],lastChange=0,slow=false;
 function apply(){renderer.setPixelRatio(ceiling*scale);renderer.shadowMap.enabled=level>=2&&!slow}
 return {
  set(quality){level=quality;ceiling=Math.min(devicePixelRatio,[1,1.3,1.6,2][quality]);scale=1;slow=false;samples=[];lastChange=0;apply()},
  sample(ms,now){if(ms<1||ms>1500)return;samples.push(ms);if(samples.length<8||now-lastChange<1400)return;
   const sorted=samples.sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)];samples=[];
   let next=scale;if(median>70)next=Math.max(.46,scale*.72);else if(median>40)next=Math.max(.46,scale*.87);else if(median<20&&now-lastChange>6500)next=Math.min(1,scale+.07);
   if(Math.abs(next-scale)<.015)return;scale=next;slow=scale<.76;lastChange=now;apply()},
  get level(){return slow?0:level},
  resetSamples(){samples=[]}
 };
}
