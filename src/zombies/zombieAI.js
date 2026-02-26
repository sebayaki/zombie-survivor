import * as THREE from "three";

const _tmpDir = new THREE.Vector3();
const _tmpAvoid = new THREE.Vector3();
const _tmpFinal = new THREE.Vector3();

let _telegraphGeoCache = null;
const _activeTelegraphs = [];

function createBossTelegraph(zombie, game, radius, color) {
  if (!_telegraphGeoCache) _telegraphGeoCache = {};
  const geoKey = radius.toFixed(1);
  if (!_telegraphGeoCache[geoKey]) {
    _telegraphGeoCache[geoKey] = new THREE.RingGeometry(0.2, radius, 32);
  }
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(_telegraphGeoCache[geoKey], mat);
  ring.position.copy(zombie.mesh.position);
  ring.position.y = 0.05;
  ring.rotation.x = -Math.PI / 2;
  game.scene.add(ring);

  _activeTelegraphs.push({
    ring, mat, zombie, game,
    elapsed: 0,
    duration: zombie.enraged ? 0.8 : 1.2,
  });
}

export function updateTelegraphs(delta) {
  for (let i = _activeTelegraphs.length - 1; i >= 0; i--) {
    const tg = _activeTelegraphs[i];
    tg.elapsed += delta;
    const t = Math.min(tg.elapsed / tg.duration, 1);
    tg.mat.opacity = Math.sin(t * Math.PI * 4) * 0.3 + 0.15;
    tg.ring.scale.setScalar(0.3 + t * 0.7);
    tg.ring.position.copy(tg.zombie.mesh.position);
    tg.ring.position.y = 0.05;

    if (t >= 1) {
      tg.game.scene.remove(tg.ring);
      tg.mat.dispose();
      _activeTelegraphs.splice(i, 1);
    }
  }
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

let _projCoreGeo, _projGlowGeo, _projTrailGeo, _projCoreMat, _projGlowMat, _projTrailMat;

function _ensureProjGeos() {
  if (_projCoreGeo) return;
  _projCoreGeo = new THREE.SphereGeometry(0.2, 8, 8);
  _projGlowGeo = new THREE.SphereGeometry(0.35, 8, 8);
  _projTrailGeo = new THREE.SphereGeometry(0.1, 4, 4);
  _projCoreMat = new THREE.MeshBasicMaterial({ color: 0x88ff88 });
  _projGlowMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.5 });
  _projTrailMat = new THREE.MeshBasicMaterial({ color: 0x66ff66, transparent: true, opacity: 0.6 });
}

export function fireProjectile(zombie, direction, game, enemyProjectiles) {
  _ensureProjGeos();
  const projectileGroup = new THREE.Group();

  projectileGroup.add(new THREE.Mesh(_projCoreGeo, _projCoreMat));
  projectileGroup.add(new THREE.Mesh(_projGlowGeo, _projGlowMat));

  for (let i = 0; i < 5; i++) {
    const trail = new THREE.Mesh(_projTrailGeo, _projTrailMat);
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

  // Animation — organic creature movement
  const time = Date.now() * 0.01;
  const speedAnim = zombie.speed * 0.5;
  const ud = zombie.mesh.userData;
  const limpL = ud.limpOffsetL || 0;
  const limpR = ud.limpOffsetR || 0;
  const phase = ud.animPhase || 0;
  const isFast = zombie.type === "fast";
  const isTank = zombie.type === "tank";
  const isExploder = zombie.type === "exploder";

  if (zombie.state === "chase" || zombie.state === "ranged") {
    const legPhase = time * speedAnim;
    const legFreq = isFast ? 1.4 : isTank ? 0.6 : 1.0;

    // Legs: asymmetric stride with secondary motion
    if (ud.leftLeg) {
      const mainSwing = Math.sin(legPhase * legFreq + limpL) * (0.4 + limpL * 0.3);
      const drag = Math.sin(legPhase * legFreq * 0.5 + limpL) * 0.08;
      ud.leftLeg.rotation.x = mainSwing + drag;
      ud.leftLeg.rotation.z = Math.sin(legPhase * 0.3 + phase) * 0.04;
    }
    if (ud.rightLeg) {
      const mainSwing = -Math.sin(legPhase * legFreq + 0.6 + limpR) * (0.35 + limpR * 0.4);
      const drag = -Math.sin(legPhase * legFreq * 0.5 + limpR + 0.3) * 0.06;
      ud.rightLeg.rotation.x = mainSwing + drag;
      ud.rightLeg.rotation.z = -Math.sin(legPhase * 0.3 + phase + 0.5) * 0.04;
    }

    // Arms: creature-like — reaching, grasping, swaying
    if (ud.leftArm) {
      const reach = isFast ? -Math.PI / 2.0 : -Math.PI / 2.2;
      const swing = Math.sin(legPhase * legFreq + 0.3) * (isFast ? 0.35 : 0.22);
      const twitch = Math.sin(time * 2.5 + phase) * 0.05;
      ud.leftArm.rotation.x = reach + swing + twitch;
      ud.leftArm.rotation.z = 0.1 + Math.sin(legPhase * 0.4 + phase) * 0.06;
    }
    if (ud.rightArm) {
      const reach = isFast ? -Math.PI / 2.1 : -Math.PI / 2.0;
      const swing = -Math.sin(legPhase * legFreq * 0.8 + limpR) * (isFast ? 0.3 : 0.15);
      const twitch = Math.sin(time * 1.8 + limpR) * 0.04;
      ud.rightArm.rotation.x = reach + swing + twitch;
      ud.rightArm.rotation.z = -0.15 + Math.sin(legPhase * 0.35 + limpR) * 0.05;
    }

    // Body breathing/heaving — organic micro-motion
    if (ud.body) {
      ud.body.rotation.z = Math.sin(legPhase * 0.8 + phase) * 0.05;
      const breathe = 1.0 + Math.sin(time * 0.8 + phase) * (isExploder ? 0.03 : 0.015);
      ud.body.scale.y = breathe;
    }
  } else if (zombie.state === "attack") {
    // Frenzied, erratic clawing
    const attackFreq = isFast ? 5.5 : 4.0;
    if (ud.leftArm) {
      ud.leftArm.rotation.x = -Math.PI / 2 - Math.sin(time * attackFreq + phase) * 0.8;
      ud.leftArm.rotation.z = Math.sin(time * 3 + phase) * 0.15;
    }
    if (ud.rightArm) {
      ud.rightArm.rotation.x = -Math.PI / 2 - Math.cos(time * (attackFreq - 0.8) + limpR) * 0.75;
      ud.rightArm.rotation.z = -Math.sin(time * 2.5 + limpR) * 0.12;
    }
    // Lunge forward during attack
    if (ud.body)
      ud.body.rotation.x = Math.sin(time * attackFreq * 0.5) * 0.08;
  }

  // Body sway — lurching, organic, creature-like
  const wobbleBase = isTank ? 0.06 : isExploder ? 0.08 : isFast ? 0.1 : 0.15;
  const wobbleAmount = zombie.isBoss ? 0.04 : wobbleBase;
  zombie.mesh.rotation.z =
    Math.sin(time * speedAnim * 0.35 + phase) * wobbleAmount +
    Math.sin(time * speedAnim * 0.15 + limpL) * (wobbleAmount * 0.5) +
    Math.sin(time * 0.7 + phase * 2) * (wobbleAmount * 0.2);
  // Forward lean with secondary heave
  const leanBase = isFast ? 0.1 : isTank ? 0.03 : 0.06;
  zombie.mesh.rotation.x =
    leanBase +
    Math.cos(time * speedAnim * 0.25 + limpR) * (wobbleAmount * 0.35) +
    Math.sin(time * 0.5 + phase) * 0.02;
  // Vertical bob — shuffling gait
  zombie.mesh.position.y =
    Math.abs(Math.sin(time * speedAnim * 0.7 + phase)) * (isTank ? 0.03 : isExploder ? 0.02 : 0.05);
}
