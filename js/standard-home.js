/* Standard's presentation layer. Existing seasonal views, games and painter own
   their original DOM and lifecycle. No copies of their implementation live here. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isStandard = () => !document.body.matches('.halloween,.christmas');
  const originalDraw = draw, originalFilters = drawFilters;
  const legacyTop = document.querySelector('.topin');
  const controls = ['theme','seasonPicker','halloweenSound'].map(id => document.getElementById(id));
  const palettes = ['#dcf2d6','#ffe5c6','#fff0b6','#ffdeea','#d4efff','#d7f2df','#e9dfff','#e1e4ff','#ffdeeb','#d2f4ee'];
  const categories = [['Skapa','Skapa','scissors'],['Pyssel','Pyssel','palette'],['Färglägga','Mandala','pencils'],['Klippdockor','Klippdockor','dolls'],['Rörelse','Fritidsgympa','ball'],['Bygga','Bygga','brick'],['Klurigt','Klurigt','bulb'],['Lugnt','Lugnt','chair'],['Spel','Spel','game'],['Roliga verktyg','Roliga verktyg','tools']];
  let iconId = 0, browseAll = false;
  function icon(kind) {
    const id = 'std-icon-' + (++iconId);
    const shapes = {
      scissors:'<path d="M35 51 70 18 52 61 75 79 68 85Z" fill="#e46656"/><path d="m60 50-37-31 19 43-17 19 8 7Z" fill="#bdccd2"/><circle cx="31" cy="72" r="13" fill="#58ad63"/><circle cx="31" cy="72" r="7" fill="#dff5d6"/><circle cx="65" cy="72" r="13" fill="#62bc72"/><circle cx="65" cy="72" r="7" fill="#dff5d6"/><circle cx="48" cy="54" r="4" fill="#f3f6ef"/>',
      palette:'<path d="M76 62c-5 3-17-9-21 0-4 10 7 14 1 21C44 94 13 79 13 54 13 26 44 12 67 23c25 11 26 30 9 39Z" fill="#f3bb50"/><circle cx="31" cy="42" r="7" fill="#ea6d68"/><circle cx="47" cy="32" r="7" fill="#9d70cf"/><circle cx="66" cy="37" r="7" fill="#6baed9"/><circle cx="28" cy="62" r="7" fill="#66b67b"/><path d="m45 83 31-53 9 5-32 53Z" fill="#b97842"/><path d="M75 33c-4-9 3-18 13-22 0 12-1 22-9 25Z" fill="#3998d1"/>',
      pencils:'<g transform="rotate(17 50 50)"><path d="M16 26h13v57H16Z" fill="#a17ce1"/><path d="m16 26 6-16 7 16Z" fill="#e4bf8a"/><path d="m20 17 2-7 3 7Z" fill="#58456a"/><path d="M33 22h13v61H33Z" fill="#518dcc"/><path d="m33 22 6-16 7 16Z" fill="#e4bf8a"/><path d="M50 26h13v57H50Z" fill="#50ad69"/><path d="m50 26 6-16 7 16Z" fill="#e4bf8a"/><path d="M67 31h13v52H67Z" fill="#efb03b"/><path d="m67 31 6-16 7 16Z" fill="#e4bf8a"/><path d="M20 31v46m17-51v51m17-46v46m17-41v41" stroke="#fff" stroke-opacity=".35" stroke-width="3"/></g>',
      dolls:'<g fill="#d49654"><circle cx="31" cy="26" r="13"/><circle cx="70" cy="26" r="13"/></g><g fill="#ffdab0"><circle cx="31" cy="30" r="10"/><circle cx="70" cy="30" r="10"/><path d="m19 49-12 15 5 4 16-15m16-4 11 15-5 4-15-15m24-4-10 15 5 4 14-15m14-4 12 15-5 4-16-15M24 72v14h6V72m6 0v14h6V72m22 0v14h6V72m6 0v14h6V72"/></g><path d="m24 42-8 33h29l-8-33Z" fill="#e377a5"/><path d="m64 42-8 33h29l-8-33Z" fill="#f8f1cc"/>',
      ball:'<circle cx="50" cy="49" r="35" fill="#f8faf8"/><path d="m43 34 17 1 7 15-12 13-18-8Z" fill="#34475b"/><path d="m26 22 9 4-7 17-12 1m56-22-7 10 11 15 9-3M21 65l15-2 7 20-10-2m42-15-14 3-1 15 15-10" fill="#34475b"/><path d="m35 26 8 8m24 16 9-3m-39 8-9-12m27 20 6 6" stroke="#c0c9cc" stroke-width="2"/>',
      brick:'<path d="m13 42 37-19 38 20v30L50 91 13 72Z" fill="#58b864"/><path d="m13 42 37 19 38-18-38-20Z" fill="#8cce76"/><path d="M50 61v30l38-18V43Z" fill="#359652"/><g fill="#64b75f"><ellipse cx="37" cy="39" rx="10" ry="5"/><ellipse cx="61" cy="39" rx="10" ry="5"/><path d="M27 31h20v8H27m24-8h20v8H51"/></g><g fill="#a2dc87"><ellipse cx="37" cy="31" rx="10" ry="5"/><ellipse cx="61" cy="31" rx="10" ry="5"/></g>',
      bulb:'<path d="M36 67c0-13-16-17-12-36 5-25 44-25 50 0 5 19-13 25-13 36Z" fill="#f5c43c"/><path d="M36 65h25v15H36Z" fill="#70818b"/><path d="M40 81h17l-3 7h-11Z" fill="#3e5263"/><path d="m43 64-6-22 12 8 12-8-6 22" fill="none" stroke="#fff1a1" stroke-width="3"/><path d="M49 2v8M15 14l6 7M4 42h10m72 0h10M77 17l7-7" stroke="#e9b12e" stroke-width="4" stroke-linecap="round"/>',
      chair:'<rect x="25" y="19" width="51" height="49" rx="16" fill="#59a6d8"/><rect x="27" y="55" width="47" height="24" rx="9" fill="#83bfe4"/><rect x="13" y="46" width="19" height="35" rx="9" fill="#3c91c6"/><rect x="69" y="46" width="19" height="35" rx="9" fill="#3c91c6"/><path d="M23 79v10m55-10v10" stroke="#485d6d" stroke-width="6"/><path d="M35 26q16-5 32 0" stroke="#c2e5f5" stroke-width="3" fill="none"/>',
      game:'<path d="M24 30c9-7 17 0 26 0s19-7 27 0c8 8 16 42 8 49-9 7-21-16-27-16H43C35 63 24 87 15 80 7 73 16 37 24 30Z" fill="#405367"/><path d="M21 46h20m-10-10v20" stroke="#93acc1" stroke-width="7" stroke-linecap="round"/><circle cx="72" cy="43" r="5" fill="#f0bd45"/><circle cx="62" cy="51" r="5" fill="#6babd0"/><circle cx="80" cy="53" r="5" fill="#d87588"/><circle cx="70" cy="62" r="5" fill="#75b47b"/><circle cx="43" cy="57" r="5" fill="#213849"/>',
      tools:'<path d="m30 15 8 2 7 43-13 2Z" fill="#6e8593"/><path d="m62 17 10 5-24 40-9-5Z" fill="#a7bcc1"/><path d="M59 11c-7 2-12 10-9 17l12 4 9-12-6-1-2-8Z" fill="#d6e0df"/><path d="M74 40 80 8l7 2-6 32Z" fill="#595e69"/><path d="M17 48h68v36H17Z" fill="#efb532"/><path d="M17 48h68v10H17Z" fill="#ffd260"/><path d="M41 43v-7h20v7" fill="none" stroke="#d08d23" stroke-width="5"/><rect x="44" y="56" width="15" height="10" rx="2" fill="#e19b24"/>'
    };
    return `<svg class="std-icon" viewBox="0 0 100 100" aria-hidden="true"><defs><filter id="${id}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="2" flood-color="#244331" flood-opacity=".18"/></filter></defs><g filter="url(#${id})">${shapes[kind] || shapes.palette}</g></svg>`;
  }
  const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
  const header = document.createElement('header');
  header.className = 'std-header standard-only';
  header.innerHTML = `<div class="std-topbar"><a class="std-brand" href="#" data-standard-category="Alla"><img src="./assets/fritidsparken-logo.jpg" alt="" width="38" height="38">Fritidsparken.se</a><a class="std-plugg" href="https://pluggparken.se/"><span aria-hidden="true">📖</span> Pluggparken.se</a><button class="std-menu-toggle" aria-expanded="false" aria-controls="stdNavigation" aria-label="Öppna huvudmenyn"><span></span><span></span><span></span></button><nav id="stdNavigation" aria-label="Huvudmeny">${[['Hem','Alla','⌂'],['Skapa','Skapa','✂'],['Pyssel','Pyssel','◉'],['Färglägga','Mandala','✎'],['Rörelse','Fritidsgympa','↗'],['Spel','Spel','⊞'],['Roliga verktyg','Roliga verktyg','⚒']].map(([label,cat,symbol])=>`<button type="button" data-standard-category="${cat}"><span aria-hidden="true">${symbol}</span>${label}</button>`).join('')}</nav><div class="std-controls"></div></div>`;
  document.body.prepend(header);
  const hero = document.createElement('section');
  hero.className = 'std-hero standard-only';
  hero.setAttribute('aria-labelledby','stdTitle');
  hero.innerHTML = `<img class="std-hero-image" src="./assets/standard/nature-hero.jpg" alt="Barn och en hund vid en trädkoja med utsikt över en svensk sjö" width="1536" height="1024" fetchpriority="high"><div class="std-hero-copy"><h1 id="stdTitle">Fritidsparken.se</h1><p>Aktiviteter, pyssel, spel och inspiration<br>för en rolig fritid!</p><form class="std-search" role="search"><label class="std-sr-only" for="standardSearch">Sök bland aktiviteter, spel och färgläggning</label><span class="std-search-leading">${searchIcon}</span><input type="search" id="standardSearch" placeholder="Sök aktivitet, pyssel, spel eller idé..." autocomplete="off"><button type="submit" aria-label="Sök">${searchIcon}</button></form></div>`;
  document.querySelector('main').before(hero);
  const home = document.createElement('div');
  home.id = 'standardHome';home.className = 'standard-only';
  document.querySelector('.hero').after(home);
  const categoryPanel = `<section class="std-categories" aria-label="Utforska kategorier">${categories.map(([label,cat,symbol],i)=>`<button type="button" data-standard-category="${cat}" style="--tile:${palettes[i]}">${icon(symbol)}<span>${label}</span></button>`).join('')}</section>`;
  const gameItems = [
    {id:'bike',title:'Stuntcykel – Staden',image:'stunt-bike-city-icon.svg',tag:'3D · Fysik & balans'},
    {id:'plane',title:'Flygpilot',image:'plane-pilot-icon.svg',tag:'3D · Flygäventyr'},
    {id:'four',title:'4 i rad',image:'four-in-row-icon.svg',tag:'Strategi · 1–2 spelare'}
  ];
  const photo = name => {const doc=new DOMParser().parseFromString(createPreview(name),'text/html');return doc.querySelector('img')?.getAttribute('src') || './assets/minifigurscen.jpg';};
  const activityCard = (title,label,src,action,kind='craft') => `<button type="button" class="std-activity-card" ${action}><img src="${esc(src)}" alt="${esc(title)}" loading="lazy" decoding="async"><span class="std-card-copy"><strong>${esc(title)}<span aria-hidden="true">›</span></strong><small class="std-label std-label-${kind}">${esc(label)}</small></span></button>`;
  const sectionHead = (title,cat,symbol) => `<div class="std-section-heading"><h2><span aria-hidden="true">${symbol}</span>${title}</h2><button type="button" data-standard-category="${cat}" ${cat==='Alla'?'data-standard-browse-all':''}>Visa alla <span aria-hidden="true">→</span></button></div>`;
  function coloringCard(m) {
    const reference = m.type === 'Bilar' ? m.img.replace('-preview.webp','-reference.webp') : m.type === 'Bakverk' ? m.img.replace('bakverk-uploads-20261020/','bakverk-coloring-20261024/').replace('.webp','-reference.webp') : '';
    return `<article class="mandala-card std-color-card" data-color-reference="${esc(reference)}"><button class="std-color-open" type="button" aria-label="Färglägg ${esc(m.title)} online"><img src="${esc(m.preview||m.img)}" alt="${esc(m.title)}" loading="lazy" decoding="async"></button><div class="mandala-info"><span class="mandala-label">${esc(m.type)}</span><h3>${esc(m.title)}</h3><div class="mandala-links"><a href="${esc(m.pdf||m.img)}" target="_blank" rel="noopener">Skriv ut</a></div></div></article>`;
  }
  function homeMarkup() {
    const obstacle=gymGames.find(g=>g.name==='Hinderbanan');
    const popular = [
      activityCard('Toarullefigurer','Pyssel',photo('Toarullefigurer'),'data-standard-activity="Toarullefigurer"'),
      activityCard('Pärlmönster','Pyssel',photo('Pärlmönster'),'data-standard-pearl'),
      activityCard('Rita steg för steg','Färglägga','./assets/standard/drawing-step-cover.jpg','data-standard-category="Rita steg-för-steg"','color'),
      activityCard('Hinderbana','Rörelse','./assets/'+obstacle.image,'data-standard-gym="'+esc(obstacle.name)+'"','move'),
      activityCard('Minifigurscen','Bygga',photo('Minifigurscen'),'data-standard-activity="Minifigurscen"','build'),
      activityCard('Stuntcykel – Staden','Spel','./assets/stunt-bike-city-icon.svg','data-standard-game="bike"','game')
    ].join('');
    // The catalogs have no publication timestamps. Use the last catalog entry
    // in each requested category rather than inventing recency metadata.
    const newColors=['Djur','Bilar','Bakverk','Vår','Sommar','Höst','Vinter'].map(type=>mandalas.filter(m=>m.type===type).at(-1)).filter(Boolean);
    return categoryPanel+`<section class="std-panel std-popular">${sectionHead('Populära aktiviteter','Alla','★')}<div class="std-popular-grid">${popular}</div></section><div class="std-discover"><section class="std-panel std-games">${sectionHead('Spela direkt i webbläsaren','Spel','🎮')}<div class="std-game-grid">${gameItems.map(g=>`<button type="button" class="std-game-card" data-standard-game="${g.id}"><span class="std-game-art"><img src="./assets/${g.image}?v=game-covers-20261025-1" alt="" loading="lazy"><span class="std-play" aria-hidden="true">▶</span></span><span class="std-game-copy"><small>${g.tag}</small><strong>${g.title}</strong><span>Spela nu →</span></span></button>`).join('')}</div><div class="std-games-note">En liten spelpaus. Ett nytt äventyr. Välj ditt spel!</div></section><section class="std-panel std-coloring">${sectionHead('Nya färgläggningsbilder','Mandala','🖌️')}<div class="std-color-grid">${newColors.map(coloringCard).join('')}</div></section></div><section class="std-inspiration"><div>${icon('bulb')}</div><div><h2>Vad vill ni hitta på idag?</h2><p>En stund att skapa, en lek tillsammans eller något nytt att prova.</p></div><button type="button" data-standard-category="Roliga verktyg">Hitta en idé <span aria-hidden="true">→</span></button></section>`;
  }
  home.innerHTML = homeMarkup();
  const results = document.createElement('div');results.className='std-results-heading standard-only';results.setAttribute('aria-live','polite');
  document.getElementById('catalog').before(results);
  const collections = {
    Bygga:['Pappersbroar','Små lerfigurer','Minifigurscen','Äggkartongens små världar'],
    Klurigt:['Robot och programmerare','Gissa föremålet','Vad har ändrats?','Min egen serie'],
    Lugnt:['Pärlmönster','Tidningscollage','Garnbokstäver','Mönsterstenar']
  };
  function renderCollection(name,q) {
    const entries=activities.filter(a=>collections[name].includes(a[2])&&a.join(' ').toLocaleLowerCase('sv').includes(q));
    let html=`<div class="std-collection-grid">${entries.map(a=>activityCard(a[2],name,photo(a[2]),`data-standard-activity="${esc(a[2])}"`)).join('')}</div>`;
    if(name==='Lugnt')html+=`<button class="std-tool-shortcut" data-standard-tool="calm">Lugn stund · Andning och återhämtning →</button>`;
    if(name==='Klurigt')html+=`<button class="std-tool-shortcut" data-standard-tool="challenge">Dagens utmaning →</button>`;
    document.getElementById('catalog').innerHTML=html;
  }
  function renderSearch(q) {
    const matches=value=>String(value).toLocaleLowerCase('sv').includes(q);
    const act=activities.filter(a=>matches(a.join(' ')));
    const gym=gymGames.filter(g=>matches(g.name+' '+g.description));
    const colors=mandalas.filter(m=>!['Halloween','Jul'].includes(m.type)&&!m.types?.some(t=>['Halloween','Jul'].includes(t))&&matches(m.title+' '+m.type));
    const drawings=drawingAnimals.filter(a=>!['spoke','pumpa','fladdermus'].includes(a.id)&&matches('Rita steg för steg '+a.name));
    const dolls=paperDolls.filter(m=>!matchesHoliday(m.title+' '+m.img)&&matches('Klippdockor '+m.title));
    const tools=funTools.filter(t=>matches('Roliga verktyg '+t.name+' '+t.desc));
    const count=act.length+gym.length+colors.length+drawings.length+dolls.length+tools.length;
    results.innerHTML=`<h2>${count} träffar för ”${esc(document.getElementById('search').value)}”</h2><button type="button" data-standard-category="Alla">Rensa sökning ×</button>`;
    const activityHtml=act.map(a=>activityCard(a[2],a[1],photo(a[2]),a[1]==='Spel'?`data-standard-game="${a[2]==='4 i rad'?'four':a[2].startsWith('Flygpilot')?'plane':'bike'}"`:a[2]==='Pärlmönster'?'data-standard-pearl':`data-standard-activity="${esc(a[2])}"`)).join('');
    const gymHtml=gym.map(g=>activityCard(g.name,'Rörelse','./assets/'+g.image,`data-standard-gym="${esc(g.name)}"`)).join('');
    const drawingHtml=drawings.map(a=>activityCard('Rita '+a.name,'Rita steg för steg','./assets/drawing-guides/'+(drawingGuideAsset[a.id]||a.id+'.png'),`data-standard-drawing="${esc(a.id)}"`)).join('');
    document.getElementById('catalog').innerHTML=count?`<div class="std-collection-grid">${activityHtml}${gymHtml}${drawingHtml}${dolls.map(m=>activityCard(m.title,'Klippdockor',m.img,'data-standard-category="Klippdockor"')).join('')}${tools.map(t=>activityCard(t.name,'Roliga verktyg','./assets/'+t.image,`data-standard-tool="${esc(t.key)}"`)).join('')}</div>${colors.length?'<h3 class="std-search-subtitle">Färgläggningsbilder</h3><div class="std-search-color-grid">'+colors.map(coloringCard).join('')+'</div>':''}`:'<p class="empty">Inga träffar ännu. Prova exempelvis katt, pärlor eller flygpilot.</p>';
  }
  const matchesHoliday=value=>/halloween|mini-jul|jultomte|julgran/i.test(value);
  function syncPresentation() {
    const standard=isStandard();document.body.classList.toggle('std-design',standard);
    const target=standard?header.querySelector('.std-controls'):legacyTop;
    for(const control of controls)if(control.parentNode!==target)target.append(control);
    if(!standard){home.hidden=true;results.hidden=true;document.body.classList.remove('std-home','std-browsing');}
    return standard;
  }
  drawFilters=function(){
    originalFilters();
    if(isStandard()){
      for(const name of Object.keys(collections))document.getElementById('filters').insertAdjacentHTML('beforeend',`<button class="filter ${category===name?'active':''}" data-cat="${name}">${name}</button>`);
    }
  };
  draw=function(){
    if(!syncPresentation()){originalDraw();return;}
    const q=document.getElementById('search').value.trim().toLocaleLowerCase('sv');
    const atHome=category==='Alla'&&!q&&!pearlPage&&!browseAll;
    document.body.classList.toggle('std-home',atHome);document.body.classList.toggle('std-browsing',!atHome);
    home.hidden=!atHome;results.hidden=atHome;
    header.querySelectorAll('[data-standard-category]').forEach(b=>{const active=b.dataset.standardCategory===category;b.classList.toggle('active',active);if(b.tagName==='BUTTON')b.setAttribute('aria-current',active?'page':'false');});
    document.getElementById('standardSearch').value=document.getElementById('search').value;
    if(atHome){window.FPGameHub?.stop();document.getElementById('catalog').innerHTML='';return;}
    results.innerHTML=`<h2>${esc(pearlPage?'Pärlmönster':category==='Mandala'?'Färglägga':category==='Fritidsgympa'?'Rörelse & Fritidsgympa':category==='Alla'?'Alla aktiviteter':category)}</h2><button type="button" data-standard-category="Alla">← Till startsidan</button>`;
    if(category==='Alla'&&q&&!pearlPage){window.FPGameHub?.stop();renderSearch(q);return;}
    if(collections[category]){window.FPGameHub?.stop();renderCollection(category,q);return;}
    originalDraw();
  };
  function navigate(cat,scroll=true){
    category=cat;pearlPage=false;selectedPearl=null;funTool=null;activeDrawing=null;browseAll=false;
    document.getElementById('search').value='';document.getElementById('standardSearch').value='';
    header.classList.remove('menu-open');header.querySelector('.std-menu-toggle').setAttribute('aria-expanded','false');
    drawFilters();draw();
    if(scroll)(cat==='Alla'?document.body:results).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  header.querySelector('.std-menu-toggle').addEventListener('click',e=>{const expanded=header.classList.toggle('menu-open');e.currentTarget.setAttribute('aria-expanded',String(expanded));});
  header.addEventListener('keydown',e=>{if(e.key==='Escape'){header.classList.remove('menu-open');header.querySelector('.std-menu-toggle').setAttribute('aria-expanded','false');header.querySelector('.std-menu-toggle').focus();}});
  const searchInput=document.getElementById('standardSearch');
  function search(){category='Alla';pearlPage=false;funTool=null;selectedPearl=null;browseAll=false;document.getElementById('search').value=searchInput.value;drawFilters();draw();}
  searchInput.addEventListener('input',search);
  hero.querySelector('form').addEventListener('submit',e=>{e.preventDefault();search();results.scrollIntoView({behavior:'smooth',block:'start'});});
  document.getElementById('search').addEventListener('input',()=>{if(isStandard()){searchInput.value=document.getElementById('search').value;draw();}});
  document.addEventListener('click',e=>{
    if(!isStandard())return;
    const nav=e.target.closest('[data-standard-category]');if(nav){e.preventDefault();navigate(nav.dataset.standardCategory,!nav.hasAttribute('data-standard-browse-all'));if(nav.hasAttribute('data-standard-browse-all')){browseAll=true;draw();results.scrollIntoView({behavior:'smooth'});}return;}
    const game=e.target.closest('[data-standard-game]');if(game){navigate('Spel',false);window.FPGameHub?.open(game.dataset.standardGame);return;}
    const activity=e.target.closest('[data-standard-activity]');if(activity){const title=activity.dataset.standardActivity;if(title==='Pärlmönster'){navigate('Pyssel',false);pearlPage=true;pearlLevel='Alla';draw();return;}if(title==='Klippdockor – färglägg och klipp ut'){navigate('Klippdockor');return;}const item=activities.find(a=>a[2]===title);if(item)open(item);return;}
    const gym=e.target.closest('[data-standard-gym]');if(gym){const g=gymGames.find(g=>g.name===gym.dataset.standardGym);if(g)open([g.emoji,'Fritidsgympa',g.name,g.description,g.minutes+' min',g.steps]);return;}
    if(e.target.closest('[data-standard-pearl]')){navigate('Pyssel',false);pearlPage=true;pearlLevel='Alla';draw();results.scrollIntoView({behavior:'smooth'});return;}
    const drawing=e.target.closest('[data-standard-drawing]');if(drawing){navigate('Rita steg-för-steg',false);activeDrawing=drawing.dataset.standardDrawing;drawingStep=1;drawNow();return;}
    const tool=e.target.closest('[data-standard-tool]');if(tool){navigate('Roliga verktyg',false);funTool=tool.dataset.standardTool;draw();return;}
    const color=e.target.closest('.std-color-open');if(color){const paint=color.closest('.mandala-card').querySelector('.fp-online-actions button');if(paint)paint.click();}
  });
  // Theme changes run through the existing draw() call. Attribute observation
  // also covers theme changes from extensions without watching catalog churn.
  new MutationObserver(()=>{if(document.body.classList.contains('std-design')!==isStandard()){drawFilters();draw();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
  drawFilters();draw();
})();
