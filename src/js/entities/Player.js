// Player class extending the base Entity
import { Entity } from './Entity.js';
import { CONFIG } from '../config.js';

export class Player extends Entity {
    constructor(data = {}) {
        // Set up player-specific sprite paths
        const playerData = {
            ...data,
            type: 'player',
            name: 'GRIM',
            sprites: {
                idle: '/Grimgame/assets/images/characters/grim_idle.png',
                attack: '/Grimgame/assets/images/characters/grim_attack.png',
                hurt: '/Grimgame/assets/images/characters/grim_hurt.png',
                defeat: '/Grimgame/assets/images/characters/grim_defeat.png'
            }
        };
        
        super('player', playerData);
        
        // Player-specific properties
        this.exp = data.exp || 0;
        this.level = data.level || 1;
        this.gold = data.gold || 0;
        
        // Inventory
        this.items = data.items || [];
        this.equipment = data.equipment || {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        // Battle soul properties (for bullet hell sections)
        this.soul = {
            x: 0,
            y: 0,
            size: 10,
            speed: 4,
            color: '#ff0000',
            mode: 'red' // red = normal, blue = gravity, green = shield, etc.
        };
        
        // Movement state
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            confirm: false,
            cancel: false
        };
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update soul position based on input
        if (this.input.left) this.soul.x -= this.soul.speed;
        if (this.input.right) this.soul.x += this.soul.speed;
        if (this.input.up) this.soul.y -= this.soul.speed;
        if (this.input.down) this.soul.y += this.soul.speed;
        
        // Keep soul within battle box bounds
        const box = CONFIG.BATTLE;
        this.soul.x = Math.max(box.x, Math.min(box.x + box.width - this.soul.size, this.soul.x));
        this.soul.y = Math.max(box.y, Math.min(box.y + box.height - this.soul.size, this.soul.y));
    }
    
    render(ctx) {
        // Render character sprite
        super.render(ctx);
        
        // Render soul in battle
        this.renderSoul(ctx);
    }
    
    renderSoul(ctx) {
        ctx.fillStyle = this.soul.color;
        ctx.beginPath();
        ctx.arc(this.soul.x, this.soul.y, this.soul.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.soul.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    handleInput(event) {
        const keyState = event.type === 'keydown';
        
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.input.up = keyState;
                break;
            case 'ArrowDown':
            case 's':
                this.input.down = keyState;
                break;
            case 'ArrowLeft':
            case 'a':
                this.input.left = keyState;
                break;
            case 'ArrowRight':
            case 'd':
                this.input.right = keyState;
                break;
            case 'z':
            case 'Enter':
                this.input.confirm = keyState;
                break;
            case 'x':
            case 'Escape':
                this.input.cancel = keyState;
                break;
        }
    }
    
    gainExp(amount) {
        this.exp += amount;
        
        // Check for level up
        const nextLevel = this.level + 1;
        const expNeeded = this.getExpForLevel(nextLevel);
        
        if (this.exp >= expNeeded) {
            this.levelUp();
            return true;
        }
        
        return false;
    }
    
    levelUp() {
        this.level++;
        
        // Increase stats
        this.maxHp += 4;
        this.hp = this.maxHp;
        this.stats.attack += 2;
        this.stats.defense += 1;
        
        return {
            level: this.level,
            maxHp: this.maxHp,
            attack: this.stats.attack,
            defense: this.stats.defense
        };
    }
    
    getExpForLevel(level) {
        // Experience curve formula
        return Math.floor(10 * Math.pow(level, 1.5));
    }
    
    addItem(item) {
        if (this.items.length < 8) { // Max inventory size
            this.items.push(item);
            return true;
        }
        return false;
    }
    
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }
    
    useItem(index) {
        const item = this.removeItem(index);
        if (!item) return false;
        
        // Apply item effects
        if (item.healing) {
            this.heal(item.healing);
        }
        if (item.effects) {
            // Apply other effects (temporary stat boosts, etc.)
            item.effects.forEach(effect => this.applyEffect(effect));
        }
        
        return true;
    }
    
    applyEffect(effect) {
        switch (effect.type) {
            case 'stat_boost':
                this.stats[effect.stat] += effect.amount;
                // Set timeout to remove temporary stat boost
                setTimeout(() => {
                    this.stats[effect.stat] -= effect.amount;
                }, effect.duration);
                break;
            // Add other effect types as needed
        }
    }
    
    equipItem(item) {
        const slot = item.type;
        if (this.equipment[slot]) {
            // Unequip current item
            const oldItem = this.equipment[slot];
            this.unequipItem(slot);
            // Add to inventory if there's space
            if (!this.addItem(oldItem)) {
                return false;
            }
        }
        
        // Equip new item
        this.equipment[slot] = item;
        
        // Apply equipment stats
        if (item.stats) {
            Object.entries(item.stats).forEach(([stat, value]) => {
                this.stats[stat] += value;
            });
        }
        
        return true;
    }
    
    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return null;
        
        // Remove equipment stats
        if (item.stats) {
            Object.entries(item.stats).forEach(([stat, value]) => {
                this.stats[stat] -= value;
            });
        }
        
        this.equipment[slot] = null;
        return item;
    }
}