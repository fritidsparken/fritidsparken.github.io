/* Christmas-only advent experience. HTTP Date is a best-effort trusted clock,
   not access control: static assets remain public and client code is editable. */
(() => {
  'use strict';
  const rules=window.FPAdventRules, days=window.FPAdventDays;
  if(!rules||days?.length!==24)return;
  const key='fpAdventProgress', maxClockAge=10*60*1000;
  let openingId=0,previewOpened=[];
  let openingMotion=true;
  const isPreview=()=>window.FPChristmasPreview===true;
  const availableDoors=timestamp=>isPreview()?24:timestamp===null?0:rules.available(timestamp);
  let clock=null, syncing=null, opened=[],year=null,lastDate='',returnFocus=null,revealTimer=null,storageWarning=false;
  const isChristmas=()=>document.body.classList.contains('christmas')&&!document.body.classList.contains('halloween');
  const section=document.createElement('section');
  section.id='julkalender';section.className='advent';section.hidden=true;
  section.setAttribute('aria-labelledby','advent-title');
  section.innerHTML=`<div class="advent-snow" aria-hidden="true"></div><header class="advent-heading"><span class="advent-kicker">24 små stunder av julmagi</span><h2 id="advent-title">🎄 Fritidsparkens magiska julkalender</h2><p>En ny lucka varje dag fram till julafton!</p><div class="advent-meta"><span data-count>0 av 24 luckor öppnade</span><span data-countdown></span></div></header><p class="advent-clock" data-clock role="status">Kontrollerar dagens datum…</p><button class="advent-retry advent-preview" type="button">Lås upp alla luckor med kod</button><button class="advent-retry advent-motion-toggle" type="button" aria-pressed="true">Öppningsanimation: på</button><div class="advent-grid" aria-label="Luckor 1 till 24 december"></div><p class="advent-notice" aria-live="polite" aria-atomic="true"></p><button class="advent-retry" type="button" hidden>Kontrollera datum igen</button>`;
  document.querySelector('.hero')?.after(section);
  const todayShortcut=document.createElement('button');todayShortcut.id='advent-today-shortcut';todayShortcut.className='advent-today-shortcut';todayShortcut.type='button';todayShortcut.hidden=true;section.before(todayShortcut);
  todayShortcut.addEventListener('click',()=>openDoor(Number(todayShortcut.dataset.day)));
  const grid=section.querySelector('.advent-grid'),notice=section.querySelector('.advent-notice');
  const ornaments=['❄','✧','🎄','✶','🎁','❄','✦','☃'];
  for(const entry of days){
    const button=document.createElement('button');button.type='button';button.className='advent-door';button.dataset.day=entry.day;
    button.setAttribute('aria-label',`${entry.day} december, låst`);button.setAttribute('aria-disabled','true');
    button.innerHTML=`<span class="advent-door-inner"><span class="advent-ornament" aria-hidden="true">${ornaments[(entry.day-1)%ornaments.length]}</span><span class="advent-number">${entry.day}</span><span class="advent-door-status">Låst</span><span class="advent-today-star" aria-hidden="true">✦</span></span>`;
    grid.append(button);
  }
  const noticeDialog=document.createElement('dialog');noticeDialog.className='advent-dialog advent-status-dialog';noticeDialog.innerHTML='<article class="advent-popup"><button type="button" class="advent-close" aria-label="Stäng">×</button><h2>Julkalendern</h2><p class="advent-status-message" role="status"></p><button type="button" class="advent-status-close">Stäng</button></article>';document.body.append(noticeDialog);
  const showNotice=message=>{if(!isChristmas())return;noticeDialog.querySelector('.advent-status-message').textContent=message;if(!noticeDialog.open)noticeDialog.showModal();noticeDialog.querySelector('.advent-status-close').focus();};
  noticeDialog.querySelectorAll('.advent-close,.advent-status-close').forEach(b=>b.addEventListener('click',()=>{noticeDialog.close();todayShortcut.focus();}));
  const dialog=document.createElement('dialog');dialog.className='advent-dialog';dialog.classList.toggle('advent-motion-enabled',openingMotion);dialog.setAttribute('aria-labelledby','advent-date');
  dialog.innerHTML=`<article class="advent-popup"><div class="advent-snow" aria-hidden="true"></div><button type="button" class="advent-close" aria-label="Stäng luckan">×</button><h2 id="advent-date"></h2><div class="advent-stage-space"><div class="advent-stage"><div class="advent-light" aria-hidden="true"></div><div class="advent-picture-frame"><div class="advent-animal"><img width="800" height="800" alt="" decoding="async"></div></div><div class="advent-hinge" aria-hidden="true"><span>✦</span><b></b><small>Lite julmagi väntar…</small></div><div class="advent-particles" aria-hidden="true"></div></div></div><div class="advent-copy"><p class="advent-message"></p><p class="advent-answer" id="advent-answer" hidden aria-live="polite"></p><p class="advent-finale" hidden>En riktigt god jul från oss på Fritidsparken! ✨</p><div class="advent-popup-actions"><button type="button" class="advent-show-answer" aria-controls="advent-answer" aria-expanded="false" disabled>Visa svaret</button><button type="button" class="advent-shut">Stäng luckan</button></div></div></article>`;
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
    if(!isChristmas()){todayShortcut.hidden=true;if(noticeDialog.open)noticeDialog.close();close();return;}
    const timestamp=now(),verified=timestamp!==null;
    section.querySelector('.advent-retry:not(.advent-preview):not(.advent-motion-toggle)').hidden=verified||isPreview();
    section.querySelector('.advent-preview').textContent=isPreview()?'Avsluta förhandsvisning':'Lås upp alla luckor med kod';
    section.querySelector('[data-clock]').textContent=isPreview()?'Förhandsvisning · alla 24 luckor är upplåsta':verified?'Datum kontrollerat · svensk tid':'Vi behöver kontrollera dagens datum innan luckorna kan öppnas. Anslut till internet och försök igen.';
    if(verified)progress(timestamp);
    const available=availableDoors(timestamp),activeOpened=isPreview()?previewOpened:opened,p=verified?rules.dateParts(timestamp):null;
    todayShortcut.hidden=false;
    const bannerDay=p?.month===12?Math.min(24,Math.max(1,p.day)):1;
    const bannerAvailable=available>=bannerDay;
    todayShortcut.dataset.day=String(bannerDay);
    todayShortcut.setAttribute('aria-label',`Julkalendern, lucka ${bannerDay} december, ${bannerAvailable?'öppna':'låst'}`);
    todayShortcut.setAttribute('aria-disabled',String(!bannerAvailable));
    todayShortcut.innerHTML=`<span class="advent-banner-caption">Julkalendern</span><span class="advent-banner-door"><span aria-hidden="true">✦</span><strong>${bannerDay}</strong><small>december</small></span><span class="advent-banner-status">${bannerAvailable?'Öppna luckan':verified?'Öppnas 1 december':'Kontrollerar datum…'}</span>`;
    const date=p?`${p.year}-${p.month}-${p.day}`:'';
    if(lastDate&&lastDate!==date)close();lastDate=date;
    for(const button of grid.children){
      const day=Number(button.dataset.day),unlocked=day<=available,today=p?.month===12&&day===p.day,seen=activeOpened.includes(day)&&unlocked;
      button.classList.toggle('is-opened',seen);button.classList.toggle('is-today',today);button.classList.toggle('is-locked',!unlocked);
      button.classList.toggle('is-past-opened',seen&&p?.month===12&&day<p.day);
      button.setAttribute('aria-disabled',String(!unlocked));
      button.setAttribute('aria-label',`${day} december, ${seen?'öppnad':unlocked?'öppna luckan':'låst'}${today?', dagens lucka':''}`);
      button.querySelector('.advent-door-status').textContent=seen?'Öppnad ✓':today?'Idag':unlocked?'Öppna':'Låst';
    }
    section.querySelector('[data-count]').textContent=`${activeOpened.filter(d=>d<=available).length} av 24 luckor öppnade`;
    section.querySelector('[data-countdown]').textContent=verified?(p.month===12&&p.day===24?'Idag är det julafton! ✨':`${rules.daysLeft(timestamp)} dagar kvar till julafton`):'';
  }
  function close(){
    openingId++;clearTimeout(revealTimer);dialog.classList.remove('is-opening','is-revealed','is-finale');
    if(dialog.open){dialog.close();if(returnFocus?.isConnected&&isChristmas())returnFocus.focus();}
    if(document.body.classList.contains('advent-modal-open'))document.body.classList.remove('advent-modal-open');
  }
  async function openDoor(button){
    if(!isChristmas()||dialog.open)return;
    const day=typeof button==='number'?button:Number(button.dataset.day);
    if(!Number.isInteger(day)||day<1||day>days.length)return;
    if(!isPreview()&&now()===null){todayShortcut.querySelector('.advent-banner-status').textContent='Kontrollerar datum…';await syncClock();}
    if(!isChristmas())return;
    const timestamp=now();
    if(!isPreview()&&timestamp===null){notice.textContent='Vi kunde inte kontrollera datumet. Försök igen när du är ansluten till internet.';showNotice(notice.textContent);return;}
    if(timestamp!==null)progress(timestamp);
    if(day>availableDoors(timestamp)){notice.textContent=`Ho ho ho! Den här luckan öppnas först den ${day} december! 🎅`;showNotice(notice.textContent);return;}
    const requestId=++openingId;
    notice.textContent='';returnFocus=todayShortcut;
    const entry=days[day-1];image.src=entry.image;image.alt=entry.animal;
    dialog.querySelector('#advent-date').textContent=`${day} december`;
    const separator=entry.message.indexOf(' – ');
    dialog.querySelector('.advent-message').textContent=separator>=0?entry.message.slice(0,separator):entry.message;
    dialog.querySelector('.advent-answer').textContent=separator>=0?entry.message.slice(separator+3):'';
    dialog.querySelector('.advent-answer').hidden=true;
    const answerButton=dialog.querySelector('.advent-show-answer');
    answerButton.hidden=separator<0;answerButton.disabled=true;
    answerButton.textContent='Visa svaret';answerButton.setAttribute('aria-expanded','false');
    dialog.querySelector('.advent-hinge b').textContent=day;
    dialog.querySelector('.advent-finale').hidden=day!==24;
    dialog.classList.toggle('is-finale',day===24);
    dialog.showModal();document.body.classList.add('advent-modal-open');dialog.querySelector('.advent-close').focus();
    // Start after the image is ready, with a bounded wait on slow connections.
    await Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,2500))]);
    if(requestId!==openingId||!dialog.open||!isChristmas())return;
    dialog.classList.add('is-opening');
    revealTimer=setTimeout(()=>{
      if(!dialog.open||!isChristmas()||day>availableDoors(now())){close();return;}
      dialog.classList.add('is-revealed');
      dialog.querySelector('.advent-show-answer').disabled=false;
      if(isPreview()){if(!previewOpened.includes(day))previewOpened.push(day);}
      else if(!opened.includes(day)){opened.push(day);save();}render();
      if(storageWarning)notice.textContent='Webbläsaren kunde inte spara luckorna. De finns kvar så länge sidan är öppen.';
    },openingMotion?3600:50);
  }
  dialog.querySelector('.advent-show-answer').addEventListener('click',()=>{
    if(!dialog.classList.contains('is-revealed'))return;
    const answer=dialog.querySelector('.advent-answer'),button=dialog.querySelector('.advent-show-answer');
    answer.hidden=!answer.hidden;button.setAttribute('aria-expanded',String(!answer.hidden));
    button.textContent=answer.hidden?'Visa svaret':'Dölj svaret';
  });
  const motionButton=section.querySelector('.advent-motion-toggle');
  function updateMotion(){
    motionButton.textContent='Öppningsanimation: '+(openingMotion?'på':'av');
    motionButton.setAttribute('aria-pressed',String(openingMotion));
    dialog.classList.toggle('advent-motion-enabled',openingMotion);
  }
  motionButton.addEventListener('click',()=>{
    openingMotion=!openingMotion;try{localStorage.setItem('fpAdventOpeningMotion',openingMotion?'on':'off');}catch{}
    updateMotion();
  });
  updateMotion();
  grid.addEventListener('click',e=>{const button=e.target.closest('.advent-door');if(button)openDoor(button);});
  section.querySelector('.advent-retry:not(.advent-preview)').addEventListener('click',syncClock);
  section.querySelector('.advent-preview').addEventListener('click',()=>{
    if(isPreview()){window.FPChristmasPreview=false;try{sessionStorage.removeItem('fpChristmasPreview');}catch{}close();render();if(now()===null)syncClock();}
    else window.dispatchEvent(new Event('fp:advent-preview-request'));
  });
  window.addEventListener('fp:christmas-preview',()=>{previewOpened=[];close();render();});
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
