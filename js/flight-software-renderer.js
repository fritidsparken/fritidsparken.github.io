/* Small CPU triangle renderer for browsers without WebGL. Uses the same original 3D scene. */
(() => {
  function create(T) {
    const domElement=document.createElement('canvas'),ctx=domElement.getContext('2d');let width=1000,height=600,ratio=1;
    const vp=new T.Matrix4(),matrix=new T.Matrix4(),instance=new T.Matrix4(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),pa=new T.Vector3(),pb=new T.Vector3(),pc=new T.Vector3(),edge=new T.Vector3(),normal=new T.Vector3(),light=new T.Vector3(-.4,.85,.3).normalize();
    const colorCache=new Map();
    function color(material,shade,fog){const hex=material.color?.getHexString()||'eeeeee',key=hex+':'+Math.round(shade*20)+':'+Math.round(fog*30);if(colorCache.has(key))return colorCache.get(key);const v=parseInt(hex,16),sky=[190,221,212],rgb=[v>>16,(v>>8)&255,v&255].map((x,i)=>Math.round(Math.min(255,x*shade)*(1-fog)+sky[i]*fog));const value=`rgb(${rgb.join(',')})`;colorCache.set(key,value);return value;}
    function project(v){return v.applyMatrix4(vp);}
    function render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.globalAlpha=1;ctx.fillStyle='#a8dceb';ctx.fillRect(0,0,width,height);
      // Ground extends beyond the near clipping plane, so draw it as a clipped quad.
      const ground=[new T.Vector3(-500,0,-250),new T.Vector3(500,0,-250),new T.Vector3(500,0,10),new T.Vector3(-500,0,10)].map(project);ctx.fillStyle='#8bb565';ctx.beginPath();ground.forEach((v,i)=>i?ctx.lineTo((v.x+1)*width/2,(1-v.y)*height/2):ctx.moveTo((v.x+1)*width/2,(1-v.y)*height/2));ctx.closePath();ctx.fill();
      const faces=[];
      function object(mesh,world){const geom=mesh.geometry,pos=geom?.attributes?.position,index=geom?.index;if(!pos)return;const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;if(!material||material.visible===false)return;const count=index?index.count:pos.count;
        for(let i=0;i<count;i+=3){const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;a.fromBufferAttribute(pos,ia).applyMatrix4(world);b.fromBufferAttribute(pos,ib).applyMatrix4(world);c.fromBufferAttribute(pos,ic).applyMatrix4(world);pa.copy(a);pb.copy(b);pc.copy(c);project(pa);project(pb);project(pc);
          if(pa.z< -1||pb.z< -1||pc.z< -1||pa.z>1||pb.z>1||pc.z>1)continue;if((pa.x< -1&&pb.x< -1&&pc.x< -1)||(pa.x>1&&pb.x>1&&pc.x>1)||(pa.y< -1&&pb.y< -1&&pc.y< -1)||(pa.y>1&&pb.y>1&&pc.y>1))continue;
          const cross=(pb.x-pa.x)*(pc.y-pa.y)-(pb.y-pa.y)*(pc.x-pa.x);if(material.side!==T.DoubleSide&&cross<0)continue;
          normal.subVectors(b,a);edge.subVectors(c,a);normal.cross(edge).normalize();const shade=material.isMeshBasicMaterial?1:material.userData.cloud?.9+Math.max(0,normal.dot(light))*.1:.62+Math.max(0,normal.dot(light))*.46;const depth=(camera.position.z-(a.z+b.z+c.z)/3),fog=Math.min(.94,Math.max(0,(depth-60)/190));faces.push({z:(pa.z+pb.z+pc.z)/3,p:[(pa.x+1)*width/2,(1-pa.y)*height/2,(pb.x+1)*width/2,(1-pb.y)*height/2,(pc.x+1)*width/2,(1-pc.y)*height/2],fill:color(material,shade,fog),alpha:material.opacity});
        }
      }
      scene.traverse(o=>{if(!o.isMesh||o.userData.softwareSkip)return;for(let p=o;p;p=p.parent)if(!p.visible)return;if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);object(o,matrix);}}else object(o,o.matrixWorld);});faces.sort((a,b)=>b.z-a.z);
      for(const f of faces){ctx.globalAlpha=f.alpha;ctx.fillStyle=f.fill;ctx.beginPath();ctx.moveTo(f.p[0],f.p[1]);ctx.lineTo(f.p[2],f.p[3]);ctx.lineTo(f.p[4],f.p[5]);ctx.closePath();ctx.fill();if(f.alpha===1){ctx.strokeStyle=f.fill;ctx.lineWidth=.45;ctx.stroke();}}ctx.globalAlpha=1;
    }
    return{domElement,shadowMap:{},isSoftware:true,setPixelRatio(v){ratio=Math.min(v,1.25);},setSize(w,h){width=w;height=h;domElement.width=Math.round(w*ratio);domElement.height=Math.round(h*ratio);},render,dispose(){colorCache.clear();}};
  }
  window.FPSoftware3D={create};
})();
