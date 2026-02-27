import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  createAsphaltTexture,
  createAsphaltBumpMap,
  createSidewalkTexture,
} from "./environment/textures.js";
import {
  NEON_COLORS,
  createEnhancedBuilding,
  createEnhancedCar,
  createEnhancedStreetLamp,
  createDumpster,
  createBarricade,
  createTrashCan,
  createFireHydrant,
} from "./environment/decorations.js";

// ============================================================
// Merge helper – batches an array of positioned geometries into
// a single mesh, then disposes the source geometries.
// ============================================================

function addMergedMesh(scene, geos, material, opts = {}) {
  if (geos.length === 0) return null;
  const merged = mergeGeometries(geos, false);
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, material);
  if (opts.castShadow) mesh.castShadow = true;
  if (opts.receiveShadow) mesh.receiveShadow = true;
  scene.add(mesh);
  for (const g of geos) g.dispose();
  return mesh;
}

// ============================================================
// LIGHTING
// ============================================================

export function setupEnhancedLighting(game) {
  const ambient = new THREE.AmbientLight(0x554444, 2.0);
  game.scene.add(ambient);

  const isMobile = game.isMobile;
  const shadowMapSize = isMobile ? 1024 : 2048;

  const moonLight = new THREE.DirectionalLight(0x667799, 2.4);
  moonLight.position.set(10, 60, 15);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = shadowMapSize;
  moonLight.shadow.mapSize.height = shadowMapSize;
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 120;
  moonLight.shadow.camera.left = -65;
  moonLight.shadow.camera.right = 65;
  moonLight.shadow.camera.top = 65;
  moonLight.shadow.camera.bottom = -65;
  moonLight.shadow.bias = -0.001;
  game.scene.add(moonLight);

  const cityGlow = new THREE.DirectionalLight(0x884422, 0.5);
  cityGlow.position.set(-15, 30, -25);
  game.scene.add(cityGlow);

  const rimLight = new THREE.DirectionalLight(0x334444, 0.6);
  rimLight.position.set(-30, 40, 20);
  game.scene.add(rimLight);

  game.playerLight = new THREE.PointLight(0xffccaa, 25, 16);
  game.playerLight.position.set(0, 8, 0);
  game.scene.add(game.playerLight);
}

// ============================================================
// ARENA (ground, markings, sidewalks, decorations)
// ============================================================

export function createEnhancedArena(game) {
  const arenaSize = game.arenaSize;

  // ---- TEXTURED GROUND ----
  const asphaltMap = createAsphaltTexture();
  const bumpMap = createAsphaltBumpMap();

  const groundGeo = new THREE.PlaneGeometry(
    arenaSize * 2, arenaSize * 2, 64, 64,
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
    color: 0x707478,
    roughness: 0.92,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  game.scene.add(ground);

  // ---- PUDDLES (merged into a single mesh) ----
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x1a0808,
    roughness: 0.1,
    metalness: 0.7,
    transparent: true,
    opacity: 0.6,
  });
  const puddleGeos = [];
  for (let i = 0; i < 14; i++) {
    const pw = 1 + Math.random() * 3;
    const pd = 0.8 + Math.random() * 2;
    puddleGeos.push(
      new THREE.PlaneGeometry(pw, pd)
        .rotateX(-Math.PI / 2)
        .translate(
          (Math.random() - 0.5) * arenaSize * 1.4,
          0.03,
          (Math.random() - 0.5) * arenaSize * 1.4,
        ),
    );
  }
  addMergedMesh(game.scene, puddleGeos, puddleMat);

  createMergedStreetMarkings(game);
  createMergedSidewalks(game);
  game.obstacles = [];
  createEnhancedDecorations(game);
  createMergedBoundaryFence(game);
}

// ============================================================
// BOUNDARY FENCE (merged by material)
// ============================================================

function createMergedBoundaryFence(game) {
  const s = game.arenaSize - 1;
  const postHeight = 1.8;
  const postSpacing = 4;

  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x888899, roughness: 0.4, metalness: 0.7,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x992211, transparent: true, opacity: 0.3,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x886655, transparent: true, opacity: 0.2,
  });
  const groundGlowMat = new THREE.MeshBasicMaterial({
    color: 0x661100, transparent: true, opacity: 0.05,
  });

  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, postHeight, 6);
  const tipGeo = new THREE.SphereGeometry(0.1, 6, 6);

  const fenceGeos = [];
  const glowGeos = [];
  const wireGeos = [];
  const groundGlowGeos = [];

  const sides = [
    { x1: -s, z1: -s, x2: s, z2: -s, axis: "x" },
    { x1: s, z1: -s, x2: s, z2: s, axis: "z" },
    { x1: s, z1: s, x2: -s, z2: s, axis: "x" },
    { x1: -s, z1: s, x2: -s, z2: -s, axis: "z" },
  ];

  for (const side of sides) {
    const len = Math.abs(
      side.axis === "x" ? side.x2 - side.x1 : side.z2 - side.z1,
    );
    const posts = Math.floor(len / postSpacing);

    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      const px = side.x1 + (side.x2 - side.x1) * t;
      const pz = side.z1 + (side.z2 - side.z1) * t;

      fenceGeos.push(postGeo.clone().translate(px, postHeight / 2, pz));
      glowGeos.push(tipGeo.clone().translate(px, postHeight, pz));
    }

    const midX = (side.x1 + side.x2) / 2;
    const midZ = (side.z1 + side.z2) / 2;

    for (const h of [0.6, 1.2]) {
      wireGeos.push(
        new THREE.BoxGeometry(
          side.axis === "x" ? len : 0.02,
          0.02,
          side.axis === "z" ? len : 0.02,
        ).translate(midX, h, midZ),
      );
    }

    groundGlowGeos.push(
      new THREE.PlaneGeometry(
        side.axis === "x" ? len : 1.5,
        side.axis === "z" ? len : 1.5,
      )
        .rotateX(-Math.PI / 2)
        .translate(midX, 0.04, midZ),
    );
  }

  addMergedMesh(game.scene, fenceGeos, fenceMat, { castShadow: true });
  addMergedMesh(game.scene, glowGeos, glowMat);
  addMergedMesh(game.scene, wireGeos, wireMat);
  addMergedMesh(game.scene, groundGlowGeos, groundGlowMat);

  postGeo.dispose();
  tipGeo.dispose();
}

// ============================================================
// STREET MARKINGS (merged by material)
// ============================================================

function createMergedStreetMarkings(game) {
  const arenaSize = game.arenaSize;
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xddaa00 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  const fadedWhiteMat = new THREE.MeshBasicMaterial({ color: 0x888888 });

  const yellowGeos = [];
  const whiteGeos = [];
  const fadedWhiteGeos = [];

  const dashLen = 2.5;
  const gapLen = 1.5;
  const span = arenaSize * 0.9;

  // Center line dashes
  for (let z = -span; z < span; z += dashLen + gapLen) {
    yellowGeos.push(
      new THREE.PlaneGeometry(0.15, dashLen)
        .rotateX(-Math.PI / 2)
        .translate(-0.15, 0.025, z),
    );
    yellowGeos.push(
      new THREE.PlaneGeometry(0.15, dashLen)
        .rotateX(-Math.PI / 2)
        .translate(0.15, 0.025, z + gapLen * 0.5),
    );
  }

  // Side lines
  for (const offset of [-10, 10]) {
    fadedWhiteGeos.push(
      new THREE.PlaneGeometry(0.12, arenaSize * 1.8)
        .rotateX(-Math.PI / 2)
        .translate(offset, 0.025, 0),
    );
  }

  // Crosswalks
  for (const z of [-25, 25]) {
    for (let x = -6; x <= 6; x += 1.8) {
      whiteGeos.push(
        new THREE.PlaneGeometry(0.7, 3.5)
          .rotateX(-Math.PI / 2)
          .translate(x, 0.025, z),
      );
    }
  }

  // Arrows
  for (const [x, z] of [[-5, 10], [5, -10]]) {
    fadedWhiteGeos.push(
      new THREE.PlaneGeometry(0.6, 2.2)
        .rotateX(-Math.PI / 2)
        .translate(x, 0.025, z),
    );
    fadedWhiteGeos.push(
      new THREE.PlaneGeometry(1.4, 0.5)
        .rotateX(-Math.PI / 2)
        .translate(x, 0.025, z - 1.35),
    );
  }

  addMergedMesh(game.scene, yellowGeos, yellowMat);
  addMergedMesh(game.scene, whiteGeos, whiteMat);
  addMergedMesh(game.scene, fadedWhiteGeos, fadedWhiteMat);
}

// ============================================================
// SIDEWALKS
// ============================================================

function createMergedSidewalks(game) {
  const arenaSize = game.arenaSize;
  const swMap = createSidewalkTexture();

  const swMat = new THREE.MeshStandardMaterial({
    map: swMap, color: 0x666668, roughness: 0.85, metalness: 0.02,
  });
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x555558, roughness: 0.7,
  });

  const sw = 5;
  const ch = 0.25;

  const defs = [
    { x: -arenaSize + sw / 2, z: 0, w: sw, l: arenaSize * 2,
      cx: -arenaSize + sw, dir: "z" },
    { x: arenaSize - sw / 2, z: 0, w: sw, l: arenaSize * 2,
      cx: arenaSize - sw, dir: "z" },
    { x: 0, z: -arenaSize + sw / 2, w: arenaSize * 2 - sw * 2, l: sw,
      cz: -arenaSize + sw, dir: "x" },
    { x: 0, z: arenaSize - sw / 2, w: arenaSize * 2 - sw * 2, l: sw,
      cz: arenaSize - sw, dir: "x" },
  ];

  for (const d of defs) {
    const surface = new THREE.Mesh(
      new THREE.BoxGeometry(d.w, 0.2, d.l), swMat,
    );
    surface.position.set(d.x, 0.1, d.z);
    surface.receiveShadow = true;
    game.scene.add(surface);

    if (d.dir === "z") {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, ch, d.l), curbMat,
      );
      curb.position.set(d.cx, ch / 2, d.z);
      curb.castShadow = true;
      curb.receiveShadow = true;
      game.scene.add(curb);
    } else {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(d.w, ch, 0.3), curbMat,
      );
      curb.position.set(d.x, ch / 2, d.cz);
      curb.castShadow = true;
      curb.receiveShadow = true;
      game.scene.add(curb);
    }
  }
}

// ============================================================
// DECORATIONS (orchestrator – delegates to imported functions)
// ============================================================

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

  for (let i = 0; i < 18; i++) {
    const bp = buildingPositions[i % buildingPositions.length];
    const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    const ox = (Math.random() - 0.5) * 10;
    const oz = (Math.random() - 0.5) * 10;
    const gx = Math.max(
      -arenaSize + 6, Math.min(arenaSize - 6, bp.x + ox),
    );
    const gz = Math.max(
      -arenaSize + 6, Math.min(arenaSize - 6, bp.z + oz),
    );

    const poolR = 2 + Math.random() * 2.5;
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(poolR, 16),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.07 + Math.random() * 0.05,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(gx, 0.04, gz);
    game.scene.add(pool);

    const core = new THREE.Mesh(
      new THREE.CircleGeometry(poolR * 0.4, 12),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.04,
      }),
    );
    core.rotation.x = -Math.PI / 2;
    core.position.set(gx, 0.045, gz);
    game.scene.add(core);
  }

  for (let i = 0; i < 5; i++) {
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

  for (let i = 0; i < 6; i++) {
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

  for (let i = 0; i < 6; i++) {
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

export function updateAmbientParticles() {}
