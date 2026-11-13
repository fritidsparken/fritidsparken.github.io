(() => {
  'use strict';
  const names = {"prince-of-persia":"The Lost World","rymdaventyret":"Rymdäventyret","blockvarlden":"Blockvärlden","skatepark":"Skatepark","downhill":"Downhill","kart-racing":"Kart Racing","minigolf":"Minigolf","strafflaggaren":"Straffläggaren","crazy-bowling":"Crazy Bowling","byggarbetsplatsen":"Byggarbetsplatsen","vattenparken":"Vattenparken","grodhoppet":"Grodhoppet","djurkliniken":"Djurkliniken","4-i-rad":"4 i rad","flygpilot":"Flygpilot","stuntcykel":"Stuntcykel","ansiktsloppan":"Ansiktsloppan","mala-online":"Färglägga","rita-steg-for-steg":"Rita steg för steg","klippdockor":"Klippdockor","parlmonster":"Pärlmönster","julpyssel":"Julpyssel","halloweenpyssel":"Halloweenpyssel"};
  const aliases = {"kart":"kart-racing","penalty":"strafflaggaren","bowling":"crazy-bowling","construction":"byggarbetsplatsen","waterpark":"vattenparken","frog":"grodhoppet","clinic":"djurkliniken","four":"4-i-rad","plane":"flygpilot","bike":"stuntcykel"};
  const categories = {'Mandala':'mala-online','Rita steg-för-steg':'rita-steg-for-steg','Klippdockor':'klippdockor','Julpyssel':'julpyssel','Halloweenpyssel':'halloweenpyssel'};
  const endpoint = 'https://bglrvlswqsuahqyytvny.supabase.co/functions/v1/activity-stats';
  // The gateway validates the project's public anon JWT.
  const headers = {Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbHJ2bHN3cXN1YWhxeXl0dm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NjIxNDAsImV4cCI6MjEwOTEzODE0MH0.up5SnyIovOqOuORFWLwS6Q0mBNDEFNSkjhPBgmxhbY8','Content-Type':'application/json'};
  const path = location.pathname.split('/').filter(Boolean);
  const standalone = path[0]==='games' ? path[1] : path[0]==='ansiktsloppan' ? 'ansiktsloppan' : null;
  let inlineGame=null, visit=null, lastInput=Date.now(), lastTick=0, wasActive=false;
  function current() {
    if (standalone) return standalone;
    if (inlineGame) return aliases[inlineGame] || inlineGame;
    if (typeof funTool!=='undefined' && funTool==='ansiktsloppa') return 'ansiktsloppan';
    if (typeof pearlPage!=='undefined' && pearlPage) return 'parlmonster';
    return typeof category==='string' ? categories[category] : null;
  }
  window.fpStatsGame = id => {inlineGame=id; sync();};
  function send(v,action) {
    fetch(endpoint,{method:'POST',headers,body:JSON.stringify({activity:v.id,session:v.session,action}),keepalive:true}).catch(()=>{});
  }
  function sync() {
    if(window.self!==window.top) return;
    const id=current(), now=Date.now(), active=!document.hidden && document.hasFocus() && now-lastInput<90000;
    if(visit && visit.id!==id){if(wasActive)send(visit,'stop');visit=null;}
    if(id && names[id] && active && !visit){visit={id,session:crypto.randomUUID()};send(visit,'open');lastTick=now;}
    if(visit && wasActive && !active){send(visit,'tick');}
    if(active && !wasActive)lastTick=now;
    if(visit && active && now-lastTick>=30000){send(visit,'tick');lastTick=now;}
    wasActive=active;
  }
  for(const event of ['keydown','pointerdown','pointermove','touchstart','focus']) addEventListener(event,()=>{lastInput=Date.now();},{passive:true});
  document.addEventListener('visibilitychange',sync);
  addEventListener('pagehide',()=>{if(visit && wasActive)send(visit,'stop');visit=null;wasActive=false;});
  setInterval(sync,1000);sync();
  const board=document.getElementById('fp-ranking');
  if(!board)return;
  const list=board.querySelector('ol'), sort=board.querySelector('select'), status=board.querySelector('p');
  let rows=[];
  function render(){
    list.replaceChildren();
    rows.slice().sort((a,b)=>b[sort.value]-a[sort.value] || b.opens-a.opens).slice(0,5).forEach(row=>{
      const li=document.createElement('li'), action=document.createElement('a');
      const slug=row.activity_id, game=Object.keys(aliases).find(k=>aliases[k]===slug)||slug;
      if(['four','plane','bike'].includes(game)){action.href='#catalog';action.dataset.standardGame=game;}
      else if(slug==='ansiktsloppan')action.href='/ansiktsloppan/';
      else if(Object.values(categories).includes(slug)||slug==='parlmonster'){action.href='#catalog';if(slug==='parlmonster')action.dataset.standardPearl='';else action.dataset.standardCategory=Object.keys(categories).find(k=>categories[k]===slug);}
      else action.href='/games/'+slug+'/';
      action.textContent=names[slug];li.append(action,' · '+row.opens+' öppningar · '+(row.seconds<60?row.seconds+' s':Math.round(row.seconds/60)+' min'));list.append(li);
    });
    status.textContent=rows.length?'Senaste 30 dagarna':'Listan fylls när aktiviteterna används.';
  }
  sort.addEventListener('change',render);
  async function refresh(){try{const response=await fetch(endpoint,{headers});if(!response.ok)throw Error();rows=(await response.json()).filter(row=>Object.hasOwn(names,row.activity_id));render();}catch{status.textContent='Statistiken kunde inte hämtas just nu.';}}
  refresh();setInterval(()=>{if(!document.hidden)refresh();},60000);
})();