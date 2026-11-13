"use strict";

const SCENERY = {
  "01_palatspassagen": {
    "fire": [[109, 235, 14, 29], [306, 291, 16, 28], [800, 133, 12, 19]],
    "jets": [{
      "x": 183,
      "y": 359,
      "w": 70,
      "h": 112,
      "row": 0,
      "rate": 24.39,
      "phase": 50,
      "baseY": 0
    }, {
      "x": 573,
      "y": 475,
      "w": 79,
      "h": 108,
      "row": 896,
      "rate": 27.92,
      "phase": 18,
      "baseY": 112
    }, {
      "x": 1570,
      "y": 190,
      "w": 60,
      "h": 75,
      "row": 1760,
      "rate": 27.96,
      "phase": 27,
      "baseY": 220
    }],
    "bounds": [["fall", 420, 203, 28, 98], ["fall", 437, 289, 17, 27]],
    "map": "assets/images/palace/rooms/01_palatspassagen/map.png",
    "flames": "assets/images/palace/rooms/01_palatspassagen/flames.webp",
    "hearth": "assets/images/palace/rooms/01_palatspassagen/hearth.png"
  },
  "02_rosenterrassen": {
    "fire": [[53, 267, 15, 27], [699, 214, 12, 22]],
    "jets": [{
      "x": 69,
      "y": 431,
      "w": 74,
      "h": 104,
      "row": 0,
      "rate": 26.46,
      "phase": 52,
      "baseY": 0
    }, {
      "x": 1368,
      "y": 341,
      "w": 60,
      "h": 86,
      "row": 832,
      "rate": 24.04,
      "phase": 5,
      "baseY": 104
    }],
    "bounds": [
      ["fall", 289, 174, 18, 29],
      ["fall", 295, 222, 12, 22],
      ["fall", 572, 203, 21, 44],
      ["fall", 413, 256, 26, 19],
      ["fall", 402, 271, 56, 26],
      ["fall", 365, 402, 30, 68],
      ["water", 372, 285, 120, 18]
    ],
    "map": "assets/images/palace/rooms/02_rosenterrassen/map.png",
    "flames": "assets/images/palace/rooms/02_rosenterrassen/flames.webp",
    "hearth": "assets/images/palace/rooms/02_rosenterrassen/hearth.png"
  },
  "03_vattenpalatset": {
    "fire": [[43, 251, 14, 30], [370, 272, 15, 24], [743, 274, 13, 25]],
    "jets": [{
      "x": 51,
      "y": 391,
      "w": 70,
      "h": 115,
      "row": 0,
      "rate": 27.91,
      "phase": 40,
      "baseY": 0
    }, {
      "x": 703,
      "y": 453,
      "w": 74,
      "h": 93,
      "row": 920,
      "rate": 25.71,
      "phase": 38,
      "baseY": 115
    }, {
      "x": 1454,
      "y": 454,
      "w": 65,
      "h": 97,
      "row": 1664,
      "rate": 24.73,
      "phase": 19,
      "baseY": 208
    }],
    "bounds": [
      ["fall", 440, 160, 60, 96],
      ["fall", 499, 193, 34, 80],
      ["fall", 625, 214, 39, 53],
      ["fall", 497, 273, 75, 21],
      ["water", 225, 292, 82, 42],
      ["water", 463, 278, 215, 55],
      ["water", 159, 371, 60, 77],
      ["water", 247, 367, 56, 87],
      ["water", 339, 368, 64, 102],
      ["water", 473, 364, 60, 106],
      ["water", 553, 366, 50, 104],
      ["water", 631, 373, 61, 97]
    ],
    "map": "assets/images/palace/rooms/03_vattenpalatset/map.png",
    "flames": "assets/images/palace/rooms/03_vattenpalatset/flames.webp",
    "hearth": "assets/images/palace/rooms/03_vattenpalatset/hearth.png"
  },
  "04_mosaikgalleriet": {
    "fire": [[144, 294, 17, 33], [389, 239, 15, 27], [735, 238, 18, 30]],
    "jets": [{
      "x": 246,
      "y": 461,
      "w": 84,
      "h": 127,
      "row": 0,
      "rate": 27.5,
      "phase": 38,
      "baseY": 0
    }, {
      "x": 741,
      "y": 374,
      "w": 74,
      "h": 104,
      "row": 1016,
      "rate": 27.55,
      "phase": 59,
      "baseY": 127
    }, {
      "x": 1426,
      "y": 361,
      "w": 89,
      "h": 115,
      "row": 1848,
      "rate": 24.93,
      "phase": 20,
      "baseY": 231
    }],
    "bounds": [
      ["fall", 273, 219, 16, 28],
      ["fall", 287, 200, 16, 27],
      ["fall", 526, 219, 24, 38],
      ["fall", 593, 352, 27, 59]
    ],
    "map": "assets/images/palace/rooms/04_mosaikgalleriet/map.png",
    "flames": "assets/images/palace/rooms/04_mosaikgalleriet/flames.webp",
    "hearth": "assets/images/palace/rooms/04_mosaikgalleriet/hearth.png"
  },
  "05_akvedukten": {
    "fire": [[92, 237, 12, 25], [376, 252, 17, 24], [706, 244, 15, 27]],
    "jets": [{
      "x": 154,
      "y": 378,
      "w": 60,
      "h": 97,
      "row": 0,
      "rate": 25.82,
      "phase": 63,
      "baseY": 0
    }, {
      "x": 710,
      "y": 413,
      "w": 84,
      "h": 93,
      "row": 776,
      "rate": 27.58,
      "phase": 23,
      "baseY": 97
    }, {
      "x": 1375,
      "y": 385,
      "w": 74,
      "h": 104,
      "row": 1520,
      "rate": 26.93,
      "phase": 63,
      "baseY": 190
    }],
    "bounds": [
      ["fall", 372, 92, 15, 51],
      ["fall", 428, 124, 22, 43],
      ["fall", 363, 159, 44, 60],
      ["fall", 283, 211, 26, 70],
      ["fall", 615, 202, 26, 62],
      ["fall", 582, 210, 35, 71],
      ["fall", 629, 172, 21, 40],
      ["fall", 563, 385, 24, 49],
      ["water", 438, 244, 84, 36],
      ["water", 164, 350, 149, 120],
      ["water", 508, 295, 145, 175]
    ],
    "map": "assets/images/palace/rooms/05_akvedukten/map.png",
    "flames": "assets/images/palace/rooms/05_akvedukten/flames.webp",
    "hearth": "assets/images/palace/rooms/05_akvedukten/hearth.png"
  },
  "06_hangande_tradgardar": {
    "fire": [[126, 247, 9, 17], [290, 323, 14, 22], [365, 210, 10, 16], [817, 179, 13, 24]],
    "jets": [{
      "x": 229,
      "y": 428,
      "w": 46,
      "h": 67,
      "row": 0,
      "rate": 24.4,
      "phase": 49,
      "baseY": 0
    }, {
      "x": 545,
      "y": 563,
      "w": 70,
      "h": 86,
      "row": 536,
      "rate": 25.97,
      "phase": 60,
      "baseY": 67
    }, {
      "x": 705,
      "y": 363,
      "w": 50,
      "h": 64,
      "row": 1224,
      "rate": 25.13,
      "phase": 56,
      "baseY": 153
    }, {
      "x": 1602,
      "y": 265,
      "w": 65,
      "h": 93,
      "row": 1736,
      "rate": 25.64,
      "phase": 32,
      "baseY": 217
    }],
    "bounds": [
      ["fall", 405, 168, 30, 45],
      ["fall", 462, 189, 24, 36],
      ["fall", 273, 223, 31, 63],
      ["fall", 181, 228, 19, 23],
      ["fall", 166, 248, 56, 36],
      ["fall", 149, 279, 94, 36],
      ["water", 127, 302, 152, 36]
    ],
    "map": "assets/images/palace/rooms/06_hangande_tradgardar/map.png",
    "flames": "assets/images/palace/rooms/06_hangande_tradgardar/flames.webp",
    "hearth": "assets/images/palace/rooms/06_hangande_tradgardar/hearth.png"
  },
  "08_klocktornet": {
    "fire": [[71, 288, 21, 37], [427, 211, 16, 27], [667, 213, 14, 27]],
    "jets": [{
      "x": 91,
      "y": 436,
      "w": 103,
      "h": 141,
      "row": 0,
      "rate": 26.25,
      "phase": 42,
      "baseY": 0
    }, {
      "x": 815,
      "y": 318,
      "w": 79,
      "h": 104,
      "row": 1128,
      "rate": 26.79,
      "phase": 21,
      "baseY": 141
    }, {
      "x": 1299,
      "y": 321,
      "w": 70,
      "h": 104,
      "row": 1960,
      "rate": 25.46,
      "phase": 41,
      "baseY": 245
    }],
    "bounds": [],
    "map": "assets/images/palace/rooms/08_klocktornet/map.png",
    "flames": "assets/images/palace/rooms/08_klocktornet/flames.webp",
    "hearth": "assets/images/palace/rooms/08_klocktornet/hearth.png"
  },
  "09_kungabron": {
    "fire": [[42, 207, 12, 26], [378, 197, 14, 25], [529, 197, 12, 24]],
    "jets": [{
      "x": 54,
      "y": 313,
      "w": 60,
      "h": 101,
      "row": 0,
      "rate": 27.51,
      "phase": 50,
      "baseY": 0
    }, {
      "x": 721,
      "y": 296,
      "w": 70,
      "h": 97,
      "row": 808,
      "rate": 27.2,
      "phase": 45,
      "baseY": 101
    }, {
      "x": 1028,
      "y": 300,
      "w": 60,
      "h": 93,
      "row": 1584,
      "rate": 26.45,
      "phase": 44,
      "baseY": 198
    }],
    "bounds": [
      ["fall", 321, 87, 25, 68],
      ["fall", 329, 193, 15, 17],
      ["fall", 266, 348, 36, 74],
      ["fall", 496, 412, 24, 58],
      ["fall", 164, 402, 16, 49]
    ],
    "map": "assets/images/palace/rooms/09_kungabron/map.png",
    "flames": "assets/images/palace/rooms/09_kungabron/flames.webp",
    "hearth": "assets/images/palace/rooms/09_kungabron/hearth.png"
  },
  "10_solporten": {
    "fire": [[81, 243, 17, 32], [190, 232, 11, 19], [420, 233, 12, 21], [587, 220, 13, 23]],
    "jets": [{
      "x": 120,
      "y": 365,
      "w": 84,
      "h": 123,
      "row": 0,
      "rate": 26.23,
      "phase": 11,
      "baseY": 0
    }, {
      "x": 353,
      "y": 389,
      "w": 55,
      "h": 75,
      "row": 984,
      "rate": 25.79,
      "phase": 27,
      "baseY": 123
    }, {
      "x": 810,
      "y": 384,
      "w": 60,
      "h": 82,
      "row": 1584,
      "rate": 24.38,
      "phase": 45,
      "baseY": 198
    }, {
      "x": 1142,
      "y": 350,
      "w": 65,
      "h": 90,
      "row": 2240,
      "rate": 25.47,
      "phase": 55,
      "baseY": 280
    }],
    "bounds": [
      ["fall", 348, 99, 16, 27],
      ["fall", 426, 161, 22, 55],
      ["fall", 293, 200, 17, 34],
      ["fall", 260, 228, 87, 35],
      ["fall", 250, 257, 106, 14],
      ["water", 181, 263, 289, 66]
    ],
    "map": "assets/images/palace/rooms/10_solporten/map.png",
    "flames": "assets/images/palace/rooms/10_solporten/flames.webp",
    "hearth": "assets/images/palace/rooms/10_solporten/hearth.png"
  }
};
const artWidth = 836,
  artHeight = 470;
const palaceVertex = `
attribute vec2 pos;
varying vec2 uv;
void main(){
  uv=vec2(pos.x*.5+.5,.5-pos.y*.5);
  gl_Position=vec4(pos,0.,1.);
}`;
const palaceFragment = `
precision highp float;
varying vec2 uv;
uniform sampler2D plate,field;
uniform float seconds;
const vec2 size=vec2(836.,470.);
vec3 original(vec2 p){return texture2D(plate,p/size).rgb;}
vec3 masks(vec2 p){return texture2D(field,p/size).rgb;}
float hash(vec2 p){
  vec3 v=fract(vec3(p.xyx)*vec3(.1031,.0973,.1099));
  v+=dot(v,v.yzx+33.33);
  return fract((v.x+v.y)*v.z);
}
float noise(vec2 p){
  vec2 k=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(hash(k),hash(k+vec2(1.,0.)),f.x),
             mix(hash(k+vec2(0.,1.)),hash(k+1.),f.x),f.y);
}
vec3 sampleWater(vec2 p,vec3 base){
  return mix(base,original(p),masks(p).g);
}
void main(){
  vec2 p=uv*size;
  vec3 m=masks(p),base=original(p),color=base;
  if(m.g>.001){
    // The red field is time of flight from the lip. Rivulets lengthen as they fall.
    float travel=m.r*1.7, flow=travel-seconds;
    float curtain=noise(vec2(p.x*.14,flow*3.15));
    float filament=noise(vec2(p.x*.57+curtain*.8,flow*6.6));
    vec2 q=p+vec2((curtain-.5)*1.5+(filament-.5)*.52,0.)*m.g;
    float phase=seconds*1.65+.10*noise(vec2(p.x*.06,0.));
    float a=fract(phase),b=fract(phase+.5);
    float stride=7.0+23.*travel;
    vec3 carried=mix(sampleWater(q-vec2(0.,(b-.5)*stride),base),
                     sampleWater(q-vec2(0.,(a-.5)*stride),base),1.-abs(2.*a-1.));
    float aeration=(curtain-.5)*.115+(filament-.5)*.075;
    float impact=max(0.,m.g-masks(p+vec2(0.,2.5)).g)*smoothstep(.08,.25,travel);
    float spray=impact*.105*smoothstep(.36,.83,filament);
    color=mix(base,carried+vec3(.70,.94,1.)*(aeration+spray),m.g);
  }
  if(m.b>.001){
    // Two crossing wave trains refract existing reflections with differing slopes.
    float t=seconds,bank=noise(p*vec2(.028,.061));
    float s1=sin(p.y*.67+p.x*.034-t*2.8+2.6*bank);
    float s2=sin(p.y*.31-p.x*.062-t*1.73+1.4*sin(p.x*.037-t*.31));
    float cap=noise(vec2(p.x*.12+t*.29,p.y*.64-t*.83));
    vec2 q=p+m.b*vec2(1.52*s1+.76*s2,(.62*s2+.23*s1)*(1.+bank*.4));
    vec3 reflected=mix(base,original(q),masks(q).b);
    float glint=.055*smoothstep(.76,.99,.63*s1+.37*s2)*smoothstep(.36,.8,cap);
    color=mix(color,reflected*(1.+.021*s1+.013*s2)+glint*vec3(.75,.95,1.),m.b);
  }
  gl_FragColor=vec4(color,1.);
}
`;
function makePalaceRenderer(surface) {
  const gl = surface.getContext('webgl', {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false
  });
  if (!gl) return null;
  const program = gl.createProgram();
  for (const [type, code] of [[gl.VERTEX_SHADER, palaceVertex], [gl.FRAGMENT_SHADER, palaceFragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const vertex = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uniform = name => gl.getUniformLocation(program, name);
  const clock = uniform('seconds');
  const textures = ['plate', 'field'].map((name, unit) => {
    gl.uniform1i(uniform(name), unit);
    gl.activeTexture(gl.TEXTURE0 + unit);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const setting of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, setting, gl.CLAMP_TO_EDGE);
    for (const setting of [gl.TEXTURE_MAG_FILTER, gl.TEXTURE_MIN_FILTER]) gl.texParameteri(gl.TEXTURE_2D, setting, gl.LINEAR);
    return texture;
  });
  let current = '';
  return function paint(room, time) {
    if (room.key !== current) {
      const sources = [images[room.key], flowImages[room.key]];
      textures.forEach((texture, unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, unit === 1 ? gl.NONE : gl.BROWSER_DEFAULT_WEBGL);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, sources[unit]);
      });
      current = room.key;
    }
    gl.uniform1f(clock, time);
    gl.viewport(0, 0, surface.width, surface.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
// Use masked source-image patches on devices without a working WebGL context.
function makePaintSurface(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function makeFlowTexture() {
  // Overlapping coherent noise at two scales makes elongated, irregular spray ribbons.
  const side = 128,
    c = makePaintSurface(side, side),
    g = c.getContext('2d'),
    pic = g.createImageData(side, side);
  function sample(x, y, n) {
    const a = x * n / side,
      b = y * n / side,
      i = Math.floor(a),
      j = Math.floor(b);
    const ease = u => u * u * (3 - 2 * u),
      u = ease(a - i),
      v = ease(b - j);
    function hash(dx, dy) {
      const bits = Math.imul((i + dx) % n + 31, 73856093) ^ Math.imul((j + dy) % n + 23, 19349663);
      return (Math.imul(bits ^ bits >>> 13, 1274126177) >>> 0) / 4294967296;
    }
    return ((1 - u) * hash(0, 0) + u * hash(1, 0)) * (1 - v) + ((1 - u) * hash(0, 1) + u * hash(1, 1)) * v;
  }
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const value = 255 * (sample(x, y, 16) * .61 + sample(x, y, 32) * .39),
      p = (y * side + x) * 4;
    pic.data[p] = pic.data[p + 1] = pic.data[p + 2] = value;
    pic.data[p + 3] = 255;
  }
  g.putImageData(pic, 0, 0);
  return c;
}
function makeCanvasPainter(surface) {
  const g = surface.getContext('2d');
  g.scale(surface.width / artWidth, surface.height / artHeight);
  const noise = makeFlowTexture();
  const overlay = makePaintSurface(surface.width, surface.height),
    water = overlay.getContext('2d');
  const cut = makePaintSurface(surface.width, surface.height),
    cutCtx = cut.getContext('2d');
  let current = '',
    pieces = [];
  function prepare(room) {
    const map = makePaintSurface(artWidth, artHeight),
      mg = map.getContext('2d');
    mg.drawImage(flowImages[room.key], 0, 0);
    const pixels = mg.getImageData(0, 0, artWidth, artHeight).data;
    // Final alpha is sampled at the same native resolution as the source plate.
    cutCtx.drawImage(flowImages[room.key], 0, 0, cut.width, cut.height);
    const combined = cutCtx.getImageData(0, 0, cut.width, cut.height);
    for (let i = 0; i < combined.data.length; i += 4) combined.data[i + 3] = Math.min(255, Math.max(combined.data[i + 1], combined.data[i + 2]) * 4);
    cutCtx.putImageData(combined, 0, 0);
    pieces = SCENERY[room.key].bounds.map(([kind, x, y, w, h]) => {
      const mask = makePaintSurface(w, h),
        m = mask.getContext('2d'),
        alpha = m.createImageData(w, h);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const p = ((y + j) * artWidth + x + i) * 4;
        alpha.data[(j * w + i) * 4 + 3] = pixels[p + (kind === 'fall' ? 1 : 2)];
      }
      m.putImageData(alpha, 0, 0);
      const tile = makePaintSurface(w * 2, h * 2);
      return {
        kind,
        x,
        y,
        w,
        h,
        mask,
        tile,
        t: tile.getContext('2d')
      };
    });
    current = room.key;
  }
  return function paint(room, time) {
    if (current !== room.key) prepare(room);
    const ref = images[room.key];
    g.drawImage(ref, 0, 0, artWidth, artHeight);
    water.setTransform(1, 0, 0, 1, 0, 0);
    water.clearRect(0, 0, overlay.width, overlay.height);
    water.scale(surface.width / artWidth, surface.height / artHeight);
    for (const {
      kind,
      x,
      y,
      w,
      h,
      mask,
      tile,
      t
    } of pieces) {
      t.setTransform(2, 0, 0, 2, 0, 0);
      t.clearRect(0, 0, w, h);
      for (let j = 0; j < h; j += 2) {
        const row = Math.min(2, h - j),
          py = y + j;
        function strip(dx, dy) {
          t.drawImage(ref, (x + dx) * 2, (py + dy) * 941 / 470, w * 2, row * 941 / 470, 0, j, w, row);
        }
        if (kind === 'fall') {
          const transit = (Math.sqrt(324 + 180 * j) - 18) / 90;
          const phase = time * 1.65 + .09 * Math.sin(x * .04),
            a = phase % 1,
            b = (phase + .5) % 1;
          const stride = 7 + 23 * transit,
            dx = .56 * Math.sin(transit * 7 - time * 7 + x * .31);
          strip(dx, -(b - .5) * stride);
          t.globalAlpha = 1 - Math.abs(a * 2 - 1);
          strip(dx, -(a - .5) * stride);
          t.globalAlpha = 1;
        } else {
          const wave = Math.sin(py * .67 + x * .034 - time * 2.8) + .49 * Math.sin(py * .31 - x * .062 - time * 1.73);
          strip(1.35 * wave, .62 * Math.sin(py * .31 - x * .062 - time * 1.73));
        }
      }
      if (kind === 'fall') {
        const pattern = t.createPattern(noise, 'repeat');
        t.save();
        t.globalCompositeOperation = 'soft-light';
        t.globalAlpha = .21;
        t.beginPath();
        t.rect(0, 0, w, h);
        t.clip();
        const shift = time * (22 + Math.sqrt(h) * 1.6) % 256;
        t.translate(-x % 48, shift - 256);
        t.scale(.375, 2);
        t.fillStyle = pattern;
        t.fillRect(0, 0, (w + 48) / .375, (h + 256) / 2);
        t.restore();
      }
      t.globalCompositeOperation = 'destination-in';
      t.drawImage(mask, 0, 0, w, h);
      t.globalCompositeOperation = 'source-over';
      water.drawImage(tile, x, y, w, h);
    }
    water.setTransform(1, 0, 0, 1, 0, 0);
    water.globalCompositeOperation = 'destination-in';
    water.drawImage(cut, 0, 0);
    water.globalCompositeOperation = 'source-over';
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(overlay, 0, 0);
    g.restore();
  };
}
// Rebuild every flame over its stationary clean plate. Additive sprites contain
// only emitted light. Interpolating exposures keeps the flame tips continuous.
function fuelNoise(t, seed) {
  const n = Math.floor(t),
    f = t - n,
    s = f * f * (3 - 2 * f);
  function value(k) {
    let v = Math.imul(k + seed, 0x45d9f3b);
    v = Math.imul(v ^ v >>> 16, 0x45d9f3b);
    return ((v ^ v >>> 16) >>> 0) / 4294967296;
  }
  return value(n) * (1 - s) + value(n + 1) * s;
}
function makeFirePainter(surface) {
  const g = surface.getContext('2d');
  let current = '',
    burners = [];
  function create(key) {
    return SCENERY[key].jets.map((jet, i) => {
      const {
          x,
          y,
          w,
          h,
          baseY
        } = jet,
        patch = makePaintSurface(w, h),
        p = patch.getContext('2d');
      p.drawImage(images[key], x, y, w, h, 0, 0, w, h);
      p.drawImage(hearthImages[key], 0, baseY, w, h, 0, 0, w, h);
      const light = makePaintSurface(w, h),
        split = makePaintSurface(w, h),
        sg = split.getContext('2d');
      const feather = sg.createLinearGradient(w * .32, 0, w * .83, 0);
      feather.addColorStop(0, 'transparent');
      feather.addColorStop(.65, 'rgba(255,255,255,.72)');
      feather.addColorStop(1, 'white');
      const composite = makePaintSurface(w, h),
        cg = composite.getContext('2d');
      return {
        root: SCENERY[key].fire[i],
        jet,
        patch,
        composite,
        cg,
        light,
        lg: light.getContext('2d'),
        split,
        sg,
        feather,
        seed: Math.floor(x * 7 + y * 3 + i * 41)
      };
    });
  }
  function exposure(c, sheet, jet, frame) {
    const {
        w,
        h,
        row
      } = jet,
      k = Math.floor(frame),
      frac = frame - k;
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'black';
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'lighter';
    for (let n = 0; n < 2; n++) {
      const i = (k + n) % 64;
      c.globalAlpha = n ? frac : 1 - frac;
      c.drawImage(sheet, i % 8 * w, row + Math.floor(i / 8) * h, w, h, 0, 0, w, h);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  return function paint(room, time) {
    const key = room.key;
    if (current !== key) {
      g.clearRect(0, 0, surface.width, surface.height);
      burners = create(key);
      current = key;
    }
    for (const {
      root,
      jet,
      patch,
      composite,
      cg,
      light,
      lg,
      split,
      sg,
      feather,
      seed
    } of burners) {
      const {
          x,
          y,
          w,
          h,
          rate,
          phase
        } = jet,
        sheet = fireImages[key];
      // Two flame tongues have independent clocks; smooth fuel changes alter their pace and shape.
      const slow = fuelNoise(time * .67, seed),
        draft = fuelNoise(time * 1.12, seed + 17) - .5;
      const a = time * rate + phase + 4.8 * slow + 1.35 * fuelNoise(time * 2.3, seed + 27);
      const b = time * rate * .7937 + phase + 29 + 5.1 * fuelNoise(time * .82, seed + 6);
      exposure(lg, sheet, jet, a);
      exposure(sg, sheet, jet, b);
      sg.globalCompositeOperation = 'destination-in';
      sg.fillStyle = feather;
      sg.fillRect(0, 0, w, h);
      sg.globalCompositeOperation = 'source-over';
      lg.drawImage(split, 0, 0);
      g.clearRect(x - 2, y - 2, w + 4, h + 18);
      cg.globalCompositeOperation = 'source-over';
      cg.drawImage(patch, 0, 0);
      cg.globalCompositeOperation = 'lighter';
      const column = .96 + .07 * slow,
        delta = h * (1 - column);
      for (let j = 0; j < h; j += 4) {
        const band = Math.min(4, h - j),
          lift = 1 - j / h,
          bend = w * lift * lift * (.105 * draft + .031 * (fuelNoise(time * 2 - j * .019, seed + 9) - .5));
        cg.drawImage(light, 0, j, w, band, bend, delta + j * column, w, band * column);
      }
      g.drawImage(composite, x, y);
      // Small reflected highlights stay on the lip of the metal bowl.
      const rimX = root[0] * 2,
        rimY = y + h;
      g.save();
      g.translate(rimX, rimY + 1);
      g.scale(root[2] * 1.62, 3.0);
      const glow = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      glow.addColorStop(0, 'rgba(255,148,51,' + (.075 + .105 * slow) + ')');
      glow.addColorStop(1, 'rgba(255,112,28,0)');
      g.fillStyle = glow;
      g.fillRect(-1, -1, 2, 2);
      g.restore();
      g.save();
      g.translate(rimX, rimY + 2);
      g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const side = i === 1 ? -1 : 1,
          spread = root[2] * (.38 + .23 * i),
          heat = fuelNoise(time * (2.2 + i * .23), seed + 133 + i);
        g.strokeStyle = 'rgba(255,177,81,' + (.06 + heat * .13) + ')';
        g.lineWidth = 1.3 + .6 * heat;
        g.beginPath();
        g.moveTo(side * spread, 1);
        g.quadraticCurveTo(side * spread * .96, 5, side * spread * .8, 8 + i);
        g.stroke();
      }
      g.restore();
      g.globalCompositeOperation = 'source-over';
    }
  };
}
const flowImages = {},
  fireImages = {},
  hearthImages = {};
let palaceSurface,
  waterSurface,
  paintWater,
  paintFire,
  softwarePalace = false,
  ambientTime = 0,
  albumTime = 0,
  activeRoom = -1,
  nextPaint = 0;
function useCanvasPainter() {
  const replacement = makePaintSurface(1672, 941);
  waterSurface.replaceWith(replacement);
  waterSurface = replacement;
  paintWater = makeCanvasPainter(waterSurface);
  softwarePalace = true;
  nextPaint = 0;
}
function openPalace() {
  palaceSurface = document.createElement('div');
  palaceSurface.className = 'painted-room';
  palaceSurface.setAttribute('aria-hidden', 'true');
  waterSurface = makePaintSurface(1672, 941);
  const flames = makePaintSurface(1672, 941);
  palaceSurface.append(waterSurface, flames);
  try {
    paintWater = makePalaceRenderer(waterSurface);
  } catch {
    paintWater = null;
  }
  if (!paintWater) useCanvasPainter();else waterSurface.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    useCanvasPainter();
  });
  paintFire = makeFirePainter(flames);
  canvas.before(palaceSurface);
}
function paintPalace(room, time) {
  paintWater(room, time);
  paintFire(room, time);
}
let guardianPlate;
function displayRoom(stamp, dt) {
  const atlas = atlasOpen,
    idx = atlas ? atlasIndex : route.index;
  if (atlas) albumTime += dt;else if (!paused && !route.done) ambientTime += dt;
  if (activeRoom !== idx) {
    activeRoom = idx;
    nextPaint = 0;
  }
  if (!atlas && (paused || route.done) && nextPaint > 0) return;
  if (atlas && idx === 9) {
    if (!guardianPlate) {
      guardianPlate = makePaintSurface(1672, 941);
      guardianPlate.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      palaceSurface.append(guardianPlate);
    }
    if (stamp >= nextPaint) {
      const g = guardianPlate.getContext('2d');
      g.drawImage(images.guardianReference, 0, 0);
      drawHallWater(g, 'guardianReference', albumTime);
      nextPaint = stamp + 32;
    }
    guardianPlate.hidden = false;
    return;
  }
  if (guardianPlate) guardianPlate.hidden = true;
  if (!atlas && idx === 9) return;
  if (stamp >= nextPaint) {
    paintPalace(ROOMS[idx], atlas ? albumTime : ambientTime);
    const interval = 1000 / (softwarePalace ? 30 : 60);
    nextPaint = stamp + interval - (stamp - nextPaint) % interval;
  }
}
