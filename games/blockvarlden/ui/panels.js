import {eggs} from '../entities/mutations.js';
import * as db from '../persistence/worlds.js';
import {recipes} from '../inventory/recipes.js?v=varld2';
const $=id=>document.getElementById(id);
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
function btn(text,fn){const n=el('button',text);n.onclick=fn;return n}
export function panels(api){
 const d=$('panel'),c=$('content');let tab='library',current='';
 const msg=e=>api.toast(e.message||String(e)),run=fn=>async()=>{try{await fn()}catch(e){msg(e)}};
 d.addEventListener('keydown',e=>{if(e.code==='KeyE'&&current==='pack'&&!e.repeat&&!e.target.closest('input,textarea,select')){e.preventDefault();e.stopPropagation();close()}});
 function show(key,title){current=key;$('dialog-status').textContent='';api.suspend();c.replaceChildren(el('h2',title));if(!d.open)d.showModal();}
 function close(){if(d.open)d.close();current='';api.resume()}
 $('close').onclick=close;d.oncancel=e=>{e.preventDefault();if(!$('close').disabled)close()};
 function field(name,node){const label=el('label',name);label.append(node);return label}
 function select(values,initial){const n=el('select');for(const [v,text] of values){const o=el('option',text);o.value=v;n.append(o)}n.value=initial;return n}
 function create(){show('create','Skapa en värld');const name=el('input'),seed=el('input');name.value='Min blockvärld';name.maxLength=64;seed.placeholder='Slumpa ett världsfrö';const mode=select([['creative','Kreativt · bygg fritt'],['survival','Överlevnad · samla och skapa']],'creative'),difficulty=select(['Lätt','Normal','Utmanande'].map(t=>[t,t]),'Lätt');
 const fauna=select([['on','Med djur och varelser'],['off','Utan djur och fiender']],'on');const form=el('form');form.append(field('Världens namn',name),field('Djurliv',fauna),field('Spelläge',mode),field('Svårighetsgrad',difficulty),field('Världsfrö',seed));const b=el('button','Skapa värld →');b.className='gold';form.append(b);form.onsubmit=async e=>{e.preventDefault();b.disabled=true;try{const m=db.fresh(name.value,mode.value,seed.value,difficulty.value);m.quiet=fauna.value==='off';await api.start(m,[]);close()}catch(err){msg(err);b.disabled=false}};c.append(form)}
 async function worlds(){show('worlds','Mina världar');const arr=await db.list();if(current!=='worlds')return;if(!arr.length)c.append(el('p','Dina sparade världar visas här.'));for(const m of arr){const row=el('div');row.className='line';const desc=el('strong',m.name);desc.append(el('small',(m.mode==='creative'?'Kreativt':'Överlevnad')+' · '+new Date(m.updated).toLocaleString('sv-SE')));row.append(desc,btn('Spela',run(async()=>{await api.start(m,await db.readEdits(m.id));close()})),btn('Exportera',run(async()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,world:m,edits:await db.readEdits(m.id)})],{type:'application/json'})),a=el('a');a.href=url;a.download=m.name+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)})),btn('Ta bort',run(async()=>{if(confirm('Ta bort '+m.name+' från den här enheten?')){await db.remove(m.id);await worlds();api.refreshHome()}})));c.append(row)}
 const input=el('input');input.type='file';input.accept='.json,application/json';input.onchange=run(async()=>{if(!input.files[0])return;if(input.files[0].size>32e6)throw Error('Filen är för stor');const v=JSON.parse(await input.files[0].text()),m=db.validateImport(v,api.defs(),api.propIds());await db.save(m,v.edits);await worlds();api.refreshHome()});c.append(field('Importera en exporterad värld',input))}
 function settings(){show('settings','Inställningar');const s=api.settings;const stick=select([['auto','Automatiskt · touch på mobil'],['on','Visa skärmjoystick även för mus'] ],s.screenStick?'on':'auto');
 stick.onchange=()=>{s.screenStick=stick.value==='on';api.configure()};c.append(field('Skärmjoystick',stick));
 if(api.meta()&&!api.shared()){const animals=select([['on','Med djur och varelser'],['off','Utan djur och fiender']],api.meta().quiet?'off':'on');animals.onchange=()=>{api.meta().quiet=animals.value==='off';api.checkpoint()};c.append(field('Djurliv i den här världen',animals))}
 const q=select(['LOW','MEDIUM','HIGH','ULTRA'].map((v,i)=>[i,v]),s.quality);q.onchange=()=>{s.quality=+q.value;api.configure()};c.append(field('Grafik',q));
 const outfit=select([['skog','Skogsgrön'],['hav','Havsblå'],['lingon','Lingonröd'],['lavendel','Lavendel']],s.outfit);outfit.onchange=()=>{s.outfit=outfit.value;api.configure()};c.append(field('Jackans färg i tredjeperson',outfit));
 for(const [k,name,min,max,step] of [['fov','Synfält',55,100,1],['sense','Kamerakänslighet',.4,2,.1],['music','Musik',0,1,.05],['effects','Effekter',0,1,.05],['ambience','Omgivning',0,1,.05]]){const n=el('input');n.type='range';Object.assign(n,{min,max,step,value:s[k]});n.oninput=()=>{s[k]=+n.value;api.configure()};c.append(field(name,n))}}
 function pause(){if(!api.meta())return;show('pause','Expeditionen är pausad');const row=el('div');row.className='row';row.append(btn('Fortsätt',close),btn('Helskärm',()=>{api.fullscreen();close()}),btn('Spara',run(async()=>{await api.save();api.toast('Världen sparad')})),btn('Inställningar',settings),btn('Byt spelläge',()=>{api.switchMode();close()}),btn('Till startmenyn',run(async()=>{await api.home();close()})));c.append(row,el('p','WASD för att gå, Ctrl för att springa och mellanslag för att hoppa. Håll vänster musknapp för att gräva. Högerklicka för att bygga eller använda ett föremål. Shift smyger och håller dig kvar vid kanter. Dubbeltryck mellanslag för att flyga i kreativt läge. E öppnar och stänger ryggsäcken. Mushjulet eller 1–9 väljer plats, mittenklick plockar block, Q släpper ett föremål och F5 byter kamera. På mobil går du med vänster joystick och siktar genom att svepa. För spaken helt framåt för att springa. Dubbeltryck Hopp för att flyga.'))}
 function pack(){
  const opening=current!=='pack';
  show('pack','Ryggsäcken');
  if(opening){tab='library';api.sound('inventory')}
  const m=api.meta(),creative=m.mode==='creative',catalog=api.catalog();
  const display=api.name;
  const frame=el('section');frame.className='pack-frame';c.append(frame);
  const tabs=el('div');tabs.className='pack-tabs';
  const slots=el('div');slots.className='pack-slots';slots.setAttribute('role','group');slots.setAttribute('aria-label','Välj snabbvalsplats');
  const tools=el('div');tools.className='pack-tools';
  const list=el('div');list.className='pack-list';list.tabIndex=0;
  const hint=el('small','Välj en plats 1–9 och sedan ett föremål.');hint.className='pack-hint';
  frame.append(hint,slots,tabs,tools,list);
  function drawSlots(){
   slots.replaceChildren();
   m.slots.forEach((id,i)=>{
    const label='Plats '+(i+1)+' · '+display(id),b=btn('',()=>{
     api.setSlot(i);drawSlots();slots.children[i].focus({preventScroll:true});
    });
    b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(api.slotIndex()===i));
    b.append(el('small',String(i+1)),api.icon(id));slots.append(b);
   });
  }
  drawSlots();
  const library=btn(creative?'Alla material':'Mina föremål',()=>{tab='library';pack()});
  const craft=btn('Tillverka',()=>{tab='craft';pack()});
  library.setAttribute('aria-pressed',String(tab==='library'));craft.setAttribute('aria-pressed',String(tab==='craft'));
  tabs.append(library);if(!api.shared()){tabs.append(craft);const lab=btn('🥚 Varelselabb',()=>{tab='lab';pack()});lab.setAttribute('aria-pressed',String(tab==='lab'));tabs.append(lab)}
  if(creative&&!api.shared()){
   const actions=select([['','Byggverktyg…'],['mark','Markera hörn'],['paste','Klistra in bygge']],'');
   actions.setAttribute('aria-label','Byggverktyg');
   actions.onchange=()=>{if(actions.value){const result=api.blueprint(actions.value);close();api.toast(result)}};
   tabs.append(actions);
  }
  if(tab==='lab'){
   hint.textContent='Kombinera ägg och kläck en helt galen följeslagare!';
   const selection={},summary=el('strong'),status=el('p');status.setAttribute('role','status');
   const available=eggs.filter(e=>creative||m.bag[e.id]>0);
   const create=btn('Kläck varelse ✨',()=>{
    try{const result=api.hatch(selection);status.textContent=result.message;if(result.ok){for(const id of Object.keys(selection))delete selection[id];draw()}}catch(e){status.textContent=e.message}
   });create.className='gold';
   const all=btn('Lägg ihop alla ägg',()=>{for(const e of available)selection[e.id]=creative?1:Math.min(999,m.bag[e.id]||0);draw()});
   tools.append(all,btn('Töm blandningen',()=>{for(const id of Object.keys(selection))delete selection[id];draw()}));
   const footer=el('div');footer.className='lab-footer';footer.append(summary,create,status);frame.append(footer);
   function draw(){
    list.replaceChildren();let total=0;
    for(const e of available){
     const owned=creative?999:m.bag[e.id]||0,n=selection[e.id]||0;total+=n;
     const row=el('div');row.className='lab-egg';
     const title=el('strong','🥚 '+e.name);title.append(el('small',creative?'Obegränsat i kreativt läge':owned+' i ryggsäcken'));
     const minus=btn('−',()=>{selection[e.id]=Math.max(0,n-1);draw()}),plus=btn('+',()=>{selection[e.id]=n+1;draw()});
     minus.setAttribute('aria-label','Ta bort '+e.name);plus.setAttribute('aria-label','Lägg till '+e.name);minus.disabled=!n;plus.disabled=n>=Math.min(999,owned);
     row.append(title,minus,el('span',String(n)),plus);list.append(row);
    }
    summary.textContent=total+' ägg i blandningen';create.disabled=!total||m.quiet;all.disabled=!available.length;
    if(!available.length)list.append(el('p','Inga ägg ännu! Varelser lämnar mat och ett ägg när de dör. Gå nära ägget för att samla upp det.'));
    if(m.quiet)status.textContent='Slå på djurliv i Inställningar för att kläcka varelser.';
   }
   draw();return;
  }
  const search=el('input');search.type='search';search.placeholder=tab==='craft'?'Sök recept':'Sök block eller föremål';
  search.setAttribute('aria-label',search.placeholder);tools.append(search);
  const byName=(a,b)=>display(a.id).localeCompare(display(b.id),'sv');
  const match=id=>display(id).toLocaleLowerCase('sv').includes(search.value.trim().toLocaleLowerCase('sv'));
  if(tab==='craft'){
   list.classList.add('recipe-list');
   function draw(){
    list.replaceChildren();const benchNearby=creative||api.nearBench();
    for(const recipe of recipes.filter(r=>match(r.out))){
     const needs=Object.entries(recipe.needs),row=el('div');row.className='line';
     const name=el('strong',display(recipe.out)+' × '+recipe.count);
     name.append(el('small',needs.map(([id,n])=>display(id)+' '+(creative?'∞':(m.bag[id]||0))+'/'+n).join(' · ')+(recipe.station?' · arbetsbänk':'')));
     const b=btn('Skapa',()=>{api.craft(recipe);draw()});
     b.disabled=!creative&&(needs.some(([id,n])=>(m.bag[id]||0)<n)||(recipe.station&&!benchNearby));
     row.append(name,b);list.append(row);
    }
    if(!list.childElementCount)list.append(el('p','Inga recept matchar din sökning.'));
   }
   search.oninput=draw;draw();return;
  }
  const categories=select([['','Alla kategorier'],...Array.from(new Set(catalog.map(v=>v.category))).map(k=>[k,k])],'');
  categories.setAttribute('aria-label','Kategori');tools.append(categories);

  list.classList.add('items');
  function draw(){
   list.replaceChildren();
   const visible=catalog.filter(v=>(creative||m.bag[v.id]>0)&&(!categories.value||v.category===categories.value)&&match(v.id)).sort(byName);
   for(const v of visible){
    const b=btn('',()=>{api.pick(v.id);close()});b.className='item';
    b.append(api.icon(v.id),el('span',display(v.id)+(creative?'':' ×'+m.bag[v.id])));list.append(b);
   }
   if(!visible.length)list.append(el('p','Inga föremål här. Prova en annan sökning eller välj Tillverka.'));
  }
  search.oninput=categories.onchange=draw;draw();
 }
 function chest(record){
  show('chest','Förvaringslåda');record.items??={};
  const m=api.meta(),creative=m.mode==='creative',catalog=api.catalog().slice().sort((a,b)=>a.name.localeCompare(b.name,'sv'));
  const frame=el('section');frame.className='chest-frame';
  const toolbar=el('div');toolbar.className='chest-tools';
  const search=el('input');search.type='search';search.placeholder='Sök i ryggsäcken och lådan';search.setAttribute('aria-label',search.placeholder);
  const list=el('div');list.className='chest-list';list.tabIndex=0;
  const bulk=btn(creative?'Lägg in en av varje':'Lägg in allt',()=>{
   for(const v of catalog){const n=creative?1:(m.bag[v.id]||0);if(n>0)deposit(v.id,n)}
   api.bagChanged();draw();
  });
  toolbar.append(search,bulk);frame.append(toolbar,list);c.append(frame);
  function deposit(id,n){if(!creative)m.bag[id]-=n;record.items[id]=(record.items[id]||0)+n}
  function draw(){
   list.replaceChildren();
   const q=search.value.trim().toLocaleLowerCase('sv');
   bulk.disabled=!creative&&!catalog.some(v=>m.bag[v.id]>0);
   for(const v of catalog){
    const id=v.id,owned=m.bag[id]||0,stored=record.items[id]||0;
    if((!creative&&!owned&&!stored)||!((id==='door'?'dörr ':'')+v.name.toLocaleLowerCase('sv')).includes(q))continue;
    const row=el('div');row.className='chest-row';
    const name=el('strong',v.name);name.append(el('small','Ryggsäck '+(creative?'∞':owned)+' · Låda '+stored));
    const put=btn('Lägg in',()=>{deposit(id,1);api.bagChanged();draw()});
    put.disabled=!creative&&!owned;
    const take=btn('Ta ut',()=>{record.items[id]--;m.bag[id]=(m.bag[id]||0)+1;api.bagChanged();draw()});
    take.disabled=!stored;row.append(api.icon(id),name,put,take);list.append(row);
   }
   if(!list.childElementCount)list.append(el('p','Inga föremål här.'));
  }
  search.oninput=draw;draw();
 }
 for(const b of document.querySelectorAll('[data-open]'))b.onclick=run(({create,worlds,settings})[b.dataset.open]);
 const quick=$('play-fullscreen');
 if(quick)quick.onclick=run(async()=>{
  if(quick.disabled)return;
  quick.disabled=true;
  try{
   api.fullscreen();
   const latest=(await db.list())[0];
   const m=latest||db.fresh('Min blockvärld','creative','','Lätt');
   await api.start(m,latest?await db.readEdits(m.id):[]);
   close();
  }finally{quick.disabled=false}
 });
 $('continue').onclick=run(async()=>{const m=(await db.list())[0];if(m){await api.start(m,await db.readEdits(m.id));close()}});
 function bed(onWake){
  show('bed','Vila i sängen');
  const row=el('div');row.className='row';
  row.append(btn('Sov till morgonen',()=>{row.replaceChildren(el('p','Du somnar …'));setTimeout(()=>{if(current==='bed'&&row.isConnected){onWake();close()}},1400)}),btn('Gör det till dag direkt',()=>{onWake();close()}),btn('Avbryt',close));c.append(row);
 }
 function lobby(join){
  show('room','Spela tillsammans');
  const code=el('input');code.maxLength=8;code.value=localStorage.getItem('bv-last-room')||'';
  const fauna=select([['on','Med djur och varelser'],['off','Utan djur och fiender']],'on');
  const group=el('fieldset'),row=el('div');row.className='row';
  const enter=async (value,quiet)=>{
   group.disabled=true;$('close').disabled=true;
   try{await join(value,quiet)}catch(e){api.toast(e.message)}finally{group.disabled=false;$('close').disabled=false}
  };
  row.append(btn('Skapa rum',()=>enter('',fauna.value==='off')),btn('Gå med',()=>{const value=code.value.trim().toUpperCase();if(/^[A-HJ-NP-Z2-9]{8}$/.test(value))enter(value,fauna.value==='off');else api.toast('Ange rumskodens åtta tecken.')}));
  group.append(field('Djurliv',fauna),field('Rumskod',code),row);c.append(el('p','Bygg med upp till åtta spelare. Dela koden med dina kompisar.'),group);
 }
 return {lobby,close,pause,pack,chest,bed,isOpen:()=>d.open}
}
