// Main entry point for Sovereign Tactics
import { Game } from './game/Game.js';
import { GameBoard } from './ui/GameBoard.js';
import { HUD } from './ui/HUD.js';
import { GAME_CONSTANTS } from './utils/Constants.js';

class EmpireDeluxeApp {
    constructor() {
        this.game = null;
        this.gameBoard = null;
        this.menu = null;
        this.hud = null;
        this.isGameStarted = false;
    }
    
    init() {
        console.log('Initializing Sovereign Tactics...');
        
        // Setup menu button handlers directly
        this.setupMenuHandlers();
        
        console.log('Sovereign Tactics initialized');
    }
    
    setupMenuHandlers() {
        console.log('Setting up menu handlers...');
        
        // Quick game button
        const quickGameBtn = document.getElementById('start-basic-game');
        if (quickGameBtn) {
            console.log('Quick game button found, adding event listener');
            quickGameBtn.addEventListener('click', () => {
                console.log('Quick game button clicked!');
                this.startNewGame({
                    mapWidth: 20,
                    mapHeight: 15,
                    numPlayers: 2,
                    difficulty: 'easy'
                });
            });
        } else {
            console.error('Quick game button not found!');
        }
        
        // Standard game button
        const standardGameBtn = document.getElementById('start-standard-game');
        if (standardGameBtn) {
            console.log('Standard game button found, adding event listener');
            standardGameBtn.addEventListener('click', () => {
                console.log('Standard game button clicked!');
                this.startNewGame({
                    mapWidth: 30,
                    mapHeight: 20,
                    numPlayers: 2,
                    difficulty: 'medium'
                });
            });
        } else {
            console.error('Standard game button not found!');
        }
        
        // Advanced game button
        const advancedGameBtn = document.getElementById('start-advanced-game');
        if (advancedGameBtn) {
            advancedGameBtn.addEventListener('click', () => {
                this.startNewGame({
                    mapWidth: 40,
                    mapHeight: 30,
                    numPlayers: 4,
                    difficulty: 'hard'
                });
            });
        }
        
        // Load game from menu
        const loadGameBtn = document.getElementById('load-saved-game');
        if (loadGameBtn) {
            loadGameBtn.addEventListener('click', () => {
                this.loadGame();
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('show-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        
        // Help button
        const helpBtn = document.getElementById('show-help');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelpModal();
            });
        }
    }
    
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Close button
            const closeBtn = document.getElementById('close-settings');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
        }
    }
    
    showHelpModal() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Close button
            const closeBtn = document.getElementById('close-help');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
        }
    }
    
    startNewGame(gameConfig) {
        console.log('Starting new game with config:', gameConfig);
        
        try {
            // Create new game instance
            this.game = new Game();
            
            // Initialize game with configuration
            this.game.initializeGame({
                mapWidth: gameConfig.mapWidth || GAME_CONSTANTS.MAP.DEFAULT_WIDTH,
                mapHeight: gameConfig.mapHeight || GAME_CONSTANTS.MAP.DEFAULT_HEIGHT,
                numPlayers: gameConfig.numPlayers || 2,
                difficulty: gameConfig.difficulty || 'medium'
            });
            
            // Setup UI components
            this.setupGameUI();
            
            // Hide menu and show game
            this.showGame();
            
            this.isGameStarted = true;
            console.log('New game started successfully');
            
        } catch (error) {
            console.error('Failed to start new game:', error);
            alert('Failed to start game: ' + error.message);
        }
    }
    
    setupGameUI() {
        // Create game board
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            this.gameBoard = new GameBoard(canvas, this.game);
        }
        
        // Create HUD
        this.hud = new HUD(this.game);
        
        // Add test listeners to debug events
        this.game.on('unitSelected', (data) => {
            console.log('🎮 Main app received unitSelected event:', data);
        });
        
        // Setup game controls
        this.setupGameControls();
        
        // Add manual HUD test button (temporary debugging)
        setTimeout(() => {
            const testBtn = document.createElement('button');
            testBtn.textContent = 'Test HUD Update';
            testBtn.style.position = 'fixed';
            testBtn.style.top = '10px';
            testBtn.style.right = '10px';
            testBtn.style.zIndex = '9999';
            testBtn.onclick = () => {
                console.log('🔧 Manual HUD test triggered');
                if (this.hud) {
                    this.hud.testHudUpdate();
                }
            };
            document.body.appendChild(testBtn);
        }, 1000);
    }
    
    setupGameControls() {
        // End turn button
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.endTurn();
                }
            });
        }
        
        // Save game button
        const saveBtn = document.getElementById('save-game');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveGame();
            });
        }
        
        // Load game button
        const loadBtn = document.getElementById('load-game');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.loadGame();
            });
        }
        
        // New game button
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.returnToMenu();
            });
        }
    }
    
    showGame() {
        // Hide menu
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer) {
            menuContainer.style.display = 'none';
        }
        
        // Show game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }
        
        // Show game canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.display = 'block';
        }
    }
    
    returnToMenu() {
        console.log('Returning to main menu');
        
        // Hide game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        // Show menu
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer) {
            menuContainer.style.display = 'block';
        }
        
        // Clean up game instance
        this.game = null;
        this.gameBoard = null;
        this.hud = null;
        this.isGameStarted = false;
    }
    
    saveGame() {
        if (!this.game) return;
        
        try {
            const gameState = this.game.saveGame();
            localStorage.setItem('empireDeluxeSave', JSON.stringify(gameState));
            console.log('Game saved successfully');
            alert('Game saved!');
        } catch (error) {
            console.error('Failed to save game:', error);
            alert('Failed to save game: ' + error.message);
        }
    }
    
    loadGame() {
        try {
            const savedGame = localStorage.getItem('empireDeluxeSave');
            if (!savedGame) {
                alert('No saved game found');
                return;
            }
            
            const gameState = JSON.parse(savedGame);
            
            // Create new game and load state
            this.game = new Game();
            this.game.loadGame(gameState);
            
            // Setup UI
            this.setupGameUI();
            this.showGame();
            
            this.isGameStarted = true;
            console.log('Game loaded successfully');
            alert('Game loaded!');
            
        } catch (error) {
            console.error('Failed to load game:', error);
            alert('Failed to load game: ' + error.message);
        }
    }
    
    handleResize() {
        if (this.gameBoard) {
            this.gameBoard.handleResize();
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting Sovereign Tactics...');
    
    try {
        const app = new EmpireDeluxeApp();
        app.init();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            app.handleResize();
        });
        
        // Make app available globally for debugging
        window.empireApp = app;
        
        console.log('Sovereign Tactics initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize Sovereign Tactics:', error);
    }
});