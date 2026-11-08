import { WORLDS, MISSIONS } from "./data.mjs";
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const SAVE_KEY = "fp-rymdaventyret-v1";
export function freshState() {
  return {
    version: 1,
    mode: "adventure",
    world: "earth",
    position: null,
    yaw: 0,
    pitch: 0,
    fuel: 100,
    energy: 100,
    shield: 100,
    health: 100,
    credits: 0,
    stars: 0,
    completed: [],
    discovered: ["earth"],
    collected: [],
    mission: null,
    step: 0,
    engine: 0,
    tank: 0,
    paint: "red",
    model: "explorer",
    wings: "standard",
    decal: "orbit",
    settings: { quality: "medium", music: 0.25, sound: 0.4, sensitivity: 1 },
    time: 0,
  };
}
export function validateSave(raw) {
  if (!raw || raw.version !== 1 || !WORLDS.some((w) => w.id === raw.world))
    throw Error("Ogiltig sparfil");
  const s = freshState();
  for (const k of ["fuel", "energy", "shield", "health"])
    s[k] = clamp(Number.isFinite(raw[k]) ? raw[k] : 100, 0, 100);
  for (const k of ["credits", "stars", "time"])
    s[k] = clamp(Number.isFinite(raw[k]) ? raw[k] : 0, 0, 1e8);
  for (const k of ["engine", "tank"])
    s[k] = clamp(Math.floor(Number.isFinite(raw[k]) ? raw[k] : 0), 0, 3);
  for (const k of ["completed", "discovered", "collected"])
    s[k] = Array.isArray(raw[k])
      ? [...new Set(raw[k].filter((x) => typeof x === "string"))].slice(0, 500)
      : s[k];
  s.completed = s.completed.filter((id) => MISSIONS.some((m) => m.id === id));
  s.discovered = s.discovered.filter((id) => WORLDS.some((w) => w.id === id));
  s.world = raw.world;
  s.mode = raw.mode === "free" ? "free" : "adventure";
  s.mission = MISSIONS.some((m) => m.id === raw.mission) && !s.completed.includes(raw.mission) ? raw.mission : null;
  s.step = clamp(
    Math.floor(Number.isFinite(raw.step) ? raw.step : 0),
    0,
    s.mission ? MISSIONS.find((m) => m.id === s.mission).steps.length - 1 : 0,
  );
  if (
    raw.position &&
    ["x", "y", "z"].every(
      (k) =>
        Number.isFinite(raw.position[k]) && Math.abs(raw.position[k]) < 1e6,
    )
  )
    s.position = { ...raw.position };
  for (const k of ["yaw", "pitch"]) s[k] = Number.isFinite(raw[k]) ? raw[k] : 0;
  s.paint = ["red", "blue", "gold", "purple"].includes(raw.paint)
    ? raw.paint
    : "red";
  s.model = ["explorer", "ranger", "comet"].includes(raw.model)
    ? raw.model
    : "explorer";
  s.wings = raw.wings === "swept" ? "swept" : "standard";
  s.decal = raw.decal === "star" ? "star" : "orbit";
  const opt = raw.settings || {};
  s.settings = {
    quality: ["low", "medium", "high"].includes(opt.quality)
      ? opt.quality
      : "medium",
    music: clamp(Number.isFinite(opt.music) ? opt.music : 0.25, 0, 1),
    sound: clamp(Number.isFinite(opt.sound) ? opt.sound : 0.4, 0, 1),
    sensitivity: clamp(
      Number.isFinite(opt.sensitivity) ? opt.sensitivity : 1,
      0.3,
      2,
    ),
  };
  return s;
}
export function readSave(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    return raw
      ? { state: validateSave(JSON.parse(raw)), error: null }
      : { state: null, error: null };
  } catch (e) {
    return {
      state: null,
      error: "Sparningen kunde inte läsas. Du kan starta ett nytt spel.",
    };
  }
}
export function writeSave(storage, state) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}
export function completeStep(s) {
  const m = MISSIONS.find((m) => m.id === s.mission);
  if (!m || s.completed.includes(m.id)) return false;
  s.step++;
  if (s.step >= m.steps.length) {
    s.completed.push(m.id);
    s.credits += m.reward;
    s.stars += 3;
    s.mission = null;
    s.step = 0;
    return m;
  }
  return false;
}
export function buyUpgrade(s, key) {
  if (!["engine", "tank"].includes(key) || s[key] >= 3) return false;
  const cost = 50 + 50 * s[key];
  if (s.credits < cost) return false;
  s.credits -= cost;
  s[key]++;
  return true;
}
export function advanceFlight(ship, input, dt, s) {
  dt = clamp(dt, 0, 0.05);
  const turn = (input.turn || 0) * s.settings.sensitivity,
    pitch = input.pitch || 0;
  ship.yaw -= turn * dt * 0.95;
  ship.pitch = clamp(ship.pitch + pitch * dt * 0.65, -1.35, 1.35);
  const boost = input.boost && s.energy > 2;
  const gas = clamp(input.gas || 0, -1, 1);
  const max = boost ? 200 + s.engine * 35 : 65 + s.engine * 15;
  const target = gas > 0 && (s.mode === "free" || s.fuel > 0) ? max * gas : 0;
  ship.speed +=
    (target - ship.speed) *
    (1 - Math.exp(-dt * (gas < 0 || input.brake ? 3.4 : 0.8)));
  if (input.brake) ship.speed *= Math.exp(-dt * 3.5);
  if (s.mode !== "free" && gas > 0 && ship.speed > 1)
    s.fuel = clamp(
      s.fuel - (dt * (boost ? 0.21 : 0.045)) / (1 + s.tank * 0.4),
      0,
      100,
    );
  s.energy = clamp(s.energy + dt * (boost ? -9 : 6), 0, 100);
  const cp = Math.cos(ship.pitch);
  ship.position.x -= Math.sin(ship.yaw) * cp * ship.speed * dt;
  ship.position.y += Math.sin(ship.pitch) * ship.speed * dt;
  ship.position.z -= Math.cos(ship.yaw) * cp * ship.speed * dt;
  return { boost, gas };
}
export function collisionResponse(ship, center, radius, s) {
  const d = dist(ship.position, center),
    safe = radius + 7;
  if (d >= safe) return false;
  const nx = (ship.position.x - center.x) / (d || 1),
    ny = (ship.position.y - center.y) / (d || 1),
    nz = (ship.position.z - center.z) / (d || 1);
  ship.position.x = center.x + (d ? nx : 1) * (safe + 0.5);
  ship.position.y = center.y + ny * (safe + 0.5);
  ship.position.z = center.z + nz * (safe + 0.5);
  if (s.mode !== "free") {
    const damage = Math.min(25, Math.abs(ship.speed) * 0.15);
    const absorbed = Math.min(damage, s.shield);
    s.shield -= absorbed;
    s.health = clamp(s.health - (damage - absorbed), 0, 100);
  }
  ship.speed *= 0.15;
  return true;
}
export function steerTo(ship, target, dt) {
  const dx = target.x - ship.position.x,
    dy = target.y - ship.position.y,
    dz = target.z - ship.position.z;
  const yaw = Math.atan2(-dx, -dz),
    pitch = Math.atan2(dy, Math.hypot(dx, dz));
  let delta = Math.atan2(Math.sin(yaw - ship.yaw), Math.cos(yaw - ship.yaw));
  ship.yaw += clamp(delta, -dt * 0.8, dt * 0.8);
  ship.pitch += clamp(pitch - ship.pitch, -dt * 0.6, dt * 0.6);
  return Math.abs(delta) < 0.2 && Math.abs(pitch - ship.pitch) < 0.2;
}
export function segmentHitsSphere(a, b, c, r) {
  const vx = b.x - a.x,
    vy = b.y - a.y,
    vz = b.z - a.z;
  const t = clamp(
    ((c.x - a.x) * vx + (c.y - a.y) * vy + (c.z - a.z) * vz) /
      (vx * vx + vy * vy + vz * vz || 1),
    0,
    1,
  );
  return dist({ x: a.x + vx * t, y: a.y + vy * t, z: a.z + vz * t }, c) < r;
}
