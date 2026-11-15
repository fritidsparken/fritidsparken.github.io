// Step clips rendered from the actual Blender project, loaded only on demand.
// Posters handle still frames and reduced motion without downloading a movie.
export class BlenderPlayer {
  constructor(container) {
    this.container=container;this.ticket=0;
    this.image=container.querySelector('img');this.video=container.querySelector('video');
    this.status=container.querySelector('[role="status"]');
  }
  asset(model,type,index,ext) {
    return `${model.blender.base}${type}-${String(index).padStart(2,'0')}.${ext}`;
  }
  stop() {
    this.ticket++;this.video.pause();this.video.onended=null;
    this.video.onerror=null;this.video.oncanplay=null;this.status.textContent='';
  }
  showState(model,index) {
    this.stop();this.video.hidden=true;this.image.hidden=false;
    this.image.src=this.asset(model,'state',index,'webp');
  }
  play(model,index,speed,onDone,onError) {
    this.stop();const ticket=this.ticket,video=this.video;
    this.image.src=this.asset(model,'state',Math.max(0,index-1),'webp');
    this.image.hidden=false;video.hidden=true;this.status.textContent='Laddar 3D-vikningen…';
    video.muted=true;video.playbackRate=speed;
    video.poster=this.image.src;
    video.onerror=()=>{if(ticket===this.ticket)onError();};
    video.oncanplay=()=>{
      if(ticket!==this.ticket)return;
      video.hidden=false;this.image.hidden=true;this.status.textContent='';
    };
    video.onended=()=>{if(ticket===this.ticket)onDone();};
    video.src=this.asset(model,'step',index,'mp4');
    video.play().catch(error=>{if(error.name!=='AbortError'&&ticket===this.ticket)onError();});
  }
  pause(paused) {if(paused)this.video.pause();else this.video.play().catch(()=>{});}
  setSpeed(speed) {this.video.playbackRate=speed;}
}
