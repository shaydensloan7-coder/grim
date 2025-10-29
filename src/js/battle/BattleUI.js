// Battle UI handling for Undertale-style battle system
import { CONFIG } from '../config.js';

export class BattleUI {
    constructor(battle) {
        this.battle = battle;
        this.visible = false;
        this.currentMenu = 'main';
        this.selectedIndex = 0;
        this.textAnimationSpeed = 0.03; // seconds per character (Undertale speed)
        this.textAnimationTimer = 0;
        this.displayedText = '';
        this.currentDialogue = '';
        this.flavorText = '';
        this.dialogueCallback = null;
        
        // Element references
        this.elements = {
            battleUI: null,
            actionMenu: null,
            actsMenu: null,
            itemsMenu: null,
            actsList: null,
            itemsList: null,
            flavorText: null,
            enemyName: null,
            enemyHP: null,
            playerName: null,
            playerHP: null,
            currentHP: null,
            maxHP: null
        };
        
        this.menus = {
            main: ['FIGHT', 'ACT', 'ITEM', 'MERCY'],
            acts: [],
            items: []
        };
        
        this.createElements();
        this.setupEventListeners();
        this.hide();
    }
    
    createElements() {
        // Create battle UI container
        this.container = document.createElement('div');
        this.container.id = 'battle-ui';
        this.container.className = 'battle-ui';
        document.body.appendChild(this.container);
        
        // Create UI components
        this.createInfoPanel();
        this.createDialogueBox();
        this.createMenuBox();
        this.createFlavorText();
    }
    
    createInfoPanel() {
        // Enemy info
        this.elements.enemyInfo = document.createElement('div');
        this.elements.enemyInfo.className = 'enemy-info';
        
        this.elements.enemyName = document.createElement('div');
        this.elements.enemyName.className = 'name';
        
        this.elements.enemyHP = document.createElement('div');
        this.elements.enemyHP.className = 'hp-bar';
        this.elements.enemyHPFill = document.createElement('div');
        this.elements.enemyHPFill.className = 'hp-fill';
        this.elements.enemyHP.appendChild(this.elements.enemyHPFill);
        
        this.elements.enemyInfo.appendChild(this.elements.enemyName);
        this.elements.enemyInfo.appendChild(this.elements.enemyHP);
        this.container.appendChild(this.elements.enemyInfo);
        
        // Player info
        this.elements.playerInfo = document.createElement('div');
        this.elements.playerInfo.className = 'player-info';
        
        this.elements.playerName = document.createElement('div');
        this.elements.playerName.className = 'name';
        
        this.elements.playerHP = document.createElement('div');
        this.elements.playerHP.className = 'hp-bar';
        this.elements.playerHPFill = document.createElement('div');
        this.elements.playerHPFill.className = 'hp-fill';
        this.elements.playerHPText = document.createElement('div');
        this.elements.playerHPText.className = 'hp-text';
        
        this.elements.playerHP.appendChild(this.elements.playerHPFill);
        this.elements.playerHP.appendChild(this.elements.playerHPText);
        
        this.elements.playerInfo.appendChild(this.elements.playerName);
        this.elements.playerInfo.appendChild(this.elements.playerHP);
        this.container.appendChild(this.elements.playerInfo);
    }
    
    createDialogueBox() {
        this.elements.dialogueBox = document.createElement('div');
        this.elements.dialogueBox.className = 'dialogue-box';
        this.elements.dialogueText = document.createElement('div');
        this.elements.dialogueText.className = 'dialogue-text';
        this.elements.dialogueBox.appendChild(this.elements.dialogueText);
        this.container.appendChild(this.elements.dialogueBox);
    }
    
    createMenuBox() {
        this.elements.menuBox = document.createElement('div');
        this.elements.menuBox.className = 'menu';
        
        // Create menu grid
        this.elements.menuGrid = document.createElement('div');
        this.elements.menuGrid.className = 'menu grid-4';
        
        // Create menu items
        this.menus.main.forEach((action, index) => {
            const button = document.createElement('button');
            button.className = 'menu-item';
            button.textContent = action;
            button.setAttribute('data-index', index);
            button.addEventListener('click', (e) => {
                this.selectedIndex = index;
                this.updateSelection();
                this.confirmSelection();
                e.stopPropagation();
            });
            this.elements.menuGrid.appendChild(button);
        });
        
        this.elements.menuBox.appendChild(this.elements.menuGrid);
        this.container.appendChild(this.elements.menuBox);
    }
    
    createFlavorText() {
        // Create flavor text container (Undertale-style battle text)
        this.elements.flavorText = document.createElement('div');
        this.elements.flavorText.className = 'flavor-text';
        this.elements.flavorText.textContent = '* The battle begins.';
        this.container.appendChild(this.elements.flavorText);
    }
    
    setupEventListeners() {
        // Set up keyboard input
        document.addEventListener('keydown', (e) => this.handleInput(e));
    }
    
    handleInput(event) {
        if (!this.visible) return;
        
        switch (this.currentMenu) {
            case 'main':
                this.handleMainMenuInput(event);
                break;
            case 'acts':
                this.handleActsMenuInput(event);
                break;
            case 'items':
                this.handleItemsMenuInput(event);
                break;
            case 'dialogue':
                this.handleDialogueInput(event);
                break;
        }
    }
    
    handleMainMenuInput(event) {
        switch (event.key) {
            case 'ArrowLeft':
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.updateSelection();
                this.battle.engine.audio.playSound('menu-move');
                break;
            case 'ArrowRight':
                this.selectedIndex = Math.min(3, this.selectedIndex + 1);
                this.updateSelection();
                this.battle.engine.audio.playSound('menu-move');
                break;
            case 'z':
            case 'Enter':
                this.confirmSelection();
                this.battle.engine.audio.playSound('menu-select');
                break;
            case 'x':
            case 'Shift':
                // Cannot cancel from main menu
                break;
        }
    }
    
    handleActsMenuInput(event) {
        const maxIndex = this.menus.acts.length - 1;
        
        switch (event.key) {
            case 'ArrowUp':
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.updateSelection();
                this.battle.engine.audio.playSound('menu-move');
                break;
            case 'ArrowDown':
                this.selectedIndex = Math.min(maxIndex, this.selectedIndex + 1);
                this.updateSelection();
                this.battle.engine.audio.playSound('menu-move');
                break;
            case 'z':
            case 'Enter':
                this.confirmAct();
                this.battle.engine.audio.playSound('menu-select');
                break;
            case 'x':
            case 'Shift':
                this.showMainMenu();
                this.battle.engine.audio.playSound('menu-back');
                break;
        }
    }
    
    setFlavorText(text) {
        if (!text) text = '* ...';
        this.elements.flavorText.textContent = text.startsWith('*') ? text : `* ${text}`;
    }
    
    handleItemsMenuInput(event) {
        const maxIndex = this.menus.items.length - 1;
        
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.updateSelection();
                this.battle.engine.audio.playSound('menu-move');
                break;
            case 'ArrowDown':
            case 's':
                this.selectedIndex = Math.min(maxIndex, this.selectedIndex + 1);
                this.updateSelection();
                this.battle.engine.audio.playSound('menu-move');
                break;
            case 'z':
            case 'Enter':
                this.confirmItem();
                this.battle.engine.audio.playSound('menu-select');
                break;
            case 'x':
            case 'Escape':
                this.showMainMenu();
                this.battle.engine.audio.playSound('menu-move');
                break;
        }
    }
    
    handleDialogueInput(event) {
        if (event.key === 'z' || event.key === 'Enter') {
            if (this.displayedText === this.currentDialogue) {
                // Dialogue complete
                if (this.dialogueCallback) {
                    this.dialogueCallback();
                    this.dialogueCallback = null;
                }
                this.hideDialogue();
            } else {
                // Show all text immediately
                this.displayedText = this.currentDialogue;
                this.elements.dialogueText.textContent = this.displayedText;
            }
        }
    }
    
    confirmSelection() {
        const action = this.menus.main[this.selectedIndex];
        switch (action) {
            case 'FIGHT':
                this.setFlavorText('* You prepare to strike.');
                this.battle.startTargeting();
                break;
            case 'ACT':
                this.setFlavorText('* What will you do?');
                this.showActsMenu();
                break;
            case 'ITEM':
                this.setFlavorText('* Choose an item.');
                this.showItemsMenu();
                break;
            case 'MERCY':
                this.setFlavorText('* You consider your options.');
                this.battle.attemptMercy();
                break;
        }
    }
    
    confirmAct() {
        const act = this.menus.acts[this.selectedIndex];
        this.battle.performAct(act);
    }
    
    confirmItem() {
        const item = this.menus.items[this.selectedIndex];
        this.battle.useItem(item);
    }
    
    updateSelection() {
        const items = this.elements.menuGrid.querySelectorAll('.menu-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }
    
    show() {
        this.visible = true;
        this.container.style.display = 'block';
        this.setFlavorText('* The battle begins.');
        this.showMainMenu();
    }
    
    hide() {
        this.visible = false;
        this.container.style.display = 'none';
    }
    
    showMainMenu() {
        this.currentMenu = 'main';
        this.selectedIndex = 0;
        this.updateSelection();
        this.elements.menuBox.style.display = 'block';
        this.elements.dialogueBox.style.display = 'none';
        if (!this.elements.flavorText.textContent) {
            this.setFlavorText('* ' + this.battle.enemy.name + ' stands before you.');
        }
    }
    
    showActsMenu() {
        this.currentMenu = 'acts';
        this.selectedIndex = 0;
        this.updateActsList();
    }
    
    showItemsMenu() {
        this.currentMenu = 'items';
        this.selectedIndex = 0;
        this.updateItemsList();
    }
    
    updateActsList() {
        // Clear existing items
        while (this.elements.menuGrid.firstChild) {
            this.elements.menuGrid.removeChild(this.elements.menuGrid.firstChild);
        }
        
        // Add act options
        this.menus.acts.forEach(act => {
            const button = document.createElement('button');
            button.className = 'menu-item';
            button.textContent = act;
            this.elements.menuGrid.appendChild(button);
        });
        
        this.updateSelection();
    }
    
    updateItemsList() {
        // Clear existing items
        while (this.elements.menuGrid.firstChild) {
            this.elements.menuGrid.removeChild(this.elements.menuGrid.firstChild);
        }
        
        // Add inventory items
        this.menus.items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'menu-item';
            button.textContent = item.name;
            this.elements.menuGrid.appendChild(button);
        });
        
        this.updateSelection();
    }
    
    showDialogue(text, callback = null) {
        this.currentMenu = 'dialogue';
        this.currentDialogue = Array.isArray(text) ? text.join('\n') : text;
        this.displayedText = '';
        this.textAnimationTimer = 0;
        this.dialogueCallback = callback;
        
        this.elements.menuBox.style.display = 'none';
        this.elements.dialogueBox.style.display = 'block';
        this.elements.dialogueText.textContent = '';
    }
    
    hideDialogue() {
        this.elements.dialogueBox.style.display = 'none';
        this.showMainMenu();
    }
    
    update(deltaTime) {
        // Update text animation
        if (this.currentMenu === 'dialogue' && this.displayedText !== this.currentDialogue) {
            this.textAnimationTimer += deltaTime;
            
            if (this.textAnimationTimer >= this.textAnimationSpeed) {
                this.textAnimationTimer = 0;
                this.displayedText += this.currentDialogue[this.displayedText.length];
                this.elements.dialogueText.textContent = this.displayedText;
                
                if (this.displayedText.length % 2 === 0) {
                    this.battle.engine.audio.playSound('text');
                }
            }
        }
    }
    
    updateHP() {
        const player = this.battle.player;
        const enemy = this.battle.enemy;
        
        // Update player HP
        this.elements.playerName.textContent = player.name;
        this.elements.playerHPFill.style.width = `${(player.hp / player.maxHP) * 100}%`;
        this.elements.playerHPText.textContent = `${player.hp} / ${player.maxHP}`;
        
        // Update enemy HP
        if (enemy) {
            this.elements.enemyHPFill.style.width = `${(enemy.hp / enemy.maxHP) * 100}%`;
        }
    }
    
    setEnemyName(name) {
        this.elements.enemyName.textContent = name;
    }
    
    showDamageNumber(amount, x, y, isCritical = false) {
        const damageText = document.createElement('div');
        damageText.className = 'damage-text';
        if (isCritical) damageText.classList.add('critical');
        damageText.textContent = amount;
        damageText.style.left = `${x}px`;
        damageText.style.top = `${y}px`;
        
        this.container.appendChild(damageText);
        
        // Remove after animation
        setTimeout(() => {
            this.container.removeChild(damageText);
        }, 1000);
    }
}