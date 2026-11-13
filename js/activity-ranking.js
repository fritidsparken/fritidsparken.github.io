(() => {
  'use strict';
  const names = {"prince-of-persia":"The Lost World","rymdaventyret":"Rymdäventyret","blockvarlden":"Blockvärlden","skatepark":"Skatepark","downhill":"Downhill","kart-racing":"Kart Racing","minigolf":"Minigolf","strafflaggaren":"Straffläggaren","crazy-bowling":"Crazy Bowling","byggarbetsplatsen":"Byggarbetsplatsen","vattenparken":"Vattenparken","grodhoppet":"Grodhoppet","djurkliniken":"Djurkliniken","4-i-rad":"4 i rad","flygpilot":"Flygpilot","stuntcykel":"Stuntcykel","ansiktsloppan":"Ansiktsloppan","mala-online":"Färglägga","rita-steg-for-steg":"How to Draw","klippdockor":"Klippdockor","parlmonster":"Pärlmönster","julpyssel":"Julpyssel","halloweenpyssel":"Halloweenpyssel"};
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
  const list = board.querySelector('ol');
  const symbols = {'mala-online':'🎨','rita-steg-for-steg':'✏️',klippdockor:'✂️',parlmonster:'🟣',julpyssel:'🎄',halloweenpyssel:'🎃'};
  function render(rows) {
    const items = document.createDocumentFragment();
    rows.filter(row => Object.hasOwn(names, row.activity_id))
      .sort((a,b) => b.opens-a.opens || b.seconds-a.seconds)
      .slice(0,5).forEach(row => {
        const slug = row.activity_id;
        const gameId = Object.keys(aliases).find(id => aliases[id] === slug) || slug;
        const game = window.FPGameHub?.games.find(entry => entry.id === gameId);
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('aria-label', names[slug]);
        link.title = names[slug];
        if (game && ['four','plane','bike'].includes(gameId)) {
          link.href = '#catalog';
          link.dataset.standardGame = gameId;
        } else if (slug === 'ansiktsloppan') link.href = '/ansiktsloppan/';
        else if (symbols[slug]) {
          link.href = '#catalog';
          if (slug === 'parlmonster') link.dataset.standardPearl = '';
          else link.dataset.standardCategory = Object.keys(categories).find(key => categories[key] === slug);
        } else link.href = '/games/' + slug + '/';
        const asset = game?.image || ({ansiktsloppan:'tool_ansiktsloppa.svg','rita-steg-for-steg':'standard/drawing-step-cover.jpg'})[slug];
        const icon = document.createElement('span');
        icon.className = 'ranking-icon';
        icon.setAttribute('aria-hidden', 'true');
        if (asset) {
          const image = document.createElement('img');
          image.src = '/assets/' + asset;
          image.alt = '';
          icon.append(image);
        } else icon.textContent = symbols[slug] || '🎮';
        const label = document.createElement('span');
        label.textContent = names[slug];
        link.append(icon, label);
        item.append(link);
        items.append(item);
      });
    list.replaceChildren(items);
  }
  async function refresh() {
    try {
      const response = await fetch(endpoint,{headers});
      if (response.ok) render(await response.json());
    } catch { /* Keep the last available icons during a network interruption. */ }
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); },60000);
})();