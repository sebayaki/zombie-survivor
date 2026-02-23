// Passive Items - Vampire Survivors style stat boosters
export const PASSIVE_ITEMS = {
  spinach: {
    id: "spinach",
    name: "Spinach",
    description: "+10% Might (damage)",
    icon: '<i class="fa-solid fa-leaf"></i>',
    maxLevel: 5,
    stat: "might",
    bonusPerLevel: 1,
  },

  armor: {
    id: "armor",
    name: "Armor",
    description: "+1 Armor (damage reduction)",
    icon: '<i class="fa-solid fa-shield-halved"></i>',
    maxLevel: 5,
    stat: "armor",
    bonusPerLevel: 1,
  },

  wings: {
    id: "wings",
    name: "Wings",
    description: "+10% Movement Speed",
    icon: '<i class="fa-solid fa-feather"></i>',
    maxLevel: 5,
    stat: "moveSpeed",
    bonusPerLevel: 1,
  },

  hollowHeart: {
    id: "hollowHeart",
    name: "Hollow Heart",
    description: "+20% Max Health",
    icon: '<i class="fa-solid fa-heart"></i>',
    maxLevel: 5,
    stat: "maxHealth",
    bonusPerLevel: 1,
  },

  pummarola: {
    id: "pummarola",
    name: "Pummarola",
    description: "+0.2 HP/s Recovery",
    icon: '<i class="fa-solid fa-apple-whole"></i>',
    maxLevel: 5,
    stat: "recovery",
    bonusPerLevel: 1,
  },

  emptyTome: {
    id: "emptyTome",
    name: "Empty Tome",
    description: "-5% Cooldown",
    icon: '<i class="fa-solid fa-book"></i>',
    maxLevel: 5,
    stat: "cooldown",
    bonusPerLevel: 1,
  },

  candelabrador: {
    id: "candelabrador",
    name: "Candelabrador",
    description: "+10% Area",
    icon: '<i class="fa-solid fa-fire-flame-simple"></i>',
    maxLevel: 5,
    stat: "area",
    bonusPerLevel: 1,
  },

  bracer: {
    id: "bracer",
    name: "Bracer",
    description: "+10% Projectile Speed",
    icon: '<i class="fa-solid fa-hand-fist"></i>',
    maxLevel: 5,
    stat: "speed",
    bonusPerLevel: 1,
  },

  spellbinder: {
    id: "spellbinder",
    name: "Spellbinder",
    description: "+10% Duration",
    icon: '<i class="fa-solid fa-ring"></i>',
    maxLevel: 5,
    stat: "duration",
    bonusPerLevel: 1,
  },

  duplicator: {
    id: "duplicator",
    name: "Duplicator",
    description: "+1 Amount (projectiles)",
    icon: '<i class="fa-solid fa-moon"></i>',
    maxLevel: 2,
    stat: "amount",
    bonusPerLevel: 1,
  },

  attractorb: {
    id: "attractorb",
    name: "Attractorb",
    description: "+50% Pickup Range",
    icon: '<i class="fa-solid fa-magnet"></i>',
    maxLevel: 5,
    stat: "magnet",
    bonusPerLevel: 1.5,
  },

  clover: {
    id: "clover",
    name: "Clover",
    description: "+10% Luck",
    icon: '<i class="fa-solid fa-clover"></i>',
    maxLevel: 5,
    stat: "luck",
    bonusPerLevel: 1,
  },

  crown: {
    id: "crown",
    name: "Crown",
    description: "+8% Growth (bonus XP)",
    icon: '<i class="fa-solid fa-crown"></i>',
    maxLevel: 5,
    stat: "growth",
    bonusPerLevel: 1,
  },

  stoneMask: {
    id: "stoneMask",
    name: "Stone Mask",
    description: "+10% Greed (bonus gold)",
    icon: '<i class="fa-solid fa-masks-theater"></i>',
    maxLevel: 5,
    stat: "greed",
    bonusPerLevel: 1,
  },

  tiragisu: {
    id: "tiragisu",
    name: "Tiragisu",
    description: "+1 Revival",
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

  // Update player stats based on all passive items
  updatePlayerStats() {
    const stats = {};

    for (const item of this.items) {
      const def = PASSIVE_ITEMS[item.id];
      stats[def.stat] = (stats[def.stat] || 0) + def.bonusPerLevel * item.level;
    }

    this.game.playerStats = stats;

    // Apply direct stat changes to player
    if (this.game.player) {
      // Movement speed
      const baseSpeed = 8;
      this.game.player.speed = baseSpeed * (1 + (stats.moveSpeed || 0) * 0.1);

      // Max health
      const baseMaxHealth = 100;
      const newMaxHealth = Math.floor(
        baseMaxHealth * (1 + (stats.maxHealth || 0) * 0.2),
      );
      if (newMaxHealth > this.game.player.maxHealth) {
        // Heal the difference when max health increases
        const diff = newMaxHealth - this.game.player.maxHealth;
        this.game.player.maxHealth = newMaxHealth;
        this.game.player.health = Math.min(
          this.game.player.health + diff,
          newMaxHealth,
        );
      }

      // Magnet range
      if (this.game.xpSystem) {
        this.game.xpSystem.magnetRadius = 3 + (stats.magnet || 0);
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
          icon: def.icon,
          description: `Level ${item.level + 1}: ${def.description}`,
          currentLevel: item.level,
        });
      }
    }

    // Add new items player doesn't have
    for (const [id, def] of Object.entries(PASSIVE_ITEMS)) {
      if (!this.hasItem(id)) {
        upgrades.push({
          type: "passive",
          id: id,
          name: def.name,
          icon: def.icon,
          description: def.description,
          currentLevel: 0,
        });
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
