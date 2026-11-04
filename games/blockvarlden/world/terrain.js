export const SIZE=16, HEIGHT=80, SEA=20;
export const biomes=['Grönskande skog','Tät barrskog','Lövskog','Höga berg','Snötäckta berg','Öken','Djungel','Savann','Träsk','Strand','Hav','Fantasiskog'];
export function seedNumber(s){let n=2166136261;for(const ch of String(s)) n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0}
export function hash(x,z,s){let n=Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(s,69069)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296}
function noise(x,z,k,s){x/=k;z/=k;let i=Math.floor(x),j=Math.floor(z),u=x-i,v=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v);const a=hash(i,j,s),b=hash(i+1,j,s),c=hash(i,j+1,s),d=hash(i+1,j+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
export function column(x,z,s){
 const land=noise(x,z,117,s), humid=noise(x,z,84,s+7), heat=noise(x,z,150,s+1), ridge=noise(x,z,48,s+2), waves=noise(x,z,19,s+5);
 const landHeight=10+land*27+ridge*5+waves*3+Math.max(0,land-.59)*75*ridge;
 const channel=Math.abs(noise(x,z,90,s+19)-.49);
 const river=Math.max(0,1-channel/.045);
 const height=Math.floor(landHeight-Math.max(0,landHeight-(SEA-2))*river*river);
 const biome=height<SEA-1?10:height<=SEA+1?9:height>44?4:height>38?3:heat>.66?(humid<.38?5:humid>.57?6:7):humid>.76?(heat<.38?11:8):heat<.35?1:humid<.46?2:0;
 return {height,biome};
}
export function generate(cx,cz,seed,ids,legacy,edits){
 const data=new Uint16Array(18*18*HEIGHT), idx=(x,y,z)=>x+18*(z+18*y);
 for(let z=0;z<18;z++)for(let x=0;x<18;x++){
  const wx=cx*16+x-1,wz=cz*16+z-1,{height:h,biome:b}=column(wx,wz,seed);
  const top=[1,ids.moss,1,3,ids.snow,6,1,1,ids.clay,6,6,ids.moss][b]||1;
  const phase=wx*.137+Math.sin(wz*.075+seed%81), arch=wz*.111+Math.cos(wx*.063+seed%39);
  const sectorX=Math.floor(wx/96),sectorZ=Math.floor(wz/96), chamberX=sectorX*96+18+Math.floor(hash(sectorX,sectorZ,seed+101)*58),chamberZ=sectorZ*96+18+Math.floor(hash(sectorX,sectorZ,seed+102)*58);
  const rx=Math.abs(wx-chamberX),rz=Math.abs(wz-chamberZ),level=9+Math.floor(hash(sectorX,sectorZ,seed+103)*5);
  for(let y=0;y<=Math.max(h,SEA);y++){
   let id=y>h?ids.water:y===h?top:y>=h-2?(top===6?6:2):3;
   if(y>1&&y<h-2){const cave=Math.sin(phase+y*.142)+Math.cos(arch-y*.159)+.72*Math.sin(wx*.062+wz*.09+y*.24);if(cave>1.57)id=y<5?ids.lava:y<9?ids.water:0;else if(hash(wx+y*29,wz-y*7,seed)>.975)id=76+Math.floor(hash(wx-y,wz+y,seed+13)*(y<18?12:5));}
   if(rx<=5&&rz<=5&&h>level+5&&y>=level&&y<=level+4){
    if(y===level||y===level+4||((rx===5||rz===5)&&rx+rz>5))id=y===level&&rx===0&&rz===0?142:93;
    else id=y===level+1&&rx===1&&rz===1?137:0;
   }else if(!id&&y>7&&y<h-3&&hash(wx,wz,seed+31)>.968&&Math.sin(phase+(y+1)*.142)+Math.cos(arch-(y+1)*.159)+.72*Math.sin(wx*.062+wz*.09+(y+1)*.24)<=1.57)id=hash(wx,wz,seed+1)>.55?81:12;
   data[idx(x,y,z)]=id;
  }
  if(legacy&&wx>=-13&&wx<13&&wz>=-13&&wz<13)for(let y=0;y<HEIGHT;y++)data[idx(x,y,z)]=0;
 }
 for(const [wx,y,wz,id] of edits){let x=wx-cx*16+1,z=wz-cz*16+1;if(x>=0&&x<18&&z>=0&&z<18&&y>=0&&y<HEIGHT)data[idx(x,y,z)]=id}
 return data;
}
