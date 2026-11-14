"use strict";

function savePillarLanding() {
  if (!bridge.onGround) return;
  const index = bridge.checkpoint ? bridge.checkpoint.index + 1 : 0;
  const pit = bridge.pits[index];
  if (!pit || bridge.d < pit.end) return;
  bridge.checkpoint = {
    index,
    d: bridge.d,
    x: bridge.x,
    time: bridge.time,
    total: bridge.total,
    points: bridge.points,
    collected: bridge.coins.map(c => c.taken),
    rocks: bridge.rocks.map(r => ({
      ...r
    })),
    traps: bridge.hazards.map(h => ({
      open: h.open,
      broken: h.broken
    }))
  };
  bridge.checkpointNotice = bridge.time + 1.8;
}
function respawnChase() {
  const saved = bridge.checkpoint;
  if (!saved) {
    resetBridge();
    return;
  }
  resetBridge();
  Object.assign(bridge, {
    checkpoint: saved,
    d: saved.d,
    furthest: saved.d,
    x: saved.x,
    cam: saved.x * .34,
    time: saved.time,
    total: saved.total,
    points: saved.points,
    checkpointNotice: saved.time + 1.8,
    rocks: saved.rocks.map(r => ({
      ...r
    }))
  });
  bridge.coins.forEach((c, i) => {
    c.taken = saved.collected[i];
  });
  bridge.hazards.forEach((h, i) => Object.assign(h, saved.traps[i]));
  updateChaseHud();
}
function resetBridge(level = bridge.level) {
  bridge.level = clamp(level, 0, 9);
  bridgeKeys.clear();
  resetBridgeStick();
  Object.assign(bridge, {
    d: 0,
    x: 0,
    y: 0,
    vy: 0,
    jumps: 0,
    time: 0,
    phase: 0,
    cam: 0,
    step: -1,
    done: false,
    death: 0,
    boostAt: null,
    checkpoint: null,
    checkpointNotice: 0,
    furthest: 0,
    started: false,
    travelX: 0,
    travelZ: 0,
    facing: 0,
    moving: false,
    gap: 6.3,
    rockX: 0,
    rockTravel: 0,
    stun: 0,
    pickTime: -10,
    total: 0,
    pickups: [],
    points: 0,
    combo: 0,
    lastPickup: -99,
    cause: '',
    onGround: true,
    ...buildCourse()
  });
  $('bridgeEnd').hidden = true;
  $('bridgeHud').hidden = false;
  updateChaseHud();
}
function updateChaseHud() {
  const el = $('bridgeHud');
  const name = bridge.level + 1 + ' / 10 · ' + course()[0];
  if (el.querySelector('small').textContent !== name) el.querySelector('small').textContent = name;
  const count = bridge.total - bridge.pickups.filter(f => bridge.time - f.start < .8).length;
  const label = count + ' / ' + bridge.coins.length;
  if (el.querySelector('b').textContent !== label) el.querySelector('b').textContent = label;
}
let loadEpoch = 0;
async function startTerrainFrames() {
  const epoch = ++loadEpoch;
  cancelAnimationFrame(bridgeHandle);
  $('bridgeNote').textContent = 'Öppnar ' + course()[0] + ' …';
  await new Promise(ok => requestAnimationFrame(ok));
  await Promise.all(Object.entries(bridgeArt).filter(([k]) => /^(vista|side|flip|run|turn|idle|skyline|banana|canopy|frond|grass|bark|stone|moss|mud|seal|cloth|cap|rockSkin|paving)/.test(k)).map(([, im]) => im.decode().catch(() => {})));
  if (!bridge.active || epoch !== loadEpoch || !worldRenderer) return;
  worldRenderer.prepare();
  bridgeStamp = 0;
  bridgeHandle = requestAnimationFrame(bridgeFrame);
}
function startBridge(afterIntro = false) {
  if (!jungleOpen || Number($('jungleStage').value) > jungleRecord.next) return;
  if (!afterIntro && ready && !bridge.resume && !Number($('jungleStage').value)) {
    if (!open3D()) {
      alert('Djungelns jakt behöver WebGL.');
      return;
    }
    beginStory(true);
    return;
  }
  if (!ready) return;
  if (!open3D()) {
    alert('Djungelns jakt behöver WebGL. Aktivera grafikacceleration i webbläsaren och öppna spelet igen.');
    return;
  }
  if (!bridge.resume || bridge.done) resetBridge(Number($('jungleStage').value) || 0);
  bridge.resume = false;
  bridge.active = true;
  bridgeView.hidden = false;
  menu.hidden = true;
  $('app').inert = true;
  theme.pause();
  paused = false;
  clearInput();
  bridgeKeys.clear();
  resetBridgeStick();
  bridgeStamp = 0;
  bridgeCanvas.focus({
    preventScroll: true
  });
  prepareScore();
  startEffects();
  scoreWanted = true;
  syncScore();
  startTerrainFrames();
}
function hideBridge() {
  loadEpoch++;
  stopRoll();
  cancelAnimationFrame(bridgeHandle);
  bridge.active = false;
  bridge.resume = !bridge.done;
  bridgeView.hidden = true;
  bridgeKeys.clear();
  resetBridgeStick();
}
function bridgeJump() {
  bridge.boostAt = null;
  if (bridge.active && !bridge.done && !bridge.death && bridge.y > -.10 && bridge.jumps < 2 && bridge.stun < .38) {
    const from = bridge.jumps ? flipProgress() : 0;
    bridge.spinFrom = from;
    bridge.spinTo = Math.floor(from) + 1 + (bridge.jumps ? 1 : 0);
    bridge.spinTime = bridge.time;
    bridge.spinDuration = (4.75 + Math.sqrt(4.75 ** 2 + 24 * Math.max(0, bridge.y))) / 12;
    bridge.vy = 4.75;
    bridge.jumps++;
    actionSound(bridge.jumps === 1 ? 'jump' : 'boost');
  }
}
function finishChase() {
  bridge.done = true;
  stopRoll();
  quietScore();
  playEffect('finish', .84);
  jungleRecord.best[bridge.level] = Math.max(jungleRecord.best[bridge.level], bridge.total);
  jungleRecord.next = Math.max(jungleRecord.next, Math.min(9, bridge.level + 1));
  try {
    localStorage.setItem(saveKey, JSON.stringify(jungleRecord));
  } catch {}
  fillChaseStages(jungleRecord.next);
  const last = bridge.level === 9;
  if (last) unlockMoon();
  $('chaseTitle').textContent = last ? 'Ut ur Soltemplet' : course()[0] + ' klar';
  $('chaseResult').textContent = bridge.total + ' av ' + bridge.coins.length + ' solmynt · Personbästa ' + jungleRecord.best[bridge.level];
  $('nextChase').textContent = last ? 'Vidare till Månens djup' : 'Nästa · ' + jungleCourses[bridge.level + 1][0];
  $('bridgeEnd').hidden = true;
  const completedLevel=bridge.level;
  setTimeout(()=>{if(!bridge.active||!bridge.done||bridge.level!==completedLevel)return;if(last)location.assign('moon.html?from=jungle');else replayCourse(completedLevel+1);},650);
}
function stepBridge(dt) {
  if (bridge.done) return;
  const speed = course()[2];
  if (bridge.death) {
    bridge.death += dt;
    if (bridge.cause === 'pit') bridge.y -= dt * 4;else {
      advanceRocks(dt, true);
    }
    if (bridge.death > 1.7) respawnChase();
    return;
  }
  if (bridge.boostAt != null && bridge.time >= bridge.boostAt) {
    bridge.boostAt = null;
    if (bridge.jumps === 1) bridgeJump();
  }
  const previous = {
    d: bridge.d,
    x: bridge.x,
    y: bridge.y
  };
  bridge.time += dt;
  bridge.stun = Math.max(0, bridge.stun - dt);
  const dx = bridgeAxis + Number(bridgeKeys.has('right')) - Number(bridgeKeys.has('left'));
  const dz = bridgeForward + Number(bridgeKeys.has('forward')) - Number(bridgeKeys.has('back'));
  const ease = 1 - Math.exp(-dt * 30),
    slow = bridge.stun > 0 ? .33 : 1;
  bridge.travelX += (clamp(dx, -1, 1) - bridge.travelX) * ease;
  bridge.travelZ += (clamp(dz, -1, 1) - bridge.travelZ) * ease;
  if (!dx && Math.abs(bridge.travelX) < .015) bridge.travelX = 0;
  if (!dz && Math.abs(bridge.travelZ) < .015) bridge.travelZ = 0;
  bridge.d = clamp(bridge.d + bridge.travelZ * speed * dt * slow, 0, course()[1]);
  bridge.x = clamp(bridge.x + bridge.travelX * 4.1 * dt * slow, -1.94, 1.94);
  const moved = Math.hypot(bridge.d - previous.d, bridge.x - previous.x);
  bridge.moving = moved > dt * .09;
  bridge.started ||= bridge.moving;
  if (bridge.moving) {
    const target = Math.atan2(bridge.x - previous.x, bridge.d - previous.d),
      delta = target - bridge.facing;
    bridge.facing += Math.atan2(Math.sin(delta), Math.cos(delta)) * (1 - Math.exp(-dt * 15));
    bridge.facing = Math.atan2(Math.sin(bridge.facing), Math.cos(bridge.facing));
  }
  bridge.phase += moved * .48;
  bridge.furthest = Math.max(bridge.furthest, bridge.d);
  bridge.cam += (bridge.x * .34 - bridge.cam) * (1 - Math.exp(-dt * 7));
  const oldY = bridge.y;
  if (!bridge.onGround && bridge.jumps) bridge.y += supportY(previous.d, previous.x) - supportY(bridge.d, bridge.x);
  bridge.vy -= 12 * dt;
  bridge.y += bridge.vy * dt;
  bridge.onGround = bridge.vy <= 0 && oldY >= -.001 && bridge.y <= 0 && groundAt(bridge.d, bridge.x);
  if (bridge.y < -.72) {
    bridge.death = .001;
    bridge.cause = 'pit';
    playEffect('death', .4);
    return;
  }
  if (bridge.onGround) {
    if (bridge.jumps) playEffect('land', .29);
    bridge.jumps = 0;
    bridge.y = bridge.vy = 0;
    const step = Math.floor(bridge.phase * 2);
    if (bridge.moving && bridge.step !== step) {
      bridge.step = step;
      playEffect('stone' + step % 3, .37);
    }
  }
  for (const ob of bridge.hazards) {
    if (Math.abs(ob.s - bridge.d) > ob.extent * .5 + .55) ob.hit = false;
    if (ob.type === 'gap' || ob.hit || bridge.d < ob.s - ob.extent * .5 || bridge.d > ob.s + ob.extent * .5 || bridge.x < ob.l - .11 || bridge.x > ob.r + .11) continue;
    if (ob.type === 'hatch') {
      if (!ob.open && bridge.onGround && bridge.x > ob.l && bridge.x < ob.r) {
        ob.open = true;
        bridge.death = .001;
        bridge.cause = 'pit';
        playEffect('slam', .42);
        return;
      }
      continue;
    }
    if (ob.type === 'web') {
      if (!ob.broken && bridge.y < 1.7) {
        ob.broken = true;
        bridge.stun = .85;
        playEffect('land', .22);
      }
      continue;
    }
    if (ob.type === 'spikes') {
      const height = spikeHeight(ob.s, bridge.time);
      if (height > .13 && bridge.y < height) {
        bridge.death = .001;
        bridge.cause = 'spikes';
        playEffect('death', .45);
        return;
      }
      continue;
    }
    if (bridge.y > (ob.type === 'gap' ? .10 : ob.type === 'log' ? .44 : .57)) continue;
    ob.hit = true;
    bridge.stun = 1.14;
    playEffect('land', .64, undefined, .64);
  }
  if (bridge.started) advanceRocks(dt);
  if (bridge.death) return;
  bridge.pickups = bridge.pickups.filter(f => bridge.time - f.start <= 1.1);
  const pickupView = jungleView();
  for (const [i, c] of bridge.coins.entries()) {
    if (c.taken || !coinContact(c, i, pickupView, previous)) continue;
    c.taken = true;
    bridge.total++;
    bridge.combo = bridge.time - bridge.lastPickup <= 7 ? Math.min(5, bridge.combo + 1) : 1;
    bridge.points += bridge.combo;
    bridge.lastPickup = bridge.pickTime = bridge.time;
    const view = pickupView,
      [x, y] = view.proj(c.s, c.x, c.y);
    bridge.pickups.push({
      room: 0,
      start: bridge.time,
      x: x / view.unit,
      y: y / view.unit,
      hitX: x / view.unit,
      hitY: y / view.unit,
      combo: bridge.combo
    });
    pickupChime(bridge.combo);
    updateChaseHud();
  }
  savePillarLanding();
  if (bridge.d >= course()[1]) finishChase();
}
function bridgeFrame(now) {
  if (!bridge.active) return;
  const dt = Math.min(.08, bridgeStamp ? (now - bridgeStamp) / 1000 : 0);
  bridgeStamp = now;
  for (let left = dt; left > 0; left -= 1 / 120) stepBridge(Math.min(left, 1 / 120));
  if (bridge.started && !bridge.done && bridge.gap < 30) rollAudio();else stopRoll();
  paintBridge();
  bridgeHandle = requestAnimationFrame(bridgeFrame);
}
function spikeHeight(s, time) {
  const t = (time + s * .19) % 3.1;
  return .70 * Math.min(clamp((t - .85) / .26, 0, 1), clamp((2.67 - t) / .52, 0, 1));
}
function groundAt(s, x) {
  const pit = bridge.pits.find(p => s > p.start && s < p.end);
  if (pit) return pit.pads.some(p => (p.s - s) ** 2 + (trailCentre(s) + x - trailCentre(p.s) - p.x) ** 2 <= p.r * p.r);
  return !bridge.hazards.some(o => (o.type === 'gap' || o.open) && Math.abs(s - o.s) < o.extent * .5 && x > o.l && x < o.r);
}
function branchX(branch, s) {
  const t = clamp((s - branch.start) / 7, 0, 1);
  return branch.side * 8 * (1 - t) * (1 - t);
}
function branchDistance(x, z) {
  const route = bridge.rocks?.[1]?.branch;
  if (!route || z < route.start - 3 || z > route.start + 9) return 99;
  const local = x - trailCentre(z);
  let distance = 99;
  for (let i = 0; i < 6; i++) {
    const a = route.start + i * 7 / 6,
      b = a + 7 / 6,
      ax = branchX(route, a),
      dx = branchX(route, b) - ax,
      dz = b - a;
    const t = clamp(((local - ax) * dx + (z - a) * dz) / (dx * dx + dz * dz), 0, 1);
    distance = Math.min(distance, Math.hypot(local - ax - dx * t, z - a - dz * t));
  }
  return distance;
}
function advanceRocks(dt, afterCatch = false) {
  for (const rock of bridge.rocks) {
    if (bridge.furthest < rock.trigger || rock.stopped) continue;
    if (rock.fall) {
      rock.fall += dt;
      rock.s += rock.fallSpeed * dt * Math.exp(-3 * rock.fall);
      rock.travel += rock.fallSpeed * dt;
      if (rock.fall > 1.18) {
        rock.stopped = true;
        playEffect('slam', .28);
      }
      continue;
    }
    const speed = course()[2];
    let velocity = speed * .88;
    if (rock.entering) {
      const slope = -16 / 7 * rock.branch.side * (1 - clamp((rock.s - rock.branch.start) / 7, 0, 1));
      velocity = speed * 1.38 / Math.hypot(1, slope);
    }
    const next = rock.s + velocity * dt;
    const x = rock.entering ? branchX(rock.branch, next) : 0;
    let limit = next;
    for (const p of bridge.pits) {
      const stop = p.start;
      if (rock.s <= stop && next >= stop) limit = Math.min(limit, stop);
    }
    const lateral = trailCentre(limit) + x - trailCentre(rock.s) - rock.x,
      forward = limit - rock.s;
    rock.travel += Math.hypot(lateral, forward);
    rock.heading = Math.atan2(lateral, forward);
    rock.s = limit;
    rock.x = x;
    if (rock.entering && limit >= rock.branch.start + 7) rock.entering = false;
    if (limit < next) {
      rock.fall = .00001;
      rock.fallSpeed = velocity * .84;
      rock.rimY = terrainY(trailCentre(limit) + x, limit);
    }
  }
  const active = bridge.rocks.filter(r => !r.fall && !r.stopped && bridge.furthest >= r.trigger).sort((a, b) => Math.abs(b.s - bridge.d) - Math.abs(a.s - bridge.d));
  const chasing = active[active.length - 1];
  bridge.gap = chasing ? bridge.d - chasing.s : 99;
  bridge.rockTravel = chasing?.travel || 0;
  if (!afterCatch && chasing && Math.abs(bridge.gap) < 1.38 && Math.abs(bridge.x - chasing.x) < 1.28) {
    bridge.death = .001;
    bridge.cause = 'rock';
    playEffect('slam', .65);
  }
}

