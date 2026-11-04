// Reader for the static, indexed, tightly packed glTF primitives exported by props.py.
// Geometry and materials belong to the kit. Instances only own transforms.
const KIT_URL = new URL('../../../assets/blockvarlden/props/explorer-kit.glb', import.meta.url);
const COMPONENTS = {5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array};
const SIZES = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4};
const ATTRIBUTES = {POSITION:'position', NORMAL:'normal', TEXCOORD_0:'uv', COLOR_0:'color'};

export async function loadProps(THREE = globalThis.THREE) {
  const response = await fetch(KIT_URL);
  if (!response.ok) throw new Error('Kunde inte läsa modellbiblioteket (' + response.status + ')');
  const buffer = await response.arrayBuffer();
  const header = new DataView(buffer);
  if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2) {
    throw new Error('Modellbibliotekets format stöds inte.');
  }
  const jsonLength = header.getUint32(12, true);
  const model = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
  const binaryStart = 20 + jsonLength + 8;
  const accessorCache = new Map();
  function attribute(index) {
    if (accessorCache.has(index)) return accessorCache.get(index);
    const spec = model.accessors[index];
    const view = model.bufferViews[spec.bufferView];
    const Type = COMPONENTS[spec.componentType];
    const size = SIZES[spec.type];
    if (!Type || !size || (view.byteStride && view.byteStride !== size * Type.BYTES_PER_ELEMENT)) {
      throw new Error('Oväntad geometri i modellbiblioteket.');
    }
    const values = new Type(buffer, binaryStart + (view.byteOffset || 0) + (spec.byteOffset || 0), spec.count * size);
    const result = new THREE.BufferAttribute(values, size, Boolean(spec.normalized));
    accessorCache.set(index, result);
    return result;
  }
  const materials = model.materials.map(spec => {
    const pbr = spec.pbrMetallicRoughness || {};
    const material = new THREE.MeshStandardMaterial({
      name: spec.name,
      vertexColors: true,
      metalness: pbr.metallicFactor ?? 1,
      roughness: pbr.roughnessFactor ?? 1
    });
    if (spec.emissiveFactor) material.emissive.fromArray(spec.emissiveFactor);
    return material;
  });
  const templates = new Map();
  const geometries = [];
  for (const node of model.nodes) {
    if (node.mesh === undefined) continue;
    const group = new THREE.Group();
    group.name = node.name;
    for (const part of model.meshes[node.mesh].primitives) {
      const geometry = new THREE.BufferGeometry();
      for (const [semantic, name] of Object.entries(ATTRIBUTES)) {
        if (semantic in part.attributes) geometry.setAttribute(name, attribute(part.attributes[semantic]));
      }
      geometry.setIndex(attribute(part.indices));
      geometry.computeBoundingSphere();
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, materials[part.material]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    templates.set(node.name, group);
  }
  return {
    ids: [...templates.keys()],
    create(id) {
      const template = templates.get(id);
      if (!template) throw new RangeError('Okänt modell-ID ' + id);
      return template.clone();
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      templates.clear();
      accessorCache.clear();
    }
  };
}
