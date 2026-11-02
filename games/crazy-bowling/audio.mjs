import {impactSample,rollingSample,roomImpulse} from './sound-design.mjs?v=20261102-audio';
export class Audio {
 constructor(enabled=true){this._enabled=enabled;this.context=null;this.voices=new Set();this.hits=new Map();this.variation=0;}
 get enabled(){return this._enabled;}
 set enabled(value){this._enabled=!!value;if(!value)this.silence();if(this.master){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(value?.65:0,this.context.currentTime,.015);}}
 buffer(samples){const b=this.context.createBuffer(1,samples.length,this.context.sampleRate);b.copyToChannel(samples,0);return b;}
 start(){if(!this.enabled)return;try{
 if(!this.context){const c=this.context=new(window.AudioContext||window.webkitAudioContext)();this.master=c.createGain();this.master.gain.value=.65;
 const compressor=c.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.14;this.master.connect(compressor).connect(c.destination);
 this.room=c.createConvolver();this.room.buffer=this.buffer(roomImpulse(c.sampleRate));const wet=c.createGain();wet.gain.value=.2;this.room.connect(wet).connect(this.master);
 this.samples={};for(const kind of ['pin','pinfall','bounce'])this.samples[kind]=Array.from({length:5},(_,i)=>this.buffer(impactSample(c.sampleRate,kind,91+i*73)));
 this.roll=c.createBufferSource();this.roll.buffer=this.buffer(rollingSample(c.sampleRate));this.roll.loop=true;this.rollFilter=c.createBiquadFilter();this.rollFilter.type='lowpass';this.rollFilter.frequency.value=650;this.rollGain=c.createGain();this.rollGain.gain.value=0;this.rollPan=c.createStereoPanner?.();
 this.roll.connect(this.rollFilter).connect(this.rollGain);if(this.rollPan)this.rollGain.connect(this.rollPan).connect(this.master);else this.rollGain.connect(this.master);this.roll.start();
 }if(this.context.state==='suspended')this.context.resume().catch(()=>{});
 }catch{this._enabled=false;}}
 rolling(speed,x=0){if(!this.rollGain)return;const c=this.context,s=Math.max(0,Math.min(30,Number(speed)||0));this.rollGain.gain.setTargetAtTime(this.enabled?Math.min(.65,s*.022):0,c.currentTime,.07);this.roll.playbackRate.setTargetAtTime(.65+s*.025,c.currentTime,.12);this.rollFilter.frequency.setTargetAtTime(240+s*28,c.currentTime,.12);this.rollPan?.pan.setTargetAtTime(Math.max(-.65,Math.min(.65,x/7)),c.currentTime,.1);}
 silence(){this.rolling(0);for(const source of this.voices){try{source.stop();}catch{}}this.voices.clear();}
 sample(kind,impact,x=0,delay=0){const c=this.context;if(!c||this.voices.size>=20)return;const source=c.createBufferSource(),gain=c.createGain();source.buffer=this.samples[kind][this.variation++%5];source.playbackRate.value=.94+Math.random()*.12;gain.gain.value=Math.min(.85,.10+Math.sqrt(Math.max(0,impact))*.12);const pan=c.createStereoPanner?.();source.connect(gain);if(pan){pan.pan.value=Math.max(-.7,Math.min(.7,x/6));gain.connect(pan);pan.connect(this.master);pan.connect(this.room);}else{gain.connect(this.master);gain.connect(this.room);}this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();pan?.disconnect();};source.start(c.currentTime+delay);}
 tone(f,duration=.15,volume=.025,delay=0){if(!this.context||!this.enabled||this.voices.size>=20)return;const c=this.context,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.master);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration+.01);}
 play(kind,{impact=5,x=0}={}){if(!this.enabled)return;this.start();if(!this.context)return;
 if(['pin','pinfall','bounce','release'].includes(kind)){const now=this.context.currentTime,key=kind;const interval=kind==='pin'?.018:kind==='pinfall'?.035:.055;if(now-(this.hits.get(key)??-Infinity)<interval)return;this.hits.set(key,now);this.sample(kind==='release'?'bounce':kind,impact,x);return;}
 // Quiet score confirmation; the physical crash is driven by collisions, not a jingle.
 const notes=kind==='strike'?[659,880]:kind==='spare'?[659]:kind==='unlock'?[523,659,880]:kind==='stars'?[523,659]:[];notes.forEach((n,i)=>this.tone(n,.2,.024,i*.10));if(kind==='button')this.sample('pinfall',0,0);
 }
}
