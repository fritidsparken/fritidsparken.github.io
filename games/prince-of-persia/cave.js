"use strict";
const $=id=>document.getElementById(id),canvas=$('view'),ctx=canvas.getContext('2d');
const art={},reader=storyReader($('line'),$('retry'));
const opening=[
 {speaker:'laleh',text:'Navid! När väktaren föll ryckte vattnet flöjten ur ditt bälte. Jag såg den blänka i tunneln.'},
 {speaker:'navid',text:'Din flöjt! Det var den som ledde mig till dig. Jag hämtar den innan källan stiger.'},
 {speaker:'laleh',text:'Följ ekot genom berget. Där du hör den tredje tonen finns en grön källa. Jag möter dig där.'}
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
const key='lostWorlds.cave.v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{}}catch{}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let level=Number.isInteger(saved.level)?clamp(saved.level,0,4):0;
let checkpoint=Number.isFinite(saved.cp)?clamp(saved.cp,0,passages[level][1]-10):0;
let introSeen=!!saved.introSeen,completed=!!saved.completed,outroPending=!!saved.outroPending;
let mode='loading',z=checkpoint,x=0,height=0,vy=0,speed=0,stride=0,time=0,last=0,acc=0;
let stickX=0,stickY=0,wantJump=false,recovery=0,camX=0,notice=0;
const held=new Set();
function persist(){try{localStorage.setItem(key,JSON.stringify({level,cp:checkpoint,introSeen,completed,outroPending}));localStorage.setItem('lostWorlds.cave','1')}catch{}}
function clearInput(){held.clear();stickX=stickY=0;wantJump=false}
function reset(){z=checkpoint;x=camX=height=vy=speed=stride=recovery=0;clearInput()}
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
 time+=dt;
 if(notice>0 && (notice-=dt)<=0)$('copy').hidden=true;
 if(recovery>0){recovery-=dt;if(recovery<=0)reset();return}
 const forward=clamp(stickY+Number(down('ArrowUp','KeyW'))-Number(down('ArrowDown','KeyS')),-1,1);
 const sideways=clamp(stickX+Number(down('ArrowRight','KeyD'))-Number(down('ArrowLeft','KeyA')),-1,1);
 const target=forward>0?forward*(10+level*.55):0;
 speed+=(target-speed)*Math.min(1,dt*(forward<0?13:5));
 x=clamp(x+sideways*dt*2.8,-1.38,1.38);camX+=(x-camX)*(1-Math.exp(-dt*5));
 if(wantJump && height===0){vy=6.2;height=.001}wantJump=false;
 if(height>0){height=Math.max(0,height+vy*dt);vy-=15*dt;if(!height)vy=0}
 const old=z;z+=speed*dt;stride+=speed*dt*.23;
 for(const [at,lane,bar] of passages[level][2]){
   if(old<=at+.9 && z>=at-.9 && Math.abs(x-lane)<(bar?.57:.49) && height<(bar?.59:1.9)){
     recovery=.58;notice=1.5;$('copy').textContent='Tillbaka vid senaste fästet';$('copy').hidden=false;return;
   }
 }
 const milestone=Math.floor(z/40)*40;
 const near=passages[level][2].find(([at])=>Math.abs(at-milestone)<5);
 const safe=near?Math.max(milestone,near[0]+4):milestone;
 if(z>=safe && safe>checkpoint && safe<=passages[level][1]-10){checkpoint=safe;persist()}
 $('distance').value=Math.min(1,z/passages[level][1]);
 if(z<passages[level][1])return;
 if(level<4){level++;checkpoint=0;reset();persist();enterRun()}
 else{outroPending=true;persist();showEnding()}
}
async function loadImage(id){
 if(art[id])return;const im=new Image();im.src='echo-art/'+id+'.webp';
 await im.decode();art[id]=im;
}
const width=960, horizon=222, feet=477;
function project(depth){const scale=5/(5+Math.max(-.5,depth));return {scale,y:horizon+(feet-horizon)*scale}}
function sidePos(lane,scale){return 480-camX*28+(lane*177-camX*42)*scale}
function line(ax,ay,bx,by,color,w){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke()}
function drawPath(){
 // Repeated stone joints converge at the same vanishing point as the wall art.
 for(let d=90-z%5;d>-.5;d-=5){
  const p=project(d);ctx.globalAlpha=.08+.16*p.scale;
  line(sidePos(-1.8,p.scale),p.y,sidePos(1.8,p.scale),p.y,'#c7bca3',.8+p.scale);
 }
 ctx.globalAlpha=1;
}
function drawObstacle(at,lane,low){
 const d=at-z;if(d< -1.45||d>85)return;
 const p=project(d),xx=sidePos(lane,p.scale),s=p.scale;
 const im=art[low?'beam':'rock'];const w=(low?179:132)*s,h=w*im.height/im.width;
 ctx.fillStyle='rgba(13,11,14,.45)';ctx.beginPath();ctx.ellipse(xx,p.y,w*.49,8*s,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(im,xx-w/2,p.y-h,w,h);
}
function drawWalls(){
 const block=Math.floor(z/9);
 for(let i=block+10;i>=block;i--){
   for(const sign of [-1,1]){
     const depth=i*9+(sign>0?4:0)-z;
     if(depth<-.4)continue;
     const p=project(depth), offset=2.13+.23*Math.sin(i*9+sign*11);
     const xx=sidePos(sign*offset,p.scale),yy=p.y,s=p.scale;
     const im=art.rock,h=(100+23*Math.cos(i*3+sign))*s,w=h*im.width/im.height;
     ctx.globalAlpha=Math.min(.93,.45+s);
     ctx.drawImage(im,xx-w/2,yy-h,w,h);ctx.globalAlpha=1;
     if((i+(sign>0?1:0))%3)continue;
     const flameY=yy-h*.63;
     const glow=ctx.createRadialGradient(xx,flameY,0,xx,flameY,44*s);
     glow.addColorStop(0,'#ffe5aabd');glow.addColorStop(.3,'#ffab514d');glow.addColorStop(1,'#f5ae6800');
     ctx.fillStyle=glow;ctx.fillRect(xx-44*s,flameY-44*s,88*s,88*s);
     ctx.fillStyle='#ffdc95';ctx.beginPath();ctx.ellipse(xx,flameY,2.4*s,(5+Math.sin(time*7+i))*s,0,0,Math.PI*2);ctx.fill();
   }
 }
}
function drawPlayer(){
 const xx=sidePos(x,1),b=feet-height*50;
 ctx.fillStyle='rgba(9,13,17,.38)';ctx.beginPath();ctx.ellipse(xx,feet+1,27-height*3,6,0,0,Math.PI*2);ctx.fill();
 let id;if(height>0)id='jump'+(vy>3?0:vy>0?1:vy>-3?2:3);else id='run'+(Math.floor(stride*8)%8);
 const im=art[id],h=151,w=h*im.width/im.height;
 ctx.drawImage(im,xx-w/2,b-h,w,h);
}
function drawGoal(){
 const d=passages[level][1]-z;if(d>70)return;
 const p=project(d),xx=sidePos(0,p.scale),s=p.scale;
 const glow=ctx.createRadialGradient(xx,p.y-60*s,0,xx,p.y-60*s,114*s);
 glow.addColorStop(0,'#ffdf888c');glow.addColorStop(1,'#f6c36b00');ctx.fillStyle=glow;ctx.fillRect(xx-116*s,p.y-176*s,232*s,232*s);
 if(level===4){ctx.save();ctx.translate(xx,p.y-75*s);ctx.rotate(-.35);line(-24*s,0,24*s,0,'#ffd487',6*s);for(let i=-2;i<=2;i++)line(i*7*s,-s,i*7*s,s,'#513823',2*s);ctx.restore()}
}
function render(){
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 const im=outroPending||completed?art.ending:art['cave'+level];if(!im)return;
 const v=Math.min(Math.max(w/960,h/540),w/565);
 const ox=(w-960*v)/2,oy=h*.86-feet*v;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#10181f';ctx.fillRect(0,0,canvas.width,canvas.height);
 // Portrait keeps the whole control lane in view while the cavern fills the screen.
 const moving=mode==='run',fill=Math.max(w/im.width,h/im.height)*(moving?1.035:1);
 const bw=im.width*fill,bh=im.height*fill;
 const dx=clamp((w-bw)/2-(moving?camX*5*v:0),w-bw,0);
 const dy=clamp(oy+horizon*v-bh*.415+(moving?Math.sin(stride*Math.PI*2)*Math.min(1,speed*.1):0),h-bh,0);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.drawImage(im,dx,dy,bw,bh);
 if(outroPending||completed)return;
 ctx.setTransform(v*dpr,0,0,v*dpr,ox*dpr,oy*dpr);
 if(!art.run0)return;
 drawPath();drawWalls();drawGoal();
 const obstacles=passages[level][2];for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i][0]>=z)drawObstacle(...obstacles[i]);
 drawPlayer();for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i][0]<z)drawObstacle(...obstacles[i]);
 if(recovery>0){ctx.fillStyle='rgba(63,25,22,'+Math.min(.38,recovery)+')';ctx.fillRect(0,0,960,540)}
}
function frame(now){
 if(mode==='run'){acc+=Math.min(.08,(now-last)/1000);while(acc>=1/90&&mode==='run'){acc-=1/90;update(1/90)}}
 last=now;render();requestAnimationFrame(frame);
}
Promise.all([...passages.map((_,i)=>'cave'+i),'ending','rock','beam',...Array.from({length:8},(_,i)=>'run'+i),...Array.from({length:4},(_,i)=>'jump'+i)].map(loadImage)).then(()=>{
 reset();persist();panel(completed?'finished':'ready',completed?'Tillsammans igen':'Flöjtens eko',completed?'Navid och Laleh har kommit hem.':'Håll upp för att springa in i grottan. Styr åt sidorna och hoppa med mellanslag eller hoppknappen. Ned bromsar.',completed?'Spela om':'Fortsätt');
 requestAnimationFrame(frame);
}).catch(()=>panel('error','Grottan kunde inte öppnas','Kontrollera anslutningen och försök igen.','Försök igen'));
