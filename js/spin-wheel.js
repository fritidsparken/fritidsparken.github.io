/* Local-only editable wheel; equal slices and a matching animated result. */
(() => {
 'use strict';
 const defaults=['Rita','Bygga','Dansstopp','Utelek','Pyssel','Läsa','Spela spel','Skattjakt','Julia och Axel'];
 const colors=['#f6ce70','#84cba5','#f0a5a9','#97c8e7','#c2abe0','#f3b57e','#b6d68c','#e9b8d0'];
 const key='fpSpinWheelChoices';let cancelPrevious=()=>{};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function read(text){const values=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(values.length<2)throw Error('Skriv minst två alternativ, ett per rad.');if(values.length>40)throw Error('Hjulet kan ha högst 40 alternativ.');if(values.some(s=>[...s].length>80))throw Error('Varje alternativ får vara högst 80 tecken.');return values;}
 function stored(){try{return read(JSON.parse(localStorage.getItem(key)).join('\n'));}catch{return defaults.slice();}}
 function save(values){try{localStorage.setItem(key,JSON.stringify(values));}catch{/* Still works when browser storage is unavailable. */}}
 function picture(values){
  const step=360/values.length,point=(a,r)=>[250+Math.cos(a*Math.PI/180)*r,250+Math.sin(a*Math.PI/180)*r];
  let body='';values.forEach((value,i)=>{const a=-90+i*step,b=a+step,[x1,y1]=point(a,237),[x2,y2]=point(b,237),mid=a+step/2,[x,y]=point(mid,164);const label=values.length>16?String(i+1):[...value].length>13?[...value].slice(0,12).join('')+'…':value;
   body+=`<path d="M250 250L${x1} ${y1}A237 237 0 ${step>180?1:0} 1 ${x2} ${y2}Z" fill="${colors[i%colors.length]}" stroke="#fff9ea" stroke-width="2"/><text x="${x}" y="${y}" transform="rotate(${mid+90} ${x} ${y})" text-anchor="middle" dominant-baseline="middle" fill="#173d2d" font-family="system-ui,sans-serif" font-size="${values.length>12?16:20}" font-weight="750">${esc(label)}</text>`;
  });
  return `<svg data-wheel-disk viewBox="0 0 500 500" role="img" aria-label="Snurrhjul med ${values.length} lika stora fält"><circle cx="250" cy="250" r="247" fill="#214d3a"/>${body}<circle cx="250" cy="250" r="42" fill="#fff8e5" stroke="#214d3a" stroke-width="7"/><path d="m250 226 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2z" fill="#bd8540"/></svg>`;
 }
 function pick(n){const data=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(data);}while(data[0]>=limit);return data[0]%n;}
 function page(){return `<section id="fpWheel" class="fun-panel fp-wheel" aria-labelledby="wheel-title"><header><span class="fun-icon" aria-hidden="true">🎡</span><h2 id="wheel-title">Snurrhjulet</h2><p>Spin the wheel! Skriv in namn, aktiviteter eller egna alternativ och låt hjulet välja.</p></header><div class="fp-wheel-layout"><div class="fp-wheel-play"><div class="fp-wheel-frame"><span class="fp-wheel-pointer" aria-hidden="true"></span><div data-wheel-picture></div></div><div class="fp-wheel-result" role="status" aria-live="polite" aria-atomic="true"><span data-wheel-caption>Vad väljer hjulet?</span><strong data-wheel-result></strong></div><button type="button" class="primary fp-wheel-spin" data-wheel-spin>Snurra hjulet</button></div><form class="fun-form fp-wheel-form" data-wheel-form><label for="wheel-choices">Dina alternativ – ett per rad</label><textarea id="wheel-choices" rows="8" maxlength="6000" spellcheck="false" aria-describedby="wheel-help wheel-error"></textarea><p id="wheel-help">2–40 alternativ. Varje rad har lika stor chans att väljas. Dina alternativ sparas i den här webbläsaren.</p><p data-wheel-numbers hidden>Numren på hjulet följer radordningen i listan.</p><p id="wheel-error" role="alert"></p><div class="fp-wheel-editor-actions"><button class="primary" type="submit">Uppdatera hjulet</button><button class="secondary" type="button" data-wheel-reset>Återställ exempel</button></div></form></div></section>`;}
 function mount(root){
  cancelPrevious();if(!root)return;let choices=stored(),rotation=0,busy=false,timer=null;
  const input=root.querySelector('textarea'),pictureRoot=root.querySelector('[data-wheel-picture]'),spin=root.querySelector('[data-wheel-spin]'),error=root.querySelector('#wheel-error'),result=root.querySelector('[data-wheel-result]'),caption=root.querySelector('[data-wheel-caption]');
  input.value=choices.join('\n');
  function draw(){pictureRoot.innerHTML=picture(choices);rotation=0;root.querySelector('[data-wheel-numbers]').hidden=choices.length<=16;result.textContent='';caption.textContent='Vad väljer hjulet?';}
  function update(force=true){try{const next=read(input.value),changed=JSON.stringify(next)!==JSON.stringify(choices);choices=next;error.textContent='';save(choices);if(force||changed)draw();return true;}catch(e){error.textContent=e.message;return false;}}
  function lock(value){busy=value;root.setAttribute('aria-busy',String(value));root.querySelectorAll('button,textarea').forEach(el=>el.disabled=value);spin.textContent=value?'Snurrar…':'Snurra hjulet';}
  function finish(index){if(!root.isConnected)return;lock(false);caption.textContent='Hjulet valde:';result.textContent=choices[index];}
  spin.addEventListener('click',()=>{
   if(busy||!update(false))return;const index=pick(choices.length),step=360/choices.length,target=(360-(index+.5)*step)%360;
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?0:10500;
   const disk=pictureRoot.querySelector('svg');rotation+=4320+((target-rotation%360+360)%360);lock(true);result.textContent='';caption.textContent='Hjulet snurrar…';
   // Commit the starting frame before applying the rotation.
   disk.getBoundingClientRect();disk.style.transition=duration?`transform ${duration}ms cubic-bezier(.15,.55,.25,1)`:'none';disk.style.transform=`rotate(${rotation}deg)`;
   if(reduced)finish(index);else timer=setTimeout(()=>finish(index),duration+80);
  });
  root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();if(!busy)update();});
  root.querySelector('[data-wheel-reset]').addEventListener('click',()=>{if(busy)return;input.value=defaults.join('\n');update();});
  cancelPrevious=()=>{clearTimeout(timer);};draw();
 }
 window.FPWheel=Object.freeze({page,mount});
})();
