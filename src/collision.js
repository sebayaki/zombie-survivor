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

      const raw = this.game.zombieGrid
        ? this.game.zombieGrid.query(px, pz, hitRadius * 2)
        : zombies;
      const nearby = this._buf || (this._buf = []);
      nearby.length = raw.length;
      for (let k = 0; k < raw.length; k++) nearby[k] = raw[k];

      for (const zombie of nearby) {
        if (!zombie || !zombie.mesh) continue;
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
    const collectRadiusSq = (this.playerRadius + this.pickupRadius) ** 2;

    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickupPos = pickups[i].mesh.position;
      const dx = playerPos.x - pickupPos.x;
      const dz = playerPos.z - pickupPos.z;

      if (dx * dx + dz * dz < collectRadiusSq) {
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
    if (!this._raycaster) {
      this._raycaster = new THREE.Raycaster();
      this._rayMeshes = [];
    }
    this._raycaster.set(origin, direction.normalize());
    this._raycaster.near = 0;
    this._raycaster.far = maxDistance;

    const meshes = this._rayMeshes;
    meshes.length = 0;
    const obstacles = this.game.obstacles;
    for (let i = 0; i < obstacles.length; i++) meshes.push(obstacles[i].mesh);
    const zombies = this.game.zombieManager.getZombies();
    for (let i = 0; i < zombies.length; i++) meshes.push(zombies[i].mesh);

    const intersects = this._raycaster.intersectObjects(meshes, true);

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
