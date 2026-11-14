const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../cave.js'),'utf8');
function game(search='',save={}){
 const els={},events={},memory={...save};const noop=()=>{};
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
 function el(id){return els[id]||(els[id]={hidden:false,style:{},classList:{toggle:noop},setAttribute:noop,addEventListener:(k,fn)=>{events[id+':'+k]=fn},setPointerCapture:noop,play:()=>Promise.resolve(),pause:noop,focus:noop,getContext:()=>ctx,clientWidth:1200,clientHeight:700})}
 let storyDone,storyLines;
 const c={console,Math,JSON,Number,Set,URLSearchParams,Image:class{set src(v){this.width=this.height=512;this.onload()}},document:{getElementById:el,addEventListener:noop},localStorage:{getItem:k=>memory[k],setItem:(k,v)=>memory[k]=v},location:{search,pathname:'/cave.html',hash:'',reload:noop},history:{replaceState:noop},performance:{now:()=>0},devicePixelRatio:1,requestAnimationFrame:noop,addEventListener:(k,fn)=>events[k]=fn,storyReader:()=>({start:(lines,done)=>{storyLines=lines;storyDone=done},skip:()=>storyDone()})};vm.createContext(c);vm.runInContext(source,c);
 return {c,els,events,memory,run:s=>vm.runInContext(s,c),story:()=>storyLines};
}
(async()=>{
 let g=game('?from=aqueduct');await new Promise(setImmediate);assert.equal(g.run('mode'),'story');assert.equal(g.story().length,3);g.els.skip.onclick();assert.equal(g.run('mode'),'run');
 for(let lev=0;lev<5;lev++){
  let ticks=0;while(g.run('mode')==='run'&&ticks++<12000){
   g.run('(()=>{const f=nextFork();if(f&&!locked&&f.at-z<35)choose(f.safe);update(1/90)})()');
  }
  assert(ticks<12000,'finish bounded');assert.notEqual(g.run('mode'),'dead');
  if(lev<4){assert.equal(g.run('level'),lev+1);assert.equal(g.run('mode'),'ready');g.els.go.onclick()}else{assert.equal(g.run('mode'),'story');assert(g.run('outro'));g.els.skip.onclick();assert(g.run('completed'));}
 }
 console.log('PASS: world3 arrival plays recorded intro; all 5 levels and 21 forks reach happy ending');
 g=game();await new Promise(setImmediate);g.run('seen=true;enter();');g.run('z=40;choose(1)');assert.equal(g.run('choice'),1);for(let i=0;i<1500&&g.run('mode')==='run';i++)g.run('update(1/90)');assert.equal(g.run('mode'),'dead');g.els.go.onclick();assert.equal(g.run('z'),0);assert.equal(g.run('mode'),'run');console.log('PASS: wrong track ends in falling and retry resets to safe checkpoint');
 g.run('z=40;choose(-1)');for(let i=0;i<1000&&g.run('cp')===0;i++)g.run('update(1/90)');assert.equal(g.run('cp'),131);let cp=g.run('cp');g.run('z=140;choose(-1)');for(let i=0;i<1500&&g.run('mode')==='run';i++)g.run('update(1/90)');assert.equal(g.run('mode'),'dead');g.els.go.onclick();assert.equal(g.run('z'),cp);console.log('PASS: later failures preserve previous junction checkpoint');
 g.run('z=140;choice=0;');g.events['left:pointerdown']({preventDefault(){}});assert.equal(g.run('choice'),-1);g.events.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(g.run('choice'),1);g.events.keyup({key:'ArrowRight'});g.events['brake:pointerdown']({preventDefault(){},pointerId:1});g.run('update(.1)');assert(g.run('braking'));g.events['brake:pointercancel']();assert(!g.run('braking'));g.els.pause.onclick();assert.equal(g.run('mode'),'pause');g.els.go.onclick();assert.equal(g.run('mode'),'run');console.log('PASS: touch/keyboard selections, pointer cancellation, pause/resume');
 g.run('viewZ=z;render()');g.els.view.clientWidth=390;g.els.view.clientHeight=844;g.run('render()');g.els.view.clientWidth=844;g.els.view.clientHeight=390;g.run('render()');console.log('PASS: desktop, portrait and landscape rendering calls');
 const reload=game('',g.memory);await new Promise(setImmediate);assert.equal(reload.run('cp'),cp);console.log('PASS: saved checkpoint reload');
})().catch(e=>{console.error(e);process.exit(1)});
