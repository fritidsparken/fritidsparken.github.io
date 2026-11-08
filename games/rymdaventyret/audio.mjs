export class SpaceAudio {
  constructor() {
    this.ctx = null;
    this.settings = { music: 0.25, sound: 0.4 };
    this.timer = 0;
    this.step = 0;
  }
  start() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.engine = this.ctx.createOscillator();
    this.engine.type = "sawtooth";
    this.engine.frequency.value = 35;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 130;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    this.engine.connect(this.filter).connect(this.gain).connect(this.master);
    this.engine.start();
  }
  set(settings) {
    this.settings = settings;
  }
  tone(freq, duration = 0.4, vol = 0.1, type = "sine") {
    if (!this.ctx) return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(t + duration + 0.05);
  }
  effect(kind) {
    const f =
      {
        collect: 880,
        mission: 660,
        dock: 440,
        land: 180,
        collision: 70,
        repair: 550,
        warp: 120,
      }[kind] || 440;
    this.tone(f, 0.4, this.settings.sound * 0.18);
    if (kind === "mission") {
      setTimeout(() => this.tone(880, 0.7, this.settings.sound * 0.15), 140);
      setTimeout(() => this.tone(1100, 1, this.settings.sound * 0.12), 280);
    }
  }
  update(dt, speed, boost, active) {
    if (!this.ctx) return;
    this.gain.gain.setTargetAtTime(
      active ? this.settings.sound * 0.025 * Math.min(1, speed / 80) : 0,
      this.ctx.currentTime,
      0.2,
    );
    this.engine.frequency.setTargetAtTime(
      35 + speed * 0.32 + (boost ? 35 : 0),
      this.ctx.currentTime,
      0.15,
    );
    if (!active) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 2.8;
      const notes = [130.81, 196, 261.63, 164.81, 220, 329.63, 174.61, 261.63];
      let f = notes[this.step++ % notes.length];
      this.tone(f, 4, this.settings.music * 0.045);
      this.tone(f * 1.5, 3.6, this.settings.music * 0.025);
    }
  }
  pause() {
    if (this.gain && this.ctx)
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }
}
