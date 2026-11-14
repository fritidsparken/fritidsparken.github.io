'use strict';
// All track coordinates are fixed in world space. Only the chase camera travels.
const $=id=>document.getElementById(id),canvas=$('view'),ctx=canvas.getContext('2d');
const art={},reader=storyReader($('line'),$('retry'));
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
const names=['Lyktgången','Blådjupet','Kristallvalvet','Koppargruvan','Flöjtens källa'];
const safeRoutes=[[-1,1,-1],[1,-1,-1,1],[-1,1,1,-1],[1,1,-1,1,-1],[-1,1,-1,-1,1]];
const levels=names.map((name,i)=>({name,speed:12+i, length:130+safeRoutes[i].length*95,forks:safeRoutes[i].map((safe,j)=>({at:65+j*95,safe}))}));
const KEY='lostWorlds.minecart.v1',clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>(t=clamp(t,0,1),t*t*(3-2*t));
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch{}
let level=Number.isInteger(saved.level)?clamp(saved.level,0,4):0;
let cp=Number.isFinite(saved.cp)?clamp(saved.cp,0,levels[level].length-10):0;
// Checkpoints are exclusively after completed junctions, never on a branch.
cp=Math.max(0,...levels[level].forks.filter(f=>f.at+66<=cp).map(f=>f.at+66));
let seen=!!saved.seen,completed=!!saved.completed,outro=!!saved.outro;
let z=cp,px=0,cameraX=0,speed=0,mode='loading',choice=0,locked=null,fall=0,roll=0,previousZ=z,last=0,acc=0;
let W=960,H=540,F=550,HY=230,viewZ=z,viewX=0;
const held=new Set();let braking=false;
function persist(){try{localStorage.setItem(KEY,JSON.stringify({level,cp,seen,completed,outro}));localStorage.setItem('lostWorlds.cave','1')}catch{}}
function reset(){z=cp;previousZ=z;px=cameraX=0;speed=0;choice=0;locked=null;fall=0;roll=0;held.clear();braking=false;updateChoice()}
function ui(state){mode=state;$('menu').hidden=!['loading','ready','pause','dead','finished','error'].includes(state);$('story').hidden=state!=='story';$('hud').hidden=state!=='run';$('touch').hidden=state!=='run';$('junction').hidden=true;held.clear();braking=false}
function panel(state,title,desc,button){ui(state);$('title').textContent=title;$('desc').textContent=desc;$('go').textContent=button;$('go').disabled=state==='loading'}
function enter(){ui('run');last=performance.now();acc=0;$('chapter').textContent='FLÖJTENS EKO · '+(level+1)+' / 5';$('place').textContent=names[level];$('score').volume=.18;$('score').play().catch(()=>{})}
function story(lines,end,done){ui('story');$('story').classList.toggle('end',end);$('score').volume=.08;$('score').play().catch(()=>{});reader.start(lines,done)}
function finishStory(){outro=false;completed=true;persist();$('score').pause();panel('finished','Tillsammans igen','Navid och Laleh har hittat hem med flöjten.','Åk igen')}
function finish(){if(level<4){level++;cp=0;reset();persist();panel('ready',names[level],'Spåren leder djupare in i berget. Följ lyktorna mot flöjtens eko.','Nästa grotta')}else{outro=true;persist();story(ending,true,finishStory)}}
$('go').onclick=()=>{if(mode==='error'){location.reload();return}if(mode==='pause'){enter();return}if(mode==='dead'){reset();enter();return}if(completed){level=0;cp=0;completed=outro=seen=false;reset();persist()}if(outro){story(ending,true,finishStory);return}if(!seen){story(opening,false,()=>{seen=true;persist();enter()})}else enter()};
$('skip').onclick=()=>reader.skip();
function pause(){if(mode==='run'){panel('pause','Paus','Vagnen väntar här.','Fortsätt');$('score').pause()}}
$('pause').onclick=pause;
function nextFork(){return levels[level].forks.find(f=>z<f.at+1)}
function choose(side){if(mode!=='run'||fall||locked)return;const f=nextFork();if(f&&f.at-z<=38&&z<=f.at){choice=side;updateChoice()}}
function updateChoice(){for(const side of [-1,1]){const b=$(side<0?'left':'right');b.classList.toggle('selected',choice===side);b.setAttribute('aria-pressed',String(choice===side))}}
for(const side of [-1,1]){$(side<0?'left':'right').addEventListener('pointerdown',e=>{e.preventDefault();choose(side)})}
$('brake').addEventListener('pointerdown',e=>{e.preventDefault();braking=true;$('brake').setPointerCapture(e.pointerId)});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('brake').addEventListener(event,()=>braking=false);
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','a','d','s','A','D','S','Escape'].includes(e.key)){e.preventDefault();held.add(e.key.toLowerCase());if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')choose(-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')choose(1);if(e.key==='Escape')pause()}});
addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
function branchX(f,at,side){const t=at-f.at;if(t<=0)return 0;if(t<24)return side*7*smooth(t/24);if(side!==f.safe)return side*7;if(t<35)return side*7;return side*7*(1-smooth((t-35)/30))}
function mainX(at){for(const f of levels[level].forks)if(at>=f.at&&at<=f.at+65)return branchX(f,at,f.safe);return 0}
function playerX(){return locked?branchX(locked.f,z,locked.side):mainX(z)}
function update(dt){
 if(fall){fall+=dt;speed=Math.max(0,speed-8*dt);z+=speed*dt;roll+=dt;if(fall>1.6){$('score').pause();panel('dead','Spåret tog slut','Vagnen föll ner i mörkret. Försök igen från senaste säkra växel.','Försök igen')}return}
 const f=nextFork();
 if(f&&!locked&&f.at-z<=38){if(held.has('arrowleft')||held.has('a'))choose(-1);if(held.has('arrowright')||held.has('d'))choose(1)}
 const slow=braking||held.has('arrowdown')||held.has('s')||held.has(' ');
 speed+=( (slow?4:levels[level].speed)-speed)*Math.min(1,dt*2.8);
 z+=speed*dt;roll+=speed*dt;
 if(f&&!locked&&z>=f.at){locked={f,side:choice||-f.safe};choice=locked.side;updateChoice()}
 if(locked){if(locked.side!==locked.f.safe&&z>=locked.f.at+24){fall=.001;return}if(z>=locked.f.at+66){cp=locked.f.at+66;locked=null;choice=0;updateChoice();persist()}}
 px=playerX();cameraX+=(px-cameraX)*Math.min(1,dt*7);
 if(z>=levels[level].length){finish();return}
 $('distance').value=z/levels[level].length;
 const approaching=!locked&&f&&f.at-z<=38;
 $('junction').hidden=!approaching;
 if(approaching){$('junctionText').textContent=choice?(choice<0?'Vänster spår valt':'Höger spår valt'):'Välj spår';$('junctionHint').textContent='Följ den gröna lyktan · '+Math.max(0,Math.ceil((f.at-z)/Math.max(speed,4)))+' s';}
}
function project(x,y,at){const d=at-viewZ+8;return [W/2+(x-viewX)*F/d,HY+(3.25-y)*F/d,F/d]}
function poly(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(color){ctx.fillStyle=color;ctx.fill()}}
function worldQuad(x1,x2,z1,z2,y,color){if(z2<viewZ-6)return;z1=Math.max(z1,viewZ-6);poly([project(x1,y,z1),project(x2,y,z1),project(x2,y,z2),project(x1,y,z2)],color)}
function line(a,b,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}
let groundRenderer=null;
function createGroundRenderer(image){
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});if(!gl)return null;surface.addEventListener('webglcontextlost',event=>{event.preventDefault();groundRenderer=null});
 const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('Ground shader');return sh};
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;
 uniform sampler2D ground;uniform vec2 resolution;uniform float horizon,focal,travel,lateral;uniform vec3 tint;
 void main(){float y=resolution.y-gl_FragCoord.y;if(y<=horizon){gl_FragColor=vec4(0.);return;}
 float d=3.25*focal/(y-horizon);float x=(gl_FragCoord.x-resolution.x*.5)*d/focal+lateral;
 vec3 stone=texture2D(ground,vec2(x,travel-8.+d)/8.).rgb*tint;
 float fog=clamp(d/180.,0.,.6);stone=mix(stone,vec3(.16,.14,.13),fog);
 float alpha=smoothstep(horizon,horizon+resolution.y*.055,y);gl_FragColor=vec4(stone,alpha);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Ground program');gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
 const ext=gl.getExtension('EXT_texture_filter_anisotropic');if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
 const u={};for(const name of ['resolution','horizon','focal','travel','lateral','tint'])u[name]=gl.getUniformLocation(program,name);
 return ()=>{if(surface.width!==Math.round(W)||surface.height!==Math.round(H)){surface.width=Math.round(W);surface.height=Math.round(H)}gl.viewport(0,0,surface.width,surface.height);gl.useProgram(program);gl.uniform2f(u.resolution,W,H);gl.uniform1f(u.horizon,HY);gl.uniform1f(u.focal,F);gl.uniform1f(u.travel,viewZ);gl.uniform1f(u.lateral,viewX);gl.uniform3fv(u.tint,[[1.12,.91,.7],[.65,.85,1.08],[.86,.76,1.05],[1.05,.79,.62],[.76,.98,.81]][level]);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);ctx.drawImage(surface,0,0,W,H)};
}
function drawGround(){
 if(groundRenderer){groundRenderer();return}
 // Canvas fallback retains the same fixed world coordinates when WebGL is unavailable.
 const im=art.floor,top=HY+1;
 for(let y=top;y<H;y+=3){const d=3.25*F/(y-HY),d2=3.25*F/(y+3-HY),at=viewZ-8+d,s=F/d,step=8*s,sy=((at%8+8)%8)/8*im.height,sh=Math.max(1,Math.min(im.height-sy,Math.abs(d-d2)/8*im.height)),origin=W/2-viewX*s;
 ctx.globalAlpha=clamp((y-HY)/(H*.055),0,1);for(let k=Math.floor(-origin/step)-1;origin+k*step<W;k++)ctx.drawImage(im,0,sy,im.width,sh,origin+k*step,y,step+.5,3.2);
 }ctx.globalAlpha=1;
}
function pit(f){const x=-f.safe*7,start=f.at+24,end=start+22;
 // A hole cut into the ground; the rim, rails and abyss share the same projection.
 worldQuad(x-3.1,x+3.1,start,end,0,'#020307');
 if(end<viewZ-6)return;ctx.save();poly([project(x-3.1,0,Math.max(start,viewZ-6)),project(x+3.1,0,Math.max(start,viewZ-6)),project(x+3.1,0,end),project(x-3.1,0,end)]);ctx.clip();
 if(start>viewZ-6){const a=project(x-3.1,0,start),b=project(x+3.1,0,start);line(a,b,'#6d5745',Math.max(1,a[2]*.12));}
 for(const side of [-1,1]){const edge=x+side*3.1;const near=Math.max(start,viewZ-6);poly([project(edge,0,near),project(edge,0,end),project(edge,-3,end),project(edge,-3,near)],side<0?'#211b19':'#100f13')}ctx.restore();
}
function trackSection(z1,z2,center){
 const segments=[];
 for(let at=Math.max(z1,Math.floor((viewZ-5)/1.25)*1.25);at<Math.min(z2,viewZ+190);at+=1.25)segments.push([at,Math.min(at+1.25,z2)]);
 for(let i=segments.length-1;i>=0;i--){const [a,b]=segments[i],xa=center(a),xb=center(b);
 const tie=a+.6;if(tie<z2){const x=center(tie);poly([project(x-1.2,.03,tie-.13),project(x+1.2,.03,tie-.13),project(x+1.2,.03,tie+.13),project(x-1.2,.03,tie+.13)],'#463124');line(project(x-1.2,.05,tie-.13),project(x+1.2,.05,tie-.13),'#967051',Math.max(.5,project(x,0,tie)[2]*.045))}
 for(const side of [-1,1]){const x1=xa+side*.78,x2=xb+side*.78;
 poly([project(x1-.07,.13,a),project(x1+.07,.13,a),project(x2+.07,.13,b),project(x2-.07,.13,b)],'#8f9d9c');
 line(project(x1,.16,a),project(x2,.16,b),'#c5c7b9',Math.max(.6,project(x1,0,a)[2]*.025));
 }
 }
}
function lantern(f){const at=f.at+32,x=f.safe*8.35;if(at<viewZ-5)return;const base=project(x,0,at),top=project(x,1.5,at),s=top[2];line(base,top,'#3b3029',Math.max(1,s*.09));const g=ctx.createRadialGradient(top[0],top[1],0,top[0],top[1],Math.max(1,s*.65));g.addColorStop(0,'#bcffb8');g.addColorStop(.16,'#6ef0a8ee');g.addColorStop(1,'#62e49c00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(top[0],top[1],Math.max(1,s*.65),0,Math.PI*2);ctx.fill();ctx.fillStyle='#d0ffb4';ctx.fillRect(top[0]-s*.08,top[1]-s*.12,s*.16,s*.24)}
function drawTracks(){
 const lv=levels[level];for(const f of [...lv.forks].reverse())pit(f);
 trackSection(0,lv.length,mainX);
 for(const f of [...lv.forks].reverse()){trackSection(f.at,f.at+24,at=>branchX(f,at,-f.safe));lantern(f)}
 const end=project(0,0,lv.length);if(lv.length-viewZ<180){line(project(-1.25,0,lv.length),project(1.25,0,lv.length),'#e9cb80',Math.max(1,end[2]*.15));const g=ctx.createRadialGradient(end[0],end[1],0,end[0],end[1],Math.max(1,end[2]*3));g.addColorStop(0,'#e7ca7960');g.addColorStop(1,'#e7ca7900');ctx.fillStyle=g;ctx.fillRect(end[0]-end[2]*3,end[1]-end[2]*3,end[2]*6,end[2]*6)}
}
function drawCart(){
 const p=project(px,.1,viewZ),s=p[2],bob=mode==='run'&&!fall?Math.sin(roll*4)*.5:0;
 const drop=fall?Math.pow(fall,2)*H*.75:0,scale=fall?Math.max(.2,1-fall*.3):1;
 const width=s*2.95*scale,height=width;
 ctx.save();ctx.translate(p[0],p[1]+bob+drop);ctx.rotate(fall?fall*.38:clamp((px-cameraX)*-.04,-.09,.09));
 if(!fall){ctx.fillStyle='#08090a70';ctx.beginPath();ctx.ellipse(0,0,width*.41,width*.06,0,0,Math.PI*2);ctx.fill()}
 const position=roll*1.4%6,frame=Math.floor(position),blend=position-frame;
 for(let j=0;j<2;j++){const im=art['cart'+((frame+j)%6)];ctx.globalAlpha=j?blend:1;ctx.drawImage(im,-width/2,-height*.94,width,height)}
 ctx.restore();
}
function render(){
 W=canvas.clientWidth;H=canvas.clientHeight;const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);HY=H*.55;F=Math.min(H*.74,W*.91);viewX=cameraX;
 const end=outro||completed,im=art[end?'ending':'cave'+level];if(!im)return;
 const scale=Math.max(W/im.width,H/im.height)*(1.04+(end?0:.10*z/levels[level].length));const iw=im.width*scale,ih=im.height*scale;
 ctx.drawImage(im,clamp((W-iw)/2-viewX*2,W-iw,0),clamp(HY-ih*.57,H-ih,0),iw,ih);
 if(end||!art.cart0)return;
 drawGround();drawTracks();drawCart();
 const shade=ctx.createRadialGradient(W/2,H*.48,H*.1,W/2,H*.48,Math.max(W,H)*.72);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#02050b99');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 if(fall){ctx.fillStyle='rgba(0,0,0,'+clamp((fall-.8)/.8,0,.95)+')';ctx.fillRect(0,0,W,H)}
}
function frame(now){if(mode==='run'){acc+=Math.min(.1,(now-last)/1000);while(acc>=1/90&&mode==='run'){previousZ=z;update(1/90);acc-=1/90}viewZ=mode==='run'?previousZ+(z-previousZ)*clamp(acc*90,0,1):z}else viewZ=z;last=now;render();requestAnimationFrame(frame)}
function load(name){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{art[name]=im;resolve()};im.onerror=reject;im.src='echo-art/'+name+'.webp'})}
Promise.all([...names.map((_,i)=>'cave'+i),'ending','floor',...Array.from({length:6},(_,i)=>'cart'+i)].map(load)).then(()=>{
 try{groundRenderer=createGroundRenderer(art.floor)}catch{groundRenderer=null}
 const arrived=new URLSearchParams(location.search).get('from')==='aqueduct';if(arrived){level=0;cp=0;seen=completed=outro=false}reset();persist();
 panel(completed?'finished':'ready',completed?'Tillsammans igen':'Flöjtens eko',completed?'Navid och Laleh har hittat hem.':'Sätt dig i gruvvagnen och följ spåren in i berget. Välj vänster eller höger vid växlarna. En grön lykta visar spåret som fortsätter. Bromsa om du behöver mer tid.',completed?'Åk igen':'Starta färden');
 if(arrived){history.replaceState(null,'',location.pathname+location.hash);$('go').onclick()}requestAnimationFrame(frame);
}).catch(()=>panel('error','Grottan kunde inte öppnas','Kontrollera anslutningen och försök igen.','Försök igen'));
