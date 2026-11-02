/* Sample-based engine mixer. Original recordings and modifications: LICENSES.md. */
const asset=name=>new URL('../assets/stunt-bike/audio/'+name,import.meta.url).href;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export class BikeAudio {
  constructor(context){
    this.ac=context;this.nodes=[];this.buffers={};this.layers={};this.rpm=0;this.previousGas=false;this.disposed=false;this.offset=0;this.musicStart=0;this.musicPlaying=false;this.pausing=null;
    this.master=context.createGain();this.master.gain.value=0;
    const limiter=context.createDynamicsCompressor();limiter.threshold.value=-9;limiter.knee.value=5;limiter.ratio.value=16;limiter.attack.value=.004;limiter.release.value=.18;
    this.master.connect(limiter);limiter.connect(context.destination);this.nodes.push(this.master,limiter);
    for(const channel of ['motor','music','effects']){this[channel]=context.createGain();this[channel].gain.value=0;this[channel].connect(this.master);this.nodes.push(this[channel]);}
  }
  async load(){
    const results=await Promise.allSettled(['idle','low','mid','high','overrun','metal-impact','raving-energy'].map(async name=>{
      const r=await fetch(asset(name+(name==='raving-energy'?'.mp3':'.wav')));if(!r.ok)throw Error(name+': HTTP '+r.status);
      const b=await this.ac.decodeAudioData(await r.arrayBuffer());if(this.disposed)return;this.buffers[name]=b;
      if(['idle','low','mid','high','overrun'].includes(name)){
        const source=this.ac.createBufferSource(),gain=this.ac.createGain();source.buffer=b;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(this.motor);source.start();this.layers[name]={source,gain};this.nodes.push(source,gain);
      }
    }));
    if(this.disposed)return;
    this.errors=results.filter(r=>r.status==='rejected').map(r=>r.reason.message);return this.errors;
  }
  mix(ride,keys,playing,muted,volumes,dt){
    if(this.disposed)return;const now=this.ac.currentTime,active=playing&&!muted;
    this.master.gain.setTargetAtTime(active?.8:0,now,.06);
    this.motor.gain.setTargetAtTime(volumes.motor,now,.045);this.effects.gain.setTargetAtTime(volumes.effects,now,.06);
    const speed=clamp(Math.abs(ride.vx)/23),air=ride.air>.12;
    const target=keys.gas?clamp(.19+speed*.67+(air?.19:0)):.02+speed*.58;
    this.rpm+=(target-this.rpm)*(1-Math.exp(-dt*(keys.gas?11:4)));
    const centers=[0,.27,.59,.91],names=['idle','low','mid','high'];
    let weights=centers.map(c=>Math.max(0,1-Math.abs(this.rpm-c)/.34)),norm=Math.sqrt(weights.reduce((a,w)=>a+w*w,0))||1;
    names.forEach((name,i)=>{const l=this.layers[name];if(!l)return;l.gain.gain.setTargetAtTime(weights[i]/norm*(keys.gas?1:.76),now,.055);l.source.playbackRate.setTargetAtTime(clamp(1+(this.rpm-centers[i])*.32,.92,1.08),now,.09);});
    this.layers.overrun?.gain.gain.setTargetAtTime(!keys.gas&&speed>.2?.23:0,now,.11);
    this.music.gain.setTargetAtTime(active&&volumes.musicOn?volumes.music*(keys.gas?.19:.25):0,now,.18);
    if(active&&volumes.musicOn&&this.buffers['raving-energy']){
      if(this.pausing){clearTimeout(this.pausing);this.pausing=null;}
      if(!this.musicPlaying)this.startMusic();
    }else if(this.musicPlaying&&!this.pausing){this.pausing=setTimeout(()=>{this.pausing=null;this.stopMusic();},220);}
    this.previousGas=!!keys.gas;
  }
  startMusic(){if(this.disposed||this.musicPlaying)return;const source=this.ac.createBufferSource();source.buffer=this.buffers['raving-energy'];source.loop=true;source.connect(this.music);source.start(0,this.offset%source.buffer.duration);this.musicSource=source;this.musicStart=this.ac.currentTime;this.musicPlaying=true;}
  stopMusic(){if(!this.musicPlaying)return;this.offset+=this.ac.currentTime-this.musicStart;this.musicSource.stop();this.musicSource.disconnect();this.musicSource=null;this.musicPlaying=false;}
  impact(strength=.4){if(this.disposed||!this.buffers['metal-impact'])return;const now=this.ac.currentTime,s=this.ac.createBufferSource(),g=this.ac.createGain();s.buffer=this.buffers['metal-impact'];g.gain.value=clamp(strength)*.65;s.connect(g);g.connect(this.effects);s.start();s.onended=()=>{s.disconnect();g.disconnect();};}
  dispose(){this.disposed=true;clearTimeout(this.pausing);this.stopMusic();for(const node of this.nodes){try{node.stop?.();}catch{}node.disconnect();}this.nodes=[];this.buffers={};}
}
