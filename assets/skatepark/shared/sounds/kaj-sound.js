import { cues } from "./kaj-cues.js";

const level = value => Math.max(0, Math.min(1, value ?? 0));
const levels = {
  pop: .67, land: .75, metal: .53, bail: .78, bump: .48,
  swish: .19, push: .30, manual: .28
};

export class KajSound {
  constructor() {
    this.on = false;
    this.buffers = {};
    this.loading = {};
    this.loops = {};
    this.variants = { pop: 0, land: 0 };
  }
  start(index, settings) {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Context();
      this.fx = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.fx.connect(this.ctx.destination);
      this.musicBus.connect(this.ctx.destination);
    }
    this.on = true;
    this.ctx.resume().catch(() => {});
    this.volumes(settings);
    this.load("bank", "kaj-sessions.mp3");
  }
  load(key, file) {
    if (this.buffers[key] || this.loading[key]) return;
    const ctx = this.ctx;
    this.loading[key] = fetch(new URL(file, import.meta.url))
      .then(response => {
        if (!response.ok) throw new Error(file + " " + response.status);
        return response.arrayBuffer();
      })
      .then(bytes => ctx.decodeAudioData(bytes))
      .then(buffer => {
        if (this.ctx !== ctx) return;
        this.buffers[key] = buffer;
        if (key === "bank") {
          this.loop("roll", buffer, this.fx, 0);
          this.loop("grind", buffer, this.fx, 0);
          this.loop("ambience", buffer, this.fx, .078);
        } else {
          this.loop("music", buffer, this.musicBus, 1);
        }
      })
      .catch(() => {})
      .finally(() => { delete this.loading[key]; });
  }
  loop(key, buffer, bus, volume) {
    const src = this.ctx.createBufferSource(), gain = this.ctx.createGain();
    const [offset, duration] = cues[key] || [0, buffer.duration];
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = offset;
    src.loopEnd = offset + duration;
    gain.gain.value = volume;
    src.connect(gain).connect(bus);
    src.start(0, offset);
    this.loops[key] = { src, gain };
  }
  volumes(settings) {
    if (!this.ctx) return;
    const enabled = settings.kajMusicEnabled !== false;
    this.fx.gain.setTargetAtTime(level(settings.fx), this.ctx.currentTime, .03);
    this.musicBus.gain.setTargetAtTime(enabled ? level(settings.music) * .19 : 0,
      this.ctx.currentTime, .04);
    if (enabled && settings.music > 0 && this.on) this.load("music", "kaj-evening-session.mp3");
  }
  roll(player) {
    if (!this.on || !this.loops.roll) return;
    const speed = level(player.speed / 13), now = this.ctx.currentTime;
    const wheelLevel = player.air || player.rail ? 0 : Math.sqrt(speed) * (player.manual ? .24 : .31);
    const railLevel = player.rail ? .31 + speed * .19 : 0;
    this.loops.roll.gain.gain.setTargetAtTime(wheelLevel, now, .035);
    this.loops.grind.gain.gain.setTargetAtTime(railLevel, now, .035);
    this.loops.roll.src.playbackRate.setTargetAtTime(.55 + speed * 1.07, now, .07);
    this.loops.grind.src.playbackRate.setTargetAtTime(.75 + speed * .44, now, .07);
  }
  event(type, value) {
    if (!this.on || !this.buffers.bank || !(type in levels)) return;
    const key = type in this.variants ? type + (this.variants[type]++ % 2) : type;
    const [offset, duration] = cues[key];
    const src = this.ctx.createBufferSource(), gain = this.ctx.createGain();
    src.buffer = this.buffers.bank;
    src.playbackRate.value = .97 + Math.random() * .06;
    gain.gain.value = levels[type] * (type === "land" ? .42 + .58 * level(value / 10) : 1);
    src.connect(gain).connect(this.fx);
    src.start(0, offset, duration);
    src.onended = () => { src.disconnect(); gain.disconnect(); };
  }
  stop() {
    this.on = false;
    if (this.ctx) this.ctx.suspend().catch(() => {});
  }
  dispose() {
    this.on = false;
    for (const { src, gain } of Object.values(this.loops)) {
      src.stop(); src.disconnect(); gain.disconnect();
    }
    if (this.ctx) this.ctx.close().catch(() => {});
    this.ctx = null;
    this.loops = {};
    this.buffers = {};
    this.loading = {};
  }
}
