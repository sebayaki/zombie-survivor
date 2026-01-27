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

  createZombieMesh(type = "normal", typeDef = ENEMY_TYPES.normal) {
    const mesh = new THREE.Group();
    const scale = typeDef.scale;
    const color = typeDef.color;
    const secondaryColor = typeDef.secondaryColor || color;
    const eyeColor = typeDef.eyeColor || 0xff0000;
    const glowColor = typeDef.glowColor || eyeColor;

    // Main material
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
    });

    // Secondary material for details
    const secondaryMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.8,
    });

    // === FAST ZOMBIE (Runner) - Lean, hunched, long limbs ===
    if (type === "fast") {
      // Thin body
      const bodyGeometry = new THREE.CapsuleGeometry(
        0.25 * scale,
        1.0 * scale,
        4,
        8,
      );
      const body = new THREE.Mesh(bodyGeometry, material.clone());
      body.position.y = 0.9 * scale;
      body.rotation.x = 0.3; // Hunched forward
      mesh.add(body);

      // Small head
      const headGeometry = new THREE.SphereGeometry(0.28 * scale, 8, 8);
      const head = new THREE.Mesh(headGeometry, material.clone());
      head.position.set(0, 1.7 * scale, 0.2 * scale);
      mesh.add(head);

      // Long arms for running
      const armGeometry = new THREE.CapsuleGeometry(
        0.08 * scale,
        1.0 * scale,
        4,
        8,
      );
      const leftArm = new THREE.Mesh(armGeometry, material.clone());
      leftArm.position.set(-0.4 * scale, 1.0 * scale, 0.4 * scale);
      leftArm.rotation.x = -1.0;
      leftArm.rotation.z = 0.2;
      mesh.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, material.clone());
      rightArm.position.set(0.4 * scale, 1.0 * scale, 0.4 * scale);
      rightArm.rotation.x = -1.0;
      rightArm.rotation.z = -0.2;
      mesh.add(rightArm);

      // Speed lines effect (glowing streaks)
      const streakMaterial = new THREE.MeshBasicMaterial({
        color: eyeColor,
        transparent: true,
        opacity: 0.4,
      });
      for (let i = 0; i < 3; i++) {
        const streak = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.5 * scale, 0.02),
          streakMaterial,
        );
        streak.position.set(-0.5 * scale - i * 0.15, 1.2 * scale, 0);
        mesh.add(streak);
      }
    }
    // === TANK ZOMBIE (Brute) - Massive, armored ===
    else if (type === "tank") {
      // Huge body
      const bodyGeometry = new THREE.CapsuleGeometry(
        0.6 * scale,
        1.4 * scale,
        4,
        8,
      );
      const body = new THREE.Mesh(bodyGeometry, material.clone());
      body.position.y = 1.2 * scale;
      mesh.add(body);

      // Armored head with helmet
      const headGeometry = new THREE.SphereGeometry(0.4 * scale, 8, 8);
      const head = new THREE.Mesh(headGeometry, material.clone());
      head.position.y = 2.4 * scale;
      mesh.add(head);

      // Metal helmet
      const helmetGeometry = new THREE.SphereGeometry(0.45 * scale, 8, 4);
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x444455,
        metalness: 0.9,
        roughness: 0.2,
      });
      const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.y = 2.5 * scale;
      helmet.scale.y = 0.7;
      mesh.add(helmet);

      // Massive arms
      const armGeometry = new THREE.CapsuleGeometry(
        0.2 * scale,
        1.0 * scale,
        4,
        8,
      );
      const leftArm = new THREE.Mesh(armGeometry, material.clone());
      leftArm.position.set(-0.8 * scale, 1.5 * scale, 0.2 * scale);
      leftArm.rotation.x = -0.3;
      mesh.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, material.clone());
      rightArm.position.set(0.8 * scale, 1.5 * scale, 0.2 * scale);
      rightArm.rotation.x = -0.3;
      mesh.add(rightArm);

      // Chest armor plate
      const armorGeometry = new THREE.BoxGeometry(
        1.0 * scale,
        0.8 * scale,
        0.3 * scale,
      );
      const chestArmor = new THREE.Mesh(armorGeometry, helmetMaterial);
      chestArmor.position.set(0, 1.3 * scale, 0.4 * scale);
      mesh.add(chestArmor);

      // Shoulder spikes
      const spikeGeometry = new THREE.ConeGeometry(0.1 * scale, 0.4 * scale, 6);
      for (let i = 0; i < 3; i++) {
        const leftSpike = new THREE.Mesh(spikeGeometry, helmetMaterial);
        leftSpike.position.set(-0.7 * scale, 1.8 * scale + i * 0.15, 0);
        leftSpike.rotation.z = -0.5;
        mesh.add(leftSpike);

        const rightSpike = new THREE.Mesh(spikeGeometry, helmetMaterial);
        rightSpike.position.set(0.7 * scale, 1.8 * scale + i * 0.15, 0);
        rightSpike.rotation.z = 0.5;
        mesh.add(rightSpike);
      }
    }
    // === SPITTER ZOMBIE - Mutated, toxic appearance ===
    else if (type === "spitter") {
      // Normal body but with toxic coloring
      const bodyGeometry = new THREE.CapsuleGeometry(
        0.35 * scale,
        1.1 * scale,
        4,
        8,
      );
      const body = new THREE.Mesh(bodyGeometry, material.clone());
      body.position.y = 1 * scale;
      mesh.add(body);

      // Distorted head with bulging cheeks
      const headGeometry = new THREE.SphereGeometry(0.32 * scale, 8, 8);
      const head = new THREE.Mesh(headGeometry, material.clone());
      head.position.y = 2.0 * scale;
      mesh.add(head);

      // Bulging acid sacks on neck/throat
      const sackMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.7,
      });
      const mainSack = new THREE.Mesh(
        new THREE.SphereGeometry(0.3 * scale, 8, 8),
        sackMaterial,
      );
      mainSack.position.set(0, 1.6 * scale, 0.25 * scale);
      mesh.add(mainSack);

      // Side sacks
      const sideSack1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 6, 6),
        sackMaterial,
      );
      sideSack1.position.set(-0.25 * scale, 1.7 * scale, 0.15 * scale);
      mesh.add(sideSack1);

      const sideSack2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 6, 6),
        sackMaterial,
      );
      sideSack2.position.set(0.25 * scale, 1.7 * scale, 0.15 * scale);
      mesh.add(sideSack2);

      // Dripping acid effect
      const dripMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.5,
      });
      for (let i = 0; i < 3; i++) {
        const drip = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.02 * scale,
            0.04 * scale,
            0.3 * scale,
            6,
          ),
          dripMaterial,
        );
        drip.position.set(
          (Math.random() - 0.5) * 0.3 * scale,
          1.3 * scale,
          0.3 * scale,
        );
        mesh.add(drip);
      }

      // Thin arms
      const armGeometry = new THREE.CapsuleGeometry(
        0.1 * scale,
        0.7 * scale,
        4,
        8,
      );
      const leftArm = new THREE.Mesh(armGeometry, material.clone());
      leftArm.position.set(-0.5 * scale, 1.2 * scale, 0.2 * scale);
      leftArm.rotation.x = -0.4;
      mesh.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, material.clone());
      rightArm.position.set(0.5 * scale, 1.2 * scale, 0.2 * scale);
      rightArm.rotation.x = -0.4;
      mesh.add(rightArm);
    }
    // === EXPLODER ZOMBIE (Bloater) - Bloated, glowing cracks ===
    else if (type === "exploder") {
      // Bloated body
      const bodyGeometry = new THREE.SphereGeometry(0.6 * scale, 12, 12);
      const body = new THREE.Mesh(bodyGeometry, material.clone());
      body.position.y = 0.9 * scale;
      body.scale.set(1, 1.3, 1);
      mesh.add(body);

      // Small head on bloated body
      const headGeometry = new THREE.SphereGeometry(0.25 * scale, 8, 8);
      const head = new THREE.Mesh(headGeometry, material.clone());
      head.position.y = 1.9 * scale;
      mesh.add(head);

      // Glowing inner mass (visible through cracks)
      const innerGlowGeometry = new THREE.SphereGeometry(0.5 * scale, 8, 8);
      const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.6,
      });
      const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
      innerGlow.position.y = 0.9 * scale;
      mesh.add(innerGlow);

      // Glowing cracks all over body
      const crackMaterial = new THREE.MeshBasicMaterial({ color: glowColor });
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const crack = new THREE.Mesh(
          new THREE.BoxGeometry(0.08 * scale, 0.4 * scale, 0.03 * scale),
          crackMaterial,
        );
        crack.position.set(
          Math.cos(angle) * 0.55 * scale,
          0.9 * scale + (Math.random() - 0.5) * 0.4 * scale,
          Math.sin(angle) * 0.55 * scale,
        );
        crack.rotation.y = angle;
        crack.rotation.z = (Math.random() - 0.5) * 0.5;
        mesh.add(crack);
      }

      // Stubby arms
      const armGeometry = new THREE.CapsuleGeometry(
        0.12 * scale,
        0.5 * scale,
        4,
        8,
      );
      const leftArm = new THREE.Mesh(armGeometry, material.clone());
      leftArm.position.set(-0.65 * scale, 1.0 * scale, 0);
      leftArm.rotation.z = 0.5;
      mesh.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, material.clone());
      rightArm.position.set(0.65 * scale, 1.0 * scale, 0);
      rightArm.rotation.z = -0.5;
      mesh.add(rightArm);
    }
    // === BOSS - Massive abomination ===
    else if (type === "boss") {
      // Massive twisted body
      const bodyGeometry = new THREE.CapsuleGeometry(
        0.5 * scale,
        1.5 * scale,
        6,
        12,
      );
      const body = new THREE.Mesh(bodyGeometry, material.clone());
      body.position.y = 1.2 * scale;
      mesh.add(body);

      // Large head with multiple eyes
      const headGeometry = new THREE.SphereGeometry(0.45 * scale, 12, 12);
      const head = new THREE.Mesh(headGeometry, material.clone());
      head.position.y = 2.5 * scale;
      mesh.add(head);

      // Multiple horns
      const hornMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.4,
      });
      const hornPositions = [
        { x: -0.3, y: 2.8, z: 0, rx: 0, rz: 0.4 },
        { x: 0.3, y: 2.8, z: 0, rx: 0, rz: -0.4 },
        { x: 0, y: 2.9, z: -0.2, rx: -0.3, rz: 0 },
      ];
      hornPositions.forEach((pos) => {
        const horn = new THREE.Mesh(
          new THREE.ConeGeometry(0.12 * scale, 0.7 * scale, 6),
          hornMaterial,
        );
        horn.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
        horn.rotation.x = pos.rx;
        horn.rotation.z = pos.rz;
        mesh.add(horn);
      });

      // Massive arms with claws
      const armGeometry = new THREE.CapsuleGeometry(
        0.18 * scale,
        1.2 * scale,
        4,
        8,
      );
      const leftArm = new THREE.Mesh(armGeometry, material.clone());
      leftArm.position.set(-0.7 * scale, 1.6 * scale, 0.3 * scale);
      leftArm.rotation.x = -0.5;
      leftArm.rotation.z = 0.3;
      mesh.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, material.clone());
      rightArm.position.set(0.7 * scale, 1.6 * scale, 0.3 * scale);
      rightArm.rotation.x = -0.5;
      rightArm.rotation.z = -0.3;
      mesh.add(rightArm);

      // Glowing aura
      const auraGeometry = new THREE.SphereGeometry(1.8 * scale, 16, 16);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.15,
      });
      const aura = new THREE.Mesh(auraGeometry, auraMaterial);
      aura.position.y = 1.2 * scale;
      mesh.add(aura);
      mesh.userData.aura = aura;

      // Health bar
      const healthBarBg = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5 * scale, 0.25),
        new THREE.MeshBasicMaterial({ color: 0x333333 }),
      );
      healthBarBg.position.set(0, 3.5 * scale, 0);
      healthBarBg.rotation.x = -Math.PI / 4;
      mesh.add(healthBarBg);

      const healthBar = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5 * scale, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      healthBar.position.set(0, 3.5 * scale, 0.01);
      healthBar.rotation.x = -Math.PI / 4;
      mesh.add(healthBar);
      mesh.userData.healthBar = healthBar;
      mesh.userData.healthBarWidth = 2.5 * scale;
    }
    // === NORMAL ZOMBIE - Standard appearance ===
    else {
      // Standard body
      const bodyGeometry = new THREE.CapsuleGeometry(
        0.4 * scale,
        1.2 * scale,
        4,
        8,
      );
      const body = new THREE.Mesh(bodyGeometry, material.clone());
      body.position.y = 1 * scale;
      mesh.add(body);

      // Head
      const headGeometry = new THREE.SphereGeometry(0.35 * scale, 8, 8);
      const head = new THREE.Mesh(headGeometry, material.clone());
      head.position.y = 2.1 * scale;
      mesh.add(head);

      // Arms
      const armGeometry = new THREE.CapsuleGeometry(
        0.12 * scale,
        0.8 * scale,
        4,
        8,
      );
      const leftArm = new THREE.Mesh(armGeometry, material.clone());
      leftArm.position.set(-0.6 * scale, 1.3 * scale, 0.3 * scale);
      leftArm.rotation.x = -0.5;
      leftArm.rotation.z = 0.3;
      mesh.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, material.clone());
      rightArm.position.set(0.6 * scale, 1.3 * scale, 0.3 * scale);
      rightArm.rotation.x = -0.5;
      rightArm.rotation.z = -0.3;
      mesh.add(rightArm);
    }

    // Add eyes to all types
    const eyeGeometry = new THREE.SphereGeometry(0.1 * scale, 6, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: eyeColor });

    // Eye positions vary by type
    let eyeY = 2.15 * scale;
    let eyeZ = 0.28 * scale;
    if (type === "fast") {
      eyeY = 1.75 * scale;
      eyeZ = 0.35 * scale;
    } else if (type === "tank") {
      eyeY = 2.45 * scale;
      eyeZ = 0.35 * scale;
    } else if (type === "spitter") {
      eyeY = 2.05 * scale;
    } else if (type === "exploder") {
      eyeY = 1.95 * scale;
    } else if (type === "boss") {
      eyeY = 2.55 * scale;
      eyeZ = 0.4 * scale;
      // Boss has extra eyes
      const extraEye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
      extraEye1.position.set(0, 2.65 * scale, 0.35 * scale);
      mesh.add(extraEye1);
    }

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12 * scale, eyeY, eyeZ);
    mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12 * scale, eyeY, eyeZ);
    mesh.add(rightEye);

    // Store body reference for damage flash (use first mesh child as body)
    mesh.userData.body = mesh.children[0];
    mesh.userData.type = type;

    return mesh;
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
    // Massive death effect for bosses
    const particleCount = 50;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const size = 0.1 + Math.random() * 0.2;
      const geometry = new THREE.SphereGeometry(size, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0x440066 : i % 3 === 1 ? 0xff0088 : 0x000000,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y += 1.5;

      // Stronger velocity
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 4,
        (Math.random() - 0.5) * 10,
      );

      this.game.scene.add(particle);
      particles.push(particle);
    }

    // Screen shake effect (if implemented)
    // this.game.screenShake(0.5);

    // Animate
    const animateParticles = () => {
      let allDone = true;

      for (const particle of particles) {
        if (particle.material.opacity <= 0) continue;
        allDone = false;

        particle.position.add(
          particle.userData.velocity.clone().multiplyScalar(0.016),
        );
        particle.userData.velocity.y -= 15 * 0.016;
        particle.material.opacity -= 0.015;

        if (particle.position.y < 0) {
          particle.position.y = 0;
          particle.userData.velocity.y *= -0.3;
        }
      }

      if (!allDone) {
        requestAnimationFrame(animateParticles);
      } else {
        particles.forEach((p) => this.game.scene.remove(p));
      }
    };
    requestAnimationFrame(animateParticles);
  }

  createDeathEffect(position, type = "normal") {
    // Get color based on enemy type
    const typeDef = ENEMY_TYPES[type] || ENEMY_TYPES.normal;
    const baseColor = typeDef.color;

    // Particle burst
    const particleCount = type === "tank" ? 25 : 15;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y += 1;

      // Random velocity (stronger for bigger enemies)
      const velocityMult = typeDef.scale;
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5 * velocityMult,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 5 * velocityMult,
      );

      this.game.scene.add(particle);
      particles.push(particle);
    }

    // Animate particles
    const animateParticles = () => {
      let allDone = true;

      for (const particle of particles) {
        if (particle.material.opacity <= 0) continue;

        allDone = false;

        // Apply velocity and gravity
        particle.position.add(
          particle.userData.velocity.clone().multiplyScalar(0.016),
        );
        particle.userData.velocity.y -= 10 * 0.016;

        // Fade out
        particle.material.opacity -= 0.02;

        // Stop at ground
        if (particle.position.y < 0) {
          particle.position.y = 0;
          particle.userData.velocity.set(0, 0, 0);
        }
      }

      if (!allDone) {
        requestAnimationFrame(animateParticles);
      } else {
        // Clean up
        particles.forEach((p) => this.game.scene.remove(p));
      }
    };

    requestAnimationFrame(animateParticles);
  }

  getZombies() {
    return this.zombies;
  }
}
