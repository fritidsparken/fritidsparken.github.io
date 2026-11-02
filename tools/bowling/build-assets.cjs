/* Original, offline-authored Crazy Bowling assets. Run with Node; no runtime modelling. */
const fs=require('fs'),path=require('path'),T=require('../../js/vendor/three.min.js');
const out=path.resolve(__dirname,'../../games/crazy-bowling/assets');fs.mkdirSync(out,{recursive:true});
const parts=[];let current;
function model(name){current={name,parts:[]};parts.push(current);}
function add(geo,material,pos=[0,0,0],rot=[0,0,0]){const m=new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(1,1,1));geo.applyMatrix4(m);current.parts.push({geo,material});}
function lathe(points,n=64){const curve=new T.CatmullRomCurve3(points.map(([r,y])=>new T.Vector3(r,y,0)));return new T.LatheGeometry(curve.getPoints(64).map(p=>new T.Vector2(Math.max(.0001,p.x),p.y)),n);}
function rounded(w,h,d,r=.1){r=Math.min(r,w*.49,h*.49,d*.49);const s=new T.Shape(),x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r;s.moveTo(x,y);s.lineTo(x+W,y);s.lineTo(x+W,y+H);s.lineTo(x,y+H);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:4,steps:1,curveSegments:12});g.translate(0,0,-d/2+r);return g;}
function tube(points,r,mat){add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false),mat);}
model('pin');const pinGeometry=lathe([[.001,-.54],[.16,-.54],[.22,-.49],[.274,-.32],[.282,-.17],[.25,.01],[.18,.19],[.11,.34],[.103,.44],[.125,.52],[.16,.60],[.157,.68],[.11,.76],[.001,.8]]);for(let i=0;i<pinGeometry.attributes.uv.count;i++)pinGeometry.attributes.uv.setY(i,(pinGeometry.attributes.position.getY(i)+.54)/1.34);add(pinGeometry,'pin');
model('ball');{
const g=new T.SphereGeometry(.43,128,96),p=g.attributes.position,c=[];
const holes=[new T.Vector3(-.10,.29,.30).normalize(),new T.Vector3(.10,.29,.30).normalize(),new T.Vector3(0,.12,.41).normalize()];
for(let i=0;i<p.count;i++){let v=new T.Vector3().fromBufferAttribute(p,i).normalize(),a=Math.min(...holes.map(h=>Math.acos(T.MathUtils.clamp(v.dot(h),-1,1)))),d=a<.145?Math.min(1,(.145-a)/.022):0;v.multiplyScalar(.43-.135*d);p.setXYZ(i,v.x,v.y,v.z);let shade=1-.94*d;c.push(shade,shade,shade);}
g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();for(let i=0;i<p.count;i++){const n=new T.Vector3().fromBufferAttribute(g.attributes.normal,i);if(n.lengthSq()<.01){n.fromBufferAttribute(p,i).normalize();g.attributes.normal.setXYZ(i,n.x,n.y,n.z);}}add(g,'resin');}
model('return');{
// A continuous arched moulded shell, with an open front mouth, not a box casing.
const vs=[],uv=[],ix=[],N=32,M=24;
for(let z=0;z<=M;z++)for(let a=0;a<=N;a++){const t=z/M,u=a/N*Math.PI,w=.72*(.92+.08*Math.sin(t*Math.PI)),height=.7+.45*Math.sin(t*Math.PI*.7);vs.push(Math.cos(u)*w,.42+Math.sin(u)*height,-1.35+t*2.7);uv.push(a/N,t);}
for(let z=0;z<M;z++)for(let a=0;a<N;a++){let i=z*(N+1)+a;ix.push(i,i+1,i+N+1,i+1,i+N+2,i+N+1);}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();add(g,'shell');
add(rounded(1.25,.25,2.7,.12),'rubber',[0,.3,0]);
for(const x of [-.52,.52])tube([[x,.48,.8],[x,.53,1.5],[x,.58,2.7],[x,.4,3.0]],.065,'metal');
add(rounded(1.22,.18,.2,.06),'metal',[0,.4,2.8]);
add(rounded(.65,.16,.035,.016),'led',[0,1.02,1.37]);
for(const x of [-.55,.55])add(rounded(.08,.04,1.5,.018),'led',[x,.6,-.3]);
}
model('chair');{
// Swept continuous ergonomic seat/back profile, softly rounded upholstery.
const s=new T.Shape();s.moveTo(-.7,.15);s.bezierCurveTo(-.74,.85,-.72,1.55,-.52,1.65);s.bezierCurveTo(-.32,1.67,-.35,1.25,-.31,.92);s.bezierCurveTo(-.27,.62,.12,.60,.65,.63);s.bezierCurveTo(.91,.62,.91,.30,.62,.28);s.bezierCurveTo(.1,.24,-.25,.16,-.7,.15);const g=new T.ExtrudeGeometry(s,{depth:1.4,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:4,curveSegments:24});g.rotateY(Math.PI/2);g.translate(-.7,.52,0);add(g,'fabric');
for(const x of [-.55,.55])tube([[x,.1,-.5],[x,.65,-.35],[x,.65,.4],[x,.1,.65]],.045,'metal');
}
model('table');add(lathe([[.001,.05],[.6,.05],[.64,.10],[.55,.16],[.15,.2],[.07,.3],[.07,1.25],[.16,1.3]]),'metal');add(lathe([[.001,1.28],[.78,1.28],[.85,1.33],[.85,1.41],[.78,1.46],[.001,1.46]]),'walnut');
model('monitor');add(rounded(3,1.8,.22,.09),'shell');add(rounded(2.78,1.57,.035,.018),'screen',[0,0,.13]);add(rounded(.055,.028,.02,.01),'led',[1.2,-.83,.13]);add(rounded(.18,2,.18,.05),'metal',[0,1.65,-.03]);
model('lamp');add(lathe([[.52,0],[.55,.04],[.51,.09],[.36,.28],[.17,.39],[.09,.42],[.09,.5]]),'metal');add(lathe([[.001,.015],[.48,.015],[.48,.04],[.001,.04]]),'warmLight');add(rounded(.025,1.6,.025,.01),'metal',[0,1.25,0]);
model('gutter');{
const v=[],u=[],ix=[];for(let z=0;z<2;z++)for(let i=0;i<=24;i++){const t=i/24*Math.PI;v.push(Math.cos(t)*.28,-Math.sin(t)*.24,z-.5);u.push(i/24,z);}for(let i=0;i<24;i++)ix.push(i,i+25,i+1,i+1,i+25,i+26);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();add(g,'metal');}
model('sweep');add(rounded(7.4,.28,.16,.07),'shell');add(rounded(7.2,.045,.02,.01),'led',[0,0,.09]);for(const x of [-3.5,3.5])add(rounded(.09,1.6,.09,.04),'metal',[x,.8,0]);
// Minimal standards-compliant glTF 2.0 exporter; all scene transforms baked offline.
const gltf={asset:{version:'2.0',generator:'Fritidsparken original surface asset pipeline'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[]};let chunks=[],offset=0;const mats={};
const colors={pin:[.95,.94,.88,1],resin:[1,1,1,1],shell:[.07,.12,.16,1],rubber:[.016,.02,.023,1],metal:[.35,.4,.43,1],led:[.14,.9,.75,1],fabric:[.05,.3,.32,1],walnut:[.4,.2,.09,1],screen:[.01,.02,.025,1],warmLight:[1,.83,.58,1]};
for(const [name,baseColorFactor] of Object.entries(colors)){mats[name]=gltf.materials.length;gltf.materials.push({name,doubleSided:name==='shell'||name==='metal',pbrMetallicRoughness:{baseColorFactor,metallicFactor:name==='metal'?.8:0,roughnessFactor:name==='fabric'?.86:name==='resin'?.16:.3},...(name==='led'||name==='warmLight'?{emissiveFactor:baseColorFactor.slice(0,3)}:{})});}
function acc(arr,size,type){const a=type===5123?new Uint16Array(arr):new Float32Array(arr),buf=Buffer.from(a.buffer);const id=gltf.accessors.length,view=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buf.length});const entry={bufferView:view,componentType:type,count:arr.length/size,type:['','SCALAR','VEC2','VEC3','VEC4'][size]};if(size===3){entry.min=Array(3).fill(Infinity);entry.max=Array(3).fill(-Infinity);for(let i=0;i<arr.length;i++){entry.min[i%3]=Math.min(entry.min[i%3],arr[i]);entry.max[i%3]=Math.max(entry.max[i%3],arr[i]);}}gltf.accessors.push(entry);const pad=Buffer.alloc((4-buf.length%4)%4);chunks.push(buf,pad);offset+=buf.length+pad.length;return id;}
for(const item of parts){const primitives=[];for(const {geo,material}of item.parts){const attrs={};for(const [key,label] of [['position','POSITION'],['normal','NORMAL'],['uv','TEXCOORD_0'],['color','COLOR_0']])if(geo.attributes[key])attrs[label]=acc(geo.attributes[key].array,geo.attributes[key].itemSize,5126);const p={attributes:attrs,material:mats[material]};if(geo.index)p.indices=acc(geo.index.array,1,5123);primitives.push(p);}const n=gltf.nodes.length;gltf.scenes[0].nodes.push(n);gltf.nodes.push({name:item.name,mesh:gltf.meshes.length});gltf.meshes.push({name:item.name,primitives});}
gltf.buffers.push({byteLength:offset});let json=Buffer.from(JSON.stringify(gltf));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path.join(out,'bowling-kit.glb'),Buffer.concat([header,jh,json,bh,bin]));console.log('Exported',parts.map(p=>p.name).join(', '),bin.length,'bytes');
