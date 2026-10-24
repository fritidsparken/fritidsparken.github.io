(() => {
  const ROWS = 6, COLS = 7, KEY = 'fp-four-in-row-scores-v1';
  let root, board, player = 1, mode = 'computer', busy = false, over = false;
  let scores, moves = [], generation = 0, aiTimer = 0, animation, events;
  function readScores() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return {red: +s.red || 0, yellow: +s.yellow || 0, draw: +s.draw || 0}; }
    catch { return {red: 0, yellow: 0, draw: 0}; }
  }
  const label = p => p === 1 ? 'Röd' : 'Gul';
  function gallery() {
    return `<section class="four-page"><header class="four-heading"><div><span class="four-kicker">EN KLASSIKER. EN NY OMGÅNG.</span><h2>4 i rad<span aria-hidden="true">●●●●</span></h2><p>En smart placering kan ändra allt.</p></div><div class="four-modes" role="group" aria-label="Välj spelläge"><button class="active" data-four-mode="computer" aria-pressed="true">Mot datorn</button><button data-four-mode="local" aria-pressed="false">Två spelare</button></div></header><div class="four-arena"><div class="four-match-bar"><div class="four-player red" id="fourRedPlayer"><i></i><span id="fourRedName">Du</span><b id="fourRedScore">0</b></div><div class="four-versus">VS</div><div class="four-player yellow" id="fourYellowPlayer"><i></i><span id="fourYellowName">Datorn</span><b id="fourYellowScore">0</b></div></div><div class="four-live" aria-live="polite"><span class="four-turn-dot" id="fourTurnDot"></span><strong id="fourStatus">Din tur. Välj en kolumn.</strong></div><div class="four-board-wrap"><div class="four-drop-row" id="fourDrops" aria-label="Välj kolumn"></div><div class="four-board" id="fourBoard" role="grid" aria-label="Spelbräde med sex rader och sju kolumner"><div class="four-token-layer" id="fourTokens"></div><svg class="four-face" viewBox="0 0 700 600" aria-hidden="true"><defs><linearGradient id="fourBoardBlue" x2=".6" y2="1"><stop stop-color="#437bf2"/><stop offset="1" stop-color="#2445b0"/></linearGradient><mask id="fourBoardHoles"><rect width="700" height="600" fill="white"/>${Array.from({length: 42}, (_, i) => `<circle cx="${i%7*100+50}" cy="${Math.floor(i/7)*100+50}" r="40" fill="black"/>`).join('')}</mask></defs><rect width="700" height="600" rx="26" fill="url(#fourBoardBlue)" mask="url(#fourBoardHoles)"/>${Array.from({length: 42}, (_, i) => `<circle cx="${i%7*100+50}" cy="${Math.floor(i/7)*100+50}" r="41" fill="none" stroke="#122b72" stroke-opacity=".55" stroke-width="3"/>`).join('')}</svg><div class="four-grid-labels" id="fourGridLabels"></div></div><div class="four-feet" aria-hidden="true"><i></i><i></i></div></div><div class="four-bottom"><span>Fyra vågrätt, lodrätt eller diagonalt.</span><button class="four-new" data-four-new>↻ Ny omgång</button></div></div><p class="four-tip">TIPS: Håll koll på mitten. Där finns flest vägar till fyra i rad.</p></section>`;
  }
  function start() {
    destroy(); root = document.querySelector('.four-page'); if (!root) return;
    events = new AbortController(); scores = readScores(); mode = 'computer';
    root.querySelector('#fourDrops').innerHTML = Array.from({length: 7}, (_, c) => `<button class="four-drop" data-four-column="${c}" aria-label="Släpp i kolumn ${c+1}"><span>↓</span></button>`).join('');
    root.addEventListener('click', e => {
      const m = e.target.closest('[data-four-mode]');
      if (m) { mode = m.dataset.fourMode; reset(); return; }
      if (e.target.closest('[data-four-new]')) { reset(); return; }
      const c = e.target.closest('[data-four-column]');
      if (c && !(mode === 'computer' && player === 2)) drop(+c.dataset.fourColumn);
    }, {signal: events.signal});
    root.addEventListener('keydown', e => {
      const btn = e.target.closest('[data-four-column]'); if (!btn || !['ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault(); const c = (+btn.dataset.fourColumn + (e.key === 'ArrowLeft' ? 6 : 1))%7;
      root.querySelector(`[data-four-column="${c}"]`).focus();
    }, {signal: events.signal});
    reset();
  }
  function destroy() { generation++; clearTimeout(aiTimer); animation?.cancel(); events?.abort(); busy = false; }
  function reset() {
    generation++; clearTimeout(aiTimer); animation?.cancel(); board = Array.from({length: 6}, () => Array(7).fill(0));
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
    const fall=(r+1)*root.querySelector('#fourBoard').clientHeight/6;
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?70:330+r*55;
    animation=token.animate([{transform:`translate(-50%,calc(-50% - ${fall}px))`,offset:0},{transform:'translate(-50%,-50%)',offset:.78},{transform:'translate(-50%,calc(-50% - 9px))',offset:.9},{transform:'translate(-50%,-50%)',offset:1}],{duration,easing:'cubic-bezier(.4,0,.8,.5)'});
    try { await animation.finished; } catch { return; }
    if(ticket!==generation || !root.isConnected)return;
    board[r][c]=p;moves.push({r,c,p});busy=false;
    const win=winner();
    if(win){over=true;scores[p===1?'red':'yellow']++;win.cells.forEach(([y,x])=>root.querySelector(`[data-row="${y}"][data-col="${x}"]`).classList.add('winner'));status(mode==='computer'?(p===1?'Du vann! Snyggt spelat.':'Datorn vann. En omgång till?'):`${label(p)} vann! Snyggt spelat.`);save();render();return;}
    if(moves.length===42){over=true;scores.draw++;status('Oavgjort! Vilken jämn omgång.');save();render();return;}
    player=3-p;
    if(mode==='computer'&&player===2){busy=true;status('Datorn funderar…');render();aiTimer=setTimeout(()=>{if(ticket!==generation||!root.isConnected)return;busy=false;drop(chooseMove());},460);}
    else {status(mode==='computer'?'Din tur. Välj en kolumn.':`${label(player)}s tur. Välj en kolumn.`);render();}
  }
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
    root.querySelectorAll('.four-drop').forEach((b,c)=>{b.disabled=busy||over||landing(c)<0;b.dataset.player=player;b.setAttribute('aria-label',`${label(player)} bricka i kolumn ${c+1}`);});
    root.querySelector('#fourTurnDot').dataset.player=player;root.querySelector('#fourRedPlayer').classList.toggle('is-turn',player===1&&!over);root.querySelector('#fourYellowPlayer').classList.toggle('is-turn',player===2&&!over);
    root.querySelector('#fourRedScore').textContent=scores.red;root.querySelector('#fourYellowScore').textContent=scores.yellow;
    root.querySelector('#fourGridLabels').innerHTML=board.map((row,r)=>row.map((p,c)=>`<span role="gridcell" aria-label="Rad ${r+1}, kolumn ${c+1}: ${p?label(p):'tom'}"></span>`).join('')).join('');
  }
  window.FPConnectFour={gallery,start,destroy};
})();
