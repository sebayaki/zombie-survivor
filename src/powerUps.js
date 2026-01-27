// PowerUps System - Permanent upgrades purchased with gold (Vampire Survivors style)
// These persist between runs and provide permanent stat bonuses

export const POWER_UPS = {
  // Might - increases all damage
  might: {
    id: "might",
    name: "Might",
    description: "Increases base damage by 5%",
    icon: "💪",
    maxLevel: 5,
    costPerLevel: [100, 300, 600, 1000, 2000],
    bonusPerLevel: 0.05, // 5% per level
    stat: "might",
  },

  // Armor - damage reduction
  armor: {
    id: "armor",
    name: "Armor",
    description: "Reduces incoming damage by 1",
    icon: "🛡️",
    maxLevel: 3,
    costPerLevel: [200, 500, 1000],
    bonusPerLevel: 1,
    stat: "armor",
  },

  // Max Health - increases maximum HP
  maxHealth: {
    id: "maxHealth",
    name: "Max Health",
    description: "Increases max HP by 10%",
    icon: "❤️",
    maxLevel: 5,
    costPerLevel: [100, 250, 500, 800, 1500],
    bonusPerLevel: 0.1,
    stat: "maxHealth",
  },

  // Recovery - HP regeneration
  recovery: {
    id: "recovery",
    name: "Recovery",
    description: "Increases HP recovery by 0.1/s",
    icon: "💚",
    maxLevel: 5,
    costPerLevel: [150, 350, 600, 900, 1500],
    bonusPerLevel: 0.1,
    stat: "recovery",
  },

  // Cooldown - weapon cooldown reduction
  cooldown: {
    id: "cooldown",
    name: "Cooldown",
    description: "Reduces weapon cooldown by 2.5%",
    icon: "⏱️",
    maxLevel: 5,
    costPerLevel: [200, 400, 700, 1200, 2000],
    bonusPerLevel: 0.025,
    stat: "cooldown",
  },

  // Area - increases area of effect
  area: {
    id: "area",
    name: "Area",
    description: "Increases AoE by 5%",
    icon: "🔵",
    maxLevel: 5,
    costPerLevel: [150, 350, 600, 1000, 1800],
    bonusPerLevel: 0.05,
    stat: "area",
  },

  // Speed - movement speed
  speed: {
    id: "speed",
    name: "Speed",
    description: "Increases movement speed by 5%",
    icon: "👟",
    maxLevel: 5,
    costPerLevel: [100, 250, 450, 700, 1200],
    bonusPerLevel: 0.05,
    stat: "moveSpeed",
  },

  // Duration - effect duration
  duration: {
    id: "duration",
    name: "Duration",
    description: "Increases effect duration by 5%",
    icon: "⏰",
    maxLevel: 5,
    costPerLevel: [150, 300, 500, 800, 1400],
    bonusPerLevel: 0.05,
    stat: "duration",
  },

  // Amount - extra projectiles
  amount: {
    id: "amount",
    name: "Amount",
    description: "Fires 1 more projectile",
    icon: "✨",
    maxLevel: 3,
    costPerLevel: [500, 1500, 5000],
    bonusPerLevel: 1,
    stat: "amount",
  },

  // Growth - bonus XP
  growth: {
    id: "growth",
    name: "Growth",
    description: "Increases XP gain by 5%",
    icon: "📈",
    maxLevel: 5,
    costPerLevel: [100, 300, 600, 1000, 2000],
    bonusPerLevel: 0.05,
    stat: "growth",
  },

  // Greed - bonus gold
  greed: {
    id: "greed",
    name: "Greed",
    description: "Increases gold gain by 10%",
    icon: "💰",
    maxLevel: 5,
    costPerLevel: [200, 500, 1000, 2000, 4000],
    bonusPerLevel: 0.1,
    stat: "greed",
  },

  // Luck - better drops
  luck: {
    id: "luck",
    name: "Luck",
    description: "Increases luck by 10%",
    icon: "🍀",
    maxLevel: 5,
    costPerLevel: [150, 350, 700, 1200, 2500],
    bonusPerLevel: 0.1,
    stat: "luck",
  },

  // Magnet - pickup range
  magnet: {
    id: "magnet",
    name: "Magnet",
    description: "Increases pickup range by 25%",
    icon: "🧲",
    maxLevel: 5,
    costPerLevel: [100, 200, 400, 700, 1200],
    bonusPerLevel: 0.25,
    stat: "magnet",
  },

  // Revival - extra lives
  revival: {
    id: "revival",
    name: "Revival",
    description: "Revive once per run with 50% HP",
    icon: "👼",
    maxLevel: 3,
    costPerLevel: [1000, 3000, 10000],
    bonusPerLevel: 1,
    stat: "revival",
  },

  // Reroll - level up rerolls
  reroll: {
    id: "reroll",
    name: "Reroll",
    description: "+1 reroll per run",
    icon: "🎲",
    maxLevel: 5,
    costPerLevel: [200, 400, 800, 1500, 3000],
    bonusPerLevel: 1,
    stat: "reroll",
  },

  // Skip - level up skips
  skip: {
    id: "skip",
    name: "Skip",
    description: "+1 skip per run",
    icon: "⏭️",
    maxLevel: 3,
    costPerLevel: [300, 800, 2000],
    bonusPerLevel: 1,
    stat: "skip",
  },

  // Banish - banish unwanted options
  banish: {
    id: "banish",
    name: "Banish",
    description: "+1 banish per run",
    icon: "🚫",
    maxLevel: 3,
    costPerLevel: [400, 1000, 3000],
    bonusPerLevel: 1,
    stat: "banish",
  },
};

export class PowerUpSystem {
  constructor(game) {
    this.game = game;

    // Load purchased power-ups from localStorage
    this.purchasedLevels = this.loadProgress();

    // Total gold earned (also saved)
    this.totalGoldEarned = parseInt(
      localStorage.getItem("zombierun_totalGold") || "0",
    );
    this.currentGold = parseInt(
      localStorage.getItem("zombierun_currentGold") || "0",
    );
  }

  loadProgress() {
    const saved = localStorage.getItem("zombierun_powerups");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load power-up progress:", e);
      }
    }
    return {};
  }

  saveProgress() {
    localStorage.setItem(
      "zombierun_powerups",
      JSON.stringify(this.purchasedLevels),
    );
    localStorage.setItem("zombierun_currentGold", String(this.currentGold));
    localStorage.setItem("zombierun_totalGold", String(this.totalGoldEarned));
  }

  // Get the current level of a power-up
  getLevel(powerUpId) {
    return this.purchasedLevels[powerUpId] || 0;
  }

  // Get the total bonus for a stat from all power-ups
  getStatBonus(stat) {
    let total = 0;
    for (const [id, def] of Object.entries(POWER_UPS)) {
      if (def.stat === stat) {
        const level = this.getLevel(id);
        total += def.bonusPerLevel * level;
      }
    }
    return total;
  }

  // Get cost for next level of a power-up
  getCost(powerUpId) {
    const def = POWER_UPS[powerUpId];
    if (!def) return Infinity;

    const currentLevel = this.getLevel(powerUpId);
    if (currentLevel >= def.maxLevel) return Infinity;

    return def.costPerLevel[currentLevel];
  }

  // Check if a power-up can be purchased
  canPurchase(powerUpId) {
    const cost = this.getCost(powerUpId);
    return cost !== Infinity && this.currentGold >= cost;
  }

  // Purchase a power-up level
  purchase(powerUpId) {
    if (!this.canPurchase(powerUpId)) return false;

    const cost = this.getCost(powerUpId);
    this.currentGold -= cost;
    this.purchasedLevels[powerUpId] =
      (this.purchasedLevels[powerUpId] || 0) + 1;

    this.saveProgress();
    console.log(
      `Purchased ${POWER_UPS[powerUpId].name} level ${this.purchasedLevels[powerUpId]}`,
    );
    return true;
  }

  // Add gold (called when collecting gold in-game)
  addGold(amount) {
    const greedBonus = 1 + this.getStatBonus("greed");
    const finalAmount = Math.floor(amount * greedBonus);
    this.currentGold += finalAmount;
    this.totalGoldEarned += finalAmount;
    this.saveProgress();
    return finalAmount;
  }

  // Get all power-ups with current status for UI
  getAllPowerUps() {
    return Object.entries(POWER_UPS).map(([id, def]) => ({
      ...def,
      currentLevel: this.getLevel(id),
      nextCost: this.getCost(id),
      canPurchase: this.canPurchase(id),
      isMaxed: this.getLevel(id) >= def.maxLevel,
    }));
  }

  // Apply power-up bonuses to player stats at game start
  applyBonuses() {
    const stats = {};

    for (const [id, def] of Object.entries(POWER_UPS)) {
      const level = this.getLevel(id);
      if (level > 0) {
        const bonus = def.bonusPerLevel * level;
        stats[def.stat] = (stats[def.stat] || 0) + bonus;
      }
    }

    // Merge with game's player stats
    if (!this.game.playerStats) {
      this.game.playerStats = {};
    }

    for (const [stat, value] of Object.entries(stats)) {
      this.game.playerStats[stat] = (this.game.playerStats[stat] || 0) + value;
    }

    // Apply immediate effects
    if (this.game.player) {
      // Max health
      const healthBonus = this.getStatBonus("maxHealth");
      if (healthBonus > 0) {
        const newMax = Math.floor(100 * (1 + healthBonus));
        this.game.player.maxHealth = newMax;
        this.game.player.health = newMax;
      }

      // Movement speed
      const speedBonus = this.getStatBonus("moveSpeed");
      if (speedBonus > 0) {
        this.game.player.speed = 8 * (1 + speedBonus);
      }
    }

    // Magnet range
    if (this.game.xpSystem) {
      const magnetBonus = this.getStatBonus("magnet");
      this.game.xpSystem.magnetRadius = 3 * (1 + magnetBonus);
    }
  }

  // Get revival count for current run
  getRevivals() {
    return Math.floor(this.getStatBonus("revival"));
  }

  // Get reroll count for current run
  getRerolls() {
    return Math.floor(this.getStatBonus("reroll"));
  }

  // Get skip count for current run
  getSkips() {
    return Math.floor(this.getStatBonus("skip"));
  }

  // Get banish count for current run
  getBanishes() {
    return Math.floor(this.getStatBonus("banish"));
  }

  // Reset all progress (for testing/debug)
  resetAll() {
    this.purchasedLevels = {};
    this.currentGold = 0;
    this.totalGoldEarned = 0;
    this.saveProgress();
  }
}
