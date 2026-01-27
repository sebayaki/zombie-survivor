// Enhanced Particle System for spectacular visual effects
import * as THREE from "three";

// Particle presets for different effects
const PARTICLE_PRESETS = {
  // XP gem collection sparkles
  xpCollect: {
    count: 12,
    colors: [0x00aaff, 0x00ffff, 0xffffff],
    size: { min: 0.05, max: 0.15 },
    speed: { min: 2, max: 5 },
    gravity: -5,
    lifetime: 0.6,
    spread: 0.5,
    upward: true,
  },

  // Level up celebration
  levelUp: {
    count: 50,
    colors: [0xffcc00, 0xffffff, 0xff8800],
    size: { min: 0.1, max: 0.25 },
    speed: { min: 3, max: 8 },
    gravity: -3,
    lifetime: 1.5,
    spread: 3,
    upward: true,
    ring: true,
  },

  // Enemy death particles
  enemyDeath: {
    count: 20,
    colors: [0x44ff44, 0x228822, 0x115511],
    size: { min: 0.08, max: 0.2 },
    speed: { min: 3, max: 7 },
    gravity: 15,
    lifetime: 0.8,
    spread: 1.5,
    upward: false,
  },

  // Boss death explosion
  bossDeath: {
    count: 100,
    colors: [0xff0088, 0x8800ff, 0xffffff, 0x000000],
    size: { min: 0.15, max: 0.4 },
    speed: { min: 5, max: 15 },
    gravity: 10,
    lifetime: 2.0,
    spread: 5,
    upward: false,
  },

  // Fire/explosion particles
  fire: {
    count: 30,
    colors: [0xffffff, 0xffff00, 0xff8800, 0xff4400, 0xff0000],
    size: { min: 0.1, max: 0.3 },
    speed: { min: 2, max: 6 },
    gravity: -8, // Rise up
    lifetime: 0.8,
    spread: 1,
    upward: true,
    fadeToBlack: true,
  },

  // Electric/lightning sparks
  electric: {
    count: 25,
    colors: [0xffffff, 0x88ffff, 0x0088ff],
    size: { min: 0.05, max: 0.12 },
    speed: { min: 8, max: 15 },
    gravity: 0,
    lifetime: 0.3,
    spread: 2,
    upward: false,
    streak: true,
  },

  // Heal effect
  heal: {
    count: 15,
    colors: [0x00ff00, 0x88ff88, 0xffffff],
    size: { min: 0.1, max: 0.2 },
    speed: { min: 1, max: 3 },
    gravity: -3,
    lifetime: 1.0,
    spread: 1,
    upward: true,
  },

  // Blood splatter
  blood: {
    count: 15,
    colors: [0xff0000, 0xaa0000, 0x880000],
    size: { min: 0.08, max: 0.18 },
    speed: { min: 3, max: 8 },
    gravity: 20,
    lifetime: 0.6,
    spread: 1.5,
    upward: false,
  },

  // Evolution sparkles
  evolution: {
    count: 80,
    colors: [0xffdd00, 0xffffff, 0xff00ff, 0x00ffff],
    size: { min: 0.1, max: 0.3 },
    speed: { min: 2, max: 8 },
    gravity: -2,
    lifetime: 2.0,
    spread: 3,
    upward: true,
    spiral: true,
  },

  // Treasure chest opening
  treasure: {
    count: 40,
    colors: [0xffdd00, 0xffffff, 0xff8800],
    size: { min: 0.08, max: 0.2 },
    speed: { min: 4, max: 10 },
    gravity: 5,
    lifetime: 1.2,
    spread: 2,
    upward: true,
  },
};

export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.trailParticles = []; // For continuous trails

    // Shared geometries for performance
    this.sphereGeometry = new THREE.SphereGeometry(1, 6, 6);
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  }

  // Spawn particles at a position with a preset
  spawn(position, presetName, options = {}) {
    const preset = PARTICLE_PRESETS[presetName];
    if (!preset) {
      console.warn(`Unknown particle preset: ${presetName}`);
      return;
    }

    const count = options.count || preset.count;
    const scale = options.scale || 1;

    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(preset, position, scale, i, count);
      this.particles.push(particle);
      this.game.scene.add(particle.mesh);
    }
  }

  createParticle(preset, position, scale, index, total) {
    // Random color from preset
    const color = preset.colors[Math.floor(Math.random() * preset.colors.length)];

    // Random size
    const size =
      (preset.size.min + Math.random() * (preset.size.max - preset.size.min)) * scale;

    // Create mesh
    const geometry = preset.streak ? this.boxGeometry : this.sphereGeometry;
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(size);

    if (preset.streak) {
      mesh.scale.set(size * 0.3, size * 0.3, size * 3);
    }

    // Position
    mesh.position.copy(position);

    // Velocity calculation
    let velocity;
    if (preset.ring) {
      // Ring pattern
      const angle = (index / total) * Math.PI * 2;
      velocity = new THREE.Vector3(
        Math.cos(angle) * preset.speed.max,
        preset.speed.min + Math.random() * 2,
        Math.sin(angle) * preset.speed.max
      );
    } else if (preset.spiral) {
      // Spiral pattern
      const angle = (index / total) * Math.PI * 6; // Multiple rotations
      const height = (index / total) * 3;
      const radius = 0.5 + (index / total) * 2;
      velocity = new THREE.Vector3(
        Math.cos(angle) * radius * 2,
        preset.speed.min + height,
        Math.sin(angle) * radius * 2
      );
    } else {
      // Random spread
      const speed = preset.speed.min + Math.random() * (preset.speed.max - preset.speed.min);
      if (preset.upward) {
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * preset.spread * 2,
          speed * (0.5 + Math.random() * 0.5),
          (Math.random() - 0.5) * preset.spread * 2
        );
      } else {
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 0.5 + 0.5,
          (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(speed);
      }
    }

    return {
      mesh,
      velocity,
      gravity: preset.gravity,
      lifetime: preset.lifetime,
      elapsed: 0,
      fadeToBlack: preset.fadeToBlack,
      originalColor: color,
      streak: preset.streak,
    };
  }

  // Create a continuous particle trail (for projectiles, etc.)
  createTrail(getPosition, preset, interval = 0.05) {
    const trail = {
      getPosition,
      preset: PARTICLE_PRESETS[preset] || PARTICLE_PRESETS.fire,
      interval,
      lastSpawn: 0,
      active: true,
    };
    this.trailParticles.push(trail);
    return trail;
  }

  // Stop a trail
  stopTrail(trail) {
    trail.active = false;
  }

  update(delta) {
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.elapsed += delta;

      // Apply velocity
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Apply gravity
      particle.velocity.y -= particle.gravity * delta;

      // Ground collision
      if (particle.mesh.position.y < 0.1) {
        particle.mesh.position.y = 0.1;
        particle.velocity.y *= -0.3; // Bounce
        particle.velocity.x *= 0.8;
        particle.velocity.z *= 0.8;
      }

      // Rotation for visual interest
      particle.mesh.rotation.x += delta * 5;
      particle.mesh.rotation.y += delta * 3;

      // If streak, point in direction of movement
      if (particle.streak) {
        particle.mesh.lookAt(
          particle.mesh.position.clone().add(particle.velocity)
        );
      }

      // Fade out
      const lifeProgress = particle.elapsed / particle.lifetime;
      particle.mesh.material.opacity = Math.max(0, 1 - lifeProgress);

      // Color fade (for fire particles)
      if (particle.fadeToBlack) {
        const color = new THREE.Color(particle.originalColor);
        color.lerp(new THREE.Color(0x111111), lifeProgress);
        particle.mesh.material.color = color;
      }

      // Size shrink
      const originalScale = particle.mesh.scale.x;
      particle.mesh.scale.setScalar(originalScale * (1 - lifeProgress * 0.5));

      // Remove dead particles
      if (particle.elapsed >= particle.lifetime) {
        this.game.scene.remove(particle.mesh);
        particle.mesh.geometry = null;
        particle.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Update trails
    const now = performance.now() / 1000;
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const trail = this.trailParticles[i];

      if (!trail.active) {
        this.trailParticles.splice(i, 1);
        continue;
      }

      if (now - trail.lastSpawn >= trail.interval) {
        trail.lastSpawn = now;
        const pos = trail.getPosition();
        if (pos) {
          // Spawn reduced count for trails
          for (let j = 0; j < 3; j++) {
            const particle = this.createParticle(trail.preset, pos, 0.5, j, 3);
            this.particles.push(particle);
            this.game.scene.add(particle.mesh);
          }
        }
      }
    }
  }

  // Special effect: Shockwave ring
  createShockwave(position, radius, color = 0xffffff, duration = 0.5) {
    const geometry = new THREE.RingGeometry(0.1, 0.3, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;

    this.game.scene.add(ring);

    // Animate expansion
    let elapsed = 0;
    const animate = () => {
      elapsed += 0.016;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.game.scene.remove(ring);
        geometry.dispose();
        material.dispose();
        return;
      }

      const currentRadius = radius * progress;
      ring.scale.setScalar(currentRadius * 10);
      material.opacity = 0.8 * (1 - progress);

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // Special effect: Rising text (damage numbers, etc.)
  createFloatingText(position, text, color = 0xffffff, size = 0.5) {
    // Create canvas texture
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 1;
    sprite.scale.set(size * 2, size, 1);

    this.game.scene.add(sprite);

    // Animate rising and fading
    let elapsed = 0;
    const duration = 1.0;
    const animate = () => {
      elapsed += 0.016;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.game.scene.remove(sprite);
        texture.dispose();
        material.dispose();
        return;
      }

      sprite.position.y += 0.02;
      material.opacity = 1 - progress;

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // Special effect: Impact flash
  createImpactFlash(position, color = 0xffffff, size = 1) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
    });
    const flash = new THREE.Mesh(geometry, material);
    flash.position.copy(position);

    this.game.scene.add(flash);

    // Quick flash and fade
    let scale = 1;
    const animate = () => {
      scale += 0.3;
      material.opacity -= 0.15;

      if (material.opacity <= 0) {
        this.game.scene.remove(flash);
        geometry.dispose();
        material.dispose();
        return;
      }

      flash.scale.setScalar(scale);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  reset() {
    // Clean up all particles
    for (const particle of this.particles) {
      this.game.scene.remove(particle.mesh);
      if (particle.mesh.material) {
        particle.mesh.material.dispose();
      }
    }
    this.particles = [];
    this.trailParticles = [];
  }
}
