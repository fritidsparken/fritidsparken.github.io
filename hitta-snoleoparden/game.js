(() => {
'use strict';
const levels=window.snowLeopardLevels;
const $=id=>document.getElementById(id);
const dialog=$('answerDialog');
let current=0,found=false,answerVisible=false;
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
 if(levels[current+1]){const preload=new Image();preload.src=levels[current+1].src;}
}
$('picker').innerHTML=levels.map((_,i)=>`<option value="${i}">Bild ${i+1}</option>`).join('');
$('picker').addEventListener('change',e=>show(Number(e.target.value)));
$('previous').addEventListener('click',()=>show(current-1));
$('next').addEventListener('click',()=>show(current+1));
function openImage(showAnswer){
 answerVisible=showAnswer;
 $('answerImage').src=$('landscape').src;
 $('answerImage').alt=showAnswer?'Landskapet med snöleopardens plats markerad med en röd ring':$('landscape').alt;
 $('answerRing').innerHTML=showAnswer||found?ring(levels[current]):'';
 $('answerTitle').textContent=`${showAnswer?'Svaret':'Hitta snöleoparden'} – bild ${current+1}`;
 $('dialogStatus').textContent=showAnswer?'':$('status').textContent;
 $('dialogScene').style.cursor=showAnswer?'default':'crosshair';
 dialog.showModal();
}
$('answer').addEventListener('click',()=>openImage(true));
$('zoom').addEventListener('click',()=>openImage(false));
$('closeAnswer').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
for(const scene of [$('scene'),$('dialogScene')]){
let pointerStart=null;
scene.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY,e.pointerType];});
scene.addEventListener('pointercancel',()=>{pointerStart=null;});
scene.addEventListener('click',e=>{
 if((scene.id==='dialogScene'&&answerVisible)||found||!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>12)return;
 const touch=pointerStart[2]==='touch';pointerStart=null;
 const b=scene.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*1672,y=(e.clientY-b.top)/b.height*941;
 const minHitRadius=touch?24*1672/b.width:0;
 if(levels[current].targets.some(([cx,cy,r])=>Math.hypot(cx-x,cy-y)<=Math.max(r,minHitRadius))){
 found=true;$('foundRing').innerHTML=ring(levels[current]);$('status').textContent=current===levels.length-1?'Hittad! Det var sista bilden.':'Hittad! Bra spanat. Välj nästa bild när du vill.';
 }else $('status').textContent='Inte där – fortsätt leta!';
 if(dialog.open){
  $('answerRing').innerHTML=found?ring(levels[current]):'';
  $('dialogStatus').textContent=$('status').textContent;
 }
});
}
for(const image of [$('landscape'),$('answerImage')]){
 image.addEventListener('load',()=>{
  image.parentElement.style.setProperty('--image-ratio',`${image.naturalWidth} / ${image.naturalHeight}`);
 });
}
$('landscape').addEventListener('error',()=>{$('status').textContent='Bilden kunde inte laddas. Prova att ladda om sidan.';});
show(0);
})();
