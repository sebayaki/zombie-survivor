import { injectCSS } from "./utils.js";

export const ARCANA_CARDS = {
  ricochet: {
    id: "ricochet",
    name: "Ricochet",
    icon: '<i class="fa-solid fa-arrows-split-up-and-left"></i>',
    description: "All projectiles bounce once to a nearby enemy",
    color: "#44bbff",
    effect: { ricochet: true },
  },
  glassCannon: {
    id: "glassCannon",
    name: "Glass Cannon",
    icon: '<i class="fa-solid fa-bomb"></i>',
    description: "+100% damage, -50% max HP",
    color: "#ff4444",
    effect: { damageMult: 2.0, maxHealthMult: 0.5 },
  },
  harvester: {
    id: "harvester",
    name: "Harvester",
    icon: '<i class="fa-solid fa-heart-pulse"></i>',
    description: "Kills have 5% chance to drop a healing orb",
    color: "#44ff88",
    effect: { healDropChance: 0.05 },
  },
  magnetism: {
    id: "magnetism",
    name: "Magnetism",
    icon: '<i class="fa-solid fa-magnet"></i>',
    description: "Pickup range doubled",
    color: "#ff88ff",
    effect: { magnetMult: 2.0 },
  },
  proliferation: {
    id: "proliferation",
    name: "Proliferation",
    icon: '<i class="fa-solid fa-burst"></i>',
    description: "+2 projectiles to all weapons, -20% damage each",
    color: "#ffaa00",
    effect: { bonusAmount: 2, damageMult: 0.8 },
  },
  timeWarp: {
    id: "timeWarp",
    name: "Time Warp",
    icon: '<i class="fa-solid fa-clock-rotate-left"></i>',
    description: "Cooldowns -30%, enemy speed +20%",
    color: "#8844ff",
    effect: { cooldownMult: 0.7, enemySpeedMult: 1.2 },
  },
  ironSkin: {
    id: "ironSkin",
    name: "Iron Skin",
    icon: '<i class="fa-solid fa-shield-heart"></i>',
    description: "+50% max HP, +5 armor, -15% movement speed",
    color: "#888888",
    effect: { maxHealthMult: 1.5, bonusArmor: 5, moveSpeedMult: 0.85 },
  },
  berserkerRage: {
    id: "berserkerRage",
    name: "Berserker's Rage",
    icon: '<i class="fa-solid fa-fire-flame-curved"></i>',
    description: "Damage increases as HP drops (up to +100% at 1 HP)",
    color: "#ff6600",
    effect: { berserkerRage: true },
  },
  goldenTouch: {
    id: "goldenTouch",
    name: "Golden Touch",
    icon: '<i class="fa-solid fa-coins"></i>',
    description: "+100% gold gain, enemies drop gold on death",
    color: "#ffdd00",
    effect: { goldMult: 2.0, enemyGoldDrop: true },
  },
};

const ALL_ARCANA_IDS = Object.keys(ARCANA_CARDS);

export class ArcanaSystem {
  constructor(game) {
    this.game = game;
    this.activeArcana = []; // Arcana active for current run
    this.isSelectionOpen = false;
  }

  reset() {
    this.activeArcana = [];
    this.isSelectionOpen = false;
  }

  // Check if arcana selection should be offered (every 3 stages)
  shouldOfferArcana() {
    if (!this.game.stageSystem) return false;
    const stage = this.game.stageSystem.currentStage;
    return stage >= 3 && stage % 3 === 0;
  }

  hasArcana(arcanaId) {
    return this.activeArcana.includes(arcanaId);
  }

  getActiveEffects() {
    const combined = {};
    for (const id of this.activeArcana) {
      const card = ARCANA_CARDS[id];
      if (!card) continue;
      for (const [key, val] of Object.entries(card.effect)) {
        if (typeof val === "number") {
          if (key.endsWith("Mult")) {
            combined[key] = (combined[key] || 1) * val;
          } else {
            combined[key] = (combined[key] || 0) + val;
          }
        } else {
          combined[key] = val;
        }
      }
    }
    return combined;
  }

  // Select an arcana card
  selectArcana(arcanaId) {
    if (!ARCANA_CARDS[arcanaId]) return;
    this.activeArcana.push(arcanaId);
    this.isSelectionOpen = false;

    // Apply immediate stat effects
    this.applyArcanaEffects();
  }

  applyArcanaEffects() {
    const effects = this.getActiveEffects();

    // Recalculate player stats to include arcana effects
    if (this.game.passiveItemSystem) {
      this.game.passiveItemSystem.updatePlayerStats();
    }
  }

  // Get 3 random arcana to offer (excluding already owned)
  getChoices(count = 3) {
    const available = ALL_ARCANA_IDS.filter((id) => !this.activeArcana.includes(id));
    const choices = [];
    const pool = [...available];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(idx, 1)[0]);
    }
    return choices.map((id) => ARCANA_CARDS[id]);
  }

  // Show arcana selection UI
  showSelection() {
    this.isSelectionOpen = true;
    this.game.isPaused = true;

    const choices = this.getChoices(3);
    this.renderSelectionUI(choices);
  }

  renderSelectionUI(choices) {
    // Remove existing overlay if any
    const existing = document.getElementById("arcana-selection-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "arcana-selection-overlay";
    overlay.className = "arcana-overlay";

    const container = document.createElement("div");
    container.className = "arcana-container";

    const title = document.createElement("h2");
    title.className = "arcana-title";
    title.textContent = "CHOOSE AN ARCANA";
    container.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.className = "arcana-subtitle";
    subtitle.textContent = "This power will last for the entire run";
    container.appendChild(subtitle);

    const grid = document.createElement("div");
    grid.className = "arcana-grid";

    for (const card of choices) {
      const cardEl = document.createElement("div");
      cardEl.className = "arcana-card";
      cardEl.style.setProperty("--card-color", card.color);

      cardEl.innerHTML = `
        <div class="arcana-card-icon" style="color:${card.color}">${card.icon}</div>
        <div class="arcana-card-name">${card.name}</div>
        <div class="arcana-card-desc">${card.description}</div>
      `;

      cardEl.addEventListener("click", () => {
        this.selectArcana(card.id);
        overlay.remove();
        this.game.isPaused = false;
      });

      grid.appendChild(cardEl);
    }

    container.appendChild(grid);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    this.injectStyles();
  }

  injectStyles() {
    injectCSS(`
      .arcana-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, rgba(15, 8, 6, 0.96) 0%, rgba(20, 8, 5, 0.96) 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 500;
        animation: arcanaFadeIn 0.4s ease-out;
      }

      @keyframes arcanaFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .arcana-container {
        text-align: center;
        max-width: 800px;
        width: 90%;
      }

      .arcana-title {
        font-size: 36px;
        font-weight: 900;
        color: #ff88ff;
        text-shadow: 0 0 25px rgba(255,136,255,0.5);
        letter-spacing: 5px;
        margin-bottom: 8px;
      }

      .arcana-subtitle {
        font-size: 14px;
        color: rgba(255,255,255,0.5);
        margin-bottom: 30px;
      }

      .arcana-grid {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .arcana-card {
        background: linear-gradient(180deg, rgba(30,20,50,0.95) 0%, rgba(15,10,25,0.95) 100%);
        border: 2px solid var(--card-color, #888);
        border-radius: 15px;
        padding: 30px 20px;
        width: 220px;
        cursor: pointer;
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;
      }

      .arcana-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: var(--card-color, #888);
        box-shadow: 0 0 15px var(--card-color, #888);
      }

      .arcana-card:hover {
        transform: translateY(-8px) scale(1.03);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px color-mix(in srgb, var(--card-color) 30%, transparent);
        border-color: #fff;
      }

      .arcana-card-icon {
        font-size: 48px;
        margin-bottom: 15px;
        filter: drop-shadow(0 0 10px currentColor);
      }

      .arcana-card-name {
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        margin-bottom: 10px;
        letter-spacing: 1px;
      }

      .arcana-card-desc {
        font-size: 13px;
        color: rgba(255,255,255,0.7);
        line-height: 1.5;
      }

      @media (max-width: 768px), (pointer: coarse) {
        .arcana-title { font-size: 24px; letter-spacing: 3px; }
        .arcana-grid { gap: 12px; }
        .arcana-card {
          width: 160px;
          padding: 20px 12px;
        }
        .arcana-card-icon { font-size: 32px; }
        .arcana-card-name { font-size: 16px; }
        .arcana-card-desc { font-size: 11px; }
      }
    `, "arcana-styles");
  }
}
