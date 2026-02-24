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
    color: 0x5c4a4d,
    secondaryColor: 0x3d3238,
    eyeColor: 0xff4422,
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
    eyeColor: 0xaacc22,
    glowColor: 0x88aa11,
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
    color: 0x2a1210,
    secondaryColor: 0x1a0808,
    eyeColor: 0xff2200,
    glowColor: 0xaa1100,
    scale: 3.5,
    speedMult: 0.35,
    healthMult: 20,
    damageMult: 3,
    xpMult: 20,
    isBoss: true,
  },
};

export const STAGE_BOSS_VARIANTS = [
  {
    name: "The Abomination",
    color: 0x2a1210,
    secondaryColor: 0x1a0808,
    eyeColor: 0xff2200,
    glowColor: 0xaa1100,
  },
  {
    name: "The Warden",
    color: 0x1a1a22,
    secondaryColor: 0x0a0a14,
    eyeColor: 0xccaa44,
    glowColor: 0x886622,
  },
  {
    name: "The Devourer",
    color: 0x2e1a0a,
    secondaryColor: 0x201005,
    eyeColor: 0xff4400,
    glowColor: 0xcc2200,
  },
  {
    name: "The Plague Bearer",
    color: 0x1a2e0a,
    secondaryColor: 0x0a1a05,
    eyeColor: 0x88aa00,
    glowColor: 0x668800,
  },
  {
    name: "The Wraith King",
    color: 0x2a0a1a,
    secondaryColor: 0x1a0510,
    eyeColor: 0xcc3344,
    glowColor: 0x881122,
  },
];

// Shared materials created once
const BONE_MAT = new THREE.MeshStandardMaterial({ color: 0xccccaa, roughness: 0.6, metalness: 0.1 });
const WOUND_MAT = new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 1.0, metalness: 0.0, emissive: 0x220000, emissiveIntensity: 0.3 });
const BLOOD_MAT = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 1.0 });
const TEETH_MAT = new THREE.MeshStandardMaterial({ color: 0xbbaa88, roughness: 0.5 });
const CLOTH_MAT = new THREE.MeshStandardMaterial({ color: 0x222218, roughness: 1.0 });

function addPart(group, geometry, material, pos, rot) {
  const mesh = new THREE.Mesh(geometry, material);
  if (pos) mesh.position.set(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
  if (rot) {
    if (rot.x) mesh.rotation.x = rot.x;
    if (rot.y) mesh.rotation.y = rot.y;
    if (rot.z) mesh.rotation.z = rot.z;
  }
  group.add(mesh);
  return mesh;
}

function addWound(group, s, x, y, z) {
  addPart(group,
    new THREE.SphereGeometry(0.06 * s, 6, 6),
    WOUND_MAT,
    { x: x * s, y: y * s, z: z * s },
  );
}

function addTeeth(group, s, y, z, count, spread) {
  for (let i = 0; i < count; i++) {
    const xOff = (i - (count - 1) / 2) * spread * s;
    addPart(group,
      new THREE.ConeGeometry(0.02 * s, 0.08 * s, 4),
      TEETH_MAT,
      { x: xOff, y: (y - 0.04) * s, z: z * s },
      { x: Math.PI },
    );
  }
}

function addExposedBone(group, s, x, y, z, rotX, rotZ) {
  addPart(group,
    new THREE.CylinderGeometry(0.03 * s, 0.02 * s, 0.2 * s, 5),
    BONE_MAT,
    { x: x * s, y: y * s, z: z * s },
    { x: rotX || 0, z: rotZ || 0 },
  );
}

function addClothStrip(group, mat, s, x, y, z, rotX) {
  addPart(group,
    new THREE.BoxGeometry(0.08 * s, 0.2 * s, 0.02 * s),
    mat,
    { x: x * s, y: y * s, z: z * s },
    { x: rotX || 0.3 },
  );
}

function addEyes(group, type, s, eyeColor) {
  const isBoss = type === "boss";
  const eyeSize = (isBoss ? 0.12 : 0.07) * s;
  const eyeGeo = new THREE.SphereGeometry(eyeSize, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

  const socketGeo = new THREE.SphereGeometry(eyeSize * 1.3, 6, 6);
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x111100, roughness: 1.0 });

  const EYE_POS = {
    fast: { y: 1.45, z: 0.28, spread: 0.12 },
    tank: { y: 1.95, z: 0.38, spread: 0.2 },
    spitter: { y: 1.55, z: 0.28, spread: 0.15 },
    exploder: { y: 1.65, z: 0.35, spread: 0.22 },
    boss: { y: 2.7, z: 0.55, spread: 0.28 },
    normal: { y: 1.55, z: 0.28, spread: 0.15 },
  };
  const ep = EYE_POS[type] || EYE_POS.normal;

  // Sunken eye sockets
  addPart(group, socketGeo, socketMat, { x: -ep.spread * s, y: ep.y * s, z: (ep.z - 0.02) * s });
  addPart(group, socketGeo, socketMat, { x: ep.spread * s, y: ep.y * s, z: (ep.z - 0.02) * s });

  addPart(group, eyeGeo, eyeMat, { x: -ep.spread * s, y: ep.y * s, z: ep.z * s });
  addPart(group, eyeGeo, eyeMat, { x: ep.spread * s, y: ep.y * s, z: ep.z * s });

  if (isBoss) {
    addPart(group, socketGeo, socketMat, { x: 0, y: 2.85 * s, z: 0.48 * s });
    addPart(group, eyeGeo, eyeMat, { x: 0, y: 2.85 * s, z: 0.5 * s });
  }
}

function buildNormalZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  // Deformed head (slightly lopsided)
  const headGeo = new THREE.SphereGeometry(0.28 * s, 10, 10);
  headGeo.scale(1.05, 0.95, 1.0);
  addPart(mesh, headGeo, skinMat, { y: 1.55 * s }, { z: 0.15, x: 0.15 });

  // Open jaw
  const jawGeo = new THREE.BoxGeometry(0.2 * s, 0.1 * s, 0.15 * s);
  addPart(mesh, jawGeo, skinMat, { y: 1.38 * s, z: 0.18 * s }, { x: 0.25 });
  addTeeth(mesh, s, 1.42, 0.25, 4, 0.05);

  // Exposed skull patch
  addPart(mesh,
    new THREE.SphereGeometry(0.12 * s, 6, 6),
    BONE_MAT,
    { x: 0.12 * s, y: 1.62 * s, z: -0.05 * s },
  );

  // Hunched torso
  const bodyGeo = new THREE.CapsuleGeometry(0.28 * s, 0.55 * s, 8, 10);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.88 * s, z: -0.05 * s }, { x: 0.2 });
  mesh.userData.body = body;

  // Exposed ribs on one side
  for (let i = 0; i < 3; i++) {
    addExposedBone(mesh, s, -0.25, 0.75 + i * 0.12, 0.1, 0, 0.8);
  }

  // Wounds on torso
  addWound(mesh, s, 0.15, 0.95, 0.2);
  addWound(mesh, s, -0.1, 0.8, 0.22);

  // Tattered shirt scraps
  addClothStrip(mesh, CLOTH_MAT, s, 0.2, 0.65, 0.15, 0.4);
  addClothStrip(mesh, CLOTH_MAT, s, -0.15, 0.6, -0.1, -0.2);

  // Left arm: reaching forward
  const leftArmGeo = new THREE.CapsuleGeometry(0.1 * s, 0.5 * s, 6, 8);
  mesh.userData.leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.38 * s, y: 1.1 * s, z: 0.2 * s },
    { x: -Math.PI / 2.2, z: 0.1 },
  );

  // Right arm: slightly shorter (torn off below elbow) with bone stump
  const rightArmGeo = new THREE.CapsuleGeometry(0.1 * s, 0.35 * s, 6, 8);
  mesh.userData.rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.38 * s, y: 1.12 * s, z: 0.15 * s },
    { x: -Math.PI / 2.0, z: -0.15 },
  );
  addExposedBone(mesh, s, 0.55, 0.85, 0.3, -0.5, 0);
  addWound(mesh, s, 0.5, 0.9, 0.28);

  // Legs: uneven — one slightly bent
  const leftLegGeo = new THREE.CylinderGeometry(0.11 * s, 0.09 * s, 0.6 * s, 7);
  mesh.userData.leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.16 * s, y: 0.3 * s },
    { z: 0.05 },
  );
  const rightLegGeo = new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.55 * s, 7);
  mesh.userData.rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.18 * s, y: 0.28 * s },
    { x: 0.1, z: -0.08 },
  );
}

function buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  // Feral, hunched runner — elongated skull, clawed hands

  // Elongated skull tilted forward aggressively
  const headGeo = new THREE.SphereGeometry(0.22 * s, 8, 8);
  headGeo.scale(0.9, 1.2, 1.1);
  addPart(mesh, headGeo, skinMat, { y: 1.42 * s, z: 0.2 * s }, { x: 0.5 });

  // Wide-open jaw
  const jawGeo = new THREE.BoxGeometry(0.18 * s, 0.1 * s, 0.14 * s);
  addPart(mesh, jawGeo, skinMat, { y: 1.27 * s, z: 0.28 * s }, { x: 0.4 });
  addTeeth(mesh, s, 1.32, 0.35, 5, 0.035);

  // Missing scalp — exposed skull top
  addPart(mesh,
    new THREE.SphereGeometry(0.14 * s, 6, 6),
    BONE_MAT,
    { y: 1.52 * s, z: 0.1 * s },
  );

  // Lean, hunched torso
  const bodyGeo = new THREE.CapsuleGeometry(0.2 * s, 0.45 * s, 8, 8);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.82 * s, z: -0.1 * s }, { x: 0.45 });
  mesh.userData.body = body;

  // Visible spine bumps along back
  for (let i = 0; i < 4; i++) {
    addPart(mesh,
      new THREE.SphereGeometry(0.04 * s, 4, 4),
      BONE_MAT,
      { x: 0, y: (0.65 + i * 0.13) * s, z: (-0.15 - i * 0.02) * s },
    );
  }

  // Wound on side
  addWound(mesh, s, 0.18, 0.85, 0.05);

  // Long clawed arms reaching forward
  const leftClawGeo = new THREE.CylinderGeometry(0.06 * s, 0.03 * s, 0.7 * s, 5);
  mesh.userData.leftArm = addPart(mesh, leftClawGeo, skinMat,
    { x: -0.28 * s, y: 0.88 * s, z: 0.3 * s },
    { x: -Math.PI / 2.2, z: 0.25 },
  );
  // Claw fingers on left hand
  for (let i = 0; i < 3; i++) {
    addPart(mesh,
      new THREE.ConeGeometry(0.015 * s, 0.1 * s, 4),
      BONE_MAT,
      { x: (-0.42 + i * 0.03) * s, y: 0.6 * s, z: 0.55 * s },
      { x: -0.3 },
    );
  }

  const rightClawGeo = new THREE.CylinderGeometry(0.06 * s, 0.03 * s, 0.65 * s, 5);
  mesh.userData.rightArm = addPart(mesh, rightClawGeo, skinMat,
    { x: 0.28 * s, y: 0.85 * s, z: 0.3 * s },
    { x: -Math.PI / 2.3, z: -0.25 },
  );
  for (let i = 0; i < 3; i++) {
    addPart(mesh,
      new THREE.ConeGeometry(0.015 * s, 0.1 * s, 4),
      BONE_MAT,
      { x: (0.38 + i * 0.03) * s, y: 0.58 * s, z: 0.52 * s },
      { x: -0.3 },
    );
  }

  // Digitigrade-style legs (bent forward for running pose)
  const leftLegGeo = new THREE.CapsuleGeometry(0.08 * s, 0.45 * s, 5, 6);
  mesh.userData.leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.14 * s, y: 0.28 * s },
    { x: 0.25 },
  );
  const rightLegGeo = new THREE.CapsuleGeometry(0.08 * s, 0.45 * s, 5, 6);
  mesh.userData.rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.14 * s, y: 0.28 * s },
    { x: 0.25 },
  );
}

function buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Massive mutated brute — exposed muscles, bone armor, asymmetric limbs

  // Small head sunken into shoulders
  const headGeo = new THREE.SphereGeometry(0.28 * s, 10, 10);
  headGeo.scale(1.1, 0.85, 1.0);
  addPart(mesh, headGeo, skinMat, { y: 1.92 * s, z: 0.25 * s });

  // Heavy brow ridge
  addPart(mesh,
    new THREE.BoxGeometry(0.4 * s, 0.08 * s, 0.15 * s),
    BONE_MAT,
    { y: 2.0 * s, z: 0.3 * s },
  );

  // Jaw with large teeth
  addPart(mesh,
    new THREE.BoxGeometry(0.3 * s, 0.15 * s, 0.2 * s),
    skinMat,
    { y: 1.78 * s, z: 0.32 * s },
    { x: 0.2 },
  );
  addTeeth(mesh, s, 1.82, 0.42, 5, 0.06);

  // Massive torso — barrel-shaped
  const bodyGeo = new THREE.SphereGeometry(0.7 * s, 14, 14);
  bodyGeo.scale(1.15, 1.0, 0.85);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.2 * s });
  mesh.userData.body = body;

  // Exposed ribs and bone plates (natural armor)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI - Math.PI / 2;
    addPart(mesh,
      new THREE.BoxGeometry(0.3 * s, 0.05 * s, 0.06 * s),
      BONE_MAT,
      {
        x: Math.sin(angle) * 0.6 * s,
        y: (1.0 + i * 0.1) * s,
        z: Math.cos(angle) * 0.5 * s,
      },
      { y: angle },
    );
  }

  // Bone spurs from shoulders
  addPart(mesh, new THREE.ConeGeometry(0.12 * s, 0.5 * s, 5), BONE_MAT,
    { x: -0.6 * s, y: 1.7 * s, z: -0.3 * s },
    { x: -0.8, z: 0.5 },
  );
  addPart(mesh, new THREE.ConeGeometry(0.1 * s, 0.4 * s, 5), BONE_MAT,
    { x: 0.5 * s, y: 1.65 * s, z: -0.4 * s },
    { x: -1.0, z: -0.3 },
  );
  addPart(mesh, new THREE.ConeGeometry(0.08 * s, 0.35 * s, 5), BONE_MAT,
    { x: -0.3 * s, y: 1.8 * s, z: -0.5 * s },
    { x: -1.2 },
  );

  // Wounds
  addWound(mesh, s, 0.4, 1.3, 0.5);
  addWound(mesh, s, -0.5, 1.1, 0.4);
  addWound(mesh, s, 0.0, 0.9, 0.6);

  // Massive club-like left arm
  const leftArmGeo = new THREE.CapsuleGeometry(0.28 * s, 0.9 * s, 8, 8);
  mesh.userData.leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.95 * s, y: 1.15 * s, z: 0.1 * s },
    { x: -0.15, z: 0.1 },
  );
  // Bone knuckle on left fist
  addPart(mesh, new THREE.SphereGeometry(0.15 * s, 6, 6), BONE_MAT,
    { x: -0.95 * s, y: 0.55 * s, z: 0.15 * s },
  );

  // Oversized mutated right arm
  const rightArmGeo = new THREE.CapsuleGeometry(0.38 * s, 1.1 * s, 8, 8);
  mesh.userData.rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 1.05 * s, y: 1.0 * s, z: 0.2 * s },
    { x: -0.25, z: -0.1 },
  );
  // Exposed bone on right forearm
  addExposedBone(mesh, s, 1.2, 0.6, 0.25, 0.3, -0.5);

  // Thick legs — one slightly shorter
  mesh.userData.leftLeg = addPart(mesh,
    new THREE.CylinderGeometry(0.28 * s, 0.2 * s, 0.65 * s, 8),
    pantsMat,
    { x: -0.35 * s, y: 0.33 * s },
  );
  mesh.userData.rightLeg = addPart(mesh,
    new THREE.CylinderGeometry(0.3 * s, 0.22 * s, 0.7 * s, 8),
    pantsMat,
    { x: 0.38 * s, y: 0.35 * s },
    { z: -0.08 },
  );
}

function buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Hunched, bile-filled mutant with distended throat and acid sacks

  // Bulbous deformed head
  const headGeo = new THREE.SphereGeometry(0.26 * s, 9, 9);
  headGeo.scale(1.0, 1.25, 1.1);
  addPart(mesh, headGeo, skinMat, { y: 1.52 * s, z: 0.12 * s }, { x: 0.25 });

  // Distended throat/gullet (filled with bile)
  const gulletMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85,
    roughness: 0.8,
  });
  const gulletGeo = new THREE.SphereGeometry(0.18 * s, 8, 8);
  gulletGeo.scale(1.2, 1.4, 1.0);
  addPart(mesh, gulletGeo, gulletMat, { y: 1.35 * s, z: 0.2 * s });

  // Open maw
  addPart(mesh,
    new THREE.BoxGeometry(0.16 * s, 0.12 * s, 0.1 * s),
    skinMat,
    { y: 1.38 * s, z: 0.28 * s },
    { x: 0.3 },
  );

  // Hunched torso
  const body = addPart(mesh,
    new THREE.CapsuleGeometry(0.24 * s, 0.55 * s, 7, 8),
    bodyMat,
    { y: 0.88 * s },
    { x: 0.15 },
  );
  mesh.userData.body = body;

  // Bile sacks on back (pulsating, organic)
  const sackMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.85,
    roughness: 0.7,
  });
  const sackPositions = [
    { x: -0.12, y: 1.2, z: -0.2, r: 0.18 },
    { x: 0.15, y: 1.3, z: -0.15, r: 0.22 },
    { x: 0.0, y: 1.1, z: -0.25, r: 0.14 },
    { x: -0.2, y: 1.0, z: -0.1, r: 0.1 },
    { x: 0.1, y: 0.95, z: -0.2, r: 0.12 },
  ];
  for (const sp of sackPositions) {
    addPart(mesh, new THREE.SphereGeometry(sp.r * s, 8, 8), sackMat,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
    );
  }

  // Wounds/decay
  addWound(mesh, s, 0.2, 0.85, 0.18);
  addWound(mesh, s, -0.15, 1.0, 0.2);

  // Visible spine
  for (let i = 0; i < 3; i++) {
    addPart(mesh,
      new THREE.SphereGeometry(0.03 * s, 4, 4),
      BONE_MAT,
      { y: (0.7 + i * 0.12) * s, z: -0.2 * s },
    );
  }

  // Left arm: long, reaching
  mesh.userData.leftArm = addPart(mesh,
    new THREE.CylinderGeometry(0.07 * s, 0.04 * s, 0.6 * s, 5),
    skinMat,
    { x: -0.32 * s, y: 0.98 * s, z: 0.12 * s },
    { x: -Math.PI / 3, z: 0.1 },
  );

  // Right arm: mutated stump dripping acid
  const stubGeo = new THREE.CapsuleGeometry(0.09 * s, 0.18 * s, 5, 5);
  mesh.userData.rightArm = addPart(mesh, stubGeo, skinMat,
    { x: 0.32 * s, y: 1.05 * s },
    { x: -0.4 },
  );
  // Stump wound
  addPart(mesh,
    new THREE.SphereGeometry(0.06 * s, 5, 5),
    WOUND_MAT,
    { x: 0.38 * s, y: 0.92 * s, z: 0.02 * s },
  );
  addExposedBone(mesh, s, 0.36, 0.88, 0.02, -0.3, 0);

  // Thin legs
  mesh.userData.leftLeg = addPart(mesh,
    new THREE.CapsuleGeometry(0.1 * s, 0.48 * s, 5, 6),
    pantsMat,
    { x: -0.14 * s, y: 0.28 * s },
  );
  mesh.userData.rightLeg = addPart(mesh,
    new THREE.CapsuleGeometry(0.1 * s, 0.45 * s, 5, 6),
    pantsMat,
    { x: 0.14 * s, y: 0.27 * s },
    { x: 0.05 },
  );
}

function buildExploderZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Bloated, about-to-burst corpse — stretched skin, visible intestines, cracks

  // Small head sinking into bloated body
  const headGeo = new THREE.SphereGeometry(0.22 * s, 8, 8);
  headGeo.scale(1.0, 0.9, 1.0);
  addPart(mesh, headGeo, skinMat, { y: 1.58 * s, z: 0.22 * s });

  // Half-open mouth
  addPart(mesh,
    new THREE.BoxGeometry(0.14 * s, 0.08 * s, 0.1 * s),
    skinMat,
    { y: 1.48 * s, z: 0.3 * s },
    { x: 0.15 },
  );
  addTeeth(mesh, s, 1.5, 0.35, 3, 0.04);

  // Massively bloated torso
  const bodyGeo = new THREE.SphereGeometry(0.65 * s, 14, 14);
  bodyGeo.scale(1.1, 1.25, 1.1);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.9 * s });
  mesh.userData.body = body;

  // Stretched skin cracks (veiny lines on surface)
  const crackMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 8; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI * 0.6;
    const r = 0.68 * s;
    const cx = r * Math.cos(phi) * Math.cos(theta);
    const cy = 0.9 * s + r * Math.sin(phi) * 0.9;
    const cz = r * Math.cos(phi) * Math.sin(theta);

    addPart(mesh,
      new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.25 * s, 4),
      crackMat,
      { x: cx, y: cy, z: cz },
      { x: Math.random() * Math.PI, y: Math.random() * Math.PI },
    );
  }

  // Visible intestines (bulging through cracks)
  const gutsMat = new THREE.MeshStandardMaterial({
    color: 0x883333,
    emissive: glowColor,
    emissiveIntensity: 0.3,
    roughness: 0.9,
  });
  addPart(mesh,
    new THREE.TorusGeometry(0.12 * s, 0.04 * s, 6, 8),
    gutsMat,
    { x: 0.2 * s, y: 0.8 * s, z: 0.55 * s },
    { x: 0.5, y: 0.3 },
  );
  addPart(mesh,
    new THREE.TorusGeometry(0.1 * s, 0.035 * s, 6, 8),
    gutsMat,
    { x: -0.15 * s, y: 0.7 * s, z: 0.5 * s },
    { x: -0.3, y: 0.8 },
  );

  // Wounds that glow (internal pressure)
  for (let i = 0; i < 4; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.3) * Math.PI * 0.5;
    const r = 0.67 * s;
    addWound(mesh, s,
      (r * Math.cos(phi) * Math.cos(theta)) / s,
      (0.9 + r * Math.sin(phi) * 0.8) / s * s / s,
      (r * Math.cos(phi) * Math.sin(theta)) / s,
    );
  }

  // Short stumpy arms
  mesh.userData.leftArm = addPart(mesh,
    new THREE.CapsuleGeometry(0.1 * s, 0.4 * s, 5, 6),
    skinMat,
    { x: -0.72 * s, y: 1.08 * s, z: 0.1 * s },
    { x: -0.3, z: 0.4 },
  );
  mesh.userData.rightArm = addPart(mesh,
    new THREE.CapsuleGeometry(0.1 * s, 0.38 * s, 5, 6),
    skinMat,
    { x: 0.72 * s, y: 1.05 * s, z: 0.1 * s },
    { x: -0.3, z: -0.4 },
  );

  // Stumpy legs (can barely support the weight)
  mesh.userData.leftLeg = addPart(mesh,
    new THREE.CapsuleGeometry(0.16 * s, 0.35 * s, 6, 6),
    pantsMat,
    { x: -0.32 * s, y: 0.22 * s },
    { z: 0.15 },
  );
  mesh.userData.rightLeg = addPart(mesh,
    new THREE.CapsuleGeometry(0.17 * s, 0.35 * s, 6, 6),
    pantsMat,
    { x: 0.32 * s, y: 0.22 * s },
    { z: -0.15 },
  );
}

function buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Massive mutated horror — exposed organs, bone armor, multiple mouths

  // Skull-like head with exposed bone
  const headGeo = new THREE.SphereGeometry(0.42 * s, 14, 14);
  headGeo.scale(1.1, 0.85, 1.15);
  addPart(mesh, headGeo, skinMat, { y: 2.7 * s, z: 0.3 * s }, { x: 0.1 });

  // Skull plate visible on top
  const skullGeo = new THREE.SphereGeometry(0.3 * s, 10, 10);
  skullGeo.scale(1.2, 0.6, 1.1);
  addPart(mesh, skullGeo, BONE_MAT, { y: 2.82 * s, z: 0.2 * s });

  // Massive jaw with large teeth
  addPart(mesh,
    new THREE.BoxGeometry(0.5 * s, 0.25 * s, 0.35 * s),
    skinMat,
    { y: 2.4 * s, z: 0.42 * s },
    { x: 0.25 },
  );
  addTeeth(mesh, s, 2.48, 0.6, 6, 0.075);
  // Lower fangs
  for (let i = 0; i < 2; i++) {
    addPart(mesh,
      new THREE.ConeGeometry(0.04 * s, 0.2 * s, 4),
      TEETH_MAT,
      { x: (i === 0 ? -0.15 : 0.15) * s, y: 2.28 * s, z: 0.55 * s },
      { x: Math.PI },
    );
  }

  // Horn-like bone growths
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.4, metalness: 0.3 });
  addPart(mesh, new THREE.ConeGeometry(0.1 * s, 0.6 * s, 6), hornMat,
    { x: -0.32 * s, y: 3.05 * s, z: 0.1 * s },
    { x: -0.3, z: 0.5 },
  );
  addPart(mesh, new THREE.ConeGeometry(0.09 * s, 0.45 * s, 6), hornMat,
    { x: 0.32 * s, y: 3.0 * s, z: 0.1 * s },
    { x: -0.3, z: -0.5 },
  );

  // Massive torso
  const bodyGeo = new THREE.CapsuleGeometry(0.85 * s, 1.3 * s, 14, 14);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.5 * s }, { x: 0.1 });
  mesh.userData.body = body;

  // Exposed ribcage (open wound on chest)
  for (let i = 0; i < 5; i++) {
    const ribAngle = (i - 2) * 0.25;
    addPart(mesh,
      new THREE.CylinderGeometry(0.04 * s, 0.03 * s, 0.6 * s, 5),
      BONE_MAT,
      { x: ribAngle * 0.8 * s, y: (1.6 + Math.abs(ribAngle) * 0.2) * s, z: 0.75 * s },
      { z: ribAngle * 0.5 },
    );
  }

  // Exposed heart/organ visible through ribcage
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0x661111,
    emissive: glowColor,
    emissiveIntensity: 0.5,
    roughness: 0.9,
  });
  addPart(mesh, new THREE.SphereGeometry(0.2 * s, 10, 10), heartMat,
    { y: 1.6 * s, z: 0.65 * s },
  );

  // Back spines (bone protrusions)
  const spinePositions = [
    { x: -0.4, y: 2.2, z: -0.4, h: 0.8, rx: -0.5, rz: 0.4 },
    { x: 0.4, y: 2.1, z: -0.5, h: 0.7, rx: -0.6, rz: -0.3 },
    { x: 0, y: 2.4, z: -0.6, h: 1.0, rx: -0.8, rz: 0 },
    { x: -0.2, y: 1.9, z: -0.5, h: 0.5, rx: -0.7, rz: 0.2 },
    { x: 0.3, y: 1.8, z: -0.45, h: 0.55, rx: -0.65, rz: -0.15 },
  ];
  for (const sp of spinePositions) {
    addPart(mesh, new THREE.ConeGeometry(0.1 * s, sp.h * s, 5), BONE_MAT,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
      { x: sp.rx, z: sp.rz },
    );
  }

  // Massive wounds
  addWound(mesh, s, -0.6, 1.3, 0.5);
  addWound(mesh, s, 0.5, 1.7, 0.6);
  addWound(mesh, s, 0, 1.0, 0.7);

  // Left arm: massive, club-like with bone spurs
  mesh.userData.leftArm = addPart(mesh,
    new THREE.CapsuleGeometry(0.42 * s, 1.4 * s, 10, 10),
    skinMat,
    { x: -1.2 * s, y: 1.6 * s, z: 0.4 * s },
    { x: -Math.PI / 2.5, z: 0.2 },
  );
  // Bone spurs on left arm
  addPart(mesh, new THREE.ConeGeometry(0.12 * s, 0.5 * s, 5), BONE_MAT,
    { x: -1.5 * s, y: 1.5 * s, z: 0.4 * s },
    { z: 1.0 },
  );
  addPart(mesh, new THREE.ConeGeometry(0.08 * s, 0.35 * s, 5), BONE_MAT,
    { x: -1.3 * s, y: 1.2 * s, z: 0.5 * s },
    { z: 0.8, x: -0.3 },
  );

  // Right arm: mutated blade arm (bone scythe)
  mesh.userData.rightArm = addPart(mesh,
    new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 1.6 * s, 10),
    bodyMat,
    { x: 1.1 * s, y: 1.4 * s, z: 0.5 * s },
    { x: -Math.PI / 3, z: -0.1 },
  );
  // Bone blade
  addPart(mesh,
    new THREE.BoxGeometry(0.04 * s, 1.2 * s, 0.25 * s),
    BONE_MAT,
    { x: 1.1 * s, y: 0.8 * s, z: 1.1 * s },
    { x: -Math.PI / 4, z: -0.1 },
  );

  // Thick uneven legs
  mesh.userData.leftLeg = addPart(mesh,
    new THREE.CapsuleGeometry(0.35 * s, 0.85 * s, 8, 8),
    pantsMat,
    { x: -0.5 * s, y: 0.43 * s },
  );
  mesh.userData.rightLeg = addPart(mesh,
    new THREE.CapsuleGeometry(0.38 * s, 0.9 * s, 8, 8),
    pantsMat,
    { x: 0.52 * s, y: 0.45 * s },
    { z: -0.05 },
  );

  // Dark miasma aura (not glowing/additive — more like darkness)
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x110000,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  const aura = addPart(mesh,
    new THREE.SphereGeometry(2.5 * s, 16, 16),
    auraMat,
    { y: 1.5 * s },
  );
  mesh.userData.aura = aura;

  // Health bar
  addPart(mesh,
    new THREE.PlaneGeometry(3.0 * s, 0.25),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    { y: 4.5 * s },
    { x: -Math.PI / 4 },
  );
  const hb = addPart(mesh,
    new THREE.PlaneGeometry(3.0 * s, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xcc0000 }),
    { y: 4.5 * s, z: 0.01 },
    { x: -Math.PI / 4 },
  );
  mesh.userData.healthBar = hb;
  mesh.userData.healthBarWidth = 3.0 * s;
}

export function createZombieMesh(type = "normal", typeDef = ENEMY_TYPES.normal) {
  const mesh = new THREE.Group();
  const s = typeDef.scale;
  const eyeColor = typeDef.eyeColor || 0xff0000;
  const glowColor = typeDef.glowColor || eyeColor;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: typeDef.color,
    roughness: 0.95,
    metalness: 0.05,
  });
  const skinColor = new THREE.Color(typeDef.secondaryColor || 0x5a7a51).lerp(
    new THREE.Color(0x332222),
    0.3,
  );
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.95,
    metalness: 0.0,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a15,
    roughness: 1.0,
  });

  const builders = {
    fast: () => buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s),
    tank: () => buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
    spitter: () => buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
    exploder: () => buildExploderZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
    boss: () => buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
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

  if (mesh.userData.body) {
    mesh.userData.body.castShadow = true;
  }

  mesh.userData.type = type;
  mesh.userData.animPhase = Math.random() * Math.PI * 2;
  mesh.userData.limpOffsetL = (Math.random() - 0.5) * 0.4;
  mesh.userData.limpOffsetR = (Math.random() - 0.5) * 0.4;
  return mesh;
}
