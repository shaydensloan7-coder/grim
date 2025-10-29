// Main entry point for the game
import { GameEngine } from './engine/GameEngine.js';

// Create loading screen
function createLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <h1>Loading GRIM...</h1>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingScreen);
    return loadingScreen;
}

// Create error screen
function showErrorScreen(error) {
    document.body.innerHTML = `
        <div class="error-screen">
            <h1>Error</h1>
            <p>Failed to load game. Please refresh the page.</p>
            <p class="error-details">${error.message}</p>
            <button onclick="location.reload()">Retry</button>
        </div>
    `;
}

// Update loading progress
function updateLoadingProgress(progress) {
    const progressBar = document.querySelector('.loading-progress');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = createLoadingScreen();
    
    try {
        // Create game engine
        const game = new GameEngine();
        
        // Load assets with progress updates
        await game.preloadAssets(progress => {
            updateLoadingProgress(progress);
        });
        
        // Initialize game systems
        await game.init();
        
        // Remove loading screen
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
        
        console.log('Game initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorScreen(error);
    }
});