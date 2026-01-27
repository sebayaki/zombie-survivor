// Evolution System - Vampire Survivors style weapon evolution
// Combines max-level weapons with specific passive items to create powerful evolved weapons

import * as THREE from "three";

// Evolution recipes: weapon + passive = evolved weapon
export const EVOLUTION_RECIPES = {
  // Magic Wand + Empty Tome = Holy Wand (rapid fire divine projectiles)
  holyWand: {
    id: "holyWand",
    name: "Holy Wand",
    description: "Divine rapid-fire projectiles that pierce all enemies",
    icon: "✨",
    baseWeapon: "magicWand",
    requiredPassive: "emptyTome",
    stats: {
      damage: 35,
      cooldown: 0.15,
      projectileCount: 4,
      projectileSpeed: 25,
      pierce: Infinity,
      area: 1.5,
      duration: 3.0,
    },
  },

  // Whip + Hollow Heart = Bloody Tear (massive lifesteal whip)
  bloodyTear: {
    id: "bloodyTear",
    name: "Bloody Tear",
    description: "Drains enemy life force, heals you on hit",
    icon: "🩸",
    baseWeapon: "whip",
    requiredPassive: "hollowHeart",
    stats: {
      damage: 45,
      cooldown: 0.8,
      projectileCount: 2,
      area: 2.0,
      duration: 0.5,
      knockback: 4,
      lifesteal: 3, // HP healed per hit
    },
  },

  // Knife + Bracer = Thousand Edge (knife storm)
  thousandEdge: {
    id: "thousandEdge",
    name: "Thousand Edge",
    description: "Unleashes a storm of deadly knives",
    icon: "🗡️",
    baseWeapon: "knife",
    requiredPassive: "bracer",
    stats: {
      damage: 20,
      cooldown: 0.15,
      projectileCount: 8,
      projectileSpeed: 35,
      pierce: 2,
      area: 1.2,
      duration: 2.0,
    },
  },

  // Axe + Candelabrador = Death Spiral (giant spinning axes)
  deathSpiral: {
    id: "deathSpiral",
    name: "Death Spiral",
    description: "Massive spinning axes orbit around you",
    icon: "🌀",
    baseWeapon: "axe",
    requiredPassive: "candelabrador",
    stats: {
      damage: 50,
      cooldown: 2.0,
      projectileCount: 4,
      projectileSpeed: 6,
      pierce: Infinity,
      area: 2.5,
      duration: 8.0,
      orbiting: true,
      orbitRadius: 5,
    },
  },

  // Garlic + Pummarola = Soul Eater (massive damage aura + heal)
  soulEater: {
    id: "soulEater",
    name: "Soul Eater",
    description: "Devours souls, dealing massive damage and healing",
    icon: "👻",
    baseWeapon: "garlic",
    requiredPassive: "pummarola",
    stats: {
      damage: 15,
      cooldown: 0.3,
      area: 5.0,
      knockback: 3,
      duration: 0.4,
      lifesteal: 1,
    },
  },

  // Cross + Clover = Heaven Sword (homing divine blades)
  heavenSword: {
    id: "heavenSword",
    name: "Heaven Sword",
    description: "Divine blades that seek out enemies",
    icon: "⚔️",
    baseWeapon: "cross",
    requiredPassive: "clover",
    stats: {
      damage: 40,
      cooldown: 0.8,
      projectileCount: 3,
      projectileSpeed: 15,
      pierce: Infinity,
      area: 1.5,
      duration: 5.0,
      homing: true,
      homingStrength: 3,
    },
  },

  // Fire Wand + Spinach = Hellfire (massive fire explosions)
  hellfire: {
    id: "hellfire",
    name: "Hellfire",
    description: "Rains devastating fire from above",
    icon: "🔥",
    baseWeapon: "fireWand",
    requiredPassive: "spinach",
    stats: {
      damage: 80,
      cooldown: 1.0,
      projectileCount: 3,
      projectileSpeed: 20,
      area: 2.5,
      explosionRadius: 5,
      duration: 2.5,
    },
  },

  // Lightning + Duplicator = Thunder Loop (chain lightning)
  thunderLoop: {
    id: "thunderLoop",
    name: "Thunder Loop",
    description: "Lightning chains between enemies endlessly",
    icon: "⚡",
    baseWeapon: "lightning",
    requiredPassive: "duplicator",
    stats: {
      damage: 30,
      cooldown: 0.5,
      projectileCount: 5,
      area: 8.0,
      duration: 0.2,
      chainCount: 5, // How many times lightning can jump
    },
  },

  // Runetracer + Armor = NO FUTURE (devastating bouncing doom orb)
  noFuture: {
    id: "noFuture",
    name: "NO FUTURE",
    description: "An unstoppable orb of annihilation",
    icon: "💀",
    baseWeapon: "runetracer",
    requiredPassive: "armor",
    stats: {
      damage: 40,
      cooldown: 2.0,
      projectileCount: 2,
      projectileSpeed: 12,
      pierce: Infinity,
      duration: 12.0,
      bounces: true,
      explosionOnBounce: true,
      explosionRadius: 2,
    },
  },

  // Holy Water + Attractorb = La Borra (massive slowing pool)
  laBorra: {
    id: "laBorra",
    name: "La Borra",
    description: "Creates massive pools that slow and damage",
    icon: "🌊",
    baseWeapon: "holyWater",
    requiredPassive: "attractorb",
    stats: {
      damage: 20,
      cooldown: 1.5,
      projectileCount: 3,
      area: 5.0,
      duration: 6.0,
      tickRate: 0.2,
      slowAmount: 0.5, // 50% slow
    },
  },
};

export class EvolutionSystem {
  constructor(game) {
    this.game = game;
    this.evolvedWeapons = []; // Weapons that have been evolved
    this.pendingEvolutions = []; // Evolutions ready to be claimed
  }

  reset() {
    this.evolvedWeapons = [];
    this.pendingEvolutions = [];
  }

  // Check if any weapons can evolve
  checkEvolutions() {
    const weaponSystem = this.game.autoWeaponSystem;
    const passiveSystem = this.game.passiveItemSystem;

    for (const [evolvedId, recipe] of Object.entries(EVOLUTION_RECIPES)) {
      // Skip if already evolved
      if (this.evolvedWeapons.includes(evolvedId)) continue;

      // Check if base weapon is max level (8)
      const weaponLevel = weaponSystem.getWeaponLevel(recipe.baseWeapon);
      if (weaponLevel < 8) continue;

      // Check if required passive is owned
      if (!passiveSystem.hasItem(recipe.requiredPassive)) continue;

      // Evolution is possible!
      if (!this.pendingEvolutions.includes(evolvedId)) {
        this.pendingEvolutions.push(evolvedId);
        console.log(`Evolution available: ${recipe.name}!`);
      }
    }

    return this.pendingEvolutions.length > 0;
  }

  // Get list of pending evolutions for UI
  getPendingEvolutions() {
    return this.pendingEvolutions.map((id) => ({
      ...EVOLUTION_RECIPES[id],
      type: "evolution",
    }));
  }

  // Perform evolution
  evolve(evolvedId) {
    const recipe = EVOLUTION_RECIPES[evolvedId];
    if (!recipe) return false;

    // Remove from pending
    const pendingIndex = this.pendingEvolutions.indexOf(evolvedId);
    if (pendingIndex === -1) return false;
    this.pendingEvolutions.splice(pendingIndex, 1);

    // Remove base weapon from equipped weapons
    const weaponSystem = this.game.autoWeaponSystem;
    const weaponIndex = weaponSystem.equippedWeapons.findIndex(
      (w) => w.id === recipe.baseWeapon
    );
    if (weaponIndex !== -1) {
      weaponSystem.equippedWeapons.splice(weaponIndex, 1);
    }

    // Add evolved weapon
    weaponSystem.equippedWeapons.push({
      id: evolvedId,
      level: 1, // Evolved weapons start at level 1 but are already powerful
      isEvolved: true,
    });

    this.evolvedWeapons.push(evolvedId);

    // Play evolution sound and effect
    this.game.audioManager.playSound("evolution");
    this.createEvolutionEffect();

    console.log(`Evolved ${recipe.baseWeapon} into ${recipe.name}!`);
    return true;
  }

  // Check if a weapon is evolved
  isEvolved(weaponId) {
    return EVOLUTION_RECIPES[weaponId] !== undefined;
  }

  // Get evolved weapon stats
  getEvolvedStats(weaponId) {
    const recipe = EVOLUTION_RECIPES[weaponId];
    if (!recipe) return null;

    // Apply player stat bonuses
    const stats = { ...recipe.stats };
    const playerStats = this.game.playerStats || {};

    if (playerStats.might) stats.damage *= 1 + playerStats.might * 0.1;
    if (playerStats.area) {
      stats.area *= 1 + playerStats.area * 0.1;
      if (stats.explosionRadius)
        stats.explosionRadius *= 1 + playerStats.area * 0.1;
    }
    if (playerStats.speed && stats.projectileSpeed)
      stats.projectileSpeed *= 1 + playerStats.speed * 0.1;
    if (playerStats.duration) stats.duration *= 1 + playerStats.duration * 0.1;
    if (playerStats.cooldown) stats.cooldown *= 1 - playerStats.cooldown * 0.05;

    return stats;
  }

  createEvolutionEffect() {
    const playerPos = this.game.player.getPosition();

    // Create spectacular evolution visual
    const group = new THREE.Group();
    group.position.copy(playerPos);
    group.position.y = 1;

    // Golden burst rings
    for (let r = 0; r < 3; r++) {
      const ringGeometry = new THREE.RingGeometry(0.5 + r * 0.5, 1 + r * 0.5, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.userData.delay = r * 0.1;
      ring.userData.material = ringMaterial;
      group.add(ring);
    }

    // Rising particles
    const particleCount = 30;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffdd00 : 0xffffff,
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(geometry, material);
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1 + Math.random() * 2;
      particle.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        5 + Math.random() * 3,
        (Math.random() - 0.5) * 2
      );
      group.add(particle);
      particles.push(particle);
    }

    this.game.scene.add(group);

    // Animate
    let elapsed = 0;
    const animate = () => {
      elapsed += 0.016;

      // Expand rings
      group.children.forEach((child, i) => {
        if (child.userData.material) {
          const delay = child.userData.delay || 0;
          const t = Math.max(0, elapsed - delay);
          child.scale.setScalar(1 + t * 5);
          child.userData.material.opacity = Math.max(0, 0.8 - t * 1.5);
        }
      });

      // Animate particles
      particles.forEach((p) => {
        p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
        p.userData.velocity.y -= 10 * 0.016;
        p.material.opacity = Math.max(0, 1 - elapsed);
      });

      if (elapsed < 2) {
        requestAnimationFrame(animate);
      } else {
        this.game.scene.remove(group);
      }
    };
    requestAnimationFrame(animate);

    // Screen shake
    if (this.game.screenShake) {
      this.game.screenShake(0.5, 0.3);
    }
  }
}
