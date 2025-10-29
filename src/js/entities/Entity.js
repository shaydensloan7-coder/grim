// Base entity class for player and enemies
import { CONFIG } from '../config.js';

export class Entity {
    constructor(type, data = {}) {
        // Basic properties
        this.type = type;
        this.name = data.name || 'Unknown';
        this.hp = data.hp || CONFIG.BATTLE.defaultPlayerHP;
        this.maxHp = data.maxHp || this.hp;
        
        // Stats
        this.stats = {
            attack: data.attack || CONFIG.BATTLE.defaultPlayerATK,
            defense: data.defense || CONFIG.BATTLE.defaultPlayerDEF,
            speed: data.speed || 1
        };
        
        // Position and movement
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Battle properties
        this.isInvincible = false;
        this.invincibilityFrames = 0;
        this.isDead = false;
        
        // Sprite properties
        this.sprite = {
            idle: data.sprites?.idle || '/Grimgame/assets/images/characters/default_idle.png',
            attack: data.sprites?.attack || '/Grimgame/assets/images/characters/default_attack.png',
            hurt: data.sprites?.hurt || '/Grimgame/assets/images/characters/default_hurt.png',
            defeat: data.sprites?.defeat || '/Grimgame/assets/images/characters/default_defeat.png'
        };
        this.currentSprite = 'idle';
        this.spriteFlipped = false;
        
        // Animation
        this.frameIndex = 0;
        this.tickCount = 0;
        this.ticksPerFrame = 5;
        this.numberOfFrames = data.frames || 1;
        
        // Load sprites
        this.loadSprites();
    }
    
    loadSprites() {
        this.spriteImages = {};
        for (const [key, path] of Object.entries(this.sprite)) {
            const img = new Image();
            img.src = path;
            this.spriteImages[key] = img;
        }
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Update invincibility frames
        if (this.isInvincible) {
            this.invincibilityFrames--;
            if (this.invincibilityFrames <= 0) {
                this.isInvincible = false;
            }
        }
        
        // Update animation
        this.tickCount++;
        if (this.tickCount > this.ticksPerFrame) {
            this.tickCount = 0;
            this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
        }
    }
    
    render(ctx) {
        if (!this.spriteImages[this.currentSprite]) return;
        
        const sprite = this.spriteImages[this.currentSprite];
        const frameWidth = sprite.width / this.numberOfFrames;
        const frameHeight = sprite.height;
        
        // Calculate source and destination rectangles
        const sx = this.frameIndex * frameWidth;
        const sy = 0;
        const sw = frameWidth;
        const sh = frameHeight;
        
        let dx = this.x - frameWidth / 2;
        const dy = this.y - frameHeight / 2;
        const dw = frameWidth;
        const dh = frameHeight;
        
        // Handle sprite flipping
        if (this.spriteFlipped) {
            ctx.save();
            ctx.scale(-1, 1);
            dx = -dx - dw;
        }
        
        // Draw sprite
        ctx.drawImage(sprite, sx, sy, sw, sh, dx, dy, dw, dh);
        
        if (this.spriteFlipped) {
            ctx.restore();
        }
        
        // Draw HP bar if not at full health
        if (this.hp < this.maxHp) {
            this.renderHPBar(ctx);
        }
    }
    
    renderHPBar(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - 30;
        
        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health fill
        const fillWidth = (this.hp / this.maxHp) * barWidth;
        ctx.fillStyle = CONFIG.COLORS.healthBar;
        ctx.fillRect(x, y, fillWidth, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    takeDamage(amount) {
        if (this.isInvincible || this.isDead) return 0;
        
        // Calculate actual damage
        const damage = Math.max(1, amount - this.stats.defense);
        this.hp -= damage;
        
        // Handle death
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        } else {
            // Set invincibility frames
            this.isInvincible = true;
            this.invincibilityFrames = CONFIG.BATTLE.invincibilityFrames;
            this.currentSprite = 'hurt';
            
            // Reset to idle sprite after a delay
            setTimeout(() => {
                if (!this.isDead) this.currentSprite = 'idle';
            }, 200);
        }
        
        return damage;
    }
    
    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }
    
    die() {
        this.isDead = true;
        this.hp = 0;
        this.currentSprite = 'defeat';
    }
    
    reset() {
        this.hp = this.maxHp;
        this.isDead = false;
        this.isInvincible = false;
        this.invincibilityFrames = 0;
        this.currentSprite = 'idle';
        this.frameIndex = 0;
        this.tickCount = 0;
    }
}