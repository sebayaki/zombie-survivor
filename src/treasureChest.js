import * as THREE from "three";
import { findSpawnPosition, shuffleArray } from "./utils.js";

// Treasure chest system - spawns periodically and gives rewards
export class TreasureChestSystem {
  constructor(game) {
    this.game = game;

    // Active chests
    this.chests = [];

    // Spawn timer
    this.spawnTimer = 0;
    this.spawnInterval = 20; // Spawn every 20 seconds (more frequent!)

    // Cooldown between chest collections to prevent rapid-fire
    this.collectCooldown = 0;

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
    this.collectCooldown = 0;
  }

  update(delta) {
    // Spawn timer
    this.spawnTimer += delta;

    // Spawn chest periodically
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnChest();
    }

    // Tick collect cooldown
    if (this.collectCooldown > 0) {
      this.collectCooldown -= delta;
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

      // Check if player is close enough to collect (with cooldown)
      const dist = playerPos.distanceTo(chest.mesh.position);
      if (dist < 1.5 && this.collectCooldown <= 0) {
        this.collectChest(i);
        this.collectCooldown = 1.0; // 1 second between collections
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
    return (
      findSpawnPosition({
        minDist: 10,
        maxDist: this.game.arenaSize - 5,
        arenaSize: this.game.arenaSize,
        obstacles: this.game.obstacles,
        avoid: this.chests.map((c) => ({ position: c.position })),
        avoidDist: 5,
        origin: this.game.player.getPosition(),
        maxAttempts: 50,
      }) || new THREE.Vector3(0, 0, 10)
    );
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
    if (this.game.particleSystem) {
      const count = chest.rarity === "legendary" ? 30 : 15;
      this.game.particleSystem.spawn(chest.mesh.position, "treasure", {
        count,
      });
    }
  }

  giveRewards(rarity) {
    // XP gems based on rarity
    const xpAmounts = {
      common: [10, 10, 10, 15, 15],
      uncommon: [15, 15, 25, 25, 50],
      rare: [25, 25, 50, 50, 50],
      legendary: [50, 50, 50, 50, 100],
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

    // Heal player based on rarity
    const healAmounts = {
      common: 20,
      uncommon: 30,
      rare: 50,
      legendary: 100,
    };
    this.game.player.heal(healAmounts[rarity] || 20);

    // Gold based on rarity
    const goldAmounts = {
      common: 50,
      uncommon: 100,
      rare: 250,
      legendary: 1000,
    };

    let actualGold = 0;
    if (this.game.powerUpSystem) {
      actualGold = this.game.powerUpSystem.addGold(goldAmounts[rarity] || 50);
      this.game.gold += actualGold;
      this.game.ui.updateScore();
    }

    // Determine items count based on rarity
    let numItems = 1;
    if (rarity === "uncommon" && Math.random() < 0.3) numItems = 3;
    else if (rarity === "rare") numItems = Math.random() < 0.5 ? 3 : 5;
    else if (rarity === "legendary") numItems = 5;

    // Only upgrade items the player already owns (no forced new picks)
    this.game.evolutionSystem.checkEvolutions();
    const evolutionUpgrades = this.game.evolutionSystem.getPendingEvolutions();
    const weaponUpgrades = this.game.autoWeaponSystem.getAvailableUpgrades();
    const passiveUpgrades = this.game.passiveItemSystem.getAvailableUpgrades();

    let allUpgrades = [
      ...(evolutionUpgrades || []),
      ...(weaponUpgrades || []).filter((u) => u.currentLevel > 0),
      ...(passiveUpgrades || []).filter((u) => u.currentLevel > 0),
    ];

    // If no upgrades available, maybe just give gold? We always give gold anyway.
    let selectedItems = [];
    if (allUpgrades.length > 0) {
      // Pick random items
      // Evolutions have higher priority or are just added to the pool
      let shuffled = shuffleArray(allUpgrades);

      // Ensure we don't pick more than what's available
      numItems = Math.min(numItems, shuffled.length);

      for (let i = 0; i < numItems; i++) {
        const choice = shuffled[i];
        selectedItems.push(choice);

        // Apply the upgrade immediately!
        if (choice.type === "evolution") {
          this.game.evolutionSystem.evolve(choice.id);
        } else if (choice.type === "weapon") {
          this.game.autoWeaponSystem.addWeapon(choice.id);
        } else {
          this.game.passiveItemSystem.addItem(choice.id);
        }
      }
    } else {
        // Fallback for chest if all items maxed out
        selectedItems.push({
          type: "fallback",
          name: "Floor Chicken",
          rarity: "common",
          icon: '<i class="fa-solid fa-drumstick-bite"></i>',
          description: "Heal 50 HP",
          currentLevel: 0
        });
        this.game.player.heal(50);
    }

    // Show message
    const messages = {
      common: "Common Chest! (+20 HP)",
      uncommon: "Uncommon Chest! (+30 HP)",
      rare: "Rare Chest! (+50 HP)",
      legendary: "LEGENDARY CHEST! (+100 HP)",
    };
    this.game.ui.showMessage(messages[rarity] || "Treasure!");

    // Show chest UI only if the queue isn't already overloaded
    const queue = this.game.upgradeQueue || [];
    this.game.upgradeQueue = queue;
    const pendingChests = queue.filter((q) => q.type === "chest").length;

    if (pendingChests < 3) {
      setTimeout(() => {
        this.game.upgradeQueue.push({
          type: "chest",
          items: selectedItems,
          rarity: rarity,
          gold: actualGold,
        });
        this.game.triggerNextUpgrade();
      }, 500);
    }
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
