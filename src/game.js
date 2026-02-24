import * as THREE from "three";
import { Player } from "./player.js";
import { ZombieManager } from "./zombie.js";
import { WeaponSystem } from "./weapons.js";
import { PickupManager } from "./pickups.js";
import { CollisionSystem } from "./collision.js";
import { AudioManager } from "./audio.js";
import { UI } from "./ui.js";
import { XPSystem } from "./xp.js";
import { AutoWeaponSystem } from "./autoWeapons.js";
import { PassiveItemSystem } from "./passiveItems.js";
import { UpgradeUI } from "./upgradeUI.js";
import { ChestUI } from "./chestUI.js";
import { TreasureChestSystem } from "./treasureChest.js";
import { EvolutionSystem } from "./evolutionSystem.js";
import { PostProcessingManager } from "./postProcessing.js";
import { ParticleSystem } from "./particleSystem.js";
import { PowerUpSystem } from "./powerUps.js";
import { PowerUpShopUI } from "./powerUpShopUI.js";
import { TouchControls } from "./touchControls.js";
import { StageSystem } from "./stageSystem.js";
import { ArcanaSystem } from "./arcanaSystem.js";
import { findSpawnPosition } from "./utils.js";
import { SpatialGrid } from "./spatialGrid.js";
import {
  setupEnhancedLighting,
  createEnhancedArena,
  updateAmbientParticles,
} from "./environment.js";

export class Game {
  constructor() {
    this.isPlaying = false;
    this.isPaused = false;

    // Game state
    this.score = 0;
    this.kills = 0;
    this.gold = 0;
    this.gameTime = 0; // Survival time in seconds

    // Player stats (modified by passive items)
    this.playerStats = {};

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // All game systems (initialized in init())
    this.player = null;
    this.zombieManager = null;
    this.weaponSystem = null;
    this.pickupManager = null;
    this.collisionSystem = null;
    this.audioManager = null;
    this.ui = null;
    this.xpSystem = null;
    this.autoWeaponSystem = null;
    this.passiveItemSystem = null;
    this.upgradeUI = null;
    this.treasureChestSystem = null;
    this.evolutionSystem = null;
    this.postProcessing = null;
    this.particleSystem = null;
    this.powerUpSystem = null;
    this.powerUpShopUI = null;
    this.touchControls = null;
    this.stageSystem = null;
    this.arcanaSystem = null;

    // Input state
    this.keys = {};
    this.mouseWorldPos = new THREE.Vector3(); // Mouse position in world space
    this.useMouseMovement = true; // Always track mouse for movement

    // Auto-aim settings (Vampire Survivors style) - fully automatic
    this.autoAim = true;
    this.autoFire = true;
    this.autoAimRange = 20; // Range to detect enemies

    // Spatial indexing for fast neighbor queries
    this.zombieGrid = new SpatialGrid(8);

    // Arena settings
    this.arenaSize = 50; // Larger arena for VS style

    // Continuous spawning settings
    this.spawnTimer = 0;
    this.baseSpawnInterval = 0.54; // 2x faster spawns
    this.minSpawnInterval = 0.12; // 2x faster cap
    this.zombiesPerSpawn = 1; // Start with 1 zombie per spawn
  }

  async init() {
    // Create scene - NYC night atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0808);
    this.scene.fog = new THREE.Fog(0x0a0808, 45, 90);

    // Create camera - top-down orthographic for VS-style view
    const viewSize = 20; // How much of the world to show
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect,
      viewSize * aspect,
      viewSize,
      -viewSize,
      0.1,
      1000,
    );
    this.camera.position.set(0, 50, 0.1); // Almost directly above
    this.camera.lookAt(0, 0, 0);
    this.viewSize = viewSize;

    // Create renderer
    // Detect mobile devices
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    // Cap pixel ratio for performance (mobile: 1.5, desktop: 2.0)
    // iPhone Pro has devicePixelRatio of 3.0 which is way too expensive
    const maxPixelRatio = isMobile ? 1.5 : 2.0;
    const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);

    this.renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.isMobile = isMobile;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isMobile
      ? THREE.PCFShadowMap
      : THREE.PCFSoftShadowMap;

    const container = document.getElementById("game-container");
    container.appendChild(this.renderer.domElement);

    // Set up lighting
    this.setupLighting();

    // Create arena (grass field style)
    this.createArena();

    // Initialize game systems
    this.ui = new UI(this);
    this.audioManager = new AudioManager();
    this.collisionSystem = new CollisionSystem(this);
    this.weaponSystem = new WeaponSystem(this);
    this.pickupManager = new PickupManager(this);
    this.zombieManager = new ZombieManager(this);
    this.player = new Player(this);

    // Initialize new VS-style systems
    this.xpSystem = new XPSystem(this);
    this.autoWeaponSystem = new AutoWeaponSystem(this);
    this.passiveItemSystem = new PassiveItemSystem(this);
    this.upgradeUI = new UpgradeUI(this);
    this.chestUI = new ChestUI(this);
    this.treasureChestSystem = new TreasureChestSystem(this);
    this.evolutionSystem = new EvolutionSystem(this);
    this.postProcessing = new PostProcessingManager(this);
    this.particleSystem = new ParticleSystem(this);
    this.powerUpSystem = new PowerUpSystem(this);
    this.powerUpShopUI = new PowerUpShopUI(this);
    this.touchControls = new TouchControls(this);
    this.stageSystem = new StageSystem(this);
    this.arcanaSystem = new ArcanaSystem(this);

    // Load player
    await this.player.init();

    // Start render loop
    this.renderer.setAnimationLoop(() => this.gameLoop());
  }

  setupLighting() {
    setupEnhancedLighting(this);
  }

  createArena() {
    createEnhancedArena(this);
  }

  findValidObstaclePosition(minDist, maxDist, minSeparation, maxAttempts = 20) {
    const pos = findSpawnPosition({
      minDist,
      maxDist,
      arenaSize: this.arenaSize,
      obstacles: this.obstacles,
      minSeparation,
      clearCenter: 5,
      maxAttempts,
    });
    return pos ? { x: pos.x, z: pos.z } : null;
  }

  start() {
    document.getElementById("start-screen").classList.add("hidden");

    // Reset game state
    this.score = 0;
    this.kills = 0;
    this.gold = 0;
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.playerStats = {};

    // Reset all resettable systems
    const resettableSystems = [
      this.player,
      this.zombieManager,
      this.pickupManager,
      this.weaponSystem,
      this.xpSystem,
      this.autoWeaponSystem,
      this.passiveItemSystem,
      this.treasureChestSystem,
      this.evolutionSystem,
      this.particleSystem,
    ];
    for (const system of resettableSystems) system.reset();

    this.stageSystem.resetRun();
    this.arcanaSystem.reset();
    this.powerUpSystem.applyBonuses();
    this.autoWeaponSystem.addWeapon("magicWand");
    this.ui.updateAll();

    this.isPlaying = true;
    this.touchControls.show();
    this.audioManager.playMusic();

    // Offer arcana selection if stage qualifies (every 3 stages, starting at 3)
    if (this.arcanaSystem.shouldOfferArcana()) {
      setTimeout(() => {
        if (this.isPlaying) {
          this.arcanaSystem.showSelection();
        }
      }, 500);
    }
  }

  restart() {
    // Hide game over screen
    document.getElementById("game-over-screen").classList.add("hidden");

    // Start fresh
    this.start();
  }

  gameOver() {
    this.isPlaying = false;
    this.isPaused = false;
    this.touchControls.hide();

    document.getElementById("final-time").textContent = this.ui.formatTime(this.gameTime);
    document.getElementById("final-score").textContent = this.score;
    document.getElementById("final-kills").textContent = this.kills;
    document.getElementById("final-gold").textContent = (
      this.gold || 0
    ).toLocaleString();
    const stageEl = document.getElementById("final-stage");
    if (stageEl) stageEl.textContent = this.stageSystem.currentStage;
    document.getElementById("game-over-screen").classList.remove("hidden");

    this.audioManager.stopMusic();
    this.audioManager.playSound("gameOver");
  }

  pause() {
    if (!this.isPlaying || this.isPaused) return;

    console.log("Game paused");
    this.isPaused = true;

    // Show pause screen
    document.getElementById("pause-screen").classList.remove("hidden");

    // Pause music
    this.audioManager.pauseMusic();
  }

  resume() {
    if (!this.isPaused) return;

    console.log("Game resumed");
    this.isPaused = false;

    // Hide pause screen
    document.getElementById("pause-screen").classList.add("hidden");

    // Resume music
    this.audioManager.resumeMusic();
  }

  quitToMenu() {
    console.log("Quit to menu");

    document.getElementById("pause-screen").classList.add("hidden");
    document.getElementById("stage-complete-screen").classList.add("hidden");
    this.touchControls.hide();
    this.isPlaying = false;
    this.isPaused = false;
    this.audioManager.stopMusic();
    document.getElementById("start-screen").classList.remove("hidden");
  }

  // VS-style continuous spawning (with stage modifiers applied)
  updateSpawning(delta) {
    if (this.stageSystem.stageCompleted) return;

    this.spawnTimer += delta;

    const timeMinutes = this.gameTime / 60;
    const stage = this.stageSystem;

    const baseInterval = Math.max(
      this.minSpawnInterval,
      this.baseSpawnInterval - timeMinutes * 0.1,
    );
    const spawnInterval = baseInterval / stage.getSpawnRateMult();

    this.zombiesPerSpawn = Math.floor(1 + timeMinutes * 0.5);

    const baseHealth =
      99 + timeMinutes * 80 + timeMinutes * timeMinutes * 12 + Math.pow(timeMinutes, 3) * 0.8;
    const zombieHealth = baseHealth * stage.getEnemyHealthMult();
    const arcanaSpeedMult = this.arcanaSystem ? (this.arcanaSystem.getActiveEffects().enemySpeedMult || 1) : 1;
    const zombieSpeed = (1.5 + timeMinutes * 0.15) * stage.getEnemySpeedMult() * arcanaSpeedMult;
    const zombieDamage =
      (10 + timeMinutes * 3 + timeMinutes * timeMinutes * 0.5) * stage.getEnemyDamageMult();

    const maxZombies = 500;
    const currentCount = this.zombieManager.getZombies().length;

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;

      const canSpawn = Math.max(0, maxZombies - currentCount);
      const toSpawn = Math.min(this.zombiesPerSpawn, canSpawn);
      for (let i = 0; i < toSpawn; i++) {
        this.zombieManager.spawnZombie(zombieSpeed, zombieHealth, null, zombieDamage);
      }

      if (
        Math.floor(this.gameTime) % 60 === 0 &&
        Math.floor(this.gameTime) !== 0
      ) {
        const minute = Math.floor(this.gameTime / 60);
        this.ui.announceMinute(minute);

        const waveBurst = Math.min(
          4 + Math.floor((minute + 1) * 2),
          maxZombies - currentCount,
        );
        for (let i = 0; i < waveBurst; i++) {
          setTimeout(() => {
            if (
              this.isPlaying &&
              this.zombieManager.getZombies().length < maxZombies
            ) {
              this.zombieManager.spawnZombie(
                zombieSpeed * 1.2,
                zombieHealth * 1.8,
                null,
                zombieDamage * 1.5,
              );
            }
          }, i * 100);
        }
      }
    }
  }

  // Show upgrade selection (called on level up)
  showUpgradeSelection(level = null) {
    this.isPaused = true;
    this.upgradeUI.show(level || this.xpSystem.level);
  }

  // Handle bonus upgrades (e.g., from chests) without changing the level
  showBonusUpgradeSelection() {
    this.isPaused = true;
    this.upgradeUI.show(this.xpSystem.level, true); // true = isBonus
  }

  // Safely trigger the next upgrade in the queue
  triggerNextUpgrade() {
    if (
      (this.upgradeUI && this.upgradeUI.isOpen) ||
      (this.chestUI && this.chestUI.isOpen)
    )
      return; // Wait for current to finish
    if (this.upgradeQueue && this.upgradeQueue.length > 0) {
      const nextUpgrade = this.upgradeQueue.shift();
      if (nextUpgrade.type === "bonus") {
        this.showBonusUpgradeSelection();
      } else if (nextUpgrade.type === "chest") {
        this.chestUI.show(
          nextUpgrade.items,
          nextUpgrade.rarity,
          nextUpgrade.gold,
        );
      } else {
        this.showUpgradeSelection(nextUpgrade.level);
      }
    }
  }

  onWaveComplete() {
    // Legacy stub — VS-style uses continuous spawning, not discrete waves
  }

  addScore(points) {
    this.score += points;

    // Add gold via PowerUp system (handles greed bonus)
    const goldGained = this.powerUpSystem.addGold(Math.floor(points * 0.1));
    this.gold += goldGained;

    this.ui.updateScore();
  }

  addKill() {
    this.kills++;
    this.ui.updateKills();
  }

  // Drop XP gem when zombie dies
  dropXPGem(position, baseXP = 1) {
    // Apply growth stat + stage XP multiplier
    const growthBonus = 1 + (this.playerStats.growth || 0) * 0.08;
    const stageXPMult = this.stageSystem ? this.stageSystem.getXPMult() : 1;
    const xpAmount = Math.floor(baseXP * growthBonus * stageXPMult);

    this.xpSystem.spawnGem(position, xpAmount);
  }

  // Screen shake effect
  screenShake(intensity = 0.5, duration = 0.2) {
    if (this.postProcessing) {
      this.postProcessing.shake(intensity, duration);
    }
  }

  // Damage flash effect
  damageFlash(intensity = 1.0) {
    if (this.postProcessing) {
      this.postProcessing.damageFlash(intensity);
    }
  }

  // Bloom pulse for special moments
  pulseBloom(duration = 0.3, maxStrength = 2.0) {
    if (this.postProcessing) {
      this.postProcessing.pulseBloom(duration, maxStrength);
    }
  }

  showStageComplete(bonusGold) {
    this.isPlaying = false;
    this.isPaused = false;
    this.touchControls.hide();

    const stage = this.stageSystem.currentStage;
    document.getElementById("stage-clear-stage").textContent = stage;
    document.getElementById("stage-clear-kills").textContent = this.kills;
    document.getElementById("stage-clear-gold").textContent = bonusGold.toLocaleString();
    document.getElementById("stage-clear-time").textContent = this.ui.formatTime(this.gameTime);
    document.getElementById("stage-complete-screen").classList.remove("hidden");

    this.audioManager.stopMusic();
    this.audioManager.playSound("evolution");
  }

  nextStage() {
    document.getElementById("stage-complete-screen").classList.add("hidden");
    this.stageSystem.advanceStage();
    this.start();
  }

  gameLoop() {
    let delta = this.clock.getDelta();

    // Apply time scale from post-processing (for slow-mo effects)
    if (this.postProcessing) {
      const timeScale = this.postProcessing.update(delta);
      delta *= timeScale;
    }

    if (this.isPlaying && !this.isPaused) {
      // Update game time
      this.gameTime += delta;
      this.ui.updateTimer();
      this.ui.updateBossStatus();

      // Auto-aim at nearest enemy (Vampire Survivors style)
      if (this.autoAim) {
        this.updateAutoAim();
      }

      // Update player
      this.player.update(delta);

      // Update camera to follow player
      this.updateCamera();

      // VS-style continuous spawning
      this.updateSpawning(delta);

      // Update zombies
      this.zombieManager.update(delta);

      // Rebuild spatial grid after zombie positions are finalized
      this.zombieGrid.rebuild(this.zombieManager.getZombies());

      // Update auto weapons (VS style)
      this.autoWeaponSystem.update(delta);

      if (this.postProcessing) {
        this.postProcessing.setActiveEffectCount(
          this.autoWeaponSystem.effects.length + this.autoWeaponSystem.projectiles.length
        );
      }

      // Update XP system
      this.xpSystem.update(delta);

      // Update passive items (for HP recovery, etc.)
      this.passiveItemSystem.update(delta);

      // Update stage system (boss spawning, cursed ground, etc.)
      this.stageSystem.update(delta);

      // Update treasure chests
      this.treasureChestSystem.update(delta);

      // Update particle system
      this.particleSystem.update(delta);

      // Update ambient environment particles
      updateAmbientParticles(this.ambientParticles, delta);

      // Update legacy weapons/projectiles (for compatibility)
      this.weaponSystem.update(delta);

      // Update pickups
      this.pickupManager.update(delta);

      // Check collisions
      this.collisionSystem.update();

      // Update UI periodically
      if (Math.floor(this.gameTime * 10) % 5 === 0) {
        this.ui.updateHealth();
      }
    }

    // Render with post-processing
    if (this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  findNearestZombie() {
    const playerPos = this.player.getPosition();
    const range = this.autoAimRange;
    const candidates = this.zombieGrid
      ? this.zombieGrid.query(playerPos.x, playerPos.z, range)
      : this.zombieManager.getZombies();

    let nearest = null;
    let nearestDistSq = range * range;

    for (const zombie of candidates) {
      const pos = zombie.mesh.position;
      const dx = pos.x - playerPos.x;
      const dz = pos.z - playerPos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = zombie;
      }
    }
    return nearest;
  }

  updateAutoAim() {
    const nearest = this.findNearestZombie();
    if (nearest) {
      const playerPos = this.player.getPosition();
      const dx = nearest.mesh.position.x - playerPos.x;
      const dz = nearest.mesh.position.z - playerPos.z;
      this.player.setAimTarget(Math.atan2(dx, dz));
    } else {
      this.player.clearAimTarget();
    }
  }

  hasEnemiesInRange() {
    return this.findNearestZombie() !== null;
  }

  updateCamera() {
    if (this.player && this.player.mesh) {
      const playerPos = this.player.mesh.position;

      // Top-down camera follows player directly
      const targetX = playerPos.x;
      const targetZ = playerPos.z;

      // Remove previous shake offset before calculating new position
      if (this.lastShakeOffset) {
        this.camera.position.x -= this.lastShakeOffset.x;
        this.camera.position.z -= this.lastShakeOffset.z;
        this.lastShakeOffset = null;
      }

      // Smoothly follow player position
      this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
      this.camera.position.z += (targetZ + 0.1 - this.camera.position.z) * 0.1;

      // Apply screen shake if active
      if (
        this.postProcessing &&
        this.postProcessing.shakeTimer < this.postProcessing.shakeDuration
      ) {
        const progress =
          this.postProcessing.shakeTimer / this.postProcessing.shakeDuration;
        const currentIntensity =
          this.postProcessing.shakeIntensity * (1 - progress);

        const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        const offsetZ = (Math.random() - 0.5) * 2 * currentIntensity;

        this.lastShakeOffset = { x: offsetX, z: offsetZ };
        this.camera.position.x += offsetX;
        this.camera.position.z += offsetZ;
      }

      // Update player light
      this.playerLight.position.copy(playerPos);
      this.playerLight.position.y += 5;
    }
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;

    // Weapon switching (legacy)
    if (e.code >= "Digit1" && e.code <= "Digit9") {
      const weaponIndex = parseInt(e.code.replace("Digit", "")) - 1;
      this.weaponSystem.switchWeapon(weaponIndex);
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  clearKeys() {
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }

  handleMouseMove(e) {
    // Convert mouse screen position to world position for player movement
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Reuse cached objects
    if (!this._raycaster) {
      this._raycaster = new THREE.Raycaster();
      this._mouseVec2 = new THREE.Vector2();
      this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      this._intersection = new THREE.Vector3();
    }

    this._mouseVec2.set(mouseX, mouseY);
    this._raycaster.setFromCamera(this._mouseVec2, this.camera);
    const hit = this._raycaster.ray.intersectPlane(
      this._groundPlane,
      this._intersection,
    );

    if (hit) {
      this.mouseWorldPos.copy(this._intersection);
    }
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = -this.viewSize * aspect;
    this.camera.right = this.viewSize * aspect;
    this.camera.top = this.viewSize;
    this.camera.bottom = -this.viewSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Update post-processing
    if (this.postProcessing) {
      this.postProcessing.onWindowResize();
    }
  }
}
