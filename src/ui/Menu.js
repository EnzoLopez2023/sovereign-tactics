// Menu system for Sovereign Tactics
export class Menu {
    constructor(game) {
        this.game = game;
        this.currentMenu = null;
        this.setupMainMenu();
    }
    
    // Setup main menu
    setupMainMenu() {
        this.createMainMenu();
        this.showMenu('main');
    }
    
    // Create main menu
    createMainMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'main-menu';
        menuContainer.className = 'menu-container';
        menuContainer.innerHTML = `
            <div class="menu-panel">
                <h1>Sovereign Tactics</h1>
                <div class="menu-buttons">
                    <button id="new-game-btn" class="menu-button">New Game</button>
                    <button id="load-game-btn" class="menu-button">Load Game</button>
                    <button id="settings-btn" class="menu-button">Settings</button>
                    <button id="help-btn" class="menu-button">Help</button>
                </div>
                <div class="menu-info">
                    <p>A turn-based strategy game of tactical dominance and empire building</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(menuContainer);
        
        // Setup event listeners
        document.getElementById('new-game-btn').addEventListener('click', () => this.showNewGameMenu());
        document.getElementById('load-game-btn').addEventListener('click', () => this.loadGame());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsMenu());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelpMenu());
    }
    
    // Show new game setup menu
    showNewGameMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'new-game-menu';
        menuContainer.className = 'menu-container';
        menuContainer.innerHTML = `
            <div class="menu-panel">
                <h2>New Game Setup</h2>
                <div class="setup-section">
                    <h3>Players</h3>
                    <div id="player-setup">
                        <div class="player-row">
                            <label>Player 1:</label>
                            <input type="text" id="player1-name" value="Player 1" />
                            <select id="player1-type">
                                <option value="human">Human</option>
                                <option value="ai">AI</option>
                            </select>
                            <select id="player1-difficulty" style="display:none;">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div class="player-row">
                            <label>Player 2:</label>
                            <input type="text" id="player2-name" value="AI Player" />
                            <select id="player2-type">
                                <option value="human">Human</option>
                                <option value="ai" selected>AI</option>
                            </select>
                            <select id="player2-difficulty">
                                <option value="easy">Easy</option>
                                <option value="medium" selected>Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>
                    <button id="add-player-btn" class="small-button">Add Player</button>
                </div>
                
                <div class="setup-section">
                    <h3>Game Settings</h3>
                    <label>
                        <input type="checkbox" id="fog-of-war" checked /> 
                        Enable Fog of War
                    </label>
                    <label>
                        Map Size:
                        <select id="map-size">
                            <option value="small">Small (40x30)</option>
                            <option value="medium" selected>Medium (50x40)</option>
                            <option value="large">Large (70x50)</option>
                        </select>
                    </label>
                    <label>
                        Game Mode:
                        <select id="game-mode">
                            <option value="basic">Basic</option>
                            <option value="standard" selected>Standard</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </label>
                </div>
                
                <div class="menu-buttons">
                    <button id="start-game-btn" class="menu-button">Start Game</button>
                    <button id="back-btn" class="menu-button secondary">Back</button>
                </div>
            </div>
        `;
        
        this.hideCurrentMenu();
        document.body.appendChild(menuContainer);
        this.currentMenu = 'new-game';
        
        // Setup event listeners
        this.setupNewGameMenuEvents();
    }
    
    // Setup new game menu events
    setupNewGameMenuEvents() {
        // Player type changes
        document.getElementById('player1-type').addEventListener('change', (e) => {
            this.toggleAIDifficulty('player1', e.target.value === 'ai');
        });
        
        document.getElementById('player2-type').addEventListener('change', (e) => {
            this.toggleAIDifficulty('player2', e.target.value === 'ai');
        });
        
        // Initially show/hide AI difficulty for player 2
        this.toggleAIDifficulty('player2', true);
        
        // Start game
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            this.hideCurrentMenu();
            this.showMenu('main');
        });
    }
    
    // Toggle AI difficulty dropdown
    toggleAIDifficulty(playerPrefix, show) {
        const difficultySelect = document.getElementById(`${playerPrefix}-difficulty`);
        if (difficultySelect) {
            difficultySelect.style.display = show ? 'inline-block' : 'none';
        }
    }
    
    // Start new game with configured settings
    startNewGame() {
        const gameSettings = this.getGameSettings();
        
        // Hide menu
        this.hideCurrentMenu();
        
        // Initialize game
        this.game.initializeGame(gameSettings);
        
        // Show game UI
        this.showGameUI();
    }
    
    // Get game settings from form
    getGameSettings() {
        const players = [];
        
        // Get player configurations
        const player1Name = document.getElementById('player1-name').value || 'Player 1';
        const player1Type = document.getElementById('player1-type').value;
        const player1Difficulty = document.getElementById('player1-difficulty').value;
        
        players.push({
            name: player1Name,
            isHuman: player1Type === 'human',
            aiDifficulty: player1Difficulty
        });
        
        const player2Name = document.getElementById('player2-name').value || 'Player 2';
        const player2Type = document.getElementById('player2-type').value;
        const player2Difficulty = document.getElementById('player2-difficulty').value;
        
        players.push({
            name: player2Name,
            isHuman: player2Type === 'human',
            aiDifficulty: player2Difficulty
        });
        
        // Get game settings
        const fogOfWar = document.getElementById('fog-of-war').checked;
        const mapSize = document.getElementById('map-size').value;
        const gameMode = document.getElementById('game-mode').value;
        
        let mapWidth, mapHeight;
        switch (mapSize) {
            case 'small':
                mapWidth = 40;
                mapHeight = 30;
                break;
            case 'large':
                mapWidth = 70;
                mapHeight = 50;
                break;
            default: // medium
                mapWidth = 50;
                mapHeight = 40;
        }
        
        return {
            players: players,
            enableFogOfWar: fogOfWar,
            mapWidth: mapWidth,
            mapHeight: mapHeight,
            gameMode: gameMode
        };
    }
    
    // Show settings menu
    showSettingsMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'settings-menu';
        menuContainer.className = 'menu-container';
        menuContainer.innerHTML = `
            <div class="menu-panel">
                <h2>Settings</h2>
                <div class="settings-section">
                    <h3>Display</h3>
                    <label>
                        <input type="checkbox" id="setting-grid" checked /> 
                        Show Grid
                    </label>
                    <label>
                        <input type="checkbox" id="setting-coordinates" /> 
                        Show Coordinates
                    </label>
                    <label>
                        Animation Speed:
                        <select id="setting-animation-speed">
                            <option value="slow">Slow</option>
                            <option value="normal" selected>Normal</option>
                            <option value="fast">Fast</option>
                        </select>
                    </label>
                </div>
                
                <div class="settings-section">
                    <h3>Audio</h3>
                    <label>
                        <input type="checkbox" id="setting-sound" checked /> 
                        Enable Sound Effects
                    </label>
                </div>
                
                <div class="settings-section">
                    <h3>AI</h3>
                    <label>
                        AI Speed:
                        <select id="setting-ai-speed">
                            <option value="slow">Slow</option>
                            <option value="normal" selected>Normal</option>
                            <option value="fast">Fast</option>
                            <option value="instant">Instant</option>
                        </select>
                    </label>
                </div>
                
                <div class="menu-buttons">
                    <button id="save-settings-btn" class="menu-button">Save Settings</button>
                    <button id="back-settings-btn" class="menu-button secondary">Back</button>
                </div>
            </div>
        `;
        
        this.hideCurrentMenu();
        document.body.appendChild(menuContainer);
        this.currentMenu = 'settings';
        
        // Setup event listeners
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveSettings();
        });
        
        document.getElementById('back-settings-btn').addEventListener('click', () => {
            this.hideCurrentMenu();
            this.showMenu('main');
        });
    }
    
    // Show help menu
    showHelpMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'help-menu';
        menuContainer.className = 'menu-container';
        menuContainer.innerHTML = `
            <div class="menu-panel help-panel">
                <h2>How to Play</h2>
                <div class="help-content">
                    <div class="help-section">
                        <h3>Objective</h3>
                        <p>Capture all cities on the map to win the game. Eliminate all enemy units and cities to achieve victory.</p>
                    </div>
                    
                    <div class="help-section">
                        <h3>Units</h3>
                        <ul>
                            <li><strong>Army:</strong> Ground units that can capture cities. Move 1 tile per turn.</li>
                            <li><strong>Fighter:</strong> Air units with long range and speed. Can attack from 2 tiles away.</li>
                            <li><strong>Destroyer:</strong> Fast naval unit good for reconnaissance and attack.</li>
                            <li><strong>Cruiser:</strong> Balanced naval unit with good attack and defense.</li>
                            <li><strong>Battleship:</strong> Powerful but slow naval unit with heavy armor.</li>
                            <li><strong>Carrier:</strong> Naval unit that can launch fighters.</li>
                            <li><strong>Submarine:</strong> Stealthy naval unit effective against ships.</li>
                            <li><strong>Transport:</strong> Carries ground units across water.</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>Cities</h3>
                        <p>Cities produce new units every few turns. Capture neutral cities to expand your empire. Protect your cities from enemy attacks.</p>
                    </div>
                    
                    <div class="help-section">
                        <h3>Controls</h3>
                        <ul>
                            <li><strong>Left Click:</strong> Select unit or city, move unit, attack enemy</li>
                            <li><strong>Right Click + Drag:</strong> Pan camera around map</li>
                            <li><strong>Mouse Wheel:</strong> Zoom in and out</li>
                            <li><strong>Space:</strong> End current turn</li>
                            <li><strong>Escape:</strong> Deselect current selection</li>
                            <li><strong>G:</strong> Toggle grid display</li>
                            <li><strong>C:</strong> Toggle coordinate display</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>Tips</h3>
                        <ul>
                            <li>Expand quickly by capturing neutral cities early in the game</li>
                            <li>Protect your cities with nearby units</li>
                            <li>Use fighters for reconnaissance due to their long range</li>
                            <li>Build a balanced army with different unit types</li>
                            <li>Use the fog of war to your advantage by staying hidden</li>
                        </ul>
                    </div>
                </div>
                
                <div class="menu-buttons">
                    <button id="back-help-btn" class="menu-button">Back</button>
                </div>
            </div>
        `;
        
        this.hideCurrentMenu();
        document.body.appendChild(menuContainer);
        this.currentMenu = 'help';
        
        // Setup event listeners
        document.getElementById('back-help-btn').addEventListener('click', () => {
            this.hideCurrentMenu();
            this.showMenu('main');
        });
    }
    
    // Save settings
    saveSettings() {
        const settings = {
            showGrid: document.getElementById('setting-grid').checked,
            showCoordinates: document.getElementById('setting-coordinates').checked,
            enableSound: document.getElementById('setting-sound').checked,
            animationSpeed: document.getElementById('setting-animation-speed').value,
            aiSpeed: document.getElementById('setting-ai-speed').value
        };
        
        // Apply settings to game if it exists
        if (this.game) {
            Object.assign(this.game.settings, settings);
        }
        
        // Save to localStorage
        localStorage.setItem('empire-settings', JSON.stringify(settings));
        
        // Go back to main menu
        this.hideCurrentMenu();
        this.showMenu('main');
    }
    
    // Load game from file
    loadGame() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const gameData = JSON.parse(e.target.result);
                    
                    // Hide menu
                    this.hideCurrentMenu();
                    
                    // Load game
                    this.game.import(gameData);
                    
                    // Show game UI
                    this.showGameUI();
                    
                    console.log('Game loaded successfully');
                } catch (error) {
                    console.error('Failed to load game:', error);
                    alert('Failed to load game file');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // Show specific menu
    showMenu(menuName) {
        this.currentMenu = menuName;
        const menuElement = document.getElementById(`${menuName}-menu`);
        if (menuElement) {
            menuElement.style.display = 'flex';
        }
    }
    
    // Hide current menu
    hideCurrentMenu() {
        if (this.currentMenu) {
            const menuElement = document.getElementById(`${this.currentMenu}-menu`);
            if (menuElement && menuElement.parentNode) {
                menuElement.parentNode.removeChild(menuElement);
            }
        }
        this.currentMenu = null;
    }
    
    // Show game UI
    showGameUI() {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.style.display = 'flex';
        }
    }
    
    // Hide game UI
    hideGameUI() {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.style.display = 'none';
        }
    }
    
    // Show pause menu during game
    showPauseMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'pause-menu';
        menuContainer.className = 'menu-container menu-overlay';
        menuContainer.innerHTML = `
            <div class="menu-panel">
                <h2>Game Paused</h2>
                <div class="menu-buttons">
                    <button id="resume-btn" class="menu-button">Resume</button>
                    <button id="save-btn" class="menu-button">Save Game</button>
                    <button id="settings-pause-btn" class="menu-button">Settings</button>
                    <button id="main-menu-btn" class="menu-button secondary">Main Menu</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(menuContainer);
        this.currentMenu = 'pause';
        
        // Setup event listeners
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.hideCurrentMenu();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCurrentGame();
        });
        
        document.getElementById('settings-pause-btn').addEventListener('click', () => {
            this.hideCurrentMenu();
            this.showSettingsMenu();
        });
        
        document.getElementById('main-menu-btn').addEventListener('click', () => {
            if (confirm('Return to main menu? Current progress will be lost.')) {
                this.hideCurrentMenu();
                this.hideGameUI();
                this.showMenu('main');
            }
        });
    }
    
    // Save current game
    saveCurrentGame() {
        try {
            const gameData = this.game.export();
            const dataStr = JSON.stringify(gameData, null, 2);
            
            // Create download link
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `empire-save-${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Game saved successfully');
            this.hideCurrentMenu(); // Close pause menu after saving
        } catch (error) {
            console.error('Failed to save game:', error);
            alert('Failed to save game');
        }
    }
}