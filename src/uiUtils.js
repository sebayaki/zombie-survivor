import { RARITY_COLORS, RARITY_BORDER_COLORS } from "./utils.js";

/**
 * Remove all child nodes from an element (faster than innerHTML = "").
 */
export function clearChildren(el) {
  while (el.lastChild) el.removeChild(el.lastChild);
}

/**
 * Create level pips (small dots showing current / max level).
 * @returns {HTMLElement}
 */
export function createLevelPips(currentLevel, maxLevel, opts = {}) {
  const container = document.createElement("div");
  container.className = opts.className || "upgrade-level-display";
  for (let i = 0; i < maxLevel; i++) {
    const pip = document.createElement("div");
    pip.className = opts.pipClass || "level-pip";
    if (i < currentLevel) {
      pip.classList.add("filled");
    } else if (i === currentLevel) {
      pip.classList.add("next");
    }
    container.appendChild(pip);
  }
  return container;
}

/**
 * Return the CSS class string for a given rarity value.
 */
export function getRarityClass(rarity) {
  return `rarity-${rarity || "common"}`;
}

/**
 * Build a standard icon-box element (used for weapon icons & passive item icons in HUD).
 */
export function createIconBox(def, level, opts = {}) {
  const boxClass = opts.boxClass || "weapon-icon-box";
  const maxLevel = def.maxLevel || 8;

  const box = document.createElement("div");
  box.className = `${boxClass} rarity-${def.rarity || "common"}`;
  if (level >= maxLevel) box.classList.add("max-level");

  const icon = document.createElement("span");
  icon.className = "icon";
  icon.innerHTML = def.icon;
  if (def.iconColor) icon.style.color = def.iconColor;
  box.appendChild(icon);

  const lvl = document.createElement("span");
  lvl.className = "level";
  lvl.textContent = level;
  box.appendChild(lvl);

  box.title = `${def.name} Lv.${level}`;
  return box;
}

/**
 * Format a bonus value with its unit for display.
 */
export function formatBonus(value, unit) {
  if (unit === "%") return `+${value}%`;
  if (unit === "/s") return `+${typeof value === "number" && value % 1 !== 0 ? value.toFixed(2) : value}/s`;
  return `+${value}`;
}
