/** Canvas renderer for devices where WebGL is unavailable. Uses the same scene,
 * camera, geometry and gameplay; no second physics implementation. */
export function createSoftwareRenderer(T){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)throw new Error('Canvas 2D unavailable');
 let width=800,height=600,ratio=1;const vp=new T.Matrix4(),matrix=new T.Matrix4();const p=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();const sun=new T.Vector3(-.4,.8,.3).normalize();
 const api={domElement:canvas,isSoftware:true,shadowMap:{enabled:false},setPixelRatio(r){ratio=Math.min(r,1.25);api.setSize(width,height);},setSize(w,h){width=w;height=h;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+'px';canvas.style.height=h+'px';},render(scene,camera){
 scene.updateMatrixWorld();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);ctx.setTransform(ratio,0,0,ratio,0,0);const sky=scene.background?.isColor?'#'+scene.background.getHexString():'#a6dbe4';ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);const faces=[];
 scene.traverseVisible(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;const g=o.geometry,pos=g.attributes.position,index=g.index;let material=Array.isArray(o.material)?o.material[0]:o.material;if(!material||material.visible===false)return;
 const base=material.color?.clone()||new T.Color(o.name.includes('lava')?'#ed783a':'#48b9bf');if(material.map?.image?.getContext){const pixel=material.map.image.getContext('2d').getImageData(0,0,1,1).data;base.setRGB(pixel[0]/255,pixel[1]/255,pixel[2]/255,T.SRGBColorSpace);}matrix.multiplyMatrices(vp,o.matrixWorld);const count=index?index.count:pos.count;
 for(let i=0;i<count;i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),coords=[];let clipped=false;
 for(const id of ids){p.fromBufferAttribute(pos,id).applyMatrix4(matrix);if(p.z< -1||p.z>1||!Number.isFinite(p.x)){clipped=true;break;}coords.push([(p.x*.5+.5)*width,(-p.y*.5+.5)*height,p.z]);}if(clipped)continue;
 if(coords.every(v=>v[0]<0)||coords.every(v=>v[0]>width)||coords.every(v=>v[1]<0)||coords.every(v=>v[1]>height))continue;
 const area=(coords[1][0]-coords[0][0])*(coords[2][1]-coords[0][1])-(coords[1][1]-coords[0][1])*(coords[2][0]-coords[0][0]);if(material.side!==T.DoubleSide&&area>0)continue;if(Math.abs(area)<.2)continue;
 a.fromBufferAttribute(pos,ids[0]).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(pos,ids[1]).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(pos,ids[2]).applyMatrix4(o.matrixWorld);normal.crossVectors(b.sub(a),c.sub(a)).normalize();const light=.62+.38*Math.max(0,normal.dot(sun));const color=base.clone().multiplyScalar(light);faces.push({coords,z:(coords[0][2]+coords[1][2]+coords[2][2])/3,color:'#'+color.getHexString(),opacity:material.opacity??1});
 }
 });faces.sort((a,b)=>b.z-a.z);for(const f of faces){ctx.globalAlpha=f.opacity;ctx.fillStyle=f.color;ctx.beginPath();f.coords.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
 // ArrowHelper's shaft is a Line, drawn separately for clear aiming.
 scene.traverseVisible(o=>{if(!o.isLine||!o.geometry?.attributes.position)return;const pos=o.geometry.attributes.position;matrix.multiplyMatrices(vp,o.matrixWorld);ctx.beginPath();let started=false;for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(matrix);if(p.z< -1||p.z>1){started=false;continue;}const x=(p.x*.5+.5)*width,y=(-p.y*.5+.5)*height;if(started)ctx.lineTo(x,y);else ctx.moveTo(x,y);started=true;}ctx.strokeStyle='#ffecae';ctx.lineWidth=3;ctx.stroke();});
 },dispose(){canvas.remove();}};return api;
}
export function createRenderer(T){
 const canvas=document.createElement('canvas');let context=null;
 try{context=canvas.getContext('webgl2',{antialias:true})||canvas.getContext('webgl',{antialias:true});if(context)return new T.WebGLRenderer({canvas,context,antialias:true});}catch(error){console.warn('WebGL unavailable; using Canvas renderer',error);}
 return createSoftwareRenderer(T);
}
