// Basic AI for Sovereign Tactics
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { GameHelpers } from '../utils/Helpers.js';

export class GameAI {
    constructor(player, game) {
        this.player = player;
        this.game = game;
        this.behavior = player.getAIBehavior();
    }
    
    // Execute AI turn
    async executeTurn() {
        console.log(`AI ${this.player.name} starting turn...`);
        
        // Add some delay to make AI moves visible, adjusted for speed setting
        const speedMultiplier = this.getSpeedMultiplier();
        await this.delay(this.behavior.reactionTime * speedMultiplier);
        
        // Get player's units and cities
        const units = this.game.getUnitsOwnedBy(this.player.id);
        const cities = this.game.map.getCitiesOwnedBy(this.player.id);
        
        // Execute AI strategies based on player's AI strategy
        switch (this.player.aiStrategy) {
            case 'aggressive':
                await this.executeAggressiveStrategy(units, cities);
                break;
            case 'defensive':
                await this.executeDefensiveStrategy(units, cities);
                break;
            case 'economic':
                await this.executeEconomicStrategy(units, cities);
                break;
            default:
                await this.executeBalancedStrategy(units, cities);
        }
    }
    
    // Balanced strategy - mix of expansion, defense, and attack
    async executeBalancedStrategy(units, cities) {
        // 1. Handle city production
        await this.manageCityProduction(cities);
        
        // 2. Move and attack with units
        await this.moveAndAttackUnits(units, 'balanced');
        
        // 3. Explore with some units
        await this.exploreWithUnits(units.slice(0, Math.ceil(units.length * 0.3)));
    }
    
    // Aggressive strategy - focus on attacking enemies
    async executeAggressiveStrategy(units, cities) {
        // Prioritize military unit production
        await this.manageCityProduction(cities, true);
        
        // Move aggressively toward enemies
        await this.moveAndAttackUnits(units, 'aggressive');
    }
    
    // Defensive strategy - focus on protecting cities and units
    async executeDefensiveStrategy(units, cities) {
        // Focus on defensive positioning
        await this.manageCityProduction(cities, false);
        await this.positionUnitsDefensively(units, cities);
    }
    
    // Economic strategy - focus on capturing cities and expanding
    async executeEconomicStrategy(units, cities) {
        // Focus on expansion
        await this.manageCityProduction(cities, false);
        await this.expandToNeutralCities(units);
    }
    
    // Manage production in cities
    async manageCityProduction(cities, militaryFocus = false) {
        for (const city of cities) {
            if (!city.currentProduction) {
                const unitType = this.chooseUnitToProduce(city, militaryFocus);
                if (unitType) {
                    city.startProduction(unitType);
                    console.log(`AI ${this.player.name}: City ${city.name} starts producing ${unitType}`);
                }
            }
            await this.delay(50);
        }
    }
    
    // Choose what unit to produce based on strategy
    chooseUnitToProduce(city, militaryFocus = false) {
        const availableUnits = city.getAvailableUnits();
        
        if (militaryFocus) {
            // Prefer stronger military units
            const militaryPreference = [
                GAME_CONSTANTS.UNIT_TYPES.BATTLESHIP,
                GAME_CONSTANTS.UNIT_TYPES.CRUISER,
                GAME_CONSTANTS.UNIT_TYPES.DESTROYER,
                GAME_CONSTANTS.UNIT_TYPES.TANK,
                GAME_CONSTANTS.UNIT_TYPES.FIGHTER,
                GAME_CONSTANTS.UNIT_TYPES.ARMY
            ];
            
            for (const unitType of militaryPreference) {
                if (availableUnits.includes(unitType)) {
                    return unitType;
                }
            }
        } else {
            // Balanced production
            const balancedPreference = [
                GAME_CONSTANTS.UNIT_TYPES.ARMY,
                GAME_CONSTANTS.UNIT_TYPES.TANK,
                GAME_CONSTANTS.UNIT_TYPES.DESTROYER,
                GAME_CONSTANTS.UNIT_TYPES.FIGHTER,
                GAME_CONSTANTS.UNIT_TYPES.CRUISER
            ];
            
            for (const unitType of balancedPreference) {
                if (availableUnits.includes(unitType)) {
                    return unitType;
                }
            }
        }
        
        // Fallback to first available unit
        return availableUnits[0] || null;
    }
    
    // Move and attack with units
    async moveAndAttackUnits(units, strategy = 'balanced') {
        const speedMultiplier = this.getSpeedMultiplier();
        
        // For instant/fast speeds, process units in parallel for better performance
        if (speedMultiplier <= 0.3) {
            const promises = units
                .filter(unit => unit.movesRemaining > 0 || !unit.hasAttacked)
                .map(unit => this.processUnitAction(unit, strategy));
            await Promise.all(promises);
        } else {
            // Sequential processing with delays for slower speeds
            for (const unit of units) {
                if (unit.movesRemaining > 0 || !unit.hasAttacked) {
                    await this.processUnitAction(unit, strategy);
                    await this.delay(100);
                }
            }
        }
    }
    
    // Process individual unit action
    async processUnitAction(unit, strategy) {
        // Look for enemy units to attack
        const enemyTargets = this.findEnemyTargets(unit);
        
        if (enemyTargets.length > 0 && !unit.hasAttacked) {
            const target = enemyTargets[0];
            if (unit.canAttack(target.x, target.y)) {
                console.log(`AI ${this.player.name}: ${unit.type} attacks enemy ${target.type}`);
                this.game.attackUnit(unit, target);
                return;
            }
        }
        
        // Move toward objectives
        if (unit.movesRemaining > 0) {
            const moveTarget = this.findMoveTarget(unit, strategy);
            if (moveTarget) {
                console.log(`AI ${this.player.name}: ${unit.type} moves toward target`);
                this.game.moveUnit(unit, moveTarget.x, moveTarget.y);
            }
        }
    }
    
    // Find enemy units in range
    findEnemyTargets(unit) {
        const enemies = [];
        const range = unit.type === GAME_CONSTANTS.UNIT_TYPES.FIGHTER ? 2 : 1;
        
        for (let y = unit.y - range; y <= unit.y + range; y++) {
            for (let x = unit.x - range; x <= unit.x + range; x++) {
                if (GameHelpers.isValidPosition(x, y)) {
                    const enemyUnit = this.game.getUnitAt(x, y);
                    if (enemyUnit && enemyUnit.owner !== this.player.id) {
                        enemies.push(enemyUnit);
                    }
                }
            }
        }
        
        return enemies;
    }
    
    // Find movement target based on strategy
    findMoveTarget(unit, strategy) {
        let targets = [];
        
        // Look for neutral cities
        const neutralCities = this.game.map.getNeutralCities();
        targets = targets.concat(neutralCities.map(city => ({x: city.x, y: city.y, type: 'city', priority: 3})));
        
        // Look for enemy cities
        const enemyCities = this.game.map.cities.filter(city => 
            city.owner !== null && city.owner !== this.player.id);
        targets = targets.concat(enemyCities.map(city => ({x: city.x, y: city.y, type: 'enemy_city', priority: 2})));
        
        // Look for enemy units
        const enemyUnits = this.game.units.filter(u => u.owner !== this.player.id);
        targets = targets.concat(enemyUnits.map(u => ({x: u.x, y: u.y, type: 'enemy_unit', priority: 1})));
        
        if (targets.length === 0) {
            return null;
        }
        
        // Sort by distance and priority
        targets.sort((a, b) => {
            const distA = GameHelpers.getDistance(unit.x, unit.y, a.x, a.y);
            const distB = GameHelpers.getDistance(unit.x, unit.y, b.x, b.y);
            
            // Higher priority first, then closer distance
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return distA - distB;
        });
        
        const target = targets[0];
        
        // Move toward target (simple pathfinding - move one step closer)
        return this.getNextStepToward(unit, target);
    }
    
    // Get next step toward target
    getNextStepToward(unit, target) {
        const directions = [
            {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
        ];
        
        let bestMove = null;
        let bestDistance = Infinity;
        
        for (const dir of directions) {
            const newX = unit.x + dir.x;
            const newY = unit.y + dir.y;
            
            if (unit.canMoveTo(newX, newY, this.game.map)) {
                const distance = GameHelpers.getDistance(newX, newY, target.x, target.y);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMove = {x: newX, y: newY};
                }
            }
        }
        
        return bestMove;
    }
    
    // Position units defensively around cities
    async positionUnitsDefensively(units, cities) {
        for (const city of cities) {
            const nearbyUnits = units.filter(unit => 
                GameHelpers.getDistance(unit.x, unit.y, city.x, city.y) <= 3);
            
            for (const unit of nearbyUnits.slice(0, 2)) { // Limit to 2 units per city
                if (unit.movesRemaining > 0) {
                    const defensivePosition = this.findDefensivePosition(unit, city);
                    if (defensivePosition) {
                        this.game.moveUnit(unit, defensivePosition.x, defensivePosition.y);
                    }
                }
                await this.delay(50);
            }
        }
    }
    
    // Find defensive position around city
    findDefensivePosition(unit, city) {
        const positions = this.game.map.getAdjacentPositions(city.x, city.y);
        
        for (const pos of positions) {
            if (unit.canMoveTo(pos.x, pos.y, this.game.map) && 
                !this.game.getUnitAt(pos.x, pos.y)) {
                return pos;
            }
        }
        
        return null;
    }
    
    // Expand to neutral cities
    async expandToNeutralCities(units) {
        const neutralCities = this.game.map.getNeutralCities();
        
        if (neutralCities.length === 0) {
            return;
        }
        
        const speedMultiplier = this.getSpeedMultiplier();
        const activeUnits = units.filter(unit => unit.movesRemaining > 0);
        
        if (speedMultiplier <= 0.3) {
            // Fast processing: handle all units simultaneously
            activeUnits.forEach(unit => {
                const closestCity = this.findClosestCity(unit, neutralCities);
                if (closestCity) {
                    const moveTarget = this.getNextStepToward(unit, closestCity);
                    if (moveTarget) {
                        this.game.moveUnit(unit, moveTarget.x, moveTarget.y);
                    }
                }
            });
        } else {
            // Sequential processing with delays
            for (const unit of activeUnits) {
                const closestCity = this.findClosestCity(unit, neutralCities);
                if (closestCity) {
                    const moveTarget = this.getNextStepToward(unit, closestCity);
                    if (moveTarget) {
                        this.game.moveUnit(unit, moveTarget.x, moveTarget.y);
                    }
                }
                await this.delay(50);
            }
        }
    }
    
    // Explore with units
    async exploreWithUnits(units) {
        const speedMultiplier = this.getSpeedMultiplier();
        const activeUnits = units.filter(unit => unit.movesRemaining > 0);
        
        if (speedMultiplier <= 0.3) {
            // Fast processing: handle all units simultaneously
            activeUnits.forEach(unit => {
                const exploreTarget = this.findExplorationTarget(unit);
                if (exploreTarget) {
                    this.game.moveUnit(unit, exploreTarget.x, exploreTarget.y);
                }
            });
        } else {
            // Sequential processing with delays
            for (const unit of activeUnits) {
                const exploreTarget = this.findExplorationTarget(unit);
                if (exploreTarget) {
                    this.game.moveUnit(unit, exploreTarget.x, exploreTarget.y);
                }
                await this.delay(50);
            }
        }
    }
    
    // Find exploration target
    findExplorationTarget(unit) {
        const directions = [
            {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
        ];
        
        // Shuffle directions for random exploration
        const shuffledDirections = directions.sort(() => Math.random() - 0.5);
        
        for (const dir of shuffledDirections) {
            const newX = unit.x + dir.x;
            const newY = unit.y + dir.y;
            
            if (unit.canMoveTo(newX, newY, this.game.map)) {
                return {x: newX, y: newY};
            }
        }
        
        return null;
    }
    
    // Find closest city to unit
    findClosestCity(unit, cities) {
        if (cities.length === 0) return null;
        
        let closest = cities[0];
        let closestDistance = GameHelpers.getDistance(unit.x, unit.y, closest.x, closest.y);
        
        for (const city of cities.slice(1)) {
            const distance = GameHelpers.getDistance(unit.x, unit.y, city.x, city.y);
            if (distance < closestDistance) {
                closest = city;
                closestDistance = distance;
            }
        }
        
        return closest;
    }
    
    // Get speed multiplier based on game settings
    getSpeedMultiplier() {
        const aiSpeed = this.game.settings.aiSpeed || 'normal';
        switch (aiSpeed) {
            case 'slow': return 1.5;
            case 'fast': return 0.3;
            case 'instant': return 0.05;
            default: return 1.0; // normal
        }
    }

    // Add delay for AI actions
    delay(ms) {
        const adjustedMs = Math.max(10, ms * this.getSpeedMultiplier());
        return new Promise(resolve => setTimeout(resolve, adjustedMs));
    }
}