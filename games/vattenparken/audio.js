(function(root){'use strict';
class AudioEngine{
 constructor(){this.context=null;this.effects=true;this.music=true;this.note=0;this.beat=0;this.running=false;this.nodes=[];}
 unlock(){try{if(!this.context){const A=root.AudioContext||root.webkitAudioContext;if(!A)return;this.context=new A();this.master=this.context.createGain();this.master.gain.value=.55;this.master.connect(this.context.destination);const b=this.context.createBuffer(1,this.context.sampleRate*2,this.context.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.4;this.noiseBuffer=b;}if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch(e){}}
 tone(freq,duration=.2,volume=.08,type='sine',delay=0){const c=this.context;if(!c||c.state!=='running')return;const o=c.createOscillator(),g=c.createGain(),now=c.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.02);o.onended=()=>{o.disconnect();g.disconnect()};}
 noise(duration,volume,pitch=700){const c=this.context;if(!c||!this.noiseBuffer)return;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=pitch;s.connect(f);f.connect(g);g.connect(this.master);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);s.start();s.stop(c.currentTime+duration);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect()};}
 play(name){if(!this.effects)return;this.unlock();if(name==='star'){this.tone(880,.14,.08);this.tone(1320,.24,.055,'sine',.065)}else if(name==='boost'){this.noise(.65,.2,1700);this.tone(220,.24,.04,'triangle');this.tone(440,.3,.04,'triangle',.12)}else if(name==='splash'){this.noise(.9,.28,1100)}else if(name==='bump'){this.tone(140,.18,.06,'triangle');this.noise(.18,.07,400)}else if(name==='win'){[523,659,784,1046].forEach((f,i)=>this.tone(f,.5,.065,'sine',i*.14))}else if(name==='count'){this.tone(660,.12,.05)}else if(name==='secret'){[660,880,1174].forEach((f,i)=>this.tone(f,.4,.05,'triangle',i*.12))}}
 update(dt,active,speed=0){if(!active||!this.context||this.context.state!=='running')return;this.beat-=dt;if(this.beat>0)return;this.beat=.43;
  if(this.music){const melody=[523,0,659,784,0,659,587,0,523,659,0,880,784,0,659,0,440,0,523,659,0,523,587,0,392,0,494,587,0,494,523,0];const f=melody[this.note%melody.length];if(f)this.tone(f,.35,.025,'sine');if(this.note%4===0)this.tone([130.81,146.83,110,98][Math.floor(this.note/8)%4],.5,.022,'triangle');this.note++;}
  if(this.effects&&speed>1)this.noise(.45,.009+speed*.00025,400+speed*15);
 }
 suspend(){this.context?.suspend().catch(()=>{});}
 dispose(){this.context?.close().catch(()=>{});}
}
root.WaterparkAudio=AudioEngine;
})(window);
