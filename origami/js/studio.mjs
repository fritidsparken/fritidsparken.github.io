import {models,categories} from './models.mjs';
import {compile} from './geometry.mjs';
import {PaperRenderer} from './renderer.mjs';
import {loadProgress,saveProgress} from './progress.mjs';
const $=id=>document.getElementById(id),svgNS='http://www.w3.org/2000/svg';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const colors=[['Honung','#edb852'],['Himmel','#78b5d3'],['Ros','#e58f9f'],['Lavendel','#a7a1d4'],['Salvia','#83b28b']];
const cache=new Map();
const compiled=m=>{if(!cache.has(m.id))cache.set(m.id,compile(m));return cache.get(m.id);};
let current=null,step=0,raf=0,playing=false,paused=false,preview=false,elapsed=0,last=0,speed=1,opener=null,paintState=null;
const renderer=new PaperRenderer($('paper'));
function bannerSize(){document.documentElement.style.setProperty('--banner-height',Math.ceil(document.querySelector('.std-header').getBoundingClientRect().height)+'px');}
new ResizeObserver(bannerSize).observe(document.querySelector('.std-header'));bannerSize();
function gallery(category='Alla') {
  $('categories').replaceChildren();
  for(const name of categories){const b=document.createElement('button');b.textContent=name;b.setAttribute('aria-pressed',String(name===category));b.onclick=()=>gallery(name);$('categories').append(b);}
  $('models').replaceChildren();const visible=models.filter(m=>category==='Alla'||m.category===category);
  $('model-count').textContent=visible.length+' vikprojekt';
  for(const m of visible){
    const b=document.createElement('button');b.className='model-card';b.dataset.model=m.id;b.style.setProperty('--tint',m.color+'25');
    const art=document.createElement('span');art.className='model-art';const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('aria-hidden','true');art.append(svg);
    const badge=document.createElement('span');badge.className='difficulty';badge.textContent=m.level;art.append(badge);
    const copy=document.createElement('span');copy.className='card-copy';const title=document.createElement('strong');title.textContent=m.name;
    const time=document.createElement('small');time.textContent=m.minutes+' · '+m.steps.length+' steg';const paper=document.createElement('small');paper.textContent=m.paper.label;copy.append(title,time,paper);b.append(art,copy);
    if(loadProgress(m.id,m.steps.length+1)?.step){const resume=document.createElement('span');resume.className='resume-dot';resume.textContent='Fortsätt';b.append(resume);}
    b.onclick=()=>open(m,b);$('models').append(b);
    const r=new PaperRenderer(svg,{thumbnail:true});r.color=m.color;r.view=m.category==='Pappersflygplan'?'side':'angle';r.draw(compiled(m).states.at(-1),{model:m,finished:true});
  }
}
function stop(){cancelAnimationFrame(raf);raf=0;playing=false;paused=false;$('pause').hidden=true;}
function render(state,progress=1){paintState=state;renderer.draw(state,{step:preview?null:current.steps[step-1],progress,model:current,finished:preview||step===current.steps.length});}
function save(){const ok=saveProgress(current.id,step,renderer.color);$('saving').textContent=ok?'Sparas bara på den här enheten.':'Sparning är inte tillgänglig i den här webbläsaren.';}
function update(){
  const done=step===current.steps.length;
  $('step-count').textContent=preview?'Färdig modell':step===0?'Förbered':`Steg ${step} av ${current.steps.length}`;
  $('instruction').textContent=preview?'Så ser modellen ut när du är klar.':step===0?current.paper.label+' · Lägg den vita sidan uppåt.':current.steps[step-1].text;
  $('paper').setAttribute('aria-label',preview?'Den färdiga modellen: '+current.name:$('instruction').textContent);
  $('stage-label').textContent=preview||done?'DIN FÄRDIGA MODELL':playing?'TITTA PÅ VIKNINGEN':'VIK I DIN EGEN TAKT';
  $('stage-hint').textContent=playing?'':preview?'':done?'Fint vikt!':step?'Gör likadant med ditt papper.':'Välj en färg och ta fram ditt papper.';
  $('back').disabled=playing||(!preview&&step===0);$('replay').disabled=playing||preview||step===0;$('next').disabled=playing;
  $('next').textContent=preview?'Tillbaka till guiden':done?'Klart! Välj något nytt ✓':step?'Okej, jag är klar →':'Börja vika →';
  $('result').textContent=preview?'Tillbaka till guiden':'Visa färdig modell';
  $('pause').hidden=!playing;
  $('step-track').replaceChildren(...current.steps.map((_,i)=>{const n=document.createElement('span');n.className=i<step?'done':'';if(i===step-1)n.classList.add('current');return n;}));
  $('swatches').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===renderer.color)));
}
function showStep(){stop();preview=false;render(compiled(current).states[step]);update();}
function animate(){
  stop();preview=false;elapsed=0;last=0;
  if(reduced.matches||$('less-motion').checked){render(compiled(current).states[step]);save();update();return;}
  playing=true;update();$('pause').textContent='Pausa';
  const transition=compiled(current).transitions[step-1];
  render(transition.sample(0),0);
  function frame(now){
    if(!playing)return;if(!last)last=now;
    if(!paused&&!document.hidden)elapsed+=(now-last)*speed;last=now;
    const t=Math.min(1,elapsed/2200),p=Math.min(1,Math.max(0,(t-.20)/.68)),e=p*p*(3-2*p);
    render(transition.sample(e),p);
    if(t<1)raf=requestAnimationFrame(frame);else{stop();render(compiled(current).states[step]);save();update();}
  }
  raf=requestAnimationFrame(frame);
}
function open(model,button){stop();opener=button;current=model;preview=false;const saved=loadProgress(model.id,model.steps.length+1);step=saved?.step||0;renderer.color=saved?.color||model.color;renderer.view='angle';buildSwatches();
  $('views').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='angle')));
  $('studio-title').textContent=model.name;$('studio-category').textContent=model.category+' · '+model.level;$('material').textContent=model.materials;
  $('source').href=model.source.url;$('source').title=model.source.designer;$('studio').showModal();document.body.style.overflow='hidden';showStep();$('next').focus();
}
function close(){stop();$('studio').close();document.body.style.overflow='';const id=current?.id;const category=$('categories').querySelector('[aria-pressed=true]')?.textContent||'Alla';gallery(category);document.querySelector(`[data-model="${id}"]`)?.focus();}
$('close').onclick=close;$('studio').addEventListener('cancel',e=>{e.preventDefault();close();});
$('next').onclick=()=>{if(playing)return;if(preview){showStep();return;}if(step===current.steps.length){close();return;}step++;animate();};
$('back').onclick=()=>{if(playing)return;if(preview){showStep();return;}step=Math.max(0,step-1);showStep();save();};
$('replay').onclick=()=>{if(step&&!playing&&!preview)animate();};
$('pause').onclick=()=>{paused=!paused;last=0;$('pause').textContent=paused?'Fortsätt':'Pausa';};
$('restart').onclick=()=>{step=0;showStep();save();};
$('result').onclick=()=>{stop();preview=!preview;render(preview?compiled(current).states.at(-1):compiled(current).states[step]);update();};
$('speed').onchange=e=>speed=Number(e.target.value);
$('less-motion').checked=reduced.matches;
$('less-motion').onchange=()=>{if(playing&&$('less-motion').checked){stop();render(compiled(current).states[step]);save();update();}};
$('views').onclick=e=>{const b=e.target.closest('[data-view]');if(!b)return;renderer.view=b.dataset.view;$('views').querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));if(paintState)render(paintState);};
function buildSwatches(){
$('swatches').replaceChildren();
const palette=colors.map(v=>[...v]);if(!palette.some(([,c])=>c===renderer.color))palette[0]=['Modellens färg',renderer.color];
for(const [name,color] of palette){const b=document.createElement('button');b.style.setProperty('--swatch',color);b.dataset.color=color;b.setAttribute('aria-label',name);b.onclick=()=>{renderer.color=color;render(paintState);save();update();};$('swatches').append(b);}
}
reduced.addEventListener('change',()=>{if(playing&&reduced.matches){stop();render(compiled(current).states[step]);save();update();}});
gallery();
const hero=new PaperRenderer($('hero-paper'),{thumbnail:true}),heroModel=models[0];hero.color='#edb852';hero.view='side';hero.draw(compiled(heroModel).states.at(-1),{model:heroModel,finished:true});
