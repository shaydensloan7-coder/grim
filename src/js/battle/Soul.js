// Soul system for battle mechanics
import { CONFIG } from '../config.js';

export class Soul {
    constructor() {
        // Position and movement
        this.x = 0;
        this.y = 0;
        this.velocity = { x: 0, y: 0 };
        this.size = 20; // Standard soul sprite size
        this.speed = 4;
        this.gravity = 0.5;
        this.jumpForce = -8;
        this.mode = 'red';
        
        // Movement bounds
        this.bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        
        // Load soul sprites
        this.loadSprites();
        
        // Animation state
        this.breaking = false;
        this.breakFrame = 0;
        this.breakFrameTime = 0;
        this.breakFrameDuration = 100;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 1000;
        
        // Mode-specific state
        this.facingRight = true;
        this.onPlatform = false;
        this.canJump = true;
        this.breakFrameDuration = 100; // ms per frame
        
        // Movement constraints
        this.bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        
        // Mode-specific properties
        this.gravity = 0.5;
        this.jumpForce = -8;
        this.velocityY = 0;
        this.grounded = false;
    }
    
    loadSprite(path) {
        const sprite = new Image();
        sprite.src = path;
        return sprite;
    }
    
    setBounds(x, y, width, height) {
        this.bounds = { x, y, width, height };
        this.x = x + width / 2;
        this.y = y + height / 2;
    }
    
    setMode(mode) {
        this.mode = mode;
        
        // Reset mode-specific properties
        this.velocityY = 0;
        this.grounded = false;
    }
    
    update(deltaTime) {
        if (this.breaking) {
            this.updateBreakAnimation(deltaTime);
            return;
        }
        
        switch (this.mode) {
            case 'blue':
                this.updateBlueMode(deltaTime);
                break;
            case 'green':
                this.updateGreenMode(deltaTime);
                break;
            case 'purple':
                this.updatePurpleMode(deltaTime);
                break;
            case 'yellow':
                this.updateYellowMode(deltaTime);
                break;
            default:
                this.updateRedMode(deltaTime);
                break;
        }
        
        // Keep soul within bounds
        this.x = Math.max(this.bounds.x + this.size/2, Math.min(this.bounds.x + this.bounds.width - this.size/2, this.x));
        this.y = Math.max(this.bounds.y + this.size/2, Math.min(this.bounds.y + this.bounds.height - this.size/2, this.y));
    }
    
    updateRedMode(deltaTime) {
        // Basic movement in all directions
        if (this.input.left) this.x -= this.speed;
        if (this.input.right) this.x += this.speed;
        if (this.input.up) this.y -= this.speed;
        if (this.input.down) this.y += this.speed;
    }
    
    updateBlueMode(deltaTime) {
        // Gravity-based movement
        if (!this.grounded && this.velocityY < 10) {
            this.velocityY += this.gravity;
        }
        
        if (this.input.up && this.grounded) {
            this.velocityY = this.jumpForce;
            this.grounded = false;
        }
        
        this.y += this.velocityY;
        
        // Check for ground collision
        if (this.y >= this.bounds.y + this.bounds.height - this.size/2) {
            this.y = this.bounds.y + this.bounds.height - this.size/2;
            this.velocityY = 0;
            this.grounded = true;
        }
        
        // Horizontal movement
        if (this.input.left) this.x -= this.speed;
        if (this.input.right) this.x += this.speed;
    }
    
    updateGreenMode(deltaTime) {
        // Shield-based movement (only rotate around center)
        // Implementation here
    }
    
    updatePurpleMode(deltaTime) {
        // Rail-based movement (only move along set paths)
        // Implementation here
    }
    
    updateYellowMode(deltaTime) {
        // Shooting mode movement
        if (this.input.left) this.x -= this.speed;
        if (this.input.right) this.x += this.speed;
        if (this.input.up) this.y -= this.speed;
        if (this.input.down) this.y += this.speed;
        
        // Shooting logic handled in battle system
    }
    
    updateBreakAnimation(deltaTime) {
        this.breakFrameTime += deltaTime;
        if (this.breakFrameTime >= this.breakFrameDuration) {
            this.breakFrame++;
            this.breakFrameTime = 0;
            
            if (this.breakFrame >= this.breakSprites.length) {
                this.breaking = false;
                this.breakFrame = 0;
            }
        }
    }
    
    render(ctx) {
        if (this.breaking) {
            ctx.drawImage(
                this.breakSprites[this.breakFrame],
                this.x - this.size/2,
                this.y - this.size/2,
                this.size,
                this.size
            );
        } else {
            ctx.drawImage(
                this.sprites[this.mode],
                this.x - this.size/2,
                this.y - this.size/2,
                this.size,
                this.size
            );
        }
    }
    
    break() {
        this.breaking = true;
        this.breakFrame = 0;
        this.breakFrameTime = 0;
    }
    
    checkCollision(bullet) {
        const dx = this.x - bullet.x;
        const dy = this.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size/2 + bullet.size/2);
    }
}