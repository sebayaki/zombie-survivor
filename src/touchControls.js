// Touch Controls - Virtual joystick for mobile devices

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.isTouch = false;
    this.joystickActive = false;
    this.enabled = false;

    // Joystick state
    this.joystickVector = { x: 0, y: 0 };
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickTouchId = null;

    // DOM elements
    this.joystickContainer = document.getElementById("touch-joystick");
    this.joystickBase = document.getElementById("joystick-base");
    this.joystickHandle = document.getElementById("joystick-handle");
    this.settingsButton = document.getElementById("settings-button");

    // Check if this is a touch device
    this.detectTouch();

    // Set up event listeners
    this.setupEventListeners();
  }

  detectTouch() {
    // Check for touch capability
    this.isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;

    if (this.isTouch) {
      document.body.classList.add("touch-device");
    }
  }

  setupEventListeners() {
    // Settings button
    if (this.settingsButton) {
      this.settingsButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.game.isPlaying && !this.game.isPaused) {
          if (
            (this.game.upgradeUI && this.game.upgradeUI.isOpen) ||
            (this.game.chestUI && this.game.chestUI.isOpen)
          ) {
            return;
          }
          this.game.pause();
        }
      });
    }

    // Touch anywhere on screen to create joystick
    document.addEventListener("touchstart", (e) => this.onTouchStart(e), {
      passive: false,
    });
    document.addEventListener("touchmove", (e) => this.onTouchMove(e), {
      passive: false,
    });
    document.addEventListener("touchend", (e) => this.onTouchEnd(e), {
      passive: false,
    });
    document.addEventListener("touchcancel", (e) => this.onTouchCancel(e), {
      passive: false,
    });
  }

  onTouchStart(e) {
    // Only work when enabled (game is playing)
    if (!this.enabled) return;

    // Ignore if touching UI elements
    if (
      e.target.closest("#hud") ||
      e.target.closest(".overlay:not(.hidden)") ||
      e.target.closest("#settings-button") ||
      e.target.closest(".upgrade-overlay") ||
      e.target.closest(".upgrade-choice") ||
      e.target.closest(".arcana-overlay") ||
      e.target.closest(".chest-overlay") ||
      e.target.closest(".powerup-shop-overlay") ||
      e.target.closest("button")
    ) {
      return;
    }

    // Don't prevent default on UI elements
    e.preventDefault();

    // If joystick thinks it's active, verify the tracked touch still exists
    if (this.joystickActive) {
      let staleTouch = true;
      for (const t of e.touches) {
        if (t.identifier === this.joystickTouchId) {
          staleTouch = false;
          break;
        }
      }
      if (!staleTouch) return;
      this._resetJoystick();
    }

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;
    this.joystickActive = true;

    // Position joystick at touch location
    this.joystickCenter = {
      x: touch.clientX,
      y: touch.clientY,
    };

    // Show and position the joystick container
    if (this.joystickContainer) {
      this.joystickContainer.classList.add("active");
      // Center the joystick base on the touch point
      const baseSize = 120; // Match CSS
      this.joystickContainer.style.left = `${touch.clientX - baseSize / 2}px`;
      this.joystickContainer.style.top = `${touch.clientY - baseSize / 2}px`;
    }

    // Reset handle position
    if (this.joystickHandle) {
      this.joystickHandle.style.transform = "translate(0, 0)";
    }
  }

  onTouchMove(e) {
    if (!this.joystickActive || !this.enabled) return;

    // Find our touch
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.joystickTouchId) {
        e.preventDefault();
        this.updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  onTouchEnd(e) {
    if (!this.joystickActive) return;

    for (const touch of e.changedTouches) {
      if (touch.identifier === this.joystickTouchId) {
        this._resetJoystick();
        break;
      }
    }
  }

  onTouchCancel(e) {
    if (!this.joystickActive) return;

    // touchcancel can fire with mismatched identifiers, so always reset
    // if our tracked touch is no longer in the active touches list
    let found = false;
    for (const t of e.touches) {
      if (t.identifier === this.joystickTouchId) {
        found = true;
        break;
      }
    }
    if (!found) this._resetJoystick();
  }

  _resetJoystick() {
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickVector = { x: 0, y: 0 };
    if (this.joystickContainer) {
      this.joystickContainer.classList.remove("active");
    }
    if (this.joystickHandle) {
      this.joystickHandle.style.transform = "translate(0, 0)";
    }
  }

  updateJoystick(touchX, touchY) {
    const dx = touchX - this.joystickCenter.x;
    const dy = touchY - this.joystickCenter.y;

    // Calculate distance and clamp to max radius
    const maxRadius = 45; // Allow slightly more travel
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDistance = Math.min(distance, maxRadius);

    // Normalize direction
    let nx = 0,
      ny = 0;
    if (distance > 0) {
      nx = dx / distance;
      ny = dy / distance;
    }

    // Set joystick vector (-1 to 1 range)
    this.joystickVector = {
      x: nx * (clampedDistance / maxRadius),
      y: ny * (clampedDistance / maxRadius),
    };

    // Update handle visual position
    if (this.joystickHandle) {
      const handleX = nx * clampedDistance;
      const handleY = ny * clampedDistance;
      this.joystickHandle.style.transform = `translate(${handleX}px, ${handleY}px)`;
    }
  }

  // Show/hide joystick based on game state
  show() {
    if (this.isTouch) {
      this.enabled = true;
      this.settingsButton?.classList.remove("hidden");
    }
  }

  hide() {
    this.enabled = false;
    this._resetJoystick();
    this.settingsButton?.classList.add("hidden");
  }

  // Get current movement vector for player
  getMovementVector() {
    return this.joystickVector;
  }

  // Check if joystick is actively being used
  isActive() {
    return (
      this.joystickActive ||
      Math.abs(this.joystickVector.x) > 0.1 ||
      Math.abs(this.joystickVector.y) > 0.1
    );
  }
}
