import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createCourse} from '../minecart-track.js';
import {buildCave} from '../cave-environment.js';

// Texture decoding and GPU rendering belong to browser QA. This test checks the
// actual generated terrain/track relationship and holes independently of WebGL.
const originalLoad = THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load = function (_url, onLoad) {
  const texture = new THREE.Texture();
  queueMicrotask(() => onLoad?.(texture));
  return texture;
};
const near = (a, b, tolerance, message) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${message}: ${a} versus ${b}`);
function triangleContainsXZ(x, z, a, b, c) {
  const denominator = (b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  if (Math.abs(denominator) < 1e-10) return false;
  const u = ((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/denominator;
  const v = ((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/denominator;
  return u >= -1e-7 && v >= -1e-7 && u+v <= 1+1e-7;
}
function floorCovers(geometry, x, z) {
  const positions = geometry.attributes.position, indices = geometry.index.array;
  const vertex = i => ({x:positions.getX(i), z:positions.getZ(i)});
  for (let i = 0; i < indices.length; i += 3) {
    if (triangleContainsXZ(x,z,vertex(indices[i]),vertex(indices[i+1]),vertex(indices[i+2]))) return true;
  }
  return false;
}
try {
  for (let level = 0; level < 5; level++) {
    const scene = new THREE.Scene(), course = createCourse(level);
    const cave = buildCave(THREE, scene, course, level);
    await cave.ready;
    assert.equal(scene.children.includes(cave.root), true, 'Cave attached to scene');
    assert.equal(cave.pits.length, course.pits.length, 'Every dead route has a pit');
    const geometries = new Set(), materials = new Set(), textures = new Set();
    let meshCount = 0;
    cave.root.traverse(object => {
      if (!object.isMesh) return;
      meshCount++;
      geometries.add(object.geometry);
      for (const attribute of Object.values(object.geometry.attributes)) {
        assert.ok(attribute.array.every(Number.isFinite), `Level ${level}: nonfinite ${attribute.name || 'geometry'} attribute`);
      }
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        if (material.map) textures.add(material.map);
      }
      if (object.isInstancedMesh) {
        assert.ok(object.instanceMatrix.array.every(Number.isFinite), 'Finite instance transforms');
      }
    });
    assert.ok(meshCount > 50, 'Cave contains volumetric scenery and fixtures');
    const floor = cave.root.getObjectByName('Continuous cave bedrock with open chasms');
    assert.ok(floor?.geometry?.index, 'Indexed continuous natural ground mesh exists');
    let samples = 0;
    for (const route of course.routes) {
      for (let s = 0; s <= route.length; s += 2.25) {
        const p = route.sample(s).position;
        near(cave.groundHeight(p.x,p.z),p.y,.03,`Level ${level} ${route.id}: ground supports rail height`);
        samples++;
      }
    }
    for (const pit of cave.pits) {
      // Test the centre and four interior positions, not just a single missing triangle.
      for (const [u,v] of [[0,0],[-.25,0],[.25,0],[0,-.3],[0,.3]]) {
        const x = pit.cx+pit.side.x*u*pit.rx+pit.dir.x*v*pit.rz;
        const z = pit.cz+pit.side.z*u*pit.rx+pit.dir.z*v*pit.rz;
        assert.equal(floorCovers(floor.geometry,x,z),false,`Level ${level}: actual open chasm at ${x},${z}`);
      }
    }
    const chasmWalls = cave.root.children.filter(o=>o.name==='Jagged abyss rock walls');
    assert.equal(chasmWalls.length,course.pits.length, 'Every abyss has 3D rock walls');
    chasmWalls.forEach((wall,i)=>{
      const ys=wall.geometry.attributes.position.array.filter((_,j)=>j%3===1);
      assert.ok(Math.max(...ys)-Math.min(...ys)>=course.pits[i].depth-.001, 'Abyss walls descend full physical depth');
    });
    const d=course.finishTangent;
    near(cave.door.position.x,course.finish.x+d.x*2,1e-8,'Door x at destination');
    near(cave.door.position.y,course.finish.y,1e-8,'Door rests on destination ground');
    near(cave.door.position.z,course.finish.z+d.z*2,1e-8,'Door z at destination');
    cave.update(1.25,course.routes[0].sample(0).position);
    const disposed={geometry:new Set(),material:new Set(),texture:new Set()};
    for(const g of geometries)g.addEventListener('dispose',()=>disposed.geometry.add(g));
    for(const m of materials)m.addEventListener('dispose',()=>disposed.material.add(m));
    for(const t of textures)t.addEventListener('dispose',()=>disposed.texture.add(t));
    cave.dispose();
    assert.equal(scene.children.length,0,'Scene detached when changing levels');
    assert.equal(disposed.geometry.size,geometries.size,'All geometry resources disposed');
    assert.equal(disposed.material.size,materials.size,'All material resources disposed');
    assert.equal(disposed.texture.size,textures.size,'All loaded textures disposed');
    console.log(`PASS level ${level+1}: ${samples} ground samples, ${course.pits.length} open 3D pits, destination door, finite geometry and disposal`);
  }
} finally {
  THREE.TextureLoader.prototype.load = originalLoad;
}
