import { POWER_UPS } from "./powerUps.js";
import { injectCSS } from "./utils.js";

export class PowerUpShopUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.createElements();
  }

  createElements() {
    // Create overlay
    this.overlay = document.createElement("div");
    this.overlay.id = "powerup-shop-overlay";
    this.overlay.className = "powerup-shop-overlay hidden";

    // Container
    this.container = document.createElement("div");
    this.container.className = "powerup-shop-container";

    // Header
    const header = document.createElement("div");
    header.className = "powerup-shop-header";

    const title = document.createElement("h2");
    title.textContent = "POWER UP SHOP";
    header.appendChild(title);

    this.goldDisplay = document.createElement("div");
    this.goldDisplay.className = "powerup-shop-gold";
    header.appendChild(this.goldDisplay);

    this.container.appendChild(header);

    // Items grid
    this.itemsGrid = document.createElement("div");
    this.itemsGrid.className = "powerup-shop-grid";
    this.container.appendChild(this.itemsGrid);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "powerup-shop-close";
    closeBtn.textContent = "✕ Close";
    closeBtn.addEventListener("click", () => this.hide());
    this.container.appendChild(closeBtn);

    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);

    this.addStyles();
  }

  addStyles() {
    injectCSS(`
      .powerup-shop-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 400;
      }

      .powerup-shop-overlay.hidden {
        display: none;
      }

      .powerup-shop-container {
        background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
        border: 2px solid #ffcc00;
        border-radius: 15px;
        padding: 25px;
        max-width: 900px;
        max-height: 80vh;
        overflow-y: auto;
        animation: shopSlideIn 0.3s ease-out;
      }

      @keyframes shopSlideIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .powerup-shop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #333;
      }

      .powerup-shop-header h2 {
        color: #ffcc00;
        font-size: 28px;
        margin: 0;
        text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
      }

      .powerup-shop-gold {
        font-size: 24px;
        color: #ffdd00;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .powerup-shop-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .powerup-shop-item {
        background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
        border: 2px solid #444;
        border-radius: 10px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .powerup-shop-item:hover:not(.maxed):not(.cant-afford) {
        border-color: #ffcc00;
        transform: translateY(-3px);
        box-shadow: 0 5px 20px rgba(255, 204, 0, 0.2);
      }

      .powerup-shop-item.cant-afford {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .powerup-shop-item.maxed {
        border-color: #00ff88;
        background: linear-gradient(180deg, #1a3a2e 0%, #0a2a1e 100%);
      }

      .powerup-item-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .powerup-item-icon {
        font-size: 32px;
        filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
      }

      .powerup-item-name {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }

      .powerup-item-desc {
        font-size: 12px;
        color: #aaa;
        margin-bottom: 10px;
        line-height: 1.4;
      }

      .powerup-item-level {
        display: flex;
        gap: 4px;
        margin-bottom: 10px;
      }

      .powerup-level-pip {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        background: #333;
        border: 1px solid #555;
      }

      .powerup-level-pip.filled {
        background: #ffcc00;
        border-color: #ffcc00;
        box-shadow: 0 0 5px #ffcc00;
      }

      .powerup-item-cost {
        font-size: 14px;
        color: #ffdd00;
        font-weight: bold;
      }

      .powerup-item-cost.maxed {
        color: #00ff88;
      }

      .powerup-shop-close {
        display: block;
        width: 100%;
        padding: 12px;
        background: linear-gradient(180deg, #444 0%, #333 100%);
        border: 2px solid #555;
        border-radius: 8px;
        color: #fff;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .powerup-shop-close:hover {
        background: linear-gradient(180deg, #555 0%, #444 100%);
        border-color: #666;
      }

      /* Custom scrollbar */
      .powerup-shop-container::-webkit-scrollbar {
        width: 8px;
      }

      .powerup-shop-container::-webkit-scrollbar-track {
        background: #1a1a2e;
        border-radius: 4px;
      }

      .powerup-shop-container::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 4px;
      }

      .powerup-shop-container::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `, "powerup-shop-styles");
  }

  show() {
    this.updateDisplay();
    this.overlay.classList.remove("hidden");
    this.isOpen = true;
  }

  hide() {
    this.overlay.classList.add("hidden");
    this.isOpen = false;
  }

  updateDisplay() {
    // Update gold display
    const gold = this.game.powerUpSystem.currentGold;
    this.goldDisplay.innerHTML = `💰 ${gold.toLocaleString()} Gold`;

    // Clear and rebuild items grid
    this.itemsGrid.innerHTML = "";

    const powerUps = this.game.powerUpSystem.getAllPowerUps();

    for (const powerUp of powerUps) {
      const item = this.createPowerUpItem(powerUp);
      this.itemsGrid.appendChild(item);
    }
  }

  createPowerUpItem(powerUp) {
    const item = document.createElement("div");
    item.className = "powerup-shop-item";

    if (powerUp.isMaxed) {
      item.classList.add("maxed");
    } else if (!powerUp.canPurchase) {
      item.classList.add("cant-afford");
    }

    // Header (icon + name)
    const header = document.createElement("div");
    header.className = "powerup-item-header";

    const icon = document.createElement("span");
    icon.className = "powerup-item-icon";
    icon.textContent = powerUp.icon;
    header.appendChild(icon);

    const name = document.createElement("span");
    name.className = "powerup-item-name";
    name.textContent = powerUp.name;
    header.appendChild(name);

    item.appendChild(header);

    // Description
    const desc = document.createElement("div");
    desc.className = "powerup-item-desc";
    desc.textContent = powerUp.description;
    item.appendChild(desc);

    // Level pips
    const levelDiv = document.createElement("div");
    levelDiv.className = "powerup-item-level";

    for (let i = 0; i < powerUp.maxLevel; i++) {
      const pip = document.createElement("div");
      pip.className = "powerup-level-pip";
      if (i < powerUp.currentLevel) {
        pip.classList.add("filled");
      }
      levelDiv.appendChild(pip);
    }
    item.appendChild(levelDiv);

    // Cost
    const cost = document.createElement("div");
    cost.className = "powerup-item-cost";
    if (powerUp.isMaxed) {
      cost.classList.add("maxed");
      cost.textContent = "✓ MAXED";
    } else {
      cost.innerHTML = `💰 ${powerUp.nextCost.toLocaleString()}`;
    }
    item.appendChild(cost);

    // Click handler
    if (!powerUp.isMaxed && powerUp.canPurchase) {
      item.addEventListener("click", () => {
        this.purchasePowerUp(powerUp.id);
      });
    }

    return item;
  }

  purchasePowerUp(powerUpId) {
    if (this.game.powerUpSystem.purchase(powerUpId)) {
      // Play purchase sound
      this.game.audioManager.playSound("upgrade");

      // Update display
      this.updateDisplay();
    }
  }
}
