/** Shared PBR assets. Maps use their own colour space; geometry sets world-scale UVs. */
export class Materials {
 constructor(T,renderer){this.T=T;this.maps=new Map();this.materials=[];this.anisotropy=renderer.capabilities?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;}
 texture(kind,channel){const key=kind+'-'+channel;if(this.maps.has(key))return this.maps.get(key);const T=this.T,t=new T.TextureLoader().load(new URL('./assets/materials/'+key+'.webp',import.meta.url).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=this.anisotropy;t.colorSpace=channel==='color'?T.SRGBColorSpace:T.NoColorSpace;this.maps.set(key,t);return t;}
 get(kind,color='#ffffff',extra={}){const T=this.T,m=new T.MeshStandardMaterial({color,map:this.texture(kind,'color'),normalMap:this.texture(kind,'normal'),roughnessMap:this.texture(kind,'roughness'),normalScale:new T.Vector2(.55,.55),roughness:1,...extra});this.materials.push(m);return m;}
 dispose(){for(const t of this.maps.values())t.dispose();for(const m of this.materials)m.dispose();}
}
export function worldUV(g,scale=1){const p=g.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)*scale;uv[i*2+1]=p.getZ(i)*scale;}g.setAttribute('uv',new window.THREE.BufferAttribute(uv,2));return g;}
export function atmosphere(T,renderer,scene,world,theme){
 const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
 const colors=theme?[theme.sky,theme.horizon,theme.ground]:[['#548eaf','#d5e2d9','#918b72'],['#4e91b0','#deece4','#9eaf9b'],['#6b9caa','#d2dcc8','#6c7957'],['#8791b4','#f1ded3','#b2a099'],['#030817','#18273b','#333747'],['#302d41','#b98b72','#453c3b']][world];
 scene.userData.skyColors=colors;const gradient=ctx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,colors[0]);gradient.addColorStop(.47,colors[1]);gradient.addColorStop(.54,colors[1]);gradient.addColorStop(1,colors[2]);ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);
 if(!theme?.night&&world!==4){for(let i=0;i<34;i++){const x=(i*113.73)%1024,y=85+(i*37)%130,w=40+(i*17)%110;const cloud=ctx.createRadialGradient(x,y,1,x,y,w);cloud.addColorStop(0,'rgba(255,249,233,.23)');cloud.addColorStop(1,'rgba(255,255,255,0)');ctx.save();ctx.translate(0,y*.7);ctx.scale(1,.3);ctx.fillStyle=cloud;ctx.fillRect(x-w,y-w,w*2,w*2);ctx.restore();}
 const sun=ctx.createRadialGradient(180,160,2,180,160,85);sun.addColorStop(0,'#fff8db');sun.addColorStop(.08,'rgba(255,246,213,.9)');sun.addColorStop(.4,'rgba(255,234,191,.14)');sun.addColorStop(1,'rgba(255,234,191,0)');ctx.fillStyle=sun;ctx.fillRect(80,60,200,200);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.mapping=T.EquirectangularReflectionMapping;scene.background=tex;
 let target=null;if(!renderer.isSoftware){const pmrem=new T.PMREMGenerator(renderer);target=pmrem.fromEquirectangular(tex);scene.environment=target.texture;pmrem.dispose();}
 scene.fog=new T.Fog(colors[1],world===2?55:95,world===4?280:240);
 return {dispose(){tex.dispose();target?.dispose();scene.environment=null;}};
}
export function contactTexture(T){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,3,32,32,32);g.addColorStop(0,'rgba(20,27,21,.4)');g.addColorStop(.45,'rgba(20,27,21,.2)');g.addColorStop(1,'rgba(20,27,21,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
