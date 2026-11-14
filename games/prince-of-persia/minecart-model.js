// Navid and his cart are geometry, viewed along +Z from directly behind.
// No character images, billboards, frame swaps or camera-facing planes.
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
  const woodMap=surfaceTexture('wood'), weave=surfaceTexture('cloth');
  const wood=material({color:0xbba286,map:woodMap,roughness:.91,metalness:0});
  const edgeWood=material({color:0x39271c,map:woodMap,roughness:.93});
  const iron=material({color:0x363b3c,metalness:.82,roughness:.43});
  const wornIron=material({color:0x7e827c,metalness:.86,roughness:.29});
  const rust=material({color:0x71513c,metalness:.5,roughness:.72});
  const skin=material({color:0xc78d5b,roughness:.75});
  const linen=material({color:0xc3ad83,map:weave,roughness:.97});
  const leather=material({color:0x4b2c1b,roughness:.83});
  const gold=material({color:0xb79859,roughness:.46,metalness:.53});
  const crimson=material({color:0x85251e,map:weave,bumpMap:weave,bumpScale:.009,roughness:.98,side:THREE.DoubleSide});
  const darkRed=material({color:0x661b19,map:weave,roughness:.96});
  const teal=material({color:0x205b5a,map:weave,roughness:1});
  const hairMat=material({color:0x140f0c,roughness:.66});
  const boot=material({color:0x33271d,roughness:.9});
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
  // A seated anatomical silhouette: knees and boots remain within the cart.
  ellipsoid(.28,.17,.25,linen,0,1.10,.05);
  for(const side of [-1,1]){
    link([side*.16,1.09,.08],[side*.26,.96,.55],.135,.12,linen);
    ellipsoid(.13,.13,.13,linen,side*.26,.96,.55);
    link([side*.26,.96,.55],[side*.26,.60,.7],.11,.075,linen);
    ellipsoid(.11,.09,.20,boot,side*.26,.57,.77);
  }
  // Lathed torso has waist, ribcage and shoulder contours rather than a box body.
  const torsoProfile=[new THREE.Vector2(.22,0),new THREE.Vector2(.26,.09),new THREE.Vector2(.27,.30),new THREE.Vector2(.34,.59),new THREE.Vector2(.35,.70),new THREE.Vector2(.28,.78),new THREE.Vector2(.15,.83)];
  const torso=add(new THREE.LatheGeometry(torsoProfile,24),linen,0,1.16,-.04);torso.scale.z=.67;
  const sash=add(new THREE.CylinderGeometry(.273,.26,.17,24),teal,0,1.27,-.04);sash.scale.z=.72;
  const belt=add(new THREE.CylinderGeometry(.273,.265,.072,24),leather,0,1.19,-.04);belt.scale.z=.73;
  box(.17,.1,.055,gold,0,1.2,.17);
  for(const side of [-1,1]){
    ellipsoid(.16,.19,.17,skin,side*.34,1.91,-.01);
    link([side*.36,1.91,.0],[side*.53,1.59,.27],.145,.11,skin);
    ellipsoid(.112,.115,.112,skin,side*.53,1.59,.27);
    link([side*.53,1.59,.27],[side*.76,1.33,.57],.108,.073,skin);
    link([side*.69,1.41,.49],[side*.76,1.33,.57],.091,.081,leather);
    link([side*.72,1.37,.53],[side*.75,1.34,.56],.095,.087,wornIron);
    const hand=ellipsoid(.085,.052,.115,skin,side*.79,1.32,.64);hand.rotation.z=side*.25;
    // Four fingers curl around the side rail.
    for(let k=0;k<4;k++)link([side*.82,1.30,.57+k*.042],[side*.89,1.255,.57+k*.042],.014,.011,skin);
    // Embroidered sleeveless shoulder edging.
    link([side*.25,1.99,-.14],[side*.35,1.86,.12],.023,.023,gold);
  }
  link([0,1.99,-.02],[0,2.21,-.01],.12,.105,skin);
  // Head is looking straight along the rail, +Z. Profile details are front-facing.
  ellipsoid(.192,.26,.18,skin,0,2.36,.015);
  ellipsoid(.12,.09,.10,skin,0,2.24,.105);
  ellipsoid(.041,.065,.045,skin,0,2.36,.183);
  for(const side of [-1,1])ellipsoid(.044,.073,.026,skin,side*.185,2.35,.008);
  // Small overlapping wavy tufts lie tangent to the scalp, not spherical beads.
  ellipsoid(.199,.197,.185,hairMat,0,2.475,-.008);
  ellipsoid(.179,.164,.085,hairMat,0,2.38,-.114);
  const curlGeo=remember(new THREE.SphereGeometry(1,10,7));
  const curls=new THREE.InstancedMesh(curlGeo,hairMat,180),dummy=new THREE.Object3D();
  let rng=71;const rand=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296};
  const normal=new THREE.Vector3(),hairUp=new THREE.Vector3(0,1,0);
  for(let i=0;i<180;i++){
    const az=i*2.39996323,vert=-.14+rand()*1.10,rad=Math.sqrt(1-vert*vert);
    dummy.position.set(Math.cos(az)*rad*.202,2.46+vert*.207,Math.sin(az)*rad*.184-.015);
    normal.set(Math.cos(az)*rad,vert,Math.sin(az)*rad).normalize();
    dummy.quaternion.setFromUnitVectors(hairUp,normal);dummy.rotateY(az*.35+rand()*.8);
    dummy.scale.set(.023+rand()*.014,.014+rand()*.011,.040+rand()*.023);dummy.updateMatrix();curls.setMatrixAt(i,dummy.matrix);
  }
  curls.castShadow=true;body.add(curls);
  // Crossed leather harness shows around the cape, plus a gold buckle.
  link([-.23,1.92,-.18],[.21,1.35,-.2],.025,.025,leather);
  link([.23,1.92,-.18],[-.21,1.35,-.2],.025,.025,leather);
  box(.065,.08,.025,gold,.20,1.39,-.23,0,0,-.57);
  // Red scarf collar wraps the neck with overlapping cloth folds.
  for(let i=0;i<3;i++){
    const c=add(new THREE.TorusGeometry(.16+i*.025,.045,7,28),i===2?darkRed:crimson,0,2.08-i*.032,-.04,Math.PI/2+.12);
    c.scale.x=1.45;c.scale.y=.86;
  }
  const cols=32,rows=40,capeGeometry=new THREE.BufferGeometry(),positions=[],uv=[],indices=[],bases=[];
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
    const u=c/cols,v=r/rows,edge=u*2-1;
    const width=.245+.12*Math.sin(v*Math.PI*.86);
    const x=edge*width+.17*v*v+.018*Math.sin(v*8)*Math.abs(edge);
    // Shoulder -> back -> over the rear timber rim -> free, uneven trailing hem.
    const y=2.075-1.43*v-Math.pow(v,9)*(.035+.048*(.5+.5*Math.sin(u*31+1)));
    const drop=Math.min(1,v/.59),ease=drop*drop*(3-2*drop);
    const folds=Math.sin(u*Math.PI*7+v*1.8)*(.012+.035*v)*Math.sin(Math.PI*Math.min(1,v*2));
    const z=-.225-.91*ease-.115*Math.max(0,(v-.59)/.41)+folds+.055*Math.pow(Math.abs(edge),6)*Math.sin(v*Math.PI);
    positions.push(x,y,z);bases.push(x,y,z);uv.push(u*2,v*3);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*(cols+1)+c;indices.push(i,i+cols+1,i+1,i+1,i+cols+1,i+cols+2)}
  capeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));capeGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));capeGeometry.setIndex(indices);capeGeometry.computeVertexNormals();remember(capeGeometry);
  const cape=new THREE.Mesh(capeGeometry,crimson);cape.castShadow=true;cape.receiveShadow=true;group.add(cape);
  // Thin embroidered border is a mesh ribbon following the same animated cloth.
  const trimGeom=new THREE.BufferGeometry(),trimPos=new Float32Array((rows+1)*4*3),trimIdx=[];
  for(let r=0;r<rows;r++)for(let side=0;side<2;side++){const i=r*4+side*2;trimIdx.push(i,i+4,i+1,i+1,i+4,i+5)}
  trimGeom.setAttribute('position',new THREE.BufferAttribute(trimPos,3));trimGeom.setIndex(trimIdx);remember(trimGeom);
  const trim=new THREE.Mesh(trimGeom,material({color:0x753022,map:weave,roughness:1,side:THREE.DoubleSide}));group.add(trim);
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
  const capePositions=capeGeometry.getAttribute('position');
  function update(time,distance,speed){
    for(const wheel of wheels)wheel.rotation.x=distance/.28;
    const moving=Math.min(1,Math.max(0,speed)/12);
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
      const index=r*(cols+1)+c,i=index*3,v=r/rows,u=c/cols,free=v*v;
      capePositions.setXYZ(index,bases[i]+Math.sin(time*3.6-v*7+u*2)*.028*free*moving,bases[i+1]+Math.sin(time*4-v*8)*.018*free*moving,bases[i+2]+Math.sin(u*13-v*4+time*4)*(.018+.05*free)*v+Math.sin(time*3-v*6)*.045*free*moving);
    }
    capePositions.needsUpdate=true;capeGeometry.computeVertexNormals();
    const t=trimGeom.getAttribute('position');
    for(let r=0;r<=rows;r++)for(let side=0;side<2;side++)for(let edge=0;edge<2;edge++){
      const outer=r*(cols+1)+(side?cols:0),inner=r*(cols+1)+(side?cols-1:1),idx=r*4+side*2+edge,amount=edge*.25;
      t.setXYZ(idx,capePositions.getX(outer)+(capePositions.getX(inner)-capePositions.getX(outer))*amount,capePositions.getY(outer)+(capePositions.getY(inner)-capePositions.getY(outer))*amount,capePositions.getZ(outer)+(capePositions.getZ(inner)-capePositions.getZ(outer))*amount-.003);

    }
    t.needsUpdate=true;trimGeom.computeVertexNormals();
  }
  update(0,0,0);
  return {group,update,dispose(){for(const r of resources)r.dispose();for(const t of textures)t.dispose();group.removeFromParent();}};
}
