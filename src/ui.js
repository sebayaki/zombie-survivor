import { AUTO_WEAPONS } from "./autoWeapons.js";
import { PASSIVE_ITEMS } from "./passiveItems.js";
import { injectCSS } from "./utils.js";

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
      #xp-container { position: absolute; top: 0; left: 0; width: 100%; z-index: 100; }
      #xp-bar { width: 100%; height: 8px; background: rgba(0,0,0,0.8); border-bottom: 2px solid #333; }
      #xp-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #00aaff, #00ffff); transition: width 0.2s ease; box-shadow: 0 0 10px #00aaff; }

      #game-timer { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); font-size: 32px; font-weight: bold; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); letter-spacing: 2px; }

      #level-display { position: absolute; top: 20px; right: 20px; display: flex; align-items: baseline; gap: 5px; }
      #level-display span:first-child { font-size: 16px; color: #888; }
      #level-value { font-size: 36px; font-weight: bold; color: #ffcc00; text-shadow: 0 0 10px rgba(255,204,0,0.5); }

      #inventory-container { position: absolute; top: 60px; left: 20px; display: flex; flex-direction: column; gap: 10px; max-width: 300px; }
      #weapon-icons { display: flex; gap: 8px; flex-wrap: wrap; }
      .weapon-icon-box { width: 48px; height: 48px; background: rgba(0,0,0,0.7); border: 2px solid #555; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
      .weapon-icon-box.rarity-common { border-color: #555; }
      .weapon-icon-box.rarity-uncommon { border-color: #00aa00; }
      .weapon-icon-box.rarity-rare { border-color: #0088ff; }
      .weapon-icon-box.rarity-legendary { border-color: #ffaa00; }
      .weapon-icon-box .icon { font-size: 24px; filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
      .weapon-icon-box .level { position: absolute; bottom: 2px; right: 2px; font-size: 10px; font-weight: bold; color: #ffcc00; text-shadow: 1px 1px 1px #000; }
      .weapon-icon-box.max-level { border-color: #ffcc00 !important; box-shadow: 0 0 10px rgba(255,204,0,0.5); }

      #passive-items { display: flex; gap: 6px; flex-wrap: wrap; }
      .passive-item-box { width: 36px; height: 36px; background: rgba(0,0,0,0.7); border: 2px solid #555; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
      .passive-item-box.rarity-common { border-color: #555; }
      .passive-item-box.rarity-uncommon { border-color: #00aa00; }
      .passive-item-box.rarity-rare { border-color: #0088ff; }
      .passive-item-box.rarity-legendary { border-color: #ffaa00; }
      .passive-item-box .icon { font-size: 18px; }
      .passive-item-box .level { position: absolute; bottom: 1px; right: 1px; font-size: 9px; font-weight: bold; color: #ffcc00; text-shadow: 1px 1px 1px #000; }
      .passive-item-box.max-level { border-color: #ffcc00 !important; }

      #gold-display { position: absolute; top: 55px; right: 20px; display: flex; align-items: center; gap: 5px; font-size: 20px; color: #ffcc00; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
      .gold-icon { font-size: 24px; }

      #powerup-stats-panel {
        position: absolute;
        top: 85px;
        right: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        max-width: 220px;
        justify-content: flex-end;
      }

      .powerup-stat-badge {
        display: flex;
        align-items: center;
        gap: 3px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 204, 0, 0.3);
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 11px;
        color: #ffcc00;
        white-space: nowrap;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      }

      .powerup-stat-badge .badge-icon {
        font-size: 12px;
        line-height: 1;
      }

      .powerup-stat-badge .badge-value {
        font-weight: bold;
        color: #ffdd44;
      }

      @media (max-width: 768px), (pointer: coarse) {
        #powerup-stats-panel {
          top: 80px;
          right: 10px;
          max-width: 160px;
          gap: 3px;
        }
        .powerup-stat-badge {
          font-size: 9px;
          padding: 1px 4px;
          gap: 2px;
        }
        .powerup-stat-badge .badge-icon { font-size: 10px; }
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
    this.elements.powerUpStats.innerHTML = "";

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

    this.elements.weaponIcons.innerHTML = "";

    const weapons = this.game.autoWeaponSystem.getEquippedWeapons();

    for (const weapon of weapons) {
      const def = AUTO_WEAPONS[weapon.id];
      if (!def) continue;

      const box = document.createElement("div");
      const rarityClass = def.rarity || "common";
      box.className = `weapon-icon-box rarity-${rarityClass}`;
      if (weapon.level >= def.maxLevel) {
        box.classList.add("max-level");
      }

      const icon = document.createElement("span");
      icon.className = "icon";
      icon.innerHTML = def.icon;
      box.appendChild(icon);

      const level = document.createElement("span");
      level.className = "level";
      level.textContent = weapon.level;
      box.appendChild(level);

      // Tooltip on hover
      box.title = `${def.name} Lv.${weapon.level}`;

      this.elements.weaponIcons.appendChild(box);
    }
  }

  updatePassiveItems() {
    if (!this.elements.passiveItems || !this.game.passiveItemSystem) return;

    this.elements.passiveItems.innerHTML = "";

    const items = this.game.passiveItemSystem.getItems();

    for (const item of items) {
      const def = PASSIVE_ITEMS[item.id];
      if (!def) continue;

      const box = document.createElement("div");
      const rarityClass = def.rarity || "common";
      box.className = `passive-item-box rarity-${rarityClass}`;
      if (item.level >= def.maxLevel) {
        box.classList.add("max-level");
      }

      const icon = document.createElement("span");
      icon.className = "icon";
      icon.innerHTML = def.icon;
      box.appendChild(icon);

      const level = document.createElement("span");
      level.className = "level";
      level.textContent = item.level;
      box.appendChild(level);

      // Tooltip
      box.title = `${def.name} Lv.${item.level}`;

      this.elements.passiveItems.appendChild(box);
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
