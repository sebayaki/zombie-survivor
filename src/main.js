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
    updateGoldDisplay();
    game.restart();
  });

  // Stage complete: next stage button
  document.getElementById("next-stage-button").addEventListener("click", () => {
    game.nextStage();
  });

  // Stage complete: shop button
  document.getElementById("stage-shop-button").addEventListener("click", () => {
    game.powerUpShopUI.show();
  });

  // Stage select arrows on start screen
  setupStageSelect();

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

  // Set version display on pause screen and start screen
  const versionDisplay = document.getElementById("version-display");
  if (versionDisplay) {
    versionDisplay.textContent = `v${version}`;
  }
  const startVersionDisplay = document.getElementById("start-version-display");
  if (startVersionDisplay) {
    startVersionDisplay.textContent = `v${version}`;
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
    game.handleKeyUp(e);
  });

  window.addEventListener("blur", () => {
    game.clearKeys();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      game.clearKeys();
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

// Stage selection on start screen
function setupStageSelect() {
  const numEl = document.getElementById("stage-select-num");
  const prevBtn = document.getElementById("stage-prev");
  const nextBtn = document.getElementById("stage-next");

  const updateDisplay = () => {
    const stage = game.stageSystem.currentStage;
    const max = game.stageSystem.data.maxStageReached;
    numEl.textContent = stage;
    prevBtn.style.visibility = stage > 1 ? "visible" : "hidden";
    nextBtn.style.visibility = stage < max ? "visible" : "hidden";
  };

  prevBtn.addEventListener("click", () => {
    if (game.stageSystem.currentStage > 1) {
      game.stageSystem.currentStage = game.stageSystem.currentStage - 1;
      updateDisplay();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (game.stageSystem.currentStage < game.stageSystem.data.maxStageReached) {
      game.stageSystem.currentStage = game.stageSystem.currentStage + 1;
      updateDisplay();
    }
  });

  updateDisplay();
}

// Update gold display on start screen
function updateGoldDisplay() {
  const goldElement = document.getElementById("total-gold");
  if (goldElement && game.powerUpSystem) {
    goldElement.textContent = game.powerUpSystem.currentGold.toLocaleString();
  }
  // Also update stage display
  const numEl = document.getElementById("stage-select-num");
  if (numEl && game.stageSystem) {
    numEl.textContent = game.stageSystem.currentStage;
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
