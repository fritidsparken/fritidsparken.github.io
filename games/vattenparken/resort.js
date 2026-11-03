// Shared island surfaces and instanced resort details.
(function (root) {
'use strict';
const T = THREE;
function create(scene, renderer, quality) {
  const high = quality === 'high', low = quality === 'low';
  const loader = new T.TextureLoader(), textures = new Map(), batches = new Map();
  const clock = {value: 0}, dummy = new T.Object3D();
  const texture = (type, channel, x, y) => {
    const key = [type,channel,x,y].join('/');
    if (textures.has(key)) return textures.get(key);
    const tex = loader.load('../minigolf/assets/materials/'+type+'-'+channel+'.webp');
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(x,y); tex.anisotropy = high ? 4 : 2;
    if (channel === 'color') tex.colorSpace = T.SRGBColorSpace;
    textures.set(key,tex); return tex;
  };
  const surfaces=new Map();
  function surface(type,x,y,color='#ffffff') {
    const key=[type,x,y,color].join('/');if(surfaces.has(key))return surfaces.get(key);
    const mat = new T.MeshStandardMaterial({map:texture(type,'color',x,y),color,roughness:.82});
    if(!low){mat.normalMap=texture(type,'normal',x,y);mat.normalScale.set(.65,.65);}
    if(high)mat.roughnessMap=texture(type,'roughness',x,y);
    surfaces.set(key,mat);return mat;
  }
  function instance(geometry, material, x,y,z, sx,sy,sz, ax=0,ay=0,az=0) {
    const key=geometry.uuid+material.uuid;
    if(!batches.has(key)) batches.set(key,{geometry,material,matrices:[]});
    dummy.position.set(x,y,z); dummy.scale.set(sx,sy,sz); dummy.rotation.set(ax,ay,az);
    dummy.updateMatrix(); batches.get(key).matrices.push(dummy.matrix.clone());
  }
  const wood=surface('wood',1,2,'#c6a57e'),rock=surface('rock',2,2,'#a8a19a');
  const plank=new T.BoxGeometry(1,1,1), pole=new T.CylinderGeometry(.85,1,1,12);
  const rope=new T.MeshStandardMaterial({color:'#a58658',roughness:.95});
  const metal=new T.MeshStandardMaterial({color:'#9dabb2',metalness:.78,roughness:.34});
  function beam(a,b,radius,material) {
    const d=b.clone().sub(a);
    dummy.position.copy(a).lerp(b,.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());
    dummy.scale.set(radius,d.length(),radius);dummy.updateMatrix();
    const key=pole.uuid+material.uuid;
    if(!batches.has(key))batches.set(key,{geometry:pole,material,matrices:[]});
    batches.get(key).matrices.push(dummy.matrix.clone());
  }
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  function bridge(cx,z,width) {
    const span=width/2;
    for(let x=-span;x<span;x+=.62)instance(plank,wood,cx+x+.3,1.29,z,.59,.24,4.7);
    for(const s of [-1,1])for(let x=-span;x<=span;x+=4){
      const side=z+s*2.35;
      instance(pole,wood,cx+x,1.5,side,.13,3.4,.13);
      if(x+4<=span){beam(v(cx+x,2.95,side),v(cx+x+2,2.65,side),.045,rope);beam(v(cx+x+2,2.65,side),v(cx+x+4,2.95,side),.045,rope);}
    }
  }
  function boulder(x,y,z,sx,sy,sz,i){
    const g=stones[Math.abs(i)%stones.length];
    instance(g,rock,x,y,z,sx,sy,sz,.13*Math.sin(i),i*2.39,.14*Math.cos(i));
  }
  const stones=Array.from({length:5},(_,i)=>{
    const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;
    for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j);
      const k=1+.14*Math.sin(4*x+2*z+i)*Math.cos(3*y-i)+.075*Math.cos(6*z-y);
      p.setXYZ(j,x*k,Math.sign(y)*Math.pow(Math.abs(y),.78)*k,z*k);}
    g.computeVertexNormals();return g;
  });
  const atlas=loader.load('assets/botanical.webp');atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=high?4:2;
  textures.set('botanical',atlas);
  const foliage=new T.MeshStandardMaterial({map:atlas,alphaTest:.42,side:T.DoubleSide,roughness:.65});
  // Warp each textured lamina around its midrib. The cells occupy a shared atlas.
  function blade(cell,length,width,arch,droop){
    const g=new T.PlaneGeometry(1,1,14,4),p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){
      const u=uv.getX(i),v=uv.getY(i);
      p.setXYZ(i,length*u,arch*Math.sin(Math.PI*u)-droop*u*u-.16*Math.abs(2*v-1),width*(v-.5));
      uv.setXY(i,(cell%2+u)*.5,((cell<2?1:0)+v)*.5);
    }
    g.computeVertexNormals();return g;
  }
  const leaf=[blade(1,2.5,1.3,1.15,-.38),blade(3,2.15,1.9,1.28,-.28)];
  const petal=blade(2,.87,.87,.17,-.17);
  function planting(x,z,seed) {
    const n=low?4:high?14:9;
    for(let i=0;i<n;i++){
      const a=seed+i*2.399,r=.45+Math.sqrt(i)*.65;
      const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
      instance(leaf[i%2],foliage,px,.82,pz,.7+(i%3)*.18,1.1+(i%4)*.12,1,0,a,.16);
      if(i%4===0)instance(petal,foliage,px,1.65,pz,.9,1.2,.95,-.85,a,.18);
    }
  }
  const rib=new T.TorusGeometry(3.52,.075,5,18,Math.PI);
  function decorate(c){
    const start=c.frame(0).position;
    for(let u=.018;u<.99;u+=.064){
      const f=c.frame(u);

      // Collars follow the open trough instead of obstructing its interior.
      const obj=new T.Mesh(rib,metal); const basis=new T.Matrix4().makeBasis(f.right,f.up.clone().negate(),f.tangent);
      obj.quaternion.setFromRotationMatrix(basis);obj.position.copy(f.position).addScaledVector(f.up,3.1);obj.scale.y=.92;obj.updateMatrix();const key=rib.uuid+metal.uuid;if(!batches.has(key))batches.set(key,{geometry:rib,material:metal,matrices:[]});batches.get(key).matrices.push(obj.matrix.clone());
    }
    for(let j=0;j<19;j++){const x=start.x-4.5+j*.5;instance(plank,wood,x,start.y-.04,start.z-3,.48,.16,8);}
    for(let j=0;j<=8;j++){const x=start.x-4+j;
      beam(v(x,start.y,start.z-7),v(x,start.y+1.35,start.z-7),.075,wood);
    }
    beam(v(start.x-4.4,start.y+1.35,start.z-7),v(start.x+4.4,start.y+1.35,start.z-7),.12,wood);
    for(const side of [-1,1]){
      const x=start.x+side*4;
      for(let z of [-7,1])beam(v(x,1,start.z+z),v(x,start.y+4.5,start.z+z),.18,metal);
      beam(v(x,start.y+1.3,start.z-7),v(x,start.y+1.3,start.z+1),.09,metal);
      for(let h=1;h<start.y-6;h+=8){
        beam(v(x,h,start.z-7),v(x,h+8,start.z+1),.095,metal);
        beam(v(x,h,start.z+1),v(x,h+8,start.z-7),.095,metal);
      }
    }
    // The handrail follows the climb path through both revolutions.
    const rail=[];
    for(let k=0;k<=64;k++){const a=k/64*Math.PI*4,y=2.35+k/64*(start.y-1);
      const at=v(start.x+Math.cos(a)*6.8,y,start.z-3+Math.sin(a)*6.8);rail.push(at);
      if(k%4===0)beam(at.clone().add(v(0,-1.35,0)),at,.07,metal);
    }
    scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rail),96,.085,6,false),metal));
    const bank=c.x+(c.index%2?15:-15);
    for(let j=0;j<7;j++){const z=73+j*3; boulder(bank+Math.cos(j)*2,1,z,2+j%3,1+j%2,2.4,j+c.index);if(j%2===0)planting(bank,z,c.index+j);}
    if(c.index===3) for(let j=0;j<26;j++){
      const a=j*2.399,r=9+j%3*2;boulder(c.x+Math.cos(a)*r,2+(j%4)*2,-42+Math.sin(a)*r,5,6+j%3,5.5,j);}
  }
  function finish(){
    bridge(-4,111,48);
    for(let j=0;j<13;j++){const a=j*2.399,r=3+j%3;boulder(Math.cos(a)*r,2+j%4*1.6,59+Math.sin(a)*r,3.3+j%3,4+j%4,3.1,j);}
    for(const side of [-1,1])for(let j=0;j<7;j++){
      const x=side*(6+j*2.6),z=131+Math.sin(j*1.1)*2;
      if(j%2)boulder(x,.86,z,1.4+j%3,.8+j%2,1.1,j);
      planting(x,z,side*j+8);
    }
    for(let i=0;i<22;i++){const a=i*2.399;planting(Math.cos(a)*123,Math.sin(a)*76,i);}
    for(const batch of batches.values()){
      const mesh=new T.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);
      batch.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
    }
    batches.clear();
  }
  return {blade,foliage,surface,decorate,finish,clock,dispose(){textures.forEach(t=>t.dispose());}};
}
root.WaterparkResort={create};
})(window);
