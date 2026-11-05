// Sources are either procedural blocks or saved player edits. Only derived flow
// lives here. Dropping a chunk frees its fluid and loading it rebuilds the flow.
export const LAVA = 26;
export const REACH = 5;
const sides = [[1,0],[-1,0],[0,1],[0,-1]];
const cellKey = (x,y,z) => x+','+y+','+z;
const chunkKey = (x,z) => Math.floor(x/16)+','+Math.floor(z/16);

export class LavaFlow {
  constructor(read,write,height) {
    this.read=read;
    this.write=write;
    this.height=height;
    this.byChunk=new Map();
    this.pending=new Map();
    this.pendingByChunk=new Map();
  }
  level(x,y,z) {
    return this.byChunk.get(chunkKey(x,z))?.get(cellKey(x,y,z))?.[3] || 0;
  }
  entries(cx,cz) {
    return this.byChunk.get(cx+','+cz)?.values() || [];
  }
  enqueue(x,y,z) {
    if(y<1||y>=this.height)return;
    const id=this.read(x,y,z);
    if(id!==0 && !(id===LAVA && this.level(x,y,z)))return;
    const key=cellKey(x,y,z);
    if(this.pending.has(key))return;
    const ck=chunkKey(x,z);
    if(!this.pendingByChunk.has(ck))this.pendingByChunk.set(ck,new Set());
    this.pendingByChunk.get(ck).add(key);
    this.pending.set(key,[x,y,z]);
  }
  wake(x,y,z) {
    this.enqueue(x,y,z);
    this.enqueue(x,y-1,z);
    // A change in support affects the sideways outlets of the cell above it.
    for(const [dx,dz] of sides) {
      this.enqueue(x+dx,y,z+dz);
      this.enqueue(x+dx,y+1,z+dz);
    }
  }
  forget(x,y,z) {
    const k=chunkKey(x,z), cells=this.byChunk.get(k);
    if(cells){cells.delete(cellKey(x,y,z));if(!cells.size)this.byChunk.delete(k)}
  }
  unload(cx,cz) {
    const ck=cx+','+cz;
    this.byChunk.delete(ck);
    for(const key of this.pendingByChunk.get(ck)||[])this.pending.delete(key);
    this.pendingByChunk.delete(ck);
  }
  desired(x,y,z) {
    if(this.read(x,y+1,z)===LAVA)return REACH;
    let best=0;
    for(const [dx,dz] of sides) {
      const nx=x+dx,nz=z+dz;
      if(this.read(nx,y,nz)!==LAVA)continue;
      const below=this.read(nx,y-1,nz);
      // An unsupported lip feeds the drop before it can feed a side channel.
      if(below===null||below===0||below===25||(below===LAVA&&this.level(nx,y-1,nz)))continue;
      const supply=this.level(nx,y,nz)||REACH+1;
      best=Math.max(best,supply-1);
    }
    return best;
  }
  tick(budget=128) {
    const count=Math.min(this.pending.size,budget);
    for(let i=0; i<count; i++) {
      const first=this.pending.entries().next().value;
      if(!first)break;
      const [key,pos]=first,[x,y,z]=pos;
      this.pending.delete(key);
      const ck=chunkKey(x,z), scheduled=this.pendingByChunk.get(ck);
      scheduled.delete(key);
      if(!scheduled.size)this.pendingByChunk.delete(ck);
      const old=this.level(x,y,z),id=this.read(x,y,z);
      if(id!==0 && !(id===LAVA && old))continue;
      const next=this.desired(x,y,z);
      if(next===old)continue;
      if(next) {
        if(!this.byChunk.has(ck))this.byChunk.set(ck,new Map());
        this.byChunk.get(ck).set(key,[x,y,z,next]);
      } else this.forget(x,y,z);
      this.write(x,y,z,next?LAVA:0);
      this.wake(x,y,z);
    }
    return count;
  }
}
