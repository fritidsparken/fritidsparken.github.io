import assert from 'node:assert/strict';
import {createCartAudio} from '../minecart-audio.js';

class Param {
  value = 0; history = [];
  setTargetAtTime(value, time, constant) {this.value = value; this.history.push({value, time, constant});}
  setValueAtTime(value, time) {this.value = value; this.history.push({value, time});}
  exponentialRampToValueAtTime(value, time) {this.value = value; this.history.push({value, time});}
}
class Node {
  constructor(ctx, kind) {this.ctx = ctx; this.kind = kind; this.connections = []; this.disconnected = false; ctx.nodes.push(this);}
  connect(node) {this.connections.push(node); return node;}
  disconnect() {this.connections = []; this.disconnected = true;}
  start(time = 0, offset = 0) {this.started = time; this.offset = offset; this.ctx.starts.push(this);}
  stop(time = this.ctx.currentTime) {this.ends = time;}
}
class Context {
  state = 'suspended'; sampleRate = 24000; currentTime = 0; nodes = []; starts = []; destination = {};
  createGain() {const n = new Node(this, 'gain'); n.gain = new Param(); return n;}
  createBufferSource() {const n = new Node(this, 'buffer'); n.playbackRate = new Param(); return n;}
  createBiquadFilter() {const n = new Node(this, 'filter'); n.frequency = new Param(); n.Q = new Param(); return n;}
  createOscillator() {const n = new Node(this, 'oscillator'); n.frequency = new Param(); return n;}
  createDelay() {const n = new Node(this, 'delay'); n.delayTime = new Param(); return n;}
  createDynamicsCompressor() {const n = new Node(this, 'compressor'); for (const key of ['threshold','knee','ratio','attack','release']) n[key] = new Param(); return n;}
  createStereoPanner() {const n = new Node(this, 'pan'); n.pan = new Param(); return n;}
  createBuffer(channels, length, rate) {return {duration: length / rate, data: Array.from({length: channels}, () => new Float32Array(length)), getChannelData(i) {return this.data[i];}};}
  resume() {this.state = 'running'; return Promise.resolve();}
  close() {this.state = 'closed'; return Promise.resolve();}
  advance(dt) {this.currentTime += dt; for (const n of this.nodes) if (n.ends != null && n.ends <= this.currentTime && !n.finished) {n.finished = true; n.onended?.();}}
}
let ctx, creations = 0;
const sound = createCartAudio({contextFactory: () => {creations++; return ctx = new Context();}, fetcher: async () => ({ok:false}), random: () => .478});
assert.equal(creations, 0, 'No AudioContext/autoplay attempt before gesture');
assert.equal(await sound.resume(), true);
await sound.ready;
assert.equal(await sound.resume(), true); assert.equal(creations, 1, 'Repeated gestures share the graph');
assert.equal(sound.diagnostics.loopSources, 3, 'Only fixed rolling, wind and wheel-hum layers');
for (const n of ctx.starts.filter(n => n.loop)) {
  assert.equal(n.loopStart, .18); assert.ok(n.loopEnd > 10);
  assert.ok(n.buffer.data[0].every(Number.isFinite));
}
let s = {status:'run',speed:16,jumpHeight:0,travel:0,respawns:0,fallTime:0};
function frame(dt = 1/60) {s.travel += s.speed * dt; sound.update(dt,s,'run'); ctx.advance(dt);}
for(let i=0;i<180;i++) frame();
const rollingGain = ctx.nodes.find(n => n.kind === 'filter' && n.type === 'lowpass' && n.frequency.history.length)?.connections[0];
assert.ok(rollingGain?.gain.value > .15, 'Rolling amplitude grows with speed');
const fastGain = rollingGain.gain.value, fastSpeed = sound.diagnostics.speed;
assert.ok(fastSpeed > 15.9);
const runStarts = ctx.starts.length;
assert.ok(runStarts > 20, 'Travel creates speed-spaced axle impacts');
s.speed = 0;
for(let i=0;i<180;i++) frame();
assert.ok(rollingGain.gain.value < fastGain * .01, 'Slowing the cart fades its rolling sound');
assert.ok(sound.diagnostics.speed < .001);
assert.equal(ctx.starts.length, runStarts, 'A stopped cart does not keep producing rail joints');

// Actual jumps are detected from height, not the queued input button.
s.speed = 16; s.travel += .1; sound.update(1/60,s,'run');
let count = ctx.starts.length;
s.jumpQueued = true; sound.update(1/60,s,'run');
assert.equal(ctx.starts.length, count, 'Queued jump is silent until take-off');
s.jumpHeight = .2; sound.update(1/60,s,'run');
assert.ok(ctx.starts.length > count, 'Take-off makes a jump/metal sound');
count = ctx.starts.length;
sound.update(1/60,s,'run'); assert.equal(ctx.starts.length,count,'One take-off event only');
s.jumpHeight = 0; sound.update(1/60,s,'run'); assert.ok(ctx.starts.length > count,'Contact makes a landing sound');
count = ctx.starts.length;
s.status = 'falling'; s.fallTime = .01; sound.update(1/60,s,'run'); assert.ok(ctx.starts.length > count,'Falling makes an air/low resonance cue');
count = ctx.starts.length;
s.status = 'run'; s.respawns++; s.speed = 0; sound.update(1/60,s,'run');
assert.equal(ctx.starts.length,count,'Respawn does not create a fake landing');

sound.coin(1); sound.coin(3); sound.door();
assert.ok(sound.diagnostics.transientVoices > 0);
ctx.advance(3);
assert.equal(sound.diagnostics.transientVoices,0,'Finished voices remove their graph nodes');
for(let i=0;i<100;i++) sound.coin(i%8+1);
assert.ok(sound.diagnostics.transientVoices <=48,'Bursts have a hard polyphony limit');
sound.setActive(false); count = ctx.starts.length;
sound.coin(); sound.jump(); sound.door();
assert.equal(ctx.starts.length,count,'Pause/menu suppresses new effects');
assert.equal(ctx.nodes.find(n=>n.kind==='gain').gain.value,0,'Master fades to silence on pause');
ctx.advance(3);
assert.equal(sound.diagnostics.transientVoices,0);
sound.setEnabled(false); sound.update(1/60,s,'run'); assert.equal(sound.diagnostics.active,false);
sound.setEnabled(true); sound.update(1/60,s,'run'); assert.equal(sound.diagnostics.active,true);
sound.dispose(); sound.dispose();
assert.equal(sound.diagnostics.loopSources,0); assert.equal(sound.diagnostics.transientVoices,0); assert.equal(ctx.state,'closed');
assert.ok(ctx.nodes.every(n=>n.disconnected),'Dispose disconnects all persistent and transient nodes');
assert.equal(await sound.resume(),false,'Disposed graph cannot silently recreate audio');
const unsupported = createCartAudio({contextFactory:()=>null});
assert.equal(await unsupported.resume(),false); unsupported.update(1/60,s,'run'); unsupported.dispose();
console.log('PASS audio: gesture unlock, stable graph, speed fade, metre-based axle rhythm, jump/land/fall cues, pause, bounded voice cleanup and disposal');
