// Post-processing effects - Bloom, Glow, Screen Shake
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// Custom vignette shader
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.0 },
    darkness: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vignette = 1.0 - dot(uv, uv);
      color.rgb = mix(color.rgb, color.rgb * vignette, darkness);
      gl_FragColor = color;
    }
  `,
};

// Chromatic aberration for damage effect
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 offset = amount * vec2(0.01, 0.0);
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

export class PostProcessingManager {
  constructor(game) {
    this.game = game;
    this.composer = null;
    this.bloomPass = null;
    this.vignettePass = null;
    this.chromaticPass = null;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.originalCameraPos = new THREE.Vector3();

    // Damage flash
    this.damageFlashIntensity = 0;

    // Time slow (for dramatic moments)
    this.timeScale = 1.0;
    this.timeSlowDuration = 0;

    this.init();
  }

  init() {
    const { renderer, scene, camera } = this.game;

    // Create composer
    this.composer = new EffectComposer(renderer);

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Bloom pass - makes bright things glow (reduced intensity)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4, // strength (reduced from 0.8)
      0.3, // radius (reduced from 0.4)
      0.92, // threshold (increased from 0.85 - only very bright things glow)
    );
    this.composer.addPass(this.bloomPass);

    // Vignette pass
    this.vignettePass = new ShaderPass(VignetteShader);
    this.vignettePass.uniforms.offset.value = 1.0;
    this.vignettePass.uniforms.darkness.value = 0.5;
    this.composer.addPass(this.vignettePass);

    // Chromatic aberration (for damage)
    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.chromaticPass.uniforms.amount.value = 0;
    this.composer.addPass(this.chromaticPass);

    // Output pass
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  // Screen shake effect
  shake(intensity = 0.5, duration = 0.2) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
    this.originalCameraPos.copy(this.game.camera.position);
  }

  // Damage flash (red tint + chromatic aberration)
  damageFlash(intensity = 1.0) {
    this.damageFlashIntensity = intensity;
    this.chromaticPass.uniforms.amount.value = intensity * 2;
    this.vignettePass.uniforms.darkness.value = 0.5 + intensity * 0.5;
  }

  // Time slow for dramatic effects (boss death, evolution, etc.)
  slowTime(scale = 0.3, duration = 0.5) {
    this.timeScale = scale;
    this.timeSlowDuration = duration;
  }

  // Set bloom intensity (for level ups, etc.)
  setBloomIntensity(strength) {
    this.bloomPass.strength = strength;
  }

  // Pulse bloom effect
  pulseBloom(duration = 0.3, maxStrength = 2.0) {
    const startStrength = this.bloomPass.strength;
    let elapsed = 0;

    const animate = () => {
      elapsed += 0.016;
      const t = elapsed / duration;

      if (t < 0.5) {
        // Increase
        this.bloomPass.strength =
          startStrength + (maxStrength - startStrength) * (t * 2);
      } else {
        // Decrease
        this.bloomPass.strength =
          maxStrength - (maxStrength - startStrength) * ((t - 0.5) * 2);
      }

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        this.bloomPass.strength = startStrength;
      }
    };
    requestAnimationFrame(animate);
  }

  update(delta) {
    // Update screen shake
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += delta;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * (1 - progress);

      // Apply random offset to camera
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetZ = (Math.random() - 0.5) * 2 * currentIntensity;

      this.game.camera.position.x = this.originalCameraPos.x + offsetX;
      this.game.camera.position.z = this.originalCameraPos.z + offsetZ;

      if (this.shakeTimer >= this.shakeDuration) {
        // Reset camera position
        this.game.camera.position.copy(this.originalCameraPos);
      }
    }

    // Update damage flash
    if (this.damageFlashIntensity > 0) {
      this.damageFlashIntensity -= delta * 4; // Fade out
      if (this.damageFlashIntensity < 0) {
        this.damageFlashIntensity = 0;
      }
      this.chromaticPass.uniforms.amount.value = this.damageFlashIntensity * 2;
      this.vignettePass.uniforms.darkness.value =
        0.5 + this.damageFlashIntensity * 0.3;
    }

    // Update time slow
    if (this.timeSlowDuration > 0) {
      this.timeSlowDuration -= delta;
      if (this.timeSlowDuration <= 0) {
        this.timeScale = 1.0;
      }
    }

    return this.timeScale;
  }

  render() {
    this.composer.render();
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }
}
