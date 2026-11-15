// Shared folding geometry -> Blender input. Run from any directory.
import {writeFileSync} from 'node:fs';
import {models} from '../js/models.mjs';
import {compile} from '../js/geometry.mjs';
const model=models.find(m=>m.id==='glidaren'), c=compile(model);
const frames=48;
const ease=t=>{const p=Math.max(0,Math.min(1,(t-.2)/.68));return p*p*(3-2*p);};
const steps=c.transitions.map((transition,i)=>({
  number:i+1,text:model.steps[i].text,kind:model.steps[i].kind,
  frames:Array.from({length:frames},(_,f)=>transition.sample(ease(f/(frames-1))))
}));
writeFileSync(process.argv[2]||'/tmp/glidaren-frames.json',JSON.stringify({model,states:c.states,steps,fps:24}));
