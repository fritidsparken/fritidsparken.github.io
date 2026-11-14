import * as THREE from './vendor/three.module.js';
import {createCourse,CartPhysics,COURSE_NAMES,COURSE_COUNT} from './minecart-track.js?v=world-picker-20261114';
import {buildCave} from './cave-environment.js?v=world-picker-20261114';
import {buildCart} from './minecart-model.js?v=world-picker-20261114';
import {buildRails} from './minecart-rails.js?v=world-picker-20261114';
import {createCartCamera} from './minecart-camera.js?v=world-picker-20261114';
import {CoinState,buildCoins} from './minecart-coins.js?v=world-picker-20261114';
import {createCartAudio} from './minecart-audio.js?v=world-picker-20261114';
import {createOutroMotion} from './outro-motion.js?v=world-picker-20261114';
const $=id=>document.getElementById(id),reader=window.storyReader($('line'),$('retry'));
const names=COURSE_NAMES, MAIN_MENU='https://fritidsparken.se/games/prince-of-persia/';
const opening=[
 {speaker:'caveVoice',clip:[0,7.45],text:'När väktaren föll hörde jag Laleh ropa. Flöjten hade glidit ur mitt bälte och försvunnit ner i grottan.'},
 {speaker:'caveVoice',clip:[7.45,14.2],text:'Ur mörkret steg tre toner. Vår melodi. Laleh kände igen den direkt.'},
 {speaker:'caveVoice',clip:[14.2,18.9],text:'Följ ekot till den gröna källan, sa hon. Jag möter dig där.'}
];
const ending=[
 {speaker:'reunionVoice',clip:[0,Infinity],image:'echo-art/finale-1.webp',text:'Bakom den stora dörren väntade Laleh. Min syster log och höll fram flöjten som jag hade förlorat. Jag hade följt dess eko genom hela berget. Nu var vi äntligen tillsammans igen.'},
 {speaker:'melodyVoice',clip:[0,Infinity],image:'echo-art/finale-2.webp',text:'Jag lyfte flöjten och spelade vår gamla melodi. Tre toner räckte. Ljuset vaknade i berget, och vattnet började strömma igen. Genom månens akvedukt, ut till djungelns rötter. Den förlorade världen hade fått sitt hjärta tillbaka.'},
 {speaker:'homeVoice',clip:[0,Infinity],image:'echo-art/finale-3.webp',text:'När solen steg gick vi genom Solporten, sida vid sida. Framför oss väntade vårt hem. Bakom oss sjöng berget, vattnet och skogen samma melodi. Jag var inte längre vilse. Jag hade hittat min syster, och tillsammans hade vi hittat hem.'}
];
const KEY='lostWorlds.minecart3d.v2',clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
let level=Number.isInteger(saved.level)?clamp(saved.level,0,COURSE_COUNT-1):0;
let seen=!!saved.seen,completed=!!saved.completed,outro=!!saved.outro;
let unlocked=saved.completed?COURSE_COUNT-1:Math.max(level,Number.isInteger(saved.unlocked)?clamp(saved.unlocked,0,COURSE_COUNT-1):0);
let coinBank=saved.coins&&typeof saved.coins==='object'?saved.coins:{};
let renderer,scene,camera,followCamera,cart,course,physics,cave,rails,coinState,coins,previous,current;
let mode='loading',last=0,acc=0,time=0,distance=0,lastCP='',lastRespawns=0,doorSounded=false;
const sound=createCartAudio(),motion=createOutroMotion($('outroCanvas'),{imageElement:$('storyArt')});
const STEP=1/90,pos=new THREE.Vector3(),tan=new THREE.Vector3(),orientation=new THREE.Quaternion(),targetQ=new THREE.Quaternion(),forward=new THREE.Vector3(0,0,1);
let lamp,lampTarget,notified=0,musicTarget=0,endingTimer=0;
function totalCoins(){return Object.values(coinBank).reduce((n,ids)=>n+(Array.isArray(ids)?new Set(ids).size:0),0)}
function persist(){
 if(coinState)coinBank[level]=coinState.exportIds();
 try{localStorage.setItem(KEY,JSON.stringify({level,unlocked,seen,completed,outro,coins:coinBank,cp:physics?.snapshotCheckpoint()}));localStorage.setItem('lostWorlds.cave','1')}catch{}
}
function music(volume){musicTarget=volume;if(volume>0)$('score').play().catch(()=>{})}
function ui(state){
 mode=state;$('menu').hidden=!['loading','ready','pause','error'].includes(state);
 $('story').hidden=state!=='story'&&state!=='fading';$('hud').hidden=state!=='run';$('controls').hidden=state!=='run';$('notice').hidden=true;
 sound.setActive(state==='run');
 if(state!=='story'&&state!=='fading')motion.stop();
}
function panel(state,title,desc,button){ui(state);$('title').textContent=title;$('desc').textContent=desc;$('go').textContent=button;$('go').disabled=state==='loading';$('levelSelect').disabled=['loading','error'].includes(state)}
function enter(){
 ui('run');last=performance.now();acc=0;$('chapter').textContent='FLÖJTENS EKO · '+(level+1)+' / '+COURSE_COUNT;$('place').textContent=names[level];music(.18);updateHUD(current);
}
function tell(lines,end,done){
 ui('story');$('story').classList.toggle('end',end);music(end?.065:.06);
 reader.start(lines,done,(cue,index)=>{
  if(cue.image){$('storyArt').src=cue.image;$('storyArt').alt='Navid och Laleh återförenas och hittar hem';$('storyArt').hidden=false;motion.show(cue.image,index).catch?.(()=>{})}
  else{$('storyArt').hidden=true;motion.stop()}
 });
}
function showEndScreen(animate=true){
 clearTimeout(endingTimer);const end=$('endingScreen');end.hidden=false;end.classList.remove('revealed','complete');
 if(animate){ui('fading');void end.offsetWidth;end.classList.add('revealed');music(0);endingTimer=setTimeout(()=>{ui('finished');end.classList.add('complete');$('score').pause();$('playAgain').focus?.()},3500)}
 else{ui('finished');end.classList.add('revealed','complete');$('score').pause();musicTarget=0}
}
function happyEnd(){outro=false;completed=true;persist();showEndScreen(true)}
$('playAgain').onclick=()=>{
 clearTimeout(endingTimer);sound.setActive(false);motion.stop();$('score').pause();
 try{localStorage.setItem(KEY,JSON.stringify({level:0,unlocked,seen:false,completed:false,outro:false,coins:{}}))}catch{}
 location.href=MAIN_MENU;
};
async function advance(){
 persist();if(level===COURSE_COUNT-1){outro=true;persist();tell(ending,true,happyEnd)}
 else{level++;unlocked=Math.max(unlocked,level);panel('loading','Nästa grotta','Öppnar passagen…','Vänta');buildLevel();await Promise.all([cave.ready,cart.ready]);persist();panel('ready',names[level],'Dörren är öppen. Nästa passage väntar längre in i berget.','Nästa grotta')}
}
function snap(){followCamera?.reset();current=physics.snapshot();previous=current;orientation.setFromUnitVectors(forward,new THREE.Vector3(current.tangent.x,current.tangent.y,current.tangent.z).normalize());acc=0;lastRespawns=current.respawns;distance=0}
function buildLevel(cp){
 $('levelSelect').value=level;coins?.dispose();cave?.dispose();rails?.dispose();course=createCourse(level);physics=new CartPhysics(course);if(cp)physics.restoreCheckpoint(cp);
 cave=buildCave(THREE,scene,course,level);rails=buildRails(THREE,scene,course);coinState=new CoinState(course,Array.isArray(coinBank[level])?coinBank[level]:[]);coins=buildCoins(THREE,scene,course,coinState);
 doorSounded=false;snap();lastCP=JSON.stringify(physics.snapshotCheckpoint());
}
function select(side){if(mode!=='run')return;sound.resume();physics.choose(side);updateHUD(physics.snapshot())}
function pause(){if(mode==='run'){panel('pause','Paus','Vagnen väntar. Fortsätt när du är redo.','Fortsätt');$('score').pause();persist()}}
$('skip').onclick=()=>reader.skip();
$('go').onclick=async()=>{
 sound.resume();
 try{
  if(mode==='error'){location.reload();return}if(mode==='pause'){enter();return}
  if(completed){showEndScreen(false);return}
  if(outro){tell(ending,true,happyEnd);return}
  if(!seen)tell(opening,false,()=>{seen=true;persist();enter()});else enter();
 }catch(e){console.error(e);panel('error','Grottan kunde inte laddas','Ett spelmaterial kunde inte laddas. Försök igen.','Försök igen')}
};
for(const [id,side]of [['left',-1],['right',1]])$(id).addEventListener('pointerdown',e=>{e.preventDefault();select(side)});
$('jump').addEventListener('pointerdown',e=>{e.preventDefault();if(mode==='run'){sound.resume();physics.jump();updateHUD(physics.snapshot())}});
addEventListener('keydown',e=>{
 const key=e.key.toLowerCase();if(!['arrowleft','arrowright','a','d',' ','r','escape'].includes(key)||mode!=='run'&&key!=='escape')return;
 e.preventDefault();if(key==='escape'){pause();return}if(mode!=='run')return;sound.resume();
 if(key==='arrowleft'||key==='a')select(-1);if(key==='arrowright'||key==='d')select(1);if(key===' '&&!e.repeat)physics.jump();if(key==='r'&&!e.repeat){physics.restart();snap();persist()}
});
addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();sound.setActive(false);$('score').pause()}else if(mode==='story')music(.065)});
function updateHUD(s){
 $('distance').value=s.progress;$('speed').textContent=Math.round(s.speed*3.6)+' km/h';
 const score=coinState.summary(time);$('coinCount').textContent=score.displayCourseCount;$('coinTotal').textContent='/ '+score.courseTotal;$('coinHud').style.transform='scale('+score.hudScale+')';
 for(const [id,side]of [['left',-1],['right',1]]){$(id).classList.toggle('selected',s.choice===side);$(id).setAttribute('aria-pressed',String(s.choice===side))}
 $('jump').disabled=!s.canJump||s.jumpQueued;$('jump').classList.toggle('ready',s.canJump&&!s.jumpQueued);$('jump').classList.toggle('queued',s.jumpQueued);$('jumpLabel').textContent=s.jumpQueued?'Hopp valt':'Hoppa';
 const route=course.routeMap.get(s.routeId),fork=route?.fork,chosen=fork&&s.choice?(s.choice===fork.safeSide?fork.safeRoute:fork.deadRoute):null;rails.highlight(s.pending?chosen:null);
 if(s.nextGap&&s.nextGap.distance>=0&&s.nextGap.distance<=40&&s.status==='run'){
  $('notice').hidden=false;$('notice').classList.toggle('urgent',s.canJump);$('notice').textContent=s.jumpQueued?'HOPP VALT ✓':s.canJump?'HOPPA NU!':'HOPP OM '+Math.max(0,Math.ceil(s.nextGap.distance))+' M';
 }else if(notified>0){$('notice').hidden=false;$('notice').textContent='Tillbaka vid checkpoint'}else $('notice').hidden=true;
}
function tick(){
 previous=current;physics.update(STEP);current=physics.snapshot();distance+=current.speed*STEP;notified=Math.max(0,notified-STEP);
 const collected=coinState.collect(previous,current,time);if(collected.length){coins.pickup(collected);for(const item of collected)sound.coin(item.combo||1);persist()}
 if(current.respawns!==lastRespawns){snap();notified=1.5;persist()}
 const cp=JSON.stringify(physics.snapshotCheckpoint());if(cp!==lastCP){lastCP=cp;persist()}
 if(current.status==='finished'){advance().catch(e=>{console.error(e);panel('error','Nästa grotta kunde inte öppnas','Ett spelmaterial kunde inte laddas. Försök igen.','Försök igen')});return}
 updateHUD(current);
}
function draw(dt,alpha){
 if(!current||!['run','ready','pause','loading'].includes(mode))return;
 const a=previous,b=current;pos.set(THREE.MathUtils.lerp(a.position.x,b.position.x,alpha),THREE.MathUtils.lerp(a.position.y,b.position.y,alpha)+.16,THREE.MathUtils.lerp(a.position.z,b.position.z,alpha));
 tan.set(THREE.MathUtils.lerp(a.tangent.x,b.tangent.x,alpha),THREE.MathUtils.lerp(a.tangent.y,b.tangent.y,alpha),THREE.MathUtils.lerp(a.tangent.z,b.tangent.z,alpha)).normalize();targetQ.setFromUnitVectors(forward,tan);orientation.slerp(targetQ,1-Math.exp(-dt*18));cart.group.position.copy(pos);cart.group.quaternion.copy(orientation);
 cart.update(time,Math.max(0,distance-b.speed*STEP*(1-alpha)),mode==='run'?b.speed:0,mode==='run'?dt:0);followCamera.update(pos,orientation,b.status,dt,innerWidth<innerHeight);
 lamp.position.copy(pos).add(new THREE.Vector3(0,3,-1).applyQuaternion(orientation));lampTarget.position.copy(pos).addScaledVector(tan,14);lampTarget.position.y+=1.5;cave.update(time,pos);
 if(mode==='run'&&!doorSounded&&pos.distanceTo(new THREE.Vector3(course.finish.x,course.finish.y,course.finish.z))<26){doorSounded=true;sound.door()}
 const hud=$('coinHud').getBoundingClientRect();coins.update(time,b,camera,{x:(hud.left+hud.width*.5)/innerWidth*2-1,y:1-(hud.top+hud.height*.5)/innerHeight*2});
 $('fallshade').style.opacity=b.status==='falling'?Math.min(.5,Math.max(0,(b.fallTime-1.8)*.65)):0;renderer.render(scene,camera);
}
function frame(now){
 const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;
 if(mode==='run'){time+=dt;acc+=dt;while(acc>=STEP&&mode==='run'){acc-=STEP;tick()}}
 const score=$('score');score.volume+= (musicTarget-score.volume)*(1-Math.exp(-dt*(mode==='fading'?1.5:3)));
 if(current)sound.update(dt,current,mode);draw(dt,mode==='run'?clamp(acc/STEP,0,1):1);requestAnimationFrame(frame);
}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.4:1.65));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=64;camera.updateProjectionMatrix();motion.resize()}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(64,1,.08,220);followCamera=createCartCamera(THREE,camera);cart=buildCart(THREE);scene.add(cart.group);lamp=new THREE.SpotLight(0xffd1a0,85,48,.72,.6,1.5);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-.001;lampTarget=new THREE.Object3D();scene.add(lamp,lampTarget);lamp.target=lampTarget;
  const arrival=new URLSearchParams(location.search),arrived=arrival.get('from')==='aqueduct';
  const resumeArrival=arrived&&arrival.get('resume')==='1'&&saved.seen===true;
  if(arrived&&!resumeArrival){level=0;seen=completed=outro=false;coinBank={}}
  const requested=arrival.has('stage')?Number(arrival.get('stage')):NaN;
  const selected=arrival.get('from')==='menu'&&Number.isInteger(requested)&&requested>=0&&requested<=unlocked;
  if(selected){level=requested;completed=outro=false;if(level>0)seen=true}
  buildLevel(arrived&&!resumeArrival||selected?null:saved.cp);await Promise.all([cave.ready,cart.ready]);resize();addEventListener('resize',resize);persist();$('score').volume=0;
  if(completed)showEndScreen(false);else panel('ready','Flöjtens eko','Tio grottor. En väg hem. Vagnen kör automatiskt. Samla mynt, välj spår och hoppa när rälsen bryts.','Starta färden');
  if(arrived){history.replaceState(null,'',location.pathname);$('go').onclick()}else if(selected){history.replaceState(null,'',location.pathname);enter()}
  last=performance.now();requestAnimationFrame(frame);
 }catch(e){console.error(e);panel('error','Grottan kunde inte öppnas',renderer?'Ett spelmaterial kunde inte laddas. Kontrollera anslutningen och försök igen.':'Den här banan behöver WebGL 2. Kontrollera webbläsarens grafikstöd och försök igen.','Försök igen')}
}
for(const [i,name] of names.entries()){const option=document.createElement('option');option.value=i;option.textContent=(i+1)+' · '+name;$('levelSelect').append(option)}
$('levelSelect').value=level;
$('levelSelect').addEventListener('change',async()=>{
 if(coinState)coinBank[level]=coinState.exportIds();level=Number($('levelSelect').value);completed=outro=false;$('endingScreen').hidden=true;clearTimeout(endingTimer);
 panel('loading',names[level],'Laddar grottan…','Vänta');try{buildLevel();await Promise.all([cave.ready,cart.ready]);persist();panel('ready',names[level],'Samla mynt. Välj spår före växeln och hoppa vid rälsens avbrott.','Starta färden')}catch(e){console.error(e);panel('error','Grottan kunde inte laddas','Försök igen.','Försök igen')}
});
init();
