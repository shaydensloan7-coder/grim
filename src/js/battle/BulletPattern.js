// Bullet pattern system for enemy attacks
import { CONFIG } from '../config.js';

export class Bullet {
    constructor(type, x, y, params = {}) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = params.width || 10;
        this.height = params.height || 10;
        this.velocity = params.velocity || { x: 0, y: 0 };
        this.acceleration = params.acceleration || { x: 0, y: 0 };
        this.damage = params.damage || 1;
        this.rotation = params.rotation || 0;
        this.rotationSpeed = params.rotationSpeed || 0;
        this.sprite = this.loadSprite();
        this.destroyed = false;
    }
    
    loadSprite() {
        const sprite = new Image();
        const basePath = CONFIG.ASSETS.SPRITES.BATTLE + 'Attack/';
        
        switch (this.type) {
            case 'bone':
                sprite.src = basePath + 'spr_bonetest_0.png';
                break;
            case 'pellet':
                sprite.src = basePath + 'spr_bullettest_0.png';
                break;
            case 'knife':
                sprite.src = basePath + 'spr_knifebullet_0.png';
                break;
            default:
                sprite.src = basePath + 'spr_bulletdefault_0.png';
                break;
        }
        
        return sprite;
    }
    
    update(deltaTime) {
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Update velocity with acceleration
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
    }
    
    render(ctx) {
        ctx.save();
        
        // Translate to bullet center
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Rotate if needed
        if (this.rotation !== 0) {
            ctx.rotate(this.rotation);
        }
        
        // Draw sprite
        ctx.drawImage(
            this.sprite,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height
        );
        
        ctx.restore();
    }
    
    destroy() {
        this.destroyed = true;
    }
}

export class BulletPattern {
    constructor(type, params = {}) {
        this.type = type;
        this.bullets = [];
        this.isComplete = false;
        this.elapsedTime = 0;
        this.duration = params.duration || CONFIG.BATTLE.turnDuration;
        
        // Pattern specific parameters
        this.params = {
            speed: params.speed || 3,
            bulletSize: params.bulletSize || 8,
            spawnRate: params.spawnRate || 30,
            damage: params.damage || 2,
            centerX: params.centerX || 0,
            centerY: params.centerY || 0,
            ...params
        };
        
        this.spawnTimer = 0;
        
        // Initialize pattern based on type
        this.initialize();
    }
    
    initialize() {
        switch (this.type) {
            case 'circle':
                this.initializeCirclePattern();
                break;
            case 'wave':
                this.initializeWavePattern();
                break;
            case 'spiral':
                this.initializeSpiralPattern();
                break;
            case 'random':
                this.initializeRandomPattern();
                break;
            case 'bones':
                this.initializeBonesPattern();
                break;
            case 'gasterBlaster':
                this.initializeGasterBlasterPattern();
                break;
            default:
                console.warn(`Unknown bullet pattern type: ${this.type}`);
                this.isComplete = true;
                break;
        }
    }
    
    update(deltaTime) {
        if (this.isComplete) return;
        
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.duration) {
            this.isComplete = true;
            return;
        }
        
        // Update existing bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return !bullet.isDestroyed;
        });
        
        // Spawn new bullets based on pattern type
        switch (this.type) {
            case 'circle':
                this.updateCirclePattern(deltaTime);
                break;
            case 'wave':
                this.updateWavePattern(deltaTime);
                break;
            case 'spiral':
                this.updateSpiralPattern(deltaTime);
                break;
            case 'random':
                this.updateRandomPattern(deltaTime);
                break;
        }
    }
    
    render(ctx) {
        this.bullets.forEach(bullet => bullet.render(ctx));
    }
    
    // Pattern specific initializations
    initializeCirclePattern() {
        const { radius, count } = this.params;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            this.createBullet({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                angle: angle
            });
        }
    }
    
    initializeWavePattern() {
        // Initialize wave pattern parameters
    }
    
    initializeSpiralPattern() {
        // Initialize spiral pattern parameters
    }
    
    initializeRandomPattern() {
        // Initialize random pattern parameters
    }
    
    // Pattern specific updates
    updateCirclePattern(deltaTime) {
        // Update circle pattern
    }
    
    updateWavePattern(deltaTime) {
        // Update wave pattern
    }
    
    updateSpiralPattern(deltaTime) {
        // Update spiral pattern
    }
    
    updateRandomPattern(deltaTime) {
        // Update random pattern
    }
    
    createBullet(params) {
        this.bullets.push(new Bullet({
            size: this.params.bulletSize,
            speed: this.params.speed,
            damage: this.params.damage,
            ...params
        }));
    }
}

class Bullet {
    constructor(params) {
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.size = params.size || 8;
        this.speed = params.speed || 3;
        this.angle = params.angle || 0;
        this.damage = params.damage || 1;
        this.isDestroyed = false;
    }
    
    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Check if bullet is out of bounds
        if (this.isOutOfBounds()) {
            this.isDestroyed = true;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    isOutOfBounds() {
        const margin = this.size;
        return (
            this.x < -margin ||
            this.x > CONFIG.CANVAS_WIDTH + margin ||
            this.y < -margin ||
            this.y > CONFIG.CANVAS_HEIGHT + margin
        );
    }
}