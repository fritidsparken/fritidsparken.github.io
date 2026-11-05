export function bindFullscreen(button, report){
  if(!button)return;
  const page=document.documentElement;
  const current=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const sync=()=>{
    button.setAttribute('aria-pressed',String(!!current()));
    button.title=current()?'Avsluta helskärm':'Helskärm';
    button.setAttribute('aria-label',button.title);
  };
  sync();
  document.addEventListener('fullscreenchange',sync);
  document.addEventListener('webkitfullscreenchange',sync);
  button.onclick=async()=>{
    try{
      if(current()) await (document.exitFullscreen||document.webkitExitFullscreen).call(document);
      else if(page.requestFullscreen||page.webkitRequestFullscreen) await (page.requestFullscreen||page.webkitRequestFullscreen).call(page);
      else report('På iPhone kan du öppna spelet från hemskärmen för en större spelyta.');
    }catch{report('Webbläsaren tillät inte helskärm. Öppna spelet i en egen flik.')}
  };
}
