// Add reference-based summer and autumn fills after the car and spring patches.
// The original line drawing supplies the masks and visible contours.
window.FP_patchSummerPainter = function patchSummerPainter(source) {
  function replaceOnce(before, after, label) {
    const start = source.indexOf(before);
    if (start < 0 || source.indexOf(before, start + before.length) !== -1) {
      throw new Error("Could not safely patch summer painter: " + label);
    }
    source = source.slice(0, start) + after + source.slice(start + before.length);
  }

  // The desktop backdrop already reserves 16px on each side. Size the
  // expanded painter within that space, including when a scrollbar is present.
  replaceOnce(
    'width:min(1480px,calc(100vw - 12px));height:calc(100dvh - 12px);max-height:calc(100dvh - 12px);',
    'width:min(1480px,100%);max-width:100%;height:calc(100dvh - 32px);max-height:calc(100dvh - 32px);min-width:0;min-height:0;',
    "desktop popup viewport bounds"
  );

  replaceOnce(
    ' const isSpringTarget=IMAGE.includes("/mandala-spring-2026/");',
    ' const isSummerTarget=IMAGE.includes("/mandala-summer-2026/");\n const isAutumnTarget=IMAGE.includes("/mandala-host-2026/");\n const isWinterTarget=IMAGE.includes("/mandala-vinter-2026/");\n const isBakeryTarget=IMAGE.includes("/bakverk-uploads-20261020/");\n const isSpringTarget=IMAGE.includes("/mandala-spring-2026/");',
    "season targets"
  );
  replaceOnce(' async function findAutoRegions(isGhost=false){', ' async function findAutoRegions(isGhost=false){\n   const autoInkThreshold=isAutumnTarget?244:220;', "autumn contour threshold");
  replaceOnce('reduced[start]<220', 'reduced[start]<autoInkThreshold', "autumn region starts");
  if(!source.includes('reduced[n]>=220'))throw new Error("Could not safely patch autumn painter: autumn region neighbors");
  source=source.replaceAll('reduced[n]>=220','reduced[n]>=autoInkThreshold');
  replaceOnce('if(!isGhost)regions.length=Math.min(regions.length,160);', 'if(!isGhost)regions.length=Math.min(regions.length,isAutumnTarget?600:160);', "autumn region limit");
  replaceOnce('sheet.style.pointerEvents="";if(flightHouseConfig||motifConfig||referenceKey||spokConfig||owlConfig||wreathConfig||potionConfig||bookConfig||graveConfig||trainConfig)autoButton.disabled=false;historyUI();', 'sheet.style.pointerEvents="";autoButton.disabled=false;historyUI();', "re-enable auto coloring");
  replaceOnce(
    ' if(isSpringTarget)REFERENCE=IMAGE.replace("/mandala-spring-2026/","/spring-references-20261024/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");',
    ' if(isSpringTarget)REFERENCE=IMAGE.replace("/mandala-spring-2026/","/spring-references-20261024/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");\n if(isAutumnTarget)REFERENCE=IMAGE.replace("/mandala-host-2026/","/autumn-references-20261025/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");\n if(isSummerTarget)REFERENCE=IMAGE.replace("/mandala-summer-2026/","/summer-references-20261025/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");\n if(isWinterTarget)REFERENCE=IMAGE.replace("/mandala-vinter-2026/","/winter-references-20261028/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");\n if(isBakeryTarget&&!REFERENCE)REFERENCE=IMAGE.replace("/bakverk-uploads-20261020/","/bakverk-coloring-20261024/").replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");\n const animalMatch=IMAGE.match(/\\/coloring-originals-2026\\/djur\\/([^/?]+?)(?:-preview)?\\.webp(?:\\?.*)?$/);\n if(animalMatch&&!REFERENCE){const base=animalMatch[1],special={igelkott:base+"-coloring/reference.webp",pingvin:base+"-coloring/reference.webp",lamm:base+"-coloring/reference.webp",ponny:base+"-coloring/reference.webp",tvattbjorn:base+"-coloring/reference.webp",koala:"koala-reference-v1.svg",radjur:"radjur-color-reference-v1.png",sal:"sal-color-reference-v1.webp"};REFERENCE=IMAGE.replace(/[^/?]+(?:\\?.*)?$/,special[base]||base+"-reference-v1.webp");}\n const animalUploadMatch=IMAGE.match(/\\/coloring-originals-2026\\/animal-uploads-20261020\\/(djuransikten|kaninmosaik)\\.webp(?:\\?.*)?$/);\n if(animalUploadMatch&&!REFERENCE)REFERENCE=IMAGE.replace(/\\.webp(?:\\?.*)?$/,"-coloring/reference.webp");',
    "summer reference path"
  );
  replaceOnce(
    ' if(isSpringTarget)dialog.classList.add("fp-paint-ghost");',
    ' if(isSpringTarget||isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget)dialog.classList.add("fp-paint-ghost");\n if(["Fotbollsproffs","Fotbollslag","Pokémon","Superhjältar"].includes(mandalas.find(m=>m.title===TARGET&&new URL(m.preview||m.img,location.href).href===new URL(IMAGE,location.href).href)?.type))dialog.classList.add("fp-paint-unified");',
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
   return regions.filter(region=>{
     let colored=0;
     for(const index of region.pixels){
       const k=index*4,r=summerReferencePixels[k],g=summerReferencePixels[k+1],b=summerReferencePixels[k+2];
       if(Math.min(r,g,b)<244||Math.max(r,g,b)-Math.min(r,g,b)>12)colored++;
       if(colored>=5)return true;
     }
     return false;
   }).map(region=>({type:"summerRegion",region}));
 }
 function paintSpringRegion(step){`, "summer masked painting");

  replaceOnce('   let plan;\n   if(isSpringTarget||isCarTarget){', `
   let plan;
   if(isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget){
     status.textContent="Hämtar bildens färgreferens…";
     try{
       const image=await new Promise((resolve,reject)=>{
         const ref=new Image();ref.onload=()=>resolve(ref);
         ref.onerror=()=>reject(new Error("Referens saknas"));ref.src=REFERENCE;
       });
       const sizeMismatch=image.naturalWidth!==W||image.naturalHeight!==H;
       const aspectMismatch=Math.abs(image.naturalWidth/image.naturalHeight-W/H)>0.002;
       if(!isAutumnTarget&&!isWinterTarget&&sizeMismatch)throw new Error("Referensens mått stämmer inte");
       if(isWinterTarget&&aspectMismatch)throw new Error("Referensens proportioner stämmer inte");
       const refCanvas=document.createElement("canvas");refCanvas.width=W;refCanvas.height=H;
       const refCtx=refCanvas.getContext("2d",{willReadFrequently:true});
       refCtx.drawImage(image,0,0,W,H);
       summerReferencePixels=refCtx.getImageData(0,0,W,H).data;
       plan=summerPaintingPlan(await findAutoRegions(true));
     }catch(error){
       autoRunning=false;autoButton.disabled=false;autoProgress.hidden=true;
       sheet.style.pointerEvents="";status.textContent="Bildens färgreferens kunde inte laddas: "+error.message;
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
    'resolve,(isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget)?Math.max(12,Math.min(150,18000/plan.length)):(isSpringTarget||isCarTarget)?Math.max(8,Math.min(150,18000/plan.length)):',
    "summer animation pace"
  );
  replaceOnce(
    '||potionConfig||isCarTarget||isSpringTarget){c.fillStyle="#fff";',
    '||potionConfig||isCarTarget||isSpringTarget||isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget){c.fillStyle="#fff";',
    "summer white export"
  );
  replaceOnce(
    'status.textContent=isCarTarget?"Klart! "',
    'status.textContent=(isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget)?"Klart! "+TARGET+" är färglagd enligt färgreferensen. Du kan fortsätta måla eller spara bilden.":isCarTarget?"Klart! "',
    "summer finished status"
  );
  // Machine pages use the same contour-masked reference painting and history
  // as the seasonal pages, including the 18-second region-by-region timelapse.
  replaceOnce('function openPainter(IMAGE,TARGET,REFERENCE=""){',
    'function openPainter(IMAGE,TARGET,REFERENCE=""){\n const isMachineTarget=IMAGE.includes("/stora-maskiner-20261108/");\n if(isMachineTarget&&!REFERENCE)REFERENCE=IMAGE.replace(/\\.webp(?:\\?.*)?$/,"-reference.webp");',
    'machine reference path');
  source=source.replaceAll('isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget',
    'isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget||isMachineTarget');
  source=source.replaceAll(".fp-paint-dialog.fp-paint-ghost", ".fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified)");
  replaceOnce("function normalizedPokemonName(title){", "Object.assign(pokemonPalettes,{\n \"meowstic\":[\"#365fb3\",\"#264480\",\"#f8f8f8\",\"#bfbfbf\",\"#323757\"],\n \"audino\":[\"#f6e6ac\",\"#de8b94\",\"#cdb483\"],\n \"chespin\":[\"#a6d941\",\"#789838\",\"#b88768\",\"#feb183\",\"#7b513a\"],\n \"salamence\":[\"#83cde6\",\"#54a4cb\",\"#bd526a\",\"#9f3d4c\",\"#eeeee6\"],\n \"foongus\":[\"#fff6e6\",\"#c5b49c\",\"#6a4a31\"],\n \"rhyperior\":[\"#7b6a7b\",\"#5a4a62\",\"#ee5200\",\"#903b11\",\"#cdcddd\"],\n \"paras\":[\"#e68329\",\"#ffac62\",\"#f06e6e\",\"#b84545\",\"#fdd460\"]\n});\nObject.assign(pokemonGuides,{\n \"meowstic\":\"deep blue body; white face and accents; dark blue details\",\n \"audino\":\"soft cream body; warm pink ears and details; muted beige feet\",\n \"chespin\":\"bright green body; brown hood; orange face; darker green accents\",\n \"salamence\":\"sky blue body; red wings; cream underside; dark red details\",\n \"foongus\":\"ivory body; tan cap; rich brown spots\",\n \"rhyperior\":\"stone-grey body; bright orange armor; deep brown details\",\n \"paras\":\"orange body; red mushroom cap; golden accents\"\n});\nfunction normalizedPokemonName(title){", "complete Pokémon palettes and guides");
  replaceOnce(" const isCarTarget=!!carModel;", " const isCarTarget=!!carModel;\n const isPokemonTarget=new URL(IMAGE,location.href).pathname.includes(\"/pokemon-20261021/\")&&!!pokemonKey(TARGET);", "identify Pokémon coloring pages");
  replaceOnce("const style=document.createElement(\"style\");style.textContent=", "function pokemonAutoRegionColor(region,regions,palette,guide,title){\n const cx=region.cx||0,cy=region.cy||0;\n const inSubject=cx>.08&&cx<.92&&cy>.06&&cy<.94;\n if(!inSubject)return null;\n const ranked=regions.filter(r=>r.cx>.08&&r.cx<.92&&r.cy>.06&&r.cy<.94).slice().sort((a,b)=>b.area-a.area);\n const rank=ranked.indexOf(region);\n if(rank<0)return null;\n const body=roleGuideColor(guide,\"body\")||palette[0]||\"#7f8c8d\";\n const bodyCount=Math.max(1,Math.ceil(ranked.length*.28));\n if(rank<bodyCount)return body;\n const roleMatches=[\n  [\"belly\",cy>.54],\n  [\"wing\",cy<.72&&(cx<.40||cx>.60)],\n  [\"tail\",cy>.62&&(cx<.28||cx>.72)],\n  [\"fin\",cx<.38||cx>.62],\n  [\"shell\",cy>.48],\n  [\"cap\",cy<.48],\n  [\"leaf\",cy<.55],\n  [\"claw\",cy>.62],\n  [\"marking\",true]\n ];\n for(const [role,applies] of roleMatches){\n   if(!applies)continue;\n   const roleColor=roleGuideColor(guide,role);\n   if(roleColor)return roleColor;\n }\n const accents=palette.filter(value=>value&&value!==body);\n if(!accents.length)return body;\n const relativeArea=region.area/(ranked[0]?.area||1);\n if(relativeArea>.34)return body;\n if(relativeArea<.035)return accents[accents.length-1];\n const position=(Math.round(cx*3)+Math.round(cy*4)+rank)%accents.length;\n return accents[Math.abs(position)];\n}\nconst style=document.createElement(\"style\");style.textContent=", "add multi-color Pokémon region mapping");
  replaceOnce(" const referenceButton=$('[data-action=\"reference\"]');\n if(REFERENCE){referenceButton.hidden=false;referenceButton.setAttribute(\"aria-haspopup\",\"dialog\");const viewer=document.createElement(\"div\");viewer.className=\"fp-reference-backdrop\";viewer.hidden=true;viewer.setAttribute(\"role\",\"dialog\");viewer.setAttribute(\"aria-modal\",\"true\");viewer.setAttribute(\"aria-label\",\"Färglagt färgförslag för \"+TARGET);const card=document.createElement(\"div\");card.className=\"fp-reference-card\";const refImage=document.createElement(\"img\");refImage.src=REFERENCE;refImage.alt=\"Färglagt färgförslag: \"+TARGET;const closeReference=document.createElement(\"button\");closeReference.type=\"button\";closeReference.className=\"fp-reference-close\";closeReference.setAttribute(\"aria-label\",\"Stäng färgförslaget\");closeReference.textContent=\"×\";card.append(refImage,closeReference);viewer.append(card);back.append(viewer);referenceButton.addEventListener(\"click\",()=>{viewer.hidden=false;closeReference.focus()});closeReference.addEventListener(\"click\",()=>{viewer.hidden=true;referenceButton.focus()});viewer.addEventListener(\"click\",e=>{if(e.target===viewer){viewer.hidden=true;referenceButton.focus()}});viewer.addEventListener(\"keydown\",e=>{if(e.key===\"Escape\"){viewer.hidden=true;referenceButton.focus()}})}", " const referenceButton=$('[data-action=\"reference\"]');\n if(REFERENCE||isPokemonTarget){\n   referenceButton.hidden=false;\n   referenceButton.setAttribute(\"aria-haspopup\",\"dialog\");\n   const viewer=document.createElement(\"div\");\n   viewer.className=\"fp-reference-backdrop\";\n   viewer.hidden=true;\n   viewer.setAttribute(\"role\",\"dialog\");\n   viewer.setAttribute(\"aria-modal\",\"true\");\n   viewer.setAttribute(\"aria-label\",\"Färglagt färgförslag för \"+TARGET);\n   const card=document.createElement(\"div\");\n   card.className=\"fp-reference-card\";\n   const closeReference=document.createElement(\"button\");\n   closeReference.type=\"button\";\n   closeReference.className=\"fp-reference-close\";\n   closeReference.setAttribute(\"aria-label\",\"Stäng färgförslaget\");\n   closeReference.textContent=\"×\";\n   let renderPokemonSuggestion=()=>{};\n   if(isPokemonTarget){\n     const title=document.createElement(\"h3\");\n     title.className=\"fp-pokemon-suggestion-title\";\n     title.textContent=TARGET+\" – färgförslag\";\n     const note=document.createElement(\"p\");\n     note.className=\"fp-pokemon-suggestion-note\";\n     note.textContent=\"Förhandsvisning med Pokémonens färger. Den automatiska timelapsen använder samma färgförslag.\";\n     const swatches=document.createElement(\"div\");\n     swatches.className=\"fp-pokemon-suggestion-swatches\";\n     for(const [index,suggestedColor] of autoPalette(TARGET).entries()){\n       const chip=document.createElement(\"div\");\n       chip.className=\"fp-pokemon-suggestion-chip\";\n       const dot=document.createElement(\"span\");\n       dot.className=\"fp-pokemon-suggestion-dot\";\n       dot.style.backgroundColor=suggestedColor;\n       const label=document.createElement(\"span\");\n       label.className=\"fp-pokemon-suggestion-hex\";\n       label.textContent=suggestedColor.toUpperCase();\n       chip.setAttribute(\"aria-label\",\"Färgförslag \"+(index+1)+\": \"+suggestedColor.toUpperCase());\n       chip.append(dot,label);\n       swatches.append(chip);\n     }\n     const preview=document.createElement(\"canvas\");\n     preview.className=\"fp-pokemon-suggestion-preview\";\n     preview.setAttribute(\"aria-label\",\"Förhandsvisning av färgläggningen\");\n     card.append(title,note,swatches,preview);\n     let rendered=false,busy=false;\n     renderPokemonSuggestion=async()=>{\n       if(rendered||busy)return;\n       busy=true;\n       const previousStatus=status.textContent;\n       note.textContent=\"Förbereder färgförslaget…\";\n       try{\n         await painterReady;\n         if(!W||!back.isConnected)throw new Error(\"Bilden är inte färdigladdad\");\n         const regions=await findAutoRegions();\n         const paletteColors=autoPalette(TARGET),guide=pokemonGuide(TARGET);\n         const plan=regions.map(region=>({region,color:pokemonAutoRegionColor(region,regions,paletteColors,guide,TARGET)})).filter(step=>step.color);\n         preview.width=W;\n         preview.height=H;\n         const previewContext=preview.getContext(\"2d\");\n         previewContext.clearRect(0,0,W,H);\n         for(const step of plan)paintAutoRegion(step.region,step.color,previewContext);\n         previewContext.drawImage(lines,0,0);\n         note.textContent=plan.length\n           ?\"Så här kan \"+TARGET+\" se ut efter den automatiska färgläggningen.\"\n           :\"Jag hittade inga tydligt slutna färgområden. Färgerna ovan kan användas när du målar själv.\";\n         rendered=true;\n       }catch(error){\n         note.textContent=\"Färgförslaget kunde inte visas. Du kan ändå använda färgpaletten ovan.\";\n       }finally{\n         status.textContent=previousStatus;\n         busy=false;\n       }\n     };\n   }else{\n     const refImage=document.createElement(\"img\");\n     refImage.src=REFERENCE;\n     refImage.alt=\"Färglagt färgförslag: \"+TARGET;\n     card.append(refImage);\n   }\n   card.append(closeReference);\n   viewer.append(card);\n   back.append(viewer);\n   referenceButton.addEventListener(\"click\",()=>{\n     viewer.hidden=false;\n     closeReference.focus();\n     if(isPokemonTarget)renderPokemonSuggestion();\n   });\n   closeReference.addEventListener(\"click\",()=>{viewer.hidden=true;referenceButton.focus()});\n   viewer.addEventListener(\"click\",e=>{if(e.target===viewer){viewer.hidden=true;referenceButton.focus()}});\n   viewer.addEventListener(\"keydown\",e=>{if(e.key===\"Escape\"){viewer.hidden=true;referenceButton.focus()}});\n }", "show Pokémon color suggestion preview");
  replaceOnce(" let autoRunning=false,pendingAutoStart=false;", " let autoRunning=false,pendingAutoStart=false;\n let readyResolve;const painterReady=new Promise(resolve=>{readyResolve=resolve});", "wait for original image before preview");
  replaceOnce("if(pendingAutoStart&&back.isConnected){pendingAutoStart=false;runAutoColor()}", "readyResolve();if(pendingAutoStart&&back.isConnected){pendingAutoStart=false;runAutoColor()}", "signal painter image readiness");
  replaceOnce("function paintAutoRegion(region,fillColor){", "function paintAutoRegion(region,fillColor,targetCtx=ctx){", "allow isolated color suggestion rendering");
  replaceOnce("ctx.drawImage(mask,region.minX*region.scaleX,region.minY*region.scaleY,width*region.scaleX,height*region.scaleY);", "targetCtx.drawImage(mask,region.minX*region.scaleX,region.minY*region.scaleY,width*region.scaleX,height*region.scaleY);", "paint region into preview canvas");
  replaceOnce("plan=regions.map(region=>({type:\"region\",region,color:autoRegionColor(region,regions,paletteColors,guide,TARGET)})).filter(step=>step.color);", "plan=regions.map(region=>({type:\"region\",region,color:isPokemonTarget?pokemonAutoRegionColor(region,regions,paletteColors,guide,TARGET):autoRegionColor(region,regions,paletteColors,guide,TARGET)})).filter(step=>step.color);", "apply species colors in automatic timelapse");
  replaceOnce(":isGhost?Math.max(8,Math.min(30,18000/plan.length)):115", ":isGhost?Math.max(8,Math.min(30,18000/plan.length)):isPokemonTarget?Math.max(80,Math.min(650,18000/plan.length)):115", "Pokémon timelapse duration");
  replaceOnce("status.textContent=(isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget||isMachineTarget)?", "status.textContent=(isPokemonTarget||isSummerTarget||isAutumnTarget||isWinterTarget||isBakeryTarget||isMachineTarget)?", "Pokémon completion status");
  replaceOnce(" const inSubject=cx>.08&&cx<.92&&cy>.06&&cy<.94;\n if(!inSubject)return null;", " const inSubject=cx>.08&&cx<.92&&cy>.06&&cy<.94;\n if(!inSubject)return null;\n if(pokemonKey(title)===\"spoink\")return cy<.39?\"#d889a5\":\"#9da3af\";", "correct Spoink colors");
  replaceOnce("if(autoButton)autoButton.addEventListener(\"click\",runAutoColor);", "function safeRunAutoColor(){runAutoColor().catch(error=>{console.error(\"Automatisk färgläggning misslyckades\",error);autoRunning=false;autoButton.disabled=false;autoProgress.hidden=true;sheet.style.pointerEvents=\"\";status.textContent=\"Färgläggningen kunde inte slutföras. Försök igen.\";historyUI()})}\n if(autoButton)autoButton.addEventListener(\"click\",safeRunAutoColor);", "recover from automatic coloring errors");
  replaceOnce("readyResolve();if(pendingAutoStart&&back.isConnected){pendingAutoStart=false;runAutoColor()}", "readyResolve();if(pendingAutoStart&&back.isConnected){pendingAutoStart=false;safeRunAutoColor()}", "recover queued automatic coloring");
  // Final painter-owned landscape rules. Color palette sits above the canvas.
  const finalLayoutCSS = "\n@media (orientation:landscape) and (min-width:560px) {\n.fp-paint-back{padding:5px!important}\n.fp-paint-back .fp-paint-dialog,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified){\nbox-sizing:border-box!important;display:grid!important;\nwidth:min(1480px,100%)!important;height:calc(100dvh - 10px)!important;max-height:calc(100dvh - 10px)!important;\ngrid-template-columns:minmax(242px,34%) minmax(0,1fr)!important;\ngrid-template-rows:34px auto minmax(0,1fr) 6px!important;\ngap:5px 9px!important;padding:6px!important;overflow:hidden!important}\n.fp-paint-back .fp-paint-head{grid-column:1/-1!important;grid-row:1!important;min-width:0!important;min-height:0!important;max-height:34px!important}\n.fp-paint-back .fp-paint-head>div{padding-top:0!important;min-width:0!important}\n.fp-paint-back .fp-paint-head h2{font-size:18px!important;line-height:1.1!important}\n.fp-paint-back .fp-paint-head p{display:none!important}\n.fp-paint-back .fp-paint-navigation{position:static!important;transform:none!important;margin-inline:auto!important}\n.fp-paint-back .fp-paint-navigation button,.fp-paint-back .fp-paint-close{width:32px!important;height:32px!important;min-height:0!important}\n.fp-paint-back .fp-paint-tools,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-tools{\ndisplay:grid!important;grid-column:1!important;grid-row:2/4!important;\ngrid-template-columns:repeat(3,minmax(0,1fr))!important;\ngrid-template-rows:repeat(5,clamp(32px,8.5dvh,42px))!important;\ngrid-auto-rows:clamp(32px,8.5dvh,42px)!important;\ngap:4px!important;align-content:start!important;align-items:stretch!important;\nbox-sizing:border-box!important;min-width:0!important;min-height:0!important;\nwidth:100%!important;height:100%!important;max-height:none!important;\nmargin:0!important;padding:0!important;overflow:visible!important}\n.fp-paint-back .fp-paint-tools button,.fp-paint-back .fp-paint-tools select,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-tools button,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-tools select{\nbox-sizing:border-box!important;width:100%!important;height:100%!important;\nmin-width:0!important;min-height:0!important;padding:2px 3px!important;\nfont-size:clamp(10px,1.8dvh,13px)!important;line-height:1.1!important;\nwhite-space:normal!important;overflow-wrap:anywhere!important;text-align:center!important}\n.fp-paint-back .fp-paint-palette,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-palette{\nbox-sizing:border-box!important;display:flex!important;flex-wrap:wrap!important;\ngrid-column:2!important;grid-row:2!important;\nalign-items:center!important;align-content:center!important;justify-content:flex-start!important;\nwidth:100%!important;height:auto!important;min-height:0!important;max-height:none!important;\ngap:clamp(2px,.5dvh,6px)!important;padding:2px!important;margin:0!important;overflow:visible!important}\n.fp-paint-back .fp-paint-swatch,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-swatch{\nbox-sizing:border-box!important;flex:0 0 auto!important;\nwidth:clamp(18px,3dvh,28px)!important;height:clamp(18px,3dvh,28px)!important}\n.fp-paint-back .fp-paint-custom,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-custom{\ngrid-column:auto!important;gap:3px!important;font-size:11px!important}\n.fp-paint-back .fp-paint-custom input{width:24px!important;height:24px!important}\n.fp-paint-back .fp-paint-stage,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-stage{\ngrid-column:2!important;grid-row:3!important;\nmin-width:0!important;min-height:0!important;width:100%!important;height:100%!important}\n.fp-paint-back .fp-auto-progress,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-auto-progress{\ngrid-column:1/-1!important;grid-row:4!important;height:6px!important;margin:0!important}\n.fp-paint-back .fp-paint-status,\n.fp-paint-back .fp-paint-dialog:is(.fp-paint-ghost,.fp-paint-unified) .fp-paint-status{display:none!important}\n}\n";
  const styleAnchor = 'document.head.append(style);';
  if(!source.includes(styleAnchor))throw new Error("Painter style anchor missing");
  // Keep the close button on the right even when the landscape runtime puts
  // the image-navigation controls after it in the header's DOM order. Limit
  // the reference image to its card, not to the wider browser viewport.
  const referenceLayoutCSS = `
.fp-pokemon-suggestion-title{margin:0 54px 8px 2px;color:#203b2a;font-size:clamp(19px,3vw,26px);line-height:1.15}
.fp-pokemon-suggestion-note{max-width:760px;margin:0 52px 10px 2px;color:#45574a;font-size:14px;line-height:1.45}
.fp-pokemon-suggestion-swatches{display:flex;flex-wrap:wrap;gap:8px 12px;margin:0 48px 14px 2px}
.fp-pokemon-suggestion-chip{display:flex;align-items:center;gap:5px;color:#26392c;font:600 11px/1.1 system-ui,sans-serif}
.fp-pokemon-suggestion-dot{display:block;width:25px;height:25px;border:1px solid #0002;border-radius:50%;box-shadow:inset 0 0 0 2px #fff8}
.fp-pokemon-suggestion-preview{display:block;width:auto;height:auto;max-width:min(88vw,840px);max-height:64dvh;object-fit:contain;background:#fff;border:1px solid #e4e8e3;border-radius:10px}
.fp-paint-head > div { order: 0; }
.fp-paint-head > .fp-paint-navigation { order: 1; }
.fp-paint-head > .fp-paint-close { order: 2; }
.fp-paint-back .fp-reference-backdrop { background: #19241e; overflow: hidden; }
.fp-paint-back .fp-reference-card { box-sizing: border-box; max-width: min(94vw, 920px); max-height: 94dvh; }
.fp-paint-back .fp-reference-card img { display: block; width: auto; height: auto; max-width: 100%; max-height: calc(94dvh - 24px); object-fit: contain; }
`;
  source=source.replace(styleAnchor,'style.textContent += '+JSON.stringify(finalLayoutCSS+referenceLayoutCSS)+';'+styleAnchor);
  return source;
};
