/**
 * Obstacle Component - Rocks, Barns, etc.
 */

import { Component } from 'dopaminejs';

export class Obstacle extends Component {
    constructor(type = 'rock') {
        super();
        this.type = type; // rock, barn, fence
        this.speed = 200;
        this.width = 60;
        this.height = this.getHeightForType(type);
        this.passed = false;
    }

    getHeightForType(type) {
        switch (type) {
            case 'rock': return 80;
            case 'barn': return 120;
            case 'fence': return 60;
            default: return 80;
        }
    }

    onAttach() {
        this.gameObject.tag = 'obstacle';
    }

    update(dt) {
        // Move left
        this.gameObject.position.x -= this.speed * dt;

        // Check if passed player
        if (!this.passed && this.gameObject.position.x < 100) {
            this.passed = true;
            if (window.addScore) {
                window.addScore(1);
            }

            // Celebration particles
            if (this.kernel?.systems.get('particles')) {
                const particles = this.kernel.systems.get('particles');
                particles.sparkle(150, 300, 10, [0, 1, 0, 1]);
            }
        }

        // Remove if off screen
        if (this.gameObject.position.x < -100) {
            this.gameObject.scene.removeGameObject(this.gameObject);
        }

        // Check collision with player
        const player = this.gameObject.scene.findGameObject('player');
        if (player) {
            const playerComp = player.getComponent('Player');
            if (playerComp && !playerComp.isDead) {
                const obstacleBounds = {
                    x: this.gameObject.position.x - this.width / 2,
                    y: this.gameObject.position.y - this.height,
                    width: this.width,
                    height: this.height
                };

                if (playerComp.checkCollision(obstacleBounds)) {
                    playerComp.die();
                }
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.gameObject.position.x, this.gameObject.position.y);

        switch (this.type) {
            case 'rock':
                this.renderRock(ctx);
                break;
            case 'barn':
                this.renderBarn(ctx);
                break;
            case 'fence':
                this.renderFence(ctx);
                break;
        }

        ctx.restore();
    }

    renderRock(ctx) {
        // Rock
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-30, -40);
        ctx.lineTo(-20, -80);
        ctx.lineTo(20, -80);
        ctx.lineTo(30, -40);
        ctx.closePath();
        ctx.fill();

        // Highlights
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(-10, -60);
        ctx.lineTo(-5, -70);
        ctx.lineTo(5, -70);
        ctx.lineTo(10, -60);
        ctx.closePath();
        ctx.fill();
    }

    renderBarn(ctx) {
        // Barn body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-30, -120, 60, 120);

        // Roof
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(-40, -120);
        ctx.lineTo(0, -150);
        ctx.lineTo(40, -120);
        ctx.closePath();
        ctx.fill();

        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(-15, -60, 30, 60);

        // Window
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-20, -100, 15, 15);
        ctx.fillRect(5, -100, 15, 15);
    }

    renderFence(ctx) {
        // Fence posts
        ctx.fillStyle = '#8B4513';
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(i * 15 - 3, -60, 6, 60);
        }

        // Horizontal bars
        ctx.fillRect(-30, -50, 60, 4);
        ctx.fillRect(-30, -30, 60, 4);
    }
}
