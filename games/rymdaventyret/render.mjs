import { PLANETS, WORLDS, worldPosition } from "./data.mjs";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
const T = window.THREE;
const ASSET = "../../assets/space/";
const vec = (p) => new T.Vector3(p.x, p.y, p.z);
export class SpaceRenderer {
  constructor(canvas, quality = "medium") {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(55, 1, 0.5, 80000);
    this.origin = new T.Vector3();
    this.planets = new Map();
    this.textureCache = new Map();
    this.texturePromises = [];
    this.mixers = [];
    this.rocks = [];
    this.elapsed = 0;
    this.surface = null;
    this.orbit = { yaw: 0, pitch: 0.25, distance: 25 };
    this.ambient = new T.HemisphereLight(0x8296dc, 0x1c1225, 1.2);
    this.scene.add(this.ambient);
    this.sunlight = new T.DirectionalLight(0xffe0ab, 3.1);
    this.scene.add(this.sunlight, this.sunlight.target);
    this.fill = new T.DirectionalLight(0x469fff, 1.8);
    this.fill.position.set(-10, 6, 8);
    this.scene.add(this.fill);
    this.rim = new T.DirectionalLight(0xff854c, 1.3);
    this.rim.position.set(8, 4, -8);
    this.scene.add(this.rim);
    this.rocket = new T.Group();
    this.scene.add(this.rocket);
    this.spaceRoot = new T.Group();
    this.scene.add(this.spaceRoot);
    this.surfaceRoot = new T.Group();
    this.surfaceRoot.visible = false;
    this.scene.add(this.surfaceRoot);
    this.makeEnvironment();
    this.makeSky();
    this.makePlanets();
    this.setQuality(quality);
    this.setupPost();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }
  makeEnvironment() {
    const width = 128,
      height = 64,
      data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const u = x / width,
          v = y / height,
          soft = Math.exp(-((u - 0.2) ** 2 / 0.004 + (v - 0.35) ** 2 / 0.012)),
          warm = Math.exp(-((u - 0.73) ** 2 / 0.01 + (v - 0.4) ** 2 / 0.025));
        const i = (y * width + x) * 4;
        data[i] = Math.min(255, 12 + soft * 165 + warm * 180);
        data[i + 1] = Math.min(255, 18 + soft * 190 + warm * 100);
        data[i + 2] = Math.min(255, 35 + soft * 220 + warm * 35);
        data[i + 3] = 255;
      }
    const map = new T.DataTexture(data, width, height, T.RGBAFormat);
    map.mapping = T.EquirectangularReflectionMapping;
    map.colorSpace = T.SRGBColorSpace;
    map.needsUpdate = true;
    this.scene.environment = map;
  }
  async load(progress) {
    const loader = new GLTFLoader();
    const paths = {
      rocket: "rocket/rocket-high.glb",
      rocketLow: "rocket/rocket-low.glb",
      asteroids: "asteroids/asteroid-library.glb",
      crystal: "materials/crystal.glb",
      station: "stations/orbital-station.glb",
      rover: "vehicles/moon-rover.glb",
      satellite: "satellites/research-probe.glb",
      base: "terrain/landing-base.glb",
    };
    this.assets = {};
    let n = 0;
    await Promise.all(
      Object.entries(paths).map(async ([name, path]) => {
        const gltf = await loader.loadAsync(ASSET + path);
        this.assets[name] = gltf.scene;
        this.assets[name].traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (/glass/i.test(o.material?.name || "")) {
              o.material.transparent = true;
              o.material.opacity = 0.2;
              o.material.depthWrite = false;
              o.material.transmission = 0.15;
            }
          }
        });
        if (name === "rocket") {
          this.rocket.add(gltf.scene);
          this.rocketModel = gltf.scene;
        }
        if (name === "rocket" || name === "rocketLow") {
          if (gltf.animations.length) {
            let mixer = new T.AnimationMixer(gltf.scene);
            for (const clip of gltf.animations) mixer.clipAction(clip).play();
            this.mixers.push(mixer);
          }
        }
        progress((++n / Object.keys(paths).length) * 75);
      }),
    );
    await Promise.all(this.texturePromises);
    this.makeEngines();
    this.makeStations();
    this.makeAsteroids();
    this.makeCollectibles();
    this.makeGoal();
    this.setQuality(this.quality);
    progress(95);
  }
  makeSky() {
    const geometry = new T.SphereGeometry(40000, 40, 24);
    const mat = new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: { time: { value: 0 } },
      vertexShader:
        "varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `precision highp float;varying vec3 v;uniform float time;
  float hash(vec3 p){p=fract(p*.3183099+vec3(.11,.17,.13));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*noise(p);p=p*2.04+vec3(3.7,9.2,1.4);a*=.5;}return f;}
  void main(){vec3 d=normalize(v);float n=fbm(d*5.+1.7);float f=fbm(d*20.+n*3.);float lane=exp(-abs(d.y+.35*d.x+.12*sin(d.z*5.))*4.);float cloud=pow(n,2.)*lane;vec3 col=vec3(.003,.006,.018);col+=mix(vec3(.18,.025,.29),vec3(.02,.2,.36),smoothstep(.4,.72,f))*cloud*1.4;col+=vec3(.23,.025,.15)*pow(f,5.)*lane;float dust=smoothstep(.51,.65,fbm(d*45.));col*=1.-dust*.58;gl_FragColor=vec4(col,1.);}`,
    });
    this.sky = new T.Mesh(geometry, mat);
    this.scene.add(this.sky);
    let positions = [],
      colors = [];
    let rand = seedRandom(47);
    for (let i = 0; i < 4500; i++) {
      let a = rand() * Math.PI * 2,
        z = rand() * 2 - 1,
        r = Math.sqrt(1 - z * z),
        d = 18000 + rand() * 12000;
      positions.push(Math.cos(a) * r * d, z * d, Math.sin(a) * r * d);
      let c = new T.Color().setHSL(
        0.55 + rand() * 0.15,
        0.15 + rand() * 0.4,
        0.55 + rand() * 0.4,
      );
      colors.push(c.r, c.g, c.b);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    this.stars = new T.Points(
      g,
      new T.PointsMaterial({
        size: 14,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    this.scene.add(this.stars);
  }
  texture(name, extension = "jpg") {
    if (this.textureCache.has(name)) return this.textureCache.get(name);
    let resolve, reject;
    this.texturePromises.push(
      new Promise((a, b) => {
        resolve = a;
        reject = b;
      }),
    );
    const tex = new T.TextureLoader().load(
      ASSET + "textures/" + name + "." + extension,
      resolve,
      undefined,
      () => reject(Error("Planettexturen " + name + " kunde inte laddas.")),
    );
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.textureCache.set(name, tex);
    return tex;
  }
  makePlanets() {
    for (const b of WORLDS) {
      const group = new T.Group(),
        map = this.texture(b.texture || b.id);
      const material = new T.MeshStandardMaterial({
        map,
        roughness: b.id === "earth" ? 0.75 : 1,
        bumpMap: b.land ? map : null,
        bumpScale: b.land ? b.r * 0.002 : 0,
      });
      if (b.id === "earth") {
        material.emissiveMap = this.texture("earth-night");
        material.emissive = new T.Color(0xffd69f);
        material.emissiveIntensity = 0.7;
      }
      const globe = new T.Mesh(new T.SphereGeometry(b.r, 96, 64), material);
      group.add(globe);
      globe.rotation.z = b.id === "uranus" ? 1.7 : 0.05;
      if (!b.land) {
        const atmosphere = new T.Mesh(
          new T.SphereGeometry(b.r * 1.035, 64, 48),
          new T.ShaderMaterial({
            transparent: true,
            side: T.BackSide,
            depthWrite: false,
            blending: T.AdditiveBlending,
            uniforms: { glow: { value: new T.Color(b.color) } },
            vertexShader:
              "varying vec3 n;varying vec3 e;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);e=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
            fragmentShader:
              "varying vec3 n;varying vec3 e;uniform vec3 glow;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(e))),3.5);gl_FragColor=vec4(glow*f*.6,f*.55);}",
          }),
        );
        group.add(atmosphere);
      }
      let clouds;
      if (b.id === "earth") {
        const ct = this.texture("earth-clouds");
        clouds = new T.Mesh(
          new T.SphereGeometry(b.r * 1.009, 64, 48),
          new T.MeshStandardMaterial({
            map: ct,
            alphaMap: ct,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }),
        );
        group.add(clouds);
      }
      let ring;
      if (["saturn", "uranus"].includes(b.id)) {
        const inner = b.r * 1.35,
          outer = b.r * (b.id === "saturn" ? 2.45 : 1.9);
        let geo = new T.RingGeometry(inner, outer, 256, 6);
        let uv = geo.attributes.uv,
          p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          let r = Math.hypot(p.getX(i), p.getY(i));
          uv.setXY(i, (r - inner) / (outer - inner), 0.5);
        }
        const tex = this.texture("rings", "png");
        ring = new T.Mesh(
          geo,
          new T.MeshStandardMaterial({
            map: tex,
            side: T.DoubleSide,
            transparent: true,
            opacity: b.id === "saturn" ? 0.9 : 0.28,
            roughness: 1,
            metalness: 0,
            emissive: 0x6f4313,
            emissiveIntensity: 0.16,
            depthWrite: false,
          }),
        );
        ring.rotation.x = -Math.PI / 2 + 0.25;
        ring.rotation.y = 0.1;
        group.add(ring);
      }
      this.spaceRoot.add(group);
      this.planets.set(b.id, {
        body: b,
        group,
        globe,
        clouds,
        ring,
        position: vec(worldPosition(b)),
      });
    }
    const sun = new T.Mesh(
      new T.SphereGeometry(500, 64, 48),
      new T.MeshBasicMaterial({ map: this.texture("sun"), color: 0xffdca0 }),
    );
    this.spaceRoot.add(sun);
    this.sun = sun;
    const glowtex = this.radialTexture();
    this.sunGlow = new T.Sprite(
      new T.SpriteMaterial({
        map: glowtex,
        color: 0xffb54d,
        transparent: true,
        blending: T.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.sunGlow.scale.setScalar(2700);
    this.spaceRoot.add(this.sunGlow);
  }
  radialTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    let x = c.getContext("2d"),
      g = x.createRadialGradient(64, 64, 1, 64, 64, 64);
    g.addColorStop(0, "#ffffffff");
    g.addColorStop(0.15, "#ffffffaa");
    g.addColorStop(0.45, "#ffffff30");
    g.addColorStop(1, "#ffffff00");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }
  makeEngines() {
    this.flames = [];
    const tex = this.radialTexture();
    for (const x of [-1.15, 1.15]) {
      const flame = new T.Mesh(
        new T.ConeGeometry(0.7, 5, 24, 1, true),
        new T.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: T.DoubleSide,
          blending: T.AdditiveBlending,
          uniforms: { time: { value: 0 } },
          vertexShader:
            "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
          fragmentShader:
            "varying vec2 v;uniform float time;void main(){float a=pow(1.-v.y,1.8)*(0.75+0.25*sin(v.x*36.+v.y*20.-time*35.));vec3 c=mix(vec3(.4,.95,1.),vec3(.02,.2,1.),v.y);gl_FragColor=vec4(c*2.,a*.7);}",
        }),
      );
      flame.rotation.x = Math.PI / 2;
      flame.position.set(x, -0.15, 6.5);
      this.rocket.add(flame);
      this.flames.push(flame);
      const light = new T.PointLight(0x32caff, 4, 20, 2);
      light.position.set(x, -0.15, 4.4);
      this.rocket.add(light);
      const halo = new T.Sprite(
        new T.SpriteMaterial({
          map: tex,
          color: 0x22bbff,
          blending: T.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.position.copy(light.position);
      halo.scale.setScalar(3);
      this.rocket.add(halo);
    }
  }
  makeStations() {
    this.stations = [];
    for (const b of WORLDS.filter((b) => b.station)) {
      const model = this.assets.station.clone(true);
      model.scale.setScalar(2);
      this.spaceRoot.add(model);
      this.stations.push({ body: b, model, position: new T.Vector3() });
    }
  }
  stationPosition(body, time) {
    const p = vec(worldPosition(body, time));
    return p.add(new T.Vector3(body.r * 0.5, body.r * 0.35, body.r * 2.1 + 80));
  }
  makeAsteroids() {
    const prototypes = [];
    this.assets.asteroids.traverse((o) => {
      if (o.isMesh) prototypes.push(o);
    });
    const rand = seedRandom(86),
      dummy = new T.Object3D();
    this.belt = new T.Group();
    this.spaceRoot.add(this.belt);
    this.ringRocks = new T.Group();
    this.spaceRoot.add(this.ringRocks);
    this.rockBounds = [];
    prototypes.slice(0, 18).forEach((proto, k) => {
      for (const type of ["belt", "rings"]) {
        const n = type === "belt" ? 40 : 25;
        const mesh = new T.InstancedMesh(proto.geometry, proto.material, n);
        for (let j = 0; j < n; j++) {
          const a = rand() * Math.PI * 2;
          const rad =
            type === "belt" ? 6400 + rand() * 500 : 600 + rand() * 440;
          const size = type === "belt" ? 3 + rand() * 16 : 1 + rand() * 5;
          dummy.position.set(
            Math.cos(a) * rad,
            (rand() - 0.5) * (type === "belt" ? 220 : 12),
            Math.sin(a) * rad,
          );
          dummy.rotation.set(rand() * 6, rand() * 6, rand() * 6);
          dummy.scale.setScalar(size);
          dummy.updateMatrix();
          mesh.setMatrixAt(j, dummy.matrix);
          this.rockBounds.push({
            type,
            position: dummy.position.clone(),
            r: size * 1.1,
          });
        }
        mesh.computeBoundingSphere();
        (type === "belt" ? this.belt : this.ringRocks).add(mesh);
      }
    });
    this.ringRocks.rotation.x = 0.25;
    this.ringRocks.rotation.z = 0.1;
  }
  makeCollectibles() {
    this.collectibles = [];
    for (const b of WORLDS) {
      for (let i = 0; i < 3; i++) {
        const model = this.assets.crystal.clone(true);
        model.scale.setScalar(2);
        const offset = new T.Vector3(
          b.r * 0.85 + (i - 1) * 45,
          b.r * 0.45 + 10,
          b.r * 2.8 + 40 - i * 35,
        );
        this.spaceRoot.add(model);
        this.collectibles.push({
          id: b.id + "-" + i,
          body: b,
          offset,
          model,
          position: new T.Vector3(),
        });
      }
    }
  }
  makeGoal() {
    this.goal = new T.Group();
    const g = new T.TorusGeometry(13, 0.45, 8, 64);
    this.goalRing = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0x69e4ff }));
    this.goal.add(this.goalRing);
    this.goalCrystal = this.assets.crystal.clone(true);
    this.goalCrystal.scale.setScalar(3);
    this.goal.add(this.goalCrystal);
    this.goalStation = this.assets.satellite.clone(true);
    this.goalStation.scale.setScalar(1.2);
    this.goal.add(this.goalStation);
    this.goalRover = this.assets.rover.clone(true);
    this.goal.add(this.goalRover);
    this.scene.add(this.goal);
    this.goal.visible = false;
  }
  setGoal(position, type) {
    this.goalType = type;
    this.goalWorld = position ? vec(position) : null;
    this.goal.visible = !!position;
    this.goalRing.visible = type === "gate";
    this.goalCrystal.visible = ["collect", "sample"].includes(type);
    this.goalStation.visible = type === "repair" || (type === "rescue" && !this.surface);
    this.goalRover.visible = type === "rescue" && !!this.surface;
  }
  setPaint(color, model = "explorer", wings = "standard") {
    const colors = {
      red: 0xb91e2b,
      blue: 0x246fce,
      gold: 0xe2ac3e,
      purple: 0x7e3cac,
    };
    if (!this.rocketModel) return;
    for (const root of [this.assets.rocket, this.assets.rocketLow])
      root.traverse((o) => {
        if (o.isMesh && o.material) {
          if (!o.userData.originalMat) {
            o.material = o.material.clone();
            o.userData.originalMat = true;
          }
          if (/red|accent|crimson/i.test(o.material.name))
            o.material.color.set(colors[color] || colors.red);
          if (/wing/i.test(o.name)) {
            o.scale.x = wings === "swept" ? 1.2 : 1;
          }
        }
      });
    for (const root of [this.assets.rocket, this.assets.rocketLow])
      root.scale.set(
        model === "comet" ? 0.85 : model === "ranger" ? 1.12 : 1,
        model === "ranger" ? 1.1 : 1,
        model === "comet" ? 1.18 : 1,
      );
    this.landingHeight = 2.53 * this.assets.rocket.scale.y + 0.65;
  }
  terrainHeight(x, z, body) {
    const k = body === "mars" ? 1.4 : 0.65;
    let waves =
      (Math.sin(x * 0.012) * 14 +
        Math.cos(z * 0.017) * 10 +
        Math.sin(x * 0.035 + z * 0.023) * 5) *
      k;
    if (body === "mars") {
      const canyon = Math.abs(x - 110 * Math.sin(z * 0.006));
      waves += 55 * (1 - Math.exp(-Math.pow(canyon / 80, 4))) - 20;
      waves += Math.sin(z * 0.08) * Math.sin(x * 0.05) * 3;
    } else {
      for (const [cx, cz, r] of [
        [170, -120, 65],
        [-220, 160, 90],
        [310, 290, 100],
        [-310, -290, 85],
      ]) {
        const d = Math.hypot(x - cx, z - cz) / r;
        waves +=
          16 * Math.exp(-Math.pow((d - 1) / 0.15, 2)) -
          22 * Math.exp(-d * d * 2);
      }
    }
    const flatten = Math.min(1, Math.max(0, (Math.hypot(x, z) - 40) / 70));
    return waves * flatten * flatten;
  }
  makeSurface(body) {
    this.clearSurface();
    this.surface = body;
    this.surfaceRoot.visible = true;
    this.spaceRoot.visible = false;
    const geo = new T.PlaneGeometry(1400, 1400, 180, 180);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const color = new T.Color(body.color);
    let cols = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i),
        y = this.terrainHeight(x, z, body.id);
      p.setY(i, y);
      const c = color
        .clone()
        .multiplyScalar(
          0.64 +
            0.2 * Math.sin(x * 0.07 + z * 0.08) +
            0.15 * Math.cos(z * 0.17),
        );
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    let tex = this.texture(body.id === "mars" ? "mars" : "moon").clone();
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(9, 9);
    let terrain = new T.Mesh(
      geo,
      new T.MeshStandardMaterial({
        map: tex,
        bumpMap: tex,
        bumpScale: 1.1,
        vertexColors: true,
        roughness: 1,
      }),
    );
    terrain.receiveShadow = true;
    this.surfaceRoot.add(terrain);
    const base = this.assets.base.clone(true);
    base.scale.setScalar(2);
    base.position.set(0, 0, 0);
    this.surfaceRoot.add(base);
    const ship = this.rocket;
    ship.position.set(0, this.landingHeight || 3.18, 0);
    this.rover = this.assets.rover.clone(true);
    this.rover.rotation.order = "YXZ";
    this.roverWheels = [];
    this.rover.traverse((o) => { if (/^Wheel/.test(o.name)) this.roverWheels.push(o); });
    this.rover.position.set(12, this.terrainHeight(12, 10, body.id) + 0.15, 10);
    this.surfaceRoot.add(this.rover);
    const proto = [];
    this.assets.asteroids.traverse((o) => {
      if (o.isMesh) proto.push(o);
    });
    const rand = seedRandom(230);
    const dummy = new T.Object3D();
    proto.slice(0, 9).forEach((p) => {
      const mesh = new T.InstancedMesh(p.geometry, p.material, 35);
      for (let i = 0; i < 35; i++) {
        let x = (rand() - 0.5) * 1300,
          z = (rand() - 0.5) * 1300;
        let sz = 2 + rand() * 12;
        if (Math.hypot(x, z) < 55) x += 100;
        dummy.position.set(x, this.terrainHeight(x, z, body.id) + sz * 0.15, z);
        dummy.rotation.set(rand() * 3, rand() * 6, rand() * 3);
        dummy.scale.set(sz, sz * (0.6 + rand()), sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      this.surfaceRoot.add(mesh);
    });
    this.scene.fog = new T.FogExp2(
      body.id === "mars" ? 0x984d32 : 0x101824,
      body.id === "mars" ? 0.0012 : 0.0005,
    );
    this.renderer.setClearColor(body.id === "mars" ? 0x1d1015 : 0x020814);
    this.sunlight.position.set(160, 230, 140);
    this.sunlight.target.position.set(0, 0, 0);
    this.sunlight.castShadow = true;
    Object.assign(this.sunlight.shadow.camera, {
      left: -120,
      right: 120,
      top: 120,
      bottom: -120,
      near: 1,
      far: 800,
    });
    this.sunlight.shadow.mapSize.set(1024, 1024);
    this.sunlight.shadow.bias = -0.0005;
  }
  clearSurface() {
    while (this.surfaceRoot.children.length) {
      const o = this.surfaceRoot.children[0];
      this.surfaceRoot.remove(o);
      if (o.geometry?.type === "PlaneGeometry") {
        o.geometry.dispose();
        o.material.map?.dispose();
        o.material.dispose();
      } else if (o.isInstancedMesh) o.dispose();
    }
    this.surfaceRoot.visible = false;
    this.spaceRoot.visible = true;
    this.surface = null;
    this.scene.fog = null;
    this.sunlight.castShadow = false;
    this.rover = null;
  }
  update(dt, ship, time, options) {
    this.elapsed += dt;
    const {
      cameraMode = 0,
      home = false,
      boost = false,
      rover = false,
      turn = 0,
    } = options;
    this.sky.position.copy(this.camera.position);
    this.stars.position.copy(this.camera.position);
    this.sky.material.uniforms.time.value = this.elapsed;
    const pos = vec(ship.position);
    this.origin.copy(this.surface ? new T.Vector3() : pos);
    this.rocket.position.copy(
      this.surface
        ? new T.Vector3(0, options.landing ? pos.y : this.landingHeight || 3.18, 0)
        : pos.clone().sub(this.origin),
    );
    for (const root of [this.assets?.rocket, this.assets?.rocketLow])
      root?.traverse((o) => {
        if (o.name === "LandingGear") o.visible = !!this.surface;
        if (/PilotHead|PilotVisor|Helmet ear/.test(o.name))
          o.visible = cameraMode !== 2;
      });
    this.rocket.rotation.set(
      this.surface ? 0 : ship.pitch,
      this.surface ? 0 : ship.yaw,
      this.surface ? 0 : -turn * 0.18,
      "YXZ",
    );
    this.spaceRoot.position.copy(this.origin).multiplyScalar(-1);
    for (const [id, p] of this.planets) {
      p.position.copy(vec(worldPosition(p.body, time)));
      p.group.position.copy(p.position);
      p.globe.rotation.y += dt * 0.015;
      if (p.clouds) p.clouds.rotation.y += dt * 0.019;
    }
    if (this.ringRocks)
      this.ringRocks.position.copy(this.planets.get("saturn").position);
    for (const c of this.collectibles || []) {
      c.position.copy(vec(worldPosition(c.body, time))).add(c.offset);
      c.model.position.copy(c.position);
      c.model.rotation.y += dt * 0.4;
    }
    for (const s of this.stations || []) {
      s.position.copy(this.stationPosition(s.body, time));
      s.model.position.copy(s.position);
    }
    if (!this.surface) {
      this.sunlight.position
        .copy(this.origin)
        .multiplyScalar(-1)
        .normalize()
        .multiplyScalar(200);
      this.sunlight.target.position.set(0, 0, 0);
      this.sunGlow.position.set(0, 0, 0);
      this.sun.rotation.y += dt * 0.01;
    }
    for (const m of this.mixers) m.update(dt);
    for (const f of this.flames || []) {
      const power = this.surface ? 0.05 : 0.5 + ship.speed / 90;
      f.scale.y = power * (boost ? 1.5 : 1);
      f.position.z = 4.4 + 2.5 * f.scale.y;
      f.material.uniforms.time.value = this.elapsed;
      f.visible = !rover;
    }
    let target = new T.Vector3(),
      desired = new T.Vector3();
    const q = new T.Quaternion().setFromEuler(
      new T.Euler(ship.pitch, ship.yaw, 0, "YXZ"),
    );
    if (this.surface && this.rover) {
      this.rover.visible = rover;
      if (rover) {
        this.rover.position.copy(pos);
        this.rover.rotation.y = ship.yaw;
        const forward = new T.Vector3(-Math.sin(ship.yaw), 0, -Math.cos(ship.yaw));
        const right = new T.Vector3(Math.cos(ship.yaw), 0, -Math.sin(ship.yaw));
        const height = (offset) => this.terrainHeight(pos.x + offset.x, pos.z + offset.z, this.surface.id);
        this.rover.rotation.order = "YXZ";
        this.rover.rotation.x = Math.atan2(height(forward.clone().multiplyScalar(2)) - height(forward.clone().multiplyScalar(-2)), 4);
        this.rover.rotation.z = Math.atan2(height(right.clone().multiplyScalar(1.2)) - height(right.clone().multiplyScalar(-1.2)), 2.4);
        for (const wheel of this.roverWheels) wheel.rotateZ(-ship.speed * dt / 0.48);
        target.copy(pos).add(new T.Vector3(0, 2, 0));
        desired.copy(new T.Vector3(0, 7, 15).applyQuaternion(q).add(pos));
      } else {
        target.set(0, 3, 0);
        desired.set(14, 12, 22);
      }
      if (cameraMode >= 3) {
        const o = this.orbit;
        const center = rover ? pos : new T.Vector3(0, 5, 0);
        target.copy(center).add(new T.Vector3(0, 1, 0));
        desired.set(Math.sin(o.yaw) * Math.cos(o.pitch) * o.distance,
          Math.sin(o.pitch) * o.distance, Math.cos(o.yaw) * Math.cos(o.pitch) * o.distance).add(center);
      } else if (cameraMode === 2 && rover) {
        desired.copy(pos).add(new T.Vector3(0, 2.4, -0.2).applyQuaternion(q));
        target.copy(pos).add(new T.Vector3(0, 2.4, -20).applyQuaternion(q));
      }
      desired.y = Math.max(desired.y, this.terrainHeight(desired.x, desired.z, this.surface.id) + 4);
    } else if (home) {
      target.set(1, 0, -7);
      desired.set(-16, 8, 19);
    } else if (cameraMode === 2) {
      desired.set(0, 1.9, 0.15).applyQuaternion(q);
      target.copy(new T.Vector3(0, 1.25, -6).applyQuaternion(q));
    } else if (cameraMode === 1) {
      desired.set(-19, 7, 13).applyQuaternion(q);
      target.set(0, 0, -5).applyQuaternion(q);
    } else if (cameraMode === 3 || cameraMode === 4) {
      const o = this.orbit;
      desired.set(
        Math.sin(o.yaw) * Math.cos(o.pitch) * o.distance,
        Math.sin(o.pitch) * o.distance,
        Math.cos(o.yaw) * Math.cos(o.pitch) * o.distance,
      );
      target.set(0, 1, 0);
    } else {
      desired.set(0, 5.5, 18 + (boost ? 7 : 0)).applyQuaternion(q);
      target.set(0, 0, -24).applyQuaternion(q);
    }
    if (
      !this.lastCamera ||
      this.lastMode !== cameraMode ||
      this.lastSurface !== !!this.surface
    )
      this.camera.position.copy(desired);
    else this.camera.position.lerp(desired, 1 - Math.exp(-(options.cameraDt ?? dt) * 5));
    if (this.surface) this.camera.position.y = Math.max(this.camera.position.y,
      this.terrainHeight(this.camera.position.x, this.camera.position.z, this.surface.id) + 3);
    this.camera.lookAt(target);
    this.lastCamera = true;
    this.lastMode = cameraMode;
    this.lastSurface = !!this.surface;
    if (this.goalWorld) {
      this.goal.position.copy(this.goalWorld).sub(this.origin);
      this.goalRing.lookAt(this.camera.position);
      this.goalCrystal.rotation.y += dt * 0.5;
    }
    this.render();
  }
  setupPost() {
    this.target = new T.WebGLRenderTarget(1, 1, { depthBuffer: true,
      type: this.renderer.capabilities.isWebGL2 && this.renderer.extensions?.has("EXT_color_buffer_float") ? T.HalfFloatType : T.UnsignedByteType });
    this.postScene = new T.Scene();
    this.postCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postMaterial = new T.ShaderMaterial({
      uniforms: {
        image: { value: this.target.texture },
        pixel: { value: new T.Vector2(1, 1) },
        strength: { value: 0.18 },
      },
      vertexShader:
        "varying vec2 uvv;void main(){uvv=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: `varying vec2 uvv;uniform sampler2D image;uniform vec2 pixel;uniform float strength;void main(){vec3 c=texture2D(image,uvv).rgb;vec3 bloom=vec3(0.);for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){vec3 s=texture2D(image,uvv+vec2(float(x),float(y))*pixel*3.).rgb;bloom+=max(s-vec3(.72),vec3(0.));}c+=bloom/25.*strength;float vign=1.-.18*dot(uvv-.5,uvv-.5);gl_FragColor=vec4(c*vign,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    });
    this.postScene.add(
      new T.Mesh(new T.PlaneGeometry(2, 2), this.postMaterial),
    );
  }
  render() {
    if (this.quality === "low") {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    } else {
      this.renderer.setRenderTarget(this.target);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.postScene, this.postCamera);
    }
  }
  resize() {
    const w = innerWidth,
      h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    if (this.target) {
      const size = new T.Vector2();
      this.renderer.getDrawingBufferSize(size);
      this.target.setSize(size.x, size.y);
      this.postMaterial.uniforms.pixel.value.set(1 / size.x, 1 / size.y);
    }
  }
  setQuality(q) {
    this.quality = q;
    this.resolutionScale = 1;
    this.slowFrames = 0;
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, q === "low" ? 1 : q === "high" ? 2 : 1.5),
    );
    this.renderer.shadowMap.enabled = q !== "low";
    this.stars?.geometry.setDrawRange(
      0,
      q === "low" ? 1500 : q === "medium" ? 3000 : 4500,
    );
    if (this.assets?.rocketLow) {
      this.assets.rocket.visible = q !== "low";
      if (!this.assets.rocketLow.parent) this.rocket.add(this.assets.rocketLow);
      this.assets.rocketLow.visible = q === "low";
    }
    this.resize();
  }
  adaptResolution(fps) {
    if (!Number.isFinite(fps) || fps <= 0) return;
    this.slowFrames = fps < 28 ? (this.slowFrames || 0) + 1 : 0;
    if (this.slowFrames < 2 || this.resolutionScale <= 0.6) return;
    this.resolutionScale = Math.max(0.6, this.resolutionScale - 0.1);
    this.slowFrames = 0;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,
      this.quality === "low" ? 1 : this.quality === "high" ? 2 : 1.5) * this.resolutionScale);
    this.resize();
  }
  screenshot() {
    this.render();
    const a = document.createElement("a");
    a.download = "Rymdaventyret-" + Date.now() + ".png";
    a.href = this.canvas.toDataURL("image/png");
    a.click();
  }
  project(position) {
    return vec(position).sub(this.origin).project(this.camera);
  }
}
export function seedRandom(s) {
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
