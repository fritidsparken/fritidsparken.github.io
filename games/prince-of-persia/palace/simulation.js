"use strict";

class Chamber {
  constructor(room, cp = 0, emit = () => {}) {
    this.room = room;
    this.index = ROOMS.indexOf(room);
    this.first = this.index === 0;
    this.scale = this.first ? 1 : .90;
    this.emit = emit;
    this.preferred = 'auto';
    this.seq = 0;
    this.done = false;
    this.clock = 0;
    this.floors = this.first ? PASSAGE_PLATFORMS.map(a => [a.x0, a.x1, a.y, a.endY ?? a.y]) : room.floors;
    this.all = [...this.floors, ...(room.extras || [])];
    this.lips = [];
    this.checkpoint = clamp(cp, 0, this.first ? 2 : this.floors.length - 1);
    for (const [i, f] of this.all.entries()) for (const dir of [1, -1]) {
      const edge = dir === 1 ? f[0] : f[1];
      const neighbor = this.all.find(other => other !== f && Math.abs((dir === 1 ? other[1] : other[0]) - edge) < 1);
      const rise = neighbor ? H(neighbor, edge) - H(f, edge) : Infinity;
      if (rise <= 4) continue;
      const lip = buildLip(f, i, dir, this.scale);
      if (this.first && i === 2 && dir === 1) Object.assign(lip, PASSAGE_LEDGE, {
        original: true
      });
      Object.assign(lip, {
        rise,
        low: rise <= STEP_RISE,
        neighbor
      });
      this.lips.push(lip);
    }
    this.hazards = trials[this.index].map(([type, x, surface, width, height], i) => ({
      type,
      x,
      y: H(this.all[surface], x),
      surface,
      width,
      height,
      offset: this.index * .63 + i
    }));
    this.spawn();
  }
  spawn() {
    this.cubes = makeCubes(this);
    for (const h of this.hazards) h.trip = null;
    const i = this.checkpoint,
      f = this.all[i],
      x = this.first ? PASSAGE_ANCHORS[i].x : i ? Math.min(f[1] - 20, f[0] + 67) : 105;
    this.p = {
      x,
      y: H(f, x),
      surface: i,
      vx: 0,
      vy: 0,
      ground: true,
      facing: 1,
      mode: 'idle',
      style: 0,
      prep: 0,
      air: 0,
      land: 0,
      coyote: .1,
      buffer: 0,
      run: 0,
      hang: 0,
      mantle: 0,
      dead: 0,
      ledgeLeap: false,
      activeLedge: null,
      boosted: false,
      tapLeft: 0,
      jumping: false,
      launch: 440
    };
  }
  checkpointAt(i) {
    if (i < this.floors.length) {
      const cp = this.first ? Math.min(i, 2) : i;
      if (cp > this.checkpoint) {
        this.checkpoint = cp;
        this.emit('checkpoint', cp);
      }
    }
  }
  fail(cause) {
    if (cause === 'cube') this.checkpoint = 0;
    this.p.dead = .46;
    this.p.mode = 'fall';
    this.emit('fall', cause);
  }
  demoInput() {
    const p = this.p;
    if (p.jumping && !p.boosted && p.air > .09 && p.tapLeft > 0 && this.hazards.some(h => h.type !== 'stone' && h.x > p.x && h.x - p.x < 155)) return {
      axis: 1,
      jump: true
    };
    if (!p.ground || p.prep || p.hang || p.mantle) return {
      axis: 1
    };
    const f = this.all[p.surface],
      next = this.floors[p.surface + 1];
    const wall = this.lips.find(l => l.dir === 1 && l.neighbor === f && l.lipX - p.x >= 0 && l.lipX - p.x < (l.low ? 55 : 62));
    const obstacle = this.hazards.some(h => h.surface === p.surface && h.x - p.x > 0 && h.x - p.x < (h.type === 'stone' ? 98 : 146));
    const gap = next && next[0] > f[1] + 4 && p.x >= f[1] - 36;
    return {
      axis: 1,
      jump: !!(wall || obstacle || gap)
    };
  }
  startJump(axis) {
    const p = this.p;
    p.style = this.preferred === 'auto' ? this.seq++ % 3 : Number(this.preferred) || 0;
    const dir = axis || p.facing;
    const wall = this.lips.find(l => l.dir === dir && l.neighbor === this.all[p.surface] && (l.lipX - p.x) * dir >= -2 && (l.lipX - p.x) * dir <= 132);
    const clearance = wall ? wall.low ? wall.rise + 18 : p.y - wall.hangY + 12 : 0;
    p.launch = Math.max(JUMP_STYLES[p.style].impulse, Math.sqrt(2 * GRAVITY * Math.max(0, clearance)));
    p.stepTarget = wall && wall.low && Math.abs(wall.lipX - p.x) < 16 ? wall : null;
    p.originY = p.y;
    p.prep = .065;
    p.air = 0;
    p.buffer = 0;
    p.land = 0;
    p.boosted = false;
    p.jumping = true;
    p.tapLeft = DOUBLE_TAP;
    this.emit('jump', p.style);
  }
  grab(lip) {
    const p = this.p,
      dy = p.y - lip.y;
    // Choose the pose whose hand-to-sole distance fits the actual encounter.
    let entry = 0;
    while (entry < 12 && (SOLES[entry] - STUDY_CONTACTS[entry][1]) * 187 / 240 * this.scale > dy + 9) entry++;
    if (dy < 85 * this.scale) entry = 14;
    const L = {
      ...lip,
      entry,
      hangY: p.y,
      grabDX: p.x - lip.hangX
    };
    Object.assign(p, {
      x: lip.hangX,
      activeLedge: L,
      ledgeLeap: true,
      ground: false,
      hang: .18,
      mode: 'hang',
      facing: L.dir,
      buffer: 0,
      vx: 0,
      vy: 0,
      jumping: false,
      tapLeft: 0
    });
    this.emit('grab');
  }
  step(dt, input = {}) {
    const p = this.p,
      oldX = p.x,
      oldY = p.y,
      wasGround = p.ground,
      oldVy = p.vy,
      alive = !p.dead;
    this.move(dt, input);
    if (alive && !this.done && !p.dead) {
      advanceCubes(this, dt, oldX, oldY);
      movementSounds(this, p, wasGround, oldVy, dt);
    }
  }
  move(dt, input = {}) {
    if (this.done) return;
    const p = this.p,
      axis = Math.sign(input.axis || 0);
    this.clock += dt;
    if (p.dead) {
      p.dead = Math.max(0, p.dead - dt);
      if (!p.dead) {
        this.spawn();
        this.emit('respawn', this.checkpoint);
      }
      return;
    }
    if (p.pitfall) {
      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      p.mode = 'fall';
      if (p.y > p.pitfall.y + 125) this.fail('hatch');
      return;
    }
    if (p.hang) {
      p.hang = Math.max(0, p.hang - dt);
      if (!p.hang) {
        p.mantle = .001;
        this.emit('pullup');
      }
      return;
    }
    if (p.mantle) {
      const L = p.activeLedge,
        t = p.mantle = Math.min(1, p.mantle + dt / (1.30 * (24 - L.entry) / 24)),
        s = t * t * (3 - 2 * t);
      p.mode = 'mantle';
      p.x = L.hangX + (L.standX - L.hangX) * s;
      p.y = L.hangY + (L.standY - L.hangY) * s;
      if (t === 1) {
        Object.assign(p, {
          x: L.standX,
          y: L.standY,
          surface: L.to,
          ground: true,
          mantle: 0,
          mode: 'idle',
          ledgeLeap: false,
          activeLedge: null
        });
        this.checkpointAt(L.to);
      }
      return;
    }
    p.tapLeft = Math.max(0, p.tapLeft - dt);
    p.buffer = Math.max(0, p.buffer - dt);
    p.land = Math.max(0, p.land - dt);
    p.coyote = p.ground ? .10 : Math.max(0, p.coyote - dt);
    if (input.jump) {
      if (p.jumping && !p.boosted) {
        p.boosted = true;
        p.tapLeft = 0;
        // Target the absolute apex measured from takeoff, including the height already gained.
        if (!p.prep) p.vy = -Math.sqrt(Math.max(0, 2 * p.launch * p.launch - 2 * GRAVITY * (p.originY - p.y)));
        this.emit('boost');
      } else if (!p.jumping || !p.prep && p.vy > 0) p.buffer = .12;
    }
    if (p.buffer > 0 && p.coyote > 0 && !p.jumping) this.startJump(axis);
    if (axis) {
      p.facing = axis;
      p.run += dt;
    } else p.run = 0;
    const oldX = p.x,
      oldY = p.y;
    p.vx = axis * 210;
    p.x = clamp(p.x + p.vx * dt, this.first ? 110 : 30, this.first ? 1620 : 1640);
    if (p.prep) {
      p.prep = Math.max(0, p.prep - dt);
      if (!p.prep) {
        p.vy = -p.launch * (p.boosted ? Math.SQRT2 : 1);
        p.ground = false;
        p.coyote = 0;
      }
    } else if (!p.ground) {
      p.air += dt;
      p.y += p.vy * dt + .5 * GRAVITY * dt * dt;
      p.vy += GRAVITY * dt;
    }
    if (p.stepTarget && !axis && p.jumping && !p.prep && p.y <= p.stepTarget.y + 1) {
      const L = p.stepTarget,
        remaining = (L.lipX + L.dir * 9 - p.x) * L.dir;
      if (remaining > 0) p.x += L.dir * Math.min(remaining, 160 * dt);
    }
    p.reaching = null;
    p.reachBlend = 0;
    if (!p.ground && !p.prep && p.jumping) {
      for (const L of this.lips) {
        if (L.low || L.dir !== p.facing) continue;
        const dx = (L.hangX - p.x) * L.dir,
          dy = p.y - L.hangY;
        if (dx < -3 || dx > 34 || dy < -7 || dy > 55 || p.vy >= 0) continue;
        p.reaching = L;
        p.reachBlend = clamp(1 - Math.max(Math.max(0, dx) / 34, Math.max(0, dy) / 55), 0, 1);
        break;
      }
    }
    if (axis) for (const L of this.lips) {
      if (axis !== L.dir) continue;
      const approach = (L.lipX - oldX) * axis,
        top = H(L.floor, L.lipX);
      if (approach < -1 || approach > 135 || p.y <= top + .2) continue;
      const contact = L.low ? L.lipX - axis * 3 : L.hangX;
      const distance = (contact - p.x) * axis;
      if (distance > 0) continue;
      // Real steps are cleared by the feet. Exposed, taller lips can meet the hands mid-flight.
      const reach = p.y - top;
      const remainingRise = p.vy < 0 ? p.vy * p.vy / (2 * GRAVITY) : 0;
      const missedStep = L.low && p.jumping && p.air > .09 && p.y - remainingRise > top + 3;
      if (!p.ground && !p.prep && (!L.low || missedStep) && reach > 3 && p.y <= L.hangY + 3) {
        this.grab(L);
        return;
      }
      if ((contact - oldX) * axis >= -4) {
        p.x = contact;
        p.vx = 0;
      }
    }
    // A vertical jump at a high wall also reaches the lip while the player holds still.
    if (!axis && !p.ground && !p.prep && p.jumping) {
      const L = this.lips.find(l => !l.low && l.dir === p.facing && Math.abs(l.hangX - p.x) < 13 && p.y > l.y + 3 && p.y <= l.hangY + 3);
      if (L) {
        this.grab(L);
        return;
      }
    }
    if (p.ground && !p.prep && !p.stone && !p.onCube) {
      const f = this.all[p.surface];
      if (inSpan(f, p.x)) p.y = H(f, p.x);else {
        const i = this.all.findIndex(n => inSpan(n, p.x) && Math.abs(H(n, p.x) - p.y) <= 5);
        if (i >= 0) {
          p.surface = i;
          p.y = H(this.all[i], p.x);
          this.checkpointAt(i);
        } else {
          p.ground = false;
          p.vy = 0;
          p.coyote = .10;
        }
      }
    }
    if (!p.ground && !p.prep && p.vy >= 0) {
      for (const [i, f] of this.all.entries()) {
        const top = H(f, p.x);
        if (inSpan(f, p.x) && oldY <= top + .55 && p.y >= top) {
          Object.assign(p, {
            y: top,
            vy: 0,
            surface: i,
            ground: true,
            land: .16,
            coyote: .1,
            jumping: false,
            tapLeft: 0,
            activeLedge: null
          });
          this.checkpointAt(i);
          break;
        }
      }
    }
    for (const h of this.hazards) {
      if (h.type === 'hatch') {
        if (h.trip != null && this.clock - h.trip >= 2.6) h.trip = null;
        if (p.ground && !p.stone && !p.onCube && Math.abs(p.y - h.y) < 5 && Math.abs(p.x - h.x) <= h.width / 2 + 7) {
          if (h.trip == null) {
            h.trip = this.clock;
            playEffect('chain', .28, h.x, .78);
          }
          if (Math.abs(p.x - h.x) + 4 < hatchGap(h, this.clock)) {
            Object.assign(p, {
              pitfall: h,
              ground: false,
              vy: 65,
              vx: 0,
              mode: 'fall'
            });
            return;
          }
        }
        continue;
      }
      if (['gear', 'saw', 'thorns'].includes(h.type)) {
        if (newTrialHit(h, p, this.clock, this.scale)) {
          this.fail(h.type);
          return;
        }
        continue;
      }
      const height = h.type === 'stone' ? h.height : trapPhase(h, this.clock).height;
      if (height < 5 || Math.abs(p.x - h.x) > h.width / 2 + 7 || p.y <= h.y - height || p.y - 140 > h.y + 4) continue;
      if (h.type === 'stone') {
        // A landed jump may stand on the block, or continue off either end.
        const top = h.y - height;
        if (!p.ground && p.vy >= 0 && oldY <= top + 1) {
          p.y = top;
          p.vy = 0;
          p.ground = true;
          p.stone = h;
          p.jumping = false;
          p.tapLeft = 0;
          p.land = .15;
        } else if (p.stone !== h) {
          p.x = oldX <= h.x ? h.x - h.width / 2 - 7 : h.x + h.width / 2 + 7;
          p.vx = 0;
        }
      } else {
        this.fail(h.type);
        return;
      }
    }
    if (p.stone) {
      if (p.prep || p.jumping) p.stone = null;else if (Math.abs(p.x - p.stone.x) <= p.stone.width / 2 + 7) p.y = p.stone.y - p.stone.height;else {
        p.y = p.stone.y - p.stone.height;
        p.stone = null;
        p.ground = false;
        p.vy = 0;
      }
    }
    p.mode = p.prep ? 'prepare' : !p.ground ? p.vy < 0 ? 'jump' : 'fall' : p.land ? 'land' : axis ? 'run' : 'idle';
    if (p.y > 970) {
      this.fail('fall');
      return;
    }
  }
}
const TREASURES = [
  ['Solmynt', 'coin', '#ffcb58', 810, 1280],
  ['Rosenrubiner', 'gem', '#fc697e', 240, 1450],
  ['Vattenpärlor', 'pearl', '#80e4ed', 280, 1490],
  ['Mosaikstjärnor', 'star', '#67e0d1', 450, 1430],
  ['Bronsmynt', 'coin', '#ed9c57', 270, 1535],
  ['Smaragdblad', 'leaf', '#80dc7b', 180, 1450],
  ['Månpärlor', 'pearl', '#c2b8ff', 250, 1260],
  ['Kugghjul', 'gear', '#f4bb62', 168, 1470],
  ['Kungasigill', 'star', '#f7ce70', 173, 1510],
  ['Solrubiner', 'gem', '#ff996c', 190, 1465]
];
TREASURES.splice(6, 1);
TREASURES.push(['Solväktarens sigill', 'star', '#ffca61']);
const GUARDIAN_FLOOR = 690,
  GUARDIAN_ARM = [[0, 675, 690], [675, 735, 575], [735, 1030, 416], [1030, 1143, 506], [1143, 1672, 690]];
function guardianPose(g) {
  const age = g.clock - g.phaseStart;
  if (g.phase === 'swing') return -.86 * (1 - clamp(age / .32, 0, 1) ** 2);
  if (g.phase === 'lift') return -.86 * Math.sin(clamp(age / 1.0, 0, 1) * Math.PI / 2);
  return g.phase === 'rest' || g.phase === 'freed' ? 0 : -.86;
}
class GuardianChamber extends Chamber {
  constructor(room, emit, freed) {
    super(room, 0, emit);
    this.phase = 'waiting';
    this.phaseStart = 0;
    this.base = this.all;
    this.armLips = [];
    for (let i = 0; i < GUARDIAN_ARM.length; i++) for (const dir of [-1, 1]) {
      const n = i - dir;
      if (!GUARDIAN_ARM[n]) continue;
      const f = GUARDIAN_ARM[i],
        rise = GUARDIAN_ARM[n][2] - f[2];
      if (rise < 5) continue;
      this.armLips.push({
        ...buildLip(f, i, dir, this.scale),
        neighbor: GUARDIAN_ARM[n],
        rise,
        low: rise <= STEP_RISE
      });
    }
    if (freed) this.setPhase('freed');
  }
  checkpointAt() {}
  setPhase(phase) {
    this.phase = phase;
    this.phaseStart = this.clock;
    const solid = phase === 'rest' || phase === 'freed';
    this.all = this.floors = solid ? GUARDIAN_ARM : this.base;
    this.lips = solid ? this.armLips : [];
    const p = this.p;
    if (solid && p.ground && p.x > 1143) p.surface = 4;
    if (!solid && (p.surface !== 0 || p.hang || p.mantle)) {
      Object.assign(p, {
        surface: 0,
        ground: false,
        hang: 0,
        mantle: 0,
        activeLedge: null,
        ledgeLeap: false,
        vy: 0,
        mode: 'fall'
      });
    }
  }
  step(dt, input) {
    const wasDead = this.p.dead;
    super.step(dt, input);
    const p = this.p;
    if (wasDead && !p.dead) {
      this.setPhase(this.phase === 'freed' ? 'freed' : 'waiting');
      return;
    }
    if (p.dead) return;
    const t = this.clock - this.phaseStart;
    if (this.phase === 'waiting' && p.x >= 405) this.setPhase('warning');else if (this.phase === 'warning' && t >= 1.25) {
      this.setPhase('swing');
      playEffect('air', .48, 820, .72);
    } else if (this.phase === 'swing' && t >= .32) {
      this.setPhase('rest');
      playEffect('slam', .71, 820, .78);
      if (p.x >= 667 && p.x <= 1143 && p.y > 445) {
        this.fail('hand');
        return;
      }
    } else if (this.phase === 'rest') {
      if (Math.abs(Math.abs(p.x - 820) - 580 * t) < 28 && p.y > GUARDIAN_FLOOR - 32) {
        this.fail('wave');
        return;
      }
      if (t > 10) this.setPhase('lift');
    } else if (this.phase === 'lift' && t >= 1) this.setPhase('waiting');
  }
  demoInput() {
    const p = this.p,
      age = this.clock - this.phaseStart;
    if (this.phase === 'waiting' || this.phase === 'warning' || this.phase === 'swing' || this.phase === 'lift') return {
      axis: p.x < 465 ? 1 : p.x > 500 ? -1 : 0
    };
    if (this.phase === 'rest' && age < 1.2) {
      return {
        axis: 0,
        jump: p.ground && age > .25 && age < .4
      };
    }
    return super.demoInput();
  }
}
class PalaceRoute {
  constructor(emit = () => {}, save = {}) {
    this.emit = emit;
    this.elapsed = Number(save.elapsed) || 0;
    this.falls = Number(save.falls) || 0;
    this.done = false;
    this.style = 'auto';
    const room = Number.isInteger(save.room) ? clamp(save.room, 0, 9) : 0;
    this.bags = ROOMS.map((_, i) => Array.isArray(save.bags) ? Number(save.bags[i]) & 3 : i < room ? 3 : 0);
    this.points = Number.isSafeInteger(save.points) ? save.points : this.bags.reduce((n, b) => n + (b & 1) + (b >> 1), 0);
    this.pickups = [];
    this.combo = 0;
    this.lastPickup = -Infinity;
    this.change(room, Number.isInteger(save.cp) ? save.cp : 0, save.atReturn === true);
  }
  change(index, cp = 0, atReturn = false) {
    this.index = index;
    this.atReturn = atReturn;
    this.lockNotice = false;
    const forward = (type, data) => {
      if (type === 'fall') {
        this.falls++;
        this.atReturn = false;
      }
      this.emit(type, data);
    };
    this.game = index === 9 ? new GuardianChamber(ROOMS[index], forward, this.bags[9] === 1) : new Chamber(ROOMS[index], cp, forward);
    const g = this.game;
    g.preferred = this.style;
    this.exitX = g.first ? 1595 : g.room.exit;
    if (atReturn) {
      const surface = g.floors.length - 1,
        x = Math.max(g.floors[surface][0] + 3, this.exitX - 26);
      Object.assign(g.p, {
        surface,
        x,
        y: H(g.floors[surface], x),
        facing: -1
      });
      g.checkpoint = g.first ? 2 : surface;
    }
    this.items = index === 9 ? [{
      x: 916,
      y: 368
    }] : TREASURES[index].slice(3).map(x => ({
      x,
      y: H(g.floors.find(f => inSpan(f, x)), x) - 84
    }));
  }
  step(dt, input = {}) {
    if (this.done) return;
    this.elapsed += dt;
    while (this.pickups.length && this.elapsed - this.pickups[0].start > 1.1) this.pickups.shift();
    const g = this.game;
    g.preferred = this.style;
    g.step(dt, input);
    const p = g.p;
    if (p.dead) return;
    if (this.atReturn && p.x < this.exitX - 85) this.atReturn = false;
    this.items.forEach(({
      x,
      y
    }, i) => {
      const bit = 1 << i;
      if ((this.index !== 9 || g.phase === 'rest' && p.surface === 2 && p.ground) && !(this.bags[this.index] & bit) && Math.hypot(p.x - x, Math.max(0, p.y - 143 * g.scale - y, y - p.y)) <= 78) {
        this.bags[this.index] |= bit;
        if (this.index === 9) g.setPhase('freed');
        this.combo = this.elapsed - this.lastPickup <= 7 ? Math.min(5, this.combo + 1) : 1;
        this.lastPickup = this.elapsed;
        this.points += this.combo;
        this.pickups.push({
          room: this.index,
          start: this.elapsed,
          x,
          y,
          hitX: p.x,
          hitY: p.y - 94 * g.scale,
          combo: this.combo
        });
        if (this.bags[this.index] === 3) g.exitLightAt = this.elapsed + .8;
        this.emit('treasure', this.combo);
      }
    });
    if (p.y > H(g.floors[0], p.x) + 25 && p.x <= 40) return;
    if (this.index > 0 && p.x <= 40 && input.axis <= 0) {
      this.change(this.index - 1, 0, true);
      this.emit('room', this.index);
      return;
    }
    if (p.x < this.exitX - 35) this.lockNotice = false;
    if (p.x < this.exitX || input.axis < 0 || p.y > H(g.floors[g.floors.length - 1], p.x) + 20) return;
    if (this.bags[this.index] !== (this.index === 9 ? 1 : 3)) {
      p.x = this.exitX;
      if (!this.lockNotice) {
        this.lockNotice = true;
        this.emit('locked');
      }
      return;
    }
    if (this.index === 9) {
      this.done = true;
      this.emit('finish');
    } else {
      this.emit('cleared', this.index);
      this.change(this.index + 1);
      this.emit('room', this.index);
    }
  }
  demoInput() {
    return this.game.demoInput();
  }
  retry() {
    this.change(this.index, this.game.checkpoint, this.atReturn);
    this.emit('respawn', this.game.checkpoint);
  }
  state() {
    return {
      room: this.index,
      cp: this.game.checkpoint,
      elapsed: this.elapsed,
      falls: this.falls,
      points: this.points,
      bags: this.bags.slice(),
      atReturn: this.atReturn
    };
  }
}
