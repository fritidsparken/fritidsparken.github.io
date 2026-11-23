import * as data from '../games/hemlyckan/data.js';import {readFileSync,existsSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
let timerId=0,now=1000;const timers=new Map(),saved=new Map();const node={textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){}},querySelector(){return node}};
const sandbox={__data:data,console,Intl,Image:class{},document:{querySelector(){return node},querySelectorAll(){return[]},contains(){return false}},window:{addEventListener(){}},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>now},setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),requestAnimationFrame:()=>0,cancelAnimationFrame(){}};
const code=readFileSync(new URL('../games/hemlyckan/app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'').replace(/render\(\);\s*$/,'');vm.createContext(sandbox);vm.runInContext('const {ROOMS,TIERS,TOOLS,price,INITIAL_BUDGET,freshState,totalSpent,allDone,completedTasks,TOTAL_TASKS,normalizeState}=__data;\n'+code+'\nrender=()=>{};this.api={action,selectRoom,advance,taskCount,current,rs,progress,save,sceneTier,getState:()=>state};',sandbox);const api=sandbox.api;
function flush(){for(let i=0;i<8&&timers.size;i++){const pending=[...timers];timers.clear();pending.forEach(([,fn])=>fn());}}
for(const [ri,room]of data.ROOMS.entries()){
 api.selectRoom(room.id);vm.runInContext(`previewTier=${ri%3+1}`,sandbox);assert.equal(api.sceneTier(),0);api.action('after-view');assert.equal(api.sceneTier(),ri%3+1,'preview uses selected tier');api.action('before-view');assert.equal(api.sceneTier(),0);api.action('confirm-tier');
 for(const [step,task]of room.tasks.entries()){
  assert.equal(api.rs().step,step);assert.equal(api.sceneTier(),0);
  api.action('after-view');assert.equal(api.sceneTier(),ri%3+1);api.advance(0,1);assert.equal(api.progress(),0,'after preview cannot renovate');api.action('work-view');assert.equal(api.sceneTier(),0);api.advance(-1,1);api.advance(99,1);assert.equal(api.progress(),0,'invalid target cannot advance');
  api.advance(0,.35);api.save();const reloaded=data.normalizeState(JSON.parse(saved.get('hemlyckan-save-v1')));assert.equal(reloaded.rooms[room.id].work[0],.35);
  api.action('compare');api.advance(0,1);assert.equal(api.progress(),.35/api.taskCount(),'comparison cannot renovate');api.action('compare');
  for(let i=0;i<api.taskCount();i++){now+=180;api.advance(i,.5);api.advance(i,.5);api.advance(i,1);}
  assert.equal(api.progress(),1);assert.equal(api.rs().step,step,'show completed parts before next task');flush();assert.equal(api.rs().step,step+1,'advance exactly once');
 }
 assert.equal(api.sceneTier(),ri%3+1);for(let tier=0;tier<=3;tier++)assert(existsSync(new URL('../games/hemlyckan/assets/'+room.id+'-'+tier+'.webp',import.meta.url)));
}
assert(data.allDone(api.getState()));assert.equal(data.completedTasks(api.getState()),76);api.save();assert.equal(data.completedTasks(data.normalizeState(JSON.parse(saved.get('hemlyckan-save-v1')))),76);assert(data.totalSpent(api.getState())<=data.INITIAL_BUDGET);api.action('finale');assert.equal(vm.runInContext('view',sandbox),'finale');
console.log('PASS: all 76 tasks, 11 rooms, tier budgets, autosave, partial progress, comparison guard, one completion transition and final gallery.');
