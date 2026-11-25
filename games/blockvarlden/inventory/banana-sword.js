export const bananaSword = {id:'banana_sword', name:'Banansvärd', category:'Verktyg'};
export const swordImage = new URL('../../../assets/blockvarlden/art/banansvard.webp', import.meta.url).href;

export function withBananaSword(T, kit) {
  const texture = new T.TextureLoader().load(swordImage);
  texture.colorSpace = T.SRGBColorSpace;
  const material = new T.MeshBasicMaterial({map:texture, side:T.DoubleSide, alphaTest:.35, toneMapped:false});
  const geometry = new T.PlaneGeometry(1, 1);
  return {
    ids:[...kit.ids, bananaSword.id],
    create(id) {return id === bananaSword.id ? new T.Mesh(geometry, material) : kit.create(id)},
    dispose() {texture.dispose(); material.dispose(); geometry.dispose(); kit.dispose()}
  };
}
