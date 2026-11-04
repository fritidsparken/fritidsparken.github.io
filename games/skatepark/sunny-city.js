// Metre-scale Blender facades sit outside the riding surface, with gaps onto the park skyline.
const blocks = [
  ["brick-mill-gable", [[-36, -67, 0, .88], [18, -70, -.05, 1.03]]],
  ["brick-mill-wing", [[-15, -68, .02, 1.05], [40, -71, -.08, .92]]],
  ["ochre-tenement", [[-69, -30, 1.55, 1], [-70, -13, 1.52, .92], [67, 40, -1.59, 1.1], [32, 68, 3.11, 1.04]]],
  ["rose-tenement", [[-68, 3, 1.64, 1.02], [66, 22, -1.54, .87], [16, 68, 3.18, .95]]],
];
const shared = new URL("../../assets/skatepark/shared/buildings/", import.meta.url);

export async function addSunnyCity(scene, loader, low) {
  const T = window.THREE;
  const pose = new T.Object3D(), matrix = new T.Matrix4();
  await Promise.all(blocks.map(async ([name, placements]) => {
    const suffix = low || name.endsWith("tenement") ? "-distance" : "";
    const asset = await loader.loadAsync(new URL(name + suffix + ".glb", shared).href);
    asset.scene.updateMatrixWorld(true);
    asset.scene.traverse(source => {
      if (!source.isMesh) return;
      const houses = new T.InstancedMesh(source.geometry, source.material, placements.length);
      houses.name = "Gårdens kvarter · " + name;
      placements.forEach(([x, z, yaw, scale], i) => {
        pose.position.set(x, -.16, z);
        pose.rotation.y = yaw;
        pose.scale.setScalar(scale);
        pose.updateMatrix();
        houses.setMatrixAt(i, matrix.multiplyMatrices(pose.matrix, source.matrixWorld));
      });
      houses.computeBoundingSphere();
      houses.receiveShadow = !low;
      scene.add(houses);
    });
  }));
}
