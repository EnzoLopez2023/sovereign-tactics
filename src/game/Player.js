// Player class for Sovereign Tactics
import { GAME_CONSTANTS } from '../utils/Constants.js';

export class Player {
    constructor(id, name, isHuman = true) {
        this.id = id;
        this.name = name;
        this.isHuman = isHuman;
        this.color = GAME_CONSTANTS.PLAYER_COLORS[id % GAME_CONSTANTS.PLAYER_COLORS.length];
        
        // Game state
        this.isActive = true;
        this.isEliminated = false;
        this.capitalCityId = null;
        
        // Statistics
        this.stats = {
            unitsCreated: 0,
            unitsLost: 0,
            enemiesDestroyed: 0,
            citiesCaptured: 0,
            turnsPlayed: 0,
            battlesWon: 0,
            battlesLost: 0
        };
        
        // Turn-specific statistics (reset each turn)
        this.turnStats = {
            unitsCreatedThisTurn: 0
        };
        
        // AI properties (if not human)
        this.aiDifficulty = 'medium'; // easy, medium, hard
        this.aiStrategy = 'balanced'; // aggressive, defensive, balanced, economic
    }
    
    // Set player as eliminated
    eliminate() {
        this.isEliminated = true;
        this.isActive = false;
    }
    
    // Check if player is still in the game
    isAlive() {
        return this.isActive && !this.isEliminated;
    }
    
    // Update player statistics
    incrementStat(statName, amount = 1) {
        if (this.stats.hasOwnProperty(statName)) {
            this.stats[statName] += amount;
        }
    }
    
    // Update turn-specific statistics
    incrementTurnStat(statName, amount = 1) {
        if (this.turnStats.hasOwnProperty(statName)) {
            this.turnStats[statName] += amount;
        }
    }
    
    // Reset turn-specific statistics at the start of each turn
    resetTurnStats() {
        this.turnStats.unitsCreatedThisTurn = 0;
    }
    
    // Get player info for UI
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            isHuman: this.isHuman,
            isActive: this.isActive,
            isEliminated: this.isEliminated,
            stats: { ...this.stats }
        };
    }
    
    // Set AI difficulty
    setAIDifficulty(difficulty) {
        if (['easy', 'medium', 'hard'].includes(difficulty)) {
            this.aiDifficulty = difficulty;
        }
    }
    
    // Set AI strategy
    setAIStrategy(strategy) {
        if (['aggressive', 'defensive', 'balanced', 'economic'].includes(strategy)) {
            this.aiStrategy = strategy;
        }
    }
    
    // Get AI behavior parameters
    getAIBehavior() {
        const behaviors = {
            easy: {
                reactionTime: 1000,
                mistakeChance: 0.3,
                planningDepth: 1
            },
            medium: {
                reactionTime: 500,
                mistakeChance: 0.15,
                planningDepth: 2
            },
            hard: {
                reactionTime: 200,
                mistakeChance: 0.05,
                planningDepth: 3
            }
        };
        
        return behaviors[this.aiDifficulty] || behaviors.medium;
    }
}