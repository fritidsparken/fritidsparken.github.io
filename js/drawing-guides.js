
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
const W=1993,H=789,PW=372,PH=498,GAP=16,LEFT=34,TOP=147;
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
 if(canvas.dataset.rendered||canvas.dataset.loading)return;
 const id=canvas.dataset.drawingGuide;
 const file=({spoke:"halloween-ghost-guide.webp",pumpa:"halloween-pumpkin-guide.webp",fladdermus:"halloween-bat-guide.webp",katt:"cat-slate-guide.png",hund:"dog-chalkboard.png",kanin:"rabbit-chalkboard.png",fjaril:"butterfly.png",panda:"panda.png",lejon:"lion-guide.webp",rav:"fox-guide-final.webp",elefant:"elephant-chalkboard.png",uggla:"owl.png",skoldpadda:"turtle.png",dinosaurie:"dinosaur.png",giraff:"giraffe.png",hast:"horse.png",tiger:"tiger.png",drake:"dragon.png",varg:"wolf.png",pafagel:"peacock.png",delfin:"dolphin.png",pingvin:"penguin.png",koala:"koala.png",orm:"snake.png",fenix:"phoenix.png",blomma:"flower-chalkboard.png",hus:"house-chalkboard.png",raket:"rocket-chalkboard.png",bil:"car-chalkboard.png",paraply:"umbrella-chalkboard.png",trad:"tree-chalkboard.png",bat:"boat-chalkboard.png",pappersdrake:"kite-chalkboard.png"})[id];
 const crop=crops[file];
 if(!file||!crop)return;
 canvas.dataset.loading="1";
 const img=new Image();
 img.onload=()=>{
  const renderTop=16,renderHeight=PH+32;
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
 };
 img.onerror=()=>{delete canvas.dataset.loading;canvas.dataset.failed="1"};
 img.src="assets/drawing-guides/"+file+"?v=20261018-unified";
}
window.drawingGuideSprite=function(a){
 return '<canvas class="draw-guide-sprite" data-drawing-guide="'+a.id+'" width="1993" height="789" role="img" aria-label="Fem enhetliga ritsteg för '+a.name+'; sista steget är färglagt"></canvas>';
};
const visibility=window.IntersectionObserver?new IntersectionObserver(entries=>{
 entries.forEach(e=>{if(e.isIntersecting){paint(e.target);visibility.unobserve(e.target)}});
},{rootMargin:"2000px"}):null;
function mount(root){
 const list=[];
 if(root?.matches?.("canvas[data-drawing-guide]"))list.push(root);
 root?.querySelectorAll?.("canvas[data-drawing-guide]").forEach(c=>list.push(c));
 list.forEach(c=>{if(c.dataset.watch)return;c.dataset.watch="1";visibility?visibility.observe(c):paint(c)});
}
const observer=new MutationObserver(records=>records.forEach(rec=>rec.addedNodes.forEach(n=>{if(n.nodeType===1)mount(n)})));
observer.observe(document.body,{childList:true,subtree:true});
mount(document);
})();

// Pilot: only the cat dialog gets the paced, stroke-by-stroke lesson.
(()=>{
 const NS='http://www.w3.org/2000/svg';
 const head='M72 122 C72 48 208 48 208 122 C208 190 72 190 72 122 Z';
 const body='M106 177 C76 201 75 264 100 282 C119 295 162 295 180 282 C205 255 192 196 172 177 C154 161 124 161 106 177 Z';
 const tail='M180 330 C232 330 252 303 241 265 C234 241 229 222 249 207 C211 201 201 234 211 266 C222 300 210 310 182 309';
 const ears=['M77 97 Q61 61 66 25 Q94 34 117 66','M167 66 Q190 36 215 25 Q220 65 204 98','M79 78 L77 43 Q96 52 103 65','M181 66 Q195 50 205 43 L202 80'];
 const outline='M76 98 Q66 114 70 133 L59 142 L72 142 L61 153 L78 151 Q92 169 113 173 L124 179 L132 175 L142 180 L153 175 Q185 174 204 154 L220 156 L209 145 L223 145 L209 133 Q211 111 203 98';
 const feet=['M101 191 Q83 211 76 270 Q64 302 86 321','M177 192 Q196 215 203 276 Q212 302 190 320','M101 257 L113 320','M177 257 L165 320','M113 320 C74 305 68 343 107 341 C129 340 135 325 113 320 Z','M165 320 C139 311 137 340 165 341 C201 342 203 316 165 320 Z'];
 const eyes=['M91 126 C89 97 119 96 121 123 C124 146 94 147 91 126 Z','M161 123 C163 96 193 97 191 126 C188 147 158 146 161 123 Z'];
 const pupils=['M101 125 C99 107 116 106 116 124 C117 141 101 142 101 125 Z','M166 124 C166 106 183 107 181 125 C181 142 165 141 166 124 Z'];
 const nose='M132 144 Q141 138 150 144 Q149 151 141 154 Q133 151 132 144 Z';
 const chest='M105 179 L96 193 L105 190 L91 211 L105 205 L99 226 L111 219 L108 241 L122 231 L123 252 L136 241 L141 263 L149 242 L162 251 L161 230 L175 240 L171 217 L184 225 L177 204 L187 210 L177 190 L182 192 L171 178';
 const whiskers=['M111 153 Q86 142 59 145','M111 159 L54 159','M110 164 L63 177','M172 153 Q197 142 224 145','M172 159 L229 159','M173 164 L220 177'];
 const steps=[
  {text:'Rita ett runt huvud, en oval kropp och lätta hjälplinjer.',paths:[head,body,'M141 57 L141 294','M68 122 L213 122'],guide:true},
  {text:'Rita spetsiga öron, kinder, tassar och en böjd svans.',paths:[...ears,outline,...feet,tail]},
  {text:'Rita ögon, nos, mun, morrhår och pälsen på bröstet.',paths:[...eyes,nose,'M141 154 L141 162 Q130 175 121 162','M141 162 Q152 175 161 162','M96 91 Q109 80 119 91','M162 91 Q173 80 186 91',...whiskers,chest,'M119 66 L127 62 L121 56 L136 62 L132 54 L149 63']},
  {text:'Sudda hjälplinjerna och förstärk ögon och små detaljer.',paths:[...pupils,'M88 324 Q82 332 88 338','M99 322 Q93 332 99 340','M160 322 Q154 332 160 340','M174 322 Q168 332 174 340']},
  {text:'Färglägg pälsen grå, bröstet vitt och öronen rosa.',colors:true}
 ];
 function element(name,attrs={}){const e=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e}
 function mountLesson(canvas){
  const holder=canvas.closest('.draw-modal-guides');
  if(!holder||holder.querySelector('.cat-lesson'))return;
  holder.closest('.draw-modal').classList.add('cat-pilot');
  if(!document.getElementById('cat-lesson-style')){
   const style=document.createElement('style');style.id='cat-lesson-style';style.textContent=`
.cat-pilot .draw-modal-guides{grid-column:1/-1!important;background:#182b21!important;padding:14px!important}.cat-pilot .draw-instructions{grid-column:1/-1!important;grid-row:auto!important;color:var(--ink)!important}.cat-pilot .draw-modal-title p{color:var(--muted)!important}.cat-lesson{margin:20px 0 0;color:#fff4e2}.cat-lesson h3{font-size:20px;margin:0 0 8px}.cat-lesson p{line-height:1.5}.cat-lesson-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:start}.cat-lesson-card{min-width:0;margin:0}.cat-lesson-board,.cat-lesson-wait{width:100%;aspect-ratio:372/498;border:2px solid #416b4e;border-radius:17px;background:radial-gradient(ellipse at top,#164b34,#082c1d);box-sizing:border-box}.cat-lesson-board{display:block}.cat-lesson-card figcaption{font-size:14px;margin-top:9px;line-height:1.45}.cat-lesson-wait{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;padding:12px;text-align:center}.cat-lesson button{font:inherit;cursor:pointer;border-radius:12px;padding:12px;border:1px solid #709680;background:#f8ae55;color:#18231e;font-weight:750;min-height:44px;white-space:normal}.cat-lesson button:focus-visible{outline:3px solid white;outline-offset:4px}.cat-lesson-replay{margin-top:9px;background:#214e38!important;color:#fff4e2!important;width:100%;font-size:13px!important}.cat-lesson-status{min-height:1.5em;color:#f6d5a5}.cat-lesson [hidden]{display:none!important}@media(max-width:760px){.cat-lesson-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:380px){.cat-lesson-grid{grid-template-columns:1fr}}`;
   document.head.append(style);
  }
  const section=document.createElement('section');section.className='cat-lesson';section.setAttribute('aria-label','Rita katten med animation');
  section.innerHTML='<h3>Rita med mig – katten</h3><p>Följ pennan och rita på ditt papper. Nästa steg väntar tills du är klar.</p><div class="cat-lesson-grid"></div><p class="cat-lesson-status" role="status" aria-live="polite"></p>';
  // The site's dialog backdrop delegates close clicks: keep lesson clicks inside it.
  section.addEventListener('click',e=>e.stopPropagation());holder.append(section);
  const grid=section.querySelector('.cat-lesson-grid'),status=section.querySelector('.cat-lesson-status');
  let frame=0,playing=false,completed=-1,disposed=false;
  const cleanup=new MutationObserver(()=>{if(!section.isConnected){disposed=true;cancelAnimationFrame(frame);cleanup.disconnect();}});
  cleanup.observe(document.body,{childList:true,subtree:true});

  function path(svg,d,attrs={}){const p=element('path',{d,fill:'none',stroke:'#f4ead3','stroke-width':2.3,'stroke-linecap':'round','stroke-linejoin':'round',...attrs});svg.append(p);return p}
  function render(index,svg){
   const active=[];
   if(index>=4){
    [[tail,'#8c8e91'],['M106 177 C83 211 82 242 76 270 Q64 302 86 321 L107 336 L165 336 L190 320 Q212 302 203 276 Q196 215 172 177 Z','#8c8e91'],[head,'#8c8e91'],['M77 97 L66 25 L117 66 Z','#8c8e91'],['M167 66 L215 25 L204 98 Z','#8c8e91'],['M79 78 L77 43 L103 65 Z','#eda79d'],['M181 66 L205 43 L202 80 Z','#eda79d'],[chest+' Z','#fff4db'],[feet[4],'#fff4db'],[feet[5],'#fff4db'],[nose,'#eda79d']].forEach(([d,fill])=>{const p=path(svg,d,{fill,stroke:'none',opacity:0});active.push({p,color:true})});
   }
   steps.slice(0,Math.min(index+1,4)).forEach((step,i)=>step.paths.forEach((d,j)=>{
    if(index>=3&&i===0)return; // Remove construction lines before inking.
    if(index>=3&&i===1&&j===4)path(svg,'M77 98 Q72 68 118 66 Q141 60 168 66 Q202 70 204 98');
    const p=path(svg,d,{...(i===0?{opacity:.55,'stroke-width':1.5}:{}),...(i===3&&j<2?{fill:'#131b19'}:{})});
    if(i===index)active.push({p});
   }));
   if(index>=3){path(svg,'M107 115 L109 115 M173 115 L175 115',{'stroke-width':6,stroke:'#fff'})}
   return active;
  }
  function play(index,card,replay=false){
   if(playing||disposed)return;playing=true;
   section.querySelectorAll('.cat-lesson-replay').forEach(b=>b.disabled=true);
   const next=grid.querySelector('.cat-lesson-wait');if(next)next.hidden=true;
   card.innerHTML='';
   const svg=element('svg',{viewBox:'0 0 280 375',class:'cat-lesson-board',role:'img','aria-label':'Katten, ritsteg '+(index+1)});card.append(svg);
   const circle=element('circle',{cx:25,cy:25,r:19,fill:'#ff791e'}),num=element('text',{x:25,y:32,'text-anchor':'middle',fill:'#fff','font-size':23,'font-family':'system-ui','font-weight':700});num.textContent=index+1;svg.append(circle,num);
   const active=render(index,svg);
   active.forEach(a=>{if(!a.color){a.length=a.p.getTotalLength();a.p.style.strokeDasharray=a.length;a.p.style.strokeDashoffset=a.length;if(a.p.getAttribute('fill')!=='none'){a.fill=a.p.getAttribute('fill');a.p.setAttribute('fill','none')}}});
   const pen=element('circle',{r:4,fill:'#ffbf63',stroke:'#fff','stroke-width':1});svg.append(pen);
   const caption=document.createElement('figcaption');caption.textContent=(index+1)+'. '+steps[index].text;card.append(caption);
   status.textContent='Steg '+(index+1)+' av 5 – följ pennan.';
   let item=0,elapsed=0,last=0;
   function tick(now){
    if(disposed||!section.isConnected)return;
    const dt=last?now-last:0;last=now;
    if(!document.hidden)elapsed+=dt;
    const a=active[item],duration=a.color?700:Math.max(650,Math.min(2800,a.length*9));
    const progress=Math.min(1,elapsed/duration);
    if(a.color){a.p.setAttribute('opacity',progress);pen.setAttribute('visibility','hidden')}
    else{a.p.style.strokeDashoffset=a.length*(1-progress);const pt=a.p.getPointAtLength(a.length*progress);pen.setAttribute('cx',pt.x);pen.setAttribute('cy',pt.y)}
    if(progress===1){if(a.fill)a.p.setAttribute('fill',a.fill);item++;elapsed=0}
    if(item<active.length){frame=requestAnimationFrame(tick);return}
    pen.remove();playing=false;completed=Math.max(completed,index);
    const repeat=document.createElement('button');repeat.type='button';repeat.className='cat-lesson-replay';repeat.textContent='Visa steget igen';repeat.addEventListener('click',()=>play(index,card,true));card.append(repeat);
    section.querySelectorAll('.cat-lesson-replay').forEach(b=>b.disabled=false);
    if(next)next.hidden=false;
    if(!replay&&index<4)addWait(index+1);
    status.textContent=completed===4?'Alla fem steg är klara. Fint jobbat!':'Paus – rita färdigt i din egen takt. Tryck sedan på ”Okej, jag är klar”.';
   }
   frame=requestAnimationFrame(tick);
  }
  function addWait(index){
   const slot=document.createElement('div');slot.className='cat-lesson-wait';
   const label=document.createElement('span');label.textContent='Redo för steg '+(index+1)+'?';
   const button=document.createElement('button');button.type='button';button.textContent='Okej, jag är klar';
   button.addEventListener('click',()=>{if(playing)return;const card=document.createElement('figure');card.className='cat-lesson-card';slot.replaceWith(card);play(index,card);card.tabIndex=-1;card.focus({preventScroll:true});card.scrollIntoView({block:'nearest',behavior:'smooth'})});
   slot.append(label,button);grid.append(slot);
  }
  const first=document.createElement('figure');first.className='cat-lesson-card';grid.append(first);play(0,first);
 }
 function scan(){document.querySelectorAll('.draw-modal-guides canvas[data-drawing-guide="katt"]').forEach(mountLesson)}
 new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
