const musicFile = "../crazy-bowling/assets/audio/funk-game-loop.mp3";
const ambientFiles = [
  "./park-sound.mp3",
  "../minigolf/assets/audio/waves.mp3",
  "../minigolf/assets/audio/crickets.mp3",
  "../minigolf/assets/audio/birds.mp3",
];
export class Sound {
  constructor() {
    this.music = new Audio(musicFile);
    this.ambient = new Audio();
    this.music.loop = this.ambient.loop = true;
    this.on = false;
  }
  start(i, settings) {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx;
      this.fx = c.createGain();
      this.fx.connect(c.destination);
      this.buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const a = this.buffer.getChannelData(0);
      for (let j = 0; j < a.length; j++) a[j] = Math.random() * 2 - 1;
      this.rolling = c.createBufferSource();
      this.rolling.buffer = this.buffer;
      this.rolling.loop = true;
      this.filter = c.createBiquadFilter();
      this.filter.type = "bandpass";
      this.gain = c.createGain();
      this.gain.gain.value = 0;
      this.rolling.connect(this.filter).connect(this.gain).connect(this.fx);
      this.rolling.start();
    }
    this.on = true;
    if (this.i !== i) {
      this.ambient.src = ambientFiles[i];
      this.i = i;
    }
    this.volumes(settings);
    this.ctx.resume().catch(() => {});
    this.music.play().catch(() => {});
    this.ambient.play().catch(() => {});
  }
  volumes(s) {
    this.music.volume = s.music * 0.54;
    this.ambient.volume = s.fx * 0.17;
    if (this.fx) this.fx.gain.value = s.fx;
  }
  stop() {
    this.on = false;
    this.music.pause();
    this.ambient.pause();
    if (this.ctx) this.ctx.suspend().catch(() => {});
  }
  roll(p, i) {
    if (!this.on) return;
    const c = this.ctx,
      t = c.currentTime;
    this.filter.frequency.setTargetAtTime(
      p.rail ? 1800 : (i === 1 ? 240 : 390) + p.speed * 46,
      t,
      0.06,
    );
    this.gain.gain.setTargetAtTime(
      p.air
        ? 0
        : Math.min(0.13, p.speed * 0.007) * (p.rail ? 1.5 : p.manual ? 0.6 : 1),
      t,
      0.04,
    );
  }
  event(type, value) {
    if (!this.on) return;
    const cfg = {
      pop: [740, 0.105, 0.4],
      swish: [1800, 0.16, 0.12],
      push: [280, 0.14, 0.2],
      manual: [530, 0.08, 0.14],
      metal: [2500, 0.21, 0.32],
      land: [460, 0.12, Math.min(0.7, 0.19 + (value || 0) * 0.025)],
      bump: [230, 0.14, 0.3],
      bail: [340, 0.25, 0.43],
    }[type];
    if (!cfg) return;
    const c = this.ctx,
      t = c.currentTime,
      src = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    src.buffer = this.buffer;
    f.type = "bandpass";
    f.frequency.setValueAtTime(cfg[0], t);
    f.frequency.exponentialRampToValueAtTime(cfg[0] * 0.48, t + cfg[1]);
    f.Q.value = type === "metal" ? 7 : 0.85;
    g.gain.setValueAtTime(cfg[2], t);
    g.gain.exponentialRampToValueAtTime(0.001, t + cfg[1]);
    src.connect(f).connect(g).connect(this.fx);
    src.start(t, Math.random());
    src.stop(t + cfg[1]);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
}
