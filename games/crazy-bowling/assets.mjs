import {GLTFLoader} from './vendor/GLTFLoader.js';
const T=window.THREE,root=new URL('./assets/',import.meta.url).href;
let promise;
export function loadAssets(){return promise ||= Promise.all([
 new GLTFLoader().loadAsync(root+'bowling-kit.glb'),
 new GLTFLoader().loadAsync(root+'lounge-kit.glb'),
 Promise.all(['oak','oak-normal','oak-orm','brick','brick-normal','brick-orm','maple','maple-normal','maple-orm','resin','resin-normal','resin-orm','fabric','fabric-normal','fabric-orm','concrete','concrete-normal','concrete-orm','pin','mural'].map(async name=>{
 const t=await new T.TextureLoader().loadAsync(root+name+'.webp');t.colorSpace=/normal|orm/.test(name)?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return [name,t];
 }))]).then(([gltf,lounge,entries])=>({models:new Map([...gltf.scene.children,...lounge.scene.children].map(o=>[o.name,o])),textures:Object.fromEntries(entries)}));}
