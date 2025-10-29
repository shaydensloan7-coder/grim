// Enemy class extending the base Entity
import { Entity } from './Entity.js';
import { BulletPattern } from '../battle/BulletPattern.js';

export class Enemy extends Entity {
    constructor(data) {
        // Set up enemy-specific sprite paths based on enemy type
        const enemyData = {
            ...data,
            sprites: {
                idle: `/Grimgame/assets/images/enemies/${data.type}_idle.png`,
                attack: `/Grimgame/assets/images/enemies/${data.type}_attack.png`,
                hurt: `/Grimgame/assets/images/enemies/${data.type}_hurt.png`,
                defeat: `/Grimgame/assets/images/enemies/${data.type}_defeat.png`
            }
        };
        
        super('enemy', enemyData);
        
        // Enemy-specific properties
        this.expValue = data.expValue || 10;
        this.goldValue = data.goldValue || 5;
        
        // Battle properties
        this.mercyThreshold = data.mercyThreshold || 100;
        this.mercyValue = 0;
        this.canBeMercied = false;
        
        // Attack patterns
        this.patterns = data.patterns || [];
        this.currentPattern = null;
        
        // Dialogue
        this.dialogue = {
            encounter: data.dialogue?.encounter || ['* An enemy appears!'],
            acts: data.dialogue?.acts || {},
            mercy: data.dialogue?.mercy || ['* The enemy was spared.'],
            defeat: data.dialogue?.defeat || ['* The enemy was defeated.']
        };
        
        // Act options
        this.acts = data.acts || ['Check'];
        
        // State flags
        this.isSpared = false;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update current bullet pattern
        if (this.currentPattern && !this.currentPattern.isComplete) {
            this.currentPattern.update(deltaTime);
        }
        
        // Check mercy conditions
        this.checkMercyConditions();
    }
    
    render(ctx) {
        super.render(ctx);
        
        // Render current bullet pattern
        if (this.currentPattern && !this.currentPattern.isComplete) {
            this.currentPattern.render(ctx);
        }
    }
    
    startPattern(patternIndex = -1) {
        // If no specific pattern is requested, choose one randomly
        if (patternIndex === -1) {
            patternIndex = Math.floor(Math.random() * this.patterns.length);
        }
        
        const pattern = this.patterns[patternIndex];
        if (!pattern) {
            console.warn('No pattern found at index:', patternIndex);
            return;
        }
        
        this.currentPattern = new BulletPattern(pattern.type, pattern.params);
    }
    
    handleAct(action, player) {
        if (action === 'Check') {
            return this.getCheckDialogue();
        }
        
        if (this.acts.includes(action)) {
            const result = this.processAct(action, player);
            this.mercyValue += result.mercyIncrease || 0;
            return result.dialogue || [`* ${action} had no effect.`];
        }
        
        return [`* ${action} is not a valid option.`];
    }
    
    getCheckDialogue() {
        return [
            `* ${this.name.toUpperCase()}`,
            `* ATK ${this.stats.attack} DEF ${this.stats.defense}`,
            `* ${this.dialogue.check || "No additional information."}`
        ];
    }
    
    processAct(action, player) {
        // Override this in specific enemy classes
        return {
            mercyIncrease: 0,
            dialogue: this.dialogue.acts[action] || [`* ${action} had no effect.`]
        };
    }
    
    checkMercyConditions() {
        // Check if mercy requirements are met
        if (this.mercyValue >= this.mercyThreshold) {
            this.canBeMercied = true;
        }
    }
    
    spare() {
        if (!this.canBeMercied) return false;
        
        this.isSpared = true;
        return true;
    }
    
    getRewards() {
        return {
            exp: this.expValue,
            gold: this.goldValue
        };
    }
    
    reset() {
        super.reset();
        this.mercyValue = 0;
        this.canBeMercied = false;
        this.isSpared = false;
        this.currentPattern = null;
    }
}