import {equipment,withEquipment,boatWater,rowBoat} from './expedition/equipment.js';
import {createNature} from './expedition/nature.js';
import {showMap} from './expedition/map.js';
import {eggs,eggKit,mixEggs} from './entities/mutations.js';
import {World} from './world/stream.js';
import {biomes,hash} from './world/terrain.js';
import {move,occupied,target,eye} from './engine/player.js';
import {blueprint} from './engine/blueprint.js';
import {createFixtureInteractions,stepHeight} from './engine/fixtures.js?v=expedition1';
import {bindFullscreen} from './engine/display.js?v=2';
import {controls} from './engine/controls.js?v=remove1';
import {createCompanions} from './ui/companions.js?v=kompis3';
import {adaptiveGraphics} from './rendering/quality.js';
import {createSky} from './rendering/sky.js';
import {loadProps} from './entities/props.js';
import {createLandscape} from './entities/landscape.js';
import {createActors,withFaunaFood,faunaFood} from './entities/actors.js?v=expedition1';
import {createAudio} from './audio/sound.js';
import {consumables,durability} from './inventory/recipes.js?v=expedition1';
import {extraFoods,extraFoodIcons,withExtraFood} from './inventory/food.js';
import {flashlight,withFlashlight} from './inventory/flashlight.js';
import {panels} from './ui/panels.js?v=expedition1';
import * as db from './persistence/worlds.js';
const $=id=>document.getElementById(id),base='../../assets/blockvarlden/',T=window.THREE;
const settings={quality:1,sense:1,fov:72,outfit:'skog',music:.45,effects:.7,ambience:.45};
try{Object.assign(settings,JSON.parse(localStorage.getItem('blockvarlden-options-v2')||'{}'))}catch{}
let roomSession=null,companions,nature;
let reg,kit,atlas,catalog=[],defs={},lookup={},renderer,scene,camera,sky,world,land,fixtures,actors,meta,ui,input,highlight,lamps=[],root,ray,glints;
let suspended=true,waiting=false,homeBusy=false,selected=0,pending=new Map(),removed=new Set(),queue=Promise.resolve(),elapsed=0,lastSave=0,lastStep=0,actionTime=0,actionName='',mineHeld=false,mineKey='',mineTime=0,hit,lastHit=0,lastPanel=0,weather='clear',weatherStep=-1;
const pickups=new Map(), lampChecks=new Map(),harvesting=new Set();
const lampBlock=id=>id===140||id===141;
let graphics,clip,player,handModel,handId,fishAt=-10,flashlightOn=false,flashlightLight,flashlightTarget;const audio=createAudio(),radius=()=>[2,3,4,5][graphics?.level??settings.quality]||2,active=()=>!!meta&&!suspended&&!waiting;
function toast(t){const note=document.getElementById('dialog-status');if(note&&$('panel').open)note.textContent=t;$('toast').textContent=t;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').textContent='',2600)}
const name=id=>lookup[id]?.name||String(id);
function icon(id){const b=defs[id],n=document.createElement('span');if(b){n.className='tile';const t=b.tiles.side;n.style.backgroundImage='url('+base+'blocks/atlas.png)';n.style.backgroundSize=reg.columns*26+'px '+reg.rows*26+'px';n.style.backgroundPosition=-(t%reg.columns)*26+'px '+-Math.floor(t/reg.columns)*26+'px'}else{n.className='symbol';n.textContent=String(id).startsWith('egg_')?'🥚':extraFoodIcons[id]||({door:'🚪',pickaxe:'⛏',axe:'🪓',apple:'🍎',bread:'🥖',chest:'▣',shovel:'⚒',torch:'♨',lantern:'☼',flashlight:'🔦',boat:'🛶',map:'🗺️',campfire:'🔥',shelf:'▤',outfit_sailor:'👕',outfit_explorer:'🧥',flowers:'✿',potion:'⚗',bed:'▱',oak:'♣',pine:'♠'})[id]||'◇'}return n}
function bar(){if(!meta)return;const item=meta.slots[selected];if(handId!==item&&camera){if(handModel)camera.remove(handModel);handModel=null;handId=item;if(kit.ids.includes(item)&&(['Verktyg','Mat','Föremål'].includes(lookup[item]?.category))){handModel=kit.create(item);handModel.scale.setScalar(.54);handModel.position.set(.33,-.41,-.63);camera.add(handModel)}}$('bar').replaceChildren();meta.slots.forEach((id,i)=>{const b=document.createElement('button');b.title=(i+1)+' · '+name(id);b.setAttribute('aria-label',b.title);b.className=selected===i?'active':'';const count=document.createElement('small');count.textContent=meta.mode==='creative'?i+1:meta.bag[id]||0;b.append(icon(id),count);b.onclick=()=>slot(i);$('bar').append(b)})}
function slot(i){selected=i;bar();if(meta)toast(meta.slots[i]==='flashlight'?'Ficklampa · tryck Bygg eller högerklicka för att tända/släcka':name(meta.slots[i]))}
function add(id,n=1){meta.bag[id]=Math.max(0,(meta.bag[id]||0)+n)}
function showDrop(record){
 const id=record.id;
 let obj;
 if(defs[id]){
  const tile=defs[id].tiles.side,tex=atlas.clone();
  tex.repeat.set(1/reg.columns,1/reg.rows);tex.offset.set(tile%reg.columns/reg.columns,1-(Math.floor(tile/reg.columns)+1)/reg.rows);
  obj=new T.Mesh(new T.BoxGeometry(.24,.24,.24),new T.MeshLambertMaterial({map:tex}));
 }else{obj=kit.create(id);const size=new T.Box3().setFromObject(obj).getSize(new T.Vector3());obj.scale.setScalar(.35/Math.max(.1,size.x,size.y,size.z))}
 obj.position.fromArray(record.p);scene.add(obj);pickups.set(record,obj);
}
function removeDrop(record,obj){
 scene.remove(obj);pickups.delete(record);
 if(defs[record.id]){obj.geometry.dispose();obj.material.map.dispose();obj.material.dispose()}
}
function dropItem(stack){
 if(!active())return;
 const id=meta.slots[selected],creative=meta.mode==='creative',count=creative?1:Math.min(meta.bag[id]||0,stack?64:1);
 if(!count)return;
 const p=player.p.clone();p.y+=1;
 for(let i=0;i<6;i++){const x=p.x-Math.sin(player.yaw)*.25,z=p.z-Math.cos(player.yaw)*.25;if(world.solid(x,p.y,z))break;p.x=x;p.z=z}
 const rec={id,count,p:p.toArray(),ready:Date.now()+1300};
 if(!creative)add(id,-count);meta.drops.push(rec);showDrop(rec);bar();checkpoint();
}
function updateDrops(dt){
 for(const [rec,obj] of pickups){
  if(world.at(rec.p[0],0,rec.p[2])===null)continue;
  const y=rec.p[1]-dt*3;if(!world.solid(rec.p[0],y-.15,rec.p[2]))rec.p[1]=y;
  obj.position.set(rec.p[0],rec.p[1]+.04*Math.sin(elapsed*3),rec.p[2]);obj.rotation.y+=dt;
  if(Date.now()<rec.ready||Math.abs(obj.position.y-player.p.y-.7)>1.4||Math.hypot(obj.position.x-player.p.x,obj.position.z-player.p.z)>.85)continue;
  if(meta.mode==='survival')add(rec.id,rec.count);meta.drops.splice(meta.drops.indexOf(rec),1);removeDrop(rec,obj);bar();checkpoint();
 }
}
function configure(){document.body.classList.add('screen-stick');try{localStorage.setItem('blockvarlden-options-v2',JSON.stringify(settings))}catch{}for(const k of ['music','effects','ambience'])audio.volume(k,settings[k]);if(renderer){graphics.set(settings.quality);camera.fov=settings.fov;resize()}}
function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
function suspend(){removeTarget=null;suspended=true;input?.clear();document.exitPointerLock?.();audio.pause()}
function checkpoint(){if(meta)save().catch(()=>toast('Kunde inte spara. Kontrollera ledigt utrymme.'))}
function resume(){if(!meta)return;suspended=false;graphics.resetSamples();audio.start();checkpoint()}
async function refreshHome(){const worlds=await db.list();$('continue').disabled=!worlds.length}
function save(){if(!meta)return Promise.resolve();if(meta.roomCode)return saveRoomProgress();meta.fly=player.fly;meta.position=(fixtures?.standingPosition(player)||player.seatEntry||player.p).toArray();meta.yaw=player.yaw;meta.pitch=player.pitch;meta.removed=[...removed];const m=structuredClone(meta),batch=pending;pending=new Map();const job=queue.catch(()=>{}).then(()=>db.save(m,[...batch.values()]));queue=job.catch(e=>{if(meta?.id===m.id)for(const [k,v] of batch)if(!pending.has(k))pending.set(k,v);throw e});queue.catch(()=>{});return queue}
function saveRoomProgress(){
 if(!meta?.roomCode||!player)return Promise.resolve();
 const progress={bag:meta.bag,slots:meta.slots,wear:meta.wear,life:meta.life,food:meta.food,position:player.p.toArray(),yaw:player.yaw,pitch:player.pitch,mapGranted:meta.mapGranted,flashlightGranted:meta.flashlightGranted};
 try{localStorage.setItem('bv-progress-v3-'+meta.roomCode,JSON.stringify(progress));return Promise.resolve()}catch(e){return Promise.reject(e)}
}
function restoreRoomProgress(m){
 try{const p=JSON.parse(localStorage.getItem('bv-progress-v3-'+m.roomCode)||'null');if(!p)return;
  for(const key of ['bag','wear'])if(p[key]&&typeof p[key]==='object'&&!Array.isArray(p[key]))m[key]=Object.fromEntries(Object.entries(p[key]).filter(([id,n])=>lookup[id]&&Number.isFinite(n)&&n>=0));
  if(Array.isArray(p.slots)&&p.slots.length===9&&p.slots.every(id=>lookup[id]))m.slots=p.slots;
  for(const key of ['food','life'])if(Number.isFinite(p[key]))m[key]=Math.max(0,Math.min(10,p[key]));
  if(Array.isArray(p.position)&&p.position.length===3&&p.position.every(n=>Number.isFinite(n)&&Math.abs(n)<1e6))m.position=p.position;
  for(const key of ['yaw','pitch'])if(Number.isFinite(p[key]))m[key]=p[key];
  m.flashlightGranted=p.flashlightGranted===true;m.mapGranted=p.mapGranted===true;
 }catch{}
}
function cleanup(){companions?.hide();if(!world)return;for(const [rec,obj] of pickups)removeDrop(rec,obj);world.dispose();land.dispose();actors.dispose();nature?.dispose();scene.remove(root);for(const light of lamps)scene.remove(light);lamps=[];root=null;world=null;meta=null;highlight.visible=false;flashlightOn=false;if(flashlightLight)flashlightLight.visible=false}
async function home(){suspend();await save();roomSession?.close();roomSession=null;if($('room-info'))$('room-info').hidden=true;cleanup();$('loading').hidden=true;$('hud').hidden=true;$('home').hidden=false;await refreshHome()}
function setupRenderer(){if(renderer)return;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{throw Error('WebGL kunde inte starta. Aktivera grafikacceleration i webbläsaren och öppna spelet igen.')};graphics=adaptiveGraphics(renderer);document.body.prepend(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(settings.fov,1,.045,240);camera.rotation.order='YXZ';scene.add(camera);companions=createCompanions(T,$('hud'));sky=createSky(scene);ray=new T.Raycaster();highlight=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.012,1.012,1.012)),new T.LineBasicMaterial({color:0xffe6a1}));highlight.visible=false;scene.add(highlight);
 flashlightLight=new T.SpotLight(0xfff1cd,35,24,Math.PI/6,.4,1.5);flashlightTarget=new T.Object3D();scene.add(flashlightLight,flashlightTarget);flashlightLight.target=flashlightTarget;flashlightLight.visible=false;
 glints=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({size:.09,color:0xe2b880}));glints.visible=false;scene.add(glints);
 input=controls(renderer.domElement,{active,pack:()=>ui.pack(),pause:()=>ui.pause(),camera:()=>{player.third=!player.third},fly:()=>{if(meta.mode==='creative')player.fly=!player.fly},slot,cycle:step=>slot((selected+step+9)%9),pickBlock:()=>{findHit();if(!hit)return;const id=hit.kind==='prop'?hit.obj.userData.record.id:hit.id;if(!lookup[id]||(meta.mode==='survival'&&!meta.bag[id]))return;const i=meta.slots.indexOf(id);if(i>=0)slot(i);else{meta.slots[selected]=id;slot(selected)}},drop:dropItem,turn:(x,y)=>{player.yaw-=x*.0029*settings.sense;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch-y*.0029*settings.sense))},remove:removeAimedTarget,mine:on=>{if(on)removeTarget=null;mineHeld=on;if(on){findHit();mining(0)}else if(removeTarget===null){mineKey='';mineTime=0}},build:use});
 configure();requestAnimationFrame(frame)}
function spawn(seedWorld){for(let r=0;r<=150;r+=6)for(const [x,z] of [[r,0],[-r,0],[0,r],[0,-r],[r,r]]){const h=seedWorld.info(x,z).height;if(h>21&&h<43)return [x+.5,h+1.02,z+.5]}return [.5,seedWorld.info(0,0).height+1.1,.5]}
async function start(m,edits){if(homeBusy)return;homeBusy=true;try{await ready;setupRenderer();if(meta){await save();cleanup()}meta=m;meta.bag??={};if(!meta.mapGranted){meta.bag.map=Math.max(1,meta.bag.map||0);meta.mapGranted=true}if(!meta.flashlightGranted){meta.bag.flashlight=Math.max(1,meta.bag.flashlight||0);meta.flashlightGranted=true}flashlightOn=false;lampChecks.clear();for(const [x,y,z,id] of edits||[])if(lampBlock(id))lampChecks.set([x,y,z].join(','),[x,y,z]);meta.props??=[];meta.wear??={};removed=new Set(m.removed||[]);pending=new Map();selected=0;world=new World(scene,reg,atlas,m,edits);clip=blueprint(world,edit,([x,y,z])=>!(Math.abs(player.p.x-x-.5)<.79&&Math.abs(player.p.z-z-.5)<.79&&player.p.y<y+1&&player.p.y+1.75>y));const pos=m.position||spawn(world);player={p:new T.Vector3(...pos),yaw:m.yaw||0,pitch:m.pitch??-.18,fly:m.mode==='creative'&&m.fly===true,third:false,v:0};root=new T.Group();scene.add(root);
 m.drops??=[];for(const record of m.drops)showDrop(record);for(const record of m.props)attach(record);land=createLandscape({scene,kit,world,seed:world.seed,legacy:m.legacy,removed});fixtures=createFixtureInteractions({world,root,land});nature=createNature(T,scene,world);actors=createActors({scene,state:m.fauna??={removed:[],pets:{}},blockAt:(x,y,z)=>world.at(x,y,z),isSolid:id=>!!defs[id]?.collision,ground:(x,z)=>world.surface(x,z),seed:world.seed,waterLevel:21,biome:(x,z)=>world.info(x,z).biome});waiting=true;$('loading').hidden=false;suspended=false;weatherStep=-1;lastSave=elapsed;world.update(pos[0],pos[2],radius());$('home').hidden=true;$('hud').hidden=false;$('region').textContent='Förbereder landskapet…';bar();await save();audio.start()}finally{homeBusy=false}}
function attach(record){const obj=kit.create(record.id);obj.position.fromArray(record.p);obj.rotation.y=(record.rot||0)+(record.open?Math.PI/2:0);obj.userData.record=record;root.add(obj);if(['lantern','torch','campfire'].includes(record.id))refreshLights();return obj}
function refreshLights(){if(!player||!root)return;const sources=root.children.filter(o=>o.userData.record&&['lantern','torch','campfire'].includes(o.userData.record.id)).sort((a,b)=>a.position.distanceToSquared(player.p)-b.position.distanceToSquared(player.p)).slice(0,settings.quality?3:1);for(let i=0;i<sources.length;i++){if(!lamps[i]){lamps[i]=new T.PointLight(0xffb962,2.5,8);scene.add(lamps[i])}lamps[i].position.copy(sources[i].position);lamps[i].position.y+=.7}for(let i=sources.length;i<lamps.length;i++)scene.remove(lamps[i]);lamps.length=sources.length}
function edit(cell,id){if(roomSession){roomSession.edit([...cell,id]);return true}if(world.set(...cell,id)){pending.set(cell.join(','),[...cell,id]);const [x,y,z]=cell;
 if(lampBlock(id))lampChecks.set(cell.join(','),cell);
 if(lampBlock(world.at(x,y+1,z)))lampChecks.set([x,y+1,z].join(','),[x,y+1,z]);return true}}
function checkLampBlocks(){
 for(const [key,cell] of lampChecks){
   const [x,y,z]=cell,id=world.at(x,y,z);
   if(id===null)continue;
   lampChecks.delete(key);
   if(lampBlock(id)&&!world.solid(x,y-1,z)&&edit(cell,0)){
     const drop={id,count:1,p:[x+.5,y+.5,z+.5],ready:Date.now()+500};meta.drops.push(drop);showDrop(drop);
   }
 }
}
function findHit(){if(!world||!player)return;const o=player.p.clone();o.y+=fixtures.seatEye(player);const d=new T.Vector3();camera.getWorldDirection(d);ray.set(o,d);ray.far=7;const block=target(world,o,d);hit=block?{...block,kind:'block',key:block.cell.join(',')}:null;const h=land.harvest(ray,hit?.distance??7);if(h)hit={...h,kind:'plant',key:'v'+h.key,plantKey:h.key};const h2=ray.intersectObjects(root.children,true)[0];if(h2&&h2.distance<(hit?.distance??7)){let obj=h2.object;while(obj&&!obj.userData.record)obj=obj.parent;if(obj)hit={kind:'prop',obj,distance:h2.distance,key:obj.uuid}}hit=actors.hit(ray,hit?.distance??7)||hit;highlight.visible=hit?.kind==='block';if(highlight.visible)highlight.position.set(...hit.cell).addScalar(.5);
 const useLabel=meta.slots[selected]==='flashlight'?(flashlightOn?'Släck':'Tänd'):player.seat?'Res dig':hit?.kind==='animal'?'Mata':hit?.kind==='prop'?({chair:'Sitt',bed:'Vila',door:'Öppna / stäng',chest:'Öppna'})[hit.obj.userData.record.id]:null;
 const buildButton=$('build');if(buildButton.textContent!==(useLabel||'Bygg'))buildButton.textContent=useLabel||'Bygg';
}
function effects(pos,color){const arr=new Float32Array(18*3);for(let i=0;i<arr.length;i+=3){arr[i]=(Math.random()-.5)*.8;arr[i+1]=Math.random()*.7;arr[i+2]=(Math.random()-.5)*.8}glints.geometry.dispose();glints.geometry=new T.BufferGeometry();glints.geometry.setAttribute('position',new T.BufferAttribute(arr,3));glints.position.copy(pos);glints.material.color.set(color||'#baa882');glints.visible=true;glints.userData.until=elapsed+.3}
function animateAct(a){actionName=a;actionTime=elapsed+.44}
let removeTarget = null;

function removeAimedTarget() {
 if (!active()) return;
 findHit();
 if (hit?.kind !== 'block' && hit?.kind !== 'prop') {
   toast('Sikta på ett block eller föremål');
   return;
 }
 if (roomSession && hit.kind === 'prop') {
   toast('I ett delat rum kan du ta bort block');
   return;
 }
 removeTarget = hit.key;
 mining(0);
}

function mining(dt){
 if (removeTarget !== null && hit?.key !== removeTarget) removeTarget = null;
 if (!active() || !hit || (!mineHeld && removeTarget === null)) return;
 const id=meta.slots[selected],tool=durability[id]&&meta.bag[id]>0?id:null;if(roomSession&&!['block','plant'].includes(hit.kind))return;if(hit.key!==mineKey){mineTime=0;mineKey=hit.key;audio.effect('dig',defs[hit.id]?.sound)}
 if(hit.kind==='animal'){
   const result=actors.attack(hit.key);if(!result)return;
   animateAct('use');audio.effect('dig');toast(result.message);
   if(result.drop){for(const item of [result.drop,result.egg].filter(Boolean)){const drop={...item,ready:Date.now()+600};meta.drops.push(drop);showDrop(drop)}hit=null;mineHeld=false;checkpoint()}
   return;
 }
 const hard=hit.kind==='block'?defs[hit.id].hardness:1,softPlant=hit.kind==='plant'?['flowers','shrub','reeds','roots','mushroom'].includes(hit.id):hit.kind==='prop'?['flowers','shrub','reeds','roots','mushroom'].includes(hit.obj.userData.record.id):defs[hit.id]?.category==='Vegetation',
 delay=softPlant||(removeTarget!==null&&meta.mode==='creative')?0:meta.mode==='creative'?.38:Math.min(2.4,.63+hard*.24)/(tool?1.6:1);
 if(!softPlant&&performance.now()-lastBreak<280)return;mineTime+=dt;highlight.material.color.set(mineTime>delay*.45?0xff9b52:0xffe6a1);animateAct(hit.kind==='plant'?'chop':'dig');if(mineTime<delay)return;
 removeTarget=null;
 
 if(meta.mode==='survival'&&hit.kind==='block'&&hit.id>=76&&hit.id<=87&&tool!=='pickaxe'){mineHeld=false;toast('Använd en bergshacka för att ta loss malmen');return}
 if(roomSession&&hit.kind==='plant'){harvestRoomPlant({...hit},tool);return}
 let drop,amount=1;const at=new T.Vector3();
 if(hit.kind==='block'){if(hit.cell[1]===0){mineHeld=false;toast('Du har nått berggrunden');return}const key=hit.cell.join(',');if(meta.containers?.[key]&&Object.values(meta.containers[key].items||{}).some(v=>v>0)){toast('Töm lådan först');mineHeld=false;return}if(!edit(hit.cell,0))return;if(meta.containers)delete meta.containers[key];if(meta.crops)delete meta.crops[key];drop=defs[hit.id].drop||hit.id;at.set(...hit.cell).addScalar(.5)}
 if(hit.kind==='plant'){removed.add(hit.plantKey);land.refresh();drop=({oak:4,pine:42,palm:50,rocks:3,shrub:'apple',log:4,reeds:75})[hit.id]||11;amount=['oak','pine','palm'].includes(hit.id)?4:1;at.set(hit.x,world.surface(hit.x,hit.z),hit.z)}
 if(hit.kind==='prop'){const rec=hit.obj.userData.record;if(player.boat===hit.obj){toast('Kliv ur båten först');mineHeld=false;return}if(player.seat===hit.obj&&!fixtures.dismount(player))return;if(rec.items&&Object.values(rec.items).some(v=>v>0)){toast('Töm lådan först');mineHeld=false;return}drop=rec.id;at.copy(hit.obj.position);root.remove(hit.obj);meta.props.splice(meta.props.indexOf(rec),1);refreshLights()}
 if(meta.mode==='survival'){add(drop,amount);if(hit.kind==='plant'){if(['oak','pine','palm'].includes(hit.id))add(({oak:5,pine:64,palm:65})[hit.id],2);if(hit.id==='shrub')add(70);if(hit.id==='flowers')add(71);if(hit.id==='roots')add(74)}if(tool){meta.wear[tool]=(meta.wear[tool]??durability[tool])-1;if(meta.wear[tool]<=0){add(tool,-1);delete meta.wear[tool];toast('Verktyget är utslitet')}}}
 lastBreak=performance.now();effects(at,defs[drop]?.color);audio.effect('break',defs[drop]?.sound);mineTime=0;mineKey='';hit=null;lastHit=0;bar()}
function harvestRoomPlant(target,tool){
 if(harvesting.has(target.plantKey))return;
 const session=roomSession,state=meta;harvesting.add(target.plantKey);mineTime=0;mineKey='';hit=null;lastBreak=performance.now();
 session.harvest(target.plantKey).then(accepted=>{
  if(!accepted||session!==roomSession||state!==meta)return;
  const drop=({oak:4,pine:42,palm:50,rocks:3,shrub:'apple',log:4,reeds:75})[target.id]||11;
  if(meta.mode==='survival'){
   add(drop,['oak','pine','palm'].includes(target.id)?4:1);
   if(['oak','pine','palm'].includes(target.id))add(({oak:5,pine:64,palm:65})[target.id],2);
   if(target.id==='shrub')add(70);if(target.id==='flowers')add(71);if(target.id==='roots')add(74);
   if(tool){meta.wear[tool]=(meta.wear[tool]??durability[tool])-1;if(meta.wear[tool]<=0){add(tool,-1);delete meta.wear[tool];toast('Verktyget är utslitet')}}
  }
  effects(new T.Vector3(target.x,world.surface(target.x,target.z),target.z),defs[drop]?.color);audio.effect('break',defs[drop]?.sound);bar();checkpoint();
 }).catch(()=>{if(session===roomSession)toast('Skörden kunde inte sparas. Försök igen.')}).finally(()=>harvesting.delete(target.plantKey));
}
function nearBench(){if(root.children.some(o=>o.userData.record?.id==='workbench'&&o.position.distanceTo(player.p)<5))return true;const p=player.p;for(let x=-3;x<=3;x++)for(let y=-2;y<=2;y++)for(let z=-3;z<=3;z++)if(world.at(p.x+x,p.y+y,p.z+z)===136)return true;return false}
let lastBuild=-Infinity,lastBreak=-Infinity;
function use(){if(!active()||performance.now()-lastBuild<360)return;findHit();const id=meta.slots[selected],s=meta.mode==='survival';
 if(id==='map'){if(s&&!meta.bag[id])return toast('Du behöver en karta');suspend();const d=showMap(world,player.p,roomSession?.players()||[]);d.addEventListener('close',resume,{once:true});return}
 if(String(id).startsWith('outfit_')){if(s&&!meta.bag[id])return toast('Tillverka kläderna först');settings.outfit=id==='outfit_sailor'?'sailor':'explorer';configure();player.third=true;toast('Du bytte till '+name(id).toLowerCase());return}
 if(player.boat){player.boat=null;player.p.y=21.5;player.v=4;toast('Du lämnade båten');return}
 if(id==='boat'&&hit?.obj?.userData.record?.id!=='boat'){
  if(roomSession)return toast('Båtar finns i egna världar');if(s&&!meta.bag.boat)return toast('Tillverka en båt först');
  for(let r=2;r<=6;r+=.5){const x=player.p.x-Math.sin(player.yaw)*r,z=player.p.z-Math.cos(player.yaw)*r;if(!boatWater(world,x,z))continue;
   const rec={id:'boat',p:[x,20.85,z],rot:player.yaw};meta.props.push(rec);attach(rec);if(s)add(id,-1);lastBuild=performance.now();bar();checkpoint();toast('Båten är sjösatt. Sikta på den och tryck Bygg för att åka.');return}
  return toast('Sikta mot öppet vatten nära stranden');
 }
 if(id==='flashlight'){if(s&&!meta.bag[id])return toast('Du behöver en ficklampa i ryggsäcken');flashlightOn=!flashlightOn;lastBuild=performance.now();toast(flashlightOn?'Ficklampan är tänd':'Ficklampan är släckt');return}if(player.seat){if(!fixtures.dismount(player))toast('Frigör plats bredvid stolen');return}
 if(hit?.kind==='animal'){
   if(s&&['apple','bread','viltmat'].includes(id)&&!(meta.bag[id]>0))return toast('Du behöver mat i ryggsäcken');
   const result=actors.feed(hit.key,id);toast(result.message);
   if(result.ok){lastBuild=performance.now();if(s)add(id,-1);bar();checkpoint()}return;
 }
 if(hit?.kind==='prop'){const rec=hit.obj.userData.record;if(rec.id==='boat'){player.boat=hit.obj;player.p.set(hit.obj.position.x,21.15,hit.obj.position.z);player.fly=false;toast('Ro med joysticken eller WASD. Hoppa för att kliva ur.');return}if(rec.id==='campfire'){if(meta.bag.potato>0){add('potato',-1);add('baked_potato',1);bar();checkpoint();toast('Du bakade en potatis över elden')}else toast('En varm brasa. Lägg potatis i ryggsäcken för att tillaga den.');return}if(rec.id==='chair'){toast(fixtures.mount(player,hit.obj)?'Du sitter. Hoppa eller gå för att resa dig.':'Gå närmare stolen och lämna plats bredvid den.');return}if(rec.id==='chest'||rec.id==='shelf')return ui.chest(rec);if(rec.id==='door'){rec.open=!rec.open;hit.obj.rotation.y=rec.rot+(rec.open?Math.PI/2:0);return}if(rec.id==='bed')return ui.bed(()=>{meta.time=.28;meta.life=10;toast('Det är morgon');checkpoint()});if(rec.id==='planter'){if(!rec.crop){rec.crop=Date.now();toast('Sått! Kom tillbaka om en minut.')}else if(Date.now()-rec.crop>60000){add('bread',2);rec.crop=0;toast('Skördat! Två bröd i ryggsäcken.');bar()}else toast('Det växer fortfarande');return}}
 const nutrition=id===faunaFood.id?faunaFood.nutrition:consumables[id];if(nutrition){if(s&&!(meta.bag[id]>0))return toast('Du behöver mat i ryggsäcken');if(s)add(id,-1);meta.food=Math.min(10,meta.food+nutrition);lastBuild=performance.now();audio.effect('eat');animateAct('use');toast('Du åt '+name(id).toLocaleLowerCase('sv'));bar();checkpoint();return}
 if(roomSession&&!defs[id])return toast('Välj ett byggblock');if(!roomSession&&hit?.kind==='block'){const k=hit.cell.join(',');
 if(hit.id===137){meta.containers??={};if(!meta.containers[k]){const h=world.info(hit.cell[0],hit.cell[2]).height;const natural=!world.edits.get(Math.floor(hit.cell[0]/16)+','+Math.floor(hit.cell[2]/16))?.has(k)&&hit.cell[1]<h-4;meta.containers[k]={items:natural?{79:2,82:1,bread:1}:{}}}return ui.chest(meta.containers[k])}
 if(hit.id===138){meta.crops??={};if(!meta.crops[k]){meta.crops[k]=Date.now();toast('Sått! Skörda om en minut.')}else if(Date.now()-meta.crops[k]>60000){add('bread',2);delete meta.crops[k];bar();toast('Två bröd i ryggsäcken')}else toast('Grödan växer');return}}
 if(s&&!(meta.bag[id]>0)){toast('Samla eller tillverka '+name(id));return}if(id==='rod'){let water=false;const dir=new T.Vector3();camera.getWorldDirection(dir);for(let i=.25;i<8;i+=.25){const q=player.p.clone();q.y+=eye;q.addScaledVector(dir,i);const t=world.at(q.x,q.y,q.z);if(t===25){water=true;break}if(t)break}if(!water)return toast('Sikta mot vatten för att meta');if(elapsed-fishAt<3)return toast('Vänta tills flötet dyker');fishAt=elapsed;audio.effect('splash');animateAct('use');if(s){meta.food=Math.min(10,meta.food+2);meta.wear.rod=(meta.wear.rod??durability.rod)-1;if(meta.wear.rod<=0){add('rod',-1);delete meta.wear.rod}}toast('Napp! Fisken ger två matpoäng.');bar();return}

 const furniture=hit?.kind==='prop'&&id==='lantern'&&['table','slab','workbench'].includes(hit.obj.userData.record.id)?hit.obj:null;
 if(!furniture&&hit?.kind!=='block')return toast('Sikta på en blockyta');
 const p=furniture?[Math.floor(furniture.position.x),furniture.position.y+1,Math.floor(furniture.position.z)]:hit.prev;if(p[1]<0||p[1]>=80||Math.abs(player.p.x-p[0]-.5)<.79&&Math.abs(player.p.z-p[2]-.5)<.79&&player.p.y<p[1]+1&&player.p.y+1.75>p[1])return;
 if(defs[id]){if(lampBlock(+id)&&!world.solid(p[0],p[1]-1,p[2]))return toast('Lampan behöver stöd under sig');if(!edit(p,+id))return}else{if(durability[id])return toast('Håll Gräv för att använda verktyget');const record={id,p:[p[0]+.5,p[1],p[2]+.5],rot:Math.round(player.yaw/(Math.PI/2))*Math.PI/2};if(id==='door'&&(p[1]>=79||world.at(p[0],p[1]+1,p[2])!==0))return toast('Dörren behöver två fria block på höjden');
 if(id==='lantern'){const ground=fixtures.locateLantern(record,player);if(!ground)return toast('Lyktan behöver ett ledigt underlag');record.p=ground}
 if(meta.props.some(o=>o.p.every((v,i)=>v===record.p[i])))return;meta.props.push(record);attach(record)}lastBuild=performance.now();if(s)add(id,-1);audio.effect('place',defs[id]?.sound);animateAct('build');bar()}
function switchMode(){if(roomSession)return toast('Skaparen har valt '+(meta.mode==='creative'?'kreativt läge':'överlevnad')+' för hela världen');meta.mode=meta.mode==='survival'?'creative':'survival';player.fly=false;bar();toast(meta.mode==='creative'?'Kreativt läge':'Överlevnadsläge')}
function damage(n){if(meta.mode!=='survival'||meta.difficulty==='Lätt')return;meta.life-=n;audio.effect('hurt');animateAct('hurt');if(meta.life<=0){player.p.fromArray(spawn(world));player.v=0;meta.life=meta.food=10;waiting=true;toast('Du vaknar vid din startplats')}}
function frame(now){requestAnimationFrame(frame);const ms=now-(frame.last||now),dt=Math.min(.1,ms/1000);frame.last=now;if(!world||suspended)return;if(!waiting)graphics.sample(ms,now);elapsed+=Math.min(.5,ms/1000);const p=player.p;world.update(p.x,p.z,radius());roomSession?.frame(dt,p,player.yaw);if(world.error){$('loading').hidden=true;suspend();toast(world.error);ui.pause();return}if(waiting){for(const dx of [-16,0,16])for(const dz of [-16,0,16])if(world.at(p.x+dx,0,p.z+dz)===null)return;$('loading').hidden=true;while(occupied(world,p)&&p.y<80)p.y+=.25;waiting=false}
 updateDrops(dt);const keys=input.read(dt);if(player.seat&&(keys.f||keys.r||keys.up))fixtures.dismount(player);if(!rowBoat(player,world,keys,dt)&&!player.seat)move(player,world,dt,keys,meta.mode,speed=>{if(speed>14)damage(Math.ceil((speed-14)/4))},p=>fixtures.collides(p),p=>stepHeight(root,p));
 camera.rotation.set(player.pitch,player.yaw,0);camera.position.copy(p);camera.position.y+=fixtures.seatEye(player);const eyePos=camera.position.clone();
 if(player.third){const back=new T.Vector3(0,0,1).applyQuaternion(camera.quaternion);for(let r=.12;r<=3.8;r+=.12){const test=eyePos.clone().addScaledVector(back,r);if(world.solid(test.x,test.y,test.z)||fixtures.collides(test,.06,.1))break;camera.position.copy(test)}}
 if(handModel){handModel.visible=!player.third;const swing=mineHeld?Math.sin(elapsed*15):elapsed<actionTime?Math.sin((actionTime-elapsed)*7):0;handModel.rotation.set(-.22+swing*.5,.15,-.35+swing*.16);handModel.position.y=-.41+(player.moving?.015*Math.sin(elapsed*9):0)}
 camera.updateMatrixWorld();companions.update({players:roomSession?.players()??null,position:p,yaw:player.yaw,camera});const hasFlashlight=meta.slots[selected]==='flashlight'&&(meta.mode==='creative'||meta.bag.flashlight>0);flashlightLight.visible=flashlightOn&&hasFlashlight;if(flashlightLight.visible){flashlightLight.position.copy(eyePos);const direction=new T.Vector3();camera.getWorldDirection(direction);flashlightTarget.position.copy(eyePos).addScaledVector(direction,10);flashlightTarget.updateMatrixWorld()}meta.time=(meta.time+dt/720)%1;const info=world.info(p.x,p.z),night=meta.time<.23||meta.time>.78,under=p.y+3<info.height,sub=world.at(p.x,p.y+eye,p.z)===25;
 const wstep=Math.floor(meta.time*15);if(wstep!==weatherStep){weatherStep=wstep;const n=hash(wstep,info.biome,world.seed);weather=n<.51?'clear':n<.68?'cloud':n<.79?'fog':info.biome===4?'snow':n>.95?'storm':'rain'}
 world.clock.value=elapsed;sky.update({position:camera.position,time:meta.time,weather,quality:graphics.level,underground:under,underwater:sub});scene.fog.density=Math.max(scene.fog.density,1.44/(radius()*16));land.update(p.x,p.z);nature.update(dt,p,!!meta.quiet);for(const o of root.children){const flame=o.getObjectByName('flame');if(flame)flame.scale.y=1+Math.sin(elapsed*9)*.12}actors.update(dt,{x:p.x,y:p.y+eye,z:p.z,yaw:player.yaw,moving:player.moving,thirdPerson:player.third,outfit:settings.outfit,night,quiet:!!meta.quiet,action:player.seat?'rest':elapsed<actionTime?actionName:player.swim?'swim':!player.grounded&&!player.fly?'jump':player.moving?(keys.sprint?'run':'walk'):'idle'});fixtures.poseSeated(scene,player);
 if(elapsed-lastHit>.09){findHit();lastHit=elapsed}if(mineHeld||removeTarget!==null)mining(dt);if(glints.visible){glints.position.y+=dt*.42;if(elapsed>glints.userData.until)glints.visible=false}
 if(player.moving&&elapsed-lastStep>.43&&!player.fly){audio.effect(player.swim?'splash':'step',defs[world.at(p.x,p.y-.08,p.z)]?.sound);lastStep=elapsed;if(meta.mode==='survival'&&meta.difficulty!=='Lätt')meta.food=Math.max(0,meta.food-(meta.difficulty==='Utmanande'?.02:.01))}
 if(elapsed-lastPanel>1){lastPanel=elapsed;checkLampBlocks();fixtures.settleLanterns(obj=>{
 const rec=obj.userData.record;meta.props.splice(meta.props.indexOf(rec),1);root.remove(obj);
 const drop={id:rec.id,count:1,p:[...rec.p],ready:Date.now()+500};meta.drops.push(drop);showDrop(drop);
 });refreshLights();$('region').textContent=biomes[info.biome]+' · '+(night?'Natt':'Dag');$('stats').textContent=meta.mode==='creative'?'Kreativt'+(player.fly?' · Flygläge':''):'♥ '+Math.ceil(meta.life)+'/10  ·  Mat '+Math.ceil(meta.food)+'/10';audio.setScene({biome:biomes[info.biome],weather,night,creative:meta.mode==='creative',underwater:sub,underground:under});if(meta.food<=0||world.at(p.x,p.y+.25,p.z)===26)damage(.5);if(meta.food>8)meta.life=Math.min(10,meta.life+.025)}
 if(elapsed-lastSave>8){lastSave=elapsed;save().catch(()=>toast('Kunde inte spara. Kontrollera ledigt utrymme.'))}renderer.render(scene,camera)}
const ready=Promise.all([fetch(base+'blocks/registry.json').then(r=>r.json()),loadProps(T).then(withFaunaFood).then(eggKit).then(withFlashlight).then(k=>withExtraFood(T,k)).then(k=>withEquipment(T,k)),new T.TextureLoader().loadAsync(base+'blocks/atlas.png'),fetch(base+'props/manifest.json').then(r=>r.json())]).then(([r,k,a,props])=>{reg=r;kit=k;atlas=a;atlas.colorSpace=T.SRGBColorSpace;atlas.magFilter=T.NearestFilter;atlas.minFilter=T.NearestFilter;atlas.generateMipmaps=false;catalog=[...equipment,...reg.blocks,faunaFood,flashlight,...extraFoods,...eggs,...props.assets.map(p=>p.id==='door'?{...p,name:'Trädörr'}:p)];lookup=Object.fromEntries(catalog.map(v=>[v.id,v]));defs=Object.fromEntries(reg.blocks.map(v=>[v.id,v]))});
ui=panels({hatch:selection=>{if(roomSession)return {ok:false,message:'Varelselabbet finns i egna världar.'};const mix=mixEggs(selection,meta.bag,meta.mode==='creative');const result=actors.hatch(mix.seed,player.p);if(result.ok){if(meta.mode!=='creative')for(const [id,n] of mix.entries)add(id,-n);audio.effect('craft');bar();checkpoint()}return result},shared:()=>!!roomSession,fullscreen:bindFullscreen($('fullscreen'),toast),start,save,home,refreshHome,suspend,resume,toast,defs:()=>defs,propIds:()=>kit.ids,settings,configure,meta:()=>meta,name,icon,checkpoint,slotIndex:()=>selected,setSlot:slot,bagChanged:bar,catalog:()=>roomSession?catalog.filter(item=>defs[item.id]||item.id==='flashlight'||item.category==='Mat'||item.category==='Verktyg'):catalog,sound:n=>audio.effect(n),pick:id=>{meta.slots[selected]=id;bar()},nearBench,switchMode,blueprint:op=>{if(roomSession)return 'Bygg ett block i taget i rummet.';findHit();if(hit?.kind!=='block')return 'Sikta på ett block först.';return op==='mark'?clip.mark(hit.cell):clip.paste(hit.prev)},craft:r=>{if(meta.mode==='survival'){if(r.station&&!nearBench()||Object.entries(r.needs).some(([k,n])=>(meta.bag[k]||0)<n))return;for(const [k,n] of Object.entries(r.needs))add(k,-n)}add(r.out,r.count);audio.effect('craft');bar()}});
addEventListener('resize',resize);addEventListener('pagehide',()=>save().catch(()=>{}));document.addEventListener('visibilitychange',()=>{if(document.hidden&&meta){save().catch(()=>{});if(active())ui.pause()}});
ready.then(async()=>{try{await db.migrate()}catch{toast('En äldre sparfil kunde inte importeras')}await refreshHome();if($('play-fullscreen'))$('play-fullscreen').disabled=false}).catch(e=>toast('Kunde inte läsa speldata: '+e.message));

async function enableRooms(){
 const open=$('together');
 if(!open)return;
 const {server}=await fetch('./network/config.json',{cache:'no-store'}).then(r=>r.json());
 if(!server)return;
 open.hidden=false;
 open.onclick=()=>ui.lobby(async options=>{
  const {connect}=await import('./network/client.js?v=kompis3');
  await connect(server,options,{
   scene:()=>scene,
   async start(code,edits,session,roomSettings){
    await ready;await save();roomSession?.close();roomSession=null;
    const m=db.fresh('Rum '+code,roomSettings.mode,code,roomSettings.difficulty);m.quiet=roomSettings.quiet;m.roomCode=code;m.removed=[...(session.removed||[])];restoreRoomProgress(m);roomSession=session;
    try{await start(m,edits);ui.close()}catch(e){session.close();roomSession=null;throw e}
   },
   harvest(key){removed.add(key);land?.refresh()},
   edit(cell){
    if(world.set(...cell))return;
    world.record(...cell);
    const dirty=new Set();world.markNeighbors(cell[0],cell[2],dirty);
    for(const k of dirty)world.revs.set(k,(world.revs.get(k)||0)+1);
   },
   status(code,owner,locked){
    const b=$('room-info');b.hidden=false;b.disabled=!owner;
    b.textContent='Rum '+code+(owner?(locked?' · Lås upp':' · Lås rum'):'');
    b.title=(meta.mode==='survival'?'Överlevnad':'Kreativt')+(meta.quiet?' · Utan djur':' · Med djur');
    b.onclick=()=>roomSession?.lock();
    try{localStorage.setItem('bv-last-room',code)}catch{}
   },
   async lost(){await home();ui.close();toast('Anslutningen bröts. Gå med igen med samma rumskod.')}
  });
 });
}
enableRooms().catch(()=>{});
