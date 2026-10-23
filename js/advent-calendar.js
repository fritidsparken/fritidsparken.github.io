/* Christmas-only advent experience. HTTP Date is a best-effort trusted clock,
   not access control: static assets remain public and client code is editable. */
(() => {
  'use strict';
  const rules=window.FPAdventRules, days=window.FPAdventDays;
  if(!rules||days?.length!==24)return;
  const key='fpAdventProgress', maxClockAge=10*60*1000;
  let openingId=0;
  let clock=null, syncing=null, opened=[],year=null,lastDate='',returnFocus=null,revealTimer=null,storageWarning=false;
  const isChristmas=()=>document.body.classList.contains('christmas')&&!document.body.classList.contains('halloween');
  const section=document.createElement('section');
  section.id='julkalender';section.className='advent';section.hidden=true;
  section.setAttribute('aria-labelledby','advent-title');
  section.innerHTML=`<div class="advent-snow" aria-hidden="true"></div><header class="advent-heading"><span class="advent-kicker">24 små stunder av julmagi</span><h2 id="advent-title">🎄 Fritidsparkens magiska julkalender</h2><p>En ny lucka varje dag fram till julafton!</p><div class="advent-meta"><span data-count>0 av 24 luckor öppnade</span><span data-countdown></span></div></header><p class="advent-clock" data-clock role="status">Kontrollerar dagens datum…</p><div class="advent-grid" aria-label="Luckor 1 till 24 december"></div><p class="advent-notice" aria-live="polite" aria-atomic="true"></p><button class="advent-retry" type="button" hidden>Kontrollera datum igen</button>`;
  document.querySelector('.hero')?.after(section);
  const grid=section.querySelector('.advent-grid'),notice=section.querySelector('.advent-notice');
  const ornaments=['❄','✧','🎄','✶','🎁','❄','✦','☃'];
  for(const entry of days){
    const button=document.createElement('button');button.type='button';button.className='advent-door';button.dataset.day=entry.day;
    button.setAttribute('aria-label',`${entry.day} december, låst`);button.setAttribute('aria-disabled','true');
    button.innerHTML=`<span class="advent-door-inner"><span class="advent-ornament" aria-hidden="true">${ornaments[(entry.day-1)%ornaments.length]}</span><span class="advent-number">${entry.day}</span><span class="advent-door-status">Låst</span><span class="advent-today-star" aria-hidden="true">✦</span></span>`;
    grid.append(button);
  }
  const dialog=document.createElement('dialog');dialog.className='advent-dialog';dialog.setAttribute('aria-labelledby','advent-date');
  dialog.innerHTML=`<article class="advent-popup"><div class="advent-snow" aria-hidden="true"></div><button type="button" class="advent-close" aria-label="Stäng luckan">×</button><h2 id="advent-date"></h2><div class="advent-stage"><div class="advent-light" aria-hidden="true"></div><div class="advent-animal"><img width="800" height="800" alt="" decoding="async"></div><div class="advent-hinge" aria-hidden="true"><span>✦</span><b></b><small>Lite julmagi väntar…</small></div><div class="advent-particles" aria-hidden="true"></div></div><p class="advent-message"></p><p class="advent-finale" hidden>En riktigt god jul från oss på Fritidsparken! ✨</p><button type="button" class="advent-shut">Stäng luckan</button></article>`;
  document.body.append(dialog);
  const image=dialog.querySelector('img'),particles=dialog.querySelector('.advent-particles');
  for(let i=0;i<56;i++){const p=document.createElement('i');p.textContent=i%3?'✦':'❄';p.style.cssText=`--x:${(i*37)%100}%;--delay:${(i%7)*.12}s;--drift:${(i%2?1:-1)*(20+i%40)}px;--size:${9+i%10}px`;particles.append(p);}
  function now(){return clock&&performance.now()-clock.at<maxClockAge?clock.time+performance.now()-clock.at:null;}
  function progress(timestamp){
    const y=rules.dateParts(timestamp).year;
    if(year===y)return;
    year=y;try{opened=rules.readProgress(localStorage.getItem(key),year);}catch{opened=[];storageWarning=true;}
    save();
  }
  function save(){try{localStorage.setItem(key,JSON.stringify({year,days:opened}));}catch{storageWarning=true;}}
  async function syncClock(){
    if(syncing)return syncing;
    syncing=(async()=>{
      const started=performance.now();
      try{
        // Same-origin HTTPS response: readable Date header, no third-party tracking.
        // Cache busting plus no-store avoids reusing an old CDN/browser response.
        const response=await fetch(`./index.html?advent-clock=${crypto.randomUUID()}`,{method:'HEAD',cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});
        const time=Date.parse(response.headers.get('Date'));
        if(!response.ok||!Number.isFinite(time))throw new Error('No server clock');
        clock={time:time+(performance.now()-started)/2,at:performance.now()};
      }catch{ /* Never fall back to the device date to unlock a door. */ }
      finally{syncing=null;render();}
    })();return syncing;
  }
  function render(){
    section.hidden=!isChristmas();
    if(!isChristmas()){close();return;}
    const timestamp=now(),verified=timestamp!==null;
    section.querySelector('.advent-retry').hidden=verified;
    section.querySelector('[data-clock]').textContent=verified?'Datum kontrollerat · svensk tid':'Vi behöver kontrollera dagens datum innan luckorna kan öppnas. Anslut till internet och försök igen.';
    if(verified)progress(timestamp);
    const available=verified?rules.available(timestamp):0,p=verified?rules.dateParts(timestamp):null;
    const date=p?`${p.year}-${p.month}-${p.day}`:'';
    if(lastDate&&lastDate!==date)close();lastDate=date;
    for(const button of grid.children){
      const day=Number(button.dataset.day),unlocked=day<=available,today=p?.month===12&&day===p.day,seen=opened.includes(day)&&unlocked;
      button.classList.toggle('is-opened',seen);button.classList.toggle('is-today',today);button.classList.toggle('is-locked',!unlocked);
      button.setAttribute('aria-disabled',String(!unlocked));
      button.setAttribute('aria-label',`${day} december, ${seen?'öppnad':unlocked?'öppna luckan':'låst'}${today?', dagens lucka':''}`);
      button.querySelector('.advent-door-status').textContent=seen?'Öppnad ✓':today?'Idag':unlocked?'Öppna':'Låst';
    }
    section.querySelector('[data-count]').textContent=`${opened.filter(d=>d<=available).length} av 24 luckor öppnade`;
    section.querySelector('[data-countdown]').textContent=verified?(p.month===12&&p.day===24?'Idag är det julafton! ✨':`${rules.daysLeft(timestamp)} dagar kvar till julafton`):'';
  }
  function close(){
    openingId++;clearTimeout(revealTimer);dialog.classList.remove('is-opening','is-revealed','is-finale');
    if(dialog.open){dialog.close();if(returnFocus?.isConnected&&isChristmas())returnFocus.focus();}
    if(document.body.classList.contains('advent-modal-open'))document.body.classList.remove('advent-modal-open');
  }
  async function openDoor(button){
    if(!isChristmas()||dialog.open)return;
    const day=Number(button.dataset.day);
    if(now()===null)await syncClock();
    if(!isChristmas())return;
    const timestamp=now();
    if(timestamp===null){notice.textContent='Vi kunde inte kontrollera datumet. Försök igen när du är ansluten till internet.';return;}
    progress(timestamp);
    if(day>rules.available(timestamp)){notice.textContent=`Ho ho ho! Den här luckan öppnas först den ${day} december! 🎅`;return;}
    const requestId=++openingId;
    notice.textContent='';returnFocus=button;
    const entry=days[day-1];image.src=entry.image;image.alt=entry.animal;
    dialog.querySelector('#advent-date').textContent=`${day} december`;
    dialog.querySelector('.advent-message').textContent=entry.message;
    dialog.querySelector('.advent-hinge b').textContent=day;
    dialog.querySelector('.advent-finale').hidden=day!==24;
    dialog.classList.toggle('is-finale',day===24);
    dialog.showModal();document.body.classList.add('advent-modal-open');dialog.querySelector('.advent-close').focus();
    // Start after the image is ready, with a bounded wait on slow connections.
    await Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,2500))]);
    if(requestId!==openingId||!dialog.open||!isChristmas())return;
    dialog.classList.add('is-opening');
    revealTimer=setTimeout(()=>{
      if(!dialog.open||!isChristmas()||now()===null||day>rules.available(now())){close();return;}
      dialog.classList.add('is-revealed');
      if(!opened.includes(day)){opened.push(day);save();}render();
      if(storageWarning)notice.textContent='Webbläsaren kunde inte spara luckorna. De finns kvar så länge sidan är öppen.';
    },matchMedia('(prefers-reduced-motion: reduce)').matches?50:3600);
  }
  grid.addEventListener('click',e=>{const button=e.target.closest('.advent-door');if(button)openDoor(button);});
  section.querySelector('.advent-retry').addEventListener('click',syncClock);
  dialog.querySelectorAll('.advent-close,.advent-shut').forEach(b=>b.addEventListener('click',close));
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
  image.addEventListener('error',()=>{image.alt='Djurbilden kunde inte laddas. Stäng luckan och försök igen.';});
  new MutationObserver(()=>{render();if(isChristmas()&&now()===null)syncClock();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('storage',e=>{if(e.key===key){year=null;render();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isChristmas())syncClock();});
  window.addEventListener('pagehide',close);
  setInterval(()=>{if(isChristmas()){render();if(!clock||performance.now()-clock.at>5*60*1000)syncClock();}},30000);
  render();if(isChristmas())syncClock();
})();
