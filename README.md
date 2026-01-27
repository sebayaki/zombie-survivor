# Zombie Survivor

A Vampire Survivors-style 3D arena survival game built with Three.js. Fight endless waves of zombies, collect XP, level up, and choose powerful upgrades to survive!

## How to Play

### Controls

**Desktop:**

- **WASD / Arrow Keys** - Move your character
- **Mouse** - Move toward cursor
- **ESC** - Pause game

**Mobile:**

- **Touch & Drag** - Virtual joystick appears where you touch

### Gameplay

- Weapons fire automatically at nearby enemies
- Kill zombies to drop XP gems - collect them to level up
- Each level up lets you choose from 3 random upgrades
- Earn gold to buy permanent power-ups in the shop
- Survive as long as possible against increasingly difficult waves

### Upgrades

Level up to unlock and upgrade:

- **Weapons** - Magic Wand, Fire Wand, Lightning Ring, and more
- **Passive Items** - Spinach (damage), Armor, Wings (speed), etc.
- **Evolutions** - Combine weapons with items for ultimate power

## Development

### Prerequisites

- Node.js 18+

### Setup

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
```

Output is in the `dist/` folder, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Deployment

This project is configured for automatic deployment to Vercel. Just push to your repository and Vercel will build and deploy automatically.

## Tech Stack

- **Three.js** - 3D rendering
- **Vite** - Build tool and dev server
- **Vanilla JS** - No framework dependencies

## Credits

- [Three.js](https://threejs.org)
- MD2 Models from Three.js examples (Quake II assets)
