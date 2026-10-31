/* Isolated fullscreen lifecycle, shared by all site themes. */
(()=>{'use strict';let frame=null,overflow='',locked=false;function gallery(){return '<section><iframe id="penaltyFrame" title="Straffläggaren" data-src="./games/strafflaggaren/index.html?v=1" allow="fullscreen" allowfullscreen style="display:block;width:100%;height:100dvh;border:0;background:#092b33"></iframe></section>';}function start(){destroy();
 if (matchMedia('(max-width: 700px), (pointer: coarse) and (max-height: 600px)').matches) {
   location.assign('./games/strafflaggaren/');
   return;
 }
 frame=document.getElementById('penaltyFrame');if(!frame)return;overflow=document.body.style.overflow;document.body.style.overflow='hidden';locked=true;Object.assign(frame.parentElement.style,{position:'fixed',inset:'0',zIndex:'10000'});frame.src=frame.dataset.src;frame.focus();window.FPGameNavigation?.remove();}function destroy(){if(frame){frame.remove();frame=null;}if(locked){document.body.style.overflow=overflow;locked=false;}}window.FPStrafflaggaren={gallery,start,destroy};})();
