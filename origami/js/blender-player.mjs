// Step clips rendered from the actual Blender project, loaded only on demand.
// Posters handle still frames and reduced motion without downloading a movie.
export class BlenderPlayer {
  constructor(container) {
    this.container=container;this.ticket=0;this.preloaded=new Map();
    this.image=container.querySelector('img');this.video=container.querySelector('video');
    this.status=container.querySelector('[role="status"]');
  }
  asset(model,type,index,ext) {
    return `${model.blender.base}${type}-${String(index).padStart(2,'0')}.${ext}`;
  }
  stop() {
    this.ticket++;this.isPaused=false;this.video.pause();this.video.onended=null;
    this.video.onloadedmetadata=null;this.video.ontimeupdate=null;this.video.onerror=null;this.video.oncanplay=null;this.status.textContent='';
  }
  showState(model,index) {
    this.stop();this.video.hidden=true;this.image.hidden=false;
    this.image.src=this.asset(model,'state',index,'webp');
    this.image.alt=`${model.name} i Blender 3D – ${index===0?'före första vikningen':`efter steg ${index}`}`;
  }
  play(model,index,speed,onDone,onError) {
    this.stop();const ticket=this.ticket,video=this.video;
    video.setAttribute('aria-label',`${model.name} – viksteg ${index} i Blender 3D`);
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
  preload(model) {
    const key=model.id;
    if(!this.preloaded.has(key))this.preloaded.set(key,fetch(`${model.blender.base}continuous.mp4?v=1`).then(r=>{if(!r.ok)throw Error('Film saknas');return r.blob();}).then(b=>URL.createObjectURL(b)).catch(e=>{this.preloaded.delete(key);throw e;}));
    return this.preloaded.get(key);
  }
  async playAll(model,index,speed,onStep,onDone,onError) {
    this.stop();const ticket=this.ticket,v=this.video;
    this.status.textContent='Laddar hela vikningen…';
    try {
      const url=await this.preload(model);if(ticket!==this.ticket)return;
      v.muted=true;v.playbackRate=speed;v.src=url;
      v.onloadedmetadata=()=>{if(ticket===this.ticket)v.currentTime=Math.max(0,index-1)*2;};
      v.oncanplay=()=>{if(ticket!==this.ticket)return;v.hidden=false;this.image.hidden=true;this.status.textContent='';};
      v.ontimeupdate=()=>{if(ticket===this.ticket)onStep(Math.min(model.steps.length,Math.floor(v.currentTime/2)+1));};
      v.onended=()=>{if(ticket===this.ticket)onDone();};v.onerror=()=>{if(ticket===this.ticket)onError();};
      await v.play();if(this.isPaused)v.pause();
    }catch(e){if(ticket===this.ticket&&e.name!=='AbortError')onError();}
  }
  pause(paused) {this.isPaused=paused;if(paused)this.video.pause();else this.video.play().catch(()=>{});}
  setSpeed(speed) {this.video.playbackRate=speed;}
}
