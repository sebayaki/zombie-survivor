import * as THREE from "three";
import { EVOLUTION_RECIPES } from "./evolutionSystem.js";
import { AUTO_WEAPONS } from "./weapons/weaponDefinitions.js";
import { WeaponMeshFactory } from "./weapons/weaponMeshFactory.js";
import {
  homingBehavior,
  orbitBehavior,
  wallBounceBehavior,
  areaDamage,
  knockback,
  fadeTraverse,
  wingFlap,
} from "./weapons/weaponBehaviors.js";

export { AUTO_WEAPONS };

// Reusable temp vectors for hot loops (avoids GC pressure)
const _tv1 = new THREE.Vector3();
const _tv2 = new THREE.Vector3();



export class AutoWeaponSystem {
  constructor(game) {
    this.game = game;

    this.equippedWeapons = [];
    this.projectiles = [];
    this.effects = [];
    this.cooldowns = {};

    this.maxProjectiles = 120;
    this.maxEffects = 40;

    this._activeExplosions = 0;
    this._maxActiveExplosions = 8;
    this._explosionLightCount = 0;
    this._maxExplosionLights = 2;

    this._sharedExpGeo = null;
    this._sharedRingGeo = null;

    this.meshFactory = new WeaponMeshFactory();
  }


  reset() {
    // Clear weapons
    this.equippedWeapons = [];

    // Clear projectiles
    this.projectiles.forEach((p) => {
      this.game.scene.remove(p.mesh);
      this.disposeObject(p.mesh);
    });
    this.projectiles = [];

    // Clear effects
    this.effects.forEach((e) => {
      if (e.mesh) {
        this.game.scene.remove(e.mesh);
        this.disposeObject(e.mesh);
      }
    });
    this.effects = [];

    // Reset cooldowns
    this.cooldowns = {};
  }

  // Get a weapon's current stats (base + level bonuses)
  getWeaponStats(weaponId, level) {
    // Check if this is an evolved weapon
    if (EVOLUTION_RECIPES[weaponId]) {
      return this.game.evolutionSystem.getEvolvedStats(weaponId);
    }

    const def = AUTO_WEAPONS[weaponId];
    if (!def) return null;

    const stats = { ...def.baseStats };

    // Apply level bonuses
    for (let i = 0; i < level && i < def.levelBonuses.length; i++) {
      const bonus = def.levelBonuses[i];
      for (const [key, value] of Object.entries(bonus)) {
        if (stats[key] !== undefined) {
          stats[key] += value;
        } else {
          stats[key] = value;
        }
      }
    }

    // Apply player stat bonuses
    const playerStats = this.game.playerStats || {};
    if (playerStats.might) stats.damage *= 1 + playerStats.might * 0.1;
    if (playerStats.area) stats.area *= 1 + playerStats.area * 0.1;
    if (playerStats.speed && stats.projectileSpeed) stats.projectileSpeed *= 1 + playerStats.speed * 0.1;
    if (playerStats.duration && stats.duration) stats.duration *= 1 + playerStats.duration * 0.1;
    if (playerStats.cooldown) stats.cooldown *= 1 - playerStats.cooldown * 0.05;
    if (playerStats.amount && stats.projectileCount) stats.projectileCount += playerStats.amount;

    // Apply arcana effects
    if (this.game.arcanaSystem) {
      const arcana = this.game.arcanaSystem.getActiveEffects();
      if (arcana.damageMult) stats.damage *= arcana.damageMult;
      if (arcana.bonusAmount && stats.projectileCount) stats.projectileCount += arcana.bonusAmount;
      if (arcana.cooldownMult) stats.cooldown *= arcana.cooldownMult;

      // Berserker's Rage: damage scales inversely with HP ratio
      if (arcana.berserkerRage && this.game.player) {
        const hpRatio = this.game.player.health / this.game.player.maxHealth;
        const rageBonus = 1 + (1 - hpRatio);
        stats.damage *= rageBonus;
      }
    }

    return stats;
  }

  // Add or upgrade a weapon
  addWeapon(weaponId) {
    const existing = this.equippedWeapons.find((w) => w.id === weaponId);

    if (existing) {
      // Upgrade existing weapon
      const def = AUTO_WEAPONS[weaponId];
      if (existing.level < def.maxLevel) {
        existing.level++;
        console.log(`${def.name} upgraded to level ${existing.level}`);
        return true;
      }
      return false; // Already max level
    } else {
      // Add new weapon
      this.equippedWeapons.push({
        id: weaponId,
        level: 1,
      });
      this.cooldowns[weaponId] = 0;
      console.log(`Acquired ${AUTO_WEAPONS[weaponId].name}!`);
      return true;
    }
  }

  // Check if player has weapon
  hasWeapon(weaponId) {
    return this.equippedWeapons.some((w) => w.id === weaponId);
  }

  // Get weapon level
  getWeaponLevel(weaponId) {
    const weapon = this.equippedWeapons.find((w) => w.id === weaponId);
    return weapon ? weapon.level : 0;
  }

  // Get list of upgradeable weapons (for level up selection)
  getAvailableUpgrades() {
    const upgrades = [];

    // Add upgrades for owned weapons that aren't max level
    for (const weapon of this.equippedWeapons) {
      const def = AUTO_WEAPONS[weapon.id];
      if (!def) continue; // evolved weapon — not upgradeable via normal path
      if (weapon.level < def.maxLevel) {
        upgrades.push({
          type: "weapon",
          id: weapon.id,
          name: def.name,
          rarity: def.rarity || "common",
          icon: def.icon,
          iconColor: def.iconColor,
          description: `Level ${weapon.level + 1}: ${this.getUpgradeDescription(weapon.id, weapon.level + 1)}`,
          currentLevel: weapon.level,
        });
      }
    }

    // Add new weapons player doesn't have, ONLY IF we haven't reached the max slots (6)
    const MAX_WEAPON_SLOTS = 6;
    if (this.equippedWeapons.length < MAX_WEAPON_SLOTS) {
      for (const [id, def] of Object.entries(AUTO_WEAPONS)) {
        if (!this.hasWeapon(id)) {
          upgrades.push({
            type: "weapon",
            id: id,
            name: def.name,
            rarity: def.rarity || "common",
            icon: def.icon,
            iconColor: def.iconColor,
            description: def.description,
            currentLevel: 0,
          });
        }
      }
    }

    return upgrades;
  }

  getUpgradeDescription(weaponId, level) {
    const def = AUTO_WEAPONS[weaponId];
    if (!def || level < 1 || level > def.levelBonuses.length) return "";

    const bonus = def.levelBonuses[level - 1];
    const parts = [];

    for (const [key, value] of Object.entries(bonus)) {
      const sign = value > 0 ? "+" : "";
      switch (key) {
        case "damage":
          parts.push(`${sign}${value} Damage`);
          break;
        case "projectileCount":
          parts.push(`${sign}${value} Projectile`);
          break;
        case "cooldown":
          parts.push(`${sign}${value}s Cooldown`);
          break;
        case "area":
          parts.push(`${sign}${Math.round(value * 100)}% Area`);
          break;
        case "pierce":
          parts.push(`${sign}${value} Pierce`);
          break;
        case "duration":
          parts.push(`${sign}${value}s Duration`);
          break;
        default:
          parts.push(`${sign}${value} ${key}`);
      }
    }

    return parts.join(", ") || "Base stats";
  }

  update(delta) {
    const now = performance.now() / 1000;
    const playerPos = this.game.player.getPosition();
    const playerDir = this.game.player.getDirection();
    const zombies = this.game.zombieManager.getZombies();

    // Update each equipped weapon
    for (const weapon of this.equippedWeapons) {
      const stats = this.getWeaponStats(weapon.id, weapon.level);
      const lastFire = this.cooldowns[weapon.id] || 0;

      if (now - lastFire >= stats.cooldown) {
        // Ready to fire! Pass level for visual scaling
        this.fireWeapon(
          weapon.id,
          stats,
          playerPos,
          playerDir,
          zombies,
          weapon.level,
        );
        this.cooldowns[weapon.id] = now;
      }
    }

    // Update projectiles
    this.updateProjectiles(delta);

    // Update effects (garlic aura, holy water pools, etc.)
    this.updateEffects(delta);
  }

  getLevelScale(level) {
    return 0.5 + (level - 1) * 0.08;
  }

  fireWeapon(weaponId, stats, playerPos, playerDir, zombies, level = 1) {
    const scale = this.getLevelScale(level);

    // Check if this is an evolved weapon
    if (EVOLUTION_RECIPES[weaponId]) {
      this.fireEvolvedWeapon(weaponId, stats, playerPos, playerDir, zombies);
      return;
    }

    switch (weaponId) {
      case "magicWand":
        this.fireMagicWand(stats, playerPos, zombies, scale);
        break;
      case "whip":
        this.fireWhip(stats, playerPos, playerDir, scale);
        break;
      case "knife":
        this.fireKnife(stats, playerPos, playerDir, Math.max(scale, 0.8));
        break;
      case "axe":
        this.fireAxe(stats, playerPos, scale);
        break;
      case "garlic":
        this.fireGarlic(stats, playerPos, scale);
        break;
      case "cross":
        this.fireCross(stats, playerPos, zombies, scale);
        break;
      case "fireWand":
        this.fireFireWand(stats, playerPos, zombies, scale);
        break;
      case "lightning":
        this.fireLightning(stats, playerPos, zombies, scale);
        break;
      case "runetracer":
        this.fireRunetracer(stats, playerPos, scale);
        break;
      case "holyWater":
        this.fireHolyWater(stats, playerPos, zombies, scale);
        break;
      // New weapons
      case "bone":
        this.fireBone(stats, playerPos, zombies, scale);
        break;
      case "magicMissile":
        this.fireMagicMissile(stats, playerPos, zombies, scale);
        break;
      case "peachone":
        this.fireOrbitingBird(stats, playerPos, "peachone", scale);
        break;
      case "ebonyWings":
        this.fireOrbitingBird(stats, playerPos, "ebonyWings", scale);
        break;
      case "pentagram":
        this.firePentagram(stats, playerPos, scale);
        break;
      case "clockLancet":
        this.fireClockLancet(stats, playerPos, zombies, scale);
        break;
      case "laurel":
        // Laurel is passive - handled separately
        break;
    }
  }

  // Fire evolved weapons with spectacular effects
  fireEvolvedWeapon(weaponId, stats, playerPos, playerDir, zombies) {
    switch (weaponId) {
      case "holyWand":
        this.fireHolyWand(stats, playerPos, zombies);
        break;
      case "bloodyTear":
        this.fireBloodyTear(stats, playerPos, playerDir);
        break;
      case "thousandEdge":
        this.fireThousandEdge(stats, playerPos, playerDir);
        break;
      case "deathSpiral":
        this.fireDeathSpiral(stats, playerPos);
        break;
      case "soulEater":
        this.fireSoulEater(stats, playerPos);
        break;
      case "heavenSword":
        this.fireHeavenSword(stats, playerPos, zombies);
        break;
      case "hellfire":
        this.fireHellfire(stats, playerPos, zombies);
        break;
      case "thunderLoop":
        this.fireThunderLoop(stats, playerPos, zombies);
        break;
      case "noFuture":
        this.fireNoFuture(stats, playerPos);
        break;
      case "laBorra":
        this.fireLaBorra(stats, playerPos, zombies);
        break;
      case "skullOManiac":
        this.fireSkullOManiac(stats, playerPos, zombies);
        break;
      case "guidedMeteor":
        this.fireGuidedMeteor(stats, playerPos, zombies);
        break;
      case "vandalier":
        this.fireVandalier(stats, playerPos);
        break;
      case "gorgeousMoon":
        this.fireGorgeousMoon(stats, playerPos);
        break;
      case "infiniteCorridor":
        this.fireInfiniteCorridor(stats, playerPos, zombies);
        break;
      case "crimsonShroud":
        this.fireCrimsonShroud(stats, playerPos);
        break;
    }
  }

  // Holy Wand - rapid divine projectiles
  fireHolyWand(stats, playerPos, zombies) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      const group = this.meshFactory.createHolyWandMesh();

      group.position.copy(playerPos);
      group.position.y = 1;

      // Point towards target
      group.rotation.y = Math.atan2(direction.x, direction.z);

      this.game.scene.add(group);

      this.projectiles.push({
        type: "holyWand",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("shoot");
  }

  // Bloody Tear - lifesteal whip
  fireBloodyTear(stats, playerPos, playerDir) {
    for (let i = 0; i < stats.projectileCount; i++) {
      const dir = i === 0 ? playerDir.clone() : playerDir.clone().negate();

      const group = new THREE.Group();
      const width = 8 * stats.area;

      const slash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.7, width, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      slash.rotation.z = Math.PI / 2;
      slash.position.x = width / 2;
      group.add(slash);

      const aura = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 1.0, width * 0.9, 8),
        new THREE.MeshBasicMaterial({
          color: 0x880000,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      aura.rotation.z = Math.PI / 2;
      aura.position.x = width / 2;
      group.add(aura);

      for (let d = 0; d < 5; d++) {
        const drip = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 4, 4),
          new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
          }),
        );
        drip.position.set(
          Math.random() * width,
          -0.3,
          (Math.random() - 0.5) * 0.4,
        );
        group.add(drip);
      }

      group.position.copy(playerPos);
      group.position.y = 1;
      group.rotation.y = Math.atan2(dir.x, dir.z);

      this.game.scene.add(group);

      this.effects.push({
        type: "bloodyTear",
        mesh: group,
        position: playerPos.clone(),
        direction: dir,
        damage: stats.damage,
        area: width,
        knockback: stats.knockback,
        lifesteal: stats.lifesteal,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("whip");
    if (this.game.screenShake) this.game.screenShake(0.5, 0.2); // Bloody Tear deserves a shake
  }

  // Thousand Edge - knife storm
  fireThousandEdge(stats, playerPos, playerDir) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const spread = (i - (stats.projectileCount - 1) / 2) * 0.3;
      const dir = playerDir.clone();
      dir.x += spread;
      dir.normalize();

      const mesh = this.meshFactory.createEvolvedKnifeMesh();
      mesh.scale.setScalar(1.5);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      // Orient correctly along movement vector
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = Math.atan2(dir.x, dir.z);

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "thousandEdge",
        mesh: mesh,
        direction: dir,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("knife");
  }

  // Death Spiral - orbiting axes
  fireDeathSpiral(stats, playerPos) {
    const orbitRadius = stats.orbitRadius || 5;

    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const angle = (i / stats.projectileCount) * Math.PI * 2;

      const mesh = this.meshFactory.createAxeMesh();
      mesh.scale.setScalar(1.8);

      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x660000,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        }),
      );
      mesh.add(aura);

      mesh.position.copy(playerPos);
      mesh.position.x += Math.cos(angle) * orbitRadius;
      mesh.position.z += Math.sin(angle) * orbitRadius;
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "deathSpiral",
        mesh: mesh,
        centerPos: playerPos.clone(),
        angle: angle,
        orbitRadius: orbitRadius,
        orbitSpeed: 3, // Faster orbit
        damage: stats.damage,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
        hitCooldowns: {},
      });
    }

    this.game.audioManager.playSound("axe");
  }

  // Soul Eater - massive damage aura with lifesteal
  fireSoulEater(stats, playerPos) {
    const group = new THREE.Group();

    // Dark purple aura
    const auraGeometry = new THREE.RingGeometry(0, stats.area, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0x440066,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.rotation.x = -Math.PI / 2;
    group.add(aura);

    for (let i = 0; i < 4; i++) {
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 4, 4),
        new THREE.MeshBasicMaterial({
          color: 0x88ff88,
          transparent: true,
          opacity: 0.5,
        }),
      );
      const angle = (i / 4) * Math.PI * 2;
      wisp.position.set(
        Math.cos(angle) * stats.area * 0.6,
        0.4,
        Math.sin(angle) * stats.area * 0.6,
      );
      group.add(wisp);
    }

    group.position.copy(playerPos);
    group.position.y = 0.1;

    this.game.scene.add(group);

    // Damage enemies and heal
    const zombies = this.game.zombieManager.getZombies();
    let totalHealed = 0;
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        this.game.zombieManager.damageZombie(zombie, stats.damage);
        totalHealed += stats.lifesteal;

        // Knockback
        if (stats.knockback) {
          const dir = new THREE.Vector3();
          dir.subVectors(zombie.mesh.position, playerPos);
          dir.normalize();
          zombie.mesh.position.add(dir.multiplyScalar(stats.knockback));
        }
      }
    }

    // Apply lifesteal
    if (totalHealed > 0 && this.game.player) {
      this.game.player.health = Math.min(
        this.game.player.maxHealth,
        this.game.player.health + totalHealed,
      );
    }

    this.effects.push({
      type: "soulEater",
      mesh: group,
      duration: stats.duration,
      elapsed: 0,
    });
  }

  // Heaven Sword - homing divine blades
  fireHeavenSword(stats, playerPos, zombies) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      const group = this.meshFactory.createHeavenSwordMesh();

      group.position.copy(playerPos);
      group.position.y = 1.5;

      // Orient towards target
      group.rotation.x = Math.PI / 2; // Lie flat initially
      group.rotation.z = Math.atan2(direction.x, direction.z);

      this.game.scene.add(group);

      this.projectiles.push({
        type: "heavenSword",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        homing: true,
        homingStrength: stats.homingStrength,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("cross");
  }

  // Hellfire - massive fire rain
  fireHellfire(stats, playerPos, zombies) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      let targetPos;
      if (zombies.length > 0) {
        const idx = Math.floor(Math.random() * zombies.length);
        targetPos = zombies[idx].mesh.position.clone();
      } else {
        const angle = Math.random() * Math.PI * 2;
        targetPos = playerPos.clone();
        targetPos.x += Math.cos(angle) * 8;
        targetPos.z += Math.sin(angle) * 8;
      }

      const mesh = this.meshFactory.createFireballMesh();
      mesh.scale.setScalar(2.5);

      mesh.position.copy(targetPos);
      mesh.position.y = 30; // Start from very high above

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "hellfire",
        mesh: mesh,
        targetPos: targetPos,
        startY: 30,
        fallSpeed: 40,
        damage: stats.damage,
        explosionRadius: stats.explosionRadius * 1.5, // Larger explosion
        elapsed: 0,
        duration: 3,
      });
    }

    this.game.audioManager.playSound("fireball");
  }

  // Thunder Loop - chain lightning
  fireThunderLoop(stats, playerPos, zombies) {
    const inRangeZombies = zombies.filter((z) => {
      return z.mesh.position.distanceTo(playerPos) < stats.area;
    });

    if (inRangeZombies.length === 0) return;

    // Initial targets
    const initialTargets = [];
    for (let i = 0; i < stats.projectileCount; i++) {
      const idx = Math.floor(Math.random() * inRangeZombies.length);
      initialTargets.push(inRangeZombies[idx]);
    }

    // Chain lightning effect
    for (const firstTarget of initialTargets) {
      let currentTarget = firstTarget;
      let chainedTargets = new Set([currentTarget]);
      let chainCount = stats.chainCount || 5;

      const createChainEffect = (from, to) => {
        const fromPos =
          from instanceof THREE.Vector3 ? from : from.mesh.position;
        const toPos = to.mesh.position;

        // Create lightning bolt between points
        const points = [fromPos.clone()];
        const segments = 5;
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const point = new THREE.Vector3().lerpVectors(fromPos, toPos, t);
          point.x += (Math.random() - 0.5) * 1;
          point.y += (Math.random() - 0.5) * 1 + 1;
          point.z += (Math.random() - 0.5) * 1;
          points.push(point);
        }
        points.push(toPos.clone());

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(
          curve,
          segments * 2,
          0.18,
          6,
          false,
        );
        const tubeMaterial = new THREE.MeshBasicMaterial({
          color: 0xccaa44,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const bolt = new THREE.Mesh(tubeGeometry, tubeMaterial);

        const coreGeometry = new THREE.TubeGeometry(
          curve,
          segments * 2,
          0.06,
          6,
          false,
        );
        const coreMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        bolt.add(core);

        this.game.scene.add(bolt);

        // Damage target
        this.game.zombieManager.damageZombie(to, stats.damage);

        // Fade out
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.1;
          if (opacity <= 0) {
            this.game.scene.remove(bolt);
            tubeGeometry.dispose();
            tubeMaterial.dispose();
            coreGeometry.dispose();
            coreMaterial.dispose();
          } else {
            tubeMaterial.opacity = opacity * 0.6;
            coreMaterial.opacity = opacity * 0.9;
            requestAnimationFrame(fadeOut);
          }
        };
        setTimeout(fadeOut, 100);
      };

      // Chain to nearby enemies
      let prevPos = playerPos;
      for (let c = 0; c < chainCount && currentTarget; c++) {
        createChainEffect(prevPos, currentTarget);
        prevPos = currentTarget.mesh.position;

        // Find next target
        let nextTarget = null;
        let nearestDist = Infinity;
        for (const z of inRangeZombies) {
          if (chainedTargets.has(z)) continue;
          const dist = z.mesh.position.distanceTo(currentTarget.mesh.position);
          if (dist < 5 && dist < nearestDist) {
            nearestDist = dist;
            nextTarget = z;
          }
        }

        if (nextTarget) {
          chainedTargets.add(nextTarget);
          currentTarget = nextTarget;
        } else {
          break;
        }
      }
    }

    this.game.audioManager.playSound("lightning");
  }

  // NO FUTURE - exploding bouncing doom orb
  fireNoFuture(stats, playerPos) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const angle = (i / stats.projectileCount) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      const group = this.meshFactory.createNoFutureMesh();

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "noFuture",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        duration: stats.duration,
        elapsed: 0,
        bounces: true,
        explosionOnBounce: stats.explosionOnBounce,
        explosionRadius: stats.explosionRadius,
        hitEnemies: new Set(),
        hitCooldowns: {},
      });
    }

    this.game.audioManager.playSound("runetracer");
  }

  // La Borra - massive slowing pools
  fireLaBorra(stats, playerPos, zombies) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddEffect()) break;
      let targetPos;
      if (zombies.length > 0) {
        const idx = Math.floor(Math.random() * Math.min(5, zombies.length));
        targetPos = zombies[idx].mesh.position.clone();
      } else {
        const angle = Math.random() * Math.PI * 2;
        targetPos = playerPos.clone();
        targetPos.x += Math.sin(angle) * 5;
        targetPos.z += Math.cos(angle) * 5;
      }

      // Create massive bright cyan plasma pool
      const group = new THREE.Group();

      const poolCore = new THREE.Mesh(
        new THREE.CircleGeometry(stats.area * 0.7, 32),
        new THREE.MeshBasicMaterial({
          color: 0x882200,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      poolCore.rotation.x = -Math.PI / 2;
      group.add(poolCore);

      const poolAura = new THREE.Mesh(
        new THREE.CircleGeometry(stats.area, 32),
        new THREE.MeshBasicMaterial({
          color: 0x440000,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      poolAura.rotation.x = -Math.PI / 2;
      poolAura.position.y = -0.01;
      group.add(poolAura);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(
          stats.area * 0.5,
          stats.area * 0.6,
          16,
        ),
        new THREE.MeshBasicMaterial({
          color: 0xaa3300,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);

      const bubbles = [];
      for (let b = 0; b < 4; b++) {
        const bubble = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * stats.area * 0.6;
        bubble.position.set(
          Math.cos(angle) * dist,
          0.2 + Math.random() * 0.3,
          Math.sin(angle) * dist,
        );
        group.add(bubble);
        bubbles.push({
          mesh: bubble,
          startY: bubble.position.y,
          speed: 0.5 + Math.random(),
        });
      }

      group.position.copy(targetPos);
      group.position.y = 0.1;
      this.game.scene.add(group);

      this.effects.push({
        type: "laBorra",
        mesh: group,
        bubbles: bubbles, // Add bubbles to animate later if we want
        position: targetPos.clone(),
        damage: stats.damage,
        area: stats.area,
        tickRate: stats.tickRate,
        slowAmount: stats.slowAmount,
        duration: stats.duration,
        elapsed: 0,
        lastTick: 0,
      });
    }

    this.game.audioManager.playSound("splash");
  }

  // Skull O'Maniac - homing bone storm (bone + wings)
  fireSkullOManiac(stats, playerPos, zombies) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const angle = (i / stats.projectileCount) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      const group = new THREE.Group();

      // Skull core
      const skull = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffe0 }),
      );
      skull.scale.set(1, 1.1, 0.9);
      group.add(skull);

      // Eye sockets
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
      const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 4),
        eyeMat,
      );
      leftEye.position.set(-0.08, 0.05, 0.18);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 4),
        eyeMat,
      );
      rightEye.position.set(0.08, 0.05, 0.18);
      group.add(rightEye);

      // Ghostly trail
      const trail = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.6, 6),
        new THREE.MeshBasicMaterial({
          color: 0x88ff88,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      trail.position.z = -0.3;
      trail.rotation.x = -Math.PI / 2;
      group.add(trail);

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "skullOManiac",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        bounceCount: stats.bounceCount || 8,
        homing: true,
        homingStrength: stats.homingStrength || 4,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("throw");
  }

  // Guided Meteor - giant homing explosions (magicMissile + spellbinder)
  fireGuidedMeteor(stats, playerPos, zombies) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const angle = (i / stats.projectileCount) * Math.PI * 2 + Math.random() * 0.5;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      const group = new THREE.Group();

      // Fiery meteor core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff6600 }),
      );
      group.add(core);

      // Inner glow
      const innerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(innerGlow);

      // Outer corona
      const corona = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xff2200,
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(corona);

      // Flame trail
      const flameTrail = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 1.2, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff4400,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      flameTrail.position.z = -0.6;
      flameTrail.rotation.x = -Math.PI / 2;
      group.add(flameTrail);

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "guidedMeteor",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: 0,
        duration: stats.duration,
        elapsed: 0,
        homing: true,
        homingStrength: stats.homingStrength || 5,
        explosionRadius: stats.explosionRadius || 4,
        area: stats.area,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("shoot");
  }

  // Vandalier - merged orbiting bird (peachone + ebonyWings)
  fireVandalier(stats, playerPos) {
    const existingBirds = this.projectiles.filter((p) => p.type === "vandalier");
    if (existingBirds.length >= stats.projectileCount) return;

    const needed = stats.projectileCount - existingBirds.length;

    for (let i = 0; i < needed; i++) {
      const angle =
        ((existingBirds.length + i) / stats.projectileCount) * Math.PI * 2;

      const group = new THREE.Group();

      // Merged body - half white half dark
      const lightBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      lightBody.scale.set(1, 0.8, 1.5);
      group.add(lightBody);

      const darkBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8, Math.PI, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0x220044 }),
      );
      darkBody.scale.set(1, 0.8, 1.5);
      group.add(darkBody);

      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xccccdd }),
      );
      head.position.set(0, 0.12, 0.35);
      group.add(head);

      // Wings - light left, dark right
      const leftWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.05, 0.35),
        new THREE.MeshBasicMaterial({
          color: 0xddddff,
          transparent: true,
          opacity: 0.9,
        }),
      );
      leftWing.position.set(-0.35, 0, 0);
      leftWing.rotation.z = -0.3;
      group.add(leftWing);

      const rightWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.05, 0.35),
        new THREE.MeshBasicMaterial({
          color: 0x330055,
          transparent: true,
          opacity: 0.9,
        }),
      );
      rightWing.position.set(0.35, 0, 0);
      rightWing.rotation.z = 0.3;
      group.add(rightWing);

      // Dual-color eyes
      const lightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x000000 }),
      );
      lightEye.position.set(-0.07, 0.17, 0.46);
      group.add(lightEye);
      const darkEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      darkEye.position.set(0.07, 0.17, 0.46);
      group.add(darkEye);

      // Powerful merged aura
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xaa88ff,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(glow);

      const orbitRadius = stats.orbitRadius || 4.5;
      group.position.copy(playerPos);
      group.position.x += Math.cos(angle) * orbitRadius;
      group.position.z += Math.sin(angle) * orbitRadius;
      group.position.y = 1.5;

      this.game.scene.add(group);

      this.projectiles.push({
        type: "vandalier",
        mesh: group,
        angle: angle,
        orbitRadius: orbitRadius,
        orbitSpeed: stats.orbitSpeed || 4,
        damage: stats.damage,
        area: stats.area,
        duration: Infinity,
        elapsed: 0,
        hitCooldowns: {},
        wingAngle: 0,
        leftWing: leftWing,
        rightWing: rightWing,
      });
    }
  }

  // Gorgeous Moon - screen clear + bonus XP (pentagram + crown)
  fireGorgeousMoon(stats, playerPos) {
    const group = new THREE.Group();

    // Crescent moon shape using ring geometry
    const moonOuter = new THREE.Mesh(
      new THREE.RingGeometry(stats.area * 0.85, stats.area, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    moonOuter.rotation.x = -Math.PI / 2;
    group.add(moonOuter);

    // Inner golden fill
    const moonGlow = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    moonGlow.rotation.x = -Math.PI / 2;
    group.add(moonGlow);

    // Star sparkle pattern
    for (let i = 0; i < 8; i++) {
      const starAngle = (i / 8) * Math.PI * 2;
      const starDist = stats.area * (0.4 + Math.random() * 0.4);
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 4, 4),
        new THREE.MeshBasicMaterial({
          color: 0xffffaa,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      star.position.set(
        Math.cos(starAngle) * starDist,
        0.1,
        Math.sin(starAngle) * starDist,
      );
      group.add(star);
    }

    group.position.copy(playerPos);
    group.position.y = 0.1;
    group.scale.setScalar(0.1);

    this.game.scene.add(group);

    // Kill all enemies and grant bonus XP
    const zombies = [...this.game.zombieManager.getZombies()];
    let killCount = 0;
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        this.game.zombieManager.damageZombie(zombie, stats.damage, null, true);
        killCount++;
      }
    }

    // Bonus XP per kill
    if (killCount > 0 && stats.bonusXp && this.game.xpSystem) {
      const bonusTotal = killCount * stats.bonusXp;
      this.game.xpSystem.addXP(bonusTotal);
      this.game.ui.showMessage(`+${bonusTotal} Bonus XP!`);
    }

    if (this.game.screenShake) this.game.screenShake(1.5, 0.6);
    if (this.game.pulseBloom) this.game.pulseBloom(0.6, 4);

    // Animate expansion and fade
    let groupScale = 0.1;
    let opacity = 1.0;
    const animate = () => {
      groupScale += 0.1;
      opacity -= 0.02;

      if (opacity <= 0) {
        this.game.scene.remove(group);
        this.disposeObject(group);
      } else {
        group.scale.setScalar(groupScale);
        moonOuter.material.opacity = opacity * 0.8;
        moonGlow.material.opacity = opacity * 0.35;
        group.rotation.y += 0.03;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    this.game.audioManager.playSound("pentagram");
  }

  // Infinite Corridor - freeze + damage zone (clockLancet + stoneMask)
  fireInfiniteCorridor(stats, playerPos, zombies) {
    const group = new THREE.Group();

    // Temporal rift - outer swirl
    const riftOuter = new THREE.Mesh(
      new THREE.RingGeometry(stats.area * 0.9, stats.area, 48),
      new THREE.MeshBasicMaterial({
        color: 0x66ddff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    riftOuter.rotation.x = -Math.PI / 2;
    group.add(riftOuter);

    // Inner time distortion fill
    const riftInner = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area * 0.9, 48),
      new THREE.MeshBasicMaterial({
        color: 0x2288cc,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    riftInner.rotation.x = -Math.PI / 2;
    group.add(riftInner);

    // Concentric time rings
    for (let r = 1; r <= 3; r++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(
          stats.area * (r * 0.25) - 0.1,
          stats.area * (r * 0.25),
          32,
        ),
        new THREE.MeshBasicMaterial({
          color: 0xaaeeff,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01 * r;
      group.add(ring);
    }

    // Clock hands (thin, subtle)
    const handMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    });
    const hourLen = stats.area * 0.5;
    const hourGeo = new THREE.BoxGeometry(0.1, 0.02, hourLen);
    hourGeo.translate(0, 0, hourLen / 2);
    const hourHand = new THREE.Mesh(hourGeo, handMat);
    hourHand.position.y = 0.06;
    group.add(hourHand);

    const minLen = stats.area * 0.7;
    const minGeo = new THREE.BoxGeometry(0.06, 0.02, minLen);
    minGeo.translate(0, 0, minLen / 2);
    const minuteHand = new THREE.Mesh(minGeo, handMat);
    minuteHand.position.y = 0.07;
    group.add(minuteHand);

    group.position.copy(playerPos);
    group.position.y = 0.1;

    this.game.scene.add(group);

    // Freeze enemies in range
    const freezeDuration = stats.freezeDuration || 2.5;
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        if (!zombie.originalSpeed) {
          zombie.originalSpeed = zombie.speed;
        }
        zombie.speed = 0;
        zombie.isFrozen = true;

        zombie.mesh.traverse((child) => {
          if (child.material && child.material.color) {
            child.userData.originalColor = child.material.color.getHex();
            child.material.color.setHex(0x99aabb);
          }
        });

        setTimeout(() => {
          if (zombie.originalSpeed) {
            zombie.speed = zombie.originalSpeed;
            zombie.isFrozen = false;
            zombie.mesh.traverse((child) => {
              if (child.material && child.userData.originalColor) {
                child.material.color.setHex(child.userData.originalColor);
              }
            });
          }
        }, freezeDuration * 1000);
      }
    }

    this.effects.push({
      type: "infiniteCorridor",
      mesh: group,
      position: playerPos.clone(),
      damage: stats.damage,
      area: stats.area,
      tickRate: stats.tickRate || 0.4,
      duration: stats.duration,
      elapsed: 0,
      lastTick: 0,
      hourHand: hourHand,
      minuteHand: minuteHand,
    });

    this.game.audioManager.playSound("lightning");
  }

  // Crimson Shroud - auto-shield + reflect (laurel + tiragisu)
  fireCrimsonShroud(stats, playerPos) {
    const group = new THREE.Group();

    // Shield dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xff2244,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    group.add(dome);

    // Shield ring at base
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.55, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff4466,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    // Inner glow pillar
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 2.5, 16),
      new THREE.MeshBasicMaterial({
        color: 0xff0033,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    pillar.position.y = 1.25;
    group.add(pillar);

    group.position.copy(playerPos);
    group.position.y = 0;

    this.game.scene.add(group);

    // Grant invulnerability for the shield duration
    if (this.game.player) {
      this.game.player.invulnerable = true;
      this.game.player.invulnerableTime = stats.shieldDuration || 3.0;
    }

    this.effects.push({
      type: "crimsonShroud",
      mesh: group,
      duration: stats.shieldDuration || 3.0,
      elapsed: 0,
      reflectDamage: stats.reflectDamage || 30,
      reflectRadius: stats.reflectRadius || 5,
      lastReflectTick: 0,
    });

    this.game.audioManager.playSound("levelUp");
  }

  // Magic Wand - fires at nearest enemy
  fireMagicWand(stats, playerPos, zombies, scale = 1) {
    if (zombies.length === 0) return;

    const grid = this.game.zombieGrid;
    const nearby = grid
      ? grid.query(playerPos.x, playerPos.z, this.game.autoAimRange)
      : zombies;
    if (nearby.length === 0) return;

    const count = Math.min(stats.projectileCount, nearby.length);
    const targets = [];
    const used = new Set();
    for (let k = 0; k < count; k++) {
      let bestDist = Infinity;
      let best = null;
      for (const z of nearby) {
        if (used.has(z)) continue;
        const dx = z.mesh.position.x - playerPos.x;
        const dz = z.mesh.position.z - playerPos.z;
        const d = dx * dx + dz * dz;
        if (d < bestDist) { bestDist = d; best = z; }
      }
      if (best) { targets.push(best); used.add(best); }
    }

    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;

      const target = targets[i % targets.length];
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();
      // Slight spread for machinegun feel
      direction.x += (Math.random() - 0.5) * 0.08;
      direction.z += (Math.random() - 0.5) * 0.08;
      direction.normalize();

      // Tracer round: bright tip + visible trail
      const group = new THREE.Group();

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      tip.position.z = 0.5;
      group.add(tip);

      const tipGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 6, 6),
        new THREE.MeshBasicMaterial({
          color: 0xffeedd,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      );
      tipGlow.position.z = 0.5;
      group.add(tipGlow);

      const coreTrail = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xfff8dd }),
      );
      group.add(coreTrail);

      const glowTrail = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.12, 1.8),
        new THREE.MeshBasicMaterial({
          color: 0xdd7700,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        }),
      );
      glowTrail.position.z = -0.25;
      group.add(glowTrail);

      group.position.copy(playerPos);
      group.position.y = 1;
      group.rotation.y = Math.atan2(direction.x, direction.z);
      this.game.scene.add(group);

      this.projectiles.push({
        type: "magicWand",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        area: stats.area,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    // Throttled machinegun sound
    const now = performance.now();
    if (!this._mgWandSoundTime || now - this._mgWandSoundTime > 120) {
      this._mgWandSoundTime = now;
      this.game.audioManager.playSound("machinegun");
    }
  }

  // Whip - wide firewall slash
  fireWhip(stats, playerPos, playerDir, scale = 1) {
    const attackPositions = [playerPos.clone()];

    if (stats.projectileCount >= 2) {
      attackPositions.push(playerPos.clone());
    }

    for (let i = 0; i < attackPositions.length; i++) {
      const pos = attackPositions[i];
      const dir = i === 0 ? playerDir.clone() : playerDir.clone().negate();

      const width = 5 * stats.area * scale;
      const group = new THREE.Group();

      // Bright slash core
      const slash = new THREE.Mesh(
        new THREE.PlaneGeometry(width, 1.4),
        new THREE.MeshBasicMaterial({
          color: 0xffaa55,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      slash.position.set(width / 2, 1.0, 0);
      slash.rotation.y = Math.PI;
      group.add(slash);

      // Wide heat glow
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.1, 2.2),
        new THREE.MeshBasicMaterial({
          color: 0xff4400,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      glow.position.set(width / 2, 1.0, 0);
      group.add(glow);

      // Ground scorch
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.1, 2.0),
        new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(width / 2, 0.05, 0);
      group.add(ground);

      // Ember sparks along the slash
      for (let s = 0; s < 6; s++) {
        const ember = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 4, 4),
          new THREE.MeshBasicMaterial({
            color: 0xffcc44,
            transparent: true,
            opacity: 0.8,
          }),
        );
        ember.position.set(
          Math.random() * width,
          0.6 + Math.random() * 1.0,
          (Math.random() - 0.5) * 0.6,
        );
        group.add(ember);
      }

      group.position.copy(pos);
      group.position.y = 0.1;
      group.rotation.y = Math.atan2(dir.x, dir.z);

      this.game.scene.add(group);

      this.effects.push({
        type: "firewall",
        mesh: group,
        position: pos.clone(),
        direction: dir,
        damage: stats.damage * 0.5,
        area: width,
        knockback: stats.knockback || 0,
        duration: stats.duration * 3,
        elapsed: 0,
        tickRate: 0.25,
        lastTick: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("whip");
  }

  // Knife - throws in facing direction
  fireKnife(stats, playerPos, playerDir, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;

      const spread = (i - (stats.projectileCount - 1) / 2) * 0.15;
      const dir = playerDir.clone();
      dir.x += spread;
      dir.normalize();

      const mesh = this.meshFactory.createKnifeMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;
      mesh.rotation.y = Math.atan2(dir.x, dir.z);

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "knife",
        mesh: mesh,
        direction: dir,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("knife");
  }

  // Axe - thrown in arc
  fireAxe(stats, playerPos, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;

      const angle = (Math.random() - 0.5) * Math.PI * 0.5;

      // Create detailed axe mesh with level scaling
      const mesh = this.meshFactory.createAxeMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "axe",
        mesh: mesh,
        angle: angle,
        velocityY: stats.projectileSpeed * 0.8,
        velocityX: Math.sin(angle) * stats.projectileSpeed * 0.5,
        velocityZ: Math.cos(angle) * stats.projectileSpeed * 0.5,
        damage: stats.damage,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
        spin: 0,
      });
    }

    this.game.audioManager.playSound("axe");
  }

  // Garlic - damage aura around player
  fireGarlic(stats, playerPos, scale = 1) {
    if (!this.canAddEffect()) return;

    const group = new THREE.Group();

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(stats.area * 0.5, stats.area * 0.6, 12),
      new THREE.MeshBasicMaterial({
        color: 0x66cc66,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    group.add(innerRing);

    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area * 0.7, 12),
      new THREE.MeshBasicMaterial({
        color: 0x44aa44,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    fill.rotation.x = -Math.PI / 2;
    group.add(fill);

    group.position.copy(playerPos);
    group.position.y = 0.1;
    group.scale.setScalar(scale);

    this.game.scene.add(group);
    const mesh = group;

    // Damage enemies in range immediately
    const zombies = this.game.zombieManager.getZombies();
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        this.game.zombieManager.damageZombie(zombie, stats.damage);

        // Knockback
        if (stats.knockback) {
          const dir = new THREE.Vector3();
          dir.subVectors(zombie.mesh.position, playerPos);
          dir.normalize();
          zombie.mesh.position.add(dir.multiplyScalar(stats.knockback));
        }
      }
    }

    // Fade out effect
    this.effects.push({
      type: "garlic",
      mesh: mesh,
      duration: stats.duration,
      elapsed: 0,
    });
  }

  // Cross - boomerang
  fireCross(stats, playerPos, zombies, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;

      let direction;
      if (zombies.length > 0) {
        const targetIndex = i % zombies.length;
        direction = new THREE.Vector3();
        direction.subVectors(zombies[targetIndex].mesh.position, playerPos);
        direction.y = 0;
        direction.normalize();
      } else {
        const angle = (i / stats.projectileCount) * Math.PI * 2;
        direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      }

      // Create detailed cross mesh with level scaling
      const mesh = this.meshFactory.createCrossMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "cross",
        mesh: mesh,
        startPos: playerPos.clone(),
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        returning: false,
        hitEnemies: new Set(),
        spin: 0,
      });
    }

    this.game.audioManager.playSound("cross");
  }

  // Fire Wand - explosive projectile
  fireFireWand(stats, playerPos, zombies, scale = 1) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];

      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      // Create detailed fireball mesh with level scaling
      const mesh = this.meshFactory.createFireballMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "fireWand",
        mesh: mesh,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        explosionRadius: stats.explosionRadius,
        duration: stats.duration,
        elapsed: 0,
      });
    }

    this.game.audioManager.playSound("fireball");
  }

  // Lightning - random strikes (top-down visible ground arcs)
  fireLightning(stats, playerPos, zombies, scale = 1) {
    const inRangeZombies = zombies.filter((z) => {
      return z.mesh.position.distanceTo(playerPos) < stats.area;
    });

    if (inRangeZombies.length === 0) return;

    const targets = [];
    for (let i = 0; i < stats.projectileCount; i++) {
      const index = Math.floor(Math.random() * inRangeZombies.length);
      targets.push(inRangeZombies[index]);
    }

    for (const target of targets) {
      const endPos = target.mesh.position.clone();
      const boltGroup = new THREE.Group();

      // Ground-level radial lightning arcs (visible from top-down)
      const arcCount = 3 + Math.floor(scale * 3);
      const arcRadius = (1.5 + scale) * 1.2;
      for (let a = 0; a < arcCount; a++) {
        const angle = (a / arcCount) * Math.PI * 2 + Math.random() * 0.5;
        const startPt = new THREE.Vector3(
          endPos.x + Math.cos(angle) * arcRadius,
          0.3,
          endPos.z + Math.sin(angle) * arcRadius,
        );
        const arcSegments = 5;
        const arcPoints = [startPt];
        for (let s = 1; s <= arcSegments; s++) {
          const t = s / arcSegments;
          arcPoints.push(new THREE.Vector3(
            startPt.x + (endPos.x - startPt.x) * t + (Math.random() - 0.5) * arcRadius * 0.4,
            0.3 + Math.random() * 0.3,
            startPt.z + (endPos.z - startPt.z) * t + (Math.random() - 0.5) * arcRadius * 0.4,
          ));
        }
        arcPoints[arcPoints.length - 1].set(endPos.x, 0.3, endPos.z);

        const arcCurve = new THREE.CatmullRomCurve3(arcPoints);
        const coreArc = new THREE.Mesh(
          new THREE.TubeGeometry(arcCurve, arcSegments * 3, 0.1 * scale, 5, false),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        boltGroup.add(coreArc);

        const glowArc = new THREE.Mesh(
          new THREE.TubeGeometry(arcCurve, arcSegments * 3, 0.25 * scale, 5, false),
          new THREE.MeshBasicMaterial({
            color: 0xccaa44,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        boltGroup.add(glowArc);
      }

      this.game.scene.add(boltGroup);

      this.game.zombieManager.damageZombie(target, stats.damage);

      // Bright impact flash visible from top-down
      const impactGroup = new THREE.Group();

      const flashSize = (1.2 + scale * 0.8);
      const flash = new THREE.Mesh(
        new THREE.CircleGeometry(flashSize, 16),
        new THREE.MeshBasicMaterial({
          color: 0xeeffff,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      flash.rotation.x = -Math.PI / 2;
      impactGroup.add(flash);

      const ringSize = flashSize * 1.5;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(ringSize * 0.5, ringSize, 16),
        new THREE.MeshBasicMaterial({
          color: 0x44ddff,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      impactGroup.add(ring);

      impactGroup.position.copy(endPos);
      impactGroup.position.y = 0.15;

      this.game.scene.add(impactGroup);

      this.effects.push({
        type: "lightning",
        mesh: boltGroup,
        duration: 0.3,
        elapsed: 0,
      });

      this.effects.push({
        type: "lightningImpact",
        mesh: impactGroup,
        duration: 0.45,
        elapsed: 0,
      });
    }

    this.game.audioManager.playSound("lightning");
  }

  // Runetracer - bouncing projectile
  fireRunetracer(stats, playerPos, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const angle = Math.random() * Math.PI * 2;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      // Create detailed runetracer mesh with level scaling
      const mesh = this.meshFactory.createRunetracerMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "runetracer",
        mesh: mesh,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
        hitCooldowns: {},
      });
    }

    this.game.audioManager.playSound("runetracer");
  }

  // Holy Water - creates damaging pool
  fireHolyWater(stats, playerPos, zombies, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      // Target position
      let targetPos;
      if (zombies.length > 0) {
        const index = Math.floor(Math.random() * Math.min(5, zombies.length));
        targetPos = zombies[index].mesh.position.clone();
      } else {
        const angle = Math.random() * Math.PI * 2;
        targetPos = playerPos.clone();
        targetPos.x += Math.sin(angle) * 5;
        targetPos.z += Math.cos(angle) * 5;
      }

      // Create detailed holy water bottle mesh with level scaling
      const mesh = this.meshFactory.createHolyWaterMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 2;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "holyWater",
        mesh: mesh,
        targetPos: targetPos,
        arcHeight: 3,
        startPos: playerPos.clone(),
        damage: stats.damage,
        area: stats.area,
        poolDuration: stats.duration,
        tickRate: stats.tickRate,
        elapsed: 0,
        flightDuration: 0.5,
      });
    }

    this.game.audioManager.playSound("throw");
  }

  // Create a generic projectile (magic orb style)
  canAddProjectile() {
    return this.projectiles.length < this.maxProjectiles;
  }

  canAddEffect() {
    return this.effects.length < this.maxEffects;
  }

  createProjectile(config) {
    if (!this.canAddProjectile()) return;

    const mesh = this.meshFactory.createMagicOrbMesh(config.color);
    const visualScale = (config.scale || 1) * Math.min(1.5, Math.sqrt(config.area || 1));
    mesh.scale.setScalar(visualScale);
    mesh.position.copy(config.position);

    if (config.direction) {
      mesh.rotation.y = Math.atan2(config.direction.x, config.direction.z);
    }

    this.game.scene.add(mesh);

    this.projectiles.push({
      ...config,
      mesh: mesh,
      elapsed: 0,
      hitEnemies: new Set(),
    });
  }

  updateProjectiles(delta) {
    const arenaSize = this.game.arenaSize;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.elapsed += delta;

      // Check duration
      if (proj.elapsed >= proj.duration) {
        const explodeOnExpire = proj.type === "fireWand" || proj.type === "guidedMeteor";
        this.removeProjectile(i, explodeOnExpire);
        continue;
      }

      // Update based on type
      switch (proj.type) {
        case "magicWand":
        case "knife": {
          const s = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * s;
          proj.mesh.position.y += proj.direction.y * s;
          proj.mesh.position.z += proj.direction.z * s;
          if (proj.type === "knife") {
            proj.mesh.rotation.y += delta * 10;
          } else {
            proj.mesh.rotation.y = Math.atan2(proj.direction.x, proj.direction.z);
          }
          break;
        }

        case "axe":
          // Arc movement
          proj.velocityY -= 15 * delta; // gravity
          proj.mesh.position.x += proj.velocityX * delta;
          proj.mesh.position.y += proj.velocityY * delta;
          proj.mesh.position.z += proj.velocityZ * delta;
          proj.spin += delta * 15;
          proj.mesh.rotation.z = proj.spin;
          break;

        case "cross": {
          const cs = proj.speed * delta;
          if (!proj.returning) {
            proj.mesh.position.x += proj.direction.x * cs;
            proj.mesh.position.z += proj.direction.z * cs;

            const cdx = proj.mesh.position.x - proj.startPos.x;
            const cdz = proj.mesh.position.z - proj.startPos.z;
            if (cdx * cdx + cdz * cdz > 64 || proj.elapsed > proj.duration * 0.4) {
              proj.returning = true;
            }
          } else {
            const pp = this.game.player.getPosition();
            let tpx = pp.x - proj.mesh.position.x;
            let tpz = pp.z - proj.mesh.position.z;
            const tpl = Math.sqrt(tpx * tpx + tpz * tpz);
            if (tpl > 0.0001) { tpx /= tpl; tpz /= tpl; }
            const rs = proj.speed * 1.2 * delta;
            proj.mesh.position.x += tpx * rs;
            proj.mesh.position.z += tpz * rs;
          }
          proj.spin += delta * 15;
          proj.mesh.rotation.y = proj.spin;
          break;
        }

        case "fireWand": {
          const fs = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * fs;
          proj.mesh.position.y += proj.direction.y * fs;
          proj.mesh.position.z += proj.direction.z * fs;
          break;
        }

        case "runetracer": {
          // Bounce off walls
          const rs = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * rs;
          proj.mesh.position.z += proj.direction.z * rs;

          // Wall bouncing
          if (Math.abs(proj.mesh.position.x) > arenaSize - 1) {
            proj.direction.x *= -1;
            proj.mesh.position.x =
              Math.sign(proj.mesh.position.x) * (arenaSize - 1);
          }
          if (Math.abs(proj.mesh.position.z) > arenaSize - 1) {
            proj.direction.z *= -1;
            proj.mesh.position.z =
              Math.sign(proj.mesh.position.z) * (arenaSize - 1);
          }
          break;
        }

        case "holyWater":
          // Arc to target, then create pool
          const t = proj.elapsed / proj.flightDuration;
          if (t < 1) {
            const x =
              proj.startPos.x + (proj.targetPos.x - proj.startPos.x) * t;
            const z =
              proj.startPos.z + (proj.targetPos.z - proj.startPos.z) * t;
            const y = 2 + proj.arcHeight * Math.sin(t * Math.PI);
            proj.mesh.position.set(x, y, z);
          } else {
            // Create pool
            this.createHolyWaterPool(proj);
            this.removeProjectile(i, false);
            continue;
          }
          break;

        // === EVOLVED WEAPON PROJECTILES ===
        case "holyWand":
        case "thousandEdge": {
          const hs = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * hs;
          proj.mesh.position.y += proj.direction.y * hs;
          proj.mesh.position.z += proj.direction.z * hs;
          proj.mesh.rotation.y += delta * 5;
          break;
        }

        case "deathSpiral":
          // Orbit around player
          const playerPos = this.game.player.getPosition();
          proj.angle += proj.orbitSpeed * delta;
          proj.mesh.position.x =
            playerPos.x + Math.cos(proj.angle) * proj.orbitRadius;
          proj.mesh.position.z =
            playerPos.z + Math.sin(proj.angle) * proj.orbitRadius;
          proj.mesh.position.y = 1;
          proj.mesh.rotation.z += delta * 10;
          // Update center position to follow player
          proj.centerPos.copy(playerPos);
          break;

        case "heavenSword":
          if (proj.homing) {
            const zombies = this.game.zombieManager.getZombies();
            if (zombies.length > 0) {
              let nearest = null;
              let nearestDistSq = Infinity;
              for (const z of zombies) {
                const dx = z.mesh.position.x - proj.mesh.position.x;
                const dz = z.mesh.position.z - proj.mesh.position.z;
                const dsq = dx * dx + dz * dz;
                if (dsq < nearestDistSq) { nearestDistSq = dsq; nearest = z; }
              }
              if (nearest) {
                _tv1.x = nearest.mesh.position.x - proj.mesh.position.x;
                _tv1.y = 0;
                _tv1.z = nearest.mesh.position.z - proj.mesh.position.z;
                _tv1.normalize();
                proj.direction.lerp(_tv1, proj.homingStrength * delta);
                proj.direction.normalize();
              }
            }
          }
          {
            const hs2 = proj.speed * delta;
            proj.mesh.position.x += proj.direction.x * hs2;
            proj.mesh.position.y += proj.direction.y * hs2;
            proj.mesh.position.z += proj.direction.z * hs2;
          }
          proj.mesh.rotation.z = Math.atan2(proj.direction.x, proj.direction.z);
          break;

        case "hellfire":
          // Fall from sky, explode on ground
          proj.mesh.position.y -= proj.fallSpeed * delta;
          proj.mesh.rotation.y += delta * 5;

          if (proj.mesh.position.y <= 1) {
            // Hit ground - explode!
            this.createExplosion(
              proj.mesh.position,
              proj.explosionRadius,
              proj.damage,
            );
            this.removeProjectile(i, false);
            continue;
          }
          break;

        case "noFuture": {
          // Bouncing doom orb
          const ns = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * ns;
          proj.mesh.position.z += proj.direction.z * ns;
          proj.mesh.rotation.y += delta * 3;
          proj.mesh.rotation.x += delta * 2;

          // Wall bouncing with explosion
          if (Math.abs(proj.mesh.position.x) > arenaSize - 1) {
            proj.direction.x *= -1;
            proj.mesh.position.x =
              Math.sign(proj.mesh.position.x) * (arenaSize - 1);
            if (proj.explosionOnBounce) {
              _tv2.copy(proj.mesh.position);
              this.createExplosion(_tv2, proj.explosionRadius, proj.damage * 0.5);
            }
          }
          if (Math.abs(proj.mesh.position.z) > arenaSize - 1) {
            proj.direction.z *= -1;
            proj.mesh.position.z =
              Math.sign(proj.mesh.position.z) * (arenaSize - 1);
            if (proj.explosionOnBounce) {
              _tv2.copy(proj.mesh.position);
              this.createExplosion(_tv2, proj.explosionRadius, proj.damage * 0.5);
            }
          }
          break;
        }

        // === NEW WEAPON PROJECTILES ===
        case "bone": {
          const bs = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * bs;
          proj.mesh.position.z += proj.direction.z * bs;
          proj.mesh.rotation.z += delta * 15;

          const boneZombies = this.game.zombieManager.getZombies();
          const bhr = proj.area + 0.8;
          const bhrSq = bhr * bhr;
          for (const zombie of boneZombies) {
            if (proj.hitEnemies.has(zombie)) continue;
            const bdx = zombie.mesh.position.x - proj.mesh.position.x;
            const bdz = zombie.mesh.position.z - proj.mesh.position.z;
            if (bdx * bdx + bdz * bdz < bhrSq) {
              this.game.zombieManager.damageZombie(zombie, proj.damage);
              proj.hitEnemies.add(zombie);

              if (proj.bounceCount > 0) {
                proj.bounceCount--;
                let nearestEnemy = null;
                let nearestDistSq = Infinity;
                for (const z of boneZombies) {
                  if (proj.hitEnemies.has(z)) continue;
                  const ndx = z.mesh.position.x - proj.mesh.position.x;
                  const ndz = z.mesh.position.z - proj.mesh.position.z;
                  const ndsq = ndx * ndx + ndz * ndz;
                  if (ndsq < nearestDistSq) { nearestDistSq = ndsq; nearestEnemy = z; }
                }
                if (nearestEnemy) {
                  proj.direction.subVectors(nearestEnemy.mesh.position, proj.mesh.position);
                  proj.direction.y = 0;
                  proj.direction.normalize();
                }
              }
              break;
            }
          }
          break;
        }

        case "magicMissile": {
          const mmZombies = this.game.zombieManager.getZombies();
          if (mmZombies.length > 0) {
            let nearestZ = null;
            let nearestDSq = Infinity;
            for (const z of mmZombies) {
              const mdx = z.mesh.position.x - proj.mesh.position.x;
              const mdz = z.mesh.position.z - proj.mesh.position.z;
              const mdsq = mdx * mdx + mdz * mdz;
              if (mdsq < nearestDSq) { nearestDSq = mdsq; nearestZ = z; }
            }
            if (nearestZ) {
              _tv1.x = nearestZ.mesh.position.x - proj.mesh.position.x;
              _tv1.y = 0;
              _tv1.z = nearestZ.mesh.position.z - proj.mesh.position.z;
              _tv1.normalize();
              proj.direction.lerp(_tv1, proj.homingStrength * delta);
              proj.direction.normalize();
            }
          }
          const mms = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * mms;
          proj.mesh.position.z += proj.direction.z * mms;
          proj.mesh.rotation.y = Math.atan2(proj.direction.x, proj.direction.z);
          break;
        }

        case "peachone":
        case "ebonyWings":
          // Orbit around player
          const birdPlayerPos = this.game.player.getPosition();
          proj.angle += proj.orbitSpeed * delta;
          proj.mesh.position.x =
            birdPlayerPos.x + Math.cos(proj.angle) * proj.orbitRadius;
          proj.mesh.position.z =
            birdPlayerPos.z + Math.sin(proj.angle) * proj.orbitRadius;
          proj.mesh.position.y = 1.5 + Math.sin(proj.elapsed * 3) * 0.2;

          // Face movement direction
          proj.mesh.rotation.y = proj.angle + Math.PI / 2;

          // Wing flapping animation
          proj.wingAngle += delta * 10;
          if (proj.leftWing) {
            proj.leftWing.rotation.z = -0.3 + Math.sin(proj.wingAngle) * 0.4;
          }
          if (proj.rightWing) {
            proj.rightWing.rotation.z = 0.3 - Math.sin(proj.wingAngle) * 0.4;
          }

          // Check damage cooldowns
          const birdZombies = this.game.zombieManager.getZombies();
          const birdAreaSq = proj.area * proj.area;
          for (const zombie of birdZombies) {
            const lastHit = proj.hitCooldowns[zombie.mesh.uuid] || 0;
            if (proj.elapsed - lastHit < 0.5) continue;

            const bdx = zombie.mesh.position.x - proj.mesh.position.x;
            const bdz = zombie.mesh.position.z - proj.mesh.position.z;
            if (bdx * bdx + bdz * bdz < birdAreaSq) {
              this.game.zombieManager.damageZombie(zombie, proj.damage);
              proj.hitCooldowns[zombie.mesh.uuid] = proj.elapsed;
            }
          }
          break;

        case "skullOManiac": {
          const skullZombies = this.game.zombieManager.getZombies();
          if (proj.homing && skullZombies.length > 0) {
            let nearestZ = null;
            let nearestDSq = Infinity;
            for (const z of skullZombies) {
              if (proj.hitEnemies.has(z)) continue;
              const sdx = z.mesh.position.x - proj.mesh.position.x;
              const sdz = z.mesh.position.z - proj.mesh.position.z;
              const sdsq = sdx * sdx + sdz * sdz;
              if (sdsq < nearestDSq) { nearestDSq = sdsq; nearestZ = z; }
            }
            if (nearestZ) {
              _tv1.x = nearestZ.mesh.position.x - proj.mesh.position.x;
              _tv1.y = 0;
              _tv1.z = nearestZ.mesh.position.z - proj.mesh.position.z;
              _tv1.normalize();
              proj.direction.lerp(_tv1, proj.homingStrength * delta);
              proj.direction.normalize();
            }
          }

          const sks = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * sks;
          proj.mesh.position.z += proj.direction.z * sks;
          proj.mesh.rotation.z += delta * 18;

          const skhr = proj.area + 0.8;
          const skhrSq = skhr * skhr;
          for (const zombie of skullZombies) {
            if (proj.hitEnemies.has(zombie)) continue;
            const sdx = zombie.mesh.position.x - proj.mesh.position.x;
            const sdz = zombie.mesh.position.z - proj.mesh.position.z;
            if (sdx * sdx + sdz * sdz < skhrSq) {
              this.game.zombieManager.damageZombie(zombie, proj.damage);
              proj.hitEnemies.add(zombie);

              if (proj.bounceCount > 0) {
                proj.bounceCount--;
                proj.hitEnemies.clear();
                proj.hitEnemies.add(zombie);
              }
              break;
            }
          }
          break;
        }

        case "guidedMeteor": {
          const gmZombies = this.game.zombieManager.getZombies();
          if (gmZombies.length > 0) {
            let nearestZ = null;
            let nearestDSq = Infinity;
            for (const z of gmZombies) {
              const gdx = z.mesh.position.x - proj.mesh.position.x;
              const gdz = z.mesh.position.z - proj.mesh.position.z;
              const gdsq = gdx * gdx + gdz * gdz;
              if (gdsq < nearestDSq) { nearestDSq = gdsq; nearestZ = z; }
            }
            if (nearestZ) {
              _tv1.x = nearestZ.mesh.position.x - proj.mesh.position.x;
              _tv1.y = 0;
              _tv1.z = nearestZ.mesh.position.z - proj.mesh.position.z;
              _tv1.normalize();
              proj.direction.lerp(_tv1, proj.homingStrength * delta);
              proj.direction.normalize();
            }
          }

          const gms = proj.speed * delta;
          proj.mesh.position.x += proj.direction.x * gms;
          proj.mesh.position.z += proj.direction.z * gms;
          proj.mesh.rotation.y = Math.atan2(proj.direction.x, proj.direction.z);
          proj.mesh.rotation.x = Math.sin(proj.elapsed * 4) * 0.1;
          break;
        }

        case "vandalier": {
          // Faster, stronger orbiting like peachone/ebonyWings
          const vanPlayerPos = this.game.player.getPosition();
          proj.angle += proj.orbitSpeed * delta;
          proj.mesh.position.x =
            vanPlayerPos.x + Math.cos(proj.angle) * proj.orbitRadius;
          proj.mesh.position.z =
            vanPlayerPos.z + Math.sin(proj.angle) * proj.orbitRadius;
          proj.mesh.position.y = 1.5 + Math.sin(proj.elapsed * 4) * 0.2;

          proj.mesh.rotation.y = proj.angle + Math.PI / 2;

          proj.wingAngle += delta * 14;
          if (proj.leftWing) {
            proj.leftWing.rotation.z = -0.3 + Math.sin(proj.wingAngle) * 0.5;
          }
          if (proj.rightWing) {
            proj.rightWing.rotation.z = 0.3 - Math.sin(proj.wingAngle) * 0.5;
          }

          const vanZombies = this.game.zombieManager.getZombies();
          const vanAreaSq = proj.area * proj.area;
          for (const zombie of vanZombies) {
            const lastHit = proj.hitCooldowns[zombie.mesh.uuid] || 0;
            if (proj.elapsed - lastHit < 0.3) continue;

            const vdx = zombie.mesh.position.x - proj.mesh.position.x;
            const vdz = zombie.mesh.position.z - proj.mesh.position.z;
            if (vdx * vdx + vdz * vdz < vanAreaSq) {
              this.game.zombieManager.damageZombie(zombie, proj.damage);
              proj.hitCooldowns[zombie.mesh.uuid] = proj.elapsed;
            }
          }
          break;
        }
      }

      // Check collisions (skip types that handle their own damage)
      const selfDamageTypes = ["holyWater", "skullOManiac", "vandalier"];
      if (!selfDamageTypes.includes(proj.type)) {
        this.checkProjectileCollisions(proj, i);
      }

      // After collision check, projectile may have been removed
      // Check if it still exists before accessing mesh
      if (!this.projectiles[i] || this.projectiles[i] !== proj) {
        continue;
      }

      // Out of bounds check
      const pos = proj.mesh.position;
      if (
        Math.abs(pos.x) > arenaSize + 5 ||
        Math.abs(pos.z) > arenaSize + 5 ||
        pos.y < -5 ||
        pos.y > 20
      ) {
        this.removeProjectile(i, proj.type === "fireWand");
      }
    }
  }

  checkProjectileCollisions(proj, index) {
    const zombies = this.game.zombieManager.getZombies();
    const px = proj.mesh.position.x;
    const pz = proj.mesh.position.z;
    const hitRadius = (proj.area || 1) * 0.8 + 0.8;
    const hitRadiusSq = hitRadius * hitRadius;

    for (const zombie of zombies) {
      if (proj.hitEnemies && proj.hitEnemies.has(zombie)) {
        if (proj.type === "runetracer") {
          const lastHit = proj.hitCooldowns[zombie.mesh.uuid] || 0;
          if (proj.elapsed - lastHit < 0.5) continue;
        } else {
          continue;
        }
      }

      const dx = zombie.mesh.position.x - px;
      const dz = zombie.mesh.position.z - pz;
      const distSq = dx * dx + dz * dz;

      if (distSq < hitRadiusSq) {
        // Hit!
        this.game.zombieManager.damageZombie(zombie, proj.damage);

        // Track hit
        if (proj.hitEnemies) {
          proj.hitEnemies.add(zombie);
          if (proj.hitCooldowns) {
            proj.hitCooldowns[zombie.mesh.uuid] = proj.elapsed;
          }
        }

        // Check pierce
        const shouldExplode = proj.type === "fireWand" || proj.type === "guidedMeteor";
        if (proj.pierce !== undefined && proj.pierce !== Infinity) {
          proj.pierce--;
          if (proj.pierce < 0) {
            this.removeProjectile(index, shouldExplode);
            return;
          }
        } else if (!proj.pierce && proj.type !== "runetracer") {
          this.removeProjectile(index, shouldExplode);
          return;
        }
      }
    }
  }

  createHolyWaterPool(proj) {
    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CircleGeometry(proj.area * 0.5, 32),
      new THREE.MeshBasicMaterial({
        color: 0x668833,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    core.rotation.x = -Math.PI / 2;
    group.add(core);

    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(proj.area, 32),
      new THREE.MeshBasicMaterial({
        color: 0x445522,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    group.add(pool);

    // Border ring (normal blend)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(proj.area * 0.9, proj.area * 1.05, 32),
      new THREE.MeshBasicMaterial({
        color: 0x556633,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    group.position.copy(proj.targetPos);
    group.position.y = 0.1;

    this.game.scene.add(group);

    this.effects.push({
      type: "holyWaterPool",
      mesh: group,
      position: proj.targetPos.clone(),
      damage: proj.damage,
      area: proj.area,
      tickRate: proj.tickRate,
      duration: proj.poolDuration,
      elapsed: 0,
      lastTick: 0,
    });

    this.game.audioManager.playSound("splash");
  }

  updateEffects(delta) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.elapsed += delta;

      // Check duration
      if (effect.elapsed >= effect.duration) {
        if (effect.mesh) {
          this.game.scene.remove(effect.mesh);
          this.disposeObject(effect.mesh);
        }
        this.effects.splice(i, 1);
        continue;
      }

      // Update based on type
      switch (effect.type) {
        case "whip":
          // Check damage in whip area (use 2D distance)
          const zombies = this.game.zombieManager.getZombies();
          for (const zombie of zombies) {
            if (effect.hitEnemies.has(zombie)) continue;

            const zPos = zombie.mesh.position;
            const ePos = effect.position;
            const dx = zPos.x - ePos.x;
            const dz = zPos.z - ePos.z;
            const distSq = dx * dx + dz * dz;
            const areaSq = effect.area * effect.area;

            if (distSq < areaSq) {
              this.game.zombieManager.damageZombie(zombie, effect.damage);
              effect.hitEnemies.add(zombie);

              if (effect.knockback) {
                const pp = this.game.player.getPosition();
                let kx = zPos.x - pp.x;
                let kz = zPos.z - pp.z;
                const kl = Math.sqrt(kx * kx + kz * kz);
                if (kl > 0.0001) { kx /= kl; kz /= kl; }
                zPos.x += kx * effect.knockback;
                zPos.z += kz * effect.knockback;
              }
            }
          }

          // Fade out (handle group with multiple meshes)
          const fadeProgress = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              !Array.isArray(child.material) &&
              child.material.transparent
            ) {
              child.material.opacity = 0.8 * fadeProgress;
            }
          });
          break;

        case "garlic":
        case "lightning":
        case "lightningImpact":
          // Just fade out
          const fadeAmount = 0.8 * (1 - effect.elapsed / effect.duration);
          if (effect.mesh.traverse) {
            effect.mesh.traverse((child) => {
              if (
                child.isMesh &&
                child.material &&
                !Array.isArray(child.material) &&
                child.material.transparent
              ) {
                child.material.opacity = fadeAmount;
              }
            });
          } else if (effect.mesh.material && !Array.isArray(effect.mesh.material)) {
            effect.mesh.material.opacity = fadeAmount;
          }
          break;

        case "holyWaterPool":
          if (effect.elapsed - effect.lastTick >= effect.tickRate) {
            effect.lastTick = effect.elapsed;

            const poolAreaSq = effect.area * effect.area;
            const allZombies = this.game.zombieManager.getZombies();
            for (const z of allZombies) {
              const zp = z.mesh.position;
              const ep = effect.position;
              const dx = zp.x - ep.x;
              const dz = zp.z - ep.z;
              if (dx * dx + dz * dz < poolAreaSq) {
                this.game.zombieManager.damageZombie(z, effect.damage);
              }
            }
          }

          // Pulsing effect
          const pulse = 0.8 + Math.sin(effect.elapsed * 5) * 0.2;
          const waterFade = 1 - effect.elapsed / effect.duration;

          if (effect.mesh.traverse) {
            effect.mesh.traverse((child) => {
              if (
                child.isMesh &&
                child.material &&
                !Array.isArray(child.material) &&
                child.material.transparent
              ) {
                // Determine base opacity from initial value (stored on creation or using a rough estimate)
                const baseOpacity = child.userData?.baseOpacity || 0.6;
                if (!child.userData?.baseOpacity) {
                  child.userData = child.userData || {};
                  child.userData.baseOpacity = child.material.opacity;
                }
                child.material.opacity =
                  child.userData.baseOpacity * pulse * waterFade;
              }
            });
          } else if (effect.mesh.material && !Array.isArray(effect.mesh.material)) {
            effect.mesh.material.opacity = pulse * waterFade;
          }
          break;

        case "firewall":
          // Firewall - continuous burn damage to enemies in area
          if (effect.elapsed - effect.lastTick >= effect.tickRate) {
            effect.lastTick = effect.elapsed;

            // Get firewall world position and direction
            const firewallPos = effect.position;
            const firewallDir = effect.direction;
            const angle = Math.atan2(firewallDir.x, firewallDir.z);

            const zombiesNearFire = this.game.zombieManager.getZombies();
            for (const zombie of zombiesNearFire) {
              const zp = zombie.mesh.position;

              // Transform zombie position to firewall local space
              const relX = zp.x - firewallPos.x;
              const relZ = zp.z - firewallPos.z;

              // Rotate to align with firewall direction
              const localX = relX * Math.cos(-angle) - relZ * Math.sin(-angle);
              const localZ = relX * Math.sin(-angle) + relZ * Math.cos(-angle);

              // Check if within firewall bounds (width along X, small depth along Z)
              if (
                localX >= -0.5 &&
                localX <= effect.area + 0.5 &&
                Math.abs(localZ) < 1.5
              ) {
                this.game.zombieManager.damageZombie(zombie, effect.damage);

                // Visual burn effect on zombie
                const body = zombie.mesh.userData.body;
                if (body) {
                  body.material.emissive.setHex(0xff4400);
                  setTimeout(() => {
                    if (body.material) {
                      body.material.emissive.setHex(0x000000);
                    }
                  }, 150);
                }
              }
            }
          }

          // Animate fire flickering and fade
          const fireFade = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
              // Flicker effect
              const flicker =
                0.8 + Math.sin(effect.elapsed * 15 + child.id) * 0.2;
              if (child.material.transparent) {
                child.material.opacity =
                  child.material.opacity * flicker * fireFade;
              }
              // Slight scale animation for flames
              if (child.geometry.type === "ConeGeometry") {
                child.scale.y =
                  1 + Math.sin(effect.elapsed * 10 + child.id) * 0.15;
              }
            }
          });
          break;

        // === EVOLVED WEAPON EFFECTS ===
        case "bloodyTear": {
          const bloodZombies = this.game.zombieManager.getZombies();
          let bloodHealed = 0;
          const btAreaSq = effect.area * effect.area;
          for (const zombie of bloodZombies) {
            if (effect.hitEnemies.has(zombie)) continue;

            const zPos = zombie.mesh.position;
            const ePos = effect.position;
            const dx = zPos.x - ePos.x;
            const dz = zPos.z - ePos.z;

            if (dx * dx + dz * dz < btAreaSq) {
              this.game.zombieManager.damageZombie(zombie, effect.damage);
              effect.hitEnemies.add(zombie);
              bloodHealed += effect.lifesteal || 0;

              if (effect.knockback) {
                const pp = this.game.player.getPosition();
                let kx = zPos.x - pp.x;
                let kz = zPos.z - pp.z;
                const kl = Math.sqrt(kx * kx + kz * kz);
                if (kl > 0.0001) { kx /= kl; kz /= kl; }
                zPos.x += kx * effect.knockback;
                zPos.z += kz * effect.knockback;
              }
            }
          }

          // Apply lifesteal
          if (bloodHealed > 0 && this.game.player) {
            this.game.player.health = Math.min(
              this.game.player.maxHealth,
              this.game.player.health + bloodHealed,
            );
          }

          // Fade effect
          const bloodFade = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              !Array.isArray(child.material) &&
              child.material.transparent
            ) {
              child.material.opacity = 0.8 * bloodFade;
            }
          });
          break;
        }

        case "soulEater":
          // Rotate the entire aura group slowly
          effect.mesh.rotation.y = effect.elapsed * 0.5;

          // Animate wisps rotating and bobbing
          if (effect.wisps) {
            effect.wisps.forEach((wispData, index) => {
              const { mesh, angle } = wispData;
              const currentAngle = angle + effect.elapsed * 4;
              const radius = effect.radius * 0.7;

              mesh.position.x = Math.cos(currentAngle) * radius;
              mesh.position.z = Math.sin(currentAngle) * radius;
              mesh.position.y =
                1.0 + Math.sin(effect.elapsed * 5 + index) * 0.5;

              // Rotate tail to face movement direction
              mesh.rotation.y = -currentAngle;
            });
          }

          // Fade out towards the end
          const soulFade = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              !Array.isArray(child.material) &&
              child.material.transparent
            ) {
              child.material.opacity =
                (child.material.opacity /
                  (soulFade === 0 ? 1 : soulFade + 0.001)) *
                soulFade;
            }
          });
          break;

        case "laBorra":
          // Tick damage and slow enemies
          if (effect.elapsed - effect.lastTick >= effect.tickRate) {
            effect.lastTick = effect.elapsed;

            const poolZombies = this.game.zombieManager
              .getZombies()
              .getZombies();

            const lbAreaSq = effect.area * effect.area;
            for (const zombie of poolZombies) {
              const zp = zombie.mesh.position;
              const ep = effect.position;
              const dx = zp.x - ep.x;
              const dz = zp.z - ep.z;
              if (dx * dx + dz * dz >= lbAreaSq) continue;

              this.game.zombieManager.damageZombie(zombie, effect.damage);

              if (!zombie.originalSpeed) {
                zombie.originalSpeed = zombie.speed;
              }
              zombie.speed =
                zombie.originalSpeed * (1 - (effect.slowAmount || 0.5));

              zombie.slowTimeout = setTimeout(() => {
                if (zombie.originalSpeed) {
                  zombie.speed = zombie.originalSpeed;
                  zombie.originalSpeed = null;
                }
              }, 500);
            }
          }

          // Pulsing effect + bubbles animation
          const poolPulse = 0.8 + Math.sin(effect.elapsed * 3) * 0.2;
          const poolFade = 1 - effect.elapsed / effect.duration;

          effect.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
              if (child.material.transparent) {
                // Don't fully overwrite opacity, multiply by original so bubbles stay bright
                const baseOpacity =
                  child.material.opacity / (poolPulse * poolFade * 0.7 + 0.01);
                child.material.opacity = Math.min(
                  1.0,
                  baseOpacity * poolPulse * poolFade,
                );
              }
            }
          });

          if (effect.bubbles) {
            effect.bubbles.forEach((bubbleData) => {
              bubbleData.mesh.position.y += 0.02 * bubbleData.speed;
              if (bubbleData.mesh.position.y > 2.0) {
                bubbleData.mesh.position.y = bubbleData.startY;
              }
            });
          }
          break;

        case "infiniteCorridor":
          // Spinning clock hands
          if (effect.hourHand)
            effect.hourHand.rotation.y += delta * 0.5;
          if (effect.minuteHand)
            effect.minuteHand.rotation.y -= delta * 2.0;

          // Tick damage to enemies in zone
          if (effect.elapsed - effect.lastTick >= effect.tickRate) {
            effect.lastTick = effect.elapsed;

            const corridorZombies = this.game.zombieManager.getZombies();
            const icAreaSq = effect.area * effect.area;
            for (const zombie of corridorZombies) {
              const dx = zombie.mesh.position.x - effect.position.x;
              const dz = zombie.mesh.position.z - effect.position.z;
              if (dx * dx + dz * dz < icAreaSq) {
                this.game.zombieManager.damageZombie(zombie, effect.damage);
              }
            }
          }

          // Fade out towards end
          {
            const corridorFade = 1 - effect.elapsed / effect.duration;
            effect.mesh.traverse((child) => {
              if (child.isMesh && child.material && child.material.transparent) {
                child.material.opacity = Math.max(0, child.material.opacity * corridorFade + 0.01);
              }
            });
            effect.mesh.rotation.y += delta * 0.2;
          }
          break;

        case "crimsonShroud":
          // Follow player
          {
            const shroudPlayerPos = this.game.player.getPosition();
            effect.mesh.position.copy(shroudPlayerPos);
            effect.mesh.position.y = 0;

            // Pulsing shield visual
            const shroudPulse = 0.8 + Math.sin(effect.elapsed * 6) * 0.2;
            effect.mesh.traverse((child) => {
              if (child.isMesh && child.material && child.material.transparent) {
                child.material.opacity *= shroudPulse;
              }
            });
            effect.mesh.rotation.y += delta * 1.5;

            // Reflect damage to nearby enemies periodically
            if (effect.elapsed - effect.lastReflectTick >= 0.5) {
              effect.lastReflectTick = effect.elapsed;
              const reflectZombies = this.game.zombieManager.getZombies();
              const rrSq = effect.reflectRadius * effect.reflectRadius;
              for (const zombie of reflectZombies) {
                const rdx = zombie.mesh.position.x - shroudPlayerPos.x;
                const rdz = zombie.mesh.position.z - shroudPlayerPos.z;
                if (rdx * rdx + rdz * rdz < rrSq) {
                  this.game.zombieManager.damageZombie(zombie, effect.reflectDamage);
                }
              }
            }
          }

          break;
      }
    }
  }

  disposeObject(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry && !child.geometry.userData?.shared) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (!mat.userData?.shared) mat.dispose();
            });
          } else {
            if (!child.material.userData?.shared) child.material.dispose();
          }
        }
      }
    });
  }

  removeProjectile(index, explode = false) {
    const proj = this.projectiles[index];

    // Safety check - projectile may have already been removed
    if (!proj || !proj.mesh) {
      return;
    }

    if (explode && proj.explosionRadius) {
      // Create explosion
      this.createExplosion(
        proj.mesh.position,
        proj.explosionRadius,
        proj.damage,
      );
    }

    this.game.scene.remove(proj.mesh);
    this.disposeObject(proj.mesh);
    this.projectiles.splice(index, 1);
  }

  createExplosion(position, radius, damage) {
    // Damage enemies in radius (always applies regardless of visual cap)
    this.game.zombieManager.damageInRadius(position, radius, damage);

    // Skip visual effect if too many active
    if (this._activeExplosions >= this._maxActiveExplosions) {
      this.game.audioManager.playSound("explosion");
      return;
    }
    this._activeExplosions++;

    // Lazy-init shared geometries
    if (!this._sharedExpGeo) {
      this._sharedExpGeo = new THREE.SphereGeometry(1, 10, 10);
      this._sharedExpGeo.userData = { shared: true };
      this._sharedRingGeo = new THREE.TorusGeometry(1, 0.3, 6, 12);
      this._sharedRingGeo.userData = { shared: true };
    }

    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);

    // Core (white-hot)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const core = new THREE.Mesh(this._sharedExpGeo, coreMat);
    core.scale.setScalar(radius * 0.3);
    explosionGroup.add(core);

    // Orange fireball
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff6600, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const fire = new THREE.Mesh(this._sharedExpGeo, fireMat);
    fire.scale.setScalar(radius * 0.8);
    explosionGroup.add(fire);

    // Red outer
    const redMat = new THREE.MeshBasicMaterial({
      color: 0xff2200, transparent: true, opacity: 0.6,
      depthWrite: false,
    });
    const red = new THREE.Mesh(this._sharedExpGeo, redMat);
    red.scale.setScalar(radius);
    explosionGroup.add(red);

    // Smoke ring
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x222222, transparent: true, opacity: 0.5,
    });
    const smoke = new THREE.Mesh(this._sharedRingGeo, smokeMat);
    smoke.rotation.x = Math.PI / 2;
    smoke.scale.setScalar(radius * 0.8);
    explosionGroup.add(smoke);

    // 4 embers instead of 12
    const emberGeo = this._sharedExpGeo;
    const embers = [];
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffaa00 : 0xff4400,
      });
      const ember = new THREE.Mesh(emberGeo, mat);
      ember.scale.setScalar(0.15);
      const angle = (i / 4) * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.15;
      ember.userData = {
        vx: Math.cos(angle) * speed,
        vy: 0.15 + Math.random() * 0.1,
        vz: Math.sin(angle) * speed,
        mat,
      };
      explosionGroup.add(ember);
      embers.push(ember);
    }

    explosionGroup.scale.setScalar(0.1);
    this.game.scene.add(explosionGroup);

    // Only add point light if under cap
    let light = null;
    if (this._explosionLightCount < this._maxExplosionLights) {
      this._explosionLightCount++;
      light = new THREE.PointLight(0xff6600, 80, radius * 3);
      light.position.copy(position);
      this.game.scene.add(light);
    }

    let scale = 0.1;
    let opacity = 1;

    const animate = () => {
      scale += 0.14;
      opacity -= 0.05;

      if (opacity <= 0) {
        this.game.scene.remove(explosionGroup);
        coreMat.dispose();
        fireMat.dispose();
        redMat.dispose();
        smokeMat.dispose();
        embers.forEach((e) => e.userData.mat.dispose());
        if (light) {
          this.game.scene.remove(light);
          light.dispose();
          this._explosionLightCount--;
        }
        this._activeExplosions--;
      } else {
        explosionGroup.scale.setScalar(scale);
        coreMat.opacity = opacity;
        fireMat.opacity = opacity * 0.8;
        redMat.opacity = opacity * 0.6;
        smokeMat.opacity = opacity * 0.4;

        embers.forEach((ember) => {
          ember.position.x += ember.userData.vx;
          ember.position.y += ember.userData.vy;
          ember.position.z += ember.userData.vz;
          ember.userData.vy -= 0.01;
        });

        if (light) light.intensity = opacity * 80;
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    this.game.audioManager.playSound("explosion");
  }

  getEquippedWeapons() {
    return this.equippedWeapons;
  }

  // === NEW WEAPON FIRING METHODS ===

  // Bone - bounces between enemies
  fireBone(stats, playerPos, zombies, scale = 1) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      // Create bone mesh
      const group = new THREE.Group();

      // Main bone shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1 * scale, 0.08 * scale, 0.8 * scale, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffe0 }),
      );
      shaft.rotation.z = Math.PI / 2;
      group.add(shaft);

      // Bone ends (knobs)
      const endMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const leftEnd = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 6, 6),
        endMat,
      );
      leftEnd.position.x = -0.4 * scale;
      group.add(leftEnd);

      const rightEnd = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 6, 6),
        endMat,
      );
      rightEnd.position.x = 0.4 * scale;
      group.add(rightEnd);

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "bone",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        bounceCount: stats.bounceCount || 3,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("throw");
  }

  // Magic Missile - homing projectiles
  fireMagicMissile(stats, playerPos, zombies, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      if (!this.canAddProjectile()) break;
      const angle =
        (i / stats.projectileCount) * Math.PI * 2 + Math.random() * 0.5;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      const group = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 * scale, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xcc8844 }),
      );
      group.add(core);
      const trail = new THREE.Mesh(
        new THREE.ConeGeometry(0.15 * scale, 0.6 * scale, 8),
        new THREE.MeshBasicMaterial({
          color: 0x884422,
          transparent: true,
          opacity: 0.5,
        }),
      );
      trail.rotation.x = Math.PI / 2;
      trail.position.z = -0.3 * scale;
      group.add(trail);
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 * scale, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x664422,
          transparent: true,
          opacity: 0.35,
        }),
      );
      group.add(glow);

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "magicMissile",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce || 0,
        duration: stats.duration,
        elapsed: 0,
        homing: true,
        homingStrength: stats.homingStrength || 2,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("magicMissile");
  }

  // Orbiting birds (Peachone and Ebony Wings)
  fireOrbitingBird(stats, playerPos, type, scale = 1) {
    // Check if birds already exist for this type
    const existingBirds = this.projectiles.filter((p) => p.type === type);
    if (existingBirds.length >= stats.projectileCount) {
      // Update existing birds instead of creating new ones
      return;
    }

    const needed = stats.projectileCount - existingBirds.length;
    const isEbony = type === "ebonyWings";

    for (let i = 0; i < needed; i++) {
      const angle =
        ((existingBirds.length + i) / stats.projectileCount) * Math.PI * 2;

      // Create bird mesh
      const group = new THREE.Group();

      // Body
      const bodyColor = isEbony ? 0x111122 : 0xffffff;
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 * scale, 8, 8),
        new THREE.MeshBasicMaterial({ color: bodyColor }),
      );
      body.scale.set(1, 0.8, 1.5);
      group.add(body);

      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 8, 8),
        new THREE.MeshBasicMaterial({ color: bodyColor }),
      );
      head.position.set(0, 0.1 * scale, 0.3 * scale);
      group.add(head);

      // Beak
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.05 * scale, 0.15 * scale, 4),
        new THREE.MeshBasicMaterial({ color: isEbony ? 0x440044 : 0xffaa00 }),
      );
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 0.1 * scale, 0.45 * scale);
      group.add(beak);

      // Wings
      const wingColor = isEbony ? 0x220033 : 0xddddff;
      const wingMat = new THREE.MeshBasicMaterial({
        color: wingColor,
        transparent: true,
        opacity: 0.9,
      });
      const leftWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 * scale, 0.05 * scale, 0.3 * scale),
        wingMat,
      );
      leftWing.position.set(-0.3 * scale, 0, 0);
      leftWing.rotation.z = -0.3;
      group.add(leftWing);

      const rightWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 * scale, 0.05 * scale, 0.3 * scale),
        wingMat,
      );
      rightWing.position.set(0.3 * scale, 0, 0);
      rightWing.rotation.z = 0.3;
      group.add(rightWing);

      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({
        color: isEbony ? 0xff0000 : 0x000000,
      });
      const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 * scale, 4, 4),
        eyeMat,
      );
      leftEye.position.set(-0.06 * scale, 0.15 * scale, 0.38 * scale);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 * scale, 4, 4),
        eyeMat,
      );
      rightEye.position.set(0.06 * scale, 0.15 * scale, 0.38 * scale);
      group.add(rightEye);

      // Glow
      const glowColor = isEbony ? 0x440066 : 0xffffaa;
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 * scale, 8, 8),
        new THREE.MeshBasicMaterial({
          color: glowColor,
          transparent: true,
          opacity: 0.3,
        }),
      );
      group.add(glow);

      const orbitRadius = stats.orbitRadius || 3;
      group.position.copy(playerPos);
      group.position.x += Math.cos(angle) * orbitRadius;
      group.position.z += Math.sin(angle) * orbitRadius;
      group.position.y = 1.5;

      this.game.scene.add(group);

      this.projectiles.push({
        type: type,
        mesh: group,
        angle: angle,
        orbitRadius: orbitRadius,
        orbitSpeed: stats.orbitSpeed || 2,
        damage: stats.damage,
        area: stats.area,
        duration: Infinity, // Birds don't expire
        elapsed: 0,
        hitCooldowns: {},
        wingAngle: 0,
        leftWing: leftWing,
        rightWing: rightWing,
      });
    }
  }

  // Pentagram - screen clear
  firePentagram(stats, playerPos, scale = 1) {
    // Create massive glowing pentagram effect
    const group = new THREE.Group();

    // Base glowing circle
    const circle = new THREE.Mesh(
      new THREE.RingGeometry(stats.area * 0.9, stats.area, 64),
      new THREE.MeshBasicMaterial({
        color: 0xff0044,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    circle.rotation.x = -Math.PI / 2;
    group.add(circle);

    // Inner filled glow
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area, 64),
      new THREE.MeshBasicMaterial({
        color: 0xff0022,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    group.add(glow);

    // Draw the 5-pointed star lines using tube geometry for thickness
    const points = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * stats.area,
          0,
          Math.sin(angle) * stats.area,
        ),
      );
    }
    const starOrder = [0, 2, 4, 1, 3, 0];
    const linePoints = starOrder.map((i) => points[i]);
    const curve = new THREE.CatmullRomCurve3(linePoints, false, "chordal");

    const starLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.5, 8, false),
      new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(starLine);

    group.position.copy(playerPos);
    group.position.y = 0.1;
    group.scale.setScalar(0.1);

    this.game.scene.add(group);

    // Kill all enemies in range
    const zombies = [...this.game.zombieManager.getZombies()];
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        this.game.zombieManager.damageZombie(zombie, stats.damage, null, true);
      }
    }

    // Screen effects
    if (this.game.screenShake) this.game.screenShake(1.5, 0.6);
    if (this.game.pulseBloom) this.game.pulseBloom(0.6, 4);

    // Animate expansion and fade
    let groupScale = 0.1;
    let opacity = 1.0;
    const animate = () => {
      groupScale += 0.1;
      opacity -= 0.02;

      if (opacity <= 0) {
        this.game.scene.remove(group);
        this.disposeObject(group);
      } else {
        group.scale.setScalar(groupScale);
        circle.material.opacity = opacity * 0.8;
        glow.material.opacity = opacity * 0.3;
        starLine.material.opacity = opacity * 0.9;
        group.rotation.y += 0.05;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    this.game.audioManager.playSound("pentagram");
  }

  // Clock Lancet - freeze enemies
  fireClockLancet(stats, playerPos, zombies, scale = 1) {
    const group = new THREE.Group();

    // Subtle frost fill (no thick border)
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area, 48),
      new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    face.rotation.x = -Math.PI / 2;
    group.add(face);

    // Thin edge ring (barely visible)
    const edgeRing = new THREE.Mesh(
      new THREE.RingGeometry(stats.area * 0.97, stats.area, 48),
      new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    edgeRing.rotation.x = -Math.PI / 2;
    edgeRing.position.y = 0.01;
    group.add(edgeRing);

    // Clock hands
    const handMat = new THREE.MeshBasicMaterial({
      color: 0xddeeff,
      transparent: true,
      opacity: 0.5,
    });

    const hourLen = stats.area * 0.4;
    const hourGeo = new THREE.BoxGeometry(0.08, 0.02, hourLen);
    hourGeo.translate(0, 0, hourLen / 2);
    const hourHand = new THREE.Mesh(hourGeo, handMat);
    hourHand.position.y = 0.03;
    hourHand.rotation.y = -Math.PI / 6;
    group.add(hourHand);

    const minLen = stats.area * 0.6;
    const minGeo = new THREE.BoxGeometry(0.05, 0.02, minLen);
    minGeo.translate(0, 0, minLen / 2);
    const minuteHand = new THREE.Mesh(minGeo, handMat);
    minuteHand.position.y = 0.04;
    minuteHand.rotation.y = Math.PI / 2.5;
    group.add(minuteHand);

    // Small center dot
    const centerDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 12),
      new THREE.MeshBasicMaterial({
        color: 0xddeeff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    centerDot.rotation.x = -Math.PI / 2;
    centerDot.position.y = 0.05;
    group.add(centerDot);

    group.position.copy(playerPos);
    group.position.y = 0.1;

    this.game.scene.add(group);

    // Freeze enemies in range
    const freezeDuration = stats.freezeDuration || 1.0;
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        // Store original speed and freeze
        if (!zombie.originalSpeed) {
          zombie.originalSpeed = zombie.speed;
        }
        zombie.speed = 0;
        zombie.isFrozen = true;

        // Visual freeze effect
        zombie.mesh.traverse((child) => {
          if (child.material && child.material.color) {
            child.userData.originalColor = child.material.color.getHex();
            child.material.color.setHex(0x99aabb);
          }
        });

        // Unfreeze after duration
        setTimeout(() => {
          if (zombie.originalSpeed) {
            zombie.speed = zombie.originalSpeed;
            zombie.isFrozen = false;
            // Restore color
            zombie.mesh.traverse((child) => {
              if (child.material && child.userData.originalColor) {
                child.material.color.setHex(child.userData.originalColor);
              }
            });
          }
        }, freezeDuration * 1000);
      }
    }

    // Animate clock fade
    this.effects.push({
      type: "clockLancet",
      mesh: group,
      duration: 0.5,
      elapsed: 0,
    });

    this.game.audioManager.playSound("lightning");
  }
}
