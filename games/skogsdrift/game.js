const $=id=>document.getElementById(id), TAU=Math.PI*2, clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), wrap=(v,n)=>(v%n+n)%n;
const seasons=['Sommar','Vår','Höst','Vinter'];
const seasonIds=[0,1,2,0,0,2,2,1,0,3,2,0,1,2,3,0,3,1,2,3,0,3];
const season=()=>seasonIds[idx];
const icy=s=>season()===3&&((wrap(s,length)/length>.17&&wrap(s,length)/length<.31)||(wrap(s,length)/length>.58&&wrap(s,length)/length<.73));
let texture,textureSeason=-1,boost=1,boosting=false,driftUntil=0,hitTime=-1,terrainPattern;
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
let ac,engine,engineVol,tyreVol,master,music,soundOn=true;
let lobbyTrack,raceTrack;
function playTheme(lobby){if(!soundOn||typeof Audio==='undefined'||document.hidden)return;
 const track=lobby?(lobbyTrack ||= new Audio('afterhours.mp3')):(raceTrack ||= new Audio('pursuit.mp3'));
 if(music!==track){music?.pause();music=track;music.loop=true;music.volume=lobby?.44:.34}
 if(music.paused)music.play().catch(()=>{})}
function audioStart(){playTheme(false);if(!soundOn||!window.AudioContext&&!window.webkitAudioContext)return;
 try{if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.27;master.connect(ac.destination);
 engine=ac.createOscillator();engine.type='sawtooth';const filter=ac.createBiquadFilter();filter.frequency.value=270;engineVol=ac.createGain();engineVol.gain.value=0;engine.connect(filter).connect(engineVol).connect(master);engine.start();
 const noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 const source=ac.createBufferSource();source.buffer=noise;source.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=2100;tyreVol=ac.createGain();tyreVol.gain.value=0;source.connect(f).connect(tyreVol).connect(master);source.start();
 }
 ac.resume().catch(()=>{})}catch{}}
function silent(){music?.pause();if(ac)ac.suspend().catch(()=>{})}
function tone(freq,duration,level,type='sine'){if(!ac||!soundOn||ac.state!=='running')return;let o=ac.createOscillator(),vol=ac.createGain(),t=ac.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.58,t+duration);vol.gain.setValueAtTime(level,t);vol.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(vol).connect(master);o.start();o.stop(t+duration)}
function motor(){if(!ac||!soundOn)return;let t=ac.currentTime;engine.frequency.setTargetAtTime(38+player.v*.25+(boosting?20:0),t,.09);engineVol.gain.setTargetAtTime(state==='race'?.14:.055,t,.08);tyreVol.gain.setTargetAtTime(player.grip?.22:0,t,.05)}
// Resolve contact along the separating axes of the two oriented car bodies.
function contacts(){
 for(let pass=0;pass<8;pass++){let changed=false;
 for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
 const a=cars[i],b=cars[j];if(a.done||b.done||Math.abs(wrap(a.s-b.s+length/2,length)-length/2)>100)continue;
 const pa=at(a.s,a.l),pb=at(b.s,b.l),dx=pb.x-pa.x,dy=pb.y-pa.y;
 if(dx*dx+dy*dy>2704)continue;
 const axes=p=>[Math.cos(p),Math.sin(p)],u=axes(pa.a+a.yaw),v=[-u[1],u[0]],w=axes(pb.a+b.yaw),z=[-w[1],w[0]];
 let penetration=Infinity,nx=0,ny=0;for(const [x,y] of [u,v,w,z]){
 const radius=23*(Math.abs(x*u[0]+y*u[1])+Math.abs(x*w[0]+y*w[1]))+11.5*(Math.abs(x*v[0]+y*v[1])+Math.abs(x*z[0]+y*z[1]));
 const dot=dx*x+dy*y,depth=radius-Math.abs(dot);if(depth<penetration){penetration=depth;nx=x*Math.sign(dot||1);ny=y*Math.sign(dot||1)}}
 if(penetration<.02)continue;changed=true;
 const move=(car,p,sign)=>{const c=Math.cos(p.a),t=Math.sin(p.a);let curvature=delta(at(car.s+5).a,p.a)/5;car.s+=sign*(nx*c+ny*t)/clamp(1-curvature*car.l,.4,1.7);car.l=clamp(car.l+sign*(-nx*t+ny*c),-77,77)};
 move(a,pa,-(penetration+.12)*.51);move(b,pb,(penetration+.12)*.51);
 if(pass===0){let va=a.v*Math.cos(pa.a)+a.lv*(-Math.sin(pa.a)),vb=b.v*Math.cos(pb.a)-b.lv*Math.sin(pb.a),rel=(va-vb)*nx+(a.v*Math.sin(pa.a)+a.lv*Math.cos(pa.a)-b.v*Math.sin(pb.a)-b.lv*Math.cos(pb.a))*ny;
 if(rel>0){for(let [car,p,sign] of [[a,pa,-1],[b,pb,1]]){car.v=Math.max(0,car.v+sign*.62*rel*(nx*Math.cos(p.a)+ny*Math.sin(p.a)));car.lv+=sign*.62*rel*(-nx*Math.sin(p.a)+ny*Math.cos(p.a))}
 if((a===player||b===player)&&rel>18&&clock-hitTime>.18){tone(90,.14,.65,'triangle');hitTime=clock}}}
 }if(!changed)break}
}

const board=$('world'),g=board.getContext('2d'),images={},sprites=[],W=3200,H=2300,road=142;
const circuits=[
 ['Tallåsen',1,[1,.96,.82,1,.97,.67,.94,1]],['Myrkanten',0,[1,.73,1,1,.65,.83,1,.97,.82]],['Granitpasset',0,[.96,.94,.58,.97,1,.76,.93,.88,1]],['Månvarvet',1,[1,.95,.86,.98,.75,.97,.74,.88]],['Långheden',0,[1,.84,.92,1,.66,1,.94,.75]],['Rävberget',0,[.98,.65,.88,1,.8,.96,.59,.97,1]],['Nattvakten',1,[1,.87,.66,1,.96,.7,1,.92,.8]],['Mosshöjden',0,[1,.64,1,.85,1,.78,.92,1]],['Klintvägen',0,[.84,1,.98,.67,1,.91,.76,.94,1,.75]],['Midnattsringen',1,[.94,1,.7,.92,1,.96,.59,.92]],['Kungsåsen',0,[1,.76,1,.95,.71,.92,1,.66,.95,.94]],['Svarta skogen',1,[1,.67,.94,.85,1,.65,1,.84,.97,.87]],
 ['Vitsippsdalen',0,[.98,.65,.86,1,.78,.94,.59,.83,.98]],['Kopparravinen',0,[.75,.99,.64,.89,1,.61,.85,.96,.72,1]],['Frostälven',0,[.92,.97,.76,.6,.94,1,.71,.91,1]],['Solviadukten',0,[1,.8,.56,.88,1,.72,.83,1,.69,.94]],['Polarnatten',1,[.94,.63,1,.76,.93,1,.61,.87,.95]],['Björkfors',0,[1,.84,.62,.97,.74,.99,.79,.56,1,.85]],['Lönnpasset',0,[.81,1,.78,.58,1,.9,.69,.92,1]],['Isbrytaren',0,[.91,1,.62,.87,.99,.63,.92,.72,.98,.81]],['Älvbron',0,[.76,.98,.84,.62,.97,.89,.63,1,.93]],['Norrskensleden',1,[1,.74,.9,.58,.83,1,.67,.94,.82,.97]]
];
const modes=['Varvlopp','Sprint','Tidjakt'],descriptions=['Tre varv mot elva förare. Först över mållinjen vinner.','Ett varv mot elva förare. Varje omkörning räknas.','Tre flygande varv på fri bana. Jaga ditt bästa varv.'];
let mode=0,idx=0,state='menu',track=[],length=0,scene,marks,ink,grid=[],cars=[],player,particles=[],clock=0,count=0,last=0,acc=0,cam={x:0,y:0},smokeTick=0,sessionBest=Infinity,lapStart=0,lastLap=0,record=Infinity,night=false,keys=new Set(),mapBounds,lightLayer,goTime=0;
const surface=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const fmt=t=>Math.floor(t/60)+':'+(t%60).toFixed(2).padStart(5,'0');
function makeTrack(){
 const cfg=circuits[idx],rs=cfg[2],phase=idx*.57+.23;
 // These routes alternate long straights with linked bends and broad hairpins.
 const shaped={
  0:[[440,540],[980,370],[1530,560],[2140,390],[2700,530],[2830,1010],[2410,1480],[1840,1740],[1550,1420],[1650,980],[1340,900],[1050,1390],[660,1670],[355,1420]],
  2:[[380,640],[1050,380],[1850,420],[2640,600],[2790,1030],[2420,1220],[2060,920],[1730,990],[1820,1430],[2310,1630],[2120,1910],[1270,1820],[850,1430],[400,1350]],
  4:[[355,870],[630,465],[1450,405],[2380,475],[2790,800],[2530,1140],[1740,1140],[1450,1390],[1550,1780],[1120,1870],[730,1480]],
  6:[[410,580],[1160,380],[1770,530],[2460,400],[2780,735],[2440,1000],[1990,1070],[1950,1480],[2370,1710],[2130,1910],[1450,1750],[950,1220],[550,1370],[325,1060]],
  9:[[340,920],[610,460],[1190,420],[1750,760],[2220,700],[2670,440],[2860,840],[2600,1550],[2160,1830],[1570,1620],[1090,1770],[680,1610]],
  11:[[380,700],[880,440],[1350,720],[1750,700],[2100,360],[2630,460],[2790,1050],[2440,1380],[2040,1190],[1730,1260],[1530,1760],[1010,1850],[580,1530]]
 };
 const anchors=shaped[idx]?shaped[idx].map(([x,y])=>({x,y})):rs.map((r,i)=>{const a=i*TAU/rs.length+phase;return {x:W/2+1280*r*Math.cos(a),y:H/2+865*r*Math.sin(a)}});
 // Add alternating gates on well-separated long sectors of the original loop.
 const spans=anchors.map((p,i)=>{const q=anchors[(i+1)%anchors.length];return {i,len:Math.hypot(q.x-p.x,q.y-p.y)}}).sort((a,b)=>b.len-a.len);
 const gates=new Set();for(const span of spans){if(span.len<490||gates.size===2)break;if(!gates.has(wrap(span.i-1,anchors.length))&&!gates.has((span.i+1)%anchors.length))gates.add(span.i)}
 const nodes=[];anchors.forEach((p,i)=>{nodes.push(p);if(!gates.has(i))return;const q=anchors[(i+1)%anchors.length],dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy),amp=Math.min(72,L*.09)*(i%2?1:-1);
 for(const [u,side] of [[.32,1],[.69,-1]])nodes.push({x:p.x+dx*u-dy/L*side*amp,y:p.y+dy*u+dx/L*side*amp})});
 const n=nodes.length;
 const dense=[];let total=0;
 for(let i=0;i<n;i++){let [a,b,c,d]=[-1,0,1,2].map(k=>nodes[wrap(i+k,n)]);for(let j=0;j<150;j++){let t=j/150;let coord=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);let p={x:coord('x'),y:coord('y')},prev=dense.at(-1);if(prev)total+=Math.hypot(p.x-prev.x,p.y-prev.y);dense.push({...p,s:total})}}
 const f=dense[0],z=dense.at(-1);length=total+Math.hypot(f.x-z.x,f.y-z.y);dense.push({...f,s:length});
 const num=Math.ceil(length/6);track=[];let j=0;
 for(let i=0;i<num;i++){let s=i*length/num;while(dense[j+1].s<s)j++;let a=dense[j],b=dense[j+1],t=(s-a.s)/(b.s-a.s);track.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})}
 track.forEach((p,i)=>{const a=track[wrap(i-1,num)],b=track[(i+1)%num];p.a=Math.atan2(b.y-a.y,b.x-a.x)});
 const xs=track.map(p=>p.x),ys=track.map(p=>p.y);mapBounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 night=!!cfg[1]
}
function delta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function at(s,l=0){let k=wrap(s,length)*track.length/length,i=Math.floor(k),p=track[i],q=track[(i+1)%track.length],t=k-i,a=p.a+delta(q.a,p.a)*t;return{x:p.x+(q.x-p.x)*t-Math.sin(a)*l,y:p.y+(q.y-p.y)*t+Math.cos(a)*l,a}}
function line(ctx,points,color,width,close=false){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(close)ctx.closePath();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke()}
function buildScene(){
 scene ||= surface(W,H);let c=scene.getContext('2d');marks ||= surface(W,H);marks.getContext('2d').clearRect(0,0,W,H);ink=marks.getContext('2d');
 c.fillStyle=c.createPattern(seasonalTile(),'repeat');c.fillRect(0,0,W,H);
 let seed=idx+21;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 function grit(base,amount){let tile=surface(144,144),v=tile.getContext('2d'),im=v.createImageData(144,144);for(let i=0;i<im.data.length;i+=4){let n=(rand()-.5)*amount;for(let j=0;j<3;j++)im.data[i+j]=base[j]+n;im.data[i+3]=255}v.putImageData(im,0,0);return c.createPattern(tile,'repeat')}
 const sites=[[length*(.14+.014*(idx%6)),'bridge'],[length*(.55+.018*(idx%5)),'viaduct']];for(const [s,type] of sites)crossing(c,s,type,false);
 c.lineJoin='round';line(c,track,grit([177,149,112],77),road+36,true);line(c,track,'#ece2d2',road+4,true);line(c,track,grit(season()===3?[177,188,193]:[100,97,96],32),road,true);
 if(season()===3)for(const [a,b] of [[.17,.31],[.58,.73]]){const pts=[];for(let s=a*length;s<b*length;s+=6)pts.push(at(s));line(c,pts,grit([156,184,201],16),road-2);for(let i=0;i<100;i++){let s=(a+rand()*(b-a))*length,l=(rand()-.5)*(road-14);line(c,[at(s,l),at(s+12+rand()*12,l+1)],'#e8fcff65',1.2)}}
 // The inner shoulder follows the signed bend, including both halves of a chicane.
 for(let s=0;s<length;s+=7){const curve=delta(at(s+24).a,at(s-24).a)/48;
 if(Math.abs(curve)<.00135)continue;const side=Math.sign(curve),edge=side*(road/2-4);
 line(c,[at(s,edge),at(s+7.4,edge)],'#edece7',12);
 line(c,[at(s,edge-5*side),at(s+1.5,edge+5*side)],'#9e9e9a',1.7)}
 for(let s=75;s<length;s+=330){let bend=delta(at(s+100).a,at(s).a);if(Math.abs(bend)<.08)continue;let lane=-Math.sign(bend)*(road/2+13);const pts=[];for(let j=0;j<=135;j+=9){let p=at(s+j,lane);pts.push(p);if(j%27===0){c.fillStyle='#554e45';c.fillRect(p.x-2,p.y-2,5,5)}}line(c,pts,'#4e4944',5);line(c,pts,'#d6d3c6',2)}
 for(const [s,type] of sites)crossing(c,s,type,true);
 let p=at(0);c.save();c.translate(p.x,p.y);c.rotate(p.a);for(let i=0;i<2;i++)for(let j=0;j<18;j++){c.fillStyle=(i+j)%2?'#3c3d3b':'#eeeade';c.fillRect(i*7,-road/2+j*road/18,7,road/18+.35)}c.restore();
}
function mini(canvas,live){let c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,[x,y,X,Y]=mapBounds,k=Math.min((w-24)/(X-x),(h-20)/(Y-y)),ox=(w-(X-x)*k)/2,oy=(h-(Y-y)*k)/2;
 let conv=p=>({x:ox+(p.x-x)*k,y:oy+(p.y-y)*k});c.clearRect(0,0,w,h);line(c,track.filter((_,i)=>i%5===0).map(conv),live?'#ebe9d7':'#79e7bd',live?4:5,true);if(live){for(let car of [...cars.slice(1).filter(c=>!c.done),player]){let p=conv(at(car.s,car.l));c.fillStyle=car===player?'#29ffda':'#f4b485';c.beginPath();c.arc(p.x,p.y,car===player?5:2.5,0,TAU);c.fill()}}}
function setupMenu(){idx=Number($('tracks').value);makeTrack();mini($('preview'),false);
 $('info').textContent=seasons[season()]+' · '+(night?'Natt':'Dag')+' · '+(idx+1)+' / '+circuits.length;
 $('modeName').textContent=modes[mode];$('modeIcon').textContent=['⚑','➤','◷'][mode];
 $('desc').textContent=['3 varv mot 11 förare','1 varv mot 11 förare','3 varv mot klockan'][mode]}
function resetInput(){keys.clear();document.querySelectorAll('#pad button').forEach(b=>b.classList.remove('active'))}
function begin(){
 resetInput();boost=1;boosting=false;driftUntil=0;hitTime=-1;audioStart();makeTrack();buildScene();clock=0;count=3;particles=[];sessionBest=Infinity;lastLap=0;lapStart=0;record=Infinity;try{record=Number(localStorage.getItem('midnight-v1-'+idx))||Infinity}catch{}
 cars=[];for(let i=0;i<(mode===2?1:12);i++){let slot=i===0?5:i<=5?i-1:i,s=mode===2?0:-(Math.floor(slot/2)+1)*48;cars.push({s,l:mode===2?0:(slot%2?34:-34),v:mode===2?235:0,yaw:0,lv:0,grip:0,lap:0,id:i,base:342+(i*17%35),done:false,finishTime:0})}
 player=cars[0];cam=at(player.s);state='count';goTime=0;$('menu').hidden=true;$('overlay').hidden=true;$('hud').hidden=false;document.body.classList.add('play');acc=0;last=0;
}
function box(paused){silent();state=paused?'paused':'finish';resetInput();document.body.classList.remove('play');$('overlay').hidden=false;$('resume').hidden=!paused;$('title').textContent=paused?'Paus':mode===2?'Tidjakten klar':position(player)===1?'Seger!':'I mål!';$('result').textContent=paused?circuits[idx][0]+' · '+modes[mode]:mode===2?'Bästa varv '+fmt(sessionBest)+' · Banrekord '+fmt(record):'Plats '+position(player)+' av 12 · Tid '+fmt(clock);$('resume').focus()}
let previous='race';function pause(){if(['race','count'].includes(state)){previous=state;box(true)}}function resume(){if(state!=='paused')return;audioStart();state=previous;last=0;acc=0;$('overlay').hidden=true;document.body.classList.add('play')}
function position(car){return 1+cars.filter(b=>b!==car&&(car.done?b.done&&b.finishTime<car.finishTime:b.done||b.s>car.s)).length}
function update(dt){
 if(state==='count'){let oldCount=Math.ceil(count);count-=dt;if(Math.ceil(count)!==oldCount)tone(count<=0?980:540,.12,.35);if(count<=0){state='race';goTime=.7}return}if(state!=='race')return;
 clock+=dt;goTime=Math.max(0,goTime-dt);smokeTick++;let targetLaps=mode===1?1:3;
 boosting=keys.has('boost')&&boost>.01&&player.v>30;boost=clamp(boost+(boosting?-.46:keys.has('boost')?0:.11)*dt,0,1);
 for(const car of cars){if(car.done)continue;let old=at(car.s,car.l),turn=delta(at(car.s+60).a,old.a)/60,me=car===player,steer=Number(keys.has('right'))-Number(keys.has('left')),traction=icy(car.s)?.36:season()===3?.68:1,slide=me&&(keys.has('drift')||clock<driftUntil)&&car.v>55,brake=me&&keys.has('brake');
 let limit=Math.abs(car.l)>road/2-8?150:boosting?453:355;if(me){car.v=clamp(car.v+((boosting?235:keys.has('gas')?117:0)-14-car.v*.07-(brake?230*traction:0)-(slide?17:0))*dt,0,boosting?458:Math.max(360,car.v));if(car.v>limit)car.v=Math.max(limit,car.v-170*dt);
 const wanted=(steer||(slide?Math.sign(turn):0))*(slide?.67:.38);car.yaw+=(wanted-car.yaw)*Math.min(1,dt*(slide?4.6:7));let demand=car.v*Math.sin(car.yaw)-turn*car.v*car.v*(slide?.19:.095)/traction;car.lv+=(demand-car.lv)*Math.min(1,dt*(slide?2.2:5.6)*traction)
 }else{
 const near=delta(at(car.s+40).a,at(car.s-20).a)/60;
 const look=90+car.v*.29,future=delta(at(car.s+look+32).a,at(car.s+look-32).a)/64;
 let lane=clamp(near*9100-future*4800,-43,43)+Math.sin(car.id*2.4)*4;
 let goal=clamp(car.base-Math.max(Math.abs(near),Math.abs(future)*.84)*9500/Math.sqrt(traction),185,car.base);
 let lead=null,closest=135;
 for(const rival of cars){if(rival===car||rival.done)continue;const gap=wrap(rival.s-car.s,length);if(gap<closest&&Math.abs(rival.l-car.l)<29){lead=rival;closest=gap}}
 if(lead){const options=[lead.l-30,lead.l+30].filter(v=>Math.abs(v)<58&&cars.every(r=>r===car||r===lead||r.done||Math.abs(wrap(r.s-car.s+length/2,length)-length/2)>52||Math.abs(r.l-v)>22));
 if(options.length){lane=options.reduce((a,b)=>Math.abs(a-car.l)<Math.abs(b-car.l)?a:b);if(closest<50&&Math.abs(car.l-lead.l)<20)goal=Math.min(goal,lead.v)}
 else goal=Math.min(goal,Math.max(0,lead.v+(closest-58)*2))}
 car.v+=clamp(goal-car.v,-210*dt*traction,128*dt);const demand=clamp((lane-car.l)*2.8,-95,95);
 car.lv+=(demand-car.lv)*dt*5*traction;car.yaw+=(clamp(car.lv/Math.max(60,car.v)+near*car.v*.12,-.42,.42)-car.yaw)*dt*6
 }
 car.l+=car.lv*dt;let edge=road/2+6;if(Math.abs(car.l)>edge){car.l=clamp(car.l,-edge,edge);car.lv*=.3}
 car.s+=car.v*dt*Math.cos(car.yaw*.8)/clamp(1-turn*car.l,.75,1.3);
 let now=at(car.s,car.l);car.grip=car.v>85&&(slide&&(Math.abs(car.yaw)>.09||Math.abs(turn)>.0009)||Math.abs(turn)*car.v*car.v>185||brake&&car.v>180);
 if(car.grip){const wheels=(p,yaw,side)=>{const a=p.a+yaw;return{x:p.x-14*Math.cos(a)-side*8*Math.sin(a),y:p.y-14*Math.sin(a)+side*8*Math.cos(a)}};for(let side of [-1,1])line(ink,[wheels(old,car.yaw,side),wheels(now,car.yaw,side)],'rgba(27,24,24,.30)',2.4);
 if(smokeTick%5===0&&Math.hypot(now.x-cam.x,now.y-cam.y)<850&&particles.length<200)particles.push({x:now.x-13*Math.cos(now.a),y:now.y-13*Math.sin(now.a),t:0,dx:(Math.random()-.5)*18,dy:(Math.random()-.5)*18})}
 }
 contacts();
 for(const car of cars){if(car.done)continue;const me=car===player;
 const lap=Math.max(0,Math.floor(car.s/length));if(lap>car.lap){car.lap=lap;if(me){lastLap=clock-lapStart;lapStart=clock;sessionBest=Math.min(sessionBest,lastLap);if(mode===2&&lastLap<record){record=lastLap;try{localStorage.setItem('midnight-v1-'+idx,record)}catch{}}}}
 if(car.s>=targetLaps*length){car.done=true;car.finishTime=clock-(car.s-targetLaps*length)/Math.max(1,car.v)}
 }
 particles=particles.filter(p=>(p.t+=dt)<.83);for(let p of particles){p.x+=p.dx*dt;p.y+=p.dy*dt}
 let aim=at(player.s+player.v*.36,player.l*.65),k=1-Math.exp(-dt*6);cam.x+=(aim.x-cam.x)*k;cam.y+=(aim.y-cam.y)*k;
 if(player.done)box(false)
}
let beam,woodland;
function lightingTexture(){beam=surface(260,150);let c=beam.getContext('2d'),im=c.createImageData(260,150);for(let x=0;x<260;x++)for(let y=0;y<150;y++){let width=5+x*.32,fall=Math.max(0,1-Math.abs(y-75)/width),intensity=Math.pow(fall,.55)*Math.pow(1-x/260,.85);let i=(y*260+x)*4;im.data[i]=255;im.data[i+1]=236;im.data[i+2]=178;im.data[i+3]=Math.round(255*intensity)}c.putImageData(im,0,0)}
function resize(){let d=Math.min(devicePixelRatio||1,1.65);board.width=Math.round(innerWidth*d);board.height=Math.round(innerHeight*d);lightLayer=surface(board.width,board.height)}
function draw(){
 let w=board.width,h=board.height,sz=Math.min(w/740,h/510);if(innerWidth<innerHeight)sz=w/470;
 const tx=w/2-cam.x*sz,ty=h/2-cam.y*sz;
 g.setTransform(sz,0,0,sz,tx,ty);let left=-tx/sz,top=-ty/sz,ww=w/sz,hh=h/sz;
 g.fillStyle=terrainPattern;g.fillRect(left,top,ww,hh);g.drawImage(scene,0,0);g.drawImage(marks,0,0);
 const visible=cars.filter(c=>!c.done||c===player).map(c=>({...at(c.s,c.l),car:c})).filter(p=>p.x>left-260&&p.x<left+ww+260&&p.y>top-260&&p.y<top+hh+260);
 for(let p of visible){let c=p.car;g.save();g.translate(p.x,p.y);g.rotate(p.a+c.yaw);g.fillStyle='#17131665';g.beginPath();g.ellipse(-1,3,23,11,0,0,TAU);g.fill();g.drawImage(sprites[c.id],-23,-11.5,46,23);g.restore()}
 for(let p of particles){let r=4+13*p.t,alpha=(1-p.t/.83)*.36;let grad=g.createRadialGradient(p.x,p.y,0,p.x,p.y,r);grad.addColorStop(0,'rgba(235,231,225,'+alpha+')');grad.addColorStop(1,'rgba(235,231,225,0)');g.fillStyle=grad;g.fillRect(p.x-r,p.y-r,r*2,r*2)}
 if(night){const l=lightLayer.getContext('2d');l.setTransform(1,0,0,1,0,0);l.globalCompositeOperation='copy';l.fillStyle='rgba(4,10,31,.86)';l.fillRect(0,0,w,h);l.globalCompositeOperation='destination-out';l.setTransform(sz,0,0,sz,tx,ty);
 for(const p of visible){l.save();l.translate(p.x,p.y);l.rotate(p.a+p.car.yaw);for(let side of [-1,1])l.drawImage(beam,16,side*7-75);l.restore()}
 g.setTransform(1,0,0,1,0,0);g.drawImage(lightLayer,0,0);g.setTransform(sz,0,0,sz,tx,ty);
 for(const p of visible){g.save();g.translate(p.x,p.y);g.rotate(p.a+p.car.yaw);g.globalAlpha=.17;for(let side of [-1,1])g.drawImage(beam,17,side*7-75);g.globalAlpha=1;for(let side of [-1,1]){g.fillStyle='#ffedaf';g.fillRect(18,side*7-2,3,4);g.shadowBlur=8;g.shadowColor='#ff3730';g.fillStyle='#ff4136';g.fillRect(-21,side*7-2,3,4);g.shadowBlur=0}g.restore()}}
 let p=at(player.s,player.l);g.fillStyle='#25f8d4';g.strokeStyle='#113f3d';g.lineWidth=1.2;g.beginPath();g.moveTo(p.x,p.y-19);g.lineTo(p.x-5.5,p.y-29);g.lineTo(p.x+5.5,p.y-29);g.closePath();g.fill();g.stroke();
 $('rank').textContent=mode===2?'TIDJAKT':position(player)+'/12';$('laps').textContent='VARV '+Math.min(mode===1?1:3,player.lap+1)+'/'+(mode===1?1:3);$('timer').textContent=fmt(mode===2?clock-lapStart:clock);$('speed').textContent=Math.round(player.v*.6)+' km/h'+(mode===2&&isFinite(record)?' · Rekord '+fmt(record):'');$('notice').textContent=state==='count'?Math.ceil(count):goTime>0?'KÖR!':'';mini($('map'),true);$('charge').style.setProperty('--charge',Math.round(boost*100)+'%');motor()
}
function frame(now){if(state==='count'||state==='race'){let elapsed=last?Math.min((now-last)/1000,.12):0;acc+=elapsed;while(acc>=1/60){update(1/60);acc-=1/60}draw()}last=now;requestAnimationFrame(frame)}
const mapping={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'drift',ShiftLeft:'boost',ShiftRight:'boost'};
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['Equal','Minus','Digit0','NumpadAdd','NumpadSubtract'].includes(e.code)){e.preventDefault();return}if(e.code==='Escape'&&!e.repeat){if(state==='paused')resume();else pause();return}if(['race','count'].includes(state)&&mapping[e.code]){e.preventDefault();keys.add(mapping[e.code]);if(e.code==='Space'&&!e.repeat)driftUntil=clock+.65}});window.addEventListener('keyup',e=>keys.delete(mapping[e.code]));
for(const b of document.querySelectorAll('#pad button')){let k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(k);if(k==='drift')driftUntil=clock+.65;b.classList.add('active')};b.onlostpointercapture=b.onpointercancel=b.onpointerup=()=>{keys.delete(k);b.classList.remove('active')}}
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();silent()}else if(state==='menu')playTheme(true)});window.addEventListener('resize',resize);
$('pause').onclick=pause;$('resume').onclick=resume;$('again').onclick=begin;$('back').onclick=()=>{state='menu';playTheme(true);$('menu').hidden=false;$('hud').hidden=$('overlay').hidden=true;setupMenu();$('start').focus()};
async function init(){const start=$('start');start.disabled=true;start.textContent='Laddar banorna…';await Promise.all(Object.entries(assets).map(async([k,src])=>{let im=new Image();im.src=src;await im.decode();images[k]=im}));
 for(let i=0;i<12;i++){let c=surface(images.car.width,images.car.height),v=c.getContext('2d');v.drawImage(images.car,0,0);let im=v.getImageData(0,0,c.width,c.height),d=im.data,color=[[0,0,0],[228,53,44],[251,176,36],[67,103,229],[205,79,176],[225,220,207],[127,192,43],[242,111,29],[143,74,184],[237,198,32],[49,117,189],[216,64,104]][i];if(i)for(let j=0;j<d.length;j+=4){let r=d[j],green=d[j+1];if(green-r>18&&d[j+2]-r>12){let k=green/230;for(let ch=0;ch<3;ch++)d[j+ch]=Math.min(255,color[ch]*k+r*.16)}}v.putImageData(im,0,0);sprites.push(c)}
 circuits.forEach(([name,n],i)=>$('tracks').add(new Option(name,i)));
 for(const [id,step] of [['modePrev',-1],['modeNext',1]])$(id).onclick=()=>{mode=wrap(mode+step,modes.length);setupMenu()};
 $('help').textContent=matchMedia('(pointer:coarse)').matches?'Håll Gas och styr med pilarna. Tryck Drift i kurvan och Boost på raksträckan.':'↑ Gas · ↓ Broms · ← → Styr · Mellanslag driftar · Skift ger boost.';
 $('sound').onclick=()=>{soundOn=!soundOn;if(soundOn)playTheme(true);else silent();$('sound').textContent=soundOn?'Ljud på':'Ljud av';$('sound').setAttribute('aria-pressed',soundOn)};
 for(let [id,step] of [['prev',-1],['next',1]])$(id).onclick=()=>{$('tracks').value=wrap(idx+step,circuits.length);setupMenu()};
 for(const event of ['click','keydown','touchend'])document.addEventListener(event,()=>{if(state==='menu')playTheme(true)});playTheme(true);
 $('tracks').onchange=setupMenu;resize();lightingTexture();setupMenu();start.disabled=false;start.textContent='Starta loppet →';start.onclick=begin;requestAnimationFrame(frame)
}
for(const event of ['gesturestart','gesturechange','gestureend','contextmenu','selectstart','dragstart'])document.addEventListener(event,e=>{if(state!=='menu')e.preventDefault()},{passive:false});
document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault()},{passive:false});
init().catch(()=>{$('start').textContent='Bilderna kunde inte laddas. Öppna spelet igen.'});
