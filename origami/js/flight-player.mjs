// Flight is explicitly opened by the visitor; the folding step stays untouched.
export class FlightPlayer {
  constructor(dialog) {
    this.dialog=dialog;this.video=dialog.querySelector('video');this.status=dialog.querySelector('[role="status"]');this.ticket=0;
    dialog.querySelector('#flight-close').onclick=()=>this.close();
    dialog.querySelector('#flight-return').onclick=()=>this.close();
    dialog.querySelector('#flight-replay').onclick=()=>this.play(true);
    dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});
  }
  open(model,opener) {
    this.opener=opener;this.ticket++;
    this.dialog.querySelector('#flight-title').textContent=model.name+' i luften';
    this.video.setAttribute('aria-label','Animerad flygtur med '+model.name);
    this.video.poster=model.flight.poster;this.video.src=model.flight.video;
    this.dialog.showModal();this.play();
  }
  play(restart=false) {
    const ticket=++this.ticket,video=this.video;this.status.textContent='Laddar flygturen…';
    video.onplaying=()=>{if(ticket===this.ticket)this.status.textContent='';};
    video.onended=()=>{if(ticket===this.ticket)this.status.textContent='Flygturen är klar. Flyg igen eller fortsätt vika.';};
    video.onerror=()=>{if(ticket===this.ticket)this.status.textContent='Filmen kunde inte laddas. Tryck på Flyg igen för att försöka igen.';};
    if(restart){if(video.error)video.load();else video.currentTime=0;}
    video.muted=true;video.playbackRate=1;
    video.play().catch(error=>{if(ticket===this.ticket&&error.name!=='AbortError')this.status.textContent='Tryck på uppspelningsknappen i filmen för att starta.';});
  }
  close() {
    this.ticket++;this.video.pause();this.video.onplaying=null;this.video.onended=null;this.video.onerror=null;
    this.dialog.close();this.opener?.focus();
  }
}
