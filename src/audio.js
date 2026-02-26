// Sound file mappings: each key maps to an array of file paths (variants for randomization)
const SOUND_FILES = {
  shoot:        ["/sounds/shoot_0.ogg", "/sounds/shoot_1.ogg", "/sounds/shoot_2.ogg"],
  machinegun:   ["/sounds/machinegun_0.ogg", "/sounds/machinegun_1.ogg", "/sounds/machinegun_2.ogg", "/sounds/machinegun_3.ogg", "/sounds/machinegun_4.ogg"],
  shotgun:      ["/sounds/shotgun_0.ogg", "/sounds/shotgun_1.ogg", "/sounds/shotgun_2.ogg"],
  rocket:       ["/sounds/rocket_0.ogg", "/sounds/rocket_1.ogg"],
  railgun:      ["/sounds/railgun_0.ogg", "/sounds/railgun_1.ogg"],
  bfg:          ["/sounds/bfg_0.ogg", "/sounds/bfg_1.ogg"],
  explosion:    ["/sounds/explosion_0.ogg", "/sounds/explosion_1.ogg", "/sounds/explosion_2.ogg"],
  zombieDeath:  ["/sounds/zombieDeath_0.wav", "/sounds/zombieDeath_1.wav", "/sounds/zombieDeath_2.wav", "/sounds/zombieDeath_3.wav"],
  zombieAttack: ["/sounds/zombieAttack_0.wav", "/sounds/zombieAttack_1.wav", "/sounds/zombieAttack_2.wav"],
  bossRoar:     ["/sounds/bossRoar_0.wav", "/sounds/bossRoar_1.wav"],
  bossSlam:     ["/sounds/bossSlam_0.ogg", "/sounds/bossSlam_1.ogg"],
  bossCharge:   ["/sounds/bossCharge_0.ogg"],
  playerHit:    ["/sounds/playerHit_0.ogg", "/sounds/playerHit_1.ogg", "/sounds/playerHit_2.ogg"],
  pickup:       ["/sounds/pickup_0.ogg", "/sounds/pickup_1.ogg"],
  xpPickup:     ["/sounds/xpPickup_0.ogg", "/sounds/xpPickup_1.ogg"],
  upgrade:      ["/sounds/upgrade_0.ogg", "/sounds/upgrade_1.ogg"],
  levelUp:      ["/sounds/levelUp_0.ogg", "/sounds/levelUp_1.ogg"],
  knife:        ["/sounds/knife_0.ogg", "/sounds/knife_1.ogg"],
  axe:          ["/sounds/axe_0.ogg", "/sounds/axe_1.ogg"],
  cross:        ["/sounds/cross_0.ogg", "/sounds/cross_1.ogg"],
  whip:         ["/sounds/whip_0.ogg", "/sounds/whip_1.ogg"],
  fireball:     ["/sounds/fireball_0.ogg"],
  lightning:    ["/sounds/lightning_0.ogg"],
  splash:       ["/sounds/splash_0.ogg"],
  throw:        ["/sounds/throw_0.ogg", "/sounds/throw_1.ogg"],
  runetracer:   ["/sounds/runetracer_0.ogg"],
  magicMissile: ["/sounds/magicMissile_0.ogg"],
  weaponSwitch: ["/sounds/weaponSwitch_0.ogg"],
  chestSpawn:   ["/sounds/chestSpawn_0.ogg"],
  chestOpen:    ["/sounds/chestOpen_0.ogg", "/sounds/chestOpen_1.ogg"],
  evolution:    ["/sounds/evolution_0.ogg", "/sounds/evolution_1.ogg"],
  gameOver:     ["/sounds/gameOver_0.ogg"],
  pentagram:    ["/sounds/pentagram_0.ogg"],
};

// Volume overrides per sound (base volume before master gain)
const SOUND_VOLUMES = {
  shoot: 0.5,
  machinegun: 0.25,
  shotgun: 0.6,
  rocket: 0.5,
  railgun: 0.5,
  bfg: 0.55,
  explosion: 0.6,
  zombieDeath: 0.35,
  zombieAttack: 0.3,
  bossRoar: 0.55,
  bossSlam: 0.6,
  bossCharge: 0.4,
  playerHit: 0.5,
  pickup: 0.3,
  xpPickup: 0.12,
  upgrade: 0.35,
  levelUp: 0.45,
  knife: 0.35,
  axe: 0.4,
  cross: 0.3,
  whip: 0.4,
  fireball: 0.35,
  lightning: 0.4,
  splash: 0.35,
  throw: 0.25,
  runetracer: 0.25,
  magicMissile: 0.3,
  weaponSwitch: 0.2,
  chestSpawn: 0.3,
  chestOpen: 0.35,
  evolution: 0.45,
  gameOver: 0.5,
  pentagram: 0.45,
};

// Playback rate ranges for variety [min, max]
const SOUND_PITCH = {
  shoot:        [0.9, 1.15],
  machinegun:   [0.9, 1.4],
  shotgun:      [0.85, 1.05],
  zombieDeath:  [0.7, 1.1],
  zombieAttack: [0.75, 1.15],
  playerHit:    [0.85, 1.15],
  knife:        [0.9, 1.15],
  axe:          [0.85, 1.1],
  cross:        [0.9, 1.1],
  whip:         [0.9, 1.15],
  throw:        [0.85, 1.2],
  explosion:    [0.8, 1.1],
  xpPickup:     [0.8, 1.3],
};

// Procedural fallbacks (used when audio files haven't loaded yet)
const PROCEDURAL_DEFS = {
  shoot: { type: "noise", duration: 0.08, volume: 0.35, decay: 25, filter: "lowpass", filterFreq: 2000 },
  machinegun: { type: "noise", duration: 0.04, volume: 0.25, decay: 30, filter: "lowpass", filterFreq: 2500 },
  shotgun: { type: "noise", duration: 0.12, volume: 0.5, decay: 8, filter: "lowpass", filterFreq: 1200 },
  rocket: { type: "noise", duration: 0.25, volume: 0.4, decay: 5, filter: "lowpass", filterFreq: 400, modulate: 20 },
  railgun: { type: "noise", duration: 0.15, volume: 0.35, decay: 12, filter: "bandpass", filterFreq: 800 },
  playerHit: { type: "noise", duration: 0.12, volume: 0.35, decay: 15, filter: "lowpass", filterFreq: 800, modulate: 40 },
  pickup: { type: "sweep", wave: "triangle", startFreq: 300, endFreq: 500, duration: 0.1, volume: 0.18 },
  xpPickup: { type: "sweep", wave: "triangle", startFreq: 400, endFreq: 600, duration: 0.06, volume: 0.08 },
  upgrade: { type: "sweep", wave: "triangle", startFreq: 250, endFreq: 450, duration: 0.15, volume: 0.2 },
  knife: { type: "noise", duration: 0.04, volume: 0.18, decay: 35, filter: "highpass", filterFreq: 2000 },
  axe: { type: "noise", duration: 0.1, volume: 0.28, decay: 12, filter: "lowpass", filterFreq: 800 },
  cross: { type: "noise", duration: 0.06, volume: 0.2, decay: 20, filter: "bandpass", filterFreq: 1200 },
  whip: { type: "noise", duration: 0.08, volume: 0.35, decay: 25, filter: "highpass", filterFreq: 1500, envelopeFn: "whip" },
  fireball: { type: "noise", duration: 0.18, volume: 0.25, decay: 8, filter: "lowpass", filterFreq: 500, modulate: 30 },
  runetracer: { type: "noise", duration: 0.08, volume: 0.15, decay: 18, filter: "bandpass", filterFreq: 1000 },
  throw: { type: "noise", duration: 0.06, volume: 0.15, decay: 22, filter: "highpass", filterFreq: 1200 },
  lightning: { type: "noise", duration: 0.12, volume: 0.3, decay: 18, filter: "highpass", filterFreq: 3000 },
  splash: { type: "noise", duration: 0.2, volume: 0.25, decay: 8, filter: "lowpass", filterFreq: 800, modulate: 60 },
  explosion: { type: "noise", duration: 0.4, volume: 0.6, decay: 4, filter: "lowpass", filterFreq: 400, modulate: 25 },
  weaponSwitch: { type: "noise", duration: 0.06, volume: 0.12, decay: 25, filter: "bandpass", filterFreq: 1500 },
  bfg: { type: "noise", duration: 0.4, volume: 0.5, decay: 4, filter: "lowpass", filterFreq: 300, modulate: 15 },
  bossSlam: { type: "noise", duration: 0.5, volume: 0.7, decay: 3, filter: "lowpass", filterFreq: 180, modulate: 20 },
  levelUp: {
    type: "multi",
    notes: [
      { freq: 220, delay: 0, duration: 0.15, wave: "triangle", volume: 0.2 },
      { freq: 330, delay: 60, duration: 0.15, wave: "triangle", volume: 0.2 },
      { freq: 440, delay: 120, duration: 0.2, wave: "triangle", volume: 0.22 },
    ],
  },
  chestSpawn: {
    type: "multi",
    notes: [
      { freq: 200, delay: 0, duration: 0.2, wave: "triangle", volume: 0.12 },
      { freq: 300, delay: 80, duration: 0.2, wave: "triangle", volume: 0.12 },
      { freq: 400, delay: 160, duration: 0.25, wave: "triangle", volume: 0.14 },
    ],
  },
  chestOpen: { type: "chord", frequencies: [220, 330], wave: "triangle", duration: 0.3, volume: 0.18 },
  zombieDeath: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 3);
      dist.curve = curve;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(dist);
      dist.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    },
  },
  zombieAttack: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 5);
      dist.curve = curve;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(dist);
      dist.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    },
  },
  gameOver: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 2);
      dist.curve = curve;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      osc.connect(dist);
      dist.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.5);
    },
  },
  bossRoar: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 6);
      dist.curve = curve;
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(65, now);
      osc1.frequency.exponentialRampToValueAtTime(30, now + 1.0);
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(50, now);
      osc2.frequency.exponentialRampToValueAtTime(25, now + 1.0);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.08);
      gain.gain.setValueAtTime(0.7, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc1.connect(dist);
      osc2.connect(dist);
      dist.connect(gain);
      gain.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.2);
      osc2.start(now);
      osc2.stop(now + 1.2);
    },
  },
  bossCharge: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(40, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.6);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 4);
      dist.curve = curve;
      osc.connect(dist);
      dist.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    },
  },
  pentagram: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const freqs = [55, 82.5, 110, 165];
      for (let i = 0; i < freqs.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freqs[i], now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        const dist = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let j = 0; j < 256; j++) curve[j] = Math.tanh((j / 128 - 1) * 3);
        dist.curve = curve;
        osc.connect(dist);
        dist.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.02);
        osc.stop(now + 1.0);
      }
    },
  },
  magicMissile: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.1);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15) * Math.sin(t * 200);
      }
      const ns = ctx.createBufferSource();
      ns.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.value = 0.18;
      ns.connect(ng);
      ng.connect(masterGain);
      ns.start(now);
    },
  },
  evolution: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const notes = [110, 165, 220, 330];
      for (let i = 0; i < notes.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(notes[i], now + i * 0.12);
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.5);
      }
    },
  },
};

export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.musicOscillators = [];
    this.initialized = false;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this._buffers = {};       // { soundName: AudioBuffer[] }
    this._loadingStarted = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.context.destination);
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);
      this._musicWasPlaying = false;
      this._setupVisibilityHandler();
      this.initialized = true;
      this._preloadSounds();
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  async _preloadSounds() {
    if (this._loadingStarted) return;
    this._loadingStarted = true;

    const entries = Object.entries(SOUND_FILES);
    const batchSize = 6;

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      await Promise.all(batch.map(([name, paths]) => this._loadSoundGroup(name, paths)));
    }
  }

  async _loadSoundGroup(name, paths) {
    const buffers = [];
    for (const path of paths) {
      try {
        const resp = await fetch(path);
        if (!resp.ok) continue;
        const arrayBuf = await resp.arrayBuffer();
        const audioBuf = await this.context.decodeAudioData(arrayBuf);
        buffers.push(audioBuf);
      } catch (_) {
        // File missing or decode failed — skip this variant
      }
    }
    if (buffers.length > 0) {
      this._buffers[name] = buffers;
    }
  }

  _setupVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (!this.context) return;
      if (document.hidden) {
        this._musicWasPlaying = this.musicOscillators.length > 0;
      } else {
        this.context.resume().then(() => {
          if (this._musicWasPlaying && this.musicEnabled) {
            this.stopMusic();
            this._createAmbientMusic();
          }
        });
      }
    });
  }

  playSound(name) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.context) return;
    if (this.context.state === "suspended") this.context.resume();

    const buffers = this._buffers[name];
    if (buffers && buffers.length > 0) {
      this._playBuffer(name, buffers);
      return;
    }

    // Procedural fallback
    const def = PROCEDURAL_DEFS[name];
    if (!def) return;
    switch (def.type) {
      case "sweep":  this._playSweep(def); break;
      case "noise":  this._playNoise(def); break;
      case "multi":  this._playMulti(def); break;
      case "chord":  this._playChord(def); break;
      case "custom": def.play(this.context, this.masterGain); break;
    }
  }

  _playBuffer(name, buffers) {
    const ctx = this.context;
    const buffer = buffers[Math.floor(Math.random() * buffers.length)];
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Apply pitch variation
    const pitchRange = SOUND_PITCH[name];
    if (pitchRange) {
      source.playbackRate.value = pitchRange[0] + Math.random() * (pitchRange[1] - pitchRange[0]);
    }

    const gain = ctx.createGain();
    gain.gain.value = SOUND_VOLUMES[name] ?? 0.4;

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  _playSweep(def) {
    const ctx = this.context;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = def.wave;
    osc.frequency.setValueAtTime(def.startFreq, now);

    if (def.freqStepAt) {
      osc.frequency.setValueAtTime(def.endFreq, now + def.freqStepAt);
    } else {
      osc.frequency.exponentialRampToValueAtTime(def.endFreq, now + def.duration);
    }

    gain.gain.setValueAtTime(def.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + def.duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + def.duration);
  }

  _playNoise(def) {
    const ctx = this.context;
    const bufferSize = Math.floor(ctx.sampleRate * def.duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    const decayRate = typeof def.decay === "number" ? def.decay : 1 / (def.duration * (def.decay || 0.1));

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      let sample = (Math.random() * 2 - 1) * Math.exp(-t * decayRate);
      if (def.envelopeFn === "whip") sample *= (1 - t);
      if (def.modulate) sample *= Math.sin(t * def.modulate);
      data[i] = sample;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    let lastNode = source;

    if (def.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = def.filter;
      filter.frequency.value = def.filterFreq;
      lastNode.connect(filter);
      lastNode = filter;
    }

    const gain = ctx.createGain();
    gain.gain.value = def.volume;
    lastNode.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  _playMulti(def) {
    for (const note of def.notes) {
      setTimeout(() => {
        const ctx = this.context;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.wave || "sine";
        osc.frequency.value = note.freq;
        gain.gain.setValueAtTime(note.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + note.duration);
      }, note.delay);
    }
  }

  _playChord(def) {
    const ctx = this.context;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(def.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + def.duration);
    gain.connect(this.masterGain);

    def.frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = def.wave || "sine";
      osc.frequency.setValueAtTime(freq, now);
      if (def.sweepEnd?.[i]) {
        osc.frequency.exponentialRampToValueAtTime(def.sweepEnd[i], now + def.duration);
      }
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + def.duration);
    });
  }

  // --- Music ---

  playMusic() {
    if (!this.musicEnabled) return;
    this.init();
    if (!this.context) return;
    this.stopMusic();
    this._createAmbientMusic();
  }

  _createAmbientMusic() {
    const ctx = this.context;

    this._addMusicLayer("sine", 36, 0.18);

    const droneOsc = ctx.createOscillator();
    droneOsc.type = "sawtooth";
    droneOsc.frequency.value = 55;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 200;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.06;
    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.musicGain);
    droneOsc.start();
    this.musicOscillators.push({ osc: droneOsc, gain: droneGain });

    const padOsc = ctx.createOscillator();
    padOsc.type = "triangle";
    padOsc.frequency.value = 58.3;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(padOsc.frequency);
    lfo.start();
    padOsc.connect(padGain);
    padGain.connect(this.musicGain);
    padOsc.start();
    this.musicOscillators.push({ osc: padOsc, gain: padGain }, { osc: lfo, gain: lfoGain });

    const highOsc = ctx.createOscillator();
    highOsc.type = "sine";
    highOsc.frequency.value = 311;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.015;
    const tremolo = ctx.createOscillator();
    tremolo.type = "sine";
    tremolo.frequency.value = 0.3;
    const tremoloGain = ctx.createGain();
    tremoloGain.gain.value = 0.012;
    tremolo.connect(tremoloGain);
    tremoloGain.connect(highGain.gain);
    tremolo.start();
    highOsc.connect(highGain);
    highGain.connect(this.musicGain);
    highOsc.start();
    this.musicOscillators.push({ osc: highOsc, gain: highGain }, { osc: tremolo, gain: tremoloGain });
  }

  _addMusicLayer(wave, freq, vol) {
    const osc = this.context.createOscillator();
    osc.type = wave;
    osc.frequency.value = freq;
    const gain = this.context.createGain();
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start();
    this.musicOscillators.push({ osc, gain });
  }

  stopMusic() {
    for (const { osc } of this.musicOscillators) {
      try { osc.stop(); } catch (_) { /* already stopped */ }
    }
    this.musicOscillators = [];
  }

  pauseMusic() {
    this.musicGain?.gain.setTargetAtTime(0, this.context.currentTime, 0.1);
  }

  resumeMusic() {
    this.musicGain?.gain.setTargetAtTime(0.15, this.context.currentTime, 0.1);
  }

  setVolume(volume) {
    if (this.masterGain) this.masterGain.gain.value = volume;
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem("zombieSurvivor_sound", this.soundEnabled);
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem("zombieSurvivor_music", this.musicEnabled);
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
    return this.musicEnabled;
  }
}
