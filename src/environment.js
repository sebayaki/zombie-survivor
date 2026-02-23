import * as THREE from "three";

// ============================================================
// PROCEDURAL TEXTURES (canvas-based, no external assets needed)
// ============================================================

function createAsphaltTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const imageData = ctx.createImageData(size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    d[i] = 38 + n;
    d[i + 1] = 38 + n;
    d[i + 2] = 42 + n;
    d[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  for (let i = 0; i < 6000; i++) {
    const b = 65 + Math.random() * 25;
    ctx.fillStyle = `rgba(${b},${b},${b + 3},0.35)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }

  ctx.lineCap = "round";
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    const segs = 5 + Math.floor(Math.random() * 6);
    for (let j = 0; j < segs; j++) {
      x += (Math.random() - 0.5) * 70;
      y += (Math.random() - 0.5) * 70;
      ctx.lineTo(x, y);
      if (Math.random() > 0.65) {
        ctx.lineTo(
          x + (Math.random() - 0.5) * 35,
          y + (Math.random() - 0.5) * 35,
        );
        ctx.moveTo(x, y);
      }
    }
    ctx.strokeStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      12 + Math.random() * 20,
      8 + Math.random() * 15,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = `rgba(22,22,26,${0.2 + Math.random() * 0.2})`;
    ctx.fill();
  }

  for (let i = 0; i < 4; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 12 + Math.random() * 20;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(18,12,28,0.25)");
    g.addColorStop(1, "rgba(20,20,25,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(50,50,52,0.06)";
  ctx.fillRect(size * 0.2, 0, size * 0.12, size);
  ctx.fillRect(size * 0.68, 0, size * 0.12, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createAsphaltBumpMap() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4000; i++) {
    const v = 128 + ((Math.random() - 0.5) * 40) | 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const s = Math.random() * 3 + 0.5;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, s, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(40,40,40,0.5)";
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

function createSidewalkTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const imageData = ctx.createImageData(size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] = 72 + n;
    d[i + 1] = 72 + n;
    d[i + 2] = 74 + n;
    d[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  const ps = size / 4;
  ctx.strokeStyle = "rgba(40,40,42,0.6)";
  ctx.lineWidth = 2;
  for (let x = ps; x < size; x += ps) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = ps; y < size; y += ps) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 8 + Math.random() * 15;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(50,48,52,0.2)");
    g.addColorStop(1, "rgba(60,58,62,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ============================================================
// LIGHTING
// ============================================================

export function setupEnhancedLighting(game) {
  const ambient = new THREE.AmbientLight(0x667799, 1.8);
  game.scene.add(ambient);

  const moonLight = new THREE.DirectionalLight(0x8899cc, 2.5);
  moonLight.position.set(10, 60, 15);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 120;
  moonLight.shadow.camera.left = -65;
  moonLight.shadow.camera.right = 65;
  moonLight.shadow.camera.top = 65;
  moonLight.shadow.camera.bottom = -65;
  moonLight.shadow.bias = -0.001;
  game.scene.add(moonLight);

  const cityGlow = new THREE.DirectionalLight(0xffaa66, 0.6);
  cityGlow.position.set(-15, 30, -25);
  game.scene.add(cityGlow);

  const rimLight = new THREE.DirectionalLight(0x445566, 0.8);
  rimLight.position.set(-30, 40, 20);
  game.scene.add(rimLight);

  game.playerLight = new THREE.PointLight(0xffeedd, 30, 18);
  game.playerLight.position.set(0, 8, 0);
  game.scene.add(game.playerLight);
}

// ============================================================
// ARENA (ground, markings, sidewalks, decorations, particles)
// ============================================================

export function createEnhancedArena(game) {
  const arenaSize = game.arenaSize;

  // ---- TEXTURED GROUND ----
  const asphaltMap = createAsphaltTexture();
  const bumpMap = createAsphaltBumpMap();

  const groundGeo = new THREE.PlaneGeometry(
    arenaSize * 2,
    arenaSize * 2,
    64,
    64,
  );
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setZ(i, (Math.random() - 0.5) * 0.12);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    map: asphaltMap,
    bumpMap: bumpMap,
    bumpScale: 0.3,
    color: 0x333338,
    roughness: 0.92,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  game.scene.add(ground);

  // ---- PUDDLES (reflective patches) ----
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x0a1525,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.55,
  });
  for (let i = 0; i < 14; i++) {
    const pw = 1 + Math.random() * 3;
    const pd = 0.8 + Math.random() * 2;
    const puddle = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(
      (Math.random() - 0.5) * arenaSize * 1.4,
      0.03,
      (Math.random() - 0.5) * arenaSize * 1.4,
    );
    game.scene.add(puddle);
  }

  createEnhancedStreetMarkings(game);
  createEnhancedSidewalks(game);
  game.obstacles = [];
  createEnhancedDecorations(game);
  createGroundDetails(game);
  game.ambientParticles = createAmbientParticles(game);
}

// ============================================================
// STREET MARKINGS
// ============================================================

function createEnhancedStreetMarkings(game) {
  const arenaSize = game.arenaSize;
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xddaa00 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  const fadedWhite = new THREE.MeshBasicMaterial({ color: 0x888888 });

  const dashLen = 2.5;
  const gapLen = 1.5;
  const span = arenaSize * 0.9;

  for (let z = -span; z < span; z += dashLen + gapLen) {
    const d1 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, dashLen),
      yellowMat,
    );
    d1.rotation.x = -Math.PI / 2;
    d1.position.set(-0.15, 0.025, z);
    game.scene.add(d1);

    const d2 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, dashLen),
      yellowMat,
    );
    d2.rotation.x = -Math.PI / 2;
    d2.position.set(0.15, 0.025, z + gapLen * 0.5);
    game.scene.add(d2);
  }

  for (const offset of [-10, 10]) {
    const sideLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, arenaSize * 1.8),
      fadedWhite,
    );
    sideLine.rotation.x = -Math.PI / 2;
    sideLine.position.set(offset, 0.025, 0);
    game.scene.add(sideLine);
  }

  for (const z of [-25, 25]) {
    for (let x = -6; x <= 6; x += 1.8) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 3.5),
        whiteMat,
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.025, z);
      game.scene.add(stripe);
    }
  }

  for (const [x, z] of [
    [-5, 10],
    [5, -10],
  ]) {
    const shaft = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 2.2),
      fadedWhite,
    );
    shaft.rotation.x = -Math.PI / 2;
    shaft.position.set(x, 0.025, z);
    game.scene.add(shaft);

    const head = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.5),
      fadedWhite,
    );
    head.rotation.x = -Math.PI / 2;
    head.position.set(x, 0.025, z - 1.35);
    game.scene.add(head);
  }
}

// ============================================================
// SIDEWALKS
// ============================================================

function createEnhancedSidewalks(game) {
  const arenaSize = game.arenaSize;
  const swMap = createSidewalkTexture();

  const swMat = new THREE.MeshStandardMaterial({
    map: swMap,
    color: 0x666668,
    roughness: 0.85,
    metalness: 0.02,
  });
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x555558,
    roughness: 0.7,
  });

  const sw = 5;
  const ch = 0.25;

  const defs = [
    {
      x: -arenaSize + sw / 2,
      z: 0,
      w: sw,
      l: arenaSize * 2,
      cx: -arenaSize + sw,
      dir: "z",
    },
    {
      x: arenaSize - sw / 2,
      z: 0,
      w: sw,
      l: arenaSize * 2,
      cx: arenaSize - sw,
      dir: "z",
    },
    {
      x: 0,
      z: -arenaSize + sw / 2,
      w: arenaSize * 2 - sw * 2,
      l: sw,
      cz: -arenaSize + sw,
      dir: "x",
    },
    {
      x: 0,
      z: arenaSize - sw / 2,
      w: arenaSize * 2 - sw * 2,
      l: sw,
      cz: arenaSize - sw,
      dir: "x",
    },
  ];

  for (const d of defs) {
    const surface = new THREE.Mesh(
      new THREE.BoxGeometry(d.w, 0.2, d.l),
      swMat,
    );
    surface.position.set(d.x, 0.1, d.z);
    surface.receiveShadow = true;
    game.scene.add(surface);

    if (d.dir === "z") {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.3, ch, d.l), curbMat);
      curb.position.set(d.cx, ch / 2, d.z);
      curb.castShadow = true;
      curb.receiveShadow = true;
      game.scene.add(curb);
    } else {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(d.w, ch, 0.3), curbMat);
      curb.position.set(d.x, ch / 2, d.cz);
      curb.castShadow = true;
      curb.receiveShadow = true;
      game.scene.add(curb);
    }
  }
}

// ============================================================
// DECORATIONS (buildings, cars, lamps, obstacles)
// ============================================================

const NEON_COLORS = [
  0xff2244, 0x22aaff, 0xff6600, 0xaa22ff, 0x22ff88, 0xff44aa, 0xffaa00,
  0x44ffff,
];

const BUILDING_MATS = [
  new THREE.MeshLambertMaterial({ color: 0x4a4a5a }),
  new THREE.MeshLambertMaterial({ color: 0x504858 }),
  new THREE.MeshLambertMaterial({ color: 0x3d4050 }),
  new THREE.MeshLambertMaterial({ color: 0x454555 }),
  new THREE.MeshLambertMaterial({ color: 0x3a3a48 }),
];

function createEnhancedDecorations(game) {
  const arenaSize = game.arenaSize;
  const buildingPositions = [];

  for (let i = 0; i < 35; i++) {
    const side = Math.floor(Math.random() * 4);
    let x, z;
    const edge = arenaSize - 2;
    const spread = arenaSize * 1.6;

    switch (side) {
      case 0:
        x = -edge - Math.random() * 4;
        z = (Math.random() - 0.5) * spread;
        break;
      case 1:
        x = edge + Math.random() * 4;
        z = (Math.random() - 0.5) * spread;
        break;
      case 2:
        x = (Math.random() - 0.5) * spread;
        z = -edge - Math.random() * 4;
        break;
      case 3:
        x = (Math.random() - 0.5) * spread;
        z = edge + Math.random() * 4;
        break;
    }

    buildingPositions.push({ x, z });
    const building = createEnhancedBuilding();
    building.position.set(x, 0, z);
    building.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
    game.scene.add(building);
  }

  // Neon light pools on ground near buildings
  for (let i = 0; i < 18; i++) {
    const bp = buildingPositions[i % buildingPositions.length];
    const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    const ox = (Math.random() - 0.5) * 10;
    const oz = (Math.random() - 0.5) * 10;
    const gx = Math.max(
      -arenaSize + 6,
      Math.min(arenaSize - 6, bp.x + ox),
    );
    const gz = Math.max(
      -arenaSize + 6,
      Math.min(arenaSize - 6, bp.z + oz),
    );

    const poolR = 2 + Math.random() * 2.5;
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(poolR, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.07 + Math.random() * 0.05,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(gx, 0.04, gz);
    game.scene.add(pool);

    const core = new THREE.Mesh(
      new THREE.CircleGeometry(poolR * 0.4, 12),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.04,
      }),
    );
    core.rotation.x = -Math.PI / 2;
    core.position.set(gx, 0.045, gz);
    game.scene.add(core);
  }

  // Cars
  for (let i = 0; i < 10; i++) {
    const pos = game.findValidObstaclePosition(12, 42, 5);
    if (!pos) continue;
    const car = createEnhancedCar();
    car.position.set(pos.x, 0, pos.z);
    car.rotation.y = Math.random() * Math.PI * 2;
    game.scene.add(car);
    game.obstacles.push({
      mesh: car,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      size: new THREE.Vector3(2, 1.5, 4),
      radius: 3,
    });
  }

  // Street lamps with light pools
  for (let i = 0; i < 12; i++) {
    const pos = game.findValidObstaclePosition(15, 45, 4);
    if (!pos) continue;
    const lamp = createEnhancedStreetLamp();
    lamp.position.set(pos.x, 0, pos.z);
    game.scene.add(lamp);
    game.obstacles.push({
      mesh: lamp,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      size: new THREE.Vector3(0.5, 4, 0.5),
      radius: 1.5,
    });
  }

  // Varied small obstacles
  for (let i = 0; i < 12; i++) {
    const pos = game.findValidObstaclePosition(10, 40, 2);
    if (!pos) continue;
    const r = Math.random();
    let obstacle;
    if (r < 0.25) obstacle = createDumpster();
    else if (r < 0.5) obstacle = createBarricade();
    else if (r < 0.75) obstacle = createTrashCan();
    else obstacle = createFireHydrant();

    obstacle.position.set(pos.x, 0, pos.z);
    obstacle.rotation.y = Math.random() * Math.PI * 2;
    game.scene.add(obstacle);
    game.obstacles.push({
      mesh: obstacle,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      size: new THREE.Vector3(0.8, 1, 0.8),
      radius: 1,
    });
  }
}

// ============================================================
// BUILDING
// ============================================================

function createEnhancedBuilding() {
  const group = new THREE.Group();
  const width = 5 + Math.random() * 7;
  const depth = 5 + Math.random() * 7;
  const height = 10 + Math.random() * 20;

  const wallMat =
    BUILDING_MATS[Math.floor(Math.random() * BUILDING_MATS.length)];
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    wallMat,
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Lit windows on all faces (planes slightly offset from each face)
  const windowLitMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
  const windowDarkMat = new THREE.MeshBasicMaterial({ color: 0x1a1a28 });
  const wRows = Math.min(6, Math.floor(height / 3));
  const wCols = Math.floor(width / 2);

  for (let wy = 0; wy < wRows; wy++) {
    const yPos = 2.5 + wy * 3;
    for (let wx = 0; wx < wCols; wx++) {
      const xPos = (wx - (wCols - 1) / 2) * 1.8;
      const isLit = Math.random() > 0.35;
      const wMat = isLit ? windowLitMat : windowDarkMat;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.4), wMat);
      win.position.set(xPos, yPos, depth / 2 + 0.02);
      group.add(win);
    }
  }

  // Rooftop surface
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x303038 });
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.3, 0.15, depth - 0.3),
    roofMat,
  );
  roof.position.y = height + 0.08;
  group.add(roof);

  // Parapet
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x404048 });
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.2, 0.35, depth + 0.2),
    trimMat,
  );
  trim.position.y = height;
  group.add(trim);

  // AC units on roof
  const acMat = new THREE.MeshLambertMaterial({ color: 0x667777 });
  const acCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < acCount; i++) {
    const aw = 0.8 + Math.random() * 1.2;
    const ad = 0.6 + Math.random() * 0.8;
    const ac = new THREE.Mesh(new THREE.BoxGeometry(aw, 0.6, ad), acMat);
    ac.position.set(
      (Math.random() - 0.5) * (width - aw - 1),
      height + 0.45,
      (Math.random() - 0.5) * (depth - ad - 1),
    );
    group.add(ac);
  }

  // Water tank (some buildings)
  if (Math.random() > 0.55) {
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
    const tx = (Math.random() - 0.5) * (width - 2);
    const tz = (Math.random() - 0.5) * (depth - 2);
    const legH = 0.7;
    for (const [lx, lz] of [
      [-0.25, -0.25],
      [0.25, -0.25],
      [-0.25, 0.25],
      [0.25, 0.25],
    ]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, legH, 0.06),
        tankMat,
      );
      leg.position.set(tx + lx, height + legH / 2, tz + lz);
      group.add(leg);
    }
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.9, 8),
      tankMat,
    );
    tank.position.set(tx, height + legH + 0.45, tz);
    group.add(tank);
  }

  // Rooftop beacon (some buildings)
  if (Math.random() > 0.7) {
    const bColor = Math.random() > 0.5 ? 0xff3333 : 0x33ff33;
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 6, 6),
      new THREE.MeshBasicMaterial({ color: bColor }),
    );
    beacon.position.set(0, height + 0.5, 0);
    group.add(beacon);
  }

  return group;
}

// ============================================================
// CAR
// ============================================================

function createEnhancedCar() {
  const group = new THREE.Group();
  const carColors = [
    0xaa1818, 0x1818aa, 0x18aa18, 0xaaaa18, 0x181818, 0xcccccc, 0x884400,
    0x444444, 0x662244,
  ];
  const color = carColors[Math.floor(Math.random() * carColors.length)];
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.6,
  });

  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.2), bodyMat);
  lower.position.y = 0.45;
  lower.castShadow = true;
  group.add(lower);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), bodyMat);
  cabin.position.set(0, 0.95, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x112233,
    roughness: 0.1,
    metalness: 0.8,
  });
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), glassMat);
  ws.position.set(0, 0.95, 0.91);
  ws.rotation.x = -0.2;
  group.add(ws);

  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 8);
  for (const [x, z] of [
    [-0.95, 1.2],
    [0.95, 1.2],
    [-0.95, -1.2],
    [0.95, -1.2],
  ]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.28, z);
    group.add(w);
  }

  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
  for (const x of [-0.6, 0.6]) {
    const hl = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      headMat,
    );
    hl.position.set(x, 0.5, 2.1);
    group.add(hl);
  }

  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
  for (const x of [-0.6, 0.6]) {
    const tl = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, 0.05),
      tailMat,
    );
    tl.position.set(x, 0.5, -2.1);
    group.add(tl);
  }

  return group;
}

// ============================================================
// STREET LAMP
// ============================================================

function createEnhancedStreetLamp() {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.4,
    metalness: 0.7,
  });

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 4.5, 6),
    poleMat,
  );
  pole.position.y = 2.25;
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 1.5),
    poleMat,
  );
  arm.position.set(0, 4.3, 0.65);
  group.add(arm);

  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.15, 0.6),
    new THREE.MeshLambertMaterial({ color: 0x333333 }),
  );
  housing.position.set(0, 4.2, 1.3);
  group.add(housing);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffeeaa }),
  );
  bulb.position.set(0, 4.1, 1.3);
  group.add(bulb);

  // Warm light pool on ground
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffddaa,
      transparent: true,
      opacity: 0.08,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.04, 1.3);
  group.add(pool);

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffeebb,
      transparent: true,
      opacity: 0.06,
    }),
  );
  core.rotation.x = -Math.PI / 2;
  core.position.set(0, 0.045, 1.3);
  group.add(core);

  return group;
}

// ============================================================
// SMALL OBSTACLES
// ============================================================

function createDumpster() {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x336633 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.8), mat);
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.05, 0.85),
    new THREE.MeshLambertMaterial({ color: 0x2a552a }),
  );
  lid.position.set(0, 0.92, 0);
  group.add(lid);
  return group;
}

function createBarricade() {
  const group = new THREE.Group();
  const legMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  for (const x of [-0.3, 0.3]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.8, 0.08),
      legMat,
    );
    leg.position.set(x, 0.4, 0);
    group.add(leg);
  }
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xff6600 }),
  );
  bar.position.y = 0.7;
  group.add(bar);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.08, 0.065),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  stripe.position.y = 0.55;
  group.add(stripe);
  return group;
}

function createTrashCan() {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x228822 });
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.3, 1, 8),
    mat,
  );
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.37, 0.06, 8),
    new THREE.MeshLambertMaterial({ color: 0x1a6b1a }),
  );
  lid.position.y = 1.03;
  group.add(lid);
  return group;
}

function createFireHydrant() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.3,
    metalness: 0.5,
  });
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8),
    mat,
  );
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.12, 8),
    mat,
  );
  cap.position.y = 0.76;
  group.add(cap);
  for (const s of [-1, 1]) {
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.15, 6),
      mat,
    );
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.45, s * 0.22);
    group.add(nozzle);
  }
  return group;
}

// ============================================================
// GROUND DETAILS (manholes, drains, blood, debris)
// ============================================================

function createGroundDetails(game) {
  const arenaSize = game.arenaSize;

  // Manhole covers
  const manholeMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3e,
    roughness: 0.5,
    metalness: 0.6,
  });
  const manholeRingMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2e });
  for (let i = 0; i < 6; i++) {
    const mx = (Math.random() - 0.5) * arenaSize * 1.2;
    const mz = (Math.random() - 0.5) * arenaSize * 1.2;
    const mh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.04, 12),
      manholeMat,
    );
    mh.position.set(mx, 0.02, mz);
    game.scene.add(mh);
    for (let r = 0; r < 2; r++) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 0.9),
        manholeRingMat,
      );
      line.rotation.x = -Math.PI / 2;
      line.rotation.z = (r * Math.PI) / 2;
      line.position.set(mx, 0.045, mz);
      game.scene.add(line);
    }
  }

  // Drain grates along curbs
  const grateMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,
    roughness: 0.4,
    metalness: 0.7,
  });
  for (let i = 0; i < 10; i++) {
    const side = Math.random() > 0.5;
    const gx = side ? -arenaSize + 5.5 : arenaSize - 5.5;
    const gz = (Math.random() - 0.5) * arenaSize * 1.4;
    const grate = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.03, 0.4),
      grateMat,
    );
    grate.position.set(gx, 0.015, gz);
    game.scene.add(grate);
  }

  // Blood splatters
  const bloodMat = new THREE.MeshBasicMaterial({
    color: 0x440000,
    transparent: true,
    opacity: 0.3,
  });
  for (let i = 0; i < 10; i++) {
    const bx = (Math.random() - 0.5) * arenaSize * 1.4;
    const bz = (Math.random() - 0.5) * arenaSize * 1.4;
    const bs = 0.5 + Math.random() * 1.8;
    const splat = new THREE.Mesh(new THREE.CircleGeometry(bs, 8), bloodMat);
    splat.rotation.x = -Math.PI / 2;
    splat.position.set(bx, 0.03, bz);
    game.scene.add(splat);
  }

  // Scattered debris
  const debrisMats = [
    new THREE.MeshLambertMaterial({ color: 0x8a8070 }),
    new THREE.MeshLambertMaterial({ color: 0x606050 }),
    new THREE.MeshLambertMaterial({ color: 0x705848 }),
  ];
  for (let i = 0; i < 25; i++) {
    const dx = (Math.random() - 0.5) * arenaSize * 1.6;
    const dz = (Math.random() - 0.5) * arenaSize * 1.6;
    const debris = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.15 + Math.random() * 0.3,
        0.02,
        0.12 + Math.random() * 0.2,
      ),
      debrisMats[Math.floor(Math.random() * debrisMats.length)],
    );
    debris.position.set(dx, 0.01, dz);
    debris.rotation.y = Math.random() * Math.PI * 2;
    game.scene.add(debris);
  }
}

// ============================================================
// AMBIENT PARTICLES (floating embers + dust)
// ============================================================

function createAmbientParticles(game) {
  const count = game.isMobile ? 80 : 200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = 1 + Math.random() * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

    if (Math.random() > 0.6) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.1 + Math.random() * 0.2;
    } else {
      const v = 0.4 + Math.random() * 0.3;
      colors[i * 3] = v;
      colors[i * 3 + 1] = v;
      colors[i * 3 + 2] = v + 0.1;
    }

    velocities.push({
      x: (Math.random() - 0.5) * 0.3,
      y: 0.1 + Math.random() * 0.3,
      z: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  game.scene.add(points);

  return { points, velocities, time: 0 };
}

export function updateAmbientParticles(particles, delta) {
  if (!particles) return;
  particles.time += delta;
  const pos = particles.points.geometry.attributes.position.array;
  const count = pos.length / 3;

  for (let i = 0; i < count; i++) {
    const v = particles.velocities[i];
    const t = particles.time + v.phase;
    pos[i * 3] += (v.x + Math.sin(t * 0.5) * 0.1) * delta;
    pos[i * 3 + 1] += v.y * delta;
    pos[i * 3 + 2] += (v.z + Math.cos(t * 0.7) * 0.1) * delta;

    if (pos[i * 3 + 1] > 18) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
  }

  particles.points.geometry.attributes.position.needsUpdate = true;
}
