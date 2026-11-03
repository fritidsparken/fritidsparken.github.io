import { world, shapes, surface, label } from "./world.js";
import { model } from "./kart.js";
import { paints } from "./circuits.js";
const T = THREE,
  V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z),
  up = V(0, 1, 0);
export class Display {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.camera = new T.PerspectiveCamera(52, 1, 0.09, 1100);
    this.fx = [];
    this.cache = new Set(Object.values(shapes));
    this.clock = 0;
    this.cameraMode = 0;
  }
  clean() {
    if (!this.w) return;
    let textures = new Set(),
      materials = new Set(),
      geos = new Set();
    this.w.scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry && !this.cache.has(o.geometry)) geos.add(o.geometry);
      if (o.material)
        for (let m of [].concat(o.material)) {
          materials.add(m);
          for (let v of [m.map, m.bumpMap, m.normalMap])
            if (v && !v.userData.shared) textures.add(v);
        }
    });
    for (let set of [textures, materials, geos]) for (let v of set) v.dispose();
    Object.values(this.w.detail).forEach((tex) => tex.dispose());
    this.w.sun.shadow.dispose();
    this.env?.dispose();
    this.fx = [];
  }
  load(track, path, settings, race) {
    this.clean();
    this.ghostCar = null;
    this.podiumCars = null;
    this.track = track;
    this.path = path;
    this.race = race;
    this.q = settings.quality;
    this.renderer.shadowMap.enabled = this.q > 0;
    this.w = world(track, path, this.q);
    let scene = this.w.scene;
    let c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    let g = c.getContext("2d"),
      gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, track.sky);
    gr.addColorStop(0.46, "#fff2da");
    gr.addColorStop(0.54, track.ground);
    gr.addColorStop(1, track.stone);
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#fff";
    g.fillRect(62, 32, 24, 13);
    let tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.colorSpace = T.SRGBColorSpace;
    let pm = new T.PMREMGenerator(this.renderer);
    this.env = pm.fromEquirectangular(tex);
    tex.dispose();
    pm.dispose();
    scene.environment = this.env.texture;
    if (this.q >= 2) {
      const target = new T.WebGLCubeRenderTarget(this.q === 3 ? 128 : 64, {
        type: T.HalfFloatType,
      });
      const probe = new T.CubeCamera(0.5, 780, target);
      probe.position.copy(path.at(0).pos).y += 2.5;
      probe.update(this.renderer, scene);
      const filter = new T.PMREMGenerator(this.renderer),
        reflected = filter.fromCubemap(target.texture);
      this.env.dispose();
      this.env = reflected;
      scene.environment = reflected.texture;
      target.dispose();
      filter.dispose();
    }
    this.models = race.racers.map((r) => {
      let m = model(
        r.kart,
        r.id ? (settings.driver + r.id) % 8 : settings.driver,
        r.id ? paints[(settings.paint + r.id) % 8] : paints[settings.paint],
      );
      scene.add(m.root);
      m.shadow.material.map.userData.shared = true;
      return m;
    });
    this.halos = this.models.map((m) => {
      let shell = new T.Mesh(
        shapes.ball,
        new T.MeshBasicMaterial({
          color: "#5edaff",
          transparent: true,
          opacity: 0.17,
          depthWrite: false,
          wireframe: true,
        }),
      );
      shell.scale.set(1.65, 1.43, 2.05);
      shell.position.y = 1.04;
      shell.visible = false;
      m.root.add(shell);
      return shell;
    });
    this.skids = [];
    this.skidIndex = 0;
    this.objects = [];
    const boxMat = surface("#44bdde", 0.18, 0.54, 0.25),
      gold = surface("#ffd54c", 0.25, 0.64, 0.12),
      symbol = label("?", "#12658a", "#fff4ad");
    const add = (mesh, d, l, y) => {
      let f = path.at(d);
      mesh.position
        .copy(f.pos)
        .addScaledVector(f.right, l)
        .addScaledVector(f.up, y);
      scene.add(mesh);
      return mesh;
    };
    for (let it of race.items) {
      let d = it.u * path.length;
      let box = new T.Mesh(new T.BoxGeometry(1.55, 1.55, 1.55), [
        symbol,
        symbol,
        boxMat,
        boxMat,
        symbol,
        symbol,
      ]);
      add(box, d, it.l, 1.45);
      let coin = new T.Mesh(shapes.ring, gold);
      coin.scale.set(0.58, 0.58, 1.4);
      add(coin, d + 9, it.l, 1.1);
      this.objects.push({ box, coin, y: box.position.y, it });
    }
    let obstacleMat = surface(
      track.id === 7 ? "#8ac9db" : track.id === 2 ? "#ff6191" : track.stone,
    );
    this.hazards = [];
    for (let h of race.hazards) {
      let o = new T.Mesh(shapes.rock, obstacleMat);
      o.scale.set(1.4, 1.15, 1.2);
      add(o, h.u * path.length, h.l, 0.5);
      this.hazards.push(o);
    }
    for (let [d, text, color] of [
      [path.start - 8, "↗", "#358e76"],
      [track.jump * path.length - 4, "↑", "#e09940"],
    ]) {
      let f = path.at(d);
      let sign = new T.Mesh(
        new T.BoxGeometry(2.8, 2.2, 0.22),
        label(text, color),
      );
      add(sign, d, 8.7, 2.2);
      sign.rotation.y = Math.atan2(f.f.x, f.f.z);
      for (let i = 0; i < 3; i++) {
        let mark = new T.Mesh(new T.BoxGeometry(6, 0.04, 0.45), surface(color));
        add(mark, d + i * 1.3, text === "↗" ? 3.6 : 0, 0.05);
        mark.rotation.y = sign.rotation.y;
      }
    }
    this.particles = Array.from({ length: [20, 36, 65, 90][this.q] }, () => {
      let m = new T.Mesh(shapes.ball, new T.MeshBasicMaterial());
      m.visible = false;
      scene.add(m);
      return { m, life: 0, vel: V(), ttl: 1 };
    });
    this.particleIndex = 0;
    this.projectiles = [];
    this.first = true;
    this.resize();
  }
  resize() {
    const w = innerWidth,
      h = innerHeight;
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, [0.85, 1.1, 1.5, 2][this.q ?? 1]),
    );
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  spawn(pos, color, vel, size, time) {
    let p = this.particles[this.particleIndex++ % this.particles.length];
    p.m.visible = true;
    p.life = p.ttl = time;
    p.m.position.copy(pos);
    p.vel.copy(vel);
    p.m.material.color.set(color);
    p.m.scale.setScalar(size);
    p.size = size;
  }
  ghost(record) {
    if (!record?.length) return;
    let m = model(
      this.race.settings.kart,
      this.race.settings.driver,
      "#82d9f1",
    );
    m.root.traverse((o) => {
      if (o.material) {
        o.material.transparent = true;
        o.material.opacity = 0.28;
        o.material.depthWrite = false;
      }
    });
    m.shadow.visible = false;
    this.w.scene.add(m.root);
    this.ghostCar = { m, record };
  }
  podium(order) {
    const f = this.path.at(0);
    this.podiumCars = order.slice(0, 3).map((id, i) => {
      let pos = f.pos
        .clone()
        .addScaledVector(f.right, [0, -3.5, 3.5][i])
        .addScaledVector(f.f, 8);
      let h = [2, 1.35, 0.9][i],
        m = new T.Mesh(
          new T.BoxGeometry(3.25, h, 4.3),
          surface(["#e2b95b", "#9daebd", "#ab7864"][i], 0.27, 0.41),
        );
      m.position.copy(pos).y += h / 2;
      m.rotation.y = Math.atan2(f.f.x, f.f.z);
      this.w.scene.add(m);
      let n = new T.Mesh(new T.PlaneGeometry(1.1, 0.8), label(String(i + 1)));
      n.position
        .copy(pos)
        .addScaledVector(f.f, 2.17)
        .addScaledVector(f.up, h * 0.55);
      n.quaternion.copy(m.quaternion);
      this.w.scene.add(n);
      pos.y += h;
      return { id, pos };
    });
  }
  draw(dt, menu = false, finish = false) {
    const time = (this.clock += dt),
      scene = this.w.scene,
      cam = this.camera,
      path = this.path,
      race = this.race;
    const state = race.racers[0],
      frame = path.route(state.d, state.alt);
    race.racers.forEach((r, i) => {
      let f = i ? path.route(r.d, r.alt) : frame,
        m = this.models[i],
        pos = f.pos.clone().addScaledVector(f.right, r.l);
      m.root.position.copy(pos);
      this.halos[i].visible = r.shield > 0 || r.magnet > 0 || r.ice > 0;
      this.halos[i].material.color.set(
        r.magnet ? "#f8c74f" : r.ice ? "#f4fcff" : "#6cdbff",
      );
      if (this.podiumCars) {
        let podium = this.podiumCars.find((o) => o.id === i);
        m.root.visible = !!podium;
        if (podium) {
          m.root.position.copy(podium.pos);
          f = path.at(0);
        }
      }
      m.root.quaternion.setFromRotationMatrix(
        new T.Matrix4().makeBasis(f.right, f.up, f.f),
      );
      m.body.position.y =
        r.hop + 0.018 + (Math.sin(time * 21 + i) * 0.025 * r.v) / 40;
      m.body.rotation.z = -r.steer * (r.drift ? 0.14 : 0.06);
      m.body.rotation.y = r.steer * (r.drift ? 0.31 : 0.07);
      m.head.rotation.z =
        -r.steer * 0.12 + (finish ? 0.13 * Math.sin(time * 6) : 0);
      m.head.rotation.y = r.steer * 0.23;
      m.head.position.y =
        1.67 +
        (r.hit > 0 ? 0.04 * Math.sin(time * 24) : 0) +
        (finish ? 0.09 * Math.sin(time * 7) : 0);
      for (let w of m.wheel) w.rotation.x += (r.v * dt) / 0.43;
      m.lamp.emissiveIntensity = r.hit > 0 ? 2 : 0.62;
      if (r.drift && r.hop < 0.05 && Math.random() < Math.min(1, dt * 16)) {
        for (let sign of [-1, 1]) {
          let index = this.skidIndex++ % 128,
            mark = this.skids[index];
          if (!mark) {
            mark = new T.Mesh(
              new T.PlaneGeometry(0.21, 0.91),
              new T.MeshBasicMaterial({
                color: "#28272b",
                transparent: true,
                opacity: 0.4,
                depthWrite: false,
              }),
            );
            this.skids[index] = mark;
            scene.add(mark);
          }
          mark.position
            .copy(pos)
            .addScaledVector(f.up, 0.045)
            .addScaledVector(f.right, sign * 1.02)
            .addScaledVector(f.f, -1);
          mark.quaternion.copy(m.root.quaternion);
          mark.rotateX(-Math.PI / 2);
        }
      }
      m.body.visible = menu || finish || i !== 0 || this.cameraMode !== 2;
      m.shadow.visible = m.body.visible;
      if (
        !menu &&
        (r.boost > 0 || r.drift || r.hit > 0.65) &&
        Math.random() < Math.min(1, dt * 32)
      ) {
        let p = pos
          .clone()
          .addScaledVector(f.f, -1.3)
          .addScaledVector(f.right, (Math.random() > 0.5 ? 1 : -1) * 0.93);
        this.spawn(
          p,
          r.boost ? "#5defff" : r.slide > 1 ? "#ffba43" : "#cbd2d3",
          f.f.clone().multiplyScalar(-3).addScaledVector(f.up, 1.5),
          0.12 + Math.random() * 0.15,
          0.45,
        );
      }
    });
    if (this.ghostCar) {
      let { m, record } = this.ghostCar,
        n = Math.max(0, Math.floor(race.t * 8)),
        a = record[n],
        b = record[n + 1] || a;
      m.root.visible = !!a && race.t > 0 && !finish;
      if (m.root.visible) {
        let k = race.t * 8 - n,
          d = a[0] + (b[0] - a[0]) * k,
          f = path.route(d, !!a[3]);
        m.root.position
          .copy(f.pos)
          .addScaledVector(f.right, a[1] + (b[1] - a[1]) * k)
          .addScaledVector(f.up, a[2]);
        m.root.quaternion.setFromRotationMatrix(
          new T.Matrix4().makeBasis(f.right, f.up, f.f),
        );
      }
    }
    let pos = this.podiumCars
        ? this.podiumCars[0].pos
        : this.models[0].root.position,
      desired,
      look,
      axis = frame.up.clone(),
      fwd = frame.f,
      right = frame.right;
    let showroom = menu || finish;
    if (showroom) {
      const angle = this.podiumCars
        ? 1.42
        : menu
          ? 0.8 + Math.sin(time * 0.22) * 0.25
          : time * 0.35;
      let narrow = innerWidth < 560;
      desired = pos
        .clone()
        .addScaledVector(right, Math.cos(angle) * (narrow ? 9.6 : 6.8))
        .addScaledVector(fwd, Math.sin(angle) * (this.podiumCars ? 12 : 6.8))
        .addScaledVector(axis, 3.1);
      look = pos.clone().addScaledVector(axis, narrow ? -2.75 : 1.05);
      if (!narrow && menu) {
        let dir = look.clone().sub(desired).normalize(),
          cr = dir.clone().cross(axis).normalize();
        look.addScaledVector(cr, -2.15);
      }
    } else {
      let mode = this.cameraMode,
        back = mode === 0 ? 6.4 + state.v * 0.027 : mode === 1 ? 4.6 : 0;
      let height = mode === 0 ? 3.2 : mode === 1 ? 1.8 : 1.99;
      desired = pos
        .clone()
        .addScaledVector(fwd, mode === 2 ? 0.3 : -back)
        .addScaledVector(axis, height + state.hop * (mode === 2 ? 1 : 0.68));
      look = pos
        .clone()
        .addScaledVector(fwd, mode === 2 ? 11 : 9)
        .addScaledVector(axis, (mode === 2 ? 1.8 : 1.0) + state.hop * 0.6);
      axis.addScaledVector(right, state.steer * 0.04).normalize();
    }
    let smoothing =
      this.first || menu || this.track.id === 11 || this.cameraMode === 2
        ? 1
        : 1 - Math.exp(-dt * 12);
    cam.position.lerp(desired, smoothing);
    cam.up.lerp(axis, smoothing).normalize();
    cam.lookAt(look);
    cam.fov += ((showroom ? 43 : state.boost > 0 ? 66 : 54) - cam.fov) * 0.12;
    cam.updateProjectionMatrix();
    this.first = false;
    this.w.sky.position.copy(cam.position);
    this.w.sun.position.copy(pos).add(V(-32, 55, -24));
    this.w.sun.target.position.copy(pos);
    this.w.sea.material.uniforms.time.value = time;
    for (let o of this.w.animated) o.material.uniforms.time.value = time;
    if (this.w.flakes.visible) {
      this.w.flakes.position.copy(pos).y -= 7;
      const a = this.w.flakes.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) + dt * (this.track.id === 6 ? 1.5 : -2.3);
        a.setY(i, (y + 32) % 32);
      }
      a.needsUpdate = true;
    }
    for (let [i, o] of this.objects.entries()) {
      o.box.rotation.set(0.18, time * 1.5 + i, 0.2);
      o.box.position.y = o.y + 0.18 * Math.sin(time * 2 + i);
      o.coin.rotation.y = time * 2.8;
      o.box.visible =
        menu ||
        !(
          state.box === Math.floor(state.d / path.length) * 6 + i &&
          Math.abs((state.d % path.length) - o.it.u * path.length) < 12
        );
      o.coin.visible = state.coin !== Math.floor(state.d / path.length) * 6 + i;
    }
    for (let [i, h] of race.hazards.entries()) {
      let f = path.at(h.u * path.length);
      this.hazards[i].position
        .copy(f.pos)
        .addScaledVector(f.right, h.l)
        .addScaledVector(f.up, 0.6);
    }
    let dynamic = [
      ...race.drops.map((o) => ({ ...o, type: "oil" })),
      ...race.shots.map((o) => ({ ...o, type: "missile" })),
    ];
    dynamic.forEach((o, i) => {
      if (!this.projectiles[i]) {
        let mesh = new T.Mesh(shapes.ball, surface("white"));
        scene.add(mesh);
        this.projectiles.push(mesh);
      }
      let m = this.projectiles[i],
        f = path.at(o.d);
      m.visible = true;
      m.position
        .copy(f.pos)
        .addScaledVector(f.right, o.l)
        .addScaledVector(f.up, o.type === "oil" ? 0.1 : 1.0);
      m.scale.set(...(o.type === "oil" ? [1.6, 0.08, 1.8] : [0.3, 0.3, 0.8]));
      m.material.color.set(o.type === "oil" ? "#272039" : "#ff624a");
    });
    this.projectiles.slice(dynamic.length).forEach((o) => (o.visible = false));
    if (finish && Math.random() < dt * 20)
      this.spawn(
        pos.clone().add(V(Math.random() * 4 - 2, 3, Math.random() * 4 - 2)),
        paints[Math.floor(Math.random() * 8)],
        V(Math.random() - 0.5, 3, Math.random() - 0.5),
        0.13,
        1.4,
      );
    for (let p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.m.visible = p.life > 0;
      p.m.position.addScaledVector(p.vel, dt);
      p.vel.y -= dt * 3;
      p.m.scale.setScalar(Math.max(0.01, (p.size * p.life) / p.ttl));
    }
    this.renderer.render(scene, cam);
  }
}
