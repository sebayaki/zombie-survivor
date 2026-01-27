import * as THREE from "three";

export class CollisionSystem {
  constructor(game) {
    this.game = game;

    // Collision radii
    this.playerRadius = 0.8;
    this.zombieRadius = 0.6;
    this.pickupRadius = 1.0;
    this.projectileRadius = 0.2;
  }

  update() {
    this.checkProjectileZombieCollisions();
    this.checkPlayerPickupCollisions();
  }

  checkProjectileZombieCollisions() {
    const projectiles = this.game.weaponSystem.getProjectiles();
    const zombies = this.game.zombieManager.getZombies();

    // Check each projectile against each zombie
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      const projectilePos = projectile.mesh.position;

      for (const zombie of zombies) {
        const zombiePos = zombie.mesh.position;

        // Calculate distance (using XZ plane + Y offset for body)
        const dx = projectilePos.x - zombiePos.x;
        const dy = projectilePos.y - (zombiePos.y + 1); // Zombie center is at y+1
        const dz = projectilePos.z - zombiePos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const hitRadius = this.zombieRadius + projectile.mesh.scale.x;

        if (distance < hitRadius) {
          // Skip if piercing and already hit this zombie
          if (projectile.piercing && projectile.hitZombies.has(zombie)) {
            continue;
          }

          // Hit!
          this.game.zombieManager.damageZombie(zombie, projectile.damage);

          if (projectile.piercing) {
            // Mark as hit but continue
            projectile.hitZombies.add(zombie);
          } else {
            // Remove projectile (may explode)
            this.game.weaponSystem.removeProjectile(i, projectile.explosive);
            break;
          }
        }
      }
    }
  }

  checkPlayerPickupCollisions() {
    const playerPos = this.game.player.getPosition();
    const pickups = this.game.pickupManager.getPickups();

    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      const pickupPos = pickup.mesh.position;

      // Distance on XZ plane
      const dx = playerPos.x - pickupPos.x;
      const dz = playerPos.z - pickupPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < this.playerRadius + this.pickupRadius) {
        // Collect pickup
        this.game.pickupManager.collectPickup(i);
      }
    }
  }

  // Utility: Check if position collides with any obstacle
  checkObstacleCollision(position, radius) {
    for (const obstacle of this.game.obstacles) {
      const halfSize = obstacle.size.clone().multiplyScalar(0.5);
      halfSize.x += radius;
      halfSize.z += radius;

      if (
        Math.abs(position.x - obstacle.position.x) < halfSize.x &&
        Math.abs(position.z - obstacle.position.z) < halfSize.z
      ) {
        return true;
      }
    }

    return false;
  }

  // Utility: Check if position is in arena bounds
  checkArenaBounds(position, radius) {
    const bounds = this.game.arenaSize - radius;
    return Math.abs(position.x) <= bounds && Math.abs(position.z) <= bounds;
  }

  // Utility: Raycast from point in direction
  raycast(origin, direction, maxDistance = 100) {
    const raycaster = new THREE.Raycaster(
      origin,
      direction.normalize(),
      0,
      maxDistance,
    );

    // Collect meshes to test
    const meshes = [];

    // Add obstacle meshes
    this.game.obstacles.forEach((o) => meshes.push(o.mesh));

    // Add zombie meshes
    this.game.zombieManager.getZombies().forEach((z) => meshes.push(z.mesh));

    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      return {
        hit: true,
        point: intersects[0].point,
        distance: intersects[0].distance,
        object: intersects[0].object,
      };
    }

    return { hit: false };
  }
}
