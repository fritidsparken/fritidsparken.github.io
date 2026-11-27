/* Shared active visitor time. Public client key; database tables stay private. */
(()=>{'use strict';
const url='https://bglrvlswqsuahqyytvny.supabase.co/rest/v1/rpc/',key='sb_publishable_6IU6ykRQuyEQ6KuVUFd6pg_RCE-83Gw';
let total=null,session=crypto.randomUUID(),timer=null,busy=false;try{const k='fp-time-session-'+Math.floor(Date.now()/86400000);session=localStorage.getItem(k)||session;localStorage.setItem(k,session);}catch{}const channel='fp-time-leader';
function mount() {
  const search = document.querySelector('.fp-visitor-tools .std-header-search');
  if (!search || document.getElementById('fpVisitorTime')) return;

  const el = document.createElement('div');
  el.id = 'fpVisitorTime';
  el.className = 'fp-visitor-time';
  el.title = 'Ungefärlig sammanlagd tid i synliga flikar, från att mätningen aktiverades.';
  el.innerHTML = '<span aria-hidden="true">◷</span><div><small>Tid tillsammans</small><strong></strong></div>';
  search.after(el);
  render();
}

function render() {
  const el = document.querySelector('#fpVisitorTime strong');
  if (!el) return;

  let value = '– dagar · – timmar';
  if (total !== null) {
    const totalHours = Math.floor(total / 3600);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    value = `${days.toLocaleString('sv-SE')} ${days === 1 ? 'dag' : 'dagar'} · ${hours} ${hours === 1 ? 'timme' : 'timmar'}`;
  }
  if (el.textContent !== value) el.textContent = value;
}
async function rpc(name,body={}){const r=await fetch(url+name,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Counter unavailable');const n=await r.json();if(typeof n!=='number'||!Number.isFinite(n)||n<0)throw Error('Invalid total');total=n;render();}
async function tick(){if(document.hidden||busy)return;busy=true;try{if(navigator.locks){await navigator.locks.request(channel,{ifAvailable:true},async lock=>{if(lock)await rpc('fp_tick',{p_session:session});});}else await rpc('fp_tick',{p_session:session});}catch{const el=document.getElementById('fpVisitorTime');if(el)el.title='Tidsmätaren är inte tillgänglig just nu.';}finally{busy=false;}}
function start(){clearInterval(timer);if(!document.hidden){tick();timer=setInterval(tick,30000);}}
document.addEventListener('visibilitychange',start);addEventListener('pageshow',start);addEventListener('pagehide',()=>clearInterval(timer));
new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();rpc('fp_read_time').catch(()=>{});start();
})();
