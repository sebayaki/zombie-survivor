import { AUTO_WEAPONS } from "./autoWeapons.js";
import { PASSIVE_ITEMS } from "./passiveItems.js";
import { injectCSS } from "./utils.js";
import { clearChildren, createIconBox } from "./uiUtils.js";

export class UI {
  constructor(game) {
    this.game = game;

    // Cache DOM elements
    this.elements = {
      healthFill: document.getElementById("health-fill"),
      waveNumber: document.getElementById("wave-number"),
      scoreValue: document.getElementById("score-value"),
      killsValue: document.getElementById("kills-value"),
      weaponName: document.getElementById("weapon-name"),
      ammoValue: document.getElementById("ammo-value"),
      waveAnnouncement: document.getElementById("wave-announcement"),
      announceWaveNumber: document.getElementById("announce-wave-number"),
      crosshair: document.getElementById("crosshair"),
      hud: document.getElementById("hud"),
    };

    this.injectHUDStyles();
    this.createVSHUD();
    this.createDamageFlash();
  }

  injectHUDStyles() {
    injectCSS(`
      /* === XP Bar === */
      #xp-container { position: absolute; top: 0; left: 0; width: 100%; z-index: 100; }
      #xp-bar { width: 100%; height: 6px; background: rgba(0,0,0,0.85); }
      #xp-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #00aaff, #00ffff); transition: width 0.2s ease; box-shadow: 0 0 8px rgba(0,170,255,0.6); }

      /* === Timer === */
      #game-timer {
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 30px;
        font-weight: 800;
        color: #fff;
        letter-spacing: 2px;
        text-shadow: 0 2px 12px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.8);
      }

      /* === Level Display === */
      #level-display {
        position: absolute;
        top: 16px;
        right: 20px;
        display: flex;
        align-items: baseline;
        gap: 4px;
      }
      #level-display span:first-child {
        font-size: 12px;
        font-weight: 700;
        color: rgba(255,255,255,0.35);
        letter-spacing: 2px;
      }
      #level-value {
        font-size: 32px;
        font-weight: 900;
        color: #ffcc00;
        text-shadow: 0 0 14px rgba(255,204,0,0.4);
      }

      /* === Gold Display === */
      #gold-display {
        position: absolute;
        top: 52px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 18px;
        font-weight: 700;
        color: #ffcc00;
        text-shadow: 0 2px 6px rgba(0,0,0,0.9);
      }
      .gold-icon { font-size: 20px; }

      /* === Inventory (weapons + passives) === */
      #inventory-container {
        position: absolute;
        top: 60px;
        left: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 300px;
      }
      #weapon-icons { display: flex; gap: 6px; flex-wrap: wrap; }
      .weapon-icon-box {
        width: 48px; height: 48px;
        background: rgba(0,0,0,0.6);
        border: 2px solid #555;
        border-radius: 8px;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative;
      }
      .weapon-icon-box.rarity-common { border-color: #555; }
      .weapon-icon-box.rarity-uncommon { border-color: #00aa00; }
      .weapon-icon-box.rarity-rare { border-color: #0088ff; }
      .weapon-icon-box.rarity-legendary { border-color: #ffaa00; }
      .weapon-icon-box .icon { font-size: 24px; filter: drop-shadow(0 0 4px rgba(255,255,255,0.3)); }
      .weapon-icon-box .level {
        position: absolute; bottom: 1px; right: 3px;
        font-size: 10px; font-weight: 800;
        color: #ffcc00;
        text-shadow: 0 1px 3px #000, 0 0 2px #000;
      }
      .weapon-icon-box.max-level { border-color: #ffcc00 !important; box-shadow: 0 0 8px rgba(255,204,0,0.35); }

      #passive-items { display: flex; gap: 5px; flex-wrap: wrap; }
      .passive-item-box {
        width: 36px; height: 36px;
        background: rgba(0,0,0,0.6);
        border: 2px solid #555;
        border-radius: 6px;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative;
      }
      .passive-item-box.rarity-common { border-color: #555; }
      .passive-item-box.rarity-uncommon { border-color: #00aa00; }
      .passive-item-box.rarity-rare { border-color: #0088ff; }
      .passive-item-box.rarity-legendary { border-color: #ffaa00; }
      .passive-item-box .icon { font-size: 18px; }
      .passive-item-box .level {
        position: absolute; bottom: 0; right: 2px;
        font-size: 9px; font-weight: 800;
        color: #ffcc00; text-shadow: 0 1px 2px #000;
      }
      .passive-item-box.max-level { border-color: #ffcc00 !important; }

      /* === Powerup Stats Panel === */
      #powerup-stats-panel {
        position: absolute;
        top: 82px;
        right: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        max-width: 210px;
        justify-content: flex-end;
      }
      .powerup-stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 204, 0, 0.2);
        border-radius: 3px;
        padding: 1px 5px;
        font-size: 10px;
        color: #eebb33;
        white-space: nowrap;
        text-shadow: 0 1px 3px rgba(0,0,0,0.9);
        line-height: 1.5;
      }
      .powerup-stat-badge .badge-icon {
        font-size: 10px;
        line-height: 1;
        opacity: 0.85;
      }
      .powerup-stat-badge .badge-value {
        font-weight: 700;
        color: #ffdd44;
      }

      /* ========== Mobile / Touch ========== */
      @media (max-width: 768px), (pointer: coarse) {
        /* Timer */
        #game-timer {
          top: 10px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        /* Level */
        #level-display { top: 8px; right: 10px; gap: 2px; }
        #level-display span:first-child { font-size: 9px; letter-spacing: 1px; }
        #level-value { font-size: 20px; }

        /* Gold */
        #gold-display { top: 32px; right: 10px; font-size: 13px; gap: 3px; }
        .gold-icon { font-size: 14px; }

        /* Inventory */
        #inventory-container { top: 38px; left: 8px; gap: 4px; }
        #weapon-icons { gap: 3px; }
        .weapon-icon-box {
          width: 34px; height: 34px;
          border-radius: 6px; border-width: 1.5px;
        }
        .weapon-icon-box .icon { font-size: 17px; }
        .weapon-icon-box .level { font-size: 8px; bottom: 0; right: 2px; }

        #passive-items { gap: 2px; }
        .passive-item-box {
          width: 26px; height: 26px;
          border-radius: 4px; border-width: 1.5px;
        }
        .passive-item-box .icon { font-size: 13px; }
        .passive-item-box .level { font-size: 7px; }

        /* Powerup Stats - ultra-compact */
        #powerup-stats-panel {
          top: 50px;
          right: 8px;
          max-width: 155px;
          gap: 1px 2px;
        }
        .powerup-stat-badge {
          font-size: 7.5px;
          padding: 0px 3px;
          gap: 1px;
          border: none;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 2px;
          line-height: 1.6;
        }
        .powerup-stat-badge .badge-icon { font-size: 8px; }
        .powerup-stat-badge .badge-value { font-size: 7.5px; }
      }
    `, "hud-styles");
  }

  createVSHUD() {
    // XP Bar
    this.createXPBar();

    // Timer
    this.createTimer();

    // Level display
    this.createLevelDisplay();

    // Weapon icons
    this.createWeaponIconsContainer();

    // Passive items display
    this.createPassiveItemsContainer();

    // Gold/coins display
    this.createGoldDisplay();

    // Power-up stats panel (shows permanent bonuses from shop)
    this.createPowerUpStatsPanel();
  }

  createXPBar() {
    const xpContainer = document.createElement("div");
    xpContainer.id = "xp-container";
    xpContainer.innerHTML = `
      <div id="xp-bar">
        <div id="xp-fill"></div>
      </div>
    `;
    document.getElementById("hud").appendChild(xpContainer);

    this.elements.xpFill = document.getElementById("xp-fill");
  }

  createTimer() {
    const timer = document.createElement("div");
    timer.id = "game-timer";
    timer.innerHTML = "0:00";
    document.getElementById("hud").appendChild(timer);

    this.elements.timer = timer;
  }

  createLevelDisplay() {
    const levelDisplay = document.createElement("div");
    levelDisplay.id = "level-display";
    levelDisplay.innerHTML = `<span>LV</span><span id="level-value">1</span>`;
    document.getElementById("hud").appendChild(levelDisplay);

    this.elements.levelValue = document.getElementById("level-value");
  }

  createWeaponIconsContainer() {
    // Create a parent container that holds both weapons and passives
    let inventoryContainer = document.getElementById("inventory-container");
    if (!inventoryContainer) {
      inventoryContainer = document.createElement("div");
      inventoryContainer.id = "inventory-container";
      document.getElementById("hud").appendChild(inventoryContainer);
    }

    const container = document.createElement("div");
    container.id = "weapon-icons";
    inventoryContainer.appendChild(container);

    this.elements.weaponIcons = container;
  }

  createPassiveItemsContainer() {
    // Add to the same inventory container
    let inventoryContainer = document.getElementById("inventory-container");
    if (!inventoryContainer) {
      inventoryContainer = document.createElement("div");
      inventoryContainer.id = "inventory-container";
      document.getElementById("hud").appendChild(inventoryContainer);
    }

    const container = document.createElement("div");
    container.id = "passive-items";
    inventoryContainer.appendChild(container);

    this.elements.passiveItems = container;
  }

  createGoldDisplay() {
    const gold = document.createElement("div");
    gold.id = "gold-display";
    gold.innerHTML = `<span class="gold-icon">💰</span><span id="gold-value">0</span>`;
    document.getElementById("hud").appendChild(gold);

    this.elements.goldValue = document.getElementById("gold-value");
  }

  createPowerUpStatsPanel() {
    const panel = document.createElement("div");
    panel.id = "powerup-stats-panel";
    document.getElementById("hud").appendChild(panel);

    this.elements.powerUpStats = panel;
  }

  updatePowerUpStats() {
    if (!this.elements.powerUpStats || !this.game.powerUpSystem) return;

    const bonuses = this.game.powerUpSystem.getActiveBonusSummary();
    clearChildren(this.elements.powerUpStats);

    if (bonuses.length === 0) return;

    for (const b of bonuses) {
      const badge = document.createElement("div");
      badge.className = "powerup-stat-badge";
      badge.title = `${b.name} Lv.${b.level}`;

      const iconSpan = document.createElement("span");
      iconSpan.className = "badge-icon";
      iconSpan.innerHTML = b.icon;
      badge.appendChild(iconSpan);

      const valueSpan = document.createElement("span");
      valueSpan.className = "badge-value";
      valueSpan.textContent = b.bonus;
      badge.appendChild(valueSpan);

      this.elements.powerUpStats.appendChild(badge);
    }
  }

  createDamageFlash() {
    this.damageFlashElement = document.createElement("div");
    this.damageFlashElement.id = "damage-flash";
    document.body.appendChild(this.damageFlashElement);
  }

  updateAll() {
    this.updateHealth();
    this.updateWave();
    this.updateScore();
    this.updateKills();
    this.updateWeapon();
    this.updateXP();
    this.updateLevel();
    this.updateWeaponIcons();
    this.updatePassiveItems();
    this.updatePowerUpStats();
  }

  updateHealth() {
    const healthPercent =
      (this.game.player.health / this.game.player.maxHealth) * 100;
    this.elements.healthFill.style.width = `${healthPercent}%`;

    // Change color based on health
    if (healthPercent <= 25) {
      this.elements.healthFill.style.background =
        "linear-gradient(90deg, #ff0000, #aa0000)";
    } else if (healthPercent <= 50) {
      this.elements.healthFill.style.background =
        "linear-gradient(90deg, #ff4400, #cc2200)";
    } else {
      this.elements.healthFill.style.background =
        "linear-gradient(90deg, #ff0000, #ff3333)";
    }
  }

  updateWave() {
    this.elements.waveNumber.textContent = this.game.wave;
  }

  updateScore() {
    this.elements.scoreValue.textContent = this.game.score.toLocaleString();

    // Also update gold
    if (this.elements.goldValue) {
      this.elements.goldValue.textContent = (this.game.gold || 0).toLocaleString();
    }
  }

  updateKills() {
    this.elements.killsValue.textContent = this.game.kills;
  }

  updateWeapon() {
    // Legacy weapon display - keep for compatibility but can be hidden
    const weapon = this.game.weaponSystem?.getCurrentWeapon();
    if (weapon) {
      this.elements.weaponName.textContent = weapon.name;

      if (weapon.ammo === Infinity) {
        this.elements.ammoValue.textContent = "∞";
      } else {
        this.elements.ammoValue.textContent = weapon.ammo;

        if (weapon.ammo <= weapon.maxAmmo * 0.25) {
          this.elements.ammoValue.style.color = "#ff3333";
        } else {
          this.elements.ammoValue.style.color = "#ffcc00";
        }
      }
    }
  }

  updateXP() {
    if (!this.game.xpSystem) return;

    const progress = this.game.xpSystem.getLevelProgress();
    this.elements.xpFill.style.width = `${progress * 100}%`;
  }

  updateLevel() {
    if (!this.game.xpSystem) return;

    this.elements.levelValue.textContent = this.game.xpSystem.level;
  }

  updateTimer() {
    if (!this.elements.timer) return;

    const elapsed = this.game.gameTime || 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  updateWeaponIcons() {
    if (!this.elements.weaponIcons || !this.game.autoWeaponSystem) return;

    clearChildren(this.elements.weaponIcons);

    const weapons = this.game.autoWeaponSystem.getEquippedWeapons();

    for (const weapon of weapons) {
      const def = AUTO_WEAPONS[weapon.id];
      if (!def) continue;

      this.elements.weaponIcons.appendChild(createIconBox(def, weapon.level));
    }
  }

  updatePassiveItems() {
    if (!this.elements.passiveItems || !this.game.passiveItemSystem) return;

    clearChildren(this.elements.passiveItems);

    const items = this.game.passiveItemSystem.getItems();

    for (const item of items) {
      const def = PASSIVE_ITEMS[item.id];
      if (!def) continue;

      this.elements.passiveItems.appendChild(
        createIconBox(def, item.level, { boxClass: "passive-item-box" }),
      );
    }
  }

  announceWave(wave) {
    this.elements.announceWaveNumber.textContent = wave;
    this.elements.waveAnnouncement.classList.remove("hidden");

    // Re-trigger animation
    this.elements.waveAnnouncement.style.animation = "none";
    this.elements.waveAnnouncement.offsetHeight; // Trigger reflow
    this.elements.waveAnnouncement.style.animation = null;

    // Hide after animation
    setTimeout(() => {
      this.elements.waveAnnouncement.classList.add("hidden");
    }, 2000);

    // Update wave counter
    this.updateWave();
  }

  showLevelUp(level) {
    // Create level up effect
    const levelUp = document.createElement("div");
    levelUp.className = "level-up-announcement";
    levelUp.innerHTML = `<span>LEVEL UP!</span><span class="new-level">${level}</span>`;
    document.body.appendChild(levelUp);

    // Remove after animation
    setTimeout(() => {
      levelUp.remove();
    }, 1500);

    injectCSS(`
        .level-up-announcement {
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 200;
          animation: levelUpAnim 1.5s ease-out forwards;
          pointer-events: none;
        }

        .level-up-announcement span:first-child {
          font-size: 36px;
          color: #ffcc00;
          text-shadow: 0 0 20px rgba(255, 204, 0, 0.8);
          letter-spacing: 5px;
        }

        .level-up-announcement .new-level {
          font-size: 72px;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
        }

        @keyframes levelUpAnim {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -60%) scale(1);
          }
        }
    `, "level-up-styles");
  }

  damageFlash() {
    this.damageFlashElement.classList.add("active");

    setTimeout(() => {
      this.damageFlashElement.classList.remove("active");
    }, 100);

    // Screen shake
    this.screenShake();
  }

  screenShake() {
    const container = document.getElementById("game-container");
    container.classList.add("shake");

    setTimeout(() => {
      container.classList.remove("shake");
    }, 200);
  }

  showCrosshair() {
    this.elements.crosshair.classList.remove("hidden");
  }

  hideCrosshair() {
    this.elements.crosshair.classList.add("hidden");
  }

  // Show message on screen (for pickups, etc.)
  showMessage(text, duration = 2000) {
    const message = document.createElement("div");
    message.className = "game-message";
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffcc00;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      z-index: 150;
      pointer-events: none;
      animation: fadeInOut ${duration}ms ease-in-out forwards;
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, duration);
  }
}

injectCSS(`
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`, "fade-in-out-anim");
