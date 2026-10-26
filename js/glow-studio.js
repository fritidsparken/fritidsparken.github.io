/* The game owns its viewport and input. Removing the iframe releases the renderer. */
(()=>{
 'use strict';
 let frame=null,overflow='',locked=false;
 function gallery(){return '<section class="glow-embed"><iframe id="glowStudioFrame" title="Glow Studio – smink och nagelkonst" data-src="./games/glow-studio/index.html?v=cutout-customer-20261026-1" allow="fullscreen" allowfullscreen style="display:block;width:100%;height:100dvh;border:0;background:#f3e9de"></iframe></section>';}
 function start(){destroy();frame=document.getElementById('glowStudioFrame');if(!frame)return;overflow=document.body.style.overflow;document.body.style.overflow='hidden';locked=true;Object.assign(frame.parentElement.style,{position:'fixed',inset:'0',zIndex:'10000',background:'#f3e9de'});frame.src=frame.dataset.src;frame.focus();}
 function destroy(){if(frame){frame.remove();frame=null;}if(locked){document.body.style.overflow=overflow;locked=false;}}
 function close(){if(!frame)return;destroy();window.FPGameHub?.render();document.querySelector('.games-heading')?.scrollIntoView({block:'start'});}
 window.addEventListener('message',e=>{if(frame&&e.source===frame.contentWindow&&e.origin===location.origin&&e.data?.type==='fp-glow-close')close();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 window.FPGlowStudio={gallery,start,destroy};
})();
