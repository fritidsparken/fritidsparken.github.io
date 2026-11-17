const {createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../../games/hogtryckstvatten');
const elements=new Map(),storage=new Map();
function element(id){if(elements.has(id))return elements.get(id);const e={id,style:{},dataset:{},open:false,hidden:false,disabled:false,textContent:'',innerHTML:'',listeners:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.listeners[k]=f},showModal(){this.open=true},close(){this.open=false},focus(){},getBoundingClientRect(){return {width:1000,height:500,left:0,top:0}}};elements.set(id,e);return e;}
const canvas=createCanvas(1000,500);Object.assign(canvas,element('scene'));elements.set('scene',canvas);
class Image extends NativeImage{set src(v){super.src=v.startsWith('assets/')?fs.readFileSync(root+'/'+v):v;}get src(){return super.src;}}
const sandbox={console,Image,Math,Promise,Uint8Array,JSON,performance:{now:()=>0},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},innerWidth:1000,innerHeight:700,devicePixelRatio:1,ResizeObserver:class{observe(){}},requestAnimationFrame(){},window:{addEventListener(){},WasherRig:class{static ready=Promise.resolve();draw(){return {x:0,y:400}}}},document:{getElementById:element,createElement:()=>createCanvas(1,1),addEventListener(){}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(root+'/levels.js','utf8'),sandbox);
let js=fs.readFileSync(root+'/game.js','utf8');js=js.replace(/\}\)\(\);\s*$/,`window.test={load,wash,measure,snapshot,render,sceneLayout,get:()=>({phase,foamReady,foamPercent,percent,done,initial,dirt:mass(),foam:mass(foam),areaMass}),setLast:()=>last=null};})();`);vm.runInContext(js,sandbox);
(async()=>{
 const t=sandbox.window.test;await t.load(0);t.render(16);const original=t.get().dirt;
 element('rinseMode').onclick();assert.equal(t.get().phase,'foam','Cannot skip shampoo');
 t.wash(.04,{x:850,y:400});t.measure();assert.equal(t.get().dirt,original,'Shampoo must not clean dirt');assert(t.get().foam>0,'Shampoo leaves lather');
 t.snapshot();const partial=t.get().foam;await t.load(0,true);assert.equal(t.get().phase,'foam');assert(Math.abs(t.get().foam-partial)<5,'Foam resumes faithfully');
 for(let pass=0;pass<8&&!t.get().foamReady;pass++)for(let y=0;y<=900;y+=35){t.setLast();for(let x=0;x<=1600;x+=35)t.wash(.04,{x,y});t.measure();}
 assert(t.get().foamReady,'Full coverage unlocks rinsing');assert(!t.get().done,'Foaming is not level completion');
 element('rinseMode').onclick();assert.equal(t.get().phase,'rinse');t.snapshot();await t.load(0,true);assert.equal(t.get().phase,'rinse','Rinse stage survives resume');
 const before=t.get().dirt;t.wash(.04,{x:850,y:400});assert(t.get().dirt<before,'Rinse removes dirt');
 for(let pass=0;pass<8&&!t.get().done;pass++)for(let y=0;y<=900;y+=25){t.setLast();for(let x=0;x<=1600;x+=25)t.wash(.04,{x,y});t.measure();}
 assert(t.get().done,'Rinsing completes level');assert.equal(t.get().foam,0);assert.equal(t.get().dirt,0);
 for(const [w,h] of [[374,560],[828,240],[1264,510],[750,980],[304,260]]){const l=t.sceneLayout(w,h),a=l.actor;assert(l.x>=0&&l.y>=0&&l.x+1600*l.s<=w+.01&&l.y+900*l.s<=h+.01,'Whole image fits');assert(a.x+a.w<=l.x+.01||a.y>=l.y+900*l.s-.01,'Operator cannot cover image');}
 console.log('PASS: shampoo prerequisite, visible foam, no early cleaning, both save stages, rinse, completion and five unobstructed layouts');
})().catch(e=>{console.error(e);process.exit(1)});
