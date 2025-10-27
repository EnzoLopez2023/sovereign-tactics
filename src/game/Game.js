// Main Game class for Sovereign Tactics
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { GameHelpers, EventEmitter } from '../utils/Helpers.js';
import { GameMap } from './Map.js';
import { Unit } from './Unit.js';
import { City } from './City.js';
import { Player } from './Player.js';
import { GameAI } from './AI.js';

export class Game extends EventEmitter {
    constructor() {
        super();
        
        // Game state
        this.gameState = 'menu'; // menu, setup, playing, paused, ended
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.gameMode = 'standard'; // basic, standard, advanced
        
        // Game objects
        this.map = null;
        this.players = [];
        this.units = [];
        this.selectedUnit = null;
        this.selectedCity = null;
        
        // UI state
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.showGrid = true;
        this.showCoordinates = false;
        
        // Game settings
        this.settings = {
            enableFogOfWar: false,  // Disabled for this demo - full map visible
            enableSound: true,
            animationSpeed: 'normal',
            aiSpeed: 'normal'
        };
        
        // AI controllers
        this.aiControllers = new Map();
    }

    // Get speed-adjusted delay based on AI speed setting
    getSpeedAdjustedDelay(baseDelayMs) {
        const aiSpeed = this.settings.aiSpeed || 'normal';
        let multiplier;
        switch (aiSpeed) {
            case 'slow': multiplier = 1.5; break;
            case 'fast': multiplier = 0.3; break;
            case 'instant': multiplier = 0.05; break;
            default: multiplier = 1.0; // normal
        }
        return Math.max(10, baseDelayMs * multiplier);
    }
    
    // Initialize a new game
    initializeGame(gameSettings = {}) {
        console.log('Initializing new game...');
        
        // Apply settings
        Object.assign(this.settings, gameSettings);
        
        // Create map with specified dimensions
        this.map = new GameMap(gameSettings.mapWidth, gameSettings.mapHeight);
        
        // Initialize players
        this.initializePlayers(gameSettings.players || []);
        
        // Place initial units and assign cities
        this.setupInitialGameState();
        
        // Update visibility for all players
        this.updateAllVisibility();
        
        // Set game state
        this.gameState = 'playing';
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        
        console.log(`Game initialized with ${this.players.length} players`);
        this.emit('gameStarted', { players: this.players, turnNumber: this.turnNumber });
        
        // Start first player's turn
        this.startPlayerTurn();
    }
    
    // Initialize players
    initializePlayers(playerConfigs) {
        this.players = [];
        this.aiControllers.clear();
        
        // Ensure at least 2 players
        if (playerConfigs.length < 2) {
            playerConfigs = [
                { name: 'Player 1', isHuman: true },
                { name: 'AI Player', isHuman: false }
            ];
        }
        
        playerConfigs.forEach((config, index) => {
            const player = new Player(index, config.name, config.isHuman);
            if (config.aiDifficulty) {
                player.setAIDifficulty(config.aiDifficulty);
            }
            if (config.aiStrategy) {
                player.setAIStrategy(config.aiStrategy);
            }
            
            this.players.push(player);
            
            // Create AI controller for AI players
            if (!player.isHuman) {
                this.aiControllers.set(player.id, new GameAI(player, this));
            }
            
            // Initialize fog of war for player
            this.map.initializeFogOfWar(player.id);
        });
    }
    
    // Setup initial game state
    setupInitialGameState() {
        // Simple setup: Each player gets ONE starting city
        const neutralCities = this.map.getNeutralCities();
        
        // For now, limit to 2 players max for this demo
        const maxPlayers = Math.min(this.players.length, 2);
        
        this.players.slice(0, maxPlayers).forEach((player, index) => {
            // Give each player one city from opposite corners of the map
            let startingCity;
            if (index === 0) {
                // Player 1 gets a city from the top-left area
                startingCity = neutralCities.find(city => 
                    city.x < this.map.width / 2 && city.y < this.map.height / 2
                ) || neutralCities[0];
            } else {
                // Player 2 gets a city from the bottom-right area  
                startingCity = neutralCities.find(city => 
                    city.x >= this.map.width / 2 && city.y >= this.map.height / 2
                ) || neutralCities[neutralCities.length - 1];
            }
            
            if (startingCity) {
                // Capture the city
                startingCity.capture(player.id);
                startingCity.isCapital = true;
                player.capitalCityId = startingCity.id;
                
                // Start producing army units (takes 6 turns)
                startingCity.startProduction('army');
                
                // Give each player 1 starting army unit adjacent to their city
                console.log(`Looking for spawn position near city ${startingCity.name} at (${startingCity.x}, ${startingCity.y}) for Player ${index + 1}`);
                const spawnPosition = this.findEmptyAdjacentPosition(startingCity.x, startingCity.y);
                if (spawnPosition) {
                    const startingUnit = new Unit(GAME_CONSTANTS.UNIT_TYPES.ARMY, spawnPosition.x, spawnPosition.y, player.id);
                    // Ensure unit has full movement points for testing
                    startingUnit.movesRemaining = startingUnit.maxMoves;
                    this.units.push(startingUnit);
                    console.log(`✅ Player ${index + 1} (${player.name}) starts with army unit at (${spawnPosition.x}, ${spawnPosition.y}) with ${startingUnit.movesRemaining} moves`);
                } else {
                    console.log(`❌ Could not find spawn position for starting unit near city ${startingCity.name} at (${startingCity.x}, ${startingCity.y})`);
                    // Try to spawn at the city position itself if no adjacent position is available
                    const startingUnit = new Unit(GAME_CONSTANTS.UNIT_TYPES.ARMY, startingCity.x, startingCity.y, player.id);
                    startingUnit.movesRemaining = startingUnit.maxMoves;
                    this.units.push(startingUnit);
                    console.log(`🔧 Player ${index + 1} (${player.name}) starts with army unit at city location (${startingCity.x}, ${startingCity.y})`);
                }
                
                console.log(`Player ${index + 1} (${GAME_CONSTANTS.PLAYER_COLORS[player.id]}) starts with city ${startingCity.name} at (${startingCity.x}, ${startingCity.y})`);
            }
        });
        
        // Remove cities assigned to players from neutral list, leaving others as white neutral cities
        console.log(`Game setup complete. ${neutralCities.filter(c => c.owner === null).length} neutral cities remain on the map.`);
    }
    
    // Check if player has any possible actions this turn
    playerHasActions(playerId) {
        const player = this.getPlayerById(playerId);
        const playerUnits = this.getUnitsOwnedBy(playerId);
        
        // Check for units that need player attention AND have moves remaining
        for (const unit of playerUnits) {
            if (unit.needsPlayerAttention && unit.movesRemaining > 0) {
                return true; // Unit needs new orders and can act
            }
        }

        // Check for units actively moving along paths (these are automated actions)
        const unitsMoving = playerUnits.filter(unit => 
            unit.isMovingAlongPath && unit.movesRemaining > 0 && unit.hasMovementPath()
        );
        if (unitsMoving.length > 0) {
            return false; // Units are automatically moving, no player action required
        }

        // Check for units that can move or attack (but aren't following a path)
        for (const unit of playerUnits) {
            if (unit.movesRemaining > 0 && !unit.isMovingAlongPath) {
                // Check if unit can move to any adjacent tile
                const adjacentPositions = this.map.getAdjacentPositions(unit.x, unit.y);
                for (const pos of adjacentPositions) {
                    if (unit.canMoveTo(pos.x, pos.y, this.map)) {
                        return true; // Can move
                    }
                    // Check for enemy units to attack
                    const targetUnit = this.getUnitAt(pos.x, pos.y);
                    if (targetUnit && targetUnit.owner !== playerId) {
                        return true; // Can attack
                    }
                    // Check for neutral cities to capture
                    const city = this.map.getCityAt(pos.x, pos.y);
                    if (city && city.owner !== playerId) {
                        return true; // Can capture city
                    }
                }
            }
        }
        
        // Check for cities with production options (this should be rare since production auto-starts)
        const playerCities = this.map.getCitiesOwnedBy(playerId);
        for (const city of playerCities) {
            if (!city.currentProduction && city.getAvailableUnits().length > 0) {
                return true; // Can start production
            }
        }
        
        return false; // No actions available
    }

    // Start current player's turn
    startPlayerTurn() {
        const currentPlayer = this.getCurrentPlayer();
        console.log(`Starting turn ${this.turnNumber} for ${currentPlayer.name}`);
        
        // Reset turn statistics for the current player
        currentPlayer.resetTurnStats();
        
        // Reset units for new turn
        const playerUnits = this.getUnitsOwnedBy(currentPlayer.id);
        console.log(`🔄 Resetting ${playerUnits.length} units for ${currentPlayer.name}`);
        playerUnits.forEach(unit => {
            const oldMoves = unit.movesRemaining;
            unit.startNewTurn();
            console.log(`  Unit ${unit.type} at (${unit.x}, ${unit.y}): ${oldMoves} → ${unit.movesRemaining} moves`);
        });
        
        // Process city production
        this.processCityProduction(currentPlayer.id);
        
        // Process automatic unit movements along paths
        this.processUnitPathMovements(currentPlayer.id);
        
        // Update visibility
        this.updateVisibility(currentPlayer.id);
        
        // Update player stats
        currentPlayer.incrementStat('turnsPlayed');
        
        // Check if player has any actions available
        const hasActions = this.playerHasActions(currentPlayer.id);
        
        this.emit('playerTurnStarted', { 
            player: currentPlayer, 
            turnNumber: this.turnNumber,
            hasActions: hasActions
        });
        
        // If player has no actions available, auto-advance turn after a brief delay
        if (!hasActions) {
            console.log(`${currentPlayer.name} has no actions available - auto-advancing turn`);
            const delay = currentPlayer.isHuman ? 
                this.getSpeedAdjustedDelay(1500) : 
                this.getSpeedAdjustedDelay(300);
            setTimeout(() => {
                this.endPlayerTurn();
            }, delay);
            return;
        }
        
        // If AI player, execute AI turn
        if (!currentPlayer.isHuman && this.aiControllers.has(currentPlayer.id)) {
            setTimeout(() => {
                this.executeAITurn(currentPlayer.id);
            }, this.getSpeedAdjustedDelay(200)); // Reduced from 500ms
        }
    }
    
    // Execute AI turn
    async executeAITurn(playerId) {
        const aiController = this.aiControllers.get(playerId);
        if (aiController) {
            try {
                await aiController.executeTurn();
                // End AI turn automatically
                setTimeout(() => {
                    this.endPlayerTurn();
                }, this.getSpeedAdjustedDelay(400)); // Reduced from 1000ms
            } catch (error) {
                console.error('AI turn error:', error);
                this.endPlayerTurn();
            }
        }
    }
    
    // End current player's turn (public method for manual turn ending)
    endTurn() {
        this.endPlayerTurn();
    }

    // End current player's turn (internal method)
    endPlayerTurn() {
        const currentPlayer = this.getCurrentPlayer();
        console.log(`Ending turn for ${currentPlayer.name}`);
        
        this.emit('playerTurnEnded', { player: currentPlayer });
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // If back to first player, increment turn number
        if (this.currentPlayerIndex === 0) {
            this.turnNumber++;
        }
        
        // Check for game end conditions
        if (this.checkGameEndConditions()) {
            this.endGame();
        } else {
            this.startPlayerTurn();
        }
    }
    
    // Process city production for a player
    processCityProduction(playerId) {
        const playerCities = this.map.getCitiesOwnedBy(playerId);
        
        playerCities.forEach(city => {
            const newUnit = city.processProduction();
            if (newUnit) {
                // Find empty adjacent position for the new unit
                const spawnPosition = this.findEmptyAdjacentPosition(city.x, city.y);
                if (spawnPosition) {
                    newUnit.x = spawnPosition.x;
                    newUnit.y = spawnPosition.y;
                    // Newly produced units can't move on the turn they're created
                    newUnit.movesRemaining = 0;
                    this.units.push(newUnit);
                    
                    const player = this.getPlayerById(playerId);
                    player.incrementStat('unitsCreated'); // Keep cumulative total
                    player.incrementTurnStat('unitsCreatedThisTurn'); // Track this turn only
                    
                    console.log(`${player.name}: New ${newUnit.type} produced at ${city.name} with ${newUnit.movesRemaining} moves remaining`);
                    this.emit('unitProduced', { unit: newUnit, city: city });
                }
            }
            
            // Auto-start production if city isn't producing anything
            if (!city.currentProduction) {
                const availableUnits = city.getAvailableUnits();
                if (availableUnits.length > 0) {
                    // Default to army units for this demo
                    city.startProduction(GAME_CONSTANTS.UNIT_TYPES.ARMY);
                    console.log(`${city.name}: Auto-started army production`);
                }
            }
        });
    }

    // Process automatic unit movements along their paths
    processUnitPathMovements(playerId) {
        const playerUnits = this.getUnitsOwnedBy(playerId);
        
        playerUnits.forEach(unit => {
            if (unit.isMovingAlongPath && unit.movesRemaining > 0) {
                const movesTaken = unit.moveAlongPath(this.map, this);
                if (movesTaken > 0) {
                    unit.movesRemaining -= movesTaken;
                    console.log(`${unit.type} moved ${movesTaken} steps to (${unit.x}, ${unit.y}) following path, ${unit.movesRemaining} moves remaining`);
                    this.emit('unitMoved', { 
                        unit: unit, 
                        fromX: unit.x, 
                        fromY: unit.y, 
                        toX: unit.x, 
                        toY: unit.y 
                    });
                } else if (unit.needsPlayerAttention) {
                    console.log(`${unit.type} at (${unit.x}, ${unit.y}) needs player attention`);
                }
            }
        });
    }
    
    // Find empty position adjacent to coordinates
    findEmptyAdjacentPosition(x, y) {
        const adjacentPositions = this.map.getAdjacentPositions(x, y);
        
        console.log(`Checking ${adjacentPositions.length} adjacent positions to (${x}, ${y})`);
        for (const pos of adjacentPositions) {
            const existingUnit = this.getUnitAt(pos.x, pos.y);
            const terrain = this.map.getTerrain(pos.x, pos.y);
            
            console.log(`  Position (${pos.x}, ${pos.y}): terrain=${terrain}, hasUnit=${!!existingUnit}`);
            
            if (!existingUnit) {
                // Allow army units on LAND or CITY terrain (same as canMoveTo logic)
                if (terrain === GAME_CONSTANTS.TERRAIN.LAND || terrain === GAME_CONSTANTS.TERRAIN.CITY) {
                    console.log(`  ✅ Found valid spawn position at (${pos.x}, ${pos.y})`);
                    return pos;
                }
            }
        }
        
        return null; // No empty adjacent position found
    }
    
    // Move unit
    moveUnit(unit, x, y) {
        if (!unit.canMoveTo(x, y, this.map)) {
            return false;
        }
        
        const oldX = unit.x;
        const oldY = unit.y;
        
        // Check for city capture attempt
        const cityAtDestination = this.map.getCityAt(x, y);
        if (cityAtDestination && cityAtDestination.owner !== unit.owner) {
            console.log(`Attempting to capture city ${cityAtDestination.name} at (${x}, ${y})`);
            const captureSuccess = this.captureCity(unit, cityAtDestination);
            
            if (captureSuccess) {
                // Move unit into the captured city and end its turn
                unit.x = x;
                unit.y = y;
                unit.movesRemaining = 0; // End turn for this unit
                console.log(`${unit.type} successfully captured ${cityAtDestination.name} and moved to (${x},${y})`);
                this.emit('unitMoved', { unit: unit, fromX: oldX, fromY: oldY, toX: x, toY: y });
                this.emit('cityCaptured', { city: cityAtDestination, unit: unit });
                
                // Update visibility
                this.updateVisibility(unit.owner);
                return true;
            } else {
                // Unit was destroyed in failed capture attempt
                return false;
            }
        }
        
        // Normal movement
        if (unit.moveTo(x, y, this.map)) {
            console.log(`${unit.type} moved from (${oldX},${oldY}) to (${x},${y})`);
            this.emit('unitMoved', { unit: unit, fromX: oldX, fromY: oldY, toX: x, toY: y });
            
            // Update visibility
            this.updateVisibility(unit.owner);
            
            return true;
        }
        
        return false;
    }
    
    // Attack with unit
    attackUnit(attacker, target) {
        if (!attacker.canAttack(target.x, target.y)) {
            return false;
        }
        
        console.log(`${attacker.type} attacks ${target.type}`);
        
        const result = attacker.attack(target);
        
        this.emit('combatResolved', { 
            attacker: attacker, 
            target: target, 
            result: result 
        });
        
        if (result === 'attacker_wins') {
            // Remove target unit
            this.removeUnit(target);
            
            // Update stats
            const attackerPlayer = this.getPlayerById(attacker.owner);
            const targetPlayer = this.getPlayerById(target.owner);
            
            attackerPlayer.incrementStat('enemiesDestroyed');
            attackerPlayer.incrementStat('battlesWon');
            targetPlayer.incrementStat('unitsLost');
            targetPlayer.incrementStat('battlesLost');
            
            // Move attacker to target position
            attacker.x = target.x;
            attacker.y = target.y;
            
            // Check for city capture
            const cityAtPosition = this.map.getCityAt(target.x, target.y);
            if (cityAtPosition && cityAtPosition.owner === target.owner) {
                this.captureCity(attacker, cityAtPosition);
            }
        } else {
            // Attacker loses
            this.removeUnit(attacker);
            
            // Update stats
            const attackerPlayer = this.getPlayerById(attacker.owner);
            const targetPlayer = this.getPlayerById(target.owner);
            
            targetPlayer.incrementStat('enemiesDestroyed');
            targetPlayer.incrementStat('battlesWon');
            attackerPlayer.incrementStat('unitsLost');
            attackerPlayer.incrementStat('battlesLost');
            attackerPlayer.incrementStat('unitsLost');
        }
        
        return true;
    }
    
    // Capture city with combat system
    captureCity(unit, city) {
        const oldOwner = city.owner;
        const newOwner = unit.owner;
        const player = this.getPlayerById(newOwner);
        
        // Use combat system for city capture
        const unitAttackStrength = GAME_CONSTANTS.COMBAT_STRENGTH[unit.type].attack;
        const cityDefenseStrength = city.getCurrentDefense(); // Use current defense (degrades over time)
        
        // Roll dice for combat
        const unitRoll = Math.random() * unitAttackStrength;
        const cityRoll = Math.random() * cityDefenseStrength;
        
        const captureSuccess = unitRoll > cityRoll;
        
        // Log detailed battle information
        console.log(`⚔️ CITY BATTLE: ${unit.type.toUpperCase()} attacks ${city.name}`);
        console.log(`  🎲 ${unit.type.toUpperCase()} (Attack ${unitAttackStrength}): rolled ${unitRoll.toFixed(2)}`);
        console.log(`  🏛️ ${city.name} (Defense ${cityDefenseStrength}): rolled ${cityRoll.toFixed(2)}`);
        console.log(`  ${captureSuccess ? '✅ ATTACKER WINS' : '❌ DEFENDER WINS'} - ${captureSuccess ? 'City captured!' : 'Unit destroyed!'}`);
        console.log(`  📊 Battle odds: ${((unitAttackStrength / (unitAttackStrength + cityDefenseStrength)) * 100).toFixed(1)}% chance for attacker`);
        
        // Degrade city defense after each attack (regardless of outcome)
        city.degradeDefense();
        
        if (captureSuccess) {
            // Successful capture
            city.capture(newOwner);
            player.incrementStat('citiesCaptured');
            
            // Check if this is a human player who captured with a ground unit
            if (!player.isAI && unit.isGroundUnit()) {
                // Emit event for UI to show unit selection popup
                this.emit('cityCapture', { 
                    city: city, 
                    unit: unit, 
                    player: player, 
                    success: true, 
                    showUnitSelection: true 
                });
            } else {
                // AI or non-ground unit capture - default to army production
                city.startProduction('army');
                this.emit('cityCapture', { city: city, unit: unit, player: player, success: true });
            }
        } else {
            // Failed capture - unit dies
            this.emit('cityCapture', { city: city, unit: unit, player: player, success: false });
            this.removeUnit(unit);
            this.emit('unitDestroyed', { unit: unit, reason: 'failed_capture' });
        }
        
        return captureSuccess;
    }
    
    // Set production for captured city (called from UI)
    setCapturedCityProduction(city, unitType) {
        city.startProduction(unitType);
        console.log(`Production set to ${unitType} for captured city ${city.name}`);
    }
    
    // Fix ocean tiles in existing map
    fixOceanTiles() {
        return this.map.convertOceanToLand();
    }
    
    // Remove unit from game
    removeUnit(unit) {
        const index = this.units.findIndex(u => u.id === unit.id);
        if (index !== -1) {
            this.units.splice(index, 1);
            console.log(`${unit.type} destroyed at (${unit.x},${unit.y})`);
            this.emit('unitDestroyed', { unit: unit });
        }
    }
    
    // Get current player
    getCurrentPlayer() {
        if (!this.players || this.players.length === 0) {
            console.error('🚨 No players available');
            return null;
        }
        if (this.currentPlayerIndex < 0 || this.currentPlayerIndex >= this.players.length) {
            console.error(`🚨 Invalid currentPlayerIndex: ${this.currentPlayerIndex}, players.length: ${this.players.length}`);
            return null;
        }
        const player = this.players[this.currentPlayerIndex];
        if (!player) {
            console.error(`🚨 Player at index ${this.currentPlayerIndex} is null/undefined`);
            return null;
        }
        return player;
    }
    
    // Get player by ID
    getPlayerById(id) {
        return this.players.find(player => player.id === id);
    }
    
    // Get unit at position
    getUnitAt(x, y) {
        return this.units.find(unit => unit.x === x && unit.y === y);
    }
    
    // Get units owned by player
    getUnitsOwnedBy(playerId) {
        return this.units.filter(unit => unit.owner === playerId);
    }
    
    // Update visibility for a player
    updateVisibility(playerId) {
        const playerUnits = this.getUnitsOwnedBy(playerId);
        this.map.updateVisibility(playerId, playerUnits);
    }
    
    // Update visibility for all players
    updateAllVisibility() {
        this.players.forEach(player => {
            this.updateVisibility(player.id);
        });
    }
    
    // Check game end conditions
    checkGameEndConditions() {
        const alivePlayers = this.players.filter(player => player.isAlive());
        
        // Game ends if only one player remains
        if (alivePlayers.length <= 1) {
            return true;
        }
        
        // Check if any player has no cities or units
        for (const player of this.players) {
            if (player.isAlive()) {
                const playerCities = this.map.getCitiesOwnedBy(player.id);
                const playerUnits = this.getUnitsOwnedBy(player.id);
                
                if (playerCities.length === 0 && playerUnits.length === 0) {
                    player.eliminate();
                    console.log(`${player.name} has been eliminated`);
                    this.emit('playerEliminated', { player: player });
                }
            }
        }
        
        return false;
    }
    
    // End game
    endGame() {
        this.gameState = 'ended';
        const winner = this.players.find(player => player.isAlive());
        
        console.log(`Game ended. Winner: ${winner ? winner.name : 'No winner'}`);
        this.emit('gameEnded', { 
            winner: winner, 
            players: this.players, 
            turnNumber: this.turnNumber 
        });
    }
    
    // Select unit
    selectUnit(unit) {
        console.log(`🎯 selectUnit method called with:`, unit);
        console.log(`🎯 Game state: currentPlayer=${this.currentPlayer ? this.currentPlayer.id : 'undefined'}, players=${this.players.length}`);
        
        // Deselect previous unit
        if (this.selectedUnit) {
            this.selectedUnit.isSelected = false;
        }
        
        this.selectedUnit = unit;
        this.selectedCity = null;
        
        if (unit) {
            unit.isSelected = true;
            console.log(`🎯 Selected unit: ${unit.type} at (${unit.x}, ${unit.y}) with ${unit.movesRemaining}/${unit.maxMoves} moves, owner: ${unit.owner}, current player: ${this.currentPlayer ? this.currentPlayer.id : 'undefined'}`);
        } else {
            console.log(`🎯 Unit deselected (unit is null/undefined)`);
        }
        
        console.log(`🔥 EMITTING unitSelected event with unit at (${unit ? unit.x + ',' + unit.y : 'null'}):`, unit);
        this.emit('unitSelected', { unit: unit });
        console.log(`🔥 unitSelected event emitted successfully`);
    }
    
    // Select city
    selectCity(city) {
        this.selectedCity = city;
        this.selectedUnit = null;
        
        // Deselect all units
        if (this.selectedUnit) {
            this.selectedUnit.isSelected = false;
            this.selectedUnit = null;
        }
        
        this.emit('citySelected', { city: city });
    }
    
    // Get game state for saving
    export() {
        return {
            gameState: this.gameState,
            currentPlayerIndex: this.currentPlayerIndex,
            turnNumber: this.turnNumber,
            gameMode: this.gameMode,
            settings: this.settings,
            map: this.map.export(),
            players: this.players.map(player => player.getInfo()),
            units: this.units.map(unit => unit.getInfo()),
            camera: this.camera
        };
    }
    
    // Load game state
    import(gameData) {
        this.gameState = gameData.gameState;
        this.currentPlayerIndex = gameData.currentPlayerIndex;
        this.turnNumber = gameData.turnNumber;
        this.gameMode = gameData.gameMode;
        this.settings = gameData.settings;
        this.camera = gameData.camera;
        
        // Restore map
        this.map = new GameMap(gameData.map.width, gameData.map.height);
        this.map.import(gameData.map);
        
        // Restore players
        this.players = gameData.players.map(playerData => {
            const player = new Player(playerData.id, playerData.name, playerData.isHuman);
            player.isActive = playerData.isActive;
            player.isEliminated = playerData.isEliminated;
            player.stats = playerData.stats;
            return player;
        });
        
        // Restore units
        this.units = gameData.units.map(unitData => {
            const unit = new Unit(unitData.type, unitData.x, unitData.y, unitData.owner);
            unit.id = unitData.id;
            unit.movesRemaining = unitData.movesRemaining;
            unit.health = unitData.health;
            unit.hasAttacked = unitData.hasAttacked;
            return unit;
        });
        
        console.log('Game state loaded successfully');
    }
}