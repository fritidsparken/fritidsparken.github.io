/* Sunny park art direction. All decoration is non-colliding. No external assets. */
(()=>{'use strict';
window.FrogParkArt={create(T,renderer){
 let seed=74119;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const fract=n=>n-Math.floor(n),mix=(a,b,t)=>a+(b-a)*t;
 function hash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^53;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
 function noise(x,y,period){const ix=Math.floor(x),iy=Math.floor(y),u=fract(x),v=fract(y),sx=u*u*(3-2*u),sy=v*v*(3-2*v);const h=(a,b)=>hash((a+period)%period,(b+period)%period);return mix(mix(h(ix,iy),h(ix+1,iy),sx),mix(h(ix,iy+1),h(ix+1,iy+1),sx),sy)}
 function texture(kind){
  const size=256,count=size*size,rgba=new Uint8Array(count*4),heights=new Float32Array(count),rough=new Uint8Array(count*4);
  const bases={grass:[79,105,35],road:[38,42,44],wood:[101,64,30],track:[120,112,92],stone:[121,127,119],skin:[119,169,41],leaf:[65,107,27],water:[51,111,107]};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=y*size+x,u=x/size,v=y/size,n=noise(u*8,v*8,8),micro=hash(x,y),fine=noise(u*64,v*64,64);let h=.5,shade=0,base=bases[kind],r=.82;
   if(kind==='grass'){const blades=Math.pow(.5+.5*Math.sin((u*90+noise(u*16,v*16,16)*.4+v*26)*6.283),8);shade=(n-.5)*27+(fine-.5)*26+blades*24+(micro-.5)*12;h=fine*.4+blades*.4+micro*.2}
   if(kind==='road'){const grains=Math.pow(micro,5);shade=(n-.5)*10+(fine-.5)*10+grains*27;h=grains*.55+fine*.3;r=.55+fine*.35}
   if(kind==='wood'){const grain=.5+.5*Math.sin((u*28+noise(u*8,v*4,8)*.7)*6.283);const grooves=Math.pow(grain,9);shade=(n-.5)*28-grooves*39+(micro-.5)*13;h=grain*.4+n*.3+micro*.12;r=.65+fine*.3}
   if(kind==='stone'||kind==='track'){shade=(n-.5)*48+(fine-.5)*31+(micro-.5)*20;h=n*.3+fine*.4+micro*.25}
   if(kind==='leaf'){const vein=Math.exp(-Math.abs(u-.5)*130)+Math.pow(.5+.5*Math.sin((v*16+Math.abs(u-.5)*8)*6.283),18)*.35;shade=(n-.5)*20+vein*25;h=.3+vein*.4+fine*.1;r=.58}
   if(kind==='water'){h=(Math.sin(u*6.283*8+Math.sin(v*6.283*4))*.4+Math.sin(v*6.283*9+u*6.283*5)*.25+1)*.5;shade=(h-.5)*35;r=.25}
   if(kind==='skin'){
    const cx=Math.floor(u*14),cy=Math.floor(v*12);let dist=2;
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const px=cx+a,py=cy+b,dx=u*14-px-.18-hash((px+14)%14,(py+12)%12)*.64,dy=v*12-py-.18-hash((px+14)%14+40,(py+12)%12)*.64;dist=Math.min(dist,Math.sqrt(dx*dx+dy*dy))}
    const spot=1-T.MathUtils.smoothstep(dist,.105,.19);const stripe=Math.exp(-Math.pow((u-.5)*50,2));base=[mix(119,26,spot),mix(169,71,spot),mix(41,24,spot)];shade=(n-.5)*24+(micro-.5)*10+stripe*23;h=.4+fine*.12+Math.pow(micro,14)*.25;r=.38+fine*.15;
   }
   heights[i]=h;for(let k=0;k<3;k++){rgba[i*4+k]=Math.max(0,Math.min(255,base[k]+shade));rough[i*4+k]=Math.round(r*255)}rgba[i*4+3]=rough[i*4+3]=255;
  }
  const normal=new Uint8Array(count*4),bump=new Uint8Array(count*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x,dx=heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size],dy=heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x];const v=new T.Vector3(-dx*1.5,-dy*1.5,1).normalize();normal.set([Math.round((v.x*.5+.5)*255),Math.round((v.y*.5+.5)*255),Math.round((v.z*.5+.5)*255),255],i*4);const h=heights[i]*255;bump.set([h,h,h,255],i*4)}
  const make=(data,color=false)=>{const tex=new T.DataTexture(data,size,size,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities?.getMaxAnisotropy?.()||1);tex.needsUpdate=true;return tex};
  return {map:make(rgba,true),bump:make(bump),normal:make(normal),roughness:make(rough)};
 }
 let H,m;const groups=[],cover=[],crowns=[],pondDecor=[],frogRig=[];const wind={value:0};
 const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.13,.02,.16,0,.07,.36,0,0,0,0,.07,.36,.13,.02,.16,0,.07,.36,-.13,.02,.16,0,0,.6,0,.07,.36,0,0,.6,.13,.02,.16],3));leafGeo.setAttribute('uv',new T.Float32BufferAttribute([.5,0,0,.3,.5,.6,.5,0,.5,.6,1,.3,.5,.6,0,.3,.5,1,.5,.6,.5,1,1,.3],2));leafGeo.computeVertexNormals();
 const grassGeo=new T.BufferGeometry();grassGeo.setAttribute('position',new T.Float32BufferAttribute([-.018,0,0,.018,0,0,-.009,.15,.025,.018,0,0,.014,.15,.025,-.009,.15,.025,-.009,.15,.025,.014,.15,.025,.025,.31,.08],3));grassGeo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,.5,1,0,1,.5,0,.5,0,.5,1,.5,.5,1],2));grassGeo.computeVertexNormals();
 let leafMat,grassMat,rockMat,barkMat,petalMat;
 function init(helpers){H=helpers;m=helpers.materials;leafMat=m.leaf.clone();leafMat.side=T.DoubleSide;leafMat.roughness=.68;grassMat=new T.MeshStandardMaterial({color:0xa3b65a,side:T.DoubleSide,roughness:.92});rockMat=m.track.clone();rockMat.color.setHex(renderer.isSoftware?0x858979:0xc7cfbf);barkMat=m.wood;petalMat=new T.MeshPhysicalMaterial({color:0xe895b7,roughness:.4,clearcoat:.25});
  for(const material of [leafMat,grassMat]){material.onBeforeCompile=shader=>{shader.uniforms.parkWind=wind;shader.vertexShader='uniform float parkWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat phase=instanceMatrix[3].x*.7+instanceMatrix[3].z*.4;transformed.x+=sin(parkWind*1.1+phase)*position.y*.06;\n#endif`)};}
 }
 function tube(points,r,material,parent){const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),10,r,7,false),material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function segment(a,b,r1,r2,material,parent){const va=new T.Vector3(...a),vb=new T.Vector3(...b),delta=vb.clone().sub(va),mesh=H.cylinder(r2,r1,delta.length(),material,0,0,0,parent);mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh}
 function instance(geo,material,count,parent,fn){const mesh=new T.InstancedMesh(geo,material,count),dummy=new T.Object3D(),color=new T.Color();for(let n=0;n<count;n++){dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);fn(dummy,color,n);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n,color)}mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh}
 function tree(x,z,parent){const g=new T.Group();g.position.set(x,0,z);parent.add(g);groups.push(g);const h=3.1+random()*1.2;
  segment([0,0,0],[.12,h,0],.34,.09,barkMat,g);for(let n=0;n<5;n++){const a=n*1.256;segment([0,.1,0],[Math.cos(a)*.6,0,Math.sin(a)*.6],.18,.035,barkMat,g)}
  const tips=[];for(let n=0;n<11;n++){const a=n*2.4,base=.9+n*.18,tip=[Math.cos(a)*(1.05+random()*.55),h-.4+random()*1.4,Math.sin(a)*(1.05+random()*.55)];segment([.08,base,0],tip,.11,.025,barkMat,g);tips.push(tip);segment(tip,[tip[0]+Math.cos(a+.6)*.5,tip[1]+.3,tip[2]+Math.sin(a+.6)*.5],.035,.008,barkMat,g)}
  const leaves=instance(leafGeo,leafMat,1000,g,(d,c,n)=>{const p=tips[n%tips.length],a=random()*6.283,r=Math.sqrt(random())*.8;d.position.set(p[0]+Math.cos(a)*r,p[1]+(random()-.5)*1.2,p[2]+Math.sin(a)*r);d.rotation.set((random()-.5)*1.8,random()*6.283,(random()-.5));d.scale.setScalar(.8+random()*.75);c.setHSL(.2+random()*.055,.38,.5+random()*.25)});leaves.castShadow=true;crowns.push(leaves);
 }
 function meadow(row,parent,span=25){const n=2400,z=-row*2;const mesh=instance(grassGeo,grassMat,n,parent,(d,c)=>{const x=(random()-.5)*span,zz=z+(random()-.5)*1.94,patch=.5+.5*Math.sin(x*1.6+zz*.7);d.position.set(x,0,zz);d.rotation.y=random()*6.283;d.rotation.z=(random()-.5)*.4;d.scale.set(.5+random(),.45+random()*.5+patch*.25,.7+random()*.7);c.setHSL(.18+random()*.065,.38,.4+random()*.25)});cover.push(mesh);return mesh}
 const rockGeometry=new T.SphereGeometry(1,12,8);const rp=rockGeometry.getAttribute('position');for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),n=1+.12*Math.sin(x*6+y*4)*Math.cos(z*7-y*5);rp.setXYZ(i,x*n,y*n,z*n)}rockGeometry.computeVertexNormals();
 function rock(x,z,scale,parent){const mesh=new T.Mesh(rockGeometry,rockMat);mesh.position.set(x,.16*scale,z);mesh.scale.set(scale,.55*scale,scale*.8);mesh.rotation.y=random()*6.283;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function fern(x,z,parent,size=1){const g=new T.Group();g.position.set(x,0,z);parent.add(g);for(let n=0;n<7;n++){const a=n*.9,leaf=new T.Mesh(leafGeo,leafMat);leaf.rotation.set(-.5-random()*.45,a,0);leaf.scale.set(size*(.6+random()*.4),size,size*(1.5+random()*.6));g.add(leaf)}return g}
 function flower(x,z,parent,kind=0){const stem=segment([x,0,z],[x+.025,.28,z],.012,.006,m.leaf,parent);const material=kind?petalMat:m.white;for(let n=0;n<6;n++){const a=n*Math.PI/3;const p=H.ball(.045,material,x+Math.cos(a)*.055,.3,z+Math.sin(a)*.055,parent,1.6,.35,.8);p.rotation.y=-a}H.ball(.035,m.yellow,x,.31,z,parent)}
 function mushroom(x,z,parent,s=.5){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);parent.add(g);H.cylinder(.09,.12,.5,m.white,0,.25,0,g);const red=new T.MeshStandardMaterial({color:0xae2e26,roughness:.5}),cap=H.ball(.32,red,0,.5,0,g,1,.45,1);for(let n=0;n<9;n++){const a=n*2.4,r=.06+random()*.22;H.ball(.035,m.white,Math.cos(a)*r,.5+Math.sqrt(.32*.32-r*r)*.45,Math.sin(a)*r,g,1,.3,1)}}
 function bench(x,z,parent){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=x<0?.28:-.28;parent.add(g);const iron=new T.MeshStandardMaterial({color:0x263129,metalness:.7,roughness:.4});for(let n=0;n<5;n++){H.box(2.15,.08,.11,m.wood,0,.55,-.28+n*.13,g);H.box(2.15,.105,.07,m.wood,0,.78+n*.13,-.36-n*.028,g)}for(const side of [-1,1]){tube([[side*.85,0,.24],[side*.85,.5,.2],[side*.85,.58,-.3],[side*.85,.08,-.42]],.045,iron,g);tube([[side*.99,.57,.25],[side*.99,.83,.2],[side*.99,.83,-.32],[side*.99,.57,-.35]],.035,iron,g);H.box(.045,.85,.06,iron,side*.86,.7,-.39,g)}}
 function lilyFlower(x,z,parent,scale=.6){const g=new T.Group();g.position.set(x,.21,z);g.scale.setScalar(scale);parent.add(g);for(let layer=0;layer<3;layer++)for(let n=0;n<9;n++){const a=n*Math.PI*2/9+layer*.3,r=.12+layer*.065;const p=H.ball(.11,petalMat,Math.sin(a)*r,.06+layer*.045,Math.cos(a)*r,g,.7,.55,2.2);p.rotation.set(-.2-layer*.15,a,0)}H.ball(.09,m.yellow,0,.16,0,g,1,.5,1);return g}
 function shore(row,rows,parent){const z=-row*2;for(const delta of [-1,1])if(rows[row+delta]!=='water'){for(const side of [-1,1]){for(let n=0;n<9;n++){const x=side*(8.8+random()*4),zz=z+delta*(.8+random()*.2);if(n%3===0)rock(x,zz,.25+random()*.25,parent);else fern(x,zz,parent,.4)}for(let n=0;n<10;n++){const x=side*(9+random()*3),zz=z+(random()-.5)*1.6,h=.5+random()*.7;segment([x,-.1,zz],[x+.12,h,zz+.06],.012,.008,m.leaf,parent);if(n%2===0)H.ball(.045,m.wood,x+.12,h,zz+.06,parent,.75,3,.75)}}}
  for(const side of [-1,1]){const x=side*(10+random()*4);lilyFlower(x,z,parent,.9);const leaf=H.cylinder(.55,.58,.025,m.leaf,x,.045,z,parent);leaf.scale.z=.7;pondDecor.push(leaf)}
 }
 function dress(row,rows,parent){const z=-row*2,type=rows[row];if(type==='grass'){for(const side of [-1,1]){for(let n=0;n<3;n++){const x=side*(9.1+random()*1.6),zz=z+(random()-.5)*1.6;fern(x,zz,parent,.7+random()*.4);if(n===0)rock(x+.3,zz,.45+random()*.4,parent);flower(x-.2,zz+.3,parent,n%2)}if(row%3===0){mushroom(side*9.4,z+.35,parent,.55);mushroom(side*9.1,z+.6,parent,.35)}}}
 if(type==='water')shore(row,rows,parent);
 if(type==='road'){
  // Crosswalks are visual markings only: crossing traffic still has right of way.
  for(const side of [-1,1])for(let n=0;n<4;n++)H.box(1.3,.009,.23,m.white,side*6.9,-.058,z-.68+n*.45,parent);
  if(rows[row-1]!=='road'||rows[row+1]!=='road'){const edge=rows[row-1]!=='road'?1:-1;H.box(72,.12,.17,m.track,0,-.035,z+edge*.94,parent)}
  const wet=new T.MeshPhysicalMaterial({color:0x566063,metalness:.12,roughness:.15,clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.3,depthWrite:false,envMapIntensity:1.8,polygonOffset:true,polygonOffsetFactor:-1});
  for(let n=0;n<5;n++){const shape=new T.Shape();for(let j=0;j<=20;j++){const a=j/20*Math.PI*2,r=.6+random()*.3,x=Math.cos(a)*r,y=Math.sin(a)*r*.35;j?shape.lineTo(x,y):shape.moveTo(x,y)}const p=new T.Mesh(new T.ShapeGeometry(shape),wet);p.rotation.x=-Math.PI/2;p.position.set(-9+n*4+random(),-.059,z+(random()-.5)*.7);p.receiveShadow=true;parent.add(p)}
 }
 if(type==='track')for(const side of [-1,1]){const x=side*9.2;segment([x,0,z],[x,2.3,z],.04,.035,m.white,parent);const a=H.box(.72,.1,.06,m.white,x,1.95,z,parent);a.rotation.z=.65;const b=H.box(.72,.1,.06,m.white,x,1.95,z,parent);b.rotation.z=-.65;}
 }
 function frog(){const root=new T.Group(),bodyRig=new T.Group();root.add(bodyRig);
  // Pear-shaped torso: broad hips, narrower shoulders, a continuous dorsal surface.
  const geo=new T.SphereGeometry(1,40,28),p=geo.getAttribute('position');for(let n=0;n<p.count;n++){const x=p.getX(n),y=p.getY(n),z=p.getZ(n),width=.55*(1-.22*z);p.setXYZ(n,x*width,y*.42+.58,z*.65-.12)}geo.computeVertexNormals();const body=new T.Mesh(geo,m.green);body.castShadow=body.receiveShadow=true;bodyRig.add(body);
  H.ball(.46,m.belly,0,.34,.16,bodyRig,1.1,.45,1.2);const head=H.ball(.43,m.green,0,.73,.36,bodyRig,1.25,.65,.88);
  // Dorsolateral ridges and folds are geometry, the spotted colour pattern lives in the PBR maps.
  for(const side of [-1,1])tube([[side*.25,.91,.35],[side*.31,.99,.02],[side*.3,.89,-.4],[side*.19,.65,-.65]],.022,m.green,bodyRig);
  const legs=[],knees=[],lids=[];for(const side of [-1,1]){
   H.ball(.22,m.green,side*.33,.99,.36,bodyRig,1,1,.9);const iris=new T.MeshPhysicalMaterial({color:0xbba33d,metalness:.15,roughness:.18,clearcoat:1});H.ball(.15,iris,side*.34,1.02,.49,bodyRig,1,1,.65);H.ball(.085,m.dark,side*.34,1.025,.58,bodyRig,1.15,.7,.35);H.ball(.025,m.white,side*.31,1.065,.602,bodyRig);const lid=H.ball(.17,m.green,side*.34,1.025,.5,bodyRig,1,1,.7);lid.visible=false;lids.push(lid);
   for(const rear of [true,false]){const hip=new T.Group();hip.position.set(side*(rear?.43:.4),rear?.25:.4,rear?-.38:.34);root.add(hip);legs.push(hip);
    if(rear){H.ball(.29,m.green,side*.17,.02,-.02,hip,1.2,.75,1.55);tube([[side*.23,-.02,-.21],[side*.39,-.1,-.1],[side*.23,-.15,.23]],.095,m.green,hip)}else tube([[0,0,0],[side*.13,-.15,.11],[side*.2,-.3,.26]],.07,m.green,hip);
    const foot=new T.Group();foot.position.set(side*.23,rear?-.17:-.31,.24);hip.add(foot);knees.push(foot);H.ball(.12,m.green,0,0,.02,foot,1.1,.3,1.3);
    for(let n=0;n<4;n++){const dx=side*(n-1.5)*.065,length=.19+Math.sin(n/3*Math.PI)*.08;tube([[0,0,.06],[dx,-.01,.16],[dx*1.35,-.015,length+.11]],.025,m.green,foot);H.ball(.035,m.green,dx*1.35,-.015,length+.11,foot,1,.4,1.2)}
   }
  }
  tube([[-.27,.62,.62],[0,.58,.72],[.27,.62,.62]],.012,m.dark,bodyRig);for(const s of [-1,1])H.ball(.018,m.dark,s*.14,.8,.68,bodyRig);
  const tongue=H.ball(.1,m.pink,0,.6,.7,root,.6,.6,1);tongue.visible=false;root.rotation.y=Math.PI;frogRig.push({root,bodyRig,legs,knees,lids});return {frog:root,frogEyes:[],frogLegs:[],tongue};
 }

 // One shared planar capture for the river. LOW retains the filtered sky environment.
 let reflection=null,reflectionTier='medium',reflectionFrame=0;
 function reflections(scene,material,surfaces){
  if(renderer.isSoftware)return;
  const target=new T.WebGLRenderTarget(512,512,{depthBuffer:true,stencilBuffer:false});
  const camera=new T.PerspectiveCamera(),matrix=new T.Matrix4(),plane=new T.Plane(new T.Vector3(0,1,0),.035);
  const uniforms={parkReflection:{value:target.texture},parkMirror:{value:matrix},parkReflectionStrength:{value:0}};
  const prior=material.onBeforeCompile;
  material.onBeforeCompile=shader=>{prior(shader);Object.assign(shader.uniforms,uniforms);
   shader.vertexShader='uniform mat4 parkMirror; varying vec4 parkMirrorCoord;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nparkMirrorCoord=parkMirror*modelMatrix*vec4(transformed,1.);');
   shader.fragmentShader='uniform sampler2D parkReflection; uniform float parkReflectionStrength; varying vec4 parkMirrorCoord;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec2 mirrorUV=parkMirrorCoord.xy/parkMirrorCoord.w;
    mirrorUV+=normal.xz*.006;
    float onMirror=step(0.,mirrorUV.x)*step(mirrorUV.x,1.)*step(0.,mirrorUV.y)*step(mirrorUV.y,1.);
    float fresnel=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),3.);
    outgoingLight=mix(outgoingLight,texture2D(parkReflection,clamp(mirrorUV,.002,.998)).rgb,parkReflectionStrength*onMirror*(.2+fresnel*.5));
    #include <opaque_fragment>`);
  };
  // This Three.js revision calls the final chunk output_fragment.
  const wrapped=material.onBeforeCompile;material.onBeforeCompile=shader=>{const old=shader.fragmentShader.includes('#include <output_fragment>');if(old)shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>','#include <opaque_fragment>');wrapped(shader);if(old)shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','#include <output_fragment>')};
  material.needsUpdate=true;reflection={scene,material,surfaces,target,camera,matrix,plane,uniforms};
 }
 function reflect(viewCamera){if(!reflection)return;const r=reflection;if(reflectionTier==='low'){r.uniforms.parkReflectionStrength.value=0;return}const visible=r.surfaces.some(o=>o.parent.visible);if(!visible)return;reflectionFrame++;if(reflectionFrame%(reflectionTier==='high'?3:6)!==1)return;
  const height=-.04,look=viewCamera.getWorldDirection(new T.Vector3()).add(viewCamera.position);r.camera.copy(viewCamera);r.camera.position.y=2*height-viewCamera.position.y;look.y=2*height-look.y;r.camera.up.set(0,-1,0);r.camera.lookAt(look);r.camera.updateMatrixWorld();
  r.matrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(r.camera.projectionMatrix).multiply(r.camera.matrixWorldInverse);
  const target=renderer.getRenderTarget(),clipping=renderer.clippingPlanes,autoShadow=renderer.shadowMap.autoUpdate,hidden=r.surfaces.map(o=>o.visible);
  try{r.surfaces.forEach(o=>o.visible=false);renderer.clippingPlanes=[r.plane];renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(r.target);renderer.clear();renderer.render(r.scene,r.camera);r.uniforms.parkReflectionStrength.value=1}
  finally{renderer.setRenderTarget(target);renderer.clippingPlanes=clipping;renderer.shadowMap.autoUpdate=autoShadow;r.surfaces.forEach((o,i)=>o.visible=hidden[i])}
 }
 function quality(name){reflectionTier=name;if(reflection)reflection.target.setSize(name==='high'?512:256,name==='high'?512:256);const config={high:[2400,1000],medium:[1200,650],low:[440,320]}[name]||[1200,650];cover.forEach(o=>o.count=renderer.isSoftware?0:config[0]);crowns.forEach(o=>o.count=renderer.isSoftware?50:config[1])}
 function update(time,hop,active,respawn){wind.value=time;for(const rig of frogRig){if(rig.root!==active)continue;if(rig.wasHopping&&!hop&&!respawn)rig.landedAt=time;rig.wasHopping=!!hop;const settle=rig.landedAt===undefined?0:Math.max(0,1-(time-rig.landedAt)/.18)*Math.sin(Math.min(1,(time-rig.landedAt)/.18)*Math.PI);rig.bodyRig.scale.y=1-settle*.12;const t=hop?Math.min(1,hop.t):0,flight=hop?Math.sin(Math.PI*Math.max(0,(t-.16)/.84)):0,prepare=hop&&t<.16?t/.16:0;rig.bodyRig.rotation.x=respawn?0:-flight*.12;rig.bodyRig.position.y=-prepare*.05;rig.legs.forEach((leg,i)=>{leg.rotation.x=i%2?flight*-.55:prepare*.3-flight*.8+settle*.2;leg.rotation.z=(i<2?-1:1)*flight*.09});rig.knees.forEach(k=>k.rotation.x=flight*.5);rig.lids.forEach(l=>l.visible=Math.sin(time*.85)>.997)}}
 return {texture,init,tree,meadow,bench,rock,fern,dress,lilyFlower,frog,quality,update,reflections,reflect};
}};
})();
