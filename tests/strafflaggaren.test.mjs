import test from 'node:test';import assert from 'node:assert/strict';import {winner,launch,step,swipe,keeperPose} from '../games/strafflaggaren/physics.mjs';
const fly=(b,parts=[])=>{while(!b.done)step(b,1/480,parts);return b;};
test('five rounds, early wins, sudden death needs equal attempts',()=>{assert.equal(winner([true,true,true],[false,false,false]),0);assert.equal(winner([false,false,false],[true,true,true]),1);assert.equal(winner([true,false,true,false,true],[true,true,false,true,false]),null);assert.equal(winner([1,1,1,0,0,1],[1,1,1,0,0]),null);assert.equal(winner([1,1,1,0,0,1],[1,1,1,0,0,0]),0);assert.equal(winner([0,0,0,0,0],[0,0,0,0,0]),null);});
test('all nine placements cross the goal, for soft and hard balls',()=>{for(const x of [-2.7,0,2.7])for(const y of [.3,1.15,2.05])for(const v of [14,29])assert.equal(fly(launch(x,y,v)).goal,true,`${x},${y},${v}`);});
test('outside and overbar are misses; no teleport on first step',()=>{for(const [x,y] of [[4.4,1],[0,3.5]])assert.equal(fly(launch(x,y)).goal,false);const b=launch(1,1);step(b,1/240);assert.ok(b.z>10.8&&b.z<11);});
test('spin bends flight and retains aimed endpoint',()=>{const b=launch(2,1.8,22,1),c=launch(2,1.8,22,0);for(let i=0;i<60;i++){step(b,1/240);step(c,1/240);}assert.ok(Math.abs(b.x-c.x)>.1);assert.equal(fly(b).goal,true);});
test('posts and bar collide, with both rebound and deflected goals possible',()=>{let posts=0,bars=0,ins=0,outs=0;for(let x=3.48;x<3.85;x+=.012){const b=fly(launch(x,1,24));if(b.hit==='post'){posts++;b.goal?ins++:outs++;}}for(let y=2.25;y<2.65;y+=.012){const b=fly(launch(1,y,24));if(b.hit==='bar'){bars++;b.goal?ins++:outs++;}}assert.ok(posts&&bars&&ins&&outs);});
test('keeper body contacts actually deflect; corners evade stationary keeper',()=>{const p=keeperPose({tx:0,ty:.94,time:0}).parts;const b=fly(launch(0,.95,20),p);assert.ok(b.saved);assert.ok(!b.goal);assert.ok(!fly(launch(2.8,2,22),p).saved);});
test('dive moves contact volumes and lands',()=>{const p=keeperPose({tx:2.5,ty:1.9,time:.42});assert.ok(p.x>2.4);assert.ok(p.parts.some(s=>s.x>2.5));assert.ok(keeperPose({tx:2.5,ty:1.9,time:1.6}).y<.4);});
test('net reacts after a valid goal; all shots have a watchdog',()=>{const b=fly(launch(2,1));assert.ok(b.goal&&b.net&&b.done);assert.ok(fly(launch(0,.14,14)).done);});
test('short input ignored, extreme speed capped, curve measured',()=>{assert.equal(swipe([{x:0,y:0,t:0},{x:1,y:2,t:1}],{x:0,y:1}),null);const s=swipe([{x:0,y:300,t:0},{x:150,y:150,t:1},{x:0,y:0,t:2}],{x:100,y:100});assert.equal(s.speed,29);assert.equal(s.x,4.8);assert.equal(s.y,3.5);assert.ok(s.spin>.5);});
test('a keeper starts a dive from the chosen position without snapping back to centre',()=>{
 const keeper={startX:1.25,tx:-2.2,ty:.5,time:0};
 assert.equal(keeperPose(keeper).x,1.25);
 keeper.time=.001;assert.ok(Math.abs(keeperPose(keeper).x-1.25)<.001);
 keeper.time=.42;assert.ok(Math.abs(keeperPose(keeper).x+2.2)<1e-8);
});
test('the whole ball must clear the line before a goal is counted',()=>{
 const ball=launch(1,1.2,23,.5);
 while(ball.z>0)step(ball,1/240);
 assert.equal(ball.goal,false);
 while(ball.z>=-.11)step(ball,1/240);
 assert.equal(ball.goal,true);
 assert.ok(Math.abs(ball.crossing.x-1)<.07);
});
