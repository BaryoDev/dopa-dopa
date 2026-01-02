/**
 * Dopa-Dopa - Main Game
 * A showcase of DopamineJS with all plugins and themes
 * Refactored for DopamineJS v2.0.1 core API
 */

import { Game, GameObject, Component, Scene } from 'dopaminejs';
import { WebGLParticlePlugin } from 'dopaminejs-plugin-webgl-particles';
import { DebugOverlayPlugin } from 'dopaminejs-plugin-debug-overlay';
import { getSoundPack, SoundPacks } from 'dopaminejs-plugin-sound-packs';
import { BattlePassPlugin, LeaderboardPlugin } from 'dopaminejs-plugin-ecosystem';
import { HowlerAudioPlugin } from 'dopaminejs-plugin-howler-audio';
import { FeedbackPlugin } from 'dopaminejs-plugin-feedback-effects';
import { themeEngine } from 'dopaminejs-themes';

// Set retro theme
themeEngine.setTheme('retro');


// Quick manual object registry for search
const Registry = {
    player: null,
    obstacles: [],
    gameManager: null
};

// Initialize game
const game = new Game({
    canvas: document.getElementById('game-canvas'),
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB'
});

// Add a dummy rewards system to satisfy plugins
game.kernel.systems.register('rewards', {
    get: () => ({ XP: 0, level: 1 }),
    gainXP: (amount) => console.log(`RewardSystem: Gained ${amount} XP`)
});

// Add all plugins
try {
    game.kernel.plugins.use(WebGLParticlePlugin);
    game.kernel.plugins.use(DebugOverlayPlugin);
    game.kernel.plugins.use(BattlePassPlugin);
    game.kernel.plugins.use(LeaderboardPlugin);
    game.kernel.plugins.use(HowlerAudioPlugin);
    game.kernel.plugins.use(FeedbackPlugin);

    // Setup sounds (using retro pack as base)
    const audio = game.kernel.systems.get('audio');
    if (audio) {
        audio.register('jump', {
            src: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' // Placeholder arcade jump
        });
        audio.register('collision', {
            src: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3' // Placeholder arcade bonk
        });
        audio.register('achievement', {
            src: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3' // Placeholder arcade win
        });
    }
} catch (err) {
    console.error('Plugin registration failed:', err);
}

// Create scene
const gameScene = new Scene();
game.setScene(gameScene);

const GROUND_Y = 500;
const SCROLL_SPEED = 300;

/**
 * Player Component
 */
class Player extends Component {
    constructor() {
        super();
        this.velocityY = 0;
        this.gravity = 1500; // Increased feel
        this.jumpForce = -600;
        this.isAlive = true;
        this.isGrounded = false;
        this.radius = 20; // Reduced collision
        this.runCycle = 0;
    }

    update(deltaTime) {
        if (!this.isAlive || window.gameState() !== 'playing') return;

        // Apply gravity
        this.velocityY += this.gravity * deltaTime;
        this.gameObject.y += this.velocityY * deltaTime;

        // Ground collision (Bottom of bird touches ground)
        if (this.gameObject.y >= GROUND_Y - 20) {
            this.gameObject.y = GROUND_Y - 20;
            this.velocityY = 0;
            if (!this.isGrounded) {
                // Land particles
                this.emitDust();
            }
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Run animation
        if (this.isGrounded) {
            this.runCycle += deltaTime * 15;
            if (Math.random() < 0.1) this.emitDust();
        }
    }

    render(ctx) {
        ctx.save();

        // Tilt
        const tilt = Math.min(Math.max(this.velocityY / 1000, -0.2), 0.2);
        ctx.rotate(tilt);

        // Legs (Running animation)
        if (this.isAlive) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            const leftLegY = Math.sin(this.runCycle) * 10;
            const rightLegY = Math.sin(this.runCycle + Math.PI) * 10;

            // Left leg
            ctx.beginPath();
            ctx.moveTo(-8, 10);
            ctx.lineTo(-8 + (this.isGrounded ? leftLegY : 5), 20 + (this.isGrounded ? Math.max(0, -leftLegY) : 0));
            ctx.stroke();

            // Right leg
            ctx.beginPath();
            ctx.moveTo(8, 10);
            ctx.lineTo(8 + (this.isGrounded ? rightLegY : -5), 20 + (this.isGrounded ? Math.max(0, -rightLegY) : 0));
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.ellipse(0, 0, 25, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 2; ctx.stroke();

        // Wing
        const wingY = this.isGrounded ? 5 : 5 + Math.sin(Date.now() / 50) * 5;
        ctx.fillStyle = '#FFA500';
        ctx.beginPath(); ctx.ellipse(-5, wingY, 12, 8, -0.3, 0, Math.PI * 2); ctx.fill();

        // Head
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(15, -10, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Eye
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(20, -12, 4, 0, Math.PI * 2); ctx.fill();

        // Beak
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath(); ctx.moveTo(28, -8); ctx.lineTo(40, -5); ctx.lineTo(28, -2); ctx.closePath(); ctx.fill();

        ctx.restore();
    }

    jump() {
        if (!this.isAlive || !this.isGrounded) return;
        this.velocityY = this.jumpForce;
        this.isGrounded = false;

        // Play jump sound
        const audio = this.kernel?.systems.get('audio');
        if (audio) {
            audio.play('jump', { volume: 0.5 });
        }

        const particles = this.kernel?.systems.get('particles');
        if (particles) {
            particles.emit({
                x: this.gameObject.x,
                y: this.gameObject.y + 20,
                count: 8,
                color: [1, 0.9, 0.4, 1],
                speed: 80
            });
        }
    }

    emitDust() {
        const particles = this.kernel?.systems.get('particles');

        if (particles) {
            // Use chicken's actual position - dust at the feet
            particles.emit({
                x: this.gameObject.x - 5,
                y: this.gameObject.y + 20, // Bottom of chicken (feet)
                count: 1,
                color: [0.6, 0.5, 0.4, 0.4], // Brown dust color
                size: 5,
                speed: 40,
                lifetime: 0.5
            });
        }
    }

    die() {
        if (!this.isAlive) return;

        this.isAlive = false;

        // Play catch sound
        const audio = this.kernel?.systems.get('audio');
        if (audio) {
            audio.play('collision', { volume: 0.8 });
        }

        // Trigger Feedback
        const feedback = this.kernel?.systems.get('feedback');
        if (feedback) {
            feedback.trigger('oops', this.gameObject.x, this.gameObject.y - 40);
        }

        const particles = this.kernel?.systems.get('particles');
        if (particles) {
            particles.emit({
                x: this.gameObject.x,
                y: this.gameObject.y,
                count: 20,
                color: [1, 1, 1, 1],
                speed: 100
            });
        }
        window.triggerGameOver();
    }

    reset() {
        this.velocityY = 0;
        this.isAlive = true;
        this.runCycle = 0;
        this.gameObject.x = 150;
        this.gameObject.y = GROUND_Y - 40;
        this.isGrounded = true;
    }
}

/**
 * Obstacle Component
 */
class Obstacle extends Component {
    constructor(type = 'rock') {
        super();
        this.type = type;
        this.speed = SCROLL_SPEED;
        this.scored = false;

        // Randomize dimensions based on type
        if (type === 'rock') {
            this.width = 30 + Math.random() * 20;
            this.height = 25 + Math.random() * 15;
            this.color = '#808080';
        } else if (type === 'crate') {
            this.width = 45;
            this.height = 45;
            this.color = '#8B4513';
        } else {
            this.width = 50;
            this.height = 35;
            this.color = '#4a7c44';
        }
    }

    update(deltaTime) {
        if (window.gameState() !== 'playing') return;

        this.gameObject.x -= this.speed * deltaTime;

        // Cleanup
        if (this.gameObject.x < -300) {
            gameScene.remove(this.gameObject);
            Registry.obstacles = Registry.obstacles.filter(o => o !== this.gameObject);
        }

        // Score
        if (!this.scored && this.gameObject.x < 150) {
            this.scored = true;
            window.addScore(1);
        }

        this.checkCollision();
    }

    checkCollision() {
        const player = Registry.player;
        if (!player) return;
        const playerComp = player.getComponent(Player);
        if (!playerComp?.isAlive || window.gameState() !== 'playing') return;

        const px = player.x;
        const py = player.y;
        const pr = 15; // Tight collision radius for player

        const ox = this.gameObject.x - this.width / 2;
        const oy = this.gameObject.y - this.height;

        // AABB Collision with buffer
        if (px + pr > ox &&
            px - pr < ox + this.width &&
            py + pr > oy &&
            py - pr < oy + this.height) {

            playerComp.die();
        }
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        if (this.type === 'crate') {
            // Crate with boards
            ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
            ctx.strokeStyle = '#5d3e2a';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width / 2 + 3, -this.height + 3, this.width - 6, this.height - 6);
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, -this.height / 2); ctx.lineTo(this.width / 2, -this.height / 2);
            ctx.stroke();
        } else if (this.type === 'rock') {
            // Jagged rock
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, 0);
            ctx.lineTo(-this.width / 2.5, -this.height);
            ctx.lineTo(this.width / 4, -this.height * 0.9);
            ctx.lineTo(this.width / 2, 0);
            ctx.fill();
        } else {
            // Farm bush
            ctx.beginPath();
            ctx.arc(-10, -10, 15, 0, Math.PI * 2);
            ctx.arc(10, -10, 15, 0, Math.PI * 2);
            ctx.arc(0, -20, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * GameManager Component
 */
class GameManager extends Component {
    constructor() {
        super();
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.isSpawning = false;
        this.difficultyTimer = 0;
    }

    update(deltaTime) {
        if (!this.isSpawning) return;

        this.spawnTimer += deltaTime;
        this.difficultyTimer += deltaTime;

        // Speed increases every 30s
        const oldSpeed = SCROLL_SPEED + Math.floor((this.difficultyTimer - deltaTime) / 30) * 50;
        const newSpeed = SCROLL_SPEED + Math.floor(this.difficultyTimer / 30) * 50;

        if (newSpeed > oldSpeed) {
            const feedback = this.kernel?.systems.get('feedback');
            if (feedback) feedback.trigger('faster', 400, 200);
        }

        // Dynamic spawn interval based on difficulty (time)
        const currentInterval = Math.max(0.8, this.spawnInterval - (this.difficultyTimer / 60));

        if (this.spawnTimer >= currentInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
        }
    }

    spawnObstacle() {
        const types = ['rock', 'crate', 'bush'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Spawn FURTHER AWAY (1200 instead of 900) to ensure no immediate collision
        const obstacle = new GameObject(1200, GROUND_Y);
        obstacle.addComponent(new Obstacle(type));
        gameScene.add(obstacle);
        Registry.obstacles.push(obstacle);

    }

    startSpawning() {
        this.isSpawning = true;
        this.spawnTimer = 0;
        this.difficultyTimer = 0;
    }

    stopSpawning() {
        this.isSpawning = false;
    }
}

/**
 * Scrolling Ground Component
 */
class Ground extends Component {
    constructor() {
        super();
        this.offsetX = 0;
    }

    update(deltaTime) {
        if (window.gameState() !== 'playing') return;
        this.offsetX = (this.offsetX + SCROLL_SPEED * deltaTime) % 100;
    }

    render(ctx) {
        // Main ground color
        ctx.fillStyle = '#8B4513'; // Dirt
        ctx.fillRect(0, GROUND_Y, 800, 600 - GROUND_Y);

        // Grass line
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, GROUND_Y, 800, 20);

        // Detail lines (dots/dashes) for motion
        ctx.strokeStyle = '#6d350f';
        ctx.lineWidth = 2;
        for (let x = -this.offsetX; x < 800; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x + 20, GROUND_Y + 40);
            ctx.lineTo(x + 50, GROUND_Y + 40);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + 70, GROUND_Y + 70);
            ctx.lineTo(x + 90, GROUND_Y + 70);
            ctx.stroke();
        }
    }
}

/**
 * Parallax Background Component
 */
class ScrollingBackground extends Component {
    constructor() {
        super();
        this.clouds = [
            { x: 100, y: 100, s: 0.2 },
            { x: 400, y: 150, s: 0.15 },
            { x: 700, y: 80, s: 0.25 }
        ];
    }

    update(deltaTime) {
        if (window.gameState() !== 'playing') return;
        this.clouds.forEach(c => {
            c.x -= SCROLL_SPEED * c.s * deltaTime;
            if (c.x < -100) c.x = 900;
        });
    }

    render(ctx) {
        // Sky Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, GROUND_Y);

        // Draw Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.clouds.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 30, 0, Math.PI * 2);
            ctx.arc(c.x + 25, c.y - 10, 25, 0, Math.PI * 2);
            ctx.arc(c.x + 50, c.y, 30, 0, Math.PI * 2);
            ctx.fill();
        });

        // Distant Farm Silhouette (Static for now)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(100, GROUND_Y - 80, 150, 80); // Barn
        ctx.beginPath();
        ctx.moveTo(100, GROUND_Y - 80); ctx.lineTo(175, GROUND_Y - 120); ctx.lineTo(250, GROUND_Y - 80);
        ctx.fill();
    }
}

// Setup background
const bgObj = new GameObject(0, 0);
bgObj.addComponent(new ScrollingBackground());
gameScene.add(bgObj);

// Setup ground
const groundObj = new GameObject(0, 0);
groundObj.addComponent(new Ground());
gameScene.add(groundObj);

// Setup player
const player = new GameObject(150, GROUND_Y - 40);
player.addComponent(new Player());
gameScene.add(player);
Registry.player = player;

// Setup manager
const manager = new GameObject(0, 0);
manager.addComponent(new GameManager());
gameScene.add(manager);
Registry.gameManager = manager;

// UI Logic
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const finalScoreDisplay = document.getElementById('final-score');

let gameState = 'start';
let score = 0;
let highScore = localStorage.getItem('dopa-dopa-highscore') || 0;
highScoreDisplay.textContent = `Best: ${highScore}`;

function startGame() {

    gameState = 'playing';
    score = 0;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    const playerComp = Registry.player.getComponent(Player);
    playerComp.reset();

    Registry.obstacles.forEach(obs => gameScene.remove(obs));
    Registry.obstacles = [];

    const managerComp = Registry.gameManager.getComponent(GameManager);
    managerComp.startSpawning();
    updateScore(0);
}

function gameOver() {
    if (gameState !== 'playing') return;
    gameState = 'gameover';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dopa-dopa-highscore', highScore);
        highScoreDisplay.textContent = `Best: ${highScore}`;
    }
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
    Registry.gameManager.getComponent(GameManager).stopSpawning();
}

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;

    // Milestone every 10 points
    if (score > 0 && score % 10 === 0 && points > 0) {
        // Trigger Feedback (Text + Confetti + Sound) at chicken position
        const feedback = game.kernel.systems.get('feedback');
        if (feedback && Registry.player) {
            const chickenX = Registry.player.x;
            const chickenY = Registry.player.y;

            feedback.trigger('milestone', chickenX, chickenY - 40);
        }

        // Play Achievement sound
        const audio = game.kernel.systems.get('audio');
        if (audio) audio.play('achievement');
    }
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && gameState === 'playing') {
        Registry.player.getComponent(Player).jump();
    }
});

// Globals
window.game = game;
window.gameState = () => gameState;
window.addScore = updateScore;
window.triggerGameOver = gameOver;
window.startGame = startGame;
window.Registry = Registry;
window.testConfetti = (x, y) => {
    const feedback = game.kernel.systems.get('feedback');
    if (feedback) {

        feedback.trigger('milestone', x, y);
    }
};

game.start();

