const local = path => new URL(path, import.meta.url).href;
const samples = {
  music: local('../../assets/stunt-bike/audio/raving-energy.mp3'),
  strike: local('./sound/kick.mp3'),
  catch: local('./sound/catch.mp3'),
  bounce: local('./sound/bounce.mp3'),
  step: local('./sound/step.wav'),
  metal: local('../../assets/stunt-bike/audio/metal-impact.wav'),
  wind: local('../minigolf/assets/audio/wind.mp3'),
  crowd: local('./sound/crowd.mp3'),
  applause: local('./sound/applause.mp3'),
  goal: local('./sound/goal.mp3'),
  miss: local('./sound/aww.mp3'),
  whistle: local('./sound/whistle.mp3')
};
const defaults = {music:65, effects:35, crowd:20, musicOn:true};
const settings = {...defaults};
const key = 'fp-strafflaggaren-mix-v1';
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
try {
  const stored = JSON.parse(localStorage.getItem(key) || '{}');
  for (const k of ['music','effects','crowd']) if (Number.isFinite(stored[k])) settings[k] = clamp(stored[k],0,100);
  settings.musicOn = stored.musicOn !== false;
} catch {}
let ctx, master, buses, enabled = true, paused = false, initialized = false;
const buffers = new Map();
const requests = new Map();
const loops = new Map();

function load(name) {
  if (!requests.has(name)) {
    const task = fetch(samples[name]).then(async r => {
      if (!r.ok) throw Error(r.status);
      const buf = await ctx.decodeAudioData(await r.arrayBuffer());
      buffers.set(name,buf);
      return buf;
    }).catch(() => { requests.delete(name); return null; });
    requests.set(name,task);
  }
  return requests.get(name);
}

function mix() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(enabled && !paused && !document.hidden ? .82 : 0,t,.025);
  for (const name of ['music','effects','crowd']) {
    const volume = name==='music' && !settings.musicOn ? 0 : settings[name]/100;
    buses[name].gain.setTargetAtTime(volume,t,.035);
  }
}

function sample(name, channel, {gain=1, rate=1, pan=0, cutoff=14000, length, offset=0, delay=0, loop=false}={}) {
  const buf = buffers.get(name);
  if (!buf || !ctx || paused || !enabled || document.hidden) return;
  const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), volume = ctx.createGain();
  src.buffer=buf;
  src.playbackRate.value=rate;
  src.loop=loop;
  if(loop && name==='crowd'){src.loopStart=.1;src.loopEnd=buf.duration-.1;}
  filter.type='lowpass';
  filter.frequency.value=Math.min(cutoff,ctx.sampleRate*.48);
  const start=ctx.currentTime+delay;
  volume.gain.setValueAtTime(gain,start);
  src.connect(filter).connect(volume);
  let end=volume, panner;
  if (ctx.createStereoPanner) {
    panner=ctx.createStereoPanner(); panner.pan.value=clamp(pan,-1,1);
    end.connect(panner); end=panner;
  }
  end.connect(buses[channel]);
  src.onended=()=>{src.disconnect();filter.disconnect();volume.disconnect();panner?.disconnect();};
  src.start(start,Math.min(offset,buf.duration-.01));
  if (length) {
    volume.gain.setTargetAtTime(0,start+length,Math.min(.05,length/5));
    src.stop(start+length+.18);
  }
  return src;
}

function startLoops() {
  if (!enabled || paused || document.hidden) return;
  for (const [name,channel,params] of [
    ['music','music',{gain:.84}],
    ['wind','crowd',{gain:.14,cutoff:2600}],
    ['crowd','crowd',{gain:.65,cutoff:4400}]
  ]) {
    if (!loops.has(name) && buffers.has(name)) {
      const source=sample(name,channel,{...params,loop:true});
      if(source) loops.set(name,source);
    }
  }
}

function activate() {
  if (!enabled || paused || document.hidden) return;
  if (!ctx) {
    const Context=window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {ctx=new Context();} catch {return;}
    master=ctx.createGain();
    const limiter=ctx.createDynamicsCompressor();
    limiter.threshold.value=-10; limiter.ratio.value=6;
    master.connect(limiter).connect(ctx.destination);
    buses={};
    for(const k of ['music','crowd','effects']) {buses[k]=ctx.createGain();buses[k].connect(master);}
    mix();
  }
  if(ctx.state!=='running') ctx.resume().catch(()=>{});
  if (!initialized) {
    initialized=true;
    for (const name of Object.keys(samples)) load(name).then(startLoops);
  } else {
    for(const k of Object.keys(samples)) if (!requests.has(k)) load(k).then(startLoops);
    startLoops();
  }
}

function duck() {
  const g=buses.music.gain, t=ctx.currentTime, full=settings.musicOn ? settings.music/100 : 0;
  g.cancelScheduledValues(t);g.setTargetAtTime(full*.67,t,.045);g.setTargetAtTime(full,t+.65,.3);
}

function play(kind,strength=1,pan=0) {
  if(!enabled || paused || document.hidden) return;
  // Create/resume only inside a real gesture; visual-only startup stays silent.
  if(!ctx) return;
  const level=clamp(Number.isFinite(strength)?strength:1,.08,1.5), variance=.95+Math.random()*.10;
  const effect=(name,params={})=>sample(name,'effects',{pan,...params});
  const reaction=(name,gain,rate,cutoff,length,delay=0)=>sample(name,'crowd',{gain,rate,cutoff,length,delay});
  if(kind==='kick' || kind==='bounce' || kind==='save' || kind==='land' || kind==='step') {
    const shape={
      kick:[1.3,.96,5000,.45], bounce:[.80,.71,970,.21], save:[.99,.8,1650,.22],
      land:[.86,.69,1250,.36], step:[.73,.96,3900,.24]
    }[kind];
    const recording={step:'step',land:'step',kick:'strike',save:'catch',bounce:'bounce'}[kind];
    effect(recording,{gain:shape[0]*level,rate:shape[1]*variance,cutoff:shape[2]+level*800,length:shape[3]});
    if(kind==='save') duck();
    return;
  }
  if(kind==='applause') {
    reaction('applause',1.9,1.01,5100,1.9);duck();
  } else if(kind==='post'||kind==='bar') {
    effect('metal',{gain:1.1*level,rate:kind==='bar'?1.38:.95,cutoff:6500,length:.8});
    duck();
  } else if(kind==='net') {
    for(let i=0;i<3;i++) effect('wind',{gain:.9*level/(i+1),rate:1.7,cutoff:3700,offset:.4+i*.35,length:.06+i*.02,delay:i*.047});
  } else if(kind==='whistle') {
    effect('whistle',{gain:.46,rate:variance,cutoff:7500,length:.47});
  } else if(kind==='goal'||kind==='win'||kind==='miss') {
    const miss=kind==='miss',length=miss?.85:kind==='win'?2.9:2.2;
    reaction(miss?'miss':'goal',miss?.98:1.55,variance,miss?3700:6900,length);
    duck();
  }
}

function pause(value) {
  paused=Boolean(value);
  mix();
  if(!ctx) return;
  if(paused || document.hidden || !enabled) ctx.suspend().catch(()=>{});
  else activate();
}
function setEnabled(value) {
  enabled=Boolean(value);
  mix();
  if(!enabled && ctx) ctx.suspend().catch(()=>{});
  else if(enabled && !paused && (ctx || navigator.userActivation?.isActive)) activate();
}
function controls() {
  const labels={music:'Musik',effects:'Ljudeffekter',crowd:'Publik'};
  const rows=Object.entries(labels).map(([k,label])=>`<label style="display:grid;grid-template-columns:minmax(6rem,1fr) 2fr 3rem;align-items:center;gap:.5rem">${label}<input aria-label="${label}" type="range" data-straff-mix="${k}" min="0" max="100" value="${settings[k]}"><output>${settings[k]} %</output></label>`).join('');
  return `<details class="arena-mix" style="margin:12px 0;padding:9px 12px;border:1px solid #ffffff36;border-radius:12px"><summary style="cursor:pointer">Ljudinställningar</summary>${rows}<label><input type="checkbox" data-straff-music ${settings.musicOn?'checked':''}> Bakgrundsmusik på</label><small style="display:block;line-height:1.5">”Raving Energy” av Kevin MacLeod (incompetech.com), bearbetad loop, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. <a href="sound/credits.html" target="_blank" rel="noopener">Alla ljudkällor och licenser</a>.</small></details>`;
}
function saveSettings() {
  try {localStorage.setItem(key,JSON.stringify(settings));} catch {}
  if (ctx) buses.music.gain.cancelScheduledValues(ctx.currentTime);
  mix();
}
if(typeof document!=='undefined') {
  document.addEventListener('input',e=>{
    const el=e.target, k=el.dataset?.straffMix;
    if(Object.hasOwn(defaults,k) && k!=='musicOn') {
      settings[k]=clamp(Number(el.value),0,100);
      el.nextElementSibling.textContent=settings[k]+' %';saveSettings();
    } else if(el.hasAttribute?.('data-straff-music')) {settings.musicOn=el.checked;saveSettings();}
  });
  document.addEventListener('pointerdown',activate,{capture:true,passive:true});
  // Touch browsers may only grant activation on release or the resulting click.
  document.addEventListener('click',()=>{if(ctx?.state!=='running') activate();},{capture:true});
  document.addEventListener('keydown',activate,{capture:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) {mix();ctx?.suspend().catch(()=>{});}
    else if(ctx && !paused) {mix();activate();}
  });
}
export const arenaAudio={play,unlock:activate,setEnabled,pause,controls};
