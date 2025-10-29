// Dialogue and story management system
import { CONFIG } from '../config.js';

export class DialogueSystem {
    constructor(engine) {
        this.engine = engine;
        this.dialogueBox = document.getElementById('dialogue-box');
        this.dialogueText = document.getElementById('dialogue-text');
        this.nextBtn = document.getElementById('next-btn');
        
        // Dialogue state
        this.isActive = false;
        this.currentDialogue = null;
        this.dialogueQueue = [];
        this.textSpeed = 30; // ms per character
        this.skipTextAnimation = false;
        
        // Character information for portraits and voice effects
        this.characters = {
            grim: {
                name: 'GRIM',
                color: '#ff0000',
                portrait: 'assets/images/characters/grim_portrait.png',
                voice: 'grim_voice'
            },
            zoey: {
                name: 'ZOEY',
                color: '#00ff00',
                portrait: 'assets/images/characters/zoey_portrait.png',
                voice: 'zoey_voice'
            },
            zack: {
                name: 'ZACK',
                color: '#0000ff',
                portrait: 'assets/images/characters/zack_portrait.png',
                voice: 'zack_voice'
            },
            mia: {
                name: 'MIA',
                color: '#ff00ff',
                portrait: 'assets/images/characters/mia_portrait.png',
                voice: 'mia_voice'
            }
        };
        
        // Bind events
        this.handleNext = this.handleNext.bind(this);
        this.handleClick = this.handleClick.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.nextBtn.addEventListener('click', this.handleNext);
        this.dialogueBox.addEventListener('click', this.handleClick);
    }
    
    show() {
        this.dialogueBox.classList.remove('hidden');
        this.isActive = true;
    }
    
    hide() {
        this.dialogueBox.classList.add('hidden');
        this.isActive = false;
    }
    
    async showDialogue(dialogueData) {
        if (Array.isArray(dialogueData)) {
            this.dialogueQueue = [...dialogueData];
            await this.processNextDialogue();
        } else {
            await this.displaySingleDialogue(dialogueData);
        }
    }
    
    async processNextDialogue() {
        if (this.dialogueQueue.length > 0) {
            const nextDialogue = this.dialogueQueue.shift();
            await this.displaySingleDialogue(nextDialogue);
        } else {
            this.hide();
        }
    }
    
    async displaySingleDialogue(dialogueData) {
        this.currentDialogue = dialogueData;
        this.show();
        
        // Set up character info if present
        if (dialogueData.character) {
            const character = this.characters[dialogueData.character];
            if (character) {
                this.setCharacterStyle(character);
            }
        }
        
        // Animate text
        await this.animateText(dialogueData.text);
        
        // Execute any associated events
        if (dialogueData.events) {
            this.processEvents(dialogueData.events);
        }
        
        // Wait for player input if not auto-advancing
        if (!dialogueData.autoAdvance) {
            return new Promise(resolve => {
                this.nextBtn.onclick = () => {
                    this.engine.audio.playSound('menu-select');
                    resolve();
                };
            });
        }
    }
    
    async animateText(text) {
        if (this.skipTextAnimation) {
            this.dialogueText.textContent = text;
            return;
        }
        
        this.dialogueText.textContent = '';
        for (let i = 0; i < text.length; i++) {
            this.dialogueText.textContent += text[i];
            if (text[i] !== ' ') {
                this.playTypeSound();
            }
            await new Promise(resolve => setTimeout(resolve, this.textSpeed));
            
            // Check for skip
            if (this.skipTextAnimation) {
                this.dialogueText.textContent = text;
                break;
            }
        }
    }
    
    setCharacterStyle(character) {
        this.dialogueText.style.color = character.color;
        // Add more character-specific styling here
    }
    
    playTypeSound() {
        // Play type sound based on current character
        if (this.currentDialogue && this.currentDialogue.character) {
            const character = this.characters[this.currentDialogue.character];
            if (character) {
                this.engine.audio.playSound(character.voice);
            }
        }
    }
    
    processEvents(events) {
        events.forEach(event => {
            switch (event.type) {
                case 'setFlag':
                    this.engine.story.setFlag(event.flag, event.value);
                    break;
                case 'addItem':
                    this.engine.player.addItem(event.item);
                    break;
                case 'startBattle':
                    this.engine.battle.startBattle(event.enemy);
                    break;
                case 'playMusic':
                    this.engine.audio.playMusic(event.track);
                    break;
                case 'playSound':
                    this.engine.audio.playSound(event.sound);
                    break;
                // Add more event types as needed
            }
        });
    }
    
    handleNext() {
        if (!this.isActive) return;
        
        if (this.skipTextAnimation) {
            this.processNextDialogue();
        } else {
            this.skipTextAnimation = true;
        }
    }
    
    handleClick() {
        this.handleNext();
    }
}