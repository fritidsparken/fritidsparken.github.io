export class StudioAudio{
 constructor(muted){this.muted=muted;this.ctx=null;this.last=0;this.timer=null;}
 start(){if(this.muted)return;try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume();if(!this.timer){let i=0;this.timer=setInterval(()=>{if(!document.hidden&&!this.muted)this.tone([196,246.94,293.66,369.99,293.66,246.94][i++%6],1.8,.012);},1800);}}catch{}}
 tone(f=600,d=.12,v=.04){if(this.muted||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+d+.02);}
 stroke(){const now=performance.now();if(now-this.last>150){this.tone(180+Math.random()*40,.08,.008);this.last=now;}}
 toggle(){this.muted=!this.muted;if(this.muted)this.ctx?.suspend();else this.start();}
 pause(){this.ctx?.suspend();}resume(){if(!this.muted)this.ctx?.resume();}dispose(){clearInterval(this.timer);this.ctx?.close();}
}
