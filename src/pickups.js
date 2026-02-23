import * as THREE from "three";
import { findSpawnPosition } from "./utils.js";

// Pickup types
const PICKUP_TYPES = {
  HEALTH: {
    name: "Health Pack",
    color: 0x00ff00,
    emissive: 0x004400,
    effect: (game) => {
      game.player.heal(30);
    },
  },
  SHOTGUN_AMMO: {
    name: "Shotgun Ammo",
    color: 0xff8800,
    emissive: 0x442200,
    weaponIndex: 1,
    ammo: 15,
    effect: (game) => {
      game.weaponSystem.addAmmo(1, 15);
    },
  },
  MG_AMMO: {
    name: "MG Ammo",
    color: 0xffff00,
    emissive: 0x444400,
    weaponIndex: 2,
    ammo: 50,
    effect: (game) => {
      game.weaponSystem.addAmmo(2, 50);
    },
  },
  ROCKET_AMMO: {
    name: "Rockets",
    color: 0xff4400,
    emissive: 0x441100,
    weaponIndex: 3,
    ammo: 5,
    effect: (game) => {
      game.weaponSystem.addAmmo(3, 5);
    },
  },
  RAILGUN_AMMO: {
    name: "Railgun Cells",
    color: 0x00ffff,
    emissive: 0x004444,
    weaponIndex: 4,
    ammo: 8,
    effect: (game) => {
      game.weaponSystem.addAmmo(4, 8);
    },
  },
  BFG_AMMO: {
    name: "BFG Cells",
    color: 0x00ff00,
    emissive: 0x004400,
    weaponIndex: 5,
    ammo: 2,
    effect: (game) => {
      game.weaponSystem.addAmmo(5, 2);
    },
  },
};

export class PickupManager {
  constructor(game) {
    this.game = game;

    // Active pickups
    this.pickups = [];

    // Pickup mesh templates
    this.createMeshTemplates();
  }

  createMeshTemplates() {
    // Health pack shape (cross/plus)
    this.healthGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.6);

    // Ammo box shape
    this.ammoGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  }

  reset() {
    // Remove all pickups
    this.pickups.forEach((pickup) => {
      this.game.scene.remove(pickup.mesh);
    });
    this.pickups = [];
  }

  spawnWavePickups(wave) {
    // Spawn health packs
    const healthCount = Math.min(3, 1 + Math.floor(wave / 3));
    for (let i = 0; i < healthCount; i++) {
      this.spawnPickup("HEALTH");
    }

    // Spawn weapon ammo based on wave
    if (wave >= 2) {
      this.spawnPickup("SHOTGUN_AMMO");
      this.spawnPickup("MG_AMMO");
    }

    if (wave >= 4) {
      this.spawnPickup("ROCKET_AMMO");
    }

    if (wave >= 6) {
      this.spawnPickup("RAILGUN_AMMO");
    }

    if (wave >= 8 && Math.random() > 0.5) {
      this.spawnPickup("BFG_AMMO");
    }
  }

  spawnPickup(type) {
    const pickupDef = PICKUP_TYPES[type];
    if (!pickupDef) return;

    // Find valid spawn position
    const position = this.findSpawnPosition();

    // Create mesh
    const mesh = this.createPickupMesh(type, pickupDef);
    mesh.position.copy(position);
    mesh.position.y = 0.5;

    this.game.scene.add(mesh);

    // Store pickup
    this.pickups.push({
      mesh,
      type,
      def: pickupDef,
      bobOffset: Math.random() * Math.PI * 2, // Random starting phase
    });
  }

  createPickupMesh(type, def) {
    const group = new THREE.Group();

    // Base shape
    const geometry =
      type === "HEALTH" ? this.healthGeometry : this.ammoGeometry;
    const material = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.emissive,
      roughness: 0.3,
      metalness: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Add cross for health pack
    if (type === "HEALTH") {
      const crossMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x00ff00,
      });

      const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.25, 0.15),
        crossMaterial,
      );
      crossH.position.y = 0.05;
      group.add(crossH);

      const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.25, 0.5),
        crossMaterial,
      );
      crossV.position.y = 0.05;
      group.add(crossV);
    }

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.2,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Add point light
    const light = new THREE.PointLight(def.color, 5, 3);
    group.add(light);

    return group;
  }

  findSpawnPosition() {
    return findSpawnPosition({
      minDist: 5,
      maxDist: this.game.arenaSize - 3,
      arenaSize: this.game.arenaSize,
      obstacles: this.game.obstacles,
      avoid: this.pickups,
      avoidDist: 2,
      origin: this.game.player.getPosition(),
      maxAttempts: 50,
    }) || new THREE.Vector3(0, 0, 5);
  }

  update(delta) {
    const time = Date.now() * 0.001;

    // Animate pickups
    for (const pickup of this.pickups) {
      // Bobbing motion
      pickup.mesh.position.y =
        0.5 + Math.sin(time * 2 + pickup.bobOffset) * 0.15;

      // Rotation
      pickup.mesh.rotation.y += delta * 2;
    }
  }

  collectPickup(index) {
    const pickup = this.pickups[index];

    // Apply effect
    pickup.def.effect(this.game);

    // Play sound
    this.game.audioManager.playSound("pickup");

    // Create collect effect
    this.createCollectEffect(pickup.mesh.position, pickup.def.color);

    // Remove pickup
    this.game.scene.remove(pickup.mesh);
    this.pickups.splice(index, 1);
  }

  createCollectEffect(position, color) {
    if (this.game.particleSystem) {
      this.game.particleSystem.spawn(position, "heal", { count: 10 });
    }
  }

  getPickups() {
    return this.pickups;
  }
}
