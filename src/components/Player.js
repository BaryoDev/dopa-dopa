/**
 * Player Component - The Chicken (Dopa-Dopa)
 */

import { Component } from 'dopaminejs';

export class Player extends Component {
    constructor() {
        super();
        this.velocity = 0;
        this.gravity = 1200;
        this.jumpForce = -400;
        this.rotation = 0;
        this.size = 40;
        this.isDead = false;
    }

    onAttach() {
        this.reset();
    }

    reset() {
        this.gameObject.position.y = 300;
        this.velocity = 0;
        this.rotation = 0;
        this.isDead = false;
    }

    jump() {
        if (this.isDead) return;

        this.velocity = this.jumpForce;
        this.rotation = -30;

        // Play jump sound
        // TODO: Add sound when available

        // Particle effect
        if (this.kernel?.systems.get('particles')) {
            const particles = this.kernel.systems.get('particles');
            particles.emit({
                x: this.gameObject.position.x,
                y: this.gameObject.position.y + 20,
                count: 5,
                color: [1, 1, 0.5, 1],
                size: 3,
                lifetime: 0.3,
                velocity: { x: -100, y: 0 },
                spread: 30
            });
        }
    }

    update(dt) {
        if (this.isDead) return;

        // Apply gravity
        this.velocity += this.gravity * dt;
        this.gameObject.position.y += this.velocity * dt;

        // Rotate based on velocity
        this.rotation = Math.min(90, this.velocity * 0.1);

        // Check boundaries
        if (this.gameObject.position.y < 0) {
            this.gameObject.position.y = 0;
            this.velocity = 0;
        }

        if (this.gameObject.position.y > 600 - this.size) {
            this.die();
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.gameObject.position.x, this.gameObject.position.y);
        ctx.rotate((this.rotation * Math.PI) / 180);

        // Draw chicken
        // Body
        ctx.fillStyle = '#ff6b35';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Head
        ctx.fillStyle = '#ff8c5a';
        ctx.beginPath();
        ctx.arc(this.size / 4, -this.size / 2, this.size / 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.size / 3, -this.size / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.size / 3 + 2, -this.size / 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.moveTo(this.size / 2, -this.size / 2);
        ctx.lineTo(this.size / 2 + 10, -this.size / 2 - 3);
        ctx.lineTo(this.size / 2 + 10, -this.size / 2 + 3);
        ctx.closePath();
        ctx.fill();

        // Wing
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.ellipse(-5, 0, 15, 10, Math.sin(Date.now() / 100) * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;

        // Death particles
        if (this.kernel?.systems.get('particles')) {
            const particles = this.kernel.systems.get('particles');
            particles.emit({
                x: this.gameObject.position.x,
                y: this.gameObject.position.y,
                count: 30,
                color: [1, 0.4, 0.2, 1],
                size: 5,
                lifetime: 1,
                velocity: { x: 0, y: -200 },
                spread: 100
            });
        }

        // Trigger game over
        if (window.triggerGameOver) {
            setTimeout(() => window.triggerGameOver(), 500);
        }
    }

    checkCollision(obstacle) {
        const playerBounds = {
            x: this.gameObject.position.x - this.size / 2,
            y: this.gameObject.position.y - this.size / 2,
            width: this.size,
            height: this.size
        };

        return (
            playerBounds.x < obstacle.x + obstacle.width &&
            playerBounds.x + playerBounds.width > obstacle.x &&
            playerBounds.y < obstacle.y + obstacle.height &&
            playerBounds.y + playerBounds.height > obstacle.y
        );
    }
}
