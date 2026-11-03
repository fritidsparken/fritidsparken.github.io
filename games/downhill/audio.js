// Original synthesized score and continuous surface-dependent tire noise.
const sound = (() => {
  let ctx,
    out,
    tires,
    filter,
    next = 0,
    beat = 0,
    click = 0,
    enabled = true;
  function init() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      ctx = new C();
      out = ctx.createGain();
      out.gain.value = 0.55;
      out.connect(ctx.destination);
      let buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate),
        r = rng(321),
        samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = r() * 2 - 1;
      let src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      tires = ctx.createGain();
      tires.gain.value = 0;
      src.connect(filter).connect(tires).connect(out);
      src.start();
    }
    ctx.resume().catch(() => {});
    out.gain.value = enabled ? 0.55 : 0;
  }
  function note(f, d, amp, type = "sine", end = f) {
    if (!ctx) return;
    let t = ctx.currentTime,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(out);
    o.start();
    o.stop(t + d + 0.02);
  }
  function tick(v, s, brake, pedal, air) {
    if (!ctx) return;
    let t = ctx.currentTime;
    tires.gain.setTargetAtTime(air ? 0 : Math.min(0.08, v * 0.0025), t, 0.06);
    filter.frequency.value =
      ({ jord: 610, grus: 1200, trä: 340, lera: 450, snö: 830, is: 1750 }[s] ||
        700) + (brake ? 800 : 0);
    if (t > click && v > 2) {
      note(brake ? 620 : pedal ? 116 : 210, 0.027, 0.026, "triangle");
      click = t + (pedal ? 0.32 : 1.2 / Math.max(3, v));
    }
    if (t >= next) {
      let chord = [146.83, 174.61, 130.81, 196][Math.floor(beat / 8) % 4];
      note(
        chord * [1, 1.5, 2, 1.25, 1.5, 2.5, 2, 1.5][beat % 8],
        0.39,
        0.085,
        "sine",
      );
      if (beat % 4 === 0) note(chord / 2, 0.78, 0.095, "triangle");
      next = t + 0.31;
      beat++;
    }
  }
  return {
    init,
    tick,
    land: (p) =>
      note(120, 0.15, Math.min(0.22, 0.04 + p * 0.01), "triangle", 42),
    toggle() {
      enabled = !enabled;
      if (out) out.gain.value = enabled ? 0.55 : 0;
      return enabled;
    },
    quiet() {
      if (ctx) {
        tires.gain.value = 0;
        ctx.suspend().catch(() => {});
      }
    },
  };
})();
