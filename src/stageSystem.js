import * as THREE from "three";
import { STAGE_BOSS_VARIANTS } from "./zombies/zombieMeshFactory.js";

// Stage/Ascension System - Provides infinite progression through stage-based difficulty
// Each stage adds specific gameplay modifiers (not just stat multipliers)
// Save/load to localStorage for persistence between sessions

const STORAGE_KEY = "zombierun_stage";

export const STAGE_MODIFIERS = [
  // Stage 1: base game — no modifiers
  null,
  // Stage 2: Swarm
  {
    id: "swarm",
    name: "Swarm",
    icon: '<i class="fa-solid fa-bugs"></i>',
    description: "+50% spawn rate, enemies have 20% less HP",
    spawnRateMult: 1.5,
    enemyHealthMult: 0.8,
  },
  // Stage 3: Elites
  {
    id: "elites",
    name: "Elites",
    icon: '<i class="fa-solid fa-crown"></i>',
    description: "15% of enemies spawn as elites",
    eliteChance: 0.15,
  },
  // Stage 4: Haste
  {
    id: "haste",
    name: "Haste",
    icon: '<i class="fa-solid fa-forward-fast"></i>',
    description: "Enemies 30% faster, drop 20% more XP",
    enemySpeedMult: 1.3,
    xpMult: 1.2,
  },
  // Stage 5: Cursed Ground
  {
    id: "cursedGround",
    name: "Cursed Ground",
    icon: '<i class="fa-solid fa-fire"></i>',
    description: "Damage zones appear periodically",
    cursedGround: true,
  },
  // Stage 6: Necromancy
  {
    id: "necromancy",
    name: "Necromancy",
    icon: '<i class="fa-solid fa-skull"></i>',
    description: "Dead zombies have 20% chance to resurrect",
    resurrectChance: 0.2,
  },
  // Stage 7: Armored
  {
    id: "armored",
    name: "Armored",
    icon: '<i class="fa-solid fa-shield"></i>',
    description: "25% of enemies spawn with shields",
    shieldChance: 0.25,
  },
];

export class StageSystem {
  constructor(game) {
    this.game = game;
    this.data = this.load();
    this.stageCompleted = false;
    this.stageBossSpawned = false;
    this.stageBossDefeated = false;

    // Cursed ground zones (for stage 5+ modifier)
    this.cursedZones = [];
    this.cursedZoneTimer = 0;
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentStage: parsed.currentStage || 1,
          maxStageReached: parsed.maxStageReached || 1,
          lifetimeKills: parsed.lifetimeKills || 0,
          lifetimeStagesCleared: parsed.lifetimeStagesCleared || 0,
          unlockedArcana: parsed.unlockedArcana || [],
        };
      }
    } catch (e) {
      console.warn("Failed to load stage progress:", e);
    }
    return {
      currentStage: 1,
      maxStageReached: 1,
      lifetimeKills: 0,
      lifetimeStagesCleared: 0,
      unlockedArcana: [],
    };
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get currentStage() {
    return this.data.currentStage;
  }

  set currentStage(val) {
    this.data.currentStage = val;
    if (val > this.data.maxStageReached) {
      this.data.maxStageReached = val;
    }
    this.save();
  }

  // Get all active modifiers for the current stage (cumulative)
  getActiveModifiers() {
    const mods = [];
    const stage = this.data.currentStage;
    for (let i = 1; i < Math.min(stage, STAGE_MODIFIERS.length); i++) {
      if (STAGE_MODIFIERS[i]) mods.push(STAGE_MODIFIERS[i]);
    }
    // Beyond defined modifiers: intensify existing ones
    return mods;
  }

  // Composite multiplier getters used by game systems
  getSpawnRateMult() {
    let mult = 1;
    for (const mod of this.getActiveModifiers()) {
      if (mod.spawnRateMult) mult *= mod.spawnRateMult;
    }
    return mult;
  }

  getEnemyHealthMult() {
    const stage = this.data.currentStage;
    let mult = 1 + 0.3 * stage;
    for (const mod of this.getActiveModifiers()) {
      if (mod.enemyHealthMult) mult *= mod.enemyHealthMult;
    }
    return mult;
  }

  getEnemySpeedMult() {
    let mult = 1;
    for (const mod of this.getActiveModifiers()) {
      if (mod.enemySpeedMult) mult *= mod.enemySpeedMult;
    }
    return mult;
  }

  getEnemyDamageMult() {
    const stage = this.data.currentStage;
    return 1 + 0.15 * (stage - 1);
  }

  getXPMult() {
    let mult = 1;
    for (const mod of this.getActiveModifiers()) {
      if (mod.xpMult) mult *= mod.xpMult;
    }
    return mult;
  }

  getEliteChance() {
    let chance = 0;
    for (const mod of this.getActiveModifiers()) {
      if (mod.eliteChance) chance += mod.eliteChance;
    }
    // Intensify for stages beyond modifier pool
    const stage = this.data.currentStage;
    if (stage > STAGE_MODIFIERS.length) {
      chance += (stage - STAGE_MODIFIERS.length) * 0.03;
    }
    return Math.min(chance, 0.6);
  }

  getResurrectChance() {
    let chance = 0;
    for (const mod of this.getActiveModifiers()) {
      if (mod.resurrectChance) chance += mod.resurrectChance;
    }
    return Math.min(chance, 0.5);
  }

  getShieldChance() {
    let chance = 0;
    for (const mod of this.getActiveModifiers()) {
      if (mod.shieldChance) chance += mod.shieldChance;
    }
    return Math.min(chance, 0.5);
  }

  hasCursedGround() {
    return this.getActiveModifiers().some((m) => m.cursedGround);
  }

  // Reset per-run state
  resetRun() {
    this.stageCompleted = false;
    this.stageBossSpawned = false;
    this.stageBossDefeated = false;
    this.cursedZones = [];
    this.cursedZoneTimer = 0;
  }

  // Called every frame during gameplay
  update(delta) {
    if (this.stageCompleted) return;

    // Check if we should spawn the stage boss (wave 8 = gameTime >= 420s)
    const wave = Math.floor(this.game.gameTime / 60) + 1;
    if (wave >= 8 && !this.stageBossSpawned) {
      this.spawnStageBoss();
    }

    // Cursed ground logic
    if (this.hasCursedGround()) {
      this.updateCursedGround(delta);
    }
  }

  getBossVariant() {
    const idx = (this.data.currentStage - 1) % STAGE_BOSS_VARIANTS.length;
    return STAGE_BOSS_VARIANTS[idx];
  }

  spawnStageBoss() {
    if (this.stageBossSpawned) return;
    this.stageBossSpawned = true;

    const stage = this.data.currentStage;
    const timeMinutes = this.game.gameTime / 60;
    const baseHealth =
      99 +
      timeMinutes * 80 +
      timeMinutes * timeMinutes * 12 +
      Math.pow(timeMinutes, 3) * 0.8;
    const bossHealth = baseHealth * this.getEnemyHealthMult();
    const bossSpeed = (1.5 + timeMinutes * 0.15) * 0.35 * this.getEnemySpeedMult();
    const bossDamage = (10 + timeMinutes * 3 + timeMinutes * timeMinutes * 0.5) * 3 * this.getEnemyDamageMult();

    this.game.zombieManager.spawnZombie(bossSpeed, bossHealth, "boss", bossDamage);

    // Tag the boss as stage boss and apply variant visuals
    const zombies = this.game.zombieManager.getZombies();
    const boss = zombies[zombies.length - 1];
    if (boss && boss.isBoss) {
      boss.isStageBoss = true;

      // Apply variant appearance
      const variant = this.getBossVariant();
      if (variant) {
        // Update the boss UI name
        this.game.ui.hideBossHealthBar();
        this.game.ui.showBossHealthBar(`${variant.name} (Stage ${stage})`);

        // Re-color the glowing core and aura
        if (boss.mesh.userData.aura) {
          boss.mesh.userData.aura.material.color.setHex(variant.glowColor);
        }
        // Scale the boss up slightly each stage for visual intimidation
        const stageScaleBonus = 1 + Math.min(stage * 0.05, 0.5);
        boss.mesh.scale.multiplyScalar(stageScaleBonus);
      }
    }
  }

  // Called when the stage boss dies
  onStageBossDefeated() {
    if (this.stageCompleted) return;
    this.stageBossDefeated = true;
    this.stageCompleted = true;

    this.data.lifetimeStagesCleared++;
    this.data.lifetimeKills += this.game.kills;
    this.save();

    // Gold bonus for stage completion
    const stage = this.data.currentStage;
    const stageGold = 500 + stage * 250;
    const goldEarned = this.game.powerUpSystem.addGold(stageGold);
    this.game.gold += goldEarned;

    // Show stage complete screen after a short delay
    setTimeout(() => {
      this.game.showStageComplete(stageGold);
    }, 1500);
  }

  advanceStage() {
    this.data.currentStage++;
    this.save();
  }

  // Get gold bonus for completing a stage
  getStageGoldReward() {
    return 500 + this.data.currentStage * 250;
  }

  updateCursedGround(delta) {
    this.cursedZoneTimer += delta;

    // Spawn new zone every 8 seconds
    if (this.cursedZoneTimer >= 8) {
      this.cursedZoneTimer = 0;
      const playerPos = this.game.player.getPosition();
      // Spawn near the player but offset
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * 8;
      this.createCursedZone(
        playerPos.x + Math.cos(angle) * dist,
        playerPos.z + Math.sin(angle) * dist,
      );
    }

    // Update existing zones
    const playerPos = this.game.player.getPosition();
    for (let i = this.cursedZones.length - 1; i >= 0; i--) {
      const zone = this.cursedZones[i];
      zone.age += delta;

      if (zone.age >= zone.lifetime) {
        this.game.scene.remove(zone.mesh);
        zone.mesh.geometry.dispose();
        zone.mesh.material.dispose();
        this.cursedZones.splice(i, 1);
        continue;
      }

      // Damage player if inside
      const dx = playerPos.x - zone.x;
      const dz = playerPos.z - zone.z;
      if (dx * dx + dz * dz < zone.radius * zone.radius) {
        zone.damageTimer += delta;
        if (zone.damageTimer >= 0.5) {
          zone.damageTimer = 0;
          const dmg = 5 + this.data.currentStage * 2;
          this.game.player.takeDamage(dmg);
        }
      }

      // Fade out in last second
      const fadeStart = zone.lifetime - 1;
      if (zone.age > fadeStart) {
        zone.mesh.material.opacity = 0.35 * (1 - (zone.age - fadeStart));
      }

      // Pulse animation
      const pulse = 1 + Math.sin(zone.age * 3) * 0.05;
      zone.mesh.scale.setScalar(pulse);
    }
  }

  createCursedZone(x, z) {
    const radius = 2.5 + Math.random() * 1.5;
    const geo = new THREE.CircleGeometry(radius, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);
    this.game.scene.add(mesh);

    this.cursedZones.push({
      x,
      z,
      radius,
      mesh,
      age: 0,
      lifetime: 6 + Math.random() * 3,
      damageTimer: 0,
    });

    // Cap at 8 active zones
    if (this.cursedZones.length > 8) {
      const old = this.cursedZones.shift();
      this.game.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mesh.material.dispose();
    }
  }

  // Reset all stage progress (debug)
  resetAll() {
    this.data = {
      currentStage: 1,
      maxStageReached: 1,
      lifetimeKills: 0,
      lifetimeStagesCleared: 0,
      unlockedArcana: [],
    };
    this.save();
  }

  dispose() {
    for (const zone of this.cursedZones) {
      this.game.scene.remove(zone.mesh);
      zone.mesh.geometry.dispose();
      zone.mesh.material.dispose();
    }
    this.cursedZones = [];
  }
}
