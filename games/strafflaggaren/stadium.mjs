// All stadium coordinates are in metres. The near goal line is z=0.
const W=30,L=60, TAU=Math.PI*2;
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function paint(T,w,h,fn,srgb=true){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  fn(c.getContext('2d'),w,h);
  const map=new T.CanvasTexture(c);
  if(srgb)map.colorSpace=T.SRGBColorSpace;
  return map;
}

function pitch(T,group,renderer){
  const random=seeded(91832);
  const tile=paint(T,512,512,(ctx,w,h)=>{
    const im=ctx.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const v=random()*30+Math.sin(x*.14+Math.sin(y*.03))*3;
      const i=(y*w+x)*4;im.data[i]=92+v*.75;im.data[i+1]=115+v;im.data[i+2]=49+v*.55;im.data[i+3]=255;
    }
    ctx.putImageData(im,0,0);
    for(let i=0;i<18000;i++){
      const x=random()*w,y=random()*h;
      ctx.strokeStyle=i%3?'rgba(33,61,16,.24)':'rgba(223,220,143,.35)';
      ctx.lineWidth=.45+random()*.7;ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+random()*2-.4,y-1-random()*4);ctx.stroke();
    }
  });
  tile.wrapS=tile.wrapT=T.RepeatWrapping;tile.repeat.set(60,75);
  tile.anisotropy=Math.min(8,renderer.capabilities?.getMaxAnisotropy?.()||1);
  const normal=paint(T,256,256,(ctx,w,h)=>{
    const pixels=ctx.createImageData(w,h);
    for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]=118+random()*20;pixels.data[i+1]=105+random()*42;pixels.data[i+2]=248;pixels.data[i+3]=255;}
    ctx.putImageData(pixels,0,0);
  },false);
  normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.copy(tile.repeat);
  const m=new T.MeshStandardMaterial({map:tile,normalMap:normal,normalScale:new T.Vector2(.33,.33),roughness:1});
  // Positions, rather than texture UVs, keep the mowing bands fixed on the field.
  m.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 fpField;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nfpField=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader='varying vec3 fpField;\n'+s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float stripe=smoothstep(-.12,.12,sin(fpField.z*.58));
      float grain=sin(fpField.x*1.2+fpField.z*.7)*sin(fpField.z*.8-fpField.x*.65);
      diffuseColor.rgb *= .90+stripe*.13+grain*.025;
    `);
  };
  const surface=new T.Mesh(new T.PlaneGeometry(116,146),m);surface.rotation.x=-Math.PI/2;surface.position.set(0,-.009,30);surface.receiveShadow=true;group.add(surface);
  const vertices=[];
  const strip=(x1,z1,x2,z2,width=.105)=>{
    const d=Math.hypot(z2-z1,x2-x1),dx=(z2-z1)*width*.5/d,dz=(x1-x2)*width*.5/d;
    for(const [x,z] of [[x1+dx,z1+dz],[x2+dx,z2+dz],[x1-dx,z1-dz],[x2+dx,z2+dz],[x2-dx,z2-dz],[x1-dx,z1-dz]])vertices.push(x,.002,z);
  };
  const arc=(x,z,r,a,b)=>{for(let i=0;i<64;i++){const u=a+(b-a)*i/64,v=a+(b-a)*(i+1)/64;strip(x+r*Math.cos(u),z+r*Math.sin(u),x+r*Math.cos(v),z+r*Math.sin(v));}};
  strip(-W,0,W,0);strip(-W,L,W,L);strip(-W,0,-W,L);strip(W,0,W,L);strip(-W,L/2,W,L/2);
  for(const s of [0,1]){
    const base=s?L:0,sign=s?-1:1;
    for(const [half,depth] of [[20.16,16.5],[9.16,5.5]]){
      strip(-half,base,-half,base+sign*depth);strip(half,base,half,base+sign*depth);strip(-half,base+sign*depth,half,base+sign*depth);
    }
    const a=Math.asin(5.5/9.15);arc(0,base+11*sign,9.15,s?Math.PI+a:a,s?TAU-a:Math.PI-a);
    for(let i=0;i<20;i++){const a=i/20*TAU,b=(i+1)/20*TAU;vertices.push(0,.002,base+11*sign,.12*Math.cos(a),.002,base+11*sign+.12*Math.sin(a),.12*Math.cos(b),.002,base+11*sign+.12*Math.sin(b));}
  }
  arc(0,L/2,6.5,0,TAU);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
  const lines=new T.Mesh(geo,new T.MeshStandardMaterial({color:0xece7ce,side:T.DoubleSide,roughness:1,polygonOffset:true,polygonOffsetFactor:-2}));
  lines.receiveShadow=true;group.add(lines);
  // Small clusters of short, bent blades are only needed where either camera gets close.
  const blades=[];
  for(let i=0;i<3800;i++){
    const x=(random()-.5)*20,z=random()*30-10,h=.018+random()*.032,b=.006+random()*.006;
    for(let j=0;j<2;j++){
      const dx=random()*.028-.014, dz=random()*.028-.014;
      blades.push(x-b,0,z,x+b,0,z,x+dx,h,z+dz); 
    }
  }
  const bladeGeo=new T.BufferGeometry();bladeGeo.setAttribute('position',new T.Float32BufferAttribute(blades,3));bladeGeo.computeVertexNormals();
  const grass=new T.Mesh(bladeGeo,new T.MeshLambertMaterial({color:'#849545',side:T.DoubleSide}));grass.receiveShadow=true;group.add(grass);return grass;
}

function skyDome(T,root){
  const uniforms={zenith:{value:new T.Color()},horizon:{value:new T.Color()},sunCol:{value:new T.Color()},sunDir:{value:new T.Vector3()},night:{value:0}};
  const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,
    vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 dir;uniform vec3 zenith,horizon,sunCol,sunDir;uniform float night;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 a=floor(p),b=fract(p);b=b*b*(3.-2.*b);return mix(mix(hash(a),hash(a+vec2(1,0)),b.x),mix(hash(a+vec2(0,1)),hash(a+1.),b.x),b.y);}
      void main(){vec3 d=normalize(dir);float y=max(0.,d.y),sun=max(0.,dot(d,normalize(sunDir)));
      vec3 base=mix(horizon,zenith,pow(y,.52));vec2 uv=d.xz/(y+.15)*2.5;
      float cloud=noise(uv)*.5+noise(uv*2.2)*.3+noise(uv*5.)*.15+noise(uv*12.)*.05;
      float cover=smoothstep(.48,.74,cloud)*smoothstep(.005,.19,y);
      base=mix(base,mix(vec3(.70,.76,.81),vec3(1.25,1.20,1.06),cloud),cover*(1.-night)*.79);
      base+=sunCol*(pow(sun,12.)*.18+pow(sun,160.)*.30+smoothstep(.99945,.99984,sun)*2.3)*(1.-night);
      gl_FragColor=vec4(base,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
  const dome=new T.Mesh(new T.SphereGeometry(136,36,18),material);dome.renderOrder=-10;dome.position.z=22;root.add(dome);return uniforms;
}

function architecture(T,root){
  const batch=new Map(),dummy=new T.Object3D(),colors=new Map();
  const boxGeo=new T.BoxGeometry(1,1,1),tubeGeo=new T.CylinderGeometry(1,1,1,8);
  const up=new T.Vector3(0,1,0),a=new T.Vector3(),b=new T.Vector3(),delta=new T.Vector3();
  function stamp(geo,color,shadows=true){
    const key=geo.uuid+shadows;
    if(!batch.has(key))batch.set(key,{geo,shadows,items:[]});
    dummy.updateMatrix();batch.get(key).items.push([dummy.matrix.clone(),color]);
  }
  function box(x,y,z,w,h,d,col,ry=0,rz=0,casts=true){
    dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,ry,rz);stamp(boxGeo,col,casts);
  }
  function rod(x,y,z,X,Y,Z,r,c,casts=true){
    a.set(x,y,z);b.set(X,Y,Z);delta.subVectors(b,a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.scale.set(r,delta.length(),r);
    dummy.quaternion.setFromUnitVectors(up,delta.normalize());stamp(tubeGeo,c,casts);
  }
  function flush(){
    const material=new T.MeshStandardMaterial({roughness:.79});
    for(const {geo,shadows,items} of batch.values()){
      const mesh=new T.InstancedMesh(geo,material,items.length);
      items.forEach(([matrix,color],i)=>{mesh.setMatrixAt(i,matrix);if(!colors.has(color))colors.set(color,new T.Color(color));mesh.setColorAt(i,colors.get(color));});
      mesh.castShadow=shadows;mesh.receiveShadow=true;root.add(mesh);
    }
  }
  return {box,rod,flush};
}

function signage(T,root){
  const cache=new Map();
  return (text,x,y,z,w,h,angle=0,bg='#152d46',fg='#fff8e4')=>{
    const key=[text,bg,fg].join('|');
    if(!cache.has(key)){
      const map=paint(T,768,96,(c,W,H)=>{
        c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;c.font='900 49px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W*.5,H*.53,W*.91);
        c.fillStyle='rgba(255,255,255,.23)';c.fillRect(0,0,W,3);
      });
      cache.set(key,new T.MeshStandardMaterial({map,roughness:.73}));
    }
    const o=new T.Mesh(new T.PlaneGeometry(w,h),cache.get(key));o.rotation.y=angle;o.position.set(x,y,z);root.add(o);
  };
}

// Two crossed foliage planes per crown give the trees volume from both touchlines.
function treeline(T,root,rand){
  const atlas=paint(T,512,512,(ctx,w,h)=>{
    const r=seeded(8191);
    for(let i=0;i<12000;i++){
      const a=r()*TAU,rad=Math.sqrt(r())*.47,edge=.86+.06*Math.sin(a*7)+.06*Math.sin(a*11);
      if(rad>.47*edge)continue;
      const x=w*(.5+Math.cos(a)*rad),y=h*(.5+Math.sin(a)*rad);
      const light=(1-x/w)*.16+(1-y/h)*.34+r()*.42;
      ctx.fillStyle=`rgb(${Math.round(30+60*light)},${Math.round(52+72*light)},${Math.round(25+25*light)})`;
      ctx.beginPath();ctx.ellipse(x,y,2+r()*4,1.4+r()*3,r()*3,0,TAU);ctx.fill();
    }
  });atlas.anisotropy=2;
  const geo=new T.PlaneGeometry(1,1),mat=new T.MeshLambertMaterial({map:atlas,alphaTest:.38,side:T.DoubleSide});
  const positions=[];
  for(let i=0;i<45;i++)positions.push([-55+rand()*110,-29-rand()*10]);
  for(let i=0;i<40;i++)positions.push([-54+rand()*108,70+rand()*11]);
  for(let i=0;i<40;i++)positions.push([(i%2?1:-1)*(40+rand()*10),-9+rand()*83]);
  const trees=new T.InstancedMesh(geo,mat,positions.length*6);
  const d=new T.Object3D();let idx=0;
  for(const [x,z] of positions){
    const h=6+rand()*5.7,w=3+rand()*2.8;
    for(let k=0;k<3;k++){
      const ox=(rand()-.5)*w*.7,oy=(rand()-.5)*h*.25,oz=(rand()-.5)*w*.7;
      for(const a of [0,Math.PI*.5]){d.position.set(x+ox,h*.62+oy,z+oz);d.scale.set(w,h*.7,1);d.rotation.set(0,a+rand()*.22,0);d.updateMatrix();trees.setMatrixAt(idx,d.matrix);trees.setColorAt(idx++,new T.Color().setRGB(.70+rand()*.26,.77+rand()*.22,.76+rand()*.18));}
    }
  }
  root.add(trees);
  const trunks=architecture(T,root);for(const [x,z] of positions)trunks.rod(x,0,z,x+.1,4.2,z,.18,'#615447',false);trunks.flush();
}

function crowd(T,root,seats,rand){
  const jerseys=['#e3b23a','#f5cc48','#416086','#254770','#bcb7ad','#343c46','#a7564e','#6d8f92','#ece5d8','#464f53'];
  const skins=['#d9a37d','#8c614d','#e5b592','#c78c64','#775144'];
  const hair=['#43352b','#413a38','#b69a69','#624535','#93877a'];
  const clock={value:0},energy={value:0};
  const material=new T.MeshStandardMaterial({roughness:.92});
  material.onBeforeCompile=s=>{
    s.uniforms.crowdTime=clock;s.uniforms.crowdEnergy=energy;
    s.vertexShader='uniform float crowdTime,crowdEnergy;\n'+s.vertexShader.replace('#include <project_vertex>',`
      #include <project_vertex>
      vec3 seat=instanceMatrix[3].xyz;
      float phase=seat.x*.86+seat.z*1.38;
      mvPosition.y+=sin(crowdTime*2.+phase)*.018+crowdEnergy*(.065+.065*sin(crowdTime*9.+phase));
      gl_Position=projectionMatrix*mvPosition;
    `);
  };
  const capsule=seats.length>1000?new T.IcosahedronGeometry(1,0):new T.SphereGeometry(1,8,5);
  const count=seats.length, crowd=new T.InstancedMesh(capsule,material,count*8);
  const dummy=new T.Object3D();let idx=0;
  // A reduced instance count still leaves an even distribution in every stand.
  for(let i=seats.length-1;i>0;i--){const k=Math.floor(rand()*(i+1));[seats[i],seats[k]]=[seats[k],seats[i]];}
  for(const [x,y,z,rotation] of seats){
    const j=jerseys[Math.floor(rand()*jerseys.length)],skin=skins[Math.floor(rand()*skins.length)],coif=hair[Math.floor(rand()*hair.length)],s=.82+rand()*.24;
    const cs=Math.cos(rotation),sn=Math.sin(rotation);
    function part(dx,dy,dz,wx,wy,wz,tilt,col){
      dummy.position.set(x+(dx*cs+dz*sn)*s,y+dy*s,z+(dz*cs-dx*sn)*s);dummy.rotation.set(0,rotation,tilt,'YXZ');dummy.scale.set(wx*s,wy*s,wz*s);dummy.updateMatrix();crowd.setMatrixAt(idx,dummy.matrix);crowd.setColorAt(idx++,new T.Color(col));
    }
    part(0,.56,0,.225,.33,.145,0,j);
    part(0,.97,.02,.115,.153,.113,0,skin);part(0,1.064,.005,.118,.074,.115,0,coif);
    const clapping=rand()<.22;
    for(const side of [-1,1]){part(side*.222,.58,.035,.073,.215,.078,side*(clapping?.43:.2),j);part(side*(clapping?.29:.25),clapping?.79:.36,.09,.067,.09,.065,0,skin);}
    part(0,.22,.05,.205,.15,.20,0,'#333d46');
  }
  crowd.receiveShadow=true;root.add(crowd);return {clock,energy,lowQuality(){crowd.count=Math.floor(count*.58)*8;}};
}

function flags(T,root,build,rand){
  const tex=paint(T,128,80,(c,w,h)=>{c.fillStyle='#1d609d';c.fillRect(0,0,w,h);c.fillStyle='#e5b73b';c.fillRect(w*.32,0,w*.12,h);c.fillRect(0,h*.4,w,h*.2);});
  const mat=new T.MeshStandardMaterial({map:tex,roughness:1,side:T.DoubleSide});
  const result=[];
  for(const x of [-24,-13,-3,8,19]){
    const z=-22;build.rod(x,0,z,x,6,z,.045,'#b6b9ae');
    const geo=new T.PlaneGeometry(1.8,1,10,3);geo.translate(.90,-.50,0);
    const mesh=new T.Mesh(geo,mat);mesh.position.set(x,5.95,z);root.add(mesh);result.push([mesh,rand()*TAU]);
  }
  return result;
}

function floodlight(T,root,build,x,z,h,angle=0,night=false){
  const col='#667580';build.rod(x,.1,z,x,h,z,.115,col);build.box(x,h,z,2.6,1.02,.25,col,angle);
  for(let i=0;i<6;i++){
    const dx=(i%3-1)*.78,dy=Math.floor(i/3)*.45-.22;
    build.box(x+dx*Math.cos(angle)+.17*Math.sin(angle),h+dy,z-dx*Math.sin(angle)+.17*Math.cos(angle),.65,.36,.12,night?'#fff9dd':'#e2e6da',angle);
  }
}
function rail(build,x0,x1,z,y){
  build.rod(x0,y+.78,z,x1,y+.78,z,.032,'#a5a9a3',false);
  for(let x=x0;x<=x1;x+=2)build.rod(x,y,z,x,y+.78,z,.026,'#92988f',false);
}
function fence(build){
  for(const x of [-32,32]){for(let z=0;z<=64;z+=4)build.rod(x,0,z,x,1.3,z,.038,'#717e73',false);for(const h of [.45,1.22])build.rod(x,h,0,x,h,64,.024,'#8a9283',false);}
  for(let x=-32;x<=32;x+=4)build.rod(x,0,64,x,1.32,64,.035,'#7c837a',false);
  build.rod(-32,1.22,64,32,1.22,64,.027,'#90998b',false);
}
function advertising(sign){
  const words=['FRITIDSPARKEN','DIN TUR ATT GLÄNSA','SPELA MED HJÄRTAT'];
  for(let i=-3;i<=3;i++)sign(words[(i+3)%3],i*8.7,.69,-16.3,8.65,1.18,0,i%2?'#192c46':'#dbb039',i%2?'#f7f6eb':'#142541');
  for(const side of [-1,1])for(let i=0;i<7;i++)sign(words[i%3],side*31.7,.60,i*9,8.8,1.05,-side*Math.PI*.5);
  for(let i=-3;i<=3;i++)sign(words[(i+3)%3],i*8.7,.60,63.6,8.65,1.05,Math.PI);
}
function school(T,root){
  const rand=seeded(1784),build=architecture(T,root),sign=signage(T,root),seats=[];
  treeline(T,root,rand);fence(build);advertising(sign);
  for(let row=0;row<6;row++){
    const y=.36+row*.46,z=-18-row*.89;
    build.box(-9,y*.5,z,30,y,.93,'#8d928e');build.box(-9,y+.05,z+.06,30,.12,.38,'#536474');
    for(let i=0;i<46;i++){const x=-23.5+i*.64;if(Math.abs(x-1.9)<.58||Math.abs(x+12)<.6||rand()<.06)continue;seats.push([x,y,z+.04,(rand()-.5)*.25]);}
    if(row===0||row===5)rail(build,-24,6,z+.42,y);
  }
  for(let r=0;r<4;r++){
    const x=33+r*.87,y=.32+r*.44;build.box(x,y*.5,23,.93,y,26,'#8a8f87');
    for(let i=0;i<39;i++)if(rand()>.17)seats.push([x,y,10.6+i*.65,-Math.PI/2]);
  }
  // Low clubhouse in warm timber with an overhanging roof, double doors and glazing.
  build.box(10.5,1.95,-19.4,8.5,3.9,4.5,'#945f40');build.box(10.5,3.98,-19.2,9.45,.34,5.3,'#454b4d');
  for(let x=6.5;x<14.7;x+=.34)build.box(x,1.75,-17.11,.026,3.4,.035,'#754a36',0,0,false);
  build.box(10.5,1.30,-17.05,2.3,2.6,.14,'#263e44');
  build.box(10.5,1.25,-16.95,.045,2.5,.05,'#aaa79b');sign('ENTRÉ',10.5,3.29,-17.03,3.5,.65,0,'#664c38','#ffe4a3');
  for(const x of [7.3,13.8])build.box(x,1.65,-17.04,1.15,1.1,.12,'#526a70');
  const waving=flags(T,root,build,rand);
  for(const [x,z] of [[-11,-25],[11,-25],[-24,51],[25,51]])floodlight(T,root,build,x,z,z<0?10.2:12.7,Math.atan2(-x,12-z));
  build.flush();return {crowd:crowd(T,root,seats,rand),waving};
}
function city(T,root){
  const rand=seeded(938),b=architecture(T,root),sign=signage(T,root),seats=[];
  advertising(sign);fence(b);
  // Brick apartments surround a compact covered grandstand.
  for(let i=0;i<19;i++){
    const x=(i%10-4.5)*9.8,z=i<10?-31:71,h=6+rand()*9;
    b.box(x,h/2,z,8.8,h,8,['#b1785d','#ad8b75','#b59480','#dcc4a9'][i%4]);
    b.box(x,h+.15,z,9.3,.32,8.3,'#5e5754');
    for(let row=0;row<Math.floor((h-1)/2);row++)for(let col=0;col<4;col++){
      const X=x-3+col*2,Z=z+(i<10?4.02:-4.02);
      b.box(X,1.5+row*2.05,Z,1.04,1.19,.08,rand()>.8?'#e9c586':'#63727a',0,0,false);
    }
  }
  for(let r=0;r<8;r++){
    const z=-17.7-r*.85,y=.45+r*.48;b.box(0,y*.5,z,39,y,.88,'#a09e96');
    for(let i=0;i<59;i++){const x=-18.8+i*.64;if((i+2)%17<2||rand()<.035)continue;seats.push([x,y,z,0]);}
  }
  b.box(0,4,-25.5,41,8,.4,'#925f47');sign('Stadsarenan',0,6.23,-25.23,11,1.4,0,'#86583e','#f5e0b5');
  b.box(0,8.35,-21.4,43,.32,11.5,'#5d6669');
  for(const x of [-20,-13,-6.5,0,6.5,13,20]){
    b.rod(x,0,-25.4,x,8.15,-25.4,.10,'#524e47');b.rod(x,6.2,-25.3,x,8.1,-16.2,.075,'#525752');
    b.rod(x,8.12,-25.3,x,8.12,-16.2,.07,'#747775');
  }
  const waving=flags(T,root,b,rand);
  floodlight(T,root,b,-27,-21,13,.3,true);floodlight(T,root,b,28,54,14,2.7,true);
  b.flush();return {crowd:crowd(T,root,seats,rand),waving};
}

function lampHalos(T,root,positions){
  const disc=paint(T,96,96,(ctx,w,h)=>{
    const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(255,251,226,1)');g.addColorStop(.11,'rgba(255,250,223,.87)');
    g.addColorStop(.24,'rgba(255,245,210,.27)');g.addColorStop(.68,'rgba(251,237,187,.055)');g.addColorStop(1,'rgba(250,236,180,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  });
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  const material=new T.PointsMaterial({map:disc,size:1.52,sizeAttenuation:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  root.add(new T.Points(geo,material));
}

function bowl(T,root,finale){
  const rand=seeded(finale?3221:5128),b=architecture(T,root),sign=signage(T,root),seats=[];
  const sections=36,radiusX=42,radiusZ=52,tierCount=finale?3:2,halos=[];
  const spot=(angle,d,y)=>[(radiusX+d)*Math.sin(angle),y,30+(radiusZ+d)*Math.cos(angle)];
  // Individual sloped banks line an elliptical bowl. Concourses separate each tier.
  function span(a,bp,r,color){b.rod(...a,...bp,r,color,false);}
  for(let k=0;k<sections;k++){
    const a=(k+.5)*TAU/sections,edgeA=k*TAU/sections,edgeB=(k+1)*TAU/sections;
    const p=spot(a,0,0),q=spot(edgeA,0,0),r=spot(edgeB,0,0);
    const yaw=Math.atan2(-(r[2]-q[2]),r[0]-q[0]),face=Math.atan2(-Math.sin(a),-Math.cos(a));
    for(let layer=0;layer<tierCount;layer++)for(let row=0;row<5;row++){
      const d=layer*5.5+row*.69,h=.6+layer*3.5+row*.43,pt=spot(a,d,h);
      const A=spot(edgeA,d,h),B=spot(edgeB,d,h),length=Math.hypot(B[0]-A[0],B[2]-A[2]);
      b.box(pt[0],h-.25,pt[2],length,.55,1.08,layer%2?'#59647c':'#354964',yaw,0,false);
      // Larger groups of lower-detail spectators fill the distant rings without per-seat draws.
      for(let i=0;i<9;i++){
        const t=(i+.53)/9;if(i===0&&k%3===1)continue;
        seats.push([A[0]+(B[0]-A[0])*t,h+.045,A[2]+(B[2]-A[2])*t,face]);
      }
      if(row===0&&layer>0)b.box(pt[0],h-.67,pt[2],length,.45,.56,finale?'#936939':'#a6afba',yaw,0,false);
    }
    const outer=tierCount*5.5+2,topY=tierCount*3.5+(finale?8:5);
    const A=spot(edgeA,outer,topY),B=spot(edgeB,outer,topY),M=spot(a,-3,topY-.85),P=spot(a,outer,topY);
    span(A,B,.18,'#c3c9cc');span(A,M,.14,'#b9c3ce');span(B,M,.14,'#c9cdd0');span(M,P,.095,'#a0aab7');
    span(spot(a,outer,.2),P,.15,'#747e8b');
    if(!finale){
      const panel=spot(a,outer*.48,topY+.12);
      b.box(panel[0],panel[1],panel[2],Math.hypot(B[0]-A[0],B[2]-A[2])*.98,.18,outer+3.2,'#8b96a6',yaw,0,false);
    }
    const lamp=spot(a,-3.1,topY-1.12);halos.push(...spot(a,-3.5,topY-1.18));b.box(lamp[0],lamp[1],lamp[2],3.5,.25,.38,'#fbf7dc',yaw,0,false);
    if(finale && k%3===0){const H=spot(edgeA,outer,topY+4.8);span(A,H,.22,'#6e7686');span(H,M,.08,'#c6c9d1');}
  }
  if(finale){
    // Paired gold box trusses spring from the stands and bridge both goal ends.
    for(const Z of [-22,70]){
      let prev;
      for(let j=0;j<=32;j++){
        const a=j*Math.PI/32,x=47*Math.cos(a),h=7+16*Math.sin(a);
        const A=[x,h,Z],B=[x,h+1.45,Z+.45];
        if(prev){span(prev[0],A,.19,'#c39646');span(prev[1],B,.20,'#d9ae6b');span(prev[j%2],j%2?A:B,.105,'#d0a35c');}
        prev=[A,B];
      }
    }
    for(const x of [-18,18]){
      b.box(x,8.5,-26.3,2.4,6.5,.15,'#b68a44');
      sign('★',x,8.8,-26.19,2.1,2.1,0,'#af8241','#f9dda4');
    }
    for(let k=0;k<sections;k++){
      const a=(k+.5)*TAU/sections,outer=tierCount*5.5+2;
      const A=spot(k*TAU/sections,outer,0),B=spot((k+1)*TAU/sections,outer,0);
      const P=spot(a,outer*.57,19.4), yaw=Math.atan2(-(B[2]-A[2]),B[0]-A[0]);
      b.box(P[0],P[1],P[2],Math.hypot(B[0]-A[0],B[2]-A[2])*.97,.35,outer*.88,'#393943',yaw,0,false);
    }
  }
  advertising(sign);
  sign(finale?'FINALARENAN':'NATIONALARENAN',0,finale?9:7.65,-29.4,17,1.15,0,'#1b2b43','#f4d58c');
  b.box(0,finale?12.25:10.4,-32.2,10.6,2.75,.36,'#242b39');
  sign(finale?'FINAL • FRITIDSPARKEN':'FRITIDSPARKEN',0,finale?12.25:10.4,-31.98,10.4,2.55,0,'#193957','#e3eaf1');
  lampHalos(T,root,halos);b.flush();return {crowd:crowd(T,root,seats,rand),waving:[]};
}

const weather=[
  {top:'#4d92cb',horizon:'#d8e2de',fog:'#c4d1c6',sun:'#ffda9b',sky:'#d9e7f2',ground:'#a6a386',direction:[-16,16,10],intensity:2.65,ambient:1.23,exposure:1.03,night:0},
  {top:'#797d9d',horizon:'#f4bc92',fog:'#dbc0aa',sun:'#ffcc94',sky:'#ead7d2',ground:'#ac9a84',direction:[-19,12,8],intensity:2.55,ambient:1.32,exposure:1.04,night:0},
  {top:'#273d66',horizon:'#9aaaca',fog:'#8f9fb4',sun:'#ffefdb',sky:'#e0eafa',ground:'#969a88',direction:[-17,22,12],intensity:2.9,ambient:1.48,exposure:1.05,night:.81},
  {top:'#101729',horizon:'#28364c',fog:'#4c5363',sun:'#fff3de',sky:'#cfdaeb',ground:'#92927d',direction:[-14,22,10],intensity:3.25,ambient:1.43,exposure:1.04,night:1}
];

function reflectionSky(T,opts){
  const width=96,height=48,data=new Float32Array(width*height*4);
  const top=new T.Color(opts.top),edge=new T.Color(opts.horizon),ground=new T.Color('#6c794c'),sun=new T.Color(opts.sun);
  const dir=new T.Vector3(...opts.direction).normalize(),v=new T.Vector3(),c=new T.Color();
  for(let y=0;y<height;y++){
    const lat=((y+.5)/height-.5)*Math.PI,sy=Math.sin(lat),rad=Math.cos(lat);
    for(let x=0;x<width;x++){
      const ang=((x+.5)/width-.5)*TAU;v.set(rad*Math.cos(ang),sy,rad*Math.sin(ang));
      c.copy(edge).lerp(sy<0?ground:top,Math.sqrt(Math.abs(sy)));
      const peak=Math.pow(Math.max(0,v.dot(dir)),140)*1.25;
      const i=(y*width+x)*4;data[i]=c.r*.48+sun.r*peak;data[i+1]=c.g*.48+sun.g*peak;data[i+2]=c.b*.48+sun.b*peak;data[i+3]=1;
    }
  }
  const texture=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);
  texture.mapping=T.EquirectangularReflectionMapping;texture.needsUpdate=true;return texture;
}

export function createStadium(T,scene,renderer){
  if(renderer.isSoftware){
    const setArena=index=>{
      const active=Math.max(0,Math.min(3,Number(index)||0));
      scene.userData.penaltyArena=active;
      scene.background=new T.Color(weather[active].horizon);
    };
    setArena(0);
    return {setArena,update(){},lowQuality(){}};
  }
  const root=new T.Group();root.name='Straffarenor';scene.add(root);
  const grass=pitch(T,root,renderer),sky=skyDome(T,root),arenas=[];
  const hemi=new T.HemisphereLight();root.add(hemi);
  const sun=new T.DirectionalLight();sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-15,right:15,top:18,bottom:-14,near:.1,far:64});
  sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.018;sun.shadow.bias=-.00025;
  sun.target.position.set(0,0,5);root.add(sun,sun.target);
  const fill=new T.DirectionalLight('#dce8ff',.28);fill.position.set(12,6,-9);root.add(fill);
  const farGoal=architecture(T,root);
  for(const x of [-3.66,3.66]){farGoal.rod(x,0,L,x,2.44,L,.055,'#ededdd');farGoal.rod(x,2.44,L,x,1.9,L+1.3,.035,'#e4e6d8');}
  farGoal.rod(-3.66,2.44,L,3.66,2.44,L,.055,'#ededdd');farGoal.flush();
  let active=-1,low=false,lastFlags=-1;
  function setArena(index){
    index=Math.max(0,Math.min(3,Number(index)||0));if(index===active)return;
    if(active>=0)arenas[active].group.visible=false;
    if(!arenas[index]){
      const group=new T.Group();group.name=['Skolplanen','Stadsarenan','Nationalarenan','Finalarenan'][index];root.add(group);
      const content=index===0?school(T,group):index===1?city(T,group):bowl(T,group,index===3);
      arenas[index]={group,...content};if(low)content.crowd.lowQuality();
    }
    active=index;scene.userData.penaltyArena=index;arenas[index].group.visible=true;const opts=weather[index];
    if(renderer.isWebGLRenderer && renderer.capabilities?.isWebGL2){arenas[index].env ||= reflectionSky(T,opts);scene.environment=arenas[index].env;}
    sky.zenith.value.set(opts.top);sky.horizon.value.set(opts.horizon);sky.sunCol.value.set(opts.sun);
    sky.sunDir.value.set(...opts.direction).normalize();sky.night.value=opts.night;
    scene.background=new T.Color(opts.horizon);scene.fog=new T.Fog(opts.fog,50,index<2?148:136);
    hemi.color.set(opts.sky);hemi.groundColor.set(opts.ground);hemi.intensity=opts.ambient;
    sun.color.set(opts.sun);sun.position.set(...opts.direction).add(sun.target.position);sun.intensity=opts.intensity;
    fill.intensity=index>1?.65:.28;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=opts.exposure;
  }
  function update(t,state){
    const current=arenas[active];if(!current)return;
    const crowd=current.crowd;crowd.clock.value=t;
    const reaction=state.phase==='result'?(state.ball?.goal?1:state.ball?.saved ? .69 : .24):0;
    crowd.energy.value+=(reaction-crowd.energy.value)*.085;
    if(t-lastFlags>(low?.14:.06)||t<lastFlags){
      lastFlags=t;
      for(const [mesh,seed] of current.waving){
        const p=mesh.geometry.attributes.position;
        for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,x*(.10*Math.sin(t*2.4+x*3+seed)+.04*Math.sin(t*4.7+x*6+seed)));}
        p.needsUpdate=true;
      }
    }
  }
  function lowQuality(){low=true;grass.visible=false;for(const arena of arenas)arena?.crowd.lowQuality();}
  setArena(0);return {setArena,update,lowQuality};
}
