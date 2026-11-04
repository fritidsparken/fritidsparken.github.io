import { GLTFLoader } from "./kaj/vendor/GLTFLoader.js";
import { addSunnyCity } from "./sunny-city.js";
import { parks, halfWidth, halfDepth } from "./model.js?v=sunny-flick-1";

const T = window.THREE;
const shared = new URL("../../assets/skatepark/shared/", import.meta.url);

async function plantAvenues(scene, loader, low) {
  const species = ["linden", "maple"];
  await Promise.all(species.map(async (name, k) => {
    const file = "trees/" + name + (low ? "-distance.glb" : "-lod.glb");
    const tree = (await loader.loadAsync(new URL(file, shared).href)).scene;
    tree.updateMatrixWorld(true);
    const placements = [];
    const count = low ? 4 : 6;
    for (const side of [-1, 1]) {
      for (let n = 0; n < count; n++) {
        const phase = (n * 2 + k + 0.45) / (count * 2);
        const stagger = Math.sin(n * 4.7 + k + side);
        placements.push([halfWidth * (2 * phase - 1), side * (halfDepth + 5 + stagger * 2)]);
        placements.push([side * (halfWidth + 4 + stagger * 1.8), halfDepth * (2 * phase - 1)]);
      }
    }
    const transform = new T.Object3D(), matrix = new T.Matrix4();
    tree.traverse(mesh => {
      if (!mesh.isMesh) return;
      const instances = new T.InstancedMesh(mesh.geometry, mesh.material, placements.length);
      placements.forEach(([x, z], index) => {
        const size = 0.75 + (1 + Math.sin(index * 2.47 + k)) * 0.14;
        transform.position.set(x, -0.10, z);
        transform.rotation.y = index * 2.4 + k;
        transform.scale.set(size, size * (1 + 0.07 * Math.cos(index)), size);
        transform.updateMatrix();
        instances.setMatrixAt(index, matrix.multiplyMatrices(transform.matrix, mesh.matrixWorld));
        instances.setColorAt(index, new T.Color().setHSL(.12 + .02 * Math.sin(index), .08, .93 + .05 * Math.cos(index)));
      });
      instances.name = "Gårdens allé · " + name;
      instances.castShadow = !low;
      scene.add(instances);
    });
  }));
}

function addCoping(scene) {
  const metal = new T.MeshStandardMaterial({
    color: 0xa7aba5, roughness: 0.37, metalness: 0.65,
    envMap: scene.background, envMapIntensity: 0.52
  });
  for (const [kind, x, z, w, d] of parks[0].shapes) {
    if (kind !== "bowl") continue;
    const points = Array.from({length: 64}, (_, i) => {
      const angle = i * Math.PI / 32;
      return new T.Vector3(x + .49*w*Math.cos(angle), .012, z + .49*d*Math.sin(angle));
    });
    const path = new T.CatmullRomCurve3(points, true);
    const rim = new T.Mesh(new T.TubeGeometry(path, 112, .046, 6, true), metal);
    rim.receiveShadow = true;
    scene.add(rim);
  }
}

function addLawn(scene, turf) {
  turf.wrapS = turf.wrapT = T.RepeatWrapping;
  turf.colorSpace = T.SRGBColorSpace;
  turf.anisotropy = 4;
  const material = new T.MeshStandardMaterial({ color: 0xb6bf8e, map: turf, roughness: 0.96 });
  for (const sign of [-1, 1]) {
    for (const [x,z,w,d] of [[sign*(halfWidth+13),0,26,halfDepth*2+12],[0,sign*(halfDepth+6),halfWidth*2,12]]) {
      const geometry = new T.PlaneGeometry(w,d);
      geometry.rotateX(-Math.PI/2);
      const uv = geometry.attributes.uv, p = geometry.attributes.position;
      for (let n=0; n<uv.count; n++) uv.setXY(n,(x+p.getX(n))/6,(z+p.getZ(n))/6);
      const lawn = new T.Mesh(geometry,material);
      lawn.position.set(x,-.05,z);
      lawn.receiveShadow = true;
      scene.add(lawn);
    }
  }
}

export async function finishSunnyPark(scene, floor, sun, quality) {
  const low = quality === "låg" || (quality === "auto" &&
    (matchMedia("(pointer:coarse)").matches || innerWidth < 700));
  const loader = new GLTFLoader(), textures = new T.TextureLoader();
  const [ground, mineral, grass] = await Promise.all([
    textures.loadAsync(new URL("./sunny/courtyard.webp", import.meta.url).href),
    textures.loadAsync(new URL("textures/cast-mineral.jpg", shared).href),
    textures.loadAsync(new URL("../downhill/art/grass.webp", import.meta.url).href)
  ]);
  // The artwork is registered to park coordinates. Retain the floor's repeatable UVs for the pores.
  ground.colorSpace = T.SRGBColorSpace;
  ground.repeat.set(5/(2*halfWidth), -5/(2*halfDepth));
  ground.offset.set(.5,.5);
  ground.anisotropy = low ? 2 : 8;
  mineral.wrapS = mineral.wrapT = T.RepeatWrapping;
  mineral.repeat.set(3.2,3.2);
  floor.material.map.dispose();
  floor.material.map = ground;
  floor.material.vertexColors = false;
  floor.material.roughness = .83;
  floor.material.bumpMap = mineral;
  floor.material.bumpScale = .0035;
  floor.material.addEventListener("dispose", () => mineral.dispose());
  floor.material.needsUpdate = true;

  const fill = scene.children.find(light => light.isHemisphereLight);
  fill.color.setHex(0xe2f0ff);
  fill.groundColor.setHex(0xb59d83);
  fill.intensity = 1.32;
  sun.color.setHex(0xffe0ac);
  sun.intensity = 2.15;
  sun.position.set(-54,59,38);
  sun.shadow.normalBias = .025;
  scene.fog.color.setHex(0xc5d4cf);
  scene.fog.density = .0048;
  addLawn(scene, grass);
  addCoping(scene);
  await Promise.all([plantAvenues(scene,loader,low), addSunnyCity(scene,loader,low)]);
}
