// State manager for handling different game states
export class StateManager {
    constructor(engine) {
        this.engine = engine;
        
        // Available states
        this.states = {
            MENU: new MenuState(this.engine),
            GAME: new GameState(this.engine),
            BATTLE: new BattleState(this.engine),
            DIALOGUE: new DialogueState(this.engine),
            PAUSE: new PauseState(this.engine)
        };
        
        // State stack for state management
        this.stateStack = [];
        
        // Start with menu state
        this.pushState('MENU');
    }
    
    pushState(stateKey) {
        const state = this.states[stateKey];
        if (!state) {
            console.error(`State '${stateKey}' does not exist`);
            return;
        }
        
        // Exit current state if exists
        if (this.getCurrentState()) {
            this.getCurrentState().exit();
        }
        
        // Push and enter new state
        this.stateStack.push(state);
        state.enter();
    }
    
    popState() {
        if (this.stateStack.length > 0) {
            // Exit and remove current state
            const state = this.stateStack.pop();
            state.exit();
            
            // Enter previous state
            if (this.getCurrentState()) {
                this.getCurrentState().enter();
            }
        }
    }
    
    getCurrentState() {
        return this.stateStack[this.stateStack.length - 1] || null;
    }
    
    update(deltaTime) {
        const currentState = this.getCurrentState();
        if (currentState) {
            currentState.update(deltaTime);
        }
    }
    
    render(ctx) {
        const currentState = this.getCurrentState();
        if (currentState) {
            currentState.render(ctx);
        }
    }
}

// Base State class
class State {
    constructor(engine) {
        this.engine = engine;
    }
    
    enter() {}
    exit() {}
    update(deltaTime) {}
    render(ctx) {}
    handleInput(event) {}
}

// Menu State
class MenuState extends State {
    enter() {
        // Show main menu
        this.engine.menu.showMainMenu();
    }
    
    exit() {
        // Hide main menu
        this.engine.menu.hideMainMenu();
    }
    
    render(ctx) {
        // Render menu background and effects
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

// Game State
class GameState extends State {
    enter() {
        // Show game UI
        this.engine.menu.showGameScreen();
    }
    
    exit() {
        // Hide game UI
        this.engine.menu.hideGameScreen();
    }
    
    update(deltaTime) {
        // Update game logic
        this.engine.player.update(deltaTime);
        this.engine.world.update(deltaTime);
    }
    
    render(ctx) {
        // Render game world
        this.engine.world.render(ctx);
        this.engine.player.render(ctx);
    }
    
    handleInput(event) {
        // Handle game input
        this.engine.player.handleInput(event);
    }
}

// Battle State
class BattleState extends State {
    enter() {
        // Show battle UI
        this.engine.battle.ui.show();
    }
    
    exit() {
        // Hide battle UI
        this.engine.battle.ui.hide();
    }
    
    update(deltaTime) {
        // Update battle logic
        this.engine.battle.update(deltaTime);
    }
    
    render(ctx) {
        // Render battle scene
        this.engine.battle.render(ctx);
    }
    
    handleInput(event) {
        // Handle battle input
        this.engine.battle.handleInput(event);
    }
}

// Dialogue State
class DialogueState extends State {
    enter() {
        // Show dialogue UI
        this.engine.dialogue.show();
    }
    
    exit() {
        // Hide dialogue UI
        this.engine.dialogue.hide();
    }
    
    handleInput(event) {
        // Handle dialogue input
        if (event.key === 'z' || event.key === 'Enter') {
            this.engine.dialogue.advance();
        }
    }
}

// Pause State
class PauseState extends State {
    enter() {
        // Show pause menu
        this.engine.menu.showPauseMenu();
    }
    
    exit() {
        // Hide pause menu
        this.engine.menu.hidePauseMenu();
    }
    
    handleInput(event) {
        // Handle pause menu input
        if (event.key === 'Escape') {
            this.engine.state.popState();
        }
    }
}