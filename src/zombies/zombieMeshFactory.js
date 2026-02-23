import * as THREE from "three";

export const ENEMY_TYPES = {
  normal: {
    name: "Zombie",
    color: 0x4a6741,
    secondaryColor: 0x3d5636,
    eyeColor: 0xff0000,
    scale: 1,
    speedMult: 1,
    healthMult: 1,
    damageMult: 1,
    xpMult: 1,
  },
  fast: {
    name: "Runner",
    color: 0x8b7355,
    secondaryColor: 0x6b5344,
    eyeColor: 0xffff00,
    scale: 0.75,
    speedMult: 2.2,
    healthMult: 0.4,
    damageMult: 0.7,
    xpMult: 1.5,
  },
  tank: {
    name: "Brute",
    color: 0x5c4a6d,
    secondaryColor: 0x3d3248,
    eyeColor: 0xff00ff,
    scale: 1.6,
    speedMult: 0.45,
    healthMult: 5,
    damageMult: 2.5,
    xpMult: 4,
  },
  spitter: {
    name: "Spitter",
    color: 0x2d5a4a,
    secondaryColor: 0x1d3a2a,
    eyeColor: 0x00ff88,
    glowColor: 0x44ff88,
    scale: 0.9,
    speedMult: 0.65,
    healthMult: 0.7,
    damageMult: 1.2,
    xpMult: 2.5,
    ranged: true,
    attackRange: 10,
    projectileSpeed: 7,
  },
  exploder: {
    name: "Bloater",
    color: 0x8b4513,
    secondaryColor: 0x5c2d0e,
    eyeColor: 0xff6600,
    glowColor: 0xff4400,
    scale: 1.4,
    speedMult: 0.5,
    healthMult: 2,
    damageMult: 0.3,
    xpMult: 3,
    explodeOnDeath: true,
    explosionRadius: 4,
    explosionDamage: 30,
  },
  boss: {
    name: "Abomination",
    color: 0x1a0a2e,
    secondaryColor: 0x0d0519,
    eyeColor: 0xff0088,
    glowColor: 0x8800ff,
    scale: 3.5,
    speedMult: 0.35,
    healthMult: 20,
    damageMult: 3,
    xpMult: 20,
    isBoss: true,
  },
};

function addPart(group, geometry, material, pos, rot) {
  const mesh = new THREE.Mesh(geometry, material);
  if (pos) mesh.position.set(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
  if (rot) {
    if (rot.x) mesh.rotation.x = rot.x;
    if (rot.y) mesh.rotation.y = rot.y;
    if (rot.z) mesh.rotation.z = rot.z;
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addEyes(group, type, s, eyeColor) {
  const eyeGeo = new THREE.SphereGeometry(0.08 * s, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

  const EYE_POS = {
    fast: { y: 1.45, z: 0.28, spread: 0.12 },
    tank: { y: 1.95, z: 0.38, spread: 0.2 },
    spitter: { y: 1.55, z: 0.28, spread: 0.15 },
    exploder: { y: 1.65, z: 0.35, spread: 0.22 },
    boss: { y: 2.6, z: 0.45, spread: 0.25 },
    normal: { y: 1.55, z: 0.28, spread: 0.15 },
  };
  const ep = EYE_POS[type] || EYE_POS.normal;

  addPart(group, eyeGeo, eyeMat, {
    x: -ep.spread * s,
    y: ep.y * s,
    z: ep.z * s,
  });
  addPart(group, eyeGeo, eyeMat, {
    x: ep.spread * s,
    y: ep.y * s,
    z: ep.z * s,
  });

  if (type === "boss") {
    addPart(group, eyeGeo, eyeMat, { x: 0, y: 2.8 * s, z: 0.48 * s });
  }
}

function buildNormalZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  const head = addPart(
    mesh,
    new THREE.SphereGeometry(0.3 * s, 12, 12),
    skinMat,
    { y: 1.55 * s },
    { z: 0.15, x: 0.1 },
  );

  const bodyGeo = new THREE.CapsuleGeometry(0.3 * s, 0.6 * s, 8, 12);
  const body = addPart(
    mesh,
    bodyGeo,
    bodyMat,
    { y: 0.9 * s, z: -0.05 * s },
    { x: 0.15 },
  );
  mesh.userData.body = body;

  const armGeo = new THREE.CapsuleGeometry(0.12 * s, 0.5 * s, 6, 8);
  mesh.userData.leftArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: -0.4 * s, y: 1.1 * s, z: 0.2 * s },
    { x: -Math.PI / 2.2, z: 0.1 },
  );
  mesh.userData.rightArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: 0.4 * s, y: 1.15 * s, z: 0.2 * s },
    { x: -Math.PI / 1.8, z: -0.1 },
  );

  const legGeo = new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.6 * s, 8);
  mesh.userData.leftLeg = addPart(mesh, legGeo, pantsMat, {
    x: -0.18 * s,
    y: 0.3 * s,
  });
  mesh.userData.rightLeg = addPart(mesh, legGeo, pantsMat, {
    x: 0.18 * s,
    y: 0.3 * s,
  });
}

function buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s, eyeColor) {
  addPart(
    mesh,
    new THREE.CapsuleGeometry(0.2 * s, 0.3 * s, 8, 8),
    skinMat,
    { y: 1.45 * s, z: 0.15 * s },
    { x: 0.4 },
  );

  const body = addPart(
    mesh,
    new THREE.CapsuleGeometry(0.25 * s, 0.5 * s, 8, 10),
    bodyMat,
    { y: 0.85 * s, z: -0.1 * s },
    { x: 0.4 },
  );
  mesh.userData.body = body;

  const armGeo = new THREE.CylinderGeometry(0.08 * s, 0.05 * s, 0.7 * s, 6);
  mesh.userData.leftArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: -0.32 * s, y: 0.9 * s, z: 0.3 * s },
    { x: -Math.PI / 2.5, z: 0.2 },
  );
  mesh.userData.rightArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: 0.32 * s, y: 0.9 * s, z: 0.3 * s },
    { x: -Math.PI / 2.5, z: -0.2 },
  );

  const legGeo = new THREE.CapsuleGeometry(0.1 * s, 0.5 * s, 6, 8);
  mesh.userData.leftLeg = addPart(
    mesh,
    legGeo,
    pantsMat,
    { x: -0.15 * s, y: 0.3 * s },
    { x: 0.2 },
  );
  mesh.userData.rightLeg = addPart(
    mesh,
    legGeo,
    pantsMat,
    { x: 0.15 * s, y: 0.3 * s },
    { x: 0.2 },
  );
}

function buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  addPart(mesh, new THREE.SphereGeometry(0.3 * s, 12, 12), skinMat, {
    y: 1.95 * s,
    z: 0.2 * s,
  });

  const bodyGeo = new THREE.SphereGeometry(0.7 * s, 16, 16);
  bodyGeo.scale(1.2, 1.0, 0.8);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.2 * s });
  mesh.userData.body = body;

  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xddddcc,
    roughness: 0.7,
  });
  addPart(
    mesh,
    new THREE.ConeGeometry(0.1 * s, 0.4 * s, 6),
    boneMat,
    { x: -0.4 * s, y: 1.6 * s, z: -0.5 * s },
    { x: -1, z: 0.3 },
  );
  addPart(
    mesh,
    new THREE.ConeGeometry(0.12 * s, 0.5 * s, 6),
    boneMat,
    { x: 0.3 * s, y: 1.5 * s, z: -0.6 * s },
    { x: -1.2, z: -0.2 },
  );

  const armGeo = new THREE.CapsuleGeometry(0.25 * s, 0.9 * s, 10, 10);
  mesh.userData.leftArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: -0.9 * s, y: 1.1 * s, z: 0.1 * s },
    { x: -0.2, z: 0.1 },
  );
  const bigArmGeo = new THREE.CapsuleGeometry(0.35 * s, 1.1 * s, 10, 10);
  mesh.userData.rightArm = addPart(
    mesh,
    bigArmGeo,
    skinMat,
    { x: 1.0 * s, y: 1.0 * s, z: 0.2 * s },
    { x: -0.3, z: -0.1 },
  );

  const legGeo = new THREE.CylinderGeometry(0.3 * s, 0.2 * s, 0.7 * s, 10);
  mesh.userData.leftLeg = addPart(mesh, legGeo, pantsMat, {
    x: -0.35 * s,
    y: 0.35 * s,
  });
  mesh.userData.rightLeg = addPart(mesh, legGeo, pantsMat, {
    x: 0.35 * s,
    y: 0.35 * s,
  });
}

function buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  const headGeo = new THREE.SphereGeometry(0.28 * s, 10, 10);
  headGeo.scale(1, 1.3, 1);
  addPart(
    mesh,
    headGeo,
    skinMat,
    { y: 1.55 * s, z: 0.1 * s },
    { x: 0.2 },
  );

  const body = addPart(
    mesh,
    new THREE.CapsuleGeometry(0.25 * s, 0.6 * s, 8, 8),
    bodyMat,
    { y: 0.9 * s },
  );
  mesh.userData.body = body;

  const sackMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  });
  addPart(mesh, new THREE.SphereGeometry(0.2 * s, 12, 12), sackMat, {
    x: -0.15 * s,
    y: 1.25 * s,
    z: -0.2 * s,
  });
  addPart(mesh, new THREE.SphereGeometry(0.25 * s, 12, 12), sackMat, {
    x: 0.15 * s,
    y: 1.35 * s,
    z: -0.15 * s,
  });
  addPart(mesh, new THREE.SphereGeometry(0.15 * s, 12, 12), sackMat, {
    x: 0,
    y: 1.15 * s,
    z: -0.25 * s,
  });

  const armGeo = new THREE.CylinderGeometry(0.08 * s, 0.05 * s, 0.6 * s, 6);
  mesh.userData.leftArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: -0.35 * s, y: 1.0 * s, z: 0.1 * s },
    { x: -Math.PI / 3 },
  );
  const stubGeo = new THREE.CapsuleGeometry(0.08 * s, 0.2 * s, 6, 6);
  mesh.userData.rightArm = addPart(
    mesh,
    stubGeo,
    skinMat,
    { x: 0.35 * s, y: 1.1 * s, z: 0.0 * s },
    { x: -0.5 },
  );

  const legGeo = new THREE.CapsuleGeometry(0.12 * s, 0.5 * s, 6, 8);
  mesh.userData.leftLeg = addPart(mesh, legGeo, pantsMat, {
    x: -0.15 * s,
    y: 0.3 * s,
  });
  mesh.userData.rightLeg = addPart(mesh, legGeo, pantsMat, {
    x: 0.15 * s,
    y: 0.3 * s,
  });
}

function buildExploderZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  addPart(mesh, new THREE.SphereGeometry(0.25 * s, 10, 10), skinMat, {
    y: 1.55 * s,
    z: 0.2 * s,
  });

  const bodyGeo = new THREE.SphereGeometry(0.65 * s, 16, 16);
  bodyGeo.scale(1.1, 1.2, 1.1);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.9 * s });
  mesh.userData.body = body;

  const glowMat = new THREE.MeshBasicMaterial({ color: glowColor });
  for (let i = 0; i < 6; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;
    const r = 0.65 * s * 1.05;
    const gx = r * Math.cos(phi) * Math.cos(theta);
    const gy = 0.9 * s + r * Math.sin(phi);
    const gz = r * Math.cos(phi) * Math.sin(theta);

    addPart(
      mesh,
      new THREE.CapsuleGeometry(0.05 * s, 0.2 * s, 4, 4),
      glowMat,
      { x: gx, y: gy, z: gz },
      { x: Math.random() * 3, y: Math.random() * 3 },
    );
  }

  const armGeo = new THREE.CapsuleGeometry(0.12 * s, 0.5 * s, 6, 8);
  mesh.userData.leftArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: -0.75 * s, y: 1.1 * s, z: 0.1 * s },
    { x: -0.3, z: 0.4 },
  );
  mesh.userData.rightArm = addPart(
    mesh,
    armGeo,
    skinMat,
    { x: 0.75 * s, y: 1.1 * s, z: 0.1 * s },
    { x: -0.3, z: -0.4 },
  );

  const legGeo = new THREE.CapsuleGeometry(0.18 * s, 0.4 * s, 8, 8);
  mesh.userData.leftLeg = addPart(
    mesh,
    legGeo,
    pantsMat,
    { x: -0.35 * s, y: 0.25 * s },
    { z: 0.2 },
  );
  mesh.userData.rightLeg = addPart(
    mesh,
    legGeo,
    pantsMat,
    { x: 0.35 * s, y: 0.25 * s },
    { z: -0.2 },
  );
}

function buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  const headGeo = new THREE.SphereGeometry(0.4 * s, 16, 16);
  headGeo.scale(1.2, 0.9, 1.1);
  addPart(mesh, headGeo, skinMat, { y: 2.6 * s, z: 0.2 * s });
  addPart(
    mesh,
    new THREE.SphereGeometry(0.25 * s, 10, 10),
    skinMat,
    { x: 0.3 * s, y: 2.4 * s, z: 0.3 * s },
    { y: 0.5 },
  );

  const bodyGeo = new THREE.CapsuleGeometry(0.7 * s, 1.2 * s, 16, 16);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.4 * s });
  mesh.userData.body = body;

  const spikeMat = new THREE.MeshStandardMaterial({
    color: 0x110a1a,
    roughness: 0.5,
  });
  addPart(
    mesh,
    new THREE.ConeGeometry(0.15 * s, 0.8 * s, 8),
    spikeMat,
    { x: -0.5 * s, y: 2.2 * s, z: -0.4 * s },
    { x: -0.5, z: 0.4 },
  );
  addPart(
    mesh,
    new THREE.ConeGeometry(0.1 * s, 0.6 * s, 8),
    spikeMat,
    { x: 0.5 * s, y: 2.1 * s, z: -0.5 * s },
    { x: -0.6, z: -0.3 },
  );
  addPart(
    mesh,
    new THREE.ConeGeometry(0.12 * s, 0.7 * s, 8),
    spikeMat,
    { x: 0, y: 2.4 * s, z: -0.6 * s },
    { x: -0.8 },
  );

  const leftArmGeo = new THREE.CapsuleGeometry(0.25 * s, 1.2 * s, 10, 10);
  mesh.userData.leftArm = addPart(
    mesh,
    leftArmGeo,
    skinMat,
    { x: -1.0 * s, y: 1.7 * s, z: 0.3 * s },
    { x: -Math.PI / 2.5, z: 0.2 },
  );

  const rightArmGeo = new THREE.CylinderGeometry(
    0.15 * s,
    0.4 * s,
    1.5 * s,
    12,
  );
  mesh.userData.rightArm = addPart(
    mesh,
    rightArmGeo,
    bodyMat,
    { x: 1.0 * s, y: 1.5 * s, z: 0.4 * s },
    { x: -Math.PI / 3, z: -0.1 },
  );

  const legGeo = new THREE.CapsuleGeometry(0.3 * s, 0.8 * s, 10, 10);
  mesh.userData.leftLeg = addPart(mesh, legGeo, pantsMat, {
    x: -0.4 * s,
    y: 0.4 * s,
  });
  mesh.userData.rightLeg = addPart(mesh, legGeo, pantsMat, {
    x: 0.4 * s,
    y: 0.4 * s,
  });

  const auraMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
  });
  const aura = addPart(
    mesh,
    new THREE.SphereGeometry(2.2 * s, 24, 24),
    auraMat,
    { y: 1.5 * s },
  );
  mesh.userData.aura = aura;

  const hbBg = addPart(
    mesh,
    new THREE.PlaneGeometry(2.5 * s, 0.25),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    { y: 4.0 * s },
    { x: -Math.PI / 4 },
  );
  const hb = addPart(
    mesh,
    new THREE.PlaneGeometry(2.5 * s, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    { y: 4.0 * s, z: 0.01 },
    { x: -Math.PI / 4 },
  );
  mesh.userData.healthBar = hb;
  mesh.userData.healthBarWidth = 2.5 * s;
}

export function createZombieMesh(type = "normal", typeDef = ENEMY_TYPES.normal) {
  const mesh = new THREE.Group();
  const s = typeDef.scale;
  const eyeColor = typeDef.eyeColor || 0xff0000;
  const glowColor = typeDef.glowColor || eyeColor;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: typeDef.color,
    roughness: 0.9,
    metalness: 0.1,
  });
  const skinColor = new THREE.Color(typeDef.secondaryColor || 0x5a7a51).lerp(
    new THREE.Color(0x332222),
    0.3,
  );
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.9,
    metalness: 0.0,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x223322,
    roughness: 1.0,
  });

  const builders = {
    fast: () => buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s, eyeColor),
    tank: () => buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
    spitter: () =>
      buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
    exploder: () =>
      buildExploderZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
    boss: () =>
      buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
  };

  const builder = builders[type];
  if (builder) {
    builder();
  } else {
    buildNormalZombie(mesh, bodyMat, skinMat, pantsMat, s);
  }

  addEyes(mesh, type, s, eyeColor);

  if (!mesh.userData.body && mesh.children.length > 0) {
    mesh.userData.body = mesh.children[0];
  }

  mesh.userData.type = type;
  mesh.userData.animPhase = Math.random() * Math.PI * 2;
  mesh.userData.limpOffsetL = (Math.random() - 0.5) * 0.4;
  mesh.userData.limpOffsetR = (Math.random() - 0.5) * 0.4;
  return mesh;
}
