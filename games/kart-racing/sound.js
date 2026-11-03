// Original procedural score and sound design, composed for Fritidsparken.
// The score and synthesized recordings may be used, modified and published under CC0-1.0.
export class Sound {
  constructor(levels) {
    this.levels = levels;
  }
  init() {
    if (!this.ctx) {
      const c = (this.ctx = new AudioContext());
      this.bus = this.levels.map((v) => {
        let g = c.createGain();
        g.gain.value = v / 100;
        g.connect(c.destination);
        return g;
      });
      this.engine = c.createOscillator();
      this.engine.type = "sawtooth";
      this.filter = c.createBiquadFilter();
      this.filter.frequency.value = 430;
      this.motor = c.createGain();
      this.motor.gain.value = 0.024;
      this.engine.connect(this.filter).connect(this.motor).connect(this.bus[1]);
      this.engine.start();
      let buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      let a = buf.getChannelData(0);
      for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.beat = 0;
      this.next = c.currentTime;
    }
    this.ctx.resume();
  }
  volume(i, v) {
    this.levels[i] = v;
    if (this.ctx)
      this.bus[i].gain.setTargetAtTime(v / 100, this.ctx.currentTime, 0.04);
  }
  tone(
    hz,
    len,
    gain,
    bus,
    type = "sine",
    when = this.ctx.currentTime,
    end = hz,
  ) {
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(hz, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(10, end), when + len);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    o.connect(g).connect(this.bus[bus]);
    o.start(when);
    o.stop(when + len + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  hiss(hz, len, gain, bus, when) {
    let c = this.ctx,
      s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = this.noise;
    s.loop = true;
    f.type = "bandpass";
    f.frequency.value = hz;
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    s.connect(f).connect(g).connect(this.bus[bus]);
    s.start(when);
    s.stop(when + len);
    s.onended = () => {
      s.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
  fx(name) {
    if (!this.ctx) return;
    let opts = {
      hit: [95, 0.24, 32],
      boost: [210, 0.42, 740],
      jump: [340, 0.24, 590],
      land: [130, 0.12, 55],
      box: [660, 0.18, 990],
      coin: [980, 0.13, 1320],
      start: [520, 0.16, 520],
    };
    let [a, l, b] = opts[name] || opts.hit;
    this.tone(a, l, 0.11, 2, "triangle", this.ctx.currentTime, b);
  }
  tick(speed, drift, brake, id) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const c = this.ctx,
      t = c.currentTime;
    this.engine.frequency.setTargetAtTime(
      42 + speed * 2.6 + Math.sin(speed * 0.65) * 7,
      t,
      0.09,
    );
    if (this.next < t) this.next = t;
    while (this.next < t + 0.07) {
      let b = this.beat++,
        n = b % 16,
        root = [50, 46, 53, 48][Math.floor(b / 16) % 4],
        hz = (m) => 440 * 2 ** ((m - 69) / 12),
        w = this.next;
      this.next += 0.119;
      if (b % 4 === 0) this.tone(120, 0.17, 0.18, 0, "sine", w, 40);
      if (b % 8 === 4) this.hiss(1450, 0.13, 0.14, 0, w);
      if (b % 2 === 0) this.hiss(7200, 0.06, 0.07, 0, w);
      if (b % 2 === 0)
        this.tone(
          hz(root - 12 + (n === 14 ? 7 : 0)),
          0.18,
          0.11,
          0,
          "triangle",
          w,
        );
      if (![3, 7, 11].includes(n))
        this.tone(
          hz(
            root +
              12 +
              [0, 7, 12, 7, 3, 7, 10, 7, 5, 12, 15, 12, 7, 10, 7, 3][n],
          ),
          0.16,
          0.065,
          0,
          "triangle",
          w,
        );
      if (drift || brake) this.hiss(drift ? 2300 : 950, 0.17, 0.08, 2, w);
      if (b % 8 === 0)
        this.hiss(
          [450, 650, 180, 1200, 450, 750, 90, 710, 530, 350, 210, 940][id],
          0.85,
          0.12,
          3,
          w,
        );
      if (b % 32 === 8 && [0, 3, 9, 10, 11, 5].includes(id))
        this.tone(
          id === 10 ? 250 : 1200 + id * 70,
          0.23,
          0.05,
          3,
          "sine",
          w,
          id === 10 ? 440 : 1550,
        );
    }
  }
  pause() {
    this.ctx?.suspend();
  }
}
