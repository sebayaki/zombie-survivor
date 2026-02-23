import { shuffleArray, injectCSS } from "./utils.js";

export class ChestUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.createElements();
  }

  createElements() {
    this.overlay = document.createElement("div");
    this.overlay.id = "chest-overlay";
    this.overlay.className = "chest-overlay";

    // Golden flash layer that fires on open
    this.flash = document.createElement("div");
    this.flash.className = "chest-flash";
    this.overlay.appendChild(this.flash);

    this.container = document.createElement("div");
    this.container.className = "chest-container";

    this.title = document.createElement("h2");
    this.title.className = "chest-title";
    this.title.textContent = "TREASURE FOUND!";
    this.container.appendChild(this.title);

    this.itemsContainer = document.createElement("div");
    this.itemsContainer.className = "chest-items";
    this.container.appendChild(this.itemsContainer);

    this.doneBtn = document.createElement("button");
    this.doneBtn.className = "chest-done-btn btn-hidden";
    this.doneBtn.textContent = "DONE";
    this.doneBtn.addEventListener("click", () => this.close());
    this.container.appendChild(this.doneBtn);

    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);

    this.addStyles();
  }

  addStyles() {
    injectCSS(`
      .chest-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        z-index: 400;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        pointer-events: none;
        opacity: 0;
        transition: background 0.5s ease, opacity 0.1s ease;
      }
      .chest-overlay.active {
        pointer-events: auto;
        opacity: 1;
        background: rgba(0, 0, 0, 0.85);
      }
      .chest-overlay.closing {
        pointer-events: none;
        opacity: 0;
        background: rgba(0, 0, 0, 0);
        transition: background 0.35s ease, opacity 0.35s ease;
      }

      .chest-flash {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center, rgba(255, 215, 0, 0.7) 0%, rgba(255, 170, 0, 0) 70%);
        opacity: 0;
        pointer-events: none;
        z-index: 1;
      }
      .chest-flash.fire {
        animation: chestFlashAnim 0.7s ease-out forwards;
      }
      @keyframes chestFlashAnim {
        0% { opacity: 1; transform: scale(0.5); }
        30% { opacity: 0.9; transform: scale(1.2); }
        100% { opacity: 0; transform: scale(2); }
      }

      .chest-container {
        text-align: center;
        padding: 30px 30px env(safe-area-inset-bottom, 20px);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 800px;
        margin: auto 0;
        position: relative;
        z-index: 2;
      }

      .chest-title {
        font-size: 50px;
        color: #ffcc00;
        text-shadow: 0 0 20px rgba(255, 204, 0, 0.8);
        margin-bottom: 40px;
        letter-spacing: 5px;
        opacity: 0;
        transform: scale(0.6);
        transition: opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .chest-title.visible {
        opacity: 1;
        transform: scale(1);
        animation: chestTitlePulse 1s 0.4s ease-in-out infinite alternate;
      }

      @keyframes chestTitlePulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }

      .chest-items {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
        min-height: 200px;
      }

      .chest-item {
        width: 180px;
        padding: 15px;
        background: linear-gradient(180deg, #333 0%, #222 100%);
        border: 3px solid #555;
        border-radius: 10px;
        opacity: 0;
        transform: scale(0.5) translateY(50px);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
      }
      .chest-item.revealed {
        opacity: 1;
        transform: scale(1) translateY(0);
      }

      .chest-item.common { border-color: #555; box-shadow: 0 0 15px rgba(100,100,100,0.5); }
      .chest-item.uncommon { border-color: #00aa00; box-shadow: 0 0 15px rgba(0,170,0,0.5); }
      .chest-item.rare { border-color: #0088ff; box-shadow: 0 0 15px rgba(0,136,255,0.5); }
      .chest-item.legendary { border-color: #ffaa00; box-shadow: 0 0 20px rgba(255,170,0,0.8); }
      .chest-item.evolution { border-color: #ff00ff; box-shadow: 0 0 25px rgba(255,0,255,0.8); background: linear-gradient(180deg, #442244 0%, #221133 100%); }

      .chest-item-icon {
        font-size: 50px;
        margin: 10px 0;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.4));
      }
      .chest-item-name {
        font-size: 18px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 5px;
        text-align: center;
      }
      .chest-item-level {
        font-size: 14px;
        color: #ffcc00;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .chest-item-desc {
        font-size: 12px;
        color: #aaa;
        line-height: 1.3;
        text-align: center;
      }

      .chest-done-btn {
        margin-top: 40px;
        padding: 15px 40px;
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        background: #0088ff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 5px 15px rgba(0,136,255,0.4);
        opacity: 0;
        transform: translateY(15px);
      }
      .chest-done-btn.btn-visible {
        opacity: 1;
        transform: translateY(0);
        transition: all 0.3s ease-out;
      }
      .chest-done-btn:hover {
        background: #00aaff;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,170,255,0.6);
      }
      .chest-done-btn:active {
        transform: translateY(2px);
      }
      .chest-done-btn.btn-hidden { opacity: 0; pointer-events: none; transform: translateY(15px); }

      @media (max-width: 768px), (pointer: coarse) {
        .chest-container {
          padding: 15px 10px env(safe-area-inset-bottom, 15px);
        }
        .chest-title {
          font-size: 28px;
          margin-bottom: 15px;
        }
        .chest-items {
          gap: 10px;
        }
        .chest-item {
          width: 140px;
          padding: 10px;
        }
        .chest-item-icon { font-size: 32px; margin: 5px 0; }
        .chest-item-name { font-size: 14px; }
        .chest-item-desc { font-size: 10px; }
        .chest-done-btn {
          margin-top: 20px;
          padding: 12px 30px;
          font-size: 20px;
        }
      }
    `, "chest-ui-styles");
  }

  show(items, rarity, goldAmount) {
    this.isOpen = true;

    // Reset state
    this.title.classList.remove("visible");
    this.title.textContent = rarity === "legendary" ? "LEGENDARY TREASURE!" : "TREASURE FOUND!";
    this.title.style.color = rarity === "legendary" ? "#ff00ff" : "#ffcc00";
    this.itemsContainer.innerHTML = "";
    this.doneBtn.className = "chest-done-btn btn-hidden";
    this.flash.classList.remove("fire");

    // Phase 1: golden flash fires while overlay fades in
    this.overlay.classList.remove("closing");
    void this.overlay.offsetWidth; // force reflow so transition restarts
    this.overlay.classList.add("active");
    this.flash.classList.add("fire");

    // Pause the game slightly after the overlay starts fading in
    // so the player sees the transition instead of an instant freeze
    setTimeout(() => {
      this.game.isPaused = true;
    }, 150);

    // Phase 2: reveal title and items after overlay has settled
    setTimeout(() => {
      this.title.classList.add("visible");
      this.game.audioManager.playSound("levelUp");
      this.revealItems(items, goldAmount);
    }, 450);
  }

  revealItems(items, goldAmount) {
    let delay = 0;
    
    const allItems = [...items];
    if (goldAmount > 0) {
      allItems.unshift({
        type: "gold",
        name: "Gold Coins",
        rarity: "common",
        icon: '<i class="fa-solid fa-coins"></i>',
        currentLevel: 0,
        description: `+${goldAmount} Gold`
      });
    }

    allItems.forEach((item) => {
      const el = document.createElement("div");
      const rarityClass = item.type === "evolution" ? "evolution" : (item.rarity || "common");
      el.className = `chest-item ${rarityClass}`;

      el.innerHTML = `
        <div class="chest-item-icon">${item.icon}</div>
        <div class="chest-item-name">${item.name}</div>
        ${item.type !== "gold" ? `<div class="chest-item-level">${item.currentLevel === 0 ? 'NEW!' : 'Level ' + (item.currentLevel + 1)}</div>` : ''}
        <div class="chest-item-desc">${item.description}</div>
      `;

      this.itemsContainer.appendChild(el);

      setTimeout(() => {
        el.classList.add("revealed");
        this.game.audioManager.playSound("xpPickup");
        
        if (rarityClass === "legendary" || rarityClass === "evolution") {
          this.game.pulseBloom(0.4, 2.0);
        }
      }, delay);

      delay += 500;
    });

    setTimeout(() => {
      this.doneBtn.className = "chest-done-btn btn-visible";
      this.game.audioManager.playSound("chestOpen");
    }, delay + 200);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    // Start fade-out
    this.overlay.classList.remove("active");
    this.overlay.classList.add("closing");

    this.game.ui.updateWeaponIcons();
    this.game.ui.updatePassiveItems();
    this.game.ui.updateScore();

    // Resume after the fade-out transition completes
    const fadeDuration = 350;
    setTimeout(() => {
      this.overlay.classList.remove("closing");

      if (this.game.upgradeQueue && this.game.upgradeQueue.length > 0) {
        setTimeout(() => {
          this.game.triggerNextUpgrade();
        }, 200);
      } else {
        this.game.isPaused = false;
      }
    }, fadeDuration);
  }
}
