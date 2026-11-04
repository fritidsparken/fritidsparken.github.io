import {hash, seedNumber} from '../world/terrain.js';

const RANGE = 45;
const CELL = 5;
// Probability, then weighted large and small species for each biome.
const HABITATS = [
  [.72, ['oak','oak','pine'], ['flowers','shrub','log','roots']],
  [.90, ['pine','pine','pine','oak'], ['mushroom','roots','log','shrub']],
  [.78, ['oak'], ['flowers','log','shrub','roots']],
  [.28, ['pine'], ['rocks','rocks','shrub']],
  [.19, ['pine'], ['rocks','rocks','log']],
  [.12, ['palm'], ['rocks','roots']],
  [.89, ['palm','palm','oak'], ['shrub','flowers','roots','log']],
  [.36, ['oak','palm'], ['flowers','roots','rocks']],
  [.74, ['oak'], ['reeds','reeds','shrub','mushroom','log']],
  [.23, ['palm'], ['reeds','rocks','log']],
  [0, [], []],
  [.86, ['oak','pine','mushroom'], ['mushroom','flowers','shrub','roots']]
];

export function createLandscape({scene, kit, world, seed, legacy = false, removed = new Set()}) {
  const THREE = globalThis.THREE;
  const number = typeof seed === 'number' ? seed : seedNumber(seed);
  const dummy = new THREE.Object3D();
  const templates = new Map();
  const batches = [];
  let lastCheck = -Infinity, signature = '', lastX = 0, lastZ = 0;
  function clear() {
    for (const mesh of batches) {
      scene.remove(mesh);
      // InstancedMesh owns its instance buffers, but kit owns the shared geometry/materials.
      mesh.dispose?.();
    }
    batches.length = 0;
  }
  function rebuild(x, z) {
    const groups = new Map();
    for (let cz = Math.floor((z-RANGE)/CELL); cz <= Math.floor((z+RANGE)/CELL); cz++) {
      for (let cx = Math.floor((x-RANGE)/CELL); cx <= Math.floor((x+RANGE)/CELL); cx++) {
        const wx = cx*CELL + Math.floor(hash(cx,cz,number+1)*CELL);
        const wz = cz*CELL + Math.floor(hash(cx,cz,number+2)*CELL);
        if ((wx+.5-x)**2 + (wz+.5-z)**2 > RANGE**2 || wx*wx+wz*wz < 16) continue;
        if (legacy && wx >= -13 && wx < 13 && wz >= -13 && wz < 13) continue;
        const key = wx + ',' + wz;
        if (removed.has(key) || !world.chunks.has(Math.floor(wx/16)+','+Math.floor(wz/16))) continue;
        const {height, biome} = world.info(wx,wz);
        const [density, trees, cover] = HABITATS[biome];
        const chance = hash(cx,cz,number+3);
        if (chance >= density || height+1 < 21) continue;
        const surface = world.surface(wx,wz);
        if (surface !== height+1) continue; // Never sprout on a player's building or inside a dug pit.
        const family = hash(cx,cz,number+4) < (biome===5 ? .06 : .43) ? trees : cover;
        const id = family[Math.floor(hash(cx,cz,number+5)*family.length)];
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push({key,x:wx,z:wz,y:surface,id,angle:hash(cx,cz,number+6)*Math.PI*2,scale:.73+hash(cx,cz,number+7)*.58});
      }
    }
    clear();
    for (const [id, instances] of groups) {
      if (!templates.has(id)) templates.set(id,kit.create(id));
      for (const part of templates.get(id).children) {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, instances.length);
        mesh.name = 'Biom • '+id;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        instances.forEach((plant, index) => {
          dummy.position.set(plant.x+.5, plant.y, plant.z+.5);
          dummy.rotation.set(0,plant.angle,0);
          dummy.scale.setScalar(plant.scale);
          dummy.updateMatrix();
          mesh.setMatrixAt(index,dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere?.();
        mesh.userData.plants = instances;
        scene.add(mesh);
        batches.push(mesh);
      }
    }
  }
  function update(x,z,force=false) {
    const now = performance.now();
    lastX=x; lastZ=z;
    if (!force && now-lastCheck < 240) return;
    lastCheck=now;
    const nearby = [];
    for (let cz=Math.floor((z-RANGE)/16);cz<=Math.floor((z+RANGE)/16);cz++) {
      for (let cx=Math.floor((x-RANGE)/16);cx<=Math.floor((x+RANGE)/16);cx++) {
        const key=cx+','+cz, chunk=world.chunks.get(key);
        if (chunk) nearby.push(key+':'+chunk.rev);
      }
    }
    const next = Math.floor(x/4)+'/'+Math.floor(z/4)+'/'+nearby.join('/');
    if (force || next !== signature) {
      signature = next;
      rebuild(x,z);
    }
  }
  return {
    update,
    refresh() { update(lastX,lastZ,true); },
    harvest(raycaster,maxDistance) {
      const hit = raycaster.intersectObjects(batches,false)[0];
      if (!hit || hit.distance>maxDistance) return null;
      const {key,x,z,id} = hit.object.userData.plants[hit.instanceId];
      return {key,x,z,id,distance:hit.distance};
    },
    dispose() { clear(); templates.clear(); }
  };
}
