// Geometry-based cave. The paintings supply surface materials, never a moving backdrop.
export function buildCave(T,scene,course,level=0){
 const root=new T.Group();root.name='Cave architecture';scene.add(root);
 const palettes=[{fog:0x211814,rock:0xc4aa84,fill:0x827158,accent:0xffaa43},{fog:0x0c1828,rock:0xa9b8c4,fill:0x405d80,accent:0x309aff},{fog:0x191326,rock:0xafa1bc,fill:0x705384,accent:0xb87dff},{fog:0x23160f,rock:0xb89e84,fill:0x715143,accent:0xff9c40},{fog:0x0b211e,rock:0xb3bdb0,fill:0x427d71,accent:0x56eac5}];
 const palette=palettes[level%5],materials=[],geometries=[],textures=[],lights=[],torchPositions=[],pending=[];
 scene.background=new T.Color(palette.fog);scene.fog=new T.FogExp2(palette.fog,.014);
 const loader=new T.TextureLoader();
 function texture(name,repeat=true){let resolve,reject;pending.push(new Promise((yes,no)=>{resolve=yes;reject=no}));const t=loader.load('echo-art/'+name+'.webp',resolve,undefined,()=>reject(new Error('Kunde inte ladda grottans material: '+name)));t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(repeat){t.wrapS=t.wrapT=T.RepeatWrapping}textures.push(t);return t}
 const rockTex=texture('stone-wall-'+level),floorTex=texture('stone-floor-'+level);
 const material=(args)=>{const m=new T.MeshStandardMaterial(args);materials.push(m);return m};
 const rockMat=material({map:rockTex,color:palette.rock,roughness:.94,metalness:0,side:T.DoubleSide,vertexColors:true});
 const floorMat=material({map:floorTex,color:0xc0b4a0,roughness:.88,metalness:.03,vertexColors:true});
 const boulderMat=material({map:rockTex,color:palette.rock,roughness:.96,metalness:0});
 const shadowRock=material({map:rockTex,color:0x48434a,roughness:1,vertexColors:true,side:T.DoubleSide});
 const metal=material({color:0x43372d,roughness:.68,metalness:.65});
 const gold=material({color:0xad7b37,roughness:.43,metalness:.62});
 const wood=material({color:0x493523,roughness:.92});
 const crystal=material({color:palette.accent,emissive:palette.accent,emissiveIntensity:.3,roughness:.3,metalness:.22});
 function addMesh(geometry,mat){geometries.push(geometry);const mesh=new T.Mesh(geometry,mat);mesh.receiveShadow=true;root.add(mesh);return mesh}
 function noise(x,z){return Math.sin(x*1.91+z*.627)*.5+Math.sin(x*.79-z*1.31)*.25+Math.cos(x*4.51+z*.347)*.25}
 function rand(i){const n=Math.sin(i*127.1+level*351.77)*43758.5453123;return n-Math.floor(n)}
 const routes=course.routes,points=routes.flatMap(r=>r.points);
 const minZ=Math.min(...points.map(p=>p.z))-22,maxZ=Math.max(...points.map(p=>p.z))+24;
 function onRoute(route,z){const ps=route.points;if(z<ps[0].z||z>ps[ps.length-1].z)return null;let lo=0,hi=ps.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(ps[m].z<z)lo=m;else hi=m}const a=ps[lo],b=ps[hi],f=(z-a.z)/Math.max(.0001,b.z-a.z);return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z}}
 const pits=course.pits.map((p,i)=>{const len=20,dir=new T.Vector3(p.direction.x,0,p.direction.z).normalize(),side=new T.Vector3(dir.z,0,-dir.x);return {...p,dir,side,id:i,cx:p.position.x+dir.x*len*.5,cz:p.position.z+dir.z*len*.5,rx:p.width*.5,rz:len*.5}});
 const gapHoles=[];for(const r of routes)for(const g of r.gaps||[]){const a=r.sample(g.start).position,b=r.sample(g.end).position;gapHoles.push({a,b,halfWidth:5.4})}
 function pitCoords(p,x,z){const dx=x-p.cx,dz=z-p.cz;return {u:dx*p.side.x+dz*p.side.z,v:dx*p.dir.x+dz*p.dir.z}}
 function pitRadius(p,angle){return 1+.065*Math.sin(angle*7+p.id)+.045*Math.sin(angle*11-p.id)}
 function isPit(x,z,margin=0){for(const p of pits){const {u,v}=pitCoords(p,x,z),a=Math.atan2(v/p.rz,u/p.rx),rad=pitRadius(p,a);if((u/(p.rx+margin))**2+(v/(p.rz+margin))**2<rad*rad)return true}for(const g of gapHoles){const dx=g.b.x-g.a.x,dz=g.b.z-g.a.z,ll=dx*dx+dz*dz,t=((x-g.a.x)*dx+(z-g.a.z)*dz)/ll;if(t>0&&t<1&&Math.abs((x-g.a.x)*dz-(z-g.a.z)*dx)/Math.sqrt(ll)<g.halfWidth)return true}return false}
 function row(z){let samples=routes.map(r=>onRoute(r,z)).filter(Boolean);if(!samples.length){const p=z<0?points[0]:course.finish;samples=[p]}let left=Math.min(...samples.map(p=>p.x))-7.5,right=Math.max(...samples.map(p=>p.x))+7.5;for(const p of pits)if(Math.abs(z-p.cz)<p.rz+7){left=Math.min(left,p.cx-p.rx-6);right=Math.max(right,p.cx+p.rx+6)}return {samples,left,right,mid:(left+right)/2}}
 function height(x,z,r){let best=r.samples[0],d=Infinity;for(const p of r.samples){const dist=Math.abs(p.x-x);if(dist<d){best=p;d=dist}}return best.y+noise(x,z)*Math.min(.13,Math.max(0,d-1.5)*.07)}
 function geometry(pos,uv,col,idx){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(col)g.setAttribute('color',new T.Float32BufferAttribute(col,3));if(idx)g.setIndex(idx);g.computeVertexNormals();return g}
 // A single natural stone ground surface spans each chamber and follows its elevation.
 const pos=[],uv=[],col=[],idx=[],rows=[],step=1.4,cols=46;
 for(let z=minZ;z<=maxZ+step;z+=step){const r=row(z);rows.push({...r,z});for(let j=0;j<=cols;j++){const x=r.left+(r.right-r.left)*j/cols,y=height(x,z,r);pos.push(x,y,z);uv.push(x/7,z/7);const c=.89+.09*noise(x,z);col.push(c,c,c)}}
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+1,c=a+cols+1,d=c+1;for(const tri of [[a,c,b],[b,c,d]]){let cut=false;for(const v of tri)if(isPit(pos[v*3],pos[v*3+2],.15)){cut=true;break}if(!cut){const x=tri.reduce((n,v)=>n+pos[v*3],0)/3,z=tri.reduce((n,v)=>n+pos[v*3+2],0)/3;cut=isPit(x,z,.15)}if(!cut)idx.push(...tri)}}
 addMesh(geometry(pos,uv,col,idx),floorMat).name='Continuous cave bedrock with open chasms';
 // Irregular arched tunnel: real walls and roof, with open space surrounding the rails.
 const vp=[],vu=[],vc=[],vi=[],wallRows=[],arcs=24;
 for(let z=minZ;z<=maxZ+4;z+=3.2){const r=row(z),floor=height(r.mid,z,r),roof=10+1.6*Math.sin(z*.031)+.7*Math.cos(z*.117);wallRows.push(z);for(let j=0;j<=arcs;j++){const a=Math.PI*j/arcs,n=noise(a*5,z),x=r.mid+Math.cos(a)*((r.right-r.left)*.5+.4+n*.6),y=floor-.6+Math.sin(a)*(roof+.6)+n*.5;vp.push(x,y,z);vu.push(a*3,z/9);const c=.78+.18*noise(x,z);vc.push(c,c,c)}}
 for(let i=0;i<wallRows.length-1;i++)for(let j=0;j<arcs;j++){const a=i*(arcs+1)+j,b=a+1,c=a+arcs+1,d=c+1;vi.push(a,b,c,b,d,c)}
 addMesh(geometry(vp,vu,vc,vi),rockMat).name='Sculpted continuous limestone tunnel';
 const rockGeo=new T.IcosahedronGeometry(1,1),stalGeo=new T.ConeGeometry(1,1,7,1),boxGeo=new T.BoxGeometry(1,1,1);geometries.push(rockGeo,stalGeo,boxGeo);
 const boulders=[],stalactites=[],crystals=[];const transform=new T.Object3D();
 for(let z=minZ+3,i=0;z<maxZ;z+=3.1,i++){const r=row(z),ground=height(r.mid,z,r);for(const side of [-1,1]){const x=(side<0?r.left:r.right)-side*(.7+rand(i+side)*1.2),scale=.9+rand(i*3+side+11)*1.5;boulders.push({x,y:height(x,z,r)+scale*.5,z,sx:scale*1.4,sy:scale,sz:scale*(1+rand(i+19)),rot:rand(i+55)*6});}
 for(let j=0;j<3;j++){const x=r.mid+(rand(i*7+j+200)-.5)*(r.right-r.left)*.9,a=Math.acos(Math.max(-1,Math.min(1,(x-r.mid)/((r.right-r.left)*.5)))),roof=ground-.6+Math.sin(a)*(10.6+1.6*Math.sin(z*.031)+.7*Math.cos(z*.117)),len=.8+rand(i*5+j+77)*3.2;stalactites.push({x,y:roof-len*.45,z:z+rand(i+j+400)*2,sx:.35+rand(i*2+j+700)*.55,sy:len,sz:.35+rand(i*4+j+230)*.65,rot:Math.PI});}
 if(level===1||level===2||level===4){for(const side of [-1,1])if(rand(i+side*2+9)>.3)crystals.push({x:(side<0?r.left:r.right)-side*1.5,y:ground+.6,z,sx:.35+rand(i+600)*.6,sy:1+rand(i+700)*2,sz:.5,rot:side*.35})}
 }
 function instance(geo,mat,list,name){const mesh=new T.InstancedMesh(geo,mat,list.length);mesh.name=name;for(let i=0;i<list.length;i++){const p=list[i];transform.position.set(p.x,p.y,p.z);transform.rotation.set(p.rot||0,p.rot||0,0);transform.scale.set(p.sx,p.sy,p.sz);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix)}mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;root.add(mesh);return mesh}
 instance(rockGeo,boulderMat,boulders,'Rock outcrops');instance(stalGeo,boulderMat,stalactites,'Overhanging stalactites');if(crystals.length)instance(stalGeo,crystal,crystals,'Mineral formations');
 // Open pits have rough vertical rock faces, irregular lips and dark depth, not black quads.
 for(const p of pits){const ps=[],us=[],cs=[],ids=[],n=56,layers=10;
 for(let l=0;l<=layers;l++)for(let j=0;j<=n;j++){const a=j/n*Math.PI*2,rad=pitRadius(p,a),depth=l/layers*p.depth,spread=1+l/layers*.48,u=Math.cos(a)*p.rx*rad*spread,v=Math.sin(a)*p.rz*rad*spread;ps.push(p.cx+p.side.x*u+p.dir.x*v,p.position.y-depth,p.cz+p.side.z*u+p.dir.z*v);us.push(j/n*7,depth/8);const c=Math.max(.025,.9*Math.exp(-depth*.065));cs.push(c,c*.91,c*.84)}
 for(let l=0;l<layers;l++)for(let j=0;j<n;j++){const a=l*(n+1)+j,b=a+1,c=a+n+1,d=c+1;ids.push(a,c,b,b,c,d)}addMesh(geometry(ps,us,cs,ids),shadowRock).name='Jagged abyss rock walls';
 const rim=[];for(let j=0;j<n;j++){const a=j/n*Math.PI*2,rad=pitRadius(p,a),u=Math.cos(a)*p.rx*rad,v=Math.sin(a)*p.rz*rad;rim.push({x:p.cx+p.side.x*u+p.dir.x*v,y:p.position.y-.2,z:p.cz+p.side.z*u+p.dir.z*v,sx:.5+rand(j+12)*.5,sy:.35+rand(j+22)*.4,sz:.55+rand(j+32)*.7,rot:j*.72})}instance(rockGeo,boulderMat,rim,'Broken natural chasm rim');
 const bottom=addMesh(new T.CircleGeometry(p.rx*2,40),material({color:0x020307,roughness:1,side:T.DoubleSide}));bottom.rotation.x=-Math.PI/2;bottom.position.set(p.cx,p.position.y-p.depth,p.cz);
 }
 for(const g of gapHoles){const dir=new T.Vector3(g.b.x-g.a.x,0,g.b.z-g.a.z).normalize(),side=new T.Vector3(dir.z,0,-dir.x);for(const end of [g.a,g.b]){const mesh=addMesh(new T.BoxGeometry(g.halfWidth*2,18,.7),shadowRock);mesh.position.set(end.x,end.y-9,end.z);mesh.rotation.y=Math.atan2(dir.x,dir.z)}}
 const hemi=new T.HemisphereLight(0xbac5d4,palette.fill,1.35);root.add(hemi);const ambient=new T.AmbientLight(palette.fill,.3);root.add(ambient);
 // Closely spaced fixtures create persistent parallax and successive pools of cave light.
 for(let z=minZ+14,i=0;z<maxZ-10;z+=18,i++){const r=row(z);for(const side of [-1,1]){const x=(side<0?r.left:r.right)-side*1.5,y=height(x,z,r)+2.6;torchPositions.push(new T.Vector3(x,y,z));
 const bracket=addMesh(new T.BoxGeometry(.18,.9,.25),metal);bracket.position.set(x,y-.5,z);
 const bowl=addMesh(new T.SphereGeometry(.38,9,6,0,Math.PI*2,0,Math.PI*.55),gold);bowl.rotation.x=Math.PI;bowl.position.set(x,y-.2,z);
 const flame=addMesh(new T.SphereGeometry(.17,7,7),material({color:0xffd581,emissive:0xffb341,emissiveIntensity:2,roughness:1}));flame.scale.y=2;flame.position.set(x,y+.06,z);
 }}
 for(let i=0;i<4;i++){const light=new T.PointLight(0xffb35d,75,28,1.55);lights.push(light);root.add(light)}
 // The ornate door has its own 3D frame at the physical track destination.
 const finalRoute=routes.find(r=>r.finish)||routes.filter(r=>r.kind!=='dead').at(-1),direction=course.finishTangent||finalRoute.sample(finalRoute.length).tangent;
 const doorGroup=new T.Group();doorGroup.position.set(course.finish.x+direction.x*2,course.finish.y,course.finish.z+direction.z*2);doorGroup.rotation.y=Math.atan2(direction.x,direction.z);root.add(doorGroup);
 const doorMap=texture('destination-door',false),doorMat=material({map:doorMap,roughness:.6,metalness:.25,color:0xd5b77a});
 const doorPlane=new T.Mesh(new T.PlaneGeometry(5.6,8.4),doorMat);geometries.push(doorPlane.geometry);doorPlane.position.set(0,4.2,-.03);doorPlane.rotation.y=Math.PI;doorGroup.add(doorPlane);
 function arch(w,h,thick){const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h*.63);shape.quadraticCurveTo(-w/2,h*.86,0,h);shape.quadraticCurveTo(w/2,h*.86,w/2,h*.63);shape.lineTo(w/2,0);shape.closePath();const hole=new T.Path();const iw=w-thick*2;hole.moveTo(-iw/2,0);hole.lineTo(iw/2,0);hole.lineTo(iw/2,h*.63);hole.quadraticCurveTo(iw/2,h*.83,0,h-thick);hole.quadraticCurveTo(-iw/2,h*.83,-iw/2,h*.63);hole.closePath();shape.holes.push(hole);return new T.ExtrudeGeometry(shape,{depth:.75,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.10,bevelThickness:.10})}
 for(const [w,h,t,z] of [[8.1,10.1,.7,.28],[6.8,9.2,.24,-.1],[6.1,8.7,.18,-.25]]){const geo=arch(w,h,t);geometries.push(geo);const mesh=new T.Mesh(geo,t>.3?boulderMat:gold);mesh.position.z=z;doorGroup.add(mesh)}
 const doorspot=new T.PointLight(0xffc67b,100,21,1.7);doorspot.position.set(0,5,-3);doorGroup.add(doorspot);
 // Copper mine machinery is stationary, modeled in volume and placed outside the track.
 if(level===3){for(let z=minZ+30;z<maxZ-20;z+=75){const r=row(z),x=r.left+2,y=height(x,z,r);const wheel=addMesh(new T.TorusGeometry(2.7,.22,8,30),metal);wheel.position.set(x,y+3,z);wheel.rotation.y=Math.PI/2;for(let j=0;j<8;j++){const spoke=addMesh(new T.BoxGeometry(.14,5.1,.14),wood);spoke.position.copy(wheel.position);spoke.rotation.x=j*Math.PI/4}const axle=addMesh(new T.CylinderGeometry(.3,.3,1.7,10),metal);axle.rotation.z=Math.PI/2;axle.position.copy(wheel.position)}}
 function update(time,cartPosition){const selected=torchPositions.map(p=>({p,d:p.distanceToSquared(new T.Vector3(cartPosition.x,cartPosition.y,cartPosition.z))})).sort((a,b)=>a.d-b.d).slice(0,lights.length);selected.forEach((item,i)=>{lights[i].position.copy(item.p);lights[i].intensity=70+Math.sin(time*7+i)*3+Math.sin(time*11+i*2)*2})}
 function dispose(){scene.remove(root);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose()}
 return {root,update,dispose,ready:Promise.all(pending),door:doorGroup,pits,groundHeight:(x,z)=>height(x,z,row(z))};
}
