// A handheld light, available in every world's backpack.
export const flashlight = {id:'flashlight',name:'Ficklampa',category:'Verktyg'};
export function withFlashlight(kit){
 const T=globalThis.THREE;
 const bodyGeo=new T.CylinderGeometry(.08,.065,.42,10),headGeo=new T.CylinderGeometry(.13,.08,.16,10);
 const lensGeo=new T.CylinderGeometry(.105,.105,.015,10);
 const bodyMat=new T.MeshStandardMaterial({color:0x475b67,metalness:.35,roughness:.48});
 const rimMat=new T.MeshStandardMaterial({color:0x202f37,metalness:.4,roughness:.4});
 const lensMat=new T.MeshStandardMaterial({color:0xfff1bc,emissive:0x8d6c26,emissiveIntensity:.4,roughness:.3});
 return {ids:[...kit.ids,flashlight.id],create(id){
  if(id!==flashlight.id)return kit.create(id);
  const group=new T.Group();
  const body=new T.Mesh(bodyGeo,bodyMat);group.add(body);
  const head=new T.Mesh(headGeo,rimMat);head.position.y=.26;group.add(head);
  const lens=new T.Mesh(lensGeo,lensMat);lens.position.y=.345;group.add(lens);
  group.rotation.x=-Math.PI/2;return group;
 },dispose(){bodyGeo.dispose();headGeo.dispose();lensGeo.dispose();bodyMat.dispose();rimMat.dispose();lensMat.dispose();kit.dispose()}};
}
