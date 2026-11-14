// Real 3D cart, with original-design Navid projected on a shaped character surface.
// Character remains attached to the cart orientation; no camera-facing billboard or frame swaps.
export function buildCart(THREE) {
  const group = new THREE.Group();
  group.name = 'Navid — timber minecart';
  const body = new THREE.Group();
  group.add(body);
  const resources = new Set(), textures = [];
  const remember = r => (resources.add(r), r);
  const material = opts => remember(new THREE.MeshStandardMaterial(opts));
  function surfaceTexture(type) {
    const n = 256, data = new Uint8Array(n*n*4);
    let seed = 931;
    const random = () => {seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let y=0;y<n;y++) for(let x=0;x<n;x++) {
      const idx=(y*n+x)*4, noise=(random()-.5)*14;
      let light;
      if(type==='wood') {
        const grain=Math.sin(y*.53+Math.sin(x*.025)*2.2)+.5*Math.sin(y*1.4+x*.016);
        const knot=Math.cos(Math.hypot((x-65)*.5,(y-141)*1.7)*.42)*Math.exp(-((x-65)**2+(y-141)**2)/1800);
        light=grain*10+knot*14+noise;
        data[idx]=105+light;data[idx+1]=71+light*.7;data[idx+2]=43+light*.42;
      } else {
        const weave=((x%3===0?1:0)+(y%3===0?1:0))*9;
        light=195+noise-weave;
        data[idx]=data[idx+1]=data[idx+2]=light;
      }
      data[idx+3]=255;
    }
    const t=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.push(t);return t;
  }
  const woodMap=surfaceTexture('wood');
  const wood=material({color:0xbba286,map:woodMap,roughness:.91,metalness:0});
  const edgeWood=material({color:0x39271c,map:woodMap,roughness:.93});
  const iron=material({color:0x363b3c,metalness:.82,roughness:.43});
  const wornIron=material({color:0x7e827c,metalness:.86,roughness:.29});
  const rust=material({color:0x71513c,metalness:.5,roughness:.72});
  function add(geometry,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0,parent=body) {
    remember(geometry);const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const box=(w,h,d,mat,x,y,z,rx=0,ry=0,rz=0,parent=body)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z,rx,ry,rz,parent);
  function ellipsoid(rx,ry,rz,mat,x,y,z,parent=body) {const m=add(new THREE.SphereGeometry(1,20,14),mat,x,y,z,0,0,0,parent);m.scale.set(rx,ry,rz);return m;}
  function link(a,b,r1,r2,mat,parent=body) {
    const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A);
    const mesh=add(new THREE.CylinderGeometry(r2,r1,v.length(),14,1),mat,...A.clone().add(B).multiplyScalar(.5).toArray(),0,0,0,parent);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return mesh;
  }
  // Structural beams and axles sit under the tapered box, with wheel contact at y=0.
  box(1.3,.13,1.76,edgeWood,0,.48,0);
  for(const x of [-.43,.43])box(.13,.13,2,iron,x,.38,0);
  for(const z of [-.74,.74])link([-.87,.28,z],[.87,.28,z],.065,.065,iron);
  // Four horizontal timber boards on each sloping side. Real gaps and end grain.
  for(let i=0;i<4;i++){
    const y=.60+i*.165,t=(y-.52)/.78,w=1.2+t*.53,d=1.72+t*.38;
    for(const side of [-1,1]){
      box(w,.153,.085,wood,0,y,side*d/2,side*.19,0,0);
      box(.085,.153,d-.08,wood,side*w/2,y,0,0,0,-side*.31);
    }
  }
  for(const y of [.57,1.18]){
    const t=(y-.52)/.78,w=1.2+t*.53,d=1.72+t*.38;
    for(const side of [-1,1]){
      box(w+.12,.09,.10,iron,0,y,side*(d/2+.045),side*.19);
      box(.10,.09,d+.11,iron,side*(w/2+.045),y,0,0,0,-side*.31);
    }
  }
  // Four reinforcing corner straps and rolled rim.
  for(const sx of [-1,1])for(const sz of [-1,1]) {
    link([sx*.58,.52,sz*.84],[sx*.86,1.29,sz*1.045],.052,.052,iron);
  }
  for(const side of [-1,1]){
    box(1.86,.072,.115,wornIron,0,1.29,side*1.06);
    box(.115,.072,2.12,wornIron,side*.875,1.29,0);
  }
  box(1.23,.09,.42,edgeWood,0,.93,-.05); // seat
  const boltGeo=remember(new THREE.SphereGeometry(.037,8,6));
  const bolts=[];
  for(const y of [.57,1.18])for(const side of [-1,1])for(const t of [-.8,-.4,0,.4,.8]){
    const f=(y-.52)/.78,w=1.2+f*.53,d=1.72+f*.38;
    bolts.push([t*w/2,y,side*(d/2+.103)]);
    bolts.push([side*(w/2+.10),y,t*d/2]);
  }
  const rivets=new THREE.InstancedMesh(boltGeo,rust,bolts.length),matrix=new THREE.Matrix4();
  bolts.forEach((p,i)=>{matrix.makeTranslation(...p);rivets.setMatrixAt(i,matrix)});rivets.castShadow=true;body.add(rivets);
  const wheels=[];
  for(const x of [-.78,.78])for(const z of [-.74,.74]){
    const wheel=new THREE.Group();wheel.position.set(x,.28,z);group.add(wheel);wheels.push(wheel);
    // Cylinder axis is rotated onto X. Rotation of wheel group around X rolls it.
    add(new THREE.CylinderGeometry(.28,.28,.14,24,1),iron,0,0,0,0,0,Math.PI/2,wheel);
    add(new THREE.CylinderGeometry(.28,.28,.025,24,1),wornIron,-Math.sign(x)*.072,0,0,0,0,Math.PI/2,wheel);
    add(new THREE.CylinderGeometry(.19,.19,.025,24,1),rust,Math.sign(x)*.078,0,0,0,0,Math.PI/2,wheel);
    add(new THREE.CylinderGeometry(.075,.075,.20,16),wornIron,0,0,0,0,0,Math.PI/2,wheel);
    for(let j=0;j<6;j++){
      const angle=j*Math.PI/3;link([Math.sign(x)*.095,Math.sin(angle)*.07,Math.cos(angle)*.07],[Math.sign(x)*.095,Math.sin(angle)*.20,Math.cos(angle)*.20],.019,.027,iron,wheel);
    }
  }
  // The original Navid design is preserved in one high-resolution alpha texture.
  // Depth-shape the character so hands meet side rails, legs stay inside the cart,
  // and the cape drops outside its back wall. The image never changes between frames.
  let resolveHero,rejectHero;
  const ready=new Promise((resolve,reject)=>{resolveHero=resolve;rejectHero=reject});
  const heroTexture=new THREE.TextureLoader().load(new URL('./echo-art/navid-seated-original.webp',import.meta.url).href,()=>resolveHero(),undefined,()=>rejectHero(new Error('Kunde inte ladda Navids originalutseende.')));
  heroTexture.colorSpace=THREE.SRGBColorSpace;heroTexture.anisotropy=4;heroTexture.generateMipmaps=true;heroTexture.minFilter=THREE.LinearMipmapLinearFilter;heroTexture.magFilter=THREE.LinearFilter;textures.push(heroTexture);
  // Navid's image already contains its carefully painted lighting. Relighting it
  // with the travelling spotlight bleached dark hair and changed the red cape.
  // Preserve its sRGB tones; depth, alpha-cut shadows and the cart remain 3D.
  const heroMaterial=remember(new THREE.MeshBasicMaterial({map:heroTexture,color:0xffffff,alphaTest:.045,transparent:false,side:THREE.DoubleSide,toneMapped:false}));
  const cols=48,rows=64,heroGeo=remember(new THREE.BufferGeometry()),positions=[],uv=[],indices=[],base=[];
  const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
    const u=c/cols,v=r/rows,x=(.5-u)*1.90,y=2.80-v*2.60,side=Math.abs(x);
    const cape=1-smooth((side-.27)/.15),lower=1-smooth((y-1.28)/.45);
    const hands=smooth((side-.58)/.22)*(1-smooth(Math.abs(y-1.33)/.40));
    const legs=(1-cape)*(1-smooth((y-1.15)/.25));
    const z=-.23-1.06*cape*lower+.78*hands+.78*legs;
    positions.push(x,y,z);base.push(x,y,z);uv.push(u,1-v);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*(cols+1)+c;indices.push(i,i+cols+1,i+1,i+1,i+cols+1,i+cols+2)}
  heroGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));heroGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));heroGeo.setIndex(indices);heroGeo.computeVertexNormals();
  const hero=new THREE.Mesh(heroGeo,heroMaterial);hero.name='Navid — original character design';hero.castShadow=true;hero.receiveShadow=false;
  hero.customDepthMaterial=remember(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:heroTexture,alphaTest:.045,side:THREE.DoubleSide}));
  group.add(hero);
  // Merge static meshes by material. Instanced curls/rivets stay instanced.
  function mergeStatic(root){
    const batches=new Map();root.updateMatrixWorld(true);
    for(const mesh of [...root.children])if(mesh.isMesh&&!mesh.isInstancedMesh){
      const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrix);
      if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(g);root.remove(mesh);
    }
    for(const [mat,geometries]of batches){
      const merged=new THREE.BufferGeometry();for(const attr of ['position','normal','uv']){
        const count=geometries.reduce((n,g)=>n+g.getAttribute('position').count,0),item=attr==='uv'?2:3,result=new Float32Array(count*item);let at=0;
        for(const g of geometries){const source=g.getAttribute(attr);if(source)result.set(source.array,at);at+=g.getAttribute('position').count*item}
        merged.setAttribute(attr,new THREE.BufferAttribute(result,item));
      }remember(merged);const m=new THREE.Mesh(merged,mat);m.castShadow=true;m.receiveShadow=true;root.add(m);geometries.forEach(g=>g.dispose());
    }
  }
  mergeStatic(body);for(const wheel of wheels)mergeStatic(wheel);
  const characterPositions=heroGeo.getAttribute('position');
  let lastWindTime=0,windPhase=0,filteredSpeed=0;
  function update(time,distance,speed,dt){
    const safeDistance=Number.isFinite(distance)?distance:0;
    for(const wheel of wheels)wheel.rotation.x=safeDistance/.28;
    const now=Number.isFinite(time)?time:lastWindTime;
    const elapsed=Math.max(0,now-lastWindTime);
    lastWindTime=now;
    // Render calls continue during menus: a stationary game clock freezes the
    // whole cloth pose, including its stored wind envelope, regardless of dt.
    const step=Math.min(.10,elapsed,Number.isFinite(dt)?Math.max(0,dt):elapsed);
    if(step<=0)return;
    const target=Math.min(45,Math.max(0,Number.isFinite(speed)?speed:0));
    const response=target>filteredSpeed?3.4:2.6,decay=Math.exp(-response*step);
    // Integrate the smoothed speed analytically. Wave travel remains continuous
    // through acceleration/braking and consistent at different render rates.
    const speedIntegral=target*step+(filteredSpeed-target)*(1-decay)/response;
    filteredSpeed=target+(filteredSpeed-target)*decay;
    windPhase+=step*.60+speedIntegral*.034;
    const pressure=Math.min(1.35,filteredSpeed/18);
    const amplitude=.006+.112*Math.pow(pressure,.82);
    const gust=.77+.15*Math.sin(windPhase*.473+.4)+.08*Math.sin(windPhase*.811-1.3);
    for(let i=0;i<characterPositions.count;i++){
      const x=base[i*3],y=base[i*3+1],z=base[i*3+2];
      const centre=1-smooth((Math.abs(x)-.22)/.11);
      const drop=Math.max(0,Math.min(1,(1.82-y)/1.62));
      const free=Math.pow(drop,1.28)*centre;
      if(free===0)continue; // Hair, neck, shoulders, hands and knees are fixed.
      const wave=.52*Math.sin(windPhase*2.331-drop*6.4+x*5.7)
        +.31*Math.sin(windPhase*3.713-drop*8.2-x*10.3+.5*Math.sin(windPhase*.277))
        +.17*Math.sin(windPhase*5.173-drop*11+x*7.1);
      const sway=.65*Math.sin(windPhase*1.913-drop*5.6)
        +.35*Math.sin(windPhase*3.127-drop*9.1+1.2);
      const strength=amplitude*gust*free;
      // Flow trails behind the cart. Gravity retains the resting drape; stronger
      // wind lifts and ripples the free hem without moving the anchored upper body.
      characterPositions.setXYZ(i,x+strength*.72*sway,
        y+strength*.18*(.5+.5*wave),z-strength*(.46+.70*wave));
    }
    characterPositions.needsUpdate=true;
    // No changing lighting normals: the prelit hero keeps a stable appearance.
    // The alpha-tested depth material follows these same deformed vertices.
  }
  update(0,0,0);
  return {group,ready,update,dispose(){for(const r of resources)r.dispose();for(const t of textures)t.dispose();group.removeFromParent();}};
}
