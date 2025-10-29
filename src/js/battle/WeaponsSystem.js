// Weapons system for battle mechanics
import { CONFIG } from '../config.js';

export class WeaponsSystem {
    constructor() {
        // Load weapon sprites
        this.weapons = {
            fists: {
                name: 'Tough Glove',
                damage: 5,
                sprites: this.loadSprites('Tough Glove'),
                animationSpeed: 100,
                hitboxSize: { width: 40, height: 40 },
                accuracy: 0.8
            },
            knife: {
                name: 'Real Knife',
                damage: 10,
                sprites: this.loadSprites('Knife'),
                animationSpeed: 80,
                hitboxSize: { width: 60, height: 20 },
                accuracy: 0.9
            },
            balletShoes: {
                name: 'Ballet Shoes',
                damage: 7,
                sprites: this.loadSprites('Ballet Shoes'),
                animationSpeed: 120,
                hitboxSize: { width: 30, height: 30 },
                accuracy: 0.85
            },
            pan: {
                name: 'Burnt Pan',
                damage: 6,
                sprites: this.loadSprites('Burnt Pan & Torn Notebook'),
                animationSpeed: 90,
                hitboxSize: { width: 50, height: 50 },
                accuracy: 0.95
            },
            gun: {
                name: 'Empty Gun',
                damage: 12,
                sprites: this.loadSprites('Empty Gun'),
                animationSpeed: 60,
                hitboxSize: { width: 20, height: 20 },
                accuracy: 0.75
            }
        };
        
        this.currentWeapon = 'fists';
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.isAnimating = false;
    }
    
    loadSprites(weaponPath) {
        const basePath = CONFIG.ASSETS.SPRITES.BATTLE + 'Weapons/' + weaponPath + '/';
        const sprites = [];
        
        // Common sprite patterns
        const patterns = [
            'spr_target_0.png',
            'spr_slice_0.png',
            'spr_hit_0.png',
            'spr_impact_0.png'
        ];
        
        // Try to load each pattern
        patterns.forEach(pattern => {
            const img = new Image();
            img.src = basePath + pattern;
            sprites.push(img);
        });
        
        return sprites;
    }
    
    calculateDamage(targetProgress) {
        const weapon = this.weapons[this.currentWeapon];
        const perfectZone = 0.5;
        const accuracy = Math.abs(perfectZone - targetProgress);
        
        // Damage calculation based on accuracy and weapon properties
        let damageMult = 1.0;
        
        if (accuracy <= 0.1) {
            // Perfect hit - critical damage
            damageMult = 2.0;
        } else if (accuracy <= 0.2) {
            // Great hit
            damageMult = 1.5;
        } else if (accuracy <= 0.3) {
            // Good hit
            damageMult = 1.0;
        } else {
            // Poor hit
            damageMult = 0.5;
        }
        
        // Apply weapon accuracy modifier
        damageMult *= weapon.accuracy;
        
        // Calculate final damage
        const baseDamage = weapon.damage;
        const finalDamage = Math.round(baseDamage * damageMult);
        
        return {
            damage: finalDamage,
            accuracy: 1 - accuracy,
            isCritical: damageMult >= 2.0
        };
    }
    
    renderTargetingUI(ctx, x, y, width, progress) {
        const height = 20;
        const weapon = this.weapons[this.currentWeapon];
        
        // Draw targeting zone background
        ctx.fillStyle = '#800000';
        ctx.fillRect(x, y, width, height);
        
        // Draw perfect zone marker
        const perfectZone = width * 0.5;
        const zoneWidth = width * 0.2;
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(perfectZone - zoneWidth/2, y, zoneWidth, height);
        
        // Draw target indicator
        const indicatorPos = x + (width * progress);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(indicatorPos - 2, y - 5, 4, height + 10);
        
        // Draw weapon name
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px DeterminationMono';
        ctx.textAlign = 'center';
        ctx.fillText(weapon.name, x + width/2, y - 10);
    }
    
    startAnimation() {
        this.isAnimating = true;
        this.animationFrame = 0;
        this.lastFrameTime = 0;
    }
    
    animate(deltaTime) {
        if (!this.isAnimating) return null;
        
        const weapon = this.weapons[this.currentWeapon];
        
        // Update animation frame
        this.lastFrameTime += deltaTime;
        if (this.lastFrameTime >= weapon.animationSpeed) {
            this.animationFrame++;
            this.lastFrameTime = 0;
            
            // Check if animation is complete
            if (this.animationFrame >= weapon.sprites.length) {
                this.isAnimating = false;
                return null;
            }
        }
        
        return weapon.sprites[this.animationFrame];
    }
    
    setWeapon(weaponId) {
        if (this.weapons[weaponId]) {
            this.currentWeapon = weaponId;
            this.animationFrame = 0;
            this.lastFrameTime = 0;
            this.isAnimating = false;
            return true;
        }
        return false;
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    getHitboxSize() {
        return this.weapons[this.currentWeapon].hitboxSize;
    }
    
}