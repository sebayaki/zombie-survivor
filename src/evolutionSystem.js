// Evolution System - Vampire Survivors style weapon evolution
// Combines max-level weapons with specific passive items to create powerful evolved weapons

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
      slowAmount: 0.5,
    },
  },

  // Bone + Wings = Skull O'Maniac (homing bone storm)
  skullOManiac: {
    id: "skullOManiac",
    name: "Skull O'Maniac",
    description: "A relentless swarm of homing bones",
    icon: "💀",
    baseWeapon: "bone",
    requiredPassive: "wings",
    stats: {
      damage: 25,
      cooldown: 0.4,
      projectileCount: 6,
      projectileSpeed: 22,
      bounceCount: 8,
      area: 1.2,
      duration: 5.0,
      homing: true,
      homingStrength: 4,
    },
  },

  // Magic Missile + Spellbinder = Guided Meteor (giant homing explosions)
  guidedMeteor: {
    id: "guidedMeteor",
    name: "Guided Meteor",
    description: "Massive homing missiles that explode on impact",
    icon: "☄️",
    baseWeapon: "magicMissile",
    requiredPassive: "spellbinder",
    stats: {
      damage: 60,
      cooldown: 1.2,
      projectileCount: 4,
      projectileSpeed: 10,
      pierce: 0,
      area: 2.0,
      duration: 6.0,
      homing: true,
      homingStrength: 5,
      explosionRadius: 4,
    },
  },

  // Peachone + Ebony Wings = Vandalier (dual-weapon evolution)
  vandalier: {
    id: "vandalier",
    name: "Vandalier",
    description: "Light and dark birds merge into an unstoppable force",
    icon: "🦅",
    baseWeapon: "peachone",
    requiredWeapon: "ebonyWings",
    stats: {
      damage: 30,
      cooldown: 0,
      projectileCount: 8,
      orbitRadius: 4.5,
      orbitSpeed: 4,
      area: 2.0,
    },
  },

  // Pentagram + Crown = Gorgeous Moon (efficient screen clear)
  gorgeousMoon: {
    id: "gorgeousMoon",
    name: "Gorgeous Moon",
    description: "Erases enemies and showers you in experience",
    icon: "🌙",
    baseWeapon: "pentagram",
    requiredPassive: "crown",
    stats: {
      damage: 999,
      cooldown: 25,
      area: 50,
      duration: 0.8,
      bonusXp: 20,
    },
  },

  // Clock Lancet + Stone Mask = Infinite Corridor (freeze + damage zone)
  infiniteCorridor: {
    id: "infiniteCorridor",
    name: "Infinite Corridor",
    description: "A temporal rift that freezes and shatters enemies",
    icon: "⏳",
    baseWeapon: "clockLancet",
    requiredPassive: "stoneMask",
    stats: {
      damage: 15,
      cooldown: 1.5,
      area: 8.0,
      freezeDuration: 2.5,
      duration: 3.0,
      tickRate: 0.4,
    },
  },

  // Laurel + Tiragisu = Crimson Shroud (auto-shield + reflect)
  crimsonShroud: {
    id: "crimsonShroud",
    name: "Crimson Shroud",
    description: "An ever-present barrier that reflects damage",
    icon: "🛡️",
    baseWeapon: "laurel",
    requiredPassive: "tiragisu",
    stats: {
      cooldown: 12,
      shieldDuration: 3.0,
      reflectDamage: 30,
      reflectRadius: 5,
    },
  },
};

// Super Evolution recipes — require an evolved weapon + Stage 5+
// Each fundamentally changes the weapon's behavior
export const SUPER_EVOLUTION_RECIPES = {
  // Holy Wand -> Celestial Barrage (sweeping beam projectiles)
  celestialBarrage: {
    id: "celestialBarrage",
    name: "Celestial Barrage",
    description: "Fires sweeping divine beams that pierce all and chain-explode",
    icon: "🌟",
    baseEvolution: "holyWand",
    requiredStage: 5,
    stats: {
      damage: 55,
      cooldown: 0.1,
      projectileCount: 6,
      projectileSpeed: 30,
      pierce: Infinity,
      area: 2.0,
      duration: 3.5,
      explosionRadius: 2,
    },
  },

  // Bloody Tear -> Sanguine Tempest (massive AoE lifesteal storm)
  sanguineTempest: {
    id: "sanguineTempest",
    name: "Sanguine Tempest",
    description: "A crimson storm that drains all nearby enemies",
    icon: "🌪️",
    baseEvolution: "bloodyTear",
    requiredStage: 5,
    stats: {
      damage: 65,
      cooldown: 0.5,
      projectileCount: 4,
      area: 4.0,
      duration: 0.6,
      knockback: 6,
      lifesteal: 8,
    },
  },

  // Thousand Edge -> Blade Maelstrom (a permanent whirlwind of knives)
  bladeMaelstrom: {
    id: "bladeMaelstrom",
    name: "Blade Maelstrom",
    description: "An infinite storm of knives orbits you",
    icon: "⚔️",
    baseEvolution: "thousandEdge",
    requiredStage: 6,
    stats: {
      damage: 30,
      cooldown: 0.08,
      projectileCount: 12,
      projectileSpeed: 40,
      pierce: 3,
      area: 1.5,
      duration: 2.5,
    },
  },

  // Hellfire -> Infernal Cataclysm (screen-wide fire rain)
  infernalCataclysm: {
    id: "infernalCataclysm",
    name: "Infernal Cataclysm",
    description: "Rains apocalyptic fire across the entire battlefield",
    icon: "🌋",
    baseEvolution: "hellfire",
    requiredStage: 6,
    stats: {
      damage: 120,
      cooldown: 0.7,
      projectileCount: 5,
      projectileSpeed: 25,
      area: 4.0,
      explosionRadius: 7,
      duration: 3.0,
    },
  },

  // Thunder Loop -> Stormcaller's Judgment (permanent chain-lightning field)
  stormcallersJudgment: {
    id: "stormcallersJudgment",
    name: "Stormcaller's Judgment",
    description: "Lightning eternally arcs between all nearby enemies",
    icon: "🌩️",
    baseEvolution: "thunderLoop",
    requiredStage: 7,
    stats: {
      damage: 50,
      cooldown: 0.3,
      projectileCount: 8,
      area: 12.0,
      duration: 0.3,
      chainCount: 8,
    },
  },

  // Death Spiral -> Orbital Annihilator (massive orbiting death field)
  orbitalAnnihilator: {
    id: "orbitalAnnihilator",
    name: "Orbital Annihilator",
    description: "Giant blades of death orbit at incredible speed",
    icon: "💫",
    baseEvolution: "deathSpiral",
    requiredStage: 7,
    stats: {
      damage: 80,
      cooldown: 1.5,
      projectileCount: 6,
      projectileSpeed: 10,
      pierce: Infinity,
      area: 3.5,
      duration: 12.0,
      orbiting: true,
      orbitRadius: 7,
    },
  },

  // Heaven Sword -> Archangel's Fury (homing divine cluster)
  archangelsFury: {
    id: "archangelsFury",
    name: "Archangel's Fury",
    description: "Relentless divine blades that hunt down all enemies",
    icon: "👼",
    baseEvolution: "heavenSword",
    requiredStage: 8,
    stats: {
      damage: 60,
      cooldown: 0.5,
      projectileCount: 6,
      projectileSpeed: 20,
      pierce: Infinity,
      area: 2.0,
      duration: 7.0,
      homing: true,
      homingStrength: 5,
    },
  },
};

export class EvolutionSystem {
  constructor(game) {
    this.game = game;
    this.evolvedWeapons = [];
    this.superEvolvedWeapons = [];
    this.pendingEvolutions = [];
  }

  reset() {
    this.evolvedWeapons = [];
    this.superEvolvedWeapons = [];
    this.pendingEvolutions = [];
  }

  checkEvolutions() {
    const weaponSystem = this.game.autoWeaponSystem;
    const passiveSystem = this.game.passiveItemSystem;

    // Check normal evolutions
    for (const [evolvedId, recipe] of Object.entries(EVOLUTION_RECIPES)) {
      if (this.evolvedWeapons.includes(evolvedId)) continue;

      const weaponLevel = weaponSystem.getWeaponLevel(recipe.baseWeapon);
      if (weaponLevel < 8) continue;

      if (recipe.requiredWeapon) {
        const secondLevel = weaponSystem.getWeaponLevel(recipe.requiredWeapon);
        if (secondLevel < 8) continue;
      } else {
        if (!passiveSystem.hasItem(recipe.requiredPassive)) continue;
      }

      if (!this.pendingEvolutions.includes(evolvedId)) {
        this.pendingEvolutions.push(evolvedId);
        console.log(`Evolution available: ${recipe.name}!`);
      }
    }

    // Check super evolutions (require stage threshold + having the base evolution equipped)
    const currentStage = this.game.stageSystem ? this.game.stageSystem.currentStage : 1;
    for (const [superId, recipe] of Object.entries(SUPER_EVOLUTION_RECIPES)) {
      if (this.superEvolvedWeapons.includes(superId)) continue;
      if (currentStage < recipe.requiredStage) continue;

      const hasBaseEvolution = weaponSystem.equippedWeapons.some(
        (w) => w.id === recipe.baseEvolution && w.isEvolved,
      );
      if (!hasBaseEvolution) continue;

      if (!this.pendingEvolutions.includes(superId)) {
        this.pendingEvolutions.push(superId);
        console.log(`Super Evolution available: ${recipe.name}!`);
      }
    }

    return this.pendingEvolutions.length > 0;
  }

  getPendingEvolutions() {
    return this.pendingEvolutions.map((id) => {
      if (SUPER_EVOLUTION_RECIPES[id]) {
        return { ...SUPER_EVOLUTION_RECIPES[id], type: "evolution", isSuperEvolution: true };
      }
      return { ...EVOLUTION_RECIPES[id], type: "evolution" };
    });
  }

  evolve(evolvedId) {
    // Check if this is a super evolution
    const superRecipe = SUPER_EVOLUTION_RECIPES[evolvedId];
    if (superRecipe) {
      return this.superEvolve(evolvedId, superRecipe);
    }

    const recipe = EVOLUTION_RECIPES[evolvedId];
    if (!recipe) return false;

    const pendingIndex = this.pendingEvolutions.indexOf(evolvedId);
    if (pendingIndex === -1) return false;
    this.pendingEvolutions.splice(pendingIndex, 1);

    const weaponSystem = this.game.autoWeaponSystem;

    const weaponIndex = weaponSystem.equippedWeapons.findIndex(
      (w) => w.id === recipe.baseWeapon,
    );
    if (weaponIndex !== -1) {
      weaponSystem.equippedWeapons.splice(weaponIndex, 1);
    }

    if (recipe.requiredWeapon) {
      const secondIndex = weaponSystem.equippedWeapons.findIndex(
        (w) => w.id === recipe.requiredWeapon,
      );
      if (secondIndex !== -1) {
        weaponSystem.equippedWeapons.splice(secondIndex, 1);
      }
    }

    weaponSystem.equippedWeapons.push({
      id: evolvedId,
      level: 1,
      isEvolved: true,
    });

    this.evolvedWeapons.push(evolvedId);

    this.game.audioManager.playSound("evolution");
    this.createEvolutionEffect();

    console.log(`Evolved ${recipe.baseWeapon} into ${recipe.name}!`);
    return true;
  }

  superEvolve(superId, recipe) {
    const pendingIndex = this.pendingEvolutions.indexOf(superId);
    if (pendingIndex === -1) return false;
    this.pendingEvolutions.splice(pendingIndex, 1);

    const weaponSystem = this.game.autoWeaponSystem;

    // Remove the base evolved weapon
    const weaponIndex = weaponSystem.equippedWeapons.findIndex(
      (w) => w.id === recipe.baseEvolution,
    );
    if (weaponIndex !== -1) {
      weaponSystem.equippedWeapons.splice(weaponIndex, 1);
    }

    weaponSystem.equippedWeapons.push({
      id: superId,
      level: 1,
      isEvolved: true,
      isSuperEvolved: true,
    });

    this.superEvolvedWeapons.push(superId);

    this.game.audioManager.playSound("evolution");
    this.createSuperEvolutionEffect();

    console.log(`Super Evolved into ${recipe.name}!`);
    return true;
  }

  isEvolved(weaponId) {
    return EVOLUTION_RECIPES[weaponId] !== undefined || SUPER_EVOLUTION_RECIPES[weaponId] !== undefined;
  }

  getEvolvedStats(weaponId) {
    const recipe = EVOLUTION_RECIPES[weaponId] || SUPER_EVOLUTION_RECIPES[weaponId];
    if (!recipe) return null;

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

  createSuperEvolutionEffect() {
    const playerPos = this.game.player.getPosition();

    if (this.game.particleSystem) {
      this.game.particleSystem.spawn(playerPos, "evolution");
      this.game.particleSystem.spawn(playerPos, "bossDeath");
      this.game.particleSystem.createShockwave(playerPos, 8, 0xff44ff, 1.2);
      this.game.particleSystem.createShockwave(playerPos, 5, 0xffdd00, 0.8);
    }

    if (this.game.postProcessing) {
      this.game.postProcessing.shake(0.8, 0.5);
      this.game.postProcessing.pulseBloom(0.6, 3.5);
      this.game.postProcessing.slowTime(0.2, 1.0);
    }
  }

  createEvolutionEffect() {
    const playerPos = this.game.player.getPosition();

    if (this.game.particleSystem) {
      this.game.particleSystem.spawn(playerPos, "evolution");
      this.game.particleSystem.createShockwave(playerPos, 5, 0xffdd00, 1.0);
    }

    if (this.game.screenShake) {
      this.game.screenShake(0.5, 0.3);
    }
  }
}
