const $=id=>document.getElementById(id), TAU=Math.PI*2, clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), wrap=(v,n)=>(v%n+n)%n;
const seasons=['Sommar','Vår','Höst','Vinter'];
const seasonIds=[0,1,2,0,0,2,2,1,0,3,2,0,1,2,3,0,3,1,2,3,0,3,2,1,3,0];
const season=()=>seasonIds[routeOrder[idx]];
const icy=s=>season()===3&&((wrap(s,length)/length>.17&&wrap(s,length)/length<.31)||(wrap(s,length)/length>.58&&wrap(s,length)/length<.73));
let texture,textureSeason=-1,hitTime=-1,terrainPattern;
function seasonalTile(){
 if(textureSeason===season())return texture;
 textureSeason=season();texture=surface(800,800);const c=texture.getContext('2d');c.drawImage(images.forest,0,0,800,800);
 if(textureSeason){const im=c.getImageData(0,0,800,800),d=im.data;
 for(let i=0;i<d.length;i+=4){const r=d[i],v=d[i+1],b=d[i+2],lum=(r*.32+v*.58+b*.1)/255;
 if(textureSeason===3){const light=Math.min(1,Math.pow(lum,.65)*1.5);d[i]=32+211*light;d[i+1]=51+195*light;d[i+2]=68+184*light}
 else if(textureSeason===2){d[i]=r*1.22+19*lum;d[i+1]=v*.80;d[i+2]=b*.82}
 else{d[i]=r*.88;d[i+1]=v*1.17+7;d[i+2]=b*1.1+3}}
 c.putImageData(im,0,0)}terrainPattern=g.createPattern(texture,'repeat');return texture
}
function stretch(s,r,l=0){let pts=[];for(let d=-r;d<=r;d+=5)pts.push(at(s+d,l));return pts}
function crossing(c,s,type,deck){
 const span=type==='bridge'?126:102,p=at(s);
 if(!deck){c.save();c.translate(p.x,p.y);c.rotate(p.a+.18);if(type==='bridge'){
 let water=c.createLinearGradient(-100,0,100,0);['#707554','#334941','#284e55','#447b80','#295360','#757966'].forEach((v,i)=>water.addColorStop(i/5,v));
 c.fillStyle=water;c.beginPath();for(let side of [-1,1])for(let j=0;j<=60;j++){let y=(side<0?j:60-j)*14-420;let bank=Math.sqrt(Math.max(0,1-Math.pow(y/420,4)));let x=side*bank*(77+12*Math.sin(y*.015))+20*Math.sin(y*.009);if(side===-1&&j===0)c.moveTo(x,y);else c.lineTo(x,y)}c.closePath();c.fill();c.strokeStyle='#9dd6cd70';c.lineWidth=1;for(let j=0;j<190;j++){let y=Math.sin(j*64.3)*402,x=Math.sin(j*31.7)*57*Math.sqrt(Math.max(0,1-Math.pow(y/420,4)))+20*Math.sin(y*.009);c.beginPath();c.moveTo(x,y);c.lineTo(x+1,y+4+j%10);c.stroke()}
 }else{c.fillStyle='#766d60';c.fillRect(-25,-410,50,820);for(let y=-410;y<410;y+=12){c.fillStyle='#554a41';c.fillRect(-19,y,38,5)}for(let x of [-12,12]){c.fillStyle='#c4c3bb';c.fillRect(x,-410,3,820)}}c.restore();return}
 const pts=stretch(s,span);line(c,pts.map(p=>({x:p.x+9,y:p.y+13})),'#15212778',road+20);
 line(c,pts,'#555552',road+15);line(c,pts,season()===3?'#adb7be':'#747576',road);
 for(let d=-span;d<=span;d+=28){line(c,[at(s+d,-road/2),at(s+d,road/2)],'#353e443b',1.4)}
 for(let side of [-1,1]){let rail=stretch(s,span,side*(road/2+3));line(c,rail,'#535955',6);line(c,rail,'#e4e1cc',2);
 for(let d=-span;d<=span;d+=20){let a=at(s+d,side*(road/2+5)),b=at(s+d,side*(road/2+9));line(c,[a,b],'#555957',4)}}
}
let ac,engine,engineVol,master,music,soundOn=true;
let loadingMotor=false,gear=0;
let lobbyTrack,raceTrack,waitingForGesture=false;
function playTheme(lobby){if(!soundOn||typeof Audio==='undefined'||document.hidden)return;
 const track=lobby?(lobbyTrack ||= document.getElementById('menuMusic')):(raceTrack ||= new Audio('midnight-drive.mp3'));
 if(music!==track){music?.pause();music=track;music.loop=true;music.volume=lobby?.44:.34}
 if(music.paused)music.play().then(()=>{if(soundOn&&music===track){waitingForGesture=false;$('sound').textContent='Ljud på'}}).catch(error=>{if(lobby&&music===track&&soundOn&&error.name==='NotAllowedError'){waitingForGesture=true;$('sound').textContent='Starta ljud'}})}
function audioStart(){playTheme(false);if(!soundOn||!window.AudioContext&&!window.webkitAudioContext)return;
 try{if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.27;master.connect(ac.destination);
 engineVol=ac.createGain();engineVol.gain.value=0;engineVol.connect(master);
 }
 if(!engine&&!loadingMotor){
  loadingMotor=true;
  fetch('engine.wav').then(r=>{if(!r.ok)throw Error('motor');return r.arrayBuffer()})
   .then(bytes=>ac.decodeAudioData(bytes)).then(buffer=>{
    engine=ac.createBufferSource();engine.buffer=buffer;engine.loop=true;engine.connect(engineVol);engine.start()
   }).catch(()=>{}).finally(()=>{loadingMotor=false})
 }
 ac.resume().catch(()=>{})}catch{}}
function silent(){music?.pause();if(ac)ac.suspend().catch(()=>{})}
function tone(freq,duration,level,type='sine'){if(!ac||!soundOn||ac.state!=='running')return;let o=ac.createOscillator(),vol=ac.createGain(),t=ac.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.58,t+duration);vol.gain.setValueAtTime(level,t);vol.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(vol).connect(master);o.start();o.stop(t+duration)}
function motor(){
 if(!engine||!soundOn)return;
 const throttle=state==='race'&&(keys.has('gas')||gasPointer!==null);
 const limits=[77,145,211,279,365];
 while(gear<4&&player.v>limits[gear])gear++;
 while(gear>0&&player.v<limits[gear-1]-18)gear--;
 const revs=gear===0?player.v/77:.50+.5*(player.v-limits[gear-1])/(limits[gear]-limits[gear-1]);
 engine.playbackRate.setTargetAtTime(.78+1.15*clamp(revs,0,1)+(throttle?.18:0),ac.currentTime,.10);
 engineVol.gain.setTargetAtTime(throttle?.95:.35,ac.currentTime,.12)
}
// Resolve contact along the separating axes of the two oriented car bodies.
function carPose(car){
 return {x:car.x,y:car.y,a:car.heading-car.yaw}
}
// Projection only measures race progress and track boundaries.
function locate(car){
 const step=length/track.length,center=Math.floor(car.s/step);
 let best=Infinity;
 for(let i=center-14;i<=center+14;i++){
  const p=track[wrap(i,track.length)],q=track[wrap(i+1,track.length)];
  const dx=q.x-p.x,dy=q.y-p.y,xx=car.x-p.x,yy=car.y-p.y;
  const t=clamp((xx*dx+yy*dy)/(dx*dx+dy*dy),0,1),rx=xx-t*dx,ry=yy-t*dy,d=rx*rx+ry*ry;
  if(d>=best)continue;
  best=d;car.s=(i+t)*step;car.normal=p.a+delta(q.a,p.a)*t+Math.PI/2;
  car.l=rx*Math.cos(car.normal)+ry*Math.sin(car.normal)
 }
 car.yaw=delta(car.heading,car.normal-Math.PI/2)
}
function drive(car,dt,steer,traction,brake,gas){
 const speed=Math.hypot(car.vx,car.vy);
 car.wheel+=(steer-car.wheel)*(1-Math.exp(-(steer?5.4:10)*dt));
 const forward=car.vx*Math.cos(car.heading)+car.vy*Math.sin(car.heading);
 const direction=forward<-.5?-1:1;
 const angle=car.wheel*(.65/(1+speed/175));
 car.heading+=direction*speed/32*Math.tan(angle)*dt;
 const fx=Math.cos(car.heading),fy=Math.sin(car.heading);
 let along=car.vx*fx+car.vy*fy,side=-car.vx*fy+car.vy*fx;
 const verge=Math.abs(car.l)>road/2-10;
 const drag=(13+speed*.055+speed*speed*.00048+(verge?82:0))*dt;
 along=Math.sign(along)*Math.max(0,Math.abs(along)-drag);
 if(brake&&forward>4)along=Math.max(0,along-260*traction*dt);
 else if(brake&&!gas)along=Math.max(-58,along-77*dt);
 else if(gas)along+=(116*Math.max(0,1-Math.max(0,along)/375)+.31*Math.max(0,along))*dt;
 side*=Math.exp(-8.4*traction*dt);
 const gripLimit=356,mag=Math.hypot(along,side);
 const limit=Math.max(gripLimit,speed-75*dt),scale=Math.min(1,limit/Math.max(.001,mag));
 car.vx=(fx*along-fy*side)*scale;car.vy=(fy*along+fx*side)*scale;
 car.x+=car.vx*dt;car.y+=car.vy*dt;locate(car);
 const excess=Math.abs(car.l)-(road/2+4);
 if(excess>0){
  const nx=Math.sign(car.l)*Math.cos(car.normal),ny=Math.sign(car.l)*Math.sin(car.normal);
  car.x-=nx*excess;car.y-=ny*excess;
  const outward=Math.max(0,car.vx*nx+car.vy*ny);
  car.vx-=nx*outward;car.vy-=ny*outward;locate(car)
 }
 car.v=Math.hypot(car.vx,car.vy)
}

function contacts(){
 for(let pass=0;pass<8;pass++){let changed=false;
 for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
 const a=cars[i],b=cars[j];if(a.done||b.done||Math.abs(wrap(a.s-b.s+length/2,length)-length/2)>100)continue;
 const pa=carPose(a),pb=carPose(b),dx=pb.x-pa.x,dy=pb.y-pa.y;
 if(dx*dx+dy*dy>2704)continue;
 const axes=p=>[Math.cos(p),Math.sin(p)],u=axes(pa.a+a.yaw),v=[-u[1],u[0]],w=axes(pb.a+b.yaw),z=[-w[1],w[0]];
 let penetration=Infinity,nx=0,ny=0;for(const [x,y] of [u,v,w,z]){
 const radius=23*(Math.abs(x*u[0]+y*u[1])+Math.abs(x*w[0]+y*w[1]))+11.5*(Math.abs(x*v[0]+y*v[1])+Math.abs(x*z[0]+y*z[1]));
 const dot=dx*x+dy*y,depth=radius-Math.abs(dot);if(depth<penetration){penetration=depth;nx=x*Math.sign(dot||1);ny=y*Math.sign(dot||1)}}
 if(penetration<.02)continue;changed=true;
 const separation=(penetration+.12)*.5;
 a.x-=nx*separation;a.y-=ny*separation;
 b.x+=nx*separation;b.y+=ny*separation;
 locate(a);locate(b);
 if(pass===0){
 const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
 if(rel>0){
 const impulse=.62*rel;
 a.vx-=nx*impulse;a.vy-=ny*impulse;
 b.vx+=nx*impulse;b.vy+=ny*impulse;
 a.v=Math.hypot(a.vx,a.vy);b.v=Math.hypot(b.vx,b.vy);
 if((a===player||b===player)&&rel>18&&clock-hitTime>.18){tone(90,.14,.65,'triangle');hitTime=clock}}}
 }if(!changed)break}
}

const board=$('world'),g=board.getContext('2d'),images={},sprites=[],W=3200,H=2300,road=142;
const routes=[
 ['Tallåsen',1,[1,.96,.82,1,.97,.67,.94,1]],['Myrkanten',0,[1,.73,1,1,.65,.83,1,.97,.82]],['Granitpasset',0,[.96,.94,.58,.97,1,.76,.93,.88,1]],['Månvarvet',1,[1,.95,.86,.98,.75,.97,.74,.88]],['Långheden',0,[1,.84,.92,1,.66,1,.94,.75]],['Rävberget',0,[.98,.65,.88,1,.8,.96,.59,.97,1]],['Nattvakten',1,[1,.87,.66,1,.96,.7,1,.92,.8]],['Mosshöjden',0,[1,.64,1,.85,1,.78,.92,1]],['Klintvägen',0,[.84,1,.98,.67,1,.91,.76,.94,1,.75]],['Midnattsringen',1,[.94,1,.7,.92,1,.96,.59,.92]],['Kungsåsen',0,[1,.76,1,.95,.71,.92,1,.66,.95,.94]],['Svarta skogen',1,[1,.67,.94,.85,1,.65,1,.84,.97,.87]],
 ['Vitsippsdalen',0,[.98,.65,.86,1,.78,.94,.59,.83,.98]],['Kopparravinen',0,[.75,.99,.64,.89,1,.61,.85,.96,.72,1]],['Frostälven',0,[.92,.97,.76,.6,.94,1,.71,.91,1]],['Solviadukten',0,[1,.8,.56,.88,1,.72,.83,1,.69,.94]],['Polarnatten',1,[.94,.63,1,.76,.93,1,.61,.87,.95]],['Björkfors',0,[1,.84,.62,.97,.74,.99,.79,.56,1,.85]],['Lönnpasset',0,[.81,1,.78,.58,1,.9,.69,.92,1]],['Isbrytaren',0,[.91,1,.62,.87,.99,.63,.92,.72,.98,.81]],['Älvbron',0,[.76,.98,.84,.62,.97,.89,.63,1,.93]],['Norrskensleden',1,[1,.74,.9,.58,.83,1,.67,.94,.82,.97]]
];
routes.push(['Trollstigen'],['Lysebotn'],['Stelviopasset'],['Col de Turini']);
const routeOrder=[0,22,7,14,3,19,10,23,1,16,8,21,4,24,11,5,18,2,13,25,9,20,6,15,12,17];
const circuits=routeOrder.map(id=>routes[id]);
const modes=['Varvlopp','Sprint','Tidjakt'],descriptions=['Tre varv mot elva förare. Först över mållinjen vinner.','Ett varv mot elva förare. Varje omkörning räknas.','Tre flygande varv på fri bana. Jaga ditt bästa varv.'];
let mode=0,idx=0,state='menu',track=[],length=0,scene,marks,ink,grid=[],cars=[],player,particles=[],clock=0,count=0,last=0,acc=0,cam={x:0,y:0},smokeTick=0,sessionBest=Infinity,lapStart=0,lastLap=0,record=Infinity,night=false,keys=new Set(),mapBounds,lightLayer,goTime=0;
const surface=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const fmt=t=>Math.floor(t/60)+':'+(t%60).toFixed(2).padStart(5,'0');
function makeTrack(){
 const route=routeOrder[idx],cfg=routes[route],rs=cfg[2],phase=route*.57+.23;
 // These routes alternate long straights with linked bends and broad hairpins.
 const shaped={
  22:[[480,1820],[650,1580],[1820,1490],[2080,1340],[1900,1200],[870,1190],[655,1040],[850,900],[2050,875],[2310,710],[2100,560],[1420,545],[1150,380],[1550,240],[2490,320],[2790,640],[2740,1510],[2330,1930],[1300,2050]],
  23:[[510,1740],[760,1530],[1420,1450],[1680,1280],[1480,1140],[870,1220],[610,1110],[730,910],[1540,850],[1910,625],[1700,480],[1110,565],[810,475],[1000,290],[2200,265],[2720,650],[2520,1080],[2390,1540],[1870,1840],[960,2060]],
  24:[[580,1850],[820,1620],[2140,1520],[2350,1370],[2130,1210],[1060,1270],[820,1100],[1010,930],[2250,890],[2440,735],[2250,575],[1320,610],[960,465],[1100,285],[2400,250],[2790,560],[2860,1430],[2580,1860],[1630,2020]],
  25:[[440,1530],[710,1130],[1190,1010],[1390,820],[1230,665],[740,730],[525,575],[770,345],[1650,305],[2130,515],[2660,435],[2800,690],[2490,890],[2070,940],[1840,1130],[2080,1300],[2510,1240],[2710,1410],[2350,1760],[1700,1830],[1310,1600],[855,1840]],
  0:[[440,540],[980,370],[1530,560],[2140,390],[2700,530],[2830,1010],[2410,1480],[1840,1740],[1550,1420],[1650,980],[1340,900],[1050,1390],[660,1670],[355,1420]],
  2:[[380,640],[1050,380],[1850,420],[2640,600],[2790,1030],[2420,1220],[2060,920],[1730,990],[1820,1430],[2310,1630],[2120,1910],[1270,1820],[850,1430],[400,1350]],
  4:[[355,870],[630,465],[1450,405],[2380,475],[2790,800],[2530,1140],[1740,1140],[1450,1390],[1550,1780],[1120,1870],[730,1480]],
  6:[[410,580],[1160,380],[1770,530],[2460,400],[2780,735],[2440,1000],[1990,1070],[1950,1480],[2370,1710],[2130,1910],[1450,1750],[950,1220],[550,1370],[325,1060]],
  9:[[340,920],[610,460],[1190,420],[1750,760],[2220,700],[2670,440],[2860,840],[2600,1550],[2160,1830],[1570,1620],[1090,1770],[680,1610]],
  11:[[380,700],[880,440],[1350,720],[1750,700],[2100,360],[2630,460],[2790,1050],[2440,1380],[2040,1190],[1730,1260],[1530,1760],[1010,1850],[580,1530]]
 };
 const anchors=shaped[route]?shaped[route].map(([x,y])=>({x,y})):rs.map((r,i)=>{const a=i*TAU/rs.length+phase;return {x:W/2+1280*r*Math.cos(a),y:H/2+865*r*Math.sin(a)}});
 // Keep one full straight for passing. Use broad S bends, offset chicanes and linked esses elsewhere.
 const spans=anchors.map((p,i)=>{
  const q=anchors[(i+1)%anchors.length];
  return {i,len:Math.hypot(q.x-p.x,q.y-p.y)}
 }).sort((a,b)=>b.len-a.len);
 const sectors=new Set(spans.slice(1,7+(route%2)).filter(span=>span.len>=385).map(span=>span.i));
 const nodes=[];
 anchors.forEach((p,i)=>{
  nodes.push(p);
  if(route>=22||!sectors.has(i))return;
  const q=anchors[(i+1)%anchors.length],dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy);
  const shape=(i+route)%3, amplitude=Math.min(70,L*(.080+.008*shape))*((i+route)%2?1:-1);
  const gates=L>740&&shape===0?[[.24,.85],[.51,-.82],[.78,.72]]:
   shape===1?[[.30,.65],[.65,-1]]:[[.31,1],[.70,-.75]];
  for(const [fraction,side] of gates){
   nodes.push({x:p.x+dx*fraction-dy/L*amplitude*side,y:p.y+dy*fraction+dx/L*amplitude*side})
  }
 });
 const n=nodes.length;
 const dense=[];let total=0;
 for(let i=0;i<n;i++){let [a,b,c,d]=[-1,0,1,2].map(k=>nodes[wrap(i+k,n)]);for(let j=0;j<150;j++){let t=j/150;let coord=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);let p={x:coord('x'),y:coord('y')},prev=dense.at(-1);if(prev)total+=Math.hypot(p.x-prev.x,p.y-prev.y);dense.push({...p,s:total})}}
 const f=dense[0],z=dense.at(-1);length=total+Math.hypot(f.x-z.x,f.y-z.y);dense.push({...f,s:length});
 const num=Math.ceil(length/6);track=[];let j=0;
 for(let i=0;i<num;i++){let s=i*length/num;while(dense[j+1].s<s)j++;let a=dense[j],b=dense[j+1],t=(s-a.s)/(b.s-a.s);track.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})}
 track.forEach((p,i)=>{const a=track[wrap(i-1,num)],b=track[(i+1)%num];p.a=Math.atan2(b.y-a.y,b.x-a.x)});
 const xs=track.map(p=>p.x),ys=track.map(p=>p.y);mapBounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 night=true
}
function delta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function at(s,l=0){let k=wrap(s,length)*track.length/length,i=Math.floor(k),p=track[i],q=track[(i+1)%track.length],t=k-i,a=p.a+delta(q.a,p.a)*t;return{x:p.x+(q.x-p.x)*t-Math.sin(a)*l,y:p.y+(q.y-p.y)*t+Math.cos(a)*l,a}}
function line(ctx,points,color,width,close=false){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(close)ctx.closePath();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke()}
let riverPose,ripples=[],overpass;
function drawWater(time){
 if(!riverPose||Math.hypot(cam.x-riverPose.x,cam.y-riverPose.y)>1500)return;
 g.save();g.translate(riverPose.x,riverPose.y);g.rotate(riverPose.a+.18);
 g.strokeStyle='#b3ebf5';g.lineWidth=1.6;
 for(const r of ripples){
  const wave=time*1.4+r.phase+r.y*.014,y=r.y+5*Math.sin(wave);
  g.globalAlpha=.17+.15*Math.sin(wave+.5);
  g.beginPath();g.moveTo(r.x-4,y);g.quadraticCurveTo(r.x,y-2,r.x+5+2*Math.sin(wave),y);g.stroke()
 }
 g.restore()
}
function drawOverpass(){
 if(!overpass||Math.hypot(cam.x-overpass.x,cam.y-overpass.y)>1200)return;
 g.save();g.translate(overpass.x,overpass.y);g.rotate(overpass.a+.21);
 g.fillStyle='#060a108a';g.fillRect(-25,-185,81,383);
 g.fillStyle='#454e56';g.fillRect(-42,-190,84,380);
 g.fillStyle='#292e39';g.fillRect(-36,-190,72,380);
 g.strokeStyle='#ddc68f';g.setLineDash([14,15]);g.beginPath();g.moveTo(0,-190);g.lineTo(0,190);g.stroke();g.setLineDash([]);
 for(const x of [-39,39]){
  g.fillStyle='#738594';g.fillRect(x-1,-190,3,380);
  for(let y=-176;y<=176;y+=44){g.fillStyle='#ffe4a0';g.fillRect(x-2,y,4,5)}
 }
 g.restore()
}
function buildScene(){
 scene ||= surface(W,H);let c=scene.getContext('2d');marks ||= surface(W,H);marks.getContext('2d').clearRect(0,0,W,H);ink=marks.getContext('2d');
 c.fillStyle=c.createPattern(seasonalTile(),'repeat');c.fillRect(0,0,W,H);
 let seed=routeOrder[idx]+21;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 function grit(base,amount){let tile=surface(144,144),v=tile.getContext('2d'),im=v.createImageData(144,144);for(let i=0;i<im.data.length;i+=4){let n=(rand()-.5)*amount;for(let j=0;j<3;j++)im.data[i+j]=base[j]+n;im.data[i+3]=255}v.putImageData(im,0,0);return c.createPattern(tile,'repeat')}
 const sites=[[length*(.14+.014*(idx%6)),'bridge'],[length*(.55+.018*(idx%5)),'viaduct']];riverPose=at(sites[0][0]);ripples=[];
 const angle=riverPose.a+.18,cs=Math.cos(angle),sn=Math.sin(angle);
 for(let i=0;i<380;i++){
  const y=rand()*790-395,bank=Math.sqrt(1-(y/420)**4)*(77+12*Math.sin(y*.015));
  const x=20*Math.sin(y*.009)+(rand()*2-1)*Math.max(0,bank-14);
  const wx=riverPose.x+x*cs-y*sn,wy=riverPose.y+x*sn+y*cs;
  if(!track.some(p=>Math.hypot(p.x-wx,p.y-wy)<road/2+35))ripples.push({x,y,phase:rand()*TAU})
 }
 overpass=routeOrder[idx]%3===0||routeOrder[idx]>=22?at(sites[1][0]):null;
 if(overpass){
  c.save();c.translate(overpass.x,overpass.y);c.rotate(overpass.a+.21);
  c.fillStyle='#786e60';c.fillRect(-43,-450,86,900);c.fillStyle='#58595c';c.fillRect(-36,-450,72,900);
  for(let y=-440;y<450;y+=29){c.fillStyle='#cfbd8b';c.fillRect(-1,y,2,14)}
  c.restore()
 }
 for(const [s,type] of sites)if(type==='bridge'||!overpass)crossing(c,s,type,false);
 c.lineJoin='round';line(c,track,grit([177,149,112],77),road+36,true);line(c,track,'#ece2d2',road+4,true);line(c,track,grit(season()===3?[177,188,193]:[100,97,96],32),road,true);
 if(season()===3)for(const [a,b] of [[.17,.31],[.58,.73]]){const pts=[];for(let s=a*length;s<b*length;s+=6)pts.push(at(s));line(c,pts,grit([156,184,201],16),road-2);for(let i=0;i<100;i++){let s=(a+rand()*(b-a))*length,l=(rand()-.5)*(road-14);line(c,[at(s,l),at(s+12+rand()*12,l+1)],'#e8fcff65',1.2)}}
 // The inner shoulder follows the signed bend, including both halves of a chicane.
 for(let s=0;s<length;s+=7){const curve=delta(at(s+24).a,at(s-24).a)/48;
 if(Math.abs(curve)<.00135)continue;const side=Math.sign(curve),edge=side*(road/2-4);
 line(c,[at(s,edge),at(s+7.4,edge)],'#edece7',12);
 line(c,[at(s,edge-5*side),at(s+1.5,edge+5*side)],'#9e9e9a',1.7)}
 for(let s=75;s<length;s+=330){let bend=delta(at(s+100).a,at(s).a);if(Math.abs(bend)<.08)continue;let lane=-Math.sign(bend)*(road/2+13);const pts=[];for(let j=0;j<=135;j+=9){let p=at(s+j,lane);pts.push(p);if(j%27===0){c.fillStyle='#554e45';c.fillRect(p.x-2,p.y-2,5,5)}}line(c,pts,'#4e4944',5);line(c,pts,'#d6d3c6',2)}
 for(const [s,type] of sites)if(type==='bridge'||!overpass)crossing(c,s,type,true);
 let p=at(0);c.save();c.translate(p.x,p.y);c.rotate(p.a);for(let i=0;i<2;i++)for(let j=0;j<18;j++){c.fillStyle=(i+j)%2?'#3c3d3b':'#eeeade';c.fillRect(i*7,-road/2+j*road/18,7,road/18+.35)}c.restore();
}
function mini(canvas,live){let c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,[x,y,X,Y]=mapBounds,k=Math.min((w-24)/(X-x),(h-20)/(Y-y)),ox=(w-(X-x)*k)/2,oy=(h-(Y-y)*k)/2;
 let conv=p=>({x:ox+(p.x-x)*k,y:oy+(p.y-y)*k});c.clearRect(0,0,w,h);line(c,track.filter((_,i)=>i%5===0).map(conv),live?'#ebe9d7':'#79e7bd',live?4:5,true);if(live){for(let car of [...cars.slice(1).filter(c=>!c.done),player]){let p=conv(at(car.s,car.l));c.fillStyle=car===player?'#29ffda':'#f4b485';c.beginPath();c.arc(p.x,p.y,car===player?5:2.5,0,TAU);c.fill()}}}
function setupMenu(){idx=Number($('tracks').value);makeTrack();mini($('preview'),false);
 $('info').textContent=seasons[season()]+' · '+(night?'Natt':'Dag')+' · '+(idx+1)+' / '+circuits.length;
 $('modeName').textContent=modes[mode];$('modeIcon').textContent=['⚑','➤','◷'][mode];
 $('desc').textContent=['3 varv mot 11 förare','1 varv mot 11 förare','3 varv mot klockan'][mode]}
function resetInput(){
 releaseStick();releaseGas();arrowPointers.clear();keys.clear();
 document.querySelectorAll('#arrows button').forEach(b=>b.classList.remove('active'))
}
function recoverCar(){
 if(state!=='race'||player.done)return;
 // Search backwards so recovery never awards distance or advances a lap.
 for(let back=0;back<length;back+=55){
  const s=player.s-back;
  for(const l of [0,-38,38]){
   const p=at(s,l);
   if(cars.some(c=>c!==player&&!c.done&&Math.hypot(c.x-p.x,c.y-p.y)<57))continue;
   Object.assign(player,{x:p.x,y:p.y,s,l,v:0,vx:0,vy:0,heading:p.a,normal:p.a+Math.PI/2,wheel:0,yaw:0,grip:0});
   cam={x:p.x,y:p.y};resetInput();return
  }
 }
}
function begin(){
 resetInput();lapTimes=[];$('finishCard').hidden=true;hitTime=-1;audioStart();makeTrack();buildScene();clock=0;count=3;particles=[];sessionBest=Infinity;lastLap=0;lapStart=0;record=Infinity;try{record=Number(localStorage.getItem('midnight-manual-1-'+routeOrder[idx]))||Infinity}catch{}
 cars=[];for(let i=0;i<(mode===2?1:12);i++){let slot=i===0?5:i<=5?i-1:i,s=mode===2?0:-(Math.floor(slot/2)+1)*48;cars.push({s,l:mode===2?0:(slot%2?34:-34),v:mode===2?235:0,yaw:0,grip:0,lap:0,id:i,skill:(i*7%11)/10,base:182+4*(i*7%11),decisionAt:.20+i*.055,steer:0,gas:false,brake:false,done:false,finishTime:0})}
 for(const car of cars){
  const spawn=at(car.s,car.l);
  Object.assign(car,{x:spawn.x,y:spawn.y,heading:spawn.a,wheel:0,vx:car.v*Math.cos(spawn.a),vy:car.v*Math.sin(spawn.a)});
 }
 player=cars[0];cam={x:player.x,y:player.y};state='count';goTime=0;$('menu').hidden=true;$('overlay').hidden=true;$('hud').hidden=false;document.body.classList.add('play');acc=0;last=0;
}
let lapTimes=[],finishRemaining=0,previous='race';
function showFinish(){
 state='finish';finishRemaining=5;resetInput();document.body.classList.remove('play');
 $('hud').hidden=true;$('finishCard').hidden=false;
 $('placing').textContent=mode===2?'Tidjakt klar':'Plats '+position(player)+' av '+cars.length;
 $('finishTime').textContent='Totalt '+fmt(player.finishTime);
 $('lapTimes').textContent=lapTimes.map((t,i)=>'Varv '+(i+1)+'　'+fmt(t)).join('\n');
 $('nextRace').textContent=circuits[(idx+1)%circuits.length][0]+' om 5 s'
}
function finishFrame(elapsed){
 finishRemaining-=elapsed;
 if(finishRemaining<=0){
  idx=(idx+1)%circuits.length;$('tracks').value=String(idx);begin();state='race';goTime=.7;return
 }
 $('nextRace').textContent=circuits[(idx+1)%circuits.length][0]+' om '+Math.ceil(finishRemaining)+' s';
 let remaining=Math.min(elapsed,.12);
 while(remaining>0){
  const dt=Math.min(1/60,remaining);remaining-=dt;
  for(const car of cars){
   if(car.done&&car!==player)continue;
   const ahead=at(car.s+70,car.l*.85);
   const steer=clamp(delta(Math.atan2(ahead.y-car.y,ahead.x-car.x),car.heading)*1.7,-1,1);
   drive(car,dt,steer,icy(car.s)?.36:season()===3?.68:1,false,false)
  }
  const follow=1-Math.exp(-6*dt);
  cam.x+=(player.x+player.vx*.29-cam.x)*follow;cam.y+=(player.y+player.vy*.29-cam.y)*follow;
  particles=particles.filter(p=>(p.t+=dt)<.83)
 }
}
function pause(){
 if(!['race','count'].includes(state))return;
 previous=state;silent();state='paused';resetInput();document.body.classList.remove('play');$('overlay').hidden=false;
 $('title').textContent='Paus';$('result').textContent=circuits[idx][0]+' · '+modes[mode];$('resume').focus()
}
function resume(){if(state!=='paused')return;audioStart();state=previous;last=0;acc=0;$('overlay').hidden=true;document.body.classList.add('play')}
function position(car){return 1+cars.filter(b=>b!==car&&(car.done?b.done&&b.finishTime<car.finishTime:b.done||b.s>car.s)).length}
function chooseInputs(car,traction){
 if(clock<car.decisionAt)return;
 car.decisionAt=clock+.22-.095*car.skill;
 const ahead=54+car.v*.30;
 const bend=Math.abs(delta(at(car.s+ahead+48).a,at(car.s+14).a));
 let goal=clamp(car.base*(.85+.15*traction)-bend*(89-15*car.skill),88,car.base);
 let lane=(car.id%3-1)*28+Math.sin(clock*.45+car.id)*5;
 for(const rival of cars){
  if(rival===car||rival.done)continue;
  const gap=wrap(rival.s-car.s,length);
  if(gap>90||Math.abs(rival.l-car.l)>27)continue;
  lane=clamp(rival.l+(car.l>=rival.l?34:-34),-45,45);
  if(gap<53)goal=Math.min(goal,Math.max(45,rival.v-8));
 }
 const target=at(car.s+ahead,lane);
 const error=delta(Math.atan2(target.y-car.y,target.x-car.x),car.heading);
 car.steer=clamp(error*1.85,-1,1);
 car.gas=car.v<goal;
 car.brake=car.v>goal+16-6*car.skill;
}
function update(dt){
 if(state==='count'){let oldCount=Math.ceil(count);count-=dt;if(Math.ceil(count)!==oldCount)tone(count<=0?980:540,.12,.35);if(count<=0){state='race';goTime=.7}return}if(state!=='race')return;
 clock+=dt;goTime=Math.max(0,goTime-dt);smokeTick++;let targetLaps=mode===1?1:3;
 for(const car of cars){if(car.done)continue;let old=carPose(car),turn=delta(at(car.s+60).a,old.a)/60,me=car===player,steer=clamp(thumbSteer+Number(keys.has('right')||arrowPointers.has('right'))-Number(keys.has('left')||arrowPointers.has('left')),-1,1),traction=icy(car.s)?.36:season()===3?.68:1,brake=me&&keys.has('brake');
 if(!me){chooseInputs(car,traction);steer=car.steer;brake=car.brake}
 drive(car,dt,steer,traction,brake,me?(keys.has('gas')||gasPointer!==null):car.gas);
 let now=carPose(car);car.grip=car.v>85&&(Math.abs(turn)*car.v*car.v>185||brake&&car.v>180);
 if(car.grip){const wheels=(p,yaw,side)=>{const a=p.a+yaw;return{x:p.x-14*Math.cos(a)-side*8*Math.sin(a),y:p.y-14*Math.sin(a)+side*8*Math.cos(a)}};for(let side of [-1,1])line(ink,[wheels(old,car.yaw,side),wheels(now,car.yaw,side)],'rgba(27,24,24,.30)',2.4);
 if(smokeTick%5===0&&Math.hypot(now.x-cam.x,now.y-cam.y)<850&&particles.length<200)particles.push({x:now.x-13*Math.cos(now.a),y:now.y-13*Math.sin(now.a),t:0,dx:(Math.random()-.5)*18,dy:(Math.random()-.5)*18})}
 }
 contacts();
 for(const car of cars){if(car.done)continue;const me=car===player;
 const lap=Math.max(0,Math.floor(car.s/length));if(lap>car.lap){car.lap=lap;if(me){const crossed=clock-clamp((car.s-lap*length)/Math.max(1,car.v),0,dt);lastLap=crossed-lapStart;lapStart=crossed;lapTimes.push(lastLap);sessionBest=Math.min(sessionBest,lastLap);if(mode===2&&lastLap<record){record=lastLap;try{localStorage.setItem('midnight-manual-1-'+routeOrder[idx],record)}catch{}}}}
 if(car.s>=targetLaps*length){car.done=true;car.finishTime=clock-clamp((car.s-targetLaps*length)/Math.max(1,car.v),0,dt)}
 }
 particles=particles.filter(p=>(p.t+=dt)<.83);for(let p of particles){p.x+=p.dx*dt;p.y+=p.dy*dt}
 let aim={x:player.x+player.vx*.29,y:player.y+player.vy*.29},k=1-Math.exp(-dt*6);cam.x+=(aim.x-cam.x)*k;cam.y+=(aim.y-cam.y)*k;
 if(player.done)showFinish()
}
let beam,woodland;
function lightingTexture(){beam=surface(260,150);let c=beam.getContext('2d'),im=c.createImageData(260,150);for(let x=0;x<260;x++)for(let y=0;y<150;y++){let width=5+x*.32,fall=Math.max(0,1-Math.abs(y-75)/width),intensity=Math.pow(fall,.55)*Math.pow(1-x/260,.85);let i=(y*260+x)*4;im.data[i]=255;im.data[i+1]=236;im.data[i+2]=178;im.data[i+3]=Math.round(255*intensity)}c.putImageData(im,0,0)}
function resize(){let d=Math.min(devicePixelRatio||1,1.65);board.width=Math.round(innerWidth*d);board.height=Math.round(innerHeight*d);lightLayer=surface(board.width,board.height)}
function draw(){
 let w=board.width,h=board.height,sz=Math.min(w/740,h/510);if(innerWidth<innerHeight)sz=w/470;
 const tx=w/2-cam.x*sz,ty=h/2-cam.y*sz;
 g.setTransform(sz,0,0,sz,tx,ty);let left=-tx/sz,top=-ty/sz,ww=w/sz,hh=h/sz;
 g.fillStyle=terrainPattern;g.fillRect(left,top,ww,hh);g.drawImage(scene,0,0);drawWater(performance.now()/1000);g.drawImage(marks,0,0);
 const visible=cars.filter(c=>!c.done||c===player).map(c=>({...carPose(c),car:c})).filter(p=>p.x>left-260&&p.x<left+ww+260&&p.y>top-260&&p.y<top+hh+260);
 for(let p of visible){let c=p.car;g.save();g.translate(p.x,p.y);g.rotate(p.a+c.yaw);g.fillStyle='#17131665';g.beginPath();g.ellipse(-1,3,23,11,0,0,TAU);g.fill();g.drawImage(sprites[c.id],-23,-11.5,46,23);g.restore()}
 for(let p of particles){let r=4+13*p.t,alpha=(1-p.t/.83)*.36;let grad=g.createRadialGradient(p.x,p.y,0,p.x,p.y,r);grad.addColorStop(0,'rgba(235,231,225,'+alpha+')');grad.addColorStop(1,'rgba(235,231,225,0)');g.fillStyle=grad;g.fillRect(p.x-r,p.y-r,r*2,r*2)}
 if(night){const l=lightLayer.getContext('2d');l.setTransform(1,0,0,1,0,0);l.globalCompositeOperation='copy';l.fillStyle='rgba(4,10,31,.86)';l.fillRect(0,0,w,h);l.globalCompositeOperation='destination-out';l.setTransform(sz,0,0,sz,tx,ty);
 for(const p of visible){l.save();l.translate(p.x,p.y);l.rotate(p.a+p.car.yaw);for(let side of [-1,1])l.drawImage(beam,16,side*7-75);l.restore()}
 g.setTransform(1,0,0,1,0,0);g.drawImage(lightLayer,0,0);g.setTransform(sz,0,0,sz,tx,ty);
 for(const p of visible){g.save();g.translate(p.x,p.y);g.rotate(p.a+p.car.yaw);g.globalAlpha=.17;for(let side of [-1,1])g.drawImage(beam,17,side*7-75);g.globalAlpha=1;for(let side of [-1,1]){g.fillStyle='#ffedaf';g.fillRect(18,side*7-2,3,4);g.shadowBlur=8;g.shadowColor='#ff3730';g.fillStyle='#ff4136';g.fillRect(-21,side*7-2,3,4);g.shadowBlur=0}g.restore()}}
 drawOverpass();
 let p=carPose(player);g.fillStyle='#25f8d4';g.strokeStyle='#113f3d';g.lineWidth=1.2;g.beginPath();g.moveTo(p.x,p.y-19);g.lineTo(p.x-5.5,p.y-29);g.lineTo(p.x+5.5,p.y-29);g.closePath();g.fill();g.stroke();
 $('rank').textContent=mode===2?'TIDJAKT':position(player)+'/12';$('laps').textContent='VARV '+Math.min(mode===1?1:3,player.lap+1)+'/'+(mode===1?1:3);$('timer').textContent=fmt(mode===2?clock-lapStart:clock);$('speed').textContent=Math.round(player.v*.6)+' km/h'+(mode===2&&isFinite(record)?' · Rekord '+fmt(record):'');$('notice').textContent=state==='count'?Math.ceil(count):goTime>0?'KÖR!':'';mini($('map'),true);motor()
}
function frame(now){if(state==='finish'){if(!document.hidden)finishFrame(last?(now-last)/1000:0);draw()}else if(state==='count'||state==='race'){let elapsed=last?Math.min((now-last)/1000,.12):0;acc+=elapsed;while(acc>=1/60){update(1/60);acc-=1/60}draw()}last=now;requestAnimationFrame(frame)}
const mapping={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['Equal','Minus','Digit0','NumpadAdd','NumpadSubtract'].includes(e.code)){e.preventDefault();return}if(e.code==='Escape'&&!e.repeat){if(state==='paused')resume();else pause();return}if(['race','count'].includes(state)&&mapping[e.code]){e.preventDefault();keys.add(mapping[e.code])}});window.addEventListener('keyup',e=>keys.delete(mapping[e.code]));
const stick=$('stick'),knob=$('knob');
let thumbSteer=0,stickPointer=null;
function releaseStick(){
 thumbSteer=0;stickPointer=null;knob.style.transform='';stick.classList.remove('engaged')
}
function moveStick(e){
 if(e.pointerId!==stickPointer)return;
 const box=stick.getBoundingClientRect(),radius=box.width*.34;
 const dx=(e.clientX-box.left-box.width/2)/radius,dy=(e.clientY-box.top-box.height/2)/radius;
 const dist=Math.max(1,Math.hypot(dx,dy)),x=dx/dist,y=dy/dist;
 knob.style.transform='translate('+x*radius+'px,'+y*radius+'px)';
 const demand=clamp((Math.abs(x)-.07)/.93,0,1);
 thumbSteer=Math.sign(x)*demand*(.64+.36*demand)
}
stick.onpointerdown=e=>{
 if(stickPointer!==null)return;
 e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);
 stick.classList.add('engaged');moveStick(e)
};
stick.onpointermove=moveStick;
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=e=>{if(e.pointerId===stickPointer)releaseStick()};
const arrowPointers=new Map();
for(const b of document.querySelectorAll('#arrows button')){
 const key=b.dataset.k;
 b.onpointerdown=e=>{
  if(arrowPointers.has(key))return;
  e.preventDefault();b.setPointerCapture(e.pointerId);arrowPointers.set(key,e.pointerId);b.classList.add('active')
 };
 b.onlostpointercapture=b.onpointercancel=b.onpointerup=e=>{
  if(arrowPointers.get(key)!==e.pointerId)return;
  arrowPointers.delete(key);b.classList.remove('active')
 }
}
const gasButton=$('gasButton');
let gasPointer=null;
function releaseGas(){gasPointer=null;gasButton.classList.remove('active')}
gasButton.onpointerdown=e=>{
 if(gasPointer!==null)return;
 e.preventDefault();gasButton.setPointerCapture(e.pointerId);gasPointer=e.pointerId;gasButton.classList.add('active')
};
gasButton.onlostpointercapture=gasButton.onpointerup=gasButton.onpointercancel=e=>{
 if(e.pointerId===gasPointer)releaseGas()
};
$('recover').onclick=recoverCar;
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){pause();silent()}else if(state==='menu')playTheme(true);else if(state==='finish')playTheme(false)});window.addEventListener('resize',resize);
$('pause').onclick=pause;$('resume').onclick=resume;$('again').onclick=begin;$('back').onclick=()=>{state='menu';playTheme(true);$('menu').hidden=false;$('hud').hidden=$('overlay').hidden=true;setupMenu();$('start').focus()};
async function init(){const start=$('start');start.disabled=true;start.textContent='Laddar banorna…';await Promise.all(Object.entries(assets).map(async([k,src])=>{let im=new Image();im.src=src;await im.decode();images[k]=im}));
 for(let i=0;i<12;i++){let c=surface(images.car.width,images.car.height),v=c.getContext('2d');v.drawImage(images.car,0,0);let im=v.getImageData(0,0,c.width,c.height),d=im.data,color=[[0,0,0],[228,53,44],[251,176,36],[67,103,229],[205,79,176],[225,220,207],[127,192,43],[242,111,29],[143,74,184],[237,198,32],[49,117,189],[216,64,104]][i];if(i)for(let j=0;j<d.length;j+=4){let r=d[j],green=d[j+1];if(green-r>18&&d[j+2]-r>12){let k=green/230;for(let ch=0;ch<3;ch++)d[j+ch]=Math.min(255,color[ch]*k+r*.16)}}v.putImageData(im,0,0);sprites.push(c)}
 circuits.forEach(([name,n],i)=>$('tracks').add(new Option(name,i)));
 for(const [id,step] of [['modePrev',-1],['modeNext',1]])$(id).onclick=()=>{mode=wrap(mode+step,modes.length);setupMenu()};
 const touch=navigator.maxTouchPoints>0||matchMedia('(any-pointer:coarse)').matches;
 document.body.classList.toggle('touch-controls',touch);
 let analog=false;
 try{analog=localStorage.getItem('midnight-touch-steering')==='stick'}catch{}
 function showSteering(){
  document.body.classList.toggle('use-stick',analog);
  $('steerMode').textContent='Styrning: '+(analog?'joystick':'pilar');
  $('help').textContent=touch?'Håll Gas med höger tumme. Släpp för att sakta ner.':$('keyboardHelp').textContent
 }
 $('steerMode').onclick=()=>{
  analog=!analog;showSteering();
  try{localStorage.setItem('midnight-touch-steering',analog?'stick':'arrows')}catch{}
 };
 showSteering();
 $('sound').onclick=()=>{if(waitingForGesture&&soundOn){playTheme(true);return}soundOn=!soundOn;if(soundOn)playTheme(true);else silent();$('sound').textContent=soundOn?'Ljud på':'Ljud av';$('sound').setAttribute('aria-pressed',soundOn)};
 for(let [id,step] of [['prev',-1],['next',1]])$(id).onclick=()=>{$('tracks').value=wrap(idx+step,circuits.length);setupMenu()};

 $('tracks').onchange=setupMenu;resize();lightingTexture();setupMenu();start.disabled=false;start.textContent='Starta loppet →';start.onclick=begin;requestAnimationFrame(frame)
}
for(const event of ['gesturestart','gesturechange','gestureend','contextmenu','selectstart','dragstart'])document.addEventListener(event,e=>{if(state!=='menu')e.preventDefault()},{passive:false});
document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault()},{passive:false});
 for(const event of ['click','keydown','touchend','pointerup'])document.addEventListener(event,e=>{if(state==='menu'&&soundOn&&e.target!==$('sound'))playTheme(true)});playTheme(true);
init().catch(()=>{$('start').textContent='Bilderna kunde inte laddas. Öppna spelet igen.'});
