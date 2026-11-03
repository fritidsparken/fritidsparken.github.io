(function(root){'use strict';
class AudioEngine{
 constructor(){this.context=null;this.effects=true;this.music=true;this.soundLevel=.30;this.musicLevel=.72;this.note=0;this.beat=0;this.running=false;this.nodes=[];this.loops=[];
  if(typeof Audio!=='undefined'){
    for(const [file,volume] of [['carefree',.43],['waves',.055],['wind',.022],['birds',.027],['river',.06]]){
      const el=new Audio('../minigolf/assets/audio/'+file+'.mp3');el.loop=true;el.preload='none';el.volume=volume;
      this.loops.push({el,file,volume,pending:false});
    }
  }}
 unlock(){try{if(!this.context){const A=root.AudioContext||root.webkitAudioContext;if(!A)return;this.context=new A();this.master=this.context.createGain();this.master.gain.value=.19;this.master.connect(this.context.destination);const b=this.context.createBuffer(1,this.context.sampleRate*2,this.context.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.4;this.noiseBuffer=b;
  for(const loop of this.loops){
    const source=this.context.createMediaElementSource(loop.el),gain=this.context.createGain();
    if(loop.file==='river'&&this.context.createStereoPanner){loop.pan=this.context.createStereoPanner();source.connect(loop.pan);loop.pan.connect(gain);}
    else source.connect(gain);
    gain.connect(this.context.destination);gain.gain.value=0;loop.gain=gain;loop.el.volume=1;
  }}if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch(e){}}
 tone(freq,duration=.2,volume=.08,type='sine',delay=0){const c=this.context;if(!c||c.state!=='running')return;const o=c.createOscillator(),g=c.createGain(),now=c.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.02);o.onended=()=>{o.disconnect();g.disconnect()};}
 noise(duration,volume,pitch=700){const c=this.context;if(!c||!this.noiseBuffer)return;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=pitch;s.connect(f);f.connect(g);g.connect(this.master);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);s.start();s.stop(c.currentTime+duration);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect()};}
 play(name){if(!this.effects)return;this.unlock();if(name==='star'){this.tone(880,.14,.08);this.tone(1320,.24,.055,'sine',.065)}else if(name==='boost'){this.noise(.65,.2,1700);this.tone(220,.24,.04,'triangle');this.tone(440,.3,.04,'triangle',.12)}else if(name==='splash'){this.noise(.9,.28,1100)}else if(name==='bump'){this.tone(140,.18,.06,'triangle');this.noise(.18,.07,400)}else if(name==='win'){[523,659,784,1046].forEach((f,i)=>this.tone(f,.5,.065,'sine',i*.14))}else if(name==='count'){this.tone(660,.12,.05)}else if(name==='secret'){[660,880,1174].forEach((f,i)=>this.tone(f,.4,.05,'triangle',i*.12))}}
 update(dt,active,speed=0,position={x:0,z:0},heading=0){
  for(const loop of this.loops){
    const music=loop.file==='carefree',on=active&&(music?this.music:this.effects);
    const distance=loop.file==='river'?Math.hypot(position.x+143,position.z-37):loop.file==='waves'?Math.abs(position.z-111):0;
    const level=loop.volume*(music?this.musicLevel/.72:this.soundLevel/.30)/(1+distance*.027);
    if(loop.gain){loop.gain.gain.setTargetAtTime(level,this.context.currentTime,.15);
      if(loop.pan){const dx=-143-position.x,dz=37-position.z;loop.pan.pan.setTargetAtTime((dx*Math.cos(heading)+dz*Math.sin(heading))/(distance+1),this.context.currentTime,.18);}}
    else loop.el.volume=Math.min(1,level);
    if(on&&loop.el.paused&&!loop.pending){loop.pending=true;loop.el.play().catch(()=>{}).finally(()=>loop.pending=false);}
    if(!on&&!loop.el.paused)loop.el.pause();
  }
  if(!active||!this.context||this.context.state!=='running')return;this.master.gain.value=.19*this.soundLevel/.30;this.beat-=dt;if(this.beat>0)return;this.beat=.43;
  if(this.music&&!this.loops.length){const melody=[523,0,659,784,0,659,587,0,523,659,0,880,784,0,659,0,440,0,523,659,0,523,587,0,392,0,494,587,0,494,523,0];const f=melody[this.note%melody.length];if(f)this.tone(f,.35,.025,'sine');if(this.note%4===0)this.tone([130.81,146.83,110,98][Math.floor(this.note/8)%4],.5,.022,'triangle');this.note++;}
  if(this.effects&&speed>1)this.noise(.45,.009+speed*.00025,400+speed*15);
 }
 suspend(){this.loops.forEach(x=>x.el.pause());this.context?.suspend().catch(()=>{});}
 dispose(){this.loops.forEach(x=>{x.el.pause();x.el.removeAttribute('src');x.el.load()});this.context?.close().catch(()=>{});}
}
root.WaterparkAudio=AudioEngine;
})(window);
