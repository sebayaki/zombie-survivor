import * as THREE from "three";

const _tmpDir = new THREE.Vector3();
const _tmpAvoid = new THREE.Vector3();
const _tmpFinal = new THREE.Vector3();

function createBossTelegraph(zombie, game, radius, color) {
  const geo = new THREE.RingGeometry(0.2, radius, 32);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.copy(zombie.mesh.position);
  ring.position.y = 0.05;
  ring.rotation.x = -Math.PI / 2;
  game.scene.add(ring);

  let elapsed = 0;
  const duration = zombie.enraged ? 0.8 : 1.2;
  const animate = () => {
    elapsed += 0.016;
    const t = Math.min(elapsed / duration, 1);
    mat.opacity = Math.sin(t * Math.PI * 4) * 0.3 + 0.15;
    ring.scale.setScalar(0.3 + t * 0.7);
    ring.position.copy(zombie.mesh.position);
    ring.position.y = 0.05;

    if (t >= 1) {
      game.scene.remove(ring);
      geo.dispose();
      mat.dispose();
      return;
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

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
  const len = Math.sqrt(_tmpFinal.x * _tmpFinal.x + _tmpFinal.z * _tmpFinal.z);
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

    // Vampiric affix: heal on hit
    if (zombie.isElite && zombie.affixes && zombie.affixes.includes("vampiric")) {
      const healAmount = zombie.maxHealth * 0.05;
      zombie.health = Math.min(zombie.maxHealth, zombie.health + healAmount);
    }
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

  if (zombie.isBoss) {
    if (zombie.mesh.userData.healthBar) {
      const healthPercent = zombie.health / zombie.maxHealth;
      zombie.mesh.userData.healthBar.scale.x = healthPercent;
      zombie.mesh.userData.healthBar.position.x =
        (-zombie.mesh.userData.healthBarWidth * (1 - healthPercent)) / 2;

      if (game.ui) game.ui.updateBossHealthBar(healthPercent);

      if (zombie.mesh.userData.aura) {
        const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.2;
        zombie.mesh.userData.aura.scale.setScalar(pulse);
      }

      // Enrage at 30% HP
      const enraged = healthPercent < 0.3;
      if (enraged && !zombie.enraged) {
        zombie.enraged = true;
        zombie.speed *= 1.6;
        zombie.attackRate *= 0.5;
        game.audioManager.playSound("bossRoar");
        if (game.postProcessing) {
          game.postProcessing.shake(0.6, 0.4);
          game.postProcessing.pulseBloom(0.4, 2.5);
        }
        if (game.particleSystem && game.particleSystem.createShockwave) {
          game.particleSystem.createShockwave(
            zombie.mesh.position,
            5,
            0xff0000,
            0.8,
          );
        }
      }
      if (enraged && zombie.mesh.userData.aura) {
        zombie.mesh.userData.aura.material.color.setHex(0xff0000);
        zombie.mesh.userData.aura.material.opacity =
          0.25 + Math.sin(Date.now() * 0.01) * 0.1;
      }
    }

    zombie.bossTimer += delta;
    const attackCooldown = zombie.enraged ? 2.0 : 4.0;
    const attackCooldownRandom = zombie.enraged ? 1.0 : 3.0;

    if (zombie.bossState === "chase") {
      const moveDir = avoidObstacles(
        zombie.mesh.position,
        direction,
        game.obstacles,
      );
      zombie.mesh.position.x += moveDir.x * (zombie._effectiveSpeed || zombie.speed) * delta;
      zombie.mesh.position.z += moveDir.z * (zombie._effectiveSpeed || zombie.speed) * delta;

      if (distance < 2.0 * (zombie.typeDef?.scale || 1)) {
        attackPlayer(zombie, game);
      }

      if (
        zombie.bossTimer >
        attackCooldown + Math.random() * attackCooldownRandom
      ) {
        const rand = Math.random();
        const slamThreshold = zombie.enraged ? 0.35 : 0.25;
        const chargeThreshold = slamThreshold + (zombie.enraged ? 0.3 : 0.25);
        const burstThreshold = chargeThreshold + (zombie.enraged ? 0.25 : 0.25);

        if (rand < slamThreshold) {
          zombie.bossState = "slam_telegraph";
          zombie.bossTimer = 0;
          game.audioManager.playSound("bossCharge");
          createBossTelegraph(zombie, game, 6, 0xff0044);
        } else if (rand < chargeThreshold) {
          zombie.bossState = "charge_windup";
          zombie.bossTimer = 0;
          game.audioManager.playSound("bossCharge");
        } else if (rand < burstThreshold) {
          zombie.bossState = "projectile_burst";
          zombie.bossTimer = 0;
          game.audioManager.playSound("bossCharge");
        } else {
          zombie.bossState = "summon_adds";
          zombie.bossTimer = 0;
          game.audioManager.playSound("bossRoar");
        }
      }
    } else if (zombie.bossState === "slam_telegraph") {
      zombie.mesh.position.y = Math.abs(Math.sin(zombie.bossTimer * 6)) * 0.5;
      const windupDuration = zombie.enraged ? 0.8 : 1.2;
      if (zombie.bossTimer > windupDuration) {
        zombie.bossState = "slam";
        zombie.bossTimer = 0;
      }
    } else if (zombie.bossState === "slam") {
      zombie.mesh.position.y = Math.max(0, zombie.mesh.position.y - delta * 20);
      if (zombie.mesh.position.y <= 0) {
        zombie.mesh.position.y = 0;
        game.audioManager.playSound("bossSlam");
        if (game.postProcessing) game.postProcessing.shake(1.0, 0.4);
        if (game.particleSystem && game.particleSystem.createShockwave) {
          game.particleSystem.createShockwave(
            zombie.mesh.position,
            8,
            0xff0044,
            0.8,
          );
        }
        const slamRadius = zombie.enraged ? 7 : 5;
        if (distance < slamRadius) {
          game.player.takeDamage(zombie.damage * 2);
        }
        zombie.bossState = "chase";
        zombie.bossTimer = 0;
      }
    } else if (zombie.bossState === "charge_windup") {
      zombie.mesh.rotation.z += Math.sin(Date.now() * 0.05) * 0.12;
      zombie.mesh.rotation.x += Math.sin(Date.now() * 0.06) * 0.12;
      const windupDuration = zombie.enraged ? 0.7 : 1.2;
      if (zombie.bossTimer > windupDuration) {
        zombie.bossState = "charge";
        zombie.bossTimer = 0;
        zombie.chargeDirection = direction.clone();
        game.audioManager.playSound("bossRoar");
      }
    } else if (zombie.bossState === "charge") {
      const chargeSpeed = zombie.speed * (zombie.enraged ? 5 : 4);
      zombie.mesh.position.x += zombie.chargeDirection.x * chargeSpeed * delta;
      zombie.mesh.position.z += zombie.chargeDirection.z * chargeSpeed * delta;

      const chargeDist = zombie.mesh.position.distanceTo(playerPos);
      if (chargeDist < 3.0 && zombie.bossTimer < 0.8) {
        game.player.takeDamage(zombie.damage * 1.5);
        zombie.bossState = "chase";
        zombie.bossTimer = 0;
      }

      if (zombie.bossTimer > 1.0) {
        zombie.bossState = "chase";
        zombie.bossTimer = 0;
        game.audioManager.playSound("bossSlam");
        if (game.postProcessing) game.postProcessing.shake(0.6, 0.3);
        if (game.particleSystem && game.particleSystem.createShockwave) {
          game.particleSystem.createShockwave(
            zombie.mesh.position,
            5,
            0xff0000,
            0.6,
          );
        }
        if (chargeDist < 5) {
          game.player.takeDamage(zombie.damage);
        }
      }
    } else if (zombie.bossState === "projectile_burst") {
      zombie.mesh.rotation.y += delta * (zombie.enraged ? 20 : 12);
      zombie.mesh.position.y = Math.sin(zombie.bossTimer * 4) * 0.3;
      const burstTime = zombie.enraged ? 0.6 : 1.0;
      if (zombie.bossTimer > burstTime) {
        zombie.mesh.position.y = 0;
        const projCount = zombie.enraged ? 16 : 10;
        for (let i = 0; i < projCount; i++) {
          const angle = (i / projCount) * Math.PI * 2;
          const pDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
          fireProjectile(zombie, pDir, game, enemyProjectiles);
        }
        if (zombie.enraged) {
          setTimeout(() => {
            for (let i = 0; i < 12; i++) {
              const angle = ((i + 0.5) / 12) * Math.PI * 2;
              const pDir = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle),
              );
              fireProjectile(zombie, pDir, game, enemyProjectiles);
            }
          }, 400);
        }
        zombie.bossState = "chase";
        zombie.bossTimer = 0;
      }
    } else if (zombie.bossState === "summon_adds") {
      zombie.mesh.position.y = Math.sin(zombie.bossTimer * 10) * 0.4;
      zombie.mesh.rotation.y += delta * 8;
      const summonTime = zombie.enraged ? 0.8 : 1.5;
      if (zombie.bossTimer > summonTime) {
        zombie.mesh.position.y = 0;
        const addCount = zombie.enraged ? 5 : 3;
        const addTypes = zombie.enraged
          ? ["fast", "fast", "fast", "tank", "spitter"]
          : ["fast", "fast", "normal"];
        for (let i = 0; i < addCount; i++) {
          game.zombieManager.spawnZombie(
            zombie.speed * 2.5,
            zombie.maxHealth * 0.04,
            addTypes[i % addTypes.length],
          );
        }
        if (game.particleSystem && game.particleSystem.createShockwave) {
          game.particleSystem.createShockwave(
            zombie.mesh.position,
            4,
            0xaa2200,
            0.5,
          );
        }
        zombie.bossState = "chase";
        zombie.bossTimer = 0;
      }
    }

    // Boss-specific animation
    const time = Date.now() * 0.01;
    const bossLeg = time * zombie.speed * 0.3;
    if (zombie.mesh.userData.leftLeg)
      zombie.mesh.userData.leftLeg.rotation.x = Math.sin(bossLeg) * 0.3;
    if (zombie.mesh.userData.rightLeg)
      zombie.mesh.userData.rightLeg.rotation.x = -Math.sin(bossLeg + 0.5) * 0.3;

    if (zombie.bossState === "chase" || zombie.bossState === "slam_telegraph") {
      if (zombie.mesh.userData.leftArm)
        zombie.mesh.userData.leftArm.rotation.x =
          -Math.PI / 2.5 + Math.sin(bossLeg) * 0.2;
      if (zombie.mesh.userData.rightArm)
        zombie.mesh.userData.rightArm.rotation.x =
          -Math.PI / 3 - Math.sin(bossLeg) * 0.2;
    }

    zombie.mesh.rotation.z =
      Math.sin(time * 0.3 + zombie.mesh.userData.animPhase) * 0.04;
    return;
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
      zombie.mesh.position.x += moveDir.x * (zombie._effectiveSpeed || zombie.speed) * delta;
      zombie.mesh.position.z += moveDir.z * (zombie._effectiveSpeed || zombie.speed) * delta;
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
    zombie.mesh.position.x += moveDir.x * (zombie._effectiveSpeed || zombie.speed) * delta;
    zombie.mesh.position.z += moveDir.z * (zombie._effectiveSpeed || zombie.speed) * delta;
  }

  // Animation — zombie-style: limping, staggering, asymmetric
  const time = Date.now() * 0.01;
  const speedAnim = zombie.speed * 0.5;
  const ud = zombie.mesh.userData;
  const limpL = ud.limpOffsetL || 0;
  const limpR = ud.limpOffsetR || 0;
  const phase = ud.animPhase || 0;

  if (zombie.state === "chase" || zombie.state === "ranged") {
    const legPhase = time * speedAnim;

    // Limping legs: one leg drags, uneven stride
    if (ud.leftLeg)
      ud.leftLeg.rotation.x = Math.sin(legPhase + limpL) * (0.35 + limpL * 0.3);
    if (ud.rightLeg)
      ud.rightLeg.rotation.x = -Math.sin(legPhase + 0.6 + limpR) * (0.3 + limpR * 0.4);

    // Arms: asymmetric swing — one reaches forward, one hangs
    if (ud.leftArm)
      ud.leftArm.rotation.x = -Math.PI / 2.2 + Math.sin(legPhase + 0.3) * 0.2;
    if (ud.rightArm)
      ud.rightArm.rotation.x = -Math.PI / 2.0 - Math.sin(legPhase * 0.7 + limpR) * 0.12;

    // Head bob (if head exists as first child)
    if (ud.body)
      ud.body.rotation.z = Math.sin(legPhase * 0.8 + phase) * 0.04;
  } else if (zombie.state === "attack") {
    // Frenzied clawing — desynchronized arms
    if (ud.leftArm)
      ud.leftArm.rotation.x = -Math.PI / 2 - Math.sin(time * 4 + phase) * 0.7;
    if (ud.rightArm)
      ud.rightArm.rotation.x = -Math.PI / 2 - Math.cos(time * 3.2 + limpR) * 0.65;
  }

  // Body sway — lurching, drunken movement
  const wobbleAmount = zombie.isBoss ? 0.03 : 0.15;
  zombie.mesh.rotation.z =
    Math.sin(time * speedAnim * 0.35 + phase) * wobbleAmount +
    Math.sin(time * speedAnim * 0.15 + limpL) * (wobbleAmount * 0.4);
  // Forward lean
  zombie.mesh.rotation.x =
    0.05 +
    Math.cos(time * speedAnim * 0.25 + limpR) * (wobbleAmount * 0.3);
}
