"use strict";
// Shores and falls traced in percent of the original 1672 × 941 plates.
// The separate mask channels describe falling water, a level surface and their overlap.
const waterways=[
 {falls:[[12,23,15,24,17,36,16,37],[17,40,19,41,20,59,18,59],[14,61,19,62,21,69,22,96,19,96,18,68],[37,46,40,48,44,77,39,75],[47,51,49,52,50,71,47,70],[55,40,60,40,62,87,54,89],[66,51,68,51,68,76,65,80],[78,45,80,45,79,56,77,57],[74,58,78,57,76,73,74,74],[87,43,89,43,89,53,85,54]]},
 {falls:[[14,29,17,31,19,39,17,39],[19,40,21,40,25,57,22,58],[89,52,93,51,91,96,87,98]],pools:[[0,82,13,81,25,83,56,81,79,81,99,83,100,100,0,100],[16,58,26,57,26,59,15,60]]},
 {falls:[[10,22,14,25,20,42,19,44],[19,45,21,46,22,58,20,58],[21,60,25,60,26,90,22,90],[63,69,65,69,65,88,63,88],[75,65,78,64,78,89,74,89],[86,38,89,37,89,50,86,50]]},
 {falls:[[54,30,57,30,58,38,55,38],[54,39,57,39,57,49,54,49],[55,51,59,51,60,68,56,68],[66,31,68,30,68,39,66,40],[71,31,73,31,73,38,71,38]]},
 {falls:[[5,32,11,35,16,39,14,40],[14,40,17,40,19,47,16,47],[16,48,19,48,20,57,17,57],[17,60,21,60,23,99,17,99],[40,43,42,43,42,49,40,49],[49,52,52,53,54,64,50,64]]},
 {falls:[[10,51,15,52,17,73,11,74],[68,60,71,59,70,73,67,73],[75,60,78,59,78,74,74,74]],pools:[[0,77,16,76,43,77,66,76,86,76,100,77,100,100,0,100]]},
 {falls:[[33,41,37,41,38,74,34,73],[54,41,58,41,59,83,55,83],[78,41,81,41,83,78,79,78],[80,28,83,26,82,36,80,36],[88,65,89,65,88,75,87,76]]},
 {falls:[[51,13,56,14,58,24,55,24],[47,63,51,64,52,97,48,97],[54,63,57,63,58,97,54,97],[60,63,64,64,65,98,61,98],[84,29,87,28,86,40,83,41],[81,65,83,65,83,85,80,86],[27,32,29,32,29,43,27,43]]},
 {falls:[[25,39,28,40,30,45,27,45],[27,46,30,46,30,60,28,60],[29,61,32,62,34,74,30,73],[86,52,89,51,88,68,85,72],[57,50,59,50,60,64,58,64]]},
 {falls:[[49,51,52,50,51,89,47,92],[57,51,60,51,60,91,56,94],[65,50,67,51,70,92,65,91],[15,34,17,34,18,47,15,47],[91,33,93,33,93,47,91,47]],pools:[[0,96,19,94,35,96,46,93,64,93,78,96,100,94,100,100,0,100]]}
];
function waterPainter(){
 const surface=document.createElement('canvas');surface.width=1672;surface.height=941;
 const gl=surface.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl || typeof gl.createShader!=='function')return null;
 const vertex='attribute vec2 pos;varying vec2 uv;void main(){uv=vec2(pos.x*.5+.5,.5-pos.y*.5);gl_Position=vec4(pos,0.,1.);}';
 const fragment=`precision highp float;
 varying vec2 uv;uniform sampler2D scene;uniform sampler2D mask;uniform float clock;
 void main(){
 vec4 base=texture2D(scene,uv);vec3 m=texture2D(mask,uv).rgb;
 if(m.r+m.g<.005){gl_FragColor=base;return;}
 vec2 p=uv*vec2(1672.,941.);float t=clock;
 float strand=sin(p.x*.18+sin(p.x*.041)*3.);
 float a=fract(t*.59+strand*.13), b=fract(a+.5);
 vec2 dir=vec2(.00065*strand,.018+.005*strand);
 vec3 fall=mix(texture2D(scene,uv-dir*(a-.5)*m.r).rgb,texture2D(scene,uv-dir*(b-.5)*m.r).rgb,abs(2.*a-1.));
 float rip=sin(p.y*.21-t*1.9+sin(p.x*.035+t*.5))+.47*sin(p.y*.43+t*2.1+p.x*.009);
 vec2 ripple=vec2(.0014*rip,.0009*sin(p.x*.045+t*1.2))*m.g;
 vec3 pool=texture2D(scene,uv+ripple).rgb*(1.+.035*rip);
 float spray=sin(p.y*.13-t*5.3+strand)*sin(p.x*.24+t*.8);
 gl_FragColor=vec4(mix(mix(base.rgb,pool,m.g),fall+vec3(.016,.02,.022)*spray,m.r),1.);
 }`;
 const program=gl.createProgram();
 for(const [kind,src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
  const sh=gl.createShader(kind);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))return null;gl.attachShader(program,sh);gl.deleteShader(sh);
 }
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const pos=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const time=gl.getUniformLocation(program,'clock');
 const textures=['scene','mask'].map((name,i)=>{
  const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);
  for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for(const mode of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,mode,gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(program,name),i);return tex;
 });
 let current=-1;
 return (stage,art,t)=>{
  if(gl.isContextLost())return art;
  if(current!==stage){
   const mask=document.createElement('canvas');mask.width=836;mask.height=470;
   const g=mask.getContext('2d');g.fillStyle='black';g.fillRect(0,0,836,470);
   g.filter='blur(1.2px)';
   for(const [list,color] of [['pools','#00ff00'],['falls','#ff0000']]){
    g.fillStyle=color;for(const points of waterways[stage][list]||[]){
     g.beginPath();for(let j=0;j<points.length;j+=2)g[j?'lineTo':'moveTo'](points[j]*8.36,points[j+1]*4.7);g.closePath();g.fill();
    }
   }
   [art,mask].forEach((src,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src)});
   current=stage;
  }
  gl.uniform1f(time,t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return surface;
 };
}
function paintWaterFallback(ctx,stage,art,t){
 for(const [type,regions] of Object.entries(waterways[stage]))for(const pts of regions){
  ctx.save();ctx.beginPath();
  let x0=1672,x1=0,y0=941,y1=0;
  for(let i=0;i<pts.length;i+=2){
   const x=pts[i]*16.72,y=pts[i+1]*9.41;ctx[i?'lineTo':'moveTo'](x,y);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
  }
  ctx.closePath();ctx.clip();
  if(type==='falls'){
   for(const offset of [0,.5]){
    const phase=(t*.52+offset)%1;
    ctx.globalAlpha=1-Math.abs(phase*2-1);
    ctx.drawImage(art,x0,y0,x1-x0,y1-y0,x0,y0+(phase-.5)*15,x1-x0,y1-y0);
   }
  }else{
   for(let y=y0;y<y1;y+=5){
    const dx=Math.sin(.13*y-t*1.8)*2.2;
    ctx.drawImage(art,x0,y,x1-x0,5,x0+dx,y,x1-x0,5);
   }
  }
  ctx.restore();
 }
}
