import * as THREE from "three";
import { ENEMY_TYPES, createZombieMesh } from "./zombies/zombieMeshFactory.js";
import {
  updateZombieBehavior,
  updateEnemyProjectiles,
  updateTelegraphs,
} from "./zombies/zombieAI.js";

const _tmpKnock = new THREE.Vector3();
const _tmpTextPos = new THREE.Vector3();
const _tmpHitPos = new THREE.Vector3();
const _tmpSpawnPos = new THREE.Vector3();
const _tmpOffset = new THREE.Vector3();
const _tmpDropPos = new THREE.Vector3();

// Elite affix definitions
const ELITE_AFFIXES = {
  shielded: {
    name: "Shielded",
    color: 0x887744,
    healthMult: 1.0,
    speedMult: 1.0,
    shieldHP: 0.5, // 50% of max HP as shield
  },
  berserker: {
    name: "Berserker",
    color: 0xff2222,
    healthMult: 1.3,
    speedMult: 1.0,
  },
  splitter: {
    name: "Splitter",
    color: 0x88aa44,
    healthMult: 0.8,
    speedMult: 1.1,
  },
  frozenAura: {
    name: "Frozen Aura",
    color: 0x8899aa,
    healthMult: 1.2,
    speedMult: 0.9,
    auraRadius: 4,
    slowAmount: 0.4,
  },
  vampiric: {
    name: "Vampiric",
    color: 0x880022,
    healthMult: 1.1,
    speedMult: 1.0,
    healOnHit: 0.05, // 5% of max HP healed per hit
  },
};

const AFFIX_KEYS = Object.keys(ELITE_AFFIXES);

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

    // Explosion chain depth limiter
    this._explosionDepth = 0;
    this._activeExplosions = 0;
    this._maxActiveExplosions = 6;

    // Managed explosion animations (replaces per-explosion rAF loops)
    this._explosionAnims = [];
  }

  reset() {
    this.zombies.forEach((zombie) => {
      this.game.scene.remove(zombie.mesh);
    });
    this.zombies = [];

    this.enemyProjectiles.forEach((proj) => {
      this.game.scene.remove(proj.mesh);
    });
    this.enemyProjectiles = [];

    this.zombiesRemaining = 0;
    this.zombiesSpawned = 0;
    this.waveInProgress = false;
    this.bossActive = false;
    this.bossSpawnedThisWave = false;

    for (const e of this._explosionAnims) {
      this.game.scene.remove(e.fireball);
      this.game.scene.remove(e.ring);
      e.fireball.material.dispose();
      e.ring.material.dispose();
    }
    this._explosionAnims = [];
    this._activeExplosions = 0;

    this.game.ui?.hideBossHealthBar();
  }

  spawnWave(count, speed, health) {
    this.zombiesRemaining = count;
    this.zombiesSpawned = 0;
    this.waveInProgress = true;
    this.bossSpawnedThisWave = false;

    const spawnInterval = setInterval(() => {
      if (this.zombiesSpawned >= count || !this.game.isPlaying) {
        clearInterval(spawnInterval);
        return;
      }

      this.spawnZombie(speed, health);
      this.zombiesSpawned++;
    }, 500);
  }

  spawnZombie(speed, health, type = null, baseDamage = 10) {
    const spawnPos = this.getSpawnPosition();

    if (type === null) {
      type = this.getRandomEnemyType();
    }

    const typeDef = ENEMY_TYPES[type] || ENEMY_TYPES.normal;

    const mesh = createZombieMesh(type, typeDef);
    mesh.position.copy(spawnPos);

    let finalHealth = health * typeDef.healthMult;
    let finalSpeed = speed * typeDef.speedMult;
    const finalDamage = baseDamage * typeDef.damageMult;

    const zombie = {
      mesh,
      type,
      typeDef,
      health: finalHealth,
      maxHealth: finalHealth,
      speed: finalSpeed,
      damage: finalDamage,
      attackCooldown: 0,
      attackRate: type === "boss" ? 0.5 : 1,
      state: "chase",
      targetPosition: new THREE.Vector3(),
      ranged: typeDef.ranged || false,
      attackRange: typeDef.attackRange || 1.5,
      projectileSpeed: typeDef.projectileSpeed || 5,
      isBoss: typeDef.isBoss || false,
      bossState: typeDef.isBoss ? "chase" : null,
      bossTimer: 0,
      explodeOnDeath: typeDef.explodeOnDeath || false,
      explosionRadius: typeDef.explosionRadius || 0,
      explosionDamage: typeDef.explosionDamage || 0,
      // Elite system
      isElite: false,
      affixes: [],
      shieldHP: 0,
      maxShieldHP: 0,
      // Resurrection support (necromancy modifier)
      canResurrect: false,
    };

    // Apply elite status based on stage modifiers
    if (!zombie.isBoss && type !== "boss" && this.game.stageSystem) {
      const eliteChance = this.game.stageSystem.getEliteChance();
      if (eliteChance > 0 && Math.random() < eliteChance) {
        this.makeElite(zombie);
      }

      // Shield chance (armored modifier)
      const shieldChance = this.game.stageSystem.getShieldChance();
      if (shieldChance > 0 && !zombie.isElite && Math.random() < shieldChance) {
        zombie.shieldHP = zombie.maxHealth * 0.5;
        zombie.maxShieldHP = zombie.shieldHP;
        this.addShieldVisual(zombie);
      }

      // Resurrection chance (necromancy modifier)
      if (this.game.stageSystem.getResurrectChance() > 0) {
        zombie.canResurrect = true;
      }
    }

    if (zombie.isBoss) {
      this.bossActive = true;
      this.game.ui.announceBoss();
      this.game.ui.showBossHealthBar(typeDef.name);
      this.game.audioManager.playSound("bossRoar");
      if (this.game.postProcessing) {
        this.game.postProcessing.shake(0.8, 0.6);
        this.game.postProcessing.pulseBloom(0.5, 3.0);
      }
    }

    this.zombies.push(zombie);
    this.game.scene.add(mesh);
  }

  makeElite(zombie) {
    zombie.isElite = true;

    // Pick 1-2 random affixes
    const numAffixes = Math.random() < 0.3 ? 2 : 1;
    const available = [...AFFIX_KEYS];
    for (let i = 0; i < numAffixes && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      const affixKey = available.splice(idx, 1)[0];
      const affix = ELITE_AFFIXES[affixKey];
      zombie.affixes.push(affixKey);

      zombie.health *= affix.healthMult;
      zombie.maxHealth *= affix.healthMult;
      zombie.speed *= affix.speedMult;

      if (affixKey === "shielded") {
        zombie.shieldHP = zombie.maxHealth * affix.shieldHP;
        zombie.maxShieldHP = zombie.shieldHP;
      }
    }

    // Scale elite to be slightly larger
    zombie.mesh.scale.multiplyScalar(1.25);

    // Add elite glow indicator
    const primaryAffix = ELITE_AFFIXES[zombie.affixes[0]];
    this.addEliteGlow(zombie, primaryAffix.color);

    // Shield visual if shielded
    if (zombie.affixes.includes("shielded")) {
      this.addShieldVisual(zombie);
    }
  }

  addEliteGlow(zombie, color) {
    const s = (zombie.typeDef.scale || 1) * 1.25;
    const glowGeo = new THREE.SphereGeometry(1.0 * s, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.0 * s;
    zombie.mesh.add(glow);
    zombie.mesh.userData.eliteGlow = glow;
  }

  addShieldVisual(zombie) {
    const s = (zombie.typeDef.scale || 1) * (zombie.isElite ? 1.25 : 1.0);
    const shieldGeo = new THREE.SphereGeometry(1.2 * s, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x887744,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.y = 1.0 * s;
    zombie.mesh.add(shield);
    zombie.mesh.userData.shieldMesh = shield;
  }

  getRandomEnemyType() {
    const waveNumber = Math.floor(this.game.gameTime / 60) + 1;
    const roll = Math.random();

    if (
      waveNumber >= 3 &&
      waveNumber % 3 === 0 &&
      !this.bossActive &&
      !this.bossSpawnedThisWave
    ) {
      this.bossSpawnedThisWave = true;
      return "boss";
    }

    const currentWaveCheck = Math.floor(this.game.gameTime / 60) + 1;
    if (currentWaveCheck !== this._lastWaveCheck) {
      this._lastWaveCheck = currentWaveCheck;
      this.bossSpawnedThisWave = false;
    }

    if (waveNumber >= 5) {
      if (roll < 0.08) return "exploder";
      if (roll < 0.16) return "spitter";
      if (roll < 0.28) return "tank";
      if (roll < 0.5) return "fast";
      return "normal";
    }

    if (waveNumber >= 4) {
      if (roll < 0.1) return "spitter";
      if (roll < 0.22) return "tank";
      if (roll < 0.45) return "fast";
      return "normal";
    }

    if (waveNumber >= 3) {
      if (roll < 0.12) return "tank";
      if (roll < 0.4) return "fast";
      return "normal";
    }

    if (waveNumber >= 2) {
      if (roll < 0.3) return "fast";
      return "normal";
    }

    return "normal";
  }

  getSpawnPosition() {
    const bounds = this.game.arenaSize - 2;
    const side = Math.floor(Math.random() * 4);

    let x, z;
    switch (side) {
      case 0:
        x = (Math.random() - 0.5) * bounds * 2;
        z = -bounds;
        break;
      case 1:
        x = (Math.random() - 0.5) * bounds * 2;
        z = bounds;
        break;
      case 2:
        x = -bounds;
        z = (Math.random() - 0.5) * bounds * 2;
        break;
      case 3:
        x = bounds;
        z = (Math.random() - 0.5) * bounds * 2;
        break;
    }

    return _tmpSpawnPos.set(x, 0, z);
  }

  update(delta) {
    const playerPos = this.game.player.getPosition();

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];

      // Tick damage flash timer
      if (zombie._flashTimer > 0) {
        zombie._flashTimer -= delta;
        if (zombie._flashTimer <= 0) {
          const flashBody = zombie.mesh.userData.body;
          if (flashBody && flashBody.material) flashBody.material.emissive.setHex(0x000000);
        }
      }

      // Berserker affix: speed increases as HP drops
      if (zombie.isElite && zombie.affixes.includes("berserker")) {
        const hpRatio = zombie.health / zombie.maxHealth;
        const speedBoost = 1 + (1 - hpRatio) * 1.5; // up to 2.5x speed at low HP
        zombie._effectiveSpeed = zombie.speed * speedBoost;
      } else {
        zombie._effectiveSpeed = zombie.speed;
      }

      // Frozen Aura: slow player when nearby
      if (zombie.isElite && zombie.affixes.includes("frozenAura")) {
        const affix = ELITE_AFFIXES.frozenAura;
        const dx = zombie.mesh.position.x - playerPos.x;
        const dz = zombie.mesh.position.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < affix.auraRadius) {
          this.game.player._frozenAuraSlow = Math.max(
            this.game.player._frozenAuraSlow || 0,
            affix.slowAmount,
          );
        }
      }

      // Pulse elite glow
      if (zombie.mesh.userData.eliteGlow) {
        const glow = zombie.mesh.userData.eliteGlow;
        glow.material.opacity = 0.12 + Math.sin(this.game.gameTime * 4) * 0.08;
      }

      updateZombieBehavior(zombie, playerPos, delta, this.game, this.enemyProjectiles);
    }

    // Reset frozen aura slow each frame (it gets re-applied by nearby zombies)
    if (this.game.player._frozenAuraSlow) {
      this.game.player._frozenAuraSlow = 0;
    }

    updateEnemyProjectiles(delta, this.game, this.enemyProjectiles);
    updateTelegraphs(delta);

    // Animate explosions (replaces per-explosion rAF loops)
    for (let i = this._explosionAnims.length - 1; i >= 0; i--) {
      const e = this._explosionAnims[i];
      e.scale += (e.targetScale - e.scale) * 0.25;
      e.opacity -= 0.06 * delta * 60;

      if (e.opacity <= 0) {
        this.game.scene.remove(e.fireball);
        this.game.scene.remove(e.ring);
        e.fireball.material.dispose();
        e.ring.material.dispose();
        this._activeExplosions--;
        this._explosionAnims.splice(i, 1);
      } else {
        e.fireball.scale.setScalar(e.scale);
        e.fireball.material.opacity = e.opacity * 0.85;
        e.ring.scale.setScalar(e.scale * 1.5);
        e.ring.material.opacity = e.opacity * 0.4;
      }
    }

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

  damageZombie(zombie, rawDamage, hitDirection = null, forceCrit = false) {
    const isCrit = forceCrit || Math.random() < 0.15;
    let finalDamage = isCrit ? rawDamage * 2 : rawDamage;

    // Shield absorbs damage first
    if (zombie.shieldHP > 0) {
      if (finalDamage <= zombie.shieldHP) {
        zombie.shieldHP -= finalDamage;
        finalDamage = 0;
      } else {
        finalDamage -= zombie.shieldHP;
        zombie.shieldHP = 0;
      }

      // Remove shield visual when broken
      if (zombie.shieldHP <= 0 && zombie.mesh.userData.shieldMesh) {
        zombie.mesh.remove(zombie.mesh.userData.shieldMesh);
        zombie.mesh.userData.shieldMesh.geometry.dispose();
        zombie.mesh.userData.shieldMesh.material.dispose();
        zombie.mesh.userData.shieldMesh = null;
      }

      if (finalDamage <= 0) return;
    }

    zombie.health -= finalDamage;

    const body = zombie.mesh.userData.body;
    if (body && body.material) {
      body.material.emissive.setHex(isCrit ? 0xffaa00 : 0xffffff);
      zombie._flashTimer = 0.05;
    }

    if (!zombie.isBoss) {
      if (hitDirection) {
        _tmpKnock.copy(hitDirection);
      } else {
        const pp = this.game.player.getPosition();
        _tmpKnock.x = zombie.mesh.position.x - pp.x;
        _tmpKnock.y = 0;
        _tmpKnock.z = zombie.mesh.position.z - pp.z;
        const kl = Math.sqrt(
          _tmpKnock.x * _tmpKnock.x + _tmpKnock.z * _tmpKnock.z,
        );
        if (kl > 0.0001) {
          _tmpKnock.x /= kl;
          _tmpKnock.z /= kl;
        }
      }

      const knockbackStrength = isCrit ? 0.8 : 0.4;
      zombie.mesh.position.x += _tmpKnock.x * knockbackStrength;
      zombie.mesh.position.z += _tmpKnock.z * knockbackStrength;
    }

    if (this.game.particleSystem) {
      _tmpTextPos.set(
        zombie.mesh.position.x + (Math.random() - 0.5) * 1.5,
        zombie.mesh.position.y + 1.5 + Math.random() * 0.5,
        zombie.mesh.position.z + (Math.random() - 0.5) * 1.5,
      );

      const color = isCrit ? 0xffcc00 : 0xffffff;
      const size = isCrit ? 0.8 : 0.5;

      this.game.particleSystem.createFloatingText(
        _tmpTextPos,
        Math.floor(finalDamage).toString(),
        color,
        size,
        isCrit,
      );

      _tmpHitPos.set(
        zombie.mesh.position.x,
        zombie.mesh.position.y + 1,
        zombie.mesh.position.z,
      );
      this.game.particleSystem.spawn(
        _tmpHitPos,
        isCrit ? "critSpark" : "hitSpark",
      );
    }

    if (zombie.health <= 0) {
      this.killZombie(zombie);
    }
  }

  damageInRadius(position, radius, damage) {
    const candidates = this.game.zombieGrid
      ? this.game.zombieGrid.query(position.x, position.z, radius)
      : this.zombies;
    const radiusSq = radius * radius;
    for (let i = candidates.length - 1; i >= 0; i--) {
      const zombie = candidates[i];
      if (zombie.health <= 0) continue;
      const dx = zombie.mesh.position.x - position.x;
      const dz = zombie.mesh.position.z - position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / radius;
        this.damageZombie(zombie, damage * falloff);
      }
    }
  }

  killZombie(zombie) {
    const index = this.zombies.indexOf(zombie);
    if (index === -1) return;

    this.zombies.splice(index, 1);

    // Elite affix: Splitter — spawn 2 smaller copies on death
    if (zombie.isElite && zombie.affixes.includes("splitter") && !zombie._splitChild) {
      for (let i = 0; i < 2; i++) {
        _tmpOffset.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
        const splitPos = _tmpDropPos.copy(zombie.mesh.position).add(_tmpOffset);
        const typeDef = ENEMY_TYPES[zombie.type] || ENEMY_TYPES.normal;
        const mesh = createZombieMesh(zombie.type, typeDef);
        mesh.position.copy(splitPos);
        mesh.scale.multiplyScalar(0.6);

        const child = {
          mesh,
          type: zombie.type,
          typeDef,
          health: zombie.maxHealth * 0.3,
          maxHealth: zombie.maxHealth * 0.3,
          speed: zombie.speed * 1.3,
          damage: zombie.damage * 0.5,
          attackCooldown: 0,
          attackRate: 1,
          state: "chase",
          targetPosition: new THREE.Vector3(),
          ranged: false,
          attackRange: 1.5,
          projectileSpeed: 5,
          isBoss: false,
          bossState: null,
          bossTimer: 0,
          explodeOnDeath: false,
          explosionRadius: 0,
          explosionDamage: 0,
          isElite: false,
          affixes: [],
          shieldHP: 0,
          maxShieldHP: 0,
          canResurrect: false,
          _splitChild: true,
        };
        this.zombies.push(child);
        this.game.scene.add(mesh);
      }
    }

    // Necromancy modifier: chance to resurrect
    if (
      zombie.canResurrect &&
      !zombie.isBoss &&
      !zombie._resurrected &&
      this.game.stageSystem
    ) {
      const chance = this.game.stageSystem.getResurrectChance();
      if (Math.random() < chance) {
        const pos = zombie.mesh.position.clone();
        setTimeout(() => {
          if (!this.game.isPlaying) return;
          const typeDef = ENEMY_TYPES[zombie.type] || ENEMY_TYPES.normal;
          const mesh = createZombieMesh(zombie.type, typeDef);
          mesh.position.copy(pos);

          const revived = {
            mesh,
            type: zombie.type,
            typeDef,
            health: zombie.maxHealth * 0.5,
            maxHealth: zombie.maxHealth * 0.5,
            speed: zombie.speed,
            damage: zombie.damage,
            attackCooldown: 0,
            attackRate: 1,
            state: "chase",
            targetPosition: new THREE.Vector3(),
            ranged: zombie.ranged,
            attackRange: zombie.attackRange,
            projectileSpeed: zombie.projectileSpeed,
            isBoss: false,
            bossState: null,
            bossTimer: 0,
            explodeOnDeath: zombie.explodeOnDeath,
            explosionRadius: zombie.explosionRadius,
            explosionDamage: zombie.explosionDamage,
            isElite: false,
            affixes: [],
            shieldHP: 0,
            maxShieldHP: 0,
            canResurrect: false,
            _resurrected: true,
          };
          this.zombies.push(revived);
          this.game.scene.add(mesh);

          if (this.game.particleSystem) {
            this.game.particleSystem.spawn(pos, "enemyDeath", { count: 8 });
          }
        }, 3000);
      }
    }

    if (zombie.explodeOnDeath && this._explosionDepth < 3) {
      this._explosionDepth++;
      this.createExplosionEffect(
        zombie.mesh.position,
        zombie.explosionRadius,
        zombie.explosionDamage,
      );
      this._explosionDepth--;
    }

    if (zombie.isBoss) {
      this.createBossDeathEffect(zombie.mesh.position);
      this.bossActive = false;
      this.game.ui.hideBossHealthBar();
      if (this.game.postProcessing) {
        this.game.postProcessing.slowTime(0.15, 1.2);
        this.game.postProcessing.shake(1.5, 1.0);
        this.game.postProcessing.pulseBloom(0.8, 4.0);
      }
      if (this.game.treasureChestSystem) {
        this.game.treasureChestSystem.forceSpawn(zombie.mesh.position.clone());
      }
      // Stage boss defeated — trigger stage completion
      if (zombie.isStageBoss && this.game.stageSystem) {
        this.game.stageSystem.onStageBossDefeated();
      }
    } else {
      this.createDeathEffect(zombie.mesh.position, zombie.type);
    }

    if (this.game.dropXPGem) {
      const xpMult = Math.min(zombie.typeDef?.xpMult || 1, 5);
      const eliteMult = zombie.isElite ? 2.5 : 1;
      const baseXP = Math.max(
        1,
        Math.ceil(Math.sqrt(zombie.maxHealth / 25) * xpMult * eliteMult),
      );
      _tmpDropPos.copy(zombie.mesh.position);
      this.game.dropXPGem(_tmpDropPos, baseXP);

      if (zombie.isBoss) {
        for (let i = 0; i < 5; i++) {
          _tmpOffset.set((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3);
          _tmpDropPos.copy(zombie.mesh.position).add(_tmpOffset);
          this.game.dropXPGem(_tmpDropPos, baseXP);
        }
      }
    }

    zombie.mesh.visible = false;
    this.game.scene.remove(zombie.mesh);

    if (zombie.type === "normal") {
      this.zombiePool.push(zombie.mesh);
    }

    this.game.addKill();
    const scoreMultiplier = zombie.isBoss ? 10 : zombie.typeDef?.xpMult || 1;
    this.game.addScore(Math.floor(100 * scoreMultiplier));

    // Arcana: Harvester — chance to drop healing orb
    if (this.game.arcanaSystem) {
      const effects = this.game.arcanaSystem.getActiveEffects();
      if (effects.healDropChance && Math.random() < effects.healDropChance) {
        this.game.player.health = Math.min(
          this.game.player.maxHealth,
          this.game.player.health + 10,
        );
      }
      // Arcana: Golden Touch — enemies drop extra gold
      if (effects.enemyGoldDrop) {
        const gold = this.game.powerUpSystem.addGold(5);
        this.game.gold += gold;
      }
    }

    if (zombie.isBoss) {
      this.game.audioManager.playSound("explosion");
    } else {
      this.game.audioManager.playSound("zombieDeath");
    }
  }

  createExplosionEffect(position, radius, damage) {
    const playerPos = this.game.player.getPosition();
    const dx = position.x - playerPos.x;
    const dz = position.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < radius) {
      const falloff = 1 - dist / radius;
      this.game.player.takeDamage(damage * falloff);
    }

    this.damageInRadius(position, radius, damage);

    if (this._activeExplosions >= this._maxActiveExplosions) {
      this.game.audioManager.playSound("explosion");
      return;
    }
    this._activeExplosions++;

    if (!ZombieManager._sharedExpGeo) {
      ZombieManager._sharedExpGeo = new THREE.SphereGeometry(1, 10, 10);
      ZombieManager._sharedRingGeo = new THREE.RingGeometry(0.8, 1.2, 16);
    }

    if (!ZombieManager._sharedExpMat) {
      ZombieManager._sharedExpMat = new THREE.MeshBasicMaterial({
        color: 0xff5500, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      ZombieManager._sharedRingMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
    }

    const fireball = new THREE.Mesh(ZombieManager._sharedExpGeo, ZombieManager._sharedExpMat.clone());
    fireball.position.copy(position);
    fireball.position.y = 1;
    fireball.scale.setScalar(0.1);
    this.game.scene.add(fireball);

    const ring = new THREE.Mesh(ZombieManager._sharedRingGeo, ZombieManager._sharedRingMat.clone());
    ring.position.copy(position);
    ring.position.y = 0.2;
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(0.1);
    this.game.scene.add(ring);

    this._explosionAnims.push({
      fireball, ring, scale: 0.1, opacity: 1, targetScale: radius,
    });

    this.game.audioManager.playSound("explosion");
  }

  createBossDeathEffect(position) {
    if (this.game.particleSystem) {
      this.game.particleSystem.spawn(position, "bossDeath");
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (this.game.particleSystem) {
            this.game.particleSystem.spawn(position, "bossDeath");
            this.game.particleSystem.createShockwave(
              position,
              6 + i * 3,
              i === 0 ? 0xcc2200 : i === 1 ? 0x881100 : 0xffaa44,
              0.8 + i * 0.3,
            );
          }
        }, i * 300);
      }
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
