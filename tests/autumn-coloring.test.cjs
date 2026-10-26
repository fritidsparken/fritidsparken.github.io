// Runs the deployed loader and painter with real canvas/image decoding and a minimal DOM.
// Verifies all autumn assets, actual region fills, undo/redo, export, and retry after load failure.
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
const images=[];class Img extends canvas.Image{set onload(fn){super.onload=()=>{Promise.resolve(fn()).catch(e=>console.error(e.stack));}}set src(v){if(failReference&&v.includes("/autumn-references-"))throw Error("Simulated unavailable reference");super.src=fs.readFileSync(new URL(v,'https://test/').pathname.slice(1));images.push(this)}get naturalWidth(){return this.width}get naturalHeight(){return this.height}}
const body=new E(),head=new E();const context={console,URL,Blob,Image:Img,Uint8Array,Uint32Array,Uint16Array,Int32Array,Map,Set,Math,Promise,confirm:()=>true,location:new URL('https://test/'),MutationObserver:class{observe(){}},requestAnimationFrame:f=>setImmediate(f),setTimeout:f=>setImmediate(f),document:{body,head,currentScript:{src:'https://test/js/paint-online-car-reference.js'},createElement:t=>t==='canvas'?makeCanvas():new E(),querySelector:()=>null,querySelectorAll:()=>[]},fetch:async()=>({ok:true,text:async()=>fs.readFileSync('js/paint-online-restored-20261024.js','utf8')})};context.window=context;context.addEventListener=()=>{};context.removeEventListener=()=>{};
vm.createContext(context);vm.runInContext(fs.readFileSync('js/paint-online-summer-patch.js','utf8'),context);
let loader=fs.readFileSync('js/paint-online-car-reference.js','utf8');loader=loader.slice(0,loader.indexOf('  const script=document.createElement("script")'))+'globalThis.patched=source;\n }).catch(error=>{throw error});\n})();';
vm.runInContext(loader,context);
const keepalive=setTimeout(()=>{throw Error("Painter test timed out")},180000);
(async()=>{while(!context.patched)await new Promise(r=>setImmediate(r));new vm.Script(context.patched);
const code=context.patched.replace('function openPainter(IMAGE,TARGET,REFERENCE=""){','globalThis.openPainter=function openPainter(IMAGE,TARGET,REFERENCE=""){').replace(' if(autoButton)autoButton.addEventListener("click",runAutoColor);','globalThis.controls={runAutoColor,redraw,paint,lines,undo,redo,autoButton,status,autoProgress,save:()=>back.querySelector(`[data-action="save"]`).onclick(),acts:()=>acts,W:()=>W}; if(autoButton)autoButton.addEventListener("click",runAutoColor);');vm.runInContext(code,context);
assert.equal(fs.readdirSync('assets/mandala-host-2026').filter(n=>n.endsWith('.webp')).length,27);
for(const file of fs.readdirSync('assets/mandala-host-2026').filter(n=>n.endsWith('.webp'))){const id=file.slice(0,-5);context.openPainter('./assets/mandala-host-2026/'+file,id);while(!context.controls.W())await new Promise(r=>setImmediate(r));const c=context.controls;const ink=c.lines.toBuffer("image/png");await c.runAutoColor();assert.deepEqual(c.lines.toBuffer("image/png"),ink,"original contours preserved");if(!c.status.textContent.startsWith('Klart!'))throw Error(id+': '+c.status.textContent);if(c.acts().length<4||c.acts().some(a=>a.type!=='summerRegion')||c.autoButton.disabled)throw Error(id+' missing regions/retry');const before=c.paint.toBuffer('image/png');c.undo.onclick();c.redo.onclick();if(!before.equals(c.paint.toBuffer('image/png')))throw Error(id+' undo/redo mismatch');exported=null;c.save();assert.ok(exported?.length>1000,"PNG export");if(id==='applen'){
failReference=true;await c.runAutoColor();assert.match(c.status.textContent,/kunde inte laddas/);assert.equal(c.autoButton.disabled,false);
failReference=false;await c.runAutoColor();assert.match(c.status.textContent,/^Klart!/);assert.deepEqual(c.paint.toBuffer('image/png'),before,'retry restores reference painting');
}
console.log('PASS',id,c.acts().length);}
clearInterval(keepalive);})();
