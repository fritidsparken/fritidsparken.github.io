/* Original Blender assets, cached once and shared across all twenty courses. */
window.DownhillAssets = (() => {
  const scenes = new Map(), meshes = new Map();
  let pending;
  async function load() {
    if (pending) return pending;
    pending = (async () => {
      const { GLTFLoader } = await import('../skatepark/kaj/vendor/GLTFLoader.js');
      const loader = new GLTFLoader();
      const files = { environment: '../../assets/downhill/models/environment.glb', wildlife: '../../assets/downhill/models/wildlife.glb', rider: '../../assets/downhill/characters/rider.glb' };
      await Promise.all(Object.entries(files).map(async ([name, url]) => {
        const gltf = await loader.loadAsync(url + '?v=storybook-1');
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse(node => {
          if (!node.isMesh) return;
          node.castShadow = node.receiveShadow = true;
          node.geometry.userData.downhillShared = true;
          for (const m of [].concat(node.material)) m.userData.downhillShared = true;
          if (name === 'environment') {
            const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
            geometry.userData.downhillShared = true;
            meshes.set(node.name, { geometry, material: node.material });
          }
        });
        scenes.set(name, gltf.scene);
      }));
    })().catch(error => { pending = null; throw error; });
    return pending;
  }
  return { load, get: name => scenes.get(name), mesh: name => meshes.get(name) };
})();
