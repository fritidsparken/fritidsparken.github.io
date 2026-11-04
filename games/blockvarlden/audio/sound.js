// Original scores are expressed as scale steps. -1 leaves a beat of space.
const scores = {
  explore:  {root: 62, bpm: 77, scale: [0,2,4,7,9,12,14], lead: [0,-1,2,3,-1,2,1,-1,2,4,-1,3,1,-1,0,-1], bass: [0,-5,-3,-7]},
  forest:   {root: 67, bpm: 82, scale: [0,2,4,5,7,9,12], lead: [2,-1,3,4,2,1,-1,0,4,5,-1,4,3,1,0,-1], bass: [0,-3,-5,-7]},
  mountain: {root: 60, bpm: 68, scale: [0,2,5,7,9,12,14], lead: [0,3,-1,5,-1,4,3,-1,1,2,4,-1,3,1,-1,0], bass: [0,-5,2,-7]},
  cave:     {root: 54, bpm: 62, scale: [0,2,3,7,8,10,12], lead: [0,-1,-1,3,-1,2,-1,-1,1,-1,4,3,-1,1,-1,-1], bass: [0,-2,-5,-7]},
  night:    {root: 64, bpm: 65, scale: [0,2,3,5,7,10,12], lead: [4,-1,2,1,-1,0,-1,2,3,-1,5,-1,4,2,1,-1], bass: [0,-5,-4,-7]},
  creative: {root: 65, bpm: 86, scale: [0,2,4,7,9,11,12], lead: [0,2,3,-1,2,4,3,-1,1,2,4,6,3,-1,2,0], bass: [0,-3,-5,-7]}
};
const materials = {
  stone:[1900,.15], wood:[850,.105], sand:[3100,.18], grass:[2500,.095],
  glass:[5100,.16], metal:[3400,.17], snow:[1450,.21], earth:[850,.14], water:[660,.23]
};
function surfaceType(value) {
  const s=String(value || '').toLowerCase();
  if (/glass|glas|ice|isblock|kristall/.test(s)) return 'glass';
  if (/metal|metall|järn|iron|koppar/.test(s)) return 'metal';
  if (/wood|trä|bark|plank|timber|stock/.test(s)) return 'wood';
  if (/sand|gravel|grus/.test(s)) return 'sand';
  if (/leaf|leaves|löv|grass|gräs|plant|moss|växt/.test(s)) return 'grass';
  if (/snow|snö/.test(s)) return 'snow';
  if (/stone|rock|sten|mineral|brick|tegel|malm/.test(s)) return 'stone';
  if (/water|vatten/.test(s)) return 'water';
  return 'earth';
}
function themeOf(scene) {
  if(scene.underground || scene.underwater) return 'cave';
  if(scene.night) return 'night';
  if(scene.creative) return 'creative';
  const biome=String(scene.biome || '').toLowerCase();
  if(/berg|mountain|peak/.test(biome)) return 'mountain';
  if(/skog|forest|jungle|djungel/.test(biome)) return 'forest';
  return 'explore';
}
const hz = note => 440 * 2 ** ((note-69)/12);
const clamp = value => Math.max(0,Math.min(1,Number(value)||0));
export function createAudio() {
  let context, master, noiseBuffer, clock, running=false, disposed=false;
  let step=0, nextBeat=0, atmosphereAt=0, environment={}, theme='explore';
  const levels={music:.40,effects:.72,ambience:.38}, buses={};
  function tone(bus,time,freq,duration,gain,wave='sine',end=freq,attack=.015) {
    const osc=context.createOscillator(),env=context.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(freq,time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1,end),time+duration);
    env.gain.setValueAtTime(.0001,time);
    env.gain.exponentialRampToValueAtTime(gain,time+Math.min(attack,duration*.35));
    env.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(env);env.connect(bus);osc.start(time);osc.stop(time+duration+.01);
    osc.onended=()=>{osc.disconnect();env.disconnect();};
  }
  function noise(bus,time,duration,gain,cutoff,shape='lowpass',attack=.012) {
    const src=context.createBufferSource(),filter=context.createBiquadFilter(),env=context.createGain();
    src.buffer=noiseBuffer;src.loop=true;filter.type=shape;filter.frequency.value=cutoff;
    filter.Q.value=.6;env.gain.setValueAtTime(.0001,time);
    env.gain.exponentialRampToValueAtTime(gain,time+Math.min(attack,duration*.4));
    env.gain.exponentialRampToValueAtTime(.0001,time+duration);
    src.connect(filter);filter.connect(env);env.connect(bus);
    src.start(time,Math.random()*(noiseBuffer.duration-.01));src.stop(time+duration+.01);
    src.onended=()=>{src.disconnect();filter.disconnect();env.disconnect();};
  }
  function scoreBeat(time){
    const s=scores[theme],beat=60/s.bpm*.65,index=step%16,phrase=Math.floor(step/16)%4;
    const degree=s.lead[index];
    if(degree>=0){
      // Alternate the last phrase's cadence and double a few notes with a quiet overtone.
      const pitch=hz(s.root+s.scale[phrase===3 && index===14 ? 0 : degree]);
      tone(buses.music,time,pitch,beat*1.9,.125,theme==='cave'?'sine':'triangle');
      if(index%4===0) tone(buses.music,time+.008,pitch*2,beat*.85,.025);
    }
    if(index%4===0){
      const bass=hz(s.root-12+s.bass[(Math.floor(index/4)+phrase)%4]);
      tone(buses.music,time,bass,beat*3.8,.125,'sine',bass,.10);
      tone(buses.music,time+.09,bass*1.5,beat*2.7,.043,'triangle',bass*1.5,.14);
    }
    step++;return beat;
  }
  function ambience(time){
    const weather=String(environment.weather || '').toLowerCase();
    const rainy=/rain|regn|åska|storm|thunder/.test(weather);
    const bus=buses.ambience;
    noise(bus,time,2.1,rainy?.23:.10,environment.underwater?320:rainy?4200:740,'lowpass',.65);
    if(rainy && /åska|storm|thunder/.test(weather) && Math.random()<.19) noise(bus,time+.3,1.65,.65,160,'lowpass',.15);
    if(!rainy && !environment.underground && !environment.underwater && !environment.night && Math.random()<.30){
      const f=1600+Math.random()*550;
      tone(bus,time+.2,f,.135,.065,'sine',f*1.34);tone(bus,time+.40,f*1.14,.19,.048,'sine',f*.95);
    }
    if(environment.underwater || /hav|ocean|strand|beach|träsk|swamp/.test(String(environment.biome).toLowerCase())){
      noise(bus,time+.25,1.35,.2,850,'bandpass',.35);
    }
  }
  function tick(){
    if(!running || context.state!=='running')return;
    const now=context.currentTime;
    nextBeat=Math.max(nextBeat,now+.012);
    while(nextBeat<now+.17) nextBeat+=scoreBeat(nextBeat);
    if(atmosphereAt<now+.12){ambience(now+.04);atmosphereAt=now+1.78;}
  }
  function start(){
    if(disposed)return;
    try{
      if(!context){
        const Ctor=globalThis.AudioContext || globalThis.webkitAudioContext;
        if(!Ctor)return;
        context=new Ctor();master=context.createGain();master.gain.value=.67;master.connect(context.destination);
        for(const key of Object.keys(levels)){
          const bus=context.createGain();bus.gain.value=levels[key];bus.connect(master);buses[key]=bus;
        }
        noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
        const data=noiseBuffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      }
      running=true;
      if(context.state!=='running') context.resume().catch(()=>{});
      if(!clock)clock=setInterval(tick,90);
      tick();
    }catch{/* Browsers without an audio output can still play the world. */}
  }
  function effect(name,material){
    if(!running || !context || context.state!=='running')return;
    const t=context.currentTime+.006,b=buses.effects,surface=surfaceType(material);
    const [cut,duration]=materials[surface],jitter=.86+Math.random()*.24;
    switch(name){
      case 'step': case 'dig': case 'place': case 'break': case 'tool':{
        const soft=name==='step',accent=name==='break'?1.5:1;
        noise(b,t,duration*accent,soft?.20:.40,cut*jitter,'lowpass');
        const thump=(surface==='wood'?210:surface==='stone'?145:105)*jitter;
        tone(b,t,thump,soft?.065:.115,soft?.10:.19,'sine',thump*.54);
        if(surface==='glass'||surface==='metal')tone(b,t,cut*.43*jitter,.17,.077,'sine',cut*.39*jitter);
        if(name==='break')noise(b,t+.06,.15,.19,cut*1.21,'highpass');
        break;}
      case 'craft': [0,4,7].forEach((v,i)=>tone(b,t+i*.068,hz(67+v),.20,.14,'triangle'));break;
      case 'inventory':tone(b,t,610,.08,.10,'sine',820);break;
      case 'splash':case 'water':noise(b,t,.48,.37,1600,'bandpass');tone(b,t+.10,420,.14,.13,'sine',180);break;
      case 'fire':noise(b,t,.07,.24,2800,'highpass');break;
      case 'animal':tone(b,t,240,.25,.12,'triangle',176);tone(b,t+.22,185,.16,.06,'triangle',162);break;
      case 'eat':noise(b,t,.13,.22,1750,'bandpass');noise(b,t+.15,.10,.18,1250,'bandpass');break;
      case 'hurt':tone(b,t,215,.21,.15,'triangle',105);break;
      case 'jump':tone(b,t,125,.11,.07,'sine',210);break;
    }
  }
  function volume(channel,value){
    if(!Object.hasOwn(levels,channel))return;
    levels[channel]=clamp(value);
    if(buses[channel])buses[channel].gain.setTargetAtTime(levels[channel],context.currentTime,.035);
  }
  function setScene(scene){
    Object.assign(environment,scene);
    const next=themeOf(environment);
    if(theme!==next){theme=next;step=0;}
  }
  function pause(){
    running=false;clearInterval(clock);clock=null;
    if(context && context.state==='running')context.suspend().catch(()=>{});
  }
  function dispose(){disposed=true;pause();if(context && context.state!=='closed')context.close().catch(()=>{});}
  return {start,pause,dispose,setScene,effect,volume};
}
