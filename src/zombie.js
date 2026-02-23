import * as THREE from "three";
import { ENEMY_TYPES, createZombieMesh } from "./zombies/zombieMeshFactory.js";
import {
  updateZombieBehavior,
  updateEnemyProjectiles,
} from "./zombies/zombieAI.js";

const _tmpKnock = new THREE.Vector3();
const _tmpTextPos = new THREE.Vector3();
const _tmpHitPos = new THREE.Vector3();

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

  spawnZombie(speed, health, type = null) {
    const spawnPos = this.getSpawnPosition();

    if (type === null) {
      type = this.getRandomEnemyType();
    }

    const typeDef = ENEMY_TYPES[type] || ENEMY_TYPES.normal;

    const mesh = createZombieMesh(type, typeDef);
    mesh.position.copy(spawnPos);

    const finalHealth = health * typeDef.healthMult;
    const finalSpeed = speed * typeDef.speedMult;
    const finalDamage = 10 * typeDef.damageMult;

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
    const waveNumber = this.game.wave || 1;
    const roll = Math.random();

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

    return new THREE.Vector3(x, 0, z);
  }

  update(delta) {
    const playerPos = this.game.player.getPosition();

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      updateZombieBehavior(
        this.zombies[i],
        playerPos,
        delta,
        this.game,
        this.enemyProjectiles,
      );
    }

    updateEnemyProjectiles(delta, this.game, this.enemyProjectiles);

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
    const finalDamage = isCrit ? rawDamage * 2 : rawDamage;

    zombie.health -= finalDamage;

    const body = zombie.mesh.userData.body;
    if (body) {
      body.material.emissive.setHex(isCrit ? 0xffaa00 : 0xffffff);
      setTimeout(() => {
        if (body.material) {
          body.material.emissive.setHex(0x000000);
        }
      }, 50);
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
    const snapshot = this.zombies.slice();
    for (const zombie of snapshot) {
      if (zombie.health <= 0) continue;
      const dx = zombie.mesh.position.x - position.x;
      const dz = zombie.mesh.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        this.damageZombie(zombie, damage * falloff);
      }
    }
  }

  killZombie(zombie) {
    const index = this.zombies.indexOf(zombie);
    if (index === -1) return;

    this.zombies.splice(index, 1);

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
    } else {
      this.createDeathEffect(zombie.mesh.position, zombie.type);
    }

    if (this.game.dropXPGem) {
      const xpMult = Math.min(zombie.typeDef?.xpMult || 1, 5);
      const baseXP = Math.max(
        1,
        Math.ceil(Math.sqrt(zombie.maxHealth / 25) * xpMult),
      );
      this.game.dropXPGem(zombie.mesh.position.clone(), baseXP);

      if (zombie.isBoss) {
        for (let i = 0; i < 5; i++) {
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            0,
            (Math.random() - 0.5) * 3,
          );
          this.game.dropXPGem(
            zombie.mesh.position.clone().add(offset),
            baseXP,
          );
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

    const fireball = new THREE.Mesh(
      ZombieManager._sharedExpGeo,
      new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    fireball.position.copy(position);
    fireball.position.y = 1;
    fireball.scale.setScalar(0.1);
    this.game.scene.add(fireball);

    const ring = new THREE.Mesh(
      ZombieManager._sharedRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.position.copy(position);
    ring.position.y = 0.2;
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(0.1);
    this.game.scene.add(ring);

    let scale = 0.1;
    let opacity = 1;
    const targetScale = radius;

    const animate = () => {
      scale += (targetScale - scale) * 0.25;
      opacity -= 0.06;

      if (opacity <= 0) {
        this.game.scene.remove(fireball);
        this.game.scene.remove(ring);
        fireball.material.dispose();
        ring.material.dispose();
        this._activeExplosions--;
      } else {
        fireball.scale.setScalar(scale);
        fireball.material.opacity = opacity * 0.85;
        ring.scale.setScalar(scale * 1.5);
        ring.material.opacity = opacity * 0.4;
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
