// Enhanced Particle System for spectacular visual effects
import * as THREE from "three";

// Particle presets for different effects
const PARTICLE_PRESETS = {
  xpCollect: {
    count: 6,
    colors: [0x00aaff, 0x00ffff, 0xffffff],
    size: { min: 0.04, max: 0.1 },
    speed: { min: 2, max: 4 },
    gravity: -5,
    lifetime: 0.5,
    spread: 0.4,
    upward: true,
  },

  levelUp: {
    count: 25,
    colors: [0xffcc00, 0xffffff, 0xff8800],
    size: { min: 0.08, max: 0.18 },
    speed: { min: 3, max: 6 },
    gravity: -3,
    lifetime: 1.2,
    spread: 2.5,
    upward: true,
    ring: true,
  },

  enemyDeath: {
    count: 8,
    colors: [0x44ff44, 0x228822, 0x115511],
    size: { min: 0.06, max: 0.14 },
    speed: { min: 2, max: 5 },
    gravity: 15,
    lifetime: 0.5,
    spread: 1.0,
    upward: false,
  },

  bossDeath: {
    count: 40,
    colors: [0xff0088, 0x8800ff, 0xffffff, 0x000000],
    size: { min: 0.1, max: 0.3 },
    speed: { min: 4, max: 12 },
    gravity: 10,
    lifetime: 1.5,
    spread: 4,
    upward: false,
  },

  fire: {
    count: 12,
    colors: [0xffffff, 0xffff00, 0xff8800, 0xff4400, 0xff0000],
    size: { min: 0.06, max: 0.18 },
    speed: { min: 2, max: 5 },
    gravity: -8,
    lifetime: 0.6,
    spread: 0.8,
    upward: true,
    fadeToBlack: true,
  },

  electric: {
    count: 10,
    colors: [0xffffff, 0x88ffff, 0x0088ff],
    size: { min: 0.04, max: 0.08 },
    speed: { min: 6, max: 12 },
    gravity: 0,
    lifetime: 0.25,
    spread: 1.5,
    upward: false,
    streak: true,
  },

  heal: {
    count: 8,
    colors: [0x00ff00, 0x88ff88, 0xffffff],
    size: { min: 0.08, max: 0.15 },
    speed: { min: 1, max: 3 },
    gravity: -3,
    lifetime: 0.8,
    spread: 0.8,
    upward: true,
  },

  blood: {
    count: 8,
    colors: [0xff0000, 0xaa0000, 0x880000],
    size: { min: 0.05, max: 0.12 },
    speed: { min: 2, max: 6 },
    gravity: 20,
    lifetime: 0.4,
    spread: 1.0,
    upward: false,
  },

  hitSpark: {
    count: 4,
    colors: [0xffffff, 0xffffaa, 0xffcc00],
    size: { min: 0.04, max: 0.1 },
    speed: { min: 4, max: 10 },
    gravity: 8,
    lifetime: 0.2,
    spread: 1.5,
    upward: false,
    streak: true,
  },

  critSpark: {
    count: 8,
    colors: [0xffffff, 0xffaa00, 0xff4400],
    size: { min: 0.06, max: 0.18 },
    speed: { min: 8, max: 15 },
    gravity: 8,
    lifetime: 0.3,
    spread: 2,
    upward: false,
    streak: true,
  },

  evolution: {
    count: 35,
    colors: [0xffdd00, 0xffffff, 0xff00ff, 0x00ffff],
    size: { min: 0.08, max: 0.2 },
    speed: { min: 2, max: 6 },
    gravity: -2,
    lifetime: 1.5,
    spread: 2.5,
    upward: true,
    spiral: true,
  },

  treasure: {
    count: 18,
    colors: [0xffdd00, 0xffffff, 0xff8800],
    size: { min: 0.06, max: 0.15 },
    speed: { min: 3, max: 8 },
    gravity: 5,
    lifetime: 1.0,
    spread: 1.5,
    upward: true,
  },
};

const _pColor = new THREE.Color();
const _pBlack = new THREE.Color(0x111111);
const _pLookAt = new THREE.Vector3();

export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.trailParticles = [];
    this.maxParticles = 300;

    // Shared geometries for performance
    this.sphereGeometry = new THREE.SphereGeometry(1, 6, 6);
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  }

  spawn(position, presetName, options = {}) {
    const preset = PARTICLE_PRESETS[presetName];
    if (!preset) return;

    // Cap total particles to prevent performance death spiral
    if (this.particles.length >= this.maxParticles) return;

    const count = Math.min(
      options.count || preset.count,
      this.maxParticles - this.particles.length,
    );
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
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.elapsed += delta;

      // Apply velocity (inline, no clone)
      particle.mesh.position.x += particle.velocity.x * delta;
      particle.mesh.position.y += particle.velocity.y * delta;
      particle.mesh.position.z += particle.velocity.z * delta;

      // Apply gravity
      particle.velocity.y -= particle.gravity * delta;

      // Ground collision
      if (particle.mesh.position.y < 0.1) {
        particle.mesh.position.y = 0.1;
        particle.velocity.y *= -0.3;
        particle.velocity.x *= 0.8;
        particle.velocity.z *= 0.8;
      }

      // Rotation for visual interest
      particle.mesh.rotation.x += delta * 5;
      particle.mesh.rotation.y += delta * 3;

      // If streak, point in direction of movement
      if (particle.streak) {
        _pLookAt.set(
          particle.mesh.position.x + particle.velocity.x,
          particle.mesh.position.y + particle.velocity.y,
          particle.mesh.position.z + particle.velocity.z,
        );
        particle.mesh.lookAt(_pLookAt);
      }

      // Fade out
      const lifeProgress = particle.elapsed / particle.lifetime;
      particle.mesh.material.opacity = Math.max(0, 1 - lifeProgress);

      // Color fade (for fire particles) - reuse temp Color
      if (particle.fadeToBlack) {
        _pColor.set(particle.originalColor);
        _pColor.lerp(_pBlack, lifeProgress);
        particle.mesh.material.color.copy(_pColor);
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
          for (let j = 0; j < 2; j++) {
            const particle = this.createParticle(trail.preset, pos, 0.4, j, 2);
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
  createFloatingText(position, text, color = 0xffffff, size = 0.5, isCrit = false) {
    // Create canvas texture
    const canvas = document.createElement("canvas");
    canvas.width = 256; // Increased resolution
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Text style
    ctx.font = isCrit ? "bold 72px 'Impact', Arial" : "bold 56px 'Impact', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Stroke/Outline for better visibility
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = isCrit ? 8 : 5;
    ctx.strokeText(text, 128, 64);

    // Fill color
    ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter; // Better text rendering
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 1;
    
    // Initial pop scale
    const baseSize = size * (isCrit ? 3 : 2);
    sprite.scale.set(baseSize * 0.5, baseSize * 0.25, 1);

    this.game.scene.add(sprite);

    // Animate punchy rising and fading
    let elapsed = 0;
    const duration = isCrit ? 0.8 : 0.6;
    
    // Random drift
    const driftX = (Math.random() - 0.5) * 0.05;
    const driftZ = (Math.random() - 0.5) * 0.05;

    const animate = () => {
      elapsed += 0.016;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.game.scene.remove(sprite);
        texture.dispose();
        material.dispose();
        return;
      }

      // Pop effect: scale up quickly, then settle
      if (progress < 0.2) {
        const popProgress = progress / 0.2;
        const currentSize = baseSize * (0.5 + 0.7 * popProgress); // scale from 0.5 to 1.2
        sprite.scale.set(currentSize, currentSize * 0.5, 1);
      } else {
        const settleProgress = (progress - 0.2) / 0.8;
        const currentSize = baseSize * (1.2 - 0.2 * settleProgress); // settle to 1.0
        sprite.scale.set(currentSize, currentSize * 0.5, 1);
      }

      sprite.position.x += driftX;
      sprite.position.z += driftZ;
      sprite.position.y += isCrit ? 0.04 : 0.02;
      
      // Fade out at the end
      if (progress > 0.6) {
        material.opacity = 1 - (progress - 0.6) / 0.4;
      }

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  createImpactFlash(position, color = 0xffffff, size = 1) {
    const geometry = new THREE.SphereGeometry(size * 0.6, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
    });
    const flash = new THREE.Mesh(geometry, material);
    flash.position.copy(position);

    this.game.scene.add(flash);

    let scale = 1;
    const animate = () => {
      scale += 0.25;
      material.opacity -= 0.18;

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
