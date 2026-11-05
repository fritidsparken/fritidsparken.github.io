// Renderer and physics share the triangles and rail splines exported from Blender.
export const alpstrand = {
  name: 'Alpstrand Vertpark',
  area: 'ALPSJÖN',
  desc: 'Carva i den stora bowlen och ta sats mot verttornet vid sjön.',
  sky: 0xb9e2ff,
  halfWidth: 48.8,
  halfDepth: 43.8,
  shapes: [],
  rails: [],
};

const cellSize = 2;
const cell = value => Math.floor(value / cellSize);
const key = (x, z) => (x + 256) * 512 + z + 256;

function railSegments(path, name) {
  const segments = [];
  for (let i = 3; i < path.length; i += 3) {
    const [ax, ay, az, bx, by, bz] = path.slice(i - 3, i + 3);
    if (Math.hypot(ax - bx, ay - by) < .02) continue;
    const rail = [ax, -ay, bx, -by, 0];
    rail.profile = [az, bz - az];
    rail.line = name;
    if (segments.length) {
      rail.prev = segments[segments.length - 1];
      rail.prev.next = rail;
    }
    segments.push(rail);
  }
  if (segments.length > 2 && Math.hypot(path[0] - path.at(-3), path[1] - path.at(-2)) < .03) {
    segments[0].prev = segments.at(-1);
    segments.at(-1).next = segments[0];
  }
  return segments;
}

export function indexCourse(root, THREE) {
  const cells = new Map();
  const rails = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let triangleCount = 0;
  root.updateMatrixWorld(true);
  root.traverse(object => {
    if (Array.isArray(object.userData.grindPath)) {
      rails.push(...railSegments(object.userData.grindPath, object.uuid));
    }
    if (!object.isMesh) return;
    let owner = object;
    while (owner && !owner.name.startsWith('RIDE_')) owner = owner.parent;
    if (!owner) return;
    const {index, attributes} = object.geometry;
    const pos = attributes.position;
    const count = index ? index.count : pos.count;
    function vertex(out, i) {
      return out.fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(object.matrixWorld);
    }
    for (let i = 0; i < count; i += 3) {
      vertex(a, i); vertex(b, i + 1); vertex(c, i + 2);
      const bx = b.x - a.x, bz = b.z - a.z, cx = c.x - a.x, cz = c.z - a.z;
      const det = bx * cz - cx * bz;
      if (Math.abs(det) < .000001) continue;
      // Retain only the upper side of solids. RIDE meshes with vertical side faces
      // cannot accidentally lift a board onto an overhead deck.
      if (det > 0) continue;
      const tri = [a.x,a.z,a.y,cz/det,-cx/det,-bz/det,bx/det,b.y-a.y,c.y-a.y];
      for (let u = cell(Math.min(a.x,b.x,c.x)); u <= cell(Math.max(a.x,b.x,c.x)); u++) {
        for (let v = cell(Math.min(a.z,b.z,c.z)); v <= cell(Math.max(a.z,b.z,c.z)); v++) {
          const id = key(u,v);
          if (!cells.has(id)) cells.set(id, []);
          cells.get(id).push(tri);
        }
      }
      triangleCount++;
    }
  });
  if (!triangleCount || !rails.length) throw Error('Alpstrand saknar åkytor eller grindräcken');
  function sampleHeight(x, z, ceiling = Infinity) {
    let h = -Infinity;
    const triangles = cells.get(key(cell(x), cell(z)));
    if (triangles) for (const t of triangles) {
      const dx = x - t[0], dz = z - t[1];
      const u = t[3]*dx + t[4]*dz, v = t[5]*dx + t[6]*dz;
      if (u < -.00001 || v < -.00001 || u + v > 1.00001) continue;
      const y = t[2] + t[7]*u + t[8]*v;
      if (y <= ceiling && y > h) h = y;
    }
    return Number.isFinite(h) ? h : 0;
  }
  for (const face of vertFaces) {
    // Rebuild arc length from the actual exported surface, including the
    // intermediate timber shoulder on the summit drop.
    const samples = [];
    for (let i=0; i<=96; i++) {
      const along=face.run*Math.sin(Math.PI*i/192);
      const h=i===96 ? face.height : sampleHeight(
        face.x + face.dx*(along-face.run), face.z + face.dz*(along-face.run));
      const last=samples.at(-1);
      samples.push({along,h,length:last ? last.length+Math.hypot(along-last.along,h-last.h) : 0});
    }
    face.samples=samples;
  }
  return {sampleHeight, rails, triangleCount};
}

// Authored Blender transition lips and approach directions. Keep speed measured along the curved surface:
// a board covering the last vertical metre travels almost no horizontal distance.
function face(x,z,yaw,run,height,width,portal=false) {
  const heading = yaw*Math.PI/180;
  return {x,z,dx:Math.sin(heading),dz:-Math.cos(heading),run,height,width,portal};
}
const vertFaces = [
  face(-6,-35.6,-44,12.9,15,9.2),
  face(-35,-35.7,-41,11.7,9,14),
  face(46.4,-5.4,90,9,8.3,16.4,true),
  face(-32.5,23,-90,8.3,5.4,17.2),
  face(-47,-8.3,-90,6.8,3.4,12),
];

export function vertStep(p, dx, dz, dt, braking) {
  for (const f of vertFaces) {
    const relX = p.x - f.x, relZ = p.z - f.z;
    const along = f.run + relX*f.dx + relZ*f.dz;
    const cross = relX*f.dz - relZ*f.dx;
    const heading = dx*f.dx + dz*f.dz;
    if (along < 0 || along > f.run + .01 || Math.abs(cross) > f.width/2 ||
        Math.abs(heading) < .18) continue;
    const samples = f.samples;
    let i = Math.max(1, samples.findIndex(row=>row.along >= Math.min(f.run,along)-1e-6));
    let a = samples[i-1], b = samples[i];
    const mix = Math.max(0,Math.min(1,(along-a.along)/(b.along-a.along)));
    const expected = a.h + (b.h-a.h)*mix;
    if (Math.abs(expected-p.y) > 1.4) continue;
    if (f.portal && Math.hypot(p.z+7.7, expected-5.229) < 1.8) continue;
    const rising = heading > 0;
    if (rising && !braking && p.speed >= 2.5) p.speed = Math.max(3.2,p.speed);
    const distance = Math.max(0, Math.min(samples.at(-1).length,
      a.length+(b.length-a.length)*mix+heading*p.speed*dt));
    while(i<samples.length-1 && samples[i].length<distance) i++;
    while(i>1 && samples[i-1].length>distance) i--;
    a=samples[i-1]; b=samples[i];
    const next = a.along + (b.along-a.along)*(distance-a.length)/(b.length-a.length);
    const advance = next-along;
    const lateral = (dx*f.dz-dz*f.dx)*p.speed*dt;
    const x=p.x+advance*f.dx+lateral*f.dz, z=p.z+advance*f.dz-lateral*f.dx;
    if (rising && distance >= samples.at(-1).length-.0001) {
      const launch = Math.min(15,6.8+p.speed*.48);
      const endHeading = Math.atan2(-(dx-2*heading*f.dx),-(dz-2*heading*f.dz));
      p.y = f.height+.04;
      p.vy = launch;
      p.air = true;
      p.manual = null;
      p.transition = {
        face:f,x,z,cross,drift:(dx*f.dz-dz*f.dx)*p.speed,time:0,flight:2*launch/17.5,dir:p.dir,
        turn:Math.atan2(Math.sin(endHeading-p.dir),Math.cos(endHeading-p.dir)),
      };
    }
    return {x,z};
  }
  return null;
}

export function vertFlight(tr,dt) {
  tr.time+=dt;
  const f=tr.face,u=Math.min(1,tr.time/tr.flight);
  const drift=Math.max(-f.width*.48-tr.cross,Math.min(f.width*.48-tr.cross,tr.drift*tr.time));
  const excursion=2*u*(1-u)-.7*u*u;
  const ease=Math.min(1,Math.max(0,(u-.22)/.64));
  return {
    x:tr.x+excursion*f.dx+drift*f.dz,
    z:tr.z+excursion*f.dz-drift*f.dx,
    dir:tr.dir+tr.turn*ease*ease*(3-2*ease),
  };
}

// Find the wheel's travel along a curved transition. Measuring horizontal
// distance alone would multiply the board's speed up a nearly vertical wall.
export function followBowl(park, x, z, ground, nx, nz) {
  if (ground >= -.015 && park.sampleHeight(nx,nz) >= -.015) return {x:nx,z:nz};
  const dx=nx-x, dz=nz-z, distance=Math.hypot(dx,dz);
  const target = park.sampleHeight(nx,nz);
  if (Math.abs(target-ground) < distance*.45) return {x:nx,z:nz};
  let lo=0, hi=1;
  for (let step=0; step<10; step++) {
    const mid=(lo+hi)*.5;
    const h=park.sampleHeight(x+dx*mid,z+dz*mid);
    if (Math.hypot(distance*mid,h-ground) > distance) hi=mid;
    else lo=mid;
  }
  return {x:x+dx*lo,z:z+dz*lo};
}
