const {createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../../games/hogtryckstvatten');
const elements=new Map(),storage=new Map();
function element(id){if(elements.has(id))return elements.get(id);const e={id,style:{},dataset:{},open:false,hidden:false,disabled:false,textContent:'',innerHTML:'',listeners:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.listeners[k]=f},showModal(){this.open=true},close(){this.open=false},focus(){},getBoundingClientRect(){return {width:1000,height:500,left:0,top:['hint','toast'].includes(id)?410:0,bottom:id==='mission'?120:500}}};elements.set(id,e);return e;}
const canvas=createCanvas(1000,500);Object.assign(canvas,element('scene'));elements.set('scene',canvas);
class Image extends NativeImage{set src(v){super.src=v.startsWith('assets/')?fs.readFileSync(root+'/'+v):v;}get src(){return super.src;}}
const sandbox={console,Image,Math,Promise,Uint8Array,JSON,performance:{now:()=>0},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},innerWidth:1000,innerHeight:700,devicePixelRatio:1,ResizeObserver:class{observe(){}},requestAnimationFrame(){},window:{addEventListener(){},WasherRig:class{static ready=Promise.resolve();draw(){return {x:0,y:400}}}},document:{querySelector:tag=>({getBoundingClientRect:()=>tag==='header'?{bottom:80}:{top:420}}),getElementById:element,createElement:()=>createCanvas(1,1),addEventListener(){}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(root+'/levels.js','utf8'),sandbox);
let js=fs.readFileSync(root+'/game.js','utf8');js=js.replace(/\}\)\(\);\s*$/,`window.test={load,wash,measure,snapshot,render,sceneLayout,setLevel:i=>level=i,get:()=>({phase,foamReady,foamPercent,percent,done,initial,dirt:mass(),foam:mass(foam),areaMass}),setLast:()=>last=null};})();`);vm.runInContext(js,sandbox);
(async()=>{
 const t=sandbox.window.test;await t.load(0);t.render(16);if(process.env.WASH_SCREENSHOT)fs.writeFileSync(process.env.WASH_SCREENSHOT,canvas.toBuffer('image/png'));const original=t.get().dirt;
 element('rinseMode').onclick();assert.equal(t.get().phase,'foam','Cannot skip shampoo');
 t.wash(.04,{x:850,y:400});t.measure();assert.equal(t.get().dirt,original,'Shampoo must not clean dirt');assert(t.get().foam>0,'Shampoo leaves lather');
 t.snapshot();const partial=t.get().foam;await t.load(0,true);assert.equal(t.get().phase,'foam');assert(Math.abs(t.get().foam-partial)<5,'Foam resumes faithfully');
 for(let pass=0;pass<8&&!t.get().foamReady;pass++)for(let y=0;y<=900;y+=35){t.setLast();for(let x=0;x<=1600;x+=35)t.wash(.04,{x,y});t.measure();}
 assert(t.get().foamReady,'Full coverage unlocks rinsing');assert(!t.get().done,'Foaming is not level completion');
 element('rinseMode').onclick();assert.equal(t.get().phase,'rinse');t.snapshot();await t.load(0,true);assert.equal(t.get().phase,'rinse','Rinse stage survives resume');
 const before=t.get().dirt;t.wash(.04,{x:850,y:400});assert(t.get().dirt<before,'Rinse removes dirt');
 for(let pass=0;pass<8&&!t.get().done;pass++)for(let y=0;y<=900;y+=25){t.setLast();for(let x=0;x<=1600;x+=25)t.wash(.04,{x,y});t.measure();}
 assert(t.get().done,'Rinsing completes level');assert.equal(t.get().foam,0);assert.equal(t.get().dirt,0);
 for(let i=0;i<sandbox.window.WASH_LEVELS.length;i++){t.setLevel(i);for(const [w,h] of [[568,320],[390,844],[844,390],[1280,720],[768,1024],[320,568]]){const l=t.sceneLayout(w,h),a=l.actor,v=l.target;assert(v.x>=0&&v.y>=0&&v.x+v.w<=w+.01&&v.y+v.h<=h+.01,'Whole wash target fits');assert(a.x+a.w<=v.x+.01||a.y>=v.y+v.h-.01,'Operator cannot cover target');assert(Math.abs(v.w/l.bounds.w-v.h/l.bounds.h)<.00001,'Wash target keeps its proportions');}}
 console.log('PASS: shampoo prerequisite, visible foam, no early cleaning, both save stages, rinse, completion and all 26 targets in six unobstructed layouts');
})().catch(e=>{console.error(e);process.exit(1)});
