/* Original models and environment for Fritidsparken. Three.js is MIT licensed. */
(() => {
  function create(hostCanvas) {
    const T=window.THREE;if(!T)return null;
    let renderer;const surface=document.createElement('canvas');let gl;try{gl=surface.getContext('webgl2',{antialias:true})||surface.getContext('webgl',{antialias:true});}catch{}
    if(gl){try{renderer=new T.WebGLRenderer({canvas:surface,context:gl,antialias:true,alpha:false,powerPreference:'high-performance'});}catch{}}
    if(!renderer)renderer=window.FPSoftware3D?.create(T);if(!renderer)return null;
    renderer.domElement.className='flight3d-canvas';renderer.domElement.setAttribute('aria-hidden','true');hostCanvas.after(renderer.domElement);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
    const scene=new T.Scene();scene.background=new T.Color('#a8dceb');scene.fog=new T.Fog('#beddd4',90,250);
    const camera=new T.PerspectiveCamera(51,1,.1,500);camera.position.set(0,12,13);
    const hemi=new T.HemisphereLight('#e9f8ff','#76945e',2.4);scene.add(hemi);
    const sun=new T.DirectionalLight('#fff0ce',2.7);sun.position.set(-18,40,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.normalBias=.03;scene.add(sun);
    const material=(color,more={})=>new T.MeshStandardMaterial({color,roughness:.72,...more});
    const grass=material('#76ac56'),white=material('#f8f8eb',{roughness:.42}),trim=material('#e76850',{roughness:.4}),dark=material('#354c55'),silver=material('#c4d4d1',{metalness:.2}),glass=material('#397e9b',{metalness:.35,roughness:.18});
    const mesh=(g,m,parent,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
    const box=(w,h,d,m,parent,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z);
    const ground=mesh(new T.PlaneGeometry(1200,1200),grass,scene);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.userData.softwareSkip=true;
    // A winding river made from our own triangle strip.
    const riverVertices=[];for(let i=0;i<70;i++){const z=-360+i*6,z2=z+6,curve=q=>Math.sin(q*.025)*2.6;riverVertices.push(curve(z)-2.6,.028,z,curve(z)+2.6,.028,z,curve(z2)-2.6,.028,z2,curve(z)+2.6,.028,z,curve(z2)+2.6,.028,z2,curve(z2)-2.6,.028,z2);}
    const riverGeometry=new T.BufferGeometry();riverGeometry.setAttribute('position',new T.Float32BufferAttribute(riverVertices,3));riverGeometry.computeVertexNormals();mesh(riverGeometry,material('#58b4ca',{roughness:.3,metalness:.12,side:T.DoubleSide}),scene);
    const hills=[];for(let i=0;i<20;i++){const hill=mesh(new T.IcosahedronGeometry(1,1),material(i%2?'#80ab66':'#91b578',{flatShading:true}),scene,(i%2?1:-1)*(42+i%4*8),2,-40-Math.floor(i/2)*22);hill.scale.set(18+i%3*6,8+i%4*3,21);hills.push(hill);}
    const trees=new T.InstancedMesh(new T.ConeGeometry(1,3.8,7),material('#498265',{flatShading:true}),100),trunks=new T.InstancedMesh(new T.CylinderGeometry(.12,.2,1.6,5),material('#796e4d'),100);scene.add(trees,trunks);trees.receiveShadow=true;const matrix=new T.Object3D();trees.frustumCulled=trunks.frustumCulled=false;
    let softwareShadow;if(renderer.isSoftware){softwareShadow=mesh(new T.CircleGeometry(2.5,24),new T.MeshBasicMaterial({color:'#32583c',transparent:true,opacity:.15,side:T.DoubleSide}),scene,0,.045,1);softwareShadow.rotation.x=-Math.PI/2;softwareShadow.scale.set(1,.55,1);}
    const clouds=[];const cloudMat=new T.MeshStandardMaterial({color:'#fffdf1',roughness:1});cloudMat.userData.cloud=true;for(let i=0;i<9;i++){const group=new T.Group();scene.add(group);for(let j=0;j<4;j++){const puff=mesh(new T.SphereGeometry(1,9,6),cloudMat,group,j*1.8-3,Math.sin(j)*.6,0);puff.scale.set(2.2,1.1+j%2*.45,1.1);}group.position.set((i%2?1:-1)*(18+i*3),17+i%3*3,-45-i*18);group.scale.setScalar(1+i%3*.4);clouds.push(group);}
    // Rear view of a propeller aircraft, built entirely from simple original meshes.
    const plane=new T.Group();plane.scale.setScalar(1.1);scene.add(plane);
    const body=mesh(new T.SphereGeometry(1,24,14),white,plane,0,.15,0);body.scale.set(.36,.42,2.2);body.castShadow=true;
    const wingShape=new T.Shape();wingShape.moveTo(-3.5,.4);wingShape.lineTo(-3.3,-.42);wingShape.lineTo(-.4,-.78);wingShape.lineTo(.4,-.78);wingShape.lineTo(3.3,-.42);wingShape.lineTo(3.5,.4);wingShape.lineTo(.4,.62);wingShape.lineTo(-.4,.62);wingShape.closePath();
    const wing=mesh(new T.ExtrudeGeometry(wingShape,{depth:.12,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:1,steps:1}),white,plane,0,.03,-.25);wing.rotation.x=-Math.PI/2;wing.castShadow=true;
    for(const side of [-1,1]){const tip=box(.5,.12,.79,trim,plane,side*3.14,.07,-.18);tip.rotation.y=-side*.1;const stripe=box(.14,.03,.86,trim,plane,side*2.57,.16,-.22);stripe.rotation.y=-side*.08;}
    const cockpit=mesh(new T.SphereGeometry(1,20,12),glass,plane,0,.48,-.45);cockpit.scale.set(.3,.24,.75);
    const tail=box(2.35,.095,.67,white,plane,0,.18,1.65);tail.castShadow=true;for(const side of [-1,1])box(.27,.11,.63,trim,plane,side*1.03,.19,1.65);
    const finShape=new T.Shape();finShape.moveTo(-.6,0);finShape.lineTo(.34,0);finShape.lineTo(.28,1.15);finShape.lineTo(-.04,1.23);finShape.closePath();const fin=mesh(new T.ExtrudeGeometry(finShape,{depth:.085,bevelEnabled:false}),trim,plane,-.04,.24,1.58);fin.rotation.y=Math.PI/2;
    for(const side of [-1,1]){box(.08,.55,.08,silver,plane,side*.6,-.43,-.2);const wheel=mesh(new T.CylinderGeometry(.19,.19,.14,12),dark,plane,side*.6,-.7,-.2);wheel.rotation.z=Math.PI/2;}
    const prop=new T.Group();plane.add(prop);prop.position.z=-2.12;box(2.35,.065,.09,dark,prop);box(.065,2.35,.09,dark,prop);const spinner=mesh(new T.SphereGeometry(.19,14,8),trim,plane,0,.15,-2.2);spinner.scale.z=1.5;
    box(.67,.1,.17,trim,plane,0,.49,.53);box(.42,.1,.15,trim,plane,0,.36,1.08);
    const runway=new T.Group();scene.add(runway);box(12,.13,52,material('#94b56d'),runway,0,.07,0).receiveShadow=true;box(7,.14,45,material('#737f7c'),runway,0,.19,0).receiveShadow=true;for(const side of [-1,1])box(.12,.02,44,white,runway,side*3.23,.28,0);for(let i=0;i<12;i++)box(.15,.02,1.5,white,runway,0,.28,i*3.5-20);for(const side of [-1,1])for(let i=0;i<7;i++){const lamp=mesh(new T.SphereGeometry(.12,6,4),material('#ffcf76',{emissive:'#e8af2c',emissiveIntensity:.25}),runway,side*3.65,.3,i*7-21);}
    const objects=new Map(),windMat=material('#f0f0dd'),redMat=material('#e78562'),coinMat=material('#ffc74f',{metalness:.45,roughness:.25,emissive:'#b16e08',emissiveIntensity:.12});
    function obstacle(o){const group=new T.Group();scene.add(group);if(o.type==='wind'){mesh(new T.CylinderGeometry(.12,.25,6,9),silver,group,0,3,0).castShadow=true;const rotor=new T.Group();rotor.position.set(0,6,.22);group.add(rotor);for(let i=0;i<3;i++){const blade=new T.Group();blade.rotation.z=i*Math.PI*2/3;rotor.add(blade);const main=box(.3,2.6,.09,windMat,blade,0,1.55,0);main.rotation.z=-.055;box(.3,.6,.1,redMat,blade,-.085,2.62,.01);}mesh(new T.SphereGeometry(.25,12,8),trim,rotor,0,0,.12);group.userData.rotor=rotor;}else{const ring=mesh(new T.TorusGeometry(.52,.12,7,18),coinMat,group,0,4.6,0);mesh(new T.CylinderGeometry(.4,.4,.08,16),coinMat,group,0,4.6,0).rotation.x=Math.PI/2;group.userData.ring=ring;}
      objects.set(o,group);return group;
    }
    let lastPaint,frameCount=0;
    function paint(s){
      plane.position.set(s.x/50,4.5+Math.sin(s.time*3)*.025,1);plane.rotation.z=-Math.max(-.24,Math.min(.24,s.vx/1500));plane.rotation.y=-s.vx/7000;prop.rotation.z=s.time*45;white.color.set(s.plane.color);trim.color.set(s.plane.trim);
      const remaining=420-(s.distance-s.stageStart);runway.visible=remaining<170;runway.position.z=13-Math.max(0,remaining)*.55;if(remaining<80)plane.position.y=1.35+Math.max(0,remaining)/80*3.15;
      camera.position.x=s.x/50*.25;camera.lookAt(s.x/50*.2,3,-12);
      for(let i=0;i<100;i++){const side=i%2?1:-1,xx=side*(7+((i*37)%270)/10),zz=((i*17+s.distance*.7)%240)-220,scale=.65+i%4*.23;matrix.position.set(xx,1.6*scale,zz);matrix.scale.set(scale,scale,scale);matrix.rotation.set(0,i,0);matrix.updateMatrix();trees.setMatrixAt(i,matrix.matrix);matrix.position.y=.7*scale;matrix.scale.set(scale,scale,scale);matrix.updateMatrix();trunks.setMatrixAt(i,matrix.matrix);}trees.instanceMatrix.needsUpdate=trunks.instanceMatrix.needsUpdate=true;
      const active=new Set(s.objects);for(const [key,group] of objects)if(!active.has(key)){scene.remove(group);group.traverse(o=>o.geometry?.dispose());objects.delete(key);}
      for(const o of s.objects){const group=objects.get(o)||obstacle(o);group.visible=o.t>=0;group.position.set(o.x/50,0,-145+o.t*146);if(group.userData.rotor)group.userData.rotor.rotation.z=o.rotation;else group.rotation.y=s.time*1.8;}
      if(softwareShadow)softwareShadow.position.x=s.x/50;renderer.render(scene,camera);frameCount++;hostCanvas.dataset.renderer=renderer.isSoftware?'software-3d':'webgl';
    }
    function resize(width,height){renderer.setSize(width,height,false);renderer.domElement.style.width=width+'px';renderer.domElement.style.height=height+'px';camera.aspect=width/height;camera.fov=width<650?64:51;camera.updateProjectionMatrix();}
    function destroy(){const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>materials.add(m));else materials.add(o.material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}
    return{paint,resize,destroy};
  }
  window.FPFlight3D={create};
})();
