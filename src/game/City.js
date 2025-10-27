// City class for Sovereign Tactics
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { Unit } from './Unit.js';

export class City {
    constructor(x, y, owner = null) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.id = City.generateId();
        
        // Production properties
        this.currentProduction = null; // Unit type being produced
        this.productionTurnsRemaining = 0;
        this.productionQueue = [];
        
        // City properties
        this.name = this.generateName();
        this.population = 1;
        this.isCapital = false;
        
        // Defense
        this.defenseBonus = 2; // Cities provide defensive bonus
        this.baseDefense = 15; // Starting defense strength
        this.currentDefense = 15; // Current defense (decreases with attacks)
    }
    
    // Generate unique ID for cities
    static generateId() {
        return 'city_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Generate random city name
    generateName() {
        const cityNames = [
            'New Rome', 'Alexandria', 'Carthage', 'Athens', 'Sparta', 'Troy',
            'Babylon', 'Memphis', 'Thebes', 'Damascus', 'Jerusalem', 'Nineveh',
            'Persepolis', 'Samarkand', 'Baghdad', 'Constantinople', 'Venice',
            'Florence', 'Vienna', 'Prague', 'Warsaw', 'Moscow', 'Kiev',
            'Stockholm', 'Copenhagen', 'Amsterdam', 'Brussels', 'Paris',
            'London', 'Edinburgh', 'Dublin', 'Madrid', 'Lisbon', 'Barcelona'
        ];
        
        return cityNames[Math.floor(Math.random() * cityNames.length)];
    }
    
    // Start producing a unit
    startProduction(unitType) {
        if (!GAME_CONSTANTS.PRODUCTION_COSTS[unitType]) {
            return false;
        }
        
        // If already producing, add to queue
        if (this.currentProduction) {
            this.productionQueue.push(unitType);
            return true;
        }
        
        this.currentProduction = unitType;
        this.productionTurnsRemaining = GAME_CONSTANTS.PRODUCTION_COSTS[unitType];
        return true;
    }
    
    // Process production for one turn
    processProduction() {
        if (!this.currentProduction) {
            return null;
        }
        
        this.productionTurnsRemaining--;
        
        // Check if production is complete
        if (this.productionTurnsRemaining <= 0) {
            const completedUnit = this.completeProduction();
            
            // Start next item in queue if available
            if (this.productionQueue.length > 0) {
                const nextUnit = this.productionQueue.shift();
                this.startProduction(nextUnit);
            }
            
            return completedUnit;
        }
        
        return null;
    }
    
    // Complete current production
    completeProduction() {
        if (!this.currentProduction) {
            return null;
        }
        
        // Create the new unit
        const newUnit = new Unit(this.currentProduction, this.x, this.y, this.owner);
        
        // Clear current production
        const completedType = this.currentProduction;
        this.currentProduction = null;
        this.productionTurnsRemaining = 0;
        
        return newUnit;
    }
    
    // Change city ownership
    capture(newOwner) {
        this.owner = newOwner;
        // Clear production when captured
        this.currentProduction = null;
        this.productionTurnsRemaining = 0;
        this.productionQueue = [];
    }
    
    // Check what units can be produced
    getAvailableUnits() {
        // Ground units can be produced by any city
        let availableUnits = [GAME_CONSTANTS.UNIT_TYPES.ARMY, GAME_CONSTANTS.UNIT_TYPES.TANK];
        
        // Check if city is coastal (adjacent to ocean) for naval units
        // This would need map reference - for now assume all cities can produce naval units
        availableUnits.push(
            GAME_CONSTANTS.UNIT_TYPES.DESTROYER,
            GAME_CONSTANTS.UNIT_TYPES.SUBMARINE,
            GAME_CONSTANTS.UNIT_TYPES.CRUISER,
            GAME_CONSTANTS.UNIT_TYPES.BATTLESHIP,
            GAME_CONSTANTS.UNIT_TYPES.CARRIER
        );
        
        // All cities can produce fighters
        availableUnits.push(GAME_CONSTANTS.UNIT_TYPES.FIGHTER);
        
        return availableUnits;
    }
    
    // Get production info for UI
    getProductionInfo() {
        return {
            currentProduction: this.currentProduction,
            turnsRemaining: this.productionTurnsRemaining,
            queue: [...this.productionQueue],
            availableUnits: this.getAvailableUnits()
        };
    }
    
    // Get city info for UI display
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            owner: this.owner,
            population: this.population,
            isCapital: this.isCapital,
            production: this.getProductionInfo()
        };
    }
    
    // Cancel current production
    cancelProduction() {
        this.currentProduction = null;
        this.productionTurnsRemaining = 0;
        
        // Start next in queue if available
        if (this.productionQueue.length > 0) {
            const nextUnit = this.productionQueue.shift();
            this.startProduction(nextUnit);
        }
    }
    
    // Remove item from production queue
    removeFromQueue(index) {
        if (index >= 0 && index < this.productionQueue.length) {
            this.productionQueue.splice(index, 1);
        }
    }
    
    // Get defense value for combat
    getDefenseBonus() {
        return this.defenseBonus;
    }
    
    // Get current defense strength for city battles
    getCurrentDefense() {
        return Math.max(1, this.currentDefense); // Minimum defense of 1
    }
    
    // Reduce defense after being attacked
    degradeDefense() {
        if (this.currentDefense > 1) {
            this.currentDefense--;
            console.log(`🏛️ ${this.name} defense reduced to ${this.currentDefense} after attack`);
        }
    }
    
    // Restore some defense over time (optional future feature)
    repairDefenses(amount = 1) {
        this.currentDefense = Math.min(this.baseDefense, this.currentDefense + amount);
    }
}