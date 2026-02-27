import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const PASSTHROUGH_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.0 },
    darkness: { value: 1.0 },
  },
  vertexShader: PASSTHROUGH_VERTEX,
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

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0 },
  },
  vertexShader: PASSTHROUGH_VERTEX,
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

    // Bloom pulse
    this._bloomPulseTarget = 0;
    this._bloomPulseIntensity = 0;
    this._bloomPulseDuration = 0;
    this._bloomPulseElapsed = 0;
    this._bloomPulseBaseStrength = 0;

    // Adaptive bloom
    this._activeEffectCount = 0;
    this._baseBloomStrength = 0.25;

    this._isMobile = game.isMobile || false;

    this.init();
  }

  init() {
    const { renderer, scene, camera } = this.game;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Render post-processing at reduced resolution — big GPU savings
    // with negligible visual difference (bloom is inherently blurry).
    this._ppScale = this._isMobile ? 0.5 : 0.6;
    const ppW = Math.ceil(width * this._ppScale);
    const ppH = Math.ceil(height * this._ppScale);

    const rt = new THREE.WebGLRenderTarget(ppW, ppH, {
      type: THREE.HalfFloatType,
    });
    this.composer = new EffectComposer(renderer, rt);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    if (!this._isMobile) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(ppW, ppH),
        0.25, 0.3, 0.95,
      );
      this.composer.addPass(this.bloomPass);
    }

    this.vignettePass = new ShaderPass(VignetteShader);
    this.vignettePass.uniforms.offset.value = 1.0;
    this.vignettePass.uniforms.darkness.value = 0.15;
    this.composer.addPass(this.vignettePass);

    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.chromaticPass.uniforms.amount.value = 0;
    this.chromaticPass.enabled = false;
    this.composer.addPass(this.chromaticPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  shake(intensity = 0.5, duration = 0.2) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  damageFlash(intensity = 1.0) {
    this.damageFlashIntensity = intensity;
    this.chromaticPass.enabled = true;
    this.chromaticPass.uniforms.amount.value = intensity * 2;
    this.vignettePass.uniforms.darkness.value = 0.15 + intensity * 0.4;
  }

  slowTime(scale = 0.3, duration = 0.5) {
    this.timeScale = scale;
    this.timeSlowDuration = duration;
  }

  setBloomIntensity(strength) {
    if (this.bloomPass) this.bloomPass.strength = strength;
  }

  setActiveEffectCount(count) {
    this._activeEffectCount = count;
  }

  setQuality(level) {
    if (this.bloomPass) {
      this.bloomPass.enabled = level >= 1;
      if (level === 1) {
        this.bloomPass.strength = this._baseBloomStrength * 0.5;
      }
    }
  }

  pulseBloom(duration = 0.3, maxStrength = 2.0) {
    if (!this.bloomPass) return;
    this._bloomPulseBaseStrength = this.bloomPass.strength;
    this._bloomPulseTarget = Math.min(maxStrength, 1.8);
    this._bloomPulseDuration = duration;
    this._bloomPulseElapsed = 0;
  }

  update(delta) {
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += delta;
    }

    // Damage flash fade-out; disable chromatic pass when done
    if (this.damageFlashIntensity > 0) {
      this.damageFlashIntensity -= delta * 4;
      if (this.damageFlashIntensity <= 0) {
        this.damageFlashIntensity = 0;
        this.chromaticPass.enabled = false;
        this.chromaticPass.uniforms.amount.value = 0;
        this.vignettePass.uniforms.darkness.value = 0.15;
      } else {
        this.chromaticPass.uniforms.amount.value = this.damageFlashIntensity * 2;
        this.vignettePass.uniforms.darkness.value =
          0.15 + this.damageFlashIntensity * 0.3;
      }
    }

    // Bloom updates (skip when bloom is disabled on mobile)
    if (this.bloomPass) {
      const effectAttenuation =
        1 / (1 + Math.max(0, this._activeEffectCount - 5) * 0.04);
      const adaptiveBase = this._baseBloomStrength * effectAttenuation;

      if (this._bloomPulseElapsed < this._bloomPulseDuration) {
        this._bloomPulseElapsed += delta;
        const t = Math.min(
          this._bloomPulseElapsed / this._bloomPulseDuration, 1,
        );
        const base = this._bloomPulseBaseStrength * effectAttenuation;
        const peak = this._bloomPulseTarget * effectAttenuation;
        if (t < 0.5) {
          this.bloomPass.strength = base + (peak - base) * (t * 2);
        } else {
          this.bloomPass.strength = peak - (peak - base) * ((t - 0.5) * 2);
        }
        if (t >= 1) {
          this.bloomPass.strength = adaptiveBase;
        }
      } else {
        this.bloomPass.strength = adaptiveBase;
      }
    }

    // Time slow
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
    const width = Math.ceil(window.innerWidth * this._ppScale);
    const height = Math.ceil(window.innerHeight * this._ppScale);
    this.composer.setSize(width, height);
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  }
}
