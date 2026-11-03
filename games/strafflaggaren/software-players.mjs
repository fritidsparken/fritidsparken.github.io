// CPU rasterization for the two animated rigs when the browser disables WebGL.
// Screen-sized actor cutouts share their bind poses, material colours and UVs
// with the WebGL scene. Limiting each cutout bounds cost in portrait view.
export function createSoftwareActors(T){
  const canvas=document.createElement('canvas'),out=canvas.getContext('2d');
  const caches=new WeakMap(),textures=new WeakMap(),sceneActors=new WeakMap();
  const pv=new T.Matrix4(),center=new T.Vector3(),sun=new T.Vector3();
  let depth;
  function texture(map){
    if(!map)return null;
    if(textures.has(map))return textures.get(map);
    const img=map.image;let data=img.data;
    if(!data&&img.getContext)data=img.getContext('2d').getImageData(0,0,img.width,img.height).data;
    const tex=data?{w:img.width,h:img.height,data,flip:map.flipY}:null;
    textures.set(map,tex);return tex;
  }
  function meshCache(mesh){
    if(caches.has(mesh))return caches.get(mesh);
    const g=mesh.geometry,idx=g.userData.softwareIndices||g.index?.array;
    if(!idx)return null;
    const indices=[...new Set(idx)],remap=new Map(indices.map((v,i)=>[v,i]));
    const c={vertices:indices,tri:Uint16Array.from(idx,v=>remap.get(v)),coords:new Float64Array(indices.length*6),
      pos:g.attributes.position.array,nor:g.attributes.normal.array,uv:g.attributes.uv?.array,
      joints:g.attributes.skinIndex?.array,weights:g.attributes.skinWeight?.array,
      tex:texture(mesh.material.map),palette:new Uint8Array(256*3),hex:-1};
    caches.set(mesh,c);return c;
  }
  function actorMeshes(scene){
    if(!sceneActors.has(scene)){
      const groups=[];
      scene.traverse(root=>{
        if(!root.userData.footballActor)return;
        const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
        groups.push({root,meshes});
      });
      sceneActors.set(scene,groups);
    }
    return sceneActors.get(scene);
  }
  function project(mesh,c,bounds){
    const {vertices,coords,pos,nor,uv,joints,weights}=c,world=mesh.matrixWorld.elements,vp=pv.elements;
    const bones=mesh.skeleton?.boneMatrices;
    for(let i=0;i<vertices.length;i++){
      const id=vertices[i],j=3*id,si=4*id,k=6*i;
      const x=pos[j],y=pos[j+1],z=pos[j+2],a=nor[j],b=nor[j+1],d=nor[j+2];
      let X=0,Y=0,Z=0,A=0,B=0,D=0;
      const count=bones&&weights[si+1]>0?2:1;
      for(let n=0;n<count;n++){
        const m=bones||world,o=bones?joints[si+n]*16:0,w=bones?weights[si+n]:1;
        X+=(m[o]*x+m[o+4]*y+m[o+8]*z+m[o+12])*w;
        Y+=(m[o+1]*x+m[o+5]*y+m[o+9]*z+m[o+13])*w;
        Z+=(m[o+2]*x+m[o+6]*y+m[o+10]*z+m[o+14])*w;
        A+=(m[o]*a+m[o+4]*b+m[o+8]*d)*w;
        B+=(m[o+1]*a+m[o+5]*b+m[o+9]*d)*w;
        D+=(m[o+2]*a+m[o+6]*b+m[o+10]*d)*w;
      }
      const perspective=vp[3]*X+vp[7]*Y+vp[11]*Z+vp[15];
      const sx=(1+(vp[0]*X+vp[4]*Y+vp[8]*Z+vp[12])/perspective)*bounds.w/2;
      const sy=(1-(vp[1]*X+vp[5]*Y+vp[9]*Z+vp[13])/perspective)*bounds.h/2;
      coords[k]=sx;coords[k+1]=sy;coords[k+2]=perspective;
      coords[k+3]=Math.max(0,Math.min(255,128+75*(A*sun.x+B*sun.y+D*sun.z)+18*B));
      coords[k+4]=uv?.[2*id]||0;coords[k+5]=uv?.[2*id+1]||0;
      bounds.left=Math.min(bounds.left,sx);bounds.right=Math.max(bounds.right,sx);
      bounds.top=Math.min(bounds.top,sy);bounds.bottom=Math.max(bounds.bottom,sy);
    }
    const color=mesh.material.color.getHex();
    if(color!==c.hex){
      c.hex=color;
      for(let i=0;i<256;i++){
        const shade=.49+i/255*.78;
        for(let j=0;j<3;j++)c.palette[i*3+j]=Math.min(255,Math.round((color>>(16-8*j)&255)*shade));
      }
    }
  }
  function paint(c,w,h,data){
    const {coords:v,tri,tex,palette}=c;
    for(let n=0;n<tri.length;n+=3){
      const a=tri[n]*6,b=tri[n+1]*6,d=tri[n+2]*6;
      const ax=v[a],ay=v[a+1],bx=v[b],by=v[b+1],cx=v[d],cy=v[d+1];
      const det=(bx-ax)*(cy-ay)-(cx-ax)*(by-ay);
      if(det>=-.0001||v[a+2]<.05||v[b+2]<.05||v[d+2]<.05)continue;
      const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
      const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
      const inv=1/det,dx1=(cy-ay)*inv,dy1=(ax-cx)*inv,dx2=(ay-by)*inv,dy2=(bx-ax)*inv;
      let u0=(x0+.5-ax)*dx1+(y0+.5-ay)*dy1, v0=(x0+.5-ax)*dx2+(y0+.5-ay)*dy2;
      for(let y=y0;y<=y1;y++,u0+=dy1,v0+=dy2){
        let u=u0,q=v0;
        for(let x=x0;x<=x1;x++,u+=dx1,q+=dx2){
          const t=1-u-q;
          if(u<-.00001||q<-.00001||t<-.00001)continue;
          const z=t*v[a+2]+u*v[b+2]+q*v[d+2],i=y*w+x;
          if(z>=depth[i])continue;
          const intensity=Math.min(255,Math.max(0,Math.round(t*v[a+3]+u*v[b+3]+q*v[d+3])))*3;
          const k=i*4;
          if(tex){
            const tu=Math.min(tex.w-1,Math.max(0,(t*v[a+4]+u*v[b+4]+q*v[d+4])*tex.w|0));
            let tv=t*v[a+5]+u*v[b+5]+q*v[d+5];
            tv=Math.min(tex.h-1,Math.max(0,(tex.flip?1-tv:tv)*tex.h|0));
            const j=(tv*tex.w+tu)*4;if(tex.data[j+3]<96)continue;
            data[k]=palette[intensity]*tex.data[j]/255;
            data[k+1]=palette[intensity+1]*tex.data[j+1]/255;
            data[k+2]=palette[intensity+2]*tex.data[j+2]/255;
          }else{
            data[k]=palette[intensity];data[k+1]=palette[intensity+1];data[k+2]=palette[intensity+2];
          }
          data[k+3]=255;depth[i]=z;
        }
      }
    }
  }
  function draw(ctx,scene,camera,width,height){
    const actors=actorMeshes(scene);if(!actors.length)return;
    pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    const light=scene.children.find(o=>o.isDirectionalLight);
    if(light)sun.copy(light.position).sub(light.target.position).normalize();else sun.set(-.4,.7,.5).normalize();
    // Scene objects may stand behind one another or cross the goal line.
    actors.forEach(g=>{center.setFromMatrixPosition(g.root.matrixWorld).applyMatrix4(camera.matrixWorldInverse);g.distance=-center.z;});
    actors.sort((a,b)=>b.distance-a.distance);
    for(const g of actors){
      if(g.distance<.1||!g.root.visible)continue;
      const bounds={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity,w:width,h:height}, projected=[];
      const skeletons=new Set();
      for(const mesh of g.meshes){
        if(mesh.skeleton&&!skeletons.has(mesh.skeleton)){mesh.skeleton.update();skeletons.add(mesh.skeleton);}
        const c=meshCache(mesh);if(!c)continue;project(mesh,c,bounds);projected.push(c);
      }
      const x=Math.max(0,Math.floor(bounds.left)-1),y=Math.max(0,Math.floor(bounds.top)-1);
      const sw=Math.min(width,Math.ceil(bounds.right)+1)-x,sh=Math.min(height,Math.ceil(bounds.bottom)+1)-y;
      if(sw<=0||sh<=0)continue;
      const scale=Math.min(1.5,440/sh,340/sw),w=Math.max(1,Math.ceil(sw*scale)),h=Math.max(1,Math.ceil(sh*scale));
      if(canvas.width<w||canvas.height<h){canvas.width=Math.max(w,canvas.width);canvas.height=Math.max(h,canvas.height);}
      const rw=Math.ceil(w/16)*16,rh=Math.ceil(h/16)*16;
      if(!g.image||g.image.width<rw||g.image.height<rh){
        g.image=out.createImageData(Math.max(rw,g.image?.width||0),Math.max(rh,g.image?.height||0));
        g.depth=new Float32Array(g.image.width*g.image.height);
      }
      const image=g.image;depth=g.depth;image.data.fill(0);depth.fill(Infinity);
      for(const c of projected){
        for(let k=0;k<c.coords.length;k+=6){c.coords[k]=(c.coords[k]-x)*scale;c.coords[k+1]=(c.coords[k+1]-y)*scale;}
        paint(c,image.width,image.height,image.data);
      }
      out.putImageData(image,0,0);ctx.drawImage(canvas,0,0,w,h,x,y,sw,sh);
    }
  }
  return {draw};
}
