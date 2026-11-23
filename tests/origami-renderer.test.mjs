import test from 'node:test';
import assert from 'node:assert/strict';
import {models} from '../origami/js/models.mjs';
import {compile} from '../origami/js/geometry.mjs';
import {PaperRenderer} from '../origami/js/renderer.mjs';
class SvgElement {
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];}
 setAttribute(k,v){this.attrs[k]=String(v);}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
}
test('every finished model and its pen details render in all ordinary views',()=>{
 const previous=globalThis.document;globalThis.document={createElementNS:(_,tag)=>new SvgElement(tag)};
 try{for(const model of models){
  const svg=new SvgElement('svg'),r=new PaperRenderer(svg),state=compile(model).states.at(-1);
  for(const view of ['top','angle','side']){
   r.view=view;r.draw(state,{model,finished:true});
   const visit=n=>{for(const v of Object.values(n.attrs))assert.ok(!/NaN|undefined|Infinity/.test(v),model.id+': invalid '+n.tag);n.children.forEach(visit);};visit(svg);
   assert.equal(r.decor.children.length,model.face?.marks?.length??(model.face?3:0));
  }
 }}finally{globalThis.document=previous;}
});
test('both sides of a spring strip keep their color while rotating the finished weave',()=>{
 const previous=globalThis.document;globalThis.document={createElementNS:(_,tag)=>new SvgElement(tag)};
 try{
  const model=models.find(m=>m.id==='pappersfjader'),state=compile(model).states.at(-1);
  const colors=new Set(state.panels.map(panel=>panel.color));
  assert.equal(colors.size,2);
  const r=new PaperRenderer(new SvgElement('svg'));
  for(const yaw of [0,Math.PI]){
   r.orbit={yaw,pitch:.43};r.draw(state,{model,finished:true});
   const fills=new Set(r.paper.children.filter(p=>p.attrs.stroke).map(p=>p.attrs.fill));
   assert.deepEqual(fills,colors);
  }
 }finally{globalThis.document=previous;}
});
