import test from 'node:test';
import assert from 'node:assert/strict';
import {models} from '../origami/js/models.mjs';
import {area3,compile,rotatePoint,clip,initialState,createTransition} from '../origami/js/geometry.mjs';
const area=s=>s.panels.reduce((n,p)=>n+area3(p.points),0);
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-6,`${label}: ${a} ≠ ${b}`);
const lengths=p=>p.points.map((v,i)=>Math.hypot(...v.map((x,j)=>x-p.points[(i+1)%p.points.length][j])));
for(const model of models){
  test(`${model.id}: every animation preserves paper area and panel edge lengths`,()=>{
    const result=compile(model),expected=model.paper.area??model.paper.width*model.paper.height;
    close(area(initialState(model)),expected,'initial sheet');
    for(const [i,t] of result.transitions.entries()) {
      const start=t.sample(0);close(area(start),expected,`start ${i}`);
      const edgeLengths=new Map(start.panels.map(p=>[p.id,lengths(p)]));
      for(const frame of [0,.125,.25,.5,.75,.875,1]){
        const state=t.sample(frame);close(area(state),expected,`${i} frame ${frame}`);
        for(const p of state.panels){assert.ok(p.points.flat().every(Number.isFinite));lengths(p).forEach((v,j)=>close(v,edgeLengths.get(p.id)[j],`${i} rigid edge ${j}`));}
      }
      close(area(result.states[i+1]),expected,'state area');
    }
  });
  test(`${model.id}: deterministic replay and step navigation`,()=>{
    const c=compile(model),again=compile(model);
    assert.deepEqual(c.states,again.states);
    for(const t of c.transitions){assert.deepEqual(t.sample(.3),t.sample(.3));t.sample(.9);assert.deepEqual(t.sample(.3),t.sample(.3));}
    assert.ok(model.source.url.startsWith('https://'));assert.ok(model.steps.length>=4);
  });
}
test('crease endpoints stay fixed throughout rotation',()=>{
  const axis=[[-21,47],[69,-33]];
  for(const t of [0,.25,.5,.75,1])for(const p of axis){const rotated=rotatePoint([...p,0],axis,Math.PI*t);p.forEach((v,i)=>close(v,rotated[i],'crease hinge'));close(rotated[2],0,'hinge depth');}
});
test('clipping handles crease crossing a vertex and preserves area',()=>{
  const square=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]],line=[[-1,-1],[1,1]];
  close(area3(clip(square,line,1))+area3(clip(square,line,-1)),4,'split square');
});
test('unfold restores the flat sheet and retains its new crease',()=>{
  const c=compile(models.find(m=>m.id==='hjarta'));
  assert.deepEqual(c.transitions[0].sample(0),c.states[2]);
  close(area(c.states[0]),area(c.states[2]),'unfolded sheet area');
  c.states[2].panels.forEach(p=>p.points.forEach(v=>close(v[2],0,'unfolded sheet plane')));
});
test('selected layer folds do not move cat ears',()=>{
  const c=compile(models.find(m=>m.id==='katt')),before=c.states[5],after=c.states[6];
  assert.deepEqual(before.panels.filter(p=>p.tags.includes('ear')),after.panels.filter(p=>p.tags.includes('ear')));
});
test('no empty folds silently pass',()=>{
  const sheet=initialState(models.find(m=>m.id==='katt'));
  assert.throws(()=>createTransition(sheet,{kind:'fold',text:'outside paper',line:[[1000,0],[1000,1]],side:-1}),/does not move/);
});

test('Glidaren locks only its exposed nose flap, keeping both shoulders still',()=>{
  const c=compile(models.find(m=>m.id==='glidaren'));
  const shoulders=state=>state.panels.filter(p=>p.tags.includes('lock-shoulder'));
  assert.deepEqual(shoulders(c.states[7]),shoulders(c.states[8]));
  const moved=c.states[8].panels.filter(p=>p.tags.includes('nose')&&!p.tags.includes('lock-shoulder'));
  assert.ok(moved.some(p=>p.points.some(v=>Math.abs(v[0])<1e-6&&Math.abs(v[1]-22.2934656)<1e-5)));
});
test('wing layers rotate with the opened wings, rather than reversing exposed surfaces',()=>{
  const c=compile(models.find(m=>m.id==='glidaren'));
  const final=c.states.at(-1).panels;
  assert.ok(final.filter(p=>p.tags.includes('wing-right')).some(p=>p.layerOffset[2]<-.1));
  assert.ok(final.filter(p=>p.tags.includes('wing-right')).every(p=>p.layerOffset[2]<=1e-8));
  assert.ok(final.filter(p=>p.tags.includes('wing-left')).every(p=>p.layerOffset[2]>=-1e-8));
  for(const p of final)assert.ok(p.layerOffset.every(Number.isFinite));
});

test('Arrowhead pocket opens and closes over the tip without replacing any paper',()=>{
  const model=models.find(m=>m.id==='arrowhead'),c=compile(model),i=model.steps.findIndex(s=>s.kind==='tuck');
  const before=c.states[i],after=c.states[i+1],t=c.transitions[i];
  const cap=p=>['band','nose','back-tip'].every(tag=>p.tags.includes(tag))&&!p.tags.includes('corner');
  assert.equal(before.panels.filter(cap).length,2,'Center crease divides the cap into two connected halves');
  assert.ok(after.panels.at(-1).tags.includes('band'));
  assert.ok(cap(after.panels.at(-1)),'Closing cap sits over the inserted front layers');
  const byId=new Map(before.panels.map(p=>[p.id,p]));
  for(const p of after.panels)p.points.forEach((v,i)=>v.forEach((n,j)=>close(n,byId.get(p.id).points[i][j],'Flat tuck retains crease geometry')));
  assert.ok(t.sample(.35).panels.find(cap).points.some(v=>v[2]>20),'Pocket visibly opens');
  for(const p of t.sample(.35).panels.filter(p=>!p.tags.includes('back-tip')))assert.deepEqual(p.points,byId.get(p.id).points,'Outer wings stay still');
});

test('in-plane rotations preserve the visible paper face and layer order',()=>{
 const state=createTransition(initialState(models.find(m=>m.id==='katt')),{kind:'fold',line:[[0,-200],[0,200]],side:1}).sample(1);
 const turned=createTransition(state,{kind:'turn',axis:[[0,0,0],[0,0,1]],angle:180}).sample(1);
 assert.deepEqual(turned.panels.map(p=>[p.id,p.front]),state.panels.map(p=>[p.id,p.front]));
 turned.panels.forEach((p,i)=>p.points.forEach((v,j)=>{close(v[0],-state.panels[i].points[j][0],'turn x');close(v[1],-state.panels[i].points[j][1],'turn y');}));
});
test('standing name-card layers rotate with the lifted paper',()=>{
 const m=models.find(m=>m.id==='namnskylt'),c=compile(m),i=m.steps.findIndex(s=>s.kind==='fold'&&s.angle===120),f=m.steps[i];
 const axis=[[0,0,0],[f.line[1][0]-f.line[0][0],f.line[1][1]-f.line[0][1],0]],state=c.states[i+1];
 assert.ok(state.panels.some(p=>Math.abs(p.layerOffset?.[1]||0)>.01));
 for(const p of state.panels.filter(p=>p.points.some(v=>Math.abs(v[2])>1e-6))){const back=rotatePoint(p.layerOffset,axis,-120*Math.PI/180*f.side*(f.direction??1));close(back[0],0,'offset x');close(back[1],0,'offset y');}
});

test('the spring opens two doubled strips into four arms and weaves each arm in turn',()=>{
  const model=models.find(m=>m.id==='pappersfjader');
  const {states}=compile(model);
  function tails(state) {
    return state.panels.filter(p=>p.id.endsWith('-tail')).map(panel=>{
      const [a,b]=panel.points,dx=b[0]-a[0],dy=b[1]-a[1];
      const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
      return {arm:panel.id,material:panel.material,direction};
    });
  }
  const doubled=tails(states[3]);
  assert.equal(doubled.length,4);
  assert.deepEqual(doubled.filter(p=>p.material===0).map(p=>p.direction),['right','right']);
  assert.deepEqual(doubled.filter(p=>p.material===1).map(p=>p.direction),['down','down']);
  assert.deepEqual(new Set(tails(states[5]).map(p=>p.direction)),new Set(['up','down','left','right']));
  const folded=[];
  for(let index=7;index<=10;index++) {
    const before=tails(states[index-1]),after=tails(states[index]);
    const moved=after.filter(p=>p.direction!==before.find(q=>q.arm===p.arm).direction);
    assert.equal(moved.length,1,'each teaching step folds just one free end across the centre');
    folded.push(moved[0]);
  }
  assert.equal(new Set(folded.map(p=>p.arm)).size,4);
  assert.deepEqual(folded.map(p=>p.material),[0,1,0,1]);
});

test('the finished spring curves into an arch and keeps four separate checkerboard cells on its end',()=>{
  const model=models.find(m=>m.id==='pappersfjader'),{states}=compile(model);
  const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
  const distance=(a,b)=>Math.hypot(...subtract(a,b));
  const mean=points=>[0,1,2].map(i=>points.reduce((s,p)=>s+p[i],0)/points.length);
  function courses(state) {
    const groups=[];
    for(const panel of state.panels){
      const match=panel.id.match(/^\d+-(\d+)-[01]$/);
      if(!match)continue;
      const points=panel.points.map(p=>p.map((v,i)=>v+panel.layerOffset[i]));
      (groups[Number(match[1])]??=[]).push({color:panel.color,points,center:mean(points)});
    }
    return groups;
  }
  const center=course=>mean(course.map(cell=>cell.center));
  function bow(groups) {
    const ends=mean([center(groups[0]),center(groups.at(-1))]);
    const mid=(groups.length-1)/2;
    return distance(ends,mean([center(groups[Math.floor(mid)]),center(groups[Math.ceil(mid)])]));
  }
  const straight=courses(states.at(-2)),bent=courses(states.at(-1));
  assert.ok(bow(straight)<model.paper.width*.1);
  assert.ok(bow(bent)>model.paper.width,'the middle rises away from the line joining the ends');
  const cap=bent.at(-1),normal=subtract(center(cap),center(bent.at(-2)));
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  const colors=[...new Set(cap.map(p=>p.color))];
  assert.equal(colors.length,2);
  const covers=[];
  for(const first of cap.filter(p=>p.color===colors[0])) {
    const other=cap.filter(p=>p.color===colors[1]).sort((a,b)=>distance(first.center,a.center)-distance(first.center,b.center))[0];
    assert.ok(distance(first.center,other.center)<model.paper.width*.1,'one square of each color occupies this cell');
    const signs=first.points.map(a=>{
      const nearest=[...other.points].sort((b,c)=>distance(a,b)-distance(a,c))[0];
      return Math.sign(dot(subtract(a,nearest),normal));
    });
    assert.ok(signs[0]!==0&&signs.every(value=>value===signs[0]),'one entire color lies above the other even at the corners');
    covers.push(signs[0]>0?first:other);
  }
  assert.equal(covers.length,4);
  for(const color of colors){
    const pair=covers.filter(cell=>cell.color===color);
    assert.equal(pair.length,2);
    assert.ok(distance(pair[0].center,pair[1].center)>model.paper.width*1.3,'matching colors occupy opposite corners');
  }
});
