// Runs the deployed loader and painter with real canvas/image decoding and a minimal DOM.
// Verifies all ten Pokémon references and a summer regression, actual region fills, undo/redo, export, and retry after load failure.
// This does not substitute for a device/browser UI test.
process.on("unhandledRejection",e=>{console.error("UNHANDLED",e.stack||e);process.exit(1)});
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
process.chdir(require('path').resolve(__dirname,'..'));
const canvas=require('@napi-rs/canvas');
class E{
 constructor(){this.style={};this.children=[];this.map=new Map();this.events={};this.dataset={};this.textContent='';this.clientWidth=900;this.clientHeight=900;this.isConnected=true;this.classList={add(){},contains(){return true}};}
 append(...x){this.children.push(...x)} insertBefore(x){this.append(x)} setAttribute(){} focus(){} click(){} addEventListener(n,f){this.events[n]=f} remove() {this.isConnected=false} querySelectorAll(){return []}
 querySelector(s){if(!this.map.has(s))this.map.set(s,/^\.fp-(paint|line)-layer$/.test(s)?makeCanvas():new E());return this.map.get(s)}
}
let exported=null,failReference=false;
const makeCanvas=()=>{const c=canvas.createCanvas(1,1);c.style={};c.toBlob=cb=>{exported=c.toBuffer("image/png");cb(new Blob([exported],{type:"image/png"}))};return c};
const images=[];class Img extends canvas.Image{set onload(fn){super.onload=()=>{Promise.resolve(fn()).catch(e=>console.error(e.stack));}}set src(v){if(failReference&&v.includes("/pokemon-references-20261109/"))throw Error("Simulated unavailable reference");setTimeout(()=>{super.src=fs.readFileSync(new URL(v,'https://test/').pathname.slice(1));images.push(this)},10)}get naturalWidth(){return this.width}get naturalHeight(){return this.height}}
const body=new E(),head=new E();const context={console,URL,Blob,Image:Img,Uint8Array,Uint32Array,Uint16Array,Int32Array,Map,Set,Math,Promise,confirm:()=>true,location:new URL('https://test/'),MutationObserver:class{observe(){}},requestAnimationFrame:f=>setImmediate(f),setTimeout:f=>setImmediate(f),document:{body,head,currentScript:{src:'https://test/js/paint-online-car-reference.js'},createElement:t=>t==='canvas'?makeCanvas():new E(),querySelector:()=>null,querySelectorAll:()=>[]},fetch:async()=>({ok:true,text:async()=>fs.readFileSync('js/paint-online-restored-20261024.js','utf8')})};context.mandalas=[];context.window=context;context.addEventListener=()=>{};context.removeEventListener=()=>{};
vm.createContext(context);vm.runInContext(fs.readFileSync('js/paint-online-summer-patch.js','utf8'),context);
let loader=fs.readFileSync('js/paint-online-car-reference.js','utf8');loader=loader.slice(0,loader.indexOf('  const script=document.createElement("script")'))+'globalThis.patched=source;\n }).catch(error=>{throw error});\n})();';
vm.runInContext(loader,context);
const keepalive=setTimeout(()=>{throw Error("Painter test timed out")},180000);
(async()=>{while(!context.patched)await new Promise(r=>setImmediate(r));new vm.Script(context.patched);
const code=context.patched.replace('function openPainter(IMAGE,TARGET,REFERENCE=""){','globalThis.openPainter=function openPainter(IMAGE,TARGET,REFERENCE=""){').replace(' if(autoButton)autoButton.addEventListener("click",safeRunAutoColor);','globalThis.controls={back,REFERENCE,runAutoColor,redraw,paint,lines,undo,redo,autoButton,status,autoProgress,save:()=>back.querySelector(`[data-action="save"]`).onclick(),acts:()=>acts,W:()=>W}; if(autoButton)autoButton.addEventListener("click",safeRunAutoColor);');vm.runInContext(code,context);
const manifest=JSON.parse(fs.readFileSync('assets/pokemon-references-20261109/manifest.json'));
const newManifest=JSON.parse(fs.readFileSync('assets/pokemon-references-20261109-b/manifest.json'));
assert.equal(manifest.length,10);assert.equal(newManifest.length,10);manifest.push(...newManifest);
for(const entry of [...manifest,{name:'sommar-regression',original:'assets/mandala-summer-2026/midsommar.webp'}]){
 const id=entry.name;context.openPainter('./'+entry.original,id);const c=context.controls;
 assert.equal(c.W(),0,'asynchronous image loading');await c.runAutoColor();assert.match(c.status.textContent,/startar strax/);
 while(!c.W())await new Promise(r=>setImmediate(r));const ink=c.lines.toBuffer('image/png');
 while(!c.status.textContent.startsWith('Klart!')){if(c.status.textContent.includes('kunde inte'))throw Error(id+': '+c.status.textContent);await new Promise(r=>setImmediate(r));}
 assert.deepEqual(c.lines.toBuffer('image/png'),ink,'original contours unchanged');
 assert.ok(c.acts().length>=4,id+' multiple regions');assert.ok(c.acts().every(a=>a.type==='summerRegion'),'same Summer engine');
 assert.equal(c.autoButton.disabled,false);
 if(entry.width){assert.equal(c.paint.width,entry.width);assert.equal(c.paint.height,entry.height);
 for(let i=1;i<c.acts().length;i++)assert.ok(c.acts()[i-1].region.area>=c.acts()[i].region.area,'large areas first');
 assert.ok(c.REFERENCE.endsWith(id+'-reference.webp'),'correct suggestion');
 const viewer=c.back.children.find(x=>x.className==='fp-reference-backdrop');assert.ok(viewer);
 c.back.querySelector('[data-action="reference"]').events.click();assert.equal(viewer.hidden,false);
 const card=viewer.children[0];assert.equal(card.children.filter(x=>x.src).length,1,'one suggestion image');
 card.children.find(x=>x.className==='fp-reference-close').events.click();assert.equal(viewer.hidden,true);
 }
 const before=c.paint.toBuffer('image/png');c.undo.onclick();c.redo.onclick();assert.deepEqual(c.paint.toBuffer('image/png'),before,'undo/redo');
 exported=null;c.save();assert.ok(exported?.length>1000);fs.mkdirSync('../qa',{recursive:true});fs.writeFileSync('../qa/'+id+'.png',exported);
 if(id==='spoink'){failReference=true;await c.runAutoColor();assert.match(c.status.textContent,/kunde inte laddas/);assert.equal(c.autoButton.disabled,false);failReference=false;await c.runAutoColor();assert.deepEqual(c.paint.toBuffer('image/png'),before,'retry');}
 console.log('PASS',id,c.acts().length,'regions',c.paint.width,c.paint.height);
 c.back.remove();
}
clearTimeout(keepalive);
})();
