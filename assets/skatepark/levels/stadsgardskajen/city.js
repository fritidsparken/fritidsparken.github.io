// Every entry is an original, metre-scale Blender module. +Z faces the park.
const sources = {
  wing: 'buildings/brick-mill-wing', gable: 'buildings/brick-mill-gable',
  chimney: 'buildings/tapered-chimney', church: 'buildings/copper-spire',
  ochre: 'buildings/ochre-tenement', rose: 'buildings/rose-tenement',
  linden: 'trees/linden', elm: 'trees/elm', maple: 'trees/maple',
  lindenLow: 'trees/linden-lod', elmLow: 'trees/elm-lod', mapleLow: 'trees/maple-lod',
  shrubs: 'vegetation/quay-shrub', hill: 'vegetation/stockholm-hill',
  lawn: 'vegetation/quayside-lawn', cloud: 'vegetation/summer-cumulus',
  lamp: 'street-furniture/quay-lantern', bench: 'street-furniture/harbour-bench',
  fence: 'street-furniture/quay-guardrail'
};

export function cityLayout(quality) {
  const tier = String(quality ?? 'medium').toLowerCase();
  const low = tier === 'low' || tier === '0';
  const high = tier === 'high' || tier === '2';
  const list = {};
  const add = (id,x,y,z,yaw=0,sx=1,sy=sx,sz=sx) =>
    (list[id] ??= []).push([x,y,z,yaw,sx,sy,sz]);
  let seed = 3205;
  const rand = () => ((seed = (1664525*seed+1013904223)>>>0) / 4294967296);
  const tree = (i,x,y,z,s,near=false) => {
    const species = ['linden','elm','maple'][i%3];
    add(species + ((low || !near) ? 'Low' : ''), x,y,z,rand()*6.28,s,s*(.89+rand()*.23),s);
  };

  // Four perimeter lawns leave the entire bowl and park subgrade open.
  for (const side of [-1,1]) {
    add('lawn',side*113.5,-.20,0,0,123,1,350);
    add('lawn',0,-.20,side*115.5,0,104,1,119);
  }
  // Three storey masonry towers and continuous arcades across the northeast quay.
  add('gable',4,-.18,-73,0,1.08);
  add('wing',26.6,-.18,-73,0,1.30,1.28,1.16);
  add('gable',49.2,-.18,-73,0,.96,1.13,1.1);
  add('wing',67.0,-.18,-75,-.13,.96,1.02,1.0);
  add('wing',-15.9,-.18,-75,.015,1.03,1.00,1.05);
  add('gable',-33.5,-.18,-75,.015,.8,.84,1.0);
  add('chimney',-9,-.18,-87,0,1.13,1.18,1.13);
  // The ochre hill slopes lead up to the patinated clock tower.
  for (const [x,z,sx,sy,sz] of [
    [-67,-86,1.62,1.52,1.6],[-90,-67,1.30,1.28,1.46],
    [-39,-103,1.45,1.20,1.38],[0,-111,1.6,.95,1.2],[46,-108,1.62,1.04,1.54],
    [80,-94,1.58,.98,1.38],[97,-47,1.21,1.35,1.27],
    [98,5,1.38,1.2,1.48],[95,52,1.3,1.1,1.48],
    [51,97,1.52,1.1,1.4],[0,105,1.65,.97,1.51],[-52,99,1.42,1.28,1.28],
    [-91,73,1.39,1.15,1.22],[-96,32,1.34,1.12,1.42],[-92,-17,1.34,1.25,1.47]
  ]) add('hill',x,0,z,0,sx,sy,sz);
  add('church',-74,6,-90,.10,1.06,1.13,1.06);
  for (let i=0;i<11;i++) {
    const x=-103+i*20,z=-98-rand()*8;
    const hillside = 3 + 5 * Math.exp(-Math.pow((x+64)/33,2));
    add(i%3===1?'rose':'ochre',x,hillside+rand()*1.2,z,rand()*.16-.08,1+rand()*.15);
  }
  // Streets behind both side boundaries remain in view when turning.
  for (const side of [-1,1]) for (let i=0;i<7;i++) {
    const z=-64+i*20;
    add(i%2?'ochre':'rose',side*(78+rand()*4),-.12,z,-side*(Math.PI/2+rand()*.08),.9+rand()*.26);
  }
  for (let i=0;i<8;i++) add(i%3?'ochre':'rose',-75+i*21,1,83+rand()*3,Math.PI,.85+rand()*.22);
  // A staggered green canopy, with gaps in front of the central mill facade.
  const nearTrees=low?11:16;
  for (let i=0;i<nearTrees;i++) {
    const x=-95+55*i/(nearTrees-1)+rand()*3;
    tree(i,x,-.17,-63-rand()*11,1.1+rand()*.45,true);
  }
  for (let i=0;i<(low?16:25);i++) {
    const x=-108+i*(214/(low?15:24));
    tree(i,x,1.2+rand()*2,-87-rand()*11,.97+rand()*.52);
  }
  for (const side of [-1,1]) {
    for(let i=0;i<(low?13:21);i++) {
      const z=-62+i*(131/(low?12:20))+rand()*3;
      tree(i,side*(58+rand()*9),-.18,z,.83+rand()*.56,high && i%3===0);
    }
    for(let i=0;i<(low?7:13);i++) {
      add('shrubs',side*(54.3+rand()*2),-.09,-52+i*(100/(low?6:12)),rand()*3,.78+rand()*.45);
    }
  }
  for (let i=0;i<(low?12:19);i++)
    tree(i,-75+i*(150/(low?11:18)),-.15,60+rand()*10,.94+rand()*.48,high && i%4===1);
  for (let i=0;i<5;i++) tree(i,70+i*7,1,-62-rand()*9,1.09+rand()*.43,true);

  for (let i=0;i<26;i++) {
    add('fence',-50+i*4,.0,-56.5);
    add('fence',-50+i*4,.0,56.5);
  }
  for (let i=0;i<28;i++) for (const side of [-1,1]) add('fence',side*52.6,0,-54+i*4,Math.PI/2);
  for (const side of [-1,1]) for (let i=0;i<5;i++) {
    const z=-47+i*23;
    add('lamp',side*54.4,-.18,z,-side*Math.PI/2);
    add('bench',side*54.2,-.18,z+3.5,-side*Math.PI/2);
  }
  for (let i=0;i<4;i++) add('bench',-39+i*25,-.18,-58.0);
  // Wide, scalloped cloud clusters in a full 3D sky, well outside the riding area.
  for (const [x,y,z,sx,sy,sz,rot] of [
    [-91,30,-103,1.85,1.13,1.12,-.13],[-38,39,-128,.94,.81,.83,.05],
    [17,36,-123,1.12,.63,.81,.1],[87,29,-116,2.03,1.28,1.1,-.18],
    [115,31,-32,1.13,.91,1.16,1.48],[119,24,59,1.4,.8,.97,1.51],
    [25,39,127,1.75,1.34,.95,-.13],[-63,30,125,1.1,.68,.97,.2],
    [-117,34,44,1.9,1.30,1.1,1.52],[-114,27,-34,1.2,.86,.9,1.42]
  ]) add('cloud',x,y,z,rot,sx,sy,sz);
  return list;
}

// Compact the visible instances in each material batch. Padding covers normal camera
// motion between updates; large turns and resizes refresh the list immediately.
function cityVisibility(THREE, group, batches) {
  const frustum = new THREE.Frustum();
  const projection = new THREE.Matrix4();
  const lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
  const lastRotation = new THREE.Quaternion();
  let elapsed = 1, lastAspect = 0;
  return (camera, dt = 0) => {
    elapsed += dt;
    if (elapsed < .1 && camera.aspect === lastAspect &&
        camera.position.distanceToSquared(lastPosition) < 2.25 &&
        Math.abs(camera.quaternion.dot(lastRotation)) > .9994) return;
    elapsed = 0; lastAspect = camera.aspect;
    lastPosition.copy(camera.position); lastRotation.copy(camera.quaternion);
    group.updateWorldMatrix(true, false);
    projection.copy(camera.projectionMatrix);
    projection.elements[0] *= .91;
    projection.elements[5] *= .91;
    projection.multiply(camera.matrixWorldInverse).multiply(group.matrixWorld);
    frustum.setFromProjectionMatrix(projection);
    for (const batch of batches) {
      const {mesh, spheres, transforms, visible, current} = batch;
      let n = 0, changed = false;
      for (let i = 0; i < spheres.length; i++) {
        if (!frustum.intersectsSphere(spheres[i])) continue;
        current[n] = i;
        if (visible[n] !== i) changed = true;
        n++;
      }
      if (changed) {
        const out = mesh.instanceMatrix.array;
        for (let j = 0; j < n; j++) {
          const source = current[j];
          if (visible[j] === source) continue;
          const offset = j * 16, base = source * 16;
          for (let k = 0; k < 16; k++) out[offset+k] = transforms[base+k];
          visible[j] = source;
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      mesh.count = n;
      mesh.visible = n > 0;
    }
  };
}

export async function buildCity(THREE, loader, parent, quality='medium') {
  const group = new THREE.Group();
  group.name = 'Stadsgårdskajen · Södermalms kvarter';
  const layout = cityLayout(quality);
  const dummy = new THREE.Object3D(), matrix = new THREE.Matrix4();
  const batches = [];
  const cloudPaint = new THREE.MeshBasicMaterial({vertexColors:true, fog:true});
  parent.add(group);
  let cloudUsed = false;
  const loads = await Promise.allSettled(Object.entries(layout).map(async ([id, placements]) => {
    let sourcePath = sources[id];
    if (quality === 'low' && id.endsWith('Low')) sourcePath = sourcePath.replace('-lod','-distance');
    if (quality === 'low' && ['wing','gable','rose','ochre','fence'].includes(id)) sourcePath += '-distance';
    const url = new URL('../../shared/'+sourcePath+'.glb', import.meta.url).href;
    const model = loader.loadAsync ? await loader.loadAsync(url) :
      await new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
    model.scene.updateMatrixWorld(true);
    model.scene.traverse(source => {
      if (!source.isMesh) return;
      const cloud = id==='cloud';
      const batch = new THREE.InstancedMesh(source.geometry,cloud ? cloudPaint : source.material,placements.length);
      if (cloud) { cloudUsed=true; source.material.dispose(); }
      batch.name=id+' · '+source.name;
      const spheres = [];
      source.geometry.computeBoundingSphere();
      for (let i=0;i<placements.length;i++) {
        const [x,y,z,yaw,sx,sy,sz]=placements[i];
        dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
        batch.setMatrixAt(i,matrix.multiplyMatrices(dummy.matrix,source.matrixWorld));
        const sphere = source.geometry.boundingSphere.clone().applyMatrix4(matrix);
        sphere.radius += quality !== 'low' ? 3.0 : 1.5;
        spheres.push(sphere);
      }
      batch.instanceMatrix.needsUpdate=true;
      batch.castShadow=quality!=='low' && ['linden','elm','maple','lamp','bench'].includes(id);
      batch.receiveShadow=!cloud && !id.endsWith('Low');
      batch.frustumCulled = false;
      batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const visible = Int16Array.from(placements, (_,i) => i);
      batches.push({mesh:batch,spheres,transforms:batch.instanceMatrix.array.slice(),
        visible,current:new Int16Array(placements.length)});
      group.add(batch);
    });
  }));
  if (!cloudUsed) cloudPaint.dispose();
  const failed = loads.find(result => result.status==='rejected');
  if (failed) throw failed.reason;
  group.userData.updateVisibility = cityVisibility(THREE,group,batches);
  return group;
}
