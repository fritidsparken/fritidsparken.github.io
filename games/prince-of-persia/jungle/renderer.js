"use strict";

const sceneVS = `
attribute vec3 p,n;attribute vec2 uv;attribute vec4 tint;
uniform vec3 camera,offset;uniform vec4 lens;uniform vec2 tilt;
uniform float rot,scale,heading;uniform mediump float seconds;uniform mediump float mode,shadowPass;uniform mediump vec2 shadowRange;
varying mediump vec3 shadowPoint;varying vec3 wp,norm;varying vec2 tc;varying vec4 hue;varying float dist;
void main(){
 vec3 pos=p*scale,nn=n;
 if(tint.a<-.5){
  float distance=(-1.-tint.a)-(camera.z-7.);
  float rise=min(clamp((10.-distance)/4.,0.,1.),clamp((distance+2.)/1.5,0.,1.));
  pos.y-=.70*(1.-rise);
 }
 float si=sin(rot),co=cos(rot);
 pos.yz=mat2(co,si,-si,co)*pos.yz;nn.yz=mat2(co,si,-si,co)*nn.yz;
 float hs=sin(heading),hc=cos(heading);pos.xz=mat2(hc,-hs,hs,hc)*pos.xz;nn.xz=mat2(hc,-hs,hs,hc)*nn.xz;
 wp=pos+offset;norm=nn;tc=uv;hue=tint;
 vec3 v=wp-camera;float z=dot(v,vec3(0.,-tilt.y,-tilt.x));dist=z;
 gl_Position=vec4(v.x*lens.x,dot(v,vec3(0.,tilt.x,-tilt.y))*lens.y+z*.06,z*1.0027-.241,z);
 shadowPoint=vec3((wp.x+.6*wp.y)/64.+.5,(wp.z-.45*wp.y-shadowRange.x)/shadowRange.y,(22.-wp.y)/36.);
 if(shadowPass>.5)gl_Position=vec4(shadowPoint*2.-1.,1.);
 if(mode>6.5){gl_Position=vec4(p.xy,.99999,1.);dist=0.;}
}`;
const sceneFS = `
precision mediump float;
uniform sampler2D tex,moss,shadowMap;uniform float shadowPass;uniform float mode,level,seconds;uniform vec3 mist,waterEye;uniform vec2 branchRoute;
varying mediump vec3 shadowPoint;varying vec3 wp,norm;varying vec2 tc;varying vec4 hue;varying float dist;
float visibility(vec2 delta){
 vec4 depth=texture2D(shadowMap,shadowPoint.xy+delta);
 return step(shadowPoint.z-.0034,depth.r+depth.g/255.);
}
void main(){
 if(shadowPass<.5&&mode>1.5&&mode<2.5&&dist<6.8&&abs(wp.x-waterEye.x)<2.8)discard;
 vec4 albedo=texture2D(tex,tc);if(albedo.a<.30)discard;
 if(shadowPass>.5){float z=clamp(shadowPoint.z,0.,.999);gl_FragColor=vec4(floor(z*255.)/255.,fract(z*255.),0.,1.);return;}
 if(mode>6.5){gl_FragColor=vec4((abs(level-4.)<.1||abs(level-8.)<.1)?vec3(.085,.084,.096):mix(albedo.rgb,mist,.16),1.);return;}
 if(mode>4.5&&mode<5.5){float a=1.-smoothstep(.04,.51,length(tc-.5));gl_FragColor=vec4(.09,.075,.045,a*hue.a);return;}
 float cx=1.15*sin(wp.z*.054+level*.36)+.53*sin(wp.z*.098);
 float lane=abs(wp.x-cx);
 if(mode< -1.5){
  vec2 p=wp.xz;
  vec2 wave=vec2(cos(dot(p,vec2(.83,2.14))-seconds*1.3),sin(dot(p,vec2(2.4,-1.17))+seconds*.83));
  wave+=.43*vec2(sin(p.y*4.7+p.x*1.7-seconds*1.7),cos(p.x*5.1+p.y*.9+seconds*1.2));
  vec3 n=normalize(vec3(wave.x*.068,1.,wave.y*.09)),eye=normalize(waterEye-wp);
  vec3 r=reflect(-eye,n);
  vec2 uv=vec2(.5+atan(r.x,-r.z)/3.14159,.53-r.y*.62);
  vec3 reflection=texture2D(tex,clamp(uv,0.001,.999)).rgb;
  float fresnel=.12+.76*pow(1.-max(0.,dot(n,eye)),3.);
  vec3 bed=mix(vec3(.075,.23,.20),vec3(.15,.30,.24),smoothstep(2.8,4.8,abs(wp.x-cx)));
  float glint=pow(max(0.,dot(r,normalize(vec3(-.41,.52,.73)))),72.);
  vec3 water=mix(bed,reflection,fresnel)+vec3(.78,.72,.49)*glint*.55;
  gl_FragColor=vec4(mix(water,mist,(1.-exp(-dist*.018))*.55),1.);return;
 }
 if(mode>5.5&&mode<6.5){
  vec3 weights=pow(abs(normalize(norm)),vec3(3.));weights/=max(.001,weights.x+weights.y+weights.z);
  albedo.rgb=texture2D(tex,wp.zy*.84).rgb*weights.x+texture2D(tex,wp.xz*.84).rgb*weights.y+texture2D(tex,wp.xy*.84).rgb*weights.z;
 }
 if(mode>=0.&&mode<.5){
  float branchDist=99.;
  if(abs(branchRoute.y)>.5&&wp.z>branchRoute.x-3.&&wp.z<branchRoute.x+9.){
   vec2 p=vec2(wp.x-cx,wp.z-branchRoute.x);
   for(int i=0;i<6;i++){
    float t=float(i)/6.,q=float(i+1)/6.;
    vec2 a=vec2(branchRoute.y*8.*(1.-t)*(1.-t),7.*t),b=vec2(branchRoute.y*8.*(1.-q)*(1.-q),7.*q);
    vec2 v=b-a;branchDist=min(branchDist,length(p-a-v*clamp(dot(p-a,v)/dot(v,v),0.,1.)));lane=min(lane,.15+branchDist);
   }
  }
  float edge=smoothstep(1.63,3.65,lane+.20*sin(wp.z*2.32+wp.x*1.4)+.11*sin(wp.z*4.));
  float variance=.5+.5*sin(wp.z*.27+sin(wp.x*1.6));
  albedo.rgb=mix(albedo.rgb,texture2D(tex,mat2(.81,.59,-.59,.81)*tc*.79+.39).rgb,.3*variance);
  albedo.rgb=mix(albedo.rgb,texture2D(moss,tc*1.12).rgb,edge);
  float track=(1.-smoothstep(.05,.25,abs(branchDist-.68)))*smoothstep(1.,3.,abs(wp.x-cx));
  albedo.rgb*=1.-.26*track;
 }
 vec3 normal=normalize(norm);
 float direct=dot(normal,normalize(vec3(-.48,.80,.36)));
 float patches=.50+.21*sin(wp.x*2.15+wp.z*.87)+.17*sin(wp.z*2.89-wp.x*1.50)+.12*sin(wp.x*4.65+wp.z*3.8);
 float sun=smoothstep(.33,.77,patches);
 vec3 light=vec3(.58,.65,.61)+vec3(.52,.43,.31)*max(.08,direct)*(.56+.57*sun);
 if(mode>1.5&&mode<2.5)light=vec3(.72,.79,.69)+vec3(.38,.33,.21)*(.22+sun*.66);
 if(mode>2.5&&mode<4.5)light=vec3(.97)+sun*.035;
 float lightMap=(visibility(vec2(0.))+visibility(vec2(.00098,.00049))+visibility(vec2(-.00098,.00049))+visibility(vec2(.00098,-.00049))+visibility(vec2(-.00098,-.00049)))*.2;
 if(mode<4.5||mode>5.5)light*=mix(vec3(.73,.79,.82),vec3(1.18,1.13,1.07),lightMap);
 vec3 rgb=albedo.rgb*hue.rgb*light;
 if(abs(level-4.)<.1||abs(level-8.)<.1){
  float lamp=0.;
  for(int k=-1;k<=1;k++){float n=floor(wp.z/12.)+float(k),z=n*12.+6.;
   float cx=1.15*sin(z*.054+level*.36)+.53*sin(z*.098);
   vec3 v=wp-vec3(cx+(mod(n,2.)<.5?3.85:-3.85),2.55,z);
   lamp+=(1.+.032*sin(seconds*5.+n))/(1.+.17*dot(v,v));}
  rgb=albedo.rgb*hue.rgb*(vec3(.22,.24,.29)+lamp*vec3(2.2,1.35,.61));
  if(hue.a>2.)rgb=vec3(1.0,.82,.42);
  gl_FragColor=vec4(mix(rgb,vec3(.085,.084,.096),1.-exp(-max(0.,dist-7.)*.052)),1.);return;
 }
 float fog=(1.-exp(-max(0.,dist-9.)*.033))*.88;
 gl_FragColor=vec4(mix(rgb,mist,fog),1.);
}`;
let worldRenderer = null;
function createWorldRenderer(gl) {
  const shader = (kind, src) => {
    const sh = gl.createShader(kind);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, sceneVS));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, sceneFS));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const u = Object.fromEntries([
    'tex', 'moss', 'camera', 'offset', 'lens', 'tilt', 'rot', 'scale', 'mode', 'level', 'mist',
    'shadowPass', 'shadowRange', 'shadowMap', 'seconds', 'branchRoute', 'heading', 'waterEye'
  ].map(k => [k, gl.getUniformLocation(program, k)]));
  const attrs = ['p', 'n', 'uv', 'tint'].map(n => gl.getAttribLocation(program, n));
  const textures = new Map(),
    chunks = [];
  let key = -1;
  function texture(name) {
    if (textures.has(name)) return textures.get(name);
    let im = bridgeArt[name],
      can = document.createElement('canvas');
    if (name === 'coinFace') {
      can.width = can.height = 64;
      drawTreasure(32, 32, 'coin', '#ffcb58', can.getContext('2d'));
      im = can;
    } else if (name === 'white') {
      can.width = can.height = 1;
      const c = can.getContext('2d');
      c.fillStyle = 'white';
      c.fillRect(0, 0, 1, 1);
      im = can;
    } else if (!im?.naturalWidth) return texture('white');
    // Power-of-two mipmaps prevent high-frequency shimmer on distant geometry.
    const pot = v => 2 ** Math.min(10, Math.round(Math.log2(v)));
    if (im.width & im.width - 1 || im.height & im.height - 1) {
      can.width = pot(im.width);
      can.height = pot(im.height);
      can.getContext('2d').drawImage(im, 0, 0, can.width, can.height);
      im = can;
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const tiled = ['mud', 'moss', 'bark', 'stone', 'paving', 'rockSkin'].includes(name);
    for (const dir of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, dir, tiled ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    textures.set(name, tex);
    return tex;
  }
  function mesh(data) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return {
      b,
      count: data.length / 12
    };
  }
  function layout(b) {
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    [3, 3, 2, 4].forEach((n, i) => {
      gl.enableVertexAttribArray(attrs[i]);
      gl.vertexAttribPointer(attrs[i], n, gl.FLOAT, false, 48, [0, 12, 24, 32][i]);
    });
  }
  function use(mat, mode) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture(mat));
    gl.uniform1f(u.mode, mode);
  }
  function draw(m) {
    layout(m.b);
    gl.drawArrays(gl.TRIANGLES, 0, m.count);
  }
  const dynamic = gl.createBuffer();
  function quad(tex, mode, points, color = [1, 1, 1, 1], flipped = false) {
    const data = [],
      uv = [[0, 1], [1, 1], [1, 0], [0, 0]];
    for (const i of [0, 1, 2, 0, 2, 3]) data.push(...points[i], 0, 0, 1, flipped ? 1 - uv[i][0] : uv[i][0], uv[i][1], ...color);
    use(tex, mode);
    layout(dynamic);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  const ballverts = [];
  for (let a = 0; a < 32; a++) for (let b = 0; b < 24; b++) for (const [i, j] of [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]) {
    const lon = (a + i) * Math.PI / 16,
      lat = ((b + j) / 24 - .5) * Math.PI,
      ny = Math.sin(lat),
      nx = Math.cos(lon) * Math.cos(lat),
      nz = Math.sin(lon) * Math.cos(lat);
    const irregular = 1 + .035 * Math.sin(nx * 8 + ny * 4) * Math.cos(nz * 6) + .014 * Math.cos(nz * 16 - ny * 9);
    ballverts.push(nx * irregular, ny * irregular, nz * irregular, nx, ny, nz, (a + i) / 32 * 2, (b + j) / 24, 1, 1, 1, 0);
  }
  const ball = mesh(ballverts);
  const shadowFB = gl.createFramebuffer(),
    shadowTex = gl.createTexture(),
    depthBuffer = gl.createRenderbuffer();
  gl.bindTexture(gl.TEXTURE_2D, shadowTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 2048, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  for (const axis of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, axis, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowTex, 0);
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 2048);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  const hasShadow = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const leaves = new Set(['frond', 'canopy', 'grass', 'banana']);
  function drawStatic(chunk) {
    for (const [name, m] of chunk.parts) {
      const lid = name.startsWith('lid'),
        web = name.startsWith('web');
      if (lid || web) {
        const o = bridge.hazards.find(o => o.s === Number(name.slice(3)));
        if (o?.open || o?.broken) continue;
      }
      const mat = name === 'channel' ? 'vista' + bridge.level : lid ? 'stone' : web || name === 'flame' ? 'white' : name === 'cascade' ? 'white' : name === 'ground' ? course()[3] === 'stone' ? 'paving' : 'mud' : name === 'depth' ? 'white' : name;
      use(mat, name === 'channel' ? -2 : name === 'cascade' ? -1 : name === 'ground' ? 0 : name === 'rockSkin' ? 6 : leaves.has(name) ? 2 : 1);
      draw(m);
    }
  }
  function bakeSunlight() {
    gl.useProgram(program);
    gl.uniform1f(u.shadowPass, 1);
    gl.uniform2f(u.shadowRange, -60, course()[1] + 90);
    gl.uniform1f(u.scale, 1);
    gl.uniform1f(u.rot, 0);
    gl.uniform3f(u.offset, 0, 0, 0);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture('white'));
    gl.uniform1i(u.shadowMap, 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
    gl.viewport(0, 0, 1024, 2048);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (const chunk of chunks) drawStatic(chunk);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.uniform1f(u.shadowPass, 0);
  }
  function prepare() {
    if (key === bridge.level) return;
    for (const c of chunks) for (const [, m] of c.parts) gl.deleteBuffer(m.b);
    chunks.length = 0;
    // The exit, its landing and its approach are built first. Chunk boundaries
    // are fixed in world space; moving the player never recreates scenery.
    const finish = Math.ceil((course()[1] + 18) / 12) * 12;
    for (let hi = finish; hi > -60; hi -= 12) {
      const lo = hi - 12,
        mats = worldChunk(lo, hi, bridge.level);
      chunks.push({
        lo,
        hi,
        parts: Object.entries(mats).map(([mat, verts]) => [mat, mesh(verts)])
      });
    }
    for (const k of Object.keys(bridgeArt)) if (/^(side|flip|idle|turn|run)\d+$/.test(k)) texture(k);
    if (hasShadow) bakeSunlight();else {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, texture('white'));
      gl.uniform1i(u.shadowMap, 2);
    }
    key = bridge.level;
  }
  function frame(view) {
    prepare();
    const {
      w,
      h,
      focal,
      cx,
      cy,
      cz,
      cs,
      sn
    } = view;
    const W = gl.drawingBufferWidth,
      H = gl.drawingBufferHeight;
    gl.viewport(0, 0, W, H);
    gl.useProgram(program);
    gl.uniform3f(u.camera, cx, cy, cz);
    gl.uniform3f(u.waterEye, cx, cy, cz);
    gl.uniform4f(u.lens, 2 * focal / w, 2 * focal / h, 0, 0);
    gl.uniform2f(u.tilt, cs, sn);
    gl.uniform1f(u.level, bridge.level);
    gl.uniform1f(u.seconds, bridge.time);
    gl.uniform3f(u.mist, ...[
      '#898d76', '#88977b', '#a3b4aa', '#a7a288', '#798e77', '#b8a18a', '#9eafa6', '#829f9f', '#878675',
      '#c0a18a'
    ].map(hex => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16) / 255))[bridge.level]);
    gl.uniform1i(u.tex, 0);
    gl.uniform1i(u.moss, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture('moss'));
    const route = bridge.rocks[1]?.branch;
    gl.uniform2f(u.branchRoute, route?.start || 0, route?.side || 0);
    const identity = () => {
      gl.uniform1f(u.heading, 0);
      gl.uniform3f(u.offset, 0, 0, 0);
      gl.uniform1f(u.scale, 1);
      gl.uniform1f(u.rot, 0);
    };
    identity();
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clearColor(.49, .57, .47, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthMask(false);
    quad(isCave(bridge.level) ? 'skyline' : 'vista' + bridge.level, 7, [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]]);
    gl.depthMask(true);
    for (const chunk of chunks) {
      if (chunk.lo > cz + 2 || chunk.hi < cz - 68) continue;
      drawStatic(chunk);
    }
    function shadow(x, z, r, alpha) {
      const y = terrainY(x, z) + .035,
        rz = r * .84;
      const ps = [[-r, -rz], [r, -rz], [r, rz], [-r, rz]].map(([dx, dz]) => [x + dx, Math.max(y - .10, terrainY(x + dx, z + dz) + .028), z + dz]);
      quad('white', 5, ps, [1, 1, 1, alpha]);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-1, -2);
    const wx = trailCentre(bridge.d) + bridge.x;
    if (groundAt(bridge.d, bridge.x)) shadow(wx, bridge.d, .55 + Math.max(0, bridge.y) * .10, .69 / (1 + Math.max(0, bridge.y)));
    const seen = bridge.rocks.filter(r => !r.stopped && (r.branch || r.trigger <= bridge.furthest) && r.s < cz + 2 && r.s > cz - 63);
    for (const r of seen) if (!r.fall) shadow(trailCentre(r.s) + r.x, r.s, 1.9, .71);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    for (const r of seen) {
      const x = trailCentre(r.s) + r.x;
      gl.uniform3f(u.offset, x, (r.fall ? r.rimY - 5.8 * r.fall * r.fall : terrainY(x, r.s)) + 1.47, r.s);
      gl.uniform1f(u.scale, 1.47);
      gl.uniform1f(u.heading, r.heading || 0);
      gl.uniform1f(u.rot, r.travel / 1.47);
      use('rockSkin', 1);
      draw(ball);
    }
    identity();
    const a = heroPose(),
      z = bridge.d,
      y = supportY(z, bridge.x) + bridge.y,
      height = 1.78 * (bridge.death && bridge.cause === 'rock' ? Math.max(.1, 1 - bridge.death * 2) : 1);
    const im = bridgeArt[a.key],
      ww = height * im.width / (im.height || 1),
      left = wx - a.ax * ww,
      base = y - (1 - a.ay) * height;
    quad(a.key, 3, [[left, base, z], [left + ww, base, z], [left + ww, base + height, z], [left, base + height, z]], [1, 1, 1, 0], a.flip);
    for (const [i, c] of bridge.coins.entries()) {
      if (c.taken || c.s > cz - .5 || c.s < cz - 44) continue;
      const x = trailCentre(c.s) + c.x,
        z = c.s,
        y = terrainY(x, z) + c.y,
        depth = view.screen(x, y, z)[2],
        size = 64 * view.unit * depth / focal;
      const bottom = y - size * .5 + Math.sin(bridge.time * 2 + i) * size * .045;
      quad('coinFace', 4, [[x - size / 2, bottom, z], [x + size / 2, bottom, z], [x + size / 2, bottom + size, z], [x - size / 2, bottom + size, z]]);
    }
  }
  return {
    frame,
    prepare
  };
}
const terrainLayer = $('terrain3D');
let sceneGL = null;
function open3D() {
  if (worldRenderer) return true;
  try {
    sceneGL = terrainLayer.getContext('webgl', {
      alpha: false,
      antialias: true,
      depth: true,
      powerPreference: 'high-performance'
    });
    if (sceneGL) worldRenderer = createWorldRenderer(sceneGL);
  } catch (e) {
    console.error(e);
  }
  return !!worldRenderer;
}
function paintBridge() {
  const w = bridgeCanvas.clientWidth,
    h = bridgeCanvas.clientHeight,
    dpr = Math.min(devicePixelRatio || 1, 1.6);
  const W = Math.round(w * dpr),
    H = Math.round(h * dpr);
  if (terrainLayer.width !== W || terrainLayer.height !== H) {
    terrainLayer.width = W;
    terrainLayer.height = H;
  }
  if (bridgeCanvas.width !== W || bridgeCanvas.height !== H) {
    bridgeCanvas.width = W;
    bridgeCanvas.height = H;
  }
  const view = jungleView();
  worldRenderer.frame(view);
  brush.setTransform(dpr, 0, 0, dpr, 0, 0);
  brush.clearRect(0, 0, w, h);
  const [hx, hy] = view.proj(bridge.d, bridge.x, bridge.y + 1.04),
    unit = view.unit;
  brush.save();
  brush.scale(unit, unit);
  drawPickupFeedback(brush, {
    pickups: bridge.pickups,
    points: bridge.points,
    combo: bridge.combo,
    lastPickup: bridge.lastPickup,
    elapsed: bridge.time,
    index: 0,
    game: {
      p: {
        x: hx / unit,
        y: hy / unit + 94
      },
      scale: 1
    }
  }, w / unit - 110 - 49 / unit, 48);
  brush.restore();
  const phrase = bridge.death ? bridge.cause === 'pit' ? 'Navid föll ner!' : bridge.cause === 'spikes' ? 'Spikfällan slog upp!' : 'Stenblocket hann ikapp!' : bridge.stun > .12 ? 'Du snubblade!' : bridge.checkpointNotice > bridge.time ? 'Kontrollpunkt ' + (bridge.checkpoint.index + 1) + ' · ' + (bridge.started ? 'Sparad' : 'Fortsätt härifrån') : !bridge.started ? matchMedia('(any-pointer:coarse)').matches ? 'Springer automatiskt · Styr med pilarna och hoppa' : '↓ Spring mot kameran · ← → Styr · Hoppa med mellanslag · Tryck igen för dubbelhopp' : '';
  if ($('bridgeNote').textContent !== phrase) $('bridgeNote').textContent = phrase;
  updateChaseHud();
}
terrainLayer.addEventListener('webglcontextlost', e => {
  e.preventDefault();
  worldRenderer = null;
  if (bridge.active) openMenu();
});
terrainLayer.addEventListener('webglcontextrestored', () => {
  sceneGL = null;
  worldRenderer = null;
});
