import { karts, powers } from "./circuits.js";
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x)),
  mod = (x, n) => ((x % n) + n) % n;
export class Race {
  constructor(path, track, settings, event = () => {}) {
    this.path = path;
    this.track = track;
    this.settings = settings;
    this.emit = event;
    this.t = -3;
    this.finished = false;
    this.drops = [];
    this.racers = Array.from(
      { length: ["time", "free"].includes(settings.mode) ? 1 : 8 },
      (_, i) => ({
        id: i,
        kart: i ? (settings.kart + i) % 8 : settings.kart,
        d: i ? -3.8 * Math.ceil(i / 2) : 0,
        l: i ? (i % 2 ? 2 : -2) : 0,
        v: 0,
        steer: 0,
        slide: 0,
        boost: 0,
        shield: 0,
        ice: 0,
        magnet: 0,
        hop: 0,
        vy: 0,
        air: 0,
        item: null,
        coins: 0,
        alt: false,
        box: -1,
        coin: -1,
        hit: 0,
        lap: 0,
        lapStart: 0,
        laps: [],
        done: 0,
        action: 0,
        drift: false,
      }),
    );
    this.items = Array.from({ length: 6 }, (_, i) => ({
      u: (i + 0.52) / 6,
      l: i % 2 ? 2.3 : -2.3,
    }));
    this.hazards = [
      { u: 0.35, l: -2.6, base: -2.6 },
      { u: 0.84, l: 2.8, base: 2.8 },
    ];
    this.shots = [];
    this.results = [];
  }
  order() {
    return [...this.racers].sort((a, b) =>
      a.done && b.done ? a.done - b.done : a.done ? -1 : b.done ? 1 : b.d - a.d,
    );
  }
  fire(r) {
    if (!r.item) return;
    const item = r.item;
    r.item = null;
    let foe = this.order()
      .filter((o) => o !== r && !o.done)
      .sort(
        (a, b) =>
          mod(a.d - r.d, this.path.length) - mod(b.d - r.d, this.path.length),
      )[0];
    switch (item) {
      case "Turbo":
        r.boost = 2.4;
        break;
      case "Sköld":
        r.shield = 7;
        break;
      case "Superhopp":
        r.vy = 12;
        r.boost = 1.1;
        break;
      case "Magnet":
        r.magnet = 8;
        break;
      case "Olja":
        this.drops.push({ d: r.d - 3, l: r.l, life: 15, from: r.id });
        break;
      case "Raket":
        if (foe)
          this.shots.push({
            from: r.id,
            target: foe.id,
            d: r.d,
            l: r.l,
            life: 7,
          });
        break;
      case "Isattack":
        if (foe) this.strike(foe, true);
        break;
    }
    this.emit("boost", r);
  }
  strike(r, ice = false) {
    if (r.shield > 0) {
      r.shield = 0;
      return;
    }
    if (r.hit > 0) return;
    r.v *= ice ? 0.82 : 0.58;
    r.hit = 0.9;
    r.ice = ice ? 2.3 : 0.6;
    this.emit("hit", r);
  }
  award(r) {
    let place = this.order().indexOf(r),
      bag =
        place >= 4
          ? [0, 0, 2, 2, 4, 6, 1, 5]
          : place <= 1
            ? [1, 3, 3, 5, 4, 0]
            : [0, 1, 2, 3, 4, 5, 6];
    r.item = powers[bag[Math.floor(Math.random() * bag.length)]];
    r.action = this.t + 0.9 + Math.random() * 1.9;
    this.emit("box", r);
  }
  step(dt, input) {
    if (this.finished) return;
    let last = this.t;
    this.t += dt;
    if (this.t < 0) {
      if (Math.ceil(-last) !== Math.ceil(-this.t))
        this.emit("start", this.racers[0]);
      return;
    }
    const { length, start, end } = this.path;
    for (let h of this.hazards)
      h.l =
        h.base +
        ([2, 6, 9, 10].includes(this.track.id)
          ? Math.sin(this.t * 1.3 + h.u * 8) * 2.2
          : 0);
    for (const r of this.racers) {
      if (r.done) continue;
      let prev = r.d,
        u = mod(r.d, length) / length,
        f = this.path.at(r.d),
        ahead = this.path.at(r.d + 9),
        bend = clamp(f.right.dot(ahead.f) * 4, -1, 1),
        stat = karts[r.kart],
        before = r.drift;
      let gas = input.gas,
        brake = input.brake,
        turn = input.turn,
        drift = input.drift;
      if (r.id) {
        const target = Math.sin(this.t * 0.58 + r.id * 2.5) * 2.6 - bend * 1.7;
        let lane = target;
        for (let o of this.racers)
          if (
            o !== r &&
            o.d > r.d &&
            o.d - r.d < 10 &&
            Math.abs(o.l - r.l) < 1.9
          )
            lane += r.l > o.l ? 2.8 : -2.8;
        for (let h of this.hazards) {
          let gap = mod(h.u * length - r.d, length);
          if (gap < 16 && Math.abs(h.l - lane) < 3) lane = h.l > 0 ? -2 : 2;
        }
        if (u > start / length - 0.035 && u < start / length && r.id % 3 === 1)
          lane = 4.7;
        turn = clamp((lane - r.l) * 0.43 + bend * 0.7, -1, 1);
        gas = true;
        brake = false;
        drift = Math.abs(bend) > 0.28 && r.v > 19;
        if (r.item && this.t > r.action) this.fire(r);
      } else if (input.fire) {
        this.fire(r);
        input.fire = false;
      }
      r.steer += (turn - r.steer) * Math.min(1, dt * (r.ice > 0 ? 2.1 : 7));
      r.drift = !!(
        drift &&
        r.v > 10 &&
        (Math.abs(r.steer) > 0.14 || Math.abs(bend) > 0.22) &&
        r.hop < 0.2
      );
      if (r.drift) r.slide = Math.min(3, r.slide + dt * stat[4]);
      else if (before) {
        if (r.slide > 0.52) {
          r.boost = Math.max(r.boost, 0.3 + r.slide * 0.58);
          this.emit("boost", r);
        }
        r.slide = 0;
      }
      let max =
        stat[1] *
        (r.id
          ? [0.74, 0.89, 0.99][this.settings.level] +
            0.014 * Math.sin(r.id * 1.8)
          : 1) *
        (r.boost > 0 ? 1.35 : 1);
      max *= 1 - Math.abs(bend) * (r.drift ? 0.045 : 0.12);
      r.v = clamp(
        r.v +
          dt * (brake ? -27 : gas ? stat[2] * (r.boost > 0 ? 1.65 : 1) : -5),
        0,
        Math.max(max, r.v - 14 * dt),
      );
      let sideways =
        (r.steer * stat[3] * (r.drift ? 1.38 : 1) * (r.ice > 0 ? 0.58 : 1) -
          bend * (r.drift ? 0.36 : 0.64)) *
        r.v *
        0.24;
      r.l += sideways * dt;
      if (r.ice > 0) r.l += Math.sin(this.t * 7) * dt * 1.8;
      const limit = r.alt ? 2.8 : 7.15;
      if (Math.abs(r.l) > limit) {
        if (Math.abs(r.l) > limit + 0.1 && r.hit <= 0) this.strike(r);
        r.l = clamp(r.l, -limit, limit);
        r.v = Math.max(0, r.v - 3 * dt);
      }
      let distance = r.v * dt;
      if (r.alt) distance *= (end - start) / this.path.branchLength;
      r.d += distance;
      if (
        Math.floor((prev - start) / length) !==
          Math.floor((r.d - start) / length) &&
        r.l > 2.7
      ) {
        r.alt = true;
        r.l = 0;
      }
      if (
        r.alt &&
        Math.floor((prev - end) / length) !== Math.floor((r.d - end) / length)
      ) {
        r.alt = false;
        r.l = 4;
      }
      if (this.track.id === 7 && u > 0.44 && u < 0.55)
        r.l += Math.sin(this.t * 0.8 + r.id) * dt * 0.53;
      if (
        Math.floor((prev - this.track.jump * length) / length) !==
        Math.floor((r.d - this.track.jump * length) / length)
      ) {
        r.v = Math.max(r.v, 12);
        r.vy = 6 + r.v * 0.085;
        this.emit("jump", r);
      }
      let oldHop = r.hop;
      r.vy -= dt * (this.track.id === 10 ? 10 : 22);
      r.hop = Math.max(0, r.hop + r.vy * dt);
      if (!r.hop) {
        r.vy = 0;
        if (oldHop > 0) this.emit("land", r);
      }
      for (let key of ["boost", "shield", "ice", "magnet", "hit"])
        r[key] = Math.max(0, r[key] - dt);
      const lap = Math.floor(r.d / length);
      if (lap > r.lap) {
        r.laps.push(this.t - r.lapStart);
        r.lapStart = this.t;
        r.lap = lap;
        if (lap >= this.settings.laps && this.settings.mode !== "free") {
          r.done = this.t;
          this.results.push(r.id);
          if (!r.id) {
            this.finished = true;
            this.emit("finish", r);
          }
        }
      }
      for (let i = 0; i < 6; i++) {
        let it = this.items[i],
          d = it.u * length,
          token = Math.floor(r.d / length) * 6 + i;
        if (
          !r.alt &&
          !r.item &&
          r.box !== token &&
          Math.abs(mod(r.d, length) - d) < 1.8 &&
          Math.abs(r.l - it.l) < 2.2
        ) {
          r.box = token;
          this.award(r);
        }
        if (
          r.coin !== token &&
          Math.abs(mod(r.d, length) - d - 9) < (r.magnet ? 9 : 2) &&
          Math.abs(r.l - (r.magnet ? r.l : it.l)) < (r.magnet ? 12 : 2)
        ) {
          r.coins++;
          r.coin = token;
          this.emit("coin", r);
        }
      }
      for (let h of this.hazards)
        if (
          !r.alt &&
          Math.abs(mod(r.d, length) - h.u * length) < 1.3 &&
          Math.abs(r.l - h.l) < 1.6 &&
          r.hop < 1
        )
          this.strike(r);
    }
    for (let i = 0; i < this.racers.length; i++)
      for (let j = 0; j < i; j++) {
        let a = this.racers[i],
          b = this.racers[j];
        if (
          a.alt !== b.alt ||
          Math.abs(a.d - b.d) > 2.25 ||
          Math.abs(a.l - b.l) > 1.65 ||
          Math.abs(a.hop - b.hop) > 1.1 ||
          a.done ||
          b.done
        )
          continue;
        let s = a.l >= b.l ? 1 : -1;
        a.l += s * dt * 3;
        b.l -= s * dt * 3;
        let trailing = a.d < b.d ? a : b;
        trailing.v = Math.min(trailing.v, (a === trailing ? b : a).v + 1);
      }
    this.drops = this.drops.filter((o) => {
      o.life -= dt;
      for (let r of this.racers)
        if (
          r.id !== o.from &&
          Math.abs(mod(r.d - o.d + length / 2, length) - length / 2) < 2 &&
          Math.abs(r.l - o.l) < 2 &&
          r.hop < 1
        ) {
          this.strike(r);
          return false;
        }
      return o.life > 0;
    });
    this.shots = this.shots.filter((s) => {
      let target = this.racers[s.target],
        gap = mod(target.d - s.d, length);
      s.d += dt * 62;
      s.l += (target.l - s.l) * dt * 4;
      s.life -= dt;
      if (gap < 2) {
        this.strike(target);
        return false;
      }
      return s.life > 0;
    });
  }
}
