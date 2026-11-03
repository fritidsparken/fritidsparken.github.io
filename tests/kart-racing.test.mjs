import { createRequire } from "node:module";
import assert from "node:assert/strict";
globalThis.THREE = createRequire(import.meta.url)("../js/vendor/three.min.js");
const { tracks, powers } = await import("../games/kart-racing/circuits.js");
const { makePath } = await import("../games/kart-racing/path.js");
const { Race } = await import("../games/kart-racing/race.js");
for (const t of tracks) {
  let p = makePath(t);
  let race = new Race(p, t, {
    kart: t.id % 8,
    mode: "gp",
    laps: 3,
    level: t.id % 3,
  });
  for (let i = 0; i < 30000 && !race.finished; i++) {
    let r = race.racers[0],
      f = p.at(r.d),
      b = f.right.dot(p.at(r.d + 9).f) * 4,
      turn = Math.max(-1, Math.min(1, b * 0.65 - r.l * 0.35));
    race.step(1 / 60, { gas: true, drift: true, turn, fire: true });
  }
  assert(race.finished, t.name);
  assert.equal(race.racers[0].laps.length, 3);
  assert(race.racers.every((o) => Number.isFinite(o.d)));
  for (const item of powers) {
    race.racers[0].item = item;
    race.fire(race.racers[0]);
    assert.equal(race.racers[0].item, null);
  }
  let upMin = 1;
  for (let d = 0; d < p.length; d += 0.5) {
    let f = p.at(d);
    assert(f.up.length() > 0.98);
    upMin = Math.min(upMin, f.up.y);
  } // Verify the alternate road joins the main road near the signed lane and exits cleanly.
  let practice = new Race(p, t, { kart: 0, mode: "free", laps: 1, level: 1 }),
    driver = practice.racers[0];
  practice.t = 0;
  driver.d = p.start - 0.01;
  driver.l = 4;
  driver.v = 30;
  practice.step(1 / 60, { gas: true, turn: 0 });
  assert(driver.alt);
  driver.d = p.end - 0.01;
  practice.step(1 / 60, { gas: true, turn: 0 });
  assert(!driver.alt);
  driver.d = t.jump * p.length - 0.01;
  practice.step(1 / 60, { gas: true, turn: 0 });
  assert(driver.hop > 0);
  driver.d = p.length - 0.01;
  practice.step(1 / 60, { gas: true, turn: 0 });
  assert.equal(driver.lap, 1);
  assert(!practice.finished);
  if (t.id === 11) assert(upMin < -0.98);
  console.log(
    t.name,
    Math.round(p.length),
    race.racers[0].done.toFixed(2),
    upMin.toFixed(2),
  );
}
