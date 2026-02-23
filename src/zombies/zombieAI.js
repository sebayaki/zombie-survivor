import * as THREE from "three";

const _tmpDir = new THREE.Vector3();
const _tmpAvoid = new THREE.Vector3();
const _tmpFinal = new THREE.Vector3();

export function avoidObstacles(zombiePos, desiredDirection, obstacles) {
  const pos = zombiePos;
  const avoidanceRadius = 2;
  _tmpAvoid.set(0, 0, 0);

  for (const obstacle of obstacles) {
    const ox = obstacle.position.x - pos.x;
    const oz = obstacle.position.z - pos.z;
    const dist = Math.sqrt(ox * ox + oz * oz);
    const minDist =
      Math.max(obstacle.size.x, obstacle.size.z) * 0.5 + avoidanceRadius;

    if (dist < minDist && dist > 0.0001) {
      const invDist = 1 / dist;
      const force = (minDist - dist) / minDist;
      _tmpAvoid.x -= ox * invDist * force;
      _tmpAvoid.z -= oz * invDist * force;
    }
  }

  _tmpFinal.x = desiredDirection.x + _tmpAvoid.x;
  _tmpFinal.y = 0;
  _tmpFinal.z = desiredDirection.z + _tmpAvoid.z;
  const len = Math.sqrt(
    _tmpFinal.x * _tmpFinal.x + _tmpFinal.z * _tmpFinal.z,
  );
  if (len > 0.0001) {
    _tmpFinal.x /= len;
    _tmpFinal.z /= len;
  }
  return _tmpFinal;
}

export function attackPlayer(zombie, game) {
  if (zombie.attackCooldown <= 0) {
    game.player.takeDamage(zombie.damage);
    zombie.attackCooldown = zombie.attackRate;
    game.audioManager.playSound("zombieAttack");
  }
}

export function fireProjectile(zombie, direction, game, enemyProjectiles) {
  const projectileGroup = new THREE.Group();

  const coreGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x88ff88 });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  projectileGroup.add(core);

  const glowGeometry = new THREE.SphereGeometry(0.35, 8, 8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x44ff44,
    transparent: true,
    opacity: 0.5,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  projectileGroup.add(glow);

  for (let i = 0; i < 5; i++) {
    const trailGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ff66,
      transparent: true,
      opacity: 0.6,
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.set(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      -0.2 - i * 0.15,
    );
    projectileGroup.add(trail);
  }

  projectileGroup.position.copy(zombie.mesh.position);
  projectileGroup.position.y = 1.5;

  game.scene.add(projectileGroup);

  enemyProjectiles.push({
    mesh: projectileGroup,
    direction: direction.clone(),
    speed: zombie.projectileSpeed,
    damage: zombie.damage,
    elapsed: 0,
    maxDuration: 5,
  });

  game.audioManager.playSound("shoot");
}

export function updateEnemyProjectiles(delta, game, enemyProjectiles) {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const proj = enemyProjectiles[i];
    proj.elapsed += delta;

    proj.mesh.position.x += proj.direction.x * proj.speed * delta;
    proj.mesh.position.z += proj.direction.z * proj.speed * delta;

    proj.mesh.rotation.y += delta * 5;

    const playerPos = game.player.getPosition();
    const dist = proj.mesh.position.distanceTo(playerPos);
    if (dist < 1) {
      game.player.takeDamage(proj.damage);
      game.scene.remove(proj.mesh);
      enemyProjectiles.splice(i, 1);
      continue;
    }

    if (
      proj.elapsed >= proj.maxDuration ||
      Math.abs(proj.mesh.position.x) > game.arenaSize ||
      Math.abs(proj.mesh.position.z) > game.arenaSize
    ) {
      game.scene.remove(proj.mesh);
      enemyProjectiles.splice(i, 1);
    }
  }
}

/**
 * Updates a single zombie's AI: movement, attack decisions, and animation.
 * @param {object} zombie
 * @param {THREE.Vector3} playerPos
 * @param {number} delta
 * @param {object} game
 * @param {Array} enemyProjectiles - mutable array of active projectiles
 */
export function updateZombieBehavior(
  zombie,
  playerPos,
  delta,
  game,
  enemyProjectiles,
) {
  if (zombie.attackCooldown > 0) {
    zombie.attackCooldown -= delta;
  }

  const direction = _tmpDir;
  direction.x = playerPos.x - zombie.mesh.position.x;
  direction.y = 0;
  direction.z = playerPos.z - zombie.mesh.position.z;
  const distance = Math.sqrt(
    direction.x * direction.x + direction.z * direction.z,
  );
  if (distance > 0.0001) {
    direction.x /= distance;
    direction.z /= distance;
  }

  zombie.mesh.rotation.y = Math.atan2(direction.x, direction.z);

  if (zombie.isBoss && zombie.mesh.userData.healthBar) {
    const healthPercent = zombie.health / zombie.maxHealth;
    zombie.mesh.userData.healthBar.scale.x = healthPercent;
    zombie.mesh.userData.healthBar.position.x =
      (-zombie.mesh.userData.healthBarWidth * (1 - healthPercent)) / 2;

    if (zombie.mesh.userData.aura) {
      const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.2;
      zombie.mesh.userData.aura.scale.setScalar(pulse);
    }
  }

  if (zombie.ranged && distance < zombie.attackRange && distance > 2) {
    zombie.state = "ranged";
    if (zombie.attackCooldown <= 0) {
      fireProjectile(zombie, direction, game, enemyProjectiles);
      zombie.attackCooldown = zombie.attackRate * 2;
    }
    if (distance > zombie.attackRange * 0.6) {
      const moveDir = avoidObstacles(
        zombie.mesh.position,
        direction,
        game.obstacles,
      );
      zombie.mesh.position.x += moveDir.x * zombie.speed * delta;
      zombie.mesh.position.z += moveDir.z * zombie.speed * delta;
    }
  } else if (distance < 1.5 * (zombie.typeDef?.scale || 1)) {
    zombie.state = "attack";
    attackPlayer(zombie, game);
  } else {
    zombie.state = "chase";
    const moveDir = avoidObstacles(
      zombie.mesh.position,
      direction,
      game.obstacles,
    );
    zombie.mesh.position.x += moveDir.x * zombie.speed * delta;
    zombie.mesh.position.z += moveDir.z * zombie.speed * delta;
  }

  // Animation
  const time = Date.now() * 0.01;
  const speedAnim = zombie.speed * 0.5;

  if (zombie.state === "chase" || zombie.state === "ranged") {
    const legPhase = time * speedAnim;
    if (zombie.mesh.userData.leftLeg)
      zombie.mesh.userData.leftLeg.rotation.x = Math.sin(legPhase) * 0.4;
    if (zombie.mesh.userData.rightLeg)
      zombie.mesh.userData.rightLeg.rotation.x =
        -Math.sin(legPhase + 0.5) * 0.4;

    if (zombie.mesh.userData.leftArm)
      zombie.mesh.userData.leftArm.rotation.x =
        -Math.PI / 2.2 + Math.sin(legPhase) * 0.15;
    if (zombie.mesh.userData.rightArm)
      zombie.mesh.userData.rightArm.rotation.x =
        -Math.PI / 1.8 - Math.sin(legPhase) * 0.15;
  } else if (zombie.state === "attack") {
    if (zombie.mesh.userData.leftArm)
      zombie.mesh.userData.leftArm.rotation.x =
        -Math.PI / 2 - Math.sin(time * 3) * 0.6;
    if (zombie.mesh.userData.rightArm)
      zombie.mesh.userData.rightArm.rotation.x =
        -Math.PI / 2 - Math.cos(time * 2.5) * 0.6;
  }

  const wobbleAmount = zombie.isBoss ? 0.04 : 0.12;
  zombie.mesh.rotation.z =
    Math.sin(time * speedAnim * 0.4 + zombie.mesh.userData.animPhase) *
    wobbleAmount;
  zombie.mesh.rotation.x =
    Math.cos(time * speedAnim * 0.3 + zombie.mesh.userData.limpOffsetL) *
    (wobbleAmount * 0.5);
}
