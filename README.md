# Dopa-Dopa 🐔

> A chicken escaping hungry farmers! Built with DopamineJS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![DopamineJS](https://img.shields.io/badge/dopaminejs-2.0.0-ff6b35.svg)

## 🎮 About

**Dopa-Dopa** is a Flappy Bird-style endless runner game featuring a brave chicken trying to escape from hungry farmers! Jump over obstacles like rocks, barns, and fences to survive as long as possible.

This game serves as a **complete showcase** of [DopamineJS](https://github.com/BaryoDev/dopaminejs) v2.0.0, demonstrating:
- ✅ Core game engine features
- ✅ WebGL particle system (10,000+ particles)
- ✅ Theme engine (retro theme)
- ✅ Component-based architecture
- ✅ Reward system integration
- ✅ Touch and keyboard controls

## 🚀 Quick Start

### Play Online
[Play Dopa-Dopa Now!](https://playground.baryo.dev/dopadopa/)

### Run Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🎯 How to Play

- **Press ENTER** or **TAP the screen** to make Dopa-Dopa jump
- Avoid obstacles (rocks, barns, fences)
- Survive as long as possible to get a high score
- The game gets progressively harder!

## 🛠️ Built With

- **[DopamineJS](https://www.npmjs.com/package/dopaminejs)** v2.0.0 - Core game engine
- **[dopaminejs-plugins](https://www.npmjs.com/package/dopaminejs-plugins)** v1.0.0 - WebGL particles & more
- **[dopaminejs-themes](https://www.npmjs.com/package/dopaminejs-themes)** v1.0.0 - Retro theme
- **[Vite](https://vitejs.dev/)** - Build tool

## 📁 Project Structure

```
dopa-dopa/
├── src/
│   ├── main.js              # Game initialization
│   └── components/
│       ├── Player.js        # Chicken character
│       ├── Obstacle.js      # Rocks, barns, fences
│       ├── Background.js    # Scrolling background
│       └── GameManager.js   # Obstacle spawning
├── index.html               # Game UI
├── package.json
└── README.md
```

## 🎨 Features Showcase

### DopamineJS Core
- Component-based game objects
- Scene management
- Game loop with fixed timestep
- Rendering system

### WebGL Particles
- Jump effects (yellow sparkles)
- Death explosion (orange particles)
- Score celebration (green sparkles)

### Theme Engine
- Retro 8-bit aesthetic
- Press Start 2P font
- Pixel-perfect rendering

## 🏆 High Score

Your high score is saved locally in your browser!

## 📝 License

MIT License - feel free to use this as a template for your own games!

## 🙏 Credits

- Built by [BaryoDev](https://github.com/BaryoDev)
- Powered by [DopamineJS](https://github.com/BaryoDev/dopaminejs)
- Inspired by Flappy Bird

## 🔗 Links

- [DopamineJS Documentation](https://github.com/BaryoDev/dopaminejs)
- [Plugin Development Guide](https://github.com/BaryoDev/dopaminejs/blob/main/docs/PLUGIN_GUIDE.md)
- [Report Issues](https://github.com/BaryoDev/dopa-dopa/issues)

---

**Have fun and good luck escaping the farmers!** 🐔💨
