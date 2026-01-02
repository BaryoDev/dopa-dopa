/**
 * Background Component - Scrolling farm background
 */

import { Component } from 'dopaminejs';

export class Background extends Component {
    constructor() {
        super();
        this.cloudX = 0;
        this.groundX = 0;
        this.speed = 50;
    }

    update(dt) {
        if (window.gameState() === 'playing') {
            this.cloudX -= this.speed * 0.3 * dt;
            this.groundX -= this.speed * dt;

            // Wrap around
            if (this.cloudX < -800) this.cloudX = 0;
            if (this.groundX < -100) this.groundX = 0;
        }
    }

    render(ctx) {
        // Sky (already set as canvas background)

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 5; i++) {
            const x = (this.cloudX + i * 200) % 800;
            const y = 50 + i * 30;
            this.renderCloud(ctx, x, y);
        }

        // Far mountains
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.moveTo(0, 400);
        for (let i = 0; i < 10; i++) {
            const x = i * 100;
            const y = 350 + Math.sin(i) * 50;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(800, 400);
        ctx.closePath();
        ctx.fill();

        // Ground
        ctx.fillStyle = '#7BC043';
        ctx.fillRect(0, 500, 800, 100);

        // Ground details (grass)
        ctx.fillStyle = '#6AA832';
        for (let i = 0; i < 20; i++) {
            const x = (this.groundX + i * 40) % 800;
            ctx.fillRect(x, 500, 3, 10);
            ctx.fillRect(x + 10, 500, 3, 8);
            ctx.fillRect(x + 20, 500, 3, 12);
        }

        // Dirt path
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 550, 800, 50);
    }

    renderCloud(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}
