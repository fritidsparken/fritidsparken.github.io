// Projected 3D fallback for school devices where WebGL is disabled.
// The game, camera, input projection and physics remain identical.
export function softwareRenderer(T){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});let w=800,h=600,ratio=1,state,kit='#e8a955',ballColor='#fff9dd';const vp=new T.Matrix4(),v=new T.Vector3();
 function p(x,y,z){v.set(x,y,z).applyMatrix4(vp);return [(v.x+1)*w/2,(1-v.y)*h/2,v.z];}
 function path(points,color,width=1,fill=false){if(points.some(a=>a[2]<-1||a[2]>1))return;ctx.beginPath();points.forEach((a,i)=>i?ctx.lineTo(a[0],a[1]):ctx.moveTo(a[0],a[1]));if(fill){ctx.closePath();ctx.fillStyle=color;ctx.fill();}else{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}}
 function line(a,b,c,width=1){path([p(...a),p(...b)],c,width);}
 function poly(a,c){path(a.map(v=>p(...v)),c,1,true);}
 function circle(x,y,z,r,color){const a=p(x,y,z),b=p(x+r,y,z),radius=Math.max(.5,Math.hypot(a[0]-b[0],a[1]-b[1]));if(a[2]<-1||a[2]>1)return;const g=ctx.createRadialGradient(a[0]-radius*.3,a[1]-radius*.3,0,a[0],a[1],radius);g.addColorStop(0,color);g.addColorStop(1,'#284b4c');ctx.fillStyle=g;ctx.beginPath();ctx.arc(a[0],a[1],radius,0,7);ctx.fill();}
 function person(x,y,z,angle,color,kick=0){const point=(dx,dy)=>[x+dx*Math.cos(angle)-dy*Math.sin(angle),y+dx*Math.sin(angle)+dy*Math.cos(angle),z];const size=Math.abs(p(x+.1,y,z)[0]-p(x,y,z)[0])*2;
 for(const s of [-1,1]){line(point(s*.13,-.2),point(s*.17,-.6), '#e5b48d',size*.68);line(point(s*.17,-.6),point(s*.17+(s===1?kick:0),-.83),'#173e4b',size*.85);line(point(s*.22,.25),point(s*.53,.35),color,size*.7);circle(...point(s*.53,.35),.11,'#e2f8a0');}
 line(point(0,-.25),point(0,.26),color,size*2.25);circle(...point(0,.63),.19,'#e3b28a');line(point(-.14,.75),point(.14,.75),'#34343b',size*.5);
 }
 function render(scene,camera){if(!state)return;scene.updateMatrixWorld();camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#'+scene.background.getHexString();ctx.fillRect(0,0,w,h);
 // Small floor quads avoid clipping whole ground planes behind either camera.
 const saving=state.role==='save';for(let z=saving?62:-12;saving?z>=-12:z<=62;z+=saving?-4:4)for(let x=-38;x<38;x+=4)poly([[x,0,z],[x+4,0,z],[x+4,0,z+4],[x,0,z+4]],Math.floor(z/6)%2?'#368968':'#409673');
 if(!saving){for(let r=6;r>=0;r--){poly([[-26,r*.65,-7-r],[26,r*.65,-7-r],[26,r*.65+.7,-7-r],[-26,r*.65+.7,-7-r]],'#537884');for(let i=0;i<58;i++){const a=p(-25+i*.88,r*.65+1,-7-r);if(a[2]<1){ctx.fillStyle=['#dfb26e','#b9dccc','#e08c8f','#a8bedd'][i%4];ctx.beginPath();ctx.ellipse(a[0],a[1],3.3,5.5,0,0,7);ctx.fill();}}}
 for(const x of [-20,20]){line([x,0,-8],[x,14,-8],'#456575',5);line([x-2,14,-8],[x+4,14,-8],'#fff4c0',10);}
 const sign=p(0,6,-12);ctx.fillStyle='#113c48';ctx.fillRect(sign[0]-130,sign[1]-20,260,40);ctx.fillStyle='#e4f99b';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('FRITIDSPARKEN · MATCHDAGEN',sign[0],sign[1]+5);
 for(let x=-24;x<25;x+=8)poly([[x,0,-4],[x+7.5,0,-4],[x+7.5,1.1,-4],[x,1.1,-4]],x%16?'#bbdc83':'#174550');}
 line([-30,.03,0],[30,.03,0],'#daead1',2);for(const x of [-20,20])line([x,.03,0],[x,.03,16.5],'#daead1',2);line([-20,.03,16.5],[20,.03,16.5],'#daead1',2);for(const x of [-9,9])line([x,.03,0],[x,.03,5.5],'#daead1',2);line([-9,.03,5.5],[9,.03,5.5],'#daead1',2);
 function goal(){const ripple=state.ball?.net?Math.sin(state.ball.age*20)*.08:0;for(let x=-3.66;x<=3.67;x+=.244)line([x,0,-1.6+ripple],[x,2.44,-1.6+ripple],'#dceee782');for(let y=0;y<=2.45;y+=.2033){line([-3.66,y,-1.6+ripple],[3.66,y,-1.6+ripple],'#dceee782');for(const x of [-3.66,3.66])line([x,y,0],[x,y,-1.6],'#dceee782');}for(const x of [-3.66,3.66]){line([x,0,0],[x,2.44,0],'#f5f8e9',5);line([x,2.44,0],[x,2.44,-1.6],'#eef4de',2);}line([-3.66,2.44,0],[3.66,2.44,0],'#f5f8e9',5);}
 const k=state.pose,run=state.phase==='run'?Math.min(1,state.clock/.65):state.ball?1:0;
 if(!saving)goal();
 if(saving)person(-.6+run*.45,.95,12.6-run*1.3,0,kit,run*.1);
 person(k.x,k.y,.48,k.angle,'#ee9296');
 if(saving)goal();else person(-.6+run*.45,.95,12.6-run*1.3,0,kit,run*.1);
 const b=state.ball||{x:0,y:.11,z:11};circle(b.x,.02,b.z,.15,'#245e49');circle(b.x,b.y,b.z,.11,ballColor);const a=p(b.x,b.y,b.z);ctx.fillStyle='#294b51';ctx.beginPath();ctx.arc(a[0],a[1],Math.max(1,Math.abs(p(b.x+.035,b.y,b.z)[0]-a[0])),0,7);ctx.fill();
 if(state.phase==='aim'&&!saving){const q=p(0,.02,11);ctx.strokeStyle='#dcf98a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q[0],q[1]+5,22,8,0,0,7);ctx.stroke();}
 }
 return {domElement:canvas,shadowMap:{},isSoftware:true,setState(s,pose,b,k){state={...s,pose};kit=k;ballColor=b;},setSize(x,y){w=x;h=y;canvas.width=w*ratio;canvas.height=h*ratio;},setPixelRatio(r){ratio=Math.min(r,1.25);},render};
}
