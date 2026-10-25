// Extend the shared painter after its existing car and spring patches have run.
// The original line drawing supplies the masks and visible contours.
window.FP_patchSummerPainter = function patchSummerPainter(source) {
  function replaceOnce(before, after, label) {
    const start = source.indexOf(before);
    if (start < 0 || source.indexOf(before, start + before.length) !== -1) {
      throw new Error("Could not safely patch summer painter: " + label);
    }
    source = source.slice(0, start) + after + source.slice(start + before.length);
  }

  replaceOnce(
    ' const isSpringTarget=IMAGE.includes("/mandala-spring-2026/");',
    ' const isSummerTarget=IMAGE.includes("/mandala-summer-2026/");\n const isSpringTarget=IMAGE.includes("/mandala-spring-2026/");',
    "summer target"
  );
  replaceOnce(
    ' if(isSpringTarget)REFERENCE=IMAGE.replace("/mandala-spring-2026/","/spring-references-20261024/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");',
    ' if(isSpringTarget)REFERENCE=IMAGE.replace("/mandala-spring-2026/","/spring-references-20261024/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");\n if(isSummerTarget)REFERENCE=IMAGE.replace("/mandala-summer-2026/","/summer-references-20261025/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");',
    "summer reference path"
  );
  replaceOnce(
    'if(REFERENCE&&!isSpringTarget){referenceButton.hidden=false;',
    'if(REFERENCE&&!isSpringTarget&&!isSummerTarget){referenceButton.hidden=false;',
    "summer controls"
  );
  replaceOnce(
    ' if(isSpringTarget)dialog.classList.add("fp-paint-ghost");',
    ' if(isSpringTarget||isSummerTarget)dialog.classList.add("fp-paint-ghost");',
    "summer layout"
  );
  replaceOnce(' let carReferenceImage=null;',
    ' let carReferenceImage=null;\n let summerReferencePixels=null;', "summer pixels");

  replaceOnce(' function paintSpringRegion(step){', `
 function paintSummerRegion(region){
   const width=region.maxX-region.minX+1,height=region.maxY-region.minY+1;
   const tile=document.createElement("canvas");tile.width=width;tile.height=height;
   const tileCtx=tile.getContext("2d"),pixels=tileCtx.createImageData(width,height);
   for(const index of region.pixels){
     const x=index%W-region.minX,y=Math.floor(index/W)-region.minY,k=(y*width+x)*4,s=index*4;
     const r=summerReferencePixels[s],g=summerReferencePixels[s+1],b=summerReferencePixels[s+2];
     const paper=Math.min(r,g,b)>245&&Math.max(r,g,b)-Math.min(r,g,b)<9;
     pixels.data[k]=paper?255:r;
     pixels.data[k+1]=paper?255:g;
     pixels.data[k+2]=paper?255:b;
     pixels.data[k+3]=255;
   }
   tileCtx.putImageData(pixels,0,0);
   ctx.drawImage(tile,region.minX,region.minY);
 }
 function summerPaintingPlan(regions){
   const result=[];
   const tiles=new Map(),size=128,columns=Math.ceil(W/size);
   const append=(pixels,minX,minY,maxX,maxY)=>{
     let colored=0;
     for(const index of pixels){
       const k=index*4,r=summerReferencePixels[k],g=summerReferencePixels[k+1],b=summerReferencePixels[k+2];
       if(Math.min(r,g,b)<244||Math.max(r,g,b)-Math.min(r,g,b)>12)colored++;
     }
     if(colored>=5)result.push({type:"summerRegion",region:{pixels,minX,minY,maxX,maxY}});
   };
   for(const region of regions)for(const index of region.pixels){
     const x=index%W,y=Math.floor(index/W),key=Math.floor(y/size)*columns+Math.floor(x/size);
     let tile=tiles.get(key);
     if(!tile){tile={pixels:[],minX:x,maxX:x,minY:y,maxY:y};tiles.set(key,tile)}
     tile.pixels.push(index);tile.minX=Math.min(tile.minX,x);tile.minY=Math.min(tile.minY,y);
     tile.maxX=Math.max(tile.maxX,x);tile.maxY=Math.max(tile.maxY,y);
   }
   for(const [,tile] of [...tiles].sort((a,b)=>a[0]-b[0]))
     append(tile.pixels,tile.minX,tile.minY,tile.maxX,tile.maxY);
   return result;
 }
 function paintSpringRegion(step){`, "summer masked painting");

  replaceOnce('   let plan;\n   if(isSpringTarget||isCarTarget){', `
   let plan;
   if(isSummerTarget){
     status.textContent="Hämtar sommarbildens färgreferens…";
     try{
       const image=await new Promise((resolve,reject)=>{
         const ref=new Image();ref.onload=()=>resolve(ref);
         ref.onerror=()=>reject(new Error("Referens saknas"));ref.src=REFERENCE;
       });
       if(image.naturalWidth!==W||image.naturalHeight!==H)throw new Error("Referensens mått stämmer inte");
       const refCanvas=document.createElement("canvas");refCanvas.width=W;refCanvas.height=H;
       const refCtx=refCanvas.getContext("2d",{willReadFrequently:true});
       refCtx.drawImage(image,0,0);
       summerReferencePixels=refCtx.getImageData(0,0,W,H).data;
       plan=summerPaintingPlan(await findAutoRegions(true));
     }catch(error){
       autoRunning=false;autoButton.disabled=false;autoProgress.hidden=true;
       sheet.style.pointerEvents="";status.textContent="Sommarbildens färgreferens kunde inte laddas: "+error.message;
       return;
     }
   }else if(isSpringTarget||isCarTarget){`, "summer reference loading");
  replaceOnce(
    '     if(step.type==="springRegion"){paintSpringRegion(step);acts.push(step);}',
    '     if(step.type==="summerRegion"){paintSummerRegion(step.region);acts.push(step);}else if(step.type==="springRegion"){paintSpringRegion(step);acts.push(step);}',
    "summer history step"
  );
  replaceOnce(
    'for(const a of acts){if(a.type==="springRegion"){paintSpringRegion(a)}',
    'for(const a of acts){if(a.type==="summerRegion"){paintSummerRegion(a.region)}else if(a.type==="springRegion"){paintSpringRegion(a)}',
    "summer undo redo"
  );
  replaceOnce(
    'resolve,(isSpringTarget||isCarTarget)?Math.max(8,Math.min(150,18000/plan.length)):',
    'resolve,isSummerTarget?Math.max(12,Math.min(150,18000/plan.length)):(isSpringTarget||isCarTarget)?Math.max(8,Math.min(150,18000/plan.length)):',
    "summer animation pace"
  );
  replaceOnce(
    '||potionConfig||isCarTarget||isSpringTarget){c.fillStyle="#fff";',
    '||potionConfig||isCarTarget||isSpringTarget||isSummerTarget){c.fillStyle="#fff";',
    "summer white export"
  );
  replaceOnce(
    'status.textContent=isCarTarget?"Klart! "',
    'status.textContent=isSummerTarget?"Klart! "+TARGET+" är färglagd enligt färgreferensen. Du kan fortsätta måla eller spara bilden.":isCarTarget?"Klart! "',
    "summer finished status"
  );
  return source;
};
