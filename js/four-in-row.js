(() => {
  const ROWS = 6, COLS = 7, KEY = 'fp-four-in-row-scores-v1';
  let root, board, player = 1, mode = 'computer', busy = false, over = false;
  let raf = 0, selected = 3;
  let scores, moves = [], generation = 0, aiTimer = 0, animation, events;
  function readScores() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return {red: +s.red || 0, yellow: +s.yellow || 0, draw: +s.draw || 0}; }
    catch { return {red: 0, yellow: 0, draw: 0}; }
  }
  const label = p => p === 1 ? 'Röd' : 'Gul';
  function gallery() {
    return `<section class="four-page"><header class="four-heading"><div><h2>4 i rad<span aria-hidden="true">●●●●</span></h2><p>Klassikern där du ska få fyra i rad!</p></div><div class="four-modes" role="group" aria-label="Välj spelläge"><button class="active" data-four-mode="computer" aria-pressed="true">Mot datorn</button><button data-four-mode="local" aria-pressed="false">Två spelare</button></div></header><div class="four-arena"><div class="four-match-bar"><div class="four-player red" id="fourRedPlayer"><i></i><span id="fourRedName">Du</span><b id="fourRedScore">0</b></div><div class="four-versus">VS</div><div class="four-player yellow" id="fourYellowPlayer"><i></i><span id="fourYellowName">Datorn</span><b id="fourYellowScore">0</b></div></div><div class="four-live" aria-live="polite"><span class="four-turn-dot" id="fourTurnDot"></span><strong id="fourStatus">Din tur. Välj en kolumn.</strong></div><div class="four-board-wrap"><div class="four-drop-row" id="fourDrops" aria-label="Välj kolumn"></div><div class="four-board" id="fourBoard" role="grid" aria-label="Spelbräde med sex rader och sju kolumner"><div class="four-column-light" id="fourColumnLight"></div><div class="four-token-layer" id="fourTokens"></div><svg class="four-face" viewBox="0 0 700 600" aria-hidden="true"><defs><linearGradient id="fourBoardBlue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3298ed"/><stop offset=".45" stop-color="#086ac4"/><stop offset="1" stop-color="#003b8f"/></linearGradient><linearGradient id="fourRim" x2=".5" y2="1"><stop stop-color="#001a46"/><stop offset=".5" stop-color="#124b8d"/><stop offset="1" stop-color="#b2e6ff"/></linearGradient><mask id="fourBoardHoles"><rect width="700" height="600" fill="white"/>${Array.from({length: 42}, (_, i) => `<circle cx="${i%7*100+50}" cy="${Math.floor(i/7)*100+50}" r="40" fill="black"/>`).join('')}</mask></defs><rect width="700" height="600" rx="26" fill="url(#fourBoardBlue)" mask="url(#fourBoardHoles)"/>${Array.from({length: 42}, (_, i) => `<circle cx="${i%7*100+50}" cy="${Math.floor(i/7)*100+50}" r="41" fill="none" stroke="url(#fourRim)" stroke-width="4"/>`).join('')}</svg><div class="four-grid-labels" id="fourGridLabels"></div></div><div class="four-feet" aria-hidden="true"><i></i><i></i></div></div><div class="four-bottom"><span>Fyra vågrätt, lodrätt eller diagonalt.</span><button class="four-new" data-four-new>↻ Ny omgång</button></div></div><div class="four-result" id="fourResult" hidden><strong id="fourResultText"></strong><button data-four-new>Spela igen ↻</button></div><details class="four-audio"><summary>Ljud & musik</summary><div class="four-audio-controls"><button id="fourMusicToggle" aria-pressed="true">Musik på</button><label>Musik <input id="fourMusicVolume" type="range" min="0" max="100" value="18"></label><label>Ljudeffekter <input id="fourSfxVolume" type="range" min="0" max="100" value="65"></label></div><p id="fourAudioStatus" aria-live="polite"></p><small>Musik: <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037" target="_blank" rel="noopener">Carefree — Kevin MacLeod</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Kortad, komprimerad och övertonad för spelet. Ljudeffekter skapade för Fritidsparken.</small></details></section>`;
  }
  function start() {
    destroy(); root = document.querySelector('.four-page'); if (!root) return;
    events = new AbortController(); sound = new FourAudio(); setupSound(); scores = readScores(); mode = 'computer';
    root.querySelector('#fourDrops').innerHTML = Array.from({length: 7}, (_, c) => `<button class="four-drop" data-four-column="${c}" aria-label="Släpp i kolumn ${c+1}"><span>↓</span></button>`).join('');
    root.addEventListener('click', e => {
      sound.unlock();
      const m = e.target.closest('[data-four-mode]');
      if (m) { sound.effect('click'); mode = m.dataset.fourMode; reset(); return; }
      if (e.target.closest('[data-four-new]')) { reset(); return; }
      const c = e.target.closest('[data-four-column]');
      if (c && !(mode === 'computer' && player === 2)) drop(+c.dataset.fourColumn);
    }, {signal: events.signal});
    root.addEventListener('keydown', e => {
      const btn = e.target.closest('[data-four-column]'); if (!btn || !['ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault(); const c = (+btn.dataset.fourColumn + (e.key === 'ArrowLeft' ? 6 : 1))%7;
      root.querySelector(`[data-four-column="${c}"]`).focus();
    }, {signal: events.signal});
    const preview = e => {const b=e.target.closest('[data-four-column]');if(b&&!b.disabled){selected=+b.dataset.fourColumn;root.querySelector('#fourColumnLight').style.left=`${selected/7*100}%`;root.querySelectorAll('.four-drop').forEach((x,c)=>x.classList.toggle('selected',c===selected));}};
    root.addEventListener('pointerover',preview,{signal:events.signal});root.addEventListener('pointerdown',preview,{signal:events.signal});root.addEventListener('focusin',preview,{signal:events.signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)sound?.suspend();else sound?.resume();},{signal:events.signal});
    reset();
  }
  function destroy() { generation++; clearTimeout(aiTimer); animation?.cancel(); cancelAnimationFrame(raf); sound?.close(); events?.abort(); busy = false; }
  function reset() {
    generation++; clearTimeout(aiTimer); animation?.cancel(); cancelAnimationFrame(raf);
    const old=root.querySelector('#fourTokens');if(old.children.length){sound?.effect('reset');const ghost=old.cloneNode(true);ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');root.querySelector('#fourBoard').append(ghost);const a=ghost.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(45%)',opacity:0}],{duration:280,easing:'ease-in'});a.finished.then(()=>ghost.remove(),()=>ghost.remove());}
    root.querySelector('#fourResult').hidden=true;
    board = Array.from({length: 6}, () => Array(7).fill(0));
    player = 1; busy = over = false; moves = []; root.querySelector('#fourTokens').replaceChildren();
    root.querySelectorAll('[data-four-mode]').forEach(b => { const active = b.dataset.fourMode === mode; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active); });
    root.querySelector('#fourRedName').textContent = mode === 'computer' ? 'Du' : 'Röd';
    root.querySelector('#fourYellowName').textContent = mode === 'computer' ? 'Datorn' : 'Gul';
    status(mode === 'computer' ? 'Din tur. Välj en kolumn.' : 'Röd börjar. Välj en kolumn.'); render();
  }
  function landing(c, b = board) { for (let r=5; r>=0; r--) if (!b[r][c]) return r; return -1; }
  function winner(b = board) {
    for (let r=0;r<6;r++) for(let c=0;c<7;c++) if(b[r][c]) for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
      const cells=[]; for(let i=0;i<4;i++) {const y=r+i*dr,x=c+i*dc; if(y<0||y>5||x<0||x>6||b[y][x]!==b[r][c])break;cells.push([y,x]);}
      if(cells.length===4)return {p:b[r][c],cells};
    } return null;
  }
  async function drop(c) {
    if(busy || over || !root?.isConnected) return; const r=landing(c); if(r<0)return;
    const ticket=generation,p=player;busy=true;render();
    const token=document.createElement('span');token.className='four-token '+(p===1?'red':'yellow');
    token.style.left=`${(c+.5)/7*100}%`; token.style.top=`${(r+.5)/6*100}%`;token.dataset.row=r;token.dataset.col=c;
    root.querySelector('#fourTokens').append(token);
    sound?.effect('release');
    await new Promise(resolve=>{
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const distance=r+1, gravity=34, impact=reduced?.06:Math.sqrt(2*distance/gravity), settle=reduced?0:.22;
      let startTime,hit=false;
      const frame=now=>{if(ticket!==generation){resolve();return;}startTime??=now;const t=(now-startTime)/1000;
        let offset;if(t<impact)offset=-distance*(1-(t/impact)**2);else{if(!hit){hit=true;sound?.effect(r===5?'bottom':'land');}const u=t-impact;offset=-.065*Math.exp(-13*u)*Math.abs(Math.sin(u*35));}
        token.style.transform=`translate(-50%,calc(-50% + ${offset*root.querySelector('#fourBoard').clientHeight/6}px)) rotate(${hit?Math.sin((t-impact)*50)*Math.exp(-18*(t-impact))*.7:0}deg)`;
        if(t<impact+settle)raf=requestAnimationFrame(frame);else{token.style.transform='translate(-50%,-50%)';resolve();}
      };raf=requestAnimationFrame(frame);
    });
    if(ticket!==generation || !root.isConnected)return;
    board[r][c]=p;moves.push({r,c,p});busy=false;
    const win=winner();
    if(win){over=true;scores[p===1?'red':'yellow']++;win.cells.forEach(([y,x])=>root.querySelector(`[data-row="${y}"][data-col="${x}"]`).classList.add('winner'));status(mode==='computer'?(p===1?'Du vann! Snyggt spelat.':'Datorn vann. En omgång till?'):`${label(p)} vann! Snyggt spelat.`);finish(p);save();render();return;}
    if(moves.length===42){over=true;scores.draw++;status('Oavgjort! Vilken jämn omgång.');finish(0);save();render();return;}
    player=3-p;
    if(mode==='computer'&&player===2){busy=true;status('Datorn funderar…');render();aiTimer=setTimeout(()=>{if(ticket!==generation||!root.isConnected)return;busy=false;drop(chooseMove());},460);}
    else {status(mode==='computer'?'Din tur. Välj en kolumn.':`${label(player)}s tur. Välj en kolumn.`);render();}
  }
  function finish(p){sound?.effect(p===0?'draw':mode==='computer'&&p===2?'lose':'win');root.querySelector('#fourResultText').textContent=root.querySelector('#fourStatus').textContent;root.querySelector('#fourResult').hidden=false;}
  function evaluate(b) {
    let n=0;for(let r=0;r<6;r++)n+=b[r][3]===2?5:b[r][3]===1?-5:0;
    for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
      let a=0,d=0,count=0;for(let i=0;i<4;i++){const y=r+dr*i,x=c+dc*i;if(y<0||y>5||x<0||x>6)break;count++;a+=b[y][x]===2;d+=b[y][x]===1;}
      if(count===4){if(!d)n+=[0,1,8,70,5000][a];if(!a)n-=[0,1,10,85,5000][d];}
    }return n;
  }
  function search(b, depth, maximize, alpha, beta) {
    const w=winner(b);if(w)return w.p===2?10000+depth:-10000-depth;if(!depth)return evaluate(b);
    const legal=[3,2,4,1,5,0,6].filter(c=>landing(c,b)>=0);if(!legal.length)return 0;
    let best=maximize?-Infinity:Infinity;
    for(const c of legal){const r=landing(c,b);b[r][c]=maximize?2:1;const v=search(b,depth-1,!maximize,alpha,beta);b[r][c]=0;best=maximize?Math.max(best,v):Math.min(best,v);if(maximize)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);if(beta<=alpha)break;}return best;
  }
  function chooseMove(){let best=-Infinity,choice=3;for(const c of [3,2,4,1,5,0,6]){const r=landing(c);if(r<0)continue;board[r][c]=2;const v=search(board,3,false,-Infinity,Infinity);board[r][c]=0;if(v>best){best=v;choice=c;}}return choice;}
  function status(s){root.querySelector('#fourStatus').textContent=s;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(scores));}catch{}}
  function render(){
    root.querySelectorAll('.four-drop').forEach((b,c)=>{b.disabled=busy||over||landing(c)<0;b.dataset.player=player;b.classList.toggle('selected',c===selected&&!busy&&!over);b.setAttribute('aria-label',`${label(player)} bricka i kolumn ${c+1}`);});
    root.querySelector('#fourTurnDot').dataset.player=player;root.querySelector('#fourRedPlayer').classList.toggle('is-turn',player===1&&!over);root.querySelector('#fourYellowPlayer').classList.toggle('is-turn',player===2&&!over);
    root.querySelector('#fourRedScore').textContent=scores.red;root.querySelector('#fourYellowScore').textContent=scores.yellow;
    root.querySelector('#fourGridLabels').innerHTML=board.map((row,r)=>row.map((p,c)=>`<span role="gridcell" aria-label="Rad ${r+1}, kolumn ${c+1}: ${p?label(p):'tom'}"></span>`).join('')).join('');
  }
  let sound;
  class FourAudio {
    constructor(){this.settings={music:true,volume:.18,sfx:.65};try{Object.assign(this.settings,JSON.parse(localStorage.getItem('fp-four-audio-v1')||'{}'));}catch{}this.alive=true;this.sources=[];}
    unlock(){if(!this.alive)return;try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.gain=this.ctx.createGain();this.gain.gain.value=0;this.gain.connect(this.ctx.destination);}this.ctx.resume().catch(()=>{});this.load();this.update();}catch{}}
    async load(){if(this.loading||this.buffer)return;this.loading=true;try{const r=await fetch('./assets/audio/four-in-row/carefree.mp3');if(!r.ok)throw Error();const data=await r.arrayBuffer();if(!this.alive)return;this.buffer=await this.ctx.decodeAudioData(data);if(this.alive)this.playLoop();}catch{if(this.alive)root.querySelector('#fourAudioStatus').textContent='Musiken kunde inte laddas. Spelet fungerar med ljudeffekter.';}finally{this.loading=false;}}
    playLoop(){if(!this.buffer||!this.alive||!this.settings.music||document.hidden||this.sources.length)return;const ctx=this.ctx,d=this.buffer.duration,fade=2;let next=ctx.currentTime+.05;const schedule=()=>{if(!this.alive)return;while(next<ctx.currentTime+d){const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=this.buffer;s.connect(g);g.connect(this.gain);g.gain.setValueAtTime(0,next);g.gain.linearRampToValueAtTime(1,next+fade);g.gain.setValueAtTime(1,next+d-fade);g.gain.linearRampToValueAtTime(0,next+d);s.start(next);this.sources.push(s);s.onended=()=>{this.sources=this.sources.filter(x=>x!==s);s.disconnect();g.disconnect();};next+=d-fade;}};schedule();this.timer=setInterval(schedule,1000);this.update();}
    update(){try{localStorage.setItem('fp-four-audio-v1',JSON.stringify(this.settings));}catch{}if(!this.ctx)return;this.gain.gain.cancelScheduledValues(this.ctx.currentTime);this.gain.gain.setTargetAtTime(this.settings.music?this.settings.volume:0,this.ctx.currentTime,.18);if(this.settings.music)this.playLoop();}
    effect(kind){if(!this.ctx||!this.alive)return;const ctx=this.ctx,t=ctx.currentTime,v=this.settings.sfx;if(!v)return;const melodic=['win','lose','draw'].includes(kind);if(melodic){const notes=kind==='win'?[523,659,784]:kind==='lose'?[392,440]:[440,523];notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(0,t+i*.13);g.gain.linearRampToValueAtTime(v*.09,t+i*.13+.008);g.gain.exponentialRampToValueAtTime(.0001,t+i*.13+.35);o.start(t+i*.13);o.stop(t+i*.13+.36);});return;}
      const duration=kind==='reset'?.19:kind==='release'?.035:.085;
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),d=buffer.getChannelData(0);const freq=(kind==='bottom'?820:kind==='land'?1250:1700)*( .93+Math.random()*.14);
      for(let i=0;i<d.length;i++){const u=i/ctx.sampleRate;d[i]=(Math.random()*2-1)*Math.exp(-u*110)*.36+Math.sin(2*Math.PI*freq*u)*Math.exp(-u*75)*.38+Math.sin(2*Math.PI*freq*1.73*u)*Math.exp(-u*95)*.18;}
      const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=buffer;g.gain.value=v*(kind==='release'||kind==='click'?.2:.55);source.connect(g);g.connect(ctx.destination);source.start();source.onended=()=>{source.disconnect();g.disconnect();};
    }
    suspend(){this.ctx?.suspend().catch(()=>{});}
    resume(){if(this.ctx)this.ctx.resume().catch(()=>{});}
    close(){this.alive=false;clearInterval(this.timer);if(this.ctx){this.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.04);const c=this.ctx;setTimeout(()=>c.close().catch(()=>{}),180);}this.sources=[];}
  }
  function setupSound(){const toggle=root.querySelector('#fourMusicToggle'),music=root.querySelector('#fourMusicVolume'),sfx=root.querySelector('#fourSfxVolume');const sync=()=>{toggle.textContent=sound.settings.music?'Musik på':'Musik av';toggle.setAttribute('aria-pressed',sound.settings.music);music.value=sound.settings.volume*100;sfx.value=sound.settings.sfx*100;};sync();toggle.addEventListener('click',()=>{sound.settings.music=!sound.settings.music;sound.unlock();sound.update();sync();},{signal:events.signal});music.addEventListener('input',()=>{sound.settings.volume=+music.value/100;sound.unlock();sound.update();},{signal:events.signal});sfx.addEventListener('input',()=>{sound.settings.sfx=+sfx.value/100;sound.unlock();sound.update();},{signal:events.signal});}

  window.FPConnectFour={gallery,start,destroy};
})();
