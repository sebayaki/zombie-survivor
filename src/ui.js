import { AUTO_WEAPONS } from "./autoWeapons.js";
import { PASSIVE_ITEMS } from "./passiveItems.js";
import { ARCANA_CARDS } from "./arcanaSystem.js";
import { injectCSS } from "./utils.js";
import { clearChildren, createIconBox } from "./uiUtils.js";

export class UI {
  constructor(game) {
    this.game = game;

    // Cache DOM elements
    this.elements = {
      healthFill: document.getElementById("health-fill"),
      bossStatus: document.getElementById("boss-status"),
      bossCountdown: document.getElementById("boss-countdown"),
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

      /* === Active Arcana === */
      #active-arcana {
        position: absolute;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 6px;
      }
      .arcana-hud-icon {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border: 2px solid;
        background: rgba(0,0,0,0.6);
        filter: drop-shadow(0 0 4px currentColor);
      }

      /* === Stage Badge === */
      #stage-badge {
        position: absolute;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 13px;
        font-weight: 700;
        color: #ff8844;
        letter-spacing: 2px;
        text-shadow: 0 0 10px rgba(255,136,68,0.5), 0 2px 6px rgba(0,0,0,0.9);
      }
      #stage-badge .stage-num {
        color: #ffcc00;
        font-size: 16px;
        font-weight: 900;
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

        /* Stage badge */
        #stage-badge { top: 33px; font-size: 10px; }
        #stage-badge .stage-num { font-size: 12px; }

        /* Arcana */
        #active-arcana { top: 48px; gap: 3px; }
        .arcana-hud-icon { width: 22px; height: 22px; font-size: 11px; }

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

    // Stage badge
    this.createStageBadge();

    // Active arcana display
    this.createArcanaDisplay();

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

  createStageBadge() {
    const badge = document.createElement("div");
    badge.id = "stage-badge";
    badge.innerHTML = `STAGE <span class="stage-num" id="stage-value">1</span>`;
    document.getElementById("hud").appendChild(badge);
    this.elements.stageValue = document.getElementById("stage-value");
  }

  updateStage() {
    if (!this.elements.stageValue || !this.game.stageSystem) return;
    this.elements.stageValue.textContent = this.game.stageSystem.currentStage;
  }

  createArcanaDisplay() {
    const container = document.createElement("div");
    container.id = "active-arcana";
    document.getElementById("hud").appendChild(container);
    this.elements.activeArcana = container;
  }

  updateArcana() {
    if (!this.elements.activeArcana || !this.game.arcanaSystem) return;
    clearChildren(this.elements.activeArcana);

    for (const id of this.game.arcanaSystem.activeArcana) {
      const card = ARCANA_CARDS[id];
      if (!card) continue;
      const icon = document.createElement("div");
      icon.className = "arcana-hud-icon";
      icon.style.color = card.color;
      icon.style.borderColor = card.color;
      icon.innerHTML = card.icon;
      icon.title = `${card.name}: ${card.description}`;
      this.elements.activeArcana.appendChild(icon);
    }
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
    gold.innerHTML = `<span class="gold-icon"><i class="fa-solid fa-coins"></i></span><span id="gold-value">0</span>`;
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
    this.updateBossStatus();
    this.updateScore();
    this.updateKills();
    this.updateWeapon();
    this.updateXP();
    this.updateLevel();
    this.updateStage();
    this.updateArcana();
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

  updateBossStatus() {
    if (!this.elements.bossStatus || !this.game.stageSystem) return;

    const stage = this.game.stageSystem;
    const el = this.elements.bossStatus;

    if (stage.stageCompleted) {
      el.className = "boss-defeated";
      el.innerHTML = `<i class="fa-solid fa-check"></i> STAGE CLEAR`;
    } else if (stage.stageBossSpawned) {
      el.className = "boss-active";
      el.innerHTML = `<i class="fa-solid fa-skull-crossbones"></i> DEFEAT THE BOSS`;
    } else {
      el.className = "";
      const bossTime = 7 * 60; // boss spawns at 420s (wave 8)
      const remaining = Math.max(0, bossTime - this.game.gameTime);
      const mins = Math.floor(remaining / 60);
      const secs = Math.floor(remaining % 60);
      el.innerHTML = `<i class="fa-solid fa-skull-crossbones"></i> BOSS IN <span id="boss-countdown">${mins}:${secs.toString().padStart(2, "0")}</span>`;
    }
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

  formatTime(elapsed) {
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  updateTimer() {
    if (!this.elements.timer) return;
    this.elements.timer.textContent = this.formatTime(this.game.gameTime || 0);
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

  announceMinute(minutes) {
    this.elements.announceWaveNumber.textContent = `${minutes}:00`;
    this.elements.waveAnnouncement.classList.remove("hidden");

    this.elements.waveAnnouncement.style.animation = "none";
    this.elements.waveAnnouncement.offsetHeight;
    this.elements.waveAnnouncement.style.animation = null;

    setTimeout(() => {
      this.elements.waveAnnouncement.classList.add("hidden");
    }, 2000);

    this.updateBossStatus();
  }

  announceBoss() {
    const el = document.createElement("div");
    el.id = "boss-announcement";
    el.innerHTML = `
      <div class="boss-announce-text">WARNING</div>
      <div class="boss-announce-name">THE ABOMINATION APPROACHES</div>
      <div class="boss-announce-bar"></div>
    `;
    document.body.appendChild(el);

    injectCSS(`
      #boss-announcement {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 100;
        pointer-events: none;
        animation: bossAnnounceFade 3s ease-out forwards;
      }
      .boss-announce-text {
        font-size: 5rem;
        font-weight: 900;
        color: #ff0044;
        text-shadow: 0 0 30px #ff0044, 0 0 60px #880022, 0 0 90px #440011;
        letter-spacing: 1.5rem;
        animation: bossTextPulse 0.5s ease-in-out infinite alternate;
      }
      .boss-announce-name {
        font-size: 1.8rem;
        font-weight: 700;
        color: #ff88aa;
        text-shadow: 0 0 15px #ff0044;
        letter-spacing: 0.5rem;
        margin-top: 0.5rem;
        opacity: 0;
        animation: bossNameReveal 1s ease-out 0.5s forwards;
      }
      .boss-announce-bar {
        width: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, #ff0044, #ff88aa, #ff0044, transparent);
        margin-top: 1rem;
        animation: bossBarExpand 1.5s ease-out 0.3s forwards;
      }
      @keyframes bossAnnounceFade {
        0% { background: rgba(0,0,0,0); }
        10% { background: rgba(20,0,5,0.6); }
        60% { background: rgba(20,0,5,0.4); }
        100% { background: rgba(0,0,0,0); opacity: 0; }
      }
      @keyframes bossTextPulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }
      @keyframes bossNameReveal {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes bossBarExpand {
        from { width: 0; }
        to { width: 400px; }
      }
    `);

    setTimeout(() => el.remove(), 3200);
  }

  showBossHealthBar(name) {
    if (document.getElementById("boss-hud")) return;
    const bar = document.createElement("div");
    bar.id = "boss-hud";
    bar.innerHTML = `
      <div class="boss-hud-name">${name || "ABOMINATION"}</div>
      <div class="boss-hud-bar-bg"><div class="boss-hud-bar-fill" id="boss-hud-fill"></div></div>
    `;
    document.body.appendChild(bar);

    injectCSS(`
      #boss-hud {
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
        text-align: center;
        pointer-events: none;
        animation: bossHudSlideIn 0.5s ease-out;
      }
      .boss-hud-name {
        font-size: 1rem;
        font-weight: 700;
        color: #ff4488;
        text-shadow: 0 0 10px #ff0044;
        letter-spacing: 0.3rem;
        margin-bottom: 4px;
      }
      .boss-hud-bar-bg {
        width: 400px;
        height: 10px;
        background: rgba(50,0,20,0.8);
        border: 1px solid #ff2266;
        border-radius: 5px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(255,0,68,0.3);
      }
      .boss-hud-bar-fill {
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #ff0044, #ff4488);
        border-radius: 5px;
        transition: width 0.15s ease-out;
        box-shadow: 0 0 8px #ff0044;
      }
      @keyframes bossHudSlideIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `);
  }

  updateBossHealthBar(percent) {
    const fill = document.getElementById("boss-hud-fill");
    if (fill) {
      fill.style.width = `${Math.max(0, percent * 100)}%`;
      if (percent < 0.3) {
        fill.style.background = "linear-gradient(90deg, #ff0000, #ff4400)";
        fill.style.boxShadow = "0 0 12px #ff0000";
      }
    }
  }

  hideBossHealthBar() {
    const el = document.getElementById("boss-hud");
    if (el) el.remove();
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
