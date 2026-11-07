// Behavioral contract for all lessons, using a deterministic animation clock.
// Real SVG geometry and browser appearance are checked separately.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/drawing-guides.js','utf8').split('// Paced drawing lessons:')[1];
const script=source.slice(source.indexOf('(()=>{'));
const site=fs.readFileSync('js/site.js','utf8');
const newSource=fs.readFileSync('js/drawing-new-100.js','utf8');
const window={};vm.runInNewContext(newSource,{window});
const registry=site.slice(site.indexOf('const drawingAnimals='),site.indexOf('function drawingStepCount'));
const ids=vm.runInNewContext(registry+'drawingAnimals.map(a=>a.id)',{window});
const gallery=site.slice(site.indexOf('function drawingGallery('),site.indexOf('function pearlSvg('));
// Exercise the actual dialog builder; this caught the missing a.steps.concat crash.
for(const id of ids){
 const html=vm.runInNewContext(registry+gallery+'activeDrawing='+JSON.stringify(id)+';drawingGallery("")', {window,drawingGuideSprite:a=>'<canvas data-drawing-guide="'+a.id+'"></canvas>'});
 assert.ok(html.includes('role="dialog"'),id+' opens a dialog');
 assert.ok(!html.includes('undefined'),id+' has complete instructions');
}
assert.equal(new Set(Object.values(window.newDrawingLessons).map(l=>JSON.stringify(l.groups))).size,30,'all new motifs have distinct artwork');
function setup(id){
 const observers=[],frames=new Map();let seq=0,clock=100;
 class El{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.style={};this.dataset={};this.listeners={};this.hidden=false;this.disabled=false;this.className='';this.textContent='';this.classList={add:c=>this.className+=' '+c}}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='class')this.className=v}
  getAttribute(k){return this.attrs[k]??null}
  append(...els){for(const e of els){e.parent=this;this.children.push(e)}}
  get isConnected(){return this===document.body||this===document.head||!!this.parent?.isConnected}
  matches(s){if(s.startsWith('.'))return this.className.split(' ').includes(s.slice(1));if(s.startsWith('canvas['))return this.tagName==='canvas'&&this.dataset.drawingGuide;return this.tagName===s}
  closest(s){return this.matches(s)?this:this.parent?.closest(s)}
  querySelectorAll(s){if(s.includes(' ')){const [p,...rest]=s.split(' ');return this.querySelectorAll(p).flatMap(e=>e.querySelectorAll(rest.join(' ')))}return this.children.flatMap(e=>[...(e.matches(s)?[e]:[]),...e.querySelectorAll(s)])}
  querySelector(s){return this.querySelectorAll(s)[0]??null}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
  click(){if(!this.disabled)this.listeners.click?.forEach(fn=>fn({stopPropagation(){}}))}
  remove(){if(this.parent){this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null}}
  replaceWith(e){const p=this.parent;p.children.splice(p.children.indexOf(this),1,e);e.parent=p;this.parent=null}
  focus(){}scrollIntoView(){}
  getTotalLength(){return 150}getPointAtLength(n){return {x:n,y:n}}
  set innerHTML(s){this.children.forEach(e=>e.parent=null);this.children=[];if(s.includes('draw-lesson-grid')){const grid=new El('div');grid.className='draw-lesson-grid';const status=new El('p');status.className='draw-lesson-status';this.append(grid,status)}}
 }
 const document={body:new El('body'),head:new El('head'),hidden:false,createElement:t=>new El(t),createElementNS:(_,t)=>new El(t),getElementById:()=>null,querySelectorAll:s=>document.body.querySelectorAll(s)};
 const modal=new El('article');modal.className='draw-modal';const holder=new El('div');holder.className='draw-modal-guides';const canvas=new El('canvas');canvas.dataset.drawingGuide=id;holder.append(canvas);modal.append(holder);document.body.append(modal);
 vm.runInNewContext(script,{window,document,MutationObserver:class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.stopped=true}},requestAnimationFrame:fn=>{frames.set(++seq,fn);return seq},cancelAnimationFrame:n=>frames.delete(n)});
 const lesson=()=>holder.querySelector('.draw-lesson'),cards=()=>holder.querySelectorAll('.draw-lesson-board'),next=()=>holder.querySelector('.draw-lesson-wait')?.querySelector('button');
 function finish(){let guard=0;while(frames.size){assert.ok(guard++<1000,'animation terminates');clock+=3000;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(clock))}}
 return {document,holder,modal,observers,frames,lesson,cards,next,finish};
}
for(const id of ids){
 const t=setup(id);assert.ok(t.lesson(),id+' mounted');assert.equal(t.cards().length,1);assert.equal(t.next(),undefined);
 for(let i=0;i<5;i++){
  t.finish();assert.equal(t.cards().length,i+1,id+' remains paused');assert.equal(t.frames.size,0);
  const repeats=t.holder.querySelectorAll('.draw-lesson-replay');assert.equal(repeats.length,i+1);
  repeats[i].click();assert.equal(t.holder.querySelector('.draw-lesson-wait')?.hidden,i<4?true:undefined);t.finish();assert.equal(t.cards().length,i+1,id+' replay adds no steps');
  if(i<4){const button=t.next();assert.ok(button);button.click();button.click();assert.equal(t.cards().length,i+2,id+' double-click advances once');assert.equal(t.next(),undefined,id+' button replaced')}
  else{assert.equal(t.next(),undefined);assert.match(t.holder.querySelector('.draw-lesson-status').textContent,/Alla fem steg/)}
 }
 const close=setup(id);close.modal.remove();close.observers.forEach(o=>!o.stopped&&o.fn());assert.equal(close.frames.size,0,id+' close cancels animation');
}
assert.equal(ids.length,63);console.log('PASS: all 63 dialogs open; 63 motifs × 5 steps, pause gates, replay, double-click protection, and close cleanup.');
