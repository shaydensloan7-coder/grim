// Save/Load system using localStorage
import { CONFIG } from '../config.js';

export class SaveManager {
    constructor() {
        this.saveKey = CONFIG.SAVE_KEY;
    }
    
    saveGame(gameState) {
        try {
            const saveData = {
                player: {
                    hp: gameState.player.hp,
                    maxHp: gameState.player.maxHp,
                    exp: gameState.player.exp,
                    level: gameState.player.level,
                    items: gameState.player.items
                },
                story: {
                    progress: gameState.story.progress,
                    choices: gameState.story.choices,
                    flags: gameState.story.flags
                },
                statistics: {
                    playTime: gameState.statistics.playTime,
                    battlesWon: gameState.statistics.battlesWon,
                    itemsFound: gameState.statistics.itemsFound
                },
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) return null;
            
            return JSON.parse(saveData);
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }
    
    resetGame() {
        try {
            localStorage.removeItem(this.saveKey);
            return true;
        } catch (error) {
            console.error('Failed to reset game:', error);
            return false;
        }
    }
    
    hasSaveData() {
        return localStorage.getItem(this.saveKey) !== null;
    }
}