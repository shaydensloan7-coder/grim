// Menu system for Undertale-style menus
export class MenuSystem {
    constructor(engine) {
        this.engine = engine;
        this.currentScreen = 'main';
        this.selectedIndex = 0;
        this.visible = true;
        
        // Menu options for each screen
        this.menuOptions = {
            main: ['Continue', 'New Game', 'Settings', 'Credits', 'Extras'],
            settings: ['Master Volume', 'Music Volume', 'Sound Volume', 'Back'],
            extras: ['Character Files', 'Back'],
            credits: ['Credits', 'Back'],
            characters: []  // Will be populated with available .chr files
        };
        
        // Settings defaults
        this.settings = {
            masterVolume: 1.0,
            musicVolume: 0.7,
            sfxVolume: 0.8
        };
        
        // Get menu elements
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            menuItems: document.getElementById('menu-items'),
            gameScreen: document.getElementById('game-screen'),
            settingsScreen: document.getElementById('settings-screen'),
            creditsScreen: document.getElementById('credits-screen'),
            extrasScreen: document.getElementById('extras-screen'),
            characterFilesScreen: document.getElementById('character-files-screen'),
            soulCursor: document.getElementById('soul-cursor'),
            // Volume sliders
            masterVolume: document.getElementById('master-volume'),
            musicVolume: document.getElementById('music-volume'),
            sfxVolume: document.getElementById('sfx-volume')
        };
        
        // Validate required elements
        if (!this.validateElements()) {
            console.error('Required menu elements not found in the DOM');
            return;
        }
        
        // Bind methods
        this.handleInput = this.handleInput.bind(this);
        this.updateSoulPosition = this.updateSoulPosition.bind(this);
        this.handleVolumeChange = this.handleVolumeChange.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load settings
        this.loadSettings();
        
        // Load character files
        this.loadCharacterFiles();
        
        // Initialize menu
        this.showMainMenu();
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', this.handleInput);
        
        // Volume controls
        if (this.elements.masterVolume) {
            this.elements.masterVolume.addEventListener('input', () => this.handleVolumeChange('master'));
        }
        if (this.elements.musicVolume) {
            this.elements.musicVolume.addEventListener('input', () => this.handleVolumeChange('music'));
        }
        if (this.elements.sfxVolume) {
            this.elements.sfxVolume.addEventListener('input', () => this.handleVolumeChange('sfx'));
        }
    }
    
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('audio_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.settings = {
                    masterVolume: settings.master || 1.0,
                    musicVolume: settings.music || 0.7,
                    sfxVolume: settings.sfx || 0.8
                };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('audio_settings', JSON.stringify({
                master: this.settings.masterVolume,
                music: this.settings.musicVolume,
                sfx: this.settings.sfxVolume
            }));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }
    
    showMainMenu() {
        this.visible = true;
        this.currentScreen = 'main';
        this.selectedIndex = 0;
        
        this.hideAllScreens();
        this.elements.mainMenu.classList.remove('hidden');
        
        // Create menu items
        this.updateMenuItems('main');
        
        // Play menu theme if available
        if (this.engine.audio) {
            this.engine.audio.playMusic('menu-theme', true);
        }
        
        // Update soul cursor position
        this.updateSoulPosition();
    }
    
    showGameScreen() {
        this.visible = false;
        this.hideAllScreens();
        this.elements.gameScreen.classList.remove('hidden');
    }
    
    showSettingsScreen() {
        this.visible = true;
        this.currentScreen = 'settings';
        this.selectedIndex = 0;
        
        // Load current settings
        this.settings.masterVolume = this.engine.audio.getMasterVolume();
        this.settings.musicVolume = this.engine.audio.getMusicVolume();
        this.settings.sfxVolume = this.engine.audio.getSFXVolume();
        
        this.hideAllScreens();
        this.elements.settingsScreen.classList.remove('hidden');
        
        // Update volume displays
        this.updateVolumeDisplays();
        
        // Play menu sound
        this.engine.audio.playSound('menuSelect');
        
        // Update soul position
        this.updateSoulPosition();
    }
    
    hideAllScreens() {
        Object.values(this.elements).forEach(element => {
            if (element && element.classList) {
                element.classList.add('hidden');
            }
        });
    }
    
    updateSelection() {
        if (!this.elements.menuItems) return;
        
        const items = Array.from(this.elements.menuItems.children);
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }
    
    handleVolumeChange(type) {
        const slider = this.elements[`${type}Volume`];
        if (!slider) return;
        
        const value = parseFloat(slider.value) / 100;
        
        // Update settings
        this.settings[`${type}Volume`] = value;
        
        // Update audio system
        switch(type) {
            case 'master':
                this.engine.audio.setMasterVolume(value);
                break;
            case 'music':
                this.engine.audio.setMusicVolume(value);
                break;
            case 'sfx':
                this.engine.audio.setSFXVolume(value);
                break;
        }
        
        // Play test sound for immediate feedback
        if (type === 'master' || type === 'sfx') {
            this.engine.audio.playSound('menuMove');
        }
        
        // Save settings
        this.saveSettings();
    }
    
    handleSettingsInput(event) {
        const currentOption = this.menuOptions.settings[this.selectedIndex];
        const step = 5;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                if (currentOption !== 'Back') {
                    const slider = this.elements[this.getVolumeId(currentOption)];
                    if (slider) {
                        const newValue = Math.max(0, Math.min(100,
                            parseInt(slider.value) + (event.key === 'ArrowRight' ? step : -step)
                        ));
                        slider.value = newValue;
                        
                        // Trigger volume change event
                        const volumeType = currentOption.toLowerCase().split(' ')[0];
                        this.handleVolumeChange(volumeType);
                    }
                }
                break;
                
            case 'Enter':
            case 'z':
            case 'Z':
                if (currentOption === 'Back') {
                    this.showMainMenu();
                }
                break;
                
            case 'Escape':
            case 'x':
            case 'X':
                this.showMainMenu();
                break;
                
            case 'ArrowUp':
                this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.settings.length) % this.menuOptions.settings.length;
                this.engine.audio.playSound('menuMove');
                this.updateSoulPosition();
                break;
                
            case 'ArrowDown':
                this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.settings.length;
                this.engine.audio.playSound('menuMove');
                this.updateSoulPosition();
                break;
        }
    }
    
    getVolumeId(option) {
        switch(option) {
            case 'Master Volume': return 'masterVolume';
            case 'Music Volume': return 'musicVolume';
            case 'Sound Volume': return 'sfxVolume';
            default: return '';
        }
    }
    
    updateVolumeDisplays() {
        // Update all volume sliders with current values
        if (this.elements.masterVolume) {
            this.elements.masterVolume.value = this.settings.masterVolume * 100;
        }
        if (this.elements.musicVolume) {
            this.elements.musicVolume.value = this.settings.musicVolume * 100;
        }
        if (this.elements.sfxVolume) {
            this.elements.sfxVolume.value = this.settings.sfxVolume * 100;
        }
    }
    
    handleInput(event) {
        if (!this.visible) return;
        
        event.preventDefault();
        
        if (this.currentScreen === 'settings') {
            this.handleSettingsInput(event);
            return;
        }
        
        switch(event.key) {
            case 'ArrowUp':
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.playMenuSound('menu-move');
                break;
                
            case 'ArrowDown':
                const maxIndex = this.menuOptions[this.currentScreen].length - 1;
                this.selectedIndex = Math.min(maxIndex, this.selectedIndex + 1);
                this.playMenuSound('menu-move');
                break;
                
            case 'z':
            case 'Enter':
                this.confirmSelection();
                this.playMenuSound('menu-confirm');
                break;
                
            case 'x':
            case 'Shift':
            case 'Escape':
                if (this.currentScreen !== 'main') {
                    this.playMenuSound('menu-back');
                    this.showMainMenu();
                }
                break;
        }
        
        this.updateSelection();
        this.updateSoulPosition();
    }
    
    updateSoulPosition() {
        if (!this.elements.soulCursor) return;
        
        let selectedItem;
        if (this.currentScreen === 'settings') {
            const settingsItems = document.getElementById('settings-items');
            if (!settingsItems) return;
            const items = settingsItems.getElementsByClassName('menu-item');
            selectedItem = items[this.selectedIndex];
        } else {
            selectedItem = this.elements.menuItems.children[this.selectedIndex];
        }
        
        if (!selectedItem) return;
        
        const rect = selectedItem.getBoundingClientRect();
        const soul = this.elements.soulCursor;
        
        soul.style.left = `${rect.left - 40}px`;
        soul.style.top = `${rect.top + (rect.height / 2)}px`;
        soul.style.opacity = '1';
    }
    
    async loadCharacterFiles() {
        try {
            const files = await fs.readdir('/workspaces/grim/Characters');
            this.menuOptions.characters = files
                .filter(file => file.endsWith('.chr'))
                .map(file => file.replace('.chr', ''));
        } catch (error) {
            console.error('Error loading character files:', error);
            this.menuOptions.characters = [];
        }
    }

    confirmSelection() {
        const option = this.menuOptions[this.currentScreen][this.selectedIndex];
        
        switch(this.currentScreen) {
            case 'main':
                switch(option) {
                    case 'Continue':
                        if (this.engine.save.hasSaveData()) {
                            this.showGameScreen();
                        }
                        break;
                    case 'New Game':
                        this.showGameScreen();
                        break;
                    case 'Settings':
                        this.showScreen('settings');
                        break;
                    case 'Credits':
                        this.showScreen('credits');
                        break;
                    case 'Extras':
                        this.showScreen('extras');
                        break;
                }
                break;
            
            case 'settings':
                if (option === 'Back') {
                    this.showMainMenu();
                }
                break;
                
            case 'extras':
                switch(option) {
                    case 'Character Files':
                        this.showScreen('characters');
                        break;
                    case 'Back':
                        this.showMainMenu();
                        break;
                }
                break;
                
            case 'characters':
                if (option === 'Back') {
                    this.showScreen('extras');
                } else {
                    this.showCharacterFile(option);
                }
                break;
                
            case 'credits':
                if (option === 'Back') {
                    this.showMainMenu();
                }
                break;
        }
    }

    showScreen(screenName) {
        this.visible = true;
        this.selectedIndex = 0;
        
        // Handle special screens
        if (screenName === 'settings') {
            this.showSettingsScreen();
            return;
        }
        
        this.currentScreen = screenName;
        
        this.hideAllScreens();
        this.elements[`${screenName}Screen`].classList.remove('hidden');
        
        this.updateMenuItems(screenName);
        this.updateSoulPosition();
    }
    
    updateMenuItems(screen) {
        this.elements.menuItems.innerHTML = '';
        this.menuOptions[screen].forEach((option, index) => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            if (index === this.selectedIndex) item.className += ' selected';
            item.textContent = option;
            
            if (screen === 'main' && option === 'Continue' && !this.engine.save.hasSaveData()) {
                item.classList.add('disabled');
            }
            
            this.elements.menuItems.appendChild(item);
        });
    }

    playMenuSound(soundName) {
        if (this.engine.audio) {
            this.engine.audio.playSound(soundName);
        }
    }
    
    showCharacterFile(characterName) {
        try {
            const content = fs.readFileSync(`/workspaces/grim/Characters/${characterName}.chr`, 'utf8');
            // Create a styled display for the character file content
            const dialogue = document.createElement('div');
            dialogue.className = 'character-file-content';
            dialogue.innerText = content;
            
            // Clear previous content and show the file
            const screen = this.elements.characterFilesScreen;
            screen.querySelector('.menu-items').innerHTML = '';
            screen.appendChild(dialogue);
            
            // Add a back option
            const backOption = document.createElement('div');
            backOption.className = 'menu-item';
            backOption.textContent = 'Back';
            screen.querySelector('.menu-items').appendChild(backOption);
            
            this.selectedIndex = 0;
            this.updateSelection();
        } catch (error) {
            console.error('Error reading character file:', error);
        }
    }
    
    confirmSelection() {
        const option = this.menuOptions[this.currentScreen][this.selectedIndex];
        
        if (this.engine.audio) this.engine.audio.playSound('menu-confirm');
        
        switch(this.currentScreen) {
            case 'main':
                switch(option) {
                    case 'Continue':
                        if (this.engine.save.hasSaveData()) {
                            this.showGameScreen();
                            this.engine.continueGame();
                        }
                        break;
                    case 'New Game':
                        this.showGameScreen();
                        this.engine.startNewGame();
                        break;
                    case 'Settings':
                        this.showScreen('settings');
                        break;
                    case 'Credits':
                        this.showScreen('credits');
                        break;
                    case 'Extras':
                        this.showScreen('extras');
                        break;
                }
                break;
                
            case 'settings':
                if (option === 'Back') {
                    this.showMainMenu();
                } else {
                    const volumeType = option.toLowerCase().replace(' volume', '');
                    if (['master', 'music', 'sound'].includes(volumeType)) {
                        this.handleVolumeChange(volumeType);
                    }
                }
                break;
                
            case 'extras':
                if (option === 'Back') {
                    this.showMainMenu();
                } else if (option === 'Character Files') {
                    this.showScreen('characters');
                }
                break;
                
            case 'characters':
                if (option === 'Back') {
                    this.showScreen('extras');
                } else {
                    this.showCharacterFile(option);
                }
                break;
                
            case 'credits':
                this.showMainMenu();
                break;
        }
        
        // Update soul cursor position after screen change
        this.updateSoulPosition();
    }
    
    showScreen(screenName) {
        // Hide all screens
        this.hideAllScreens();
        
        // Show requested screen
        const screenElement = this.elements[`${screenName}Screen`];
        if (screenElement) {
            screenElement.classList.remove('hidden');
        }
        
        // Update current screen and reset selection
        this.currentScreen = screenName;
        this.selectedIndex = 0;
        
        // Update menu items for the new screen
        if (screenName === 'characters') {
            this.loadCharacterFiles();
        }
        
        // Create menu items
        this.updateMenuItems();
        
        // Update selection and soul position
        this.updateSelection();
        this.updateSoulPosition();
    }
    
    validateElements() {
        const requiredElements = [
            'mainMenu',
            'menuItems',
            'gameScreen',
            'settingsScreen',
            'creditsScreen',
            'extrasScreen',
            'characterFilesScreen',
            'soulCursor'
        ];
        
        return requiredElements.every(element => {
            if (!this.elements[element]) {
                console.error(`Missing required element: ${element}`);
                return false;
            }
            return true;
        });
    }
    
    updateMenuItems() {
        if (!this.elements.menuItems) return;
        
        // Clear existing items
        this.elements.menuItems.innerHTML = '';
        
        // Add new items
        const items = this.menuOptions[this.currentScreen] || [];
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'menu-item';
            if (index === this.selectedIndex) div.classList.add('selected');
            div.textContent = item;
            
            // Handle special cases
            if (item === 'Continue' && !this.engine.save.hasSaveData()) {
                div.classList.add('disabled');
            }
            
            this.elements.menuItems.appendChild(div);
        });
    }
    
    updateVolumeDisplay() {
        if (!this.elements.menuItems || !this.engine.audio) return;
        
        const volumes = {
            'Master Volume': this.engine.audio.masterVolume,
            'Music Volume': this.engine.audio.musicVolume,
            'Sound Volume': this.engine.audio.soundVolume
        };
        
        Array.from(this.elements.menuItems.children).forEach(item => {
            const volume = volumes[item.textContent.split(':')[0]];
            if (volume !== undefined) {
                const bars = '█'.repeat(Math.floor(volume * 10));
                item.textContent = `${item.textContent.split(':')[0]}: ${bars}`;
            }
        });
    }
    
    handleVolumeChange(type) {
        if (!this.engine.audio) return;
        
        // Toggle volume between 0 and 1
        const currentVolume = this.engine.audio[`${type}Volume`];
        const newVolume = currentVolume > 0 ? 0 : 1;
        
        switch (type) {
            case 'master':
                this.engine.audio.setMasterVolume(newVolume);
                break;
            case 'music':
                this.engine.audio.setMusicVolume(newVolume);
                break;
            case 'sound':
                this.engine.audio.setSoundVolume(newVolume);
                break;
        }
        
        // Update display and play test sound
        this.updateVolumeDisplay();
        if (type === 'sound' || type === 'master') {
            this.engine.audio.playSound('menu-select');
        }
    }
}