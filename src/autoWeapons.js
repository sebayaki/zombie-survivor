import * as THREE from "three";
import { EVOLUTION_RECIPES } from "./evolutionSystem.js";

// Weapon definitions - Vampire Survivors style
export const AUTO_WEAPONS = {
  // Starting weapon - simple projectile
  magicWand: {
    id: "magicWand",
    name: "Magic Wand",
    rarity: "common",
    description: "Fires at the nearest enemy",
    iconColor: "#00ccff",
    icon: `<i class="fa-solid fa-wand-magic-sparkles"></i>`,
    maxLevel: 8,
    baseStats: {
      damage: 10,
      cooldown: 0.5,
      projectileCount: 1,
      projectileSpeed: 35,
      pierce: 0,
      area: 1.0,
      duration: 1.5,
    },
    levelBonuses: [
      {},
      { damage: 3 },
      { projectileCount: 1, cooldown: -0.05 },
      { damage: 4 },
      { pierce: 1, cooldown: -0.05 },
      { damage: 5, projectileCount: 1 },
      { cooldown: -0.05 },
      { damage: 5, projectileCount: 1 },
    ],
  },

  // Whip - horizontal attack
  whip: {
    id: "whip",
    name: "Whip",
    rarity: "common",
    description: "Attacks horizontally, passes through enemies",
    iconColor: "#cc4444",
    icon: '<i class="fa-solid fa-bolt"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 15,
      cooldown: 1.5,
      projectileCount: 1,
      area: 1.0,
      duration: 0.3,
      knockback: 2,
    },
    levelBonuses: [
      {},
      { damage: 5, area: 0.1 },
      { projectileCount: 1 }, // Attacks behind too
      { damage: 5, area: 0.2 },
      { damage: 10 },
      { area: 0.3, knockback: 1 },
      { damage: 10 },
      { damage: 15, projectileCount: 1, area: 0.5 },
    ],
  },

  // Knife - throws in facing direction
  knife: {
    id: "knife",
    name: "Knife",
    rarity: "common",
    description: "Throws knives in facing direction",
    iconColor: "#88aaff",
    icon: '<i class="fa-solid fa-khanda"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 9,
      cooldown: 0.55,
      projectileCount: 1,
      projectileSpeed: 25,
      pierce: 0,
      area: 1.0,
      duration: 1.5,
    },
    levelBonuses: [
      {},
      { damage: 3, projectileSpeed: 3 },
      { projectileCount: 1 },
      { damage: 4 },
      { pierce: 1, projectileCount: 1 },
      { damage: 5, cooldown: -0.05 },
      { projectileCount: 1 },
      { damage: 5, projectileCount: 1 },
    ],
  },

  // Axe - thrown in arc
  axe: {
    id: "axe",
    name: "Axe",
    rarity: "uncommon",
    description: "High damage, passes through enemies",
    iconColor: "#ff4444",
    icon: '<i class="fa-solid fa-gavel"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 25,
      cooldown: 1.8,
      projectileCount: 1,
      projectileSpeed: 8,
      pierce: Infinity,
      area: 1.2,
      duration: 3.0,
    },
    levelBonuses: [
      {},
      { damage: 10 },
      { projectileCount: 1 },
      { damage: 10, area: 0.2 },
      { projectileCount: 1 },
      { damage: 15 },
      { projectileCount: 1, cooldown: -0.2 },
      { damage: 20, projectileCount: 1 },
    ],
  },

  // Garlic - damage aura
  garlic: {
    id: "garlic",
    name: "Garlic",
    rarity: "uncommon",
    description: "Damages nearby enemies and knocks them back",
    iconColor: "#88cc44",
    icon: '<i class="fa-solid fa-shield-cat"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 5,
      cooldown: 0.5,
      area: 2.0,
      knockback: 1.5,
      duration: 0.3,
    },
    levelBonuses: [
      {},
      { area: 0.3 },
      { damage: 2 },
      { area: 0.4, knockback: 0.5 },
      { damage: 3 },
      { area: 0.5 },
      { damage: 3, cooldown: -0.05 },
      { damage: 5, area: 1.0 },
    ],
  },

  // Cross/Boomerang - returns to player
  cross: {
    id: "cross",
    name: "Cross",
    rarity: "rare",
    description: "Boomerangs around, deals damage on the way back",
    iconColor: "#ffcc00",
    icon: '<i class="fa-solid fa-cross"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 15,
      cooldown: 1.2,
      projectileCount: 1,
      projectileSpeed: 10,
      pierce: Infinity,
      area: 1.0,
      duration: 3.0,
    },
    levelBonuses: [
      {},
      { damage: 5, projectileSpeed: 2 },
      { projectileCount: 1 },
      { damage: 5, area: 0.2 },
      { projectileCount: 1 },
      { damage: 10 },
      { cooldown: -0.1 },
      { projectileCount: 1, damage: 10 },
    ],
  },

  // Fire Wand - area explosion
  fireWand: {
    id: "fireWand",
    name: "Fire Wand",
    rarity: "uncommon",
    description: "Fires explosive projectiles",
    iconColor: "#ff6600",
    icon: '<i class="fa-solid fa-fire"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 20,
      cooldown: 1.5,
      projectileCount: 1,
      projectileSpeed: 12,
      area: 1.5,
      explosionRadius: 2,
      duration: 2.0,
    },
    levelBonuses: [
      {},
      { damage: 5 },
      { explosionRadius: 0.5 },
      { damage: 10, projectileCount: 1 },
      { explosionRadius: 0.5, cooldown: -0.1 },
      { damage: 10 },
      { projectileCount: 1 },
      { damage: 15, explosionRadius: 1.0 },
    ],
  },

  // Lightning Ring - random strikes
  lightning: {
    id: "lightning",
    name: "Lightning Ring",
    rarity: "rare",
    description: "Strikes random enemies in range",
    iconColor: "#ffdd00",
    icon: '<i class="fa-solid fa-bolt"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 15,
      cooldown: 1.0,
      projectileCount: 1,
      area: 5.0,
      duration: 0.1,
    },
    levelBonuses: [
      {},
      { damage: 5 },
      { area: 1.0, projectileCount: 1 },
      { damage: 5 },
      { area: 1.0, projectileCount: 1 },
      { damage: 8, cooldown: -0.1 },
      { projectileCount: 1 },
      { damage: 10, projectileCount: 1 },
    ],
  },

  // Runetracer - bouncing projectile
  runetracer: {
    id: "runetracer",
    name: "Runetracer",
    rarity: "rare",
    description: "Bouncing projectile that lasts a long time",
    iconColor: "#ff44ff",
    icon: '<i class="fa-solid fa-gem"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 10,
      cooldown: 3.0,
      projectileCount: 1,
      projectileSpeed: 8,
      pierce: Infinity,
      duration: 5.0,
      bounces: true,
    },
    levelBonuses: [
      {},
      { damage: 5, projectileSpeed: 1 },
      { duration: 1.0 },
      { damage: 5, projectileCount: 1 },
      { duration: 1.0 },
      { damage: 10 },
      { projectileCount: 1, cooldown: -0.3 },
      { damage: 10, duration: 2.0 },
    ],
  },

  // Holy Water - ground area damage
  holyWater: {
    id: "holyWater",
    name: "Holy Water",
    rarity: "uncommon",
    description: "Throws bottles that create damaging pools",
    iconColor: "#44aaff",
    icon: '<i class="fa-solid fa-droplet"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 8,
      cooldown: 2.0,
      projectileCount: 1,
      area: 2.0,
      duration: 3.0,
      tickRate: 0.3,
    },
    levelBonuses: [
      {},
      { damage: 2, area: 0.3 },
      { projectileCount: 1 },
      { damage: 3, duration: 0.5 },
      { area: 0.4 },
      { projectileCount: 1, damage: 3 },
      { duration: 1.0, cooldown: -0.2 },
      { damage: 5, projectileCount: 1, area: 0.5 },
    ],
  },

  // === NEW WEAPONS ===

  // Bone - bounces between enemies
  bone: {
    id: "bone",
    name: "Bone",
    rarity: "common",
    description: "Bounces between enemies, hitting multiple times",
    iconColor: "#ddccaa",
    icon: '<i class="fa-solid fa-bone"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 12,
      cooldown: 1.5,
      projectileCount: 1,
      projectileSpeed: 10,
      bounceCount: 3,
      area: 0.8,
      duration: 4.0,
    },
    levelBonuses: [
      {},
      { damage: 4, bounceCount: 1 },
      { projectileCount: 1 },
      { damage: 4, projectileSpeed: 2 },
      { bounceCount: 2 },
      { projectileCount: 1, damage: 4 },
      { cooldown: -0.2, bounceCount: 1 },
      { damage: 8, projectileCount: 1, bounceCount: 2 },
    ],
  },

  // Magic Missile - homing projectiles
  magicMissile: {
    id: "magicMissile",
    name: "Magic Missile",
    rarity: "common",
    description: "Slow but relentless homing missiles",
    iconColor: "#ff88ff",
    icon: '<i class="fa-solid fa-star"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 15,
      cooldown: 2.8,
      projectileCount: 1,
      projectileSpeed: 6,
      pierce: 0,
      area: 1.0,
      duration: 5.0,
      homing: true,
      homingStrength: 2,
    },
    levelBonuses: [
      {},
      { damage: 5, projectileCount: 1 },
      { homingStrength: 0.5 },
      { damage: 5, projectileCount: 1 },
      { projectileSpeed: 1, cooldown: -0.3 },
      { damage: 8, projectileCount: 1 },
      { cooldown: -0.3 },
      { damage: 10, projectileCount: 1 },
    ],
  },

  // Peachone - orbiting bird
  peachone: {
    id: "peachone",
    name: "Peachone",
    rarity: "rare",
    description: "A bird that orbits around you, dealing damage",
    iconColor: "#ffaadd",
    icon: '<i class="fa-solid fa-dove"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 10,
      cooldown: 0, // Always active
      projectileCount: 1,
      orbitRadius: 3,
      orbitSpeed: 2,
      area: 1.5,
    },
    levelBonuses: [
      {},
      { damage: 3, orbitRadius: 0.3 },
      { projectileCount: 1 },
      { damage: 4, orbitSpeed: 0.3 },
      { projectileCount: 1 },
      { damage: 5, area: 0.3 },
      { orbitRadius: 0.5, orbitSpeed: 0.3 },
      { damage: 8, projectileCount: 1 },
    ],
  },

  // Ebony Wings - dark orbiting bird (pairs with Peachone)
  ebonyWings: {
    id: "ebonyWings",
    name: "Ebony Wings",
    rarity: "rare",
    description: "A dark bird that orbits opposite to Peachone",
    iconColor: "#aa88ff",
    icon: '<i class="fa-solid fa-crow"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 10,
      cooldown: 0,
      projectileCount: 1,
      orbitRadius: 3,
      orbitSpeed: -2, // Opposite direction
      area: 1.5,
    },
    levelBonuses: [
      {},
      { damage: 3, orbitRadius: 0.3 },
      { projectileCount: 1 },
      { damage: 4, orbitSpeed: -0.3 },
      { projectileCount: 1 },
      { damage: 5, area: 0.3 },
      { orbitRadius: 0.5 },
      { damage: 8, projectileCount: 1 },
    ],
  },

  // Pentagram - screen clear at intervals
  pentagram: {
    id: "pentagram",
    name: "Pentagram",
    rarity: "legendary",
    description: "Periodically erases all enemies on screen",
    iconColor: "#ff4444",
    icon: '<i class="fa-solid fa-star-of-david"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 999,
      cooldown: 60, // Very long cooldown
      area: 50, // Full screen
      duration: 0.5,
    },
    levelBonuses: [
      {},
      { cooldown: -10 },
      { cooldown: -8 },
      { cooldown: -6 },
      { cooldown: -5 },
      { cooldown: -5 },
      { cooldown: -5 },
      { cooldown: -5 },
    ],
  },

  // Clock Lancet - freeze enemies
  clockLancet: {
    id: "clockLancet",
    name: "Clock Lancet",
    rarity: "rare",
    description: "Freezes enemies in place temporarily",
    iconColor: "#88ddff",
    icon: '<i class="fa-solid fa-clock"></i>',
    maxLevel: 8,
    baseStats: {
      damage: 1,
      cooldown: 2.0,
      area: 4.0,
      freezeDuration: 1.0,
      duration: 0.1,
    },
    levelBonuses: [
      {},
      { area: 0.5, freezeDuration: 0.2 },
      { area: 0.5 },
      { freezeDuration: 0.3 },
      { area: 1.0 },
      { freezeDuration: 0.3, cooldown: -0.2 },
      { area: 1.0 },
      { freezeDuration: 0.5, area: 2.0 },
    ],
  },

  // Laurel - temporary invincibility
  laurel: {
    id: "laurel",
    name: "Laurel",
    rarity: "rare",
    description: "Grants brief invincibility when taking fatal damage",
    iconColor: "#44cc44",
    icon: '<i class="fa-solid fa-leaf"></i>',
    maxLevel: 8,
    baseStats: {
      cooldown: 60, // Once per minute
      shieldDuration: 1.0,
    },
    levelBonuses: [
      {},
      { shieldDuration: 0.3 },
      { cooldown: -10 },
      { shieldDuration: 0.3 },
      { cooldown: -10 },
      { shieldDuration: 0.5 },
      { cooldown: -10 },
      { shieldDuration: 1.0, cooldown: -10 },
    ],
  },
};

export class AutoWeaponSystem {
  constructor(game) {
    this.game = game;

    // Player's current weapons (can have multiple)
    this.equippedWeapons = [];

    // Active projectiles/effects
    this.projectiles = [];
    this.effects = [];

    // Last fire times for cooldowns
    this.cooldowns = {};

    // Create detailed weapon geometries
    this.createWeaponGeometries();
  }

  createWeaponGeometries() {
    // Magic orb - glowing sphere with inner core
    this.orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);

    // Knife - elongated diamond blade
    this.knifeGeometry = new THREE.BufferGeometry();
    const knifeVertices = new Float32Array([
      // Blade tip
      0, 0, 0.5,
      // Blade sides
      -0.08, 0.02, 0, 0.08, 0.02, 0, 0.08, -0.02, 0, -0.08, -0.02, 0,
      // Handle end
      0, 0, -0.15,
    ]);
    const knifeIndices = [
      0,
      1,
      2,
      0,
      2,
      3,
      0,
      3,
      4,
      0,
      4,
      1, // Blade top
      5,
      2,
      1,
      5,
      3,
      2,
      5,
      4,
      3,
      5,
      1,
      4, // Handle
    ];
    this.knifeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(knifeVertices, 3),
    );
    this.knifeGeometry.setIndex(knifeIndices);
    this.knifeGeometry.computeVertexNormals();

    // Axe - detailed axe head with handle
    this.axeGroup = null; // Created per instance

    // Cross - proper cross shape
    this.crossGeometry = new THREE.BufferGeometry();
    const crossVertices = new Float32Array([
      // Vertical bar
      -0.05, 0, -0.25, 0.05, 0, -0.25, 0.05, 0, 0.25, -0.05, 0, 0.25,
      // Horizontal bar
      -0.2, 0, -0.05, 0.2, 0, -0.05, 0.2, 0, 0.1, -0.2, 0, 0.1,
    ]);
    const crossIndices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
    this.crossGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(crossVertices, 3),
    );
    this.crossGeometry.setIndex(crossIndices);
    this.crossGeometry.computeVertexNormals();

    // Fireball - sphere with spiky corona
    this.fireballGeometry = new THREE.IcosahedronGeometry(0.25, 1);

    // Runetracer - octahedron (diamond shape)
    this.runeGeometry = new THREE.OctahedronGeometry(0.25, 0);

    // Holy water bottle
    this.bottleGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8);
  }

  markShared(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) {
          if (!child.geometry.userData) child.geometry.userData = {};
          child.geometry.userData.shared = true;
        }
        if (child.material) {
          if (!child.material.userData) child.material.userData = {};
          child.material.userData.shared = true;
        }
      }
    });
    return obj;
  }

  // Create a detailed knife mesh - VIBRANT ENERGY SWORD
  createKnifeMesh() {
    if (this._knifeMeshCache) return this._knifeMeshCache.clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.15, 1.2, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.4;
    group.add(core);

    const aura = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.22, 1.4, 4),
      new THREE.MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.z = 0.45;
    group.add(aura);

    this._knifeMeshCache = this.markShared(group);
    return group.clone();
  }

  // Create evolved knife mesh
  createEvolvedKnifeMesh() {
    if (this._evolvedKnifeMeshCache) return this._evolvedKnifeMeshCache.clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.18, 1.4, 4),
      new THREE.MeshBasicMaterial({ color: 0x88ccff }),
    );
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.45;
    group.add(core);

    const aura = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.28, 1.6, 4),
      new THREE.MeshBasicMaterial({
        color: 0x0044ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.z = 0.5;
    group.add(aura);

    this._evolvedKnifeMeshCache = this.markShared(group);
    return group.clone();
  }

  createAxeMesh() {
    if (this._axeMeshCache) return this._axeMeshCache.clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    group.add(core);

    const bladeMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const bladeGeo = new THREE.PlaneGeometry(1.2, 0.5);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.x = Math.PI / 2;
      blade.position.x = Math.cos((i * Math.PI) / 2) * 0.6;
      blade.position.z = Math.sin((i * Math.PI) / 2) * 0.6;
      blade.rotation.y = (-i * Math.PI) / 2;
      group.add(blade);
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.2, 16),
      new THREE.MeshBasicMaterial({
        color: 0xff00aa,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    this._axeMeshCache = this.markShared(group);
    return group.clone();
  }

  createMagicOrbMesh(color) {
    if (!this._orbMeshCaches) this._orbMeshCaches = {};
    if (this._orbMeshCaches[color]) return this._orbMeshCaches[color].clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    core.rotation.x = Math.PI / 2;
    group.add(core);

    const glow1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.0, 6),
      new THREE.MeshBasicMaterial({
        color: color || 0x00ffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow1.rotation.x = Math.PI / 2;
    group.add(glow1);

    this._orbMeshCaches[color] = this.markShared(group);
    return group.clone();
  }

  createCrossMesh() {
    if (this._crossMeshCache) return this._crossMeshCache.clone();

    const group = new THREE.Group();

    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.4), coreMat));
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1.6), glowMat));

    const hCore = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.15), coreMat);
    hCore.position.z = -0.2;
    group.add(hCore);

    const hGlow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.35), glowMat);
    hGlow.position.z = -0.2;
    group.add(hGlow);

    this._crossMeshCache = this.markShared(group);
    return group.clone();
  }

  createFireballMesh() {
    if (this._fireballMeshCache) return this._fireballMeshCache.clone();

    const group = new THREE.Group();

    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      ),
    );

    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff8800,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );

    const trail = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 2.0, 8),
      new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    trail.rotation.x = Math.PI / 2;
    trail.position.z = 0.8;
    group.add(trail);

    this._fireballMeshCache = this.markShared(group);
    return group.clone();
  }

  createRunetracerMesh() {
    if (this._runeMeshCache) return this._runeMeshCache.clone();

    const group = new THREE.Group();

    group.add(
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      ),
    );

    group.add(
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.7, 0),
        new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );

    this._runeMeshCache = this.markShared(group);
    return group.clone();
  }

  createHolyWaterMesh() {
    if (this._bottleMeshCache) return this._bottleMeshCache.clone();

    const group = new THREE.Group();

    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      ),
    );

    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x00aaff,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );

    group.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.7, 6),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.4,
          wireframe: true,
        }),
      ),
    );

    this._bottleMeshCache = this.markShared(group);
    return group.clone();
  }

  reset() {
    // Clear weapons
    this.equippedWeapons = [];

    // Clear projectiles
    this.projectiles.forEach((p) => {
      this.game.scene.remove(p.mesh);
      this.disposeObject(p.mesh);
    });
    this.projectiles = [];

    // Clear effects
    this.effects.forEach((e) => {
      if (e.mesh) {
        this.game.scene.remove(e.mesh);
        this.disposeObject(e.mesh);
      }
    });
    this.effects = [];

    // Reset cooldowns
    this.cooldowns = {};
  }

  // Get a weapon's current stats (base + level bonuses)
  getWeaponStats(weaponId, level) {
    // Check if this is an evolved weapon
    if (EVOLUTION_RECIPES[weaponId]) {
      return this.game.evolutionSystem.getEvolvedStats(weaponId);
    }

    const def = AUTO_WEAPONS[weaponId];
    if (!def) return null;

    const stats = { ...def.baseStats };

    // Apply level bonuses
    for (let i = 0; i < level && i < def.levelBonuses.length; i++) {
      const bonus = def.levelBonuses[i];
      for (const [key, value] of Object.entries(bonus)) {
        if (stats[key] !== undefined) {
          stats[key] += value;
        } else {
          stats[key] = value;
        }
      }
    }

    // Apply player stat bonuses
    const playerStats = this.game.playerStats || {};
    if (playerStats.might) stats.damage *= 1 + playerStats.might * 0.1;
    if (playerStats.area) stats.area *= 1 + playerStats.area * 0.1;
    if (playerStats.speed && stats.projectileSpeed) stats.projectileSpeed *= 1 + playerStats.speed * 0.1;
    if (playerStats.duration && stats.duration) stats.duration *= 1 + playerStats.duration * 0.1;
    if (playerStats.cooldown) stats.cooldown *= 1 - playerStats.cooldown * 0.05;
    if (playerStats.amount && stats.projectileCount) stats.projectileCount += playerStats.amount;

    return stats;
  }

  // Add or upgrade a weapon
  addWeapon(weaponId) {
    const existing = this.equippedWeapons.find((w) => w.id === weaponId);

    if (existing) {
      // Upgrade existing weapon
      const def = AUTO_WEAPONS[weaponId];
      if (existing.level < def.maxLevel) {
        existing.level++;
        console.log(`${def.name} upgraded to level ${existing.level}`);
        return true;
      }
      return false; // Already max level
    } else {
      // Add new weapon
      this.equippedWeapons.push({
        id: weaponId,
        level: 1,
      });
      this.cooldowns[weaponId] = 0;
      console.log(`Acquired ${AUTO_WEAPONS[weaponId].name}!`);
      return true;
    }
  }

  // Check if player has weapon
  hasWeapon(weaponId) {
    return this.equippedWeapons.some((w) => w.id === weaponId);
  }

  // Get weapon level
  getWeaponLevel(weaponId) {
    const weapon = this.equippedWeapons.find((w) => w.id === weaponId);
    return weapon ? weapon.level : 0;
  }

  // Get list of upgradeable weapons (for level up selection)
  getAvailableUpgrades() {
    const upgrades = [];

    // Add upgrades for owned weapons that aren't max level
    for (const weapon of this.equippedWeapons) {
      const def = AUTO_WEAPONS[weapon.id];
      if (!def) continue; // evolved weapon — not upgradeable via normal path
      if (weapon.level < def.maxLevel) {
        upgrades.push({
          type: "weapon",
          id: weapon.id,
          name: def.name,
          rarity: def.rarity || "common",
          icon: def.icon,
          iconColor: def.iconColor,
          description: `Level ${weapon.level + 1}: ${this.getUpgradeDescription(weapon.id, weapon.level + 1)}`,
          currentLevel: weapon.level,
        });
      }
    }

    // Add new weapons player doesn't have, ONLY IF we haven't reached the max slots (6)
    const MAX_WEAPON_SLOTS = 6;
    if (this.equippedWeapons.length < MAX_WEAPON_SLOTS) {
      for (const [id, def] of Object.entries(AUTO_WEAPONS)) {
        if (!this.hasWeapon(id)) {
          upgrades.push({
            type: "weapon",
            id: id,
            name: def.name,
            rarity: def.rarity || "common",
            icon: def.icon,
            iconColor: def.iconColor,
            description: def.description,
            currentLevel: 0,
          });
        }
      }
    }

    return upgrades;
  }

  getUpgradeDescription(weaponId, level) {
    const def = AUTO_WEAPONS[weaponId];
    if (!def || level < 1 || level > def.levelBonuses.length) return "";

    const bonus = def.levelBonuses[level - 1];
    const parts = [];

    for (const [key, value] of Object.entries(bonus)) {
      const sign = value > 0 ? "+" : "";
      switch (key) {
        case "damage":
          parts.push(`${sign}${value} Damage`);
          break;
        case "projectileCount":
          parts.push(`${sign}${value} Projectile`);
          break;
        case "cooldown":
          parts.push(`${sign}${value}s Cooldown`);
          break;
        case "area":
          parts.push(`${sign}${Math.round(value * 100)}% Area`);
          break;
        case "pierce":
          parts.push(`${sign}${value} Pierce`);
          break;
        case "duration":
          parts.push(`${sign}${value}s Duration`);
          break;
        default:
          parts.push(`${sign}${value} ${key}`);
      }
    }

    return parts.join(", ") || "Base stats";
  }

  update(delta) {
    const now = performance.now() / 1000;
    const playerPos = this.game.player.getPosition();
    const playerDir = this.game.player.getDirection();
    const zombies = this.game.zombieManager.getZombies();

    // Update each equipped weapon
    for (const weapon of this.equippedWeapons) {
      const stats = this.getWeaponStats(weapon.id, weapon.level);
      const lastFire = this.cooldowns[weapon.id] || 0;

      if (now - lastFire >= stats.cooldown) {
        // Ready to fire! Pass level for visual scaling
        this.fireWeapon(
          weapon.id,
          stats,
          playerPos,
          playerDir,
          zombies,
          weapon.level,
        );
        this.cooldowns[weapon.id] = now;
      }
    }

    // Update projectiles
    this.updateProjectiles(delta);

    // Update effects (garlic aura, holy water pools, etc.)
    this.updateEffects(delta);
  }

  getLevelScale(level) {
    return 0.5 + (level - 1) * 0.08;
  }

  fireWeapon(weaponId, stats, playerPos, playerDir, zombies, level = 1) {
    const scale = this.getLevelScale(level);

    // Check if this is an evolved weapon
    if (EVOLUTION_RECIPES[weaponId]) {
      this.fireEvolvedWeapon(weaponId, stats, playerPos, playerDir, zombies);
      return;
    }

    switch (weaponId) {
      case "magicWand":
        this.fireMagicWand(stats, playerPos, zombies, scale);
        break;
      case "whip":
        this.fireWhip(stats, playerPos, playerDir, scale);
        break;
      case "knife":
        this.fireKnife(stats, playerPos, playerDir, scale);
        break;
      case "axe":
        this.fireAxe(stats, playerPos, scale);
        break;
      case "garlic":
        this.fireGarlic(stats, playerPos, scale);
        break;
      case "cross":
        this.fireCross(stats, playerPos, zombies, scale);
        break;
      case "fireWand":
        this.fireFireWand(stats, playerPos, zombies, scale);
        break;
      case "lightning":
        this.fireLightning(stats, playerPos, zombies, scale);
        break;
      case "runetracer":
        this.fireRunetracer(stats, playerPos, scale);
        break;
      case "holyWater":
        this.fireHolyWater(stats, playerPos, zombies, scale);
        break;
      // New weapons
      case "bone":
        this.fireBone(stats, playerPos, zombies, scale);
        break;
      case "magicMissile":
        this.fireMagicMissile(stats, playerPos, zombies, scale);
        break;
      case "peachone":
        this.fireOrbitingBird(stats, playerPos, "peachone", scale);
        break;
      case "ebonyWings":
        this.fireOrbitingBird(stats, playerPos, "ebonyWings", scale);
        break;
      case "pentagram":
        this.firePentagram(stats, playerPos, scale);
        break;
      case "clockLancet":
        this.fireClockLancet(stats, playerPos, zombies, scale);
        break;
      case "laurel":
        // Laurel is passive - handled separately
        break;
    }
  }

  // Fire evolved weapons with spectacular effects
  fireEvolvedWeapon(weaponId, stats, playerPos, playerDir, zombies) {
    switch (weaponId) {
      case "holyWand":
        this.fireHolyWand(stats, playerPos, zombies);
        break;
      case "bloodyTear":
        this.fireBloodyTear(stats, playerPos, playerDir);
        break;
      case "thousandEdge":
        this.fireThousandEdge(stats, playerPos, playerDir);
        break;
      case "deathSpiral":
        this.fireDeathSpiral(stats, playerPos);
        break;
      case "soulEater":
        this.fireSoulEater(stats, playerPos);
        break;
      case "heavenSword":
        this.fireHeavenSword(stats, playerPos, zombies);
        break;
      case "hellfire":
        this.fireHellfire(stats, playerPos, zombies);
        break;
      case "thunderLoop":
        this.fireThunderLoop(stats, playerPos, zombies);
        break;
      case "noFuture":
        this.fireNoFuture(stats, playerPos);
        break;
      case "laBorra":
        this.fireLaBorra(stats, playerPos, zombies);
        break;
    }
  }

  createHolyWandMesh() {
    if (this._holyWandMeshCache) return this._holyWandMeshCache.clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 1.0, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    core.rotation.x = Math.PI / 2;
    group.add(core);

    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 1.3, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.rotation.x = Math.PI / 2;
    group.add(glow);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.03, 6, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(ring);

    this._holyWandMeshCache = this.markShared(group);
    return group.clone();
  }

  // Holy Wand - rapid divine projectiles
  fireHolyWand(stats, playerPos, zombies) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      const group = this.createHolyWandMesh();

      group.position.copy(playerPos);
      group.position.y = 1;

      // Point towards target
      group.rotation.y = Math.atan2(direction.x, direction.z);

      this.game.scene.add(group);

      this.projectiles.push({
        type: "holyWand",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("shoot");
  }

  // Bloody Tear - lifesteal whip
  fireBloodyTear(stats, playerPos, playerDir) {
    for (let i = 0; i < stats.projectileCount; i++) {
      const dir = i === 0 ? playerDir.clone() : playerDir.clone().negate();

      const group = new THREE.Group();
      const width = 8 * stats.area;

      const slash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.7, width, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      slash.rotation.z = Math.PI / 2;
      slash.position.x = width / 2;
      group.add(slash);

      const aura = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 1.0, width * 0.9, 8),
        new THREE.MeshBasicMaterial({
          color: 0x880000,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      aura.rotation.z = Math.PI / 2;
      aura.position.x = width / 2;
      group.add(aura);

      for (let d = 0; d < 5; d++) {
        const drip = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 4, 4),
          new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
          }),
        );
        drip.position.set(
          Math.random() * width,
          -0.3,
          (Math.random() - 0.5) * 0.4,
        );
        group.add(drip);
      }

      group.position.copy(playerPos);
      group.position.y = 1;
      group.rotation.y = Math.atan2(dir.x, dir.z);

      this.game.scene.add(group);

      this.effects.push({
        type: "bloodyTear",
        mesh: group,
        position: playerPos.clone(),
        direction: dir,
        damage: stats.damage,
        area: width,
        knockback: stats.knockback,
        lifesteal: stats.lifesteal,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("whip");
    if (this.game.screenShake) this.game.screenShake(0.5, 0.2); // Bloody Tear deserves a shake
  }

  // Thousand Edge - knife storm
  fireThousandEdge(stats, playerPos, playerDir) {
    for (let i = 0; i < stats.projectileCount; i++) {
      const spread = (i - (stats.projectileCount - 1) / 2) * 0.3;
      const dir = playerDir.clone();
      dir.x += spread;
      dir.normalize();

      const mesh = this.createEvolvedKnifeMesh();
      mesh.scale.setScalar(1.5);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      // Orient correctly along movement vector
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = Math.atan2(dir.x, dir.z);

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "thousandEdge",
        mesh: mesh,
        direction: dir,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("knife");
  }

  // Death Spiral - orbiting axes
  fireDeathSpiral(stats, playerPos) {
    const orbitRadius = stats.orbitRadius || 5;

    for (let i = 0; i < stats.projectileCount; i++) {
      const angle = (i / stats.projectileCount) * Math.PI * 2;

      const mesh = this.createAxeMesh();
      mesh.scale.setScalar(1.8);

      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xaa00ff,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      mesh.add(aura);

      mesh.position.copy(playerPos);
      mesh.position.x += Math.cos(angle) * orbitRadius;
      mesh.position.z += Math.sin(angle) * orbitRadius;
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "deathSpiral",
        mesh: mesh,
        centerPos: playerPos.clone(),
        angle: angle,
        orbitRadius: orbitRadius,
        orbitSpeed: 3, // Faster orbit
        damage: stats.damage,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
        hitCooldowns: {},
      });
    }

    this.game.audioManager.playSound("axe");
  }

  // Soul Eater - massive damage aura with lifesteal
  fireSoulEater(stats, playerPos) {
    const group = new THREE.Group();

    // Dark purple aura
    const auraGeometry = new THREE.RingGeometry(0, stats.area, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0x440066,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.rotation.x = -Math.PI / 2;
    group.add(aura);

    for (let i = 0; i < 4; i++) {
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 4, 4),
        new THREE.MeshBasicMaterial({
          color: 0x88ff88,
          transparent: true,
          opacity: 0.5,
        }),
      );
      const angle = (i / 4) * Math.PI * 2;
      wisp.position.set(
        Math.cos(angle) * stats.area * 0.6,
        0.4,
        Math.sin(angle) * stats.area * 0.6,
      );
      group.add(wisp);
    }

    group.position.copy(playerPos);
    group.position.y = 0.1;

    this.game.scene.add(group);

    // Damage enemies and heal
    const zombies = this.game.zombieManager.getZombies();
    let totalHealed = 0;
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        this.game.zombieManager.damageZombie(zombie, stats.damage);
        totalHealed += stats.lifesteal;

        // Knockback
        if (stats.knockback) {
          const dir = new THREE.Vector3();
          dir.subVectors(zombie.mesh.position, playerPos);
          dir.normalize();
          zombie.mesh.position.add(dir.multiplyScalar(stats.knockback));
        }
      }
    }

    // Apply lifesteal
    if (totalHealed > 0 && this.game.player) {
      this.game.player.health = Math.min(
        this.game.player.maxHealth,
        this.game.player.health + totalHealed,
      );
    }

    this.effects.push({
      type: "soulEater",
      mesh: group,
      duration: stats.duration,
      elapsed: 0,
    });
  }

  createHeavenSwordMesh() {
    if (this._heavenSwordMeshCache) return this._heavenSwordMeshCache.clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.8, 0.3),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(core);

    const bladeGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.0, 0.5),
      new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(bladeGlow);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.75, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const leftWing = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.8, 4),
      wingMat,
    );
    leftWing.position.set(-0.4, 0.2, 0);
    leftWing.rotation.z = Math.PI / 2;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.8, 4),
      wingMat,
    );
    rightWing.position.set(0.4, 0.2, 0);
    rightWing.rotation.z = -Math.PI / 2;
    group.add(rightWing);

    this._heavenSwordMeshCache = this.markShared(group);
    return group.clone();
  }

  // Heaven Sword - homing divine blades
  fireHeavenSword(stats, playerPos, zombies) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      const group = this.createHeavenSwordMesh();

      group.position.copy(playerPos);
      group.position.y = 1.5;

      // Orient towards target
      group.rotation.x = Math.PI / 2; // Lie flat initially
      group.rotation.z = Math.atan2(direction.x, direction.z);

      this.game.scene.add(group);

      this.projectiles.push({
        type: "heavenSword",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        homing: true,
        homingStrength: stats.homingStrength,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("cross");
  }

  // Hellfire - massive fire rain
  fireHellfire(stats, playerPos, zombies) {
    for (let i = 0; i < stats.projectileCount; i++) {
      let targetPos;
      if (zombies.length > 0) {
        const idx = Math.floor(Math.random() * zombies.length);
        targetPos = zombies[idx].mesh.position.clone();
      } else {
        const angle = Math.random() * Math.PI * 2;
        targetPos = playerPos.clone();
        targetPos.x += Math.cos(angle) * 8;
        targetPos.z += Math.sin(angle) * 8;
      }

      const mesh = this.createFireballMesh();
      mesh.scale.setScalar(2.5);

      mesh.position.copy(targetPos);
      mesh.position.y = 30; // Start from very high above

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "hellfire",
        mesh: mesh,
        targetPos: targetPos,
        startY: 30,
        fallSpeed: 40,
        damage: stats.damage,
        explosionRadius: stats.explosionRadius * 1.5, // Larger explosion
        elapsed: 0,
        duration: 3,
      });
    }

    this.game.audioManager.playSound("fireball");
  }

  // Thunder Loop - chain lightning
  fireThunderLoop(stats, playerPos, zombies) {
    const inRangeZombies = zombies.filter((z) => {
      return z.mesh.position.distanceTo(playerPos) < stats.area;
    });

    if (inRangeZombies.length === 0) return;

    // Initial targets
    const initialTargets = [];
    for (let i = 0; i < stats.projectileCount; i++) {
      const idx = Math.floor(Math.random() * inRangeZombies.length);
      initialTargets.push(inRangeZombies[idx]);
    }

    // Chain lightning effect
    for (const firstTarget of initialTargets) {
      let currentTarget = firstTarget;
      let chainedTargets = new Set([currentTarget]);
      let chainCount = stats.chainCount || 5;

      const createChainEffect = (from, to) => {
        const fromPos =
          from instanceof THREE.Vector3 ? from : from.mesh.position;
        const toPos = to.mesh.position;

        // Create lightning bolt between points
        const points = [fromPos.clone()];
        const segments = 5;
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const point = new THREE.Vector3().lerpVectors(fromPos, toPos, t);
          point.x += (Math.random() - 0.5) * 1;
          point.y += (Math.random() - 0.5) * 1 + 1;
          point.z += (Math.random() - 0.5) * 1;
          points.push(point);
        }
        points.push(toPos.clone());

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(
          curve,
          segments * 2,
          0.18,
          6,
          false,
        );
        const tubeMaterial = new THREE.MeshBasicMaterial({
          color: 0x0088ff,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const bolt = new THREE.Mesh(tubeGeometry, tubeMaterial);

        const coreGeometry = new THREE.TubeGeometry(
          curve,
          segments * 2,
          0.06,
          6,
          false,
        );
        const coreMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        bolt.add(core);

        this.game.scene.add(bolt);

        // Damage target
        this.game.zombieManager.damageZombie(to, stats.damage);

        // Fade out
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.1;
          if (opacity <= 0) {
            this.game.scene.remove(bolt);
            tubeGeometry.dispose();
            tubeMaterial.dispose();
            coreGeometry.dispose();
            coreMaterial.dispose();
          } else {
            tubeMaterial.opacity = opacity * 0.6;
            coreMaterial.opacity = opacity * 0.9;
            requestAnimationFrame(fadeOut);
          }
        };
        setTimeout(fadeOut, 100);
      };

      // Chain to nearby enemies
      let prevPos = playerPos;
      for (let c = 0; c < chainCount && currentTarget; c++) {
        createChainEffect(prevPos, currentTarget);
        prevPos = currentTarget.mesh.position;

        // Find next target
        let nextTarget = null;
        let nearestDist = Infinity;
        for (const z of inRangeZombies) {
          if (chainedTargets.has(z)) continue;
          const dist = z.mesh.position.distanceTo(currentTarget.mesh.position);
          if (dist < 5 && dist < nearestDist) {
            nearestDist = dist;
            nextTarget = z;
          }
        }

        if (nextTarget) {
          chainedTargets.add(nextTarget);
          currentTarget = nextTarget;
        } else {
          break;
        }
      }
    }

    this.game.audioManager.playSound("lightning");
  }

  createNoFutureMesh() {
    if (this._noFutureMeshCache) return this._noFutureMeshCache.clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(core);

    const innerAura = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xaa00ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(innerAura);

    const lineGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xffaaff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line1 = new THREE.Mesh(lineGeo, lineMat);
    line1.rotation.x = Math.PI / 4;
    line1.rotation.z = Math.PI / 4;
    group.add(line1);

    const line2 = new THREE.Mesh(lineGeo, lineMat);
    line2.rotation.x = -Math.PI / 4;
    line2.rotation.z = -Math.PI / 4;
    group.add(line2);

    this._noFutureMeshCache = this.markShared(group);
    return group.clone();
  }

  // NO FUTURE - exploding bouncing doom orb
  fireNoFuture(stats, playerPos) {
    for (let i = 0; i < stats.projectileCount; i++) {
      const angle = (i / stats.projectileCount) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      const group = this.createNoFutureMesh();

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "noFuture",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        duration: stats.duration,
        elapsed: 0,
        bounces: true,
        explosionOnBounce: stats.explosionOnBounce,
        explosionRadius: stats.explosionRadius,
        hitEnemies: new Set(),
        hitCooldowns: {},
      });
    }

    this.game.audioManager.playSound("runetracer");
  }

  // La Borra - massive slowing pools
  fireLaBorra(stats, playerPos, zombies) {
    for (let i = 0; i < stats.projectileCount; i++) {
      let targetPos;
      if (zombies.length > 0) {
        const idx = Math.floor(Math.random() * Math.min(5, zombies.length));
        targetPos = zombies[idx].mesh.position.clone();
      } else {
        const angle = Math.random() * Math.PI * 2;
        targetPos = playerPos.clone();
        targetPos.x += Math.sin(angle) * 5;
        targetPos.z += Math.cos(angle) * 5;
      }

      // Create massive bright cyan plasma pool
      const group = new THREE.Group();

      // Main inner plasma core
      const poolCore = new THREE.Mesh(
        new THREE.CircleGeometry(stats.area * 0.7, 32),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      poolCore.rotation.x = -Math.PI / 2;
      group.add(poolCore);

      // Outer plasma aura
      const poolAura = new THREE.Mesh(
        new THREE.CircleGeometry(stats.area, 32),
        new THREE.MeshBasicMaterial({
          color: 0x0044ff,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      poolAura.rotation.x = -Math.PI / 2;
      poolAura.position.y = -0.01;
      group.add(poolAura);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(
          stats.area * 0.5,
          stats.area * 0.6,
          16,
        ),
        new THREE.MeshBasicMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);

      const bubbles = [];
      for (let b = 0; b < 4; b++) {
        const bubble = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * stats.area * 0.6;
        bubble.position.set(
          Math.cos(angle) * dist,
          0.2 + Math.random() * 0.3,
          Math.sin(angle) * dist,
        );
        group.add(bubble);
        bubbles.push({
          mesh: bubble,
          startY: bubble.position.y,
          speed: 0.5 + Math.random(),
        });
      }

      group.position.copy(targetPos);
      group.position.y = 0.1;
      this.game.scene.add(group);

      this.effects.push({
        type: "laBorra",
        mesh: group,
        bubbles: bubbles, // Add bubbles to animate later if we want
        position: targetPos.clone(),
        damage: stats.damage,
        area: stats.area,
        tickRate: stats.tickRate,
        slowAmount: stats.slowAmount,
        duration: stats.duration,
        elapsed: 0,
        lastTick: 0,
      });
    }

    this.game.audioManager.playSound("splash");
  }

  // Magic Wand - fires at nearest enemy
  fireMagicWand(stats, playerPos, zombies, scale = 1) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      // Find target (rotate through nearby enemies)
      const sortedZombies = [...zombies].sort((a, b) => {
        const distA = a.mesh.position.distanceTo(playerPos);
        const distB = b.mesh.position.distanceTo(playerPos);
        return distA - distB;
      });

      const targetIndex = i % sortedZombies.length;
      const target = sortedZombies[targetIndex];

      // Calculate direction
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      // Create projectile with level-based scale
      this.createProjectile({
        type: "magicWand",
        position: playerPos.clone().add(new THREE.Vector3(0, 1, 0)),
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        area: stats.area,
        color: 0x00aaff,
        scale: scale,
      });
    }

    this.game.audioManager.playSound("shoot");
  }

  // Whip - FIREWALL style attack that leaves burning trail
  fireWhip(stats, playerPos, playerDir, scale = 1) {
    const attackPositions = [playerPos.clone()];

    // Level 3+ attacks behind too
    if (stats.projectileCount >= 2) {
      attackPositions.push(playerPos.clone());
    }

    for (let i = 0; i < attackPositions.length; i++) {
      const pos = attackPositions[i];
      const dir = i === 0 ? playerDir.clone() : playerDir.clone().negate();

      const width = 3 * stats.area * scale;
      const group = new THREE.Group();

      const slashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const slash = new THREE.Mesh(
        new THREE.PlaneGeometry(width, 1.2),
        slashMat,
      );
      slash.position.set(width / 2, 1.0, 0);
      slash.rotation.y = Math.PI;
      group.add(slash);

      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.1, 2.0),
        glowMat,
      );
      glow.position.set(width / 2, 1.0, 0);
      group.add(glow);

      const groundGeometry = new THREE.PlaneGeometry(width, 1.2);
      const groundMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(width / 2, 0.05, 0);
      group.add(ground);

      group.position.copy(pos);
      group.position.y = 0.1;
      group.rotation.y = Math.atan2(dir.x, dir.z);

      this.game.scene.add(group);

      // Store as firewall effect - longer duration for burning
      this.effects.push({
        type: "firewall",
        mesh: group,
        position: pos.clone(),
        direction: dir,
        damage: stats.damage * 0.5, // Damage per tick
        area: width,
        knockback: stats.knockback || 0,
        duration: stats.duration * 3, // Lasts 3x longer
        elapsed: 0,
        tickRate: 0.3, // Damage every 0.3 seconds
        lastTick: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("whip");
  }

  // Knife - throws in facing direction
  fireKnife(stats, playerPos, playerDir, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      // Slight spread for multiple knives
      const spread = (i - (stats.projectileCount - 1) / 2) * 0.15;
      const dir = playerDir.clone();
      dir.x += spread;
      dir.normalize();

      // Create detailed knife mesh with level scaling
      const mesh = this.createKnifeMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;
      mesh.rotation.y = Math.atan2(dir.x, dir.z);

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "knife",
        mesh: mesh,
        direction: dir,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("knife");
  }

  // Axe - thrown in arc
  fireAxe(stats, playerPos, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      // Random upward angle
      const angle = (Math.random() - 0.5) * Math.PI * 0.5;

      // Create detailed axe mesh with level scaling
      const mesh = this.createAxeMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "axe",
        mesh: mesh,
        angle: angle,
        velocityY: stats.projectileSpeed * 0.8,
        velocityX: Math.sin(angle) * stats.projectileSpeed * 0.5,
        velocityZ: Math.cos(angle) * stats.projectileSpeed * 0.5,
        damage: stats.damage,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
        spin: 0,
      });
    }

    this.game.audioManager.playSound("axe");
  }

  // Garlic - damage aura around player
  fireGarlic(stats, playerPos, scale = 1) {
    // Create expanding magical aura effect - DIVINE/TOXIC RUNE FIELD
    const group = new THREE.Group();

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(stats.area * 0.5, stats.area * 0.65, 16),
      new THREE.MeshBasicMaterial({
        color: 0x88ff88,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    group.add(innerRing);

    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area * 0.8, 16),
      new THREE.MeshBasicMaterial({
        color: 0x44ff44,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    fill.rotation.x = -Math.PI / 2;
    group.add(fill);

    group.position.copy(playerPos);
    group.position.y = 0.1;
    group.scale.setScalar(scale);

    this.game.scene.add(group);
    const mesh = group;

    // Damage enemies in range immediately
    const zombies = this.game.zombieManager.getZombies();
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        this.game.zombieManager.damageZombie(zombie, stats.damage);

        // Knockback
        if (stats.knockback) {
          const dir = new THREE.Vector3();
          dir.subVectors(zombie.mesh.position, playerPos);
          dir.normalize();
          zombie.mesh.position.add(dir.multiplyScalar(stats.knockback));
        }
      }
    }

    // Fade out effect
    this.effects.push({
      type: "garlic",
      mesh: mesh,
      duration: stats.duration,
      elapsed: 0,
    });
  }

  // Cross - boomerang
  fireCross(stats, playerPos, zombies, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      // Random direction or toward enemy
      let direction;
      if (zombies.length > 0) {
        const targetIndex = i % zombies.length;
        direction = new THREE.Vector3();
        direction.subVectors(zombies[targetIndex].mesh.position, playerPos);
        direction.y = 0;
        direction.normalize();
      } else {
        const angle = (i / stats.projectileCount) * Math.PI * 2;
        direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      }

      // Create detailed cross mesh with level scaling
      const mesh = this.createCrossMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "cross",
        mesh: mesh,
        startPos: playerPos.clone(),
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        returning: false,
        hitEnemies: new Set(),
        spin: 0,
      });
    }

    this.game.audioManager.playSound("cross");
  }

  // Fire Wand - explosive projectile
  fireFireWand(stats, playerPos, zombies, scale = 1) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];

      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      // Create detailed fireball mesh with level scaling
      const mesh = this.createFireballMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "fireWand",
        mesh: mesh,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        explosionRadius: stats.explosionRadius,
        duration: stats.duration,
        elapsed: 0,
      });
    }

    this.game.audioManager.playSound("fireball");
  }

  // Lightning - random strikes (POWERFUL & VISIBLE)
  fireLightning(stats, playerPos, zombies, scale = 1) {
    const inRangeZombies = zombies.filter((z) => {
      return z.mesh.position.distanceTo(playerPos) < stats.area;
    });

    if (inRangeZombies.length === 0) return;

    // Strike random enemies
    const targets = [];
    for (let i = 0; i < stats.projectileCount; i++) {
      const index = Math.floor(Math.random() * inRangeZombies.length);
      targets.push(inRangeZombies[index]);
    }

    for (const target of targets) {
      const endPos = target.mesh.position.clone();
      const boltGroup = new THREE.Group();

      // Create jagged lightning bolt path with more segments
      const startY = 15;
      const segments = 8;
      const points = [];

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = startY * (1 - t);
        // More dramatic zigzag - wider at top, narrower at bottom
        const spread = (1 - t) * 3 * scale;
        const x = endPos.x + (Math.random() - 0.5) * spread;
        const z = endPos.z + (Math.random() - 0.5) * spread;
        points.push(new THREE.Vector3(x, y, z));
      }
      // Ensure last point hits the target
      points[points.length - 1] = endPos.clone();
      points[points.length - 1].y = 0.2;

      // Create thick glowing bolt using tube geometry
      const curve = new THREE.CatmullRomCurve3(points);

      const coreBolt = new THREE.Mesh(
        new THREE.TubeGeometry(curve, segments * 2, 0.12 * scale, 6, false),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      boltGroup.add(coreBolt);

      const glowBolt = new THREE.Mesh(
        new THREE.TubeGeometry(curve, segments * 2, 0.3 * scale, 6, false),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      boltGroup.add(glowBolt);

      for (let b = 0; b < 1; b++) {
        const branchStart = Math.floor(Math.random() * (segments - 2)) + 1;
        const branchPoints = [points[branchStart].clone()];
        const branchLength = 3;
        for (let j = 1; j <= branchLength; j++) {
          const prevPoint = branchPoints[j - 1];
          branchPoints.push(
            new THREE.Vector3(
              prevPoint.x + (Math.random() - 0.5) * 2 * scale,
              prevPoint.y - 1.5,
              prevPoint.z + (Math.random() - 0.5) * 2 * scale,
            ),
          );
        }
        const branchCurve = new THREE.CatmullRomCurve3(branchPoints);
        const branchGeometry = new THREE.TubeGeometry(
          branchCurve,
          branchLength * 2,
          0.08 * scale,
          6,
          false,
        );
        const branchMaterial = new THREE.MeshBasicMaterial({
          color: 0x88ffff,
          transparent: true,
          opacity: 0.8,
        });
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        boltGroup.add(branch);
      }

      this.game.scene.add(boltGroup);

      // Damage enemy
      this.game.zombieManager.damageZombie(target, stats.damage);

      const impactGroup = new THREE.Group();

      const flashGeometry = new THREE.CircleGeometry(0.8 * scale, 12);
      const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const flash = new THREE.Mesh(flashGeometry, flashMaterial);
      flash.rotation.x = -Math.PI / 2;
      impactGroup.add(flash);

      const ring1Geometry = new THREE.RingGeometry(0.7 * scale, 1.1 * scale, 12);
      const ring1Material = new THREE.MeshBasicMaterial({
        color: 0x44ffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
      ring1.rotation.x = -Math.PI / 2;
      impactGroup.add(ring1);

      impactGroup.position.copy(endPos);
      impactGroup.position.y = 0.15;

      this.game.scene.add(impactGroup);

      // Store effects for cleanup
      this.effects.push({
        type: "lightning",
        mesh: boltGroup,
        duration: 0.25,
        elapsed: 0,
      });

      this.effects.push({
        type: "lightningImpact",
        mesh: impactGroup,
        duration: 0.4,
        elapsed: 0,
      });
    }

    this.game.audioManager.playSound("lightning");
  }

  // Runetracer - bouncing projectile
  fireRunetracer(stats, playerPos, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      // Create detailed runetracer mesh with level scaling
      const mesh = this.createRunetracerMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 1;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "runetracer",
        mesh: mesh,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
        hitCooldowns: {},
      });
    }

    this.game.audioManager.playSound("runetracer");
  }

  // Holy Water - creates damaging pool
  fireHolyWater(stats, playerPos, zombies, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      // Target position
      let targetPos;
      if (zombies.length > 0) {
        const index = Math.floor(Math.random() * Math.min(5, zombies.length));
        targetPos = zombies[index].mesh.position.clone();
      } else {
        const angle = Math.random() * Math.PI * 2;
        targetPos = playerPos.clone();
        targetPos.x += Math.sin(angle) * 5;
        targetPos.z += Math.cos(angle) * 5;
      }

      // Create detailed holy water bottle mesh with level scaling
      const mesh = this.createHolyWaterMesh();
      mesh.scale.setScalar(scale);
      mesh.position.copy(playerPos);
      mesh.position.y = 2;

      this.game.scene.add(mesh);

      this.projectiles.push({
        type: "holyWater",
        mesh: mesh,
        targetPos: targetPos,
        arcHeight: 3,
        startPos: playerPos.clone(),
        damage: stats.damage,
        area: stats.area,
        poolDuration: stats.duration,
        tickRate: stats.tickRate,
        elapsed: 0,
        flightDuration: 0.5,
      });
    }

    this.game.audioManager.playSound("throw");
  }

  // Create a generic projectile (magic orb style)
  createProjectile(config) {
    const mesh = this.createMagicOrbMesh(config.color);
    const visualScale = (config.scale || 1) * Math.min(1.5, Math.sqrt(config.area || 1));
    mesh.scale.setScalar(visualScale);
    mesh.position.copy(config.position);

    if (config.direction) {
      mesh.rotation.y = Math.atan2(config.direction.x, config.direction.z);
    }

    this.game.scene.add(mesh);

    this.projectiles.push({
      ...config,
      mesh: mesh,
      elapsed: 0,
      hitEnemies: new Set(),
    });
  }

  updateProjectiles(delta) {
    const arenaSize = this.game.arenaSize;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.elapsed += delta;

      // Check duration
      if (proj.elapsed >= proj.duration) {
        this.removeProjectile(i, proj.type === "fireWand");
        continue;
      }

      // Update based on type
      switch (proj.type) {
        case "magicWand":
        case "knife":
          // Simple linear movement
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );
          if (proj.type === "knife") {
            proj.mesh.rotation.y += delta * 10;
          }
          break;

        case "axe":
          // Arc movement
          proj.velocityY -= 15 * delta; // gravity
          proj.mesh.position.x += proj.velocityX * delta;
          proj.mesh.position.y += proj.velocityY * delta;
          proj.mesh.position.z += proj.velocityZ * delta;
          proj.spin += delta * 15;
          proj.mesh.rotation.z = proj.spin;
          break;

        case "cross":
          // Boomerang movement
          if (!proj.returning) {
            proj.mesh.position.add(
              proj.direction.clone().multiplyScalar(proj.speed * delta),
            );

            // Check if should return
            const dist = proj.mesh.position.distanceTo(proj.startPos);
            if (dist > 8 || proj.elapsed > proj.duration * 0.4) {
              proj.returning = true;
            }
          } else {
            // Return to player
            const playerPos = this.game.player.getPosition();
            const toPlayer = new THREE.Vector3();
            toPlayer.subVectors(playerPos, proj.mesh.position);
            toPlayer.y = 0;
            toPlayer.normalize();
            proj.mesh.position.add(
              toPlayer.multiplyScalar(proj.speed * 1.2 * delta),
            );
          }
          proj.spin += delta * 15;
          proj.mesh.rotation.y = proj.spin;
          break;

        case "fireWand":
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );
          break;

        case "runetracer":
          // Bounce off walls
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );

          // Wall bouncing
          if (Math.abs(proj.mesh.position.x) > arenaSize - 1) {
            proj.direction.x *= -1;
            proj.mesh.position.x =
              Math.sign(proj.mesh.position.x) * (arenaSize - 1);
          }
          if (Math.abs(proj.mesh.position.z) > arenaSize - 1) {
            proj.direction.z *= -1;
            proj.mesh.position.z =
              Math.sign(proj.mesh.position.z) * (arenaSize - 1);
          }
          break;

        case "holyWater":
          // Arc to target, then create pool
          const t = proj.elapsed / proj.flightDuration;
          if (t < 1) {
            const x =
              proj.startPos.x + (proj.targetPos.x - proj.startPos.x) * t;
            const z =
              proj.startPos.z + (proj.targetPos.z - proj.startPos.z) * t;
            const y = 2 + proj.arcHeight * Math.sin(t * Math.PI);
            proj.mesh.position.set(x, y, z);
          } else {
            // Create pool
            this.createHolyWaterPool(proj);
            this.removeProjectile(i, false);
            continue;
          }
          break;

        // === EVOLVED WEAPON PROJECTILES ===
        case "holyWand":
        case "thousandEdge":
          // Linear movement like regular projectiles
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );
          proj.mesh.rotation.y += delta * 5;
          break;

        case "deathSpiral":
          // Orbit around player
          const playerPos = this.game.player.getPosition();
          proj.angle += proj.orbitSpeed * delta;
          proj.mesh.position.x =
            playerPos.x + Math.cos(proj.angle) * proj.orbitRadius;
          proj.mesh.position.z =
            playerPos.z + Math.sin(proj.angle) * proj.orbitRadius;
          proj.mesh.position.y = 1;
          proj.mesh.rotation.z += delta * 10;
          // Update center position to follow player
          proj.centerPos.copy(playerPos);
          break;

        case "heavenSword":
          // Homing projectile
          if (proj.homing) {
            const zombies = this.game.zombieManager.getZombies();
            if (zombies.length > 0) {
              // Find nearest enemy
              let nearest = null;
              let nearestDist = Infinity;
              for (const z of zombies) {
                const dist = z.mesh.position.distanceTo(proj.mesh.position);
                if (dist < nearestDist) {
                  nearestDist = dist;
                  nearest = z;
                }
              }
              if (nearest) {
                const targetDir = new THREE.Vector3();
                targetDir.subVectors(nearest.mesh.position, proj.mesh.position);
                targetDir.y = 0;
                targetDir.normalize();

                // Gradually turn toward target
                proj.direction.lerp(targetDir, proj.homingStrength * delta);
                proj.direction.normalize();
              }
            }
          }
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );
          // Point in movement direction
          proj.mesh.rotation.z = Math.atan2(proj.direction.x, proj.direction.z);
          break;

        case "hellfire":
          // Fall from sky, explode on ground
          proj.mesh.position.y -= proj.fallSpeed * delta;
          proj.mesh.rotation.y += delta * 5;

          if (proj.mesh.position.y <= 1) {
            // Hit ground - explode!
            this.createExplosion(
              proj.mesh.position,
              proj.explosionRadius,
              proj.damage,
            );
            this.removeProjectile(i, false);
            continue;
          }
          break;

        case "noFuture":
          // Bouncing doom orb
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );
          proj.mesh.rotation.y += delta * 3;
          proj.mesh.rotation.x += delta * 2;

          // Wall bouncing with explosion
          if (Math.abs(proj.mesh.position.x) > arenaSize - 1) {
            proj.direction.x *= -1;
            proj.mesh.position.x =
              Math.sign(proj.mesh.position.x) * (arenaSize - 1);
            if (proj.explosionOnBounce) {
              this.createExplosion(
                proj.mesh.position.clone(),
                proj.explosionRadius,
                proj.damage * 0.5,
              );
            }
          }
          if (Math.abs(proj.mesh.position.z) > arenaSize - 1) {
            proj.direction.z *= -1;
            proj.mesh.position.z =
              Math.sign(proj.mesh.position.z) * (arenaSize - 1);
            if (proj.explosionOnBounce) {
              this.createExplosion(
                proj.mesh.position.clone(),
                proj.explosionRadius,
                proj.damage * 0.5,
              );
            }
          }
          break;

        // === NEW WEAPON PROJECTILES ===
        case "bone":
          // Move and bounce between enemies
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );
          proj.mesh.rotation.z += delta * 15; // Spin

          // Check enemy collision for bouncing
          const boneZombies = this.game.zombieManager.getZombies();
          for (const zombie of boneZombies) {
            if (proj.hitEnemies.has(zombie)) continue;
            const dist = zombie.mesh.position.distanceTo(proj.mesh.position);
            if (dist < proj.area + 0.8) {
              // Hit!
              this.game.zombieManager.damageZombie(zombie, proj.damage);
              proj.hitEnemies.add(zombie);

              // Bounce to next enemy
              if (proj.bounceCount > 0) {
                proj.bounceCount--;
                // Find nearest unhit enemy
                let nearestEnemy = null;
                let nearestDist = Infinity;
                for (const z of boneZombies) {
                  if (proj.hitEnemies.has(z)) continue;
                  const d = z.mesh.position.distanceTo(proj.mesh.position);
                  if (d < nearestDist) {
                    nearestDist = d;
                    nearestEnemy = z;
                  }
                }
                if (nearestEnemy) {
                  proj.direction.subVectors(
                    nearestEnemy.mesh.position,
                    proj.mesh.position,
                  );
                  proj.direction.y = 0;
                  proj.direction.normalize();
                }
              }
              break;
            }
          }
          break;

        case "magicMissile":
          // Homing projectile
          const missileZombies = this.game.zombieManager.getZombies();
          if (missileZombies.length > 0) {
            let nearestZ = null;
            let nearestD = Infinity;
            for (const z of missileZombies) {
              const d = z.mesh.position.distanceTo(proj.mesh.position);
              if (d < nearestD) {
                nearestD = d;
                nearestZ = z;
              }
            }
            if (nearestZ) {
              const targetDir = new THREE.Vector3();
              targetDir.subVectors(nearestZ.mesh.position, proj.mesh.position);
              targetDir.y = 0;
              targetDir.normalize();

              proj.direction.lerp(targetDir, proj.homingStrength * delta);
              proj.direction.normalize();
            }
          }
          proj.mesh.position.add(
            proj.direction.clone().multiplyScalar(proj.speed * delta),
          );
          proj.mesh.rotation.y = Math.atan2(proj.direction.x, proj.direction.z);
          break;

        case "peachone":
        case "ebonyWings":
          // Orbit around player
          const birdPlayerPos = this.game.player.getPosition();
          proj.angle += proj.orbitSpeed * delta;
          proj.mesh.position.x =
            birdPlayerPos.x + Math.cos(proj.angle) * proj.orbitRadius;
          proj.mesh.position.z =
            birdPlayerPos.z + Math.sin(proj.angle) * proj.orbitRadius;
          proj.mesh.position.y = 1.5 + Math.sin(proj.elapsed * 3) * 0.2;

          // Face movement direction
          proj.mesh.rotation.y = proj.angle + Math.PI / 2;

          // Wing flapping animation
          proj.wingAngle += delta * 10;
          if (proj.leftWing) {
            proj.leftWing.rotation.z = -0.3 + Math.sin(proj.wingAngle) * 0.4;
          }
          if (proj.rightWing) {
            proj.rightWing.rotation.z = 0.3 - Math.sin(proj.wingAngle) * 0.4;
          }

          // Check damage cooldowns
          const birdZombies = this.game.zombieManager.getZombies();
          for (const zombie of birdZombies) {
            const lastHit = proj.hitCooldowns[zombie.mesh.uuid] || 0;
            if (proj.elapsed - lastHit < 0.5) continue;

            const dist = zombie.mesh.position.distanceTo(proj.mesh.position);
            if (dist < proj.area) {
              this.game.zombieManager.damageZombie(zombie, proj.damage);
              proj.hitCooldowns[zombie.mesh.uuid] = proj.elapsed;
            }
          }
          break;
      }

      // Check collisions (except for holy water in flight)
      if (proj.type !== "holyWater") {
        this.checkProjectileCollisions(proj, i);
      }

      // After collision check, projectile may have been removed
      // Check if it still exists before accessing mesh
      if (!this.projectiles[i] || this.projectiles[i] !== proj) {
        continue;
      }

      // Out of bounds check
      const pos = proj.mesh.position;
      if (
        Math.abs(pos.x) > arenaSize + 5 ||
        Math.abs(pos.z) > arenaSize + 5 ||
        pos.y < -5 ||
        pos.y > 20
      ) {
        this.removeProjectile(i, proj.type === "fireWand");
      }
    }
  }

  checkProjectileCollisions(proj, index) {
    const zombies = this.game.zombieManager.getZombies();
    const projPos = proj.mesh.position;
    const hitRadius = (proj.area || 1) * 0.8; // Increased hit radius

    for (const zombie of zombies) {
      // Check if already hit (for pierce tracking)
      if (proj.hitEnemies && proj.hitEnemies.has(zombie)) {
        // For runetracer, allow re-hits after cooldown
        if (proj.type === "runetracer") {
          const lastHit = proj.hitCooldowns[zombie.mesh.uuid] || 0;
          if (proj.elapsed - lastHit < 0.5) continue;
        } else {
          continue;
        }
      }

      // Use 2D distance (ignore Y axis) for more reliable collision
      const zombiePos = zombie.mesh.position;
      const dx = zombiePos.x - projPos.x;
      const dz = zombiePos.z - projPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < hitRadius + 0.8) {
        // Hit!
        this.game.zombieManager.damageZombie(zombie, proj.damage);

        // Track hit
        if (proj.hitEnemies) {
          proj.hitEnemies.add(zombie);
          if (proj.hitCooldowns) {
            proj.hitCooldowns[zombie.mesh.uuid] = proj.elapsed;
          }
        }

        // Check pierce
        if (proj.pierce !== undefined && proj.pierce !== Infinity) {
          proj.pierce--;
          if (proj.pierce < 0) {
            this.removeProjectile(index, proj.type === "fireWand");
            return;
          }
        } else if (!proj.pierce && proj.type !== "runetracer") {
          // No pierce, destroy on hit
          this.removeProjectile(index, proj.type === "fireWand");
          return;
        }
      }
    }
  }

  createHolyWaterPool(proj) {
    // Create bright burning holy plasma pool
    const group = new THREE.Group();

    // Hot center
    const core = new THREE.Mesh(
      new THREE.CircleGeometry(proj.area * 0.6, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    core.rotation.x = -Math.PI / 2;
    group.add(core);

    // Main pool
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(proj.area, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    group.add(pool);

    // Glowing border
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(proj.area * 0.9, proj.area * 1.2, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0055ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    group.position.copy(proj.targetPos);
    group.position.y = 0.1;

    this.game.scene.add(group);

    this.effects.push({
      type: "holyWaterPool",
      mesh: group,
      position: proj.targetPos.clone(),
      damage: proj.damage,
      area: proj.area,
      tickRate: proj.tickRate,
      duration: proj.poolDuration,
      elapsed: 0,
      lastTick: 0,
    });

    this.game.audioManager.playSound("splash");
  }

  updateEffects(delta) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.elapsed += delta;

      // Check duration
      if (effect.elapsed >= effect.duration) {
        if (effect.mesh) {
          this.game.scene.remove(effect.mesh);
          this.disposeObject(effect.mesh);
        }
        this.effects.splice(i, 1);
        continue;
      }

      // Update based on type
      switch (effect.type) {
        case "whip":
          // Check damage in whip area (use 2D distance)
          const zombies = this.game.zombieManager.getZombies();
          for (const zombie of zombies) {
            if (effect.hitEnemies.has(zombie)) continue;

            // 2D distance check
            const zPos = zombie.mesh.position;
            const ePos = effect.position;
            const dx = zPos.x - ePos.x;
            const dz = zPos.z - ePos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < effect.area) {
              this.game.zombieManager.damageZombie(zombie, effect.damage);
              effect.hitEnemies.add(zombie);

              // Knockback
              if (effect.knockback) {
                const dir = new THREE.Vector3();
                dir.subVectors(
                  zombie.mesh.position,
                  this.game.player.getPosition(),
                );
                dir.y = 0;
                dir.normalize();
                zombie.mesh.position.add(dir.multiplyScalar(effect.knockback));
              }
            }
          }

          // Fade out (handle group with multiple meshes)
          const fadeProgress = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              !Array.isArray(child.material) &&
              child.material.transparent
            ) {
              child.material.opacity = 0.8 * fadeProgress;
            }
          });
          break;

        case "garlic":
        case "lightning":
        case "lightningImpact":
          // Just fade out
          const fadeAmount = 0.8 * (1 - effect.elapsed / effect.duration);
          if (effect.mesh.traverse) {
            effect.mesh.traverse((child) => {
              if (
                child.isMesh &&
                child.material &&
                !Array.isArray(child.material) &&
                child.material.transparent
              ) {
                child.material.opacity = fadeAmount;
              }
            });
          } else if (effect.mesh.material && !Array.isArray(effect.mesh.material)) {
            effect.mesh.material.opacity = fadeAmount;
          }
          break;

        case "holyWaterPool":
          // Tick damage (use 2D distance)
          if (effect.elapsed - effect.lastTick >= effect.tickRate) {
            effect.lastTick = effect.elapsed;

            const zombiesInPool = this.game.zombieManager
              .getZombies()
              .filter((z) => {
                const zp = z.mesh.position;
                const ep = effect.position;
                const dx = zp.x - ep.x;
                const dz = zp.z - ep.z;
                return Math.sqrt(dx * dx + dz * dz) < effect.area;
              });

            for (const zombie of zombiesInPool) {
              this.game.zombieManager.damageZombie(zombie, effect.damage);
            }
          }

          // Pulsing effect
          const pulse = 0.8 + Math.sin(effect.elapsed * 5) * 0.2;
          const waterFade = 1 - effect.elapsed / effect.duration;

          if (effect.mesh.traverse) {
            effect.mesh.traverse((child) => {
              if (
                child.isMesh &&
                child.material &&
                !Array.isArray(child.material) &&
                child.material.transparent
              ) {
                // Determine base opacity from initial value (stored on creation or using a rough estimate)
                const baseOpacity = child.userData?.baseOpacity || 0.6;
                if (!child.userData?.baseOpacity) {
                  child.userData = child.userData || {};
                  child.userData.baseOpacity = child.material.opacity;
                }
                child.material.opacity =
                  child.userData.baseOpacity * pulse * waterFade;
              }
            });
          } else if (effect.mesh.material && !Array.isArray(effect.mesh.material)) {
            effect.mesh.material.opacity = pulse * waterFade;
          }
          break;

        case "firewall":
          // Firewall - continuous burn damage to enemies in area
          if (effect.elapsed - effect.lastTick >= effect.tickRate) {
            effect.lastTick = effect.elapsed;

            // Get firewall world position and direction
            const firewallPos = effect.position;
            const firewallDir = effect.direction;
            const angle = Math.atan2(firewallDir.x, firewallDir.z);

            const zombiesNearFire = this.game.zombieManager.getZombies();
            for (const zombie of zombiesNearFire) {
              const zp = zombie.mesh.position;

              // Transform zombie position to firewall local space
              const relX = zp.x - firewallPos.x;
              const relZ = zp.z - firewallPos.z;

              // Rotate to align with firewall direction
              const localX = relX * Math.cos(-angle) - relZ * Math.sin(-angle);
              const localZ = relX * Math.sin(-angle) + relZ * Math.cos(-angle);

              // Check if within firewall bounds (width along X, small depth along Z)
              if (
                localX >= -0.5 &&
                localX <= effect.area + 0.5 &&
                Math.abs(localZ) < 1.5
              ) {
                this.game.zombieManager.damageZombie(zombie, effect.damage);

                // Visual burn effect on zombie
                const body = zombie.mesh.userData.body;
                if (body) {
                  body.material.emissive.setHex(0xff4400);
                  setTimeout(() => {
                    if (body.material) {
                      body.material.emissive.setHex(0x000000);
                    }
                  }, 150);
                }
              }
            }
          }

          // Animate fire flickering and fade
          const fireFade = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
              // Flicker effect
              const flicker =
                0.8 + Math.sin(effect.elapsed * 15 + child.id) * 0.2;
              if (child.material.transparent) {
                child.material.opacity =
                  child.material.opacity * flicker * fireFade;
              }
              // Slight scale animation for flames
              if (child.geometry.type === "ConeGeometry") {
                child.scale.y =
                  1 + Math.sin(effect.elapsed * 10 + child.id) * 0.15;
              }
            }
          });
          break;

        // === EVOLVED WEAPON EFFECTS ===
        case "bloodyTear":
          // Blood whip - damage enemies and heal player
          const bloodZombies = this.game.zombieManager.getZombies();
          let bloodHealed = 0;
          for (const zombie of bloodZombies) {
            if (effect.hitEnemies.has(zombie)) continue;

            const zPos = zombie.mesh.position;
            const ePos = effect.position;
            const dx = zPos.x - ePos.x;
            const dz = zPos.z - ePos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < effect.area) {
              this.game.zombieManager.damageZombie(zombie, effect.damage);
              effect.hitEnemies.add(zombie);
              bloodHealed += effect.lifesteal || 0;

              if (effect.knockback) {
                const dir = new THREE.Vector3();
                dir.subVectors(
                  zombie.mesh.position,
                  this.game.player.getPosition(),
                );
                dir.y = 0;
                dir.normalize();
                zombie.mesh.position.add(dir.multiplyScalar(effect.knockback));
              }
            }
          }

          // Apply lifesteal
          if (bloodHealed > 0 && this.game.player) {
            this.game.player.health = Math.min(
              this.game.player.maxHealth,
              this.game.player.health + bloodHealed,
            );
          }

          // Fade effect
          const bloodFade = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              !Array.isArray(child.material) &&
              child.material.transparent
            ) {
              child.material.opacity = 0.8 * bloodFade;
            }
          });
          break;

        case "soulEater":
          // Rotate the entire aura group slowly
          effect.mesh.rotation.y = effect.elapsed * 0.5;

          // Animate wisps rotating and bobbing
          if (effect.wisps) {
            effect.wisps.forEach((wispData, index) => {
              const { mesh, angle } = wispData;
              const currentAngle = angle + effect.elapsed * 4;
              const radius = effect.radius * 0.7;

              mesh.position.x = Math.cos(currentAngle) * radius;
              mesh.position.z = Math.sin(currentAngle) * radius;
              mesh.position.y =
                1.0 + Math.sin(effect.elapsed * 5 + index) * 0.5;

              // Rotate tail to face movement direction
              mesh.rotation.y = -currentAngle;
            });
          }

          // Fade out towards the end
          const soulFade = 1 - effect.elapsed / effect.duration;
          effect.mesh.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              !Array.isArray(child.material) &&
              child.material.transparent
            ) {
              child.material.opacity =
                (child.material.opacity /
                  (soulFade === 0 ? 1 : soulFade + 0.001)) *
                soulFade;
            }
          });
          break;

        case "laBorra":
          // Tick damage and slow enemies
          if (effect.elapsed - effect.lastTick >= effect.tickRate) {
            effect.lastTick = effect.elapsed;

            const poolZombies = this.game.zombieManager
              .getZombies()
              .filter((z) => {
                const zp = z.mesh.position;
                const ep = effect.position;
                const dx = zp.x - ep.x;
                const dz = zp.z - ep.z;
                return Math.sqrt(dx * dx + dz * dz) < effect.area;
              });

            for (const zombie of poolZombies) {
              this.game.zombieManager.damageZombie(zombie, effect.damage);

              // Apply slow (temporarily reduce zombie speed)
              if (!zombie.originalSpeed) {
                zombie.originalSpeed = zombie.speed;
              }
              zombie.speed =
                zombie.originalSpeed * (1 - (effect.slowAmount || 0.5));

              // Reset speed after leaving
              zombie.slowTimeout = setTimeout(() => {
                if (zombie.originalSpeed) {
                  zombie.speed = zombie.originalSpeed;
                  zombie.originalSpeed = null;
                }
              }, 500);
            }
          }

          // Pulsing effect + bubbles animation
          const poolPulse = 0.8 + Math.sin(effect.elapsed * 3) * 0.2;
          const poolFade = 1 - effect.elapsed / effect.duration;

          effect.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
              if (child.material.transparent) {
                // Don't fully overwrite opacity, multiply by original so bubbles stay bright
                const baseOpacity =
                  child.material.opacity / (poolPulse * poolFade * 0.7 + 0.01);
                child.material.opacity = Math.min(
                  1.0,
                  baseOpacity * poolPulse * poolFade,
                );
              }
            }
          });

          if (effect.bubbles) {
            effect.bubbles.forEach((bubbleData) => {
              bubbleData.mesh.position.y += 0.02 * bubbleData.speed;
              if (bubbleData.mesh.position.y > 2.0) {
                bubbleData.mesh.position.y = bubbleData.startY;
              }
            });
          }
          break;
      }
    }
  }

  disposeObject(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry && !child.geometry.userData?.shared) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (!mat.userData?.shared) mat.dispose();
            });
          } else {
            if (!child.material.userData?.shared) child.material.dispose();
          }
        }
      }
    });
  }

  removeProjectile(index, explode = false) {
    const proj = this.projectiles[index];

    // Safety check - projectile may have already been removed
    if (!proj || !proj.mesh) {
      return;
    }

    if (explode && proj.explosionRadius) {
      // Create explosion
      this.createExplosion(
        proj.mesh.position,
        proj.explosionRadius,
        proj.damage,
      );
    }

    this.game.scene.remove(proj.mesh);
    this.disposeObject(proj.mesh);
    this.projectiles.splice(index, 1);
  }

  createExplosion(position, radius, damage) {
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);

    // White-hot core flash
    const coreGeometry = new THREE.SphereGeometry(radius * 0.3, 12, 12);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    explosionGroup.add(core);

    // Yellow inner fireball
    const yellowGeometry = new THREE.SphereGeometry(radius * 0.5, 12, 12);
    const yellowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.9,
    });
    const yellow = new THREE.Mesh(yellowGeometry, yellowMaterial);
    explosionGroup.add(yellow);

    // Orange main fireball
    const orangeGeometry = new THREE.SphereGeometry(radius * 0.8, 12, 12);
    const orangeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
    });
    const orange = new THREE.Mesh(orangeGeometry, orangeMaterial);
    explosionGroup.add(orange);

    // Red outer fire
    const redGeometry = new THREE.SphereGeometry(radius, 12, 12);
    const redMaterial = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      transparent: true,
      opacity: 0.6,
    });
    const red = new THREE.Mesh(redGeometry, redMaterial);
    explosionGroup.add(red);

    // Dark smoke ring
    const smokeGeometry = new THREE.TorusGeometry(
      radius * 0.8,
      radius * 0.3,
      8,
      16,
    );
    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.5,
    });
    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.rotation.x = Math.PI / 2;
    explosionGroup.add(smoke);

    // Flying fire embers/sparks
    const embers = [];
    for (let i = 0; i < 12; i++) {
      const emberGeometry = new THREE.SphereGeometry(0.15, 4, 4);
      const emberMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffaa00 : 0xff4400,
      });
      const ember = new THREE.Mesh(emberGeometry, emberMaterial);
      const angle = (i / 12) * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.2;
      ember.userData = {
        vx: Math.cos(angle) * speed,
        vy: 0.15 + Math.random() * 0.1,
        vz: Math.sin(angle) * speed,
      };
      explosionGroup.add(ember);
      embers.push(ember);
    }

    // Flame tongues shooting upward
    const flameTongues = [];
    for (let i = 0; i < 6; i++) {
      const tongueGeometry = new THREE.ConeGeometry(0.2, radius * 0.8, 6);
      const tongueMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff6600 : 0xff4400,
        transparent: true,
        opacity: 0.9,
      });
      const tongue = new THREE.Mesh(tongueGeometry, tongueMaterial);
      const angle = (i / 6) * Math.PI * 2;
      tongue.position.set(
        Math.cos(angle) * radius * 0.4,
        0,
        Math.sin(angle) * radius * 0.4,
      );
      tongue.rotation.z = (Math.random() - 0.5) * 0.5;
      explosionGroup.add(tongue);
      flameTongues.push(tongue);
    }

    this.game.scene.add(explosionGroup);

    // Point light for dramatic lighting
    const light = new THREE.PointLight(0xff6600, 80, radius * 3);
    light.position.copy(position);
    this.game.scene.add(light);

    // Damage enemies in radius
    this.game.zombieManager.damageInRadius(position, radius, damage);

    // Animate explosion
    let scale = 0.1;
    let opacity = 1;
    let frame = 0;

    const animate = () => {
      frame++;
      scale += 0.12;
      opacity -= 0.04;

      if (opacity <= 0) {
        this.game.scene.remove(explosionGroup);
        this.game.scene.remove(light);
        this.disposeObject(explosionGroup);
        light.dispose();
      } else {
        // Scale up the fire layers
        core.scale.setScalar(scale * 0.8);
        yellow.scale.setScalar(scale * 0.9);
        orange.scale.setScalar(scale);
        red.scale.setScalar(scale * 1.1);
        smoke.scale.setScalar(scale * 1.2);

        // Fade out
        coreMaterial.opacity = opacity;
        yellowMaterial.opacity = opacity * 0.9;
        orangeMaterial.opacity = opacity * 0.8;
        redMaterial.opacity = opacity * 0.6;
        smokeMaterial.opacity = opacity * 0.4;

        // Animate embers flying outward
        embers.forEach((ember) => {
          ember.position.x += ember.userData.vx;
          ember.position.y += ember.userData.vy;
          ember.position.z += ember.userData.vz;
          ember.userData.vy -= 0.01; // Gravity
        });

        // Animate flame tongues rising
        flameTongues.forEach((tongue, i) => {
          tongue.position.y += 0.1;
          tongue.scale.y = 1 + frame * 0.1;
          tongue.material.opacity = opacity;
        });

        // Animate light
        light.intensity = opacity * 80;

        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    this.game.audioManager.playSound("explosion");
  }

  getEquippedWeapons() {
    return this.equippedWeapons;
  }

  // === NEW WEAPON FIRING METHODS ===

  // Bone - bounces between enemies
  fireBone(stats, playerPos, zombies, scale = 1) {
    if (zombies.length === 0) return;

    for (let i = 0; i < stats.projectileCount; i++) {
      const targetIndex = i % zombies.length;
      const target = zombies[targetIndex];
      const direction = new THREE.Vector3();
      direction.subVectors(target.mesh.position, playerPos);
      direction.y = 0;
      direction.normalize();

      // Create bone mesh
      const group = new THREE.Group();

      // Main bone shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1 * scale, 0.08 * scale, 0.8 * scale, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffe0 }),
      );
      shaft.rotation.z = Math.PI / 2;
      group.add(shaft);

      // Bone ends (knobs)
      const endMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const leftEnd = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 6, 6),
        endMat,
      );
      leftEnd.position.x = -0.4 * scale;
      group.add(leftEnd);

      const rightEnd = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 6, 6),
        endMat,
      );
      rightEnd.position.x = 0.4 * scale;
      group.add(rightEnd);

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "bone",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        bounceCount: stats.bounceCount || 3,
        area: stats.area,
        duration: stats.duration,
        elapsed: 0,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("throw");
  }

  // Magic Missile - homing projectiles
  fireMagicMissile(stats, playerPos, zombies, scale = 1) {
    for (let i = 0; i < stats.projectileCount; i++) {
      // Random initial direction
      const angle =
        (i / stats.projectileCount) * Math.PI * 2 + Math.random() * 0.5;
      const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

      // Create glowing missile
      const group = new THREE.Group();

      // Core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 * scale, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaaff }),
      );
      group.add(core);

      // Glow trail
      const trail = new THREE.Mesh(
        new THREE.ConeGeometry(0.15 * scale, 0.6 * scale, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.6,
        }),
      );
      trail.rotation.x = Math.PI / 2;
      trail.position.z = -0.3 * scale;
      group.add(trail);

      // Outer glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 * scale, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xdd88ff,
          transparent: true,
          opacity: 0.4,
        }),
      );
      group.add(glow);

      group.position.copy(playerPos);
      group.position.y = 1;
      this.game.scene.add(group);

      this.projectiles.push({
        type: "magicMissile",
        mesh: group,
        direction: direction,
        speed: stats.projectileSpeed,
        damage: stats.damage,
        pierce: stats.pierce || 0,
        duration: stats.duration,
        elapsed: 0,
        homing: true,
        homingStrength: stats.homingStrength || 2,
        hitEnemies: new Set(),
      });
    }

    this.game.audioManager.playSound("shoot");
  }

  // Orbiting birds (Peachone and Ebony Wings)
  fireOrbitingBird(stats, playerPos, type, scale = 1) {
    // Check if birds already exist for this type
    const existingBirds = this.projectiles.filter((p) => p.type === type);
    if (existingBirds.length >= stats.projectileCount) {
      // Update existing birds instead of creating new ones
      return;
    }

    const needed = stats.projectileCount - existingBirds.length;
    const isEbony = type === "ebonyWings";

    for (let i = 0; i < needed; i++) {
      const angle =
        ((existingBirds.length + i) / stats.projectileCount) * Math.PI * 2;

      // Create bird mesh
      const group = new THREE.Group();

      // Body
      const bodyColor = isEbony ? 0x111122 : 0xffffff;
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 * scale, 8, 8),
        new THREE.MeshBasicMaterial({ color: bodyColor }),
      );
      body.scale.set(1, 0.8, 1.5);
      group.add(body);

      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 * scale, 8, 8),
        new THREE.MeshBasicMaterial({ color: bodyColor }),
      );
      head.position.set(0, 0.1 * scale, 0.3 * scale);
      group.add(head);

      // Beak
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.05 * scale, 0.15 * scale, 4),
        new THREE.MeshBasicMaterial({ color: isEbony ? 0x440044 : 0xffaa00 }),
      );
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 0.1 * scale, 0.45 * scale);
      group.add(beak);

      // Wings
      const wingColor = isEbony ? 0x220033 : 0xddddff;
      const wingMat = new THREE.MeshBasicMaterial({
        color: wingColor,
        transparent: true,
        opacity: 0.9,
      });
      const leftWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 * scale, 0.05 * scale, 0.3 * scale),
        wingMat,
      );
      leftWing.position.set(-0.3 * scale, 0, 0);
      leftWing.rotation.z = -0.3;
      group.add(leftWing);

      const rightWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 * scale, 0.05 * scale, 0.3 * scale),
        wingMat,
      );
      rightWing.position.set(0.3 * scale, 0, 0);
      rightWing.rotation.z = 0.3;
      group.add(rightWing);

      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({
        color: isEbony ? 0xff0000 : 0x000000,
      });
      const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 * scale, 4, 4),
        eyeMat,
      );
      leftEye.position.set(-0.06 * scale, 0.15 * scale, 0.38 * scale);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 * scale, 4, 4),
        eyeMat,
      );
      rightEye.position.set(0.06 * scale, 0.15 * scale, 0.38 * scale);
      group.add(rightEye);

      // Glow
      const glowColor = isEbony ? 0x440066 : 0xffffaa;
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 * scale, 8, 8),
        new THREE.MeshBasicMaterial({
          color: glowColor,
          transparent: true,
          opacity: 0.3,
        }),
      );
      group.add(glow);

      const orbitRadius = stats.orbitRadius || 3;
      group.position.copy(playerPos);
      group.position.x += Math.cos(angle) * orbitRadius;
      group.position.z += Math.sin(angle) * orbitRadius;
      group.position.y = 1.5;

      this.game.scene.add(group);

      this.projectiles.push({
        type: type,
        mesh: group,
        angle: angle,
        orbitRadius: orbitRadius,
        orbitSpeed: stats.orbitSpeed || 2,
        damage: stats.damage,
        area: stats.area,
        duration: Infinity, // Birds don't expire
        elapsed: 0,
        hitCooldowns: {},
        wingAngle: 0,
        leftWing: leftWing,
        rightWing: rightWing,
      });
    }
  }

  // Pentagram - screen clear
  firePentagram(stats, playerPos, scale = 1) {
    // Create massive glowing pentagram effect
    const group = new THREE.Group();

    // Base glowing circle
    const circle = new THREE.Mesh(
      new THREE.RingGeometry(stats.area * 0.9, stats.area, 64),
      new THREE.MeshBasicMaterial({
        color: 0xff0044,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    circle.rotation.x = -Math.PI / 2;
    group.add(circle);

    // Inner filled glow
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area, 64),
      new THREE.MeshBasicMaterial({
        color: 0xff0022,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    group.add(glow);

    // Draw the 5-pointed star lines using tube geometry for thickness
    const points = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * stats.area,
          0,
          Math.sin(angle) * stats.area,
        ),
      );
    }
    const starOrder = [0, 2, 4, 1, 3, 0];
    const linePoints = starOrder.map((i) => points[i]);
    const curve = new THREE.CatmullRomCurve3(linePoints, false, "chordal");

    const starLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.5, 8, false),
      new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(starLine);

    group.position.copy(playerPos);
    group.position.y = 0.1;
    group.scale.setScalar(0.1);

    this.game.scene.add(group);

    // Kill all enemies in range
    const zombies = [...this.game.zombieManager.getZombies()];
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        this.game.zombieManager.damageZombie(zombie, stats.damage, null, true);
      }
    }

    // Screen effects
    if (this.game.screenShake) this.game.screenShake(1.5, 0.6);
    if (this.game.pulseBloom) this.game.pulseBloom(0.6, 4);

    // Animate expansion and fade
    let groupScale = 0.1;
    let opacity = 1.0;
    const animate = () => {
      groupScale += 0.1;
      opacity -= 0.02;

      if (opacity <= 0) {
        this.game.scene.remove(group);
        this.disposeObject(group);
      } else {
        group.scale.setScalar(groupScale);
        circle.material.opacity = opacity * 0.8;
        glow.material.opacity = opacity * 0.3;
        starLine.material.opacity = opacity * 0.9;
        group.rotation.y += 0.05;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    this.game.audioManager.playSound("explosion");
  }

  // Clock Lancet - freeze enemies
  fireClockLancet(stats, playerPos, zombies, scale = 1) {
    // Create clock visual
    const group = new THREE.Group();

    // Clock face
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(stats.area, 32),
      new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    face.rotation.x = -Math.PI / 2;
    group.add(face);

    // Clock hands
    const handMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hourHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.02, stats.area * 0.5),
      handMat,
    );
    hourHand.position.z = stats.area * 0.25;
    group.add(hourHand);

    const minuteHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, stats.area * 0.7),
      handMat,
    );
    minuteHand.position.z = stats.area * 0.35;
    minuteHand.rotation.y = Math.PI / 3;
    group.add(minuteHand);

    // Roman numerals (simplified - just marks)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.02, 0.3),
        handMat,
      );
      mark.position.set(
        Math.sin(angle) * stats.area * 0.85,
        0.01,
        Math.cos(angle) * stats.area * 0.85,
      );
      mark.rotation.y = angle;
      group.add(mark);
    }

    group.position.copy(playerPos);
    group.position.y = 0.1;

    this.game.scene.add(group);

    // Freeze enemies in range
    const freezeDuration = stats.freezeDuration || 1.0;
    for (const zombie of zombies) {
      const dist = zombie.mesh.position.distanceTo(playerPos);
      if (dist < stats.area) {
        // Store original speed and freeze
        if (!zombie.originalSpeed) {
          zombie.originalSpeed = zombie.speed;
        }
        zombie.speed = 0;
        zombie.isFrozen = true;

        // Visual freeze effect
        zombie.mesh.traverse((child) => {
          if (child.material && child.material.color) {
            child.userData.originalColor = child.material.color.getHex();
            child.material.color.setHex(0x88ccff);
          }
        });

        // Unfreeze after duration
        setTimeout(() => {
          if (zombie.originalSpeed) {
            zombie.speed = zombie.originalSpeed;
            zombie.isFrozen = false;
            // Restore color
            zombie.mesh.traverse((child) => {
              if (child.material && child.userData.originalColor) {
                child.material.color.setHex(child.userData.originalColor);
              }
            });
          }
        }, freezeDuration * 1000);
      }
    }

    // Animate clock fade
    this.effects.push({
      type: "clockLancet",
      mesh: group,
      duration: 0.5,
      elapsed: 0,
    });

    this.game.audioManager.playSound("lightning");
  }
}
