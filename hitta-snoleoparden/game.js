(() => {
'use strict';
const levels=window.snowLeopardLevels;
const $=id=>document.getElementById(id);
const dialog=$('answerDialog');
let current=0,found=false;
if(window.self!==window.top)document.body.classList.add('embedded');
function ring(level){return level.targets.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"></circle>`).join('');}
function show(index){
 current=Math.max(0,Math.min(levels.length-1,index));found=false;
 if(dialog.open)dialog.close();
 const level=levels[current];
 $('landscape').src=level.src;
 $('counter').textContent=`Bild ${current+1} av ${levels.length}`;
 $('picker').value=String(current);
 $('foundRing').innerHTML='';$('status').textContent='';
 $('previous').disabled=current===0;$('next').disabled=current===levels.length-1;
 $('viewport').classList.remove('zoomed');$('viewport').scrollTo(0,0);
 $('zoom').setAttribute('aria-pressed','false');$('zoom').textContent='Förstora bilden';
 if(levels[current+1]){const preload=new Image();preload.src=levels[current+1].src;}
}
$('picker').innerHTML=levels.map((_,i)=>`<option value="${i}">Bild ${i+1}</option>`).join('');
$('picker').addEventListener('change',e=>show(Number(e.target.value)));
$('previous').addEventListener('click',()=>show(current-1));
$('next').addEventListener('click',()=>show(current+1));
$('answer').addEventListener('click',()=>{
 const level=levels[current];
 $('answerImage').src=$('landscape').src;
 $('answerRing').innerHTML=ring(level);
 $('answerTitle').textContent=`Svaret – bild ${current+1}`;
 dialog.showModal();
});
$('closeAnswer').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
$('zoom').addEventListener('click',()=>{const zoomed=$('viewport').classList.toggle('zoomed');$('zoom').setAttribute('aria-pressed',String(zoomed));$('zoom').textContent=zoomed?'Visa hela bilden':'Förstora bilden';});
let pointerStart=null;
$('scene').addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
$('scene').addEventListener('pointercancel',()=>{pointerStart=null;});
$('scene').addEventListener('click',e=>{
 if(found||!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>12)return;
 pointerStart=null;
 const b=$('scene').getBoundingClientRect(),x=(e.clientX-b.left)/b.width*1672,y=(e.clientY-b.top)/b.height*941;
 if(levels[current].targets.some(([cx,cy,r])=>Math.hypot(cx-x,cy-y)<=r)){
 found=true;$('foundRing').innerHTML=ring(levels[current]);$('status').textContent=current===levels.length-1?'Hittad! Det var sista bilden.':'Hittad! Bra spanat. Välj nästa bild när du vill.';
 }else $('status').textContent='Inte där – fortsätt leta!';
});
$('landscape').addEventListener('error',()=>{$('status').textContent='Bilden kunde inte laddas. Prova att ladda om sidan.';});
show(0);
})();
