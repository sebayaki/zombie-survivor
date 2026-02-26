import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const ENEMY_TYPES = {
  normal: {
    name: "Zombie",
    color: 0x6b9960,
    secondaryColor: 0x5a7d50,
    eyeColor: 0xff0000,
    scale: 1,
    speedMult: 1,
    healthMult: 1,
    damageMult: 1,
    xpMult: 1,
  },
  fast: {
    name: "Runner",
    color: 0xb09575,
    secondaryColor: 0x907560,
    eyeColor: 0xffff00,
    scale: 0.75,
    speedMult: 2.2,
    healthMult: 0.4,
    damageMult: 0.7,
    xpMult: 1.5,
  },
  tank: {
    name: "Brute",
    color: 0x8a7078,
    secondaryColor: 0x6a5560,
    eyeColor: 0xff4422,
    scale: 1.6,
    speedMult: 0.45,
    healthMult: 5,
    damageMult: 2.5,
    xpMult: 4,
  },
  spitter: {
    name: "Spitter",
    color: 0x4a8a70,
    secondaryColor: 0x3a6a50,
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
    color: 0xb06020,
    secondaryColor: 0x8a5020,
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
    color: 0x6a3028,
    secondaryColor: 0x4a2018,
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
    color: 0x6a3028,
    secondaryColor: 0x4a2018,
    eyeColor: 0xff2200,
    glowColor: 0xaa1100,
  },
  {
    name: "The Warden",
    color: 0x3a3a50,
    secondaryColor: 0x2a2a3a,
    eyeColor: 0xccaa44,
    glowColor: 0x886622,
  },
  {
    name: "The Devourer",
    color: 0x5e3a1a,
    secondaryColor: 0x402a10,
    eyeColor: 0xff4400,
    glowColor: 0xcc2200,
  },
  {
    name: "The Plague Bearer",
    color: 0x3a5e1a,
    secondaryColor: 0x2a4010,
    eyeColor: 0x88aa00,
    glowColor: 0x668800,
  },
  {
    name: "The Wraith King",
    color: 0x5a1a3a,
    secondaryColor: 0x3a1028,
    eyeColor: 0xcc3344,
    glowColor: 0x881122,
  },
];

// ─── Shared materials ───────────────────────────────────────────
const BONE_MAT = new THREE.MeshStandardMaterial({ color: 0xd4c8a0, roughness: 0.7, metalness: 0.05 });
const WOUND_MAT = new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 0.85, emissive: 0x330000, emissiveIntensity: 0.4 });
const BLOOD_MAT = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 0.6, metalness: 0.15 });
const TEETH_MAT = new THREE.MeshStandardMaterial({ color: 0xbbaa77, roughness: 0.6 });
const CLOTH_MAT = new THREE.MeshStandardMaterial({ color: 0x222218, roughness: 1.0, side: THREE.DoubleSide });
const MUSCLE_MAT = new THREE.MeshStandardMaterial({ color: 0x8b2222, roughness: 0.65, metalness: 0.1, emissive: 0x220000, emissiveIntensity: 0.2 });
const TENDON_MAT = new THREE.MeshStandardMaterial({ color: 0x996644, roughness: 0.7 });
const CAVITY_MAT = new THREE.MeshStandardMaterial({ color: 0x080804, roughness: 1.0 });
const DECAY_MAT = new THREE.MeshStandardMaterial({ color: 0x2a3020, roughness: 1.0 });

const SLIME_MAT = new THREE.MeshStandardMaterial({
  color: 0x3a5530, roughness: 0.25, metalness: 0.3,
  transparent: true, opacity: 0.7, emissive: 0x112208, emissiveIntensity: 0.15,
});
const FUNGAL_MAT = new THREE.MeshStandardMaterial({
  color: 0x4a4030, roughness: 0.9,
  emissive: 0x1a1508, emissiveIntensity: 0.25,
});
const PUSTULE_MAT = new THREE.MeshStandardMaterial({
  color: 0x99884a, roughness: 0.5, metalness: 0.1,
  transparent: true, opacity: 0.85,
  emissive: 0x332208, emissiveIntensity: 0.2,
});
const VEIN_MAT = new THREE.MeshStandardMaterial({
  color: 0x4a1828, roughness: 0.6, metalness: 0.15,
  emissive: 0x1a0810, emissiveIntensity: 0.3,
});
const WET_FLESH_MAT = new THREE.MeshStandardMaterial({
  color: 0x6a3333, roughness: 0.3, metalness: 0.25,
  emissive: 0x110505, emissiveIntensity: 0.15,
});

// ─── Geometry utilities ─────────────────────────────────────────

function deformVerts(geo, intensity = 0.07, seed = Math.random() * 1000) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n1 = Math.sin(x * 17.3 + seed) * Math.cos(y * 13.1 + seed * 1.3) * Math.sin(z * 19.7 + seed * 0.7);
    const n2 = Math.sin(x * 31.7 + seed * 2.1) * Math.cos(z * 23.3 + seed * 0.9) * 0.5;
    const n = n1 + n2 * intensity * 0.4;
    pos.setX(i, x * (1 + n * intensity));
    pos.setY(i, y * (1 + n * intensity * 0.7));
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
    deformVerts(new THREE.SphereGeometry(0.08 * s, 7, 7), 0.18),
    WOUND_MAT,
    { x: x * s, y: y * s, z: z * s },
  );
  addPart(group,
    deformVerts(new THREE.SphereGeometry(0.04 * s, 5, 5), 0.25),
    WET_FLESH_MAT,
    { x: (x + 0.02) * s, y: (y - 0.01) * s, z: (z + 0.02) * s },
  );
}

function addTeeth(group, s, y, z, count, spread) {
  for (let i = 0; i < count; i++) {
    const xOff = (i - (count - 1) / 2) * spread * s;
    const sizeVariation = 0.6 + Math.random() * 0.6;
    const angleVariation = (Math.random() - 0.5) * 0.5;
    const toothLen = (0.06 + Math.random() * 0.04) * s * sizeVariation;
    addPart(group,
      deformVerts(new THREE.ConeGeometry(0.016 * s * sizeVariation, toothLen, 4), 0.12),
      TEETH_MAT,
      { x: xOff, y: (y - 0.04) * s, z: z * s },
      { x: Math.PI + angleVariation, z: angleVariation * 0.5 },
    );
  }
}

function addExposedBone(group, s, x, y, z, rotX, rotZ) {
  addPart(group,
    deformVerts(new THREE.CylinderGeometry(0.03 * s, 0.02 * s, 0.2 * s, 5), 0.12),
    BONE_MAT,
    { x: x * s, y: y * s, z: z * s },
    { x: rotX || 0, z: rotZ || 0 },
  );
}

function addClothStrip(group, mat, s, x, y, z, rotX) {
  const geo = new THREE.BoxGeometry(0.09 * s, 0.22 * s, 0.015 * s);
  deformVerts(geo, 0.3);
  addPart(group, geo, mat, { x: x * s, y: y * s, z: z * s }, { x: rotX || 0.3 });
}

function addFleshStrip(group, mat, s, x, y, z) {
  const fleshMat = mat.clone();
  fleshMat.transparent = true;
  fleshMat.opacity = 0.75;
  fleshMat.side = THREE.DoubleSide;
  fleshMat.roughness = 0.4;
  fleshMat.metalness = 0.15;
  const geo = deformVerts(new THREE.PlaneGeometry(0.06 * s, 0.13 * s), 0.3);
  addPart(group, geo, fleshMat, { x: x * s, y: y * s, z: z * s }, { x: 0.4, z: Math.random() * 0.6 });
}

function addDecayPatch(group, s, x, y, z) {
  addPart(group,
    deformVerts(new THREE.SphereGeometry(0.08 * s, 6, 6), 0.15),
    DECAY_MAT,
    { x: x * s, y: y * s, z: z * s },
  );
}

function addFingers(armMesh, mat, s, tipY, count, spread) {
  const palmGeo = deformVerts(new THREE.BoxGeometry(0.07 * s, 0.045 * s, 0.04 * s), 0.2);
  const palm = new THREE.Mesh(palmGeo, mat);
  palm.position.y = tipY * s;
  armMesh.add(palm);
  for (let i = 0; i < count; i++) {
    const len = (0.07 + Math.random() * 0.04) * s;
    const fGeo = deformVerts(new THREE.ConeGeometry(0.012 * s, len, 4), 0.1);
    const finger = new THREE.Mesh(fGeo, mat);
    finger.position.set(
      (i - (count - 1) / 2) * spread * s,
      (tipY - 0.04) * s - len * 0.5,
      0,
    );
    finger.rotation.x = (Math.random() - 0.5) * 0.4;
    finger.rotation.z = (Math.random() - 0.5) * 0.2;
    armMesh.add(finger);
  }
}

function addFoot(legMesh, mat, s, tipY) {
  const footGeo = deformVerts(new THREE.BoxGeometry(0.09 * s, 0.04 * s, 0.14 * s), 0.18);
  const foot = new THREE.Mesh(footGeo, mat);
  foot.position.set(0, tipY * s, 0.03 * s);
  legMesh.add(foot);
  for (let i = 0; i < 3; i++) {
    const toeGeo = deformVerts(new THREE.ConeGeometry(0.012 * s, 0.04 * s, 3), 0.15);
    const toe = new THREE.Mesh(toeGeo, BONE_MAT);
    toe.position.set((i - 1) * 0.025 * s, (tipY - 0.02) * s, 0.08 * s);
    toe.rotation.x = Math.PI * 0.8;
    legMesh.add(toe);
  }
}

function addNeck(mesh, skinMat, s, y, z) {
  const neckGeo = deformVerts(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.14 * s, 8), 0.12);
  addPart(mesh, neckGeo, skinMat, { y: y * s, z: (z || 0) * s });
  for (let side = -1; side <= 1; side += 2) {
    addPart(mesh,
      deformVerts(new THREE.CylinderGeometry(0.018 * s, 0.01 * s, 0.12 * s, 4), 0.08),
      TENDON_MAT,
      { x: side * 0.06 * s, y: y * s, z: (z || 0) * s + 0.05 * s },
    );
  }
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.012 * s, 0.008 * s, 0.1 * s, 3), 0.1),
    VEIN_MAT,
    { x: -0.08 * s, y: y * s, z: (z || 0) * s + 0.03 * s },
  );
}

// ─── Organic detail helpers ─────────────────────────────────────

function addPustuleCluster(group, s, x, y, z, count = 3) {
  for (let i = 0; i < count; i++) {
    const size = (0.03 + Math.random() * 0.04) * s;
    const ox = (Math.random() - 0.5) * 0.06 * s;
    const oy = (Math.random() - 0.5) * 0.06 * s;
    const oz = (Math.random() - 0.5) * 0.03 * s;
    addPart(group,
      deformVerts(new THREE.SphereGeometry(size, 5, 5), 0.15),
      PUSTULE_MAT,
      { x: x * s + ox, y: y * s + oy, z: z * s + oz },
    );
  }
}

function addTendril(group, mat, s, x, y, z, length = 0.15, segments = 3) {
  const tendrilMat = mat || WET_FLESH_MAT;
  for (let i = 0; i < segments; i++) {
    const segLen = (length / segments) * s;
    const thickness = (0.015 - i * 0.003) * s;
    const geo = deformVerts(
      new THREE.CylinderGeometry(thickness, thickness * 0.6, segLen, 4), 0.2
    );
    const sway = Math.sin(i * 1.5) * 0.03 * s;
    addPart(group, geo, tendrilMat,
      { x: x * s + sway, y: (y - i * (length / segments)) * s, z: z * s },
      { x: 0.15 * i, z: (Math.random() - 0.5) * 0.3 },
    );
  }
}

function addSpineRidge(group, s, startY, endY, z, count = 5) {
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const py = (startY + (endY - startY) * t) * s;
    const pz = (z - 0.02 * Math.sin(t * Math.PI)) * s;
    const boneSize = (0.028 + Math.sin(t * Math.PI) * 0.015) * s;
    addPart(group,
      deformVerts(new THREE.SphereGeometry(boneSize, 4, 4), 0.12),
      BONE_MAT,
      { y: py, z: pz },
    );
    if (i < count - 1) {
      const spikeH = (0.04 + Math.random() * 0.03) * s;
      addPart(group,
        deformVerts(new THREE.ConeGeometry(0.012 * s, spikeH, 3), 0.15),
        BONE_MAT,
        { y: py + boneSize * 0.5, z: pz - 0.015 * s },
        { x: -0.4 },
      );
    }
  }
}

function addFungalCluster(group, s, x, y, z, count = 4) {
  for (let i = 0; i < count; i++) {
    const stemH = (0.04 + Math.random() * 0.05) * s;
    const capR = (0.02 + Math.random() * 0.02) * s;
    const ox = (Math.random() - 0.5) * 0.06 * s;
    const oz = (Math.random() - 0.5) * 0.04 * s;
    addPart(group,
      new THREE.CylinderGeometry(0.005 * s, 0.007 * s, stemH, 3),
      FUNGAL_MAT,
      { x: x * s + ox, y: y * s + stemH * 0.5, z: z * s + oz },
    );
    addPart(group,
      deformVerts(new THREE.SphereGeometry(capR, 5, 4), 0.2),
      FUNGAL_MAT,
      { x: x * s + ox, y: y * s + stemH, z: z * s + oz },
    );
  }
}

function addSlimeDrip(group, s, x, y, z) {
  const dripLen = (0.06 + Math.random() * 0.08) * s;
  addPart(group,
    new THREE.ConeGeometry(0.012 * s, dripLen, 4),
    SLIME_MAT,
    { x: x * s, y: y * s - dripLen * 0.5, z: z * s },
    { x: Math.PI },
  );
  addPart(group,
    new THREE.SphereGeometry(0.015 * s, 4, 4),
    SLIME_MAT,
    { x: x * s, y: y * s - dripLen, z: z * s },
  );
}

function addOrganicLump(group, mat, s, x, y, z, size = 0.1) {
  const geo = deformVerts(new THREE.SphereGeometry(size * s, 7, 6), 0.2);
  geo.scale(1 + Math.random() * 0.3, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.2);
  addPart(group, geo, mat, { x: x * s, y: y * s, z: z * s });
}

function addVeinNetwork(group, s, x, y, z, count = 3) {
  for (let i = 0; i < count; i++) {
    const len = (0.08 + Math.random() * 0.12) * s;
    const angle = Math.random() * Math.PI * 2;
    addPart(group,
      deformVerts(new THREE.CylinderGeometry(0.006 * s, 0.004 * s, len, 3), 0.15),
      VEIN_MAT,
      { x: x * s, y: y * s, z: z * s },
      { x: Math.cos(angle) * 0.8, z: Math.sin(angle) * 0.8 },
    );
  }
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

  // Cranium — heavily deformed, asymmetric, organic
  const crGeo = deformVerts(new THREE.SphereGeometry(0.26 * hs, 12, 10), 0.12);
  crGeo.scale(1.05, 1.12, 1.04);
  addPart(mesh, crGeo, skinMat, { y: hY * s, z: hZ * s }, { x: tiltX, z: tiltZ });

  // Lumpy organic mass on cranium
  addOrganicLump(mesh, skinMat, hs, -0.06, hY + 0.08, hZ - 0.08, 0.1);

  // Exposed skull bone with irregular edges
  const skullGeo = deformVerts(new THREE.SphereGeometry(0.16 * hs, 8, 7), 0.1);
  skullGeo.scale(1.1, 0.9, 1.0);
  addPart(mesh, skullGeo, BONE_MAT,
    { x: 0.08 * hs, y: (hY + 0.14) * s, z: (hZ - 0.02) * s },
  );

  // Brow ridge — heavy, irregular
  const browGeo = deformVerts(new THREE.BoxGeometry(0.38 * hs, 0.06 * hs, 0.1 * hs), 0.15);
  addPart(mesh, browGeo, BONE_MAT,
    { y: (hY + 0.06) * s, z: (hZ + 0.2) * s },
  );

  // Cheekbones protruding through skin
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.05 * hs, 5, 5), 0.12),
      BONE_MAT,
      { x: side * 0.15 * hs, y: (hY - 0.06) * s, z: (hZ + 0.18) * s },
    );
  }

  // Nose cavity — dark hole
  if (!opts.noNose) {
    addPart(mesh,
      new THREE.SphereGeometry(0.04 * hs, 5, 5),
      CAVITY_MAT,
      { y: (hY - 0.02) * s, z: (hZ + 0.25) * s },
    );
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.02 * hs, 4, 4), 0.2),
      WOUND_MAT,
      { x: 0.02 * hs, y: (hY - 0.03) * s, z: (hZ + 0.24) * s },
    );
  }

  // Lower jaw — hanging open, more organic
  const jawGeo = deformVerts(new THREE.BoxGeometry(0.22 * hs, 0.08 * hs, 0.14 * hs), 0.15);
  addPart(mesh, jawGeo, skinMat,
    { y: (hY - 0.2) * s, z: (hZ + 0.13) * s },
    { x: jawOpen },
  );

  // Upper teeth
  addTeeth(mesh, hs, hY - 0.1, hZ + 0.23, opts.teethUpper ?? 4, 0.045);

  // Lower teeth (fewer, some missing, irregular)
  const lowerCount = opts.teethLower ?? 3;
  for (let i = 0; i < lowerCount; i++) {
    const xOff = (i - (lowerCount - 1) / 2) * 0.055 * hs;
    const tiltAngle = (Math.random() - 0.5) * 0.4;
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.014 * hs, 0.055 * hs, 4), 0.1),
      TEETH_MAT,
      { x: xOff, y: (hY - 0.17) * s, z: (hZ + 0.17) * s },
      { z: tiltAngle },
    );
  }

  // One torn ear — lumpy
  if (!opts.noEars) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.04 * hs, 5, 4), 0.25),
      skinMat,
      { x: -0.26 * hs, y: (hY - 0.02) * s, z: hZ * s },
    );
  }

  // Decay patches and veins on face
  addDecayPatch(mesh, hs, 0.16, hY - 0.04, hZ + 0.12);
  addVeinNetwork(mesh, hs, -0.12, hY - 0.02, hZ + 0.15, 2);

  // Slime drip from jaw
  if (!opts.noSlime) {
    addSlimeDrip(mesh, hs, 0, hY - 0.25, hZ + 0.14);
  }
}

// ─── Eye construction ───────────────────────────────────────────

function addEyes(group, type, s, eyeColor) {
  const isBoss = type === "boss";
  const eyeSize = (isBoss ? 0.06 : 0.04) * s;

  const socketGeo = new THREE.SphereGeometry(eyeSize * 2.4, 6, 6);
  const socketMat = CAVITY_MAT;

  const eyeGeo = new THREE.SphereGeometry(eyeSize, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({
    color: eyeColor,
    transparent: true,
    opacity: 0.9,
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

  const droopL = -0.02 * s;
  const droopR = 0.012 * s;

  addPart(group, socketGeo, socketMat,
    { x: -ep.spread * s, y: (ep.y + droopL) * s, z: (ep.z - 0.03) * s });
  addPart(group, socketGeo, socketMat,
    { x: ep.spread * s, y: (ep.y + droopR) * s, z: (ep.z - 0.03) * s });

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
// Normal Zombie — shambling decomposing corpse
// ═══════════════════════════════════════════════════════════════

function buildNormalZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  buildSkullHead(mesh, skinMat, s);
  addNeck(mesh, skinMat, s, 1.35, 0);

  // Torso — lumpy, organic shape built from overlapping deformed masses
  const torsoGeo = deformVerts(new THREE.CapsuleGeometry(0.26 * s, 0.5 * s, 8, 10), 0.12);
  const body = addPart(mesh, torsoGeo, bodyMat, { y: 0.88 * s, z: -0.05 * s }, { x: 0.22 });
  mesh.userData.body = body;

  // Secondary organic mass — gives uneven silhouette
  addOrganicLump(mesh, bodyMat, s, -0.1, 0.95, 0.05, 0.14);
  addOrganicLump(mesh, bodyMat, s, 0.12, 0.78, -0.08, 0.1);

  // Collarbone
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.018 * s, 0.014 * s, 0.38 * s, 5), 0.1),
    BONE_MAT,
    { y: 1.18 * s, z: 0.08 * s },
    { z: Math.PI / 2 },
  );

  // Exposed ribs with muscle between them
  for (let i = 0; i < 4; i++) {
    addExposedBone(mesh, s, -0.24, 0.72 + i * 0.1, 0.14, 0, 0.8 + i * 0.05);
    if (i < 3) {
      addPart(mesh,
        deformVerts(new THREE.SphereGeometry(0.04 * s, 4, 4), 0.2),
        MUSCLE_MAT,
        { x: -0.22 * s, y: (0.77 + i * 0.1) * s, z: 0.12 * s },
      );
    }
  }

  // Gut wound with intestine loops
  addPart(mesh,
    deformVerts(new THREE.TorusGeometry(0.06 * s, 0.022 * s, 6, 8), 0.2),
    WET_FLESH_MAT,
    { x: 0.1 * s, y: 0.72 * s, z: 0.24 * s },
    { x: 0.5 },
  );
  addPart(mesh,
    deformVerts(new THREE.TorusGeometry(0.04 * s, 0.018 * s, 5, 7), 0.25),
    MUSCLE_MAT,
    { x: 0.06 * s, y: 0.68 * s, z: 0.22 * s },
    { x: -0.3, y: 0.4 },
  );

  // Spine ridge along back
  addSpineRidge(mesh, s, 0.65, 1.2, -0.2, 6);

  // Wounds
  addWound(mesh, s, 0.18, 0.95, 0.22);
  addWound(mesh, s, -0.12, 0.78, 0.24);

  // Decay patches
  addDecayPatch(mesh, s, 0.12, 1.0, -0.15);
  addDecayPatch(mesh, s, -0.18, 0.85, 0.15);

  // Pustule clusters
  addPustuleCluster(mesh, s, 0.2, 0.9, 0.12, 3);
  addPustuleCluster(mesh, s, -0.15, 1.05, -0.08, 2);

  // Fungal growth on shoulder
  addFungalCluster(mesh, s, -0.25, 1.15, -0.1, 3);

  // Tattered clothing
  addClothStrip(mesh, CLOTH_MAT, s, 0.22, 0.68, 0.15, 0.4);
  addClothStrip(mesh, CLOTH_MAT, s, -0.18, 0.62, -0.1, -0.2);
  addClothStrip(mesh, CLOTH_MAT, s, 0.0, 0.55, 0.2, 0.6);

  // Hanging flesh from torso
  addFleshStrip(mesh, skinMat, s, -0.14, 0.7, 0.2);
  addFleshStrip(mesh, skinMat, s, 0.08, 0.65, 0.22);

  // Slime drips from body
  addSlimeDrip(mesh, s, -0.1, 0.62, 0.18);
  addSlimeDrip(mesh, s, 0.15, 0.58, 0.15);

  // Tendrils hanging from wound
  addTendril(mesh, WET_FLESH_MAT, s, 0.12, 0.68, 0.24, 0.12, 3);

  // Veins visible on torso
  addVeinNetwork(mesh, s, 0.15, 0.9, 0.2, 3);
  addVeinNetwork(mesh, s, -0.2, 0.85, 0.18, 2);

  // Left arm — reaching forward, organic shape
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.5 * s, 6, 8), 0.1);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.38 * s, y: 1.08 * s, z: 0.2 * s },
    { x: -Math.PI / 2.2, z: 0.1 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.3, 4, 0.022);
  // Organic lump on forearm
  const forearmLump = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.04 * s, 5, 5), 0.2),
    skinMat,
  );
  forearmLump.position.set(0.03 * s, -0.1 * s, 0.04 * s);
  leftArm.add(forearmLump);

  // Right arm — torn off below elbow with bone stump
  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.1 * s, 0.35 * s, 6, 8), 0.1);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.38 * s, y: 1.1 * s, z: 0.15 * s },
    { x: -Math.PI / 2.0, z: -0.15 },
  );
  mesh.userData.rightArm = rightArm;
  const stumpBone = new THREE.Mesh(
    deformVerts(new THREE.CylinderGeometry(0.028 * s, 0.015 * s, 0.14 * s, 5), 0.12),
    BONE_MAT,
  );
  stumpBone.position.y = -0.24 * s;
  rightArm.add(stumpBone);
  const stumpWound = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.05 * s, 6, 6), 0.18),
    WOUND_MAT,
  );
  stumpWound.position.y = -0.2 * s;
  rightArm.add(stumpWound);
  // Hanging tendons from stump
  for (let i = 0; i < 3; i++) {
    const tendon = new THREE.Mesh(
      deformVerts(new THREE.CylinderGeometry(0.008 * s, 0.004 * s, 0.08 * s, 3), 0.2),
      TENDON_MAT,
    );
    tendon.position.set((i - 1) * 0.02 * s, -0.28 * s, 0);
    tendon.rotation.x = (Math.random() - 0.5) * 0.5;
    rightArm.add(tendon);
  }

  // Legs — organic, uneven
  const leftLegGeo = deformVerts(new THREE.CylinderGeometry(0.12 * s, 0.08 * s, 0.58 * s, 7), 0.1);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.16 * s, y: 0.3 * s },
    { z: 0.05 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.3);

  const rightLegGeo = deformVerts(new THREE.CylinderGeometry(0.13 * s, 0.09 * s, 0.54 * s, 7), 0.1);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.18 * s, y: 0.28 * s },
    { x: 0.1, z: -0.08 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.28);

  // Torn pant leg
  addClothStrip(mesh, pantsMat, s, 0.22, 0.18, 0.05, 0.1);

  // Organic growths on legs
  addPustuleCluster(mesh, s, -0.2, 0.35, 0.06, 2);
}

// ═══════════════════════════════════════════════════════════════
// Fast Zombie (Runner) — feral predator, recently turned
// ═══════════════════════════════════════════════════════════════

function buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.42,
    headZ: 0.22,
    tiltX: 0.5,
    tiltZ: 0,
    jawOpen: 0.45,
    headScale: 0.85,
    teethUpper: 6,
    teethLower: 4,
  });

  // Hair remnants
  for (let i = 0; i < 4; i++) {
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x2a2218, roughness: 1.0, side: THREE.DoubleSide,
    });
    const hairGeo = deformVerts(new THREE.PlaneGeometry(0.02 * s, 0.12 * s), 0.4);
    addPart(mesh, hairGeo, hairMat,
      { x: (i - 1.5) * 0.05 * s, y: 1.54 * s, z: -0.14 * s },
      { x: -0.5 + Math.random() * 0.4 },
    );
  }

  addNeck(mesh, skinMat, s, 1.26, 0.12);

  // Lean, sinewy torso — heavily hunched
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.19 * s, 0.42 * s, 8, 8), 0.14);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.82 * s, z: -0.12 * s }, { x: 0.45 });
  mesh.userData.body = body;

  // Emaciated rib outline
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 5; i++) {
      addPart(mesh,
        deformVerts(new THREE.CylinderGeometry(0.012 * s, 0.008 * s, 0.14 * s, 4), 0.1),
        BONE_MAT,
        {
          x: side * 0.12 * s,
          y: (0.65 + i * 0.08) * s,
          z: (0.08 + Math.abs(i - 2) * 0.02) * s,
        },
        { z: side * 0.6 },
      );
    }
  }

  // Prominent spine ridge — very visible, animalistic
  addSpineRidge(mesh, s, 0.58, 1.2, -0.18, 8);

  // Visible shoulder blades
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.BoxGeometry(0.12 * s, 0.08 * s, 0.04 * s), 0.15),
      BONE_MAT,
      { x: side * 0.18 * s, y: 1.08 * s, z: -0.15 * s },
      { y: side * 0.2, z: side * 0.15 },
    );
  }

  // Bite wounds — fresh, bloody
  addWound(mesh, s, -0.2, 1.05, 0.1);
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.06 * s, 6, 6), 0.18),
    BLOOD_MAT,
    { x: -0.2 * s, y: 1.0 * s, z: 0.12 * s },
  );

  // Blood smears
  for (let i = 0; i < 3; i++) {
    addPart(mesh,
      deformVerts(new THREE.BoxGeometry(0.035 * s, 0.12 * s, 0.01 * s), 0.2),
      BLOOD_MAT,
      {
        x: (0.1 + i * 0.06) * s,
        y: (0.8 + i * 0.05) * s,
        z: (0.16 + i * 0.02) * s,
      },
      { x: i * 0.2 },
    );
  }

  // Bone spurs on joints — mutating creature
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.02 * s, 0.08 * s, 4), 0.15),
      BONE_MAT,
      { x: side * 0.22 * s, y: 1.0 * s, z: -0.1 * s },
      { x: -0.6, z: side * 0.3 },
    );
  }

  // Torn clothing remnants
  addClothStrip(mesh, CLOTH_MAT, s, 0.15, 0.88, 0.12, 0.2);
  addClothStrip(mesh, CLOTH_MAT, s, -0.12, 0.7, -0.08, -0.3);

  // Veins prominent on emaciated body
  addVeinNetwork(mesh, s, 0.1, 0.85, 0.14, 3);
  addVeinNetwork(mesh, s, -0.12, 0.78, 0.12, 2);

  // Left arm — long, with elongated claws
  const leftArmGeo = deformVerts(new THREE.CylinderGeometry(0.05 * s, 0.03 * s, 0.7 * s, 6), 0.1);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.28 * s, y: 0.88 * s, z: 0.32 * s },
    { x: -Math.PI / 2.2, z: 0.25 },
  );
  mesh.userData.leftArm = leftArm;
  for (let i = 0; i < 4; i++) {
    const clawLen = (0.1 + Math.random() * 0.05) * s;
    const clawGeo = deformVerts(new THREE.ConeGeometry(0.01 * s, clawLen, 4), 0.08);
    const claw = new THREE.Mesh(clawGeo, BONE_MAT);
    claw.position.set((i - 1.5) * 0.022 * s, -0.42 * s, 0);
    claw.rotation.x = -0.25 + (Math.random() - 0.5) * 0.2;
    leftArm.add(claw);
  }
  // Elbow bone spur
  const elbowSpur = new THREE.Mesh(
    deformVerts(new THREE.ConeGeometry(0.015 * s, 0.06 * s, 4), 0.15),
    BONE_MAT,
  );
  elbowSpur.position.set(-0.03 * s, -0.05 * s, -0.03 * s);
  elbowSpur.rotation.z = 0.8;
  leftArm.add(elbowSpur);

  // Right arm — similar but more damaged
  const rightArmGeo = deformVerts(new THREE.CylinderGeometry(0.05 * s, 0.03 * s, 0.65 * s, 6), 0.1);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.28 * s, y: 0.85 * s, z: 0.32 * s },
    { x: -Math.PI / 2.3, z: -0.25 },
  );
  mesh.userData.rightArm = rightArm;
  for (let i = 0; i < 4; i++) {
    const clawLen = (0.1 + Math.random() * 0.05) * s;
    const clawGeo = deformVerts(new THREE.ConeGeometry(0.01 * s, clawLen, 4), 0.08);
    const claw = new THREE.Mesh(clawGeo, BONE_MAT);
    claw.position.set((i - 1.5) * 0.022 * s, -0.38 * s, 0);
    claw.rotation.x = -0.25 + (Math.random() - 0.5) * 0.2;
    rightArm.add(claw);
  }

  // Blood on forearms
  for (const arm of [leftArm, rightArm]) {
    const bloodGeo = deformVerts(new THREE.CylinderGeometry(0.04 * s, 0.055 * s, 0.15 * s, 5), 0.15);
    const blood = new THREE.Mesh(bloodGeo, BLOOD_MAT);
    blood.position.y = -0.18 * s;
    arm.add(blood);
  }

  // Digitigrade-style legs — animalistic
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.065 * s, 0.45 * s, 5, 6), 0.1);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.14 * s, y: 0.28 * s },
    { x: 0.28 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, skinMat, s, -0.26);
  // Knee bone spur
  const kneeSpur = new THREE.Mesh(
    deformVerts(new THREE.ConeGeometry(0.015 * s, 0.05 * s, 4), 0.15),
    BONE_MAT,
  );
  kneeSpur.position.set(0, 0.08 * s, 0.05 * s);
  kneeSpur.rotation.x = -0.5;
  leftLeg.add(kneeSpur);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.065 * s, 0.45 * s, 5, 6), 0.1);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.14 * s, y: 0.28 * s },
    { x: 0.28 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, skinMat, s, -0.26);
}

// ═══════════════════════════════════════════════════════════════
// Tank Zombie (Brute) — massive mutated monstrosity
// ═══════════════════════════════════════════════════════════════

function buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.92,
    headZ: 0.2,
    tiltX: 0,
    tiltZ: 0,
    jawOpen: 0.22,
    headScale: 0.9,
    teethUpper: 5,
    teethLower: 4,
    noNose: true,
  });

  // Heavy brow ridge
  addPart(mesh,
    deformVerts(new THREE.BoxGeometry(0.48 * s, 0.12 * s, 0.16 * s), 0.12),
    BONE_MAT,
    { y: 2.0 * s, z: 0.32 * s },
  );

  // Tusks from lower jaw
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.045 * s, 0.2 * s, 5), 0.08),
      BONE_MAT,
      { x: side * 0.12 * s, y: 1.82 * s, z: 0.35 * s },
      { x: -0.3, z: side * 0.2 },
    );
  }

  // Thick muscular neck
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.28 * s, 0.38 * s, 0.22 * s, 8), 0.1),
    skinMat,
    { y: 1.78 * s, z: 0.15 * s },
  );

  // Massive barrel torso — built from overlapping organic masses
  const bodyGeo = deformVerts(new THREE.SphereGeometry(0.68 * s, 14, 14), 0.08);
  bodyGeo.scale(1.15, 1.0, 0.88);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.2 * s });
  mesh.userData.body = body;

  // Secondary organic masses on torso
  addOrganicLump(mesh, bodyMat, s, 0.45, 1.35, 0.2, 0.22);
  addOrganicLump(mesh, bodyMat, s, -0.38, 1.15, 0.25, 0.18);
  addOrganicLump(mesh, bodyMat, s, 0.1, 0.75, 0.35, 0.15);

  // Exposed muscle masses
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.22 * s, 8, 8), 0.12),
    MUSCLE_MAT,
    { x: 0.5 * s, y: 1.4 * s, z: 0.3 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.2 * s, 7, 7), 0.12),
    MUSCLE_MAT,
    { x: -0.42 * s, y: 1.3 * s, z: 0.35 * s },
  );

  // Bone armor plates — fused with flesh
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI - Math.PI / 2;
    const plateGeo = deformVerts(new THREE.BoxGeometry(0.32 * s, 0.07 * s, 0.08 * s), 0.12);
    addPart(mesh, plateGeo, BONE_MAT,
      {
        x: Math.sin(angle) * 0.64 * s,
        y: (0.95 + i * 0.1) * s,
        z: Math.cos(angle) * 0.54 * s,
      },
      { y: angle },
    );
    // Flesh growing over plate edges
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.05 * s, 4, 4), 0.2),
      skinMat,
      {
        x: Math.sin(angle) * 0.62 * s,
        y: (0.95 + i * 0.1 + 0.04) * s,
        z: Math.cos(angle) * 0.52 * s,
      },
    );
  }

  // Bone spurs from shoulders — larger, more imposing
  const spurPositions = [
    { x: -0.6, y: 1.7, z: -0.3, h: 0.55, rx: -0.8, rz: 0.5 },
    { x: 0.5, y: 1.65, z: -0.4, h: 0.45, rx: -1.0, rz: -0.3 },
    { x: -0.3, y: 1.82, z: -0.5, h: 0.4, rx: -1.2, rz: 0 },
    { x: 0.65, y: 1.55, z: -0.2, h: 0.3, rx: -0.6, rz: -0.5 },
    { x: -0.55, y: 1.5, z: -0.35, h: 0.25, rx: -0.9, rz: 0.3 },
  ];
  for (const sp of spurPositions) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.1 * s, sp.h * s, 5), 0.08),
      BONE_MAT,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
      { x: sp.rx, z: sp.rz },
    );
  }

  // Tumorous growths
  addPustuleCluster(mesh, s, 0.35, 1.5, 0.35, 4);
  addPustuleCluster(mesh, s, -0.4, 1.2, 0.4, 3);
  addPustuleCluster(mesh, s, 0.2, 0.85, 0.45, 5);

  // Fungal colonies on back
  addFungalCluster(mesh, s, -0.2, 1.6, -0.5, 5);
  addFungalCluster(mesh, s, 0.25, 1.45, -0.45, 4);

  // Spine ridge — thick, brutish
  addSpineRidge(mesh, s, 0.7, 1.7, -0.55, 7);

  // Massive wounds with wet flesh
  addWound(mesh, s, 0.4, 1.3, 0.52);
  addWound(mesh, s, -0.5, 1.1, 0.42);
  addWound(mesh, s, 0.0, 0.9, 0.6);

  // Hanging flesh strips
  addFleshStrip(mesh, skinMat, s, 0.3, 1.0, 0.52);
  addFleshStrip(mesh, skinMat, s, -0.4, 0.9, 0.48);
  addFleshStrip(mesh, skinMat, s, 0.15, 0.8, 0.55);

  // Slime/drool
  addSlimeDrip(mesh, s, 0.0, 1.75, 0.35);
  addSlimeDrip(mesh, s, -0.35, 1.0, 0.5);

  // Tendrils from wounds
  addTendril(mesh, WET_FLESH_MAT, s, 0.4, 1.25, 0.52, 0.15, 4);
  addTendril(mesh, WET_FLESH_MAT, s, -0.5, 1.05, 0.42, 0.12, 3);

  // Veins covering torso
  addVeinNetwork(mesh, s, 0.3, 1.2, 0.45, 4);
  addVeinNetwork(mesh, s, -0.25, 1.4, 0.4, 3);

  // Decay patches
  addDecayPatch(mesh, s, -0.3, 1.4, 0.32);
  addDecayPatch(mesh, s, 0.2, 0.85, 0.42);

  // Massive club-like left arm
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.3 * s, 0.92 * s, 8, 8), 0.08);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.95 * s, y: 1.15 * s, z: 0.1 * s },
    { x: -0.15, z: 0.1 },
  );
  mesh.userData.leftArm = leftArm;
  // Organic lumps on arm
  const armLump = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.12 * s, 6, 6), 0.15),
    skinMat,
  );
  armLump.position.set(0.08 * s, 0.1 * s, 0.1 * s);
  leftArm.add(armLump);
  // Bone knuckles
  const knuckle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.16 * s, 7, 7), 0.12),
    BONE_MAT,
  );
  knuckle.position.y = -0.55 * s;
  leftArm.add(knuckle);
  for (let i = 0; i < 3; i++) {
    const fg = new THREE.Mesh(
      deformVerts(new THREE.CylinderGeometry(0.045 * s, 0.03 * s, 0.13 * s, 4), 0.15),
      skinMat,
    );
    fg.position.set((i - 1) * 0.07 * s, -0.67 * s, 0);
    fg.rotation.x = (Math.random() - 0.5) * 0.3;
    leftArm.add(fg);
  }

  // Oversized mutated right arm
  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.4 * s, 1.12 * s, 8, 8), 0.08);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 1.05 * s, y: 1.0 * s, z: 0.2 * s },
    { x: -0.25, z: -0.1 },
  );
  mesh.userData.rightArm = rightArm;
  // Exposed bone on forearm
  const forearmBone = new THREE.Mesh(
    deformVerts(new THREE.CylinderGeometry(0.055 * s, 0.035 * s, 0.45 * s, 5), 0.1),
    BONE_MAT,
  );
  forearmBone.position.set(0.06 * s, -0.35 * s, 0.1 * s);
  forearmBone.rotation.z = -0.3;
  rightArm.add(forearmBone);
  // Exposed muscle on upper arm
  const armMuscle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.17 * s, 7, 7), 0.12),
    MUSCLE_MAT,
  );
  armMuscle.position.set(0.12 * s, 0.1 * s, 0.16 * s);
  rightArm.add(armMuscle);
  // Tumorous growth on arm
  const armTumor = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.1 * s, 6, 6), 0.18),
    PUSTULE_MAT,
  );
  armTumor.position.set(-0.1 * s, -0.15 * s, 0.12 * s);
  rightArm.add(armTumor);

  // Thick legs
  const leftLegGeo = deformVerts(new THREE.CylinderGeometry(0.3 * s, 0.2 * s, 0.68 * s, 8), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.35 * s, y: 0.33 * s },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.35);

  const rightLegGeo = deformVerts(new THREE.CylinderGeometry(0.32 * s, 0.22 * s, 0.72 * s, 8), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.38 * s, y: 0.35 * s },
    { z: -0.08 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.37);
}

// ═══════════════════════════════════════════════════════════════
// Spitter Zombie — acid-producing toxic mutant
// ═══════════════════════════════════════════════════════════════

function buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.52,
    headZ: 0.12,
    tiltX: 0.25,
    tiltZ: 0.08,
    jawOpen: 0.4,
    headScale: 0.95,
    teethUpper: 3,
    teethLower: 2,
  });

  // Mandible-like protrusions from jaw
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.015 * s, 0.08 * s, 4), 0.12),
      BONE_MAT,
      { x: side * 0.12 * s, y: 1.35 * s, z: 0.2 * s },
      { x: 0.5, z: side * 0.3 },
    );
  }

  // Bile-filled gullet — translucent, glowing
  const gulletMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.75,
    roughness: 0.4,
    metalness: 0.2,
  });
  const gulletGeo = deformVerts(new THREE.SphereGeometry(0.2 * s, 9, 9), 0.1);
  gulletGeo.scale(1.2, 1.45, 1.05);
  addPart(mesh, gulletGeo, gulletMat, { y: 1.32 * s, z: 0.2 * s });

  // Smaller bile sacs on cheek and chin
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.09 * s, 6, 6), 0.12),
    gulletMat,
    { x: 0.15 * s, y: 1.47 * s, z: 0.16 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.06 * s, 5, 5), 0.15),
    gulletMat,
    { x: -0.1 * s, y: 1.3 * s, z: 0.22 * s },
  );

  addNeck(mesh, skinMat, s, 1.28, 0.06);

  // Hunched, corroded torso
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.22 * s, 0.52 * s, 7, 8), 0.1);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.88 * s }, { x: 0.18 });
  mesh.userData.body = body;

  // Acid-corroded organic lumps on torso
  addOrganicLump(mesh, bodyMat, s, 0.15, 0.82, 0.12, 0.1);
  addOrganicLump(mesh, bodyMat, s, -0.12, 0.75, -0.05, 0.08);

  // Bile sacs on back — larger, more numerous
  const sackMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.75,
    roughness: 0.35,
    metalness: 0.2,
  });
  const sackPositions = [
    { x: -0.12, y: 1.2, z: -0.2, r: 0.18 },
    { x: 0.16, y: 1.32, z: -0.15, r: 0.24 },
    { x: 0.0, y: 1.08, z: -0.26, r: 0.14 },
    { x: -0.22, y: 1.0, z: -0.14, r: 0.12 },
    { x: 0.1, y: 0.92, z: -0.22, r: 0.13 },
    { x: -0.05, y: 1.15, z: -0.22, r: 0.1 },
    { x: 0.2, y: 1.1, z: -0.18, r: 0.09 },
  ];
  for (const sp of sackPositions) {
    const geo = deformVerts(new THREE.SphereGeometry(sp.r * s, 8, 8), 0.1);
    addPart(mesh, geo, sackMat,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
    );
    // Connecting tissue between sacs
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(sp.r * 0.4 * s, 4, 4), 0.2),
      skinMat,
      { x: sp.x * s, y: (sp.y + sp.r * 0.5) * s, z: (sp.z + 0.03) * s },
    );
  }

  // Acid corrosion wounds — deeper, more organic
  for (let i = 0; i < 4; i++) {
    const cx = (Math.random() - 0.5) * 0.32;
    const cy = 0.65 + Math.random() * 0.35;
    const cz = 0.14 + Math.random() * 0.12;
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.06 * s, 6, 6), 0.18),
      WOUND_MAT,
      { x: cx * s, y: cy * s, z: cz * s },
    );
    addSlimeDrip(mesh, s, cx, cy - 0.05, cz);
  }

  // Visible spine
  addSpineRidge(mesh, s, 0.65, 1.15, -0.22, 5);

  // Acid drip tendrils hanging from body
  addTendril(mesh, null, s, 0.1, 0.7, 0.2, 0.1, 3);
  addTendril(mesh, null, s, -0.15, 0.65, 0.18, 0.08, 2);

  // Veins visible through corroded skin
  addVeinNetwork(mesh, s, 0.12, 0.9, 0.15, 3);

  // Decay patches
  addDecayPatch(mesh, s, 0.15, 0.9, 0.14);
  addDecayPatch(mesh, s, -0.1, 0.75, -0.1);

  // Left arm — long, thin, acid-stained
  const leftArmGeo = deformVerts(new THREE.CylinderGeometry(0.06 * s, 0.035 * s, 0.62 * s, 5), 0.1);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.32 * s, y: 0.98 * s, z: 0.14 * s },
    { x: -Math.PI / 3, z: 0.1 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.35, 3, 0.02);
  // Acid burns on arm
  const acidBurn = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.035 * s, 5, 5), 0.2),
    WOUND_MAT,
  );
  acidBurn.position.set(0.02 * s, -0.12 * s, 0.03 * s);
  leftArm.add(acidBurn);

  // Right arm — mutated stump oozing acid
  const stubGeo = deformVerts(new THREE.CapsuleGeometry(0.1 * s, 0.2 * s, 6, 6), 0.12);
  const rightArm = addPart(mesh, stubGeo, skinMat,
    { x: 0.32 * s, y: 1.05 * s },
    { x: -0.4 },
  );
  mesh.userData.rightArm = rightArm;
  // Acid drip cluster at stump
  for (let i = 0; i < 3; i++) {
    const dripGeo = new THREE.ConeGeometry(0.025 * s, 0.07 * s, 5);
    const drip = new THREE.Mesh(dripGeo, sackMat);
    drip.position.set((i - 1) * 0.03 * s, (-0.14 - i * 0.02) * s, 0);
    drip.rotation.x = (Math.random() - 0.5) * 0.3;
    rightArm.add(drip);
  }
  const stumpW = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.06 * s, 6, 6), 0.18),
    WOUND_MAT,
  );
  stumpW.position.y = -0.12 * s;
  rightArm.add(stumpW);
  const stumpB = new THREE.Mesh(
    deformVerts(new THREE.CylinderGeometry(0.028 * s, 0.015 * s, 0.1 * s, 4), 0.1),
    BONE_MAT,
  );
  stumpB.position.set(0.02 * s, -0.1 * s, 0);
  stumpB.rotation.z = -0.3;
  rightArm.add(stumpB);

  // Thin legs
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.46 * s, 5, 6), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.14 * s, y: 0.28 * s },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.28);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.09 * s, 0.43 * s, 5, 6), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.14 * s, y: 0.27 * s },
    { x: 0.05 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.26);
}

// ═══════════════════════════════════════════════════════════════
// Exploder Zombie (Bloater) — grotesquely distended, about to burst
// ═══════════════════════════════════════════════════════════════

function buildExploderZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.58,
    headZ: 0.2,
    tiltX: 0,
    tiltZ: 0,
    jawOpen: 0.18,
    headScale: 0.78,
    teethUpper: 3,
    teethLower: 2,
    noEars: true,
    noSlime: true,
  });

  // Head merging into bloated body — fleshy transition
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.2 * s, 0.35 * s, 0.14 * s, 8), 0.12),
    skinMat,
    { y: 1.45 * s, z: 0.12 * s },
  );
  addOrganicLump(mesh, skinMat, s, 0.12, 1.5, 0.08, 0.08);

  // Massively bloated torso — multiple overlapping organic masses
  const bodyGeo = deformVerts(new THREE.SphereGeometry(0.63 * s, 14, 14), 0.07);
  bodyGeo.scale(1.12, 1.28, 1.12);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.9 * s });
  mesh.userData.body = body;

  // Secondary bloat masses — makes it lumpier
  addOrganicLump(mesh, bodyMat, s, 0.3, 1.05, 0.35, 0.2);
  addOrganicLump(mesh, bodyMat, s, -0.25, 0.85, 0.38, 0.18);
  addOrganicLump(mesh, bodyMat, s, 0.0, 0.65, 0.4, 0.15);
  addOrganicLump(mesh, bodyMat, s, -0.35, 1.1, -0.2, 0.16);

  // Stretched skin cracks glowing from internal pressure
  const crackMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 12; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI * 0.6;
    const r = 0.7 * s;
    const cx = r * Math.cos(phi) * Math.cos(theta);
    const cy = 0.9 * s + r * Math.sin(phi) * 0.9;
    const cz = r * Math.cos(phi) * Math.sin(theta);
    const crackLen = (0.15 + Math.random() * 0.1) * s;
    addPart(mesh,
      new THREE.CylinderGeometry(0.013 * s, 0.008 * s, crackLen, 4),
      crackMat,
      { x: cx, y: cy, z: cz },
      { x: Math.random() * Math.PI, y: Math.random() * Math.PI },
    );
  }

  // Visible intestines bulging through tears
  const gutsMat = new THREE.MeshStandardMaterial({
    color: 0x883333,
    emissive: glowColor,
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.15,
  });
  const gutsPositions = [
    { x: 0.2, y: 0.8, z: 0.56, rx: 0.5, ry: 0.3, r: 0.13, t: 0.042 },
    { x: -0.15, y: 0.7, z: 0.52, rx: -0.3, ry: 0.8, r: 0.11, t: 0.038 },
    { x: 0.05, y: 1.1, z: 0.62, rx: 0.7, ry: -0.2, r: 0.09, t: 0.032 },
    { x: -0.25, y: 0.9, z: 0.5, rx: 0.2, ry: 0.5, r: 0.08, t: 0.028 },
  ];
  for (const g of gutsPositions) {
    addPart(mesh,
      deformVerts(new THREE.TorusGeometry(g.r * s, g.t * s, 6, 8), 0.15),
      gutsMat,
      { x: g.x * s, y: g.y * s, z: g.z * s },
      { x: g.rx, y: g.ry },
    );
  }

  // Gas-filled cysts — glowing, about to pop
  const cystMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.6,
    roughness: 0.3,
    metalness: 0.2,
  });
  const cystPositions = [
    { x: 0.35, y: 1.1, z: 0.4, r: 0.08 },
    { x: -0.3, y: 0.75, z: 0.45, r: 0.1 },
    { x: 0.15, y: 0.6, z: 0.35, r: 0.07 },
    { x: -0.4, y: 1.0, z: 0.3, r: 0.06 },
    { x: 0.0, y: 1.25, z: 0.5, r: 0.09 },
    { x: 0.25, y: 0.75, z: -0.2, r: 0.07 },
  ];
  for (const c of cystPositions) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(c.r * s, 7, 7), 0.12),
      cystMat,
      { x: c.x * s, y: c.y * s, z: c.z * s },
    );
  }

  // Internal glow — stronger
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  addPart(mesh,
    new THREE.SphereGeometry(0.5 * s, 10, 10),
    innerGlowMat,
    { y: 0.9 * s },
  );

  // Veiny surface covering the bloated body
  for (let i = 0; i < 6; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.3) * Math.PI * 0.5;
    const r = 0.65 * s;
    addVeinNetwork(mesh, s,
      (r * Math.cos(phi) * Math.cos(theta)) / s,
      0.9 + (r * Math.sin(phi) * 0.8) / s,
      (r * Math.cos(phi) * Math.sin(theta)) / s,
      2,
    );
  }

  // Wounds leaking
  for (let i = 0; i < 5; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.3) * Math.PI * 0.5;
    const r = 0.68 * s;
    addWound(mesh, s,
      (r * Math.cos(phi) * Math.cos(theta)) / s,
      0.9 + (r * Math.sin(phi) * 0.8) / s,
      (r * Math.cos(phi) * Math.sin(theta)) / s,
    );
  }

  // Hanging flesh from skin tears
  addFleshStrip(mesh, skinMat, s, 0.32, 0.72, 0.48);
  addFleshStrip(mesh, skinMat, s, -0.28, 0.62, 0.42);
  addFleshStrip(mesh, skinMat, s, 0.1, 0.55, 0.5);

  // Slime dripping from body
  addSlimeDrip(mesh, s, 0.2, 0.55, 0.4);
  addSlimeDrip(mesh, s, -0.15, 0.5, 0.38);
  addSlimeDrip(mesh, s, 0.0, 0.48, 0.42);

  // Short stumpy arms — barely functional
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.11 * s, 0.38 * s, 5, 6), 0.1);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.72 * s, y: 1.08 * s, z: 0.1 * s },
    { x: -0.3, z: 0.4 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.24, 3, 0.02);

  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.11 * s, 0.36 * s, 5, 6), 0.1);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.72 * s, y: 1.05 * s, z: 0.1 * s },
    { x: -0.3, z: -0.4 },
  );
  mesh.userData.rightArm = rightArm;
  addFingers(rightArm, skinMat, s, -0.22, 3, 0.02);

  // Stumpy legs
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.17 * s, 0.32 * s, 6, 6), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.32 * s, y: 0.22 * s },
    { z: 0.15 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.2);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.18 * s, 0.32 * s, 6, 6), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.32 * s, y: 0.22 * s },
    { z: -0.15 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.2);
}

// ═══════════════════════════════════════════════════════════════
// Boss Zombie (Abomination) — towering nightmarish amalgamation
// ═══════════════════════════════════════════════════════════════

function buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  buildSkullHead(mesh, skinMat, s, {
    headY: 2.7,
    headZ: 0.28,
    tiltX: 0.12,
    tiltZ: 0,
    jawOpen: 0.35,
    headScale: 1.3,
    teethUpper: 7,
    teethLower: 5,
    noNose: true,
  });

  // Skull plate visible on top — cracked, organic
  const skullGeo = deformVerts(new THREE.SphereGeometry(0.38 * s, 10, 10), 0.08);
  skullGeo.scale(1.2, 0.6, 1.1);
  addPart(mesh, skullGeo, BONE_MAT, { y: 2.9 * s, z: 0.15 * s });

  // Lower fangs / tusks — larger, more imposing
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.05 * s, 0.25 * s, 4), 0.06),
      TEETH_MAT,
      { x: side * 0.16 * s, y: 2.36 * s, z: 0.52 * s },
      { x: Math.PI },
    );
  }

  // Horn-like bone growths — organic, twisted
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.4, metalness: 0.3 });
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.11 * s, 0.7 * s, 6), 0.08),
    hornMat,
    { x: -0.35 * s, y: 3.12 * s, z: 0.05 * s },
    { x: -0.3, z: 0.5 },
  );
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.1 * s, 0.55 * s, 6), 0.08),
    hornMat,
    { x: 0.35 * s, y: 3.07 * s, z: 0.05 * s },
    { x: -0.3, z: -0.5 },
  );
  // Small secondary horns
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.06 * s, 0.3 * s, 5), 0.1),
    hornMat,
    { x: -0.2 * s, y: 3.0 * s, z: -0.1 * s },
    { x: -0.5, z: 0.3 },
  );

  // Thick neck — organic transition to body
  addPart(mesh,
    deformVerts(new THREE.CylinderGeometry(0.32 * s, 0.48 * s, 0.32 * s, 10), 0.1),
    skinMat,
    { y: 2.4 * s, z: 0.15 * s },
  );
  addOrganicLump(mesh, skinMat, s, -0.25, 2.45, 0.1, 0.12);

  // Massive torso — built from overlapping organic masses
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.82 * s, 1.25 * s, 14, 14), 0.07);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.5 * s }, { x: 0.12 });
  mesh.userData.body = body;

  // Secondary body masses
  addOrganicLump(mesh, bodyMat, s, 0.5, 1.7, 0.3, 0.25);
  addOrganicLump(mesh, bodyMat, s, -0.45, 1.4, 0.35, 0.22);
  addOrganicLump(mesh, bodyMat, s, 0.3, 1.0, 0.4, 0.2);
  addOrganicLump(mesh, bodyMat, s, -0.35, 0.9, -0.3, 0.18);

  // Exposed ribcage (gaping chest wound)
  for (let i = 0; i < 6; i++) {
    const ribAngle = (i - 2.5) * 0.22;
    addPart(mesh,
      deformVerts(new THREE.CylinderGeometry(0.045 * s, 0.03 * s, 0.65 * s, 5), 0.08),
      BONE_MAT,
      {
        x: ribAngle * 0.85 * s,
        y: (1.55 + Math.abs(ribAngle) * 0.2) * s,
        z: 0.78 * s,
      },
      { z: ribAngle * 0.5 },
    );
  }

  // Exposed beating heart — organic, pulsating
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0x771111,
    emissive: glowColor,
    emissiveIntensity: 0.55,
    roughness: 0.5,
    metalness: 0.15,
  });
  const heartGeo = deformVerts(new THREE.SphereGeometry(0.24 * s, 10, 10), 0.1);
  heartGeo.scale(1.0, 1.15, 0.9);
  addPart(mesh, heartGeo, heartMat, { y: 1.6 * s, z: 0.68 * s });
  // Arteries connecting heart to body
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI + 0.5;
    addPart(mesh,
      deformVerts(new THREE.CylinderGeometry(0.025 * s, 0.015 * s, 0.3 * s, 4), 0.12),
      VEIN_MAT,
      {
        x: Math.cos(angle) * 0.15 * s,
        y: (1.6 + Math.sin(angle) * 0.1) * s,
        z: (0.65 - 0.08) * s,
      },
      { x: Math.cos(angle) * 0.5, z: Math.sin(angle) * 0.5 },
    );
  }

  // Exposed muscle masses — larger, wetter
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.28 * s, 8, 8), 0.1),
    MUSCLE_MAT,
    { x: -0.72 * s, y: 1.8 * s, z: 0.22 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.22 * s, 7, 7), 0.1),
    MUSCLE_MAT,
    { x: 0.62 * s, y: 1.7 * s, z: 0.32 * s },
  );

  // Back spines — more dramatic, organic
  const spinePositions = [
    { x: -0.4, y: 2.2, z: -0.45, h: 0.9, rx: -0.5, rz: 0.4 },
    { x: 0.42, y: 2.1, z: -0.55, h: 0.75, rx: -0.6, rz: -0.3 },
    { x: 0, y: 2.45, z: -0.65, h: 1.1, rx: -0.8, rz: 0 },
    { x: -0.22, y: 1.9, z: -0.55, h: 0.55, rx: -0.7, rz: 0.2 },
    { x: 0.32, y: 1.8, z: -0.5, h: 0.6, rx: -0.65, rz: -0.15 },
    { x: -0.1, y: 1.65, z: -0.6, h: 0.45, rx: -0.75, rz: 0.1 },
    { x: 0.15, y: 2.3, z: -0.5, h: 0.65, rx: -0.55, rz: -0.1 },
  ];
  for (const sp of spinePositions) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.12 * s, sp.h * s, 5), 0.08),
      BONE_MAT,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
      { x: sp.rx, z: sp.rz },
    );
    // Flesh at base of each spine
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.08 * s, 5, 5), 0.15),
      skinMat,
      { x: sp.x * s, y: (sp.y - 0.05) * s, z: (sp.z + 0.05) * s },
    );
  }

  // Spine ridge along the back
  addSpineRidge(mesh, s, 0.8, 2.2, -0.7, 10);

  // Tumorous growths covering body
  addPustuleCluster(mesh, s, 0.4, 1.8, 0.3, 5);
  addPustuleCluster(mesh, s, -0.5, 1.3, 0.4, 4);
  addPustuleCluster(mesh, s, 0.2, 1.0, 0.5, 6);
  addPustuleCluster(mesh, s, -0.3, 1.6, -0.3, 3);

  // Fungal colonies
  addFungalCluster(mesh, s, -0.4, 2.0, -0.4, 6);
  addFungalCluster(mesh, s, 0.35, 1.5, -0.45, 5);

  // Massive wounds with hanging flesh and tendrils
  addWound(mesh, s, -0.6, 1.3, 0.52);
  addWound(mesh, s, 0.5, 1.7, 0.62);
  addWound(mesh, s, 0, 1.0, 0.72);
  addFleshStrip(mesh, skinMat, s, -0.5, 1.2, 0.58);
  addFleshStrip(mesh, skinMat, s, 0.3, 0.95, 0.62);
  addFleshStrip(mesh, skinMat, s, 0.0, 1.4, 0.72);

  // Organic tendrils from wounds
  addTendril(mesh, WET_FLESH_MAT, s, -0.6, 1.25, 0.52, 0.2, 4);
  addTendril(mesh, WET_FLESH_MAT, s, 0.5, 1.65, 0.62, 0.18, 4);
  addTendril(mesh, WET_FLESH_MAT, s, 0.0, 0.95, 0.72, 0.15, 3);

  // Tentacle-like appendages from back
  for (let t = 0; t < 3; t++) {
    const tx = (t - 1) * 0.4;
    const ty = 1.8 + t * 0.15;
    const tz = -0.5;
    for (let seg = 0; seg < 5; seg++) {
      const segLen = (0.2 - seg * 0.02) * s;
      const thickness = (0.06 - seg * 0.008) * s;
      const geo = deformVerts(
        new THREE.CylinderGeometry(thickness, thickness * 0.7, segLen, 5), 0.15
      );
      const sway = Math.sin(seg * 1.2 + t) * 0.08 * s;
      addPart(mesh, geo, skinMat,
        {
          x: tx * s + sway,
          y: (ty - seg * 0.18) * s,
          z: (tz - seg * 0.12) * s,
        },
        { x: -0.6 + seg * 0.15, z: (Math.random() - 0.5) * 0.3 },
      );
    }
  }

  // Slime drips
  addSlimeDrip(mesh, s, 0.0, 2.35, 0.4);
  addSlimeDrip(mesh, s, -0.4, 1.2, 0.55);
  addSlimeDrip(mesh, s, 0.3, 0.9, 0.6);

  // Vein networks
  addVeinNetwork(mesh, s, 0.4, 1.5, 0.5, 5);
  addVeinNetwork(mesh, s, -0.3, 1.8, 0.4, 4);
  addVeinNetwork(mesh, s, 0.0, 1.2, 0.6, 3);

  // Decay patches
  addDecayPatch(mesh, s, -0.4, 1.6, 0.42);
  addDecayPatch(mesh, s, 0.5, 1.2, 0.32);
  addDecayPatch(mesh, s, 0.0, 0.8, 0.52);

  // Left arm — massive club with bone spurs and organic growths
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.44 * s, 1.42 * s, 10, 10), 0.06);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -1.2 * s, y: 1.6 * s, z: 0.4 * s },
    { x: -Math.PI / 2.5, z: 0.2 },
  );
  mesh.userData.leftArm = leftArm;
  // Bone spurs on arm
  for (const sp of [
    { y: -0.3, x: -0.22, z: 0.16, h: 0.55, rz: 1.0 },
    { y: -0.55, x: 0.16, z: 0.12, h: 0.38, rz: -0.8 },
    { y: -0.1, x: -0.18, z: -0.1, h: 0.3, rz: 0.6 },
  ]) {
    const spur = new THREE.Mesh(
      deformVerts(new THREE.ConeGeometry(0.09 * s, sp.h * s, 5), 0.08),
      BONE_MAT,
    );
    spur.position.set(sp.x * s, sp.y * s, sp.z * s);
    spur.rotation.z = sp.rz;
    leftArm.add(spur);
  }
  // Organic lump on bicep
  const bicepLump = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.15 * s, 6, 6), 0.15),
    skinMat,
  );
  bicepLump.position.set(0.12 * s, 0.2 * s, 0.15 * s);
  leftArm.add(bicepLump);
  // Massive fist
  const fist = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.22 * s, 8, 8), 0.12),
    skinMat,
  );
  fist.position.y = -0.82 * s;
  leftArm.add(fist);

  // Right arm — mutated bone scythe
  const rightArmGeo = deformVerts(new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 1.65 * s, 10), 0.06);
  const rightArm = addPart(mesh, rightArmGeo, bodyMat,
    { x: 1.1 * s, y: 1.4 * s, z: 0.5 * s },
    { x: -Math.PI / 3, z: -0.1 },
  );
  mesh.userData.rightArm = rightArm;
  // Bone blade — organic, fused
  const blade = new THREE.Mesh(
    deformVerts(new THREE.BoxGeometry(0.045 * s, 1.25 * s, 0.28 * s), 0.06),
    BONE_MAT,
  );
  blade.position.set(0, -0.92 * s, 0.12 * s);
  blade.rotation.x = -0.2;
  rightArm.add(blade);
  // Flesh-bone fusion
  const fusionMuscle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.17 * s, 7, 7), 0.12),
    MUSCLE_MAT,
  );
  fusionMuscle.position.set(0, -0.32 * s, 0.1 * s);
  rightArm.add(fusionMuscle);
  // Tendons connecting blade to arm
  for (let i = 0; i < 3; i++) {
    const tendon = new THREE.Mesh(
      deformVerts(new THREE.CylinderGeometry(0.015 * s, 0.008 * s, 0.2 * s, 3), 0.15),
      TENDON_MAT,
    );
    tendon.position.set((i - 1) * 0.06 * s, -0.5 * s, 0.08 * s);
    tendon.rotation.x = -0.3;
    rightArm.add(tendon);
  }

  // Thick legs with organic growths
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.37 * s, 0.88 * s, 8, 8), 0.06);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.5 * s, y: 0.43 * s },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.49);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.4 * s, 0.92 * s, 8, 8), 0.06);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.52 * s, y: 0.45 * s },
    { z: -0.05 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.51);

  // Dark miasma aura
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

// ═══════════════════════════════════════════════════════════════
// Geometry merging — collapse static child meshes by material
// ═══════════════════════════════════════════════════════════════

function _mergeStaticParts(group) {
  const animated = new Set();
  for (const key of ['body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'aura', 'healthBar']) {
    if (group.userData[key]) animated.add(group.userData[key]);
  }

  const byMat = new Map();
  const removable = [];

  for (let i = 0; i < group.children.length; i++) {
    const child = group.children[i];
    if (!child.isMesh || animated.has(child)) continue;
    child.updateMatrix();
    const mat = child.material;
    if (!byMat.has(mat)) byMat.set(mat, []);
    byMat.get(mat).push(child);
    removable.push(child);
  }

  for (const [mat, meshes] of byMat) {
    if (meshes.length < 2) {
      const idx = removable.indexOf(meshes[0]);
      if (idx >= 0) removable.splice(idx, 1);
      continue;
    }

    const geos = meshes.map(m => {
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrix);
      return g;
    });

    const merged = mergeGeometries(geos, false);
    if (merged) group.add(new THREE.Mesh(merged, mat));
    for (const g of geos) g.dispose();
  }

  for (const child of removable) group.remove(child);
}

// ═══════════════════════════════════════════════════════════════
// Template cache — build each zombie type once, then clone
// ═══════════════════════════════════════════════════════════════

const _meshTemplateCache = new Map();

function _templateKey(type, typeDef) {
  return `${type}_${typeDef.color}_${typeDef.secondaryColor || 0}_${typeDef.eyeColor || 0}`;
}

function _restoreCloneRefs(cloned) {
  const indices = cloned.userData._partIndices;
  if (!indices) return;

  const children = [];
  cloned.traverse(child => children.push(child));

  for (const key in indices) {
    cloned.userData[key] = children[indices[key]];
  }

  if (cloned.userData.body) {
    cloned.userData.body.material = cloned.userData.body.material.clone();
  }
}

export function createZombieMesh(type = "normal", typeDef = ENEMY_TYPES.normal) {
  const key = _templateKey(type, typeDef);
  let template = _meshTemplateCache.get(key);
  if (!template) {
    template = _buildTemplate(type, typeDef);
    _meshTemplateCache.set(key, template);
  }

  const mesh = template.clone();
  _restoreCloneRefs(mesh);

  mesh.userData.type = type;
  mesh.userData.animPhase = Math.random() * Math.PI * 2;
  mesh.userData.limpOffsetL = (Math.random() - 0.5) * 0.4;
  mesh.userData.limpOffsetR = (Math.random() - 0.5) * 0.4;
  return mesh;
}

function _buildTemplate(type, typeDef) {
  const mesh = new THREE.Group();
  const s = typeDef.scale;
  const eyeColor = typeDef.eyeColor || 0xff0000;
  const glowColor = typeDef.glowColor || eyeColor;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: typeDef.color,
    roughness: 0.88,
    metalness: 0.08,
    emissive: typeDef.color,
    emissiveIntensity: 0.1,
  });
  const skinColor = new THREE.Color(typeDef.secondaryColor || 0x5a7a51).lerp(
    new THREE.Color(0x665555),
    0.25,
  );
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.75,
    metalness: 0.08,
    emissive: skinColor,
    emissiveIntensity: 0.08,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a30,
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

  _mergeStaticParts(mesh);

  const partKeys = ['body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'aura', 'healthBar'];
  const partIndices = {};
  let idx = 0;
  mesh.traverse(child => {
    for (const k of partKeys) {
      if (mesh.userData[k] === child) partIndices[k] = idx;
    }
    idx++;
  });

  for (const k of partKeys) delete mesh.userData[k];
  mesh.userData._partIndices = partIndices;

  return mesh;
}
