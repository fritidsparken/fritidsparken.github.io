import test from 'node:test';
import assert from 'node:assert/strict';
import {courses,worlds,totalPar,validateCourses} from '../games/minigolf/courses.mjs';
test('18 individually authored layouts in six groups',()=>{
 assert.equal(validateCourses(),true);
 assert.equal(new Set(courses.map(c=>JSON.stringify(c.path))).size,18);
 worlds.forEach((_,i)=>assert.equal(courses.filter(c=>c.world===i).length,3));
 assert.equal(totalPar,60);
});
test('rejects missing holes and broken feature destinations',()=>{
 assert.throws(()=>validateCourses(courses.slice(0,17)));
 const broken=structuredClone(courses);broken[5].features[0].exit=99;
 assert.throws(()=>validateCourses(broken));
});
test('finale includes all authored signature sections',()=>{
 const c=courses[17];assert.ok(c.path[0][1]>10);assert.ok(c.path.at(-1)[2]<-120);
 for(const type of ['barrel','tunnel','loop','cannon','underwaterTunnel'])assert.ok(c.features.some(f=>f.type===type));
 assert.ok(c.path.some(p=>p[1]<0));
});
