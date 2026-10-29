import * as C from '../../js/vendor/cannon-es.mjs';
import {BALLS,LEVELS,clamp} from './core.mjs';
export class BowlingPhysics {
 constructor(level=0,ball=0){
 this.level=level;this.kind=LEVELS[level].kind;this.spec=BALLS[ball];this.time=0;this.pins=[];this.solids=[];this.movers=[];this.events=[];this.running=false;this.elapsed=0;this.spin=0;
 this.world=new C.World({gravity:new C.Vec3(0,-16,0),allowSleep:true});this.world.solver.iterations=14;this.world.solver.tolerance=.001;
 this.floorMat=new C.Material('floor');this.ballMat=new C.Material('ball');this.pinMat=new C.Material('pin');this.bumperMat=new C.Material('bumper');
 for(const [a,b,friction,restitution] of [[this.floorMat,this.ballMat,this.kind==='ice'?.015:.1,.12],[this.floorMat,this.pinMat,.28,.12],[this.ballMat,this.pinMat,.1,.35],[this.pinMat,this.pinMat,.2,.3],[this.ballMat,this.bumperMat,.02,this.spec.bounce]])this.world.addContactMaterial(new C.ContactMaterial(a,b,{friction,restitution}));
 this.world.defaultContactMaterial.friction=.2;this.world.defaultContactMaterial.restitution=.2;
 if(this.kind==='bridge'){this.box(0,-.3,0,7.6,.6,8,'wood');this.box(0,-.3,-12,3.8,.6,16,'wood');this.box(0,-.3,-26,7.6,.6,12,'wood');}else this.box(0,-.3,-14,7.6,.6,36,this.kind==='ice'?'ice':'wood');
 if(this.kind!=='bridge')for(const x of [-4.05,4.05])this.box(x,.32,-14,.35,.85,36,'rail');
 this.box(0,1,-32,8,2.5,.4,'back');
 if(['ramp','mega','final'].includes(this.kind)){const big=this.kind==='mega';const ramp=this.box(0,big?.255:-.04,big?-13:-11,big?5:2.5,.45,big?5:3.3,'ramp');ramp.body.quaternion.setFromAxisAngle(new C.Vec3(1,0,0),big?.19:.12);}
 if(['moving','final'].includes(this.kind)){for(const [i,z] of (this.kind==='final'?[-6,-17]:[-10,-17]).entries()){const o=this.box(0,.7,z,this.kind==='final'?1.25:1.8,1.4,.8,'soft',C.Body.KINEMATIC);this.movers.push({...o,kind:'slide',phase:i*Math.PI*.7});}}
 if(['bumpers','final'].includes(this.kind)){for(const [x,z] of (this.kind==='final'?[[-2.9,-12],[2.9,-16],[-2.9,-20]]:[[-2.25,-9],[2.25,-14],[-1.8,-19]])){const body=new C.Body({mass:0,material:this.bumperMat,shape:new C.Cylinder(.7,.8,1.3,16),position:new C.Vec3(x,.65,z)});this.world.addBody(body);this.solids.push({body,type:'bumper',x,y:.65,z,w:1.5,h:1.3,d:1.5});}}
 if(['spinner','final'].includes(this.kind)){const o=this.box(this.kind==='final'?2:1,.75,-22,this.kind==='final'?3.4:5.3,.65,.35,'spinner',C.Body.KINEMATIC);this.movers.push({...o,kind:'rotate'});}
 this.ball=new C.Body({mass:this.spec.mass,material:this.ballMat,shape:new C.Sphere(.43),position:new C.Vec3(0,.44,2),linearDamping:this.kind==='ice'?.012:this.spec.drag,angularDamping:.05,allowSleep:false});this.world.addBody(this.ball);this.ball.addEventListener('collide',e=>{const impact=Math.abs(e.contact.getImpactVelocityAlongNormal());if(impact>1.5)this.events.push({kind:e.body.material===this.pinMat?'pin':'bounce',impact});});
 this.resetPins();this.prepare();
 }
 box(x,y,z,w,h,d,type,bodyType=C.Body.STATIC){const body=new C.Body({type:bodyType,mass:0,material:type==='rail'||type==='soft'?this.bumperMat:this.floorMat,shape:new C.Box(new C.Vec3(w/2,h/2,d/2)),position:new C.Vec3(x,y,z)});this.world.addBody(body);const item={body,type,x,y,z,w,h,d};this.solids.push(item);return item;}
 resetPins(){for(const p of this.pins)this.world.removeBody(p.body);this.pins=[];for(let row=0;row<4;row++)for(let col=0;col<=row;col++){const x=(col-row/2)*.86,z=-26-row*.8;const body=new C.Body({mass:1,material:this.pinMat,position:new C.Vec3(x,.55,z),linearDamping:.12,angularDamping:.16,sleepSpeedLimit:.12,sleepTimeLimit:.5});body.addShape(new C.Cylinder(.19,.24,.42,12),new C.Vec3(0,-.33,0));body.addShape(new C.Sphere(.285),new C.Vec3(0,-.06,0));body.addShape(new C.Cylinder(.1,.19,.43,10),new C.Vec3(0,.24,0));body.addShape(new C.Sphere(.16),new C.Vec3(0,.64,0));this.world.addBody(body);this.pins.push({body,x,z,down:false});}}
 clearFallen(){this.pins=this.pins.filter(p=>{if(this.isDown(p)){this.world.removeBody(p.body);return false;}return true;});for(const p of this.pins){p.body.velocity.setZero();p.body.angularVelocity.setZero();p.body.position.set(p.x,.55,p.z);p.body.quaternion.set(0,0,0,1);p.body.wakeUp();}}
 isDown(p){const up=p.body.quaternion.vmult(new C.Vec3(0,1,0));return up.y<.72||p.body.position.y<.25||Math.hypot(p.body.position.x-p.x,p.body.position.z-p.z)>1;}
 get fallen(){return this.pins.filter(p=>this.isDown(p)).length;}
 prepare(x=0){this.running=false;this.elapsed=0;this.ball.type=C.Body.KINEMATIC;this.ball.position.set(x,.44,2);this.ball.velocity.setZero();this.ball.angularVelocity.setZero();this.ball.quaternion.set(0,0,0,1);this.ball.updateMassProperties();this.ball.aabbNeedsUpdate=true;this.events=[];}
 launch({x=0,aim=0,power=.65,spin=0}={}){if(this.running)return false;this.prepare(clamp(x,-2.8,2.8));this.ball.type=C.Body.DYNAMIC;this.ball.updateMassProperties();this.ball.wakeUp();const speed=15+clamp(power,0,1)*10;this.ball.velocity.set(Math.sin(aim)*speed,0,-Math.cos(aim)*speed);this.ball.angularVelocity.set(-speed/.43,spin*2,0);this.running=true;this.elapsed=0;this.stable=0;this.lastFallen=0;this.spin=spin;return true;}
 step(dt=1/120){this.time+=dt;for(const m of this.movers){if(m.kind==='slide'){const next=Math.sin((this.time+dt)*.9+m.phase)*2.6;m.body.velocity.x=(next-m.body.position.x)/dt;}else{m.body.angularVelocity.set(0,.85,0);}}
 if(this.running){this.elapsed+=dt;if(this.ball.position.y<.8&&this.ball.position.z>-27)this.ball.applyForce(new C.Vec3(this.spin*this.spec.spin*this.spec.mass*(this.kind==='ice'?.14:.52),0,0));}
 this.world.step(dt);
 if(this.running){const n=this.fallen;this.stable=n===this.lastFallen?(this.stable||0)+dt:0;this.lastFallen=n;}
 }
 get settled(){if(!this.running)return false;if(this.elapsed>8.5)return true;const b=this.ball;const passed=b.position.z<-29.7||b.position.y<-4||Math.abs(b.position.x)>9;const stopped=b.velocity.length()<.4&&this.elapsed>2;return this.elapsed>3&&(passed||stopped)&&this.stable>1.3;}
}
