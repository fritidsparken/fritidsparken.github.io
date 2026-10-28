/* Vattenparken: deterministic course geometry, ride simulation and save format. */
(function (root) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const courses = [
    { id: 'lagunen', name: 'Blå Lagunen', label: 'DITT FÖRSTA PLASK', color: '#18bce3', accent: '#c9fbff', x: -105, height: 29, pace: 12, par: 30, description: 'Breda svängar, glittrande vatten och ett första litet hopp.', jump: [.69, .75, 3.2], tunnel: null,
      points: [[0,-96],[-9,-72],[-12,-45],[9,-21],[12,8],[-9,35],[0,60]] },
    { id: 'djungeln', name: 'Djungelormen', label: 'MELLAN PALMERNA', color: '#39be75', accent: '#d0ffc3', x: -63, height: 40, pace: 13, par: 34, description: 'Slingra dig genom tät grönska, vattenfall och tvära kurvor.', jump: [.73,.78,4], tunnel: [.39,.49],
      points: [[0,-96],[14,-77],[-14,-61],[13,-42],[-13,-22],[13,-4],[-14,17],[10,39],[0,60]] },
    { id: 'solracern', name: 'Solracern', label: 'FULL FART FRAMÅT', color: '#ffca42', accent: '#fff1b5', x: -21, height: 54, pace: 17, par: 24, description: 'En brant start, långa raksträckor och kraftfulla vattenboostar.', jump: [.67,.74,5], tunnel: null,
      points: [[0,-96],[0,-73],[2,-47],[-8,-17],[-8,11],[8,34],[0,60]] },
    { id: 'vulkanen', name: 'Vulkanen', label: 'GENOM DET VARMA BERGET', color: '#fa765b', accent: '#ffdac4', x: 21, height: 46, pace: 14, par: 31, description: 'Åk in i bergets mjuka mörker och ut i solskenet igen.', jump: [.74,.8,5], tunnel: [.2,.57],
      points: [[0,-96],[-12,-76],[12,-55],[14,-30],[-12,-11],[-8,15],[12,35],[0,60]] },
    { id: 'neonroret', name: 'Neonröret', label: 'FÖLJ LJUSET', color: '#9a6aef', accent: '#f0d8ff', x: 63, height: 46, pace: 14, par: 32, description: 'En lysande tunnel med färgade ringar och stjärnor i mörkret.', jump: [.83,.88,4], tunnel: [.1,.81],
      points: [[0,-96],[13,-72],[-13,-49],[13,-25],[-13,-2],[13,22],[-8,43],[0,60]] },
    { id: 'regnbagen', name: 'Regnbågsfallet', label: 'PARKENS STORA FINAL', color: '#f36cab', accent: '#ffd9ec', x: 105, height: 65, pace: 15, par: 42, description: 'En hög spiral, en lysande tunnel och parkens allra största plask.', jump: [.76,.83,8], tunnel: [.55,.68],
      points: [[0,-96],[-12,-79],[-14,-56],[0,-42],[14,-56],[0,-70],[-14,-56],[0,-42],[14,-26],[-12,-4],[12,22],[0,60]] }
  ];
  // Six different silhouettes and descent profiles; every chute stays continuous.
  Object.assign(courses[0],{points:[[0,-96],[-13,-60],[-9,-20],[10,20],[0,60]],pace:10,description:'Lugna, långa svängar i en öppen lagunbana.'});
  Object.assign(courses[2],{points:[[0,-96],[0,-80],[0,-58],[0,-25],[0,15],[0,60]],pace:19,description:'En rak störtloppsbana med brant start och maximal fart.'});
  Object.assign(courses[3],{points:[[0,-96],[-14,-75],[-14,-35],[0,-18],[14,-35],[14,5],[0,60]],description:'En hårnålssväng genom vulkanens mörka tunnel.'});
  Object.assign(courses[4],{points:[[0,-96],[12,-66],[12,-25],[-12,5],[-12,35],[0,60]],tunnel:[.04,.93],description:'En lång sluten neonbana med svepande kurvor och ljusringar.'});
  Object.assign(courses[5],{points:[[0,-96],[-15,-82],[-15,-60],[0,-48],[15,-60],[15,-82],[0,-94],[-15,-82],[-15,-60],[0,-48],[14,-15],[0,60]],description:'En hög regnbågsspiral i två våningar med lång utförsfinal.'});
  courses.forEach(c=>{c.jump=[0,0,0]});
  function turnInput(left,right){return (right?1:0)-(left?1:0);}
  function createCourse(T, config, index) {
    const count = config.points.length;
    const points = config.points.map(([x,z], i) => {
      const u = i / (count - 1);
      let y = 5 + config.height * (1 - u);
      if (index === 2) y = 5 + config.height * Math.pow(1-u, 1.75);
      if (index === 5) y = 5 + config.height * (1 - u) + Math.sin(u*Math.PI)*3;
      return new T.Vector3(config.x+x,y,z);
    });
    const curve = new T.CatmullRomCurve3(points, false, 'centripetal');
    curve.arcLengthDivisions = 1500;
    const length = curve.getLength();
    const frame = (u) => {
      u = clamp(u, 0, 1);
      const position = curve.getPointAt(u), tangent = curve.getTangentAt(u).normalize();
      const right = new T.Vector3().crossVectors(tangent, new T.Vector3(0,1,0)).normalize();
      const up = new T.Vector3().crossVectors(right, tangent).normalize();
      return {position, tangent, right, up};
    };
    const starItems = Array.from({length:24}, (_,j) => ({u:.045+j*.0375, lane:[-1.85,0,1.85,0,1.85,-1.85][(j+index)%6]}));
    const boosts = [.18,.39,.59,.86].map((u,j)=>({u,lane:j%2?1.2:-1.2}));
    const obstacles = index === 0 ? [.43,.81] : [.25,.47,.64,.9];
    return {...config,index,curve,length,frame,stars:starItems,boosts,obstacles:obstacles.map((u,j)=>({u,lane:j%2?-1.8:1.8})),pool:new T.Vector3(config.x,1,82)};
  }
  function laneHeight(lane) { return 3.15*(1-Math.sqrt(1-Math.pow(clamp(lane,-3.55,3.55)/3.55,2))); }
  function jumpHeight(course,u) {
    const [a,b,height]=course.jump;
    return u>a && u<b ? 4*height*((u-a)/(b-a))*(1-(u-a)/(b-a)) : 0;
  }
  class Ride {
    constructor(course) {this.course=course;this.distance=0;this.speed=7;this.lane=0;this.lateral=0;this.time=0;this.boostTime=0;this.stars=new Set();this.boosts=new Set();this.hits=new Set();this.done=false;this.events=[];}
    step(dt,input={}) {
      this.events=[]; if(this.done) return this.events;
      dt=clamp(dt,0,.05);const c=this.course,old=this.distance/c.length;
      const slope=-c.frame(old).tangent.y;
      const target=c.pace+slope*13+(input.forward?3.5:0)-(input.brake?6:0)+(this.boostTime>0?12:0);
      this.speed += (target-this.speed)*Math.min(1,dt*1.8);this.speed=clamp(this.speed,5,37);
      this.lateral += ((input.steer||0)*5.6-this.lateral)*Math.min(1,dt*12);
      this.lane=clamp(this.lane+this.lateral*dt,-2.6,2.6);this.time+=dt;
      this.boostTime=Math.max(0,this.boostTime-dt);
      this.distance=Math.min(c.length,this.distance+this.speed*dt);const u=this.distance/c.length;
      c.stars.forEach((s,i)=>{if(!this.stars.has(i)&&old<=s.u+.005&&u>=s.u-.005&&Math.abs(this.lane-s.lane)<1.15){this.stars.add(i);this.events.push({type:'star',index:i});}});
      c.boosts.forEach((s,i)=>{if(!this.boosts.has(i)&&old<s.u&&u>=s.u&&Math.abs(this.lane-s.lane)<1.7){this.boosts.add(i);this.boostTime=2.1;this.events.push({type:'boost',index:i});}});
      c.obstacles.forEach((s,i)=>{if(!this.hits.has(i)&&old<s.u&&u>=s.u&&Math.abs(this.lane-s.lane)<1){this.hits.add(i);this.speed*=.62;this.boostTime=0;this.events.push({type:'bump',index:i});}});
      if(old<c.jump[1]&&u>=c.jump[1])this.events.push({type:'splash'});
      if(this.distance>=c.length){this.done=true;this.events.push({type:'finish'});}
      return this.events;
    }
    result() {
      const score=this.stars.size*250+this.boosts.size*400+Math.max(0,Math.round((this.course.par*1.8-this.time)*80))-this.hits.size*100;
      const rating=this.stars.size>=18&&this.time<=this.course.par*1.6?3:this.stars.size>=10?2:1;
      return {time:Math.round(this.time*100)/100,stars:this.stars.size,boosts:this.boosts.size,hits:this.hits.size,score:Math.max(0,score),rating};
    }
  }
  function cleanSave(value) {
    const s={version:2,unlocked:1,records:{},sound:true,music:true,quality:'auto',secret:false};
    if(!value||typeof value!=='object')return s;
    s.unlocked=Number.isInteger(value.unlocked)?clamp(value.unlocked,1,6):1;
    for(const key of ['sound','music','secret'])if(typeof value[key]==='boolean')s[key]=value[key];
    if(['auto','low','medium','high'].includes(value.quality))s.quality=value.quality;
    for(let i=0;i<6;i++){const r=value.records?.[i];if(r&&Number.isFinite(r.time)&&r.time>0&&Number.isFinite(r.stars)){s.records[i]={time:r.time,stars:clamp(r.stars,0,24),rating:clamp(Math.floor(r.rating||1),1,3),score:Math.max(0,Number.isFinite(r.score)?r.score:0)};}}
    return s;
  }
  function record(save,index,result) {
    const old=save.records[index];save.records[index]={time:Math.min(old?.time||Infinity,result.time),stars:Math.max(old?.stars||0,result.stars),rating:Math.max(old?.rating||0,result.rating),score:Math.max(old?.score||0,result.score)};
    const newlyUnlocked=index+1===save.unlocked&&save.unlocked<6;if(newlyUnlocked)save.unlocked++;
    return newlyUnlocked;
  }
  const api={courses,turnInput,createCourse,jumpHeight,laneHeight,Ride,cleanSave,record,clamp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WaterparkCore=api;
})(typeof window!=='undefined'?window:globalThis);
