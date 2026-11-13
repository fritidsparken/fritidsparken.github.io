"use strict";

let pickupAudio;
const soundBuffers = new Map(),
  soundVoices = new Set(),
  ambience = new Map();
let effectsBus;
async function readAudioFile(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Kunde inte ladda ' + path + ' (' + response.status + ')');
  return response.arrayBuffer();
}
const effectSamples = new Map();
function decodePcmEffect(bytes) {
  const wav = new DataView(bytes);
  const tag = offset => String.fromCharCode(...new Uint8Array(bytes, offset, 4));
  if (bytes.byteLength < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Ogiltig WAV-fil');
  let sampleRate;
  for (let pos = 12; pos + 8 <= bytes.byteLength;) {
    const kind = tag(pos),
      length = wav.getUint32(pos + 4, true),
      start = pos + 8;
    if (start + length > bytes.byteLength) break;
    if (kind === 'fmt ' && length >= 16 && wav.getUint16(start, true) === 1 && wav.getUint16(start + 2, true) === 1 && wav.getUint16(start + 14, true) === 16) {
      sampleRate = wav.getUint32(start + 4, true);
    }
    if (kind === 'data' && sampleRate && length % 2 === 0) {
      const samples = new Float32Array(length / 2);
      for (let i = 0; i < samples.length; i++) samples[i] = wav.getInt16(start + 2 * i, true) / 32768;
      return {
        samples,
        sampleRate
      };
    }
    pos = start + length + length % 2;
  }
  throw new Error('Ljudeffekten kräver mono PCM16');
}
async function loadSoundEffects() {
  await Promise.all(Object.entries(EFFECT_FILES).map(async ([name, path]) => {
    try {
      effectSamples.set(name, decodePcmEffect(await readAudioFile(path)));
    } catch (error) {
      console.warn('Ljudeffekten kunde inte öppnas:', path, error);
    }
  }));
}
function bufferFor(name) {
  if (soundBuffers.has(name)) return soundBuffers.get(name);
  const {
    samples,
    sampleRate
  } = effectSamples.get(name);
  const buffer = pickupAudio.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);
  soundBuffers.set(name, buffer);
  return buffer;
}
function startEffects() {
  if (!pickupAudio) return;
  if (!effectsBus) {
    effectsBus = pickupAudio.createGain();
    effectsBus.gain.value = .80;
    effectsBus.connect(pickupAudio.destination);
  }
}
function stopEffects() {
  for (const source of soundVoices) {
    try {
      source.stop();
    } catch {}
  }
  ambience.clear();
}
function playEffect(name, volume, x, rate = 1, loop = false) {
  if (!effectSamples.has(name) || !effectsBus || !menu.hidden || document.hidden || paused || pickupAudio.state !== 'running') return;
  const source = pickupAudio.createBufferSource(),
    gain = pickupAudio.createGain(),
    pan = pickupAudio.createStereoPanner?.();
  source.buffer = bufferFor(name);
  source.loop = loop;
  source.playbackRate.value = rate * (loop || name === 'finish' ? 1 : 1 + (Math.random() - .5) * .12);
  gain.gain.value = volume;
  if (pan) {
    source.connect(pan);
    pan.connect(gain);
    pan.pan.value = x == null ? 0 : clamp((x - route.game.p.x) / 650, -.83, .83);
  } else source.connect(gain);
  gain.connect(effectsBus);
  soundVoices.add(source);
  source.onended = () => {
    soundVoices.delete(source);
    source.disconnect();
    gain.disconnect();
    pan?.disconnect();
  };
  source.start(0, loop ? Math.random() * source.buffer.duration : 0);
  return {
    source,
    gain,
    pan
  };
}
function actionSound(e, d) {
  switch (e) {
    case 'jump':
      playEffect('step', .15);
      playEffect('jump', .26);
      break;
    case 'boost':
      playEffect('boost', .31);
      break;
    case 'grab':
      playEffect('grip', .42);
      break;
    case 'pullup':
      playEffect('climb', .32);
      break;
    case 'fall':
      if (d === 'cube' || d === 'hand') playEffect('slam', .58);
      playEffect('death', .49);
      break;
    case 'finish':
      quietScore();
      stopEffects();
      break;
    case 'cleared':
      stopEffects();
      break;
  }
}
function environmentSound(name, locations, p) {
  let nearest = null,
    best = Infinity;
  for (const [x, y] of locations) {
    const d = Math.hypot(x - p.x, (p.y - 100 - y) * .68);
    if (d < best) {
      best = d;
      nearest = x;
    }
  }
  let voice = ambience.get(name);
  if (nearest === null) {
    if (voice) {
      voice.source.stop();
      ambience.delete(name);
    }
    return;
  }
  if (!voice) {
    voice = playEffect(name, 0, nearest, 1, true);
    if (!voice) return;
    ambience.set(name, voice);
  }
  const t = pickupAudio.currentTime;
  voice.gain.gain.setTargetAtTime((name === 'water' ? .19 : .17) / (1 + (best / 330) ** 2), t, .18);
  voice.pan?.pan.setTargetAtTime(clamp((nearest - p.x) / 690, -.78, .78), t, .20);
}
function environmentalMix(g) {
  if (g.room.key === 'guardianRoom') {
    environmentSound('water', hallWaterSources, g.p);
    environmentSound('fire', hallFireSources, g.p);
    return;
  }
  const data = SCENERY[g.room.key];
  environmentSound('fire', data?.fire.map(([x, y]) => [x * 2, y * 2]) || [], g.p);
  environmentSound('water', data?.bounds.map(([, x, y, w, h]) => [2 * x + w, 2 * y + h]) || [], g.p);
}
function mechanismSound(c, phase, playerX) {
  const gain = 1 / (1 + ((c.x - playerX) / 450) ** 2);
  if (phase === 'hold' || phase === 'reset') {
    playEffect('slam', gain * .66, c.x);
    playEffect('chain', gain * .26, c.x, .81);
  } else if (phase === 'drop' || phase === 'flight') {
    playEffect('air', gain * .36, c.x, 1.4);
    playEffect('chain', gain * .32, c.x);
  } else playEffect('chain', gain * .30, c.x, phase === 'raise' ? .69 : 1.08);
}
function movementSounds(g, p, wasGround, vy, dt) {
  if (p !== g.p || p.dead) return;
  if (!wasGround && p.ground && vy > 25) playEffect('land', Math.min(.62, .20 + vy / 1600), undefined, p.onCube?.id != null ? 1.28 : 1);
  if (p.mode === 'run' && p.ground && Math.abs(p.vx) > 0) {
    const contact = Math.floor(p.run * 3);
    if (p.footContact !== contact) {
      p.footContact = contact;
      g.footSample = ((g.footSample ?? 0) + 1 + Math.floor(Math.random() * 2)) % 3;
      playEffect('stone' + g.footSample, .58, undefined, contact % 2 ? .98 : 1.02);
    }
  } else p.footContact = null;
  if (p.ground || p.hang || p.mantle) p.fallSound = false;else if (p.vy > 400 && !p.fallSound) {
    p.fallSound = true;
    playEffect('air', .22, undefined, .85);
  }
  for (const h of g.hazards) {
    const volume = 1 / (1 + ((p.x - h.x) / 400) ** 2);
    if (h.type === 'gear' || h.type === 'saw') {
      if (volume > .18 && g.clock >= (h.nextTick || 0)) {
        h.nextTick = g.clock + .46;
        playEffect('chain', volume * .12, gearX(h, g.clock), .60);
      }
      continue;
    }
    if (h.type !== 'spikes' && h.type !== 'jet') continue;
    const raised = trapPhase(h, g.clock).height > 3;
    if (h.sounded === false && raised && volume > .09) playEffect(h.type === 'jet' ? 'jet' : 'chain', volume * .29, h.x, h.type === 'jet' ? 1 : 1.38);
    h.sounded = raised;
  }
}
function enablePickupAudio() {
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return;
  try {
    pickupAudio ??= new Audio();
    startEffects();
    if (pickupAudio.state === 'suspended') pickupAudio.resume().catch(() => {});
  } catch {}
}
function pickupChime(combo) {
  if (pickupAudio?.state !== 'running') return;
  const t = pickupAudio.currentTime + .20,
    f = 660 * Math.pow(2, (combo - 1) * 2 / 12);
  for (const [ratio, volume, decay] of [[1, .085, .24], [2.01, .032, .16], [3.02, .012, .10]]) {
    const tone = pickupAudio.createOscillator(),
      gain = pickupAudio.createGain();
    tone.frequency.value = f * ratio;
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + .007);
    gain.gain.exponentialRampToValueAtTime(.0001, t + decay);
    tone.connect(gain);
    gain.connect(pickupAudio.destination);
    tone.start(t);
    tone.stop(t + decay + .01);
    tone.onended = () => {
      tone.disconnect();
      gain.disconnect();
    };
  }
}
let scoreBuffer,
  scorePending,
  scoreVoice,
  scoreGain,
  scoreOffset = 0,
  scoreStarted = 0,
  scoreWanted = false;
function prepareScore() {
  enablePickupAudio();
  if (!pickupAudio || scorePending || scoreBuffer) return;
  scorePending = readAudioFile(ACTION_MUSIC).then(bytes => pickupAudio.decodeAudioData(bytes)).then(b => {
    scoreBuffer = b;
    syncScore();
  }).catch(() => {}).finally(() => {
    scorePending = null;
  });
}
function syncScore() {
  if (!scoreWanted || !scoreBuffer || scoreVoice || document.hidden || !menu.hidden || route.done && !bridge.active && opening.hidden) return;
  const source = pickupAudio.createBufferSource();
  source.buffer = scoreBuffer;
  source.loop = true;
  source.loopEnd = Math.min(scoreBuffer.duration, 145.18);
  scoreGain = pickupAudio.createGain();
  const now = pickupAudio.currentTime;
  scoreGain.gain.setValueAtTime(0, now);
  scoreGain.gain.linearRampToValueAtTime(opening.hidden ? .21 : .065, now + .6);
  source.connect(scoreGain);
  scoreGain.connect(pickupAudio.destination);
  scoreOffset %= source.loopEnd;
  source.start(0, scoreOffset);
  scoreStarted = now;
  scoreVoice = source;
}
function quietScore() {
  scoreWanted = false;
  if (!scoreVoice) return;
  const source = scoreVoice,
    gain = scoreGain;
  scoreOffset += pickupAudio.currentTime - scoreStarted;
  scoreVoice = null;
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.stop();
}
function whistle() {
  if (!pickupAudio) return;
  const now = pickupAudio.currentTime;
  [659, 784, 740].forEach((hz, i) => {
    const v = pickupAudio.createOscillator(),
      g = pickupAudio.createGain(),
      t = now + i * .25;
    v.frequency.setValueAtTime(hz * .97, t);
    v.frequency.exponentialRampToValueAtTime(hz, t + .05);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(.065, t + .06);
    g.gain.exponentialRampToValueAtTime(.0001, t + .23);
    v.connect(g);
    g.connect(pickupAudio.destination);
    v.start(t);
    v.stop(t + .24);
    v.onended = () => {
      v.disconnect();
      g.disconnect();
    };
  });
}
let rumble = null,
  rumbleBuffer = null;
function rollAudio() {
  if (!pickupAudio || pickupAudio.state !== 'running') return;
  if (!rumble) {
    const ac = pickupAudio;
    rumbleBuffer ??= ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const samples = rumbleBuffer.getChannelData(0);
    if (samples[0] === 0) {
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * .8;
    }
    const source = ac.createBufferSource(),
      filter = ac.createBiquadFilter(),
      gain = ac.createGain();
    source.buffer = rumbleBuffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 125;
    gain.gain.value = 0;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    source.start();
    rumble = {
      source,
      filter,
      gain
    };
  }
  const near = clamp((6.5 - bridge.gap) / 6, 0, 1);
  rumble.gain.gain.setTargetAtTime(.20 + near * .52, pickupAudio.currentTime, .12);
  rumble.filter.frequency.setTargetAtTime(100 + near * 160 + 18 * Math.sin(bridge.rockTravel * 3), pickupAudio.currentTime, .1);
}
function stopRoll() {
  if (rumble) {
    rumble.source.stop();
    rumble.source.disconnect();
    rumble.filter.disconnect();
    rumble.gain.disconnect();
    rumble = null;
  }
}
