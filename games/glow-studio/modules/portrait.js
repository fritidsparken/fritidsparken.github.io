const W=900,H=600;
const zones={
 face:(x,y)=>((x-450)/218)**2+((y-332)/245)**2<=1,
 lip:(x,y)=>((x-450)/91)**2+((y-449)/31)**2<=1,
 blush:(x,y)=>((x-330)/82)**2+((y-368)/58)**2<=1||((x-570)/82)**2+((y-368)/58)**2<=1,
 eyes:(x,y)=>((x-360)/78)**2+((y-294)/42)**2<=1||((x-540)/78)**2+((y-294)/42)**2<=1
};
const hexRgb=value=>{const h=String(value||'#d65f83').replace('#','');const v=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return[(v>>16)&255,(v>>8)&255,v&255];};
export function createPortraitPainter({stage,media,canvas,image,cursor,history,getState,onStroke,checkpoint}){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});canvas.width=W;canvas.height=H;
 let active=false,dirty=false,last=null,snapshot=null,restoreCounters=null,currentFocus='all',currentZoom=1;
 const focusPoints={all:[450,310,1],eyes:[450,295,1.48],lips:[450,445,1.72]};
 function fit(){
  const r=stage.getBoundingClientRect(),f=focusPoints[currentFocus]||focusPoints.all;
  const scale=Math.max(r.width/W,r.height/H)*f[2]*currentZoom;
  media.style.width=`${W*scale}px`;media.style.height=`${H*scale}px`;
  media.style.left=`${r.width*.5-f[0]*scale}px`;media.style.top=`${r.height*.48-f[1]*scale}px`;
 }
 const observer=new ResizeObserver(fit);observer.observe(stage);
 function local(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
 function allowed(tool,x,y){if(tool==='lip')return zones.lip(x,y);if(tool==='blush')return zones.blush(x,y);if(['shadow','liner','mascara'].includes(tool))return zones.eyes(x,y);return zones.face(x,y);}
 function radius(tool,size){const base={foundation:38,blush:42,shadow:33,liner:5,mascara:7,lip:18,glitter:16}[tool]||20;return base*(.72+Number(size||2)*.17);}
 function stamp(x,y,state){
  if(!allowed(state.tool,x,y))return false;
  const r=radius(state.tool,state.size),[red,green,blue]=hexRgb(state.color);
  if(state.tool==='glitter'){
   for(let i=0;i<4;i++){const a=(x*13+y*7+i*2.4)%6.283,d=r*(.15+i*.18);ctx.fillStyle=i%2?`rgba(255,248,230,.72)`:`rgba(${red},${green},${blue},.5)`;ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,1.5+i%2,0,6.283);ctx.fill();}
  }else{
   const alpha={foundation:.075,blush:.075,shadow:.12,liner:.62,mascara:.55,lip:.32}[state.tool]||.14;
   const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${red},${green},${blue},${alpha})`);g.addColorStop(.72,`rgba(${red},${green},${blue},${alpha*.62})`);g.addColorStop(1,`rgba(${red},${green},${blue},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
  }
  return true;
 }
 function draw(a,b,state){const d=Math.hypot(b.x-a.x,b.y-a.y),step=Math.max(2,radius(state.tool,state.size)*.23),n=Math.max(1,Math.ceil(d/step));let hit=false;for(let i=0;i<=n;i++){const t=i/n;hit=stamp(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,state)||hit;}return hit;}
 function moveCursor(p,state){cursor.style.left=`${p.x/W*100}%`;cursor.style.top=`${p.y/H*100}%`;cursor.style.width=cursor.style.height=`${radius(state.tool,state.size)*2/W*100}%`;cursor.hidden=false;}
 function down(e){if(e.pointerType==='mouse'&&e.button!==0)return;const state=getState();if(state.enabled===false)return;e.preventDefault();const p=local(e);if(!allowed(state.tool,p.x,p.y))return;active=true;dirty=false;last=p;snapshot=ctx.getImageData(0,0,W,H);restoreCounters=checkpoint();canvas.setPointerCapture?.(e.pointerId);moveCursor(p,state);dirty=stamp(p.x,p.y,state);}
 function move(e){const state=getState(),p=local(e);if(state.enabled===false){cursor.hidden=true;return;}moveCursor(p,state);if(!active)return;e.preventDefault();dirty=draw(last,p,state)||dirty;last=p;}
 function finish(e,cancel=false){if(!active)return;active=false;canvas.releasePointerCapture?.(e.pointerId);if(cancel){ctx.putImageData(snapshot,0,0);return;}if(dirty){const data=snapshot,restore=restoreCounters;history.push({bytes:data.data.byteLength,restore(){ctx.putImageData(data,0,0);restore();}});onStroke(getState());}}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',e=>finish(e));canvas.addEventListener('pointercancel',e=>finish(e,true));canvas.addEventListener('pointerleave',()=>{if(!active)cursor.hidden=true;});
 return{
  show(value){stage.hidden=!value;if(value)requestAnimationFrame(fit);else cursor.hidden=true;},
  clear(){ctx.clearRect(0,0,W,H);},
  focus(value='all',zoom=1){currentFocus=value;currentZoom=Math.max(.82,Math.min(1.7,zoom));fit();},
  renderTo(target,x,y,w,h){target.drawImage(image,x,y,w,h);target.drawImage(canvas,x,y,w,h);},
  dispose(){observer.disconnect();canvas.replaceWith(canvas.cloneNode(false));}
 };
}
