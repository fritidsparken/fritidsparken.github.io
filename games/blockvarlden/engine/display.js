export function bindFullscreen(button, report){

  const page=document.documentElement;
  const current=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const sync=()=>{
    if(!button)return;
    button.setAttribute('aria-pressed',String(!!current()));
    button.title=current()?'Avsluta helskärm':'Helskärm';
    button.setAttribute('aria-label',button.title);
  };
  sync();
  document.addEventListener('fullscreenchange',sync);
  document.addEventListener('webkitfullscreenchange',sync);
  async function enter(){
    if(current())return;
    try{
      if(page.requestFullscreen||page.webkitRequestFullscreen) await (page.requestFullscreen||page.webkitRequestFullscreen).call(page);
      else report('Webbläsaren saknar stöd för helskärm. På iPhone kan du öppna spelet från hemskärmen.');
    }catch{report('Webbläsaren tillät inte helskärm. Öppna spelet i en egen flik.')}
  }
  if(button)button.onclick=async()=>{
    if(!current())return enter();
    try{await (document.exitFullscreen||document.webkitExitFullscreen).call(document)}
    catch{report('Använd webbläsarens kontroll för att avsluta helskärm.')}
  };
  return enter;
}
