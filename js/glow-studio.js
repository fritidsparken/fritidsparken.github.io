/* Glow Studio is isolated so painting input and WebGL resources cannot leak into
 * the activity page. Destroy removes the frame and its entire renderer context. */
(()=>{
 'use strict';
 let frame=null;
 function gallery(){return '<section class="glow-embed"><iframe id="glowStudioFrame" title="Glow Studio – smink och nagelkonst" data-src="./games/glow-studio/index.html" allow="fullscreen" allowfullscreen style="display:block;width:100%;height:min(900px,90dvh);min-height:580px;border:0;border-radius:24px;background:#f3e9de"></iframe><p style="text-align:center;font-size:12px"><a href="./games/glow-studio/index.html">Öppna Glow Studio i eget fönster</a></p></section>';}
 function start(){destroy();frame=document.getElementById('glowStudioFrame');if(frame)frame.src=frame.dataset.src;}
 function destroy(){if(frame){frame.removeAttribute('src');frame.remove();frame=null;}}
 window.FPGlowStudio={gallery,start,destroy};
})();
