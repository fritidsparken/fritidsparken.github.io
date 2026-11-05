import {generate,HEIGHT} from './terrain.js';
import {LAVA, REACH} from './lava.js';
let defs,ids,seed,legacy;
onmessage=({data:m})=>{
 if(m.init){({defs,ids,seed,legacy}=m);return}
 const {cx,cz,rev,edits}=m, data=generate(cx,cz,seed,ids,legacy,edits);
 const levels=new Uint8Array(data.length);
 for(const [wx,y,wz,level] of m.flows||[]){
  const x=wx-cx*16+1,z=wz-cz*16+1;
  if(x<0||x>17||z<0||z>17)continue;
  const i=x+18*(z+18*y);
  data[i]=LAVA;levels[i]=level;
 }
 const get=(x,y,z)=>y<0?3:y>=HEIGHT?0:data[x+1+18*(z+1+18*y)];
 const levelAt=(x,y,z)=>levels[x+1+18*(z+1+18*y)];
 const seeds=[];
 if(m.first)for(let y=1;y<HEIGHT;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){
  const id=get(x,y,z);
  if(id===LAVA){
   for(const [dx,dy,dz] of [[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]])
    if(get(x+dx,y+dy,z+dz)===0)seeds.push(x+cx*16+dx,y+dy,z+cz*16+dz);
  }else if(id===0&&((x===0&&get(-1,y,z)===LAVA)||(x===15&&get(16,y,z)===LAVA)
    ||(z===0&&get(x,y,-1)===LAVA)||(z===15&&get(x,y,16)===LAVA)))seeds.push(x+cx*16,y,z+cz*16);
 }
 // For each orientation merge equal, exposed faces within a section. UVs repeat in the shader.
 const batches=[[],[]], transfer=[data.buffer];
 for(let base=0;base<HEIGHT;base+=16){
  const groups=[[],[]];
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const u=(axis+1)%3,v=(axis+2)%3,p=[0,0,0],n=[0,0,0];n[axis]=sign;
   for(let slice=0;slice<16;slice++){
    const mask=new Int32Array(256);p[axis]=slice;
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){p[u]=i;p[v]=j;const [x,y,z]=p,id=get(x,y+base,z);if(!id||id===LAVA&&levelAt(x,y+base,z))continue;
     const other=get(x+n[0],y+base+n[1],z+n[2]);if(other===id||(other&&!defs[other].transparent))continue;
     const def=defs[id], variant=def.variants?.length&&((x+cx*16)*17+(z+cz*16)*31)%11===0?def.variants[def.variants.length-1]:def.tiles;
     const tile=variant[axis===1?(sign>0?'top':'bottom'):'side'];mask[i+j*16]=1+tile+(def.transparent?2048:0);
    }
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const k=i+j*16,code=mask[k];if(!code)continue;let w=1,h=1;while(i+w<16&&mask[k+w]===code)w++;outer:while(j+h<16){for(let t=0;t<w;t++)if(mask[k+h*16+t]!==code)break outer;h++}
     for(let r=0;r<h;r++)mask.fill(0,k+16*r,k+16*r+w);
     const pack=groups[+(code>2048)],tile=(code-1)%2048;
     for(const corner of (sign>0?[0,1,2,0,2,3]:[0,3,2,0,2,1])){p[axis]=slice+(sign>0?1:0);const a=corner===1||corner===2?w:0,b=corner>=2?h:0;p[u]=i+a;p[v]=j+b;
      const uv=axis===0?[b,a]:axis===1?[b,a]:[a,b];pack.push(p[0],p[1]+base,p[2],...n,uv[0],uv[1],tile)}
     p[axis]=slice;
    }
   }
  }
  // Liquid corners share their neighboring heights, which avoids cracks
  // between wider pools, thin lips and vertical sheets at chunk boundaries.
  const cornerHeight=(x,y,z)=>{
   let total=0,count=0;
   for(let dz=-1;dz<=0;dz++)for(let dx=-1;dx<=0;dx++){
    const nx=x+dx,nz=z+dz;
    if(get(nx,y,nz)!==LAVA)continue;
    const level=levelAt(nx,y,nz);
    if(!level||get(nx,y+1,nz)===LAVA)return 1;
    total+=.14+.68*level/REACH;count++;
   }
   return count?total/count:1;
  };
  for(const [wx,y,wz] of m.flows||[]){
   const x=wx-cx*16,z=wz-cz*16;
   if(y<base||y>=base+16||x<0||x>15||z<0||z>15)continue;
   for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const n=[0,0,0];n[axis]=sign;
    const other=get(x+n[0],y+n[1],z+n[2]);
    if(other===LAVA||other&&!defs[other].transparent)continue;
    const tile=defs[LAVA].tiles[axis===1?(sign>0?'top':'bottom'):'side'];
    const u=(axis+1)%3,v=(axis+2)%3;
    for(const corner of (sign>0?[0,1,2,0,2,3]:[0,3,2,0,2,1])){
     const p=[0,0,0];p[axis]=+(sign>0);p[u]=+(corner===1||corner===2);p[v]=+(corner>=2);
     const height=p[1]?cornerHeight(x+p[0],y,z+p[2]):0;
     const uv=axis===0?[p[2],height]:axis===1?[p[0],p[2]]:[p[0],height];
     groups[1].push(x+p[0],y+height,z+p[2],...n,...uv,tile);
    }
   }
  }
  for(let pass=0;pass<2;pass++)if(groups[pass].length){const arr=new Float32Array(groups[pass]);batches[pass].push(arr);transfer.push(arr.buffer)}
 }
 postMessage({cx,cz,rev,data,batches,seeds},transfer);
};
