import * as THREE from "three";

const NEON_COLORS = [
  0x882211, 0x664422, 0xaa3300, 0x553311, 0x446633, 0x993322, 0x886622,
  0x774433,
];

const BUILDING_MATS = [
  new THREE.MeshLambertMaterial({ color: 0x4a4a5a }),
  new THREE.MeshLambertMaterial({ color: 0x504858 }),
  new THREE.MeshLambertMaterial({ color: 0x3d4050 }),
  new THREE.MeshLambertMaterial({ color: 0x454555 }),
  new THREE.MeshLambertMaterial({ color: 0x3a3a48 }),
];

export { NEON_COLORS, BUILDING_MATS };

export function createEnhancedBuilding() {
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

  const roofMat = new THREE.MeshLambertMaterial({ color: 0x303038 });
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.3, 0.15, depth - 0.3),
    roofMat,
  );
  roof.position.y = height + 0.08;
  group.add(roof);

  const trimMat = new THREE.MeshLambertMaterial({ color: 0x404048 });
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.2, 0.35, depth + 0.2),
    trimMat,
  );
  trim.position.y = height;
  group.add(trim);

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

export function createEnhancedCar() {
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

export function createEnhancedStreetLamp() {
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

export function createDumpster() {
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

export function createBarricade() {
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

export function createTrashCan() {
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

export function createFireHydrant() {
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
