export class Audio{
 constructor(){this.ctx=null;this.lastMusic=0;}
 unlock(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume();}
 tone(f,d=.1,type='sine',gain=.08){if(!this.ctx)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(t+d);}
 play(kind,on=true){if(!on)return;const specs={hit:[260,.08,'triangle'],wood:[180,.07,'triangle'],stone:[420,.06,'sine'],cup:[780,.3,'sine'],portal:[1100,.6,'sine'],cannon:[65,.7,'sawtooth'],reset:[170,.3,'sine'],loop:[540,.3,'sine'],jump:[440,.2,'sine']};const [f,d,t]=specs[kind]||[600,.2,'sine'];this.tone(f,d,t,kind==='cannon'?.06:.09);if(kind==='cup'){setTimeout(()=>this.tone(980,.35),120);setTimeout(()=>this.tone(1175,.5),240);}}
 music(now,world,on){if(!on||!this.ctx||now-this.lastMusic<.7)return;this.lastMusic=now;const notes=[261.6,329.6,392,523.2,440,392,329.6,293.7];this.tone(notes[Math.floor(now/.7)%8]*(world===4?.5:1),.65,'sine',.013);}
}
