// CPU scene/asset integration tests. Deliberately no claims of GPU rendering.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  T = require("../js/vendor/three.min.js");
globalThis.window = { THREE: T, addEventListener() {} };
globalThis.self = globalThis;
// GLTF embedded images are checked separately; this CPU test needs an image adapter.
globalThis.createImageBitmap = async () => ({ width: 512, height: 512, close() {} });
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
globalThis.devicePixelRatio = 1;
globalThis.document = {
  createElement() {
    return {
      width: 1,
      height: 1,
      getContext() {
        return {
          createRadialGradient() {
            return { addColorStop() {} };
          },
          fillRect() {},
        };
      },
    };
  },
};
class TestRenderer {
  constructor() {
    this.shadowMap = {};
    this.capabilities = { getMaxAnisotropy: () => 8 };
    this.info = { render: {} };
  }
  setPixelRatio() {}
  setSize() {}
  getDrawingBufferSize(v) {
    v.set(1280, 720);
  }
  setRenderTarget() {}
  render(s, c) {
    s.updateMatrixWorld();
    c.updateMatrixWorld();
  }
  setClearColor() {}
}
T.WebGLRenderer = TestRenderer;
T.TextureLoader.prototype.load = function (url, onLoad) {
  const t = new T.Texture();
  queueMicrotask(() => onLoad?.(t));
  return t;
};
const { GLTFLoader } = await import(
  "../games/rymdaventyret/vendor/GLTFLoader.js"
);
GLTFLoader.prototype.loadAsync = async function (url) {
  const b = await fs.readFile(
    new URL(url, new URL("../games/rymdaventyret/", import.meta.url)),
  );
  return this.parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    "",
  );
};
const { SpaceRenderer } = await import("../games/rymdaventyret/render.mjs");
const { WORLDS, arrival } = await import("../games/rymdaventyret/data.mjs");
const r = new SpaceRenderer({}, "medium");
await r.load(() => {});
test("real GLBs import, animate and attach to complete planetary scene", () => {
  assert.equal(r.planets.size, 11);
  assert.equal(r.stations.length, 4);
  assert.ok(r.mixers.length === 2);
  assert.equal(r.rockBounds.length, 1170);
  r.assets.rocket.traverse((o) => {
    if (o.isMesh) assert.ok(o.geometry.attributes.position.count > 0);
  });
});
test("all worlds and five cameras produce finite transforms", () => {
  for (const b of WORLDS) {
    for (let cameraMode = 0; cameraMode < 5; cameraMode++) {
      const ship = {
        position: arrival(b, 60),
        yaw: 0.2,
        pitch: 0.1,
        speed: 35,
      };
      r.update(0.016, ship, 60, { cameraMode });
      assert.ok(r.camera.matrixWorld.elements.every(Number.isFinite));
      assert.ok(r.rocket.matrixWorld.elements.every(Number.isFinite));
      assert.ok(r.goal.matrixWorld.elements.every(Number.isFinite));
    }
  }
});
test("cockpit hides pilot head while external camera restores it", () => {
  const ship = { position: arrival(WORLDS[2]), yaw: 0, pitch: 0, speed: 0 };
  r.update(0.016, ship, 0, { cameraMode: 2 });
  assert.equal(r.assets.rocket.getObjectByName("PilotHead").visible, false);
  r.update(0.016, ship, 0, { cameraMode: 0 });
  assert.equal(r.assets.rocket.getObjectByName("PilotHead").visible, true);
});
test("all landing worlds build finite ground and rover transforms then return to orbit", () => {
  for (const b of WORLDS.filter((w) => w.land)) {
    r.makeSurface(b);
    for (let i = 0; i < 5; i++) {
      let x = i * 20,
        z = -i * 12;
      r.update(
        0.016,
        {
          position: { x, y: r.terrainHeight(x, z, b.id) + 1.2, z },
          yaw: 0.3,
          pitch: 0,
          speed: 10,
        },
        0,
        { cameraMode: 0, rover: true },
      );
      assert.ok(r.rover.matrixWorld.elements.every(Number.isFinite));
    }
    assert.ok(r.surfaceRoot.visible);
    assert.ok(!r.spaceRoot.visible);
    r.clearSurface();
    assert.ok(r.spaceRoot.visible);
    assert.equal(r.surfaceRoot.children.length, 0);
  }
});
test("quality and customization apply to both rocket LODs without changing rules", () => {
  for (const q of ["low", "medium", "high"]) {
    r.setQuality(q);
    assert.equal(r.assets.rocketLow.visible, q === "low");
    assert.equal(r.assets.rocket.visible, q !== "low");
  }
  r.setPaint("blue", "ranger", "swept");
  for (const root of [r.assets.rocket, r.assets.rocketLow]) {
    assert.equal(root.getObjectByName("WingLeft").scale.x, 1.2);
    let mat;
    root.traverse((o) => {
      if (o.material?.name === "Crimson enamel") mat = o.material;
    });
    assert.equal(mat.color.getHex(), 0x246fce);
  }
});
test("mission marker variants update safely in local origin coordinates", () => {
  for (const type of [
    "gate",
    "repair",
    "rescue",
    "sample",
    "collect",
    "photo",
    "dock",
    "land",
  ]) {
    r.setGoal({ x: 50, y: 20, z: 0 }, type);
    r.update(
      0.016,
      { position: { x: 20, y: 10, z: 5 }, yaw: 0, pitch: 0, speed: 0 },
      0,
      { cameraMode: 0 },
    );
    assert.deepEqual(r.goal.position.toArray(), [30, 10, -5]);
  }
  r.setGoal(null, "");
  assert.equal(r.goal.visible, false);
});

test('photo camera remains movable while world simulation is paused', () => {
  const ship = {position:arrival(WORLDS[2]),yaw:0,pitch:0,speed:0};
  r.clearSurface();r.orbit.yaw=0;r.lastCamera=false;
  r.update(0,ship,0,{cameraMode:4,cameraDt:.016});
  const before=r.camera.position.clone();r.orbit.yaw=1;
  r.update(0,ship,0,{cameraMode:4,cameraDt:.1});
  assert.ok(r.camera.position.distanceTo(before)>1);
});
test('Mars rover camera clears terrain and rescue uses the actual rover model', () => {
  const b=WORLDS.find(b=>b.id==='mars');r.makeSurface(b);
  for(const [x,z] of [[180,100],[-120,-190],[350,-300]]){
    const ship={position:{x,y:r.terrainHeight(x,z,b.id)+1.2,z},yaw:1,pitch:0,speed:10};
    r.update(.016,ship,0,{rover:true,cameraMode:0});
    assert.ok(r.camera.position.y>=r.terrainHeight(r.camera.position.x,r.camera.position.z,b.id)+3);
    assert.ok(Math.abs(r.rover.rotation.x)<Math.PI/2);
  }
  r.setGoal({x:180,y:10,z:100},'rescue');
  assert.ok(r.goalRover.visible);assert.equal(r.goalStation.visible,false);
  assert.ok(Math.abs(r.terrainHeight(0,0,'mars'))<1e-8);assert.ok(Math.abs(r.terrainHeight(25,0,'mars'))<1e-8);
  assert.ok(r.assets.rocket.getObjectByName('LandingGear').visible);
  r.clearSurface();r.update(.016,{position:arrival(b),yaw:0,pitch:0,speed:10},0,{});
  assert.equal(r.assets.rocket.getObjectByName('LandingGear').visible,false);
});
test('sustained low frame rate reduces pixel load within a fixed floor',()=>{
  r.setQuality('high');r.adaptResolution(24);assert.equal(r.resolutionScale,1);
  r.adaptResolution(24);assert.ok(r.resolutionScale<1);
  for(let i=0;i<30;i++)r.adaptResolution(15);
  assert.equal(r.resolutionScale,.6);
  r.setQuality('medium');assert.equal(r.resolutionScale,1);
});
