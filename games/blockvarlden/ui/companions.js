// A heading-up compass and world-space name labels. One world block is one metre.
export function radarPoint(dx,dz,yaw,range,radius=42){
 const right=dx*Math.cos(yaw)-dz*Math.sin(yaw);
 const forward=-dx*Math.sin(yaw)-dz*Math.cos(yaw);
 const distance=Math.hypot(right,forward),scale=radius/Math.max(range,distance);
 return {x:right*scale,y:-forward*scale,outside:distance>range};
}
export function companionDistance(p,origin){return Math.round(Math.hypot(p[0]-origin.x,p[1]-origin.y,p[2]-origin.z))}
export function createCompanions(T,hud){
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n};
 const root=el('section','companions');root.hidden=true;root.setAttribute('aria-label','Kompiskarta');
 const heading=el('div','companions-heading','Kompisar');
 const dial=el('div','compass-dial');dial.setAttribute('role','img');
 const north=el('span','compass-north','N'),self=el('span','compass-self','▲');
 const scale=el('small','compass-scale','64 m');
 dial.append(north,self);root.append(heading,dial,scale);hud.append(root);
 const labels=el('div','companion-labels');hud.append(labels);
 const markers=new Map(),anchor=new T.Vector3(),view=new T.Vector3();
 let lastCount=-1;
 const color=id=>{let h=0;for(const c of String(id))h=(Math.imul(h,31)+c.charCodeAt(0))|0;return `hsl(${((h>>>0)%280)+30} 85% 75%)`};
 function remove(id){const m=markers.get(id);if(m){m.dot.remove();m.label.remove();markers.delete(id)}}
 function hide(){root.hidden=true;labels.hidden=true;for(const id of markers.keys())remove(id);lastCount=-1}
 return {hide,update({players,position,yaw,camera}){
  if(!Array.isArray(players)){hide();return}
  root.hidden=false;labels.hidden=false;
  const valid=players.filter(p=>p&&p.id&&Array.isArray(p.p)&&p.p.length>=3&&p.p.slice(0,3).every(Number.isFinite));
  const ids=new Set(valid.map(p=>p.id));for(const id of markers.keys())if(!ids.has(id))remove(id);
  if(lastCount!==valid.length){heading.textContent=valid.length?`Kompisar · ${valid.length}`:'Kompisar';dial.setAttribute('aria-label',valid.length?`${valid.length} kompisar i världen`:'Väntar på kompisar');lastCount=valid.length}
  const farthest=Math.max(1,...valid.map(p=>Math.hypot(p.p[0]-position.x,p.p[2]-position.z)));
  const range=Math.min(1024,Math.max(64,2**Math.ceil(Math.log2(farthest*1.12))));
  scale.textContent=valid.length?`${range} m`:'Väntar på kompisar';
  const n=radarPoint(0,-1,yaw,1,45);north.style.left=(50+n.x)+'%';north.style.top=(50+n.y)+'%';
  const bounds=hud.getBoundingClientRect(),placed=[];
  for(const peer of valid){
   let marker=markers.get(peer.id);
   if(!marker){
    const dot=el('span','compass-friend'),dotName=el('span','compass-friend-name');dot.append(dotName);dial.append(dot);
    const label=el('div','companion-label'),name=el('strong',''),distance=el('span','');label.append(name,distance);labels.append(label);
    dot.style.setProperty('--friend-color',color(peer.id));label.style.setProperty('--friend-color',color(peer.id));
    marker={dot,dotName,label,name,distance};markers.set(peer.id,marker);
   }
   const name=String(peer.name||'Kompis').slice(0,24),metres=companionDistance(peer.p,position);
   marker.dotName.textContent=name.slice(0,9);marker.dot.title=`${name} · ${metres} m`;
   marker.name.textContent=name;marker.distance.textContent=`${metres} m`;
   const point=radarPoint(peer.p[0]-position.x,peer.p[2]-position.z,yaw,range);
   marker.dot.style.left=(50+point.x)+'%';marker.dot.style.top=(50+point.y)+'%';marker.dot.classList.toggle('outside',point.outside);
   anchor.set(peer.p[0],peer.p[1]+2.25,peer.p[2]);view.copy(anchor).applyMatrix4(camera.matrixWorldInverse);anchor.project(camera);
   const visible=view.z<-.1&&Math.abs(anchor.x)<.96&&Math.abs(anchor.y)<.9;
   marker.label.hidden=!visible;
   if(visible){
    let x=(anchor.x*.5+.5)*bounds.width,y=(-anchor.y*.5+.5)*bounds.height;
    for(const other of placed)if(Math.abs(x-other.x)<115&&Math.abs(y-other.y)<32)y=other.y-34;
    y=Math.max(24,y);placed.push({x,y});marker.label.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`;
   }
  }
 },dispose(){hide();root.remove();labels.remove()}};
}
