// Post-processing effects - Bloom, Glow, Screen Shake
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

const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    contrast: { value: 1.04 },
    saturation: { value: 1.05 },
  },
  vertexShader: PASSTHROUGH_VERTEX,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float contrast;
    uniform float saturation;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(gray), color.rgb, saturation);
      vec3 coolTint = vec3(0.93, 0.95, 1.05);
      vec3 warmTint = vec3(1.04, 1.01, 0.96);
      color.rgb *= mix(coolTint, warmTint, gray);
      gl_FragColor = color;
    }
  `,
};

const FilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    intensity: { value: 0.035 },
  },
  vertexShader: PASSTHROUGH_VERTEX,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    varying vec2 vUv;
    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = (rand(vUv + vec2(time * 0.01, 0.0)) - 0.5) * 2.0;
      color.rgb += vec3(grain) * intensity;
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

    // Bloom pulse (driven by update() instead of rAF)
    this._bloomPulseTarget = 0;
    this._bloomPulseIntensity = 0;
    this._bloomPulseDuration = 0;
    this._bloomPulseElapsed = 0;
    this._bloomPulseBaseStrength = 0;

    this.init();
  }

  init() {
    const { renderer, scene, camera } = this.game;

    // Create composer
    this.composer = new EffectComposer(renderer);

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35,
      0.4,
      0.92,
    );
    this.composer.addPass(this.bloomPass);

    this.vignettePass = new ShaderPass(VignetteShader);
    this.vignettePass.uniforms.offset.value = 1.0;
    this.vignettePass.uniforms.darkness.value = 0.15;
    this.composer.addPass(this.vignettePass);

    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.chromaticPass.uniforms.amount.value = 0;
    this.composer.addPass(this.chromaticPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  // Screen shake effect
  shake(intensity = 0.5, duration = 0.2) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  // Damage flash (red tint + chromatic aberration)
  damageFlash(intensity = 1.0) {
    this.damageFlashIntensity = intensity;
    this.chromaticPass.uniforms.amount.value = intensity * 2;
    this.vignettePass.uniforms.darkness.value = 0.15 + intensity * 0.4;
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

  pulseBloom(duration = 0.3, maxStrength = 2.0) {
    this._bloomPulseBaseStrength = this.bloomPass.strength;
    this._bloomPulseTarget = maxStrength;
    this._bloomPulseDuration = duration;
    this._bloomPulseElapsed = 0;
  }

  update(delta) {
    // Update screen shake timer
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += delta;
    }

    // Update damage flash
    if (this.damageFlashIntensity > 0) {
      this.damageFlashIntensity -= delta * 4; // Fade out
      if (this.damageFlashIntensity < 0) {
        this.damageFlashIntensity = 0;
      }
      this.chromaticPass.uniforms.amount.value = this.damageFlashIntensity * 2;
      this.vignettePass.uniforms.darkness.value =
        0.15 + this.damageFlashIntensity * 0.3;
    }

    // Update bloom pulse
    if (this._bloomPulseElapsed < this._bloomPulseDuration) {
      this._bloomPulseElapsed += delta;
      const t = Math.min(this._bloomPulseElapsed / this._bloomPulseDuration, 1);
      const base = this._bloomPulseBaseStrength;
      const peak = this._bloomPulseTarget;
      if (t < 0.5) {
        this.bloomPass.strength = base + (peak - base) * (t * 2);
      } else {
        this.bloomPass.strength = peak - (peak - base) * ((t - 0.5) * 2);
      }
      if (t >= 1) {
        this.bloomPass.strength = base;
      }
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
