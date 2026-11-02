// Original physically inspired sound design, not recordings. Generated once,
// replayed as buffers with variation; no oscillators or noise allocation per frame.
export function random(seed=1){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function impactSample(rate,kind='pin',seed=1){
 const rng=random(seed),duration=kind==='pin'?.65:kind==='pinfall'?.38:.28;
 const data=new Float32Array(Math.ceil(rate*duration));
 const modes=kind==='pin'?[[430,.065,.30],[710,.043,.20],[1230,.025,.15],[2100,.013,.07]]:kind==='pinfall'?[[290,.045,.30],[590,.027,.14],[1150,.013,.08]]:[[82,.065,.40],[146,.035,.16],[330,.014,.06]];
 const tuning=.90+rng()*.2;let low=0;
 for(let i=0;i<data.length;i++){const t=i/rate,white=rng()*2-1;low+=.15*(white-low);let value=0;for(const [hz,decay,amp]of modes)value+=Math.sin(2*Math.PI*hz*t*tuning)*Math.exp(-t/decay)*amp;
 const crack=(white-low)*Math.exp(-t/(kind==='pin'?.009:.006))*.32;
 const body=low*Math.exp(-t/.055)*.26;data[i]=(value+crack+body)*Math.min(1,t/.0005)*.7;
 }return data;
}
export function rollingSample(rate,seed=31){
 const rng=random(seed),data=new Float32Array(rate*2);let low=0,mid=0;
 for(let i=0;i<data.length;i++){const t=i/rate,n=rng()*2-1;low+=.022*(n-low);mid+=.17*(n-mid);const texture=(low*1.8+mid*.16)*(1+.14*Math.sin(2*Math.PI*11*t));data[i]=texture+.012*Math.sin(2*Math.PI*63*t);}
 // Periodic crossfade removes the seam without fading the loop to silence.
 const n=Math.floor(rate*.08);for(let i=0;i<n;i++){const a=i/n;data[data.length-n+i]=data[data.length-n+i]*(1-a)+data[i]*a;}const loop=data.slice(n),seam=loop[0]-loop.at(-1);for(let i=0;i<128;i++)loop[loop.length-128+i]+=seam*(i/127);return loop;
}
export function roomImpulse(rate){const rng=random(16),length=Math.ceil(rate*.48),data=new Float32Array(length);for(let i=0;i<length;i++)data[i]=(rng()*2-1)*Math.exp(-i/rate*15)*.018;for(const [time,gain]of [[.019,.18],[.037,.12],[.061,.07],[.097,.04]])data[Math.floor(time*rate)]+=gain;return data;}
