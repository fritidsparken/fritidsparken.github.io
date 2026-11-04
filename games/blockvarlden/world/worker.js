import {generate,HEIGHT} from './terrain.js';
let defs,ids,seed,legacy;
onmessage=({data:m})=>{
 if(m.init){({defs,ids,seed,legacy}=m);return}
 const {cx,cz,rev,edits}=m, data=generate(cx,cz,seed,ids,legacy,edits);
 const get=(x,y,z)=>y<0?3:y>=HEIGHT?0:data[x+1+18*(z+1+18*y)];
 // For each orientation merge equal, exposed faces within a section. UVs repeat in the shader.
 const batches=[[],[]], transfer=[data.buffer];
 for(let base=0;base<HEIGHT;base+=16){
  const groups=[[],[]];
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const u=(axis+1)%3,v=(axis+2)%3,p=[0,0,0],n=[0,0,0];n[axis]=sign;
   for(let slice=0;slice<16;slice++){
    const mask=new Int32Array(256);p[axis]=slice;
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){p[u]=i;p[v]=j;const [x,y,z]=p,id=get(x,y+base,z);if(!id)continue;
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
  for(let pass=0;pass<2;pass++)if(groups[pass].length){const arr=new Float32Array(groups[pass]);batches[pass].push(arr);transfer.push(arr.buffer)}
 }
 postMessage({cx,cz,rev,data,batches},transfer);
};
