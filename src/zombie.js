import * as THREE from "three";

// Enemy type definitions with distinctive colors
const ENEMY_TYPES = {
  normal: {
    name: "Zombie",
    color: 0x4a6741, // Muted green
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
    color: 0x8b7355, // Light brown/tan - lean and fast
    secondaryColor: 0x6b5344,
    eyeColor: 0xffff00, // Yellow eyes
    scale: 0.75,
    speedMult: 2.2,
    healthMult: 0.4,
    damageMult: 0.7,
    xpMult: 1.5,
  },
  tank: {
    name: "Brute",
    color: 0x5c4a6d, // Purple-ish - armored
    secondaryColor: 0x3d3248,
    eyeColor: 0xff00ff, // Magenta eyes
    scale: 1.6,
    speedMult: 0.45,
    healthMult: 5,
    damageMult: 2.5,
    xpMult: 4,
  },
  spitter: {
    name: "Spitter",
    color: 0x2d5a4a, // Teal/dark cyan - toxic
    secondaryColor: 0x1d3a2a,
    eyeColor: 0x00ff88, // Bright green eyes
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
    color: 0x8b4513, // Saddle brown - bloated
    secondaryColor: 0x5c2d0e,
    eyeColor: 0xff6600, // Orange eyes
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
    color: 0x1a0a2e, // Deep purple/black
    secondaryColor: 0x0d0519,
    eyeColor: 0xff0088, // Hot pink
    glowColor: 0x8800ff,
    scale: 3.5,
    speedMult: 0.35,
    healthMult: 20,
    damageMult: 3,
    xpMult: 20,
    isBoss: true,
  },
};

export class ZombieManager {
  constructor(game) {
    this.game = game;

    // Active zombies
    this.zombies = [];

    // Projectiles from spitter zombies
    this.enemyProjectiles = [];

    // Wave settings
    this.zombiesRemaining = 0;
    this.zombiesSpawned = 0;
    this.waveInProgress = false;

    // Boss tracking
    this.bossActive = false;
    this.bossSpawnedThisWave = false;

    // Zombie mesh (simple for now, could use MD2 later)
    this.zombieGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    this.zombieMaterial = new THREE.MeshStandardMaterial({
      color: 0x335533,
      roughness: 0.8,
    });

    // Object pool for performance
    this.zombiePool = [];
  }

  reset() {
    // Remove all zombies
    this.zombies.forEach((zombie) => {
      this.game.scene.remove(zombie.mesh);
    });
    this.zombies = [];

    // Remove enemy projectiles
    this.enemyProjectiles.forEach((proj) => {
      this.game.scene.remove(proj.mesh);
    });
    this.enemyProjectiles = [];

    this.zombiesRemaining = 0;
    this.zombiesSpawned = 0;
    this.waveInProgress = false;
    this.bossActive = false;
    this.bossSpawnedThisWave = false;
  }

  spawnWave(count, speed, health) {
    this.zombiesRemaining = count;
    this.zombiesSpawned = 0;
    this.waveInProgress = true;
    this.bossSpawnedThisWave = false;

    // Spawn zombies over time - type is automatically determined by spawnZombie
    const spawnInterval = setInterval(() => {
      if (this.zombiesSpawned >= count || !this.game.isPlaying) {
        clearInterval(spawnInterval);
        return;
      }

      // spawnZombie will auto-select enemy type based on current wave
      this.spawnZombie(speed, health);
      this.zombiesSpawned++;
    }, 500); // Spawn one every 0.5 seconds
  }

  spawnZombie(speed, health, type = null) {
    // Get spawn position at arena edge
    const spawnPos = this.getSpawnPosition();

    // If type not specified, determine based on current wave
    if (type === null) {
      type = this.getRandomEnemyType();
    }

    // Get enemy type definition
    const typeDef = ENEMY_TYPES[type] || ENEMY_TYPES.normal;

    // Create zombie mesh (always create new for different types)
    const mesh = this.createZombieMesh(type, typeDef);
    mesh.position.copy(spawnPos);

    // Calculate stats based on type
    const finalHealth = health * typeDef.healthMult;
    const finalSpeed = speed * typeDef.speedMult;
    const finalDamage = 10 * typeDef.damageMult;

    // Create zombie object
    const zombie = {
      mesh,
      type,
      typeDef,
      health: finalHealth,
      maxHealth: finalHealth,
      speed: finalSpeed,
      damage: finalDamage,
      attackCooldown: 0,
      attackRate: type === "boss" ? 0.5 : 1, // Boss attacks faster
      state: "chase",
      targetPosition: new THREE.Vector3(),
      // Ranged attack properties
      ranged: typeDef.ranged || false,
      attackRange: typeDef.attackRange || 1.5,
      projectileSpeed: typeDef.projectileSpeed || 5,
      // Special properties
      isBoss: typeDef.isBoss || false,
      explodeOnDeath: typeDef.explodeOnDeath || false,
      explosionRadius: typeDef.explosionRadius || 0,
      explosionDamage: typeDef.explosionDamage || 0,
    };

    if (zombie.isBoss) {
      this.bossActive = true;
    }

    this.zombies.push(zombie);
    this.game.scene.add(mesh);
  }

  getRandomEnemyType() {
    // Get current wave from game (wave 1 = first minute, etc.)
    const waveNumber = this.game.wave || 1;
    const roll = Math.random();

    // Boss check: spawn boss every 3 waves starting at wave 3, but only once per wave
    if (
      waveNumber >= 3 &&
      waveNumber % 3 === 0 &&
      !this.bossActive &&
      !this.bossSpawnedThisWave &&
      roll < 0.05
    ) {
      this.bossSpawnedThisWave = true;
      return "boss";
    }

    // Reset boss flag when wave changes
    const currentWaveCheck = Math.floor(this.game.gameTime / 60) + 1;
    if (currentWaveCheck !== this._lastWaveCheck) {
      this._lastWaveCheck = currentWaveCheck;
      this.bossSpawnedThisWave = false;
    }

    // Check in REVERSE order (highest wave first) to ensure all types can spawn
    // Wave 5+: All enemy types available
    if (waveNumber >= 5) {
      if (roll < 0.08) return "exploder";
      if (roll < 0.16) return "spitter";
      if (roll < 0.28) return "tank";
      if (roll < 0.5) return "fast";
      return "normal";
    }

    // Wave 4: Spitters join
    if (waveNumber >= 4) {
      if (roll < 0.1) return "spitter";
      if (roll < 0.22) return "tank";
      if (roll < 0.45) return "fast";
      return "normal";
    }

    // Wave 3: Tanks join
    if (waveNumber >= 3) {
      if (roll < 0.12) return "tank";
      if (roll < 0.4) return "fast";
      return "normal";
    }

    // Wave 2: Fast zombies join
    if (waveNumber >= 2) {
      if (roll < 0.3) return "fast";
      return "normal";
    }

    // Wave 1: Only normal zombies
    return "normal";
  }

  // --- Mesh building helpers (Organic Zombie Style) ---

  _addPart(group, geometry, material, pos, rot) {
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

  _addEyes(group, type, s, eyeColor) {
    // Sunken, glowing eyes
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

    this._addPart(group, eyeGeo, eyeMat, {
      x: -ep.spread * s,
      y: ep.y * s,
      z: ep.z * s,
    });
    this._addPart(group, eyeGeo, eyeMat, {
      x: ep.spread * s,
      y: ep.y * s,
      z: ep.z * s,
    });

    if (type === "boss") {
      this._addPart(group, eyeGeo, eyeMat, { x: 0, y: 2.8 * s, z: 0.48 * s });
    }
  }

  createZombieMesh(type = "normal", typeDef = ENEMY_TYPES.normal) {
    const mesh = new THREE.Group();
    const s = typeDef.scale;
    const eyeColor = typeDef.eyeColor || 0xff0000;
    const glowColor = typeDef.glowColor || eyeColor;

    // Shared organic materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: typeDef.color,
      roughness: 0.9,
      metalness: 0.1,
    });
    // Decaying skin color
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
      fast: () =>
        this._buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s, eyeColor),
      tank: () =>
        this._buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
      spitter: () =>
        this._buildSpitterZombie(
          mesh,
          bodyMat,
          skinMat,
          pantsMat,
          s,
          glowColor,
        ),
      exploder: () =>
        this._buildExploderZombie(
          mesh,
          bodyMat,
          skinMat,
          pantsMat,
          s,
          glowColor,
        ),
      boss: () =>
        this._buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor),
    };

    const builder = builders[type];
    if (builder) {
      builder();
    } else {
      this._buildNormalZombie(mesh, bodyMat, skinMat, pantsMat, s);
    }

    this._addEyes(mesh, type, s, eyeColor);

    // Make sure we have a "body" for hit flashes
    if (!mesh.userData.body && mesh.children.length > 0) {
      mesh.userData.body = mesh.children[0];
    }

    mesh.userData.type = type;
    mesh.userData.animPhase = Math.random() * Math.PI * 2;
    // Add random limp offsets for organic feel
    mesh.userData.limpOffsetL = (Math.random() - 0.5) * 0.4;
    mesh.userData.limpOffsetR = (Math.random() - 0.5) * 0.4;
    return mesh;
  }

  _buildNormalZombie(mesh, bodyMat, skinMat, pantsMat, s) {
    // Head - slightly tilted and round
    const head = this._addPart(
      mesh,
      new THREE.SphereGeometry(0.3 * s, 12, 12),
      skinMat,
      { y: 1.55 * s },
      { z: 0.15, x: 0.1 },
    );

    // Body - curved spine
    const bodyGeo = new THREE.CapsuleGeometry(0.3 * s, 0.6 * s, 8, 12);
    const body = this._addPart(
      mesh,
      bodyGeo,
      bodyMat,
      { y: 0.9 * s, z: -0.05 * s },
      { x: 0.15 },
    );
    mesh.userData.body = body;

    // Arms - asymmetrical, raised forward like classic zombies
    const armGeo = new THREE.CapsuleGeometry(0.12 * s, 0.5 * s, 6, 8);
    // Left arm hanging slightly lower
    mesh.userData.leftArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: -0.4 * s, y: 1.1 * s, z: 0.2 * s },
      { x: -Math.PI / 2.2, z: 0.1 },
    );
    // Right arm reaching out
    mesh.userData.rightArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: 0.4 * s, y: 1.15 * s, z: 0.2 * s },
      { x: -Math.PI / 1.8, z: -0.1 },
    );

    // Legs - thin and slightly bent
    const legGeo = new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.6 * s, 8);
    mesh.userData.leftLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: -0.18 * s,
      y: 0.3 * s,
    });
    mesh.userData.rightLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: 0.18 * s,
      y: 0.3 * s,
    });
  }

  _buildFastZombie(mesh, bodyMat, skinMat, pantsMat, s, eyeColor) {
    // Head - elongated, feral
    this._addPart(
      mesh,
      new THREE.CapsuleGeometry(0.2 * s, 0.3 * s, 8, 8),
      skinMat,
      { y: 1.45 * s, z: 0.15 * s },
      { x: 0.4 },
    );

    // Body - hunched forward
    const body = this._addPart(
      mesh,
      new THREE.CapsuleGeometry(0.25 * s, 0.5 * s, 8, 10),
      bodyMat,
      { y: 0.85 * s, z: -0.1 * s },
      { x: 0.4 },
    );
    mesh.userData.body = body;

    // Arms - long and scrawny
    const armGeo = new THREE.CylinderGeometry(0.08 * s, 0.05 * s, 0.7 * s, 6);
    mesh.userData.leftArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: -0.32 * s, y: 0.9 * s, z: 0.3 * s },
      { x: -Math.PI / 2.5, z: 0.2 },
    );
    mesh.userData.rightArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: 0.32 * s, y: 0.9 * s, z: 0.3 * s },
      { x: -Math.PI / 2.5, z: -0.2 },
    );

    // Legs - crouched
    const legGeo = new THREE.CapsuleGeometry(0.1 * s, 0.5 * s, 6, 8);
    mesh.userData.leftLeg = this._addPart(
      mesh,
      legGeo,
      pantsMat,
      { x: -0.15 * s, y: 0.3 * s },
      { x: 0.2 },
    );
    mesh.userData.rightLeg = this._addPart(
      mesh,
      legGeo,
      pantsMat,
      { x: 0.15 * s, y: 0.3 * s },
      { x: 0.2 },
    );
  }

  _buildTankZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
    // Head - tiny compared to body, no neck
    this._addPart(mesh, new THREE.SphereGeometry(0.3 * s, 12, 12), skinMat, {
      y: 1.95 * s,
      z: 0.2 * s,
    });

    // Body - massive, swollen, muscular but deformed
    const bodyGeo = new THREE.SphereGeometry(0.7 * s, 16, 16);
    bodyGeo.scale(1.2, 1.0, 0.8);
    const body = this._addPart(mesh, bodyGeo, bodyMat, { y: 1.2 * s });
    mesh.userData.body = body;

    // Bone spikes protruding from back
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xddddcc,
      roughness: 0.7,
    });
    this._addPart(
      mesh,
      new THREE.ConeGeometry(0.1 * s, 0.4 * s, 6),
      boneMat,
      { x: -0.4 * s, y: 1.6 * s, z: -0.5 * s },
      { x: -1, z: 0.3 },
    );
    this._addPart(
      mesh,
      new THREE.ConeGeometry(0.12 * s, 0.5 * s, 6),
      boneMat,
      { x: 0.3 * s, y: 1.5 * s, z: -0.6 * s },
      { x: -1.2, z: -0.2 },
    );

    // Arms - huge, dragging on ground
    const armGeo = new THREE.CapsuleGeometry(0.25 * s, 0.9 * s, 10, 10);
    mesh.userData.leftArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: -0.9 * s, y: 1.1 * s, z: 0.1 * s },
      { x: -0.2, z: 0.1 },
    );
    // Right arm is mutated and even larger
    const bigArmGeo = new THREE.CapsuleGeometry(0.35 * s, 1.1 * s, 10, 10);
    mesh.userData.rightArm = this._addPart(
      mesh,
      bigArmGeo,
      skinMat,
      { x: 1.0 * s, y: 1.0 * s, z: 0.2 * s },
      { x: -0.3, z: -0.1 },
    );

    // Legs - thick
    const legGeo = new THREE.CylinderGeometry(0.3 * s, 0.2 * s, 0.7 * s, 10);
    mesh.userData.leftLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: -0.35 * s,
      y: 0.35 * s,
    });
    mesh.userData.rightLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: 0.35 * s,
      y: 0.35 * s,
    });
  }

  _buildSpitterZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
    // Head - jaw unhinged (distorted sphere)
    const headGeo = new THREE.SphereGeometry(0.28 * s, 10, 10);
    headGeo.scale(1, 1.3, 1);
    this._addPart(
      mesh,
      headGeo,
      skinMat,
      { y: 1.55 * s, z: 0.1 * s },
      { x: 0.2 },
    );

    // Body - thin
    const body = this._addPart(
      mesh,
      new THREE.CapsuleGeometry(0.25 * s, 0.6 * s, 8, 8),
      bodyMat,
      { y: 0.9 * s },
    );
    mesh.userData.body = body;

    // Toxic sacks on neck/back
    const sackMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    this._addPart(mesh, new THREE.SphereGeometry(0.2 * s, 12, 12), sackMat, {
      x: -0.15 * s,
      y: 1.25 * s,
      z: -0.2 * s,
    });
    this._addPart(mesh, new THREE.SphereGeometry(0.25 * s, 12, 12), sackMat, {
      x: 0.15 * s,
      y: 1.35 * s,
      z: -0.15 * s,
    });
    this._addPart(mesh, new THREE.SphereGeometry(0.15 * s, 12, 12), sackMat, {
      x: 0,
      y: 1.15 * s,
      z: -0.25 * s,
    });

    const armGeo = new THREE.CylinderGeometry(0.08 * s, 0.05 * s, 0.6 * s, 6);
    mesh.userData.leftArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: -0.35 * s, y: 1.0 * s, z: 0.1 * s },
      { x: -Math.PI / 3 },
    );
    // Missing lower right arm
    const stubGeo = new THREE.CapsuleGeometry(0.08 * s, 0.2 * s, 6, 6);
    mesh.userData.rightArm = this._addPart(
      mesh,
      stubGeo,
      skinMat,
      { x: 0.35 * s, y: 1.1 * s, z: 0.0 * s },
      { x: -0.5 },
    );

    const legGeo = new THREE.CapsuleGeometry(0.12 * s, 0.5 * s, 6, 8);
    mesh.userData.leftLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: -0.15 * s,
      y: 0.3 * s,
    });
    mesh.userData.rightLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: 0.15 * s,
      y: 0.3 * s,
    });
  }

  _buildExploderZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
    // Head - sunken into bloated body
    this._addPart(mesh, new THREE.SphereGeometry(0.25 * s, 10, 10), skinMat, {
      y: 1.55 * s,
      z: 0.2 * s,
    });

    // Body - grotesquely bloated
    const bodyGeo = new THREE.SphereGeometry(0.65 * s, 16, 16);
    bodyGeo.scale(1.1, 1.2, 1.1);
    const body = this._addPart(mesh, bodyGeo, bodyMat, { y: 0.9 * s });
    mesh.userData.body = body;

    // Pulsing glowing veins/cracks
    const glowMat = new THREE.MeshBasicMaterial({ color: glowColor });
    for (let i = 0; i < 6; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const r = 0.65 * s * 1.05;
      const gx = r * Math.cos(phi) * Math.cos(theta);
      const gy = 0.9 * s + r * Math.sin(phi);
      const gz = r * Math.cos(phi) * Math.sin(theta);

      this._addPart(
        mesh,
        new THREE.CapsuleGeometry(0.05 * s, 0.2 * s, 4, 4),
        glowMat,
        { x: gx, y: gy, z: gz },
        { x: Math.random() * 3, y: Math.random() * 3 },
      );
    }

    // Arms - small compared to body
    const armGeo = new THREE.CapsuleGeometry(0.12 * s, 0.5 * s, 6, 8);
    mesh.userData.leftArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: -0.75 * s, y: 1.1 * s, z: 0.1 * s },
      { x: -0.3, z: 0.4 },
    );
    mesh.userData.rightArm = this._addPart(
      mesh,
      armGeo,
      skinMat,
      { x: 0.75 * s, y: 1.1 * s, z: 0.1 * s },
      { x: -0.3, z: -0.4 },
    );

    // Legs - spread wide to support weight
    const legGeo = new THREE.CapsuleGeometry(0.18 * s, 0.4 * s, 8, 8);
    mesh.userData.leftLeg = this._addPart(
      mesh,
      legGeo,
      pantsMat,
      { x: -0.35 * s, y: 0.25 * s },
      { z: 0.2 },
    );
    mesh.userData.rightLeg = this._addPart(
      mesh,
      legGeo,
      pantsMat,
      { x: 0.35 * s, y: 0.25 * s },
      { z: -0.2 },
    );
  }

  _buildBossZombie(mesh, bodyMat, skinMat, pantsMat, s, glowColor) {
    // Head - multiple merged heads or deformed mass
    const headGeo = new THREE.SphereGeometry(0.4 * s, 16, 16);
    headGeo.scale(1.2, 0.9, 1.1);
    this._addPart(mesh, headGeo, skinMat, { y: 2.6 * s, z: 0.2 * s });
    this._addPart(
      mesh,
      new THREE.SphereGeometry(0.25 * s, 10, 10),
      skinMat,
      { x: 0.3 * s, y: 2.4 * s, z: 0.3 * s },
      { y: 0.5 },
    );

    // Body - towering nightmare of flesh
    const bodyGeo = new THREE.CapsuleGeometry(0.7 * s, 1.2 * s, 16, 16);
    const body = this._addPart(mesh, bodyGeo, bodyMat, { y: 1.4 * s });
    mesh.userData.body = body;

    // Dark spikes/tentacles
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x110a1a,
      roughness: 0.5,
    });
    this._addPart(
      mesh,
      new THREE.ConeGeometry(0.15 * s, 0.8 * s, 8),
      spikeMat,
      { x: -0.5 * s, y: 2.2 * s, z: -0.4 * s },
      { x: -0.5, z: 0.4 },
    );
    this._addPart(
      mesh,
      new THREE.ConeGeometry(0.1 * s, 0.6 * s, 8),
      spikeMat,
      { x: 0.5 * s, y: 2.1 * s, z: -0.5 * s },
      { x: -0.6, z: -0.3 },
    );
    this._addPart(
      mesh,
      new THREE.ConeGeometry(0.12 * s, 0.7 * s, 8),
      spikeMat,
      { x: 0, y: 2.4 * s, z: -0.6 * s },
      { x: -0.8 },
    );

    // Arms - asymmetrical
    const leftArmGeo = new THREE.CapsuleGeometry(0.25 * s, 1.2 * s, 10, 10);
    mesh.userData.leftArm = this._addPart(
      mesh,
      leftArmGeo,
      skinMat,
      { x: -1.0 * s, y: 1.7 * s, z: 0.3 * s },
      { x: -Math.PI / 2.5, z: 0.2 },
    );

    // Right arm is a massive club/blade of flesh
    const rightArmGeo = new THREE.CylinderGeometry(
      0.15 * s,
      0.4 * s,
      1.5 * s,
      12,
    );
    mesh.userData.rightArm = this._addPart(
      mesh,
      rightArmGeo,
      bodyMat,
      { x: 1.0 * s, y: 1.5 * s, z: 0.4 * s },
      { x: -Math.PI / 3, z: -0.1 },
    );

    const legGeo = new THREE.CapsuleGeometry(0.3 * s, 0.8 * s, 10, 10);
    mesh.userData.leftLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: -0.4 * s,
      y: 0.4 * s,
    });
    mesh.userData.rightLeg = this._addPart(mesh, legGeo, pantsMat, {
      x: 0.4 * s,
      y: 0.4 * s,
    });

    // Menacing aura
    const auraMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const aura = this._addPart(
      mesh,
      new THREE.SphereGeometry(2.2 * s, 24, 24),
      auraMat,
      { y: 1.5 * s },
    );
    mesh.userData.aura = aura;

    const hbBg = this._addPart(
      mesh,
      new THREE.PlaneGeometry(2.5 * s, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x333333 }),
      { y: 4.0 * s },
      { x: -Math.PI / 4 },
    );
    const hb = this._addPart(
      mesh,
      new THREE.PlaneGeometry(2.5 * s, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      { y: 4.0 * s, z: 0.01 },
      { x: -Math.PI / 4 },
    );
    mesh.userData.healthBar = hb;
    mesh.userData.healthBarWidth = 2.5 * s;
  }

  getSpawnPosition() {
    const bounds = this.game.arenaSize - 2;
    const side = Math.floor(Math.random() * 4);

    let x, z;
    switch (side) {
      case 0: // Top
        x = (Math.random() - 0.5) * bounds * 2;
        z = -bounds;
        break;
      case 1: // Bottom
        x = (Math.random() - 0.5) * bounds * 2;
        z = bounds;
        break;
      case 2: // Left
        x = -bounds;
        z = (Math.random() - 0.5) * bounds * 2;
        break;
      case 3: // Right
        x = bounds;
        z = (Math.random() - 0.5) * bounds * 2;
        break;
    }

    return new THREE.Vector3(x, 0, z);
  }

  update(delta) {
    const playerPos = this.game.player.getPosition();

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];

      // Update attack cooldown
      if (zombie.attackCooldown > 0) {
        zombie.attackCooldown -= delta;
      }

      // Calculate direction to player
      const direction = new THREE.Vector3();
      direction.subVectors(playerPos, zombie.mesh.position);
      direction.y = 0;
      const distance = direction.length();
      direction.normalize();

      // Face player
      zombie.mesh.rotation.y = Math.atan2(direction.x, direction.z);

      // Update boss health bar
      if (zombie.isBoss && zombie.mesh.userData.healthBar) {
        const healthPercent = zombie.health / zombie.maxHealth;
        zombie.mesh.userData.healthBar.scale.x = healthPercent;
        zombie.mesh.userData.healthBar.position.x =
          (-zombie.mesh.userData.healthBarWidth * (1 - healthPercent)) / 2;

        // Pulse aura
        if (zombie.mesh.userData.aura) {
          const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.2;
          zombie.mesh.userData.aura.scale.setScalar(pulse);
        }
      }

      // Ranged enemies (spitters)
      if (zombie.ranged && distance < zombie.attackRange && distance > 2) {
        zombie.state = "ranged";
        if (zombie.attackCooldown <= 0) {
          this.fireProjectile(zombie, direction);
          zombie.attackCooldown = zombie.attackRate * 2; // Slower attack rate for ranged
        }
        // Stay at range, don't get too close
        if (distance > zombie.attackRange * 0.6) {
          const moveDir = this.avoidObstacles(zombie, direction);
          zombie.mesh.position.x += moveDir.x * zombie.speed * delta;
          zombie.mesh.position.z += moveDir.z * zombie.speed * delta;
        }
      } else if (distance < 1.5 * (zombie.typeDef?.scale || 1)) {
        // Melee attack range (scaled by enemy size)
        zombie.state = "attack";
        this.attackPlayer(zombie);
      } else {
        // Chase player
        zombie.state = "chase";

        // Simple obstacle avoidance
        const moveDir = this.avoidObstacles(zombie, direction);

        // Move towards player
        zombie.mesh.position.x += moveDir.x * zombie.speed * delta;
        zombie.mesh.position.z += moveDir.z * zombie.speed * delta;
      }

      // Organic zombie animation: Limping and swinging
      const time = Date.now() * 0.01;
      const speedAnim = zombie.speed * 0.5;

      if (zombie.state === "chase" || zombie.state === "ranged") {
        // Limping gait - asymmetric leg movement
        const legPhase = time * speedAnim;
        if (zombie.mesh.userData.leftLeg)
          zombie.mesh.userData.leftLeg.rotation.x = Math.sin(legPhase) * 0.4;
        if (zombie.mesh.userData.rightLeg)
          zombie.mesh.userData.rightLeg.rotation.x =
            -Math.sin(legPhase + 0.5) * 0.4; // slight offset for limp

        // Arms reach out and sway
        if (zombie.mesh.userData.leftArm)
          zombie.mesh.userData.leftArm.rotation.x =
            -Math.PI / 2.2 + Math.sin(legPhase) * 0.15;
        if (zombie.mesh.userData.rightArm)
          zombie.mesh.userData.rightArm.rotation.x =
            -Math.PI / 1.8 - Math.sin(legPhase) * 0.15;
      } else if (zombie.state === "attack") {
        // Violent, irregular attack swing
        if (zombie.mesh.userData.leftArm)
          zombie.mesh.userData.leftArm.rotation.x =
            -Math.PI / 2 - Math.sin(time * 3) * 0.6;
        if (zombie.mesh.userData.rightArm)
          zombie.mesh.userData.rightArm.rotation.x =
            -Math.PI / 2 - Math.cos(time * 2.5) * 0.6;
      }

      // Organic wobble: side-to-side and slight pitch
      const wobbleAmount = zombie.isBoss ? 0.04 : 0.12;
      zombie.mesh.rotation.z =
        Math.sin(time * speedAnim * 0.4 + zombie.mesh.userData.animPhase) *
        wobbleAmount;
      zombie.mesh.rotation.x =
        Math.cos(time * speedAnim * 0.3 + zombie.mesh.userData.limpOffsetL) *
        (wobbleAmount * 0.5);
    }

    // Update enemy projectiles
    this.updateEnemyProjectiles(delta);

    // Check if wave is complete
    if (
      this.waveInProgress &&
      this.zombies.length === 0 &&
      this.zombiesSpawned >= this.zombiesRemaining
    ) {
      this.waveInProgress = false;
      this.bossActive = false;
      this.game.onWaveComplete();
    }
  }

  fireProjectile(zombie, direction) {
    // Create acid spit projectile
    const projectileGroup = new THREE.Group();

    // Core
    const coreGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x88ff88 });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    projectileGroup.add(core);

    // Glow
    const glowGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.5,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    projectileGroup.add(glow);

    // Trail particles
    for (let i = 0; i < 5; i++) {
      const trailGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ff66,
        transparent: true,
        opacity: 0.6,
      });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        -0.2 - i * 0.15,
      );
      projectileGroup.add(trail);
    }

    projectileGroup.position.copy(zombie.mesh.position);
    projectileGroup.position.y = 1.5;

    this.game.scene.add(projectileGroup);

    this.enemyProjectiles.push({
      mesh: projectileGroup,
      direction: direction.clone(),
      speed: zombie.projectileSpeed,
      damage: zombie.damage,
      elapsed: 0,
      maxDuration: 5,
    });

    this.game.audioManager.playSound("shoot");
  }

  updateEnemyProjectiles(delta) {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.enemyProjectiles[i];
      proj.elapsed += delta;

      // Move projectile
      proj.mesh.position.x += proj.direction.x * proj.speed * delta;
      proj.mesh.position.z += proj.direction.z * proj.speed * delta;

      // Rotate for effect
      proj.mesh.rotation.y += delta * 5;

      // Check if hit player
      const playerPos = this.game.player.getPosition();
      const dist = proj.mesh.position.distanceTo(playerPos);
      if (dist < 1) {
        this.game.player.takeDamage(proj.damage);
        this.game.scene.remove(proj.mesh);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // Remove if expired or out of bounds
      if (
        proj.elapsed >= proj.maxDuration ||
        Math.abs(proj.mesh.position.x) > this.game.arenaSize ||
        Math.abs(proj.mesh.position.z) > this.game.arenaSize
      ) {
        this.game.scene.remove(proj.mesh);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  avoidObstacles(zombie, desiredDirection) {
    const pos = zombie.mesh.position;
    const avoidanceRadius = 2;
    const avoidanceForce = new THREE.Vector3();

    // Check obstacles
    for (const obstacle of this.game.obstacles) {
      const toObstacle = new THREE.Vector3();
      toObstacle.subVectors(obstacle.position, pos);
      toObstacle.y = 0;

      const dist = toObstacle.length();
      const minDist =
        Math.max(obstacle.size.x, obstacle.size.z) / 2 + avoidanceRadius;

      if (dist < minDist) {
        // Push away from obstacle
        toObstacle.normalize();
        const force = (minDist - dist) / minDist;
        avoidanceForce.sub(toObstacle.multiplyScalar(force));
      }
    }

    // Combine desired direction with avoidance
    const finalDir = desiredDirection.clone();
    finalDir.add(avoidanceForce);
    finalDir.normalize();

    return finalDir;
  }

  attackPlayer(zombie) {
    if (zombie.attackCooldown <= 0) {
      this.game.player.takeDamage(zombie.damage);
      zombie.attackCooldown = zombie.attackRate;
      this.game.audioManager.playSound("zombieAttack");
    }
  }

  damageZombie(zombie, rawDamage, hitDirection = null, forceCrit = false) {
    // Basic crit system (15% chance for double damage, plus any forced crits)
    const isCrit = forceCrit || Math.random() < 0.15;
    const finalDamage = isCrit ? rawDamage * 2 : rawDamage;

    zombie.health -= finalDamage;

    // Flash white/yellow on hit
    const body = zombie.mesh.userData.body;
    if (body) {
      body.material.emissive.setHex(isCrit ? 0xffaa00 : 0xffffff);
      setTimeout(() => {
        if (body.material) {
          body.material.emissive.setHex(0x000000);
        }
      }, 50); // Faster punchier flash
    }

    // Knockback
    if (!zombie.isBoss) {
      let knockbackDir = hitDirection;
      if (!knockbackDir) {
        knockbackDir = new THREE.Vector3().subVectors(
          zombie.mesh.position,
          this.game.player.getPosition(),
        );
        knockbackDir.y = 0;
        knockbackDir.normalize();
      }

      const knockbackStrength = isCrit ? 0.8 : 0.4;
      zombie.mesh.position.add(knockbackDir.multiplyScalar(knockbackStrength));
    }

    // Hit feedback (sparks & floating text)
    if (this.game.particleSystem) {
      // Small random offset for text
      const textPos = zombie.mesh.position.clone();
      textPos.x += (Math.random() - 0.5) * 1.5;
      textPos.y += 1.5 + Math.random() * 0.5;
      textPos.z += (Math.random() - 0.5) * 1.5;

      const color = isCrit ? 0xffcc00 : 0xffffff;
      const size = isCrit ? 0.8 : 0.5;

      this.game.particleSystem.createFloatingText(
        textPos,
        Math.floor(finalDamage).toString(),
        color,
        size,
        isCrit,
      );

      // Hit spark particle
      this.game.particleSystem.spawn(
        zombie.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
        isCrit ? "critSpark" : "hitSpark",
      );
    }

    if (zombie.health <= 0) {
      this.killZombie(zombie);
    }
  }

  damageInRadius(position, radius, damage) {
    for (const zombie of this.zombies) {
      const dist = zombie.mesh.position.distanceTo(position);
      if (dist < radius) {
        // Damage falls off with distance
        const falloff = 1 - dist / radius;
        this.damageZombie(zombie, damage * falloff);
      }
    }
  }

  killZombie(zombie) {
    const index = this.zombies.indexOf(zombie);
    if (index === -1) return;

    // Remove from array
    this.zombies.splice(index, 1);

    // Handle exploding enemies
    if (zombie.explodeOnDeath) {
      this.createExplosionEffect(
        zombie.mesh.position,
        zombie.explosionRadius,
        zombie.explosionDamage,
      );
    }

    // Death effect (bigger for bosses)
    if (zombie.isBoss) {
      this.createBossDeathEffect(zombie.mesh.position);
      this.bossActive = false;
    } else {
      this.createDeathEffect(zombie.mesh.position, zombie.type);
    }

    // Drop XP gem (Vampire Survivors style)
    if (this.game.dropXPGem) {
      const xpMult = Math.min(zombie.typeDef?.xpMult || 1, 5);
      const baseXP = Math.max(1, Math.ceil(Math.sqrt(zombie.maxHealth / 25) * xpMult));
      this.game.dropXPGem(zombie.mesh.position.clone(), baseXP);

      // Bosses drop multiple gems
      if (zombie.isBoss) {
        for (let i = 0; i < 5; i++) {
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            0,
            (Math.random() - 0.5) * 3,
          );
          this.game.dropXPGem(zombie.mesh.position.clone().add(offset), baseXP);
        }
      }
    }

    // Don't pool special enemy meshes, just remove
    zombie.mesh.visible = false;
    this.game.scene.remove(zombie.mesh);

    // Only pool normal zombies
    if (zombie.type === "normal") {
      this.zombiePool.push(zombie.mesh);
    }

    // Update game state (more points for special enemies)
    this.game.addKill();
    const scoreMultiplier = zombie.isBoss ? 10 : zombie.typeDef?.xpMult || 1;
    this.game.addScore(Math.floor(100 * scoreMultiplier));

    // Play death sound (different for boss)
    if (zombie.isBoss) {
      this.game.audioManager.playSound("explosion");
    } else {
      this.game.audioManager.playSound("zombieDeath");
    }
  }

  createExplosionEffect(position, radius, damage) {
    // Visual explosion
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);

    // Hot inner core
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.5, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    explosionGroup.add(core);

    // Glowing main fireball
    const fireball = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.2, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    explosionGroup.add(fireball);

    // Shockwave ring
    const shockwave = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.8, radius * 1.5, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    shockwave.rotation.x = -Math.PI / 2;
    explosionGroup.add(shockwave);

    explosionGroup.position.y = 1;
    explosionGroup.scale.setScalar(0.1);

    this.game.scene.add(explosionGroup);

    // Damage player if in range
    const playerPos = this.game.player.getPosition();
    const dist = position.distanceTo(playerPos);
    if (dist < radius) {
      const falloff = 1 - dist / radius;
      this.game.player.takeDamage(damage * falloff);
    }

    // Animate explosion
    let scale = 0.1;
    let opacity = 1;

    const animate = () => {
      scale += 0.15;
      opacity -= 0.05;

      if (opacity <= 0) {
        this.game.scene.remove(explosionGroup);

        // Dispose
        core.geometry.dispose();
        core.material.dispose();
        fireball.geometry.dispose();
        fireball.material.dispose();
        shockwave.geometry.dispose();
        shockwave.material.dispose();
      } else {
        explosionGroup.scale.setScalar(scale);

        core.material.opacity = opacity;
        fireball.material.opacity = opacity * 0.8;
        shockwave.material.opacity = opacity * 0.5;

        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    this.game.audioManager.playSound("explosion");
  }

  createBossDeathEffect(position) {
    if (this.game.particleSystem) {
      this.game.particleSystem.spawn(position, "bossDeath");
    }
  }

  createDeathEffect(position, type = "normal") {
    if (this.game.particleSystem) {
      const count = type === "tank" ? 25 : 15;
      this.game.particleSystem.spawn(position, "enemyDeath", { count });
    }
  }

  getZombies() {
    return this.zombies;
  }
}
