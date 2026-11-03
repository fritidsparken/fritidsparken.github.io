// This Blender export has one static mesh at the origin and no external resources.
export async function loadHarbor(scene) {
  const response = await fetch(new URL("./art/stadsgarden.glb", import.meta.url));
  if (!response.ok) throw new Error("Kajmiljön kunde inte hämtas");
  const bytes = await response.arrayBuffer();
  const header = new DataView(bytes);
  const metadataSize = header.getUint32(12, true);
  const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, metadataSize)));
  const binaryOffset = 28 + metadataSize;
  const types = {5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array};
  const widths = {VEC3: 3, SCALAR: 1};
  function attribute(id) {
    const accessor = gltf.accessors[id];
    const view = gltf.bufferViews[accessor.bufferView];
    const width = widths[accessor.type];
    const Type = types[accessor.componentType];
    const offset = binaryOffset + (view.byteOffset || 0) + (accessor.byteOffset || 0);
    if (view.byteStride && view.byteStride !== width * Type.BYTES_PER_ELEMENT)
      throw new Error("Oväntad geometri i kajmodellen");
    return new THREE.BufferAttribute(new Type(bytes, offset, accessor.count * width), width);
  }
  if (scene.userData.disposed) return;
  for (const primitive of gltf.meshes[0].primitives) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", attribute(primitive.attributes.POSITION));
    geo.setAttribute("normal", attribute(primitive.attributes.NORMAL));
    geo.setIndex(attribute(primitive.indices));
    const src = gltf.materials[primitive.material].pbrMetallicRoughness;
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: new THREE.Color().fromArray(src.baseColorFactor || [1,1,1]),
      metalness: src.metallicFactor ?? 1, roughness: src.roughnessFactor ?? 1,
      side: THREE.DoubleSide
    }));
    mesh.name = gltf.materials[primitive.material].name;
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
}
