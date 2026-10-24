/* Three.js world renderer. Geometry is original; coordinates share the flight simulation. */
(() => {
  'use strict';
  function create(hostCanvas){
    const T=window.THREE,P=window.FPFlightPhysics;if(!T||!P)return null;
    let renderer;const surface=document.createElement('canvas');
    let gl;try{gl=surface.getContext('webgl2',{antialias:true})||surface.getContext('webgl',{antialias:true});if(gl)renderer=new T.WebGLRenderer({canvas:surface,context:gl,antialias:true,powerPreference:'high-performance'});}catch{}if(!renderer)renderer=window.FPSoftware3D?.create(T);if(!renderer)return null;
    const software=!!renderer.isSoftware;
    renderer.domElement.className='flight3d-canvas';renderer.domElement.setAttribute('aria-hidden','true');hostCanvas.after(renderer.domElement);
    let ratio=Math.min(devicePixelRatio||1,1.65),width=1000,height=600;renderer.setPixelRatio(software?1:ratio);renderer.shadowMap.enabled=!software;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(57,1,.2,software?650:2400);scene.background=new T.Color('#9ed9ed');scene.fog=new T.Fog('#c4e5db',software?200:450,software?650:1600);
    const hemi=new T.HemisphereLight('#e6f5ff','#537a41',2.1);scene.add(hemi);
    const sun=new T.DirectionalLight('#fff2d2',3);sun.position.set(-130,190,80);sun.castShadow=!software;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:500});sun.shadow.normalBias=.15;sun.shadow.bias=-.0001;scene.add(sun,sun.target);
    const geometries=new Set(),materials=new Set();
    const material=(color,more={})=>{const m=new T.MeshStandardMaterial({color,roughness:.76,...more});materials.add(m);return m;};
    const mesh=(g,m,parent,x=0,y=0,z=0)=>{geometries.add(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
    const cube=new T.BoxGeometry(1,1,1);geometries.add(cube);
    const box=(w,h,d,m,parent,x=0,y=0,z=0)=>{const o=mesh(cube,m,parent,x,y,z);o.scale.set(w,h,d);return o;};
    const white=material('#f8f8eb',{roughness:.36}),trim=material('#ed6652',{roughness:.3}),dark=material('#293b46'),silver=material('#c4d4d1',{metalness:.45}),glass=material('#69b7d0',{metalness:.55,roughness:.12});
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
    plane.scale.setScalar(1);
    // Engine cowling, wing ribs, cockpit frame and tail wheel add readable detail.
    for(const side of [-1,1]){
      for(let i=0;i<4;i++)box(.025,.015,.73,silver,plane,side*(.9+i*.48),.17,-.18);
      box(.035,.24,.04,white,plane,side*.22,.58,-.45);
      mesh(new T.SphereGeometry(.055,8,5),material(side<0?'#ff5849':'#5ae29c',{emissive:side<0?'#aa1400':'#00aa55'}),plane,side*3.45,.12,-.05);
    }
    const tailWheel=mesh(new T.CylinderGeometry(.12,.12,.1,10),dark,plane,0,-.35,1.55);tailWheel.rotation.z=Math.PI/2;
    const cowling=mesh(new T.CylinderGeometry(.33,.37,.36,20),trim,plane,0,.12,-1.78);cowling.rotation.x=Math.PI/2;
    plane.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    let worldGroup,worldRef,terrainMesh,water,windViews=[],coinViews=[],clouds=[],windsocks=[],parks=[],burst,previewMode=false,frame=0,slow=0,dead=false,reflection;
    const target=new T.Vector3(),look=new T.Vector3(),cameraGoal=new T.Vector3();let cameraReady=false;
    const persistentGeometry=new Set(geometries);
    const cached=new Map();
    function mat(c,extra={}){const key=c+JSON.stringify(extra);if(!cached.has(key))cached.set(key,material(c,extra));return cached.get(key);}
    const sphere=new T.SphereGeometry(1,software?8:16,software?5:10),cone=new T.ConeGeometry(1,1,7),cylinder=new T.CylinderGeometry(1,1,1,10);[sphere,cone,cylinder].forEach(g=>{geometries.add(g);persistentGeometry.add(g);});
    function ellipsoid(parent,m,x,y,z,sx,sy,sz){const o=mesh(sphere,m,parent,x,y,z);o.scale.set(sx,sy,sz);return o;}
    function airport(d){
      const a=new T.Group();a.position.z=-d;worldGroup.add(a);
      const grass=mat('#8eb76d'),asphalt=mat('#435b63'),ivory=mat('#fff4d9');
      box(110,.15,300,grass,a,0,.02,-110).receiveShadow=true;
      box(20,.16,260,asphalt,a,0,.15,-110).receiveShadow=true;
      for(const side of [-1,1]){
        box(.25,.025,258,ivory,a,side*9.4,.25,-110);
        for(let z=0;z<250;z+=18)ellipsoid(a,mat('#ffdf93',{emissive:'#ffcc60',emissiveIntensity:.8}),side*10,.6,16-z,.24,.24,.24);
        for(let i=0;i<5;i++)box(.7,.025,9,ivory,a,side*(1.5+i*1.4),.26,7);
      }
      for(let i=0;i<18;i++)box(.35,.025,7,ivory,a,0,.26,-8-i*13);
      for(let i=0;i<3;i++){
        const h=box(19,8,18,mat(i%2?'#ece1c4':'#b8d1cc'),a,-32,4,-35-i*27);h.castShadow=true;
        const roof=mesh(new T.CylinderGeometry(10,10,19,12,1,false,0,Math.PI),mat('#516c78'),a,-32,8,-35-i*27);roof.rotation.z=Math.PI/2;roof.rotation.y=Math.PI/2;
        box(12,5,.1,mat('#48616c'),a,-32,2.5,-25.9-i*27);
      }
      box(8,15,8,mat('#e9dfc6'),a,32,7.5,-50).castShadow=true;box(12,5,11,mat('#54899d',{metalness:.3,roughness:.25}),a,32,17,-50);box(14,.8,13,ivory,a,32,20,-50);
      box(.2,12,.2,silver,a,21,6,-10);const sock=new T.Group();sock.position.set(21,12,-10);a.add(sock);windsocks.push(sock);
      for(let j=0;j<5;j++){const o=mesh(new T.CylinderGeometry(.5-j*.055,.55-j*.055,.65,10),mat(j%2?'#fff2dc':'#ee8658'),sock,j*.62,.1-j*.08,0);o.rotation.z=Math.PI/2;}
      for(let i=0;i<(software?0:2);i++){const p=plane.clone(true);p.position.set(-31,1.1,-125-i*17);p.rotation.y=.8;p.scale.setScalar(.8);a.add(p);parks.push(p);}
      // Approach lights remain visible when the runway is still distant.
      for(let i=0;i<7;i++)box(3,.1,.7,mat('#fff0a8',{emissive:'#ffe6a0',emissiveIntensity:.5}),a,0,.32,25+i*10);
    }
    function build(w){
      if(worldGroup){scene.remove(worldGroup);worldGroup.traverse(o=>{if(o.geometry&&!persistentGeometry.has(o.geometry)){o.geometry.dispose();geometries.delete(o.geometry);}});}
      worldRef=w;windViews=[];coinViews=[];clouds=[];windsocks=[];parks=[];cameraReady=false;worldGroup=new T.Group();scene.add(worldGroup);
      const c=w.c;scene.background.set(c.sky);scene.fog.color.set(c.fog);sun.color.set(c.sun);hemi.groundColor.set(c.grass);
      const span=c.length+800,segmentsX=software?24:120,segmentsZ=software?40:Math.ceil(span/8);
      const g=new T.PlaneGeometry(1200,span,segmentsX,segmentsZ);g.rotateX(-Math.PI/2);g.translate(0,0,-c.length/2);
      const pos=g.attributes.position,colors=[];const base=new T.Color(c.grass),color=new T.Color();
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),d=-pos.getZ(i),y=P.terrain(x,d,w.stage);pos.setY(i,y);const variation=.94+.08*Math.sin(x*.03+d*.04);color.copy(base).multiplyScalar(variation);if(y>60)color.lerp(new T.Color('#a3aaa1'),Math.min(.8,(y-60)/65));if(y>100)color.lerp(new T.Color('#f2eee3'),Math.min(.85,(y-100)/30));if(c.coast&&y<1.5)color.set('#dcd0a0');colors.push(color.r,color.g,color.b);}
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();terrainMesh=mesh(g,mat('#ffffff',{vertexColors:true}),worldGroup);terrainMesh.receiveShadow=true;terrainMesh.userData.unique=true;
      // Water surface plus a meandering river set into the valley.
      water=mesh(new T.PlaneGeometry(3500,3500),mat(c.coast?'#4aa5bc':'#65b5bd',{metalness:.42,roughness:.2}),worldGroup,0,-.7,-c.length/2);water.rotation.x=-Math.PI/2;water.userData.unique=true;
      const river=[];for(let d=190;d<c.length-220;d+=9){const x=68+Math.sin(d*.012)*18,x2=68+Math.sin((d+9)*.012)*18,y=P.terrain(x,d,w.stage)+.16,y2=P.terrain(x2,d+9,w.stage)+.16;river.push(x-5,y,-d,x+5,y,-d,x2-5,y2,-d-9,x+5,y,-d,x2+5,y2,-d-9,x2-5,y2,-d-9);}
      const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(river,3));rg.computeVertexNormals();const rm=mesh(rg,mat('#62b9c6',{roughness:.22,metalness:.3,side:T.DoubleSide}),worldGroup);rm.userData.unique=true;
      // Deterministic, varied forests; instancing keeps draw calls low on mobile.
      let seed=1024+w.stage;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
      function instances(geom,m,count,place){const o=new T.InstancedMesh(geom,m,count),dummy=new T.Object3D();worldGroup.add(o);o.receiveShadow=true;o.castShadow=!software;for(let i=0;i<count;i++){place(dummy,i);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);}o.computeBoundingSphere();return o;}
      const locations=[];for(let i=0;i<(software?100:1100);i++){const x=(random()<.5?-1:1)*(32+random()*400),d=195+random()*(c.length-425),y=P.terrain(x,d,w.stage);if(y<0||Math.abs(x-(68+Math.sin(d*.012)*18))<9)continue;locations.push({x,d,y,size:2+random()*4,rot:random()*6});}
      instances(cylinder,mat('#6b6650'),locations.length,(o,i)=>{const p=locations[i];o.position.set(p.x,p.y+p.size*.45,-p.d);o.scale.set(.3,p.size,.3);});
      for(let type=0;type<2;type++){const list=locations.filter((_,i)=>i%2===type);instances(type?cone:sphere,mat(type?'#3f795d':'#5d9668'),list.length,(o,i)=>{const p=list[i];o.position.set(p.x,p.y+p.size*1.2,-p.d);o.scale.set(p.size*.55,p.size*(type?1.8:.85),p.size*.55);o.rotation.y=p.rot;});}
      // Settlements have roofs, windows, roads and little bridges across the river.
      for(let i=0;i<16;i++){
        const d=260+i*(c.length-530)/16,x=(i%2?-1:1)*(90+i%4*12),y=P.terrain(x,d,w.stage),house=new T.Group();house.position.set(x,y,-d);worldGroup.add(house);
        box(8,5,7,mat(['#f1ddbd','#e3b49b','#d6ded1'][i%3]),house,0,2.5,0).castShadow=true;
        const roof=mesh(new T.ConeGeometry(6.4,3.6,4),mat('#986b59'),house,0,6,0);roof.rotation.y=Math.PI/4;roof.scale.z=.85;
        for(const side of [-1,1])box(1.4,1.5,.1,glass,house,side*2,3,3.55);box(1.3,2.6,.12,mat('#6c796b'),house,0,1.3,3.6);
        box(12,.12,4,mat('#c7bc9a'),house,0,.08,6);
        if(i%4===0){const bx=68+Math.sin(d*.012)*18,by=P.terrain(bx,d,w.stage)+1;box(18,.5,5,mat('#a68a64'),worldGroup,bx,by,-d);for(const side of [-1,1])box(18,.3,.2,mat('#d4c6a2'),worldGroup,bx,by+1.2,-d+side*2.4);}
      }
      if(!software)instances(sphere,mat('#f8dea0'),350,(o)=>{const x=(random()-.5)*250,d=200+random()*(c.length-440);o.position.set(x,P.terrain(x,d,w.stage)+.3,-d);o.scale.set(.22,.3,.22);});
      const cloudMat=mat('#fff8ed');cloudMat.userData.cloud=true;
      for(let i=0;i<(software?8:26);i++){const group=new T.Group();worldGroup.add(group);for(let j=0;j<5;j++)ellipsoid(group,cloudMat,j*7-14,Math.sin(j*2)*2,Math.cos(j)*3,8,4+j%3,6);group.position.set((i%2?-1:1)*(45+random()*300),85+random()*85,-random()*c.length);group.scale.setScalar(1+random()*1.5);clouds.push(group);}
      airport(-20);airport(c.length);
      const sunBall=ellipsoid(worldGroup,mat(c.sun,{emissive:c.sun,emissiveIntensity:2}),-400,290,-c.length-500,35,35,35);sunBall.userData.softwareSkip=software;
      const towerMat=mat('#f4f2e6'),hubMat=mat('#e9e5d6');
      for(const wv of w.winds){const group=new T.Group();worldGroup.add(group);group.position.set(wv.x,wv.y,-wv.d);
        const tower=mesh(new T.CylinderGeometry(.35,.6,wv.height,12),towerMat,group,0,wv.height/2,0);tower.castShadow=true;tower.userData.unique=true;
        box(1.4,1.3,3,hubMat,group,0,wv.height,-.7).castShadow=true;
        const rotor=new T.Group();group.add(rotor);rotor.position.set(0,wv.height,.7);
        for(let j=0;j<3;j++){const blade=new T.Group();rotor.add(blade);blade.rotation.z=j*Math.PI*2/3;const b=box(.65,wv.radius,.18,towerMat,blade,0,wv.radius/2,0);b.castShadow=true;box(.65,1.1,.2,mat('#df8469'),blade,0,wv.radius-.6,.01);}
        ellipsoid(rotor,hubMat,0,0,.2,.85,.85,.8);windViews.push(rotor);
      }
      const gold=mat('#ffcc43',{metalness:.72,roughness:.22,emissive:'#d99408',emissiveIntensity:.18}),coinGeo=new T.CylinderGeometry(1.25,1.25,.25,software?10:24);geometries.add(coinGeo);
      for(const coin of w.coins){const group=new T.Group();group.position.set(coin.x,coin.y,-coin.d);worldGroup.add(group);const disk=mesh(coinGeo,gold,group);disk.rotation.x=Math.PI/2;const rim=mesh(new T.TorusGeometry(1.05,.09,software?3:6,software?8:20),mat('#fff0a1',{metalness:.4,roughness:.25}),group,0,0,.15);rim.userData.unique=true;box(.2,1.3,.08,mat('#fff0a1'),group,0,0,.19);coinViews.push(group);}
      burst=new T.Group();worldGroup.add(burst);for(let i=0;i<12;i++)ellipsoid(burst,gold,0,0,0,.12,.12,.12);burst.visible=false;
      if(!software){
        // One static capture per course supplies terrain/sky reflections to water and metal.
        scene.environment=null;reflection?.dispose();reflection=new T.WebGLCubeRenderTarget(128,{generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
        const capture=new T.CubeCamera(1,2400,reflection);capture.position.set(65,24,-c.length*.52);water.visible=false;plane.visible=false;
        capture.update(renderer,scene);water.visible=true;plane.visible=true;scene.environment=reflection.texture;
      }
    }
    function paint(s,p,opt){
      if(dead)return;if(worldRef!==s.world)build(s.world);
      white.color.set(p.color);trim.color.set(p.trim);prop.rotation.z=s.time*48+opt.angle*15;
      if(opt.preview){plane.position.set(0,5,-20);plane.rotation.set(.06,opt.angle,0);}else{plane.position.set(s.x,s.y,-s.d);plane.rotation.set(s.pitch,s.heading,s.roll,'YXZ');}
      if(previewMode!==opt.preview){cameraReady=false;previewMode=opt.preview;}
      if(opt.preview){cameraGoal.set(8,8,-5);target.set(-2,4.5,-20);}else if(s.phase==='rollout'||s.phase==='done'){cameraGoal.set(s.x+16,s.y+6,-s.d+15);target.set(s.x,s.y,-s.d-5);}else{cameraGoal.set(s.x-s.vx*.17,s.y+7.5,-s.d+23);target.set(s.x+s.vx*.35,s.y+1,-s.d-30);}
      // Terrain also constrains the camera, avoiding underground viewpoints.
      cameraGoal.y=Math.max(cameraGoal.y,P.terrain(cameraGoal.x,-cameraGoal.z,s.stage)+3);
      if(!cameraReady){camera.position.copy(cameraGoal);look.copy(target);cameraReady=true;}else{camera.position.lerp(cameraGoal,1-Math.exp(-opt.dt*5));look.lerp(target,1-Math.exp(-opt.dt*6));}camera.lookAt(look);
      sun.position.set(plane.position.x-100,plane.position.y+170,plane.position.z+65);sun.target.position.copy(plane.position);
      for(let i=0;i<windViews.length;i++)windViews[i].rotation.z=s.world.winds[i].angle;
      for(let i=0;i<coinViews.length;i++){coinViews[i].visible=!s.world.coins[i].taken;coinViews[i].rotation.y=s.time*1.4+i*.2;}
      for(const sock of windsocks)sock.rotation.y=Math.sin(s.time*.7)*.12;
      for(const cloud of clouds)cloud.rotation.y=Math.sin(s.time*.025)*.025;
      if(s.spark&&s.time-s.spark.time<.6){burst.visible=true;burst.position.set(s.spark.x,s.spark.y,-s.spark.d);const age=s.time-s.spark.time;burst.children.forEach((o,i)=>{const a=i*Math.PI*2/12;o.position.set(Math.cos(a)*age*6,Math.sin(a)*age*6,Math.sin(i*5)*age*4);o.scale.setScalar(.16*(1-age/.6));});}else burst.visible=false;
      if(s.phase==='crash')plane.scale.setScalar(Math.max(.7,1-s.timer*.12));else plane.scale.setScalar(1);
      const started=performance.now();renderer.render(scene,camera);const cost=performance.now()-started;
      if(!software&&++frame%120===0){if(cost>23)slow++;else slow=Math.max(0,slow-1);if(slow>=2&&ratio>1){ratio=Math.max(1,ratio-.25);renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);slow=0;}}
      hostCanvas.dataset.renderer=software?'software-3d':'webgl';
    }
    const lost=e=>{e.preventDefault();hostCanvas.dispatchEvent(new Event('webglcontextlost'));hostCanvas.parentElement.querySelector('#pilotRendererNote').textContent='Grafiken pausades. Ladda om sidan om den inte kommer tillbaka.';};surface.addEventListener('webglcontextlost',lost);
    const restored=()=>{hostCanvas.parentElement.querySelector('#pilotRendererNote').textContent='Grafiken är tillbaka. Tryck Fortsätt flyga.';};surface.addEventListener('webglcontextrestored',restored);
    function resize(w,h){width=w;height=h;renderer.setSize(w,h,false);renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';camera.aspect=w/h;camera.fov=w<650?68:57;camera.updateProjectionMatrix();}
    function destroy(){dead=true;surface.removeEventListener('webglcontextlost',lost);surface.removeEventListener('webglcontextrestored',restored);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());reflection?.dispose();renderer.dispose();renderer.domElement.remove();}
    return{paint,resize,destroy,software};
  }
  window.FPFlight3D={create};
})();
