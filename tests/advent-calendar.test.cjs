const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const rules=require('../js/advent-calendar-core.js');
for(const [date,count] of [['2026-11-30T22:59:59Z',0],['2026-11-30T23:00:00Z',1],['2026-12-01T12:00:00Z',1],['2026-12-23T12:00:00Z',23],['2026-12-24T12:00:00Z',24],['2026-12-25T12:00:00Z',24],['2026-12-31T23:00:00Z',0],['2027-12-01T12:00:00Z',1]])test(`Stockholm ${date}: ${count} doors`,()=>assert.equal(rules.available(Date.parse(date)),count));
test('Christmas countdown respects Stockholm midnight',()=>{assert.equal(rules.daysLeft(Date.parse('2026-12-22T23:00:00Z')),1);assert.equal(rules.daysLeft(Date.parse('2026-12-24T12:00:00Z')),0);});
test('Progress resets by year; malformed and duplicate data are safe',()=>{assert.deepEqual(rules.readProgress('{bad',2026),[]);assert.deepEqual(rules.readProgress('{"year":2026,"days":[1,1,0,24,25,"2",2.2]}',2026),[1,24]);assert.deepEqual(rules.readProgress('{"year":2026,"days":[1,24]}',2027),[]);});
test('24 separate animals, images and messages in exact day order',()=>{const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../js/advent-calendar-data.js'),'utf8'),context);const days=context.window.FPAdventDays;assert.equal(days.length,24);for(const field of ['animal','image','message'])assert.equal(new Set(days.map(d=>d[field])).size,24);days.forEach((d,i)=>assert.equal(d.day,i+1));assert.match(days[6].animal,/Renunge/);assert.match(days[22].message,/Imorgon är det julafton/);assert.match(days[23].message,/God jul!/);});
