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

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      const px = projectile.mesh.position.x;
      const py = projectile.mesh.position.y;
      const pz = projectile.mesh.position.z;
      const hitRadius = this.zombieRadius + projectile.mesh.scale.x;
      const hitRadiusSq = hitRadius * hitRadius;

      const nearby = this.game.zombieGrid
        ? this.game.zombieGrid.query(px, pz, hitRadius * 2)
        : zombies;
      for (const zombie of nearby) {
        const zp = zombie.mesh.position;
        const dx = px - zp.x;
        const dz = pz - zp.z;
        const flatDistSq = dx * dx + dz * dz;

        // Quick XZ rejection before computing full 3D distance
        if (flatDistSq > hitRadiusSq * 4) continue;

        const dy = py - (zp.y + 1);
        const distSq = flatDistSq + dy * dy;

        if (distSq < hitRadiusSq) {
          if (projectile.piercing && projectile.hitZombies.has(zombie)) {
            continue;
          }

          this.game.zombieManager.damageZombie(zombie, projectile.damage);

          if (projectile.piercing) {
            projectile.hitZombies.add(zombie);
          } else {
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
      const hx = obstacle.size.x * 0.5 + radius;
      const hz = obstacle.size.z * 0.5 + radius;

      if (
        Math.abs(position.x - obstacle.position.x) < hx &&
        Math.abs(position.z - obstacle.position.z) < hz
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
