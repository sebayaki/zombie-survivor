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

  // --- Mesh building helpers ---

  _addPart(group, geometry, material, pos, rot) {
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

  _addArms(group, mat, s, radius, length, offsets) {
    const { lx, rx, y, z, rotX, lRotZ, rRotZ } = offsets;
    const geo = new THREE.CapsuleGeometry(radius * s, length * s, 4, 8);
    this._addPart(group, geo, mat.clone(), { x: lx * s, y: y * s, z: z * s }, { x: rotX, z: lRotZ });
    this._addPart(group, geo, mat.clone(), { x: rx * s, y: y * s, z: z * s }, { x: rotX, z: rRotZ });
  }

  _addEyes(group, type, s, eyeColor) {
    const eyeGeo = new THREE.SphereGeometry(0.1 * s, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

    const EYE_POS = {
      fast:     { y: 1.75, z: 0.35 },
      tank:     { y: 2.45, z: 0.35 },
      spitter:  { y: 2.05, z: 0.28 },
      exploder: { y: 1.95, z: 0.28 },
      boss:     { y: 2.55, z: 0.4 },
      normal:   { y: 2.15, z: 0.28 },
    };
    const ep = EYE_POS[type] || EYE_POS.normal;

    this._addPart(group, eyeGeo, eyeMat, { x: -0.12 * s, y: ep.y * s, z: ep.z * s });
    this._addPart(group, eyeGeo, eyeMat, { x:  0.12 * s, y: ep.y * s, z: ep.z * s });

    if (type === "boss") {
      this._addPart(group, eyeGeo, eyeMat, { x: 0, y: 2.65 * s, z: 0.35 * s });
    }
  }

  createZombieMesh(type = "normal", typeDef = ENEMY_TYPES.normal) {
    const mesh = new THREE.Group();
    const s = typeDef.scale;
    const eyeColor = typeDef.eyeColor || 0xff0000;
    const glowColor = typeDef.glowColor || eyeColor;
    const mat = new THREE.MeshStandardMaterial({ color: typeDef.color, roughness: 0.7 });

    const builders = {
      fast: () => this._buildFastZombie(mesh, mat, s, eyeColor),
      tank: () => this._buildTankZombie(mesh, mat, s, glowColor),
      spitter: () => this._buildSpitterZombie(mesh, mat, s, glowColor),
      exploder: () => this._buildExploderZombie(mesh, mat, s, glowColor),
      boss: () => this._buildBossZombie(mesh, mat, s, glowColor),
    };

    const builder = builders[type];
    if (builder) {
      builder();
    } else {
      this._buildNormalZombie(mesh, mat, s);
    }

    this._addEyes(mesh, type, s, eyeColor);
    mesh.userData.body = mesh.children[0];
    mesh.userData.type = type;
    return mesh;
  }

  _buildNormalZombie(mesh, mat, s) {
    this._addPart(mesh, new THREE.CapsuleGeometry(0.4 * s, 1.2 * s, 4, 8), mat.clone(), { y: 1 * s });
    this._addPart(mesh, new THREE.SphereGeometry(0.35 * s, 8, 8), mat.clone(), { y: 2.1 * s });
    this._addArms(mesh, mat, s, 0.12, 0.8, { lx: -0.6, rx: 0.6, y: 1.3, z: 0.3, rotX: -0.5, lRotZ: 0.3, rRotZ: -0.3 });
  }

  _buildFastZombie(mesh, mat, s, eyeColor) {
    this._addPart(mesh, new THREE.CapsuleGeometry(0.25 * s, 1.0 * s, 4, 8), mat.clone(), { y: 0.9 * s }, { x: 0.3 });
    this._addPart(mesh, new THREE.SphereGeometry(0.28 * s, 8, 8), mat.clone(), { y: 1.7 * s, z: 0.2 * s });
    this._addArms(mesh, mat, s, 0.08, 1.0, { lx: -0.4, rx: 0.4, y: 1.0, z: 0.4, rotX: -1.0, lRotZ: 0.2, rRotZ: -0.2 });

    const streakMat = new THREE.MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.4 });
    for (let i = 0; i < 3; i++) {
      this._addPart(mesh, new THREE.BoxGeometry(0.05, 0.5 * s, 0.02), streakMat, { x: -0.5 * s - i * 0.15, y: 1.2 * s });
    }
  }

  _buildTankZombie(mesh, mat, s) {
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.9, roughness: 0.2 });

    this._addPart(mesh, new THREE.CapsuleGeometry(0.6 * s, 1.4 * s, 4, 8), mat.clone(), { y: 1.2 * s });
    this._addPart(mesh, new THREE.SphereGeometry(0.4 * s, 8, 8), mat.clone(), { y: 2.4 * s });
    const helmet = this._addPart(mesh, new THREE.SphereGeometry(0.45 * s, 8, 4), armorMat, { y: 2.5 * s });
    helmet.scale.y = 0.7;
    this._addArms(mesh, mat, s, 0.2, 1.0, { lx: -0.8, rx: 0.8, y: 1.5, z: 0.2, rotX: -0.3, lRotZ: 0, rRotZ: 0 });
    this._addPart(mesh, new THREE.BoxGeometry(1.0 * s, 0.8 * s, 0.3 * s), armorMat, { y: 1.3 * s, z: 0.4 * s });

    const spikeGeo = new THREE.ConeGeometry(0.1 * s, 0.4 * s, 6);
    for (let i = 0; i < 3; i++) {
      this._addPart(mesh, spikeGeo, armorMat, { x: -0.7 * s, y: 1.8 * s + i * 0.15 }, { z: -0.5 });
      this._addPart(mesh, spikeGeo, armorMat, { x:  0.7 * s, y: 1.8 * s + i * 0.15 }, { z: 0.5 });
    }
  }

  _buildSpitterZombie(mesh, mat, s, glowColor) {
    this._addPart(mesh, new THREE.CapsuleGeometry(0.35 * s, 1.1 * s, 4, 8), mat.clone(), { y: 1 * s });
    this._addPart(mesh, new THREE.SphereGeometry(0.32 * s, 8, 8), mat.clone(), { y: 2.0 * s });

    const sackMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.7 });
    this._addPart(mesh, new THREE.SphereGeometry(0.3 * s, 8, 8), sackMat, { y: 1.6 * s, z: 0.25 * s });
    this._addPart(mesh, new THREE.SphereGeometry(0.15 * s, 6, 6), sackMat, { x: -0.25 * s, y: 1.7 * s, z: 0.15 * s });
    this._addPart(mesh, new THREE.SphereGeometry(0.15 * s, 6, 6), sackMat, { x:  0.25 * s, y: 1.7 * s, z: 0.15 * s });

    const dripMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 3; i++) {
      this._addPart(mesh, new THREE.CylinderGeometry(0.02 * s, 0.04 * s, 0.3 * s, 6), dripMat,
        { x: (Math.random() - 0.5) * 0.3 * s, y: 1.3 * s, z: 0.3 * s });
    }
    this._addArms(mesh, mat, s, 0.1, 0.7, { lx: -0.5, rx: 0.5, y: 1.2, z: 0.2, rotX: -0.4, lRotZ: 0, rRotZ: 0 });
  }

  _buildExploderZombie(mesh, mat, s, glowColor) {
    const body = this._addPart(mesh, new THREE.SphereGeometry(0.6 * s, 12, 12), mat.clone(), { y: 0.9 * s });
    body.scale.set(1, 1.3, 1);
    this._addPart(mesh, new THREE.SphereGeometry(0.25 * s, 8, 8), mat.clone(), { y: 1.9 * s });

    const innerGlowMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.6 });
    this._addPart(mesh, new THREE.SphereGeometry(0.5 * s, 8, 8), innerGlowMat, { y: 0.9 * s });

    const crackMat = new THREE.MeshBasicMaterial({ color: glowColor });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this._addPart(mesh, new THREE.BoxGeometry(0.08 * s, 0.4 * s, 0.03 * s), crackMat,
        { x: Math.cos(angle) * 0.55 * s, y: 0.9 * s + (Math.random() - 0.5) * 0.4 * s, z: Math.sin(angle) * 0.55 * s },
        { y: angle, z: (Math.random() - 0.5) * 0.5 });
    }
    this._addArms(mesh, mat, s, 0.12, 0.5, { lx: -0.65, rx: 0.65, y: 1.0, z: 0, rotX: 0, lRotZ: 0.5, rRotZ: -0.5 });
  }

  _buildBossZombie(mesh, mat, s, glowColor) {
    this._addPart(mesh, new THREE.CapsuleGeometry(0.5 * s, 1.5 * s, 6, 12), mat.clone(), { y: 1.2 * s });
    this._addPart(mesh, new THREE.SphereGeometry(0.45 * s, 12, 12), mat.clone(), { y: 2.5 * s });

    const hornMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 });
    const hornGeo = new THREE.ConeGeometry(0.12 * s, 0.7 * s, 6);
    for (const h of [{ x: -0.3, y: 2.8, rz: 0.4 }, { x: 0.3, y: 2.8, rz: -0.4 }, { x: 0, y: 2.9, z: -0.2, rx: -0.3 }]) {
      this._addPart(mesh, hornGeo, hornMat, { x: (h.x ?? 0) * s, y: h.y * s, z: (h.z ?? 0) * s }, { x: h.rx, z: h.rz });
    }

    this._addArms(mesh, mat, s, 0.18, 1.2, { lx: -0.7, rx: 0.7, y: 1.6, z: 0.3, rotX: -0.5, lRotZ: 0.3, rRotZ: -0.3 });

    const auraMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.15 });
    const aura = this._addPart(mesh, new THREE.SphereGeometry(1.8 * s, 16, 16), auraMat, { y: 1.2 * s });
    mesh.userData.aura = aura;

    const hbBg = this._addPart(mesh, new THREE.PlaneGeometry(2.5 * s, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x333333 }), { y: 3.5 * s }, { x: -Math.PI / 4 });
    const hb = this._addPart(mesh, new THREE.PlaneGeometry(2.5 * s, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }), { y: 3.5 * s, z: 0.01 }, { x: -Math.PI / 4 });
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

      // Wobble animation (smaller for bosses)
      const wobbleAmount = zombie.isBoss ? 0.03 : 0.1;
      zombie.mesh.children[0].rotation.z =
        Math.sin(Date.now() * 0.01) * wobbleAmount;
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

  damageZombie(zombie, damage) {
    zombie.health -= damage;

    // Flash red
    const body = zombie.mesh.userData.body;
    if (body) {
      body.material.emissive.setHex(0xff0000);
      setTimeout(() => {
        if (body.material) {
          body.material.emissive.setHex(0x000000);
        }
      }, 100);
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
      // XP scales with enemy type multiplier
      const xpMult = zombie.typeDef?.xpMult || 1;
      const baseXP = Math.max(1, Math.floor((zombie.maxHealth / 30) * xpMult));
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

    // Orange fireball
    const fireGeometry = new THREE.SphereGeometry(radius, 16, 16);
    const fireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    explosionGroup.add(fire);

    // Inner yellow
    const yellowGeometry = new THREE.SphereGeometry(radius * 0.6, 12, 12);
    const yellowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.9,
    });
    const yellow = new THREE.Mesh(yellowGeometry, yellowMaterial);
    explosionGroup.add(yellow);

    explosionGroup.position.copy(position);
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
    const animate = () => {
      scale += 0.15;
      fireMaterial.opacity -= 0.05;

      if (fireMaterial.opacity <= 0) {
        this.game.scene.remove(explosionGroup);
      } else {
        explosionGroup.scale.setScalar(scale);
        yellowMaterial.opacity = fireMaterial.opacity;
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
