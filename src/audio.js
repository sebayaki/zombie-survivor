export class AudioManager {
  constructor() {
    // Audio context
    this.context = null;
    this.masterGain = null;

    // Sound buffers
    this.sounds = {};

    // Music
    this.musicGain = null;
    this.musicOscillators = [];

    // Initialize on first user interaction
    this.initialized = false;

    // Settings
    this.soundEnabled = true;
    this.musicEnabled = true;
  }

  init() {
    if (this.initialized) return;

    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.context.destination);

      // Music gain
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
      console.log("Audio initialized");
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  playSound(name) {
    if (!this.soundEnabled) return;

    this.init();
    if (!this.context) return;

    // Resume context if suspended
    if (this.context.state === "suspended") {
      this.context.resume();
    }

    // Generate procedural sounds
    switch (name) {
      case "shoot":
        this.playShoot();
        break;
      case "shotgun":
        this.playShotgun();
        break;
      case "machinegun":
        this.playMachinegun();
        break;
      case "rocket":
        this.playRocket();
        break;
      case "railgun":
        this.playRailgun();
        break;
      case "bfg":
        this.playBFG();
        break;
      case "explosion":
        this.playExplosion();
        break;
      case "zombieDeath":
        this.playZombieDeath();
        break;
      case "zombieAttack":
        this.playZombieAttack();
        break;
      case "playerHit":
        this.playPlayerHit();
        break;
      case "pickup":
        this.playPickup();
        break;
      case "weaponSwitch":
        this.playWeaponSwitch();
        break;
      case "gameOver":
        this.playGameOver();
        break;
      // New VS-style sounds
      case "xpPickup":
        this.playXPPickup();
        break;
      case "levelUp":
        this.playLevelUp();
        break;
      case "upgrade":
        this.playUpgrade();
        break;
      case "whip":
        this.playWhip();
        break;
      case "knife":
        this.playKnife();
        break;
      case "axe":
        this.playAxe();
        break;
      case "cross":
        this.playCross();
        break;
      case "fireball":
        this.playFireball();
        break;
      case "lightning":
        this.playLightning();
        break;
      case "runetracer":
        this.playRunetracer();
        break;
      case "throw":
        this.playThrow();
        break;
      case "splash":
        this.playSplash();
        break;
      case "chestSpawn":
        this.playChestSpawn();
        break;
      case "chestOpen":
        this.playChestOpen();
        break;
      case "evolution":
        this.playEvolution();
        break;
    }
  }

  // Evolution sound - dramatic ascending chime
  playEvolution() {
    const now = this.context.currentTime;

    // Multiple ascending tones for epic feel
    const notes = [440, 554, 659, 880, 1108, 1318]; // A4 to E6
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.5);
    });

    // Final shimmer
    const shimmerOsc = this.context.createOscillator();
    const shimmerGain = this.context.createGain();

    shimmerOsc.type = "triangle";
    shimmerOsc.frequency.setValueAtTime(1760, now + 0.5);
    shimmerOsc.frequency.exponentialRampToValueAtTime(880, now + 1.5);

    shimmerGain.gain.setValueAtTime(0.2, now + 0.5);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.masterGain);

    shimmerOsc.start(now + 0.5);
    shimmerOsc.stop(now + 1.5);
  }

  // Procedural sound generators
  playShoot() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      100,
      this.context.currentTime + 0.1,
    );

    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.1,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  playShotgun() {
    // Noise burst
    const bufferSize = this.context.sampleRate * 0.15;
    const buffer = this.context.createBuffer(
      1,
      bufferSize,
      this.context.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const gain = this.context.createGain();
    gain.gain.value = 0.5;

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  playMachinegun() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      80,
      this.context.currentTime + 0.05,
    );

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.05,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }

  playRocket() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      50,
      this.context.currentTime + 0.3,
    );

    gain.gain.setValueAtTime(0.4, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.3,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  playRailgun() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2000, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      100,
      this.context.currentTime + 0.3,
    );

    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.3,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  playBFG() {
    // Deep bass + high whine
    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const gain = this.context.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(50, this.context.currentTime);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1500, this.context.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(
      200,
      this.context.currentTime + 0.5,
    );

    gain.gain.setValueAtTime(0.4, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.5,
    );

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.context.currentTime + 0.5);
    osc2.stop(this.context.currentTime + 0.5);
  }

  playExplosion() {
    // Low frequency noise
    const bufferSize = this.context.sampleRate * 0.5;
    const buffer = this.context.createBuffer(
      1,
      bufferSize,
      this.context.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4) * Math.sin(t * 50);
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;

    const gain = this.context.createGain();
    gain.gain.value = 0.7;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  playZombieDeath() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      50,
      this.context.currentTime + 0.2,
    );

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.2,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  playZombieAttack() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      100,
      this.context.currentTime + 0.1,
    );

    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.1,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  playPlayerHit() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(100, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      50,
      this.context.currentTime + 0.15,
    );

    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.15,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }

  playPickup() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      800,
      this.context.currentTime + 0.1,
    );

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.15,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }

  playWeaponSwitch() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.setValueAtTime(400, this.context.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.1,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  playGameOver() {
    // Descending tone
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      50,
      this.context.currentTime + 1,
    );

    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 1);
  }

  // New VS-style sounds
  playXPPickup() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1200,
      this.context.currentTime + 0.05,
    );

    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.08,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.08);
  }

  playLevelUp() {
    // Ascending arpeggio
    const notes = [400, 500, 600, 800];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          this.context.currentTime + 0.2,
        );

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.context.currentTime + 0.2);
      }, i * 80);
    });
  }

  playUpgrade() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      600,
      this.context.currentTime + 0.15,
    );

    gain.gain.setValueAtTime(0.25, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.2,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  playWhip() {
    // Crack sound
    const bufferSize = this.context.sampleRate * 0.1;
    const buffer = this.context.createBuffer(
      1,
      bufferSize,
      this.context.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20) * (1 - t);
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1000;

    const gain = this.context.createGain();
    gain.gain.value = 0.4;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  playKnife() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      200,
      this.context.currentTime + 0.05,
    );

    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.05,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }

  playAxe() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      100,
      this.context.currentTime + 0.15,
    );

    gain.gain.setValueAtTime(0.25, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.15,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }

  playCross() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(500, this.context.currentTime);

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.1,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  playFireball() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      100,
      this.context.currentTime + 0.2,
    );

    gain.gain.setValueAtTime(0.25, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.2,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  playLightning() {
    // Sharp crack
    const bufferSize = this.context.sampleRate * 0.15;
    const buffer = this.context.createBuffer(
      1,
      bufferSize,
      this.context.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15);
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2000;

    const gain = this.context.createGain();
    gain.gain.value = 0.35;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  playRunetracer() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      400,
      this.context.currentTime + 0.1,
    );

    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.15,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }

  playThrow() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      200,
      this.context.currentTime + 0.1,
    );

    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.1,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  playSplash() {
    // Water splash
    const bufferSize = this.context.sampleRate * 0.2;
    const buffer = this.context.createBuffer(
      1,
      bufferSize,
      this.context.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * Math.sin(t * 100);
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1500;

    const gain = this.context.createGain();
    gain.gain.value = 0.3;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  playChestSpawn() {
    // Magical chime
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          this.context.currentTime + 0.3,
        );

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.context.currentTime + 0.3);
      }, i * 100);
    });
  }

  playChestOpen() {
    // Triumphant sound
    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const gain = this.context.createGain();

    osc1.type = "sine";
    osc1.frequency.value = 523;

    osc2.type = "sine";
    osc2.frequency.value = 659;

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.4,
    );

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.context.currentTime + 0.4);
    osc2.stop(this.context.currentTime + 0.4);
  }

  playMusic() {
    if (!this.musicEnabled) return;

    this.init();
    if (!this.context) return;

    // Stop any existing music
    this.stopMusic();

    // Create a dark ambient loop
    this.createAmbientMusic();
  }

  createAmbientMusic() {
    // Bass drone
    const bassOsc = this.context.createOscillator();
    bassOsc.type = "sine";
    bassOsc.frequency.value = 55; // A1

    const bassGain = this.context.createGain();
    bassGain.gain.value = 0.15;

    bassOsc.connect(bassGain);
    bassGain.connect(this.musicGain);
    bassOsc.start();

    this.musicOscillators.push({ osc: bassOsc, gain: bassGain });

    // Creepy pad
    const padOsc = this.context.createOscillator();
    padOsc.type = "triangle";
    padOsc.frequency.value = 110; // A2

    const padGain = this.context.createGain();
    padGain.gain.value = 0.08;

    // LFO for pad
    const lfo = this.context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.1;

    const lfoGain = this.context.createGain();
    lfoGain.gain.value = 5;

    lfo.connect(lfoGain);
    lfoGain.connect(padOsc.frequency);
    lfo.start();

    padOsc.connect(padGain);
    padGain.connect(this.musicGain);
    padOsc.start();

    this.musicOscillators.push({ osc: padOsc, gain: padGain });
    this.musicOscillators.push({ osc: lfo, gain: lfoGain });

    // High tension tone
    const highOsc = this.context.createOscillator();
    highOsc.type = "sine";
    highOsc.frequency.value = 440; // A4

    const highGain = this.context.createGain();
    highGain.gain.value = 0.03;

    // Tremolo
    const tremolo = this.context.createOscillator();
    tremolo.type = "sine";
    tremolo.frequency.value = 4;

    const tremoloGain = this.context.createGain();
    tremoloGain.gain.value = 0.02;

    tremolo.connect(tremoloGain);
    tremoloGain.connect(highGain.gain);
    tremolo.start();

    highOsc.connect(highGain);
    highGain.connect(this.musicGain);
    highOsc.start();

    this.musicOscillators.push({ osc: highOsc, gain: highGain });
    this.musicOscillators.push({ osc: tremolo, gain: tremoloGain });
  }

  stopMusic() {
    this.musicOscillators.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
    });
    this.musicOscillators = [];
  }

  pauseMusic() {
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.1);
    }
  }

  resumeMusic() {
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0.15, this.context.currentTime, 0.1);
    }
  }

  setVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem("zombieSurvivor_sound", this.soundEnabled);
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem("zombieSurvivor_music", this.musicEnabled);

    // If music was playing, stop it
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      // If turning on and game is playing, start music
      this.playMusic();
    }

    return this.musicEnabled;
  }
}
