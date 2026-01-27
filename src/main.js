import * as THREE from "three";
import { Game } from "./game.js";
import { version } from "../package.json";

// Global game instance
let game;

// Initialize the game
async function init() {
  console.log("Zombie Survivor - Initializing...");

  // Create game instance
  game = new Game();

  // Wait for game to initialize
  await game.init();

  // Set up event listeners
  setupEventListeners();

  console.log("Zombie Survivor - Ready!");
}

function setupEventListeners() {
  // Update gold display on start screen
  updateGoldDisplay();

  // Start button
  const startButton = document.getElementById("start-button");
  startButton.addEventListener("click", () => {
    game.start();
  });

  // Shop button
  const shopButton = document.getElementById("shop-button");
  shopButton.addEventListener("click", () => {
    game.powerUpShopUI.show();
  });

  // Restart button
  const restartButton = document.getElementById("restart-button");
  restartButton.addEventListener("click", () => {
    updateGoldDisplay(); // Update gold after game over
    game.restart();
  });

  // Resume button (pause menu)
  const resumeButton = document.getElementById("resume-button");
  resumeButton.addEventListener("click", () => {
    game.resume();
  });

  // Quit button (pause menu)
  const quitButton = document.getElementById("quit-button");
  quitButton.addEventListener("click", () => {
    game.quitToMenu();
  });

  // Sound toggle button
  const soundToggle = document.getElementById("sound-toggle");
  soundToggle.addEventListener("click", () => {
    const isOn = game.audioManager.toggleSound();
    soundToggle.textContent = isOn ? "ON" : "OFF";
    soundToggle.classList.toggle("on", isOn);
  });

  // Music toggle button
  const musicToggle = document.getElementById("music-toggle");
  musicToggle.addEventListener("click", () => {
    const isOn = game.audioManager.toggleMusic();
    musicToggle.textContent = isOn ? "ON" : "OFF";
    musicToggle.classList.toggle("on", isOn);
  });

  // Load saved settings
  loadSettings();

  // Set version display
  const versionDisplay = document.getElementById("version-display");
  if (versionDisplay) {
    versionDisplay.textContent = `v${version}`;
  }

  // Keyboard events
  document.addEventListener("keydown", (e) => {
    // ESC to pause/resume (only if upgrade UI is not open)
    if (e.code === "Escape") {
      // Don't pause if upgrade selection is open
      if (game.upgradeUI && game.upgradeUI.isOpen) {
        return;
      }

      if (game.isPlaying && !game.isPaused) {
        game.pause();
      } else if (game.isPaused) {
        game.resume();
      }
      return;
    }

    // Other keys only work when playing and not paused
    if (game.isPlaying && !game.isPaused) {
      game.handleKeyDown(e);
    }
  });

  document.addEventListener("keyup", (e) => {
    if (game.isPlaying && !game.isPaused) {
      game.handleKeyUp(e);
    }
  });

  // Mouse move - player follows mouse position
  document.addEventListener("mousemove", (e) => {
    if (game.isPlaying && !game.isPaused) {
      game.handleMouseMove(e);
    }
  });

  // No click handling needed - weapons auto-fire

  // Handle window resize
  window.addEventListener("resize", () => {
    game.onWindowResize();
  });
}

// Update gold display on start screen
function updateGoldDisplay() {
  const goldElement = document.getElementById("total-gold");
  if (goldElement && game.powerUpSystem) {
    goldElement.textContent = game.powerUpSystem.currentGold.toLocaleString();
  }
}

// Load saved settings from localStorage
function loadSettings() {
  const soundEnabled = localStorage.getItem("zombieSurvivor_sound") !== "false";
  const musicEnabled = localStorage.getItem("zombieSurvivor_music") !== "false";

  // Apply settings to audio manager
  game.audioManager.soundEnabled = soundEnabled;
  game.audioManager.musicEnabled = musicEnabled;

  // Update UI
  const soundToggle = document.getElementById("sound-toggle");
  const musicToggle = document.getElementById("music-toggle");

  soundToggle.textContent = soundEnabled ? "ON" : "OFF";
  soundToggle.classList.toggle("on", soundEnabled);

  musicToggle.textContent = musicEnabled ? "ON" : "OFF";
  musicToggle.classList.toggle("on", musicEnabled);
}

// Start initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
