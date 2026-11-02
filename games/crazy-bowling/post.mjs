// Optional High pass: depth-based contact AO, bright-source diffusion and edge AA.
const T=window.THREE;
export class FinishPass{
 constructor(renderer){this.renderer=renderer;this.target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthTexture:new T.DepthTexture(1,1),samples:4});this.scene=new T.Scene();this.camera=new T.Camera();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{color:{value:this.target.texture},depth:{value:this.target.depthTexture},pixel:{value:new T.Vector2(1,1)},near:{value:.1},far:{value:180}},vertexShader:'varying vec2 vScreenUV;void main(){vScreenUV=position.xy*.5+.5;gl_Position=vec4(position,1.);}',fragmentShader:`
 varying vec2 vScreenUV;uniform sampler2D color,depth;uniform vec2 pixel;uniform float near,far;
 float linearDepth(vec2 p){float z=texture2D(depth,p).x;return near*far/(far-z*(far-near));}
 void main(){vec3 c=texture2D(color,vScreenUV).rgb;float z=linearDepth(vScreenUV),occ=0.;vec3 bloom=vec3(0.);vec3 mean=vec3(0.);float edge=0.;
 for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 dir=vec2(cos(a),sin(a));float d=linearDepth(vScreenUV+dir*pixel*5.);float delta=z-d;occ+=smoothstep(.015,.18,delta)*(1.-smoothstep(.2,1.4,delta));vec3 n=texture2D(color,vScreenUV+dir*pixel).rgb;mean+=n;edge=max(edge,length(c-n));bloom+=max(texture2D(color,vScreenUV+dir*pixel*3.).rgb-1.8,vec3(0.));}
 c=mix(c,mean/8.,smoothstep(.28,.75,edge)*.18);c*=1.-occ*.016;c+=bloom*.08;gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});this.scene.add(new T.Mesh(g,this.material));}
 resize(w,h){this.target.setSize(w,h);this.material.uniforms.pixel.value.set(1/w,1/h);}
 render(scene,camera){const r=this.renderer,target=r.getRenderTarget(),tone=r.toneMapping;this.material.uniforms.near.value=camera.near;this.material.uniforms.far.value=camera.far;try{r.toneMapping=T.NoToneMapping;r.setRenderTarget(this.target);r.render(scene,camera);r.setRenderTarget(target);r.toneMapping=tone;r.render(this.scene,this.camera);}finally{r.setRenderTarget(target);r.toneMapping=tone;}}
 dispose(){this.target.dispose();this.material.dispose();this.scene.children[0].geometry.dispose();}
}
