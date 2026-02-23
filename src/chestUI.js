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
    this.overlay.className = "chest-overlay hidden";

    this.container = document.createElement("div");
    this.container.className = "chest-container";

    this.title = document.createElement("h2");
    this.title.className = "chest-title";
    this.title.textContent = "TREASURE FOUND!";
    this.container.appendChild(this.title);

    // Inner container for items
    this.itemsContainer = document.createElement("div");
    this.itemsContainer.className = "chest-items";
    this.container.appendChild(this.itemsContainer);

    // Button to close (initially hidden)
    this.doneBtn = document.createElement("button");
    this.doneBtn.className = "chest-done-btn hidden";
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
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 400;
        box-sizing: border-box;
      }
      .chest-overlay.hidden { display: none; }

      .chest-container {
        text-align: center;
        padding: 30px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 800px;
      }

      .chest-title {
        font-size: 50px;
        color: #ffcc00;
        text-shadow: 0 0 20px rgba(255, 204, 0, 0.8);
        margin-bottom: 40px;
        letter-spacing: 5px;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.5s, transform 0.5s;
      }
      .chest-title.visible {
        opacity: 1;
        transform: translateY(0);
        animation: chestTitlePulse 1s ease-in-out infinite alternate;
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
      }
      .chest-done-btn:hover {
        background: #00aaff;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,170,255,0.6);
      }
      .chest-done-btn:active {
        transform: translateY(2px);
      }
      .chest-done-btn.hidden { display: none; }
    `, "chest-ui-styles");
  }

  show(items, rarity, goldAmount) {
    this.game.isPaused = true;
    this.isOpen = true;
    this.overlay.classList.remove("hidden");
    
    this.title.classList.remove("visible");
    this.title.textContent = rarity === "legendary" ? "LEGENDARY TREASURE!" : "TREASURE FOUND!";
    this.title.style.color = rarity === "legendary" ? "#ff00ff" : "#ffcc00";

    this.itemsContainer.innerHTML = "";
    this.doneBtn.classList.add("hidden");

    // Start reveal sequence
    setTimeout(() => {
      this.title.classList.add("visible");
      this.game.audioManager.playSound("levelUp"); // Or a special chest sound if available
      this.revealItems(items, goldAmount);
    }, 500);
  }

  revealItems(items, goldAmount) {
    let delay = 0;
    
    // Add gold as the first item visually
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

    allItems.forEach((item, index) => {
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
        this.game.audioManager.playSound("xpPickup"); // Small pop sound for each item
        
        // Bloom effect for epic items
        if (rarityClass === "legendary" || rarityClass === "evolution") {
          this.game.pulseBloom(0.4, 2.0);
        }
      }, delay);

      delay += 600; // Time between each item reveal
    });

    // Show done button after all items are revealed
    setTimeout(() => {
      this.doneBtn.classList.remove("hidden");
      this.game.audioManager.playSound("chestOpen");
    }, delay + 200);
  }

  close() {
    this.overlay.classList.add("hidden");
    this.isOpen = false;
    
    // Update UI for the new items
    this.game.ui.updateWeaponIcons();
    this.game.ui.updatePassiveItems();
    this.game.ui.updateScore();

    // Check if there are queued upgrades
    if (this.game.upgradeQueue && this.game.upgradeQueue.length > 0) {
      setTimeout(() => {
        this.game.triggerNextUpgrade();
      }, 500);
    } else {
      this.game.isPaused = false;
    }
  }
}
