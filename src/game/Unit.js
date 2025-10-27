// Unit class for Sovereign Tactics
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { GameHelpers } from '../utils/Helpers.js';

export class Unit {
    constructor(type, x, y, owner) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.id = Unit.generateId();
        
        // Movement and combat properties
        this.maxMoves = GAME_CONSTANTS.MOVEMENT_RANGES[type];
        this.movesRemaining = this.maxMoves;
        this.health = 100;
        
        // Unit state
        this.isSelected = false;
        this.hasAttacked = false;
        
        // Production state (for units being produced in cities)
        this.isBeingProduced = false;
        this.productionTurnsRemaining = 0;
        
        // Movement path system
        this.movementPath = []; // Array of {x, y} coordinates to move through
        this.isMovingAlongPath = false;
        this.needsPlayerAttention = false; // For blinking when blocked or destination reached
    }
    
    // Generate unique ID for units
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    // Check if unit can move to a specific position (used by pathfinding)
    canMoveTo(x, y, gameMap) {
        // Check bounds using actual map size
        if (x < 0 || x >= gameMap.width || y < 0 || y >= gameMap.height) {
            return false;
        }
        
        // For pathfinding, we only check terrain compatibility
        // Don't check moves remaining or distance - those are for immediate movement
        const terrainType = gameMap.getTerrain(x, y);
        return GameHelpers.canUnitMoveTo(this.type, terrainType);
    }
    
    // Check if unit can immediately move to adjacent position (for direct movement)
    canImmediatelyMoveTo(x, y, gameMap) {
        // Check bounds using actual map size
        if (x < 0 || x >= gameMap.width || y < 0 || y >= gameMap.height) {
            return false;
        }
        
        // Check if unit has moves remaining
        if (this.movesRemaining <= 0) {
            return false;
        }
        
        // Check distance (can move up to remaining moves in one action)
        const distance = GameHelpers.getDistance(this.x, this.y, x, y);
        if (distance > this.movesRemaining) {
            return false;
        }
        
        // Check terrain compatibility
        const terrainType = gameMap.getTerrain(x, y);
        return GameHelpers.canUnitMoveTo(this.type, terrainType);
    }
    
    // Move unit to new position
    moveTo(x, y, gameMap) {
        if (this.canMoveTo(x, y, gameMap)) {
            const distance = GameHelpers.getDistance(this.x, this.y, x, y);
            if (distance <= this.movesRemaining) {
                this.x = x;
                this.y = y;
                this.movesRemaining -= distance; // Consume moves based on distance
                return true;
            }
        }
        return false;
    }
    
    // Check if unit can attack target at position
    canAttack(targetX, targetY) {
        // Check if unit has already attacked this turn
        if (this.hasAttacked) {
            return false;
        }
        
        // Check if target is in range (most units can only attack adjacent tiles)
        const distance = GameHelpers.getDistance(this.x, this.y, targetX, targetY);
        
        // Fighters have longer range
        const attackRange = this.type === GAME_CONSTANTS.UNIT_TYPES.FIGHTER ? 2 : 1;
        
        return distance <= attackRange;
    }
    
    // Attack target unit
    attack(target) {
        if (!this.canAttack(target.x, target.y)) {
            return false;
        }
        
        const result = GameHelpers.resolveCombat(this, target);
        this.hasAttacked = true;
        
        return result;
    }
    
    // Reset unit for new turn
    startNewTurn() {
        // Update maxMoves from constants (in case they changed for existing units)
        this.maxMoves = GAME_CONSTANTS.MOVEMENT_RANGES[this.type];
        this.movesRemaining = this.maxMoves;
        this.hasAttacked = false;
    }
    
    // Get unit info for UI display
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            owner: this.owner,
            movesRemaining: this.movesRemaining,
            health: this.health,
            hasAttacked: this.hasAttacked
        };
    }
    
    // Get combat strength
    getAttackStrength() {
        return GAME_CONSTANTS.COMBAT_STRENGTH[this.type].attack;
    }
    
    getDefenseStrength() {
        return GAME_CONSTANTS.COMBAT_STRENGTH[this.type].defense;
    }
    
    // Check if unit is on water
    isNavalUnit() {
        return [
            GAME_CONSTANTS.UNIT_TYPES.DESTROYER,
            GAME_CONSTANTS.UNIT_TYPES.SUBMARINE,
            GAME_CONSTANTS.UNIT_TYPES.CRUISER,
            GAME_CONSTANTS.UNIT_TYPES.BATTLESHIP,
            GAME_CONSTANTS.UNIT_TYPES.CARRIER,
            GAME_CONSTANTS.UNIT_TYPES.TRANSPORT
        ].includes(this.type);
    }
    
    // Check if unit is aircraft
    isAirUnit() {
        return this.type === GAME_CONSTANTS.UNIT_TYPES.FIGHTER;
    }

    // Set movement path to destination using A* pathfinding
    setMovementPath(targetX, targetY, gameMap) {
        const path = this.findPath(this.x, this.y, targetX, targetY, gameMap);
        if (path && path.length > 1) {
            // Remove current position from path (first element)
            this.movementPath = path.slice(1);
            this.isMovingAlongPath = true;
            this.needsPlayerAttention = false;
            return true;
        }
        return false;
    }

    // A* pathfinding algorithm
    findPath(startX, startY, targetX, targetY, gameMap) {
        // Check if target is valid terrain
        const targetTerrain = gameMap.getTerrain(targetX, targetY);
        
        if (!GameHelpers.canUnitMoveTo(this.type, targetTerrain)) {
            return null;
        }
        
        // Simple A* implementation for grid-based movement
        const openSet = [];
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();

        const start = `${startX},${startY}`;
        const target = `${targetX},${targetY}`;

        openSet.push({x: startX, y: startY, key: start});
        gScore.set(start, 0);
        fScore.set(start, this.heuristic(startX, startY, targetX, targetY));

        let iterations = 0;
        while (openSet.length > 0 && iterations < 1000) { // Prevent infinite loops
            iterations++;
            
            // Get node with lowest fScore
            let current = openSet.reduce((lowest, node) => 
                fScore.get(node.key) < fScore.get(lowest.key) ? node : lowest
            );

            if (current.key === target) {
                // Reconstruct path
                const path = [];
                let currentKey = target;
                while (currentKey) {
                    const [x, y] = currentKey.split(',').map(Number);
                    path.unshift({x, y});
                    currentKey = cameFrom.get(currentKey);
                }
                return path;
            }

            // Remove current from openSet
            const currentIndex = openSet.findIndex(node => node.key === current.key);
            openSet.splice(currentIndex, 1);
            closedSet.add(current.key);

            // Check neighbors
            const neighbors = [
                {x: current.x - 1, y: current.y},
                {x: current.x + 1, y: current.y},
                {x: current.x, y: current.y - 1},
                {x: current.x, y: current.y + 1}
            ];

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) continue;
                
                const canMove = this.canMoveTo(neighbor.x, neighbor.y, gameMap);
                if (!canMove) {
                    const terrain = gameMap.getTerrain(neighbor.x, neighbor.y);
                    continue;
                }

                const tentativeGScore = gScore.get(current.key) + 1;

                if (!openSet.find(node => node.key === neighborKey)) {
                    openSet.push({x: neighbor.x, y: neighbor.y, key: neighborKey});
                } else if (tentativeGScore >= gScore.get(neighborKey)) {
                    continue;
                }

                cameFrom.set(neighborKey, current.key);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor.x, neighbor.y, targetX, targetY));
            }
        }

        return null; // No path found
    }

    // Manhattan distance heuristic
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // Move one step along current path
    moveAlongPath(gameMap, game) {
        if (!this.isMovingAlongPath || this.movementPath.length === 0) {
            this.isMovingAlongPath = false;
            return 0; // Return number of moves taken
        }

        let movesTaken = 0;
        const maxMovesThisTurn = this.movesRemaining;
        
        // Move up to the unit's remaining moves
        while (movesTaken < maxMovesThisTurn && this.movementPath.length > 0) {
            const nextStep = this.movementPath[0];
            
            // Check if next step is still valid
            if (this.canMoveTo(nextStep.x, nextStep.y, gameMap)) {
                // Move to next step
                this.x = nextStep.x;
                this.y = nextStep.y;
                this.movementPath.shift(); // Remove completed step
                movesTaken++;
                
                console.log(`${this.type} moved to (${this.x}, ${this.y}) - step ${movesTaken}/${maxMovesThisTurn}`);
                
                // Check if path is complete
                if (this.movementPath.length === 0) {
                    this.isMovingAlongPath = false;
                    this.needsPlayerAttention = true; // Destination reached, needs new orders
                    break;
                }
            } else {
                // Path blocked, stop and request player attention
                this.isMovingAlongPath = false;
                this.movementPath = [];
                this.needsPlayerAttention = true;
                break;
            }
        }
        
        return movesTaken;
    }

    // Clear current movement path
    clearMovementPath() {
        this.movementPath = [];
        this.isMovingAlongPath = false;
        this.needsPlayerAttention = false;
    }

    // Check if unit has a valid movement path
    hasMovementPath() {
        return this.movementPath.length > 0;
    }

    // Check if a path exists to target without setting it
    canPathTo(targetX, targetY, gameMap) {
        const path = this.findPath(this.x, this.y, targetX, targetY, gameMap);
        const hasPath = path && path.length > 1;
        return hasPath; // Path exists and has at least one step
    }

    // Check if unit is ground unit
    isGroundUnit() {
        return this.type === GAME_CONSTANTS.UNIT_TYPES.ARMY || 
               this.type === GAME_CONSTANTS.UNIT_TYPES.TANK;
    }
}