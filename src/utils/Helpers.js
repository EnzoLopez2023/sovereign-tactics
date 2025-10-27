// Utility functions for Sovereign Tactics
import { GAME_CONSTANTS } from './Constants.js';

export class GameHelpers {
    // Calculate distance between two points
    static getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    // Check if coordinates are within map bounds
    static isValidPosition(x, y) {
        return x >= 0 && x < GAME_CONSTANTS.MAP_WIDTH && 
               y >= 0 && y < GAME_CONSTANTS.MAP_HEIGHT;
    }
    
    // Get random integer between min and max (inclusive)
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Check if unit can move to specific terrain
    static canUnitMoveTo(unitType, terrainType) {
        const landUnits = [GAME_CONSTANTS.UNIT_TYPES.ARMY, GAME_CONSTANTS.UNIT_TYPES.TANK];
        const seaUnits = [
            GAME_CONSTANTS.UNIT_TYPES.DESTROYER,
            GAME_CONSTANTS.UNIT_TYPES.SUBMARINE,
            GAME_CONSTANTS.UNIT_TYPES.CRUISER,
            GAME_CONSTANTS.UNIT_TYPES.BATTLESHIP,
            GAME_CONSTANTS.UNIT_TYPES.CARRIER
        ];
        const airUnits = [GAME_CONSTANTS.UNIT_TYPES.FIGHTER];
        
        if (landUnits.includes(unitType)) {
            return terrainType === GAME_CONSTANTS.TERRAIN.LAND || 
                   terrainType === GAME_CONSTANTS.TERRAIN.CITY;
        }
        
        if (seaUnits.includes(unitType)) {
            return terrainType === GAME_CONSTANTS.TERRAIN.OCEAN;
        }
        
        if (airUnits.includes(unitType)) {
            return true; // Fighters can move over any terrain
        }
        
        return false;
    }
    
    // Generate a simple procedural map
    static generateRandomMap(width, height) {
        const map = [];
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                // Simple terrain generation - more sophisticated algorithms can be added later
                const rand = Math.random();
                if (rand < 0.9) {
                    map[y][x] = GAME_CONSTANTS.TERRAIN.LAND;  // 90% land (green tiles)
                } else {
                    map[y][x] = GAME_CONSTANTS.TERRAIN.MOUNTAINS;  // 10% mountains (darker gray-green)
                }
            }
        }
        
        // Add some cities randomly on land
        const cityCount = Math.floor((width * height) / 100);
        for (let i = 0; i < cityCount; i++) {
            let x, y;
            do {
                x = this.getRandomInt(0, width - 1);
                y = this.getRandomInt(0, height - 1);
            } while (map[y][x] !== GAME_CONSTANTS.TERRAIN.LAND);
            
            map[y][x] = GAME_CONSTANTS.TERRAIN.CITY;
        }
        
        return map;
    }
    
    // Calculate combat result
    static resolveCombat(attacker, defender) {
        const attackStrength = GAME_CONSTANTS.COMBAT_STRENGTH[attacker.type].attack;
        const defenseStrength = GAME_CONSTANTS.COMBAT_STRENGTH[defender.type].defense;
        
        // Roll dice for combat
        const attackRoll = Math.random() * attackStrength;
        const defenseRoll = Math.random() * defenseStrength;
        
        const attackerWins = attackRoll > defenseRoll;
        
        // Log detailed battle information
        console.log(`⚔️ UNIT BATTLE: ${attacker.type.toUpperCase()} vs ${defender.type.toUpperCase()}`);
        console.log(`  🎲 ${attacker.type.toUpperCase()} (Attack ${attackStrength}): rolled ${attackRoll.toFixed(2)}`);
        console.log(`  🛡️ ${defender.type.toUpperCase()} (Defense ${defenseStrength}): rolled ${defenseRoll.toFixed(2)}`);
        console.log(`  ${attackerWins ? '✅ ATTACKER WINS' : '❌ DEFENDER WINS'} - ${attackerWins ? 'Defender destroyed!' : 'Attacker destroyed!'}`);
        console.log(`  📊 Battle odds: ${((attackStrength / (attackStrength + defenseStrength)) * 100).toFixed(1)}% chance for attacker`);
        
        return attackerWins ? 'attacker_wins' : 'defender_wins';
    }
}

// Event system for game notifications
export class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}