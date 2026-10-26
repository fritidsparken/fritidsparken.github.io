/* Isolated game frame: input, animation and audio are released on close. */
(()=>{'use strict';let frame=null,overflow='',locked=false;
function gallery(){return '<section class="clinic-embed"><iframe id="djurklinikenFrame" title="Djurkliniken – ta hand om små djur" data-src="./games/djurkliniken/index.html?v=20261026-2" allow="fullscreen" allowfullscreen style="display:block;width:100%;height:100dvh;border:0;background:#eff4eb"></iframe></section>';}
function start(){destroy();frame=document.getElementById('djurklinikenFrame');if(!frame)return;overflow=document.body.style.overflow;document.body.style.overflow='hidden';locked=true;Object.assign(frame.parentElement.style,{position:'fixed',inset:'0',zIndex:'10000',background:'#eff4eb'});frame.src=frame.dataset.src;frame.focus();}
function destroy(){if(frame){frame.remove();frame=null;}if(locked){document.body.style.overflow=overflow;locked=false;}}
function close(){if(!frame)return;destroy();window.FPGameHub?.render();document.querySelector('.games-heading')?.scrollIntoView({block:'start'});}
window.addEventListener('message',e=>{if(frame&&e.source===frame.contentWindow&&e.origin===location.origin&&e.data?.type==='fp-clinic-close')close();});window.addEventListener('keydown',e=>{if(e.key==='Escape')close();});window.FPDjurkliniken={gallery,start,destroy};})();
