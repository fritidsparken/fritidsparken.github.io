"use strict";
const memories=[
 {text:'Vid djungelns sista lykta spelar Navid Lalehs melodi. På andra sidan floden svarar någon med samma tre toner.'},
 {text:'”Navid, jag hörde Solporten öppnas. Du tog dig igenom.”',speaker:'laleh',clip:[0,4.95]},
 {text:'Lyktan slocknar. En kedja sträcks under vattnet. Nio slussar öppnas i berget. Bakom den tionde sitter Laleh.'},
 {text:'”Muren glöder i öster. Jag stoppar flöjten i bältet. Håll ut, Laleh.”',speaker:'navid',clip:[15.754,20.03]},
 {text:'Från djupet lyfter Tidvattenväktaren sin krona. Navid tar sats mot månporten.'}
];
let introPlayed=false;
const moonReader=storyReader(document.getElementById('storyText'),document.getElementById('voiceRetry'));
function startIntro(){
  el('overlay').hidden=true;el('story').hidden=false;el('music').volume=.1;
  el('music').play().catch(()=>{});last=performance.now();
  moonReader.start(memories,()=>{introPlayed=true;el('story').hidden=true;save(game.checkpoint);startPlay()});
  el('skip').focus();
}
document.getElementById('skip').onclick=()=>moonReader.skip();
document.addEventListener('visibilitychange',()=>{
 if(!moonReader.playing)return;
 if(document.hidden)el('music').pause();else el('music').play().catch(()=>{});
});
