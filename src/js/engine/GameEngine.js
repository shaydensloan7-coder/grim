// Core game engine that handles the game loop, state management, and resource loading
import { CONFIG } from '../config.js';
import { AudioManager } from '../managers/AudioManager.js';
import { StateManager } from '../managers/StateManager.js';
import { SaveManager } from '../managers/SaveManager.js';
import { MenuSystem } from '../managers/MenuSystem.js';
import { BattleSystem } from '../battle/BattleSystem.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { StorySystem } from '../systems/StorySystem.js';
import { Player } from '../entities/Player.js';

export class GameEngine {
    constructor() {
        // Loading screen elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.querySelector('.loading-progress');
        this.loadingSteps = {
            assets: { weight: 0.4, progress: 0 },
            audio: { weight: 0.3, progress: 0 },
            systems: { weight: 0.3, progress: 0 }
        };
        
        // Asset tracking
        this.assets = {
            images: {},
            audio: {},
            fonts: {},
            data: {}
        };
        
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Core systems (initialized in init())
        this.state = null;
        this.save = null;
        this.audio = null;
        this.menu = null;
        this.battle = null;
        this.dialogue = null;
        this.story = null;
        this.player = null;
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.currentScene = null;
        this.isPaused = false;
        
        // Debug mode
        this.debug = {
            enabled: false,
            showColliders: false,
            showFPS: false
        };
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    async preloadAssets(progressCallback = () => {}) {
        const assets = {
            images: [],
            audio: [],
            fonts: []
        };
        
        // Collect image assets
        for (const category in CONFIG.ASSETS.SPRITES) {
            const basePath = CONFIG.ASSETS.SPRITES[category];
            // Add core UI assets
            if (category === 'BATTLE') {
                assets.images.push({ key: 'soul', path: basePath + 'Soul/spr_heart_0.png' });
                assets.images.push({ key: 'battleBg', path: basePath + 'BG/battle_bg.png' });
            }
        }
        
        // Collect audio assets
        for (const type in CONFIG.AUDIO) {
            if (type === 'MUSIC' || type === 'SFX') {
                for (const [key, path] of Object.entries(CONFIG.AUDIO[type])) {
                    assets.audio.push({ key: key, path: path });
                }
            }
        }
        
        // Add fonts
        for (const [key, path] of Object.entries(CONFIG.ASSETS.FONTS)) {
            assets.fonts.push({ key: key, path: path });
        }
        
        const totalAssets = Object.values(assets).reduce((total, category) => total + category.length, 0);
        let loadedAssets = 0;
        
        try {
            // Load images
            const imagePromises = assets.images.map(img => {
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        this.assets.images[img.key] = image;
                        loadedAssets++;
                        progressCallback((loadedAssets / totalAssets) * 100);
                        resolve();
                    };
                    image.onerror = () => reject(new Error(`Failed to load image: ${img.path}`));
                    image.src = img.path;
                });
            });
            
            // Load audio
            const audioPromises = assets.audio.map(audio => {
                return new Promise((resolve, reject) => {
                    const sound = new Audio();
                    sound.oncanplaythrough = () => {
                        this.assets.audio[audio.key] = sound;
                        loadedAssets++;
                        progressCallback((loadedAssets / totalAssets) * 100);
                        resolve();
                    };
                    sound.onerror = () => reject(new Error(`Failed to load audio: ${audio.path}`));
                    sound.src = audio.path;
                });
            });
            
            // Load fonts
            const fontPromises = assets.fonts.map(font => {
                return new Promise((resolve, reject) => {
                    const fontFace = new FontFace(font.key, `url(${font.path})`);
                    fontFace.load().then(loaded_face => {
                        document.fonts.add(loaded_face);
                        this.assets.fonts[font.key] = loaded_face;
                        loadedAssets++;
                        progressCallback((loadedAssets / totalAssets) * 100);
                        resolve();
                    }).catch(err => reject(new Error(`Failed to load font: ${font.path}`)));
                });
            });
            
            // Wait for all assets to load
            await Promise.all([
                ...imagePromises,
                ...audioPromises,
                ...fontPromises
            ]);
            
        } catch (error) {
            console.error('Failed to preload assets:', error);
            throw error;
        }
    }
    
    async init() {
        try {
            // Set canvas dimensions
            this.handleResize();
            
            // Initialize core systems
            this.updateLoadingProgress('systems', 10);
            this.state = new StateManager(this);
            this.save = new SaveManager(this);
            
            // Initialize audio system
            this.updateLoadingProgress('systems', 20);
            this.audio = new AudioManager(this);
            await this.audio.init();
            
            // Preload assets (handles its own progress updates)
            this.updateLoadingProgress('systems', 30);
            await this.preloadAssets(progress => {
                this.updateLoadingProgress('assets', progress);
            });
            
            // Initialize game systems
            this.updateLoadingProgress('systems', 50);
            this.menu = new MenuSystem(this);
            this.battle = new BattleSystem(this);
            this.dialogue = new DialogueSystem(this);
            this.story = new StorySystem(this);
            this.player = new Player(this);
            
            // Initialize remaining systems
            this.updateLoadingProgress('systems', 70);
            await Promise.all([
                this.story.init(),
                this.battle.init(),
                this.dialogue.init(),
                this.player.init()
            ]);
            
            // Final initialization
            this.updateLoadingProgress('systems', 90);
            
            // Finish loading
            this.updateLoadingProgress('systems', 100);
            this.updateLoadingProgress('assets', 100);
            this.updateLoadingProgress('audio', 100);
            
            // Small delay for visual polish
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Hide loading screen and show main menu
            this.hideLoadingScreen();
            this.menu.showMainMenu();
            
            // Start game loop
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop);
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError(error);
            throw error;
        }
    }
    
    startNewGame() {
        // Reset all systems
        this.reset();
        
        // Start the story
        this.story.startIntro();
    }
    
    continueGame() {
        // Load saved game
        if (this.save.loadGame()) {
            this.story.continueFromSave();
        }
    }
    
    updateLoadingProgress(category, progress) {
        if (this.loadingSteps[category]) {
            this.loadingSteps[category].progress = Math.min(100, progress);
            
            // Calculate total weighted progress
            const totalProgress = Object.values(this.loadingSteps).reduce((sum, step) => {
                return sum + (step.progress * step.weight);
            }, 0);
            
            // Update loading bar
            if (this.loadingProgress) {
                this.loadingProgress.style.width = `${totalProgress}%`;
            }
        }
    }
    
    showError(error) {
        // Hide loading screen
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
        
        // Show error screen
        const errorScreen = document.getElementById('error-screen');
        const errorDetails = errorScreen.querySelector('.error-details');
        if (errorScreen && errorDetails) {
            errorDetails.textContent = error.message || 'Unknown error occurred';
            errorScreen.classList.remove('hidden');
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            // Add fade-out animation
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
            }, 500); // Match this with CSS transition duration
        }
    }
    
    handleResize() {
        const baseWidth = CONFIG.CANVAS_WIDTH;
        const baseHeight = CONFIG.CANVAS_HEIGHT;
        const windowRatio = window.innerWidth / window.innerHeight;
        const gameRatio = baseWidth / baseHeight;
        
        let width, height, scale;
        
        if (windowRatio < gameRatio) {
            // Window is taller than game ratio
            width = window.innerWidth;
            height = width / gameRatio;
            scale = width / baseWidth;
        } else {
            // Window is wider than game ratio
            height = window.innerHeight;
            width = height * gameRatio;
            scale = height / baseHeight;
        }
        
        this.canvas.width = baseWidth;
        this.canvas.height = baseHeight;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        // Store the scale for use in input calculations
        this.scale = scale;
        
        // Clear canvas and set defaults
        this.ctx.imageSmoothingEnabled = false;
        
        // Update any UI elements that need repositioning
        if (this.battle.isActive) {
            this.battle.handleResize();
        }
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game state
        this.update(deltaTime);
        
        // Render frame
        this.render();
        
        // Queue next frame
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        if (!this.isRunning) return;
        
        // Update all active systems
        this.menu.update(deltaTime);
        this.story.update(deltaTime);
        this.dialogue.update(deltaTime);
        
        if (this.battle.isActive) {
            this.battle.update(deltaTime);
        } else if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
        
        // Update player
        if (this.player) {
            this.player.update(deltaTime);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render current scene or battle
        if (this.battle.isActive) {
            this.battle.render(this.ctx);
        } else if (this.currentScene) {
            this.currentScene.render(this.ctx);
        }
        
        // Render player if in scene
        if (this.player && this.currentScene) {
            this.player.render(this.ctx);
        }
    }
    
    setupEventListeners() {
        // Input events
        window.addEventListener('keydown', this.handleInput);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Window events
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle fullscreen changes
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    }
    
    handleKeyUp(event) {
        this.state.getCurrentState().handleKeyUp?.(event);
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    handleFullscreenChange() {
        if (document.fullscreenElement) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            this.handleResize();
        }
    }
    
    handleInput(event) {
        this.state.getCurrentState().handleInput(event);
    }
    
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    reset() {
        this.save.resetGame();
        this.state.resetState();
    }
}