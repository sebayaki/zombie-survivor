import * as THREE from "three";

const PARTICLE_PRESETS = {
  xpCollect: {
    count: 3, colors: [0x00aaff, 0x00ffff],
    size: { min: 0.03, max: 0.07 }, speed: { min: 2, max: 3 },
    gravity: -5, lifetime: 0.35, spread: 0.3, upward: true,
  },
  levelUp: {
    count: 18, colors: [0xffcc00, 0xffffff, 0xff8800],
    size: { min: 0.08, max: 0.18 }, speed: { min: 3, max: 6 },
    gravity: -3, lifetime: 1.0, spread: 2.5, upward: true, ring: true,
  },
  enemyDeath: {
    count: 4, colors: [0x44ff44, 0x228822],
    size: { min: 0.05, max: 0.1 }, speed: { min: 2, max: 4 },
    gravity: 15, lifetime: 0.35, spread: 0.8, upward: false,
  },
  bossDeath: {
    count: 25, colors: [0xff0088, 0x8800ff, 0xffffff, 0x000000],
    size: { min: 0.1, max: 0.3 }, speed: { min: 4, max: 12 },
    gravity: 10, lifetime: 1.2, spread: 4, upward: false,
  },
  fire: {
    count: 6, colors: [0xffff00, 0xff8800, 0xff4400, 0xff0000],
    size: { min: 0.05, max: 0.14 }, speed: { min: 2, max: 4 },
    gravity: -8, lifetime: 0.4, spread: 0.6, upward: true, fadeToBlack: true,
  },
  electric: {
    count: 5, colors: [0xffffff, 0x88ffff, 0x0088ff],
    size: { min: 0.03, max: 0.06 }, speed: { min: 6, max: 10 },
    gravity: 0, lifetime: 0.2, spread: 1.2, upward: false, streak: true,
  },
  heal: {
    count: 5, colors: [0x00ff00, 0x88ff88],
    size: { min: 0.06, max: 0.12 }, speed: { min: 1, max: 3 },
    gravity: -3, lifetime: 0.6, spread: 0.6, upward: true,
  },
  blood: {
    count: 4, colors: [0xff0000, 0xaa0000, 0x880000],
    size: { min: 0.04, max: 0.1 }, speed: { min: 2, max: 5 },
    gravity: 20, lifetime: 0.3, spread: 0.8, upward: false,
  },
  hitSpark: {
    count: 2, colors: [0xffffff, 0xffcc00],
    size: { min: 0.03, max: 0.07 }, speed: { min: 4, max: 8 },
    gravity: 8, lifetime: 0.15, spread: 1.0, upward: false, streak: true,
  },
  critSpark: {
    count: 5, colors: [0xffffff, 0xffaa00, 0xff4400],
    size: { min: 0.05, max: 0.15 }, speed: { min: 8, max: 14 },
    gravity: 8, lifetime: 0.25, spread: 1.5, upward: false, streak: true,
  },
  evolution: {
    count: 25, colors: [0xffdd00, 0xffffff, 0xff00ff, 0x00ffff],
    size: { min: 0.08, max: 0.2 }, speed: { min: 2, max: 6 },
    gravity: -2, lifetime: 1.2, spread: 2.5, upward: true, spiral: true,
  },
  treasure: {
    count: 12, colors: [0xffdd00, 0xffffff, 0xff8800],
    size: { min: 0.06, max: 0.15 }, speed: { min: 3, max: 8 },
    gravity: 5, lifetime: 0.8, spread: 1.5, upward: true,
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
    this.maxParticles = 180;

    this.sphereGeometry = new THREE.SphereGeometry(1, 6, 6);
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Mesh pools – meshes stay in the scene graph, toggled via visible
    this._spherePool = [];
    this._boxPool = [];
  }

  _acquireMesh(isStreak) {
    const pool = isStreak ? this._boxPool : this._spherePool;
    if (pool.length > 0) {
      const mesh = pool.pop();
      mesh.visible = true;
      return mesh;
    }
    const geo = isStreak ? this.boxGeometry : this.sphereGeometry;
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    this.game.scene.add(mesh);
    return mesh;
  }

  _releaseMesh(mesh, isStreak) {
    mesh.visible = false;
    const pool = isStreak ? this._boxPool : this._spherePool;
    pool.push(mesh);
  }

  spawn(position, presetName, options = {}) {
    const preset = PARTICLE_PRESETS[presetName];
    if (!preset) return;

    if (this.particles.length >= this.maxParticles) return;

    const count = Math.min(
      options.count || preset.count,
      this.maxParticles - this.particles.length,
    );
    const scale = options.scale || 1;

    for (let i = 0; i < count; i++) {
      const particle = this._createParticle(preset, position, scale, i, count);
      this.particles.push(particle);
    }
  }

  _createParticle(preset, position, scale, index, total) {
    const color =
      preset.colors[Math.floor(Math.random() * preset.colors.length)];

    const size =
      (preset.size.min +
        Math.random() * (preset.size.max - preset.size.min)) *
      scale;

    const mesh = this._acquireMesh(preset.streak);
    mesh.material.color.set(color);
    mesh.material.opacity = 1;
    mesh.scale.setScalar(size);

    if (preset.streak) {
      mesh.scale.set(size * 0.3, size * 0.3, size * 3);
    }

    mesh.position.copy(position);

    let vx, vy, vz;
    if (preset.ring) {
      const angle = (index / total) * Math.PI * 2;
      vx = Math.cos(angle) * preset.speed.max;
      vy = preset.speed.min + Math.random() * 2;
      vz = Math.sin(angle) * preset.speed.max;
    } else if (preset.spiral) {
      const angle = (index / total) * Math.PI * 6;
      const height = (index / total) * 3;
      const radius = 0.5 + (index / total) * 2;
      vx = Math.cos(angle) * radius * 2;
      vy = preset.speed.min + height;
      vz = Math.sin(angle) * radius * 2;
    } else {
      const speed =
        preset.speed.min +
        Math.random() * (preset.speed.max - preset.speed.min);
      if (preset.upward) {
        vx = (Math.random() - 0.5) * preset.spread * 2;
        vy = speed * (0.5 + Math.random() * 0.5);
        vz = (Math.random() - 0.5) * preset.spread * 2;
      } else {
        const rx = (Math.random() - 0.5) * 2;
        const ry = Math.random() * 0.5 + 0.5;
        const rz = (Math.random() - 0.5) * 2;
        const len = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
        vx = (rx / len) * speed;
        vy = (ry / len) * speed;
        vz = (rz / len) * speed;
      }
    }

    return {
      mesh,
      vx, vy, vz,
      gravity: preset.gravity,
      lifetime: preset.lifetime,
      elapsed: 0,
      fadeToBlack: preset.fadeToBlack,
      originalColor: color,
      streak: preset.streak || false,
      baseScale: size,
    };
  }

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

  stopTrail(trail) {
    trail.active = false;
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.elapsed += delta;

      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      p.vy -= p.gravity * delta;

      if (p.mesh.position.y < 0.1) {
        p.mesh.position.y = 0.1;
        p.vy *= -0.3;
        p.vx *= 0.8;
        p.vz *= 0.8;
      }

      p.mesh.rotation.x += delta * 5;
      p.mesh.rotation.y += delta * 3;

      if (p.streak) {
        _pLookAt.set(
          p.mesh.position.x + p.vx,
          p.mesh.position.y + p.vy,
          p.mesh.position.z + p.vz,
        );
        p.mesh.lookAt(_pLookAt);
      }

      const t = p.elapsed / p.lifetime;
      p.mesh.material.opacity = Math.max(0, 1 - t);

      if (p.fadeToBlack) {
        _pColor.set(p.originalColor);
        _pColor.lerp(_pBlack, t);
        p.mesh.material.color.copy(_pColor);
      }

      const shrink = p.baseScale * (1 - t * 0.5);
      if (p.streak) {
        p.mesh.scale.set(shrink * 0.3, shrink * 0.3, shrink * 3);
      } else {
        p.mesh.scale.setScalar(shrink);
      }

      if (p.elapsed >= p.lifetime) {
        this._releaseMesh(p.mesh, p.streak);
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
            const particle = this._createParticle(trail.preset, pos, 0.4, j, 2);
            this.particles.push(particle);
          }
        }
      }
    }
  }

  createShockwave(position, radius, color = 0xffffff, duration = 0.5) {
    const geometry = new THREE.RingGeometry(0.1, 0.3, 32);
    const material = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;

    this.game.scene.add(ring);

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

      ring.scale.setScalar(radius * progress * 10);
      material.opacity = 0.8 * (1 - progress);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  createFloatingText(
    position, text, color = 0xffffff, size = 0.5, isCrit = false,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = isCrit
      ? "bold 72px 'Impact', Arial"
      : "bold 56px 'Impact', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = isCrit ? 8 : 5;
    ctx.strokeText(text, 128, 64);

    ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture, transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 1;

    const baseSize = size * (isCrit ? 3 : 2);
    sprite.scale.set(baseSize * 0.5, baseSize * 0.25, 1);

    this.game.scene.add(sprite);

    let elapsed = 0;
    const duration = isCrit ? 0.8 : 0.6;

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

      if (progress < 0.2) {
        const popProgress = progress / 0.2;
        const currentSize = baseSize * (0.5 + 0.7 * popProgress);
        sprite.scale.set(currentSize, currentSize * 0.5, 1);
      } else {
        const settleProgress = (progress - 0.2) / 0.8;
        const currentSize = baseSize * (1.2 - 0.2 * settleProgress);
        sprite.scale.set(currentSize, currentSize * 0.5, 1);
      }

      sprite.position.x += driftX;
      sprite.position.z += driftZ;
      sprite.position.y += isCrit ? 0.04 : 0.02;

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
      color, transparent: true, opacity: 0.7,
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
    for (const particle of this.particles) {
      this._releaseMesh(particle.mesh, particle.streak);
    }
    this.particles = [];
    this.trailParticles = [];
  }
}
