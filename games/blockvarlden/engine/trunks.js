// Meter dimensions of the trunks in the Blender kit, excluding decorative roots and leaves.
const trunks = {oak: [.34, .20, 2.62, .08], pine: [.23, .11, 3.24, 0], palm: [.22, .16, 3.13, .25]};

export function isTree(id) {
  return Object.hasOwn(trunks, id);
}

export function trunkHit(id, x, y, z, rotation, scale, p, pad=.28, height=1.73) {
  const shape = trunks[id];
  if (!shape || p.y + height <= y || p.y >= y + shape[2]*scale) return false;
  const fraction = Math.max(0, (p.y-y)/(shape[2]*scale));
  const lean = shape[3]*fraction*scale;
  const radius = (shape[0] + (shape[1]-shape[0])*fraction)*scale;
  const dx = Math.max(0, Math.abs(p.x-x-lean*Math.cos(rotation))-pad);
  const dz = Math.max(0, Math.abs(p.z-z+lean*Math.sin(rotation))-pad);
  return dx*dx+dz*dz < radius*radius;
}
