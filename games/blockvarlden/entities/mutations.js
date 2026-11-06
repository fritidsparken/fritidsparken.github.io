// Small reusable voxel parts: each mutation gets a reproducible silhouette and palette.
export const eggSpecies=['ko','far','gris','hona','hast','kanin','rav','varg','bjorn','fisk','lyktmott','mosslynx','skifferbagge','korallvandrare','rimfena','mutation'];
const names=['Ko','Får','Gris','Höna','Häst','Kanin','Räv','Varg','Björn','Fisk','Lyktmott','Mosslo','Skifferbagge','Korallvandrare','Rimfena','Galning'];
export const eggs=eggSpecies.map((species,i)=>({id:'egg_'+species,name:names[i]+'ägg',category:'Ägg',species}));
export function mutationTraits(seed){return {legs:4+(seed%3)*2,eyes:2+(seed>>>3)%4,horns:1+(seed>>>6)%3,wings:!!(seed&256),hue:seed%360,name:['Disco','Turbo','Mega','Studs','Regnbågs','Knaster'][seed%6]+['snabel','fluff','krabban','draken','knas','plutten'][(seed>>>4)%6]};}
export function mixEggs(selection,bag,creative=false,nonce=Date.now()){
 const entries=Object.entries(selection).filter(([,n])=>n>0);
 if(!entries.length||entries.some(([id,n])=>!eggs.some(e=>e.id===id)||!Number.isSafeInteger(n)||n>999||(!creative&&n>(bag[id]||0))))throw Error('Välj ägg som finns i din ryggsäck.');
 let seed=nonce>>>0;for(const [id,n] of entries.sort())for(const ch of id+':'+n)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
 return {seed,entries};
}
export function mutationModel(seed){
 const T=globalThis.THREE,t=mutationTraits(seed),root=new T.Group(),geo=new T.BoxGeometry(1,1,1),materials=[];
 const mat=(h,l)=>{const m=new T.MeshStandardMaterial({color:new T.Color().setHSL(h/360,.8,l),roughness:.65});materials.push(m);return m};
 const skin=mat(t.hue,.55),accent=mat((t.hue+140)%360,.6),white=mat(0,.98),black=mat(0,.08),legs=[],wings=[];
 function part(x,y,z,sx,sy,sz,m=skin){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;root.add(o);return o}
 part(0,.83,0,1.05,.72,1.25);part(0,1.38,.42,.9,.66,.75,accent);
 for(let i=0;i<t.legs;i++){const side=i%2?1:-1,z=-.44+Math.floor(i/2)*.88/(t.legs/2-1);legs.push(part(side*.58,.3,z,.22,.6,.24));part(side*.63,.08,z+.1,.36,.16,.4,accent)}
 for(let i=0;i<t.eyes;i++){const x=(i-(t.eyes-1)/2)*.25;part(x,1.45,.83,.22,.26,.17,white);part(x,1.46,.93,.1,.14,.06,black)}
 for(let i=0;i<t.horns;i++){const horn=part((i-(t.horns-1)/2)*.32,1.96,.36,.15,.55,.17,accent);horn.rotation.z=(i-(t.horns-1)/2)*-.3}
 part(0,1.14,1.02,.23,.23,.65);part(0,1.2,1.35,.38,.35,.19,accent);
 for(let i=0;i<4;i++)part(0,.94+i*.13,-.76-i*.17,.25-i*.04,.25,.33,accent);
 if(t.wings)for(const side of [-1,1]){const wing=part(side*.91,1.13,-.12,.85,.12,.85,accent);wings.push(wing)}
 let time=0,walking=false;
 return {root,play(state){walking=['walk','flee'].includes(state)},mixer:{update(dt){time+=dt;legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(time*9+i%2*Math.PI)*.4:0);wings.forEach((w,i)=>w.rotation.z=Math.sin(time*5)*.4*(i?1:-1))}},dispose(){root.removeFromParent();geo.dispose();materials.forEach(m=>m.dispose())}};
}
export function eggKit(kit){const T=globalThis.THREE,geometry=new T.SphereGeometry(.22,12,10),material=new T.MeshStandardMaterial({color:0xd8a5ff,roughness:.5});return {ids:[...kit.ids,...eggs.map(e=>e.id)],create(id){if(!eggs.some(e=>e.id===id))return kit.create(id);const egg=new T.Mesh(geometry,material);egg.scale.y=1.35;return egg},dispose(){geometry.dispose();material.dispose();kit.dispose()}}}
