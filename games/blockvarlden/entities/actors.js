import {mutationModel,mutationTraits} from './mutations.js';
import {loadProps} from './props.js';
// Loader for the deliberately small rigged-GLB subset written by actors.py.
// Mesh buffers, materials, and animation clips are shared between instances.
const actorRoot = new URL('../../../assets/blockvarlden/actors/', import.meta.url);
const arrays = {5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array};
const sizes = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16};
const semantics = {POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv',
  COLOR_0: 'color', JOINTS_0: 'skinIndex', WEIGHTS_0: 'skinWeight'};

export function decodeActor(buffer) {
  const T = globalThis.THREE;
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error('Ogiltig GLB');
  const length = view.getUint32(12, true);
  const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, length)));
  const binary = 28 + length;
  function read(index) {
    const a = doc.accessors[index], b = doc.bufferViews[a.bufferView];
    const offset = binary + (b.byteOffset || 0) + (a.byteOffset || 0);
    const values = new arrays[a.componentType](buffer, offset, a.count * sizes[a.type]);
    return new T.BufferAttribute(values, sizes[a.type], !!a.normalized);
  }
  const primitive = doc.meshes[0].primitives[0];
  const geometry = new T.BufferGeometry();
  for (const [name, index] of Object.entries(primitive.attributes)) geometry.setAttribute(semantics[name], read(index));
  geometry.setIndex(read(primitive.indices));
  geometry.computeBoundingSphere();
  const material = new T.MeshStandardMaterial({vertexColors: true, roughness: .86});
  const skin = doc.skins[0], matrices = read(skin.inverseBindMatrices).array;
  const inverses = skin.joints.map((_, i) => new T.Matrix4().fromArray(matrices, i * 16));
  const clips = new Map(doc.animations.map(animation => {
    const tracks = animation.channels.map(({sampler, target}) => {
      const s = animation.samplers[sampler], rot = target.path === 'rotation';
      if (s.interpolation !== 'LINEAR' && s.interpolation !== 'STEP') throw new Error('Okänd interpolering');
      const track = rot ? T.QuaternionKeyframeTrack : T.VectorKeyframeTrack;
      const property = rot ? 'quaternion' : target.path === 'translation' ? 'position' : 'scale';
      return new track(doc.nodes[target.node].name + '.' + property,
        read(s.input).array, read(s.output).array, s.interpolation === 'STEP' ? T.InterpolateDiscrete : T.InterpolateLinear);
    });
    return [animation.name, new T.AnimationClip(animation.name, -1, tracks)];
  }));
  return {
    instantiate() {
      const root = new T.Group();
      const mesh = new T.SkinnedMesh(geometry, material);
      mesh.castShadow = true;
      const nodes = doc.nodes.map((source, i) => {
        const node = source.mesh !== undefined ? mesh : skin.joints.includes(i) ? new T.Bone() : new T.Group();
        node.name = source.name;
        if (source.translation) node.position.fromArray(source.translation);
        if (source.rotation) node.quaternion.fromArray(source.rotation);
        if (source.scale) node.scale.fromArray(source.scale);
        return node;
      });
      doc.nodes.forEach((n, i) => n.children?.forEach(child => nodes[i].add(nodes[child])));
      doc.scenes[doc.scene ?? 0].nodes.forEach(i => root.add(nodes[i]));
      root.updateMatrixWorld(true);
      const skeleton = new T.Skeleton(skin.joints.map(i => nodes[i]), inverses);
      mesh.bind(skeleton, mesh.matrixWorld);
      const mixer = new T.AnimationMixer(root);
      let active, outfit;
      return {setOutfit(choice = 'skog') {
        if (outfit === choice) return;
        outfit = choice;
        if (mesh.geometry !== geometry) mesh.geometry.dispose();
        mesh.geometry = geometry;
        const hue = {hav: [0.8, .63, 1.55], lingon: [4.4, .38, .54], lavendel: [3.1, .70, 1.50]}[choice];
        if (!hue) return;
        // The artist's turquoise coat pigment is distinct from skin, hair and trim.
        const colored = geometry.clone(), colors = colored.getAttribute('color');
        for (let i = 0; i < colors.count; i++) {
          const r = colors.getX(i), g = colors.getY(i), b = colors.getZ(i);
          if (r < g * .37 && b > g * .9 && b < g * 1.18) {
            colors.setXYZ(i, Math.min(1,r*hue[0]), Math.min(1,g*hue[1]), Math.min(1,b*hue[2]));
          }
        }
        mesh.geometry = colored;
      }, root, mixer, play(name) {
        const next = mixer.clipAction(clips.get(name) || clips.get('idle'));
        if (active === next) return;
        next.reset().play();
        if (active) active.crossFadeTo(next, .18, false);
        active = next;
      }, dispose() {
        root.removeFromParent(); mixer.stopAllAction(); mixer.uncacheRoot(root); skeleton.dispose();
        if (mesh.geometry !== geometry) mesh.geometry.dispose();
      }};
    }, dispose() {geometry.dispose(); material.dispose();}
  };
}

function hash(x, z, seed) {
  let v = Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ seed;
  v = Math.imul(v ^ v >>> 16, 0x7feb352d);
  return ((v ^ v >>> 15) >>> 0) / 4294967296;
}
const creatures = ['ko', 'far', 'gris', 'hona', 'hast', 'kanin', 'rav', 'varg', 'bjorn', 'lyktmott', 'mosslynx', 'skifferbagge', 'korallvandrare'];
const aquatic = ['fisk', 'rimfena'];
const regional = [
  ['ko','far','kanin','rav','lyktmott'], ['bjorn','varg','rav','mosslynx'],
  ['gris','hona','kanin','rav'], ['far','varg','skifferbagge'], ['varg','far','skifferbagge'],
  ['kanin','skifferbagge','korallvandrare'], ['lyktmott','mosslynx','korallvandrare'],
  ['hast','ko','far'], ['gris','lyktmott','mosslynx'], ['hona','kanin','korallvandrare'],
  ['korallvandrare'], ['lyktmott','mosslynx','skifferbagge','korallvandrare']
];
const regionNames = ['grönskande skog','tät barrskog','lövskog','höga berg','snötäckta berg','öken','djungel','savann','träsk','strand','hav','fantasiskog'];

export const faunaFood = {id:'viltmat', name:'Viltproviant', category:'Mat', nutrition:4,
  path:'assets/blockvarlden/actors/viltmat.glb', license:'CC0-1.0'};
export async function withFaunaFood(kit) {
  const food = await loadProps(globalThis.THREE, new URL('viltmat.glb', actorRoot));
  return {ids:[...kit.ids, faunaFood.id], create(id) {
    return id === faunaFood.id ? food.create(id) : kit.create(id);
  }, dispose() {food.dispose(); kit.dispose();}};
}
const speciesNames = {ko:'Ko',far:'Får',gris:'Gris',hona:'Höna',hast:'Häst',kanin:'Kanin',
  rav:'Räv',varg:'Varg',bjorn:'Björn',fisk:'Fisk',lyktmott:'Lyktmott',mosslynx:'Mosslo',
  skifferbagge:'Skifferbagge',korallvandrare:'Korallvandrare',rimfena:'Rimfena',mutation:'Galning'};
const validKey = key => /^-?\d{1,8},-?\d{1,8}$/.test(key);
export function sanitizeFauna(value) {
  const removed = [...new Set((Array.isArray(value?.removed) ? value.removed : []).filter(k=>typeof k==='string' && validKey(k)))];
  const dead = new Set(removed), pets = {};
  for(const [key,record] of Object.entries(value?.pets || {})) {
    if(!validKey(key)||dead.has(key)||!Object.hasOwn(speciesNames,record?.id))continue;
    if(![record.x,record.y,record.z].every(n=>Number.isFinite(n)&&Math.abs(n)<1e7))continue;
    pets[key]={id:record.id,x:record.x,y:record.y,z:record.z,...(record.id==='mutation'?{seed:record.seed>>>0}:{})};
  }
  return {removed,pets};
}

export function createActors({scene, ground, seed = 0, waterLevel = -Infinity, biome, blockAt,
    isSolid = id => id>0 && id!==25 && id!==26, state = {removed:[],pets:{}}}) {
  const templates = new Map(), actors = new Map();
  const clean = sanitizeFauna(state);
  Object.assign(state,clean);
  const removed = new Set(state.removed);
  const pickMeshes = [];
  let quiet = false;
  let player, disposed = false, tick = 0, elapsed = 0;
  const seedHash = Array.from(String(seed)).reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 7);
  function template(id) {
    if (!templates.has(id)) {
      const task = fetch(new URL(id + '.glb', actorRoot)).then(r => {
        if (!r.ok) throw new Error(id + ': ' + r.status);
        return r.arrayBuffer();
      }).then(data => {
        const result = decodeActor(data);
        return result;
      });
      templates.set(id, task);
    }
    return templates.get(id);
  }
  function spawn(key, id, x, y, z, r, tamed = false, mutationSeed = 0) {
    const entry = {key, id, x, y, z, yaw:r * Math.PI * 2, timer:1 + 2*r, state:'idle',
      decisions:0, r, tamed, velocity:0, health:2, nextHit:-Infinity};
    actors.set(key, entry);
    (id==='mutation'?Promise.resolve({instantiate:()=>mutationModel(mutationSeed)}):template(id)).then(asset => {
      if (disposed || actors.get(key) !== entry) return;
      entry.model = asset.instantiate();
      const root=entry.model.root;
      root.name=speciesNames[id];root.userData.faunaKey=key;
      root.scale.setScalar(.9 + r*.19);
      root.position.set(x,y,z);root.rotation.y=entry.yaw;
      root.traverse(node=>{if(node.isMesh){node.userData.faunaKey=key;(entry.meshes??=[]).push(node);pickMeshes.push(node);}});
      scene.add(root);
    }).catch(error => {if (!disposed) console.warn('Blockvärlden: djurmodellen kunde inte laddas',error);});
  }
  function despawn(a) {
    for(const mesh of a.meshes||[]){const i=pickMeshes.indexOf(mesh);if(i!==-1)pickMeshes.splice(i,1);}
    a.model?.dispose();actors.delete(a.key);
  }
  // Find the support below this animal, not the roof of a tunnel above it.
  function support(x,y,z) {
    if(!blockAt)return ground(x,z);
    for(let level=Math.floor(y+.08);level>=0;level--){
      const id=blockAt(x,level,z);
      if(id===null)return null;
      if(isSolid(id))return level+1;
    }
    return 0;
  }
  function waterAt(x,y,z) {
    if(!Number.isFinite(waterLevel))return false;
    return blockAt ? blockAt(x,y,z)===25 : ground(x,z)<waterLevel-.6;
  }
  function stream(p) {
    for(const a of actors.values()){
      if(Math.hypot(p.x-a.x,p.z-a.z)>46)despawn(a);
    }
    for(const [key,pet] of Object.entries(state.pets)){
      if(!actors.has(key)&&Math.hypot(p.x-pet.x,p.z-pet.z)<33&&Number.isFinite(ground(pet.x,pet.z))){
        const [cx,cz]=key.split(',').map(Number);
        spawn(key,pet.id,pet.x,pet.y,pet.z,hash(cx,cz,seedHash),true,pet.seed);
      }
    }
    const cell=17,cx=Math.floor(p.x/cell),cz=Math.floor(p.z/cell),candidates=[];
    for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++){
      const r=hash(x,z,seedHash);
      const px=(x+.19+.61*r)*cell,pz=(z+.22+.53*hash(z,x,seedHash+17))*cell;
      const d=Math.hypot(px-p.x,pz-p.z);
      if(d<33)candidates.push({x,z,r,px,pz,d});
    }
    candidates.sort((a,b)=>a.d-b.d);
    for(const c of candidates){
      const key=c.x+','+c.z;
      if(actors.size>=9)break;
      if(actors.has(key)||removed.has(key)||state.pets[key])continue;
      const y=ground(c.px,c.pz);
      if(!Number.isFinite(y)||y<0)continue;
      const wet=y<waterLevel-.64&&waterAt(c.px,waterLevel-.55,c.pz);
      const type=biome?.(c.px,c.pz);
      const region=Number.isInteger(type)?type:regionNames.indexOf(String(type).toLowerCase());
      const list=wet?aquatic:regional[region]||creatures;
      const id=list[Math.floor(hash(c.x,c.z,seedHash+42)*list.length)];
      spawn(key,id,c.px,wet?waterLevel-.6:y,c.pz,c.r);
    }
  }
  function advance(a,dt,pace,swims,lead) {
    const step=dt*pace;
    // Look ahead far enough to choose a route before crossing a voxel edge.
    for(const offset of [0,.55,-.55,1.17,-1.17,1.65,-1.65]){
      const yaw=lead+offset, dx=Math.sin(yaw),dz=Math.cos(yaw);
      const x=a.x+dx*step,z=a.z+dz*step;
      if(swims){
        if(!waterAt(x,a.y+.09,z)||!waterAt(x+dx*.2,a.y+.09,z+dz*.2))continue;
      }else{
        const leadX=x+dx*.20,leadZ=z+dz*.20;
        const top=support(leadX,a.y+1.01,leadZ);
        if(!Number.isFinite(top)||top-a.y>1.04||a.y-top>1.25)continue;
        if(waterAt(leadX,top+.16,leadZ))continue;
        if(blockAt&&isSolid(blockAt(leadX,top+.5,leadZ)))continue;
        const next=support(x,a.y+1.01,z);
        if(!Number.isFinite(next)||next-a.y>1.04)continue;
        if(next>a.y)a.y=next;
      }
      a.x=x;a.z=z;a.yaw=yaw;return true;
    }
    return false;
  }
  function updateAnimal(a,dt,p) {
    const m=a.model;
    if(!m)return;
    const dx=p.x-a.x,dz=p.z-a.z,distance=Math.hypot(dx,dz);
    if(distance>39){m.root.visible=false;return;}
    const floor=support(a.x,a.y,a.z);
    // Unloaded chunks can have no ground sample for a frame during streaming.
    m.root.visible=Number.isFinite(floor);
    if(!m.root.visible)return;
    const swimmer=aquatic.includes(a.id),swims=swimmer&&waterAt(a.x,a.y+.10,a.z);
    if(swims){
      const level=Math.max(floor+.035,waterLevel-.68+Math.sin(elapsed*1.25+a.r*6)*.075);
      if(waterAt(a.x,level+.1,a.z))a.y+=(level-a.y)*Math.min(1,2.3*dt);
      a.velocity=0;
    }else if(a.y>floor+.002){
      a.velocity=Math.max(-18,a.velocity-18*dt);a.y=Math.max(floor,a.y+a.velocity*dt);
    }else {a.y=floor;a.velocity=0;}
    a.timer-=dt;
    let lead=a.yaw,pace=0;
    if(a.tamed){
      a.state=distance>2.1?'walk':'idle';
      if(swims)a.state='swim';
      if(distance>2.1){lead=Math.atan2(dx,dz);pace=Math.min(7,.8+distance*.45);}
    }else if(a.nextHit>elapsed-.9 || (!swims&&distance<1.55)){
      a.state='flee';lead=Math.atan2(-dx,-dz);a.timer=1.2;pace=2.4;
    }else{
      if(a.timer<=0){
        const r=hash(++a.decisions,Math.floor(a.r*65535),seedHash);
        a.state=swims?'swim':p.night&&r<.54?'rest':r<.35?'eat':r<.52?'idle':'walk';
        a.yaw+=(r-.48)*2.7;lead=a.yaw;a.timer=2.1+r*3;
      }
      if(['walk','flee','swim'].includes(a.state))pace=swims?.65:a.state==='flee'?1.8:.64;
    }
    if(pace && (!swimmer||swims) && (swims||a.y-floor<.1)){
      if(!advance(a,dt,pace,swims,lead)){a.yaw=lead+Math.PI*.72;a.state='idle';a.timer=.5;}
    }
    if(a.tamed)Object.assign(state.pets[a.key],{x:a.x,y:a.y,z:a.z});
    const hovering=a.id==='lyktmott'?.36+.10*Math.sin(elapsed*3+a.r):0;
    m.root.position.set(a.x,a.y+hovering,a.z);
    const turn=Math.atan2(Math.sin(a.yaw-m.root.rotation.y),Math.cos(a.yaw-m.root.rotation.y));
    m.root.rotation.y+=turn*Math.min(1,dt*7);
    m.play(a.state);m.mixer.update(dt*(a.state==='flee'?1.6:pace>2.1?1.35:1));
  }
  let playerTask;
  return {
    update(dt,p) {
      if(disposed)return;
      elapsed+=dt;tick-=dt;
      if(quiet!==!!p.quiet){
        quiet=!!p.quiet;tick=0;
        if(quiet)for(const a of actors.values())despawn(a);
      }
      if(!quiet&&tick<=0){stream(p);tick=.6;}
      if(p.thirdPerson && !playerTask) {
        playerTask=template('stigfinnare').then(asset=>{
          if(disposed)return;
          player=asset.instantiate();scene.add(player.root);
        }).catch(error=>console.warn('Blockvärlden: spelarmodellen kunde inte laddas',error));
      }
      if(player) {
        player.root.visible=!!p.thirdPerson;
        if(p.thirdPerson) {
          player.setOutfit(p.outfit);
          player.root.position.set(p.x,p.y-(p.eyeHeight??1.55),p.z);
          player.root.rotation.y=(p.yaw||0)+Math.PI;
          player.play(p.action || (p.moving?'walk':'idle'));player.mixer.update(dt);
        }
      }
      for(const a of actors.values())updateAnimal(a,dt,p);
    },
    hatch(seed,p) {
      if(quiet||disposed)return {ok:false,message:'Slå på djurliv i Inställningar först.'};
      if(Object.keys(state.pets).length>=24)return {ok:false,message:'Du har redan 24 följeslagare i världen.'};
      let spot;
      for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2]]){
        const x=p.x+dx,z=p.z+dz,y=ground(x,z);
        if(!Number.isFinite(y)||y<waterLevel||Math.abs(y-p.y)>3)continue;
        if(blockAt&&[.5,1.5,2.5].some(h=>isSolid(blockAt(x,y+h,z))))continue;
        spot={x,y,z};break;
      }
      if(!spot)return {ok:false,message:'Gå till en öppen, torr plats innan du kläcker.'};
      let n=1;while(state.pets['-99999999,'+n]||removed.has('-99999999,'+n))n++;
      const key='-99999999,'+n;
      state.pets[key]={id:'mutation',...spot,seed:seed>>>0};
      spawn(key,'mutation',spot.x,spot.y,spot.z,.5,true,seed);
      return {ok:true,message:mutationTraits(seed).name+' är kläckt och följer dig!'};
    },
    hit(raycaster,maxDistance=7) {
      if(quiet||disposed||!pickMeshes.length)return null;
      const hits=raycaster.intersectObjects(pickMeshes,false);
      for(const h of hits){
        if(h.distance>maxDistance)return null;
        const a=actors.get(h.object.userData.faunaKey);
        if(a?.model.root.visible)return {kind:'animal',key:a.key,id:a.id,name:speciesNames[a.id],
          tamed:a.tamed,distance:h.distance,x:a.x,y:a.y,z:a.z};
      }
      return null;
    },
    feed(key,item) {
      const a=actors.get(key);
      if(!a||quiet)return {ok:false,message:'Djuret har gått vidare.'};
      if(a.tamed)return {ok:false,message:speciesNames[a.id]+' är redan tam och följer dig.'};
      if(!['apple','bread','viltmat'].includes(item))return {ok:false,message:'Håll fram äpple, bröd eller viltproviant för att tämja djuret.'};
      a.tamed=true;a.state='eat';a.health=2;
      state.pets[key]={id:a.id,x:a.x,y:a.y,z:a.z};
      return {ok:true,message:speciesNames[a.id]+' är tam och följer dig!'};
    },
    attack(key) {
      const a=actors.get(key);
      if(!a||quiet||elapsed<a.nextHit)return null;
      a.nextHit=elapsed+.48;a.health--;a.state='flee';a.timer=2;
      if(a.health>0)return {message:speciesNames[a.id]+' försöker komma undan.',killed:false};
      removed.add(key);state.removed.push(key);delete state.pets[key];
      const drop={id:faunaFood.id,count:['ko','hast','bjorn'].includes(a.id)?2:1,p:[a.x,a.y+.2,a.z]};
      despawn(a);
      return {message:speciesNames[a.id]+' lämnade mat och ett ägg!',killed:true,drop,egg:{id:'egg_'+a.id,count:1,p:[a.x+.4,a.y+.2,a.z]}};
    },
    dispose() {
      if(disposed)return;
      disposed=true;player?.dispose();for(const a of actors.values())despawn(a);
      for(const task of templates.values())task.then(asset=>asset.dispose()).catch(()=>{});
      templates.clear();
    }
  };
}
