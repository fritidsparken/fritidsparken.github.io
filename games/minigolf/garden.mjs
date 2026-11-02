/** Batched stonework and individually planted, non-colliding landscape details. */
export function stoneBoundary(T,segments){
 const positions=[],normals=[],uvs=[],colors=[];let seed=17;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // Marching-square segments share endpoints. Join into contours before subdividing blocks.
 const key=p=>`${p[0].toFixed(5)},${p[2].toFixed(5)}`,adj=new Map(),used=new Set();
 segments.forEach(([a,b],i)=>{for(const p of [a,b]){const k=key(p);if(!adj.has(k))adj.set(k,[]);adj.get(k).push(i);}});
 for(let start=0;start<segments.length;start++){
 if(used.has(start))continue;const points=[segments[start][0]],first=points[0];let index=start,current=first;
 while(index!==undefined&&!used.has(index)){used.add(index);const [a,b]=segments[index];current=key(a)===key(current)?b:a;points.push(current);index=adj.get(key(current))?.find(i=>!used.has(i));}
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+new T.Vector3(...points[i]).distanceTo(new T.Vector3(...points[i-1])));
 const total=lengths.at(-1),count=Math.max(1,Math.ceil(total/.62));
 const sample=d=>{let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;return new T.Vector3(...points[i-1]).lerp(new T.Vector3(...points[i]),(d-lengths[i-1])/Math.max(.0001,lengths[i]-lengths[i-1]));};
 for(let i=0;i<count;i++){const a=sample(i/count*total),b=sample((i+1)/count*total),delta=b.clone().sub(a),len=delta.length();if(len<.01)continue;
 const geo=new T.BoxGeometry(.30,.30+rand()*.025,Math.max(.025,len-.018));geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),delta.clone().normalize()));const mid=a.add(b).multiplyScalar(.5);geo.translate(mid.x,mid.y-.015,mid.z);const g=geo.toNonIndexed(),shade=.78+rand()*.2;
 positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);for(let j=0;j<g.attributes.position.count;j++){uvs.push(g.attributes.position.getX(j)*.9,g.attributes.position.getZ(j)*.9);colors.push(shade,shade,shade*.96);}g.dispose();geo.dispose();}
 }
 const g=new T.BufferGeometry();for(const [name,arr,n]of [['position',positions,3],['normal',normals,3],['uv',uvs,2],['color',colors,3]])g.setAttribute(name,new T.Float32BufferAttribute(arr,n));g.computeBoundingSphere();return g;
}
export function buildGardenDetails(T,scene,c,kit,quality,theme){
 const root=new T.Group();root.name='garden-'+theme.style;scene.add(root);let seed=31+c.id*7919;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const dense=quality==='high'?1:quality==='medium'?.65:.32,animated=[],lod=[];
 const rock=kit.get('rock','#bab6a2'),moss=kit.get('grass','#638054'),wood=kit.get('wood','#c7ac85'),gravel=kit.get('sand','#c5bea6');
 const plain=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.8,...opts});
 const iron=plain('#354144',{metalness:.75,roughness:.34}),glow=plain(theme.id===16?'#8ceded':'#ffe4a5',{emissive:theme.id===16?'#50dedc':'#ffbc58',emissiveIntensity:theme.night?3:1.2});
 const mesh=(geo,mat,x,y,z,parent=root)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const sphere=new T.SphereGeometry(1,12,8),box=new T.BoxGeometry(1,1,1),leaf=new T.SphereGeometry(1,7,5),stem=new T.CylinderGeometry(.015,.022,1,5);
 function nearest(x,z){let best=Infinity,y=0;for(let i=1;i<c.path.length;i++){if(c.features.some(f=>f.gap&&f.node===i-1))continue;const a=c.path[i-1],b=c.path[i],dx=b[0]-a[0],dz=b[2]-a[2],u=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-u*dx,z-a[2]-u*dz);if(d<best){best=d;y=a[1]+u*(b[1]-a[1]);}}return {d:best,y};}
 const ground=(x,z)=>{const n=nearest(x,z);return n.y-.65;};
 const transform=new T.Object3D(),batches=new Map();
 function instance(name,geo,mat,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,color){if(!batches.has(name))batches.set(name,{geo,mat,items:[]});transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(rx,ry,rz);transform.updateMatrix();batches.get(name).items.push([transform.matrix.clone(),color]);}
 const foliage=plain('#719248'),petal=plain('#ffffff',{roughness:.78,side:T.DoubleSide});
 const palette=theme.style==='botanical'?['#b5b6ea','#a2c9e5','#e7c2d4','#ede8d9']:theme.style==='japanese'?['#ead0d1','#e9e3c9']:theme.style==='autumn'?['#c98939','#ad4835','#e6ba51']:['#e1d9c0','#bba7d0','#e4bd9f'];
 // Plant clusters at known offsets from the route. Never place a decoration on another lane.
 for(let i=0;i<c.path.length-1;i++){
 if(c.features.some(f=>f.gap&&f.node===i))continue;
 const a=c.path[i],b=c.path[i+1],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
 const steps=Math.max(1,Math.floor(length/2.7));
 for(let j=0;j<steps;j++)for(const side of [-1,1]){
 const u=(j+.4)/steps,x=a[0]+dx*u+nx*side*(c.width/2+1.8),z=a[2]+dz*u+nz*side*(c.width/2+1.8),n=nearest(x,z);if(n.d<c.width/2+1.1)continue;
 const y=ground(x,z),scale=.7+rnd()*.5;
 // Flat stone planter base and varied low shrubs, batched in a handful of calls.
 instance('bedrock',sphere,rock,x,y+.10,z,.8*scale,.22,.75*scale,0,rnd()*6,0);
 for(let k=0;k<16*dense;k++){const ang=rnd()*6.283,r=Math.sqrt(rnd())*.8,px=x+Math.cos(ang)*r,pz=z+Math.sin(ang)*r,py=y+.18+rnd()*.32;
 instance('shrub',leaf,foliage,px,py,pz,.24,.14,.28,rnd(),rnd()*6,rnd(),new T.Color().setHSL(theme.style==='autumn'?.07:.24+rnd()*.08,.35,.5+rnd()*.18));
 if(k%2===0||theme.style==='botanical')for(let t=0;t<4;t++){const h=.35+rnd()*.28;instance('stem',stem,foliage,px,py+h/2,pz,1,h,1);instance('flower',sphere,petal,px+(rnd()-.5)*.18,py+h,pz+(rnd()-.5)*.18,.065,.05,.07,0,0,0,new T.Color(palette[(j+k+t)%palette.length]));}}
 // Fern rosettes: individually curled leaflets instead of flat crossed planes.
 if(j%2===0){for(let f=0;f<5;f++){const ang=f*1.256+rnd()*.3;for(let l=1;l<7*dense;l++)for(const sign of [-1,1]){const r=l*.09;instance('fern',leaf,foliage,x+Math.cos(ang)*r+Math.sin(ang)*sign*.08,y+.2+Math.sin(l/7*Math.PI)*.4,z+Math.sin(ang)*r-Math.cos(ang)*sign*.08,.055,.018,.16,-.3,ang+sign*.8,0);}}}
 // Local gravel margin, with a different grain scale from grass and turf.
 for(let k=0;k<12*dense;k++){const px=x+(rnd()-.5)*1.7,pz=z+(rnd()-.5)*1.7;if(nearest(px,pz).d<c.width/2+.55)continue;instance('gravel',sphere,gravel,px,y-.01,pz,.035+rnd()*.06,.025,.045+rnd()*.05,0,rnd()*6,0);}
 if(j%4===0){const lx=x+nx*side*.8,lz=z+nz*side*.8,ly=ground(lx,lz);const pole=mesh(new T.CylinderGeometry(.055,.075,1.5,8),iron,lx,ly+.75,lz);mesh(new T.CylinderGeometry(.23,.18,.08,8),iron,lx,ly+1.55,lz);mesh(new T.CylinderGeometry(.13,.13,.29,8),glow,lx,ly+1.34,lz);mesh(new T.ConeGeometry(.26,.18,4),iron,lx,ly+1.68,lz).rotation.y=Math.PI/4;
 if(theme.night&&quality!=='low'&&root.children.filter(o=>o.isPointLight).length<(quality==='high'?6:3)){const light=new T.PointLight(theme.id===16?'#68d7ec':'#ffd18d',2.5,12,2);light.position.set(lx,ly+1.6,lz);root.add(light);}
 }
 }
 }
 // Grounded local ponds for inland environments, outside the playable capsule.
 if(theme.water&&![4,6,9,14,16].includes(c.id)){
 const p=c.path[Math.min(2,c.path.length-1)],x=p[0]+c.width/2+8,z=p[2]-2,y=ground(x,z);
 const size=64,data=new Uint8Array(size*size*4);for(let j=0;j<size;j++)for(let i=0;i<size;i++){const at=(j*size+i)*4;data[at]=128+20*Math.sin(i/size*Math.PI*8+j/size*Math.PI*4);data[at+1]=128+20*Math.cos(j/size*Math.PI*8);data[at+2]=252;data[at+3]=255;}
 const normal=new T.DataTexture(data,size,size);normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.set(3,5);normal.needsUpdate=true;
 const water=new T.MeshPhysicalMaterial({color:'#487f79',roughness:.19,metalness:.12,normalMap:normal,normalScale:new T.Vector2(.12,.12),clearcoat:1,envMapIntensity:1.25});
 const pond=mesh(new T.CircleGeometry(3.4,48),water,x,y+.08,z);pond.rotation.x=-Math.PI/2;pond.scale.y=1.65;pond.castShadow=false;pond.userData.noOcclusion=true;
 for(let k=0;k<28;k++){const a=k/28*Math.PI*2;instance('pondstone',sphere,rock,x+Math.cos(a)*3.5,y+.1,z+Math.sin(a)*5.7,.48+rnd()*.2,.3+rnd()*.3,.5,0,rnd()*6,0);}
 animated.push(t=>normal.offset.set(t*.009,t*.006));
 if(theme.style==='jungle'||theme.style==='woodland'){for(let i=0;i<4;i++)instance('fallrock',sphere,rock,x+2.4,y+1.1+i*.45,z-4.5+i*.3,1.2,.8,1,0,i,0);const fall=mesh(new T.PlaneGeometry(.8,2.8,4,12),new T.MeshPhysicalMaterial({color:'#b4d1ce',transparent:true,opacity:.62,roughness:.2,normalMap:normal,side:T.DoubleSide}),x+2.3,y+1.3,z-3.5);fall.castShadow=false;}
 }
 // Each theme has a recognizable architectural or botanical silhouette.
 const center=c.path[Math.floor(c.path.length/2)],ax=center[0]-c.width/2-8,az=center[2],ay=ground(ax,az);
 function block(x,y,z,sx,sy,sz,mat=rock,parent=root){const o=mesh(box,mat,x,y,z,parent);o.scale.set(sx,sy,sz);return o;}
 if(['japanese','botanical','evening','finale'].includes(theme.style)){
 const g=new T.Group();g.position.set(ax,ay,az);root.add(g);for(const x of [-2,2])block(x,2.1,0,.24,4.2,.25,wood,g);for(let k=0;k<7;k++)block(0,4.05,k*.3-.9,5.1,.16,.13,wood,g);
 if(theme.style==='japanese'){block(0,4.5,0,5.8,.24,.5,wood,g);for(const x of [-3,3]){const top=block(x,4.6,0,.8,.2,.5,wood,g);top.rotation.z=x<0?-.2:.2;}}
 }
 if(['resort','palace','finale','oasis'].includes(theme.style)){
 const pool=mesh(new T.CylinderGeometry(2.8,2.9,.4,48),rock,ax,ay+.2,az);const water=mesh(new T.CircleGeometry(2.55,48),plain('#589c9a',{metalness:.3,roughness:.2}),ax,ay+.42,az);water.rotation.x=-Math.PI/2;
 mesh(new T.CylinderGeometry(.25,.45,2.2,16),rock,ax,ay+1.4,az);mesh(new T.CylinderGeometry(1.1,.6,.18,32),rock,ax,ay+2.5,az);
 const stream=plain('#c5e2dc',{transparent:true,opacity:.45,roughness:.2});for(let k=0;k<10;k++){const a=k/10*Math.PI*2;const pts=[];for(let j=0;j<14;j++){const u=j/13;pts.push(new T.Vector3(ax+Math.cos(a)*(1+u*.7),ay+2.6-u*u*2.15,az+Math.sin(a)*(1+u*.7)));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),14,.025,5,false),stream,0,0,0);}
 }
 if(['woodland','mountain','alpine','autumn'].includes(theme.style)){
 for(let k=0;k<6;k++){const x=ax+(k%2)*5,z=az-k*4,y=ground(x,z),h=5+rnd()*3;mesh(new T.CylinderGeometry(.10,.25,h,8),wood,x,y+h/2,z);for(let l=0;l<5;l++){const o=mesh(new T.ConeGeometry((5-l)*.43,2.6,11),foliage,x,y+1.4+l*h*.15,z);o.rotation.y=rnd()*6;}}
 if(theme.style==='alpine'){block(ax-6,ay+1.5,az,4,3,4,wood);const roof=mesh(new T.ConeGeometry(3.4,1.7,4),rock,ax-6,ay+3.7,az);roof.rotation.y=Math.PI/4;}
 }
 if(theme.style==='harbour'||theme.style==='mediterranean')for(let i=0;i<12;i++){block(ax,ay+.1,az+i*.5,3,.16,.46,wood);if(i%3===0)for(const s of [-1,1])block(ax+s*1.45,ay-.3,az+i*.5,.18,1.8,.18,wood);}
 if(theme.night){const positions=[];for(let i=0;i<80*dense;i++){const x=(rnd()-.5)*36,z=rnd()*c.path.at(-1)[2];if(nearest(x,z).d<c.width/2+1)continue;positions.push(x,ground(x,z)+1+rnd()*3,z);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const particles=new T.Points(g,new T.PointsMaterial({color:theme.id===16?'#76eaff':'#e6edac',size:.05,transparent:true,opacity:.7,depthWrite:false}));root.add(particles);animated.push(t=>particles.position.y=Math.sin(t*.4)*.1);}
 for(const {geo,mat,items}of batches.values()){const m=new T.InstancedMesh(geo,mat,items.length);items.forEach(([matrix,color],i)=>{m.setMatrixAt(i,matrix);if(color)m.setColorAt(i,color);});m.castShadow=quality==='high';m.receiveShadow=true;m.userData.noOcclusion=true;root.add(m);lod.push(m);}
 return {update(t,camera){for(const f of animated)f(t);/* Whole batches remain stable: no per-leaf allocations per frame. */}};
}

// One clipped surface mesh prevents coplanar overlaps at bends and round caps.
export function puttingGeometry(T,c,segments,step=.24,walk=false){
 const radius=c.width/2+(walk?2.5:0),minX=Math.min(...c.path.map(p=>p[0]))-radius,maxX=Math.max(...c.path.map(p=>p[0]))+radius,minZ=Math.min(...c.path.map(p=>p[2]))-radius,maxZ=Math.max(...c.path.map(p=>p[2]))+radius;
 const sample=(x,z)=>{let d=Infinity,y=0;for(const {a,b}of segments){const dx=b[0]-a[0],dz=b[2]-a[2],u=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz))),dist=Math.hypot(x-a[0]-u*dx,z-a[2]-u*dz);if(dist<d){d=dist;y=a[1]+u*(b[1]-a[1]);}}return {x,z,y:y-(walk?.54:.018),d:walk?Math.max(d-radius,c.width/2+.6-d):d-radius};};
 const axis=(min,max,values)=>[...new Set([...Array.from({length:Math.ceil((max-min)/step)+1},(_,i)=>Math.min(max,min+i*step)),...values])].sort((a,b)=>a-b),xs=axis(minX,maxX,c.path.map(p=>p[0])),zs=axis(minZ,maxZ,c.path.map(p=>p[2])),nx=xs.length-1,nz=zs.length-1,grid=zs.map(z=>xs.map(x=>sample(x,z))),v=[],uv=[];
 function triangle(tri){const poly=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3];if(a.d<=0)poly.push(a);if((a.d<=0)!==(b.d<=0)){const t=a.d/(a.d-b.d);poly.push(sample(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t));}}for(let k=1;k<poly.length-1;k++){const a=poly[0],b=poly[k],c=poly[k+1],area=(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z);if(area<1e-9)continue;for(const p of [a,b,c]){v.push(p.x,p.y,p.z);uv.push(p.x*.7,p.z*.7);}}}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=grid[j][i],b=grid[j+1][i],d=grid[j][i+1],e=grid[j+1][i+1];triangle([a,b,d]);triangle([b,e,d]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
