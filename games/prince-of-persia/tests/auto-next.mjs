import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../jungle/chase.js',import.meta.url),'utf8');
const finish=src.match(/function finishChase\(\) \{[\s\S]*?(?=\nfunction )/)[0];
for(let level=0;level<10;level++){
 let scheduled,played,navigated,unlocked=false;const els={};
 const context=vm.createContext({bridge:{active:true,done:false,level,total:10,coins:Array(10)},stopRoll(){},quietScore(){},playEffect(){},jungleRecord:{best:Array(10).fill(0),next:0},localStorage:{setItem(){}},saveKey:'test',fillChaseStages(){},unlockMoon(){unlocked=true},$:id=>els[id]??=( {}),course:()=>['Course'],jungleCourses:Array.from({length:10},()=>['Course']),setTimeout:cb=>scheduled=cb,location:{assign:url=>navigated=url},replayCourse:n=>played=n});
 vm.runInContext(finish+';finishChase()',context);assert(els.bridgeEnd.hidden);scheduled();
 if(level===9){assert(unlocked);assert.equal(navigated,'moon.html?from=jungle')}else assert.equal(played,level+1);
 played=undefined;navigated=undefined;context.bridge.active=false;scheduled();assert.equal(played,undefined);assert.equal(navigated,undefined);
}
console.log('PASS all jungle levels auto-advance, last opens Moon, cancellation guard');
