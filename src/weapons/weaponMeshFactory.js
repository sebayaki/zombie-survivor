import * as THREE from "three";

export class WeaponMeshFactory {
  constructor() {
    this._knifeMeshCache = null;
    this._evolvedKnifeMeshCache = null;
    this._axeMeshCache = null;
    this._orbMeshCaches = {};
    this._crossMeshCache = null;
    this._fireballMeshCache = null;
    this._runeMeshCache = null;
    this._bottleMeshCache = null;
    this._holyWandMeshCache = null;
    this._heavenSwordMeshCache = null;
    this._noFutureMeshCache = null;

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

  createKnifeMesh() {
    if (this._knifeMeshCache) return this._knifeMeshCache.clone();

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.15, 1.2, 4),
      new THREE.MeshBasicMaterial({ color: 0xccddff }),
    );
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.4;
    group.add(core);

    const aura = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.18, 1.3, 4),
      new THREE.MeshBasicMaterial({
        color: 0x4488cc,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.z = 0.45;
    group.add(aura);

    this._knifeMeshCache = this.markShared(group);
    return group.clone();
  }

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
      new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    );
    group.add(core);

    const bladeMat = new THREE.MeshBasicMaterial({
      color: 0xcc2244,
      transparent: true,
      opacity: 0.7,
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
      new THREE.RingGeometry(1.0, 1.15, 12),
      new THREE.MeshBasicMaterial({
        color: 0xcc4488,
        transparent: true,
        opacity: 0.2,
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
      new THREE.MeshBasicMaterial({ color: color || 0x00ffff }),
    );
    core.rotation.x = Math.PI / 2;
    group.add(core);

    const glow1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.9, 6),
      new THREE.MeshBasicMaterial({
        color: color || 0x00ffff,
        transparent: true,
        opacity: 0.3,
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

    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xddaa44,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });

    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.4), coreMat));
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.30, 1.5), glowMat));

    const hCore = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.15), coreMat);
    hCore.position.z = -0.2;
    group.add(hCore);

    const hGlow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.30, 0.30), glowMat);
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
        new THREE.SphereGeometry(0.3, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffcc44 }),
      ),
    );

    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 6, 6),
        new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      ),
    );

    const trail = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.5, 6),
      new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.3,
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
        new THREE.MeshBasicMaterial({ color: 0xee88ee }),
      ),
    );

    group.add(
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshBasicMaterial({
          color: 0xcc44cc,
          transparent: true,
          opacity: 0.3,
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
        new THREE.SphereGeometry(0.25, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x88ccff }),
      ),
    );

    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 6, 6),
        new THREE.MeshBasicMaterial({
          color: 0x0088cc,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      ),
    );

    this._bottleMeshCache = this.markShared(group);
    return group.clone();
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
}
