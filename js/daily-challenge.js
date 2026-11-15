/* Dagens utmaning: framsteg lagras lokalt och uppdateras av spelens händelser. */
(() => {
  'use strict';
  const key = 'fp-daily-challenge-v1';
  const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Stockholm', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  const read = () => { try { const data = JSON.parse(localStorage.getItem(key) || '{}'); return data && typeof data === 'object' ? data : {}; } catch (_) { return {}; } };
  const dayNumber = d => Math.floor(Date.parse(d + 'T00:00:00Z') / 86400000);
  function tasks(date) {
    const n = dayNumber(date);
    const goals = [1, 2, 3], flies = [3, 5, 7], holes = [1, 2, 3];
    const f=flies[n%3], g=goals[Math.floor(n/3)%3], h=holes[Math.floor(n/9)%3];
    return [
      {id:'frog', event:'fly', target:f, icon:'🐸', game:'Grodhoppet', title:`Samla ${f} flugor`, url:'/games/grodhoppet/'},
      {id:'golf', event:'hole', target:h, icon:'⛳', game:'Minigolf', title:`Klara ${h} ${h===1?'hål':'hål'}`, url:'/games/minigolf/'},
      {id:'football', event:'goal', target:g, icon:'⚽', game:'Straffläggaren', title:`Gör ${g} ${g===1?'mål':'mål'}`, url:'/games/strafflaggaren/'}
    ];
  }
  function record(event) {
    const date=today(), task=tasks(date).find(t=>t.event===event); if(!task)return;
    const data=read(); data[date] ||= {}; const prev=Number(data[date][task.id])||0;
    if(prev>=task.target)return;
    data[date][task.id]=Math.min(task.target,prev+1);
    try { localStorage.setItem(key,JSON.stringify(data)); } catch (_) { return; }
    if(data[date][task.id]===task.target){
      const note=document.createElement('div'); note.className='fp-daily-toast'; note.setAttribute('role','status'); note.textContent='⭐ Dagens uppdrag klart!'; document.body.append(note); setTimeout(()=>note.remove(),3500);
    }
    window.dispatchEvent(new Event('fp-daily-update'));
  }
  window.FPDaily={record};
  const style=document.createElement('link');style.rel='stylesheet';style.href='/css/daily-challenge.css?v=label-3';document.head.append(style);
  const grid=document.querySelector('.std-categories');
  const rankingToggle=grid?.querySelector('[data-ranking-toggle]');
  if(!grid || !rankingToggle)return;
  const toggle=document.createElement('button');
  toggle.type='button'; toggle.className='fp-daily-toggle'; toggle.style.setProperty('--tile','#fff0cb');
  toggle.setAttribute('aria-controls','fp-daily-panel'); toggle.setAttribute('aria-expanded','false');
  toggle.innerHTML='<svg class="std-icon" data-icon="daily" viewBox="0 0 100 100" aria-hidden="true"><g class="std-icon-motion"><rect x="17" y="20" width="66" height="65" rx="12" fill="#efbd54"/><rect x="22" y="31" width="56" height="49" rx="7" fill="#fff7dc"/><path d="M18 33h64V26a8 8 0 0 0-8-8H26a8 8 0 0 0-8 8Z" fill="#ed8e53"/><path d="M35 13v14M65 13v14" stroke="#835643" stroke-width="6" stroke-linecap="round"/><path d="m50 38 5.4 10.9 12 1.8-8.7 8.5 2 12-10.7-5.7-10.7 5.7 2-12-8.7-8.5 12-1.8Z" fill="#efb329"/></g></svg><span class="fp-daily-label"><span>Dagens</span><span>utmaning</span></span>';
  rankingToggle.after(toggle);
  const section=document.createElement('section'); section.id='fp-daily-panel'; section.className='fp-daily'; section.hidden=true; section.setAttribute('aria-labelledby','fp-daily-title');
  grid.append(section);
  function position(){
    const width=Math.min(560,grid.clientWidth-16);
    const left=Math.max(8,Math.min(toggle.offsetLeft,grid.clientWidth-width-8));
    section.style.setProperty('--fp-daily-left',left+'px');
    section.style.setProperty('--fp-daily-top',(toggle.offsetTop+toggle.offsetHeight+6)+'px');
  }
  function show(open){section.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)position();}
  toggle.addEventListener('click',()=>{
    const open=section.hidden;
    if(open && !document.getElementById('fp-ranking')?.hidden)rankingToggle.click();
    show(open);
    if(open && matchMedia('(max-width: 1100px)').matches)requestAnimationFrame(()=>{
      const tile=toggle.getBoundingClientRect(),panel=section.getBoundingClientRect();
      if(panel.bottom>(window.visualViewport?.height||innerHeight)-8 || tile.top<0)toggle.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    });
  });
  rankingToggle.addEventListener('click',()=>show(false));
  window.addEventListener('resize',()=>{if(!section.hidden)position();});
  document.addEventListener('click',e=>{if(!section.hidden && !section.contains(e.target) && !toggle.contains(e.target))show(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && !section.hidden){show(false);toggle.focus();}});
  function render(){
    const date=today(), data=read(), current=data[date]||{}, list=tasks(date), done=list.filter(t=>(Number(current[t.id])||0)>=t.target).length;
    const totals=Object.keys(data).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).reduce((a,d)=>{ const all=tasks(d); const count=all.filter(t=>(Number((data[d]||{})[t.id])||0)>=t.target).length; a.stars+=count; if(count===3)a.trophies++; return a; },{stars:0,trophies:0});
    const pretty=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',weekday:'long',day:'numeric',month:'long'}).format(new Date());
    section.innerHTML=`<div class="fp-daily-head"><div><span class="fp-daily-kicker">🏆 ${pretty}</span><h2 id="fp-daily-title">Dagens utmaning</h2><p>Tre små uppdrag – hur många klarar du idag?</p></div><div class="fp-daily-progress" aria-label="${done} av 3 uppdrag klara"><strong>${done}<span> / 3</span></strong><small>uppdrag klara</small></div></div><div class="fp-daily-cards">${list.map(t=>{const count=Math.min(t.target,Number(current[t.id])||0), complete=count>=t.target; return `<a class="fp-daily-card ${complete?'is-done':''}" href="${t.url}"><span class="fp-daily-icon" aria-hidden="true">${t.icon}</span><span class="fp-daily-copy"><small>${t.game}</small><strong>${t.title}</strong><span>${complete?'⭐ Klart!':`${count} av ${t.target} · Spela →`}</span></span></a>`}).join('')}</div><p class="fp-daily-footer">${done===3?`🏆 Hurra! Alla uppdrag klara! Du har ${totals.stars} stjärnor och ${totals.trophies} pokaler.`:`⭐ ${totals.stars} stjärnor · 🏆 ${totals.trophies} pokaler · Nya uppdrag varje dag.`}</p>`;
  }
  render();window.addEventListener('pageshow',render);window.addEventListener('focus',render);window.addEventListener('storage',render); window.addEventListener('fp-daily-update',render);setInterval(render,60000);
})();


