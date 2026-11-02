/** Local recorded audio. Provenance and redistribution licences: assets/audio/CREDITS.md. */
const file=name=>new URL(`./assets/audio/${name}.mp3`,import.meta.url).href;
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(+x)?+x:0));
// Each hole has its own mix [birds, wind, flowing water, waves, crickets].
export const soundscapes=[
 [.18,.07,0,0,0],[.24,.05,.02,0,0],[.12,.05,.16,0,0],
 [.17,.10,.14,0,0],[.09,.10,0,0,.035],[.18,.04,.24,0,0],
 [.07,.13,0,.20,0],[.14,.04,.18,0,0],[.06,.19,.04,0,0],
 [.02,.13,.13,0,.02],[.025,.06,.03,0,.15],[.06,.16,.08,0,0],
 [.11,.045,.16,.04,0],[.05,.07,.06,0,.10],[.05,.12,.02,.18,0],
 [.10,.17,.015,0,0],[0,.08,.02,0,.17],[.15,.06,.18,.025,0]
];
export class Audio{
 constructor(){
  this.ctx=null;this.buffers={};this.loading=null;this.effectsVolume=.7;this.musicVolume=.16;
  this.lastEvents={};this.ambience=[];this.musicFade=0;this.musicSlot=0;this.crossfade=null;this.lastClock=null;
  this.tracks=[];this.nextPutt=0;this.effectEnabled=true;this.musicEnabled=false;
 }
 unlock(){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(!this.ctx){
   this.ctx=new AC();this.fx=this.ctx.createGain();this.fx.gain.value=this.effectsVolume;this.fx.connect(this.ctx.destination);
   this.ambientBus=this.ctx.createGain();this.ambientBus.gain.value=0;this.ambientBus.connect(this.fx);
   this.rollGain=this.ctx.createGain();this.rollGain.gain.value=0;this.rollGain.connect(this.fx);
   // Continuous low-level friction is synthesized; impact and outdoor sounds are recordings.
   const noise=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),data=noise.getChannelData(0);let last=0;
   for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.08)/1.08;data[i]=last;}
   this.roll=this.ctx.createBufferSource();this.roll.buffer=noise;this.roll.loop=true;
   this.rollFilter=this.ctx.createBiquadFilter();this.rollFilter.type='lowpass';this.rollFilter.frequency.value=700;
   this.roll.connect(this.rollFilter);this.rollFilter.connect(this.rollGain);this.roll.start();
   this.tracks=[0,1].map(()=>{const a=new window.Audio(file('carefree'));a.preload='auto';a.volume=0;return a;});
   this.loading=this.load();
   document.addEventListener('visibilitychange',()=>{if(document.hidden)this.suspend();});
   window.addEventListener('pagehide',()=>this.suspend());
  }
  this.ctx.resume().catch(()=>{});
  // Invoke play within the gesture. Subsequent music() calls control actual gain.
  if(this.tracks[this.musicSlot].paused&&!document.hidden)this.tracks[this.musicSlot].play().catch(()=>{});
 }
 async load(){
  const names=['putt-1','putt-2','putt-3','putt-4','impact-1','impact-2','impact-3','cup','birds','wind','river','waves','crickets'];
  await Promise.all(names.map(async name=>{try{const r=await fetch(file(name));if(!r.ok)throw Error(r.status);this.buffers[name]=await this.ctx.decodeAudioData(await r.arrayBuffer());}catch(e){console.warn(`Minigolf audio unavailable: ${name}`,e);}}));
  for(const name of ['birds','wind','river','waves','crickets']){
   if(!this.buffers[name]){this.ambience.push(null);continue;}
   const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers[name];source.loop=true;gain.gain.value=0;
   source.connect(gain);gain.connect(this.ambientBus);source.start(0,Math.random()*source.buffer.duration);this.ambience.push({source,gain});
  }
 }
 setVolumes(effects=.7,music=.16){this.effectsVolume=clamp(effects);this.musicVolume=clamp(music);if(this.fx)this.fx.gain.setTargetAtTime(this.effectsVolume,this.ctx.currentTime,.06);}
 sample(name,gain=.5,rate=1,cutoff=12000,delay=0){
  if(!this.ctx||this.ctx.state!=='running'||!this.buffers[name])return;
  const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),amp=this.ctx.createGain();source.buffer=this.buffers[name];source.playbackRate.value=rate;
  filter.type='lowpass';filter.frequency.value=cutoff;amp.gain.value=gain;source.connect(filter);filter.connect(amp);amp.connect(this.fx);
  source.onended=()=>{source.disconnect();filter.disconnect();amp.disconnect();};source.start(this.ctx.currentTime+delay);
 }
 play(kind,on=true,strength=.5){
  if(!on||!this.ctx||document.hidden)return;const t=this.ctx.currentTime;
  if(t-(this.lastEvents[kind]??-10)<.065)return;this.lastEvents[kind]=t;const force=clamp(strength),jitter=.97+Math.random()*.06;
  if(kind==='hit'){this.sample(`putt-${this.nextPutt++%4+1}`,.24+force*.52,jitter*(.91+force*.13),2500+force*8500);return;}
  if(kind==='cup'){this.sample('cup',.38,.83,6500);this.chime(659,.15,.025,.25);this.chime(880,.35,.018,.42);return;}
  if(['stone','wood','metal','obstacle','stop'].includes(kind)){
   const wood=kind==='wood',stop=kind==='stop';this.sample(`impact-${1+Math.floor(Math.random()*3)}`,stop?.035:.15+force*.28,jitter*(wood?.72:1),wood?1900:7500);
   if(kind==='metal')this.chime(1250,.12,.012);return;
  }
  if(kind==='cannon')this.sample('impact-1',.32,.42,900);
  if(kind==='portal')this.chime(520,.25,.014);
  if(kind==='loop'||kind==='jump')this.sample('impact-2',.08,.7,2400);
 }
 chime(f,d,gain,delay=0){if(!this.ctx)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.fx);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+d);}
 update(speed,courseId,on=true){
  if(!this.ctx)return;this.effectEnabled=on&&!document.hidden;const t=this.ctx.currentTime,mix=soundscapes[courseId]||soundscapes[0];
  this.ambientBus.gain.setTargetAtTime(this.effectEnabled?1:0,t,.3);
  for(let i=0;i<this.ambience.length;i++)this.ambience[i]?.gain.gain.setTargetAtTime(mix[i],t,1.2);
  this.rollGain.gain.setTargetAtTime(this.effectEnabled?Math.min(.22,Math.max(0,speed)*.018):0,t,.075);
  this.rollFilter.frequency.setTargetAtTime(350+Math.min(16,Math.max(0,speed))*90,t,.1);
  this.roll.playbackRate.setTargetAtTime(.6+Math.min(16,Math.max(0,speed))*.06,t,.1);
 }
 music(now,world,on){
  if(!this.ctx||!this.tracks.length)return;
  const dt=this.lastClock===null?0:Math.max(0,Math.min(.1,now-this.lastClock));this.lastClock=now;
  this.musicEnabled=!!on&&!document.hidden;const target=this.musicEnabled?1:0;this.musicFade+=(target-this.musicFade)*(1-Math.exp(-dt*5));
  let a=this.tracks[this.musicSlot],b=this.tracks[1-this.musicSlot];
  if(this.musicEnabled){
   if(a.paused)a.play().catch(()=>{});if(this.crossfade&&b.paused)b.play().catch(()=>{});
   const remaining=a.duration-a.currentTime;
   if(!this.crossfade&&Number.isFinite(remaining)&&remaining<5){b.currentTime=0;b.volume=0;b.play().catch(()=>{});this.crossfade={elapsed:0};}
   if(this.crossfade){this.crossfade.elapsed+=dt;const u=Math.min(1,this.crossfade.elapsed/5);a.volume=this.musicVolume*this.musicFade*(1-u);b.volume=this.musicVolume*this.musicFade*u;if(u===1||a.ended){a.pause();a.currentTime=0;this.musicSlot=1-this.musicSlot;this.crossfade=null;}}
   else a.volume=this.musicVolume*this.musicFade;
  }else{
   for(const track of this.tracks)track.volume*=Math.exp(-dt*5);
   if(this.musicFade<.003){this.tracks.forEach(track=>track.pause());this.musicFade=0;}
  }
 }
 suspend(){this.tracks.forEach(a=>{a.pause();a.volume=0;});if(this.ctx){this.ambientBus.gain.value=0;this.rollGain.gain.value=0;this.ctx.suspend().catch(()=>{});}this.musicFade=0;}
}
