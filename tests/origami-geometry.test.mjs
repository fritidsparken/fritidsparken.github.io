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
  assert.throws(()=>createTransition(initialState(models[0]),{kind:'fold',text:'outside paper',line:[[1000,0],[1000,1]],side:-1}),/does not move/);
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
