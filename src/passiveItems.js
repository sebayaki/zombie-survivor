// Passive Items - Vampire Survivors style stat boosters
export const PASSIVE_ITEMS = {
  spinach: {
    id: "spinach",
    name: "Spinach",
    rarity: "common",
    description: "+10% Might (damage)",
    iconColor: "#44cc44",
    icon: '<i class="fa-solid fa-leaf"></i>',
    maxLevel: 5,
    stat: "might",
    bonusPerLevel: 1,
  },

  armor: {
    id: "armor",
    name: "Armor",
    rarity: "common",
    description: "+1 Armor (damage reduction)",
    iconColor: "#aaaaaa",
    icon: '<i class="fa-solid fa-shield-halved"></i>',
    maxLevel: 5,
    stat: "armor",
    bonusPerLevel: 1,
  },

  wings: {
    id: "wings",
    name: "Wings",
    rarity: "common",
    description: "+10% Movement Speed",
    iconColor: "#aaddff",
    icon: '<i class="fa-solid fa-feather"></i>',
    maxLevel: 5,
    stat: "moveSpeed",
    bonusPerLevel: 1,
  },

  hollowHeart: {
    id: "hollowHeart",
    name: "Hollow Heart",
    rarity: "common",
    description: "+20% Max Health",
    iconColor: "#ff4444",
    icon: '<i class="fa-solid fa-heart"></i>',
    maxLevel: 5,
    stat: "maxHealth",
    bonusPerLevel: 1,
  },

  pummarola: {
    id: "pummarola",
    name: "Pummarola",
    rarity: "uncommon",
    description: "+0.2 HP/s Recovery",
    iconColor: "#ff4444",
    icon: '<i class="fa-solid fa-apple-whole"></i>',
    maxLevel: 5,
    stat: "recovery",
    bonusPerLevel: 1,
  },

  emptyTome: {
    id: "emptyTome",
    name: "Empty Tome",
    rarity: "rare",
    description: "-5% Cooldown",
    iconColor: "#aa8866",
    icon: '<i class="fa-solid fa-book"></i>',
    maxLevel: 5,
    stat: "cooldown",
    bonusPerLevel: 1,
  },

  candelabrador: {
    id: "candelabrador",
    name: "Candelabrador",
    rarity: "uncommon",
    description: "+10% Area",
    iconColor: "#ff8800",
    icon: '<i class="fa-solid fa-fire-flame-simple"></i>',
    maxLevel: 5,
    stat: "area",
    bonusPerLevel: 1,
  },

  bracer: {
    id: "bracer",
    name: "Bracer",
    rarity: "common",
    description: "+10% Projectile Speed",
    iconColor: "#cc8844",
    icon: '<i class="fa-solid fa-hand-fist"></i>',
    maxLevel: 5,
    stat: "speed",
    bonusPerLevel: 1,
  },

  spellbinder: {
    id: "spellbinder",
    name: "Spellbinder",
    rarity: "uncommon",
    description: "+10% Duration",
    iconColor: "#aa44ff",
    icon: '<i class="fa-solid fa-ring"></i>',
    maxLevel: 5,
    stat: "duration",
    bonusPerLevel: 1,
  },

  duplicator: {
    id: "duplicator",
    name: "Duplicator",
    rarity: "legendary",
    description: "+1 Amount (projectiles)",
    iconColor: "#ffcc00",
    icon: '<i class="fa-solid fa-moon"></i>',
    maxLevel: 2,
    stat: "amount",
    bonusPerLevel: 1,
  },

  attractorb: {
    id: "attractorb",
    name: "Attractorb",
    rarity: "common",
    description: "+50% Pickup Range",
    iconColor: "#ff2222",
    icon: '<i class="fa-solid fa-magnet"></i>',
    maxLevel: 5,
    stat: "magnet",
    bonusPerLevel: 1.5,
  },

  clover: {
    id: "clover",
    name: "Clover",
    rarity: "uncommon",
    description: "+10% Luck",
    iconColor: "#22cc22",
    icon: '<i class="fa-solid fa-clover"></i>',
    maxLevel: 5,
    stat: "luck",
    bonusPerLevel: 1,
  },

  crown: {
    id: "crown",
    name: "Crown",
    rarity: "rare",
    description: "+8% Growth (bonus XP)",
    iconColor: "#ffcc00",
    icon: '<i class="fa-solid fa-crown"></i>',
    maxLevel: 5,
    stat: "growth",
    bonusPerLevel: 1,
  },

  stoneMask: {
    id: "stoneMask",
    name: "Stone Mask",
    rarity: "rare",
    description: "+10% Greed (bonus gold)",
    iconColor: "#ccaa44",
    icon: '<i class="fa-solid fa-masks-theater"></i>',
    maxLevel: 5,
    stat: "greed",
    bonusPerLevel: 1,
  },

  tiragisu: {
    id: "tiragisu",
    name: "Tiragisu",
    rarity: "legendary",
    description: "+1 Revival",
    iconColor: "#ff88aa",
    icon: '<i class="fa-solid fa-cake-candles"></i>',
    maxLevel: 3,
    stat: "revival",
    bonusPerLevel: 1,
  },
};

export class PassiveItemSystem {
  constructor(game) {
    this.game = game;

    // Player's passive items
    this.items = [];
  }

  reset() {
    this.items = [];
    this.updatePlayerStats();
  }

  // Add or upgrade a passive item
  addItem(itemId) {
    const def = PASSIVE_ITEMS[itemId];
    if (!def) return false;

    const existing = this.items.find((i) => i.id === itemId);

    if (existing) {
      // Upgrade existing
      if (existing.level < def.maxLevel) {
        existing.level++;
        this.updatePlayerStats();
        console.log(`${def.name} upgraded to level ${existing.level}`);
        return true;
      }
      return false; // Already max level
    } else {
      // Add new
      this.items.push({
        id: itemId,
        level: 1,
      });
      this.updatePlayerStats();
      console.log(`Acquired ${def.name}!`);
      return true;
    }
  }

  // Check if player has item
  hasItem(itemId) {
    return this.items.some((i) => i.id === itemId);
  }

  // Get item level
  getItemLevel(itemId) {
    const item = this.items.find((i) => i.id === itemId);
    return item ? item.level : 0;
  }

  // Get total bonus for a stat
  getStatBonus(stat) {
    let total = 0;

    for (const item of this.items) {
      const def = PASSIVE_ITEMS[item.id];
      if (def.stat === stat) {
        total += def.bonusPerLevel * item.level;
      }
    }

    return total;
  }

  // Update player stats based on all passive items + permanent power-up bonuses
  updatePlayerStats() {
    const stats = {};

    // Passive item bonuses (in-game)
    for (const item of this.items) {
      const def = PASSIVE_ITEMS[item.id];
      stats[def.stat] = (stats[def.stat] || 0) + def.bonusPerLevel * item.level;
    }

    // Merge permanent power-up bonuses (shop upgrades)
    if (this.game.powerUpSystem) {
      const puBonuses = this.game.powerUpSystem.getAllStatBonuses();
      for (const [stat, value] of Object.entries(puBonuses)) {
        stats[stat] = (stats[stat] || 0) + value;
      }
    }

    this.game.playerStats = stats;

    // Apply arcana effects
    let maxHealthMult = 1;
    let moveSpeedMult = 1;
    let magnetMult = 1;
    if (this.game.arcanaSystem) {
      const arcana = this.game.arcanaSystem.getActiveEffects();
      if (arcana.maxHealthMult) maxHealthMult *= arcana.maxHealthMult;
      if (arcana.moveSpeedMult) moveSpeedMult *= arcana.moveSpeedMult;
      if (arcana.magnetMult) magnetMult *= arcana.magnetMult;
      if (arcana.bonusArmor) stats.armor = (stats.armor || 0) + arcana.bonusArmor;
      if (arcana.bonusAmount) stats.amount = (stats.amount || 0) + arcana.bonusAmount;
      if (arcana.cooldownMult) stats.cooldown = (stats.cooldown || 0) + (1 - arcana.cooldownMult) / 0.05;
    }

    // Apply direct stat changes to player
    if (this.game.player) {
      const baseSpeed = 8;
      this.game.player.speed = baseSpeed * (1 + (stats.moveSpeed || 0) * 0.1) * moveSpeedMult;

      const baseMaxHealth = 100;
      const newMaxHealth = Math.floor(
        baseMaxHealth * (1 + (stats.maxHealth || 0) * 0.2) * maxHealthMult,
      );
      if (newMaxHealth !== this.game.player.maxHealth) {
        const oldMax = this.game.player.maxHealth;
        this.game.player.maxHealth = newMaxHealth;
        if (newMaxHealth > oldMax) {
          const diff = newMaxHealth - oldMax;
          this.game.player.health = Math.min(
            this.game.player.health + diff,
            newMaxHealth,
          );
        } else {
          this.game.player.health = Math.min(this.game.player.health, newMaxHealth);
        }
      }

      if (this.game.xpSystem) {
        this.game.xpSystem.magnetRadius = (3 + (stats.magnet || 0)) * magnetMult;
      }
    }
  }

  // Get available upgrades for level up selection
  getAvailableUpgrades() {
    const upgrades = [];

    // Add upgrades for owned items that aren't max level
    for (const item of this.items) {
      const def = PASSIVE_ITEMS[item.id];
      if (item.level < def.maxLevel) {
        upgrades.push({
          type: "passive",
          id: item.id,
          name: def.name,
          rarity: def.rarity || "common",
          icon: def.icon,
          iconColor: def.iconColor,
          description: `Level ${item.level + 1}: ${def.description}`,
          currentLevel: item.level,
        });
      }
    }

    // Add new items player doesn't have, ONLY IF we haven't reached max slots (6)
    const MAX_PASSIVE_SLOTS = 6;
    if (this.items.length < MAX_PASSIVE_SLOTS) {
      for (const [id, def] of Object.entries(PASSIVE_ITEMS)) {
        if (!this.hasItem(id)) {
          upgrades.push({
            type: "passive",
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

  // Apply HP recovery (called every frame)
  update(delta) {
    const recovery = this.getStatBonus("recovery");
    if (recovery > 0 && this.game.player) {
      const healAmount = recovery * 0.2 * delta; // 0.2 HP/s per level
      if (this.game.player.health < this.game.player.maxHealth) {
        this.game.player.health = Math.min(
          this.game.player.maxHealth,
          this.game.player.health + healAmount,
        );
      }
    }
  }

  getItems() {
    return this.items;
  }
}
