// Rigid paper panels. Coordinates are millimetres, y points down the sheet.
// A crease partitions the existing paper; it never replaces its silhouette.
export const EPS = 1e-7;
const clone = value => structuredClone(value);
export const signedDistance = (p, [a,b]) => (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
export function area3(points) {
  let a=[0,0,0];
  for(let i=0;i<points.length;i++) {
    const p=points[i],q=points[(i+1)%points.length];
    a[0]+=p[1]*q[2]-p[2]*q[1];a[1]+=p[2]*q[0]-p[0]*q[2];a[2]+=p[0]*q[1]-p[1]*q[0];
  }
  return Math.hypot(...a)/2;
}
export function clip(points,line,side) {
  const out=[];
  for(let i=0;i<points.length;i++) {
    const a=points[i],b=points[(i+1)%points.length],da=signedDistance(a,line)*side,db=signedDistance(b,line)*side;
    if(da>=-EPS)out.push([...a]);
    if((da>EPS&&db<-EPS)||(da<-EPS&&db>EPS)) {const t=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*t));}
  }
  const clean=out.filter((p,i)=>!i||Math.hypot(...p.map((v,j)=>v-out[i-1][j]))>EPS);
  if(clean.length>2&&Math.hypot(...clean[0].map((v,j)=>v-clean.at(-1)[j]))<EPS)clean.pop();
  return clean.length>=3&&area3(clean)>EPS?clean:[];
}
export function rotatePoint(p,axis,angle) {
  const a=[...axis[0],0].slice(0,3),b=[...axis[1],0].slice(0,3);
  const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),u=d.map(v=>v/length),v=p.map((n,i)=>n-a[i]);
  const c=Math.cos(angle),s=Math.sin(angle),dot=u.reduce((n,x,i)=>n+x*v[i],0);
  const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  return v.map((n,i)=>a[i]+n*c+cross[i]*s+u[i]*dot*(1-c));
}
export function initialState(model) {
  const points=(model.paper.outline||[[-model.paper.width/2,-model.paper.height/2],[model.paper.width/2,-model.paper.height/2],[model.paper.width/2,model.paper.height/2],[-model.paper.width/2,model.paper.height/2]]).map(p=>[...p,0]);
  return {panels:[{id:'paper',points,tags:[],front:model.paper.front!==false}],creases:[]};
}
function matches(panel,selection) {
  return !selection || ((!selection.has||panel.tags.includes(selection.has))&&(!selection.not||!panel.tags.includes(selection.not)));
}
function splitFold(state,step) {
  const fixed=[],moving=[];
  for(const panel of state.panels) {
    if(!matches(panel,step.select)){fixed.push(clone(panel));continue;}
    if(panel.points.some(p=>Math.abs(p[2])>EPS))throw new Error('Flat crease applied to non-flat paper');
    const stay=clip(panel.points,step.line,-step.side),lift=clip(panel.points,step.line,step.side);
    if(stay.length)fixed.push({...clone(panel),id:panel.id+'s',points:stay});
    if(lift.length)moving.push({...clone(panel),id:panel.id+'m',points:lift,tags:[...panel.tags,...(step.tag?[step.tag]:[])]});
  }
  if(!moving.length)throw new Error('Crease does not move any paper: '+step.text);
  return {fixed,moving};
}
export function createTransition(state,step) {
  if(step.kind==='fold') {
    const {fixed,moving}=splitFold(state,step),angle=(step.angle??180)*Math.PI/180*step.side*(step.direction??1);
    return {step,sample(t){
      const rotated=moving.map(p=>({...p,points:p.points.map(v=>rotatePoint(v,step.line,angle*t)),front:t===1&&!step.angle?!p.front:p.front}));
      // Paper is stacked bottom to top. Valley folds reverse moving layer order.
      const panels=t===1?(step.direction===-1?[...rotated.reverse(),...fixed]:[...fixed,...rotated.reverse()]):[...fixed,...rotated];
      return {panels,creases:state.creases};
    }};
  }
  if(step.kind==='turn') {
    const axis=step.axis||[[0,-300],[0,300]],angle=(step.angle??180)*Math.PI/180;
    return {step,sample(t){return {panels:(t===1?[...state.panels].reverse():state.panels).map(p=>({...p,points:p.points.map(v=>rotatePoint(v,axis,angle*t)),front:t===1?!p.front:p.front})),creases:[]};}};
  }
  if(step.kind==='open') {
    return {step,sample(t){return {panels:state.panels.map(p=>{
      const motion=step.motions.find(m=>matches(p,m.select));
      return motion?{...p,points:p.points.map(v=>rotatePoint(v,motion.axis,motion.angle*Math.PI/180*t))}:p;
    }),creases:state.creases};}};
  }
  return {step,sample(){return clone(state);}};
}
export function compile(model) {
  let state=initialState(model);const transitions=[],states=[clone(state)],folds=[];
  for(const step of model.steps) {
    let transition;
    if(step.kind==='unfold') {
      const previous=folds.pop();if(!previous)throw new Error('Nothing to unfold');
      transition={step,sample(t){return previous.sample(1-t);}};
    } else {transition=createTransition(state,step);if(step.kind==='fold')folds.push(transition);}
    state=transition.sample(1);
    // Round away numerical noise after a complete flat fold, without changing shape.
    state.panels.forEach(p=>p.points.forEach(v=>v.forEach((n,i)=>{if(Math.abs(n)<EPS)v[i]=0;})));
    transitions.push(transition);states.push(clone(state));
  }
  return {model,transitions,states};
}
