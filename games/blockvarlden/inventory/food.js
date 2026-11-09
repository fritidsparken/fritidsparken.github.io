// Extra provisions for the backpack. Every item has its own little hand model.
export const extraFoods = [
  {id:'blueberries',name:'Blåbär',icon:'🫐',nutrition:2},
  {id:'lingonberries',name:'Lingon',icon:'🍒',nutrition:2},
  {id:'carrot',name:'Morot',icon:'🥕',nutrition:3},
  {id:'potato',name:'Potatis',icon:'🥔',nutrition:3},
  {id:'baked_potato',name:'Bakad potatis',icon:'🥔',nutrition:5},
  {id:'fruit_bowl',name:'Fruktskål',icon:'🍇',nutrition:5},
  {id:'sandwich',name:'Smörgås',icon:'🥪',nutrition:6},
  {id:'vegetable_soup',name:'Grönsakssoppa',icon:'🍲',nutrition:7},
  {id:'apple_pie',name:'Äppelpaj',icon:'🥧',nutrition:7},
  {id:'berry_cake',name:'Bärkaka',icon:'🍰',nutrition:8}
].map(item=>({...item,category:'Mat'}));
export const extraFoodIcons = Object.fromEntries(extraFoods.map(({id,icon})=>[id,icon]));

// These tiny voxel-style models share their geometry/materials across instances.
export function withExtraFood(T, kit) {
  const ids = new Set(extraFoods.map(item=>item.id));
  const cube = new T.BoxGeometry(1,1,1);
  const materials = new Map();
  function material(color) {
    if(!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({color,roughness:.82}));
    return materials.get(color);
  }
  function model(id) {
    const g = new T.Group();
    function block(color,x,y,z,sx,sy,sz) {
      const mesh=new T.Mesh(cube,material(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);g.add(mesh);
    }
    function bowl(contents) {
      block('#b98252',0,.04,0,.38,.08,.30);block('#d3a16a',0,.13,0,.42,.12,.34);
      block(contents,0,.20,0,.34,.04,.26);
    }
    if(id==='blueberries'||id==='lingonberries') {
      const c=id==='blueberries'?'#405aaf':'#d8414e';
      for(const [x,y,z] of [[-.09,.08,0],[.08,.08,0],[0,.16,.02],[-.03,.08,-.11],[.08,.08,-.11]]) block(c,x,y,z,.12,.12,.12);
      block('#579347',0,.24,0,.05,.07,.05);
    } else if(id==='carrot') {
      block('#f28a31',0,.15,0,.16,.25,.15);block('#d97028',0,.025,0,.09,.06,.09);
      block('#5c9c42',-.04,.32,0,.045,.13,.04);block('#79b94f',.04,.32,0,.045,.14,.04);
    } else if(id==='potato'||id==='baked_potato') {
      block(id==='potato'?'#b48a54':'#8b5937',0,.11,0,.30,.22,.22);
      if(id==='baked_potato')block('#ead198',0,.225,0,.20,.025,.13);
    } else if(id==='fruit_bowl') {
      bowl('#619d45');block('#d54745',-.10,.26,0,.11,.11,.11);block('#f3c63f',.08,.26,.03,.12,.11,.1);block('#5262b9',0,.26,-.07,.1,.1,.1);
    } else if(id==='sandwich') {
      block('#d5a05e',0,.08,0,.34,.11,.26);block('#70a34c',0,.15,0,.35,.04,.27);block('#d85949',0,.19,0,.32,.04,.25);block('#e6bb7e',0,.25,0,.34,.10,.26);
    } else if(id==='vegetable_soup') {
      bowl('#e8a34c');block('#71ae4a',-.09,.24,.02,.08,.05,.08);block('#f18530',.06,.24,-.04,.09,.05,.08);
    } else if(id==='apple_pie') {
      block('#b97d42',0,.09,0,.40,.16,.32);block('#eac078',0,.19,0,.40,.05,.32);
      block('#ba8648',0,.225,0,.36,.025,.04);block('#ba8648',0,.225,0,.04,.025,.28);
    } else if(id==='berry_cake') {
      block('#d3a169',0,.08,0,.36,.15,.30);block('#f5e3cf',0,.18,0,.36,.05,.30);
      block('#c84b64',-.08,.24,0,.10,.10,.10);block('#5362a6',.08,.24,0,.10,.10,.10);
    }
    return g;
  }
  return {ids:[...kit.ids,...ids],create(id){return ids.has(id)?model(id):kit.create(id)},dispose(){cube.dispose();for(const m of materials.values())m.dispose();kit.dispose()}};
}
