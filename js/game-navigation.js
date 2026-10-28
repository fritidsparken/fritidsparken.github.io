/* Shared, always visible return route for every game. */
(()=>{
'use strict';
const destination='/?view=games';
function go(){try{window.top.location.assign(destination);}catch(e){location.assign(destination);}}
function mount(){
 if(document.getElementById('fp-game-menu-back'))return;
 const button=document.createElement('button');button.id='fp-game-menu-back';button.type='button';
 button.textContent='← Spelmenyn';button.setAttribute('aria-label','Tillbaka till spelmenyn på Fritidsparken.se');
 Object.assign(button.style,{position:'fixed',top:'max(8px, env(safe-area-inset-top))',left:'50%',transform:'translateX(-50%)',zIndex:'2147483647',minHeight:'44px',padding:'10px 16px',border:'2px solid #ffffff',borderRadius:'14px',background:'#fffbed',color:'#125466',font:'bold 14px system-ui,sans-serif',boxShadow:'0 3px 12px #0003',cursor:'pointer',touchAction:'manipulation'});
 button.addEventListener('click',go);document.body.appendChild(button);
}
function remove(){document.getElementById('fp-game-menu-back')?.remove();}
window.FPGameNavigation={mount,remove,go};
function ready(){
 if(location.pathname.includes('/games/')){
 if(window.top===window)mount();
 document.addEventListener('click',e=>{if(e.target.closest('#exit,#errorExit,[data-action="exit"]')){e.preventDefault();e.stopImmediatePropagation();go();}},true);
 }else if(new URLSearchParams(location.search).get('view')==='games'){
 const filter=document.querySelector('#filters [data-cat="Spel"]');
 if(filter){filter.click();document.querySelector('.games-heading')?.scrollIntoView({block:'start'});}
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
