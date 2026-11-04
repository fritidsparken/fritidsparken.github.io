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

export function createActors({scene, ground, seed = 0, waterLevel = -Infinity, biome}) {
  const templates = new Map(), actors = new Map();
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
  function spawn(key, id, x, y, z, r) {
    const entry = {id, x, y, z, yaw:r * Math.PI * 2, timer:1 + 2*r, state:'idle', decisions:0, r};
    actors.set(key, entry);
    template(id).then(asset => {
      if (disposed || actors.get(key) !== entry) return;
      entry.model = asset.instantiate();
      entry.model.root.scale.setScalar(.86 + r*.22);
      entry.model.root.position.set(x,y,z);
      scene.add(entry.model.root);
    }).catch(error => {if (!disposed) console.warn('Blockvärlden: djurmodellen kunde inte laddas',error);});
  }
  function stream(p) {
    const cell = 17, cx = Math.floor(p.x/cell), cz = Math.floor(p.z/cell);
    const candidates=[];
    for(let x=cx-2; x<=cx+2; x++) for(let z=cz-2; z<=cz+2; z++) {
      const r=hash(x,z,seedHash);
      const px=(x+.19+.61*r)*cell, pz=(z+.22+.53*hash(z,x,seedHash+17))*cell;
      const d=Math.hypot(px-p.x,pz-p.z);
      if(d<34) candidates.push({x,z,r,px,pz,d});
    }
    candidates.sort((a,b)=>a.d-b.d);
    for(const [key, a] of actors) {
      if(Math.hypot(p.x-a.x,p.z-a.z)>44){a.model?.dispose();actors.delete(key);}
    }
    for(const c of candidates) {
      const key=c.x+','+c.z;
      if(actors.size>=9) break;
      if(actors.has(key)) continue;
      const y=ground(c.px,c.pz);
      if(!Number.isFinite(y) || y<0) continue;
      const wet=y<waterLevel-.6;
      const type=biome?.(c.px,c.pz);
      const region=Number.isInteger(type) ? type : regionNames.indexOf(String(type).toLowerCase());
      const list=wet ? aquatic : regional[region] || creatures;
      const id=list[Math.floor(hash(c.x,c.z,seedHash+42)*list.length)];
      spawn(key,id,c.px,wet?waterLevel-.42:y,c.pz,c.r);
    }
  }
  function updateAnimal(a,dt,p) {
    const m=a.model;
    if(!m) return;
    const dx=a.x-p.x, dz=a.z-p.z, distance=Math.hypot(dx,dz);
    if(distance>33){m.root.visible=false;return;}
    m.root.visible=true;
    a.timer-=dt;
    const swims=aquatic.includes(a.id);
    if(distance<2.6 && !swims) {
      a.state='flee';a.yaw=Math.atan2(dx,dz);a.timer=1.5;
    } else if(a.timer<=0) {
      const r=hash(++a.decisions,Math.floor(a.r*65535),seedHash);
      a.state=swims?'swim':p.night && r<.54?'rest':r<.32?'eat':r<.49?'idle':'walk';
      a.yaw+=(r-.48)*3.45;a.timer=2+r*3;
    }
    if(['flee','walk','swim'].includes(a.state)) {
      const speed=(a.state==='flee'?2.9:swims?.7:.68)*dt;
      const x=a.x+Math.sin(a.yaw)*speed, z=a.z+Math.cos(a.yaw)*speed;
      const height=ground(x,z);
      if(Number.isFinite(height) && (swims ? height<waterLevel-.6 :
          height>=waterLevel-.35 && Math.abs(height-a.y)<1.05)) {
        a.x=x; a.z=z; a.y=swims?waterLevel-.56+Math.sin(elapsed*1.3+a.r*6)*.10:height;
      } else {a.yaw+=Math.PI*.68;a.state='idle';a.timer=.65;}
    }
    m.root.position.set(a.x,a.y+(a.id==='lyktmott'?.46+.09*Math.sin(elapsed*3):0),a.z);
    const turn=Math.atan2(Math.sin(a.yaw-m.root.rotation.y),Math.cos(a.yaw-m.root.rotation.y));
    m.root.rotation.y+=turn*Math.min(1,dt*5);
    m.play(a.state);m.mixer.update(dt*(a.state==='flee'?1.65:1));
  }
  let playerTask;
  return {
    update(dt,p) {
      if(disposed)return;
      elapsed+=dt;tick-=dt;
      if(tick<=0){stream(p);tick=.6;}
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
    dispose() {
      if(disposed)return;
      disposed=true;player?.dispose();for(const a of actors.values())a.model?.dispose();actors.clear();
      for(const task of templates.values())task.then(asset=>asset.dispose()).catch(()=>{});
      templates.clear();
    }
  };
}
