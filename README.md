# Zombi Survival

A 3D arena survival shooter game built with Three.js where you fight waves of zombies.

## How to Play

### Controls

- **WASD** - Move your character
- **Mouse** - Aim
- **Left Click** - Shoot
- **1-6** - Switch weapons

### Objective

Survive as long as possible against increasingly difficult waves of zombies. Kill zombies to earn points and pick up weapons and health packs to stay alive.

### Weapons

1. **Blaster** - Starting weapon, unlimited ammo, moderate damage
2. **Shotgun** - Spread shot, high close-range damage
3. **Machine Gun** - Rapid fire, low damage per shot
4. **Rocket Launcher** - Explosive area damage
5. **Railgun** - High damage, slow fire rate
6. **BFG** - Ultimate weapon, massive damage

## Running the Game

### Option 1: Local Server (Recommended)

Using Python:

```bash
cd zombierun
python -m http.server 8080
```

Using Node.js:

```bash
npx serve .
```

Then open http://localhost:8080 in your browser.

### Option 2: VS Code Live Server

If you have the Live Server extension, right-click `index.html` and select "Open with Live Server".

## Technical Details

- Built with Three.js (ES Modules)
- Uses MD2 character models from the Three.js examples
- No build tools required - runs directly in modern browsers

## Credits

- Three.js: https://threejs.org
- MD2 Models: Quake II assets from Three.js examples
