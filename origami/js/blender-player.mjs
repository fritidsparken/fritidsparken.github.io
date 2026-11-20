// Blender renders with a poster until playback actually starts.
// A failed or stalled movie hands control back to the animated SVG guide.
export class BlenderPlayer {
  constructor(container) {
    this.container=container;this.ticket=0;this.preloaded=new Map();
    this.image=container.querySelector('img');this.video=container.querySelector('video');
    this.status=container.querySelector('[role="status"]');
    this.watchdog=0;this.resumePlayback=null;
  }
  asset(model,type,index,ext) {
    return `${model.blender.base}${type}-${String(index).padStart(2,'0')}.${ext}`;
  }
  stop() {
    this.ticket++;this.isPaused=false;clearTimeout(this.watchdog);this.resumePlayback=null;
    for(const event of ['ended','loadedmetadata','timeupdate','error','canplay','playing','waiting','stalled'])
      this.video['on'+event]=null;
    this.video.pause();this.status.textContent='';
  }
  showState(model,index) {
    this.stop();this.video.hidden=true;this.image.hidden=false;
    this.image.src=this.asset(model,'state',index,'webp');
    this.image.alt=`${model.name} i Blender 3D – ${index===0?'före första vikningen':`efter steg ${index}`}`;
  }
  prepare(model,index,speed,onDone,onError) {
    this.stop();
    const ticket=this.ticket,v=this.video;
    this.image.src=this.asset(model,'state',Math.max(0,index-1),'webp');
    this.image.hidden=false;v.hidden=false;
    // Keep the video in layout while loading (including Safari's inline playback).
    // The poster covers it until the first playable frame.
    v.poster=this.image.src;v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='auto';
    v.setAttribute('playsinline','');v.setAttribute('muted','');
    v.setAttribute('aria-label',`${model.name} – viksteg ${index} i Blender 3D`);
    v.defaultPlaybackRate=speed;v.playbackRate=speed;
    const active=()=>ticket===this.ticket;
    const fail=()=>{if(!active())return;this.stop();v.hidden=true;this.image.hidden=false;onError();};
    const arm=()=>{
      clearTimeout(this.watchdog);
      if(!active()||this.isPaused)return;
      this.watchdog=setTimeout(()=>{
        if(document.hidden){arm();return;}
        fail();
      },12000);
    };
    const reveal=()=>{
      if(!active())return;
      this.image.hidden=true;this.status.textContent='';arm();
      if(this.isPaused)v.pause();
    };
    const start=()=>{
      if(!active())return;
      this.resumePlayback=start;
      arm();
      try{Promise.resolve(v.play()).catch(()=>{if(active()&&!this.isPaused)fail();});}
      catch(error){fail();}
    };
    v.onplaying=reveal;
    v.ontimeupdate=()=>{if(active()&&!v.seeking&&v.currentTime>0)reveal();};
    v.onwaiting=arm;v.onstalled=arm;v.onerror=fail;
    v.onended=()=>{if(active()){this.stop();onDone();}};
    this.resumePlayback=arm;arm();
    return {active,fail,start,arm,reveal};
  }
  play(model,index,speed,onDone,onError) {
    const run=this.prepare(model,index,speed,onDone,onError);
    this.status.textContent='Laddar 3D-vikningen…';
    this.video.src=this.asset(model,'step',index,'mp4');
    this.video.load();run.start();
  }
  preload(model) {
    const key=model.id;
    if(!this.preloaded.has(key))this.preloaded.set(key,fetch(`${model.blender.base}continuous.mp4?v=1`).then(r=>{if(!r.ok)throw Error('Film saknas');return r.blob();}).then(b=>URL.createObjectURL(b)).catch(e=>{this.preloaded.delete(key);throw e;}));
    return this.preloaded.get(key);
  }
  async playAll(model,index,speed,onStep,onDone,onError) {
    const run=this.prepare(model,index,speed,onDone,onError),v=this.video;
    this.status.textContent='Laddar hela vikningen…';
    try {
      const url=await this.preload(model);if(!run.active())return;
      const secondsPerStep=model.blender.frames/model.blender.fps;
      v.onloadedmetadata=()=>{
        if(!run.active())return;
        v.currentTime=Math.max(0,index-1)*secondsPerStep;
        this.resumePlayback=run.start;
        if(!this.isPaused)run.start();
      };
      v.ontimeupdate=()=>{
        if(!run.active()||v.seeking)return;
        if(v.currentTime>0)run.reveal();
        onStep(Math.min(model.steps.length,Math.floor(v.currentTime/secondsPerStep)+1));
      };
      v.src=url;v.load();
    }catch(error){run.fail();}
  }
  pause(paused) {
    this.isPaused=paused;
    if(paused){clearTimeout(this.watchdog);this.video.pause();}
    else this.resumePlayback?.();
  }
  setSpeed(speed) {this.video.defaultPlaybackRate=speed;this.video.playbackRate=speed;}
}
