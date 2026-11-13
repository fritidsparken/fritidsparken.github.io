"use strict";
// The flute recalls the original recordings. New silent beats follow Navid through the gate.
const memories=[
 {time:3.8, text:'Vid djungelns sista lykta spelar Navid Lalehs melodi. På andra sidan floden svarar någon med samma tre toner.'},
 {time:4.95, text:'”Navid, jag hörde Solporten öppnas. Du tog dig igenom.”',voice:'laleh',start:0},
 {time:4.3,text:'Lyktan slocknar. En kedja sträcks under vattnet. Nio slussar öppnas i berget. Bakom den tionde sitter Laleh.'},
 {time:4.25,text:'”Muren glöder i öster. Jag stoppar flöjten i bältet. Håll ut, Laleh.”',voice:'navid',start:15.754},
 {time:3.8,text:'Från djupet lyfter Tidvattenväktaren sin krona. Navid tar sats mot månporten.'}
];
let introIndex=-1,introClock=0,introVoice=null,introPlayed=false;
function stopVoice(){if(introVoice){introVoice.pause();introVoice=null}}
function cueIntro(i){
  stopVoice();introIndex=i;introClock=0;
  const cue=memories[i];el('storyText').textContent=cue.text;
  if(cue.voice){introVoice=el(cue.voice);introVoice.currentTime=cue.start;introVoice.play().catch(()=>{})}
}
function startIntro(){
  el('overlay').hidden=true;el('story').hidden=false;el('music').volume=.11;
  el('music').play().catch(()=>{});last=performance.now();cueIntro(0);el('skip').focus();
}
function endIntro(){stopVoice();introIndex=-1;introPlayed=true;el('story').hidden=true;save(game.checkpoint);startPlay()}
function updateIntro(dt){
  if(introIndex<0||document.hidden)return;
  introClock+=dt;el('storyText').style.opacity=Math.min(1,introClock/.35,(memories[introIndex].time-introClock)/.25);
  if(introClock>=memories[introIndex].time){if(introIndex+1===memories.length)endIntro();else cueIntro(introIndex+1)}
}
document.getElementById('skip').onclick=endIntro;
document.addEventListener('visibilitychange',()=>{
 if(introIndex<0)return;
 if(document.hidden){introVoice?.pause();el('music').pause()}else{last=performance.now();introVoice?.play().catch(()=>{});el('music').play().catch(()=>{})}
});
