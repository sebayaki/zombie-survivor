import * as THREE from "three";

const _homingVec = new THREE.Vector3();
export function homingBehavior(proj, zombies, delta) {
  let nearestZ = null;
  let nearestDSq = Infinity;
  const px = proj.mesh.position.x;
  const pz = proj.mesh.position.z;
  for (let i = 0; i < zombies.length; i++) {
    const z = zombies[i];
    if (!z || !z.mesh) continue;
    const dx = z.mesh.position.x - px;
    const dz = z.mesh.position.z - pz;
    const dsq = dx * dx + dz * dz;
    if (dsq < nearestDSq) { nearestDSq = dsq; nearestZ = z; }
  }
  if (nearestZ) {
    _homingVec.x = nearestZ.mesh.position.x - px;
    _homingVec.y = 0;
    _homingVec.z = nearestZ.mesh.position.z - pz;
    _homingVec.normalize();
    proj.direction.lerp(_homingVec, proj.homingStrength * delta);
    proj.direction.normalize();
  }
}

export function orbitBehavior(proj, center, delta) {
  proj.angle += proj.orbitSpeed * delta;
  proj.mesh.position.x = center.x + Math.cos(proj.angle) * proj.orbitRadius;
  proj.mesh.position.z = center.z + Math.sin(proj.angle) * proj.orbitRadius;
}

export function wallBounceBehavior(proj, arenaSize) {
  if (Math.abs(proj.mesh.position.x) > arenaSize - 1) {
    proj.direction.x *= -1;
    proj.mesh.position.x = Math.sign(proj.mesh.position.x) * (arenaSize - 1);
  }
  if (Math.abs(proj.mesh.position.z) > arenaSize - 1) {
    proj.direction.z *= -1;
    proj.mesh.position.z = Math.sign(proj.mesh.position.z) * (arenaSize - 1);
  }
}

export function areaDamage(zombieManager, center, radiusSq, damage) {
  const zombies = zombieManager.getZombies();
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (!z || !z.mesh) continue;
    const zp = z.mesh.position;
    const dx = zp.x - center.x;
    const dz = zp.z - center.z;
    if (dx * dx + dz * dz < radiusSq) {
      zombieManager.damageZombie(z, damage);
    }
  }
}

const KNOCKBACK_SOFT_CAP = 1.5;

export function clampKnockback(force) {
  return KNOCKBACK_SOFT_CAP * (1 - Math.exp(-force / KNOCKBACK_SOFT_CAP));
}

const _knockbackVec = new THREE.Vector3();
export function knockback(zombie, sourcePos, force) {
  _knockbackVec.subVectors(zombie.mesh.position, sourcePos);
  _knockbackVec.y = 0;
  const len = _knockbackVec.length();
  if (len > 0.0001) {
    const effective = clampKnockback(force);
    _knockbackVec.multiplyScalar(effective / len);
    zombie.mesh.position.x += _knockbackVec.x;
    zombie.mesh.position.z += _knockbackVec.z;
  }
}

export function fadeTraverse(mesh, progress) {
  if (mesh.traverse) {
    mesh.traverse((child) => {
      if (child.isMesh && child.material && !Array.isArray(child.material) && child.material.transparent) {
        child.material.opacity = 0.8 * progress;
      }
    });
  } else if (mesh.material && !Array.isArray(mesh.material)) {
    mesh.material.opacity = 0.8 * progress;
  }
}

export function wingFlap(proj, delta) {
  proj.wingAngle += delta * 8;
  const flapAmount = Math.sin(proj.wingAngle) * 0.4;
  if (proj.leftWing) proj.leftWing.rotation.z = -0.3 + flapAmount;
  if (proj.rightWing) proj.rightWing.rotation.z = 0.3 - flapAmount;
}
