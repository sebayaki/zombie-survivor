import * as THREE from "three";

// XP thresholds for each level - faster early game for dynamic upgrades
const XP_THRESHOLDS = [
  0, // Level 1
  2, // Level 2 - very fast first upgrade
  4, // Level 3
  7, // Level 4
  10, // Level 5
  15, // Level 6
  20, // Level 7
  28, // Level 8
  38, // Level 9
  50, // Level 10
  60, // Level 11 (was 65)
  75, // Level 12 (was 82)
  90, // Level 13 (was 100)
  105, // Level 14 (was 120)
  120, // Level 15 (was 145)
  140, // Level 16 (was 175)
  160, // Level 17 (was 210)
  185, // Level 18 (was 250)
  210, // Level 19 (was 300)
  240, // Level 20 (was 360)
];

// Generate more levels (slower growth after 20 to keep leveling fun!)
// We pre-generate up to level 200 so there's no hard limit!
for (let i = XP_THRESHOLDS.length; i < 200; i++) {
  XP_THRESHOLDS.push(Math.floor(XP_THRESHOLDS[i - 1] * 1.06)); // Was 1.12
}

export class XPSystem {
  constructor(game) {
    this.game = game;

    // XP State
    this.currentXP = 0;
    this.level = 1;
    this.totalXPCollected = 0;

    // XP gems on the ground
    this.gems = [];

    // Gem geometry (shared)
    this.gemGeometry = new THREE.OctahedronGeometry(0.15, 0);

    // Gem materials by size
    this.gemMaterials = {
      small: new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.9,
      }),
      medium: new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.9,
      }),
      large: new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.9,
      }),
      huge: new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.9,
      }),
    };

    // Magnet radius for collecting gems
    this.collectRadius = 1.5;
    this.magnetRadius = 3;
    this.magnetSpeed = 15;
  }

  reset() {
    this.currentXP = 0;
    this.level = 1;
    this.totalXPCollected = 0;

    // Remove all gems
    this.gems.forEach((gem) => {
      this.game.scene.remove(gem.mesh);
    });
    this.gems = [];
  }

  // Get XP needed for next level
  getXPForNextLevel() {
    if (this.level >= XP_THRESHOLDS.length) {
      // If beyond the defined array, extrapolate based on previous scale
      const lastIndex = XP_THRESHOLDS.length - 1;
      const lastThreshold = XP_THRESHOLDS[lastIndex];
      const secondLast = XP_THRESHOLDS[lastIndex - 1];
      const ratio = lastThreshold / secondLast;
      
      return Math.floor(lastThreshold * Math.pow(ratio, this.level - lastIndex));
    }
    return XP_THRESHOLDS[this.level];
  }

  // Get current progress to next level (0-1)
  getLevelProgress() {
    const needed = this.getXPForNextLevel();
    return Math.min(1, this.currentXP / needed);
  }

  // Spawn XP gem at position
  spawnGem(position, xpValue) {
    // Determine gem size based on XP value
    let size, scale, material;
    if (xpValue >= 25) {
      size = "huge";
      scale = 0.6;
      material = this.gemMaterials.huge;
    } else if (xpValue >= 10) {
      size = "large";
      scale = 0.45;
      material = this.gemMaterials.large;
    } else if (xpValue >= 5) {
      size = "medium";
      scale = 0.38;
      material = this.gemMaterials.medium;
    } else {
      size = "small";
      scale = 0.3;
      material = this.gemMaterials.small;
    }

    // Create gem mesh - simplified, no glow for performance
    const mesh = new THREE.Mesh(this.gemGeometry, material);
    mesh.scale.setScalar(scale);
    mesh.position.copy(position);
    mesh.position.y = 0.3;

    this.game.scene.add(mesh);

    // Store gem data
    this.gems.push({
      mesh,
      xpValue,
      size,
      bobOffset: Math.random() * Math.PI * 2,
      beingMagneted: false,
    });
  }

  // Add XP and check for level up
  addXP(amount) {
    this.currentXP += amount;
    this.totalXPCollected += amount;

    // Check for level up
    while (this.currentXP >= this.getXPForNextLevel()) {
      this.currentXP -= this.getXPForNextLevel();
      this.levelUp();
    }

    // Update UI
    this.game.ui.updateXP();
    this.game.ui.updateLevel();
  }

  // Level up!
  levelUp() {
    this.level++;
    console.log(`Level Up! Now level ${this.level}`);

    // Play level up sound
    this.game.audioManager.playSound("levelUp");

    // Show level up UI
    this.game.ui.showLevelUp(this.level);

    // Queue upgrade selection
    this.game.upgradeQueue = this.game.upgradeQueue || [];
    this.game.upgradeQueue.push({ type: "levelUp", level: this.level });

    // Attempt to trigger (will only show if UI is not already open)
    setTimeout(() => {
      this.game.triggerNextUpgrade();
    }, 500);
  }

  update(delta) {
    const playerPos = this.game.player.getPosition();
    const time = Date.now() * 0.001;

    // Update all gems
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];

      // Bobbing and rotation animation
      gem.mesh.position.y = 0.3 + Math.sin(time * 3 + gem.bobOffset) * 0.1;
      gem.mesh.rotation.y += delta * 2;
      gem.mesh.rotation.x += delta;

      // Calculate distance to player
      const dx = playerPos.x - gem.mesh.position.x;
      const dz = playerPos.z - gem.mesh.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Magnet effect - pull gems toward player
      const effectiveMagnetRadius =
        this.magnetRadius + (this.game.playerStats?.magnet || 0);
      if (distance < effectiveMagnetRadius) {
        gem.beingMagneted = true;

        // Move toward player
        const speed = this.magnetSpeed * delta;
        const dirX = dx / distance;
        const dirZ = dz / distance;

        gem.mesh.position.x += dirX * speed;
        gem.mesh.position.z += dirZ * speed;
      }

      // Collect gem
      if (distance < this.collectRadius) {
        this.collectGem(i);
      }
    }
  }

  collectGem(index) {
    const gem = this.gems[index];

    // Add XP
    this.addXP(gem.xpValue);

    // Play pickup sound
    this.game.audioManager.playSound("xpPickup");

    // Create collect effect
    this.createCollectEffect(gem.mesh.position);

    // Remove gem
    this.game.scene.remove(gem.mesh);
    this.gems.splice(index, 1);
  }

  createCollectEffect(position) {
    if (this.game.particleSystem) {
      this.game.particleSystem.spawn(position, "xpCollect", { count: 5 });
    }
  }

  // Collect all gems on screen (vacuum effect)
  collectAllGems() {
    for (const gem of this.gems) {
      gem.beingMagneted = true;
    }
  }

  getGems() {
    return this.gems;
  }
}
