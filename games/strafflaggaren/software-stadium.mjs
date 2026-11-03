// Camera-projected arena layer for devices without WebGL. Players, ball and the
// near net are drawn separately so they remain interactive between scenery renders.
const tau=Math.PI*2;
function generator(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const skies=[
  [[81,147,197],[208,220,208],[92,122,51]],
  [[117,120,157],[252,188,143],[103,121,52]],
  [[41,69,109],[142,161,179],[78,115,55]],
  [[11,18,33],[49,58,75],[76,104,48]]
];
function makeTree(seed){
  const r=generator(seed),c=canvas(112,152),g=c.getContext('2d');
  g.strokeStyle='#5d5343';g.lineCap='round';g.lineWidth=6;g.beginPath();g.moveTo(55,152);g.lineTo(55,55);g.stroke();
  for(let i=0;i<13;i++){
    const side=i%2?-1:1,x=55+side*(12+r()*25),y=26+r()*58;
    g.lineWidth=2.2+r();g.beginPath();g.moveTo(55,y+48);g.bezierCurveTo(55,y+27,x,y+20,x,y);g.stroke();
  }
  const bunches=[];
  for(let i=0;i<29;i++){
    const a=r()*tau,rad=Math.sqrt(r()),x=55+Math.cos(a)*rad*36,y=60+Math.sin(a)*rad*43;
    bunches.push([x,y,10+r()*12]);
  }
  bunches.sort((a,b)=>b[0]-a[0]);
  for(const [x,y,size] of bunches){
    const b=r();for(let j=0;j<140;j++){const a=r()*tau,t=Math.sqrt(r()),X=x+Math.cos(a)*size*t,Y=y+Math.sin(a)*size*t;
      const light=(1-X/112)*.3+(1-Y/150)*.25+r()*.25+b*.19;
      g.fillStyle=`rgb(${Math.round(16+76*light)},${Math.round(37+87*light)},${Math.round(16+34*light)})`;
      const rad=.7+r()*2.2;g.fillRect(X,Y,rad*1.5,rad);
    }
  }
  return c;
}
function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function noise(x,y){const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v);
  return (hash(i,j)*(1-a)+hash(i+1,j)*a)*(1-b)+(hash(i,j+1)*(1-a)+hash(i+1,j+1)*a)*b;}
const colors=['#eec845','#d6a939','#485c77','#304866','#a6a9ad','#343d50','#b05d51','#b2beb1','#e7e4d4','#7c9291'];
const skin=['#daa378','#c58d6e','#e9b48b','#956b50','#795540'];
function buildSurface(g,w,h,camera,arena,noiseTile){
  // Ray/plane intersection gives a stable perspective texture with markings in world coordinates.
  const pixels=g.createImageData(w,h),buf=pixels.data,weather=skies[arena];
  const m=camera.matrixWorld.elements,ox=m[12],oy=m[13],oz=m[14],fy=Math.tan(camera.fov*Math.PI/360),fx=fy*camera.aspect;
  for(let y=0,i=0;y<h;y++){
    const v=(1-(y+.5)/h*2)*fy, bx=m[4]*v-m[8],by=m[5]*v-m[9],bz=m[6]*v-m[10];
    for(let x=0;x<w;x++,i+=4){
      const u=(2*(x+.5)/w-1)*fx,dx=bx+m[0]*u,dy=by+m[1]*u,dz=bz+m[2]*u;
      const depth=dy<-.0001?-oy/dy:1000,X=ox+dx*depth,Z=oz+dz*depth;
      if(depth>120||Math.abs(X)>62||Z < -45||Z>101){
        const hY=Math.max(0,Math.min(1,dy/Math.sqrt(1+u*u+v*v))),f=Math.sqrt(hY),a=weather[0],b=weather[1];
        const c=arena<2?noise(dx/(hY+.13)*1.23,dz/(hY+.13)*1.23)*.65+noise(dx/(hY+.13)*3,dz/(hY+.13)*3)*.35:0;
        const cloud=Math.min(.62,Math.max(0,(c-.5)*2.5))*Math.min(1,hY*12);
        for(let j=0;j<3;j++)buf[i+j]=(a[j]*f+b[j]*(1-f))*(1-cloud)+[248,241,226][j]*cloud;
      }else{
        const G=weather[2],ix=(Math.floor(X*62)&127),iz=(Math.floor(Z*62)&127);
        const distance=Math.max(0,1-depth/70),grain=noiseTile[iz*128+ix]*distance;
        const stripe=.90+.15*Math.min(1,Math.max(0,.5+Math.sin(Z*.58)*3.6));
        const turfSun=arena===0?1+.052*Math.sin(X*.093+Z*.067):arena>1?1+.08*Math.cos(X*.083)*Math.cos(Z*.079):1.04;
        const tone=stripe*turfSun*(.99+grain*.105+Math.sin(X*1.8+Z*.44)*Math.sin(Z*1.7-X*.95)*.036);
        const thickness=Math.max(.055,depth/h*.40),ax=Math.abs(X);
        let line=Infinity;
        if(ax<=30.04&&Z>-.1&&Z<60.1){
          const z=Z<30?Z:60-Z;
          line=Math.min(ax<30?Math.abs(z):99,Math.abs(ax-30),Math.abs(Z-30));
          if(ax<20.16)line=Math.min(line,Math.abs(z-16.5));if(z<16.5)line=Math.min(line,Math.abs(ax-20.16));
          if(ax<9.16)line=Math.min(line,Math.abs(z-5.5));if(z<5.5)line=Math.min(line,Math.abs(ax-9.16));
          if(z>16.5&&ax<8)line=Math.min(line,Math.abs(Math.hypot(X,z-11)-9.15));
          if(Math.abs(Z-30)<7&&ax<7)line=Math.min(line,Math.abs(Math.hypot(X,Z-30)-6.5));
          if(ax<.13&&Math.abs(z-11)<.13)line=Math.min(line,Math.max(0,Math.hypot(X,z-11)-.07));
        }
        const paint=Math.min(1,Math.max(0,(thickness-line)/(thickness*.64))),haze=Math.max(0,(depth-45)/260);
        for(let j=0;j<3;j++){const ground=G[j]*tone+grain*5;buf[i+j]=(ground*(1-paint)+[216,219,185][j]*paint)*(1-haze)+weather[1][j]*haze;}
      }
      buf[i+3]=255;
    }
  }
  g.putImageData(pixels,0,0);
}

function scenery(arena){
  const r=generator(3719+arena),objects=[];
  const poly=(pts,color)=>objects.push({type:'poly',pts,color,x:pts.reduce((a,p)=>a+p[0],0)/pts.length,z:pts.reduce((a,p)=>a+p[2],0)/pts.length});
  const rod=(a,b,color,width=.055)=>objects.push({type:'rod',a,b,color,width,x:(a[0]+b[0])/2,z:(a[2]+b[2])/2});
  const person=(x,y,z)=>objects.push({type:'person',x,y,z,color:colors[Math.floor(r()*colors.length)],skin:skin[Math.floor(r()*skin.length)],hair:r()<.72?'#46382d':'#a78b61',s:.87+r()*.23});
  const sign=(x,y,z,text,w,h,rotation=0,bg='#1d334b',fg='#f2efe4')=>objects.push({type:'sign',x,y,z,text,w,h,rotation,bg,fg});
  const box=(x,y,z,w,h,d,c,roof='#767974')=>{
    poly([[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]],c);
    poly([[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2]],c);
    for(const side of [-1,1])poly([[x+w/2*side,y,z-d/2],[x+w/2*side,y,z+d/2],[x+w/2*side,y+h,z+d/2],[x+w/2*side,y+h,z-d/2]],c);
    poly([[x-w/2,y+h,z-d/2],[x+w/2,y+h,z-d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]],roof);
  };
  const lamp=(x,z,h)=>{
    rod([x,0,z],[x,h,z],'#69777c',.15);box(x,h-.35,z,2.5,.8,.28,'#596773');for(let i=-1;i<2;i++)objects.push({type:'lamp',x:x+i*.75,y:h,z:z+.2,night:arena>=1});
  };
  const terms=['FRITIDSPARKEN','DIN TUR ATT GLÄNSA','SPELA MED HJÄRTAT'];
  for(let i=-3;i<=3;i++){sign(i*8.6,.68,-16.3,terms[(i+3)%3],8.55,1.18,0,i%2?'#203348':'#c9ac40',i%2?'#f9f7ed':'#172e42');sign(i*8.6,.6,64,terms[(i+3)%3],8.55,1,Math.PI);}
  for(const side of [-1,1])for(let i=0;i<7;i++)sign(side*31.7,.62,i*9,terms[i%3],8.8,1.04,-side*Math.PI/2);
  if(arena===0){
    for(let i=0;i<140;i++){
      const side=i%4,x=side<2?(r()-.5)*110:(side===2?-1:1)*(40+r()*12),z=side<2?(side===0?-30-r()*11:72+r()*12):r()*90-12;
      objects.push({type:'tree',x,y:0,z,w:4.2+r()*3,h:6+r()*7,variant:i%7});
    }
    for(const [x,z] of [[-11,-25],[11,-25],[-22,58],[25,58]])lamp(x,z,z<0?10.2:13.3);
    for(let i=0;i<5;i++){
      const x=-24+10*i,z=-24;rod([x,0,z],[x,6,z],'#a2a8a3',.05);objects.push({type:'flag',x,y:6,z});
    }
    box(10.5,0,-20.2,9,3.7,4.7,'#916544');box(10.5,3.7,-20,10,.26,5.3,'#585b59');box(10.5,.1,-17.78,2.55,2.52,.10,'#384c4d');
    sign(10.5,3.13,-17.73,'ENTRÉ',4,.8,0,'#725742','#ffdf9c');
    for(const x of [7.15,13.9])box(x,1.15,-17.78,1.15,1.1,.10,'#536c72');
    for(let x=6.4;x<14.65;x+=.37)rod([x,.15,-17.76],[x,3.55,-17.76],'#78563e',.024);
    for(let row=0;row<6;row++){
      const y=.38+row*.45,z=-18-row*.92;box(-9,0,z,30,y,.98,'#858783','#afb0a4');
      for(let i=0;i<45;i++){const x=-23+i*.64;if(i%19!==0&&r()>.045)person(x,y,z+.03);}
    }
    for(let row=0;row<4;row++){
      const x=33+row*.88,y=.35+row*.44;box(x,0,24,.94,y,24,'#777f83','#969d9b');
      for(let i=0;i<36;i++)if(r()>.14)person(x,y,12.5+i*.65);
    }
  }else if(arena===1){
    for(let i=0;i<19;i++){
      const x=(i%10-4.5)*9.6,z=i<10?-33:75,h=6+r()*9;
      box(x,0,z,9,h,8,['#b28067','#baa898','#a07966','#c1ab94'][i%4]);
      for(let dy=1.4;dy<h-.7;dy+=2.1)for(let dx=-3;dx<=3;dx+=2){
        const Z=z+(i<10?4.02:-4.02);poly([[x+dx-.46,dy-.57,Z],[x+dx+.46,dy-.57,Z],[x+dx+.46,dy+.57,Z],[x+dx-.46,dy+.57,Z]],r()>.78?'#e5c087':'#687b83');
      }
    }
    for(let row=0;row<8;row++){const y=.45+row*.48,z=-18-row*.84;box(0,0,z,40,y,.9,'#8c8d89');for(let i=0;i<59;i++)if(i%18!==0)person(-18.7+i*.64,y,z);}
    box(0,0,-25.8,40,8,.5,'#89634d');sign(0,6.18,-25.45,'Stadsarenan',12,1.3,0,'#89634d','#f1dfc4');box(0,8.1,-21.85,43,.24,10.4,'#647172');
    for(let x=-20;x<=20;x+=8){rod([x,0,-25],[x,8.15,-25],'#50595a',.12);rod([x,6.1,-25],[x,8.1,-17],'#55615e',.09);}
    lamp(-25,-22,13);lamp(25,55,13);
  }else{
    const final=arena===3,sections=30,layers=final?3:2;
    function point(a,d,h){return [(42+d)*Math.sin(a),h,30+(52+d)*Math.cos(a)];}
    for(let k=0;k<sections;k++){
      const a=k*tau/sections,b=(k+1)*tau/sections,m=(a+b)/2;
      for(let tier=0;tier<layers;tier++)for(let row=0;row<5;row++){
        const d=tier*5.25+row*.72,h=.5+tier*3.7+row*.44;
        poly([point(a,d,h-.65),point(b,d,h-.65),point(b,d,h),point(a,d,h)],tier%2?'#475676':'#3a4965');
        poly([point(a,d,h),point(b,d,h),point(b,d+1,h),point(a,d+1,h)],'#59647b');
        for(let i=1;i<=10;i++){const p=point(a+(b-a)*(i-.5)/10,d,h);person(...p);}
        if(tier&&row===0)poly([point(a,d-.1,h-.8),point(b,d-.1,h-.8),point(b,d-.1,h-.5),point(a,d-.1,h-.5)],final?'#bc9b55':'#a2a8ae');
      }
      const outer=layers*5+2,top=final?18:13;
      poly([point(a,outer,top+.2),point(b,outer,top+.2),point(b,-2,top-.7),point(a,-2,top-.7)],final?'#303542':'#697b8a');
      rod(point(a,outer,top),point(m,-2.8,top-1),'#b1bdc3',.13);rod(point(b,outer,top),point(m,-2.8,top-1),'#c8cacc',.13);
      rod(point(a,-2.7,top-1),point(b,-2.7,top-1),'#cbd5dc',.18);
      const P=point(m,-3,top-1.3);objects.push({type:'lamp',x:P[0],y:P[1],z:P[2],night:true});
    }
    if(final)for(const z of [-22,70]){
      for(let i=0;i<32;i++){
        const a=i*Math.PI/32,b=(i+1)*Math.PI/32,A=[47*Math.cos(a),7+16*Math.sin(a),z],B=[47*Math.cos(b),7+16*Math.sin(b),z],C=[A[0],A[1]+1.5,z+.4],D=[B[0],B[1]+1.5,z+.4];
        rod(A,B,'#bc9354',.25);rod(C,D,'#dbbc79',.22);rod(i%2?A:C,i%2?D:B,'#d1a75f',.11);
      }
    }
    sign(0,final?9:7.65,-29.6,final?'FINALARENAN':'NATIONALARENAN',17,1.2,0,'#21364a','#e4d3a6');
  }
  for(const x of [-3.66,3.66])rod([x,0,60],[x,2.44,60],'#deded3',.085);
  rod([-3.66,2.44,60],[3.66,2.44,60],'#deded3',.085);
  return objects;
}

export function createSoftwareStadium(T){
  let cache=null,key='',lastRender=-Infinity,previousRole='',previousArena=-1,previousWidth=0,previousHeight=0;
  const trees=Array.from({length:7},(_,i)=>makeTree(17316+i*152)),models=[];
  const rand=generator(1823),noiseTile=new Float32Array(128*128);for(let i=0;i<noiseTile.length;i++)noiseTile[i]=(rand()-.5)*2;
  const matrix=new T.Matrix4(),tufts=[];
  for(let i=0;i<4700;i++){const x=(rand()-.5)*22,z=rand()*32-10,h=.022+rand()*.035;tufts.push([x,z,h,i%4]);}
  function draw(ctx,scene,camera,state,w,h){
    const arena=scene.userData.penaltyArena||0,role=state.role||'shoot',now=performance.now();
    camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    const signature=matrix.elements.map(n=>Math.round(n*420)).join(',');
    const changed=role!==previousRole||arena!==previousArena||w!==previousWidth||h!==previousHeight;
    if(changed||(!cache)||((signature!==key)&&now-lastRender>155)){
      const ratio=Math.min(1,960/w,700/h),W=Math.max(1,Math.round(w*ratio)),H=Math.max(1,Math.round(h*ratio));
      if(!cache||cache.width!==W||cache.height!==H)cache=canvas(W,H);
      const g=cache.getContext('2d',{alpha:false});
      buildSurface(g,W,H,camera,arena,noiseTile);
      const m=matrix.elements;
      function project(x,y,z){
        const d=m[3]*x+m[7]*y+m[11]*z+m[15];
        if(d<=.08)return null;
        return [(1+(m[0]*x+m[4]*y+m[8]*z+m[12])/d)*W*.5,(1-(m[1]*x+m[5]*y+m[9]*z+m[13])/d)*H*.5,d];
      }
      function polygon(points,color){
        if(points.some(p=>!p))return;
        g.fillStyle=color;g.beginPath();g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);g.closePath();g.fill();
      }
      function shape(p,w,h,color){
        g.fillStyle=color;g.beginPath();g.ellipse(p[0],p[1],Math.max(.5,w),Math.max(.5,h),0,0,tau);g.fill();
      }
      // Short grass blades retain a ground-fixed orientation as the camera moves.
      const blades=['rgba(141,157,82,.48)','rgba(83,110,51,.45)','rgba(126,146,72,.58)','rgba(68,94,42,.38)'];
      for(let k=0;k<4;k++){g.beginPath();g.lineWidth=.72;g.strokeStyle=blades[k];
        for(const [x,z,hue,i] of tufts){if(k!==i)continue;const a=project(x,0,z);if(!a||a[2]>14||a[0]<0||a[0]>W||a[1]<0||a[1]>H)continue;const b=project(x+.012,hue,z+.004);if(!b)continue;g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);}g.stroke();
      }
      const view=camera.matrixWorldInverse.elements;
      const model=models[arena] ||= scenery(arena);
      const sorted=[];
      for(const o of model){
        const d=-(view[2]*o.x+view[6]*(o.y||0)+view[10]*o.z+view[14]);
        if(d<1||d>145)continue;sorted.push([o,d]);
      }
      sorted.sort((a,b)=>b[1]-a[1]);const pixelScale=H/(2*Math.tan(camera.fov*Math.PI/360));
      for(const [o,d] of sorted){
        const p=project(o.x,o.y||0,o.z),scale=pixelScale/d;
        if(!p)continue;
        if(!['rod','poly'].includes(o.type)&&(p[0]<-W*.3||p[0]>W*1.3))continue;
        if(o.type==='poly'){polygon(o.pts.map(a=>project(...a)),o.color);continue;}
        if(o.type==='rod'){
          const a=project(...o.a),b=project(...o.b);if(!a||!b)continue;
          g.lineWidth=Math.max(.6,o.width*scale);g.lineCap='round';g.strokeStyle=o.color;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();continue;
        }
        if(o.type==='tree'){g.drawImage(trees[o.variant],p[0]-o.w*scale*.5,p[1]-o.h*scale,o.w*scale,o.h*scale);continue;}
        if(o.type==='person'){
          const s=scale*o.s;
          shape([p[0],p[1]-.28*s],s*.21,s*.18,'#394354');
          shape([p[0],p[1]-.59*s],s*.23,s*.31,o.color);
          shape([p[0]-.18*s,p[1]-.59*s],s*.085,s*.18,o.color);
          shape([p[0]+.19*s,p[1]-.61*s],s*.083,s*.18,o.color);
          shape([p[0]+.20*s,p[1]-.45*s],s*.052,s*.073,o.skin);
          shape([p[0],p[1]-.98*s],s*.12,s*.15,o.skin);
          shape([p[0],p[1]-1.07*s],s*.12,s*.076,o.hair);continue;
        }
        if(o.type==='sign'){
          const co=Math.cos(o.rotation),si=Math.sin(o.rotation);
          if((camera.position.x-o.x)*si+(camera.position.z-o.z)*co<0)continue;
          const a=project(o.x-co*o.w/2,o.y,o.z+si*o.w/2),b=project(o.x+co*o.w/2,o.y,o.z-si*o.w/2);
          if(!a||!b)continue;
          const width=Math.hypot(b[0]-a[0],b[1]-a[1]),height=o.h*scale;
          if(width<2)continue;g.save();g.translate((a[0]+b[0])/2,(a[1]+b[1])/2);
          g.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));g.fillStyle=o.bg;g.fillRect(-width/2,-height/2,width,height);g.fillStyle=o.fg;
          g.font='800 '+Math.max(1,height*.61)+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(o.text,0,0,width*.94);g.restore();continue;
        }
        if(o.type==='lamp'){
          const size=Math.max(1,.29*scale);if(o.night){const gradient=g.createRadialGradient(p[0],p[1],0,p[0],p[1],size*4.6);gradient.addColorStop(0,'rgba(255,247,205,.68)');gradient.addColorStop(1,'rgba(255,247,205,0)');g.fillStyle=gradient;g.fillRect(p[0]-size*4.6,p[1]-size*4.6,size*9.2,size*9.2);}
          shape(p,size*1.18,size*.61,'#fff4d4');continue;
        }
        if(o.type==='flag'){
          g.save();g.translate(p[0],p[1]);g.fillStyle='#2669a5';g.fillRect(0,0,scale*1.8,scale);g.fillStyle='#f1c744';g.fillRect(scale*.58,0,scale*.21,scale);g.fillRect(0,scale*.40,scale*1.8,scale*.2);g.restore();
        }
      }
      previousRole=role;previousArena=arena;previousWidth=w;previousHeight=h;lastRender=now;key=signature;
    }
    ctx.drawImage(cache,0,0,w,h);
  }
  return {draw};
}
