import * as THREE from "three";

// Weapon definitions
const WEAPONS = [
  {
    name: "BLASTER",
    damage: 15,
    fireRate: 0.3, // seconds between shots
    ammo: Infinity,
    maxAmmo: Infinity,
    projectileSpeed: 50,
    projectileColor: 0x00ff00,
    projectileSize: 0.15,
    spread: 0,
    projectilesPerShot: 1,
    explosive: false,
    sound: "shoot",
  },
  {
    name: "SHOTGUN",
    damage: 12,
    fireRate: 0.8,
    ammo: 30,
    maxAmmo: 30,
    projectileSpeed: 40,
    projectileColor: 0xffaa00,
    projectileSize: 0.1,
    spread: 0.15,
    projectilesPerShot: 8,
    explosive: false,
    sound: "shotgun",
  },
  {
    name: "MACHINE GUN",
    damage: 8,
    fireRate: 0.1,
    ammo: 100,
    maxAmmo: 100,
    projectileSpeed: 60,
    projectileColor: 0xffff00,
    projectileSize: 0.08,
    spread: 0.05,
    projectilesPerShot: 1,
    explosive: false,
    sound: "machinegun",
  },
  {
    name: "ROCKET LAUNCHER",
    damage: 50,
    fireRate: 1.2,
    ammo: 10,
    maxAmmo: 10,
    projectileSpeed: 25,
    projectileColor: 0xff4400,
    projectileSize: 0.3,
    spread: 0,
    projectilesPerShot: 1,
    explosive: true,
    explosionRadius: 5,
    sound: "rocket",
  },
  {
    name: "RAILGUN",
    damage: 100,
    fireRate: 1.5,
    ammo: 15,
    maxAmmo: 15,
    projectileSpeed: 100,
    projectileColor: 0x00ffff,
    projectileSize: 0.1,
    spread: 0,
    projectilesPerShot: 1,
    explosive: false,
    piercing: true,
    sound: "railgun",
  },
  {
    name: "BFG",
    damage: 200,
    fireRate: 2.0,
    ammo: 5,
    maxAmmo: 5,
    projectileSpeed: 20,
    projectileColor: 0x00ff00,
    projectileSize: 0.5,
    spread: 0,
    projectilesPerShot: 1,
    explosive: true,
    explosionRadius: 8,
    sound: "bfg",
  },
];

export class WeaponSystem {
  constructor(game) {
    this.game = game;

    // Current weapon
    this.currentWeaponIndex = 0;
    this.weapons = WEAPONS.map((w) => ({ ...w })); // Deep copy that preserves Infinity

    // Shooting state
    this.lastShotTime = 0;

    // Projectiles
    this.projectiles = [];

    // Projectile geometry (shared)
    this.projectileGeometry = new THREE.SphereGeometry(1, 8, 8);
  }

  reset() {
    // Reset all weapon ammo (deep copy that preserves Infinity)
    this.weapons = WEAPONS.map((w) => ({ ...w }));
    this.currentWeaponIndex = 0;

    // Clear projectiles
    this.projectiles.forEach((p) => {
      this.game.scene.remove(p.mesh);
    });
    this.projectiles = [];

    // Update UI
    this.game.ui.updateWeapon();
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      // Only switch if we have ammo (or it's the blaster)
      if (this.weapons[index].ammo > 0 || index === 0) {
        this.currentWeaponIndex = index;
        this.game.player.setWeapon(index);
        this.game.ui.updateWeapon();
        this.game.audioManager.playSound("weaponSwitch");
      }
    }
  }

  shoot() {
    const now = performance.now() / 1000;
    const weapon = this.getCurrentWeapon();

    // Check fire rate
    if (now - this.lastShotTime < weapon.fireRate) {
      return;
    }

    // Check ammo
    if (weapon.ammo <= 0) {
      // Switch to blaster if out of ammo
      this.switchWeapon(0);
      return;
    }

    this.lastShotTime = now;

    // Consume ammo
    if (weapon.ammo !== Infinity) {
      weapon.ammo--;
      this.game.ui.updateWeapon();
    }

    // Get player position and direction
    const playerPos = this.game.player.getPosition();
    const playerDir = this.game.player.getDirection();

    // Spawn position slightly in front of player
    const spawnPos = playerPos.clone();
    spawnPos.y += 1.2; // Gun height
    spawnPos.add(playerDir.clone().multiplyScalar(1));

    // Create projectiles
    for (let i = 0; i < weapon.projectilesPerShot; i++) {
      this.createProjectile(spawnPos.clone(), playerDir.clone(), weapon);
    }

    // Play sound
    this.game.audioManager.playSound(weapon.sound);

    // Muzzle flash effect
    this.createMuzzleFlash(spawnPos, weapon.projectileColor);

    // Trigger attack animation on player
    if (this.game.player && this.game.player.playAttackAnimation) {
      this.game.player.playAttackAnimation();
    }
  }

  createProjectile(position, direction, weapon) {
    // Apply spread
    if (weapon.spread > 0) {
      direction.x += (Math.random() - 0.5) * weapon.spread * 2;
      direction.y += (Math.random() - 0.5) * weapon.spread;
      direction.z += (Math.random() - 0.5) * weapon.spread * 2;
      direction.normalize();
    }

    // Create mesh with bright visible material
    const material = new THREE.MeshBasicMaterial({
      color: weapon.projectileColor,
    });

    const mesh = new THREE.Mesh(this.projectileGeometry, material);
    mesh.scale.setScalar(weapon.projectileSize);
    mesh.position.copy(position);

    this.game.scene.add(mesh);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: weapon.projectileColor,
      transparent: true,
      opacity: 0.4,
    });
    const glow = new THREE.Mesh(this.projectileGeometry, glowMaterial);
    glow.scale.setScalar(weapon.projectileSize * 1.3);
    mesh.add(glow);

    // Store projectile data
    this.projectiles.push({
      mesh,
      direction,
      speed: weapon.projectileSpeed,
      damage: weapon.damage,
      explosive: weapon.explosive,
      explosionRadius: weapon.explosionRadius || 0,
      piercing: weapon.piercing || false,
      lifetime: 3, // seconds
      hitZombies: new Set(), // Track which zombies were hit (for piercing)
    });
  }

  createMuzzleFlash(position, color) {
    const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
    });

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.game.scene.add(flash);

    // Animate flash
    let opacity = 1;
    const fadeFlash = () => {
      opacity -= 0.1;
      if (opacity <= 0) {
        this.game.scene.remove(flash);
      } else {
        flash.material.opacity = opacity;
        flash.scale.multiplyScalar(1.2);
        requestAnimationFrame(fadeFlash);
      }
    };
    requestAnimationFrame(fadeFlash);
  }

  update(delta) {
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      // Move projectile
      projectile.mesh.position.add(
        projectile.direction.clone().multiplyScalar(projectile.speed * delta),
      );

      // Decrease lifetime
      projectile.lifetime -= delta;

      // Check if out of bounds or expired
      const pos = projectile.mesh.position;
      const bounds = this.game.arenaSize;

      if (
        projectile.lifetime <= 0 ||
        Math.abs(pos.x) > bounds ||
        Math.abs(pos.z) > bounds ||
        pos.y < 0 ||
        pos.y > 10
      ) {
        this.removeProjectile(i);
      }
    }
  }

  removeProjectile(index, explode = false) {
    const projectile = this.projectiles[index];

    if (explode && projectile.explosive) {
      this.createExplosion(
        projectile.mesh.position,
        projectile.explosionRadius,
        projectile.damage,
      );
    }

    this.game.scene.remove(projectile.mesh);
    this.projectiles.splice(index, 1);
  }

  createExplosion(position, radius, damage) {
    this.game.autoWeaponSystem.createExplosion(position, radius, damage);
  }

  addAmmo(weaponIndex, amount) {
    if (weaponIndex >= 0 && weaponIndex < this.weapons.length) {
      const weapon = this.weapons[weaponIndex];
      if (weapon.maxAmmo !== Infinity) {
        weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + amount);

        if (weaponIndex === this.currentWeaponIndex) {
          this.game.ui.updateWeapon();
        }
      }
    }
  }

  getProjectiles() {
    return this.projectiles;
  }
}

export { WEAPONS };
