import * as THREE from "three";
import { swapRemove } from "./utils.js";

const XP_THRESHOLDS = [
  0, 6, 14, 24, 36, 50, 68, 90, 115, 145,
  180, 220, 265, 315, 370, 435, 510, 595, 690, 800,
];

for (let i = XP_THRESHOLDS.length; i < 200; i++) {
  XP_THRESHOLDS.push(Math.floor(XP_THRESHOLDS[i - 1] * 1.12));
}

const GEM_LIFETIME = 120;
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();

const GEM_SIZES = [
  { key: "small",  threshold: 0,  scale: 0.3,  color: 0x00aaff },
  { key: "medium", threshold: 5,  scale: 0.38, color: 0x00ff00 },
  { key: "large",  threshold: 10, scale: 0.45, color: 0xffff00 },
  { key: "huge",   threshold: 25, scale: 0.6,  color: 0xff00ff },
];

function sizeKeyForXP(xpValue) {
  for (let i = GEM_SIZES.length - 1; i >= 0; i--) {
    if (xpValue >= GEM_SIZES[i].threshold) return GEM_SIZES[i].key;
  }
  return "small";
}

export class XPSystem {
  constructor(game) {
    this.game = game;

    this.currentXP = 0;
    this.level = 1;
    this.totalXPCollected = 0;

    this.gems = [];

    this.collectRadius = 1.5;
    this.magnetRadius = 3;
    this.magnetSpeed = 15;

    this._cachedNextLevelXP = null;

    // InstancedMesh per gem size – one draw call each
    const gemGeometry = new THREE.OctahedronGeometry(0.15, 0);
    this._instancedMeshes = {};
    this._sizeScales = {};

    for (const def of GEM_SIZES) {
      const material = new THREE.MeshBasicMaterial({
        color: def.color, transparent: true, opacity: 0.9,
      });
      const im = new THREE.InstancedMesh(gemGeometry, material, 4096);
      im.count = 0;
      im.frustumCulled = false;
      this._instancedMeshes[def.key] = im;
      this._sizeScales[def.key] = def.scale;
      game.scene.add(im);
    }
  }

  reset() {
    this.currentXP = 0;
    this.level = 1;
    this.totalXPCollected = 0;
    this._cachedNextLevelXP = null;
    this.gems = [];
    for (const im of Object.values(this._instancedMeshes)) {
      im.count = 0;
    }
  }

  getXPForNextLevel() {
    if (this._cachedNextLevelXP !== null) return this._cachedNextLevelXP;

    if (this.level >= XP_THRESHOLDS.length) {
      const lastIndex = XP_THRESHOLDS.length - 1;
      const lastThreshold = XP_THRESHOLDS[lastIndex];
      const secondLast = XP_THRESHOLDS[lastIndex - 1];
      const ratio = lastThreshold / secondLast;
      this._cachedNextLevelXP = Math.floor(
        lastThreshold * Math.pow(ratio, this.level - lastIndex),
      );
    } else {
      this._cachedNextLevelXP = XP_THRESHOLDS[this.level];
    }
    return this._cachedNextLevelXP;
  }

  getLevelProgress() {
    const needed = this.getXPForNextLevel();
    return Math.min(1, this.currentXP / needed);
  }

  spawnGem(position, xpValue) {
    const size = sizeKeyForXP(xpValue);
    this.gems.push({
      x: position.x,
      z: position.z,
      rotX: 0,
      rotY: Math.random() * Math.PI * 2,
      xpValue,
      size,
      bobOffset: Math.random() * Math.PI * 2,
      beingMagneted: false,
      spawnTime: this.game.gameTime,
    });
  }

  addXP(amount) {
    this.currentXP += amount;
    this.totalXPCollected += amount;

    while (this.currentXP >= this.getXPForNextLevel()) {
      this.currentXP -= this.getXPForNextLevel();
      this.levelUp();
    }

    this.game.ui.updateXP();
    this.game.ui.updateLevel();
  }

  levelUp() {
    this.level++;
    this._cachedNextLevelXP = null;
    console.log(`Level Up! Now level ${this.level}`);

    this.game.audioManager.playSound("levelUp");
    this.game.ui.showLevelUp(this.level);

    this.game.upgradeQueue = this.game.upgradeQueue || [];
    const pendingLevelUps = this.game.upgradeQueue.filter(
      (q) => q.type === "levelUp",
    ).length;
    if (pendingLevelUps < 3) {
      this.game.upgradeQueue.push({ type: "levelUp", level: this.level });
      setTimeout(() => {
        this.game.triggerNextUpgrade();
      }, 500);
    }
  }

  update(delta) {
    const playerPos = this.game.player.getPosition();
    const time = Date.now() * 0.001;

    const counts = {};
    for (const key of Object.keys(this._instancedMeshes)) {
      counts[key] = 0;
    }

    const gameTime = this.game.gameTime;

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];

      if (gameTime - gem.spawnTime >= GEM_LIFETIME) {
        swapRemove(this.gems, i);
        continue;
      }

      gem.rotY += delta * 2;
      gem.rotX += delta;

      const dx = playerPos.x - gem.x;
      const dz = playerPos.z - gem.z;
      const distSq = dx * dx + dz * dz;

      const collectRadiusSq = this.collectRadius * this.collectRadius;
      if (distSq < collectRadiusSq) {
        this.collectGem(i);
        continue;
      }

      const effectiveMagnetRadius =
        this.magnetRadius + (this.game.playerStats?.magnet || 0);
      const magnetRadiusSq = effectiveMagnetRadius * effectiveMagnetRadius;
      if (distSq < magnetRadiusSq) {
        gem.beingMagneted = true;
        const dist = Math.sqrt(distSq);
        const speed = this.magnetSpeed * delta;
        gem.x += (dx / dist) * speed;
        gem.z += (dz / dist) * speed;
      }

      const s = this._sizeScales[gem.size];
      const y = 0.3 + Math.sin(time * 3 + gem.bobOffset) * 0.1;
      _position.set(gem.x, y, gem.z);
      _euler.set(gem.rotX, gem.rotY, 0);
      _quaternion.setFromEuler(_euler);
      _scale.setScalar(s);
      _matrix.compose(_position, _quaternion, _scale);

      const idx = counts[gem.size]++;
      this._instancedMeshes[gem.size].setMatrixAt(idx, _matrix);
    }

    for (const [key, im] of Object.entries(this._instancedMeshes)) {
      im.count = counts[key];
      if (im.count > 0) {
        im.instanceMatrix.needsUpdate = true;
      }
    }
  }

  collectGem(index) {
    const gem = this.gems[index];
    this.addXP(gem.xpValue);
    this.game.audioManager.playSound("xpPickup");

    if (this.game.particleSystem) {
      _position.set(gem.x, 0.3, gem.z);
      this.game.particleSystem.spawn(_position, "xpCollect", { count: 5 });
    }

    swapRemove(this.gems, index);
  }

  collectAllGems() {
    for (const gem of this.gems) {
      gem.beingMagneted = true;
    }
  }

  getGems() {
    return this.gems;
  }
}
