import * as THREE from "three";
import { MD2Character } from "three/examples/jsm/misc/MD2Character.js";

const _tmpVec = new THREE.Vector3();

export class Player {
  static _zeroVec = new THREE.Vector3();
  static _dirVec = new THREE.Vector3();

  constructor(game) {
    this.game = game;

    // Player properties
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 8;
    this.rotation = 0;

    // Character mesh
    this.character = null;
    this.mesh = null;
    this.isLoaded = false;
    this._characterMeshes = null;

    // Movement state
    this.velocity = new THREE.Vector3();
    this.isMoving = false;

    // Invulnerability after damage
    this.invulnerable = false;
    this.invulnerableTime = 0;

    // Animation state
    this.currentAnimation = "stand";
    this.isAttacking = false;
    this.attackEndTime = 0;

    // Target rotation for smooth turning
    this.targetRotation = 0;
    this.rotationSpeed = 15; // radians per second (fast, responsive turning)

    // Auto-aim target (set by game when enemies are nearby)
    this.aimTarget = null; // angle to aim at, or null if no target

    // Animation names from MD2 model
    this.animations = {
      stand: "stand",
      run: "run",
      attack: "attack",
      pain: "pain_a",
      death: "death_a",
      crattack: "crattack", // Crouched attack
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Create MD2 character
      this.character = new MD2Character();
      this.character.scale = 0.06; // Slightly larger scale for better visibility in top-down view

      // MD2 model configuration - using ratamahatta from three.js examples
      const baseUrl = "https://threejs.org/examples/models/md2/ratamahatta/";

      const config = {
        baseUrl: baseUrl,
        body: "ratamahatta.md2",
        skins: [
          "ratamahatta.png",
          "ctf_b.png",
          "ctf_r.png",
          "dead.png",
          "gearwhore.png",
        ],
        weapons: [
          ["weapon.md2", "weapon.png"],
          ["w_blaster.md2", "w_blaster.png"],
          ["w_shotgun.md2", "w_shotgun.png"],
          ["w_machinegun.md2", "w_machinegun.png"],
          ["w_rlauncher.md2", "w_rlauncher.png"],
          ["w_railgun.md2", "w_railgun.png"],
          ["w_bfg.md2", "w_bfg.png"],
        ],
      };

      this.character.onLoadComplete = () => {
        console.log("MD2 Character loaded!");
        this.isLoaded = true;

        // Create a group to act as our main mesh
        this.mesh = new THREE.Group();
        this.mesh.add(this.character.root);

        // Add player indicator (glowing circle under player)
        this.createPlayerIndicator();

        // Position the character
        this.mesh.position.set(0, 0, 0);
        this.game.scene.add(this.mesh);

        // Set initial animation
        this.setAnimation("stand");

        // Set initial skin (blue team skin for player)
        try {
          this.character.setSkin(1); // ctf_b.png - blue team
        } catch (e) {
          console.warn("Could not set skin:", e);
        }

        // Log available animations
        if (
          this.character.meshBody &&
          this.character.meshBody.geometry.animations
        ) {
          const anims = this.character.meshBody.geometry.animations.map(
            (a) => a.name,
          );
          console.log("Available animations:", anims);
        }

        resolve();
      };

      // Load the character parts
      try {
        this.character.loadParts(config);
      } catch (error) {
        console.error("Error loading MD2 character:", error);
        // Fallback to simple mesh
        this.createFallbackMesh();
        resolve();
      }
    });
  }

  createFallbackMesh() {
    // Fallback simple mesh if MD2 fails to load
    console.log("Using fallback player mesh");
    this.mesh = this.createPlayerMesh();

    // Add player indicator
    this.createPlayerIndicator();

    this.mesh.position.set(0, 0, 0);
    this.game.scene.add(this.mesh);
    this.isLoaded = true;
  }

  createPlayerIndicator() {
    // Create a glowing ring under the player for visibility
    const indicatorGroup = new THREE.Group();

    // Outer ring (bright cyan glow)
    const ringGeometry = new THREE.RingGeometry(0.8, 1.0, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    indicatorGroup.add(ring);

    // Inner glow circle
    const innerGlowGeometry = new THREE.CircleGeometry(0.8, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    innerGlow.rotation.x = -Math.PI / 2;
    innerGlow.position.y = 0.03;
    indicatorGroup.add(innerGlow);

    // Direction arrow
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0.5);
    arrowShape.lineTo(-0.2, 0);
    arrowShape.lineTo(0.2, 0);
    arrowShape.closePath();

    const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.y = 0.06;
    arrow.position.z = 0.6;
    indicatorGroup.add(arrow);

    // Store reference for animation
    this.indicator = indicatorGroup;
    this.indicatorRing = ring;
    this.indicatorArrow = arrow;

    this.mesh.add(indicatorGroup);
  }

  createPlayerMesh() {
    const group = new THREE.Group();

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2266aa,
      roughness: 0.6,
      metalness: 0.3,
    });

    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      roughness: 0.8,
    });

    const armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Body (torso)
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.6, 4, 8),
      bodyMaterial,
    );
    torso.position.y = 1.3;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      skinMaterial,
    );
    head.position.y = 2.0;
    head.castShadow = true;
    group.add(head);

    // Helmet
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      armorMaterial,
    );
    helmet.position.y = 2.05;
    helmet.castShadow = true;
    group.add(helmet);

    // Visor
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.1, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.5,
      }),
    );
    visor.position.set(0, 2.0, 0.2);
    group.add(visor);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.5, 4, 8);

    this.leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.leftLeg.position.set(-0.15, 0.5, 0);
    this.leftLeg.castShadow = true;
    group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    this.rightLeg.position.set(0.15, 0.5, 0);
    this.rightLeg.castShadow = true;
    group.add(this.rightLeg);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);

    this.leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.leftArm.position.set(-0.45, 1.4, 0);
    this.leftArm.rotation.z = 0.3;
    this.leftArm.castShadow = true;
    group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    this.rightArm.position.set(0.45, 1.4, 0.2);
    this.rightArm.rotation.z = -0.3;
    this.rightArm.rotation.x = -0.8;
    this.rightArm.castShadow = true;
    group.add(this.rightArm);

    // Gun
    this.gun = new THREE.Group();

    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.5),
      armorMaterial,
    );
    this.gun.add(gunBody);

    const gunBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8),
      armorMaterial,
    );
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.z = 0.35;
    this.gun.add(gunBarrel);

    // Gun glow
    this.gunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    );
    this.gunGlow.position.z = 0.5;
    this.gun.add(this.gunGlow);

    this.gun.position.set(0.5, 1.2, 0.5);
    this.gun.rotation.x = -0.2;
    group.add(this.gun);

    return group;
  }

  reset() {
    this.health = this.maxHealth;
    this.rotation = Math.PI;
    this.targetRotation = Math.PI;
    this.aimTarget = null;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.isAttacking = false;
    this.attackEndTime = 0;
    this._laurelOnCooldown = false;
    this._revivalsUsed = 0;

    if (this.mesh) {
      this.mesh.position.set(0, 0, 0);
      this.mesh.rotation.y = 0;

      this.setCharacterOpacity(1);
    }

    this.setWeapon(0);
    this.setAnimation("stand");
    this.game.ui.updateHealth();
  }

  setCharacterOpacity(value) {
    if (!this.character?.root) return;
    if (!this._characterMeshes) {
      this._characterMeshes = [];
      this.character.root.traverse((child) => {
        if (child.isMesh && child.material) {
          this._characterMeshes.push(child);
        }
      });
    }
    const transparent = value < 1;
    for (const mesh of this._characterMeshes) {
      mesh.material.transparent = transparent;
      mesh.material.opacity = value;
    }
  }

  update(delta) {
    if (!this.mesh) return;

    // Update MD2 character animation
    if (this.character && this.isLoaded) {
      this.character.update(delta);
    }

    // Animate player indicator (pulsing effect)
    if (this.indicatorRing) {
      const time = performance.now() * 0.003;
      const pulse = 0.6 + Math.sin(time) * 0.2;
      this.indicatorRing.material.opacity = pulse;

      // Rotate ring slowly
      this.indicator.rotation.y += delta * 0.5;
    }

    // Check if attack animation is done
    if (this.isAttacking && performance.now() > this.attackEndTime) {
      this.isAttacking = false;
      // Return to appropriate animation
      if (this.isMoving) {
        this.setAnimation("run");
      } else {
        this.setAnimation("stand");
      }
    }

    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerableTime -= delta;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
        this.setCharacterOpacity(1);
      } else {
        const flash = Math.sin(this.invulnerableTime * 20) * 0.3 + 0.7;
        this.setCharacterOpacity(flash);
      }
    }

    // Handle movement
    this.handleMovement(delta);

    // Keep player in arena bounds
    this.clampToArena();
  }

  getMovementInput() {
    const keys = this.game.keys;
    let moveX = 0;
    let moveZ = 0;
    let usingKeyboard = false;
    let usingTouch = false;

    // Priority 1: Keyboard (WASD / arrows)
    if (keys["KeyW"] || keys["ArrowUp"]) { moveZ -= 1; usingKeyboard = true; }
    if (keys["KeyS"] || keys["ArrowDown"]) { moveZ += 1; usingKeyboard = true; }
    if (keys["KeyA"] || keys["ArrowLeft"]) { moveX -= 1; usingKeyboard = true; }
    if (keys["KeyD"] || keys["ArrowRight"]) { moveX += 1; usingKeyboard = true; }

    // Priority 2: Touch/joystick
    if (
      !usingKeyboard &&
      this.game.touchControls &&
      this.game.touchControls.isActive()
    ) {
      const touchVector = this.game.touchControls.getMovementVector();
      if (Math.abs(touchVector.x) > 0.1 || Math.abs(touchVector.y) > 0.1) {
        moveX = touchVector.x;
        moveZ = touchVector.y;
        usingTouch = true;
      }
    }

    // Priority 3: Mouse follow (disabled on touch devices)
    const isTouchDevice =
      this.game.touchControls && this.game.touchControls.isTouch;
    if (
      !usingKeyboard &&
      !usingTouch &&
      this.game.useMouseMovement &&
      !isTouchDevice
    ) {
      const mouseTarget = this.game.mouseWorldPos;
      const dx = mouseTarget.x - this.mesh.position.x;
      const dz = mouseTarget.z - this.mesh.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > 0.3) {
        moveX = dx / distance;
        moveZ = dz / distance;
        if (distance < 1.5) {
          const slowdown = distance / 1.5;
          moveX *= slowdown;
          moveZ *= slowdown;
        }
      }
    }

    // Normalize so diagonal keyboard movement doesn't exceed unit length
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 1) {
      moveX /= length;
      moveZ /= length;
    }

    return { x: moveX, z: moveZ };
  }

  handleMovement(delta) {
    const moveSpeed = this.speed * delta;
    const { x: moveX, z: moveZ } = this.getMovementInput();

    const wasMoving = this.isMoving;
    this.isMoving = moveX !== 0 || moveZ !== 0;

    if (this.isMoving) {
      _tmpVec.copy(this.mesh.position);
      _tmpVec.x += moveX * moveSpeed;
      _tmpVec.z += moveZ * moveSpeed;

      if (!this.game.collisionSystem.checkObstacleCollision(_tmpVec, 0.8)) {
        this.mesh.position.x += moveX * moveSpeed;
        this.mesh.position.z += moveZ * moveSpeed;
      }

      if (!this.isAttacking) {
        this.setAnimation("run");
      }
    } else {
      if (!this.isAttacking && wasMoving) {
        this.setAnimation("stand");
      }
    }

    if (this.aimTarget !== null) {
      this.targetRotation = this.aimTarget;
    } else if (this.isMoving) {
      this.targetRotation = Math.atan2(moveX, moveZ);
    }

    // Smoothly rotate character toward target rotation
    let rotationDiff = this.targetRotation - this.rotation;
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

    const maxRotation = this.rotationSpeed * delta;
    if (Math.abs(rotationDiff) < maxRotation) {
      this.rotation = this.targetRotation;
    } else {
      this.rotation += Math.sign(rotationDiff) * maxRotation;
    }

    this.mesh.rotation.y = this.rotation;
  }

  clampToArena() {
    const bounds = this.game.arenaSize - 1;
    this.mesh.position.x = Math.max(
      -bounds,
      Math.min(bounds, this.mesh.position.x),
    );
    this.mesh.position.z = Math.max(
      -bounds,
      Math.min(bounds, this.mesh.position.z),
    );
  }

  // Set auto-aim target angle (called by game when enemies are in range)
  setAimTarget(angle) {
    this.aimTarget = angle;
  }

  // Clear auto-aim target (called when no enemies in range)
  clearAimTarget() {
    this.aimTarget = null;
  }

  setAnimation(name) {
    if (!this.isLoaded) return;

    // Don't interrupt attack animation unless it's a death animation
    if (this.isAttacking && name !== "death" && name !== "pain") {
      return;
    }

    // Get the actual animation name
    const animName = this.animations[name] || name;

    if (this.currentAnimation === animName) return;
    this.currentAnimation = animName;

    // Set animation on MD2 character
    if (this.character && this.character.meshBody) {
      try {
        this.character.setAnimation(animName);
      } catch (e) {
        console.warn(`Animation ${animName} not found, trying fallback`);
        // Try to use stand as fallback
        if (animName !== "stand") {
          this.character.setAnimation("stand");
        }
      }
    }
  }

  // Called when player shoots
  playAttackAnimation() {
    if (!this.isLoaded) return;

    this.isAttacking = true;
    this.attackEndTime = performance.now() + 300; // Attack animation duration in ms

    // Set attack animation - try various common MD2 attack animation names
    if (this.character && this.character.meshBody) {
      const attackAnims = ["attack", "crattack", "flip", "point"];
      let found = false;

      const anims = this.character.meshBody.geometry.animations;
      if (anims) {
        for (const animName of attackAnims) {
          if (anims.some((a) => a.name === animName)) {
            try {
              this.character.setAnimation(animName);
              this.currentAnimation = animName;
              found = true;
              break;
            } catch (e) {
              // Continue to next animation
            }
          }
        }
      }

      if (!found) {
        // Just skip attack animation if none found - shooting still works
        this.isAttacking = false;
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnerable) return;

    // Apply armor damage reduction
    const armor = this.game.playerStats?.armor || 0;
    const reducedAmount = Math.max(1, amount - armor);

    this.health -= reducedAmount;
    this.game.ui.updateHealth();
    this.game.ui.damageFlash();
    this.game.audioManager.playSound("playerHit");

    // Post-processing damage flash (intensity based on damage)
    const flashIntensity = Math.min(1, reducedAmount / 30);
    this.game.damageFlash(flashIntensity);

    // Small screen shake for impact feel
    this.game.screenShake(0.1 + flashIntensity * 0.2, 0.1);

    // Play pain animation
    this.setAnimation("pain");

    // Brief invulnerability
    this.invulnerable = true;
    this.invulnerableTime = 0.5;

    if (this.health <= 0) {
      // Crimson Shroud (evolved laurel): stronger death prevention
      const ws = this.game.autoWeaponSystem;
      if (ws?.hasWeapon("crimsonShroud") && !this._laurelOnCooldown) {
        const stats = this.game.evolutionSystem?.getEvolvedStats("crimsonShroud") || {};
        this.health = 1;
        this.invulnerable = true;
        this.invulnerableTime = stats.shieldDuration || 3.0;
        this._laurelOnCooldown = true;
        setTimeout(() => { this._laurelOnCooldown = false; }, (stats.cooldown || 12) * 1000);
        this.game.ui.showMessage("Crimson Shroud!");
        this.game.pulseBloom?.(0.5, 2.5);
        this.game.audioManager.playSound("levelUp");
        this.game.ui.updateHealth();
        return;
      }
      // Laurel shield: grants invincibility instead of dying
      if (ws?.hasWeapon("laurel") && !this._laurelOnCooldown) {
        const stats = ws.getWeaponStats(
          "laurel",
          ws.getWeaponLevel("laurel")
        );
        this.health = 1;
        this.invulnerable = true;
        this.invulnerableTime = stats.shieldDuration || 1.0;
        this._laurelOnCooldown = true;
        setTimeout(() => { this._laurelOnCooldown = false; }, (stats.cooldown || 60) * 1000);
        this.game.ui.showMessage("Laurel Shield!");
        this.game.pulseBloom?.(0.3, 1.5);
        this.game.audioManager.playSound("pickup");
        this.game.ui.updateHealth();
        return;
      }

      this.health = 0;
      this.die();
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.game.ui.updateHealth();
    this.game.audioManager.playSound("pickup");
  }

  die() {
    // Check for revival charges (Tiragisu passive + shop revival power-up)
    const revivalStat = (this.game.playerStats?.revival || 0) +
      (this.game.powerUpSystem?.getRevivals?.() || 0);
    if (revivalStat > 0 && !this._revivalsUsed) this._revivalsUsed = 0;

    if (revivalStat > this._revivalsUsed) {
      this._revivalsUsed = (this._revivalsUsed || 0) + 1;
      this.health = Math.floor(this.maxHealth * 0.5);
      this.invulnerable = true;
      this.invulnerableTime = 2.0;
      this.game.ui.showMessage(`Revival! (${revivalStat - this._revivalsUsed} left)`);
      this.game.pulseBloom?.(0.5, 2.5);
      this.game.audioManager.playSound("pickup");
      this.game.ui.updateHealth();
      return;
    }

    this.setAnimation("death");
    this.game.gameOver();
  }

  setWeapon(index) {
    // Visual weapon change on MD2 character is disabled due to animation sync issues
    // The game mechanics work without it - just different colored projectiles per weapon
  }

  getPosition() {
    return this.mesh ? this.mesh.position : Player._zeroVec;
  }

  getDirection() {
    Player._dirVec.set(Math.sin(this.rotation), 0, Math.cos(this.rotation));
    return Player._dirVec;
  }
}
