import { shuffleArray, injectCSS } from "./utils.js";
import { AUTO_WEAPONS } from "./autoWeapons.js";
import { PASSIVE_ITEMS } from "./passiveItems.js";

export class UpgradeUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.choices = [];

    this.createElements();
  }

  createElements() {
    // Create overlay container
    this.overlay = document.createElement("div");
    this.overlay.id = "upgrade-overlay";
    this.overlay.className = "upgrade-overlay hidden";

    // Create inner container
    this.container = document.createElement("div");
    this.container.className = "upgrade-container";

    // Title
    this.title = document.createElement("h2");
    this.title.className = "upgrade-title";
    this.title.textContent = "LEVEL UP!";
    this.container.appendChild(this.title);

    // Level display
    this.levelDisplay = document.createElement("div");
    this.levelDisplay.className = "upgrade-level";
    this.container.appendChild(this.levelDisplay);

    // Choices container
    this.choicesContainer = document.createElement("div");
    this.choicesContainer.className = "upgrade-choices";
    this.container.appendChild(this.choicesContainer);

    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);

    // Add styles
    this.addStyles();
  }

  addStyles() {
    injectCSS(
      `
      .upgrade-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 300;
        cursor: default;
        box-sizing: border-box;
      }

      .upgrade-overlay.hidden {
        display: none;
      }

      .upgrade-container {
        text-align: center;
        padding: 30px;
        animation: upgradeSlideIn 0.3s ease-out;
      }

      @keyframes upgradeSlideIn {
        from {
          opacity: 0;
          transform: translateY(-50px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .upgrade-title {
        font-size: 48px;
        color: #ffcc00;
        text-shadow: 0 0 20px rgba(255, 204, 0, 0.8),
                     0 0 40px rgba(255, 204, 0, 0.5);
        margin-bottom: 10px;
        letter-spacing: 5px;
        animation: titlePulse 0.5s ease-in-out infinite alternate;
      }

      @keyframes titlePulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }

      .upgrade-level {
        font-size: 24px;
        color: #888;
        margin-bottom: 30px;
      }

      .upgrade-choices {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .upgrade-choice {
        width: 200px;
        padding: 20px;
        background: linear-gradient(180deg, #333 0%, #222 100%);
        border: 3px solid #555;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .upgrade-choice.common { border-color: #555; }
      .upgrade-choice.uncommon { border-color: #00aa00; }
      .upgrade-choice.rare { border-color: #0088ff; }
      .upgrade-choice.legendary { border-color: #ffaa00; }

      .upgrade-choice.evolution {
        border-color: #ff00ff;
        background: linear-gradient(180deg, #442244 0%, #221133 100%);
        animation: evolutionGlow 1s ease-in-out infinite alternate;
      }

      .upgrade-rarity-label {
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 5px;
        text-shadow: 0 0 2px #000;
      }
      .rarity-common { color: #aaa; }
      .rarity-uncommon { color: #00ff88; }
      .rarity-rare { color: #00aaff; }
      .rarity-legendary { color: #ffcc00; }
      .rarity-evolution { color: #ff00ff; }

      /* Hover effects ONLY for devices with hover capability (not touch) */
      @media (hover: hover) and (pointer: fine) {
        .upgrade-choice:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
        }

        .upgrade-choice.common:hover {
          border-color: #888;
          box-shadow: 0 10px 30px rgba(136, 136, 136, 0.3);
        }

        .upgrade-choice.uncommon:hover {
          border-color: #00ff88;
          box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }

        .upgrade-choice.rare:hover {
          border-color: #00aaff;
          box-shadow: 0 10px 30px rgba(0, 170, 255, 0.3);
        }

        .upgrade-choice.legendary:hover {
          border-color: #ffcc00;
          box-shadow: 0 10px 30px rgba(255, 204, 0, 0.3);
        }

        .upgrade-choice.evolution:hover {
          border-color: #ff66ff;
          box-shadow: 0 10px 40px rgba(255, 0, 255, 0.5);
          transform: translateY(-8px) scale(1.02);
        }


      }

      @keyframes evolutionGlow {
        from { box-shadow: 0 0 10px rgba(255, 0, 255, 0.3); }
        to { box-shadow: 0 0 25px rgba(255, 0, 255, 0.6); }
      }

      .upgrade-choice.evolution::before {
        content: "⚡ EVOLUTION ⚡";
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(90deg, #ff00ff, #ffdd00);
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 3px 15px;
        border-radius: 10px;
        text-shadow: 0 0 5px rgba(0,0,0,0.5);
      }

      .upgrade-choice.new {
      }

      .upgrade-choice.new::after {
        content: "NEW";
        position: absolute;
        top: 10px;
        right: -25px;
        background: #ff4400;
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 3px 30px;
        transform: rotate(45deg);
      }

      .upgrade-icon {
        font-size: 48px;
        margin-bottom: 10px;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
      }

      .upgrade-name {
        font-size: 18px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 5px;
      }

      .upgrade-type {
        font-size: 12px;
        color: #888;
        text-transform: uppercase;
        margin-bottom: 10px;
      }

      .upgrade-description {
        font-size: 14px;
        color: #aaa;
        line-height: 1.4;
      }

      .upgrade-level-display {
        margin-top: 10px;
        display: flex;
        justify-content: center;
        gap: 4px;
      }

      .level-pip {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #444;
        border: 1px solid #666;
      }

      .level-pip.filled {
        background: #ffcc00;
        border-color: #ffcc00;
        box-shadow: 0 0 5px #ffcc00;
      }

      .level-pip.next {
        background: #886600;
        border-color: #aa8800;
        animation: pipPulse 0.5s ease-in-out infinite alternate;
      }

      @keyframes pipPulse {
        from { opacity: 0.5; }
        to { opacity: 1; }
      }

      /* Mobile responsive styles - 2 column grid */
      @media (max-width: 768px), (pointer: coarse) {
        .upgrade-container {
          padding: 10px;
          width: 100%;
          max-width: 100vw;
          box-sizing: border-box;
        }

        .upgrade-title {
          font-size: 24px;
          margin-bottom: 5px;
        }

        .upgrade-level {
          font-size: 14px;
          margin-bottom: 10px;
        }

        .upgrade-choices {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 0 5px;
        }

        .upgrade-choice {
          width: 100%;
          padding: 10px 8px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .upgrade-choice:active {
          transform: scale(0.95);
          opacity: 0.9;
          transition: transform 0.1s ease;
        }

        /* Reset any stuck hover states on touch */
        .upgrade-choice {
          -webkit-tap-highlight-color: transparent;
        }

        .upgrade-choice:hover {
          transform: none;
          box-shadow: none;
        }

        .upgrade-icon {
          font-size: 28px;
          margin-bottom: 5px;
        }

        .upgrade-name {
          font-size: 13px;
          margin-bottom: 3px;
        }

        .upgrade-type {
          font-size: 9px;
          margin-bottom: 5px;
        }

        .upgrade-description {
          font-size: 10px;
          line-height: 1.2;
        }

        .upgrade-level-display {
          margin-top: 5px;
          gap: 2px;
        }

        .level-pip {
          width: 5px;
          height: 5px;
        }

        .upgrade-choice.new::after {
          font-size: 8px;
          padding: 2px 20px;
          right: -20px;
          top: 8px;
        }

        .upgrade-choice.evolution::before {
          font-size: 8px;
          padding: 2px 8px;
          top: -10px;
        }
      }
    `,
      "upgrade-ui-styles",
    );
  }

  show(level, isBonus = false) {
    // Generate choices
    this.generateChoices();

    if (this.choices.length === 0) {
      // No upgrades available, just hide
      this.hide();
      return;
    }

    // Update level display
    if (isBonus) {
      this.title.textContent = "CHEST BONUS!";
      this.levelDisplay.textContent = "Bonus Upgrade";
    } else {
      this.title.textContent = "LEVEL UP!";
      this.levelDisplay.textContent = `Level ${level}`;
    }

    // Clear previous choices
    this.choicesContainer.innerHTML = "";

    // Create choice elements
    this.choices.forEach((choice, index) => {
      const element = this.createChoiceElement(choice, index);
      this.choicesContainer.appendChild(element);
    });

    // Show overlay
    this.overlay.classList.remove("hidden");
    this.isOpen = true;
  }

  generateChoices() {
    // Check for available evolutions first (highest priority)
    this.game.evolutionSystem.checkEvolutions();
    const evolutionUpgrades = this.game.evolutionSystem.getPendingEvolutions();

    // Get all available upgrades
    const weaponUpgrades = this.game.autoWeaponSystem.getAvailableUpgrades();
    const passiveUpgrades = this.game.passiveItemSystem.getAvailableUpgrades();
    // Combine all arrays safely handling undefined ones
    const allUpgrades = [
      ...(evolutionUpgrades || []),
      ...(weaponUpgrades || []),
      ...(passiveUpgrades || []),
    ];

    if (allUpgrades.length === 0) {
      // Provide fallback choices when everything is maxed out
      this.choices = [
        {
          type: "fallback",
          id: "gold",
          name: "Gold Bag",
          rarity: "uncommon",
          icon: '<i class="fa-solid fa-sack-dollar"></i>',
          iconColor: "#ffcc00",
          description: "Gain +100 Gold",
          currentLevel: 1,
        },
        {
          type: "fallback",
          id: "health",
          name: "Floor Chicken",
          rarity: "common",
          icon: '<i class="fa-solid fa-drumstick-bite"></i>',
          iconColor: "#ff8844",
          description: "Heal 30 HP",
          currentLevel: 1,
        },
      ];
      return;
    }

    // Luck influences rarity weighting: higher luck = higher rarity items appear more
    const luck = this.game.playerStats?.luck || 0;
    const rarityWeight = { common: 1, uncommon: 1.5, rare: 2, legendary: 3 };
    const weightedShuffle = (arr) => {
      return arr
        .map((item) => ({
          item,
          score: Math.random() * (rarityWeight[item.rarity] || 1) * (1 + luck * 0.1),
        }))
        .sort((a, b) => b.score - a.score)
        .map((e) => e.item);
    };

    const shuffled = weightedShuffle(allUpgrades);
    const numChoices = Math.min(4, shuffled.length);

    // Prefer showing evolutions first if available
    this.choices = [];
    const evolutions = shuffled.filter((u) => u.type === "evolution");
    const weapons = shuffled.filter((u) => u.type === "weapon");
    const passives = shuffled.filter((u) => u.type === "passive");

    // Always show evolutions first if available (they're rare and powerful)
    if (evolutions.length > 0) {
      this.choices.push(...evolutions.slice(0, 2)); // Max 2 evolutions
    }

    // Fill remaining slots
    const remainingSlots = numChoices - this.choices.length;
    if (remainingSlots > 0) {
      // Try to get a mix of weapons and passives
      if (weapons.length > 0 && passives.length > 0) {
        this.choices.push(weapons[0]);
        if (remainingSlots > 1) this.choices.push(passives[0]);

        const remaining = [...weapons.slice(1), ...passives.slice(1)];
        const shuffledRemaining = shuffleArray(remaining);
        this.choices.push(...shuffledRemaining.slice(0, remainingSlots - 2));
      } else {
        const remaining = [...weapons, ...passives];
        const shuffledRemaining = shuffleArray(remaining);
        this.choices.push(...shuffledRemaining.slice(0, remainingSlots));
      }
    }

    // Shuffle final choices (but keep evolutions at the front for visibility)
    const finalEvolutions = this.choices.filter((c) => c.type === "evolution");
    const finalOthers = shuffleArray(
      this.choices.filter((c) => c.type !== "evolution"),
    );
    this.choices = [...finalEvolutions, ...finalOthers];
  }

  createChoiceElement(choice, index) {
    const element = document.createElement("div");

    // Determine rarity class (evolutions are implicitly legendary)
    const rarityClass =
      choice.type === "evolution" ? "evolution" : choice.rarity || "common";
    element.className = `upgrade-choice ${choice.type} ${rarityClass}`;

    if (choice.currentLevel === 0) {
      element.classList.add("new");
    }

    // Rarity label
    const rarityLabel = document.createElement("div");
    rarityLabel.className = `upgrade-rarity-label rarity-${rarityClass}`;
    rarityLabel.textContent =
      rarityClass === "evolution" ? "EVOLUTION" : rarityClass.toUpperCase();
    element.appendChild(rarityLabel);

    // Icon
    const icon = document.createElement("div");
    icon.className = "upgrade-icon";
    icon.innerHTML = choice.icon;
    if (choice.iconColor) {
      icon.style.color = choice.iconColor;
      icon.style.filter = `drop-shadow(0 0 10px ${choice.iconColor}80)`;
    }
    element.appendChild(icon);

    // Name
    const name = document.createElement("div");
    name.className = "upgrade-name";
    name.textContent = choice.name;
    element.appendChild(name);

    // Type label
    const type = document.createElement("div");
    type.className = "upgrade-type";
    type.textContent =
      choice.type === "evolution"
        ? "EVOLUTION"
        : choice.type === "weapon"
          ? "WEAPON"
          : "PASSIVE";
    element.appendChild(type);

    // Description
    const desc = document.createElement("div");
    desc.className = "upgrade-description";
    desc.textContent = choice.description;
    element.appendChild(desc);

    // Level pips
    const maxLevel =
      choice.type === "fallback"
        ? 0
        : choice.type === "weapon"
          ? AUTO_WEAPONS && AUTO_WEAPONS[choice.id]
            ? AUTO_WEAPONS[choice.id].maxLevel
            : 8
          : PASSIVE_ITEMS && PASSIVE_ITEMS[choice.id]
            ? PASSIVE_ITEMS[choice.id].maxLevel
            : 5;

    if (choice.type !== "fallback") {
      const levelDisplay = document.createElement("div");
      levelDisplay.className = "upgrade-level-display";

      for (let i = 0; i < maxLevel; i++) {
        const pip = document.createElement("div");
        pip.className = "level-pip";
        if (i < choice.currentLevel) {
          pip.classList.add("filled");
        } else if (i === choice.currentLevel) {
          pip.classList.add("next");
        }
        levelDisplay.appendChild(pip);
      }
      element.appendChild(levelDisplay);
    }

    // Click/touch handler - use both for mobile compatibility
    const handleSelect = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectChoice(choice);
    };

    element.addEventListener("click", handleSelect);

    // Touch handler for mobile
    element.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Small delay to prevent double-firing
        setTimeout(() => this.selectChoice(choice), 50);
      },
      { passive: false },
    );

    // Keyboard shortcut (1, 2, 3, 4)
    const handleKeyDown = (e) => {
      if (e.key === String(index + 1)) {
        this.selectChoice(choice);
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return element;
  }

  selectChoice(choice) {
    // Apply the upgrade
    if (choice.type === "evolution") {
      // Perform evolution!
      this.game.evolutionSystem.evolve(choice.id);
      // Bloom pulse for dramatic effect
      this.game.pulseBloom(0.5, 2.5);
    } else if (choice.type === "weapon") {
      this.game.autoWeaponSystem.addWeapon(choice.id);
    } else if (choice.type === "passive") {
      this.game.passiveItemSystem.addItem(choice.id);
    } else if (choice.type === "fallback") {
      // Handle fallback rewards (Gold or Chicken) when everything is maxed
      if (choice.id === "gold") {
        if (this.game.powerUpSystem) {
          this.game.gold += this.game.powerUpSystem.addGold(100);
          this.game.ui.updateScore();
        }
      } else if (choice.id === "health") {
        this.game.player.heal(30);
      }
    }

    // Play sound
    this.game.audioManager.playSound(
      choice.type === "evolution" ? "evolution" : "upgrade",
    );

    // Close UI
    this.hide();

    // Update HUD
    this.game.ui.updateWeaponIcons();
    this.game.ui.updatePassiveItems();
  }

  hide() {
    this.overlay.classList.add("hidden");
    this.isOpen = false;

    // Check if there are queued upgrades before unpausing
    if (this.game.upgradeQueue && this.game.upgradeQueue.length > 0) {
      setTimeout(() => {
        this.game.triggerNextUpgrade();
      }, 500); // 500ms delay to make it feel better and allow messages to appear
    } else {
      // Resume game
      this.game.isPaused = false;
    }
  }
}
