import { GLTFLoader } from '../kaj/vendor/GLTFLoader.js';
import { configureAlpstrandLoader } from './vendor/compression/configure.js';
import { instanceScenery } from './scenery.js';
import { alpstrand, indexCourse } from './course.js';

export async function buildAlpstrand(scene, renderer, quality) {
  const loader = new GLTFLoader();
  configureAlpstrandLoader(loader, renderer);
  const url = new URL('../../../assets/skatepark/models/alpstrand.glb?v=alpstrand1', import.meta.url);
  const elmUrl = new URL('../../../assets/skatepark/shared/trees/elm-distance.glb',import.meta.url);
  const [{scene:model},{scene:elm}] = await Promise.all([loader.loadAsync(url.href),loader.loadAsync(elmUrl.href)]);
  const course = indexCourse(model, window.THREE);
  Object.assign(alpstrand, course);
  const detail = [];
  const materials = new Set();
  const T = window.THREE;
  const vegetation = instanceScenery(model,elm,T);
  model.traverse(node => {
    if (!node.isMesh) return;
    node.receiveShadow = true;
    // The level slab receives shadows. Its coplanar triangles should never
    // shadow one another across the wide plaza.
    node.castShadow = !/RIDE_Expansion_joint_plaza|Lake_.*water|Lake_.*glints/.test(node.name);
    if (node.isInstancedMesh) node.computeBoundingSphere();
    for (const material of [].concat(node.material)) materials.add(material);
    // These fittings are sub-pixel at skating distance. Keep all rails,
    // supporting posts, colliders and rideable silhouettes at every setting.
    const name=node.name+" "+(node.parent?.name || "");
    if (/polished.?crown|anchor.?plates|fascia.?rivet|plank.?seam/i.test(name)) {
      node.geometry.computeBoundingSphere();
      const center=node.geometry.boundingSphere.center.clone().applyMatrix4(node.matrixWorld);
      detail.push({node,center});
    }
  });
  for (const m of materials) if (m.isMeshStandardMaterial) m.envMapIntensity = .52;
  scene.environment = scene.background;
  let distanceSquared, treeRange;
  const previous = new T.Vector3(Infinity,Infinity,Infinity);
  scene.userData.setAlpstrandDetail = (q, lowPower) => {
    const distance = lowPower ? 15 : q === "medel" ? 28 : 50;
    distanceSquared = distance*distance;
    treeRange = lowPower ? 28 : q === "medel" ? 55 : 90;
    previous.set(Infinity,Infinity,Infinity);
  };
  scene.userData.updateAlpstrandDetail = eye => {
    if (previous.distanceToSquared(eye) < .6) return;
    previous.copy(eye);
    vegetation(eye,treeRange);
    for (const {node,center} of detail) node.visible = center.distanceToSquared(eye) <= distanceSquared;
  };
  scene.userData.setAlpstrandDetail(quality,!renderer.shadowMap.enabled);
  scene.add(model);
}
