// Sky, fog and lights share one linear-color palette so the distant terrain
// blends into the same horizon on sunrise, during storms and underwater.
const WEATHER = {
  clear: [0.03, 0.0027], cloud: [0.53, 0.0038], rain: [0.79, 0.0064],
  snow: [0.63, 0.0078], fog: [0.61, 0.015], storm: [0.94, 0.009],
};

function makeSkyMap(T) {
  // Periodic, multi-scale noise. Baked once so mobile GPUs can shade clouds
  // with two texture reads. The blue channel contains a separate star field.
  let state = 719;
  function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  const grids = [4, 8, 16, 32].map(n => ({n, p: Float32Array.from({length: n*n}, random)}));
  const size = 256;
  const data = new Uint8Array(size*size*4);
  const smooth = t => t*t*(3-2*t);
  const mix = (a,b,t) => a+(b-a)*t;
  function value({n,p},x,y) {
    const i = Math.floor(x*n), j = Math.floor(y*n);
    const fx = smooth(x*n-i), fy = smooth(y*n-j);
    return mix(mix(p[j*n+i], p[j*n+(i+1)%n], fx),
      mix(p[((j+1)%n)*n+i], p[((j+1)%n)*n+(i+1)%n], fx), fy);
  }
  for (let y=0; y<size; y++) {
    for (let x=0; x<size; x++) {
      const i = (y*size+x)*4;
      let n = 0;
      for (let k=0; k<grids.length; k++) n += value(grids[k],x/size,y/size) * [.48,.29,.16,.07][k];
      data[i] = Math.round(n*255);
      data[i+1] = Math.round(value(grids[1],x/size,y/size)*255);
      data[i+2] = random() < .023 ? 110 + random()*145 : 0;
      data[i+3] = 255;
    }
  }
  const tex = new T.DataTexture(data,size,size);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.magFilter = tex.minFilter = T.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

const skyVertex = `
varying vec3 viewDirection;
void main() {
  viewDirection = position;
  vec4 projected = projectionMatrix * modelViewMatrix * vec4(position,1.);
  gl_Position = vec4(projected.xy, projected.w * .99999, projected.w);
}`;

const skyFragment = `
uniform sampler2D noiseMap;
uniform vec3 zenith, horizon, sunDirection;
uniform float lightLevel, weatherCover, elapsed, cloudsOn;
varying vec3 viewDirection;
void main() {
  vec3 d = normalize(viewDirection);
  float altitude = max(d.y, 0.);
  vec3 sky = mix(horizon, zenith, smoothstep(-.04,.89,d.y));
  vec2 sphere = vec2(atan(d.z,d.x)*.159155, asin(clamp(d.y,-1.,1.))*.31831);
  float stars = texture2D(noiseMap, sphere*vec2(3.,1.7)).b;
  sky += vec3(.71,.82,1.) * smoothstep(.22,.9,stars) * (1.-lightLevel)
      * smoothstep(.02,.36,d.y) * (1.-weatherCover);
  float sunDot = max(0.,dot(d,sunDirection));
  float moonDot = max(0.,dot(d,-sunDirection));
  float visible = smoothstep(-.09,.015,d.y)*(1.-.82*weatherCover);
  vec3 sunTint = mix(vec3(1.,.43,.17),vec3(1.,.86,.57),smoothstep(.0,.50,sunDirection.y));
  sky += sunTint*(.23*pow(sunDot,20.) + .47*pow(sunDot,230.)
                 + 1.4*smoothstep(.99922,.99969,sunDot))*visible;
  sky += vec3(.54,.69,.95)*(.105*pow(moonDot,85.)
                 + .8*smoothstep(.99938,.99973,moonDot))*visible;
  if (d.y>0. && cloudsOn>.5) {
    vec2 uv = d.xz / (d.y+.15) * .105 + vec2(elapsed*.0017,elapsed*.0008);
    float n = texture2D(noiseMap,uv).r*.76 + texture2D(noiseMap,uv*2.1+.34).g*.24;
    float threshold = mix(.605,.32,weatherCover);
    float cloud = smoothstep(threshold,threshold+.10,n)*smoothstep(0.,.14,d.y);
    float rim = 1.-smoothstep(threshold+.04,threshold+.21,n);
    vec3 cloudColor = mix(vec3(.036,.052,.083),vec3(.86,.88,.86),lightLevel);
    cloudColor *= mix(1.,.44,weatherCover);
    cloudColor += sunTint*rim*pow(sunDot,3.)*.23*lightLevel;
    sky = mix(sky,cloudColor,cloud*.90);
  }
  gl_FragColor = vec4(sky,1.);
  #include <colorspace_fragment>
}`;

function precipitation(T) {
  const count = 650;
  const seeds = new Float32Array(count*3);
  let random = 519;
  for (let i=0; i<seeds.length; i++) {
    random = Math.imul(random, 16807) >>> 0;
    seeds[i] = random / 4294967296;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(seeds,3));
  const uniforms = {elapsed:{value:0}, snow:{value:0}, origin:{value:new T.Vector3()}};
  const mat = new T.ShaderMaterial({
    uniforms, transparent:true, depthWrite:false,
    vertexShader:`
      uniform float elapsed,snow;
      uniform vec3 origin;
      varying float alpha;
      void main() {
        vec3 volume = vec3(17.,12.,17.);
        vec3 drift = vec3(elapsed*mix(1.6,.75,snow), -elapsed*mix(14.,2.35,snow),0.);
        drift.x += snow * sin(elapsed + position.z*37.)*.45;
        vec3 local = mod(position*volume + drift-origin,volume)-volume*.5;
        vec4 view = viewMatrix * vec4(origin + local,1.);
        float z = max(1.,-view.z);
        alpha = smoothstep(.6,2.,z) * (1.-smoothstep(5.,9.,length(local.xz)));
        gl_PointSize = clamp(mix(30.,17.,snow)/z,1.,8.);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader:`
      uniform float snow;
      varying float alpha;
      void main() {
        vec2 uv = gl_PointCoord * 2.-1.;
        float streak = 1.-smoothstep(.09,.45,abs(uv.x + uv.y*.19));
        float flake = 1.-smoothstep(.24,1.,length(uv));
        gl_FragColor = vec4(mix(vec3(.57,.72,.79),vec3(.89,.93,.94),snow),
                            mix(streak,flake,snow)*alpha*.67);
        #include <colorspace_fragment>
      }`,
  });
  const obj = new T.Points(geo,mat);
  obj.frustumCulled = false;
  obj.visible = false;
  obj.renderOrder = 2;
  return obj;
}

export function createSky(scene) {
  const T = globalThis.THREE;
  const tex = makeSkyMap(T);
  const color = hex => new T.Color(hex);
  const palette = {
    nightTop:color(0x101b35), dayTop:color(0x639fcf),
    nightEdge:color(0x344660), dayEdge:color(0xd5e6dd), sunset:color(0xf2a67d),
    duskTop:color(0x6a7baf), storm:color(0x8095a0), stormNight:color(0x263642),
    sun:color(0xffedd0), dusk:color(0xffab78), moon:color(0xafc3ea),
    cave:color(0x222b35), water:color(0x477e84), ground:color(0xa79574),
  };
  const uniforms = {noiseMap:{value:tex}, elapsed:{value:0}, weatherCover:{value:0},
    cloudsOn:{value:1}, lightLevel:{value:1}, sunDirection:{value:new T.Vector3()},
    zenith:{value:new T.Color()}, horizon:{value:new T.Color()}};
  const dome = new T.Mesh(new T.SphereGeometry(1,32,18),
    new T.ShaderMaterial({uniforms, vertexShader:skyVertex, fragmentShader:skyFragment,
      side:T.BackSide,depthWrite:false,depthTest:false}));
  dome.renderOrder = -10000;
  dome.frustumCulled = false;
  const hemi = new T.HemisphereLight(0xe3eff6,0xa79574,1);
  const sun = new T.DirectionalLight(0xffedd0,1);
  for (const prop of ['right','top']) sun.shadow.camera[prop] = 28;
  for (const prop of ['left','bottom']) sun.shadow.camera[prop] = -28;
  sun.shadow.camera.near = .5;
  sun.shadow.camera.far = 110;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.bias = -.0004;
  sun.shadow.normalBias = .025;
  const drops = precipitation(T);
  const previousFog = scene.fog, previousBackground = scene.background;
  const fog = new T.FogExp2(0xc7dedb,.003);
  const shade = new T.Color();
  scene.background = new T.Color();
  scene.fog = fog;
  scene.add(dome,hemi,sun,sun.target,drops);
  const clock = performance.now();
  const smooth = T.MathUtils.smoothstep;
  function update({position,time=.5,weather='clear',quality=1,underground=false,underwater=false}) {
    const elapsed = (performance.now()-clock)/1000;
    const [cover,density] = WEATHER[weather] || WEATHER.clear;
    const orbit = (time-.25)*Math.PI*2;
    const direction = uniforms.sunDirection.value.set(Math.cos(orbit)*.91,
      Math.sin(orbit),Math.cos(orbit)*.41).normalize();
    const day = smooth(direction.y,-.18,.30);
    const dusk = (1-smooth(Math.abs(direction.y),.01,.40))*(1-cover*.80);
    const horizon = uniforms.horizon.value.copy(palette.nightEdge).lerp(palette.dayEdge,day)
      .lerp(palette.sunset,dusk*.88);
    const zenith = uniforms.zenith.value.copy(palette.nightTop).lerp(palette.dayTop,day)
      .lerp(palette.duskTop,dusk*.5);
    shade.copy(palette.stormNight).lerp(palette.storm,day);
    zenith.lerp(shade,cover*.8);
    horizon.lerp(shade,cover*.85);
    uniforms.lightLevel.value = day;
    uniforms.elapsed.value = elapsed;
    uniforms.weatherCover.value = cover;
    uniforms.cloudsOn.value = quality > 0 || cover > .5 ? 1 : 0;
    dome.position.copy(position);
    const hidden = underground || underwater;
    dome.visible = !hidden;
    fog.color.copy(underwater ? palette.water : underground ? palette.cave : horizon);
    scene.background.copy(fog.color);
    fog.density = underwater ? .105 : underground ? .037 : density;
    hemi.color.copy(hidden ? palette.moon : horizon);
    hemi.groundColor.copy(palette.ground);
    hemi.intensity = underground ? .48 : .62+day*.78;
    // The moon provides a weaker opposing key when the sun passes the horizon.
    sun.position.copy(direction).multiplyScalar(direction.y>0 ? 53 : -53).add(position);
    sun.target.position.copy(position);
    sun.color.copy(direction.y>0 ? palette.sun : palette.moon);
    if (direction.y>0) sun.color.lerp(palette.dusk,dusk);
    sun.intensity = hidden ? .07 : (.23+1.9*day)*(1-cover*.62);
    sun.castShadow = quality>=2 && !hidden;
    // One broad, distant illumination per storm interval.
    if (!hidden && weather==='storm') {
      const pulse = Math.max(0,1-Math.abs(elapsed%26-17)/.38);
      hemi.intensity += pulse*.46;
      horizon.lerp(palette.dayEdge,pulse*.24);
    }
    drops.visible = !hidden && ['rain','storm','snow'].includes(weather);
    if (drops.visible) {
      drops.material.uniforms.elapsed.value = elapsed;
      drops.material.uniforms.snow.value = Number(weather==='snow');
      drops.material.uniforms.origin.value.copy(position);
      drops.geometry.setDrawRange(0,[100,230,450,650][quality] || 230);
    }
  }
  function dispose() {
    scene.remove(dome,hemi,sun,sun.target,drops);
    for (const mesh of [dome,drops]) { mesh.geometry.dispose(); mesh.material.dispose(); }
    tex.dispose(); sun.shadow.dispose();
    scene.background = previousBackground; scene.fog = previousFog;
  }
  return {update,dispose};
}
