// A bounded clipboard keeps large selections responsive on touch devices.
export function blueprint(world,edit,allowCell){
 let first=null,selection=null;
 return {mark(cell){if(!first){first=[...cell];return 'Första hörnet markerat. Sikta på det motsatta hörnet.'}
 const lo=cell.map((n,i)=>Math.min(n,first[i])),hi=cell.map((n,i)=>Math.max(n,first[i]));
 if(lo.some((v,i)=>hi[i]-v>=16)){first=null;return 'Markera högst 16 × 16 × 16 block.'}
 const blocks=[];for(let y=lo[1];y<=hi[1];y++)for(let z=lo[2];z<=hi[2];z++)for(let x=lo[0];x<=hi[0];x++){const id=world.at(x,y,z);if(id===null){first=null;return 'Området behöver vara inläst.'}if(id&&id!==137)blocks.push([x-lo[0],y-lo[1],z-lo[2],id])}first=null;selection=blocks;return blocks.length+' block kopierade.'},
 paste(anchor){if(!selection?.length)return 'Markera två hörn först.';const cells=selection.map(([x,y,z,id])=>[[x+anchor[0],y+anchor[1],z+anchor[2]],id]);
 if(cells.some(([c])=>c[1]<1||c[1]>=80||!allowCell(c)||world.at(...c)!==0))return 'Välj en ledig plats där hela bygget ryms.';
 for(const [c,id] of cells)edit(c,id);return cells.length+' block placerade.'}}
}
