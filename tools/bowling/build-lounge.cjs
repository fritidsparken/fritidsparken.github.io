/* Original, offline-authored Crazy Bowling assets. Run with Node; no runtime modelling. */
const fs=require('fs'),path=require('path'),T=require('../../js/vendor/three.min.js');
const out=path.resolve(__dirname,'../../games/crazy-bowling/assets');fs.mkdirSync(out,{recursive:true});
const parts=[];let current;
function model(name){current={name,parts:[]};parts.push(current);}
function add(geo,material,pos=[0,0,0],rot=[0,0,0]){const m=new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(1,1,1));geo.applyMatrix4(m);current.parts.push({geo,material});}
function lathe(points,n=64){const curve=new T.CatmullRomCurve3(points.map(([r,y])=>new T.Vector3(r,y,0)));return new T.LatheGeometry(curve.getPoints(64).map(p=>new T.Vector2(Math.max(.0001,p.x),p.y)),n);}
function rounded(w,h,d,r=.1){r=Math.min(r,w*.49,h*.49,d*.49);const s=new T.Shape(),x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r;s.moveTo(x,y);s.lineTo(x+W,y);s.lineTo(x+W,y+H);s.lineTo(x,y+H);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:4,steps:1,curveSegments:12});g.translate(0,0,-d/2+r);return g;}
function tube(points,r,mat){add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false),mat);}
// Purpose-authored lounge kit, exported once; no runtime furniture modelling.
model('sofa');
add(rounded(5.2,.48,1.9,.18),'leather',[0,.46,0]);
for(const x of [-2.52,2.52]){add(rounded(.52,1.2,2.0,.23),'leather',[x,.94,0]);for(const z of [-.68,.68])add(rounded(.12,.4,.12,.03),'metal',[x,.2,z]);}
for(const x of [-1.65,0,1.65]){
 add(rounded(1.6,.38,1.52,.17),'leather',[x,.88,.15]);
 add(rounded(1.6,1.13,.43,.18),'leather',[x,1.39,-.71],[-.11,0,0]);
 // Upholstery piping and tufts give the asset a sewn silhouette.
 tube([[x-.72,1.02,.82],[x+.72,1.02,.82],[x+.74,1.02,-.38]],.012,'stitch');
 for(const dx of [-.34,.34])add(new T.SphereGeometry(.035,8,6),'stitch',[x+dx,1.42,-.47]);
}
model('planter');add(lathe([[.001,0],[.47,0],[.52,.1],[.68,1.25],[.68,1.33],[.6,1.33],[.57,1.2],[.001,1.2]],48),'bronze');
add(new T.CircleGeometry(.57,32),'soil',[0,1.21,0],[-Math.PI/2,0,0]);
for(let n=0;n<18;n++){
 const a=n*2.399,r=.7+(n%4)*.18,h=2+(n%5)*.24;
 tube([[0,1.1,0],[Math.cos(a)*.18,2,Math.sin(a)*.18],[Math.cos(a)*r,h,Math.sin(a)*r]],.016,'leaf');
 const pos=[],uv=[],idx=[];for(let j=0;j<=14;j++){const t=j/14,w=Math.sin(Math.PI*t)*.16,rr=r*t,y=1.75+Math.sin(t*Math.PI*.7)*(h-.7)-t*.6;
 for(const side of [-1,1]){pos.push(Math.cos(a)*rr-Math.sin(a)*w*side,y+Math.sin(Math.PI*t)*.08,Math.sin(a)*rr+Math.cos(a)*w*side);uv.push((side+1)/2,t);}}
 for(let j=0;j<14;j++){const i=j*2;idx.push(i,i+1,i+2,i+1,i+3,i+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();add(g,'leaf');
}
model('rack');for(const x of [-2.65,2.65])add(rounded(.13,3.6,.8,.05),'metal',[x,1.8,0]);for(const y of [.35,1.5,2.65]){add(rounded(5.4,.16,1.2,.06),'walnut',[0,y,0]);tube([[-2.6,y+.15,.55],[0,y+.15,.55],[2.6,y+.15,.55]],.045,'bronze');}
model('truss');for(const y of [-.22,.22])for(const z of [-.22,.22])tube([[-5,y,z],[5,y,z]],.045,'metal');for(let i=-5;i<5;i++)for(const z of [-.22,.22])tube([[i,-.22,z],[i+.5,.22,z],[i+1,-.22,z]],.028,'metal');
model('spot');add(lathe([[.25,-.42],[.3,-.42],[.32,-.25],[.3,.25],[.22,.3],[.22,.45],[.13,.45]],32),'shell');add(lathe([[.001,-.425],[.25,-.425],[.25,-.41],[.001,-.41]],32),'warmLight');tube([[-.35,-.1,0],[-.42,.4,0],[0,.65,0],[.42,.4,0],[.35,-.1,0]],.045,'metal');
model('sign');
const font=JSON.parse(fs.readFileSync(path.join(__dirname,'fonts/helvetiker_bold.typeface.json')));
function textGeo(text,size){let x=0,shapes=[];const scale=size/font.resolution;for(const ch of text){const glyph=font.glyphs[ch],p=new T.ShapePath(),tokens=glyph.o?.split(' ')||[];let i=0;while(i<tokens.length){const op=tokens[i++];const pt=()=>[Number(tokens[i++])*scale+x,Number(tokens[i++])*scale];if(op==='m')p.moveTo(...pt());if(op==='l')p.lineTo(...pt());if(op==='q'){const end=pt(),control=pt();p.quadraticCurveTo(...control,...end);}if(op==='b'){const end=pt(),c1=pt(),c2=pt();p.bezierCurveTo(...c1,...c2,...end);}}shapes.push(...p.toShapes());x+=glyph.ha*scale;}const g=new T.ExtrudeGeometry(shapes,{depth:.16,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3,curveSegments:8});g.computeBoundingBox();g.translate(-(g.boundingBox.max.x+g.boundingBox.min.x)/2,0,0);return g;}
add(textGeo('CRAZY BOWLING',1.8),'gold');
tube([[-10,-.22,0],[-6,-.48,.06],[0,-.48,.1],[7,-.24,.06],[10,.15,0]],.055,'blueNeon');
tube([[-10,-.4,-.02],[-7,-.75,.02],[0,-.7,.05],[6,-.46,.02],[10,-.3,0]],.045,'pinkNeon');
tube([[-10,1.7,-.1],[-5,2.6,-.1],[2,2.7,-.1],[10,1.8,-.1]],.035,'blueNeon');
// Merge each model by material to keep the hall draw-call budget small.
for(const item of parts){const groups=new Map();for(const part of item.parts){if(!groups.has(part.material))groups.set(part.material,[]);groups.get(part.material).push(part.geo);}item.parts=[];for(const [material,geos]of groups){const g=new T.BufferGeometry(),indices=[];let offset=0;for(const geo of geos){const n=geo.attributes.position.count;for(let i=0;i<(geo.index?.count||n);i++)indices.push(offset+(geo.index?geo.index.getX(i):i));offset+=n;}for(const attr of ['position','normal','uv']){const size=geos[0].attributes[attr].itemSize;const a=new Float32Array(offset*size);let cursor=0;for(const geo of geos){a.set(geo.attributes[attr].array,cursor);cursor+=geo.attributes[attr].array.length;}g.setAttribute(attr,new T.BufferAttribute(a,size));}g.setIndex(indices);item.parts.push({geo:g,material});}}
// Minimal standards-compliant glTF 2.0 exporter; all scene transforms baked offline.
const gltf={asset:{version:'2.0',generator:'Fritidsparken original surface asset pipeline'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[]};let chunks=[],offset=0;const mats={};
const colors={pin:[.95,.94,.88,1],resin:[1,1,1,1],shell:[.07,.12,.16,1],rubber:[.016,.02,.023,1],metal:[.35,.4,.43,1],led:[.14,.9,.75,1],fabric:[.05,.3,.32,1],walnut:[.4,.2,.09,1],screen:[.01,.02,.025,1],warmLight:[1,.83,.58,1],leather:[.35,.12,.04,1],stitch:[.12,.035,.012,1],bronze:[.55,.3,.12,1],soil:[.025,.02,.012,1],leaf:[.08,.25,.025,1],gold:[1,.62,.15,1],blueNeon:[.02,.3,1,1],pinkNeon:[1,.03,.6,1]};
for(const [name,baseColorFactor] of Object.entries(colors)){mats[name]=gltf.materials.length;gltf.materials.push({name,doubleSided:name==='shell'||name==='metal',pbrMetallicRoughness:{baseColorFactor,metallicFactor:name==='metal'?.8:0,roughnessFactor:name==='fabric'?.86:name==='resin'?.16:.3},...(name==='led'||name==='warmLight'?{emissiveFactor:baseColorFactor.slice(0,3)}:{})});}
function acc(arr,size,type){const a=type===5123?new Uint16Array(arr):type===5125?new Uint32Array(arr):new Float32Array(arr),buf=Buffer.from(a.buffer);const id=gltf.accessors.length,view=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buf.length});const entry={bufferView:view,componentType:type,count:arr.length/size,type:['','SCALAR','VEC2','VEC3','VEC4'][size]};if(size===3){entry.min=Array(3).fill(Infinity);entry.max=Array(3).fill(-Infinity);for(let i=0;i<arr.length;i++){entry.min[i%3]=Math.min(entry.min[i%3],arr[i]);entry.max[i%3]=Math.max(entry.max[i%3],arr[i]);}}gltf.accessors.push(entry);const pad=Buffer.alloc((4-buf.length%4)%4);chunks.push(buf,pad);offset+=buf.length+pad.length;return id;}
for(const item of parts){const primitives=[];for(const {geo,material}of item.parts){const attrs={};for(const [key,label] of [['position','POSITION'],['normal','NORMAL'],['uv','TEXCOORD_0'],['color','COLOR_0']])if(geo.attributes[key])attrs[label]=acc(geo.attributes[key].array,geo.attributes[key].itemSize,5126);const p={attributes:attrs,material:mats[material]};if(geo.index)p.indices=acc(geo.index.array,1,geo.index.array instanceof Uint32Array?5125:5123);primitives.push(p);}const n=gltf.nodes.length;gltf.scenes[0].nodes.push(n);gltf.nodes.push({name:item.name,mesh:gltf.meshes.length});gltf.meshes.push({name:item.name,primitives});}
gltf.buffers.push({byteLength:offset});let json=Buffer.from(JSON.stringify(gltf));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path.join(out,'lounge-kit.glb'),Buffer.concat([header,jh,json,bh,bin]));console.log('Exported',parts.map(p=>p.name).join(', '),bin.length,'bytes');
