import * as THREE from "three";

/**
 * Fisher-Yates shuffle. Returns a new shuffled array.
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Find a valid spawn position within a radius range that avoids obstacles and
 * a minimum clearance from existing positions.
 *
 * @param {object} opts
 * @param {number} opts.minDist - Minimum distance from origin (or player)
 * @param {number} opts.maxDist - Maximum distance from origin (or player)
 * @param {number} opts.arenaSize - Arena boundary
 * @param {Array}  opts.obstacles - Array of { position: Vector3, size: Vector3, radius?: number }
 * @param {Array}  [opts.avoid] - Array of { position: Vector3 } to keep distance from
 * @param {number} [opts.avoidDist=2] - Minimum distance from 'avoid' items
 * @param {number} [opts.minSeparation=2] - Min separation from obstacles
 * @param {number} [opts.clearCenter=5] - Minimum distance from (0,0)
 * @param {THREE.Vector3} [opts.origin] - Center point (defaults to world origin)
 * @param {number} [opts.maxAttempts=30] - Max tries before returning null
 */
export function findSpawnPosition(opts) {
  const {
    minDist = 5,
    maxDist = 40,
    arenaSize = 50,
    obstacles = [],
    avoid = [],
    avoidDist = 2,
    minSeparation = 2,
    clearCenter = 0,
    origin = null,
    maxAttempts = 30,
  } = opts;

  const ox = origin?.x ?? 0;
  const oz = origin?.z ?? 0;
  const bounds = arenaSize - 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const x = ox + Math.cos(angle) * dist;
    const z = oz + Math.sin(angle) * dist;

    if (Math.abs(x) > bounds || Math.abs(z) > bounds) continue;

    let valid = true;

    if (clearCenter > 0 && Math.sqrt(x * x + z * z) < clearCenter) continue;

    for (const obstacle of obstacles) {
      const dx = x - obstacle.position.x;
      const dz = z - obstacle.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const requiredDist = minSeparation + (obstacle.radius || 1);
      if (distance < requiredDist) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    for (const item of avoid) {
      const pos = item.position || item.mesh?.position;
      if (!pos) continue;
      const dx = x - pos.x;
      const dz = z - pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < avoidDist) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    return new THREE.Vector3(x, 0, z);
  }

  return null;
}

/**
 * Inject a <style> tag into document.head. Returns the style element.
 */
export function injectCSS(css, id = null) {
  if (id) {
    const existing = document.getElementById(id);
    if (existing) return existing;
  }
  const style = document.createElement("style");
  if (id) style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

/**
 * Create a DOM element with optional class, textContent, and children.
 */
export function createElement(tag, opts = {}) {
  const el = document.createElement(tag);
  if (opts.id) el.id = opts.id;
  if (opts.className) el.className = opts.className;
  if (opts.textContent != null) el.textContent = opts.textContent;
  if (opts.innerHTML != null) el.innerHTML = opts.innerHTML;
  if (opts.parent) opts.parent.appendChild(el);
  if (opts.children) {
    for (const child of opts.children) el.appendChild(child);
  }
  return el;
}
