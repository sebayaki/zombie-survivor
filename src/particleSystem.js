import * as THREE from "three";

const PARTICLE_PRESETS = {
  xpCollect: {
    count: 3, colors: [0xddaa44, 0xffcc66],
    size: { min: 0.03, max: 0.07 }, speed: { min: 2, max: 3 },
    gravity: -5, lifetime: 0.35, spread: 0.3, upward: true,
  },
  levelUp: {
    count: 18, colors: [0xffcc00, 0xffffff, 0xff8800],
    size: { min: 0.08, max: 0.18 }, speed: { min: 3, max: 6 },
    gravity: -3, lifetime: 1.0, spread: 2.5, upward: true, ring: true,
  },
  enemyDeath: {
    count: 8, colors: [0xcc0000, 0x880000, 0x660000, 0x440000],
    size: { min: 0.06, max: 0.16 }, speed: { min: 3, max: 8 },
    gravity: 16, lifetime: 0.5, spread: 1.5, upward: false,
  },
  bossDeath: {
    count: 25, colors: [0xcc0000, 0x880000, 0x440000, 0x220000],
    size: { min: 0.1, max: 0.3 }, speed: { min: 4, max: 12 },
    gravity: 12, lifetime: 1.2, spread: 4, upward: false,
  },
  fire: {
    count: 6, colors: [0xffff00, 0xff8800, 0xff4400, 0xff0000],
    size: { min: 0.05, max: 0.14 }, speed: { min: 2, max: 4 },
    gravity: -8, lifetime: 0.4, spread: 0.6, upward: true, fadeToBlack: true,
  },
  electric: {
    count: 5, colors: [0xffffff, 0xffddaa, 0xccaa44],
    size: { min: 0.03, max: 0.06 }, speed: { min: 6, max: 10 },
    gravity: 0, lifetime: 0.2, spread: 1.2, upward: false, streak: true,
  },
  heal: {
    count: 5, colors: [0x66aa44, 0x88cc66],
    size: { min: 0.06, max: 0.12 }, speed: { min: 1, max: 3 },
    gravity: -3, lifetime: 0.6, spread: 0.6, upward: true,
  },
  blood: {
    count: 6, colors: [0xdd0000, 0xaa0000, 0x880000, 0x660000],
    size: { min: 0.05, max: 0.12 }, speed: { min: 3, max: 7 },
    gravity: 22, lifetime: 0.4, spread: 1.0, upward: false,
  },
  bloodBurst: {
    count: 10, colors: [0xdd0000, 0xaa0000, 0x770000, 0x550000],
    size: { min: 0.08, max: 0.2 }, speed: { min: 4, max: 10 },
    gravity: 14, lifetime: 0.6, spread: 2.0, upward: false,
  },
  hitSpark: {
    count: 3, colors: [0xcc0000, 0x880000, 0x660000],
    size: { min: 0.03, max: 0.08 }, speed: { min: 3, max: 7 },
    gravity: 14, lifetime: 0.25, spread: 0.8, upward: false,
  },
  critSpark: {
    count: 6, colors: [0xff0000, 0xcc0000, 0x880000, 0xff2200],
    size: { min: 0.05, max: 0.15 }, speed: { min: 5, max: 12 },
    gravity: 12, lifetime: 0.35, spread: 1.2, upward: false,
  },
  evolution: {
    count: 25, colors: [0xffdd00, 0xffffff, 0xff4400, 0xcc8800],
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

    // Floating text pool — avoids canvas/texture creation per damage number
    this._textPool = [];
    this._activeTexts = [];
    this._maxActiveTexts = 30;

    // Shockwave pool
    this._shockwaveGeo = new THREE.RingGeometry(0.1, 0.3, 32);
    this._shockwavePool = [];
    this._activeShockwaves = [];

    // Impact flash pool
    this._flashGeo = new THREE.SphereGeometry(1, 6, 6);
    this._flashPool = [];
    this._activeFlashes = [];

    // Blood puddle pool
    this._bloodPuddleGeo = new THREE.CircleGeometry(1, 12);
    this._bloodPuddleGeo.rotateX(-Math.PI / 2);
    this._bloodPuddlePool = [];
    this._activeBloodPuddles = [];
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

    // Animate floating texts
    for (let i = this._activeTexts.length - 1; i >= 0; i--) {
      const t = this._activeTexts[i];
      t.elapsed += delta;
      const progress = t.elapsed / t.duration;

      if (progress >= 1) {
        t.entry.sprite.visible = false;
        this._textPool.push(t.entry);
        this._activeTexts.splice(i, 1);
        continue;
      }

      const sprite = t.entry.sprite;
      const mat = t.entry.material;

      if (progress < 0.2) {
        const popProgress = progress / 0.2;
        const cur = t.baseSize * (0.5 + 0.7 * popProgress);
        sprite.scale.set(cur, cur * 0.5, 1);
      } else {
        const settleProgress = (progress - 0.2) / 0.8;
        const cur = t.baseSize * (1.2 - 0.2 * settleProgress);
        sprite.scale.set(cur, cur * 0.5, 1);
      }

      sprite.position.x += t.driftX;
      sprite.position.z += t.driftZ;
      sprite.position.y += t.isCrit ? 0.04 : 0.02;

      mat.opacity = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
    }

    // Animate shockwaves
    for (let i = this._activeShockwaves.length - 1; i >= 0; i--) {
      const s = this._activeShockwaves[i];
      s.elapsed += delta;
      const progress = s.elapsed / s.duration;

      if (progress >= 1) {
        s.sw.mesh.visible = false;
        this._shockwavePool.push(s.sw);
        this._activeShockwaves.splice(i, 1);
        continue;
      }

      s.sw.mesh.scale.setScalar(s.radius * progress * 10);
      s.sw.material.opacity = 0.8 * (1 - progress);
    }

    // Animate impact flashes
    for (let i = this._activeFlashes.length - 1; i >= 0; i--) {
      const fl = this._activeFlashes[i];
      fl.scale += 0.25 * delta * 60;
      fl.f.material.opacity -= 0.18 * delta * 60;

      if (fl.f.material.opacity <= 0) {
        fl.f.mesh.visible = false;
        this._flashPool.push(fl.f);
        this._activeFlashes.splice(i, 1);
        continue;
      }

      fl.f.mesh.scale.setScalar(fl.scale);
    }

    // Animate blood puddles
    for (let i = this._activeBloodPuddles.length - 1; i >= 0; i--) {
      const bp = this._activeBloodPuddles[i];
      bp.elapsed += delta;
      const progress = bp.elapsed / bp.duration;

      if (progress >= 1) {
        bp.bp.mesh.visible = false;
        this._bloodPuddlePool.push(bp.bp);
        this._activeBloodPuddles.splice(i, 1);
        continue;
      }

      const growPhase = Math.min(progress / 0.15, 1);
      const scale = bp.targetScale * growPhase;
      bp.bp.mesh.scale.setScalar(scale);

      if (progress > 0.5) {
        bp.bp.material.opacity = 0.5 * (1 - (progress - 0.5) / 0.5);
      }
    }
  }

  _acquireShockwave() {
    if (this._shockwavePool.length > 0) {
      const sw = this._shockwavePool.pop();
      sw.mesh.visible = true;
      return sw;
    }
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(this._shockwaveGeo, material);
    mesh.rotation.x = -Math.PI / 2;
    this.game.scene.add(mesh);
    return { mesh, material };
  }

  createShockwave(position, radius, color = 0xffffff, duration = 0.5) {
    const sw = this._acquireShockwave();
    sw.material.color.set(color);
    sw.material.opacity = 0.8;
    sw.mesh.position.copy(position);
    sw.mesh.position.y = 0.1;
    sw.mesh.scale.setScalar(0.1);
    this._activeShockwaves.push({ sw, elapsed: 0, duration, radius });
  }

  _acquireText() {
    if (this._textPool.length > 0) {
      const entry = this._textPool.pop();
      entry.sprite.visible = true;
      return entry;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    this.game.scene.add(sprite);
    return { canvas, ctx, texture, material, sprite };
  }

  createFloatingText(
    position, text, color = 0xffffff, size = 0.5, isCrit = false,
  ) {
    if (this._activeTexts.length >= this._maxActiveTexts) return;

    const entry = this._acquireText();
    const { canvas, ctx, texture, material, sprite } = entry;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = isCrit
      ? "bold 96px 'Impact', Arial"
      : "bold 72px 'Impact', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = isCrit ? 10 : 6;
    ctx.strokeText(text, 128, 64);
    ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
    ctx.fillText(text, 128, 64);
    texture.needsUpdate = true;

    sprite.position.copy(position);
    sprite.position.y += 1;
    material.opacity = 1;

    const baseSize = size * (isCrit ? 3.5 : 2.5);
    sprite.scale.set(baseSize * 0.6, baseSize * 0.3, 1);

    this._activeTexts.push({
      entry,
      elapsed: 0,
      duration: isCrit ? 0.8 : 0.6,
      baseSize,
      driftX: (Math.random() - 0.5) * 0.05,
      driftZ: (Math.random() - 0.5) * 0.05,
      isCrit,
    });
  }

  _acquireFlash() {
    if (this._flashPool.length > 0) {
      const f = this._flashPool.pop();
      f.mesh.visible = true;
      return f;
    }
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.7,
    });
    const mesh = new THREE.Mesh(this._flashGeo, material);
    this.game.scene.add(mesh);
    return { mesh, material };
  }

  _acquireBloodPuddle() {
    if (this._bloodPuddlePool.length > 0) {
      const bp = this._bloodPuddlePool.pop();
      bp.mesh.visible = true;
      return bp;
    }
    const material = new THREE.MeshBasicMaterial({
      color: 0x880000, transparent: true, opacity: 0.6, depthWrite: false,
    });
    const mesh = new THREE.Mesh(this._bloodPuddleGeo, material);
    this.game.scene.add(mesh);
    return { mesh, material };
  }

  createBloodPuddle(position, size = 1) {
    if (this._activeBloodPuddles.length >= 15) return;
    const bp = this._acquireBloodPuddle();
    const colors = [0x880000, 0x660000, 0x550000, 0x770000];
    bp.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
    bp.material.opacity = 0.5;
    bp.mesh.position.set(
      position.x + (Math.random() - 0.5) * 0.5,
      0.05,
      position.z + (Math.random() - 0.5) * 0.5,
    );
    const startScale = size * 0.2;
    bp.mesh.scale.setScalar(startScale);
    bp.mesh.rotation.y = Math.random() * Math.PI * 2;
    this._activeBloodPuddles.push({
      bp, elapsed: 0, duration: 2.5, targetScale: size * (0.6 + Math.random() * 0.4),
    });
  }

  createImpactFlash(position, color = 0xffffff, size = 1) {
    const f = this._acquireFlash();
    f.material.color.set(color);
    f.material.opacity = 0.7;
    f.mesh.position.copy(position);
    f.mesh.scale.setScalar(size * 0.6);
    this._activeFlashes.push({ f, scale: size * 0.6 });
  }

  reset() {
    for (const particle of this.particles) {
      this._releaseMesh(particle.mesh, particle.streak);
    }
    this.particles = [];
    this.trailParticles = [];

    for (const t of this._activeTexts) {
      t.entry.sprite.visible = false;
      this._textPool.push(t.entry);
    }
    this._activeTexts = [];

    for (const s of this._activeShockwaves) {
      s.sw.mesh.visible = false;
      this._shockwavePool.push(s.sw);
    }
    this._activeShockwaves = [];

    for (const fl of this._activeFlashes) {
      fl.f.mesh.visible = false;
      this._flashPool.push(fl.f);
    }
    this._activeFlashes = [];

    for (const bp of this._activeBloodPuddles) {
      bp.bp.mesh.visible = false;
      this._bloodPuddlePool.push(bp.bp);
    }
    this._activeBloodPuddles = [];
  }
}
