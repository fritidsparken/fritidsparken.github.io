window.WASHER_RIG_DATA={nearUpper:155,nearLower:160,farUpper:180,farLower:180,nearReach:285,farReach:340,height:1024};
/* Textured articulated character. Coordinates share the Blender rig's 1024-unit space. */
(()=>{'use strict';
const data=window.WASHER_RIG_DATA;
const atlas=new Image();atlas.src='./games/hogtryckstvatten/assets/washer-rig-atlas.webp';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rotate=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
function elbow(a,b,l1,l2){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.001,Math.hypot(dx,dy));
 const r=clamp(d,Math.abs(l1-l2)+.01,l1+l2-.01),q=(l1*l1-l2*l2+r*r)/(2*r),h=Math.sqrt(Math.max(0,l1*l1-q*q));
 return {x:a.x+dx/d*q-dy/d*h,y:a.y+dy/d*q+dx/d*h};
}
class WasherRig{
 constructor(){this.angle=-.25;this.lean=0;this.time=0;this.lastPose=null;}
 pose(target,dt,spraying){
  this.time+=dt;
  const desired=clamp(Math.atan2(target.y-410,target.x-400),-1.36,.95);
  this.angle+=(desired-this.angle)*(1-Math.exp(-12*dt));
  const breath=Math.sin(this.time*2.1)*.003;
  this.lean+=(clamp(this.angle*.10,-.12,.09)+breath-this.lean)*(1-Math.exp(-7*dt));
  const hip={x:200,y:560};
  const body=(x,y)=>add(hip,rotate({x:x-hip.x,y:y-hip.y},this.lean));
  const near=body(270,350),far=body(202,353);
  let axis=this.angle;
  const recoil=spraying?1.5*Math.sin(this.time*31):0;
  let wrist=add(near,rotate({x:137-recoil,y:88},axis));
  let supportOffset=rotate({x:118,y:-35},axis);
  // Both hands share a rigid tool. Keep both targets inside their anatomical reach.
  for(let i=0;i<12;i++){
   const dx=target.x-wrist.x,dy=target.y-wrist.y,dist=Math.max(44,Math.hypot(dx,dy));
   axis=Math.atan2(dy,dx)-Math.asin(-43/dist);
   supportOffset=rotate({x:118,y:-35},axis);
   for(const [shoulder,offset,min,max] of [[near,{x:0,y:0},65,data.nearReach],[far,supportOffset,70,data.farReach]]){
    const hand=add(wrist,offset),dx=hand.x-shoulder.x,dy=hand.y-shoulder.y,d=Math.max(.001,Math.hypot(dx,dy)),r=clamp(d,min,max);
    wrist.x+=dx*(r/d-1);wrist.y+=dy*(r/d-1);
   }
  }
  const support=add(wrist,supportOffset),ne=elbow(near,wrist,data.nearUpper,data.nearLower),fe=elbow(far,support,data.farUpper,data.farLower);
  const tip=add(wrist,rotate({x:359,y:-43},axis));
  return this.lastPose={near,far,wrist,support,ne,fe,tip,axis,lean:this.lean};
 }
 draw(ctx,x,y,height,target,dt,spraying){
  const s=height/1024,p=this.pose({x:(target.x-x)/s,y:(target.y-y)/s},dt,spraying);
  if(!atlas.complete||!atlas.naturalWidth)return {x:x+p.tip.x*s,y:y+p.tip.y*s};
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  const part=(r,dx,dy,dw,dh)=>ctx.drawImage(atlas,...r,dx,dy,dw,dh);
  function limb(a,b,upper,dark){
   const angle=Math.atan2(b.y-a.y,b.x-a.x),len=Math.hypot(b.x-a.x,b.y-a.y);
   ctx.save();ctx.translate(a.x,a.y);ctx.rotate(angle);
   if(dark)ctx.filter='brightness(.82)';
   // Rounded image ends overlap at the elbow; length stays fixed under IK.
   if(upper){
    ctx.save();ctx.beginPath();ctx.arc(0,0,43,0,Math.PI*2);ctx.clip();part([800,115,130,130],-43,-43,86,86);ctx.restore();
    part([745,70,360,225],-24,-53,len+45,100);
   }
   else part([682,340,410,174],-23,-39,len+40,78);
   ctx.restore();
  }
  limb(p.far,p.fe,true,true);limb(p.fe,p.support,false,true);
  // Planted legs and overlapping torso, rotating around the hips.
  part([140,550,400,474],0,550,400,474);
  ctx.save();ctx.translate(200,560);ctx.rotate(p.lean);ctx.translate(-200,-560);
  part([140,0,400,572],0,0,400,572);ctx.restore();
  const hoseStart=add({x:200,y:560},rotate({x:-75,y:25},p.lean));
  const hoseEnd=add(p.wrist,rotate({x:53,y:34},p.axis));
  ctx.lineCap='round';ctx.strokeStyle='#292f36';ctx.lineWidth=17;
  ctx.beginPath();ctx.moveTo(hoseStart.x,hoseStart.y);ctx.bezierCurveTo(hoseStart.x-10,750,hoseEnd.x+30,730,hoseEnd.x,hoseEnd.y);ctx.stroke();
  ctx.strokeStyle='#66727d';ctx.lineWidth=6;ctx.stroke();
  limb(p.near,p.ne,true,false);limb(p.ne,p.wrist,false,false);
  ctx.save();ctx.translate(p.wrist.x,p.wrist.y);ctx.rotate(p.axis);
  part([670,548,810,235],-7,-69,369,107);
  // Support grip and fingers wrap around the same lance transform.
  part([714,821,232,158],94,-58,83,56);
  ctx.restore();ctx.restore();
  return {x:x+p.tip.x*s,y:y+p.tip.y*s};
 }
}
WasherRig.ready=atlas.decode();
WasherRig.ready.catch(()=>{});
window.WasherRig=WasherRig;
})();

window.fpDrawWashCover=async function(){
 const target=document.querySelector('.game-card-hogtryckstvatten .game-cover img');
 if(!target)return;
 try {
  const background=new Image();background.src='./games/hogtryckstvatten/assets/house-wide-v2.webp';
  await Promise.all([background.decode(),window.WasherRig.ready]);
  if(!target.isConnected)return;
  const c=document.createElement('canvas');c.width=960;c.height=720;
  const ctx=c.getContext('2d');const cropWidth=background.height*4/3;
  ctx.drawImage(background,(background.width-cropWidth)/2,0,cropWidth,background.height,0,0,960,720);
  const rig=new window.WasherRig(); let tip;
  for(let i=0;i<40;i++)rig.pose({x:(700-165)/(420/1024),y:(305-235)/(420/1024)},.016,true);
  tip=rig.draw(ctx,165,235,420,{x:700,y:305},.016,true);
  ctx.save();ctx.lineCap='round';
  const x=tip.x,y=tip.y,ex=700,ey=305;
  const beam=ctx.createLinearGradient(x,y,ex,ey);
  beam.addColorStop(0,'rgba(225,252,255,.94)');beam.addColorStop(1,'rgba(128,223,255,.38)');
  ctx.strokeStyle=beam;ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
  ctx.restore();target.src=c.toDataURL('image/jpeg',.88);
 } catch(e){console.warn('Kunde inte skapa spelikonen',e);}
};
