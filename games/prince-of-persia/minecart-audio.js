// One audio graph per game session. No recorded ambience loops or recurring timers:
// the wheel joints follow travelled metres and the continuous layers follow speed.
export function createCartAudio(options = {}) {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const random = options.random || Math.random;
  const factory = options.contextFactory || (() => {
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    return Audio ? new Audio({latencyHint: 'interactive'}) : null;
  });
  const fetcher = options.fetcher || globalThis.fetch?.bind(globalThis);
  const sampleBase = options.sampleBase || new URL('./assets/audio/minecart/', import.meta.url).href;
  const samples = new Map(), nodes = new Set(), loops = new Set(), voices = new Set();
  let ctx, master, dry, send, rolling, wind, iron, clacks, ready;
  let disposed = false, active = false, wanted = false, enabled = true;
  let speed = 0, clock = 0, last = null, joint = null, strikeNumber = 0;
  const node = n => (nodes.add(n), n);
  const gain = value => {const n = node(ctx.createGain()); n.gain.value = value; return n;};
  const target = (param, value, seconds = .12) => {
    if (!param || !ctx) return;
    param.setTargetAtTime(value, ctx.currentTime, seconds);
  };
  const audible = () => ctx && !disposed && active && enabled && ctx.state === 'running';

  function connectWet(output, amount = .18) {
    output.connect(dry);
    const wet = gain(amount);
    output.connect(wet); wet.connect(send);
    return wet;
  }

  function noiseBuffer(seconds, brown = false) {
    const length = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < length; i++) {
      const white = random() * 2 - 1;
      value = brown ? (value + .035 * white) / 1.035 : white;
      data[i] = brown ? value * 4.6 : value * .65;
    }
    // Crossfade the end into the beginning. There is no attack at a loop boundary.
    const seam = Math.min(Math.round(ctx.sampleRate * .18), Math.floor(length / 4));
    for (let i = 0; i < seam; i++) {
      const blend = i / seam;
      data[length - seam + i] = data[length - seam + i] * (1 - blend) + data[i] * blend;
    }
    return buffer;
  }

  function noiseLayer(seconds, type, frequency, q, brown, wet) {
    const source = node(ctx.createBufferSource()), filter = node(ctx.createBiquadFilter()), amp = gain(0);
    source.buffer = noiseBuffer(seconds, brown); source.loop = true;
    // The end overlaps the first180ms; resume at the end of that overlap so
    // neighbouring samples stay continuous instead of replaying the fade twice.
    source.loopStart = .18; source.loopEnd = seconds;
    filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
    source.connect(filter); filter.connect(amp); connectWet(amp, wet);
    source.start(0, .18 + random() * (seconds - .18)); loops.add(source);
    return {source, filter, amp};
  }

  function makeClack(seed) {
    const length = Math.round(ctx.sampleRate * .13), buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    let n = seed;
    for (let i = 0; i < length; i++) {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      const t = i / ctx.sampleRate, grain = ((n / 4294967296) * 2 - 1);
      const attack = Math.min(1, t / .0015);
      data[i] = attack * (.65 * grain * Math.exp(-t * 95) + .3 * Math.sin(t * 2 * Math.PI * (235 + seed % 71)) * Math.exp(-t * 40) + .14 * Math.sin(t * 2 * Math.PI * (760 + seed % 120)) * Math.exp(-t * 65));
    }
    return buffer;
  }

  function build() {
    master = gain(0); dry = gain(1); send = gain(1); dry.connect(master);
    const limiter = node(ctx.createDynamicsCompressor());
    limiter.threshold.value = -12; limiter.knee.value = 14; limiter.ratio.value = 3;
    limiter.attack.value = .004; limiter.release.value = .2;
    master.connect(limiter); limiter.connect(ctx.destination);
    // Small, dark early reflections leave both narration and music intelligible.
    for (const [delayTime, amount] of [[.087, .28], [.161, .18], [.263, .095]]) {
      const delay = node(ctx.createDelay(.5)), low = node(ctx.createBiquadFilter()), amp = gain(amount);
      delay.delayTime.value = delayTime; low.type = 'lowpass'; low.frequency.value = 2100;
      send.connect(delay); delay.connect(low); low.connect(amp); amp.connect(master);
    }
    rolling = noiseLayer(11.31, 'lowpass', 230, .5, true, .22);
    wind = noiseLayer(13.73, 'bandpass', 900, .5, false, .08);
    const source = node(ctx.createOscillator()), amp = gain(0);
    source.type = 'triangle'; source.frequency.value = 70; source.connect(amp); connectWet(amp, .12); source.start(); loops.add(source);
    iron = {source, amp};
    clacks = [213, 682, 1439, 2510, 4736].map(makeClack);
    ready = Promise.all(['jump', 'land', 'air', 'chain'].map(async name => {
      if (!fetcher) return;
      try {
        const response = await fetcher(sampleBase + name + '.wav');
        if (!response.ok) return;
        const bytes = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(bytes);
        if (!disposed) samples.set(name, buffer);
      } catch { /* Synthesized effects remain available without sample downloads. */ }
    }));
  }

  function cleanVoice(voice) {
    if (!voices.delete(voice)) return;
    for (const n of voice.nodes) {try {n.disconnect();} catch {}}
  }

  function reserveVoice() {
    while (voices.size >= 48) {
      const oldest = voices.values().next().value;
      try {oldest.source.stop();} catch {} cleanVoice(oldest);
    }
  }

  function releaseVoices() {
    for (const voice of [...voices]) {try {voice.source.stop();} catch {} cleanVoice(voice);}
  }

  function oneShot(buffer, volume, rate = 1, delay = 0, pan = 0, wet = .2) {
    if (!buffer || !audible()) return false;
    reserveVoice();
    const source = ctx.createBufferSource(), amp = ctx.createGain(), wetGain = ctx.createGain();
    source.buffer = buffer; source.playbackRate.value = rate;
    amp.gain.value = volume; wetGain.gain.value = wet;
    const owned = [source, amp, wetGain];
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner(); panner.pan.value = pan; owned.push(panner); source.connect(panner); panner.connect(amp);
    } else source.connect(amp);
    amp.connect(dry); amp.connect(wetGain); wetGain.connect(send);
    const voice = {source, nodes: owned}; voices.add(voice);
    source.onended = () => cleanVoice(voice);
    const start = ctx.currentTime + Math.max(0, delay);
    source.start(start); source.stop(start + buffer.duration / Math.max(.1, rate) + .025);
    return true;
  }

  function tone(frequency, peak, duration, delay = 0, endFrequency = frequency, type = 'sine', wet = .2) {
    if (!audible()) return;
    reserveVoice();
    const source = ctx.createOscillator(), amp = ctx.createGain(), wetGain = ctx.createGain(), t = ctx.currentTime + delay;
    source.type = type; source.frequency.setValueAtTime(frequency, t);
    if (endFrequency !== frequency) source.frequency.exponentialRampToValueAtTime(Math.max(10, endFrequency), t + duration);
    amp.gain.setValueAtTime(.0001, t); amp.gain.exponentialRampToValueAtTime(peak, t + .008);
    amp.gain.exponentialRampToValueAtTime(.0001, t + duration);
    wetGain.gain.value = wet; source.connect(amp); amp.connect(dry); amp.connect(wetGain); wetGain.connect(send);
    const voice = {source, nodes: [source, amp, wetGain]}; voices.add(voice);
    source.onended = () => cleanVoice(voice); source.start(t); source.stop(t + duration + .025);
  }

  function clack(volume = .09, delay = 0) {
    const variant = strikeNumber++;
    return oneShot(clacks?.[variant % 5], volume * (.91 + random() * .18), .88 + random() * .22, delay, variant % 2 ? .17 : -.17, .17);
  }
  function jump() {
    if (!oneShot(samples.get('jump'), .25, .87, 0, 0, .24)) tone(155, .045, .19, 0, 80, 'triangle');
    clack(.14);
  }
  function land() {
    if (!oneShot(samples.get('land'), .31, .82, 0, 0, .28)) tone(92, .13, .22, 0, 42, 'triangle');
    clack(.21, .015); clack(.11, .075);
  }
  function fall() {
    oneShot(samples.get('air'), .23, .72, 0, 0, .29);
    tone(170, .035, .8, 0, 48, 'sine', .3);
  }
  function coin(combo = 1) {
    // Same fundamental, harmonic ratios and decay as Solportens väg.
    const f = 660 * 2 ** ((clamp(combo, 1, 8) - 1) * 2 / 12);
    for (const [ratio, volume, duration] of [[1, .085, .24], [2.01, .032, .16], [3.02, .012, .10]]) tone(f * ratio, volume, duration, 0, f * ratio, 'sine', .13);
  }
  function door() {
    if (!audible()) return;
    oneShot(samples.get('chain'), .19, .53, 0, -.25, .45);
    oneShot(samples.get('chain'), .12, .47, .45, .25, .45);
    tone(64, .065, 1.5, 0, 38, 'triangle', .45);
  }

  function setActive(value) {
    wanted = !!value;
    const next = wanted && enabled && !disposed;
    if (active === next) return;
    active = next;
    if (ctx) {
      target(master.gain, next ? .72 : 0, next ? .12 : .035);
      if (!next) {target(rolling.amp.gain, 0, .04); target(wind.amp.gain, 0, .06); target(iron.amp.gain, 0, .04);}
    }
    // Pauses/menu entries reset event history, so resuming cannot produce a fake impact.
    if (!next) {last = null; joint = null;}
  }

  async function resume() {
    if (disposed) return false;
    try {
      if (!ctx) {ctx = factory(); if (!ctx) return false; build(); target(master.gain, active ? .72 : 0);}
      // Called immediately in the user's pointer/keyboard action, before any await.
      const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
      await resumed;
      return ctx.state === 'running';
    } catch {return false;}
  }

  function update(dt, snapshot, mode = 'run') {
    if (!snapshot || disposed) return;
    const visible = typeof document === 'undefined' || !document.hidden;
    setActive(mode === 'run' && snapshot.status !== 'finished' && visible);
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
    const rawSpeed = Math.max(0, Number(snapshot.speed) || 0);
    speed += (rawSpeed - speed) * (1 - Math.exp(-dt * 5)); clock += dt;
    if (!audible()) {last = null; joint = null; return;}
    const inAir = snapshot.status === 'falling' || snapshot.jumpHeight > .015;
    const velocity = clamp(speed / 17, 0, 1.7), moving = clamp(speed / 2.5, 0, 1);
    const ground = inAir ? 0 : 1;
    target(rolling.amp.gain, ground * moving * (.11 + .13 * velocity), .09);
    target(rolling.filter.frequency, 95 + speed * 13, .17);
    target(rolling.source.playbackRate, .63 + speed * .024, .15);
    const gust = .93 + .055 * Math.sin(clock * .713) + .025 * Math.sin(clock * 1.391 + 1.2);
    target(wind.amp.gain, moving * (.014 + .055 * velocity ** 1.65) * gust + (snapshot.status === 'falling' ? Math.min(.12, snapshot.fallTime * .055) : 0), .2);
    target(wind.filter.frequency, 450 + speed * 39, .23);
    target(iron.amp.gain, ground * moving * (.012 + velocity * .008), .1);
    target(iron.source.frequency, 47 + speed * 4.4 + Math.sin(clock * 2.17) * 1.7, .12);
    const reset = !last || last.respawns !== snapshot.respawns || snapshot.travel < last.travel - .001;
    if (!reset) {
      if (last.status !== 'falling' && snapshot.status === 'falling') fall();
      else if (snapshot.status === 'run') {
        if (last.jumpHeight <= .015 && snapshot.jumpHeight > .015) jump();
        if (last.jumpHeight > .015 && snapshot.jumpHeight <= .015) land();
      }
    }
    // One rail joint per2.8m. The second axle crosses it1.48m later, independent
    // of render rate; a paused frame/teleport never generates a backlog of impacts.
    const index = Math.floor((snapshot.travel || 0) / 2.8);
    if (!reset && ground && joint != null && index !== joint && speed > 1) {
      const volume = .055 + velocity * .04;
      clack(volume); clack(volume * .69, Math.min(.19, 1.48 / Math.max(8, speed)));
    }
    joint = index;
    last = {status: snapshot.status, jumpHeight: snapshot.jumpHeight, respawns: snapshot.respawns, travel: snapshot.travel};
  }

  const onVisibility = () => {if (document.hidden) setActive(false);};
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
  return {
    resume, update, setActive, jump, land, fall, coin, door,
    setEnabled(value) {enabled = !!value; setActive(wanted);},
    get ready() {return ready || Promise.resolve();},
    get diagnostics() {return {available: !!ctx, state: ctx?.state || 'locked', active, speed, loopSources: loops.size, transientVoices: voices.size, disposed};},
    dispose() {
      if (disposed) return;
      disposed = true; active = false;
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
      releaseVoices();
      for (const source of loops) {try {source.stop();} catch {}}
      loops.clear(); for (const n of nodes) {try {n.disconnect();} catch {}} nodes.clear(); samples.clear();
      Promise.resolve(ctx?.close?.()).catch(() => {});
    }
  };
}
