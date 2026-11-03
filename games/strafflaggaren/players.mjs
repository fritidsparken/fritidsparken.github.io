// Bind-pose surfaces are stored together by material. Adjacent rings blend across
// elbow, knee and hip joints without opening gaps when the animation bends them.
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => { x = clamp01(x); return x*x*(3-2*x); };
const TAU = Math.PI * 2;

function knit(T) {
  const size=64, data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const j=(y*size+x)*4, variation=Math.sin(x*Math.PI/2+Math.sin(y*Math.PI/4))*.5;
    data.set([128+variation*25,128+Math.sin(y*Math.PI/2)*13,251,255],j);
  }
  const tex=new T.DataTexture(data,size,size);
  tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.repeat.set(16,20); tex.needsUpdate=true;
  return tex;
}
function print(T,number,keeper) {
  const c=document.createElement('canvas');c.width=256;c.height=256;
  const g=c.getContext('2d');
  g.textAlign='center';g.fillStyle=keeper?'#fff9ea':'#102941';
  g.font='bold 25px Arial,sans-serif';g.fillText('FRITIDSPARKEN',128,42);
  g.save();g.translate(128,0);g.scale(.82,1);
  g.font='900 188px Arial,sans-serif';g.fillText(String(number),0,208);g.restore();
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.9});
}
function human(T,scene,keeper,materials) {
  const root=new T.Group(),turn=new T.Group();scene.add(root);root.add(turn);
  turn.rotation.y=keeper?Math.PI:0;
  root.userData.footballActor=true;
  const bones=[], index=new Map(), origin=new Map(), batches=new Map();
  function joint(name,parent,x,y,z){
    const b=new T.Bone();b.name=name;b.position.set(x,y,z);
    (parent||turn).add(b);const q=parent?origin.get(parent):[0,0,0];
    origin.set(b,[x+q[0],y+q[1],z+q[2]]);
    index.set(b,bones.length);bones.push(b);return b;
  }
  const hip=joint('hips',null,0,0,0),spine=joint('spine',hip,0,.12,0);
  const neck=joint('neck',spine,0,.405,0),head=joint('head',neck,0,.076,0);
  function batch(m){
    if(!batches.has(m))batches.set(m,{xyz:[],uv:[],indices:[],weights:[],joints:[],lod:[]});
    return batches.get(m);
  }
  // Profiles list [height, lateral radius, depth radius, lateral offset, depth offset, blend].
  function coarse(d,base,segments,rows,lonStep,rowStep){
    for(let r=0;r<rows-1;r+=rowStep)for(let j=0;j<segments;j+=lonStep){
      const a=base+r*(segments+1)+j,b=base+Math.min(r+rowStep,rows-1)*(segments+1)+j;
      const jump=Math.min(lonStep,segments-j);d.lod.push(a,a+jump,b+jump,a,b+jump,b);
    }
  }
  function surface(b,m,rings,segments=20,next=null,rowStep=1){
    const garment=m===materials.kit||m===materials.red||m===materials.shorts||m===materials.keeperShorts||m===materials.socks;
    if(garment&&rings.length>2){
      // Interpolate the cloth profile so hems, shoulders and shorts curve continuously.
      const profile=rings.map(r=>Array.from({length:6},(_,i)=>r[i]||0)), rounded=[];
      for(let k=0;k<profile.length-1;k++)for(let step=0;step<3;step++){
        const t=step/3,p0=profile[Math.max(0,k-1)],p1=profile[k],p2=profile[k+1],p3=profile[Math.min(profile.length-1,k+2)];
        rounded.push(p1.map((v,i)=>{
          if(i===0||i===5)return v+(p2[i]-v)*t;
          const value=.5*((2*v)+(-p0[i]+p2[i])*t+(2*p0[i]-5*v+4*p2[i]-p3[i])*t*t+(-p0[i]+3*v-3*p2[i]+p3[i])*t*t*t);
          return i===1||i===2?Math.max(.001,value):value;
        }));
      }
      rounded.push(profile.at(-1));rings=rounded;segments=36;
    }
    const d=batch(m),base=d.xyz.length/3, o=origin.get(b);
    coarse(d,base,segments,rings.length,garment?1:segments>=20?2:Math.max(1,Math.floor(segments/8)),rowStep);
    for(let k=0;k<rings.length;k++){
      const [y,rx,rz,x=0,z=0,w=0]=rings[k];
      for(let j=0;j<=segments;j++){
        const a=TAU*j/segments;
        d.xyz.push(o[0]+x+rx*Math.sin(a),o[1]+y,o[2]+z+rz*Math.cos(a));
        d.uv.push(j/segments,k/(rings.length-1));
        d.joints.push(index.get(b),next?index.get(next):0,0,0);d.weights.push(1-w,w,0,0);
        if(k&&j){const v=base+k*(segments+1)+j;d.indices.push(v-segments-2,v-segments-1,v, v-segments-2,v,v-1);}
      }
    }
  }
  function oval(b,m,x,y,z,rx,ry,rz,segs=16){
    const rings=[];for(let i=0;i<=10;i++){const a=Math.PI*i/10-Math.PI/2;
      rings.push([y+ry*Math.sin(a),Math.max(.0001,rx*Math.cos(a)),Math.max(.0001,rz*Math.cos(a)),x,z]);}
    surface(b,m,rings,segs,null,2);
  }
  const {kit,red,shorts,keeperShorts,skin,hair,sole,boot,socks,gloves,trim,eyes,lips,white}=materials;
  const shirt=keeper?red:kit, pant=keeper?keeperShorts:shorts,sock=keeper?red:socks;
  surface(hip,pant,[[-.16,.157,.12],[-.10,.182,.14],[.03,.175,.128],[.09,.164,.12]]);
  surface(spine,shirt,[[-.12,.187,.144,0,.004],[-.105,.190,.146],[0,.155,.12],[.12,.18,.13],[.24,.212,.137],[.30,.22,.117],[.34,.168,.095],[.38,.089,.074]],30);
  surface(spine,trim,[[.361,.124,.091],[.376,.103,.084],[.384,.088,.075]],24);
  surface(neck,skin,[[-.045,.068,.06],[.06,.062,.066],[.09,.074,.074]]);
  surface(head,skin,[[-.012,.036,.059,0,-.025],[.013,.072,.080,0,-.018],[.054,.095,.088,0,-.01],[.10,.108,.098],[.16,.11,.102],[.21,.10,.1],[.25,.072,.083],[.267,.006,.012]],32);
  oval(head,skin,0,.091,-.097,.022,.043,.027);
  oval(head,lips,0,.043,-.093,.030,.006,.006);
  for(const s of [-1,1]){
    oval(head,skin,s*.107,.091,.004,.022,.040,.019);
    oval(head,white,s*.045,.126,-.089,.024,.009,.009);
    oval(head,eyes,s*.044,.126,-.097,.010,.009,.004);
    oval(head,hair,s*.045,.147,-.087,.028,.005,.008);
  }
  // A hairline that rises over the forehead and follows the back of the skull.
  const hairBatch=batch(hair),start=hairBatch.xyz.length/3,ho=origin.get(head);
  coarse(hairBatch,start,32,9,2,2);
  for(let k=0;k<=8;k++)for(let j=0;j<=32;j++){
    const a=j/32*TAU,baseAngle=-.08-.62*Math.cos(a),p=baseAngle+(Math.PI/2-baseAngle)*k/8;
    const wave=1+.025*Math.cos(7*a+p*4)+.018*Math.sin(11*a-p*5);
    hairBatch.xyz.push(ho[0]+.120*Math.sin(a)*Math.cos(p)*wave,ho[1]+.179+.119*Math.sin(p)*wave,ho[2]+.003+.117*Math.cos(a)*Math.cos(p)*wave);
    hairBatch.uv.push(j/32,k/8);hairBatch.weights.push(1,0,0,0);hairBatch.joints.push(index.get(head),0,0,0);
    if(k&&j){const v=start+k*33+j;hairBatch.indices.push(v-34,v-33,v,v-34,v,v-1);}
  }
  const sides=[];
  for(const s of [-1,1]){
    const upper=joint('shoulder'+s,spine,s*.202,.279,0),elbow=joint('elbow'+s,upper,0,-.275,0),hand=joint('hand'+s,elbow,0,-.245,.008);
    const thigh=joint('thigh'+s,hip,s*.104,-.018,0),knee=joint('knee'+s,thigh,0,-.424,0),ankle=joint('ankle'+s,knee,0,-.408,0);
    surface(upper,shirt,[[-.186,.071,.077],[-.174,.08,.08],[-.088,.09,.092],[-.008,.091,.095],[.034,.067,.068],[.055,.025,.025]]);
    surface(upper,keeper?shirt:skin,[[-.29,.051,.052,0,0,.7],[-.253,.055,.06,0,0,.15],[-.218,.066,.067],[-.167,.072,.073]],20,elbow);
    surface(upper,trim,[[-.184,.073,.078],[-.176,.079,.081]]);
    surface(elbow,keeper?shirt:skin,[[-.256,.041,.034],[-.201,.044,.039],[-.099,.059,.052],[-.035,.057,.055],[.007,.053,.052]],20);
    const fingers=keeper?gloves:skin,factor=keeper?1.23:1;
    oval(hand,fingers,0,-.043,-.004,.048*factor,.073*factor,.026*factor);
    for(let i=0;i<4;i++)oval(hand,fingers,(i-1.5)*.022*factor,-.10*factor+(i===3?.012:0),-.009,.013*factor,.043*factor,.014*factor,10);
    oval(hand,fingers,-s*.049,-.048,-.005,.022,.044,.018);
    if(keeper){
      surface(hand,keeperShorts,[[-.029,.054,.042],[.012,.049,.04]]);
      oval(hand,white,0,-.052,.025,.048,.050,.015);
    }
    surface(thigh,pant,[[-.282,.090,.100],[-.265,.097,.108],[-.143,.108,.126],[0,.105,.123],[.053,.085,.107]]);
    surface(thigh,skin,[[-.444,.062,.067,0,-.004,.82],[-.392,.069,.077,0,-.005,.23],[-.34,.079,.092],[-.254,.087,.099]],24,knee);
    surface(knee,sock,[[-.421,.042,.052],[-.31,.047,.054],[-.20,.067,.077,0,.006],[-.12,.073,.083,0,.005],[-.055,.063,.068],[-.008,.062,.068]]);
    surface(knee,trim,[[-.073,.067,.072],[-.065,.066,.072]]);
    surface(knee,skin,[[-.019,.062,.068],[.016,.062,.068]]);
    oval(ankle,boot,0,-.014,-.042,.066,.065,.132,24);
    oval(ankle,sole,0,-.054,-.050,.068,.021,.137);
    for(const side of [-1,1])for(const z of [-.13,-.067,.035])oval(ankle,sole,side*.042,-.074,z,.013,.017,.015,8);
    for(let i=0;i<3;i++)oval(ankle,white,0,.034-i*.007,-.06-i*.02,.030,.005,.005,10);
    sides.push({s,upper,elbow,hand,thigh,knee,ankle});
  }
  // Bind with neutral facing so all bone-local offsets agree with the skin data.
  turn.rotation.y=0;turn.updateMatrixWorld(true);
  const skeleton=new T.Skeleton(bones);
  for(const [material,d] of batches){
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(d.xyz,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(d.uv,2));
    geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(d.joints,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(d.weights,4));
    geo.userData.softwareIndices=new Uint16Array(d.lod);geo.setIndex(d.indices);geo.computeVertexNormals();
    const normals=geo.attributes.normal,positions=geo.attributes.position,seams=new Map();
    for(let i=0;i<positions.count;i++){
      const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>v.toFixed(6)).join(',');
      if(!seams.has(key))seams.set(key,[]);seams.get(key).push(i);
    }
    for(const ids of seams.values()){
      if(ids.length<2)continue;
      const normal=new T.Vector3();
      for(const i of ids)normal.add(new T.Vector3().fromBufferAttribute(normals,i));
      normal.normalize();for(const i of ids)normals.setXYZ(i,normal.x,normal.y,normal.z);
    }
    const mesh=new T.SkinnedMesh(geo,material);
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;turn.add(mesh);mesh.bind(skeleton,new T.Matrix4());
  }
  const decal=new T.Mesh(new T.PlaneGeometry(.259,.246),print(T,keeper?1:10,keeper));
  decal.position.set(0,.182,.14);spine.add(decal);
  const badge=new T.Mesh(new T.CircleGeometry(.028,12),trim);
  badge.position.set(.088,.249,-.134);badge.rotation.y=Math.PI;spine.add(badge);
  turn.rotation.y=keeper?Math.PI:0;
  return {root,turn,hip,spine,neck,head,sides};
}

export function createPlayers(T,scene){
  const weave=knit(T),mat=(color,options={})=>new T.MeshStandardMaterial({color,roughness:.85,...options});
  const fabric=color=>mat(color,{normalMap:weave,normalScale:new T.Vector2(.21,.21)});
  const m={kit:fabric('#edbf23'),red:fabric('#ba292c'),shorts:fabric('#174583'),keeperShorts:fabric('#202128'),
    skin:mat('#bd896b',{roughness:.70}),hair:mat('#382c24'),sole:mat('#30353a'),
    boot:mat('#222a31',{roughness:.43}),socks:fabric('#edbe28'),gloves:mat('#d1e890',{roughness:.58}),
    trim:fabric('#233a55'),eyes:mat('#342821'),lips:mat('#a76e59'),white:mat('#eadfcf')};
  const kicker=human(T,scene,false,m),keeper=human(T,scene,true,m);
  function animate(state,pose,dt,t){
    const b=state.ball, run=state.phase==='run'?clamp01(state.clock/.65):b?1:0;
    const follow=b?smooth(b.age/.23):0, settle=b?smooth((b.age-.23)/.55):0;
    const end=state.phase==='result'?smooth((b?.age-.45)/.6):0;
    const stride=Math.sin(run*TAU*1.35),shotFront=b?(1-settle)*(.53+follow*.72):0;
    const lift=Math.sin(run*Math.PI), breath=Math.sin(t*2.7),win=end*(b?.goal?1:0),miss=end-win;
    kicker.root.position.set(-.64+.45*smooth(run),.955+.031*Math.abs(stride)*lift,12.72-1.72*smooth(run));
    kicker.hip.rotation.y=-.14+.16*stride*lift+shotFront*.22;
    kicker.spine.rotation.set(-.05-.15*lift+.11*shotFront-.18*miss,-.10*stride*lift,.015*breath+shotFront*.13);
    kicker.head.rotation.set(.06+.18*lift+.23*miss,-.16*(1-run)+.05*breath,.02*breath);
    kicker.spine.scale.set(1+.004*breath,1+.004*breath,1+.009*breath);
    for(const limb of kicker.sides){
      const s=limb.s,isFoot=s===1;
      limb.thigh.rotation.set(s*stride*.56*lift+(isFoot?shotFront:.13*lift),0,s*.055);
      // Positive shin extension drives the toe towards the goal (-Z).
      limb.knee.rotation.x=-.09-.56*Math.max(0,-s*stride)*lift-(isFoot?.77:0)*Math.sin(Math.PI*clamp01((run-.56)/.44))+.055*shotFront;
      limb.ankle.rotation.x=.06+Math.max(0,-limb.knee.rotation.x)*.16;
      limb.upper.rotation.set(-s*stride*.47*lift-.04*breath,0,s*(.15+.19*lift+.26*shotFront+2.02*win));
      limb.elbow.rotation.x=.22+.31*lift+.15*win;
    }
    const dive=smooth(state.keeper.time/.42),recover=state.phase==='result'?smooth((state.keeper.time-1.15)/.71):0;
    keeper.root.position.set(pose.x,pose.y+( .94-pose.y)*recover,.48);
    keeper.root.rotation.z=pose.angle*(1-recover);keeper.spine.rotation.x=-.09*(1-dive)+.09*recover;
    keeper.head.rotation.x=.04*Math.sin(t*2.3)-.12*dive*(1-recover);
    keeper.hip.rotation.z=.025*breath*(1-dive);keeper.spine.scale.z=1+.014*breath;
    const reach=dive*(1-recover),height=state.keeper.ty-.94;
    for(const limb of keeper.sides){
      const s=limb.s,cheer=end*(b?.saved?1:0)*recover;
      limb.upper.rotation.z=s*(.96+.045*Math.sin(t*3+s)+( .36+height*.38)*reach+1.25*cheer);
      limb.upper.rotation.x=.17+.17*reach;limb.elbow.rotation.x=.24+.12*(1-reach);
      limb.hand.rotation.z=s*.1;limb.thigh.rotation.set(.24-.18*reach,0,s*(.23+.12*reach));
      limb.knee.rotation.x=-.44+.33*reach;limb.ankle.rotation.x=.18*(1-reach);
    }
  }
  return {kicker,keeper,kit:m.kit,gloves:m.gloves,animate};
}

// The Voronoi cells of icosahedron vertices and face centres form a stitched
// football: twelve dark pentagons alternating with twenty ivory hexagons.
export function createMatchBall(T,scene){
  const phi=(1+Math.sqrt(5))/2,vertices=[];
  function unit(x,y,z){const n=Math.hypot(x,y,z);return [x/n,y/n,z/n];}
  for(const a of [-1,1])for(const b of [-phi,phi]){
    vertices.push(unit(0,a,b),unit(a,b,0),unit(b,0,a));
  }
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cells=[...vertices];
  for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++){
    const a=vertices[i],b=vertices[j],c=vertices[k];
    if(dot(a,b)>.44&&dot(b,c)>.44&&dot(a,c)>.44)cells.push(unit(a[0]+b[0]+c[0],a[1]+b[1]+c[1],a[2]+b[2]+c[2]));
  }
  const width=512,height=256,col=new Uint8Array(width*height*4),bump=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++){
    const lat=((y+.5)/height-.5)*Math.PI;
    for(let x=0;x<width;x++){
      const lon=(x+.5)/width*TAU,dir=[-Math.cos(lon)*Math.cos(lat),Math.sin(lat),Math.sin(lon)*Math.cos(lat)];
      let best=-2,second=-2,id=0;
      for(let i=0;i<cells.length;i++){
        const d=dot(dir,cells[i])-(i<12?.013:0);
        if(d>best){second=best;best=d;id=i;}else if(d>second)second=d;
      }
      const gap=best-second,edge=smooth(gap/.007),seam=.68+.32*edge;
      const rgb=id<12?[30,49,66]:[244,242,227];
      const idx=(y*width+x)*4,leather=2*Math.sin(x*2.23+y*.91);
      col.set(rgb.map(v=>Math.min(255,v*seam+leather)).concat(255),idx);
      const h=110+edge*104+leather*5;bump.set([h,h,h,255],idx);
    }
  }
  const map=new T.DataTexture(col,width,height),heightMap=new T.DataTexture(bump,width,height);
  for(const tex of [map,heightMap]){tex.wrapS=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;}
  map.colorSpace=T.SRGBColorSpace;
  const ballMat=new T.MeshStandardMaterial({color:0xffffff,map,bumpMap:heightMap,bumpScale:.0017,roughness:.59});
  const ball=new T.Mesh(new T.SphereGeometry(.11,36,24),ballMat);ball.castShadow=true;ball.receiveShadow=true;ball.userData.footballActor=true;scene.add(ball);
  return {ball,ballMat};
}
