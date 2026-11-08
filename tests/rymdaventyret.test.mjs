import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PLANETS,
  WORLDS,
  MISSIONS,
  worldPosition,
  arrival,
} from "../games/rymdaventyret/data.mjs";
import {
  freshState,
  validateSave,
  readSave,
  writeSave,
  completeStep,
  buyUpgrade,
  advanceFlight,
  collisionResponse,
  steerTo,
  segmentHitsSphere,
  dist,
} from "../games/rymdaventyret/systems.mjs";
test("eight planets and three solid landing moons with safe arrival points", () => {
  assert.equal(PLANETS.length, 8);
  assert.equal(WORLDS.length, 11);
  for (const b of WORLDS) {
    const p = worldPosition(b, 20000);
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(dist(p, arrival(b, 20000)) > b.r + 7);
  }
  for (const id of ["venus", "jupiter", "saturn", "uranus", "neptune"])
    assert.ok(!WORLDS.find((w) => w.id === id).land);
});
test("frame-rate independent acceleration and fuel consumption", () => {
  function sim(fps) {
    const state = freshState(),
      ship = { position: { x: 0, y: 0, z: 1000 }, yaw: 0, pitch: 0, speed: 0 };
    for (let i = 0; i < fps * 10; i++)
      advanceFlight(ship, { gas: 1 }, 1 / fps, state);
    return { state, ship };
  }
  const a = sim(30),
    b = sim(60);
  assert.ok(Math.abs(a.ship.position.z - b.ship.position.z) / Math.abs(b.ship.position.z - 1000) < 0.001);
  assert.ok(a.state.fuel < 100);
  assert.ok(Math.abs(a.state.fuel - b.state.fuel) < 0.02);
});
test("right steering points right; pitch up gains altitude; braking stops", () => {
  const s = freshState(),
    ship = { position: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, speed: 0 };
  for (let i = 0; i < 100; i++)
    advanceFlight(ship, { gas: 1, turn: 1, pitch: 1 }, 0.016, s);
  assert.ok(ship.position.x > 0);
  assert.ok(ship.position.y > 0);
  for (let i = 0; i < 150; i++) advanceFlight(ship, { brake: true }, 0.016, s);
  assert.ok(ship.speed < 0.01);
});
test("boost spends energy and free exploration consumes no fuel", () => {
  const s = freshState();
  s.mode = "free";
  const ship = { position: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, speed: 20 };
  for (let i = 0; i < 60; i++)
    advanceFlight(ship, { gas: 1, boost: true }, 1 / 60, s);
  assert.equal(s.fuel, 100);
  assert.ok(s.energy < 100);
  assert.ok(ship.speed > 65);
});
test("collision keeps ship outside world; shield absorbs impact; free mode safe", () => {
  const s = freshState(),
    ship = { position: { x: 10, y: 0, z: 0 }, speed: 100 };
  assert.ok(collisionResponse(ship, { x: 0, y: 0, z: 0 }, 100, s));
  assert.ok(ship.position.x > 107);
  assert.ok(s.shield < 100);
  assert.equal(s.health, 100);
  s.mode = "free";
  ship.position = { x: 1, y: 0, z: 0 };
  const hp = s.shield;
  collisionResponse(ship, { x: 0, y: 0, z: 0 }, 100, s);
  assert.equal(s.shield, hp);
});
test("route intersection and steering avoid the long rotation path", () => {
  assert.ok(
    segmentHitsSphere(
      { x: -20, y: 0, z: 0 },
      { x: 20, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      5,
    ),
  );
  assert.ok(
    !segmentHitsSphere(
      { x: -20, y: 10, z: 0 },
      { x: 20, y: 10, z: 0 },
      { x: 0, y: 0, z: 0 },
      5,
    ),
  );
  const ship = {
    position: { x: 0, y: 0, z: 0 },
    yaw: Math.PI - 0.01,
    pitch: 0,
  };
  steerTo(ship, { x: 0.1, y: 0, z: 100 }, 0.05);
  assert.ok(ship.yaw > Math.PI - 0.01);
});
test("every expedition completes once and pays its documented reward", () => {
  for (const m of MISSIONS) {
    const s = freshState();
    s.mission = m.id;
    for (let i = 0; i < m.steps.length; i++) completeStep(s);
    assert.ok(s.completed.includes(m.id));
    assert.equal(s.credits, m.reward);
    assert.equal(s.stars, 3);
    s.mission = m.id;
    completeStep(s);
    assert.equal(s.credits, m.reward);
  }
});
test("all mission targets refer to worlds and surface objectives are on landable worlds", () => {
  for (const m of MISSIONS) {
    const b = WORLDS.find((w) => w.id === m.world);
    assert.ok(b);
    if (m.steps.some((s) => s[0] === "land" || s[0] === "sample"))
      assert.ok(b.land);
  }
});
test("upgrades require currency and stop at maximum level", () => {
  const s = freshState();
  assert.equal(buyUpgrade(s, "engine"), false);
  s.credits = 300;
  assert.ok(buyUpgrade(s, "engine"));
  assert.ok(buyUpgrade(s, "engine"));
  assert.ok(buyUpgrade(s, "engine"));
  assert.equal(s.credits, 0);
  assert.equal(s.engine, 3);
  assert.equal(buyUpgrade(s, "engine"), false);
  assert.equal(buyUpgrade(s, "health"), false);
});
test("save corruption and unavailable storage never crash game", () => {
  assert.equal(readSave({ getItem: () => "{bad" }).state, null);
  assert.ok(
    readSave({
      getItem: () => {
        throw Error("blocked");
      },
    }).error,
  );
  assert.equal(
    writeSave(
      {
        setItem: () => {
          throw Error("quota");
        },
      },
      freshState(),
    ),
    false,
  );
  assert.throws(() => validateSave({ version: 999, world: "earth" }));
  const s = validateSave({
    ...freshState(),
    fuel: 900,
    health: -5,
    settings: { music: 7, sound: -1 },
    position: { x: Infinity, y: 0, z: 0 },
  });
  assert.equal(s.fuel, 100);
  assert.equal(s.health, 0);
  assert.equal(s.position, null);
  assert.equal(s.settings.music, 1);
});
test("progress round trips without losing upgrades, discovery or active objective", () => {
  const s = freshState();
  Object.assign(s, {
    mission: "rings",
    step: 2,
    credits: 99,
    engine: 2,
    world: "saturn",
    completed: ["school"],
    discovered: ["earth", "saturn"],
  });
  const store = {
    v: null,
    setItem(k, v) {
      this.v = v;
    },
    getItem() {
      return this.v;
    },
  };
  assert.ok(writeSave(store, s));
  assert.deepEqual(readSave(store).state, s);
});
test("every planet texture is a binary image and required model exports exist", () => {
  for (const b of PLANETS) {
    const p = new URL(
      "../assets/space/textures/" + b.id + ".jpg",
      import.meta.url,
    );
    const bytes = fs.readFileSync(p);
    assert.equal(bytes[0], 255);
    assert.equal(bytes[1], 216);
  }
  for (const p of [
    "rocket/rocket-high.glb",
    "rocket/rocket-low.glb",
    "stations/orbital-station.glb",
    "vehicles/moon-rover.glb",
    "terrain/landing-base.glb",
    "asteroids/asteroid-library.glb",
    "materials/crystal.glb",
  ]) {
    const bytes = fs.readFileSync(
      new URL("../assets/space/" + p, import.meta.url),
    );
    assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  }
});

test('malformed numeric fields and completed active missions cannot poison resumed state',()=>{
  const s=validateSave({...freshState(),engine:'broken',tank:NaN,step:'broken',mission:'school',completed:['school','school']});
  assert.equal(s.engine,0);assert.equal(s.tank,0);assert.equal(s.step,0);assert.equal(s.mission,null);assert.deepEqual(s.completed,['school']);
});

// Verify reachable speed, not just the configured cap, for all purchased engines.
test("fivefold cruise and turbo are reachable and emergency braking stops the fastest ship", () => {
  for (let engine = 0; engine <= 3; engine++) {
    for (const boost of [false, true]) {
      const state = freshState(); state.engine = engine;
      const ship = { position: {x:0,y:0,z:0}, yaw:0, pitch:0, speed:0 };
      const expected = 5 * (boost ? 200 + engine * 35 : 65 + engine * 15);
      for (let i=0; i<600; i++) advanceFlight(ship,{gas:1,boost},1/60,state);
      assert.ok(ship.speed > expected * .999 && ship.speed <= expected);
      for (let i=0; i<120; i++) advanceFlight(ship,{brake:true},1/60,state);
      assert.ok(ship.speed < .01, "stabilizer stops upgraded turbo in two seconds");
    }
  }
});
