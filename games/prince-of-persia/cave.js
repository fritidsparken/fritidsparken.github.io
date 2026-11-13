"use strict";
const $=id=>document.getElementById(id),canvas=$('view'),ctx=canvas.getContext('2d');
const art={},reader=storyReader($('line'),$('retry'));
const opening=[
 {speaker:'caveVoice',clip:[0,7.45],text:'När väktaren föll hörde jag Laleh ropa. Flöjten hade glidit ur mitt bälte och försvunnit ner i grottan.'},
 {speaker:'caveVoice',clip:[7.45,14.2],text:'Ur mörkret steg tre toner. Vår melodi. Laleh kände igen den direkt.'},
 {speaker:'caveVoice',clip:[14.2,18.9],text:'Följ ekot till den gröna källan, sa hon. Jag möter dig där.'},
 {speaker:'caveVoice',clip:[18.9,22.83],text:'Jag drog åt min röda mantel och sprang in i berget.'}
];
const ending=[
 {speaker:'navid',text:'Laleh! Jag hittade din flöjt. Men hur hittade du mig?'},
 {speaker:'laleh',text:'Du visslade våra tre toner hela vägen. Jag har känt igen den melodin sedan vi var små.'},
 {speaker:'navid',text:'Hon tar min hand. Vi spelar tillsammans. Vattnet rinner tillbaka under månporten, ända ut till djungelns rötter.'},
 {speaker:'laleh',text:'Hör du, Navid? Fåglarna sjunger igen. Nu går vi hem. Tillsammans.'}
];
const passages=[
 ['Lyktgången',112,[[23,-1,0],[39,1,0],[57,0,1],[77,-1,1],[95,0,0]]],
 ['Blådjupet',134,[[22,1,1],[37,0,0],[52,-1,0],[70,1,0],[88,0,1],[107,-1,0],[121,1,1]]],
 ['Kristallvalvet',143,[[24,-1,0],[41,0,1],[55,1,0],[70,0,0],[87,-1,1],[102,1,0],[120,0,1],[133,-1,0]]],
 ['Koppargruvan',155,[[21,0,0],[36,1,1],[51,-1,0],[66,0,1],[81,1,0],[98,-1,1],[113,0,0],[130,1,1],[144,-1,0]]],
 ['Flöjtens källa',168,[[24,0,1],[40,1,0],[55,-1,0],[70,0,1],[86,-1,0],[101,1,1],[116,0,0],[132,-1,1],[149,1,0]]]
];
// Crossing spacing follows the jungle course, scaled to this world's forward speed.
const crossings=passages.map((room,i)=>{
 const start=31+i*3,step=(10+i*.55)*.85,count=6+Math.floor(i/2);
 const pads=Array.from({length:count},(_,j)=>({at:start+step*(.82+j),lane:(j%2?-.46:.46)*(i%2?1:-1)}));
 return {start,end:pads[count-1].at+step*.82,pads,radius:.86-i*.045,halfLength:2.15-i*.1};
});
const traps=passages.map((room,i)=>room[2].filter(([at])=>at<crossings[i].start-4||at>crossings[i].end+4));
// A dark pressure bed becomes visible before its anchored spikes rise.
const beds=passages.map((room,i)=>({at:crossings[i].start-11,lane:i%2?-.8:.8}));
function spikeLift(bed){return clamp((z-bed.at+8)/3,0,1)}
function supported(pit,at,lane){
 if(at<=pit.start||at>=pit.end)return true;
 return pit.pads.some(p=>((at-p.at)/pit.halfLength)**2+((lane-p.lane)/pit.radius)**2<=1);
}
function fallBack(){recovery=.58;notice=1.5;$('copy').textContent='Tillbaka vid senaste fästet';$('copy').hidden=false}
const key='lostWorlds.cave.v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{}}catch{}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let level=Number.isInteger(saved.level)?clamp(saved.level,0,4):0;
let checkpoint=Number.isFinite(saved.cp)?clamp(saved.cp,0,passages[level][1]-10):0;
let introSeen=saved.introSeen==='brage',completed=!!saved.completed,outroPending=!!saved.outroPending;
let mode='loading',z=checkpoint,x=0,height=0,vy=0,speed=0,stride=0,last=0,acc=0;
let stickX=0,stickY=0,wantJump=false,recovery=0,notice=0;
const held=new Set();
function persist(){try{localStorage.setItem(key,JSON.stringify({level,cp:checkpoint,introSeen:introSeen?'brage':false,completed,outroPending}));localStorage.setItem('lostWorlds.cave','1')}catch{}}
function clearInput(){held.clear();stickX=stickY=0;wantJump=false}
function reset(){const pit=crossings[level];if(checkpoint>pit.start-2&&checkpoint<pit.end+1)checkpoint=Math.max(0,pit.start-5);z=checkpoint;x=height=vy=speed=stride=recovery=0;clearInput()}
function ui(state){
  mode=state;$('menu').hidden=!['loading','ready','pause','finished','error'].includes(state);
  $('story').hidden=state!=='story';$('hud').hidden=state!=='run';$('touch').hidden=state!=='run';
  if(state!=='run'){$('copy').hidden=true;clearInput()}
}
function panel(state,title,desc,action){
  ui(state);$('title').textContent=title;$('desc').textContent=desc;$('go').textContent=action;$('go').disabled=state==='loading';
}
function enterRun(){
  ui('run');last=performance.now();acc=0;
  $('chapter').textContent='FLÖJTENS EKO · '+(level+1)+' / 5';$('place').textContent=passages[level][0];
  $('score').volume=.22;$('score').play().catch(()=>{});
}
function tell(lines,end,done){
  ui('story');$('story').classList.toggle('end',end);$('score').volume=.09;$('score').play().catch(()=>{});
  reader.start(lines,done);$('skip').focus();
}
function finishStory(){completed=true;outroPending=false;persist();$('score').pause();panel('finished','Tillsammans igen','Navid och Laleh har kommit hem med flöjten.','Spela om värld 4')}
function showEnding(){tell(ending,true,finishStory)}
function pause(){if(mode==='run'){$('score').pause();panel('pause',passages[level][0],'Ditt senaste fäste är sparat.','Fortsätt')}}
$('skip').onclick=()=>reader.skip();$('pause').onclick=pause;
$('go').onclick=()=>{
 if(mode==='error'){location.reload();return}
 if(mode==='pause'){enterRun();return}
 if(completed){level=0;checkpoint=0;introSeen=completed=outroPending=false;reset();persist()}
 if(outroPending){showEnding();return}
 if(!introSeen){tell(opening,false,()=>{introSeen=true;persist();enterRun()});return}
 enterRun();
};
addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();$('score').pause()}else if(mode==='story')$('score').play().catch(()=>{})});
addEventListener('keydown',e=>{
 if(e.code==='Escape')pause();
 if(mode!=='run'||!['ArrowUp','KeyW','ArrowDown','KeyS','ArrowLeft','KeyA','ArrowRight','KeyD','Space'].includes(e.code))return;
 e.preventDefault();held.add(e.code);if(e.code==='Space'&&!e.repeat)wantJump=true;
});
addEventListener('keyup',e=>held.delete(e.code));
function steer(e){
 const r=$('stick').getBoundingClientRect();
 stickX=clamp((e.clientX-r.left-r.width/2)/(r.width*.36),-1,1);
 stickY=clamp((r.top+r.height/2-e.clientY)/(r.height*.36),-1,1);
}
$('stick').onpointerdown=e=>{$('stick').setPointerCapture(e.pointerId);steer(e)};
$('stick').onpointermove=e=>{if($('stick').hasPointerCapture(e.pointerId))steer(e)};
$('stick').onlostpointercapture=()=>{stickX=stickY=0};
$('jump').onpointerdown=e=>{e.preventDefault();wantJump=true};
const down=(a,b)=>held.has(a)||held.has(b);
function update(dt){
 if(notice>0 && (notice-=dt)<=0)$('copy').hidden=true;
 if(recovery>0){recovery-=dt;if(recovery<=0)reset();return}
 const forward=clamp(stickY+Number(down('ArrowUp','KeyW'))-Number(down('ArrowDown','KeyS')),-1,1);
 const sideways=clamp(stickX+Number(down('ArrowRight','KeyD'))-Number(down('ArrowLeft','KeyA')),-1,1);
 const target=forward>0?forward*(10+level*.55):0;
 speed+=(target-speed)*Math.min(1,dt*(forward<0?13:5));
 x=clamp(x+sideways*dt*2.8,-1.38,1.38);
 if(wantJump && height===0){vy=6.2;height=.001}wantJump=false;
 if(height>0){height=Math.max(0,height+vy*dt);vy-=15*dt;if(!height)vy=0}
 const old=z;z+=speed*dt;stride+=speed*dt*.23;
 const pit=crossings[level];
 if(!height&&!supported(pit,z,x)){fallBack();return}
 if(z>=pit.end+1 && checkpoint<pit.end+1){checkpoint=pit.end+1;persist()}
 const bed=beds[level];
 if(Math.abs(z-bed.at)<.82 && Math.abs(x-bed.lane)<.42 && height<.7){fallBack();return}
 for(const [at,lane,bar] of traps[level]){
   if(old<=at+.9 && z>=at-.9 && Math.abs(x-lane)<(bar?.57:.49) && height<(bar?.59:1.9)){
     fallBack();return;
   }
 }
 const milestone=Math.floor(z/40)*40;
 const near=traps[level].find(([at])=>Math.abs(at-milestone)<5);
 const safe=near?Math.max(milestone,near[0]+4):milestone;
 if((safe<pit.start-3||safe>pit.end+1) && z>=safe && safe>checkpoint && safe<=passages[level][1]-10){checkpoint=safe;persist()}
 $('distance').value=Math.min(1,z/passages[level][1]);
 if(z<passages[level][1])return;
 if(level<4){level++;checkpoint=0;reset();persist();enterRun()}
 else{outroPending=true;persist();showEnding()}
}
async function loadImage(id){
 if(art[id])return;const im=new Image();im.src='echo-art/'+id+'.webp';
 await im.decode();art[id]=im;
}
const feet=477, horizon=252;
// One fixed camera per cave. Only absolute course coordinates determine the projected footprint.
function project(at){
 const scale=1/(1+at/42);
 return {scale,y:horizon+(feet-horizon)*scale};
}
function sidePos(lane,scale){return 480+lane*177*scale}
function drawObstacle(at,lane,low){
 const p=project(at),xx=sidePos(lane,p.scale),s=p.scale;
 const im=art[low?'beam':'rock'],w=(low?179:132)*s,h=w*im.height/im.width;
 ctx.fillStyle='rgba(13,11,14,.45)';ctx.beginPath();ctx.ellipse(xx,p.y,w*.49,7*s,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(im,xx-w/2,p.y-h,w,h);
}
function drawBed(bed){
 const p=project(bed.at),cx=sidePos(bed.lane,p.scale),sz=p.scale,k=spikeLift(bed);
 ctx.save();ctx.translate(cx,p.y);ctx.scale(sz,sz);ctx.fillStyle='#50463f';ctx.beginPath();ctx.ellipse(0,0,66,5,0,0,Math.PI*2);ctx.fill();
 for(let i=-2;i<=2;i++){const lx=i*21;ctx.fillStyle='#c0aa85';ctx.beginPath();ctx.moveTo(lx-5,0);ctx.lineTo(lx,-(4+31*k));ctx.lineTo(lx+5,0);ctx.fill()}
 ctx.restore();
}
function drawCrossing(pit){
 const near=project(pit.start),far=project(pit.end);
 ctx.beginPath();
 for(const [j,p,l] of [[0,near,-1.96],[1,far,-1.96],[2,far,1.96],[3,near,1.96]])ctx[j?'lineTo':'moveTo'](sidePos(l,p.scale),p.y);
 ctx.closePath();ctx.save();ctx.clip();
 const shade=ctx.createLinearGradient(0,far.y,0,near.y);
 shade.addColorStop(0,'#57463c');shade.addColorStop(.18,'#241f25');shade.addColorStop(.72,'#101117');shade.addColorStop(1,'#332d31');
 ctx.fillStyle=shade;ctx.fillRect(0,far.y,960,near.y-far.y);
 for(const pad of [...pit.pads].reverse()){
  const p=project(pad.at),cx=sidePos(pad.lane,p.scale),rx=177*pit.radius*p.scale,ry=(project(pad.at-pit.halfLength).y-project(pad.at+pit.halfLength).y)/2;
  const shaft=ctx.createLinearGradient(cx-rx,0,cx+rx,0);shaft.addColorStop(0,'#4c3930');shaft.addColorStop(.35,'#806650');shaft.addColorStop(1,'#28252a');
  ctx.fillStyle=shaft;ctx.fillRect(cx-rx,p.y,rx*2,near.y-p.y);
  ctx.beginPath();ctx.ellipse(cx,p.y,rx,ry,0,0,Math.PI*2);ctx.fillStyle='#ae9778';ctx.fill();
  ctx.save();ctx.clip();const stone=art.rock;ctx.globalAlpha=.64;ctx.drawImage(stone,stone.width*.28,stone.height*.50,stone.width*.43,stone.height*.17,cx-rx,p.y-ry,rx*2,ry*2);ctx.restore();
 }
 ctx.restore();
}
function drawPlayer(){
 const p=project(z),s=p.scale,xx=sidePos(x,s),bottom=p.y-height*50*s;
 ctx.fillStyle='rgba(9,13,17,.38)';ctx.beginPath();ctx.ellipse(xx,p.y,(27-height*3)*s,6*s,0,0,Math.PI*2);ctx.fill();
 const h=151*s,w=h*290/300;
 if(height>0){const im=art['jump'+(vy>3?0:vy>0?1:vy>-3?2:3)];ctx.drawImage(im,xx-w/2,bottom-h,w,h)}
 else{const frame=Math.floor(stride*40)%40;ctx.drawImage(art['run-cycle'],frame%8*200,Math.floor(frame/8)*210,200,210,xx-w/2,bottom-h,w,h)}
}
function drawGoal(){
 const p=project(passages[level][1]),xx=sidePos(0,p.scale),s=p.scale;
 ctx.save();ctx.translate(xx,p.y);ctx.scale(s,s);
 ctx.strokeStyle='#e7bc73';ctx.fillStyle='rgba(246,195,108,.19)';ctx.lineWidth=4;
 ctx.beginPath();ctx.ellipse(0,0,280,14,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(level===4){
  ctx.rotate(-.12);ctx.fillStyle='#ffda8f';ctx.fillRect(-27,-5,54,6);
  ctx.fillStyle='#53442a';for(let i=-2;i<=2;i++)ctx.fillRect(6*i,-4,2,2);
 }
 ctx.restore();
}
function render(){
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 const im=outroPending||completed?art.ending:art['cave'+level];if(!im)return;
 const v=Math.min(Math.max(w/960,h/540),w/565);
 const ox=(w-960*v)/2,oy=h*.86-feet*v;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#10181f';ctx.fillRect(0,0,canvas.width,canvas.height);
 // Portrait keeps the whole control lane in view while the cavern fills the screen.
 const fill=Math.max(w/im.width,h/im.height),bw=im.width*fill,bh=im.height*fill;
 const dx=(w-bw)/2,dy=clamp(oy+horizon*v-bh*.46,h-bh,0);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.drawImage(im,dx,dy,bw,bh);
 if(outroPending||completed)return;
 ctx.setTransform(v*dpr,0,0,v*dpr,ox*dpr,oy*dpr);
 if(!art["run-cycle"])return;
 drawGoal();drawCrossing(crossings[level]);
 const obstacles=traps[level];for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i][0]>=z)drawObstacle(...obstacles[i]);
 if(beds[level].at>=z)drawBed(beds[level]);
 drawPlayer();if(beds[level].at<z)drawBed(beds[level]);for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i][0]<z)drawObstacle(...obstacles[i]);
 if(recovery>0){ctx.fillStyle='rgba(63,25,22,'+Math.min(.38,recovery)+')';ctx.fillRect(0,0,960,540)}
}
function frame(now){
 if(mode==='run'){acc+=Math.min(.08,(now-last)/1000);while(acc>=1/90&&mode==='run'){acc-=1/90;update(1/90)}}
 last=now;render();requestAnimationFrame(frame);
}
Promise.all([...passages.map((_,i)=>'cave'+i),'ending','rock','beam','run-cycle',...Array.from({length:4},(_,i)=>'jump'+i)].map(loadImage)).then(()=>{
 const arrived=new URLSearchParams(location.search).get('from')==='aqueduct';
 if(arrived){level=0;checkpoint=0;introSeen=completed=outroPending=false}
 reset();persist();panel(completed?'finished':'ready',completed?'Tillsammans igen':'Flöjtens eko',completed?'Navid och Laleh har kommit hem.':'Håll upp för att springa in i grottan. Styr åt sidorna och hoppa med mellanslag eller hoppknappen. Ned bromsar.',completed?'Spela om':'Fortsätt');
 if(arrived){
   history.replaceState(null,'',location.pathname+location.hash);
   $('go').onclick();
 }
 requestAnimationFrame(frame);
}).catch(()=>panel('error','Grottan kunde inte öppnas','Kontrollera anslutningen och försök igen.','Försök igen'));
