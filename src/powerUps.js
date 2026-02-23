// PowerUps System - Permanent upgrades purchased with gold (Vampire Survivors style)
// These persist between runs and provide permanent stat bonuses
// All stat-based upgrades are UNLIMITED with escalating costs

export const POWER_UPS = {
  might: {
    id: "might",
    name: "Might",
    description: "Increases base damage",
    icon: "💪",
    maxLevel: Infinity,
    costPerLevel: [100, 250, 500, 900, 1500],
    costScaling: 1.45,
    bonusPerLevel: 0.8,
    bonusUnit: "%",
    bonusDisplay: 8,
    stat: "might",
  },

  armor: {
    id: "armor",
    name: "Armor",
    description: "Reduces incoming damage",
    icon: '<i class="fa-solid fa-shield-halved"></i>',
    maxLevel: Infinity,
    costPerLevel: [200, 500, 1000, 2000, 4000],
    costScaling: 1.6,
    bonusPerLevel: 1,
    bonusUnit: "",
    bonusDisplay: 1,
    stat: "armor",
  },

  maxHealth: {
    id: "maxHealth",
    name: "Max Health",
    description: "Increases max HP",
    icon: '<i class="fa-solid fa-heart"></i>',
    maxLevel: Infinity,
    costPerLevel: [100, 250, 500, 800, 1500],
    costScaling: 1.45,
    bonusPerLevel: 0.5,
    bonusUnit: "%",
    bonusDisplay: 10,
    stat: "maxHealth",
  },

  recovery: {
    id: "recovery",
    name: "Recovery",
    description: "Increases HP recovery",
    icon: "💚",
    maxLevel: Infinity,
    costPerLevel: [150, 350, 600, 900, 1500],
    costScaling: 1.45,
    bonusPerLevel: 0.75,
    bonusUnit: "/s",
    bonusDisplay: 0.15,
    stat: "recovery",
  },

  cooldown: {
    id: "cooldown",
    name: "Cooldown",
    description: "Reduces weapon cooldown",
    icon: "⏱️",
    maxLevel: Infinity,
    costPerLevel: [200, 400, 700, 1200, 2000],
    costScaling: 1.5,
    bonusPerLevel: 0.8,
    bonusUnit: "%",
    bonusDisplay: 4,
    stat: "cooldown",
  },

  area: {
    id: "area",
    name: "Area",
    description: "Increases AoE",
    icon: "🔵",
    maxLevel: Infinity,
    costPerLevel: [150, 350, 600, 1000, 1800],
    costScaling: 1.45,
    bonusPerLevel: 0.8,
    bonusUnit: "%",
    bonusDisplay: 8,
    stat: "area",
  },

  speed: {
    id: "speed",
    name: "Speed",
    description: "Increases movement speed",
    icon: "👟",
    maxLevel: Infinity,
    costPerLevel: [100, 250, 450, 700, 1200],
    costScaling: 1.4,
    bonusPerLevel: 0.5,
    bonusUnit: "%",
    bonusDisplay: 5,
    stat: "moveSpeed",
  },

  duration: {
    id: "duration",
    name: "Duration",
    description: "Increases effect duration",
    icon: "⏰",
    maxLevel: Infinity,
    costPerLevel: [150, 300, 500, 800, 1400],
    costScaling: 1.45,
    bonusPerLevel: 0.8,
    bonusUnit: "%",
    bonusDisplay: 8,
    stat: "duration",
  },

  amount: {
    id: "amount",
    name: "Amount",
    description: "Fires extra projectile",
    icon: "✨",
    maxLevel: 5,
    costPerLevel: [500, 1500, 5000, 15000, 50000],
    bonusPerLevel: 1,
    bonusUnit: "",
    bonusDisplay: 1,
    stat: "amount",
  },

  growth: {
    id: "growth",
    name: "Growth",
    description: "Increases XP gain",
    icon: "📈",
    maxLevel: Infinity,
    costPerLevel: [100, 250, 500, 900, 1500],
    costScaling: 1.45,
    bonusPerLevel: 1.0,
    bonusUnit: "%",
    bonusDisplay: 8,
    stat: "growth",
  },

  greed: {
    id: "greed",
    name: "Greed",
    description: "Increases gold gain",
    icon: '<i class="fa-solid fa-sack-dollar"></i>',
    maxLevel: Infinity,
    costPerLevel: [200, 500, 1000, 2000, 4000],
    costScaling: 1.5,
    bonusPerLevel: 1.0,
    bonusUnit: "%",
    bonusDisplay: 10,
    stat: "greed",
  },

  luck: {
    id: "luck",
    name: "Luck",
    description: "Increases luck",
    icon: '<i class="fa-solid fa-clover"></i>',
    maxLevel: Infinity,
    costPerLevel: [150, 350, 700, 1200, 2500],
    costScaling: 1.5,
    bonusPerLevel: 1.0,
    bonusUnit: "%",
    bonusDisplay: 10,
    stat: "luck",
  },

  magnet: {
    id: "magnet",
    name: "Magnet",
    description: "Increases pickup range",
    icon: '<i class="fa-solid fa-magnet"></i>',
    maxLevel: Infinity,
    costPerLevel: [100, 200, 400, 700, 1200],
    costScaling: 1.4,
    bonusPerLevel: 0.75,
    bonusUnit: "%",
    bonusDisplay: 25,
    stat: "magnet",
  },

  revival: {
    id: "revival",
    name: "Revival",
    description: "Revive once per run with 50% HP",
    icon: "👼",
    maxLevel: 5,
    costPerLevel: [1000, 3000, 10000, 30000, 100000],
    bonusPerLevel: 1,
    bonusUnit: "",
    bonusDisplay: 1,
    stat: "revival",
  },

  reroll: {
    id: "reroll",
    name: "Reroll",
    description: "+1 reroll per run",
    icon: "🎲",
    maxLevel: 10,
    costPerLevel: [200, 400, 800, 1500, 3000, 5000, 8000, 12000, 18000, 30000],
    bonusPerLevel: 1,
    bonusUnit: "",
    bonusDisplay: 1,
    stat: "reroll",
  },

  skip: {
    id: "skip",
    name: "Skip",
    description: "+1 skip per run",
    icon: "⏭️",
    maxLevel: 5,
    costPerLevel: [300, 800, 2000, 5000, 15000],
    bonusPerLevel: 1,
    bonusUnit: "",
    bonusDisplay: 1,
    stat: "skip",
  },

  banish: {
    id: "banish",
    name: "Banish",
    description: "+1 banish per run",
    icon: "🚫",
    maxLevel: 5,
    costPerLevel: [400, 1000, 3000, 8000, 20000],
    bonusPerLevel: 1,
    bonusUnit: "",
    bonusDisplay: 1,
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

  // Get cost for next level of a power-up (supports unlimited scaling)
  getCost(powerUpId) {
    const def = POWER_UPS[powerUpId];
    if (!def) return Infinity;

    const currentLevel = this.getLevel(powerUpId);
    if (currentLevel >= def.maxLevel) return Infinity;

    if (currentLevel < def.costPerLevel.length) {
      return def.costPerLevel[currentLevel];
    }

    const lastCost = def.costPerLevel[def.costPerLevel.length - 1];
    const extraLevels = currentLevel - def.costPerLevel.length + 1;
    const scaling = def.costScaling || 1.5;
    return Math.floor(lastCost * Math.pow(scaling, extraLevels));
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
    const greedStat = (this.game.playerStats && this.game.playerStats.greed) || 0;
    const greedBonus = 1 + greedStat * 0.1;
    const finalAmount = Math.floor(amount * greedBonus);
    this.currentGold += finalAmount;
    this.totalGoldEarned += finalAmount;
    this.saveProgress();
    return finalAmount;
  }

  // Get all power-ups with current status for UI
  getAllPowerUps() {
    return Object.entries(POWER_UPS).map(([id, def]) => {
      const level = this.getLevel(id);
      const totalBonus = def.bonusPerLevel * level;
      return {
        ...def,
        currentLevel: level,
        nextCost: this.getCost(id),
        canPurchase: this.canPurchase(id),
        isMaxed: level >= def.maxLevel,
        isUnlimited: def.maxLevel === Infinity,
        totalBonus,
        totalBonusDisplay: def.bonusDisplay * level,
      };
    });
  }

  // Get summary of active power-up bonuses for in-game HUD
  getActiveBonusSummary() {
    const active = [];
    for (const [id, def] of Object.entries(POWER_UPS)) {
      const level = this.getLevel(id);
      if (level > 0) {
        const totalDisplay = def.bonusDisplay * level;
        let formatted;
        if (def.bonusUnit === "%") {
          formatted = `+${totalDisplay}%`;
        } else if (def.bonusUnit === "/s") {
          formatted = `+${totalDisplay.toFixed(2)}/s`;
        } else {
          formatted = `+${totalDisplay}`;
        }
        active.push({
          id,
          name: def.name,
          icon: def.icon,
          level,
          bonus: formatted,
          stat: def.stat,
        });
      }
    }
    return active;
  }

  // Get all stat bonuses from purchased power-ups as a dict
  getAllStatBonuses() {
    const stats = {};
    for (const [id, def] of Object.entries(POWER_UPS)) {
      const level = this.getLevel(id);
      if (level > 0) {
        stats[def.stat] = (stats[def.stat] || 0) + def.bonusPerLevel * level;
      }
    }
    return stats;
  }

  // Apply power-up bonuses at game start (triggers full stat recalculation)
  applyBonuses() {
    if (this.game.passiveItemSystem) {
      this.game.passiveItemSystem.updatePlayerStats();
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
