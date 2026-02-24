// Sound definition types: 'sweep', 'noise', 'multi'
// sweep: oscillator with frequency sweep
// noise: white noise burst with optional filter
// multi: multiple notes played in sequence

const SOUND_DEFS = {
  shoot:     { type: "sweep", wave: "square",   startFreq: 400,  endFreq: 100,  duration: 0.1,  volume: 0.3 },
  machinegun:{ type: "sweep", wave: "sawtooth", startFreq: 200,  endFreq: 80,   duration: 0.05, volume: 0.2 },
  rocket:    { type: "sweep", wave: "sawtooth", startFreq: 100,  endFreq: 50,   duration: 0.3,  volume: 0.4 },
  railgun:   { type: "sweep", wave: "sine",     startFreq: 2000, endFreq: 100,  duration: 0.3,  volume: 0.3 },
  zombieDeath:{ type: "sweep", wave: "sawtooth", startFreq: 200,  endFreq: 50,   duration: 0.2,  volume: 0.2 },
  zombieAttack:{ type: "sweep", wave: "sawtooth", startFreq: 150, endFreq: 100,  duration: 0.1,  volume: 0.15 },
  playerHit: { type: "sweep", wave: "square",   startFreq: 100,  endFreq: 50,   duration: 0.15, volume: 0.3 },
  pickup:    { type: "sweep", wave: "sine",     startFreq: 400,  endFreq: 800,  duration: 0.15, volume: 0.2 },
  xpPickup:  { type: "sweep", wave: "sine",     startFreq: 600,  endFreq: 1200, duration: 0.08, volume: 0.1 },
  upgrade:   { type: "sweep", wave: "sine",     startFreq: 300,  endFreq: 600,  duration: 0.2,  volume: 0.25 },
  knife:     { type: "sweep", wave: "sawtooth", startFreq: 800,  endFreq: 200,  duration: 0.05, volume: 0.15 },
  axe:       { type: "sweep", wave: "sawtooth", startFreq: 300,  endFreq: 100,  duration: 0.15, volume: 0.25 },
  cross:     { type: "sweep", wave: "triangle", startFreq: 500,  endFreq: 500,  duration: 0.1,  volume: 0.2 },
  fireball:  { type: "sweep", wave: "sawtooth", startFreq: 200,  endFreq: 100,  duration: 0.2,  volume: 0.25 },
  runetracer:{ type: "sweep", wave: "sine",     startFreq: 800,  endFreq: 400,  duration: 0.15, volume: 0.15 },
  throw:     { type: "sweep", wave: "sine",     startFreq: 400,  endFreq: 200,  duration: 0.1,  volume: 0.15 },

  weaponSwitch: {
    type: "sweep", wave: "sine", startFreq: 600, endFreq: 400,
    duration: 0.1, volume: 0.15, freqStepAt: 0.05,
  },

  shotgun:   { type: "noise", duration: 0.15, volume: 0.5, decay: 0.1 },
  whip:      { type: "noise", duration: 0.1,  volume: 0.4, decay: 20, filter: "highpass", filterFreq: 1000, envelopeFn: "whip" },
  lightning: { type: "noise", duration: 0.15, volume: 0.35, decay: 15, filter: "highpass", filterFreq: 2000 },
  splash:    { type: "noise", duration: 0.2,  volume: 0.3, decay: 10, filter: "lowpass", filterFreq: 1500, modulate: 100 },
  explosion: { type: "noise", duration: 0.5,  volume: 0.7, decay: 4, filter: "lowpass", filterFreq: 500, modulate: 50 },

  gameOver: { type: "sweep", wave: "sawtooth", startFreq: 400, endFreq: 50, duration: 1.0, volume: 0.3 },

  levelUp: {
    type: "multi",
    notes: [
      { freq: 400, delay: 0,   duration: 0.2, wave: "sine", volume: 0.2 },
      { freq: 500, delay: 80,  duration: 0.2, wave: "sine", volume: 0.2 },
      { freq: 600, delay: 160, duration: 0.2, wave: "sine", volume: 0.2 },
      { freq: 800, delay: 240, duration: 0.2, wave: "sine", volume: 0.2 },
    ],
  },

  chestSpawn: {
    type: "multi",
    notes: [
      { freq: 523, delay: 0,   duration: 0.3, wave: "sine", volume: 0.15 },
      { freq: 659, delay: 100, duration: 0.3, wave: "sine", volume: 0.15 },
      { freq: 784, delay: 200, duration: 0.3, wave: "sine", volume: 0.15 },
    ],
  },

  chestOpen: { type: "chord", frequencies: [523, 659], wave: "sine", duration: 0.4, volume: 0.2 },

  bossRoar: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 4);
      dist.curve = curve;
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.8);
      osc2.type = "square";
      osc2.frequency.setValueAtTime(60, now);
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.8);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.1);
      gain.gain.setValueAtTime(0.6, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
      osc1.connect(dist);
      osc2.connect(dist);
      dist.connect(gain);
      gain.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.0);
      osc2.start(now);
      osc2.stop(now + 1.0);

      const noiseLen = Math.floor(ctx.sampleRate * 0.8);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * Math.exp(-(i / noiseLen) * 3);
      const ns = ctx.createBufferSource();
      ns.buffer = noiseBuf;
      const nf = ctx.createBiquadFilter();
      nf.type = "lowpass";
      nf.frequency.value = 300;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.3, now);
      ng.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      ns.connect(nf);
      nf.connect(ng);
      ng.connect(masterGain);
      ns.start(now);
    },
  },

  bossSlam: { type: "noise", duration: 0.6, volume: 0.8, decay: 3, filter: "lowpass", filterFreq: 200, modulate: 30 },

  bossCharge: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.6);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    },
  },

  bfg: { type: "chord", frequencies: [50, 1500], wave: "sine", duration: 0.5, volume: 0.4, sweepEnd: [50, 200] },

  pentagram: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const freqs = [261.6, 329.6, 392, 523.3];
      for (let i = 0; i < freqs.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freqs[i], now);
        osc.frequency.exponentialRampToValueAtTime(freqs[i] * 1.5, now + 0.6);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
        gain.gain.setValueAtTime(0.18, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.02);
        osc.stop(now + 0.8);
      }
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(1047, now);
      shimmer.frequency.exponentialRampToValueAtTime(523, now + 0.6);
      sGain.gain.setValueAtTime(0.08, now + 0.1);
      sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      shimmer.connect(sGain);
      sGain.connect(masterGain);
      shimmer.start(now + 0.1);
      shimmer.stop(now + 0.8);
    },
  },

  magicMissile: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
      const sparkle = ctx.createOscillator();
      const spGain = ctx.createGain();
      sparkle.type = "triangle";
      sparkle.frequency.setValueAtTime(1200, now);
      sparkle.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      spGain.gain.setValueAtTime(0.06, now);
      spGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      sparkle.connect(spGain);
      spGain.connect(masterGain);
      sparkle.start(now);
      sparkle.stop(now + 0.12);
    },
  },

  evolution: {
    type: "custom",
    play: (ctx, masterGain) => {
      const now = ctx.currentTime;
      const notes = [440, 554, 659, 880, 1108, 1318];
      for (let i = 0; i < notes.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(notes[i], now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      }
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = "triangle";
      shimmerOsc.frequency.setValueAtTime(1760, now + 0.5);
      shimmerOsc.frequency.exponentialRampToValueAtTime(880, now + 1.5);
      shimmerGain.gain.setValueAtTime(0.2, now + 0.5);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(masterGain);
      shimmerOsc.start(now + 0.5);
      shimmerOsc.stop(now + 1.5);
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
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  playSound(name) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.context) return;
    if (this.context.state === "suspended") this.context.resume();

    const def = SOUND_DEFS[name];
    if (!def) return;

    switch (def.type) {
      case "sweep":  this._playSweep(def); break;
      case "noise":  this._playNoise(def); break;
      case "multi":  this._playMulti(def); break;
      case "chord":  this._playChord(def); break;
      case "custom": def.play(this.context, this.masterGain); break;
    }
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

    // Bass drone
    this._addMusicLayer("sine", 55, 0.15);

    // Creepy pad with LFO
    const padOsc = ctx.createOscillator();
    padOsc.type = "triangle";
    padOsc.frequency.value = 110;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.08;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(padOsc.frequency);
    lfo.start();
    padOsc.connect(padGain);
    padGain.connect(this.musicGain);
    padOsc.start();
    this.musicOscillators.push({ osc: padOsc, gain: padGain }, { osc: lfo, gain: lfoGain });

    // High tension tone with tremolo
    const highOsc = ctx.createOscillator();
    highOsc.type = "sine";
    highOsc.frequency.value = 440;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.03;
    const tremolo = ctx.createOscillator();
    tremolo.type = "sine";
    tremolo.frequency.value = 4;
    const tremoloGain = ctx.createGain();
    tremoloGain.gain.value = 0.02;
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
