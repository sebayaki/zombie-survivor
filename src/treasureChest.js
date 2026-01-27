import * as THREE from "three";

// Treasure chest system - spawns periodically and gives rewards
export class TreasureChestSystem {
  constructor(game) {
    this.game = game;

    // Active chests
    this.chests = [];

    // Spawn timer
    this.spawnTimer = 0;
    this.spawnInterval = 20; // Spawn every 20 seconds (more frequent!)

    // Chest geometry
    this.createChestGeometry();
  }

  createChestGeometry() {
    // Simple chest made of boxes
    this.chestGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.5);
    this.lidGeometry = new THREE.BoxGeometry(0.85, 0.15, 0.55);
  }

  reset() {
    // Remove all chests
    this.chests.forEach((chest) => {
      this.game.scene.remove(chest.mesh);
    });
    this.chests = [];
    this.spawnTimer = 0;
  }

  update(delta) {
    // Spawn timer
    this.spawnTimer += delta;

    // Spawn chest periodically
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnChest();
    }

    // Update chests
    const playerPos = this.game.player.getPosition();
    const time = Date.now() * 0.001;

    for (let i = this.chests.length - 1; i >= 0; i--) {
      const chest = this.chests[i];

      // Bobbing animation
      chest.mesh.position.y = 0.3 + Math.sin(time * 2 + chest.bobOffset) * 0.1;

      // Glow pulsing
      if (chest.glow) {
        const pulse = 0.3 + Math.sin(time * 3) * 0.2;
        chest.glow.material.opacity = pulse;
      }

      // Check if player is close enough to collect
      const dist = playerPos.distanceTo(chest.mesh.position);
      if (dist < 1.5) {
        this.collectChest(i);
      }
    }
  }

  spawnChest() {
    const position = this.findSpawnPosition();

    // Create chest mesh group
    const mesh = new THREE.Group();

    // Body
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(this.chestGeometry, bodyMaterial);
    mesh.add(body);

    // Lid
    const lidMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const lid = new THREE.Mesh(this.lidGeometry, lidMaterial);
    lid.position.y = 0.3;
    mesh.add(lid);

    // Gold trim
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
    });

    const trimGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.52);
    const trim1 = new THREE.Mesh(trimGeometry, trimMaterial);
    trim1.position.x = -0.35;
    mesh.add(trim1);

    const trim2 = new THREE.Mesh(trimGeometry, trimMaterial);
    trim2.position.x = 0.35;
    mesh.add(trim2);

    // Lock
    const lockGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.1);
    const lock = new THREE.Mesh(lockGeometry, trimMaterial);
    lock.position.set(0, 0.15, 0.25);
    mesh.add(lock);

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    // Position
    mesh.position.copy(position);
    mesh.position.y = 0.3;

    this.game.scene.add(mesh);

    // Store chest
    this.chests.push({
      mesh,
      glow,
      position: position.clone(),
      bobOffset: Math.random() * Math.PI * 2,
      rarity: this.determineRarity(),
    });

    // Announce chest spawn
    this.game.ui.showMessage("Treasure Chest appeared!");
    this.game.audioManager.playSound("chestSpawn");
  }

  findSpawnPosition() {
    const bounds = this.game.arenaSize - 5;
    let position;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 50) {
      position = new THREE.Vector3(
        (Math.random() - 0.5) * bounds * 2,
        0,
        (Math.random() - 0.5) * bounds * 2,
      );

      valid = true;

      // Not too close to player
      const playerPos = this.game.player.getPosition();
      if (position.distanceTo(playerPos) < 10) {
        valid = false;
      }

      // Not inside obstacles
      for (const obstacle of this.game.obstacles) {
        const halfSize = Math.max(obstacle.size.x, obstacle.size.z) / 2 + 2;
        if (
          Math.abs(position.x - obstacle.position.x) < halfSize &&
          Math.abs(position.z - obstacle.position.z) < halfSize
        ) {
          valid = false;
          break;
        }
      }

      // Not too close to other chests
      for (const chest of this.chests) {
        if (position.distanceTo(chest.position) < 5) {
          valid = false;
          break;
        }
      }

      attempts++;
    }

    return position || new THREE.Vector3(0, 0, 10);
  }

  determineRarity() {
    const roll = Math.random();
    if (roll < 0.05) return "legendary"; // 5%
    if (roll < 0.2) return "rare"; // 15%
    if (roll < 0.5) return "uncommon"; // 30%
    return "common"; // 50%
  }

  collectChest(index) {
    const chest = this.chests[index];

    // Play animation
    this.playOpenAnimation(chest);

    // Give rewards based on rarity
    this.giveRewards(chest.rarity);

    // Remove chest
    this.game.scene.remove(chest.mesh);
    this.chests.splice(index, 1);

    // Play sound
    this.game.audioManager.playSound("chestOpen");
  }

  playOpenAnimation(chest) {
    const position = chest.mesh.position.clone();

    // Spawn particles
    const colors = {
      common: 0xaaaaaa,
      uncommon: 0x00ff00,
      rare: 0x0088ff,
      legendary: 0xffd700,
    };

    const color = colors[chest.rarity] || colors.common;
    const particleCount = chest.rarity === "legendary" ? 30 : 15;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y += 0.5;

      this.game.scene.add(particle);

      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 5,
      );

      // Animate
      let opacity = 1;
      const animate = () => {
        opacity -= 0.02;
        if (opacity <= 0) {
          this.game.scene.remove(particle);
          return;
        }

        particle.position.add(velocity.clone().multiplyScalar(0.016));
        velocity.y -= 10 * 0.016;
        particle.material.opacity = opacity;

        requestAnimationFrame(animate);
      };

      setTimeout(animate, i * 20);
    }
  }

  giveRewards(rarity) {
    // XP gems based on rarity
    const xpAmounts = {
      common: [3, 3, 3, 5, 5],
      uncommon: [5, 5, 10, 10, 25],
      rare: [10, 10, 25, 25, 25],
      legendary: [25, 25, 25, 25, 50],
    };

    const amounts = xpAmounts[rarity] || xpAmounts.common;
    const playerPos = this.game.player.getPosition();

    // Spawn XP gems in a burst
    for (let i = 0; i < amounts.length; i++) {
      const angle = (i / amounts.length) * Math.PI * 2;
      const dist = 1 + Math.random() * 2;
      const pos = playerPos.clone();
      pos.x += Math.sin(angle) * dist;
      pos.z += Math.cos(angle) * dist;

      setTimeout(() => {
        this.game.xpSystem.spawnGem(pos, amounts[i]);
      }, i * 50);
    }

    // Chance to give extra upgrade based on rarity
    const upgradeChance = {
      common: 0,
      uncommon: 0.1,
      rare: 0.3,
      legendary: 0.5,
    };

    if (Math.random() < upgradeChance[rarity]) {
      // Give a free level up!
      setTimeout(() => {
        this.game.ui.showMessage("Bonus Upgrade!");
        this.game.showUpgradeSelection();
      }, 500);
    }

    // Heal player based on rarity
    const healAmounts = {
      common: 10,
      uncommon: 20,
      rare: 30,
      legendary: 50,
    };

    this.game.player.heal(healAmounts[rarity] || 10);

    // Show message
    const messages = {
      common: "Common Chest!",
      uncommon: "Uncommon Chest!",
      rare: "Rare Chest!",
      legendary: "LEGENDARY CHEST!",
    };

    this.game.ui.showMessage(messages[rarity] || "Treasure!");
  }

  // Force spawn a chest (for boss kills, etc.)
  forceSpawn(position) {
    const spawn = position || this.findSpawnPosition();
    this.spawnChest();
  }

  getChests() {
    return this.chests;
  }
}
