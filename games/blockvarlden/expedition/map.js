export function showMap(world,position,players=[]){
 const d=document.createElement('dialog');d.setAttribute('aria-label','Världskarta');d.style.cssText='max-width:90vw;border:2px solid #c6ad71;border-radius:20px;background:#172e32;color:white;padding:16px';
 const title=document.createElement('h2');title.textContent='Världskarta · norr uppåt';
 const c=document.createElement('canvas');c.width=c.height=320;c.style.cssText='width:min(72vw,320px);display:block;border-radius:50%';const ctx=c.getContext('2d'),scale=2;
 for(let y=0;y<160;y++)for(let x=0;x<160;x++){const wx=position.x+(x-80)*scale,wz=position.z+(y-80)*scale,info=world.info(wx,wz);ctx.fillStyle=info.height<=20?'#3689b2':info.height>43?'#c8c6b6':info.biome===4?'#e4eded':info.height>32?'#61744c':'#91ac68';ctx.fillRect(x*2,y*2,2,2)}
 function dot(x,z,label,color){const px=160+(x-position.x),py=160+(z-position.z);if(Math.hypot(px-160,py-160)>155)return;ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();ctx.font='12px sans-serif';ctx.strokeStyle='#14252b';ctx.lineWidth=3;ctx.strokeText(label,px+7,py);ctx.fillText(label,px+7,py)}
 for(const p of players)dot(p.p[0],p.p[2],p.name,'#fff4a8');dot(position.x,position.z,'Du','#ffffff');
 const note=document.createElement('p');note.textContent='N ↑ · 1 pixel = 1 meter · blått = vatten';const b=document.createElement('button');b.textContent='Stäng kartan';b.onclick=()=>d.close();d.append(title,c,note,b);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();return d;
}
