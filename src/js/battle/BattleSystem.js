// Battle system implementing Undertale-style mechanics
import { CONFIG } from '../config.js';
import { Soul } from './Soul.js';
import { WeaponsSystem } from './WeaponsSystem.js';
import { BulletPattern } from './BulletPattern.js';
import { BattleUI } from './BattleUI.js';

export class BattleSystem {
    constructor(engine) {
        this.engine = engine;
        
        // Battle state
        this.isActive = false;
        this.currentTurn = 0;
        this.turnPhase = 'PLAYER'; // PLAYER, ENEMY, ANIMATION
        this.turnTimer = 0;
        
        // Battle box
        this.box = {
            x: (CONFIG.CANVAS_WIDTH - CONFIG.BATTLE_WIDTH) / 2,
            y: CONFIG.CANVAS_HEIGHT - CONFIG.BATTLE_HEIGHT - 100,
            width: CONFIG.BATTLE_WIDTH,
            height: CONFIG.BATTLE_HEIGHT
        };
        
        // Current entities
        this.player = null;
        this.enemy = null;
        
        // Active patterns
        this.bulletPatterns = [];
        
        // Menu state
        this.selectedAction = 'FIGHT';
        this.selectedOption = null;
        
        // Targeting state (for FIGHT action)
        this.targeting = false;
        this.targetProgress = 0;
        this.targetSpeed = 0.01;
        this.targetDirection = 1;
        
        // Statistics
        this.stats = {
            turnsElapsed: 0,
            damageDealt: 0,
            damageTaken: 0,
            itemsUsed: 0,
            actsUsed: 0,
            mercyAttempts: 0
        };
        
        // Bind methods
        this.handleInput = this.handleInput.bind(this);
    }
    
    async init() {
        // Initialize subsystems
        this.soul = new Soul(this.engine);
        this.weapons = new WeaponsSystem(this.engine);
        this.ui = new BattleUI(this);
        
        // Initialize box position
        this.box = {
            x: (CONFIG.CANVAS_WIDTH - CONFIG.BATTLE_WIDTH) / 2,
            y: CONFIG.CANVAS_HEIGHT - CONFIG.BATTLE_HEIGHT - 100,
            width: CONFIG.BATTLE_WIDTH,
            height: CONFIG.BATTLE_HEIGHT
        };
        
        // Initialize battle data
        this.player = null;
        this.enemy = null;
        this.bulletPatterns = [];
        this.selectedAction = 'FIGHT';
        this.selectedOption = null;
        
        // Initialize statistics
        this.stats = {
            turnsElapsed: 0,
            damageDealt: 0,
            damageTaken: 0,
            itemsUsed: 0,
            actsUsed: 0,
            mercyAttempts: 0
        };
        
        // Initialize subsystems
        await Promise.all([
            this.soul.init(),
            this.weapons.init(),
            this.ui.init()
        ]);
    }
    
    startBattle(enemyData) {
        this.isActive = true;
        this.currentTurn = 0;
        this.turnPhase = 'PLAYER';
        
        // Reset statistics
        Object.keys(this.stats).forEach(key => this.stats[key] = 0);
        
        // Initialize entities
        this.player = this.engine.player;
        this.enemy = this.engine.entityManager.createEnemy(enemyData);
        
        // Set up soul
        this.soul.setBounds(this.box.x, this.box.y, this.box.width, this.box.height);
        this.soul.setMode('red');
        
        // Set up UI
        this.ui.show();
        this.ui.updateHP();
        this.ui.setEnemyName(this.enemy.name);
        
        // Play battle start sound
        this.engine.audio.playMusic('battle', true);
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update entities
        this.soul.update(deltaTime);
        this.enemy.update(deltaTime);
        
        // Update bullet patterns
        this.bulletPatterns.forEach((pattern, index) => {
            pattern.update(deltaTime);
            if (pattern.isComplete) {
                this.bulletPatterns.splice(index, 1);
            }
        });
        
        // Update targeting if active
        if (this.targeting) {
            this.updateTargeting(deltaTime);
        }
        
        // Update turn timer
        if (this.turnPhase === 'ENEMY') {
            this.turnTimer += deltaTime;
            if (this.turnTimer >= CONFIG.BATTLE.turnDuration) {
                this.endEnemyTurn();
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.ui.update(deltaTime);
    }
    
    render(ctx) {
        if (!this.isActive) return;
        
        // Draw battle box
        ctx.strokeStyle = CONFIG.COLORS.menuBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.box.x, this.box.y, this.box.width, this.box.height);
        
        // Draw bullet patterns
        this.bulletPatterns.forEach(pattern => pattern.render(ctx));
        
        // Draw soul
        this.soul.render(ctx);
        
        // Draw targeting UI if active
        if (this.targeting) {
            this.weapons.renderTargetingUI(
                ctx,
                this.box.x,
                this.box.y + this.box.height/2 - 10,
                this.box.width,
                this.targetProgress
            );
        }
        
        // Draw entities
        this.enemy.render(ctx);
        
        // Draw UI
        this.ui.render(ctx);
    }
    
    handleInput(event) {
        if (!this.isActive) return;
        
        if (this.targeting) {
            if (event.key === 'z' || event.key === 'Enter') {
                this.completeTargeting();
            }
            return;
        }
        
        switch (this.turnPhase) {
            case 'PLAYER':
                this.handlePlayerInput(event);
                break;
            case 'ENEMY':
                this.handleEnemyTurnInput(event);
                break;
        }
    }
    
    handlePlayerInput(event) {
        // Handle menu navigation
        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
                this.ui.navigateMenu('left');
                break;
            case 'ArrowRight':
            case 'd':
                this.ui.navigateMenu('right');
                break;
            case 'ArrowUp':
            case 'w':
                this.ui.navigateMenu('up');
                break;
            case 'ArrowDown':
            case 's':
                this.ui.navigateMenu('down');
                break;
            case 'z':
            case 'Enter':
                this.confirmAction();
                break;
            case 'x':
            case 'Escape':
                this.cancelAction();
                break;
        }
    }
    
    handleEnemyTurnInput(event) {
        // Handle soul movement
        this.soul.handleInput(event);
    }
    
    confirmAction() {
        switch (this.selectedAction) {
            case 'FIGHT':
                this.startTargeting();
                break;
            case 'ACT':
                this.performAct(this.selectedOption);
                break;
            case 'ITEM':
                this.useItem(this.selectedOption);
                break;
            case 'MERCY':
                this.attemptMercy();
                break;
        }
    }
    
    cancelAction() {
        this.ui.showMainMenu();
    }
    
    startTargeting() {
        this.targeting = true;
        this.targetProgress = 0;
        this.targetDirection = 1;
        this.engine.audio.playSound('menuSelect');
    }
    
    updateTargeting(deltaTime) {
        this.targetProgress += this.targetSpeed * this.targetDirection;
        
        if (this.targetProgress >= 1) {
            this.targetProgress = 1;
            this.targetDirection = -1;
        } else if (this.targetProgress <= 0) {
            this.targetProgress = 0;
            this.targetDirection = 1;
        }
    }
    
    completeTargeting() {
        this.targeting = false;
        const damage = this.weapons.calculateDamage(this.targetProgress);
        this.dealDamage(damage);
        this.startEnemyTurn();
    }
    
    dealDamage(amount) {
        const actualDamage = this.enemy.takeDamage(amount);
        this.stats.damageDealt += actualDamage;
        this.engine.audio.playSound('hit');
        
        if (this.enemy.hp <= 0) {
            this.endBattle('VICTORY');
        }
    }
    
    performAct(action) {
        const result = this.enemy.handleAct(action, this.player);
        this.ui.showDialogue(result.dialogue, () => {
            this.stats.actsUsed++;
            this.startEnemyTurn();
        });
    }
    
    useItem(item) {
        if (this.player.useItem(item)) {
            this.stats.itemsUsed++;
            this.ui.updateHP();
            this.startEnemyTurn();
        }
    }
    
    attemptMercy() {
        this.stats.mercyAttempts++;
        if (this.enemy.spare()) {
            this.endBattle('SPARE');
        } else {
            this.ui.showDialogue(['* You tried to spare ' + this.enemy.name + '.', '* But it failed...'], () => {
                this.startEnemyTurn();
            });
        }
    }
    
    startEnemyTurn() {
        this.turnPhase = 'ENEMY';
        this.turnTimer = 0;
        this.stats.turnsElapsed++;
        
        // Start enemy pattern
        const pattern = this.enemy.getPattern(this.stats.turnsElapsed);
        if (pattern) {
            this.bulletPatterns.push(new BulletPattern(pattern.type, pattern.params));
        }
    }
    
    endEnemyTurn() {
        this.clearBullets();
        this.turnPhase = 'PLAYER';
        this.ui.showMainMenu();
    }
    
    checkCollisions() {
        this.bulletPatterns.forEach(pattern => {
            pattern.bullets.forEach(bullet => {
                if (this.soul.checkCollision(bullet)) {
                    this.handleBulletCollision(bullet);
                }
            });
        });
    }
    
    handleBulletCollision(bullet) {
        const damage = bullet.damage;
        this.player.takeDamage(damage);
        this.stats.damageTaken += damage;
        this.ui.updateHP();
        
        if (this.player.hp <= 0) {
            this.endBattle('GAME_OVER');
        } else {
            this.engine.audio.playSound('hurt');
            bullet.destroy();
        }
    }
    
    clearBullets() {
        this.bulletPatterns = [];
    }
    
    endBattle(result) {
        this.isActive = false;
        
        switch (result) {
            case 'VICTORY':
                this.handleVictory();
                break;
            case 'SPARE':
                this.handleSpare();
                break;
            case 'GAME_OVER':
                this.handleGameOver();
                break;
        }
    }
    
    handleVictory() {
        const rewards = this.enemy.getRewards();
        this.player.gainExp(rewards.exp);
        this.player.gold += rewards.gold;
        
        this.ui.showDialogue([
            `* You won!`,
            `* You earned ${rewards.exp} EXP and ${rewards.gold} gold.`
        ], () => {
            this.engine.audio.playMusic('victoryFanfare', false);
            this.engine.state.popState();
        });
    }
    
    handleSpare() {
        this.ui.showDialogue([
            `* You spared ${this.enemy.name}!`,
            `* You earned 0 EXP and ${Math.floor(this.enemy.goldValue/2)} gold.`
        ], () => {
            this.player.gold += Math.floor(this.enemy.goldValue/2);
            this.engine.state.popState();
        });
    }
    
    handleGameOver() {
        this.soul.break();
        this.engine.audio.stopMusic();
        this.engine.audio.playSound('playerDeath');
        
        setTimeout(() => {
            this.engine.state.pushState('GAME_OVER');
        }, 1000);
    }
    
    getStatistics() {
        return this.stats;
    }
}