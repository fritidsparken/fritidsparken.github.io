/**
 * Living illustrations for the three original finale paintings.
 * The image is never zoomed: a compact local mesh moves cloth and breathing,
 * while face interiors share one translation and architecture stays fixed.
 * Canvas 2D only; no WebGL, video codecs, network services or dependencies.
 */

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const ellipse = (x, y, e) => {
  const radius = Math.hypot((x - e[0]) / e[2], (y - e[1]) / e[3]);
  return 1 - smooth((radius - .72) / .28);
};

// All masks are in the approved 1672 x 941 composition's normalized coordinates.
// They deliberately stop short of stonework, the bridge, and facial features.
const SCENES = [
  {
    people: [
      { anchor:[.24,.82], head:[.246,.273,.059,.103], phase:0,
        body:[[.13,1],[.15,.69],[.13,.52],[.17,.39],[.18,.30],[.20,.18],[.26,.17],[.29,.22],[.29,.32],[.28,.36],[.34,.45],[.35,.56],[.42,.57],[.44,.64],[.40,.66],[.34,.60],[.32,.54],[.33,.82],[.35,1]],
        cloth:[[.18,.36],[.11,.44],[.08,.54],[.025,.68],[.004,.86],[.03,.99],[.14,.94],[.19,.68]] },
      { anchor:[.72,.96], head:[.716,.345,.061,.103], phase:1.2,
        body:[[.59,1],[.60,.79],[.62,.65],[.63,.53],[.59,.50],[.58,.45],[.62,.44],[.68,.47],[.68,.43],[.67,.35],[.69,.26],[.74,.25],[.78,.31],[.79,.41],[.78,.48],[.80,.59],[.82,.78],[.85,1]],
        cloth:[[.77,.47],[.80,.52],[.82,.69],[.86,.93],[.86,1],[.79,1],[.76,.73]] },
    ],
    water: [ { kind:'pool', polygon:[[.36,.72],[.59,.72],[.60,.91],[.48,.91],[.35,.82]] } ],
    lamps:[[.297,.13,.08],[.84,.18,.075],[.423,.43,.04],[.55,.61,.025]],
    dust:40,
  },
  {
    people: [
      { anchor:[.31,.86], head:[.294,.207,.075,.135], phase:.3,
        body:[[.13,.82],[.15,.59],[.16,.42],[.20,.29],[.21,.18],[.23,.08],[.30,.04],[.34,.09],[.36,.19],[.35,.27],[.36,.30],[.39,.36],[.40,.46],[.39,.52],[.38,.72],[.39,.87],[.22,.90]],
        cloth:[[.18,.32],[.12,.35],[.02,.38],[.004,.45],[.02,.66],[.13,.73],[.16,.58],[.20,.46]] },
      { anchor:[.57,.83], head:[.539,.303,.074,.136], phase:1.5,
        body:[[.43,.81],[.45,.62],[.46,.47],[.48,.42],[.48,.31],[.49,.20],[.54,.15],[.58,.18],[.60,.26],[.60,.37],[.62,.40],[.69,.40],[.76,.28],[.78,.22],[.83,.20],[.84,.23],[.80,.29],[.78,.34],[.72,.49],[.66,.55],[.65,.74],[.68,.84]],
        cloth:[[.48,.42],[.46,.55],[.43,.72],[.43,.84],[.49,.84],[.51,.60],[.62,.48],[.67,.64],[.68,.84],[.64,.86],[.59,.58]] },
    ],
    water:[
      { kind:'fall', polygon:[[.686,.035],[.758,.05],[.79,.13],[.79,.29],[.736,.34],[.707,.23]], speed:.29 },
      { kind:'fall', polygon:[[.773,.35],[.85,.32],[.914,.48],[.936,.69],[.875,.78],[.775,.67],[.742,.53]], speed:.4 },
      { kind:'pool', polygon:[[.84,.77],[.99,.73],[.99,.92],[.94,.91],[.84,.85]] },
    ],
    lamps:[[.115,.13,.08],[.351,.24,.045],[.856,.09,.05],[.966,.21,.045]],
    dust:54,
  },
  {
    people: [
      { anchor:[.34,.92], head:[.365,.235,.043,.076], phase:.2,
        body:[[.28,.92],[.29,.72],[.29,.56],[.29,.41],[.32,.31],[.335,.25],[.335,.19],[.36,.16],[.39,.19],[.40,.25],[.385,.30],[.41,.36],[.44,.48],[.46,.54],[.46,.58],[.43,.58],[.415,.48],[.42,.64],[.43,.81],[.46,.88],[.45,.91],[.41,.90],[.37,.77],[.35,.68],[.33,.82],[.32,.93]],
        cloth:[[.32,.30],[.29,.36],[.27,.45],[.23,.51],[.19,.57],[.14,.66],[.16,.72],[.23,.70],[.28,.65],[.31,.50]] },
      { anchor:[.60,.92], head:[.591,.29,.041,.078], phase:1.1,
        body:[[.50,.91],[.52,.73],[.53,.55],[.54,.42],[.565,.36],[.565,.28],[.57,.23],[.60,.215],[.624,.245],[.63,.31],[.62,.35],[.64,.38],[.66,.49],[.69,.57],[.69,.61],[.67,.61],[.64,.52],[.66,.70],[.70,.89],[.67,.92],[.60,.94]],
        cloth:[[.57,.36],[.54,.40],[.52,.56],[.50,.70],[.485,.84],[.49,.88],[.54,.91],[.56,.66],[.625,.38],[.65,.49],[.66,.65],[.72,.84],[.71,.88],[.67,.91],[.63,.69]] },
    ],
    water:[
      { kind:'fall', polygon:[[.83,.49],[.88,.48],[.90,.57],[.89,.65],[.87,.62],[.85,.56]], speed:.22 },
      { kind:'fall', polygon:[[.925,.57],[.98,.57],[.997,.66],[.997,.72],[.955,.70],[.948,.65]], speed:.2 },
      { kind:'pool', polygon:[[.79,.72],[.96,.73],[.97,.79],[.91,.79],[.82,.76]] },
    ],
    lamps:[[.371,.15,.035],[.899,.20,.14]],
    dust:35,
  },
];

function polygonWeight(x, y, polygon, feather = .018) {
  let inside = false, distance = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const t = clamp(((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy || 1));
    distance = Math.min(distance, Math.hypot(x - a[0] - t * vx, y - a[1] - t * vy));
  }
  return inside ? smooth(distance / feather) : 0;
}

function pathPolygon(ctx, polygon, w, h) {
  ctx.beginPath();
  polygon.forEach((p, i) => i ? ctx.lineTo(p[0] * w, p[1] * h) : ctx.moveTo(p[0] * w, p[1] * h));
  ctx.closePath();
}

function seeded(index, salt = 1) {
  const v = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function makeMesh(scene, columns, rows) {
  const vertices = [], triangles = [];
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const x = column / columns, y = row / rows;
      vertices.push({ x, y, dx:0, dy:0, weights:scene.people.map(person => ({
        body:polygonWeight(x, y, person.body),
        head:ellipse(x, y, person.head),
        cloth:polygonWeight(x, y, person.cloth, .014),
      })) });
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
      if ([a,b,c,d].some(i => vertices[i].weights.some(w => w.body > 0 || w.cloth > 0 || w.head > 0))) {
        triangles.push([a,b,c], [b,d,c]);
      }
    }
  }
  return { vertices, triangles };
}

function moveMesh(mesh, scene, t, w, h) {
  const motion = scene.people.map(p => ({
    breath:Math.sin(t * 1.43 + p.phase),
    sway:Math.sin(t * .71 + p.phase) * .00125,
    headX:Math.sin(t * .81 + p.phase + .4) * .0011,
    headY:Math.sin(t * 1.08 + p.phase) * .0008,
  }));
  for (const v of mesh.vertices) {
    let dx = 0, dy = 0;
    for (let i = 0; i < scene.people.length; i++) {
      const p = scene.people[i], a = v.weights[i], m = motion[i];
      const rise = smooth((p.anchor[1] - v.y) / .35);
      // Inside each face all points receive the same rigid translation.
      const bodyX = m.sway + m.breath * (v.x - p.anchor[0]) * .009;
      const bodyY = -m.breath * .0025 * rise;
      dx += ((bodyX * (1 - a.head)) + (m.sway + m.headX) * a.head) * Math.max(a.body, a.head);
      dy += ((bodyY * (1 - a.head)) + (-m.breath * .0025 + m.headY) * a.head) * Math.max(a.body, a.head);
      const wave = Math.sin(t * 1.73 + v.y * 10 + p.phase) + .35 * Math.sin(t * 2.6 - v.y * 14);
      dx += a.cloth * wave * .0041;
      dy += a.cloth * Math.sin(t * 1.38 + v.x * 11 + p.phase) * .0018;
    }
    v.dx = dx * w; v.dy = dy * h;
  }
}

function paintTriangle(ctx, source, vertices, triangle, w, h) {
  const [a,b,c] = triangle.map(i => vertices[i]);
  const sx = [a.x*w,b.x*w,c.x*w], sy = [a.y*h,b.y*h,c.y*h];
  const dx = [sx[0]+a.dx,sx[1]+b.dx,sx[2]+c.dx], dy = [sy[0]+a.dy,sy[1]+b.dy,sy[2]+c.dy];
  const det = (sx[1]-sx[0])*(sy[2]-sy[0]) - (sx[2]-sx[0])*(sy[1]-sy[0]);
  const aa = ((dx[1]-dx[0])*(sy[2]-sy[0]) - (dx[2]-dx[0])*(sy[1]-sy[0])) / det;
  const bb = ((dy[1]-dy[0])*(sy[2]-sy[0]) - (dy[2]-dy[0])*(sy[1]-sy[0])) / det;
  const cc = ((dx[2]-dx[0])*(sx[1]-sx[0]) - (dx[1]-dx[0])*(sx[2]-sx[0])) / det;
  const dd = ((dy[2]-dy[0])*(sx[1]-sx[0]) - (dy[1]-dy[0])*(sx[2]-sx[0])) / det;
  const centerX = (dx[0]+dx[1]+dx[2])/3, centerY = (dy[0]+dy[1]+dy[2])/3;
  ctx.save(); ctx.beginPath();
  // A subpixel overlap removes antialias cracks between adjacent triangles.
  for (let i=0;i<3;i++) {
    const vx=dx[i]-centerX, vy=dy[i]-centerY, length=Math.hypot(vx,vy)||1;
    const x=dx[i]+vx/length*.42, y=dy[i]+vy/length*.42;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.closePath(); ctx.clip();
  ctx.transform(aa,bb,cc,dd,dx[0]-aa*sx[0]-cc*sy[0],dy[0]-bb*sx[0]-dd*sy[0]);
  const left=Math.max(0,Math.floor(Math.min(...sx))-1),top=Math.max(0,Math.floor(Math.min(...sy))-1);
  const right=Math.min(w,Math.ceil(Math.max(...sx))+1),bottom=Math.min(h,Math.ceil(Math.max(...sy))+1);
  ctx.drawImage(source,left,top,right-left,bottom-top,left,top,right-left,bottom-top); ctx.restore();
}

function paintEnvironment(ctx, scene, t, w, h) {
  ctx.save(); ctx.globalCompositeOperation='screen';
  for (const [x,y,r] of scene.lamps) {
    const alpha=.017 + (Math.sin(t*1.7+x*23)+Math.sin(t*2.13+y*15))*.004;
    const glow=ctx.createRadialGradient(x*w,y*h,0,x*w,y*h,r*w);
    glow.addColorStop(0,`rgba(255,202,104,${alpha*2.5})`); glow.addColorStop(1,'rgba(255,187,85,0)');
    ctx.fillStyle=glow;ctx.fillRect((x-r)*w,(y-r)*h,r*w*2,r*w*2);
  }
  for (let wi=0;wi<scene.water.length;wi++) {
    const water=scene.water[wi];
    const minX=Math.min(...water.polygon.map(p=>p[0])), maxX=Math.max(...water.polygon.map(p=>p[0]));
    const minY=Math.min(...water.polygon.map(p=>p[1])), maxY=Math.max(...water.polygon.map(p=>p[1]));
    ctx.save();pathPolygon(ctx,water.polygon,w,h);ctx.clip();
    if (water.kind==='fall') {
      // Fine, differently paced streaks and spray travel down existing water.
      for(let i=0;i<44;i++) {
        const phase=seeded(i,wi+4), x=(minX+seeded(i,wi+12)*(maxX-minX))*w;
        const cycle=(phase+t*(water.speed||.3)*(0.65+seeded(i,7)*.7))%1;
        const y=(minY+cycle*(maxY-minY))*h;
        const length=(.012+seeded(i,21)*.035)*h;
        const alpha=.08*Math.sin(cycle*Math.PI)*(0.4+seeded(i,19));
        ctx.strokeStyle=`rgba(176,245,255,${alpha})`;ctx.lineWidth=.55+seeded(i,34)*.7;
        ctx.beginPath();ctx.moveTo(x,y-length);ctx.quadraticCurveTo(x+Math.sin(t+i)*1.3,y-length*.45,x+Math.sin(t*.8+i),y);ctx.stroke();
      }
    } else {
      for(let i=0;i<24;i++) {
        const phase=(seeded(i,wi+23)+t*.14)%1;
        const x=(minX+seeded(i,wi+14)*(maxX-minX)+Math.sin(t*.7+i)*.0025)*w;
        const y=(minY+seeded(i,wi+31)*(maxY-minY))*h;
        const opacity=Math.sin(phase*Math.PI)*.12;
        ctx.strokeStyle=`rgba(166,245,235,${opacity})`;ctx.lineWidth=.7;
        ctx.beginPath();ctx.ellipse(x,y,(.003+phase*.009)*w,(.0004+phase*.0017)*h,0,0,Math.PI*1.7);ctx.stroke();
      }
    }
    ctx.restore();
  }
  for(let i=0;i<scene.dust;i++) {
    const baseX=seeded(i,50), baseY=seeded(i,80);
    const x=(baseX+Math.sin(t*.18+i*1.7)*.009)*w;
    const y=((baseY-t*(.005+seeded(i,31)*.005))%1+1)%1*h;
    // Do not put floating dots over faces; they remain crisp and readable.
    if(scene.people.some(p=>ellipse(x/w,y/h,p.head)>.03)) continue;
    const alpha=(.08+.11*seeded(i,14))*(.4+.6*Math.pow(Math.sin(t*.45+i),2));
    ctx.fillStyle=`rgba(255,224,162,${alpha})`;
    ctx.beginPath();ctx.arc(x,y,.45+seeded(i,72)*.7,0,TAU);ctx.fill();
  }
  ctx.restore();
}

/**
 * @param {HTMLCanvasElement} canvas Absolutely positioned above the fallback img.
 * @param {{imageElement?:HTMLImageElement, fit?:'cover'|'contain', fps?:number, maxWidth?:number, autoPlay?:boolean}} options
 * @returns {{show:Function, stop:Function, dispose:Function, resize:Function, update:Function, stats:object}}
 */
export function createOutroMotion(canvas, options={}) {
  const ctx=canvas?.getContext?.('2d',{alpha:true,desynchronized:true});
  if(!ctx) return {show:async()=>false,stop(){},dispose(){},resize(){},update(){},stats:{supported:false}};
  const doc=canvas.ownerDocument, win=doc.defaultView;
  const media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const source=doc.createElement('canvas'), sourceCtx=source.getContext('2d',{alpha:false});
  const frame=doc.createElement('canvas'), frameCtx=frame.getContext('2d',{alpha:false,desynchronized:true});
  const maxWidth=Math.min(960,Math.max(320,options.maxWidth||960));
  const fps=clamp(options.fps||30,10,30), interval=1000/fps;
  const cache=new Map();
  let image=null, scene=SCENES[0], mesh=null, active=false, disposed=false, token=0, raf=0;
  let time=0, lastStamp=0, lastPaint=0, view={x:0,y:0,w:1,h:1}, resizeQueued=true;
  let detail=0, renderMean=0, slowFrames=0;
  const stats={supported:true,frames:0,triangles:0,width:0,height:0,lastRenderMs:0,reducedMotion:!!media?.matches,quality:'normal'};
  canvas.setAttribute('aria-hidden','true');canvas.style.pointerEvents='none';canvas.hidden=true;

  function rebuildMesh(){
    // Reduce geometry work on slow devices without softening the original art.
    const tier=Math.min(3,detail+(source.width<=640?1:0));
    const [columns,rows]=[[30,18],[24,14],[18,11],[14,8]][tier];
    mesh=makeMesh(scene,columns,rows);stats.triangles=mesh.triangles.length;
    stats.quality=['normal','balanced','light','minimal'][tier];
  }

  function placeCanvas() {
    const img=options.imageElement;
    if(!img) return;
    const rect=img.getBoundingClientRect(), parent=canvas.offsetParent||canvas.parentElement;
    const base=parent?.getBoundingClientRect?.()||{left:0,top:0};
    canvas.style.position='absolute';
    canvas.style.left=`${rect.left-base.left-(parent?.clientLeft||0)+(parent?.scrollLeft||0)}px`;
    canvas.style.top=`${rect.top-base.top-(parent?.clientTop||0)+(parent?.scrollTop||0)}px`;
    canvas.style.width=`${rect.width}px`;canvas.style.height=`${rect.height}px`;
  }

  function resize() {
    resizeQueued=false;
    if(!image||disposed) return;
    placeCanvas();
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(1.5,win.devicePixelRatio||1);
    const cw=Math.max(1,rect.width), ch=Math.max(1,rect.height);
    const scale=Math.min(dpr,maxWidth/cw);
    const width=Math.max(1,Math.round(cw*scale)), height=Math.max(1,Math.round(ch*scale));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const style=options.imageElement?win.getComputedStyle(options.imageElement):null;
    const fit=options.fit||style?.objectFit||'cover';
    const imageRatio=image.naturalWidth/image.naturalHeight;
    const fitScale=fit==='contain'?Math.min(width/image.naturalWidth,height/image.naturalHeight):Math.max(width/image.naturalWidth,height/image.naturalHeight);
    const drawW=image.naturalWidth*fitScale, drawH=image.naturalHeight*fitScale;
    const parts=(style?.objectPosition||'50% 50%').split(/\s+/);
    const fraction=value=>value?.endsWith('%')?parseFloat(value)/100:value==='left'||value==='top'?0:value==='right'||value==='bottom'?1:.5;
    view={x:(width-drawW)*fraction(parts[0]),y:(height-drawH)*fraction(parts[1]||'50%'),w:drawW,h:drawH};
    const sourceW=Math.min(maxWidth,Math.max(320,Math.round(drawW))), sourceH=Math.round(sourceW/imageRatio);
    if(source.width!==sourceW||source.height!==sourceH){source.width=frame.width=sourceW;source.height=frame.height=sourceH;}
    sourceCtx.imageSmoothingEnabled=true;sourceCtx.imageSmoothingQuality='high';sourceCtx.drawImage(image,0,0,sourceW,sourceH);
    rebuildMesh();
    stats.width=width;stats.height=height;
    render();
  }

  function render() {
    if(!image||!mesh||disposed) return;
    const start=win.performance.now(), w=frame.width,h=frame.height;
    frameCtx.setTransform(1,0,0,1,0,0);frameCtx.globalAlpha=1;frameCtx.globalCompositeOperation='source-over';
    frameCtx.drawImage(source,0,0);
    if(!media?.matches){
      moveMesh(mesh,scene,time,w,h);
      for(const triangle of mesh.triangles) paintTriangle(frameCtx,source,mesh.vertices,triangle,w,h);
      paintEnvironment(frameCtx,scene,time,w,h);
    }
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(frame,view.x,view.y,view.w,view.h);
    stats.frames++;stats.lastRenderMs=win.performance.now()-start;stats.reducedMotion=!!media?.matches;
  }

  function loop(stamp) {
    raf=0;
    if(!active||disposed||doc.hidden||media?.matches||options.autoPlay===false) return;
    if(resizeQueued) resize();
    if(!lastStamp) lastStamp=stamp;
    if(stamp-lastPaint>=interval-.8){
      time+=Math.min(.1,(stamp-lastStamp)/1000);lastStamp=stamp;lastPaint=stamp;
      render();
      renderMean=renderMean?renderMean*.8+stats.lastRenderMs*.2:stats.lastRenderMs;
      slowFrames=renderMean>22?slowFrames+1:Math.max(0,slowFrames-1);
      if(slowFrames>=5&&detail<3){detail++;slowFrames=0;renderMean=0;rebuildMesh();}
    }
    raf=win.requestAnimationFrame(loop);
  }
  function startLoop(){
    if(!raf&&active&&!disposed&&!doc.hidden&&!media?.matches&&options.autoPlay!==false){lastStamp=0;lastPaint=0;raf=win.requestAnimationFrame(loop);}
  }
  function cancelLoop(){if(raf)win.cancelAnimationFrame(raf);raf=0;lastStamp=0;lastPaint=0;}
  function queueResize(){resizeQueued=true;if(active){resize();startLoop();}}
  function visibility(){if(doc.hidden)cancelLoop();else{if(active){resize();startLoop();}}}
  function preference(){cancelLoop();if(active){render();startLoop();}}
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(queueResize):null;
  observer?.observe(options.imageElement||canvas.parentElement||canvas);
  win.addEventListener('resize',queueResize,{passive:true});doc.addEventListener('visibilitychange',visibility);
  media?.addEventListener?.('change',preference);

  function load(src){
    if(cache.has(src))return cache.get(src);
    const promise=new Promise((resolve,reject)=>{
      const img=new win.Image();img.decoding='async';
      img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(`Unable to load outro artwork: ${src}`));img.src=src;
    });
    cache.set(src,promise);promise.catch(()=>cache.delete(src));return promise;
  }
  async function show(src,sceneIndex=0){
    if(disposed)return false;
    const current=++token;active=false;cancelLoop();canvas.style.opacity='0';canvas.hidden=true;
    try{
      const next=await load(src);
      if(disposed||current!==token)return false;
      image=next;scene=SCENES[clamp(Math.trunc(sceneIndex),0,2)];time=0;active=true;
      canvas.hidden=false;canvas.style.transition='none';resize();
      // The intact image remains underneath, including on slow/failed loads.
      canvas.getBoundingClientRect();
      canvas.style.transition=media?.matches?'none':'opacity 420ms ease';canvas.style.opacity='1';
      startLoop();return true;
    }catch(error){if(current===token){active=false;canvas.hidden=true;}return false;}
  }
  function stop(){++token;active=false;cancelLoop();canvas.hidden=true;canvas.style.opacity='0';}
  function update(seconds){if(active&&!disposed){time=Math.max(0,Number(seconds)||0);if(resizeQueued)resize();else render();}}
  function dispose(){
    if(disposed)return;stop();disposed=true;observer?.disconnect();cache.clear();
    win.removeEventListener('resize',queueResize);doc.removeEventListener('visibilitychange',visibility);media?.removeEventListener?.('change',preference);
    image=null;mesh=null;source.width=source.height=frame.width=frame.height=1;canvas.width=canvas.height=1;
  }
  return {show,stop,dispose,resize,update,stats};
}
