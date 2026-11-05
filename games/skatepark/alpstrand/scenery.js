// Cluster linked Blender scenery by material and location so the renderer can
// frustum-cull whole groups. The skating mesh is never decimated or replaced.
export function instanceScenery(root, distantElm, T) {
  const clusters = new Map();
  root.updateMatrixWorld(true);
  distantElm.updateMatrixWorld(true);
  const low = [];
  distantElm.traverse(node => { if (node.isMesh) low.push(node); });
  root.traverse(node => {
    if (!node.isMesh || node.isInstancedMesh) return;
    const tree = /^(Peninsula_woodland|Perimeter_elm|Lakeshore_oak)/.test(node.name);
    if (!tree && !/^(Distant_lakeside_houses|Shared_harbour_bench)/.test(node.name)) return;
    const elements = node.matrixWorld.elements;
    const key = [node.geometry.uuid,node.material.uuid,Math.floor(elements[12]/35),
      Math.floor(elements[14]/35)].join('/');
    if (!clusters.has(key)) clusters.set(key,{nodes:[],tree});
    clusters.get(key).nodes.push(node);
  });
  const rows = [];
  for (const {nodes,tree} of clusters.values()) {
    const first=nodes[0];
    const make = (geometry,material,local) => {
      const group = new T.InstancedMesh(geometry,material,nodes.length);
      group.name = first.name+'_instances';
      for (let i=0; i<nodes.length; i++) {
        const transform=nodes[i].matrixWorld.clone();
        if (local) transform.multiply(local);
        group.setMatrixAt(i,transform);
      }
      group.computeBoundingSphere();
      group.castShadow = group.receiveShadow = true;
      root.add(group);
      return group;
    };
    const high = make(first.geometry, first.material);
    if (tree) {
      // Oak shoots and branches are separate source meshes at the same trunks.
      // Exactly one low-poly crown represents each tree in the far group.
      const far = /Oak_shoots/i.test(first.name) ? [] :
        low.map(node=>make(node.geometry,node.material,node.matrixWorld));
      const center=new T.Vector3();
      const position=new T.Vector3();
      for (const node of nodes) center.add(position.setFromMatrixPosition(node.matrixWorld));
      center.multiplyScalar(1/nodes.length);
      rows.push({high,far,center});
    }
    for (const node of nodes) node.removeFromParent();
  }
  return (eye,range) => {
    for (const {high,far,center} of rows) {
      const close = center.distanceToSquared(eye) < range*range;
      high.visible = close;
      for (const mesh of far) mesh.visible = !close;
    }
  };
}
