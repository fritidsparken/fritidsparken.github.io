(() => {
  const games=[
    {id:'glow',title:'Glow Studio',tag:'DIN STUDIO. DIN KREATIVITET.',type:'3D · Skapa',image:'glow-studio/cover.webp',text:'Sminka med penseln, måla naglar och skapa en egen look i din studio.',module:'FPGlowStudio'},
    {id:'four',title:'4 i rad',tag:'TÄNK ETT DRAG LÄNGRE',type:'1–2 spelare',image:'four-in-row-icon.svg',text:'Utmana datorn eller en kompis. Fyra brickor i rad avgör allt.',module:'FPConnectFour'},
    {id:'plane',title:'Flygpilot',tag:'MOLNJAKTEN',type:'Skicklighet',image:'plane-pilot-icon.svg',text:'Lyft över dalen, väj för vindhjulen och sätt nästa landning.',module:'FPPlanePilot'},
    {id:'bike',title:'Stuntcykel',tag:'STADENS TAK',type:'Fysik & balans',image:'stunt-bike-city-icon.svg',text:'Sju stadsbanor i 3D. Hoppa, gör volter och slå ditt trickrekord.',module:'FPStuntBike'}
  ];
  let current=null;
  function gallery(){return `<section class="games-page"><header class="games-heading"><span class="games-eyebrow">EN LITEN SPELPAUS</span><h2>Redo för en omgång?</h2><p>Välj en utmaning och sätt igång.</p></header><div class="games-grid">${games.map(g=>`<article class="game-card game-card-${g.id}"><button class="game-cover" data-game-launch="${g.id}" aria-label="Spela ${g.title}"><img src="./assets/${g.image}?v=game-covers-20261025-1" alt=""/><span class="game-type">${g.type}</span><span class="game-cover-play" aria-hidden="true">▶</span></button><div class="game-card-copy"><span class="game-card-tag">${g.tag}</span><h3>${g.title}</h3><p>${g.text}</p><button class="game-launch" data-game-launch="${g.id}">Spela nu <span aria-hidden="true">→</span></button></div></article>`).join('')}</div><div class="game-stage" id="gameStage"></div></section>`;}
  function stop(){for(const g of games)window[g.module]?.destroy?.();current=null;}
  function render(){stop();const root=document.querySelector('#catalog');if(!root)return;root.innerHTML=gallery();mount();}
  function mount(){const root=document.querySelector('#catalog');if(!root||root.dataset.gameHubBound)return;root.dataset.gameHubBound='true';root.addEventListener('click',e=>{const game=e.target.closest('[data-game-launch]');if(game){open(game.dataset.gameLaunch);return;}if(e.target.closest('[data-game-back]')){render();document.querySelector('.games-heading')?.scrollIntoView({behavior:'smooth',block:'start'});}});}
  function open(id){const game=games.find(g=>g.id===id);if(!game)return;const api=window[game.module];if(!api)return;stop();const root=document.querySelector('#catalog'),stage=root?.querySelector('#gameStage');if(!stage)return;current=id;root.querySelector('.games-heading').hidden=true;root.querySelector('.games-grid').hidden=true;stage.innerHTML=`<div class="game-running"><button class="game-back" data-game-back>← Alla spel</button>${api.gallery()}</div>`;api.start();stage.scrollIntoView({behavior:'smooth',block:'start'});}
  window.FPGameHub={gallery,mount,render,open,stop};
  if(document.querySelector('#filters .active')?.dataset.cat==='Spel'){render();if(window.FPPendingGame){open(window.FPPendingGame);delete window.FPPendingGame;}}
})();


