const {createCanvas,Image}=require('@napi-rs/canvas');
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../games/hogtryckstvatten');
const atlas=new Image();atlas.src=fs.readFileSync(root+'/assets/washer-rig-atlas.webp');
(async()=>{await atlas.decode();
class SpriteImage{constructor(){return atlas;}}
// Retain decoded pixels when the browser source URL is assigned.
const wrapped=Object.create(atlas); // Native canvas requires the real Image instance.
const code=fs.readFileSync(root+'/washer-rig.js','utf8').replace("atlas.src='assets/washer-rig-atlas.webp';",'');
const sandbox={window:{},Image:SpriteImage,Math};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(root+'/washer-rig-data.js','utf8'),sandbox);vm.runInContext(code,sandbox);
const Rig=sandbox.window.WasherRig,rig=new Rig();let maxError=0;
for(let n=0;n<6000;n++){
 const p=rig.pose({x:400+900*Math.cos(n*.017),y:400+800*Math.sin(n*.019)},1/60,true);
 for(const [a,b,l] of [[p.near,p.ne,155],[p.ne,p.wrist,160],[p.far,p.fe,180],[p.fe,p.support,180]]){
  const error=Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-l);maxError=Math.max(maxError,error);assert(error<.02,`Limb length error ${error}`);
 }
 assert(Math.abs(Math.hypot(p.wrist.x-p.support.x,p.wrist.y-p.support.y)-Math.hypot(118,35))<.001);
}
const c=createCanvas(1500,820),ctx=c.getContext('2d');ctx.fillStyle='#c4e6eb';ctx.fillRect(0,0,1500,820);
for(const [i,t] of [[0,{x:650,y:-50}],[1,{x:1200,y:390}],[2,{x:1470,y:780}]]){
 const r=new Rig(),x=i*500+30,y=110,h=650;
 for(let f=0;f<180;f++)r.pose({x:(t.x-x)/h*1024,y:(t.y-y)/h*1024},1/60,false);
 const p=r.draw(ctx,x,y,h,t,1/60,true);
 ctx.strokeStyle='#149cce';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(t.x,t.y);ctx.stroke();
}
fs.writeFileSync('/tmp/washer-rig-check.png',c.toBuffer('image/png'));
console.log(JSON.stringify({poses:6000,maxLimbLengthError:maxError,grips:'rigid',render:'/tmp/washer-rig-check.png'}));

})().catch(e=>{console.error(e);process.exit(1)});
