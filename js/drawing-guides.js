
(()=>{
const crops={
"halloween-ghost-guide.webp":[36,148,1960,643],
"halloween-pumpkin-guide.webp":[36,148,1960,643],
"halloween-bat-guide.webp":[36,148,1960,643],
"boat-chalkboard.png":[63,160,1937,579],"butterfly.png":[39,124,1954,644],
"car-chalkboard.png":[61,161,1939,580],"cat-slate-guide.png":[62,159,1938,587],
"dinosaur.png":[39,112,1953,666],"dog-chalkboard.png":[42,214,1734,672],
"dolphin.png":[39,137,1954,663],"dragon.png":[39,139,1953,652],
"elephant-chalkboard.png":[36,210,1746,659],"flower-chalkboard.png":[63,161,1936,578],
"fox-guide-final.webp":[32,20,1568,575],"giraffe.png":[39,103,1954,701],
"horse.png":[39,110,1953,662],"house-chalkboard.png":[34,224,1741,658],
"kite-chalkboard.png":[62,160,1936,579],"koala.png":[39,146,1953,633],
"lion-guide.webp":[32,18,1568,565],"owl.png":[39,135,1953,656],
"panda.png":[39,134,1954,651],"peacock.png":[39,118,1954,666],
"penguin.png":[39,141,1953,656],"phoenix.png":[39,119,1954,704],
"rabbit-chalkboard.png":[42,184,1733,689],"rocket-chalkboard.png":[44,172,1737,660],
"snake.png":[36,148,1962,642],"tiger.png":[39,122,1954,659],
"tree-chalkboard.png":[61,162,1938,579],"turtle.png":[39,150,1953,664],
"umbrella-chalkboard.png":[63,160,1938,579],"wolf.png":[39,120,1953,623]
};
// Crop inside each source frame so only the shared outer frame is rendered.
const panelInteriors={"halloween-ghost-guide.webp":[[42,154,416,636],[445,154,794,636],[823,154,1170,636],[1199,154,1548,636],[1578,154,1953,636]],"halloween-pumpkin-guide.webp":[[42,154,416,636],[445,154,794,636],[823,154,1170,636],[1199,154,1548,636],[1578,154,1953,636]],"halloween-bat-guide.webp":[[42,154,416,636],[445,154,794,636],[823,154,1170,636],[1199,154,1548,636],[1578,154,1953,636]],"boat-chalkboard.png":[[69,166,424,573],[455,166,790,573],[821,166,1170,573],[1201,166,1550,573],[1580,166,1931,570]],"butterfly.png":[[45,130,401,637],[428,130,788,637],[815,130,1176,637],[1202,130,1564,637],[1590,130,1948,637]],"car-chalkboard.png":[[67,167,423,574],[455,167,794,574],[825,167,1171,574],[1203,167,1551,574],[1582,167,1933,574]],"cat-slate-guide.png":[[68,165,422,581],[453,165,790,581],[821,165,1169,581],[1200,165,1548,581],[1579,165,1932,581]],"dinosaur.png":[[45,118,384,659],[415,118,782,659],[813,118,1179,659],[1209,118,1569,659],[1600,118,1947,659]],"dog-chalkboard.png":[[48,220,366,666],[397,220,704,666],[735,220,1040,666],[1070,220,1379,666],[1409,220,1728,666]],"dolphin.png":[[45,143,424,657],[437,143,789,657],[817,143,1194,657],[1208,143,1576,656],[1589,143,1948,657]],"dragon.png":[[45,145,421,645],[434,145,803,645],[816,145,1191,645],[1204,145,1581,645],[1594,145,1947,645]],"elephant-chalkboard.png":[[42,216,361,653],[388,216,704,653],[729,216,1045,653],[1070,216,1390,653],[1415,216,1740,653]],"flower-chalkboard.png":[[69,167,423,572],[454,167,790,572],[822,167,1170,572],[1202,167,1549,572],[1581,167,1930,572]],"giraffe.png":[[45,109,406,694],[439,109,790,694],[821,109,1173,694],[1205,109,1560,694],[1592,109,1948,694]],"horse.png":[[45,116,382,656],[412,116,779,656],[809,116,1176,656],[1205,116,1572,656],[1602,116,1947,656]],"house-chalkboard.png":[[40,230,360,651],[386,230,703,651],[729,230,1046,651],[1072,230,1388,651],[1415,230,1735,651]],"kite-chalkboard.png":[[68,166,422,573],[454,166,792,573],[823,166,1171,573],[1202,166,1550,573],[1581,166,1930,573]],"koala.png":[[45,152,392,627],[423,152,783,627],[815,152,1177,627],[1208,152,1572,627],[1603,152,1947,627]],"owl.png":[[45,141,397,649],[430,141,788,649],[819,141,1177,649],[1208,141,1567,649],[1597,141,1935,650]],"panda.png":[[45,140,402,644],[436,140,789,644],[820,140,1177,644],[1205,140,1562,644],[1592,140,1948,644]],"peacock.png":[[45,124,389,659],[421,124,783,659],[813,124,1180,659],[1211,124,1574,659],[1604,124,1948,659]],"penguin.png":[[45,147,405,648],[434,147,788,649],[814,147,1169,649],[1198,148,1561,649],[1588,147,1947,649]],"phoenix.png":[[45,125,397,697],[429,125,784,697],[816,125,1177,697],[1209,125,1567,697],[1599,125,1948,697]],"rabbit-chalkboard.png":[[48,190,368,683],[397,190,707,683],[735,190,1041,683],[1069,190,1377,683],[1406,190,1727,683]],"rocket-chalkboard.png":[[50,178,361,653],[391,178,698,653],[728,178,1034,653],[1063,178,1378,653],[1407,178,1731,654]],"snake.png":[[42,154,415,635],[447,154,811,636],[823,154,1189,636],[1202,154,1565,636],[1579,154,1956,635]],"tiger.png":[[45,128,394,653],[427,128,784,653],[817,128,1176,653],[1209,128,1567,653],[1600,128,1948,653]],"tree-chalkboard.png":[[67,168,420,572],[451,168,790,572],[820,168,1170,572],[1199,168,1551,572],[1581,168,1932,572]],"turtle.png":[[45,157,416,657],[428,156,799,657],[811,156,1181,657],[1193,156,1577,657],[1590,156,1947,658]],"umbrella-chalkboard.png":[[69,166,422,573],[454,166,792,573],[824,166,1171,573],[1202,166,1550,573],[1582,166,1932,573]],"wolf.png":[[45,126,386,616],[418,126,780,616],[812,126,1176,616],[1208,126,1573,616],[1604,126,1947,616]]};
const W=1924,PW=372,PH=498,GAP=16,LEFT=0;
const missingNumbers=new Set(["fox-guide-final.webp","lion-guide.webp"]);
const panelCutsCache=new Map();
function getPanelCuts(img,crop,file){
 if(panelCutsCache.has(file))return panelCutsCache.get(file);
 const [x0,y0,x1,y1]=crop,width=x1-x0,height=y1-y0;
 const scan=document.createElement("canvas");scan.width=width;scan.height=height;
 const sc=scan.getContext("2d",{willReadFrequently:true});
 sc.drawImage(img,x0,y0,width,height,0,0,width,height);
 const pixels=sc.getImageData(0,0,width,height).data,continuity=new Float32Array(width);
 for(let x=0;x<width;x++){
  let hits=0,count=0;
  for(let y=0;y<height;y+=2){const k=(y*width+x)*4;if(Math.max(pixels[k],pixels[k+1],pixels[k+2])>80)hits++;count++}
  continuity[x]=hits/count;
 }
 const cuts=[x0];
 for(let i=1;i<5;i++){
  const ideal=width*i/5,radius=Math.ceil(width*.08),lo=Math.max(2,Math.floor(ideal-radius)),hi=Math.min(width-3,Math.ceil(ideal+radius));
  let peak=lo;for(let x=lo+1;x<=hi;x++)if(continuity[x]>continuity[peak])peak=x;
  const baseline=continuity[Math.round(ideal)];
  cuts.push(continuity[peak]>.90&&continuity[peak]-baseline>.12?x0+peak:x0+Math.round(ideal));
 }
 cuts.push(x1);panelCutsCache.set(file,cuts);return cuts;
}
function rounded(ctx,x,y,w,h,r){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.strokeStyle="#416b4e";ctx.lineWidth=4;ctx.stroke();
}
function paint(canvas){
 if(canvas.dataset.rendered||canvas.dataset.loading||canvas.dataset.failed)return;
 const id=canvas.dataset.drawingGuide;
 const lesson=window.newDrawingLessons?.[id];
 if(lesson){
  canvas.dataset.loading="1";
  window.paintNewDrawingSprite(canvas);
  return;
 }
 const file=({spoke:"halloween-ghost-guide.webp",pumpa:"halloween-pumpkin-guide.webp",fladdermus:"halloween-bat-guide.webp",katt:"cat-slate-guide.png",hund:"dog-chalkboard.png",kanin:"rabbit-chalkboard.png",fjaril:"butterfly.png",panda:"panda.png",lejon:"lion-guide.webp",rav:"fox-guide-final.webp",elefant:"elephant-chalkboard.png",uggla:"owl.png",skoldpadda:"turtle.png",dinosaurie:"dinosaur.png",giraff:"giraffe.png",hast:"horse.png",tiger:"tiger.png",drake:"dragon.png",varg:"wolf.png",pafagel:"peacock.png",delfin:"dolphin.png",pingvin:"penguin.png",koala:"koala.png",orm:"snake.png",fenix:"phoenix.png",blomma:"flower-chalkboard.png",hus:"house-chalkboard.png",raket:"rocket-chalkboard.png",bil:"car-chalkboard.png",paraply:"umbrella-chalkboard.png",trad:"tree-chalkboard.png",bat:"boat-chalkboard.png",pappersdrake:"kite-chalkboard.png"})[id];
 const crop=crops[file];
 if(!file||!crop)return;
 canvas.dataset.loading="1";
 const img=new Image();
 img.onload=()=>{
  const renderTop=0,renderHeight=PH;
  canvas.width=W;canvas.height=renderHeight;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  ctx.clearRect(0,0,W,renderHeight);
  const [sx0,sy0,sx1,sy1]=crop,sh=sy1-sy0,cuts=getPanelCuts(img,crop,file);
  for(let i=0;i<5;i++){
   const cellWidth=cuts[i+1]-cuts[i],inset=Math.max(5,Math.round(cellWidth*.025));
   const interior=panelInteriors[file]?.[i];
   const sx=interior?interior[0]:cuts[i]+inset,sw=interior?interior[2]-interior[0]:cellWidth-inset*2;
   const tile=document.createElement("canvas");tile.width=PW-4;tile.height=PH-4;
   const tc=tile.getContext("2d",{willReadFrequently:true});
   tc.fillStyle="#082c1d";tc.fillRect(0,0,tile.width,tile.height);
   const scale=Math.min(tile.width/sw,tile.height/sh);
   const dw=sw*scale,dh=sh*scale,dx=(tile.width-dw)/2,dy=(tile.height-dh)/2;
   if(interior)tc.drawImage(img,sx,interior[1],sw,interior[3]-interior[1],0,0,tile.width,tile.height);
   else tc.drawImage(img,sx,sy0,sw,sh,dx,dy,dw,dh);
   const frame=tc.getImageData(0,0,tile.width,tile.height),p=frame.data;
   for(let k=0;k<p.length;k+=4){
    const dark=Math.max(p[k],p[k+1],p[k+2])<78,amt=dark?.40:.08;
    p[k]=p[k]*(1-amt)+7*amt;p[k+1]=p[k+1]*(1-amt)+43*amt;p[k+2]=p[k+2]*(1-amt)+28*amt;
   }
   tc.putImageData(frame,0,0);
   const x=LEFT+i*(PW+GAP);ctx.drawImage(tile,x+2,renderTop+2);

   rounded(ctx,x,renderTop,PW,PH,17);
   if(missingNumbers.has(file)){
    const cx=x+44,cy=renderTop+43;ctx.beginPath();ctx.arc(cx,cy,34,0,Math.PI*2);
    ctx.fillStyle="#ff6818";ctx.fill();ctx.fillStyle="#fff9ef";
    ctx.font="700 46px system-ui,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(String(i+1),cx,cy+1);
   }
  }
  canvas.dataset.rendered="1";delete canvas.dataset.loading;
  canvas.dispatchEvent(new Event("draw-guide-ready"));
 };
 img.onerror=()=>{
  delete canvas.dataset.loading;canvas.dataset.failed="1";
  canvas.dispatchEvent(new Event("draw-guide-ready"));
 };
 img.src="assets/drawing-guides/"+file+"?v=20261018-unified";
}
window.drawingGuidePanelImage=function(canvas,index){
 const panel=document.createElement("canvas");panel.width=PW;panel.height=PH;
 panel.getContext("2d").drawImage(canvas,LEFT+index*(PW+GAP),0,PW,PH,0,0,PW,PH);
 return panel.toDataURL();
};
window.drawingGuideSprite=function(a){
 return '<canvas class="draw-guide-sprite" data-drawing-guide="'+a.id+'" data-drawing-name="'+a.name+'" width="'+W+'" height="'+PH+'" role="img" aria-label="Fem ritsteg för '+a.name+'"></canvas>';
};
const visibility=window.IntersectionObserver?new IntersectionObserver(entries=>{
 entries.forEach(e=>{if(e.isIntersecting){paint(e.target);visibility.unobserve(e.target)}});
},{rootMargin:"2000px"}):null;
function mount(root){
 const list=[];
 if(root?.matches?.("canvas[data-drawing-guide]"))list.push(root);
 root?.querySelectorAll?.("canvas[data-drawing-guide]").forEach(c=>list.push(c));
 list.forEach(c=>{if(c.dataset.watch)return;
  c.dataset.watch="1";
  if(visibility&&!c.closest(".draw-modal-guides"))visibility.observe(c);
  else paint(c);});
}
const observer=new MutationObserver(records=>records.forEach(rec=>rec.addedNodes.forEach(n=>{if(n.nodeType===1)mount(n)})));
observer.observe(document.body,{childList:true,subtree:true});
mount(document);
})();

// Paced drawing lessons: dedicated geometry and instructions for every motif.
(()=>{
 const NS='http://www.w3.org/2000/svg';
  // Pen routes follow the marks in the original five Penguin panels.
  // Each route is in the same 372 × 498 coordinate space as a gallery panel.
  const penguinSteps=[
   {
    draw:[
     'M81 163C88 106 134 63 185 62C242 58 282 96 288 150C298 200 260 238 204 241C148 247 74 229 81 163Z',
     'M133 229C109 253 91 301 94 344C95 389 121 421 183 427C237 429 273 391 277 342C282 294 269 256 240 231',
     'M129 235C101 253 55 302 45 358C41 373 35 396 49 405C62 411 86 376 96 356',
     'M245 237C276 258 318 307 325 360C332 383 335 407 321 405C306 401 285 376 276 354',
     'M140 400L138 443',
     'M231 400L232 443',
     'M82 454C90 436 121 431 139 435C155 437 171 445 173 459C169 474 80 483 82 454Z',
     'M200 453C211 430 246 432 263 435C277 440 289 449 292 461C281 479 195 481 200 453Z',
     'M186 54L185 455',
     'M76 162L292 160'
    ]
   },
   {
    show:[
     'M77 173C79 110 123 63 187 62C251 59 288 105 295 164C310 220 267 245 205 248C147 256 69 236 77 173Z',
     'M122 238C97 266 85 303 87 346C88 390 100 421 128 442C157 456 218 457 251 435C275 410 287 375 285 337C282 297 268 261 254 237',
     'M122 238C82 258 40 320 30 370C19 418 45 423 89 360',
     'M254 238C293 263 325 312 339 362C351 416 331 423 284 359',
     'M189 53L188 456',
     'M74 172L299 169'
    ],
    draw:[
     'M118 239C81 218 90 148 114 124C138 101 165 106 188 127C208 106 232 103 253 115C287 136 291 207 254 240',
     'M163 210Q188 179 213 210Q188 248 163 210Z',
     'M163 210Q188 217 213 210',
     'M113 400Q128 434 153 445',
     'M259 400Q246 432 224 445',
     'M118 436C94 439 68 452 77 464C83 471 93 470 101 468C101 480 113 481 134 475C145 483 176 471 172 459C165 443 136 434 118 436Z',
     'M128 449Q112 452 100 470',
     'M144 452Q131 462 133 475',
     'M255 435C280 435 301 454 296 465C292 472 279 469 270 467C272 480 253 480 239 474C226 483 196 471 201 459C210 445 241 435 255 435Z',
     'M243 450Q258 451 271 469',
     'M231 454Q243 463 240 475'
    ]
   },
   {
    show:[
     'M70 184C73 126 102 72 166 57M211 59C270 72 298 116 302 184',
     'M85 224C119 263 249 265 290 223',
     'M113 247C83 285 76 366 96 421Q102 432 114 442M257 244C283 285 295 371 270 423Q265 435 251 442',
     'M113 245C73 275 41 319 29 372C15 423 42 421 86 362',
     'M258 244C298 281 325 325 339 373C355 420 333 420 283 356',
     'M117 436C91 437 65 453 73 467C79 473 87 470 94 470C96 485 114 479 130 475C143 485 173 470 171 460C166 445 142 436 117 436Z',
     'M124 449Q104 454 95 471M147 451Q128 462 131 477',
     'M254 436C278 436 303 453 297 466C291 472 279 471 270 468C272 482 252 483 239 476C224 483 196 472 200 461C211 444 239 436 254 436Z',
     'M244 450Q263 453 270 470M228 453Q243 464 239 477'
    ],
    draw:[
     'M170 66Q151 39 165 35L177 55Q179 34 207 22Q191 44 189 55Q201 37 221 40L201 63',
     'M74 174Q75 189 59 197L70 197L63 216L74 208L74 228L83 220',
     'M301 174Q302 187 312 197L302 196L308 215L299 210L298 228L289 220',
     'M85 225Q75 204 86 186C83 155 97 117 124 114C154 111 172 148 168 187',
     'M203 188C198 148 220 112 245 113C271 111 288 153 285 186Q298 204 287 224',
     'M136 258C149 247 213 244 233 261C264 289 275 353 256 395C240 433 215 454 186 450C153 451 127 434 114 398C98 360 103 295 136 258Z',
     'M115 134Q129 121 141 128Q128 128 115 134Z',
     'M230 128Q242 119 256 132Q243 127 230 128Z',
     'M112 170C118 143 151 142 155 171C160 207 116 206 111 182Q109 176 112 170Z',
     'M123 169C128 153 148 150 153 173C154 197 134 205 125 188Q120 181 123 169Z',
     'M143 164a6 6 0 1 0 0 12a6 6 0 1 0 0-12Z',
     'M219 175C219 146 249 143 260 166C275 204 219 215 219 175Z',
     'M220 175C223 153 247 152 252 172C258 194 234 205 224 190Q219 185 220 175Z',
     'M230 162a6 6 0 1 0 0 12a6 6 0 1 0 0-12Z',
     'M153 205Q186 164 219 204Q185 264 153 205Z',
     'M154 205Q173 204 186 216Q203 206 219 204'
    ]
   },
   {
    color:[
     // Pale face, eyes and open beak.
     'M84 181C78 150 93 108 123 106C158 98 180 139 179 178L197 180C200 137 221 100 251 105C279 105 294 143 292 180C322 220 290 250 239 259C200 271 122 267 92 242Q68 222 84 181Z',
     // Pale belly.
     'M128 247Q183 234 244 247C279 298 281 384 245 428C215 470 158 469 128 432C94 395 91 309 128 247Z'
    ]
   },
   {
    color:[
     // Dark plumage on the head, body and flippers.
     'M55 192C67 170 63 115 108 78Q131 55 157 51L157 17L234 14L235 53C280 65 315 111 320 187L328 225Q309 251 268 252Q262 223 289 193C283 156 276 104 244 106C212 104 201 139 197 184L172 184C171 140 151 104 122 106C93 110 83 155 83 188L96 232L71 232Z',
     'M103 238L137 247C113 308 100 391 146 442L102 446L86 373C67 392 52 423 23 414C9 378 54 281 103 238Z',
     'M239 247L277 237C318 274 369 374 356 415C333 425 306 391 290 370L274 446L231 446C273 385 262 302 239 247Z',
     // Cream face and belly, orange beak and feet.
     'M80 175C79 139 97 104 130 104C164 101 179 140 178 182L153 190L149 217L185 240L222 218L225 192L198 184C199 141 220 102 250 103C279 104 300 141 299 178C323 215 303 253 252 260C215 272 140 274 99 250Q62 223 80 175Z',
     'M127 246Q187 235 248 246C280 294 288 387 245 435C218 461 151 465 124 435C90 394 93 302 127 246Z',
     'M155 193Q187 166 224 193L232 212Q193 259 154 218Z',
     'M65 449Q111 422 159 437Q178 441 181 473Q136 499 66 478Z',
     'M195 451Q244 421 296 440Q309 449 313 473Q264 497 196 481Z'
    ]
   }
  ];
 function element(name,attrs={}){const e=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e}
  function renderPenguinStep(svg,index,panelImage){
   const step=penguinSteps[index];
   const maskId='draw-penguin-mask-'+index;
   const mask=element('mask',{id:maskId,maskUnits:'userSpaceOnUse',x:0,y:0,width:372,height:498});
   mask.append(
    element('rect',{x:0,y:0,width:372,height:498,rx:17,fill:'none',stroke:'white','stroke-width':12}),
    element('circle',{cx:40,cy:41,r:44,fill:'white'})
   );
   svg.append(mask);

   // Keep the previous drawing visible underneath the two coloring steps.
   let previous,clip;
   if(step.color){
    const clipId='draw-penguin-previous-'+index;
    clip=element('clipPath',{id:clipId});
    clip.append(element('path',{d:'M85 0H372V498H0V83H85Z'}));
    previous=element('image',{href:panelImage(index-1),width:372,height:498,'clip-path':'url(#'+clipId+')'});
    svg.append(clip,previous);
   }
   const picture=element('image',{href:panelImage(index),width:372,height:498,mask:'url(#'+maskId+')'});
   svg.append(picture);

   const route=d=>element('path',{d,fill:'none',stroke:'white','stroke-width':18,'stroke-linecap':'round','stroke-linejoin':'round'});
   for(const d of step.show??[])mask.append(route(d));
   const active=(step.draw??[]).map(d=>{
    const p=route(d);mask.append(p);
    return {p};
   });
   for(const d of step.color??[]){
    const p=element('path',{d,fill:'white','fill-opacity':0});mask.append(p);
    active.push({p,color:true,fillOnly:true,duration:600});
   }
   return {active,finish(){
    picture.removeAttribute('mask');
    mask.remove();
    previous?.remove();
    clip?.remove();
   }};
  }
 function mountLesson(canvas){
  const id=canvas.dataset.drawingGuide;
  const holder=canvas.closest('.draw-modal-guides');
  if(!canvas.isConnected||!holder||holder.querySelector('.draw-lesson'))return;
  if(!canvas.dataset.rendered){
   if(canvas.dataset.failed){
    const error=document.createElement('p');error.className='draw-lesson';
    error.textContent='Det gick inte att ladda ritstegen.';
    holder.append(error);
   }else if(!canvas.dataset.lessonWaiting){
    canvas.dataset.lessonWaiting='1';
    canvas.addEventListener('draw-guide-ready',()=>mountLesson(canvas),{once:true});
   }
   return;
  }
  const name=canvas.dataset.drawingName;
  holder.closest('.draw-modal').classList.add('animated-drawing');
  if(!document.getElementById('draw-lesson-style')){
   const style=document.createElement('style');style.id='draw-lesson-style';style.textContent=`
body:has(.draw-modalback){overflow:hidden}
.draw-modalback{padding:8px!important}
.draw-modal.animated-drawing{box-sizing:border-box;display:flex!important;flex-direction:column;gap:6px;width:min(1320px,calc(100vw - 16px))!important;max-height:calc(100dvh - 16px)!important;padding:10px!important;overflow:hidden;--board-h:min(34dvh,calc((100vw - 52px)*.2588));}
.draw-modal.animated-drawing .draw-modal-title{flex:none;margin:0 46px 0 0;min-height:38px;gap:8px}
.draw-modal.animated-drawing .draw-modal-title h2{font-size:clamp(17px,2.4vw,26px)}
.draw-modal.animated-drawing .draw-modal-title>span{font-size:28px}
.draw-modal.animated-drawing .draw-modal-close{top:10px;right:10px;width:36px;height:36px;font-size:26px;z-index:1}
.draw-modal.animated-drawing .draw-modal-guides{flex:none;min-width:0;width:min(100%,calc(var(--board-h)*3.86346));align-self:center;box-sizing:content-box;background:#182b21!important;padding:0!important;margin:0!important}
.draw-modal.animated-drawing .draw-modal-guides>.draw-guide-sprite{display:block;width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:1924/498!important;margin:0!important}
.draw-modal.animated-drawing .draw-lesson{margin:8px 0 0;color:#fff4e2}
.draw-modal.animated-drawing .draw-lesson-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));column-gap:.8316%;align-items:start}

.draw-lesson-card{position:relative;min-width:0;margin:0;display:flex;flex-direction:column;align-items:center}
.draw-modal.animated-drawing .draw-lesson-board,.draw-modal.animated-drawing .draw-lesson-wait{box-sizing:border-box;width:100%;height:auto;aspect-ratio:372/498;border:2px solid #416b4e;border-radius:12px;background:radial-gradient(ellipse at top,#164b34,#082c1d);margin:0 auto;}
.draw-lesson-board{display:block}
.draw-lesson-pen{position:absolute;inset:0;width:100%;aspect-ratio:372/498;pointer-events:none}
.draw-modal.animated-drawing .draw-lesson-reference{border:0;background:#102c1b}
.draw-lesson-wait{display:flex;align-items:center;justify-content:center;padding:6px;text-align:center}
.draw-lesson button{font:inherit;cursor:pointer;border-radius:10px;padding:6px;border:1px solid #709680;background:#f8ae55;color:#18231e;font-weight:750;min-height:44px;max-width:100%;white-space:normal;line-height:1.2}
.draw-lesson button:focus-visible{outline:3px solid white;outline-offset:2px}
.draw-modal.animated-drawing .draw-lesson-replay{margin-top:5px;background:#214e38!important;color:#fff4e2!important;width:100%;font-size:12px!important}
.draw-modal.animated-drawing .draw-lesson-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.draw-lesson [hidden]{display:none!important}
@media(max-width:600px){
 .draw-modal.animated-drawing{padding:8px!important;--board-h:min(32dvh,calc((100vw - 36px)*.2588))}
 .draw-lesson button{font-size:10px;padding:3px;min-height:36px;border-radius:6px}
}
@media(max-height:460px) and (orientation:landscape){
 .draw-modal.animated-drawing{--board-h:calc((100dvh - 112px)/2);padding:8px!important;gap:4px}
 .draw-modal.animated-drawing .draw-modal-title{min-height:30px}
 .draw-modal.animated-drawing .draw-modal-title h2{font-size:17px}
 .draw-modal.animated-drawing .draw-modal-title>span{font-size:22px}
 .draw-lesson button{font-size:10px;padding:3px;min-height:30px}
}

`;
   document.head.append(style);
  }
  const section=document.createElement('section');section.className='draw-lesson';section.setAttribute('aria-label','Rita '+name.toLocaleLowerCase('sv')+' med animation');
  section.innerHTML='<div class="draw-lesson-grid"></div><p class="draw-lesson-status" role="status" aria-live="polite"></p>';
  // The site's dialog backdrop delegates close clicks: keep lesson clicks inside it.
  section.addEventListener('click',e=>e.stopPropagation());holder.append(section);
  const grid=section.querySelector('.draw-lesson-grid'),status=section.querySelector('.draw-lesson-status');
   const panelImages=[];
   const panelImage=index=>panelImages[index]??=window.drawingGuidePanelImage(canvas,index);
  let frame=0,playing=false,completed=-1,disposed=false;
  const cleanup=new MutationObserver(()=>{if(!section.isConnected){disposed=true;cancelAnimationFrame(frame);cleanup.disconnect();}});
  cleanup.observe(document.body,{childList:true,subtree:true});

  function play(index,card,replay=false){
   if(playing||disposed)return;playing=true;
   section.querySelectorAll('.draw-lesson-replay').forEach(b=>b.disabled=true);
   const next=grid.querySelector('.draw-lesson-wait');if(next)next.hidden=true;
   card.innerHTML='';
   const label=name+', ritsteg '+(index+1);
   const svg=element('svg',{viewBox:'0 0 372 498',class:'draw-lesson-board draw-lesson-reference',role:'img','aria-label':label});
   const penguin=id==='pingvin';
   if(penguin)card.append(svg);
   const reference=penguin?renderPenguinStep(svg,index,panelImage):window.prepareDrawingReference(canvas,index);
   const pen=element('circle',{r:4,fill:'#ffbf63',stroke:'#fff','stroke-width':1,visibility:'hidden'});
   svg.append(pen);
   if(penguin){
    reference.active.forEach(a=>{
     if(a.color)return;
     a.length=a.p.getTotalLength();
     a.p.style.strokeDasharray=a.length;
     a.p.style.strokeDashoffset=a.length;
     a.duration=Math.max(400,Math.min(2000,a.length*5));
    });
   }else{
    reference.canvas.className='draw-lesson-board draw-lesson-reference';
    reference.canvas.setAttribute('role','img');
    reference.canvas.setAttribute('aria-label',label);
    svg.setAttribute('class','draw-lesson-pen');
    svg.setAttribute('aria-hidden','true');
    card.append(reference.canvas,svg);
   }

   status.textContent='Steg '+(index+1)+' av 5 – följ pennan.';
   let item=0,elapsed=0,last=0;
   function tick(now){
    if(disposed||!section.isConnected)return;
    const dt=last?now-last:0;last=now;
    if(!document.hidden)elapsed+=dt;
    if(penguin){
     const a=reference.active[item],progress=Math.min(1,elapsed/a.duration);
     if(a.color){
      a.p.setAttribute('fill-opacity',progress);
      pen.setAttribute('visibility','hidden');
     }else{
      a.p.style.strokeDashoffset=a.length*(1-progress);
      const pt=a.p.getPointAtLength(a.length*progress);
      pen.setAttribute('visibility','visible');
      pen.setAttribute('cx',pt.x);
      pen.setAttribute('cy',pt.y);
     }
     if(progress===1){item++;elapsed=0}
     if(item<reference.active.length){frame=requestAnimationFrame(tick);return}
     reference.finish();
    }else{
     const progress=Math.min(1,elapsed/reference.duration);
     const pt=reference.paint(progress);
     if(pt){
      pen.setAttribute('visibility','visible');
      pen.setAttribute('cx',pt.x);
      pen.setAttribute('cy',pt.y);
     }
     if(progress<1){frame=requestAnimationFrame(tick);return}
     svg.remove();
    }
    pen.remove();playing=false;completed=Math.max(completed,index);
    const repeat=document.createElement('button');repeat.type='button';repeat.className='draw-lesson-replay';repeat.textContent='Visa igen';repeat.addEventListener('click',()=>play(index,card,true));card.append(repeat);
    section.querySelectorAll('.draw-lesson-replay').forEach(b=>b.disabled=false);
    if(next)next.hidden=false;
    if(!replay&&index<4)addWait(index+1);
    status.textContent=completed===4?'Alla fem steg är klara. Fint jobbat!':'Paus – rita färdigt i din egen takt. Tryck sedan på ”Okej, jag är klar”.';
   }
   frame=requestAnimationFrame(tick);
  }
  function addWait(index){
   const slot=document.createElement('div');slot.className='draw-lesson-wait';
   const button=document.createElement('button');button.type='button';button.textContent='Okej, jag är klar';
   button.addEventListener('click',()=>{if(playing)return;const card=document.createElement('figure');card.className='draw-lesson-card';slot.replaceWith(card);play(index,card);card.tabIndex=-1;card.focus({preventScroll:true})});
   slot.append(button);grid.append(slot);
  }
  const first=document.createElement('figure');first.className='draw-lesson-card';grid.append(first);play(0,first);
 }
 function scan(){document.querySelectorAll('.draw-modal-guides canvas[data-drawing-guide]').forEach(mountLesson)}
 new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
