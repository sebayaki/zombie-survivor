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

// ─── Shared materials ───────────────────────────────────────────
const BONE_MAT = new THREE.MeshStandardMaterial({ color: 0xd4c8a0, roughness: 0.7, metalness: 0.05 });
const WOUND_MAT = new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 1.0, emissive: 0x220000, emissiveIntensity: 0.3 });
const BLOOD_MAT = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 1.0 });
const TEETH_MAT = new THREE.MeshStandardMaterial({ color: 0xbbaa77, roughness: 0.6 });
const CLOTH_MAT = new THREE.MeshStandardMaterial({ color: 0x222218, roughness: 1.0, side: THREE.DoubleSide });
const MUSCLE_MAT = new THREE.MeshStandardMaterial({ color: 0x8b2222, roughness: 0.85, emissive: 0x110000, emissiveIntensity: 0.15 });
const TENDON_MAT = new THREE.MeshStandardMaterial({ color: 0x996644, roughness: 0.8 });
const CAVITY_MAT = new THREE.MeshStandardMaterial({ color: 0x080804, roughness: 1.0 });
const DECAY_MAT = new THREE.MeshStandardMaterial({ color: 0x2a3020, roughness: 1.0 });

// ─── Geometry utilities ─────────────────────────────────────────

function deformVerts(geo, intensity = 0.07, seed = Math.random() * 1000) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.sin(x * 17.3 + seed) * Math.cos(y * 13.1 + seed * 1.3) * Math.sin(z * 19.7 + seed * 0.7);
    pos.setX(i, x * (1 + n * intensity));
    pos.setY(i, y * (1 + n * intensity * 0.6));
    pos.setZ(i, z * (1 + n * intensity));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

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
    deformVerts(new THREE.SphereGeometry(0.07 * s, 6, 6), 0.12),
    WOUND_MAT,
    { x: x * s, y: y * s, z: z * s },
  );
}

function addTeeth(group, s, y, z, count, spread) {
  for (let i = 0; i < count; i++) {
    const xOff = (i - (count - 1) / 2) * spread * s;
    const sizeVariation = 0.8 + Math.random() * 0.4;
    const angleVariation = (Math.random() - 0.5) * 0.3;
    addPart(group,
      new THREE.ConeGeometry(0.018 * s * sizeVariation, 0.07 * s * sizeVariation, 4),
      TEETH_MAT,
      { x: xOff, y: (y - 0.04) * s, z: z * s },
      { x: Math.PI + angleVariation, z: angleVariation * 0.5 },
    );
  }
}

function addExposedBone(group, s, x, y, z, rotX, rotZ) {
  addPart(group,
    deformVerts(new THREE.CylinderGeometry(0.03 * s, 0.02 * s, 0.2 * s, 5), 0.08),
    BONE_MAT,
    { x: x * s, y: y * s, z: z * s },
    { x: rotX || 0, z: rotZ || 0 },
  );
}

function addClothStrip(group, mat, s, x, y, z, rotX) {
  const geo = new THREE.BoxGeometry(0.09 * s, 0.22 * s, 0.015 * s);
  deformVerts(geo, 0.2);
  addPart(group, geo, mat, { x: x * s, y: y * s, z: z * s }, { x: rotX || 0.3 });
}

function addFleshStrip(group, mat, s, x, y, z) {
  const fleshMat = mat.clone();
  fleshMat.transparent = true;
  fleshMat.opacity = 0.8;
  fleshMat.side = THREE.DoubleSide;
  const geo = deformVerts(new THREE.PlaneGeometry(0.05 * s, 0.1 * s), 0.2);
  addPart(group, geo, fleshMat, { x: x * s, y: y * s, z: z * s }, { x: 0.4, z: Math.random() * 0.5 });
}

function addDecayPatch(group, s, x, y, z) {
  addPart(group,
    deformVerts(new THREE.SphereGeometry(0.07 * s, 5, 5), 0.1),
    DECAY_MAT,
    { x: x * s, y: y * s, z: z * s },
  );
}

function addFingers(armMesh, mat, s, tipY, count, spread) {
  const palmGeo = deformVerts(new THREE.BoxGeometry(0.07 * s, 0.045 * s, 0.035 * s), 0.15);
  const palm = new THREE.Mesh(palmGeo, mat);
  palm.position.y = tipY * s;
  armMesh.add(palm);
  for (let i = 0; i < count; i++) {
    const len = (0.06 + Math.random() * 0.03) * s;
    const fGeo = new THREE.ConeGeometry(0.01 * s, len, 4);
    const finger = new THREE.Mesh(fGeo, mat);
    finger.position.set(
      (i - (count - 1) / 2) * spread * s,
      (tipY - 0.04) * s - len * 0.5,
      0,
    );
    finger.rotation.x = (Math.random() - 0.5) * 0.3;
    armMesh.add(finger);
  }
}

function addFoot(legMesh, mat, s, tipY) {
  const footGeo = deformVerts(new THREE.BoxGeometry(0.08 * s, 0.035 * s, 0.13 * s), 0.12);
  const foot = new THREE.Mesh(footGeo, mat);
  foot.position.set(0, tipY * s, 0.025 * s);
  legMesh.add(foot);
}

function addNeck(mesh, skinMat, s, y, z) {
  const neckGeo = deformVerts(new THREE.CylinderGeometry(0.1 * s, 0.13 * s, 0.14 * s, 8), 0.09);
  addPart(mesh, neckGeo, skinMat, { y: y * s, z: (z || 0) * s });
  addPart(mesh,
    new THREE.CylinderGeometry(0.018 * s, 0.013 * s, 0.12 * s, 4),
    TENDON_MAT,
    { x: -0.08 * s, y: y * s, z: (z || 0) * s + 0.05 * s },
  );
}

// ─── Skull-shaped head builder ──────────────────────────────────

function buildSkullHead(mesh, skinMat, s, opts = {}) {
  const hY = opts.headY ?? 1.55;
  const hZ = opts.headZ ?? 0;
  const tiltX = opts.tiltX ?? 0;
  const tiltZ = opts.tiltZ ?? 0.12;
  const jawOpen = opts.jawOpen ?? 0.28;
  const headScale = opts.headScale ?? 1.0;

  const hs = s * headScale;

  // Cranium — deformed, slightly lopsided
  const crGeo = deformVerts(new THREE.SphereGeometry(0.26 * hs, 12, 10), 0.07);
  crGeo.scale(1.0, 1.08, 1.02);
  addPart(mesh, crGeo, skinMat, { y: hY * s, z: hZ * s }, { x: tiltX, z: tiltZ });

  // Exposed skull bone on top/side
  const skullGeo = deformVerts(new THREE.SphereGeometry(0.15 * hs, 7, 7), 0.05);
  addPart(mesh, skullGeo, BONE_MAT,
    { x: 0.08 * hs, y: (hY + 0.14) * s, z: (hZ - 0.02) * s },
  );

  // Brow ridge — heavy, menacing
  const browGeo = deformVerts(new THREE.BoxGeometry(0.36 * hs, 0.055 * hs, 0.09 * hs), 0.1);
  addPart(mesh, browGeo, BONE_MAT,
    { y: (hY + 0.06) * s, z: (hZ + 0.2) * s },
  );

  // Cheekbones protruding through skin
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.045 * hs, 5, 5), 0.08),
      BONE_MAT,
      { x: side * 0.14 * hs, y: (hY - 0.06) * s, z: (hZ + 0.18) * s },
    );
  }

  // Nose cavity — dark hole where the nose rotted away
  if (!opts.noNose) {
    addPart(mesh,
      new THREE.SphereGeometry(0.035 * hs, 5, 5),
      CAVITY_MAT,
      { y: (hY - 0.02) * s, z: (hZ + 0.25) * s },
    );
  }

  // Lower jaw — hanging open
  const jawGeo = deformVerts(new THREE.BoxGeometry(0.2 * hs, 0.07 * hs, 0.13 * hs), 0.1);
  addPart(mesh, jawGeo, skinMat,
    { y: (hY - 0.2) * s, z: (hZ + 0.13) * s },
    { x: jawOpen },
  );

  // Upper teeth
  addTeeth(mesh, hs, hY - 0.1 + (hY - hY), hZ + 0.23, opts.teethUpper ?? 4, 0.045);

  // Lower teeth (fewer, some missing)
  const lowerCount = opts.teethLower ?? 3;
  for (let i = 0; i < lowerCount; i++) {
    const xOff = (i - (lowerCount - 1) / 2) * 0.05 * hs;
    addPart(mesh,
      new THREE.ConeGeometry(0.013 * hs, 0.05 * hs, 4),
      TEETH_MAT,
      { x: xOff, y: (hY - 0.17) * s, z: (hZ + 0.17) * s },
    );
  }

  // One torn ear
  if (!opts.noEars) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.035 * hs, 4, 4), 0.2),
      skinMat,
      { x: -0.26 * hs, y: (hY - 0.02) * s, z: hZ * s },
    );
  }

  // Decay patch on cheek
  addDecayPatch(mesh, hs, 0.16, hY - 0.04, hZ + 0.12);
}

// ─── Eye construction (proper sunken zombie eyes) ───────────────

function addEyes(group, type, s, eyeColor) {
  const isBoss = type === "boss";
  const eyeSize = (isBoss ? 0.06 : 0.04) * s;

  const socketGeo = new THREE.SphereGeometry(eyeSize * 2.2, 6, 6);
  const socketMat = CAVITY_MAT;

  // Dim, sickly glow — not bright robot LEDs
  const eyeGeo = new THREE.SphereGeometry(eyeSize, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({
    color: eyeColor,
    transparent: true,
    opacity: 0.6,
  });

  const EYE_POS = {
    fast: { y: 1.43, z: 0.22, spread: 0.1 },
    tank: { y: 1.93, z: 0.35, spread: 0.17 },
    spitter: { y: 1.53, z: 0.23, spread: 0.12 },
    exploder: { y: 1.63, z: 0.3, spread: 0.18 },
    boss: { y: 2.68, z: 0.48, spread: 0.22 },
    normal: { y: 1.53, z: 0.23, spread: 0.12 },
  };
  const ep = EYE_POS[type] || EYE_POS.normal;

  // Asymmetry: one eye slightly droopy
  const droopL = -0.015 * s;
  const droopR = 0.01 * s;

  // Deep sunken sockets
  addPart(group, socketGeo, socketMat,
    { x: -ep.spread * s, y: (ep.y + droopL) * s, z: (ep.z - 0.03) * s });
  addPart(group, socketGeo, socketMat,
    { x: ep.spread * s, y: (ep.y + droopR) * s, z: (ep.z - 0.03) * s });

  // Small dim glow inside sockets
  addPart(group, eyeGeo, eyeMat,
    { x: -ep.spread * s, y: (ep.y + droopL) * s, z: ep.z * s });
  addPart(group, eyeGeo, eyeMat,
    { x: ep.spread * s, y: (ep.y + droopR) * s, z: ep.z * s });

  if (isBoss) {
    addPart(group, socketGeo, socketMat, { x: 0, y: 2.83 * s, z: 0.42 * s });
    addPart(group, eyeGeo, eyeMat, { x: 0, y: 2.83 * s, z: 0.45 * s });
  }
}

// ═══════════════════════════════════════════════════════════════
// Normal Zombie — classic shambling corpse
// ═══════════════════════════════════════════════════════════════

function buildNormalZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  // Skull-shaped head
  buildSkullHead(mesh, skinMat, s);

  // Neck
  addNeck(mesh, skinMat, s, 1.35, 0);

  // Hunched torso
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.28 * s, 0.55 * s, 8, 10), 0.06);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.88 * s, z: -0.05 * s }, { x: 0.2 });
  mesh.userData.body = body;

  // Collarbone visible through skin
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.016 * s, 0.016 * s, 0.38 * s, 5), 0.06),
    BONE_MAT,
    { y: 1.18 * s, z: 0.08 * s },
    { z: Math.PI / 2 },
  );

  // Exposed ribs
  for (let i = 0; i < 3; i++) {
    addExposedBone(mesh, s, -0.25, 0.75 + i * 0.12, 0.12, 0, 0.8);
  }
  // Exposed muscle under ribs
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.09 * s, 6, 6), 0.1),
    MUSCLE_MAT,
    { x: -0.2 * s, y: 0.82 * s, z: 0.1 * s },
  );

  // Gut wound with intestine loop
  addPart(mesh,
    deformVerts(new THREE.TorusGeometry(0.055 * s, 0.02 * s, 5, 8), 0.15),
    MUSCLE_MAT,
    { x: 0.1 * s, y: 0.72 * s, z: 0.22 * s },
    { x: 0.5 },
  );

  // Wounds
  addWound(mesh, s, 0.18, 0.95, 0.2);
  addWound(mesh, s, -0.12, 0.78, 0.22);

  // Decay patches
  addDecayPatch(mesh, s, 0.12, 1.0, -0.15);
  addDecayPatch(mesh, s, -0.18, 0.85, 0.15);

  // Tattered shirt remnants
  addClothStrip(mesh, CLOTH_MAT, s, 0.22, 0.68, 0.15, 0.4);
  addClothStrip(mesh, CLOTH_MAT, s, -0.18, 0.62, -0.1, -0.2);
  addClothStrip(mesh, CLOTH_MAT, s, 0.0, 0.55, 0.2, 0.6);

  // Hanging flesh from torso
  addFleshStrip(mesh, skinMat, s, -0.14, 0.7, 0.18);
  addFleshStrip(mesh, skinMat, s, 0.08, 0.65, 0.2);

  // Left arm — reaching forward with hand
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.5 * s, 6, 8), 0.06);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.38 * s, y: 1.08 * s, z: 0.2 * s },
    { x: -Math.PI / 2.2, z: 0.1 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.3, 4, 0.022);

  // Right arm — torn off below elbow with bone stump
  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.35 * s, 6, 8), 0.06);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.38 * s, y: 1.1 * s, z: 0.15 * s },
    { x: -Math.PI / 2.0, z: -0.15 },
  );
  mesh.userData.rightArm = rightArm;
  // Bone stump at end
  const stumpBone = new THREE.Mesh(
    deformVerts(new THREE.CylinderGeometry(0.025 * s, 0.015 * s, 0.12 * s, 5), 0.08),
    BONE_MAT,
  );
  stumpBone.position.y = -0.24 * s;
  rightArm.add(stumpBone);
  const stumpWound = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.045 * s, 5, 5), 0.12),
    WOUND_MAT,
  );
  stumpWound.position.y = -0.2 * s;
  rightArm.add(stumpWound);

  // Legs — uneven, one slightly twisted
  const leftLegGeo = deformVerts(new THREE.CylinderGeometry(0.11 * s, 0.08 * s, 0.58 * s, 7), 0.05);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.16 * s, y: 0.3 * s },
    { z: 0.05 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.3);

  const rightLegGeo = deformVerts(new THREE.CylinderGeometry(0.12 * s, 0.09 * s, 0.54 * s, 7), 0.05);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.18 * s, y: 0.28 * s },
    { x: 0.1, z: -0.08 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.28);

  // Torn pant leg on one side
  addClothStrip(mesh, pantsMat, s, 0.22, 0.18, 0.05, 0.1);
}

// ═══════════════════════════════════════════════════════════════
// Fast Zombie (Runner) — feral, recently turned
// ═══════════════════════════════════════════════════════════════

function buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  // Elongated skull tilted aggressively forward
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.42,
    headZ: 0.18,
    tiltX: 0.45,
    tiltZ: 0,
    jawOpen: 0.4,
    headScale: 0.85,
    teethUpper: 5,
    teethLower: 4,
  });

  // Hair remnants — thin strips hanging from scalp
  for (let i = 0; i < 3; i++) {
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      roughness: 1.0,
      side: THREE.DoubleSide,
    });
    const hairGeo = deformVerts(new THREE.PlaneGeometry(0.02 * s, 0.1 * s), 0.3);
    addPart(mesh, hairGeo, hairMat,
      { x: (i - 1) * 0.06 * s, y: 1.52 * s, z: -0.12 * s },
      { x: -0.5 + Math.random() * 0.3 },
    );
  }

  // Short neck — hunched
  addNeck(mesh, skinMat, s, 1.26, 0.1);

  // Lean, hunched torso
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.2 * s, 0.45 * s, 8, 8), 0.06);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.82 * s, z: -0.1 * s }, { x: 0.4 });
  mesh.userData.body = body;

  // Visible spine bumps along back
  for (let i = 0; i < 5; i++) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.035 * s, 4, 4), 0.1),
      BONE_MAT,
      { y: (0.62 + i * 0.12) * s, z: (-0.16 - i * 0.02) * s },
    );
  }

  // Fresh bite wound on shoulder
  addWound(mesh, s, -0.2, 1.05, 0.08);
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.05 * s, 5, 5), 0.12),
    BLOOD_MAT,
    { x: -0.2 * s, y: 1.0 * s, z: 0.1 * s },
  );

  // Blood smears (thin strips of blood material)
  addPart(mesh,
    deformVerts(new THREE.BoxGeometry(0.04 * s, 0.15 * s, 0.01 * s), 0.15),
    BLOOD_MAT,
    { x: 0.15 * s, y: 0.85 * s, z: 0.18 * s },
  );

  // Torn athletic shirt remnant
  addClothStrip(mesh, CLOTH_MAT, s, 0.15, 0.9, 0.12, 0.2);
  addClothStrip(mesh, CLOTH_MAT, s, -0.12, 0.7, -0.08, -0.3);

  // Long clawed left arm
  const leftArmGeo = deformVerts(new THREE.CylinderGeometry(0.055 * s, 0.035 * s, 0.65 * s, 6), 0.06);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.28 * s, y: 0.88 * s, z: 0.3 * s },
    { x: -Math.PI / 2.2, z: 0.25 },
  );
  mesh.userData.leftArm = leftArm;
  // Elongated claws
  for (let i = 0; i < 4; i++) {
    const clawGeo = new THREE.ConeGeometry(0.012 * s, 0.1 * s, 4);
    const claw = new THREE.Mesh(clawGeo, BONE_MAT);
    claw.position.set(
      (i - 1.5) * 0.02 * s,
      -0.38 * s,
      0,
    );
    claw.rotation.x = -0.2;
    leftArm.add(claw);
  }

  // Right clawed arm
  const rightArmGeo = deformVerts(new THREE.CylinderGeometry(0.055 * s, 0.035 * s, 0.6 * s, 6), 0.06);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.28 * s, y: 0.85 * s, z: 0.3 * s },
    { x: -Math.PI / 2.3, z: -0.25 },
  );
  mesh.userData.rightArm = rightArm;
  for (let i = 0; i < 4; i++) {
    const clawGeo = new THREE.ConeGeometry(0.012 * s, 0.1 * s, 4);
    const claw = new THREE.Mesh(clawGeo, BONE_MAT);
    claw.position.set(
      (i - 1.5) * 0.02 * s,
      -0.35 * s,
      0,
    );
    claw.rotation.x = -0.2;
    rightArm.add(claw);
  }

  // Blood on forearms
  for (const arm of [leftArm, rightArm]) {
    const bloodGeo = deformVerts(new THREE.CylinderGeometry(0.04 * s, 0.06 * s, 0.15 * s, 5), 0.12);
    const blood = new THREE.Mesh(bloodGeo, BLOOD_MAT);
    blood.position.y = -0.15 * s;
    arm.add(blood);
  }

  // Digitigrade-style legs
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.07 * s, 0.42 * s, 5, 6), 0.05);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.14 * s, y: 0.28 * s },
    { x: 0.25 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, skinMat, s, -0.25);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.07 * s, 0.42 * s, 5, 6), 0.05);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.14 * s, y: 0.28 * s },
    { x: 0.25 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, skinMat, s, -0.25);
}

// ═══════════════════════════════════════════════════════════════
// Tank Zombie (Brute) — massive mutated horror
// ═══════════════════════════════════════════════════════════════

function buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Small head sunken into massive shoulders
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.92,
    headZ: 0.2,
    tiltX: 0,
    tiltZ: 0,
    jawOpen: 0.2,
    headScale: 0.9,
    teethUpper: 5,
    teethLower: 4,
    noNose: true,
  });

  // Heavy brow ridge override — larger, more brutish
  addPart(mesh,
    deformVerts(new THREE.BoxGeometry(0.45 * s, 0.1 * s, 0.15 * s), 0.08),
    BONE_MAT,
    { y: 2.0 * s, z: 0.32 * s },
  );

  // Tusks from lower jaw
  for (const side of [-1, 1]) {
    addPart(mesh,
      new THREE.ConeGeometry(0.04 * s, 0.18 * s, 5),
      BONE_MAT,
      { x: side * 0.12 * s, y: 1.82 * s, z: 0.35 * s },
      { x: -0.3, z: side * 0.2 },
    );
  }

  // Neck — thick, barely visible under muscle
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 0.2 * s, 8), 0.08),
    skinMat,
    { y: 1.78 * s, z: 0.15 * s },
  );

  // Massive barrel-shaped torso
  const bodyGeo = deformVerts(new THREE.SphereGeometry(0.7 * s, 14, 14), 0.05);
  bodyGeo.scale(1.15, 1.0, 0.85);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.2 * s });
  mesh.userData.body = body;

  // Exposed muscle masses on torso
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.2 * s, 8, 8), 0.08),
    MUSCLE_MAT,
    { x: 0.5 * s, y: 1.4 * s, z: 0.3 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.18 * s, 7, 7), 0.08),
    MUSCLE_MAT,
    { x: -0.4 * s, y: 1.3 * s, z: 0.35 * s },
  );

  // Bone plates (natural armor protruding through skin)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI - Math.PI / 2;
    addPart(mesh,
      deformVerts(new THREE.BoxGeometry(0.3 * s, 0.06 * s, 0.07 * s), 0.08),
      BONE_MAT,
      {
        x: Math.sin(angle) * 0.62 * s,
        y: (1.0 + i * 0.1) * s,
        z: Math.cos(angle) * 0.52 * s,
      },
      { y: angle },
    );
  }

  // Bone spurs from shoulders
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.12 * s, 0.5 * s, 5), 0.06),
    BONE_MAT,
    { x: -0.6 * s, y: 1.7 * s, z: -0.3 * s },
    { x: -0.8, z: 0.5 },
  );
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.1 * s, 0.4 * s, 5), 0.06),
    BONE_MAT,
    { x: 0.5 * s, y: 1.65 * s, z: -0.4 * s },
    { x: -1.0, z: -0.3 },
  );
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.08 * s, 0.35 * s, 5), 0.06),
    BONE_MAT,
    { x: -0.3 * s, y: 1.8 * s, z: -0.5 * s },
    { x: -1.2 },
  );

  // Massive wounds
  addWound(mesh, s, 0.4, 1.3, 0.5);
  addWound(mesh, s, -0.5, 1.1, 0.4);
  addWound(mesh, s, 0.0, 0.9, 0.6);

  // Hanging flesh strips
  addFleshStrip(mesh, skinMat, s, 0.3, 1.0, 0.5);
  addFleshStrip(mesh, skinMat, s, -0.4, 0.9, 0.45);

  // Decay patches
  addDecayPatch(mesh, s, -0.3, 1.4, 0.3);
  addDecayPatch(mesh, s, 0.2, 0.85, 0.4);

  // Massive club-like left arm
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.28 * s, 0.9 * s, 8, 8), 0.05);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.95 * s, y: 1.15 * s, z: 0.1 * s },
    { x: -0.15, z: 0.1 },
  );
  mesh.userData.leftArm = leftArm;
  // Bone knuckles
  const knuckle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.15 * s, 6, 6), 0.08),
    BONE_MAT,
  );
  knuckle.position.y = -0.55 * s;
  leftArm.add(knuckle);
  // Stubby fingers
  for (let i = 0; i < 3; i++) {
    const fg = new THREE.Mesh(
      deformVerts(new THREE.CylinderGeometry(0.04 * s, 0.03 * s, 0.12 * s, 4), 0.1),
      skinMat,
    );
    fg.position.set((i - 1) * 0.07 * s, -0.65 * s, 0);
    leftArm.add(fg);
  }

  // Oversized mutated right arm
  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.38 * s, 1.1 * s, 8, 8), 0.05);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 1.05 * s, y: 1.0 * s, z: 0.2 * s },
    { x: -0.25, z: -0.1 },
  );
  mesh.userData.rightArm = rightArm;
  // Exposed bone on forearm
  const forearmBone = new THREE.Mesh(
    deformVerts(new THREE.CylinderGeometry(0.05 * s, 0.03 * s, 0.4 * s, 5), 0.06),
    BONE_MAT,
  );
  forearmBone.position.set(0.05 * s, -0.35 * s, 0.08 * s);
  forearmBone.rotation.z = -0.3;
  rightArm.add(forearmBone);
  // Exposed muscle on upper arm
  const armMuscle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.15 * s, 6, 6), 0.08),
    MUSCLE_MAT,
  );
  armMuscle.position.set(0.1 * s, 0.1 * s, 0.15 * s);
  rightArm.add(armMuscle);

  // Thick legs
  const leftLegGeo = deformVerts(new THREE.CylinderGeometry(0.28 * s, 0.2 * s, 0.65 * s, 8), 0.04);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.35 * s, y: 0.33 * s },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.34);

  const rightLegGeo = deformVerts(new THREE.CylinderGeometry(0.3 * s, 0.22 * s, 0.7 * s, 8), 0.04);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.38 * s, y: 0.35 * s },
    { z: -0.08 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.36);
}

// ═══════════════════════════════════════════════════════════════
// Spitter Zombie — acid-producing mutant
// ═══════════════════════════════════════════════════════════════

function buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Bulbous deformed head, partially swollen
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.52,
    headZ: 0.1,
    tiltX: 0.2,
    tiltZ: 0.08,
    jawOpen: 0.35,
    headScale: 0.95,
    teethUpper: 3,
    teethLower: 2,
  });

  // Swollen cheek/throat — bile-filled
  const gulletMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.8,
    roughness: 0.8,
  });
  const gulletGeo = deformVerts(new THREE.SphereGeometry(0.18 * s, 8, 8), 0.07);
  gulletGeo.scale(1.2, 1.4, 1.0);
  addPart(mesh, gulletGeo, gulletMat, { y: 1.32 * s, z: 0.18 * s });

  // Smaller bile sac on one cheek
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.08 * s, 6, 6), 0.08),
    gulletMat,
    { x: 0.15 * s, y: 1.47 * s, z: 0.15 * s },
  );

  // Neck — thin, strained
  addNeck(mesh, skinMat, s, 1.28, 0.05);

  // Hunched torso
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.24 * s, 0.55 * s, 7, 8), 0.06);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.88 * s }, { x: 0.15 });
  mesh.userData.body = body;

  // Bile sacs on back
  const sackMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.8,
    roughness: 0.7,
  });
  const sackPositions = [
    { x: -0.12, y: 1.2, z: -0.2, r: 0.17 },
    { x: 0.15, y: 1.3, z: -0.15, r: 0.22 },
    { x: 0.0, y: 1.1, z: -0.25, r: 0.13 },
    { x: -0.2, y: 1.0, z: -0.12, r: 0.1 },
    { x: 0.1, y: 0.95, z: -0.2, r: 0.11 },
  ];
  for (const sp of sackPositions) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(sp.r * s, 8, 8), 0.07),
      sackMat,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
    );
  }

  // Acid corrosion on own body
  for (let i = 0; i < 3; i++) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.06 * s, 5, 5), 0.1),
      WOUND_MAT,
      {
        x: (Math.random() - 0.5) * 0.3 * s,
        y: (0.7 + Math.random() * 0.3) * s,
        z: (0.15 + Math.random() * 0.1) * s,
      },
    );
  }

  // Visible spine
  for (let i = 0; i < 3; i++) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.03 * s, 4, 4), 0.1),
      BONE_MAT,
      { y: (0.7 + i * 0.12) * s, z: -0.2 * s },
    );
  }

  // Decay patches
  addDecayPatch(mesh, s, 0.15, 0.9, 0.12);
  addDecayPatch(mesh, s, -0.1, 0.75, -0.1);

  // Left arm — long, for balance
  const leftArmGeo = deformVerts(new THREE.CylinderGeometry(0.065 * s, 0.04 * s, 0.6 * s, 5), 0.06);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.32 * s, y: 0.98 * s, z: 0.12 * s },
    { x: -Math.PI / 3, z: 0.1 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.35, 3, 0.02);

  // Right arm — mutated stump dripping acid
  const stubGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.18 * s, 5, 5), 0.08);
  const rightArm = addPart(mesh, stubGeo, skinMat,
    { x: 0.32 * s, y: 1.05 * s },
    { x: -0.4 },
  );
  mesh.userData.rightArm = rightArm;
  // Acid drip at stump
  const dripGeo = new THREE.ConeGeometry(0.03 * s, 0.08 * s, 5);
  const drip = new THREE.Mesh(dripGeo, sackMat);
  drip.position.y = -0.15 * s;
  rightArm.add(drip);
  // Stump wound
  const stumpW = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.055 * s, 5, 5), 0.12),
    WOUND_MAT,
  );
  stumpW.position.y = -0.12 * s;
  rightArm.add(stumpW);
  // Exposed bone
  const stumpB = new THREE.Mesh(
    deformVerts(new THREE.CylinderGeometry(0.025 * s, 0.015 * s, 0.1 * s, 4), 0.08),
    BONE_MAT,
  );
  stumpB.position.set(0.02 * s, -0.1 * s, 0);
  stumpB.rotation.z = -0.3;
  rightArm.add(stumpB);

  // Thin legs
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.46 * s, 5, 6), 0.05);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.14 * s, y: 0.28 * s },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.28);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.43 * s, 5, 6), 0.05);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.14 * s, y: 0.27 * s },
    { x: 0.05 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.26);
}

// ═══════════════════════════════════════════════════════════════
// Exploder Zombie (Bloater) — about to burst
// ═══════════════════════════════════════════════════════════════

function buildExploderZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Small head sinking into bloated body
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.58,
    headZ: 0.18,
    tiltX: 0,
    tiltZ: 0,
    jawOpen: 0.15,
    headScale: 0.8,
    teethUpper: 3,
    teethLower: 2,
    noEars: true,
  });

  // Almost no neck — head merging into bloated body
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 0.12 * s, 8), 0.08),
    skinMat,
    { y: 1.45 * s, z: 0.12 * s },
  );

  // Massively bloated torso
  const bodyGeo = deformVerts(new THREE.SphereGeometry(0.65 * s, 14, 14), 0.04);
  bodyGeo.scale(1.1, 1.25, 1.1);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.9 * s });
  mesh.userData.body = body;

  // Stretched skin cracks glowing from internal pressure
  const crackMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.45 });
  for (let i = 0; i < 10; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI * 0.6;
    const r = 0.68 * s;
    const cx = r * Math.cos(phi) * Math.cos(theta);
    const cy = 0.9 * s + r * Math.sin(phi) * 0.9;
    const cz = r * Math.cos(phi) * Math.sin(theta);
    addPart(mesh,
      new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.2 * s, 4),
      crackMat,
      { x: cx, y: cy, z: cz },
      { x: Math.random() * Math.PI, y: Math.random() * Math.PI },
    );
  }

  // Visible intestines bulging through cracks
  const gutsMat = new THREE.MeshStandardMaterial({
    color: 0x883333,
    emissive: glowColor,
    emissiveIntensity: 0.25,
    roughness: 0.9,
  });
  addPart(mesh,
    deformVerts(new THREE.TorusGeometry(0.12 * s, 0.04 * s, 6, 8), 0.1),
    gutsMat,
    { x: 0.2 * s, y: 0.8 * s, z: 0.55 * s },
    { x: 0.5, y: 0.3 },
  );
  addPart(mesh,
    deformVerts(new THREE.TorusGeometry(0.1 * s, 0.035 * s, 6, 8), 0.1),
    gutsMat,
    { x: -0.15 * s, y: 0.7 * s, z: 0.5 * s },
    { x: -0.3, y: 0.8 },
  );
  addPart(mesh,
    deformVerts(new THREE.TorusGeometry(0.08 * s, 0.03 * s, 5, 7), 0.12),
    gutsMat,
    { x: 0.05 * s, y: 1.1 * s, z: 0.6 * s },
    { x: 0.7, y: -0.2 },
  );

  // Pulsating internal glow
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  addPart(mesh,
    new THREE.SphereGeometry(0.5 * s, 10, 10),
    innerGlowMat,
    { y: 0.9 * s },
  );

  // Wounds leaking
  for (let i = 0; i < 5; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.3) * Math.PI * 0.5;
    const r = 0.67 * s;
    addWound(mesh, s,
      (r * Math.cos(phi) * Math.cos(theta)) / s,
      0.9 + (r * Math.sin(phi) * 0.8) / s,
      (r * Math.cos(phi) * Math.sin(theta)) / s,
    );
  }

  // Hanging flesh from stretched skin tears
  addFleshStrip(mesh, skinMat, s, 0.3, 0.7, 0.45);
  addFleshStrip(mesh, skinMat, s, -0.25, 0.6, 0.4);

  // Short stumpy arms
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.1 * s, 0.38 * s, 5, 6), 0.06);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.72 * s, y: 1.08 * s, z: 0.1 * s },
    { x: -0.3, z: 0.4 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.24, 3, 0.02);

  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.1 * s, 0.36 * s, 5, 6), 0.06);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.72 * s, y: 1.05 * s, z: 0.1 * s },
    { x: -0.3, z: -0.4 },
  );
  mesh.userData.rightArm = rightArm;
  addFingers(rightArm, skinMat, s, -0.22, 3, 0.02);

  // Stumpy legs barely supporting the mass
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.16 * s, 0.32 * s, 6, 6), 0.05);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.32 * s, y: 0.22 * s },
    { z: 0.15 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.2);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.17 * s, 0.32 * s, 6, 6), 0.05);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.32 * s, y: 0.22 * s },
    { z: -0.15 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.2);
}

// ═══════════════════════════════════════════════════════════════
// Boss Zombie (Abomination) — towering nightmare
// ═══════════════════════════════════════════════════════════════

function buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Skull-like head with exposed bone, massive
  buildSkullHead(mesh, skinMat, s, {
    headY: 2.7,
    headZ: 0.25,
    tiltX: 0.1,
    tiltZ: 0,
    jawOpen: 0.3,
    headScale: 1.3,
    teethUpper: 6,
    teethLower: 5,
    noNose: true,
  });

  // Skull plate visible on top
  const skullGeo = deformVerts(new THREE.SphereGeometry(0.35 * s, 10, 10), 0.05);
  skullGeo.scale(1.2, 0.6, 1.1);
  addPart(mesh, skullGeo, BONE_MAT, { y: 2.88 * s, z: 0.15 * s });

  // Lower fangs / tusks
  for (const side of [-1, 1]) {
    addPart(mesh,
      new THREE.ConeGeometry(0.04 * s, 0.22 * s, 4),
      TEETH_MAT,
      { x: side * 0.15 * s, y: 2.38 * s, z: 0.5 * s },
      { x: Math.PI },
    );
  }

  // Horn-like bone growths
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.4, metalness: 0.3 });
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.1 * s, 0.65 * s, 6), 0.06),
    hornMat,
    { x: -0.35 * s, y: 3.1 * s, z: 0.05 * s },
    { x: -0.3, z: 0.5 },
  );
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.09 * s, 0.5 * s, 6), 0.06),
    hornMat,
    { x: 0.35 * s, y: 3.05 * s, z: 0.05 * s },
    { x: -0.3, z: -0.5 },
  );

  // Thick neck — barely visible
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.3 * s, 0.45 * s, 0.3 * s, 10), 0.06),
    skinMat,
    { y: 2.4 * s, z: 0.15 * s },
  );

  // Massive torso
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.85 * s, 1.3 * s, 14, 14), 0.04);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.5 * s }, { x: 0.1 });
  mesh.userData.body = body;

  // Exposed ribcage (gaping chest wound)
  for (let i = 0; i < 5; i++) {
    const ribAngle = (i - 2) * 0.25;
    addPart(mesh,
      deformVerts(new THREE.CylinderGeometry(0.04 * s, 0.03 * s, 0.6 * s, 5), 0.06),
      BONE_MAT,
      {
        x: ribAngle * 0.8 * s,
        y: (1.6 + Math.abs(ribAngle) * 0.2) * s,
        z: 0.75 * s,
      },
      { z: ribAngle * 0.5 },
    );
  }

  // Exposed beating heart visible through ribcage
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0x661111,
    emissive: glowColor,
    emissiveIntensity: 0.5,
    roughness: 0.9,
  });
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.22 * s, 10, 10), 0.07),
    heartMat,
    { y: 1.6 * s, z: 0.65 * s },
  );

  // Exposed muscle masses
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.25 * s, 8, 8), 0.07),
    MUSCLE_MAT,
    { x: -0.7 * s, y: 1.8 * s, z: 0.2 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.2 * s, 7, 7), 0.07),
    MUSCLE_MAT,
    { x: 0.6 * s, y: 1.7 * s, z: 0.3 * s },
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
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.1 * s, sp.h * s, 5), 0.06),
      BONE_MAT,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
      { x: sp.rx, z: sp.rz },
    );
  }

  // Massive wounds with hanging flesh
  addWound(mesh, s, -0.6, 1.3, 0.5);
  addWound(mesh, s, 0.5, 1.7, 0.6);
  addWound(mesh, s, 0, 1.0, 0.7);
  addFleshStrip(mesh, skinMat, s, -0.5, 1.2, 0.55);
  addFleshStrip(mesh, skinMat, s, 0.3, 0.95, 0.6);
  addFleshStrip(mesh, skinMat, s, 0.0, 1.4, 0.7);

  // Decay patches
  addDecayPatch(mesh, s, -0.4, 1.6, 0.4);
  addDecayPatch(mesh, s, 0.5, 1.2, 0.3);
  addDecayPatch(mesh, s, 0.0, 0.8, 0.5);

  // Left arm — massive club with bone spurs
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.42 * s, 1.4 * s, 10, 10), 0.04);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -1.2 * s, y: 1.6 * s, z: 0.4 * s },
    { x: -Math.PI / 2.5, z: 0.2 },
  );
  mesh.userData.leftArm = leftArm;
  // Bone spurs on arm
  for (const sp of [
    { y: -0.3, x: -0.2, z: 0.15, h: 0.5, rz: 1.0 },
    { y: -0.55, x: 0.15, z: 0.1, h: 0.35, rz: -0.8 },
  ]) {
    const spur = new THREE.Mesh(
      deformVerts(new THREE.ConeGeometry(0.08 * s, sp.h * s, 5), 0.06),
      BONE_MAT,
    );
    spur.position.set(sp.x * s, sp.y * s, sp.z * s);
    spur.rotation.z = sp.rz;
    leftArm.add(spur);
  }
  // Massive fist
  const fist = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.2 * s, 8, 8), 0.08),
    skinMat,
  );
  fist.position.y = -0.8 * s;
  leftArm.add(fist);

  // Right arm — mutated bone scythe
  const rightArmGeo = deformVerts(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 1.6 * s, 10), 0.04);
  const rightArm = addPart(mesh, rightArmGeo, bodyMat,
    { x: 1.1 * s, y: 1.4 * s, z: 0.5 * s },
    { x: -Math.PI / 3, z: -0.1 },
  );
  mesh.userData.rightArm = rightArm;
  // Bone blade
  const blade = new THREE.Mesh(
    deformVerts(new THREE.BoxGeometry(0.04 * s, 1.2 * s, 0.25 * s), 0.05),
    BONE_MAT,
  );
  blade.position.set(0, -0.9 * s, 0.1 * s);
  blade.rotation.x = -0.2;
  rightArm.add(blade);
  // Exposed muscle where arm fused with blade
  const fusionMuscle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.15 * s, 6, 6), 0.08),
    MUSCLE_MAT,
  );
  fusionMuscle.position.set(0, -0.3 * s, 0.08 * s);
  rightArm.add(fusionMuscle);

  // Thick uneven legs
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.35 * s, 0.85 * s, 8, 8), 0.04);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.5 * s, y: 0.43 * s },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.48);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.38 * s, 0.9 * s, 8, 8), 0.04);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.52 * s, y: 0.45 * s },
    { z: -0.05 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.5);

  // Dark miasma aura
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x110000,
    transparent: true,
    opacity: 0.08,
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

// ═══════════════════════════════════════════════════════════════
// Main factory
// ═══════════════════════════════════════════════════════════════

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
    new THREE.Color(0x443333),
    0.35,
  );
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.92,
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
