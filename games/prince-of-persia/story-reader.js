"use strict";
// Each caption owns its audio until playback completes. A suspended page replays the current line.
function storyReader(caption, retry) {
  let lines=[], index=-1, complete=null, voice=null, speech=null, serial=0, timer=0, showCue=null;
  const synth=window.speechSynthesis;
  function silence(){
    serial++;clearInterval(timer);timer=0;
    if(voice){voice.onended=null;voice.onerror=null;voice.pause();voice=null}
    if(speech){speech.onend=null;speech.onerror=null;synth?.cancel();speech=null}
  }
  function next(){
    silence();retry.hidden=true;
    if(++index<lines.length){read();return}
    const done=complete;complete=null;index=-1;done?.();
  }
  function read(){
    silence();if(index<0||document.hidden)return;
    const cue=lines[index],id=serial;
    showCue?.(cue,index);caption.textContent=cue.text;caption.getAnimations?.().forEach(a=>a.cancel());
    caption.animate?.([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:350});
    retry.hidden=true;
    const fail=()=>{if(id===serial){silence();retry.hidden=false}};
    function say(){
      if(id!==serial)return;
      if(!synth || !window.SpeechSynthesisUtterance){fail();return}
      speech=new SpeechSynthesisUtterance(cue.text.replace(/[”„]/g,''));
      const choices=synth.getVoices().filter(v=>/^sv(?:[-_]|$)/i.test(v.lang));
      const preferred=cue.speaker==='laleh'?/alva|maja|sofie|hedvig/i:/oskar|oscar|mattias|filip|sven/i;
      speech.voice=choices.find(v=>preferred.test(v.name))||choices.find(v=>v.default)||choices[0]||null;
      speech.lang='sv-SE';speech.rate=.96;speech.pitch=cue.speaker==='laleh'?1.05:.95;
      speech.onend=()=>{if(id===serial)next()};speech.onerror=fail;synth.speak(speech);
    }
    if(!cue.clip){say();return}
    voice=document.getElementById(cue.speaker);
    if(!voice){fail();return}
    const clip=voice;
    const fallback=()=>{if(id!==serial||voice!==clip)return;clip.onended=null;clip.onerror=null;clip.pause();voice=null;clearInterval(timer);fail()};
    clip.onended=()=>{if(id===serial)next()};clip.onerror=fallback;
    try{
      clip.currentTime=cue.clip[0];clip.play().catch(fallback);
      timer=setInterval(()=>{if(id===serial&&voice===clip&&clip.currentTime>=cue.clip[1])next()},35);
    }catch{fallback()}
  }
  retry.onclick=read;
  document.addEventListener('visibilitychange',()=>{if(index>=0){if(document.hidden)silence();else read()}});
  return {
    start(script,done,onCue){silence();lines=script;complete=done;showCue=onCue;index=-1;next()},
    skip(){if(index<0)return;silence();retry.hidden=true;index=-1;const done=complete;complete=null;done?.()},
    get playing(){return index>=0}
  };
}
