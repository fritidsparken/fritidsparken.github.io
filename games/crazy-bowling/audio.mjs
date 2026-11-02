const ROOT=new URL('./assets/audio/',import.meta.url);
// Real CC0 bowling recordings. No synthesized pin impacts or MIDI soundtrack.
export class Audio {
 constructor(enabled=true){this._enabled=enabled;this.context=null;this.voices=new Set();this.hits=new Map();this.samples={};this.musicEnabled=true;this.paused=false;try{this.musicEnabled=localStorage.getItem('crazy-bowling-music')!=='off';}catch{} }
 get enabled(){return this._enabled;}
 set enabled(value){this._enabled=!!value;if(!value)this.silenceEffects();if(this.master)this.master.gain.setTargetAtTime(value?.8:0,this.context.currentTime,.02);}
 async preload(){if(!this.downloads)this.downloads=Promise.all(['pin','drop','roll','rack'].map(async name=>{try{const r=await fetch(new URL(name+'.mp3',ROOT));if(!r.ok)throw Error(r.status);return [name,await r.arrayBuffer()];}catch{return [name,null];}}));return this.downloads;}
 start(){this.paused=false;try{
 if(!this.context){const c=this.context=new(window.AudioContext||window.webkitAudioContext)();this.master=c.createGain();this.master.gain.value=this.enabled?.8:0;const limiter=c.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=6;this.master.connect(limiter).connect(c.destination);
 this.preload().then(async entries=>{for(const [name,bytes] of entries){if(bytes)try{this.samples[name]=await c.decodeAudioData(bytes);}catch{}}if(this.samples.roll){this.roll=c.createBufferSource();this.roll.buffer=this.samples.roll;this.roll.loop=true;this.rollGain=c.createGain();this.rollGain.gain.value=0;this.roll.connect(this.rollGain).connect(this.master);this.roll.start();}});
 this.music=new window.Audio(new URL('funk-game-loop.mp3',ROOT).href);this.music.loop=true;this.music.preload='none';this.music.volume=.22;
 }if(this.context.state==='suspended')this.context.resume().catch(()=>{});this.resumeMusic();
 }catch{/* Unsupported audio must never prevent a throw. */}}
 resumeMusic(){if(this.musicEnabled&&!this.paused&&!document.hidden&&this.music?.paused)this.music.play().catch(()=>{});}
 toggleMusic(){this.musicEnabled=!this.musicEnabled;try{localStorage.setItem('crazy-bowling-music',this.musicEnabled?'on':'off');}catch{}if(!this.musicEnabled)this.music?.pause();else this.start();}
 rolling(speed){if(!this.rollGain)return;const s=Math.max(0,Math.min(30,Number(speed)||0));this.rollGain.gain.setTargetAtTime(this.enabled&&!this.paused?Math.min(.55,s*.018):0,this.context.currentTime,.08);this.roll.playbackRate.setTargetAtTime(.85+s*.012,this.context.currentTime,.12);if(this.music)this.music.volume=s>1?.13:.22;}
 silenceEffects(){this.rolling(0);for(const source of this.voices){try{source.stop();}catch{}}this.voices.clear();}
 silence(){this.paused=true;this.silenceEffects();this.music?.pause();}
 sample(kind,impact,x=0){const c=this.context;if(!c||!this.samples[kind]||this.voices.size>=10)return;const s=c.createBufferSource(),g=c.createGain(),p=c.createStereoPanner();s.buffer=this.samples[kind];s.playbackRate.value=.96+Math.random()*.08;g.gain.value=Math.min(.8,.12+Math.sqrt(Math.max(0,impact))*.13);p.pan.value=Math.max(-.65,Math.min(.65,x/7));s.connect(g).connect(p).connect(this.master);this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();p.disconnect();};s.start();}
 play(kind,{impact=5,x=0}={}){this.start();if(!this.enabled||!this.context)return;const sample=kind==='pin'?'pin':['pinfall','bounce','release'].includes(kind)?'drop':kind==='rack'?'rack':null;if(!sample)return;const now=this.context.currentTime,interval=sample==='pin'?.12:sample==='rack'?2:.10;if(now-(this.hits.get(sample)??-Infinity)<interval)return;this.hits.set(sample,now);this.sample(sample,impact,x);}
}
