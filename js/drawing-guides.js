
(()=>{
const crops={
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
const panelInteriors={"boat-chalkboard.png":[[69,166,424,573],[455,166,790,573],[821,166,1170,573],[1201,166,1550,573],[1580,166,1931,570]],"butterfly.png":[[45,130,401,637],[428,130,788,637],[815,130,1176,637],[1202,130,1564,637],[1590,130,1948,637]],"car-chalkboard.png":[[67,167,423,574],[455,167,794,574],[825,167,1171,574],[1203,167,1551,574],[1582,167,1933,574]],"cat-slate-guide.png":[[68,165,422,581],[453,165,790,581],[821,165,1169,581],[1200,165,1548,581],[1579,165,1932,581]],"dinosaur.png":[[45,118,384,659],[415,118,782,659],[813,118,1179,659],[1209,118,1569,659],[1600,118,1947,659]],"dog-chalkboard.png":[[48,220,366,666],[397,220,704,666],[735,220,1040,666],[1070,220,1379,666],[1409,220,1728,666]],"dolphin.png":[[45,143,424,657],[437,143,789,657],[817,143,1194,657],[1208,143,1576,656],[1589,143,1948,657]],"dragon.png":[[45,145,421,645],[434,145,803,645],[816,145,1191,645],[1204,145,1581,645],[1594,145,1947,645]],"elephant-chalkboard.png":[[42,216,361,653],[388,216,704,653],[729,216,1045,653],[1070,216,1390,653],[1415,216,1740,653]],"flower-chalkboard.png":[[69,167,423,572],[454,167,790,572],[822,167,1170,572],[1202,167,1549,572],[1581,167,1930,572]],"giraffe.png":[[45,109,406,694],[439,109,790,694],[821,109,1173,694],[1205,109,1560,694],[1592,109,1948,694]],"horse.png":[[45,116,382,656],[412,116,779,656],[809,116,1176,656],[1205,116,1572,656],[1602,116,1947,656]],"house-chalkboard.png":[[40,230,360,651],[386,230,703,651],[729,230,1046,651],[1072,230,1388,651],[1415,230,1735,651]],"kite-chalkboard.png":[[68,166,422,573],[454,166,792,573],[823,166,1171,573],[1202,166,1550,573],[1581,166,1930,573]],"koala.png":[[45,152,392,627],[423,152,783,627],[815,152,1177,627],[1208,152,1572,627],[1603,152,1947,627]],"owl.png":[[45,141,397,649],[430,141,788,649],[819,141,1177,649],[1208,141,1567,649],[1597,141,1935,650]],"panda.png":[[45,140,402,644],[436,140,789,644],[820,140,1177,644],[1205,140,1562,644],[1592,140,1948,644]],"peacock.png":[[45,124,389,659],[421,124,783,659],[813,124,1180,659],[1211,124,1574,659],[1604,124,1948,659]],"penguin.png":[[45,147,405,648],[434,147,788,649],[814,147,1169,649],[1198,148,1561,649],[1588,147,1947,649]],"phoenix.png":[[45,125,397,697],[429,125,784,697],[816,125,1177,697],[1209,125,1567,697],[1599,125,1948,697]],"rabbit-chalkboard.png":[[48,190,368,683],[397,190,707,683],[735,190,1041,683],[1069,190,1377,683],[1406,190,1727,683]],"rocket-chalkboard.png":[[50,178,361,653],[391,178,698,653],[728,178,1034,653],[1063,178,1378,653],[1407,178,1731,654]],"snake.png":[[42,154,415,635],[447,154,811,636],[823,154,1189,636],[1202,154,1565,636],[1579,154,1956,635]],"tiger.png":[[45,128,394,653],[427,128,784,653],[817,128,1176,653],[1209,128,1567,653],[1600,128,1948,653]],"tree-chalkboard.png":[[67,168,420,572],[451,168,790,572],[820,168,1170,572],[1199,168,1551,572],[1581,168,1932,572]],"turtle.png":[[45,157,416,657],[428,156,799,657],[811,156,1181,657],[1193,156,1577,657],[1590,156,1947,658]],"umbrella-chalkboard.png":[[69,166,422,573],[454,166,792,573],[824,166,1171,573],[1202,166,1550,573],[1582,166,1932,573]],"wolf.png":[[45,126,386,616],[418,126,780,616],[812,126,1176,616],[1208,126,1573,616],[1604,126,1947,616]]};
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
 const file=({katt:"cat-slate-guide.png",hund:"dog-chalkboard.png",kanin:"rabbit-chalkboard.png",fjaril:"butterfly.png",panda:"panda.png",lejon:"lion-guide.webp",rav:"fox-guide-final.webp",elefant:"elephant-chalkboard.png",uggla:"owl.png",skoldpadda:"turtle.png",dinosaurie:"dinosaur.png",giraff:"giraffe.png",hast:"horse.png",tiger:"tiger.png",drake:"dragon.png",varg:"wolf.png",pafagel:"peacock.png",delfin:"dolphin.png",pingvin:"penguin.png",koala:"koala.png",orm:"snake.png",fenix:"phoenix.png",blomma:"flower-chalkboard.png",hus:"house-chalkboard.png",raket:"rocket-chalkboard.png",bil:"car-chalkboard.png",paraply:"umbrella-chalkboard.png",trad:"tree-chalkboard.png",bat:"boat-chalkboard.png",pappersdrake:"kite-chalkboard.png"})[id];
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
