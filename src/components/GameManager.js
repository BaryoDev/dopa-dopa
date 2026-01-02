/**
 * GameManager Component - Spawns obstacles and manages game flow
 */

import { Component, GameObject } from 'dopaminejs';
import { Obstacle } from './Obstacle.js';

export class GameManager extends Component {
    constructor() {
        super();
        this.spawnTimer = 0;
        this.spawnInterval = 2.0; // seconds
        this.isSpawning = false;
        this.obstacleTypes = ['rock', 'barn', 'fence'];
    }

    startSpawning() {
        this.isSpawning = true;
        this.spawnTimer = 0;
    }

    stopSpawning() {
        this.isSpawning = false;
    }

    update(dt) {
        if (!this.isSpawning) return;

        this.spawnTimer += dt;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;

            // Gradually increase difficulty
            this.spawnInterval = Math.max(1.2, this.spawnInterval - 0.05);
        }
    }

    spawnObstacle() {
        const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        const obstacle = new GameObject(`obstacle_${Date.now()}`);
        obstacle.position.set(850, 550); // Start off-screen right, on ground
        obstacle.addComponent(new Obstacle(type));
        this.gameObject.scene.addGameObject(obstacle);
    }
}
