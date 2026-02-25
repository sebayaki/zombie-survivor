import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Global cache for the loaded GLTF model
let sharedZombieModel = null;
const loader = new GLTFLoader();
loader.load(
  "/assets/Soldier.glb",
  (gltf) => {
    sharedZombieModel = gltf.scene;
    sharedZombieModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  },
  undefined,
  (error) => {
    console.error("Error loading zombie model:", error);
  }
);

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

const ZOMBIE_NOISE_CHUNK = `
// Simplex 3D Noise 
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

function injectOrganicShader(mat, type = 'generic') {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vLocalPos;
      ${ZOMBIE_NOISE_CHUNK}
      `
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vLocalPos = position;
      float n = snoise(position * 20.0);
      transformed += normal * n * 0.02;
      `
    );
    
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vLocalPos;
      ${ZOMBIE_NOISE_CHUNK}
      `
    );
    
    let colorMixChunk = `
      float n1 = snoise(vLocalPos * 15.0);
      float dirt = smoothstep(0.0, 1.0, snoise(vLocalPos * 25.0 + vec3(10.0)));
      vec3 dirtColor = vec3(0.1, 0.08, 0.05);
      vec3 finalColor = mix(diffuseColor.rgb, diffuseColor.rgb * 0.6, smoothstep(0.0, 0.8, n1));
      finalColor = mix(finalColor, dirtColor, dirt * 0.4);
      diffuseColor.rgb = finalColor;
    `;
    
    if (type === 'skin') {
      colorMixChunk = `
      float n1 = snoise(vLocalPos * 12.0);
      float blood = smoothstep(0.4, 0.8, snoise(vLocalPos * 18.0 - vec3(15.0)));
      float decay = smoothstep(0.2, 0.9, snoise(vLocalPos * 10.0 + vec3(5.0)));
      
      vec3 baseColor = diffuseColor.rgb;
      vec3 decayColor = baseColor * 0.3 * vec3(0.6, 1.2, 0.6);
      vec3 bloodColor = vec3(0.25, 0.02, 0.02);
      
      vec3 finalColor = mix(baseColor, decayColor, decay * 0.8);
      finalColor = mix(finalColor, baseColor * 0.5, smoothstep(0.0, 0.8, n1));
      finalColor = mix(finalColor, bloodColor, blood * 0.85);
      
      diffuseColor.rgb = finalColor;
      `;
    } else if (type === 'body') {
      colorMixChunk = `
      float dirt = smoothstep(0.1, 0.9, snoise(vLocalPos * 20.0));
      float blood = smoothstep(0.5, 0.9, snoise(vLocalPos * 15.0 + vec3(20.0)));
      vec3 dirtColor = vec3(0.12, 0.1, 0.08);
      vec3 bloodColor = vec3(0.2, 0.0, 0.0);
      
      vec3 finalColor = mix(diffuseColor.rgb, dirtColor, dirt * 0.7);
      finalColor = mix(finalColor, bloodColor, blood * 0.6);
      diffuseColor.rgb = finalColor;
      `;
    }
    
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec4 diffuseColor = vec4( diffuse, opacity );
      ${colorMixChunk}
      `
    );
  };
}

const BONE_MAT = new THREE.MeshStandardMaterial({ color: 0xd4c8a0, roughness: 0.7, metalness: 0.05 });
const WOUND_MAT = new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 1.0, emissive: 0x220000, emissiveIntensity: 0.3 });
const BLOOD_MAT = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 1.0 });
const TEETH_MAT = new THREE.MeshStandardMaterial({ color: 0xbbaa77, roughness: 0.6 });
const CLOTH_MAT = new THREE.MeshStandardMaterial({ color: 0x222218, roughness: 1.0, side: THREE.DoubleSide });
const MUSCLE_MAT = new THREE.MeshStandardMaterial({ color: 0x8b2222, roughness: 0.85, emissive: 0x110000, emissiveIntensity: 0.15 });
const TENDON_MAT = new THREE.MeshStandardMaterial({ color: 0x996644, roughness: 0.8 });
const CAVITY_MAT = new THREE.MeshStandardMaterial({ color: 0x080804, roughness: 1.0 });
const DECAY_MAT = new THREE.MeshStandardMaterial({ color: 0x2a3020, roughness: 1.0 });
[BONE_MAT, WOUND_MAT, BLOOD_MAT, TEETH_MAT, CLOTH_MAT, MUSCLE_MAT, TENDON_MAT, DECAY_MAT].forEach(m => injectOrganicShader(m, 'generic'));


// ─── Geometry utilities ─────────────────────────────────────────

function createOrganicLimb(radius, length, segments=10) {
  const capLen = Math.max(0.01, length - radius * 2);
  return new THREE.CapsuleGeometry(radius, capLen, 8, segments);
}

function createEllipsoid(w, h, d, segments=12) {
  const geo = new THREE.SphereGeometry(0.5, segments, segments);
  geo.scale(w, h, d);
  return geo;
}


function deformVerts(geo, intensity = 0.07, seed = Math.random() * 1000) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.sin(x * 17.3 + seed) * Math.cos(y * 13.1 + seed * 1.3) * Math.sin(z * 19.7 + seed * 0.7);
    const n2 = Math.sin(x * 30.1) * Math.sin(y * 25.3) * Math.cos(z * 22.1);
    pos.setX(i, x * (1 + n * intensity + n2 * intensity * 0.5));
    pos.setY(i, y * (1 + n * intensity * 0.6 + n2 * intensity * 0.5));
    pos.setZ(i, z * (1 + n * intensity + n2 * intensity * 0.5));
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
    deformVerts(createOrganicLimb((0.03 * s + 0.02 * s) / 2, 0.2 * s, 5), 0.08),
    BONE_MAT,
    { x: x * s, y: y * s, z: z * s },
    { x: rotX || 0, z: rotZ || 0 },
  );
}

function addClothStrip(group, mat, s, x, y, z, rotX) {
  const geo = createEllipsoid(0.09 * s, 0.22 * s, 0.015 * s);
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
  const palmGeo = deformVerts(createEllipsoid(0.07 * s, 0.045 * s, 0.035 * s), 0.15);
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
  const footGeo = deformVerts(createEllipsoid(0.08 * s, 0.035 * s, 0.13 * s), 0.12);
  const foot = new THREE.Mesh(footGeo, mat);
  foot.position.set(0, tipY * s, 0.025 * s);
  legMesh.add(foot);
}

function addNeck(mesh, skinMat, s, y, z) {
  const neckGeo = deformVerts(createOrganicLimb((0.12 * s + 0.16 * s) / 2, 0.18 * s, 9), 0.15);
  addPart(mesh, neckGeo, skinMat, { y: y * s, z: (z || 0) * s });
  
  // Throttle tendons exposed
  addPart(mesh,
    deformVerts(createOrganicLimb((0.02 * s + 0.015 * s) / 2, 0.15 * s, 4), 0.1),
    TENDON_MAT,
    { x: -0.09 * s, y: y * s, z: (z || 0) * s + 0.08 * s },
    { z: -0.1, x: 0.1 }
  );
  addPart(mesh,
    deformVerts(createOrganicLimb((0.015 * s + 0.02 * s) / 2, 0.14 * s, 4), 0.1),
    TENDON_MAT,
    { x: 0.08 * s, y: (y - 0.02) * s, z: (z || 0) * s + 0.07 * s },
    { z: 0.15, x: 0.05 }
  );
  
  // Trachea visible
  addPart(mesh,
    deformVerts(createOrganicLimb((0.035 * s + 0.035 * s) / 2, 0.16 * s, 6), 0.1),
    BONE_MAT,
    { x: 0, y: y * s, z: (z || 0) * s + 0.12 * s },
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

  // Cranium — deformed, slightly lopsided, heavily decayed
  const crGeo = deformVerts(new THREE.SphereGeometry(0.26 * hs, 16, 12), 0.12);
  crGeo.scale(1.0, 1.15, 1.05);
  addPart(mesh, crGeo, skinMat, { y: hY * s, z: hZ * s }, { x: tiltX, z: tiltZ });

  // Exposed skull bone on top/side (larger, jagged)
  const skullGeo = deformVerts(new THREE.SphereGeometry(0.18 * hs, 9, 9), 0.08);
  addPart(mesh, skullGeo, BONE_MAT,
    { x: 0.08 * hs, y: (hY + 0.16) * s, z: (hZ - 0.02) * s },
  );

  // Brow ridge — heavy, menacing
  const browGeo = deformVerts(createEllipsoid(0.4 * hs, 0.07 * hs, 0.12 * hs), 0.15);
  addPart(mesh, browGeo, BONE_MAT,
    { y: (hY + 0.08) * s, z: (hZ + 0.22) * s },
  );

  // Cheekbones protruding through skin (sharper)
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.06 * hs, 0.1 * hs, 5), 0.1),
      BONE_MAT,
      { x: side * 0.16 * hs, y: (hY - 0.05) * s, z: (hZ + 0.18) * s },
      { x: Math.PI / 2, z: side * Math.PI / 4 }
    );
  }

  // Nose cavity — dark hole where the nose rotted away, more jagged
  if (!opts.noNose) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.045 * hs, 6, 6), 0.15),
      CAVITY_MAT,
      { y: (hY - 0.03) * s, z: (hZ + 0.26) * s },
    );
    // Bloody rim around nose
    addPart(mesh,
      deformVerts(new THREE.TorusGeometry(0.05 * hs, 0.015 * hs, 5, 8), 0.2),
      WOUND_MAT,
      { y: (hY - 0.03) * s, z: (hZ + 0.25) * s },
      { x: 0.2 }
    );
  }

  // Lower jaw — hanging open, mangled
  const jawGeo = deformVerts(createEllipsoid(0.24 * hs, 0.08 * hs, 0.16 * hs), 0.15);
  addPart(mesh, jawGeo, skinMat,
    { y: (hY - 0.22) * s, z: (hZ + 0.15) * s },
    { x: jawOpen },
  );

  // Upper teeth
  addTeeth(mesh, hs, hY - 0.1, hZ + 0.25, opts.teethUpper ?? 5, 0.05);

  // Lower teeth (fewer, some missing)
  const lowerCount = opts.teethLower ?? 4;
  for (let i = 0; i < lowerCount; i++) {
    const xOff = (i - (lowerCount - 1) / 2) * 0.05 * hs;
    if (Math.random() > 0.3) {
      addPart(mesh,
        new THREE.ConeGeometry(0.015 * hs, 0.06 * hs, 4),
        TEETH_MAT,
        { x: xOff, y: (hY - 0.18) * s, z: (hZ + 0.18) * s },
        { x: 0.1, z: (Math.random() - 0.5) * 0.2 }
      );
    }
  }

  // One torn ear
  if (!opts.noEars) {
    addPart(mesh,
      deformVerts(createOrganicLimb((0.04 * hs + 0.02 * hs) / 2, 0.08 * hs, 5), 0.25),
      skinMat,
      { x: -0.28 * hs, y: (hY - 0.02) * s, z: hZ * s },
      { z: Math.PI / 4, x: -0.2 }
    );
  }

  // Massive decay patch on cheek exposing muscle
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.09 * hs, 6, 6), 0.15),
    MUSCLE_MAT,
    { x: 0.18 * hs, y: (hY - 0.05) * s, z: (hZ + 0.14) * s }
  );
  addDecayPatch(mesh, hs, 0.18, hY - 0.05, hZ + 0.14);
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

  // Hunched torso (more emaciated)
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.24 * s, 0.55 * s, 10, 12), 0.12);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.88 * s, z: -0.05 * s }, { x: 0.25 });
  mesh.userData.body = body;

  // Collarbone protruding aggressively
  addPart(mesh,
    deformVerts(createOrganicLimb((0.018 * s + 0.018 * s) / 2, 0.45 * s, 6), 0.1),
    BONE_MAT,
    { y: 1.18 * s, z: 0.1 * s },
    { z: Math.PI / 2, x: 0.2 },
  );

  // Exposed ribs (more jagged and irregular)
  for (let i = 0; i < 4; i++) {
    addExposedBone(mesh, s, -0.22, 0.72 + i * 0.1, 0.14, 0, 0.8 - i * 0.05);
  }
  // Exposed muscle and organs under ribs
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.12 * s, 8, 8), 0.15),
    MUSCLE_MAT,
    { x: -0.18 * s, y: 0.85 * s, z: 0.12 * s },
  );

  // Gut wound with spilling intestines
  const intestineGeo = deformVerts(new THREE.TorusKnotGeometry(0.06 * s, 0.025 * s, 20, 6), 0.2);
  addPart(mesh, intestineGeo, MUSCLE_MAT,
    { x: 0.12 * s, y: 0.68 * s, z: 0.25 * s },
    { x: 0.6, y: 0.4 },
  );
  addPart(mesh, deformVerts(new THREE.SphereGeometry(0.08 * s, 6, 6), 0.2), WOUND_MAT,
    { x: 0.08 * s, y: 0.7 * s, z: 0.22 * s }
  );

  // Deep wounds on back and shoulders
  addWound(mesh, s, 0.2, 0.95, -0.25);
  addWound(mesh, s, -0.15, 1.05, 0.15);

  // Decay patches
  addDecayPatch(mesh, s, 0.12, 1.0, -0.15);
  addDecayPatch(mesh, s, -0.18, 0.85, 0.15);

  // Tattered shirt remnants (more tattered)
  addClothStrip(mesh, CLOTH_MAT, s, 0.22, 0.72, 0.18, 0.5);
  addClothStrip(mesh, CLOTH_MAT, s, -0.18, 0.58, -0.12, -0.3);
  addClothStrip(mesh, CLOTH_MAT, s, 0.05, 0.55, 0.24, 0.7);
  addClothStrip(mesh, CLOTH_MAT, s, 0.1, 1.1, 0.15, -0.2);

  // Hanging flesh from torso
  addFleshStrip(mesh, skinMat, s, -0.16, 0.75, 0.22);
  addFleshStrip(mesh, skinMat, s, 0.1, 0.6, 0.26);

  // Left arm — gaunt, reaching forward with twisted hand
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.07 * s, 0.55 * s, 7, 10), 0.1);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.38 * s, y: 1.08 * s, z: 0.2 * s },
    { x: -Math.PI / 2.2, z: 0.15, y: -0.2 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.32, 4, 0.025);
  
  // Exposed bone on left arm
  addPart(leftArm, deformVerts(createOrganicLimb((0.015 * s + 0.015 * s) / 2, 0.2 * s, 4), 0.1), BONE_MAT,
    { x: -0.06 * s, y: 0.1 * s, z: 0 },
    { z: 0.1 }
  );

  // Right arm — torn off below elbow with jagged bone stump and flesh strings
  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.08 * s, 0.35 * s, 7, 8), 0.1);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.38 * s, y: 1.1 * s, z: 0.15 * s },
    { x: -Math.PI / 2.0, z: -0.2 },
  );
  mesh.userData.rightArm = rightArm;
  // Jagged bone stump
  const stumpBone1 = new THREE.Mesh(
    deformVerts(createOrganicLimb((0.02 * s + 0.01 * s) / 2, 0.15 * s, 5), 0.15),
    BONE_MAT,
  );
  stumpBone1.position.set(0.02 * s, -0.25 * s, 0);
  stumpBone1.rotation.z = -0.1;
  rightArm.add(stumpBone1);
  const stumpBone2 = new THREE.Mesh(
    deformVerts(createOrganicLimb((0.015 * s + 0.005 * s) / 2, 0.1 * s, 4), 0.2),
    BONE_MAT,
  );
  stumpBone2.position.set(-0.02 * s, -0.22 * s, 0.02 * s);
  stumpBone2.rotation.x = 0.2;
  rightArm.add(stumpBone2);
  
  const stumpWound = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.06 * s, 7, 7), 0.2),
    WOUND_MAT,
  );
  stumpWound.position.y = -0.18 * s;
  rightArm.add(stumpWound);
  
  // Drip from stump
  addPart(rightArm, new THREE.ConeGeometry(0.01 * s, 0.1 * s, 4), BLOOD_MAT, { y: -0.25 * s, x: -0.02 * s });

  // Legs — uneven, bony, emaciated
  const leftLegGeo = deformVerts(createOrganicLimb((0.09 * s + 0.06 * s) / 2, 0.58 * s, 8), 0.1);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.16 * s, y: 0.3 * s },
    { z: 0.08, x: 0.05 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.3);
  
  // Exposed knee bone
  addPart(leftLeg, deformVerts(new THREE.SphereGeometry(0.04 * s, 5, 5), 0.1), BONE_MAT, { y: -0.05 * s, z: 0.08 * s });

  const rightLegGeo = deformVerts(createOrganicLimb((0.1 * s + 0.07 * s) / 2, 0.54 * s, 8), 0.1);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.18 * s, y: 0.28 * s },
    { x: 0.15, z: -0.1 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.28);

  // Torn pant legs
  addClothStrip(mesh, pantsMat, s, 0.22, 0.15, 0.06, 0.2);
  addClothStrip(mesh, pantsMat, s, -0.18, 0.18, 0.05, -0.1);
}

// ═══════════════════════════════════════════════════════════════
// Fast Zombie (Runner) — feral, recently turned
// ═══════════════════════════════════════════════════════════════

function buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s) {
  // Elongated skull tilted aggressively forward, very bony
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.42,
    headZ: 0.18,
    tiltX: 0.55,
    tiltZ: 0,
    jawOpen: 0.5,
    headScale: 0.85,
    teethUpper: 6,
    teethLower: 5,
  });

  // Hair remnants — thin strips hanging from scalp, matted with blood
  for (let i = 0; i < 4; i++) {
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1a1208,
      roughness: 1.0,
      side: THREE.DoubleSide,
    });
    const hairGeo = deformVerts(new THREE.PlaneGeometry(0.02 * s, 0.15 * s), 0.3);
    addPart(mesh, hairGeo, hairMat,
      { x: (i - 1.5) * 0.05 * s, y: 1.55 * s, z: -0.12 * s },
      { x: -0.5 + Math.random() * 0.4, z: (Math.random() - 0.5) * 0.2 },
    );
  }

  // Short neck — heavily hunched forward
  addNeck(mesh, skinMat, s, 1.22, 0.15);

  // Lean, hunched torso (almost skeletal)
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.18 * s, 0.5 * s, 8, 10), 0.1);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.82 * s, z: -0.1 * s }, { x: 0.45 });
  mesh.userData.body = body;

  // Visible spine bumping aggressively out of back
  for (let i = 0; i < 6; i++) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.03 * s, 0.08 * s, 4), 0.1),
      BONE_MAT,
      { y: (0.6 + i * 0.1) * s, z: (-0.18 - i * 0.02) * s },
      { x: -Math.PI / 2 + 0.2, z: (Math.random() - 0.5) * 0.1 }
    );
  }

  // Fresh bite wound on shoulder spraying blood
  addWound(mesh, s, -0.18, 1.05, 0.05);
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.06 * s, 5, 5), 0.2),
    BLOOD_MAT,
    { x: -0.18 * s, y: 1.0 * s, z: 0.08 * s },
  );

  // Blood smeared all over front
  const bloodSpat1 = deformVerts(new THREE.PlaneGeometry(0.15 * s, 0.25 * s), 0.2);
  const bloodMatPlane = BLOOD_MAT.clone();
  bloodMatPlane.side = THREE.DoubleSide;
  bloodMatPlane.transparent = true;
  bloodMatPlane.opacity = 0.9;
  addPart(mesh, bloodSpat1, bloodMatPlane,
    { x: 0, y: 0.85 * s, z: 0.1 * s },
    { x: 0.45 }
  );

  // Torn athletic shirt remnant (bloody)
  addClothStrip(mesh, CLOTH_MAT, s, 0.15, 0.9, 0.1, 0.3);
  addClothStrip(mesh, CLOTH_MAT, s, -0.12, 0.7, -0.05, -0.2);

  // Long clawed left arm (elongated, mutated)
  const leftArmGeo = deformVerts(createOrganicLimb((0.045 * s + 0.025 * s) / 2, 0.75 * s, 6), 0.08);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.25 * s, y: 0.88 * s, z: 0.3 * s },
    { x: -Math.PI / 2.2, z: 0.25 },
  );
  mesh.userData.leftArm = leftArm;
  // Elongated jagged claws
  for (let i = 0; i < 4; i++) {
    const clawGeo = deformVerts(new THREE.ConeGeometry(0.012 * s, 0.15 * s, 4), 0.1);
    const claw = new THREE.Mesh(clawGeo, BONE_MAT);
    claw.position.set(
      (i - 1.5) * 0.025 * s,
      -0.42 * s,
      0,
    );
    claw.rotation.x = -0.3;
    leftArm.add(claw);
  }

  // Right clawed arm (elongated, mutated)
  const rightArmGeo = deformVerts(createOrganicLimb((0.045 * s + 0.025 * s) / 2, 0.7 * s, 6), 0.08);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.25 * s, y: 0.85 * s, z: 0.3 * s },
    { x: -Math.PI / 2.3, z: -0.25 },
  );
  mesh.userData.rightArm = rightArm;
  for (let i = 0; i < 4; i++) {
    const clawGeo = deformVerts(new THREE.ConeGeometry(0.012 * s, 0.15 * s, 4), 0.1);
    const claw = new THREE.Mesh(clawGeo, BONE_MAT);
    claw.position.set(
      (i - 1.5) * 0.025 * s,
      -0.4 * s,
      0,
    );
    claw.rotation.x = -0.3;
    rightArm.add(claw);
  }

  // Heavy blood on forearms
  for (const arm of [leftArm, rightArm]) {
    const bloodGeo = deformVerts(createOrganicLimb((0.035 * s + 0.045 * s) / 2, 0.25 * s, 5), 0.15);
    const blood = new THREE.Mesh(bloodGeo, BLOOD_MAT);
    blood.position.y = -0.2 * s;
    arm.add(blood);
  }

  // Digitigrade-style muscular legs for running
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.08 * s, 0.45 * s, 6, 8), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.14 * s, y: 0.28 * s },
    { x: 0.3 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, skinMat, s, -0.25);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.08 * s, 0.45 * s, 6, 8), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.14 * s, y: 0.28 * s },
    { x: 0.3 },
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
    tiltX: 0.15,
    tiltZ: 0,
    jawOpen: 0.25,
    headScale: 0.9,
    teethUpper: 6,
    teethLower: 5,
    noNose: true,
  });

  // Heavy brow ridge override — larger, more brutish and deformed
  addPart(mesh,
    deformVerts(createEllipsoid(0.5 * s, 0.15 * s, 0.2 * s), 0.15),
    BONE_MAT,
    { y: 2.05 * s, z: 0.35 * s },
  );

  // Tusks / fangs from lower jaw protruding wildly
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.045 * s, 0.25 * s, 5), 0.1),
      BONE_MAT,
      { x: side * 0.14 * s, y: 1.8 * s, z: 0.38 * s },
      { x: -0.4, z: side * 0.3 },
    );
  }

  // Neck — massive slab of meat
  addPart(mesh,
    deformVerts(createOrganicLimb((0.35 * s + 0.45 * s) / 2, 0.25 * s, 10), 0.1),
    MUSCLE_MAT,
    { y: 1.75 * s, z: 0.15 * s },
  );

  // Massive barrel-shaped torso, asymmetric
  const bodyGeo = deformVerts(new THREE.SphereGeometry(0.75 * s, 16, 16), 0.08);
  bodyGeo.scale(1.2, 1.05, 0.9);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.25 * s });
  mesh.userData.body = body;

  // Exposed muscle masses on torso bursting through skin
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.25 * s, 9, 9), 0.12),
    MUSCLE_MAT,
    { x: 0.55 * s, y: 1.45 * s, z: 0.35 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.22 * s, 8, 8), 0.12),
    MUSCLE_MAT,
    { x: -0.45 * s, y: 1.35 * s, z: 0.4 * s },
  );

  // Bone plates (natural armor protruding through skin)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI - Math.PI / 2;
    addPart(mesh,
      deformVerts(createEllipsoid(0.35 * s, 0.08 * s, 0.1 * s), 0.15),
      BONE_MAT,
      {
        x: Math.sin(angle) * 0.65 * s,
        y: (1.05 + i * 0.1) * s,
        z: Math.cos(angle) * 0.55 * s,
      },
      { y: angle, z: (Math.random() - 0.5) * 0.3 },
    );
  }

  // Massive jagged bone spurs from shoulders
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.15 * s, 0.6 * s, 6), 0.1),
    BONE_MAT,
    { x: -0.65 * s, y: 1.75 * s, z: -0.3 * s },
    { x: -0.8, z: 0.5, y: 0.2 },
  );
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.12 * s, 0.5 * s, 5), 0.1),
    BONE_MAT,
    { x: 0.55 * s, y: 1.7 * s, z: -0.4 * s },
    { x: -1.0, z: -0.3, y: -0.1 },
  );

  // Massive wounds exposing ribs
  addWound(mesh, s, 0.4, 1.3, 0.55);
  addWound(mesh, s, -0.5, 1.1, 0.45);
  addPart(mesh, deformVerts(new THREE.TorusGeometry(0.1 * s, 0.03 * s, 6, 8), 0.2), BONE_MAT, { x: 0.4, y: 1.3, z: 0.6 });

  // Hanging flesh strips
  addFleshStrip(mesh, skinMat, s, 0.3, 1.0, 0.55);
  addFleshStrip(mesh, skinMat, s, -0.45, 0.9, 0.5);
  addFleshStrip(mesh, skinMat, s, 0.0, 1.1, 0.6);

  // Decay patches
  addDecayPatch(mesh, s, -0.3, 1.4, 0.35);
  addDecayPatch(mesh, s, 0.25, 0.85, 0.45);

  // Massive club-like left arm
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.32 * s, 0.95 * s, 10, 10), 0.08);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -1.0 * s, y: 1.15 * s, z: 0.1 * s },
    { x: -0.15, z: 0.15 },
  );
  mesh.userData.leftArm = leftArm;
  // Bone knuckles bursting out
  const knuckle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.18 * s, 7, 7), 0.12),
    BONE_MAT,
  );
  knuckle.position.set(0, -0.6 * s, 0.1 * s);
  leftArm.add(knuckle);
  // Stubby thick fingers
  for (let i = 0; i < 3; i++) {
    const fg = new THREE.Mesh(
      deformVerts(createOrganicLimb((0.05 * s + 0.04 * s) / 2, 0.15 * s, 5), 0.15),
      skinMat,
    );
    fg.position.set((i - 1) * 0.09 * s, -0.7 * s, 0);
    leftArm.add(fg);
  }

  // Oversized mutated right arm with exposed bones
  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.42 * s, 1.15 * s, 10, 10), 0.08);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 1.1 * s, y: 1.0 * s, z: 0.2 * s },
    { x: -0.25, z: -0.1 },
  );
  mesh.userData.rightArm = rightArm;
  // Exposed jagged bone on forearm
  const forearmBone = new THREE.Mesh(
    deformVerts(createOrganicLimb((0.06 * s + 0.04 * s) / 2, 0.45 * s, 6), 0.1),
    BONE_MAT,
  );
  forearmBone.position.set(0.06 * s, -0.4 * s, 0.1 * s);
  forearmBone.rotation.z = -0.3;
  rightArm.add(forearmBone);
  // Massive exposed muscle
  const armMuscle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.18 * s, 8, 8), 0.1),
    MUSCLE_MAT,
  );
  armMuscle.position.set(0.15 * s, 0.1 * s, 0.18 * s);
  rightArm.add(armMuscle);

  // Thick legs (tree trunks)
  const leftLegGeo = deformVerts(createOrganicLimb((0.32 * s + 0.25 * s) / 2, 0.7 * s, 10), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.4 * s, y: 0.35 * s },
    { x: 0.1, z: 0.05 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.38);

  const rightLegGeo = deformVerts(createOrganicLimb((0.35 * s + 0.28 * s) / 2, 0.75 * s, 10), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.42 * s, y: 0.38 * s },
    { z: -0.1, x: 0.05 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.4);
}

// ═══════════════════════════════════════════════════════════════
// Spitter Zombie — acid-producing mutant
// ═══════════════════════════════════════════════════════════════

function buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Bulbous deformed head, heavily swollen and twisted
  buildSkullHead(mesh, skinMat, s, {
    headY: 1.55,
    headZ: 0.1,
    tiltX: 0.3,
    tiltZ: 0.15,
    jawOpen: 0.6,
    headScale: 0.95,
    teethUpper: 4,
    teethLower: 2,
    noNose: true,
  });

  // Swollen cheek/throat — glowing bile-filled sacs stretching the neck
  const gulletMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.85,
    roughness: 0.6,
  });
  const gulletGeo = deformVerts(new THREE.SphereGeometry(0.22 * s, 10, 10), 0.1);
  gulletGeo.scale(1.2, 1.5, 1.1);
  addPart(mesh, gulletGeo, gulletMat, { y: 1.35 * s, z: 0.2 * s }, { x: 0.2 });

  // Additional asymmetrical bile sacs
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.12 * s, 8, 8), 0.1),
    gulletMat,
    { x: 0.18 * s, y: 1.48 * s, z: 0.18 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.1 * s, 8, 8), 0.1),
    gulletMat,
    { x: -0.15 * s, y: 1.3 * s, z: 0.25 * s },
  );

  // Neck — thin, strained, barely holding head
  addNeck(mesh, skinMat, s, 1.25, 0.05);

  // Extremely gaunt, hunched torso
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.2 * s, 0.55 * s, 8, 10), 0.12);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.88 * s }, { x: 0.25 });
  mesh.userData.body = body;

  // Massive glowing bile sacs erupting from back
  const sackMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.8,
    roughness: 0.5,
  });
  const sackPositions = [
    { x: -0.15, y: 1.25, z: -0.18, r: 0.2 },
    { x: 0.18, y: 1.35, z: -0.12, r: 0.25 },
    { x: 0.05, y: 1.15, z: -0.22, r: 0.18 },
    { x: -0.25, y: 1.05, z: -0.1, r: 0.15 },
    { x: 0.12, y: 0.95, z: -0.2, r: 0.14 },
    { x: 0.0, y: 0.85, z: -0.25, r: 0.12 },
  ];
  for (const sp of sackPositions) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(sp.r * s, 10, 10), 0.12),
      sackMat,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
    );
  }

  // Acid corrosion on own body (deep, glowing slightly)
  const corrosionMat = WOUND_MAT.clone();
  corrosionMat.emissive = new THREE.Color(glowColor);
  corrosionMat.emissiveIntensity = 0.2;
  for (let i = 0; i < 4; i++) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.08 * s, 6, 6), 0.15),
      corrosionMat,
      {
        x: (Math.random() - 0.5) * 0.35 * s,
        y: (0.65 + Math.random() * 0.4) * s,
        z: (0.1 + Math.random() * 0.15) * s,
      },
    );
  }

  // Visible spine extremely pronounced
  for (let i = 0; i < 5; i++) {
    addPart(mesh,
      deformVerts(new THREE.SphereGeometry(0.04 * s, 5, 5), 0.12),
      BONE_MAT,
      { y: (0.7 + i * 0.1) * s, z: -0.22 * s },
    );
  }

  // Decay patches
  addDecayPatch(mesh, s, 0.15, 0.9, 0.12);
  addDecayPatch(mesh, s, -0.1, 0.75, -0.1);

  // Left arm — extremely long and spindly
  const leftArmGeo = deformVerts(createOrganicLimb((0.05 * s + 0.03 * s) / 2, 0.75 * s, 6), 0.1);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.32 * s, y: 0.98 * s, z: 0.12 * s },
    { x: -Math.PI / 3, z: 0.15 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.4, 3, 0.03);

  // Right arm — heavily mutated stump continuously dripping acid
  const stubGeo = deformVerts(new THREE.CapsuleGeometry(0.08 * s, 0.2 * s, 6, 6), 0.15);
  const rightArm = addPart(mesh, stubGeo, skinMat,
    { x: 0.32 * s, y: 1.05 * s },
    { x: -0.4 },
  );
  mesh.userData.rightArm = rightArm;
  
  // Bulging bile sac on stump
  const stumpSac = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.09 * s, 8, 8), 0.1),
    sackMat
  );
  stumpSac.position.y = -0.1 * s;
  rightArm.add(stumpSac);

  // Large acid drip
  const dripGeo = deformVerts(new THREE.ConeGeometry(0.04 * s, 0.15 * s, 6), 0.1);
  const drip = new THREE.Mesh(dripGeo, sackMat);
  drip.position.y = -0.2 * s;
  rightArm.add(drip);
  
  // Corroded bone
  const stumpB = new THREE.Mesh(
    deformVerts(createOrganicLimb((0.03 * s + 0.01 * s) / 2, 0.15 * s, 5), 0.15),
    BONE_MAT,
  );
  stumpB.position.set(0.03 * s, -0.15 * s, 0);
  stumpB.rotation.z = -0.4;
  rightArm.add(stumpB);

  // Very thin, unstable legs
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.07 * s, 0.48 * s, 6, 8), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.15 * s, y: 0.28 * s },
    { z: 0.05, x: 0.1 }
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.28);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.07 * s, 0.45 * s, 6, 8), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.15 * s, y: 0.27 * s },
    { x: 0.15, z: -0.1 },
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
    tiltX: 0.1,
    tiltZ: 0,
    jawOpen: 0.25,
    headScale: 0.8,
    teethUpper: 5,
    teethLower: 3,
    noEars: true,
  });

  // Almost no neck — head merging into bloated body, bulging with flesh
  addPart(mesh,
    deformVerts(createOrganicLimb((0.22 * s + 0.4 * s) / 2, 0.15 * s, 10), 0.1),
    skinMat,
    { y: 1.45 * s, z: 0.15 * s },
  );

  // Massively bloated torso (spherical but deformed)
  const bodyGeo = deformVerts(new THREE.SphereGeometry(0.7 * s, 16, 16), 0.08);
  bodyGeo.scale(1.15, 1.3, 1.15);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 0.95 * s });
  mesh.userData.body = body;

  // Stretched skin cracks glowing from immense internal pressure
  const crackMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.65 });
  for (let i = 0; i < 15; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI * 0.6;
    const r = 0.72 * s;
    const cx = r * Math.cos(phi) * Math.cos(theta);
    const cy = 0.95 * s + r * Math.sin(phi) * 0.9;
    const cz = r * Math.cos(phi) * Math.sin(theta);
    
    // Deformed jagged cracks
    addPart(mesh,
      deformVerts(createOrganicLimb((0.015 * s + 0.01 * s) / 2, 0.25 * s, 4), 0.2),
      crackMat,
      { x: cx, y: cy, z: cz },
      { x: Math.random() * Math.PI, y: Math.random() * Math.PI },
    );
  }

  // Visible intestines and organs bulging violently through cracks
  const gutsMat = new THREE.MeshStandardMaterial({
    color: 0x661111,
    emissive: glowColor,
    emissiveIntensity: 0.35,
    roughness: 0.7,
  });
  
  // Gut loops
  addPart(mesh,
    deformVerts(new THREE.TorusKnotGeometry(0.18 * s, 0.05 * s, 16, 6), 0.15),
    gutsMat,
    { x: 0.25 * s, y: 0.85 * s, z: 0.6 * s },
    { x: 0.5, y: 0.3 },
  );
  addPart(mesh,
    deformVerts(new THREE.TorusGeometry(0.15 * s, 0.045 * s, 8, 10), 0.15),
    gutsMat,
    { x: -0.2 * s, y: 0.75 * s, z: 0.55 * s },
    { x: -0.3, y: 0.8 },
  );

  // Large bulging organ on shoulder
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.15 * s, 8, 8), 0.1),
    gutsMat,
    { x: 0.3 * s, y: 1.25 * s, z: 0.45 * s },
  );

  // Pulsating internal glow filling the whole body cavity
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  addPart(mesh,
    new THREE.SphereGeometry(0.55 * s, 12, 12),
    innerGlowMat,
    { y: 0.95 * s },
  );

  // Wounds heavily leaking and seeping
  for (let i = 0; i < 6; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.3) * Math.PI * 0.5;
    const r = 0.71 * s;
    addWound(mesh, s,
      (r * Math.cos(phi) * Math.cos(theta)) / s,
      0.95 + (r * Math.sin(phi) * 0.8) / s,
      (r * Math.cos(phi) * Math.sin(theta)) / s,
    );
  }

  // Hanging flesh from severely stretched skin tears
  addFleshStrip(mesh, skinMat, s, 0.4, 0.75, 0.5);
  addFleshStrip(mesh, skinMat, s, -0.35, 0.65, 0.45);
  addFleshStrip(mesh, skinMat, s, 0.1, 0.5, 0.55);

  // Short, swollen stumpy arms, nearly absorbed by torso
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.12 * s, 0.35 * s, 6, 8), 0.1);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -0.75 * s, y: 1.15 * s, z: 0.15 * s },
    { x: -0.3, z: 0.5 },
  );
  mesh.userData.leftArm = leftArm;
  addFingers(leftArm, skinMat, s, -0.22, 3, 0.025);

  const rightArmGeo = deformVerts(new THREE.CapsuleGeometry(0.12 * s, 0.35 * s, 6, 8), 0.1);
  const rightArm = addPart(mesh, rightArmGeo, skinMat,
    { x: 0.75 * s, y: 1.12 * s, z: 0.15 * s },
    { x: -0.3, z: -0.5 },
  );
  mesh.userData.rightArm = rightArm;
  addFingers(rightArm, skinMat, s, -0.2, 3, 0.025);

  // Thick, compressed legs barely supporting the massive bulk
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.18 * s, 0.3 * s, 8, 8), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.35 * s, y: 0.25 * s },
    { z: 0.2 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.22);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.19 * s, 0.3 * s, 8, 8), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.35 * s, y: 0.25 * s },
    { z: -0.2 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.22);
}

// ═══════════════════════════════════════════════════════════════
// Boss Zombie (Abomination) — towering nightmare
// ═══════════════════════════════════════════════════════════════

function buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
  // Skull-like head with exposed bone, massive
  buildSkullHead(mesh, skinMat, s, {
    headY: 2.7,
    headZ: 0.25,
    tiltX: 0.15,
    tiltZ: 0,
    jawOpen: 0.4,
    headScale: 1.3,
    teethUpper: 7,
    teethLower: 6,
    noNose: true,
  });

  // Shattered skull plate visible on top
  const skullGeo = deformVerts(new THREE.SphereGeometry(0.35 * s, 12, 12), 0.1);
  skullGeo.scale(1.2, 0.6, 1.1);
  addPart(mesh, skullGeo, BONE_MAT, { y: 2.88 * s, z: 0.15 * s });

  // Lower fangs / tusks erupting from jaw
  for (const side of [-1, 1]) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.05 * s, 0.3 * s, 5), 0.1),
      TEETH_MAT,
      { x: side * 0.18 * s, y: 2.3 * s, z: 0.55 * s },
      { x: Math.PI + 0.2, z: side * 0.2 },
    );
  }

  // Horn-like bone growths jutting from back of head/neck
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 0.5, metalness: 0.2 });
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.12 * s, 0.8 * s, 6), 0.1),
    hornMat,
    { x: -0.35 * s, y: 3.1 * s, z: 0.05 * s },
    { x: -0.4, z: 0.5 },
  );
  addPart(mesh,
    deformVerts(new THREE.ConeGeometry(0.1 * s, 0.6 * s, 6), 0.1),
    hornMat,
    { x: 0.35 * s, y: 3.05 * s, z: 0.05 * s },
    { x: -0.4, z: -0.5 },
  );

  // Thick neck — heavily muscled and pulsing
  addPart(mesh,
    deformVerts(createOrganicLimb((0.35 * s + 0.5 * s) / 2, 0.4 * s, 12), 0.12),
    MUSCLE_MAT,
    { y: 2.4 * s, z: 0.15 * s },
  );

  // Massive, deformed torso
  const bodyGeo = deformVerts(new THREE.CapsuleGeometry(0.9 * s, 1.4 * s, 16, 16), 0.08);
  const body = addPart(mesh, bodyGeo, bodyMat, { y: 1.5 * s }, { x: 0.15 });
  mesh.userData.body = body;

  // Exposed ribcage (gaping chest wound, ribs torn outward)
  for (let i = 0; i < 6; i++) {
    const ribAngle = (i - 2.5) * 0.25;
    addPart(mesh,
      deformVerts(createOrganicLimb((0.045 * s + 0.035 * s) / 2, 0.7 * s, 6), 0.1),
      BONE_MAT,
      {
        x: Math.sin(ribAngle) * 0.8 * s,
        y: (1.5 + Math.abs(ribAngle) * 0.25) * s,
        z: 0.8 * s,
      },
      { z: ribAngle * 0.6, x: 0.2 },
    );
  }

  // Exposed beating heart visible through ribcage
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0x880000,
    emissive: glowColor,
    emissiveIntensity: 0.6,
    roughness: 0.7,
  });
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.28 * s, 12, 12), 0.12),
    heartMat,
    { x: -0.15 * s, y: 1.6 * s, z: 0.65 * s },
  );
  
  // Glowing veins pulsing from heart
  const veinMat = new THREE.MeshBasicMaterial({ color: glowColor });
  for(let i=0; i<4; i++) {
    addPart(mesh, deformVerts(createOrganicLimb((0.02 * s + 0.01 * s) / 2, 0.4 * s, 4), 0.2), veinMat,
      { x: -0.15 * s + (Math.random() - 0.5) * 0.3 * s, y: 1.6 * s + (Math.random() - 0.5) * 0.4 * s, z: 0.65 * s },
      { x: Math.random() * Math.PI, z: Math.random() * Math.PI }
    );
  }

  // Exposed muscle masses bulging everywhere
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.3 * s, 10, 10), 0.1),
    MUSCLE_MAT,
    { x: -0.75 * s, y: 1.8 * s, z: 0.2 * s },
  );
  addPart(mesh,
    deformVerts(new THREE.SphereGeometry(0.25 * s, 9, 9), 0.1),
    MUSCLE_MAT,
    { x: 0.65 * s, y: 1.7 * s, z: 0.3 * s },
  );

  // Back spines (massive jagged bone protrusions)
  const spinePositions = [
    { x: -0.45, y: 2.3, z: -0.4, h: 1.0, rx: -0.6, rz: 0.4 },
    { x: 0.45, y: 2.2, z: -0.5, h: 0.8, rx: -0.7, rz: -0.3 },
    { x: 0, y: 2.5, z: -0.6, h: 1.3, rx: -0.9, rz: 0 },
    { x: -0.25, y: 1.9, z: -0.5, h: 0.7, rx: -0.8, rz: 0.2 },
    { x: 0.35, y: 1.8, z: -0.45, h: 0.65, rx: -0.75, rz: -0.15 },
    { x: 0, y: 1.5, z: -0.6, h: 0.8, rx: -1.0, rz: 0 },
  ];
  for (const sp of spinePositions) {
    addPart(mesh,
      deformVerts(new THREE.ConeGeometry(0.12 * s, sp.h * s, 6), 0.1),
      BONE_MAT,
      { x: sp.x * s, y: sp.y * s, z: sp.z * s },
      { x: sp.rx, z: sp.rz },
    );
  }

  // Massive wounds with hanging flesh and dripping blood
  addWound(mesh, s, -0.6, 1.3, 0.55);
  addWound(mesh, s, 0.5, 1.7, 0.65);
  addWound(mesh, s, 0, 1.0, 0.75);
  addFleshStrip(mesh, skinMat, s, -0.5, 1.2, 0.6);
  addFleshStrip(mesh, skinMat, s, 0.3, 0.95, 0.65);
  addFleshStrip(mesh, skinMat, s, 0.0, 1.4, 0.75);

  // Decay patches
  addDecayPatch(mesh, s, -0.45, 1.6, 0.45);
  addDecayPatch(mesh, s, 0.55, 1.2, 0.35);
  addDecayPatch(mesh, s, 0.0, 0.8, 0.55);

  // Left arm — massive mutated club with jagged bone spurs
  const leftArmGeo = deformVerts(new THREE.CapsuleGeometry(0.48 * s, 1.5 * s, 12, 12), 0.08);
  const leftArm = addPart(mesh, leftArmGeo, skinMat,
    { x: -1.25 * s, y: 1.6 * s, z: 0.4 * s },
    { x: -Math.PI / 2.5, z: 0.25 },
  );
  mesh.userData.leftArm = leftArm;
  // Jagged bone spurs on arm
  for (const sp of [
    { y: -0.3, x: -0.25, z: 0.15, h: 0.6, rz: 1.0 },
    { y: -0.6, x: 0.2, z: 0.1, h: 0.45, rz: -0.8 },
    { y: -0.1, x: 0.25, z: -0.1, h: 0.5, rz: -1.2 },
  ]) {
    const spur = new THREE.Mesh(
      deformVerts(new THREE.ConeGeometry(0.1 * s, sp.h * s, 6), 0.1),
      BONE_MAT,
    );
    spur.position.set(sp.x * s, sp.y * s, sp.z * s);
    spur.rotation.z = sp.rz;
    leftArm.add(spur);
  }
  // Massive deformed fist
  const fist = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.25 * s, 10, 10), 0.12),
    skinMat,
  );
  fist.position.y = -0.85 * s;
  leftArm.add(fist);

  // Right arm — horrifying mutated bone scythe fused with flesh
  const rightArmGeo = deformVerts(createOrganicLimb((0.2 * s + 0.35 * s) / 2, 1.7 * s, 12), 0.08);
  const rightArm = addPart(mesh, rightArmGeo, bodyMat,
    { x: 1.15 * s, y: 1.4 * s, z: 0.5 * s },
    { x: -Math.PI / 3, z: -0.15 },
  );
  mesh.userData.rightArm = rightArm;
  
  // Massive bone blade
  const blade = new THREE.Mesh(
    deformVerts(createEllipsoid(0.06 * s, 1.6 * s, 0.35 * s), 0.1),
    BONE_MAT,
  );
  blade.position.set(0, -1.0 * s, 0.15 * s);
  blade.rotation.x = -0.2;
  rightArm.add(blade);
  
  // Smaller secondary blades
  const blade2 = new THREE.Mesh(deformVerts(createEllipsoid(0.04 * s, 0.8 * s, 0.2 * s), 0.1), BONE_MAT);
  blade2.position.set(0, -0.6 * s, -0.1 * s);
  blade2.rotation.x = 0.5;
  rightArm.add(blade2);

  // Exposed muscle and tendons where arm fused with blade
  const fusionMuscle = new THREE.Mesh(
    deformVerts(new THREE.SphereGeometry(0.2 * s, 8, 8), 0.12),
    MUSCLE_MAT,
  );
  fusionMuscle.position.set(0, -0.35 * s, 0.1 * s);
  rightArm.add(fusionMuscle);
  
  // Tendons wrapping the blade
  for(let i=0; i<3; i++) {
    addPart(rightArm, deformVerts(new THREE.TorusGeometry(0.18 * s, 0.03 * s, 6, 12), 0.1), TENDON_MAT, { y: -0.4 * s - i * 0.15 * s }, { x: 1.5, y: Math.random() });
  }

  // Thick uneven legs (like tree trunks)
  const leftLegGeo = deformVerts(new THREE.CapsuleGeometry(0.4 * s, 0.9 * s, 10, 10), 0.08);
  const leftLeg = addPart(mesh, leftLegGeo, pantsMat,
    { x: -0.55 * s, y: 0.45 * s },
    { x: 0.1, z: 0.05 },
  );
  mesh.userData.leftLeg = leftLeg;
  addFoot(leftLeg, pantsMat, s, -0.5);

  const rightLegGeo = deformVerts(new THREE.CapsuleGeometry(0.42 * s, 0.95 * s, 10, 10), 0.08);
  const rightLeg = addPart(mesh, rightLegGeo, pantsMat,
    { x: 0.55 * s, y: 0.48 * s },
    { z: -0.1, x: 0.1 },
  );
  mesh.userData.rightLeg = rightLeg;
  addFoot(rightLeg, pantsMat, s, -0.52);

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

  // Use the loaded GLTF model if available
  if (sharedZombieModel) {
    const modelClone = sharedZombieModel.clone();
    
    // Scale the model
    // The Soldier model is quite large, so we scale it down and apply the type scale
    modelClone.scale.set(0.6 * s, 0.6 * s, 0.6 * s);
    
    // Position it correctly (the Soldier model origin is at feet)
    modelClone.position.y = 0;
    
    // Tint materials based on zombie type
    modelClone.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone material so we can tint it independently per zombie type
        child.material = child.material.clone();
        
        // Apply zombie colors
        const color = new THREE.Color(typeDef.color);
        child.material.color.multiply(color);
        
        // Make it look more dead/decayed
        child.material.roughness = 0.9;
        child.material.metalness = 0.1;
      }
    });

    mesh.add(modelClone);
    mesh.userData.body = modelClone;
    
    // Add glowing eyes to the head (approximate position for Soldier model)
    const eyeGeo = new THREE.SphereGeometry(0.05 * s, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.8 });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1 * s, 1.6 * s, 0.15 * s);
    mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1 * s, 1.6 * s, 0.15 * s);
    mesh.add(rightEye);
    
  } else {
    // Fallback to primitive generation if model hasn't loaded yet
    const bodyMat = new THREE.MeshStandardMaterial({
      color: typeDef.color,
      roughness: 0.95,
      metalness: 0.05,
    });
    injectOrganicShader(bodyMat, "body");
    const skinColor = new THREE.Color(typeDef.secondaryColor || 0x5a7a51).lerp(
      new THREE.Color(0x443333),
      0.35,
    );
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.92,
      metalness: 0.0,
    });
    injectOrganicShader(skinMat, "skin");
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a15,
      roughness: 1.0,
    });
    injectOrganicShader(pantsMat, "body");

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
  }

  // Common setup
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
  
  // Create health bar for boss
  if (type === "boss") {
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
  
  return mesh;
}
