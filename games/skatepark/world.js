import {
  parks,
  height,
  surface,
  railPoint,
  clamp,
  halfWidth,
  halfDepth,
} from "./model.js?v=railends1";
const T = window.THREE,
  v = (x, y, z) => new T.Vector3(x, y, z);
const sphere = new T.SphereGeometry(1, 16, 12),
  cube = new T.BoxGeometry(1, 1, 1),
  tube = new T.CylinderGeometry(0.5, 0.5, 1, 12);
const mat = (color, opts = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.78, ...opts });
function part(parent, geo, m, x, y, z, sx, sy, sz) {
  const obj = new T.Mesh(geo, m);
  obj.position.set(x, y, z);
  obj.scale.set(sx, sy, sz);
  parent.add(obj);
  return obj;
}
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"));
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function noise() {
  let seed = 19;
  const t = canvasTex(192, 192, (c) => {
    const d = c.createImageData(192, 192);
    for (let i = 0; i < d.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const n = 211 + (seed >>> 27);
      d.data.set([n, n, n, 255], i);
    }
    c.putImageData(d, 0, 0);
    c.strokeStyle = "#a6a5a1";
    c.lineWidth = 1.1;
    c.strokeRect(0, 0, 192, 192);
    c.strokeStyle = "#ceccc8";
    c.beginPath();
    c.moveTo(1, 87);
    c.lineTo(15, 93);
    c.lineTo(25, 91);
    c.stroke();
  });
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
function plaza(park, scene) {
  const geo = new T.PlaneGeometry(halfWidth * 2, halfDepth * 2, 256, 240);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position,
    colors = [],
    uv = geo.attributes.uv;
  const plain = new T.Color(park.floor),
    stripe = new T.Color(park.ink),
    color = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i),
      y = height(park, x, z);
    pos.setY(i, y);
    uv.setXY(i, x / 5, z / 5);
    color.copy(plain);
    for (const s of park.shapes) {
      if (Math.abs(surface(s, x, z)) < 0.012) continue;
      const level = Math.abs(y / s[5]);
      color.lerp(
        stripe,
        s[0] === "bowl"
          ? level > 0.1 && level < 0.22
            ? 0.96
            : 0.29
          : level > 0.62 && level < 0.83
            ? 0.95
            : 0.36,
      );
      if (s[0] === "half") {
        const plank = Math.floor((z - s[2]) * 3);
        color.lerp(new T.Color(plank % 2 ? 0xad795b : 0xc6976d), 0.47);
      }
    }
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const floor = new T.Mesh(
    geo,
    mat(0xffffff, { map: noise(), vertexColors: true }),
  );
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
}
function skylineTexture(i) {
  return canvasTex(1024, 256, (c) => {
    c.fillStyle = ["#b25b44", "#d58b66", "#333452"][i];
    c.fillRect(0, 0, 1024, 256);
    for (let row = 0; row < 28; row++) {
      c.fillStyle = "rgba(24,18,24,.13)";
      c.fillRect(0, row * 10, 1024, 1);
      for (let x = -18; x < 1024; x += 38)
        c.fillRect(x + 19 * (row % 2), row * 10, 1, 10);
    }
    for (let x = 12; x < 1024; x += 58) {
      for (let y = 18; y < 240; y += 73) {
        c.fillStyle = "#463f46";
        c.fillRect(x, y, 33, 53);
        c.fillStyle = i === 2 ? "#f4bc7c" : "#a9c2c4";
        c.fillRect(x + 3, y + 4, 27, 43);
        c.fillStyle = "#63575b";
        c.fillRect(x + 15, y, 2, 51);
        c.fillRect(x, y + 23, 32, 2);
        c.fillStyle = "#ddc5ac";
        c.fillRect(x - 2, y + 51, 37, 3);
      }
    }
  });
}
function mural(i) {
  return canvasTex(1024, 256, (c) => {
    c.fillStyle = ["#12695f", "#db7050", "#383253"][i];
    c.fillRect(0, 0, 1024, 256);
    for (let j = 0; j < 9; j++) {
      c.lineWidth = 7 + j;
      c.strokeStyle = ["#ffad58", "#f0948b", "#73d9c8"][j % 3];
      c.beginPath();
      c.moveTo(-40, 230 + j * 10);
      c.bezierCurveTo(220, -260 + j * 15, 650, 450 - j * 24, 1080, 30 + j * 9);
      c.stroke();
    }
    c.fillStyle = "#101f2b";
    c.fillRect(35, 38, 525, 124);
    c.fillStyle = "#fff1d2";
    c.font = "italic 900 77px sans-serif";
    c.fillText("FRITIDSPARKEN", 48, 122, 496);
    c.font = "bold 26px sans-serif";
    c.fillText(
      ["01   /   GÅRDEN", "02   /   STRANDEN", "03   /   MAGASINET"][i],
      52,
      207,
    );
  });
}
function environment(scene, park, i) {
  const batches = new Map(),
    dummy = new T.Object3D(),
    staticM = mat(0xffffff);
  function stamp(g, color, x, y, z, a, b, c, rx = 0, ry = 0, rz = 0) {
    let items = batches.get(g);
    if (!items) batches.set(g, (items = []));
    dummy.position.set(x, y, z);
    dummy.scale.set(a, b, c);
    dummy.rotation.set(rx, ry, rz);
    dummy.updateMatrix();
    items.push([dummy.matrix.clone(), new T.Color(color)]);
  }
  const box = (...args) => stamp(cube, ...args),
    ball = (...args) => stamp(sphere, ...args);
  function bar(a, b, r, color) {
    const start = v(...a),
      end = v(...b),
      delta = end.clone().sub(start);
    const q = new T.Quaternion().setFromUnitVectors(
      v(0, 1, 0),
      delta.clone().normalize(),
    );
    const e = new T.Euler().setFromQuaternion(q);
    stamp(
      tube,
      color,
      ...start.lerp(end, 0.5).toArray(),
      r,
      delta.length(),
      r,
      e.x,
      e.y,
      e.z,
    );
  }
  const floor = plaza(park, scene);
  const land = i === 1 ? 0xe3bc90 : i === 2 ? 0x464256 : 0x91a164;
  for (const side of [-1, 1]) {
    box(land, side * (halfWidth + 13), -0.35, 0, 26, 0.58, halfDepth * 2 + 12);
    box(land, 0, -0.35, side * (halfDepth + 6), halfWidth * 2, 0.58, 12);
  }

  for (const r of park.rails) {
    let a = railPoint(park, r, 0);
    for (let n = 1; n <= 16; n++) {
      const b = railPoint(park, r, n / 16);
      bar(a, b, 0.13, park.rail);
      if (n % 5 === 1)
        bar([b[0], height(park, b[0], b[2]) - 0.04, b[2]], b, 0.09, 0x52646a);
      a = b;
    }
  }
  if (i === 1) {
    // Timber beach cabins along the promenade leave an open sightline to the sea.
    for (let n=0;n<6;n++) {
      const x=-47+n*6.3,z=-halfDepth-6,paint=[0x54a9a3,0xe6af74,0xcd7868][n%3];
      box(paint,x,1.36,z,4,2.72,3.5);
      box(0xf5e5c9,x,2.84,z,4.45,.32,3.95);
      box(0x466877,x-.70,1.08,z+1.76,.96,2.16,.09);
      box(0xf7edda,x+.80,1.72,z+1.77,1.18,1.04,.1);
      box(0x7dadaf,x+.80,1.72,z+1.84,.99,.84,.07);
      for(const offset of [-1.88,1.88])box(0xf3dfbd,x+offset,1.35,z+1.76,.14,2.7,.12);
    }
    box(0x54b4bc, -0.5, -0.43, -halfDepth - 35, 200, 0.2, 48);
    for (let j = 0; j < 45; j++)
      box(
        0xb8e4dd,
        Math.sin(j * 12.5) * 74,
        -0.316,
        -halfDepth - 13 - j * 0.66,
        2 + (j % 5),
        0.03,
        0.13,
      );
    for (let j = 0; j < 142; j++)
      box(
        j % 2 ? 0xba9570 : 0xc49b75,
        -halfWidth + j * 0.79,
        -0.14,
        -halfDepth - 4,
        0.76,
        0.26,
        9,
      );
    for (let j = 0; j < 3; j++) {
      const x = -31 + j * 29;
      bar([x, -0.3, -halfDepth - 24], [x, 6, -halfDepth - 24], 0.12, 0x6e655c);
      const g = new T.BufferGeometry();
      g.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [
            x,
            5.9,
            -halfDepth - 24,
            x + 3,
            0.6,
            -halfDepth - 24,
            x,
            0.6,
            -halfDepth - 24,
          ],
          3,
        ),
      );
      g.computeVertexNormals();
      scene.add(new T.Mesh(g, mat(0xffeace, { side: T.DoubleSide })));
      ball(0x385873, x, 0.1, -halfDepth - 24, 2.8, 0.37, 0.7);
    }
  }
  const sign = new T.Mesh(
    new T.PlaneGeometry(16, 4),
    mat(0xffffff, { map: mural(i), side: T.DoubleSide }),
  );
  sign.position.set(0, 2.1, -halfDepth - 0.5);
  scene.add(sign);
  for (let j = 0; j < 46; j++) {
    const x = -55 + (j % 23) * 5,
      z = j < 23 ? -halfDepth - 1 : halfDepth + 1;
    bar([x, 0, z], [x, 1.55, z], 0.09, 0x435859);
    if (j % 23 < 22) {
      bar([x, 1.42, z], [x + 5, 1.42, z], 0.08, 0x526c69);
      bar([x, 0.65, z], [x + 5, 0.65, z], 0.06, 0x526c69);
    }
  }
  let leafGeo, leaves;
  if (i !== 0) {
    const foliage = new T.TextureLoader().load(
      "../downhill/art/" + (i === 1 ? "palm" : "oak") + ".webp",
    );
    foliage.colorSpace = T.SRGBColorSpace;
    leafGeo = new T.PlaneGeometry(1, 1);
    leafGeo.rotateX(-Math.PI / 2);
    leaves = mat(0xffffff, {
      map: foliage,
      alphaTest: 0.33,
      side: T.DoubleSide,
    });
    for (let j = 0; j < 20; j++) {
      const x = (j % 2 ? -1 : 1) * (halfWidth + 3 + (j % 4)),
        z = -halfDepth + Math.floor(j / 2) * 11;
      const h = 4 + (j % 3);
      bar([x, 0, z], [x + 0.25, h, z], 0.39, 0x86654b);
      const layers = i === 1 ? 2 : 4;
      for (let level = 0; level < layers; level++) {
        for (let k = 0; k < 8; k++) {
          const angle = (k * Math.PI) / 4 + level * 0.83 + j * 0.75,
            len =
              (i === 1 ? 3.7 : 3.5 - level * 0.5) * (1 + 0.11 * Math.sin(j + k));
          stamp(
            leafGeo,
            0xffffff,
            x + Math.sin(angle) * len * 0.39,
            h - 0.45 + level * (i === 1 ? 0.22 : 0.64),
            z + Math.cos(angle) * len * 0.39,
            len,
            1,
            len * 0.86,
            0.28 + level * 0.08,
            angle - Math.PI / 2,
            0,
          );
        }
      }
    }
  }
  for (let j = 0; j < 8; j++) {
    const side = j % 2 ? 1 : -1,
      x = side * (halfWidth + 1),
      z = -40 + Math.floor(j / 2) * 26;
    bar([x, 0, z], [x, 5.7, z], 0.15, 0x394955);
    box(0x374654, x - side * 0.48, 5.7, z, 1.1, 0.22, 0.56);
    box(
      i === 2 ? 0x7ffaff : 0xffedbb,
      x - side * 0.5,
      5.55,
      z,
      0.8,
      0.09,
      0.42,
    );
    box(0xa77350, x, 0.62, z + 3, 0.92, 0.2, 3.1);
    box(0x926247, x + side * 0.4, 1, z + 3, 0.15, 0.7, 3.1);
    for (const dz of [-1, 1])
      box(0x47525a, x, 0.3, z + 3 + dz, 0.65, 0.62, 0.14);
    if (j % 2 === 0) {
      ball(0xe2ad87, x, 0.99 + 1, z + 4, 0.21, 0.24, 0.21);
      ball([0xcc724c, 0x4b7189][(j % 4) / 2], x, 1.49, z + 4, 0.29, 0.43, 0.22);
      box(0x384456, x, 0.84, z + 4, 0.42, 0.83, 0.26);
    }
  }
  if (i === 2) {
    for (let j = 0; j < 6; j++) {
      box(
        j % 2 ? 0xd96e9d : 0x64dedf,
        -5 + j * 2,
        1.84,
        -1.8,
        0.94,
        0.06,
        0.09,
      );
    }
    for (let j = 0; j < 4; j++) {
      const light = new T.PointLight(j % 2 ? 0xff3e91 : 0x57eefe, 1.4, 24);
      light.position.set(j % 2 ? 17 : -17, 4, j < 2 ? -12 : 12);
      scene.add(light);
    }
  }
  for (const [g, items] of batches) {
    const mesh = new T.InstancedMesh(
      g,
      g === leafGeo ? leaves : staticM,
      items.length,
    );
    items.forEach(([m, c], n) => {
      mesh.setMatrixAt(n, m);
      mesh.setColorAt(n, c);
    });
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
  return floor;
}
export class World {
  constructor(canvas) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.camera = new T.PerspectiveCamera(57, 1, 0.12, 160);
    this.focus = v(0, 1, 0);
    this.want = v(0, 0, 0);
    this.target = v(0, 0, 0);
  }
  async build(i, shirt, deck, q) {
    this.sunnyRider?.dispose();
    this.sunnyRider = null;
    if (this.scene) {
      const materials = new Set(),
        geometry = new Set();
      this.scene.traverse((o) => {
        if (o.geometry && ![cube, tube, sphere].includes(o.geometry))
          geometry.add(o.geometry);
        for (const material of [].concat(o.material || [])) materials.add(material);
        if (o.skeleton) o.skeleton.dispose();
        if (o.isInstancedMesh) o.dispose();
      });
      geometry.forEach((g) => g.dispose());
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      this.sun.shadow.dispose();
      this.scene.background?.dispose();
    }
    const park = parks[i];
    this.park = park;
    this.scene = new T.Scene();
    const sky = new T.TextureLoader().load(i===3?"riverside/night-sky.webp":"vista-" + i + ".webp");
    sky.mapping = T.EquirectangularReflectionMapping;
    sky.colorSpace = T.SRGBColorSpace;
    this.scene.background = sky;
    this.scene.fog = new T.FogExp2(park.sky, i === 2 ? 0.014 : 0.0075);
    this.scene.add(
      new T.HemisphereLight(
        i === 2 ? 0xdfddff : 0xfff5de,
        i === 2 ? 0x797196 : 0xb2afa0,
        i === 2 ? 1.65 : 1.58,
      ),
    );
    const sun = new T.DirectionalLight(
      i === 2 ? 0xb3cbff : 0xffe3b5,
      i === 2 ? 1.65 : 2.05,
    );
    sun.position.set(-36, 82, 42);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, {
      left: -80,
      right: 80,
      top: 74,
      bottom: -74,
      far: 185,
    });
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.sun = sun;
    if(i===3){
      const fill=this.scene.children.find(o=>o.isHemisphereLight);
      fill.color.setHex(0xa9badb);fill.groundColor.setHex(0x746575);fill.intensity=.85;
      sun.color.setHex(0xbacafa);sun.intensity=.75;sun.position.set(-48,71,-32);
      this.scene.fog.color.setHex(0x28324a);
    }
    const floor = i===3 ? plaza(park,this.scene) : environment(this.scene, park, i);
    this.quality(q);
    {
      const [{ loadSunnyRider }, { finishSunnyPark }] = await Promise.all([
        import("./sunny-rider.js?v=rail-3"),
        import("./sunny-visuals.js?v=evening-1"),
      ]);
      const results = await Promise.allSettled([
        loadSunnyRider(this.scene, !this.renderer.shadowMap.enabled,
          shirt === 0x187e75 ? null : shirt, deck === 0xe4a963 ? null : deck),
        i===3 ? import("./riverside/scene.js?v=railends1").then(m=>m.buildRiverside(this.scene,floor,!this.renderer.shadowMap.enabled)) : finishSunnyPark(this.scene, floor, this.sun, q, i),
      ]);
      this.sunnyRider = results[0].value;
      const failure = results.find(result => result.status === "rejected");
      if (failure) throw failure.reason;
    }
    const shadow = canvasTex(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 1, 32, 32, 32);
      g.addColorStop(0, "#0009");
      g.addColorStop(1, "#0000");
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    });
    this.blob = new T.Mesh(
      new T.PlaneGeometry(1.5, 2.2),
      new T.MeshBasicMaterial({
        map: shadow,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    this.blob.rotation.x = -Math.PI / 2;
    this.scene.add(this.blob);
    this.snap = true;
  }
  quality(q) {
    const light =
      q === "låg" ||
      (q === "auto" &&
        (matchMedia("(pointer:coarse)").matches || innerWidth < 700));
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, light ? 1 : 1.65),
    );
    this.renderer.shadowMap.enabled = !light;
    this.camera.far = light ? 105 : 160;
    this.resize();
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.fov = innerWidth < innerHeight ? 66 : 55;
    this.camera.updateProjectionMatrix();
  }
  draw(p, k, dt) {
    this.sunnyRider.update(p, k, dt, this.snap);
    this.scene.userData.lightAvenue?.(p.x,p.z);
    const ground = height(this.park, p.x, p.z);
    this.blob.position.set(p.x, ground + 0.027, p.z);
    this.blob.material.opacity = clamp(1 - (p.y - ground) * 0.16, 0.22, 1);
    if (this.snap) this.rampView=null;
    if (p.transition && this.rampView?.transition!==p.transition) {
      this.rampView={transition:p.transition,yaw:p.transition.dir,zoom:0};
    }
    let heading=p.dir,zoom=0;
    const view=this.rampView;
    if (view) {
      const tr=view.transition, axis=tr.across?p.x:p.z;
      const depth=(axis-tr.centerline)*tr.side/(tr.size*.5);
      if (!p.transition && (depth<.32 || Math.abs((tr.across?p.z-tr.cz:p.x-tr.cx))>(tr.across?tr.d:tr.w)*.5)) view.returning=true;
      const extra=view.returning?0:2.2+Math.max(0,p.y-ground)*.65;
      view.zoom+=(extra-view.zoom)*(1-Math.exp(-4*dt));
      if(view.returning) {
        const angle=Math.atan2(Math.sin(p.dir-view.yaw),Math.cos(p.dir-view.yaw));
        view.yaw+=angle*(1-Math.exp(-2.5*dt));
        if(Math.abs(angle)<.012 && view.zoom<.03)this.rampView=null;
      }
      heading=view.yaw;zoom=view.zoom;
    }
    const dist = zoom + (innerWidth < innerHeight ? 6.1 : 5.15) + p.speed * 0.075;
    const sx = Math.sin(heading),
      cz = Math.cos(heading);
    this.want.set(
      clamp(p.x + sx * dist + 0.95 * cz, this.scene.userData.lightAvenue && p.z>52?-83:0.6-halfWidth,this.scene.userData.lightAvenue && p.z>52?83:halfWidth-.6),
      p.y + 2.75 + zoom*.45 + p.speed * 0.055,
      clamp(p.z + cz * dist - 0.95 * sx, 0.6 - halfDepth, this.scene.userData.lightAvenue?85:halfDepth-.6),
    );
    this.want.y = Math.max(
      this.want.y,
      height(this.park, this.want.x, this.want.z) + 1.45,
    );
    this.target.set(p.x - sx * 2.35, p.y + 1.05, p.z - cz * 2.35);
    if(p.loop){this.want.set(p.x-4*p.loop.sign,5.6+p.y*.37,p.z+12);this.target.set(p.x,p.y+.8,p.z);}
    const smooth = this.snap ? 1 : 1 - Math.exp(-8 * dt);
    this.camera.position.lerp(this.want, smooth);
    this.focus.lerp(this.target, smooth);
    this.camera.position.y = Math.max(
      this.camera.position.y,
      height(this.park, this.camera.position.x, this.camera.position.z) + 0.65,
    );
    if(view) {
      // Clear the entire sightline, including the coping between camera and skater.
      const eye=this.camera.position;
      let safeY=eye.y;
      for(let i=1;i<=24;i++){
        const u=i/24,x=p.x+(eye.x-p.x)*u,z=p.z+(eye.z-p.z)*u;
        const targetY=p.y+.65;
        safeY=Math.max(safeY,targetY+(height(this.park,x,z)+.35-targetY)/u);
      }
      eye.y=safeY;
    }
    this.camera.lookAt(this.focus);
    this.snap = false;
    this.renderer.render(this.scene, this.camera);
  }
}
