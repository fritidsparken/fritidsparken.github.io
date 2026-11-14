import * as THREE from './vendor/three.module.js';
import {createCourse,CartPhysics} from './minecart-track.js';
import {buildCave} from './cave-environment.js';
import {buildCart} from './minecart-model.js';
import {buildRails} from './minecart-rails.js';
const $=id=>document.getElementById(id),reader=window.storyReader($('line'),$('retry'));
const names=['Lyktgången','Blådjupet','Kristallvalvet','Koppargruvan','Flöjtens källa'];
const opening=[
 {speaker:'caveVoice',clip:[0,7.45],text:'När väktaren föll hörde jag Laleh ropa. Flöjten hade glidit ur mitt bälte och försvunnit ner i grottan.'},
 {speaker:'caveVoice',clip:[7.45,14.2],text:'Ur mörkret steg tre toner. Vår melodi. Laleh kände igen den direkt.'},
 {speaker:'caveVoice',clip:[14.2,18.9],text:'Följ ekot till den gröna källan, sa hon. Jag möter dig där.'}
];
const ending=[
 {speaker:'navid',text:'Laleh! Jag hittade din flöjt. Men hur hittade du mig?'},
 {speaker:'laleh',text:'Du visslade våra tre toner hela vägen. Jag har känt igen den melodin sedan vi var små.'},
 {speaker:'navid',text:'Hon tar min hand. Vi spelar tillsammans. Vattnet rinner tillbaka under månporten, ända ut till djungelns rötter.'},
 {speaker:'laleh',text:'Hör du, Navid? Fåglarna sjunger igen. Nu går vi hem. Tillsammans.'}
];
const KEY='lostWorlds.minecart3d.v1',clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
let level=Number.isInteger(saved.level)?clamp(saved.level,0,4):0,seen=!!saved.seen,completed=!!saved.completed,outro=!!saved.outro;
let renderer,scene,camera,cart,course,physics,cave,rails,previous,current,mode='loading',last=0,acc=0,time=0,distance=0,lastCP='',lastRespawns=0;
const STEP=1/90,held=new Set(),pointers={accelerate:new Set(),brake:new Set()},pos=new THREE.Vector3(),tan=new THREE.Vector3(),orientation=new THREE.Quaternion(),targetQ=new THREE.Quaternion(),forward=new THREE.Vector3(0,0,1),up=new THREE.Vector3(0,1,0);
let lamp,lampTarget,notified=0;
function persist(){try{localStorage.setItem(KEY,JSON.stringify({level,seen,completed,outro,cp:physics?.snapshotCheckpoint()}));localStorage.setItem('lostWorlds.cave','1')}catch{}}
function clearInput(){held.clear();for(const id of ['accelerate','brake']){pointers[id].clear();$(id).classList.remove('pressed')}}
function ui(state){mode=state;$('menu').hidden=!['loading','ready','pause','finished','error'].includes(state);$('story').hidden=state!=='story';$('hud').hidden=state!=='run';$('controls').hidden=state!=='run';$('junction').hidden=true;$('notice').hidden=true;if(state!=='run')clearInput()}
function panel(state,title,desc,button){ui(state);$('title').textContent=title;$('desc').textContent=desc;$('go').textContent=button;$('go').disabled=state==='loading'}
function enter(){ui('run');last=performance.now();acc=0;$('chapter').textContent='FLÖJTENS EKO · '+(level+1)+' / 5';$('place').textContent=names[level];$('score').volume=.18;$('score').play().catch(()=>{})}
function tell(lines,end,done){ui('story');$('story').classList.toggle('end',end);$('score').volume=.08;reader.start(lines,done)}
function happyEnd(){outro=false;completed=true;persist();$('score').pause();panel('finished','Tillsammans igen','Navid och Laleh har hittat hem med flöjten.','Åk igen')}
async function advance(){persist();if(level===4){outro=true;persist();tell(ending,true,happyEnd)}else{level++;panel('loading','Nästa grotta','Öppnar passagen…','Vänta');buildLevel();await cave.ready;persist();panel('ready',names[level],'Dörren öppnas. Nästa passage väntar längre in i berget.','Nästa grotta')}}
function snap(){current=physics.snapshot();previous=current;orientation.setFromUnitVectors(forward,new THREE.Vector3(current.tangent.x,current.tangent.y,current.tangent.z).normalize());acc=0;lastRespawns=current.respawns;distance=0}
function buildLevel(cp){cave?.dispose();rails?.dispose();course=createCourse(level);physics=new CartPhysics(course);if(cp)physics.restoreCheckpoint(cp);cave=buildCave(THREE,scene,course,level);rails=buildRails(THREE,scene,course);snap();lastCP=JSON.stringify(physics.snapshotCheckpoint())}
function select(side){if(mode!=='run')return;physics.choose(side);updateHUD(physics.snapshot())}
function pause(){if(mode==='run'){panel('pause','Paus','Vagnen väntar. Fortsätt när du är redo.','Fortsätt');$('score').pause();persist()}}
$('pause').onclick=pause;$('skip').onclick=()=>reader.skip();
$('go').onclick=()=>{if(mode==='error'){location.reload();return}if(mode==='pause'){enter();return}if(completed){level=0;completed=outro=seen=false;buildLevel();persist()}if(outro){tell(ending,true,happyEnd);return}if(!seen)tell(opening,false,()=>{seen=true;persist();enter()});else enter()};
for(const [id,side]of [['left',-1],['right',1]])$(id).addEventListener('pointerdown',e=>{e.preventDefault();select(side)});
for(const id of ['accelerate','brake']){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();pointers[id].add(e.pointerId);b.setPointerCapture(e.pointerId);b.classList.add('pressed')});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{pointers[id].delete(e.pointerId);b.classList.toggle('pressed',pointers[id].size>0)})}
$('jump').addEventListener('pointerdown',e=>{e.preventDefault();if(mode==='run')physics.jump()});
addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s',' ','r','escape'].includes(key)){e.preventDefault();held.add(key);if(key==='escape'){pause();return}if(mode!=='run')return;if(key==='arrowleft'||key==='a')select(-1);if(key==='arrowright'||key==='d')select(1);if(key===' '&&!e.repeat)physics.jump();if(key==='r'&&!e.repeat){physics.restart();snap();persist()}}});
addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
function updateHUD(s){$('distance').value=s.progress;$('speed').textContent=Math.round(s.speed*3.6)+' km/h';const pending=s.pending;$('junction').hidden=!pending;
 if(pending){$('junctionText').textContent=s.choice===-1?'Vänster spår valt':s.choice===1?'Höger spår valt':'Välj spår';$('junctionHint').textContent=Math.max(0,Math.ceil(pending.distance/Math.max(s.speed,1)))+' sekunder till växeln';}
 for(const [id,side]of [['left',-1],['right',1]]){$(id).classList.toggle('selected',s.choice===side);$(id).setAttribute('aria-pressed',String(s.choice===side))}
 $('jump').hidden=!s.canJump&&!s.jumpQueued;const route=course.routeMap?.get?.(s.routeId)||course.routeMap?.[s.routeId];const fork=route?.fork;const chosen=fork&&s.choice?(s.choice===fork.safeSide?fork.safeRoute:fork.deadRoute):null;rails.highlight(pending?chosen:null);
 if(s.canJump&&!pending){$('notice').hidden=false;$('notice').textContent='Avbrott i spåret · Hoppa'}else if(s.status==='falling'){$('notice').hidden=false;$('notice').textContent=''}else if(notified>0){$('notice').hidden=false;$('notice').textContent='Tillbaka vid checkpoint'}else $('notice').hidden=true;
}
function tick(){previous=current;physics.update(STEP,{accelerate:held.has('arrowup')||held.has('w')||pointers.accelerate.size>0,brake:held.has('arrowdown')||held.has('s')||pointers.brake.size>0});current=physics.snapshot();distance+=current.speed*STEP;notified=Math.max(0,notified-STEP);
 if(current.respawns!==lastRespawns){snap();notified=1.5;persist()}const cp=JSON.stringify(physics.snapshotCheckpoint());if(cp!==lastCP){lastCP=cp;persist()}if(current.status==='finished'){advance().catch(e=>{console.error(e);panel('error','Nästa grotta kunde inte öppnas','Ett spelmaterial kunde inte laddas. Försök igen.','Försök igen')});return}updateHUD(current);
}
function draw(dt,alpha){if(!current)return;const a=previous,b=current;pos.set(THREE.MathUtils.lerp(a.position.x,b.position.x,alpha),THREE.MathUtils.lerp(a.position.y,b.position.y,alpha)+.16,THREE.MathUtils.lerp(a.position.z,b.position.z,alpha));tan.set(THREE.MathUtils.lerp(a.tangent.x,b.tangent.x,alpha),THREE.MathUtils.lerp(a.tangent.y,b.tangent.y,alpha),THREE.MathUtils.lerp(a.tangent.z,b.tangent.z,alpha)).normalize();targetQ.setFromUnitVectors(forward,tan);orientation.slerp(targetQ,1-Math.exp(-dt*18));cart.group.position.copy(pos);cart.group.quaternion.copy(orientation);cart.update(time,distance,b.speed);
 // Cart and camera share the same orientation. There is no sideways camera lag.
 const portrait=innerWidth<innerHeight;const offset=new THREE.Vector3(0,portrait?3.6:3.4,portrait?-8.3:-6.8).applyQuaternion(orientation);camera.position.copy(pos).add(offset);camera.up.copy(up);camera.lookAt(pos.clone().add(new THREE.Vector3(0,1.65,1.0).applyQuaternion(orientation)));
 lamp.position.copy(pos).add(new THREE.Vector3(0,3,-1).applyQuaternion(orientation));lampTarget.position.copy(pos).addScaledVector(tan,14);lampTarget.position.y+=1.5;cave.update(time,pos);$('fallshade').style.opacity=b.status==='falling'?Math.min(.85,Math.max(0,(-pos.y-25)/35)):0;renderer.render(scene,camera);
}
function frame(now){const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;if(mode==='run'){time+=dt;acc+=dt;while(acc>=STEP&&mode==='run'){acc-=STEP;tick()}}draw(dt,mode==='run'?clamp(acc/STEP,0,1):1);requestAnimationFrame(frame)}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.4:1.65));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?64:64;camera.updateProjectionMatrix()}
async function init(){try{renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(64,1,.08,220);cart=buildCart(THREE);scene.add(cart.group);lamp=new THREE.SpotLight(0xffd1a0,85,48,.72,.6,1.5);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-.001;lampTarget=new THREE.Object3D();scene.add(lamp,lampTarget);lamp.target=lampTarget;
 const arrived=new URLSearchParams(location.search).get('from')==='aqueduct';if(arrived){level=0;seen=completed=outro=false}buildLevel(arrived?null:saved.cp);await cave.ready;resize();addEventListener('resize',resize);persist();panel(completed?'finished':'ready',completed?'Tillsammans igen':'Flöjtens eko',completed?'Navid och Laleh har hittat hem.':'Vagnen rullar automatiskt. Välj spår före växeln, gasa på rakorna och bromsa inför kurvorna. Hoppa när spåret bryts. Håll dig på rätt väg genom berget.',completed?'Åk igen':'Starta färden');if(arrived){history.replaceState(null,'',location.pathname);$('go').onclick()}last=performance.now();requestAnimationFrame(frame);
 }catch(e){console.error(e);panel('error','Grottan kunde inte öppnas',renderer?'Ett spelmaterial kunde inte laddas. Kontrollera anslutningen och försök igen.':'Den här banan behöver WebGL 2. Kontrollera webbläsarens grafikstöd och försök igen.','Försök igen')}}
init();
