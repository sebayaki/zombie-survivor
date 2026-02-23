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
import { findSpawnPosition } from "./utils.js";

export class Game {
  constructor() {
    this.isPlaying = false;
    this.isPaused = false;

    // Game state
    this.score = 0;
    this.wave = 1;
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

    // Input state
    this.keys = {};
    this.mouseWorldPos = new THREE.Vector3(); // Mouse position in world space
    this.useMouseMovement = true; // Always track mouse for movement

    // Auto-aim settings (Vampire Survivors style) - fully automatic
    this.autoAim = true;
    this.autoFire = true;
    this.autoAimRange = 20; // Range to detect enemies

    // Arena settings
    this.arenaSize = 50; // Larger arena for VS style

    // Continuous spawning settings
    this.spawnTimer = 0;
    this.baseSpawnInterval = 1.4; // Slightly faster early spawns
    this.minSpawnInterval = 0.3; // Cap late-game spawn rate
    this.zombiesPerSpawn = 1; // Start with 1 zombie per spawn
  }

  async init() {
    // Create scene - NYC night atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a15); // Dark blue night sky
    this.scene.fog = new THREE.Fog(0x0a0a15, 40, 100); // Lighter fog, further distance

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

    // Store for later use
    this.isMobile = isMobile;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

    // Load player
    await this.player.init();

    // Start render loop
    this.renderer.setAnimationLoop(() => this.gameLoop());
  }

  setupLighting() {
    // Strong ambient light for good visibility (NYC street lighting)
    const ambient = new THREE.AmbientLight(0x8888aa, 2.5);
    this.scene.add(ambient);

    // Main directional light (moonlight/street light effect)
    const mainLight = new THREE.DirectionalLight(0xaaccff, 2.0);
    mainLight.position.set(0, 50, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -60;
    mainLight.shadow.camera.right = 60;
    mainLight.shadow.camera.top = 60;
    mainLight.shadow.camera.bottom = -60;
    this.scene.add(mainLight);

    // Secondary warm light (city glow)
    const warmLight = new THREE.DirectionalLight(0xffcc88, 1.0);
    warmLight.position.set(-20, 40, -20);
    this.scene.add(warmLight);

    // Player follow light (reduced intensity for less glare)
    this.playerLight = new THREE.PointLight(0xffffff, 25, 15);
    this.playerLight.position.set(0, 10, 0);
    this.scene.add(this.playerLight);
  }

  createArena() {
    // Ground - NYC asphalt street
    const groundGeometry = new THREE.PlaneGeometry(
      this.arenaSize * 2,
      this.arenaSize * 2,
      32,
      32,
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a, // Dark asphalt gray
      roughness: 0.95,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Street lines (yellow center line)
    this.createStreetMarkings();

    // Sidewalk borders
    this.createSidewalks();

    // Initialize obstacles array BEFORE creating decorations
    this.obstacles = [];

    // Create NYC decorative elements
    this.createNYCDecorations();
  }

  createStreetMarkings() {
    // Simplified street markings using fewer meshes
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Center yellow line (single long line instead of dashed)
    const centerLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, this.arenaSize * 1.8),
      lineMaterial,
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.02, 0);
    this.scene.add(centerLine);

    // Side lines
    for (const offset of [-10, 10]) {
      const sideLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, this.arenaSize * 1.8),
        whiteMaterial,
      );
      sideLine.rotation.x = -Math.PI / 2;
      sideLine.position.set(offset, 0.02, 0);
      this.scene.add(sideLine);
    }

    // Simplified crosswalks (just 2)
    for (const z of [-25, 25]) {
      const crosswalk = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 3),
        whiteMaterial,
      );
      crosswalk.rotation.x = -Math.PI / 2;
      crosswalk.position.set(0, 0.02, z);
      this.scene.add(crosswalk);
    }
  }

  createSidewalks() {
    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
    });

    // Create sidewalks along edges
    const sidewalkWidth = 5;
    const positions = [
      {
        x: -this.arenaSize + sidewalkWidth / 2,
        z: 0,
        width: sidewalkWidth,
        length: this.arenaSize * 2,
      },
      {
        x: this.arenaSize - sidewalkWidth / 2,
        z: 0,
        width: sidewalkWidth,
        length: this.arenaSize * 2,
      },
      {
        x: 0,
        z: -this.arenaSize + sidewalkWidth / 2,
        width: this.arenaSize * 2 - sidewalkWidth * 2,
        length: sidewalkWidth,
      },
      {
        x: 0,
        z: this.arenaSize - sidewalkWidth / 2,
        width: this.arenaSize * 2 - sidewalkWidth * 2,
        length: sidewalkWidth,
      },
    ];

    for (const pos of positions) {
      const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(pos.width, 0.15, pos.length),
        sidewalkMaterial,
      );
      sidewalk.position.set(pos.x, 0.075, pos.z);
      sidewalk.receiveShadow = true;
      this.scene.add(sidewalk);
    }
  }

  createNYCDecorations() {
    // Shared materials for performance
    this.buildingMaterials = [
      new THREE.MeshLambertMaterial({ color: 0x4a4a5a }),
      new THREE.MeshLambertMaterial({ color: 0x5a5a6a }),
      new THREE.MeshLambertMaterial({ color: 0x3a3a4a }),
    ];
    this.windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    this.windowOffMaterial = new THREE.MeshBasicMaterial({ color: 0x222233 });

    // Create buildings around the edges (reduced count)
    for (let i = 0; i < 25; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, z;
      const edgeOffset = this.arenaSize - 2;

      switch (side) {
        case 0:
          x = -edgeOffset;
          z = (Math.random() - 0.5) * this.arenaSize * 1.5;
          break;
        case 1:
          x = edgeOffset;
          z = (Math.random() - 0.5) * this.arenaSize * 1.5;
          break;
        case 2:
          x = (Math.random() - 0.5) * this.arenaSize * 1.5;
          z = -edgeOffset;
          break;
        case 3:
          x = (Math.random() - 0.5) * this.arenaSize * 1.5;
          z = edgeOffset;
          break;
      }

      const building = this.createBuilding();
      building.position.set(x, 0, z);
      this.scene.add(building);
    }

    // Cars (with overlap prevention)
    for (let i = 0; i < 8; i++) {
      const pos = this.findValidObstaclePosition(12, 37, 5);
      if (!pos) continue;

      const car = this.createCar();
      car.position.set(pos.x, 0, pos.z);
      car.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(car);

      this.obstacles.push({
        mesh: car,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        size: new THREE.Vector3(2, 1.5, 4),
        radius: 3, // Used for collision checking when placing
      });
    }

    // Street lamps (with overlap prevention)
    for (let i = 0; i < 10; i++) {
      const pos = this.findValidObstaclePosition(15, 45, 3);
      if (!pos) continue;

      const lamp = this.createStreetLamp();
      lamp.position.set(pos.x, 0, pos.z);
      this.scene.add(lamp);

      this.obstacles.push({
        mesh: lamp,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        size: new THREE.Vector3(0.5, 4, 0.5),
        radius: 1.5,
      });
    }

    // Small obstacles (with overlap prevention)
    for (let i = 0; i < 8; i++) {
      const pos = this.findValidObstaclePosition(10, 40, 2);
      if (!pos) continue;

      const obstacle =
        Math.random() > 0.5 ? this.createTrashCan() : this.createFireHydrant();
      obstacle.position.set(pos.x, 0, pos.z);
      this.scene.add(obstacle);

      this.obstacles.push({
        mesh: obstacle,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        size: new THREE.Vector3(0.6, 1, 0.6),
        radius: 1,
      });
    }
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

  createBuilding() {
    const group = new THREE.Group();
    const width = 4 + Math.random() * 4;
    const depth = 4 + Math.random() * 4;
    const height = 8 + Math.random() * 15;

    // Main building - simple box with Lambert material (faster than Standard)
    const material =
      this.buildingMaterials[
        Math.floor(Math.random() * this.buildingMaterials.length)
      ];
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material,
    );
    building.position.y = height / 2;
    group.add(building);

    // Simplified windows - just a few per building face
    const windowRows = Math.min(5, Math.floor(height / 3));
    for (let y = 0; y < windowRows; y++) {
      const yPos = 2 + y * 3;
      // Just 2-3 windows per row
      for (let wx = -1; wx <= 1; wx++) {
        const isLit = Math.random() > 0.3;
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 1.5),
          isLit ? this.windowMaterial : this.windowOffMaterial,
        );
        win.position.set(wx * 1.5, yPos, depth / 2 + 0.01);
        group.add(win);
      }
    }

    return group;
  }

  createCar() {
    const group = new THREE.Group();
    const carColors = [
      0xcc2222, 0x2222cc, 0x22cc22, 0xcccc22, 0x222222, 0xffffff,
    ];
    const color = carColors[Math.floor(Math.random() * carColors.length)];

    // Simplified car - just two boxes
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });

    // Lower body
    const lowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.5, 4),
      bodyMaterial,
    );
    lowerBody.position.y = 0.4;
    group.add(lowerBody);

    // Upper body (cabin)
    const upperBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 2),
      bodyMaterial,
    );
    upperBody.position.set(0, 0.9, -0.3);
    group.add(upperBody);

    // Simplified wheels - just 4 small boxes
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const wheelGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.5);
    for (const [x, z] of [
      [-0.9, 1.2],
      [0.9, 1.2],
      [-0.9, -1.2],
      [0.9, -1.2],
    ]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(x, 0.25, z);
      group.add(wheel);
    }

    // Headlights
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.15, 0.05),
      lightMaterial,
    );
    headlight.position.set(0, 0.45, 2);
    group.add(headlight);

    return group;
  }

  createStreetLamp() {
    const group = new THREE.Group();

    // Simplified lamp - pole + glowing bulb (no point light for performance)
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 4, 0.15),
      poleMaterial,
    );
    pole.position.y = 2;
    group.add(pole);

    // Arm
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 1.2),
      poleMaterial,
    );
    arm.position.set(0, 3.9, 0.5);
    group.add(arm);

    // Glowing bulb (no actual light - just emissive material)
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffeeaa }),
    );
    bulb.position.set(0, 3.7, 1.0);
    group.add(bulb);

    return group;
  }

  createTrashCan() {
    const canMaterial = new THREE.MeshLambertMaterial({ color: 0x228822 });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.3, 1, 8),
      canMaterial,
    );
    body.position.y = 0.5;
    return body;
  }

  createFireHydrant() {
    const hydrantMaterial = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.2, 0.7, 8),
      hydrantMaterial,
    );
    body.position.y = 0.35;
    return body;
  }

  start() {
    document.getElementById("start-screen").classList.add("hidden");

    // Reset game state
    this.score = 0;
    this.wave = 1;
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

    this.powerUpSystem.applyBonuses();
    this.autoWeaponSystem.addWeapon("magicWand");
    this.ui.updateAll();

    this.isPlaying = true;
    this.touchControls.show();
    this.audioManager.playMusic();
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

    document.getElementById("final-wave").textContent = this.wave;
    document.getElementById("final-score").textContent = this.score;
    document.getElementById("final-kills").textContent = this.kills;
    document.getElementById("final-gold").textContent = (this.gold || 0).toLocaleString();
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

    // Hide pause screen
    document.getElementById("pause-screen").classList.add("hidden");

    // Hide touch controls
    this.touchControls.hide();

    // Reset game state
    this.isPlaying = false;
    this.isPaused = false;

    // Stop music
    this.audioManager.stopMusic();

    // Show start screen
    document.getElementById("start-screen").classList.remove("hidden");
  }

  // VS-style continuous spawning
  updateSpawning(delta) {
    this.spawnTimer += delta;

    // Calculate current spawn rate based on game time
    const timeMinutes = this.gameTime / 60;

    // Spawn rate increases over time (gradual ramp)
    const spawnInterval = Math.max(
      this.minSpawnInterval,
      this.baseSpawnInterval - timeMinutes * 0.1,
    );

    // Number of zombies per spawn increases gradually
    this.zombiesPerSpawn = Math.floor(1 + timeMinutes * 0.7);

    // Zombie stats scale with time
    const zombieHealth = 25 + timeMinutes * 8;
    const zombieSpeed = 1.5 + timeMinutes * 0.08;

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;

      // Spawn zombies
      for (let i = 0; i < this.zombiesPerSpawn; i++) {
        this.zombieManager.spawnZombie(zombieSpeed, zombieHealth);
      }

      // Every minute, spawn a "wave" of extra zombies
      if (
        Math.floor(this.gameTime) % 60 === 0 &&
        Math.floor(this.gameTime) !== 0
      ) {
        this.wave = Math.floor(this.gameTime / 60) + 1;
        this.ui.announceWave(this.wave);

        // Spawn wave burst
        const waveBurst = 3 + this.wave * 2;
        for (let i = 0; i < waveBurst; i++) {
          setTimeout(() => {
            if (this.isPlaying) {
              this.zombieManager.spawnZombie(
                zombieSpeed * 1.2,
                zombieHealth * 1.5,
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
    if ((this.upgradeUI && this.upgradeUI.isOpen) || (this.chestUI && this.chestUI.isOpen)) return; // Wait for current to finish
    if (this.upgradeQueue && this.upgradeQueue.length > 0) {
       const nextUpgrade = this.upgradeQueue.shift();
       if (nextUpgrade.type === 'bonus') {
           this.showBonusUpgradeSelection();
       } else if (nextUpgrade.type === 'chest') {
           this.chestUI.show(nextUpgrade.items, nextUpgrade.rarity, nextUpgrade.gold);
       } else {
           this.showUpgradeSelection(nextUpgrade.level);
       }
    }
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
    // Apply growth stat
    const growthBonus = 1 + (this.playerStats.growth || 0) * 0.08;
    const xpAmount = Math.floor(baseXP * growthBonus);

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

      // Update auto weapons (VS style)
      this.autoWeaponSystem.update(delta);

      // Update XP system
      this.xpSystem.update(delta);

      // Update passive items (for HP recovery, etc.)
      this.passiveItemSystem.update(delta);

      // Update treasure chests
      this.treasureChestSystem.update(delta);

      // Update particle system
      this.particleSystem.update(delta);

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
    const zombies = this.zombieManager.getZombies();
    let nearest = null;
    let nearestDist = Infinity;

    for (const zombie of zombies) {
      const pos = zombie.mesh.position;
      const dx = pos.x - playerPos.x;
      const dz = pos.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist && dist <= this.autoAimRange) {
        nearestDist = dist;
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

  handleMouseMove(e) {
    // Convert mouse screen position to world position for player movement
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Create a ray from camera through mouse position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    // Find intersection with ground plane (y = 0)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);

    if (intersection) {
      this.mouseWorldPos.copy(intersection);
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
