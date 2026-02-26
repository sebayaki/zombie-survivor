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

    // Close button (top-right X)
    const closeBtn = document.createElement("button");
    closeBtn.className = "powerup-shop-close";
    closeBtn.textContent = "X";
    closeBtn.addEventListener("click", () => this.hide());
    this.container.prepend(closeBtn);

    // Close button (bottom)
    const closeBtnBottom = document.createElement("button");
    closeBtnBottom.className = "powerup-shop-close-bottom";
    closeBtnBottom.textContent = "CLOSE";
    closeBtnBottom.addEventListener("click", () => this.hide());
    this.container.appendChild(closeBtnBottom);

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
        background: linear-gradient(135deg, rgba(15, 8, 6, 0.96) 0%, rgba(20, 8, 5, 0.96) 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 400;
      }

      .powerup-shop-overlay.hidden {
        display: none;
      }

      .powerup-shop-container {
        position: relative;
        background: linear-gradient(180deg, #1a1412 0%, #0f0a08 100%);
        border: 1px solid rgba(212, 160, 23, 0.3);
        border-radius: 8px;
        padding: 25px;
        max-width: 900px;
        width: calc(100% - 40px);
        max-height: 80vh;
        overflow-y: auto;
        animation: shopSlideIn 0.3s ease-out;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.8);
      }

      @keyframes shopSlideIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }

      .powerup-shop-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(100, 30, 20, 0.3);
        gap: 10px;
      }

      .powerup-shop-header h2 {
        font-family: 'Creepster', cursive;
        color: #d4a017;
        font-size: 30px;
        font-weight: 400;
        margin: 0;
        letter-spacing: 3px;
        text-shadow: 0 2px 8px rgba(212, 160, 23, 0.3);
      }

      .powerup-shop-gold {
        font-family: 'Special Elite', cursive;
        font-size: 18px;
        color: #ffd700;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(212, 160, 23, 0.1);
        border: 1px solid rgba(212, 160, 23, 0.25);
        padding: 6px 16px;
        border-radius: 6px;
      }

      .powerup-shop-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .powerup-shop-item {
        background: linear-gradient(180deg, #1e1814 0%, #151010 100%);
        border: 1px solid rgba(100, 70, 50, 0.3);
        border-radius: 6px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
      }

      .powerup-shop-item:hover:not(.maxed):not(.cant-afford) {
        border-color: rgba(212, 160, 23, 0.5);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(212, 160, 23, 0.15);
      }

      .powerup-shop-item.cant-afford {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .powerup-shop-item.maxed {
        border-color: rgba(80, 140, 60, 0.5);
        background: linear-gradient(180deg, #141e14 0%, #0a150a 100%);
      }

      .powerup-shop-item.high-level {
        border-color: rgba(180, 100, 20, 0.5);
        background: linear-gradient(180deg, #1e1610 0%, #15100a 100%);
      }

      .powerup-shop-item.high-level:hover:not(.cant-afford) {
        border-color: rgba(200, 130, 30, 0.6);
        box-shadow: 0 4px 20px rgba(180, 100, 20, 0.2);
      }

      .powerup-item-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .powerup-item-icon {
        font-size: 26px;
        color: #c8beb0;
        filter: drop-shadow(0 0 3px rgba(200, 150, 100, 0.2));
      }

      .powerup-item-name {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }

      .powerup-item-desc {
        font-size: 12px;
        color: #aaa;
        margin-bottom: 8px;
        line-height: 1.4;
      }

      .powerup-item-bonus {
        font-size: 16px;
        font-weight: bold;
        color: #d4a017;
        margin-bottom: 6px;
        text-shadow: 0 0 6px rgba(212, 160, 23, 0.3);
      }

      .powerup-item-bonus .next-bonus {
        font-size: 11px;
        color: #88cc44;
        font-weight: normal;
      }

      .powerup-item-level-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .powerup-item-level-num {
        font-size: 13px;
        color: #888;
      }

      .powerup-item-level-num strong {
        color: #ffcc00;
        font-size: 15px;
      }

      .powerup-item-level {
        display: flex;
        gap: 3px;
        margin-bottom: 10px;
      }

      .powerup-level-pip {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: #333;
        border: 1px solid #555;
      }

      .powerup-level-pip.filled {
        background: #d4a017;
        border-color: #d4a017;
        box-shadow: 0 0 4px rgba(212, 160, 23, 0.5);
      }

      .powerup-level-pip.overflow {
        background: #b86e14;
        border-color: #b86e14;
        box-shadow: 0 0 4px rgba(184, 110, 20, 0.5);
      }

      .powerup-infinite-badge {
        display: inline-block;
        font-size: 10px;
        color: #ff8800;
        background: rgba(255, 136, 0, 0.15);
        padding: 1px 6px;
        border-radius: 4px;
        border: 1px solid rgba(255, 136, 0, 0.3);
        margin-left: 4px;
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
        position: absolute;
        top: 8px;
        right: 8px;
        width: 40px;
        height: 40px;
        padding: 0;
        background: none !important;
        border: none !important;
        box-shadow: none !important;
        text-shadow: none !important;
        color: #cc2222;
        font-family: 'Creepster', cursive;
        font-size: 32px;
        line-height: 1;
        cursor: pointer;
        transition: color 0.2s ease, transform 0.2s ease;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .powerup-shop-close:hover {
        color: #ff4444;
        transform: scale(1.15);
        background: none !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }

      .powerup-shop-close-bottom {
        display: block;
        width: 100%;
        margin-top: 15px;
        padding: 12px;
        font-family: 'Special Elite', cursive;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 2px;
        color: var(--color-text, #c8beb0);
        background: linear-gradient(180deg, #2a2220 0%, #1a1412 100%);
        border: 1px solid rgba(100, 70, 50, 0.3);
        border-radius: 6px;
        box-shadow: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .powerup-shop-close-bottom:hover {
        background: linear-gradient(180deg, #332a26 0%, #221a16 100%);
        border-color: rgba(120, 80, 60, 0.4);
        color: #fff;
        transform: none;
        box-shadow: none;
      }

      .powerup-shop-container::-webkit-scrollbar { width: 6px; }
      .powerup-shop-container::-webkit-scrollbar-track { background: #0f0a08; border-radius: 3px; }
      .powerup-shop-container::-webkit-scrollbar-thumb { background: #3a2820; border-radius: 3px; }
      .powerup-shop-container::-webkit-scrollbar-thumb:hover { background: #4a3830; }

      @media (max-width: 768px), (pointer: coarse) {
        .powerup-shop-container {
          padding: 15px;
          max-height: 90vh;
          border-radius: 10px;
          width: calc(100% - 20px);
        }
        .powerup-shop-header h2 { font-size: 20px; }
        .powerup-shop-gold { font-size: 16px; }
        .powerup-shop-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }
        .powerup-shop-item { padding: 10px; }
        .powerup-item-icon { font-size: 24px; }
        .powerup-item-name { font-size: 13px; }
        .powerup-item-desc { font-size: 10px; }
        .powerup-item-bonus { font-size: 14px; }
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

    const goldElement = document.getElementById("total-gold");
    if (goldElement) {
      goldElement.textContent = this.game.powerUpSystem.currentGold.toLocaleString();
    }
  }

  updateDisplay() {
    // Update gold display
    const gold = this.game.powerUpSystem.currentGold;
    this.goldDisplay.innerHTML = `<i class="fa-solid fa-sack-dollar"></i> ${gold.toLocaleString()} Gold`;

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

    const baseLevels = powerUp.costPerLevel ? powerUp.costPerLevel.length : 5;
    if (powerUp.currentLevel >= baseLevels && !powerUp.isMaxed) {
      item.classList.add("high-level");
    }

    // Header (icon + name)
    const header = document.createElement("div");
    header.className = "powerup-item-header";

    const icon = document.createElement("span");
    icon.className = "powerup-item-icon";
    icon.innerHTML = powerUp.icon;
    header.appendChild(icon);

    const nameContainer = document.createElement("span");
    nameContainer.className = "powerup-item-name";
    nameContainer.textContent = powerUp.name;
    if (powerUp.isUnlimited) {
      const badge = document.createElement("span");
      badge.className = "powerup-infinite-badge";
      badge.textContent = "∞";
      nameContainer.appendChild(badge);
    }
    header.appendChild(nameContainer);

    item.appendChild(header);

    // Description with per-level bonus
    const desc = document.createElement("div");
    desc.className = "powerup-item-desc";
    const perLevelText = powerUp.bonusUnit === "%"
      ? `+${powerUp.bonusDisplay}% per level`
      : powerUp.bonusUnit === "/s"
        ? `+${powerUp.bonusDisplay}/s per level`
        : `+${powerUp.bonusDisplay} per level`;
    desc.textContent = `${powerUp.description} (${perLevelText})`;
    item.appendChild(desc);

    // Total bonus display
    if (powerUp.currentLevel > 0) {
      const bonusDiv = document.createElement("div");
      bonusDiv.className = "powerup-item-bonus";
      let totalText;
      if (powerUp.bonusUnit === "%") {
        totalText = `+${powerUp.totalBonusDisplay}%`;
      } else if (powerUp.bonusUnit === "/s") {
        totalText = `+${powerUp.totalBonusDisplay.toFixed(2)}/s`;
      } else {
        totalText = `+${powerUp.totalBonusDisplay}`;
      }

      if (!powerUp.isMaxed) {
        let nextAdd;
        if (powerUp.bonusUnit === "%") {
          nextAdd = `+${powerUp.bonusDisplay}%`;
        } else if (powerUp.bonusUnit === "/s") {
          nextAdd = `+${powerUp.bonusDisplay}/s`;
        } else {
          nextAdd = `+${powerUp.bonusDisplay}`;
        }
        bonusDiv.innerHTML = `${totalText} <span class="next-bonus">→ ${nextAdd}</span>`;
      } else {
        bonusDiv.textContent = totalText;
      }
      item.appendChild(bonusDiv);
    }

    // Level display row
    const levelRow = document.createElement("div");
    levelRow.className = "powerup-item-level-row";

    const levelNum = document.createElement("div");
    levelNum.className = "powerup-item-level-num";
    if (powerUp.isUnlimited) {
      levelNum.innerHTML = `Lv. <strong>${powerUp.currentLevel}</strong>`;
    } else {
      levelNum.innerHTML = `Lv. <strong>${powerUp.currentLevel}</strong> / ${powerUp.maxLevel}`;
    }
    levelRow.appendChild(levelNum);
    item.appendChild(levelRow);

    // Level pips (show max 10 pips for finite, 5 base + extra glow for unlimited)
    if (!powerUp.isUnlimited) {
      const levelDiv = document.createElement("div");
      levelDiv.className = "powerup-item-level";
      for (let i = 0; i < powerUp.maxLevel; i++) {
        const pip = document.createElement("div");
        pip.className = "powerup-level-pip";
        if (i < powerUp.currentLevel) pip.classList.add("filled");
        levelDiv.appendChild(pip);
      }
      item.appendChild(levelDiv);
    } else {
      const levelDiv = document.createElement("div");
      levelDiv.className = "powerup-item-level";
      const showPips = Math.max(baseLevels, Math.min(powerUp.currentLevel + 1, 15));
      for (let i = 0; i < showPips; i++) {
        const pip = document.createElement("div");
        pip.className = "powerup-level-pip";
        if (i < powerUp.currentLevel) {
          pip.classList.add(i < baseLevels ? "filled" : "overflow");
        }
        levelDiv.appendChild(pip);
      }
      if (powerUp.currentLevel >= 15) {
        const more = document.createElement("span");
        more.style.cssText = "color: #888; font-size: 11px; margin-left: 4px;";
        more.textContent = `+${powerUp.currentLevel - 14}`;
        levelDiv.appendChild(more);
      }
      item.appendChild(levelDiv);
    }

    // Cost
    const cost = document.createElement("div");
    cost.className = "powerup-item-cost";
    if (powerUp.isMaxed) {
      cost.classList.add("maxed");
      cost.textContent = "✓ MAX";
    } else {
      cost.innerHTML = `<i class="fa-solid fa-sack-dollar"></i> ${powerUp.nextCost.toLocaleString()}`;
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
