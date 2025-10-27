// Map class for Sovereign Tactics
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { GameHelpers } from '../utils/Helpers.js';
import { City } from './City.js';

export class GameMap {
    constructor(width = GAME_CONSTANTS.MAP_WIDTH, height = GAME_CONSTANTS.MAP_HEIGHT) {
        this.width = width;
        this.height = height;
        this.terrain = [];
        this.cities = [];
        this.visibility = {}; // Stores fog of war data per player
        
        this.generateTerrain();
        this.placeCities();
    }
    
    // Generate the terrain map
    generateTerrain() {
        this.terrain = GameHelpers.generateRandomMap(this.width, this.height);
    }
    
    // Place cities on the map
    placeCities() {
        this.cities = [];
        const cityPositions = [];
        
        // Find all city positions from terrain
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.terrain[y][x] === GAME_CONSTANTS.TERRAIN.CITY) {
                    cityPositions.push({x, y});
                }
            }
        }
        
        // Create city objects
        cityPositions.forEach(pos => {
            const city = new City(pos.x, pos.y);
            this.cities.push(city);
        });
    }
    
    // Get terrain type at position
    getTerrain(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            console.log(`🗺️ Invalid position requested: (${x}, ${y}) - map size: ${this.width}x${this.height}`);
            return GAME_CONSTANTS.TERRAIN.LAND; // Return land for out-of-bounds
        }
        const terrain = this.terrain[y][x];
        return terrain;
    }
    
    // Set terrain type at position
    setTerrain(x, y, terrainType) {
        if (GameHelpers.isValidPosition(x, y)) {
            this.terrain[y][x] = terrainType;
        }
    }
    
    // Convert all ocean tiles to land (fix for existing maps)
    convertOceanToLand() {
        let oceanTilesConverted = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.terrain[y][x] === GAME_CONSTANTS.TERRAIN.OCEAN) {
                    this.terrain[y][x] = GAME_CONSTANTS.TERRAIN.LAND;
                    oceanTilesConverted++;
                }
            }
        }
        console.log(`🌊➡️🌍 Converted ${oceanTilesConverted} ocean tiles to land`);
        return oceanTilesConverted;
    }
    
    // Get city at position
    getCityAt(x, y) {
        return this.cities.find(city => city.x === x && city.y === y);
    }
    
    // Add city at position
    addCity(x, y, owner = null) {
        // Remove existing city if any
        this.removeCityAt(x, y);
        
        // Update terrain
        this.setTerrain(x, y, GAME_CONSTANTS.TERRAIN.CITY);
        
        // Create and add city
        const city = new City(x, y, owner);
        this.cities.push(city);
        
        return city;
    }
    
    // Remove city at position
    removeCityAt(x, y) {
        const cityIndex = this.cities.findIndex(city => city.x === x && city.y === y);
        if (cityIndex !== -1) {
            this.cities.splice(cityIndex, 1);
            this.setTerrain(x, y, GAME_CONSTANTS.TERRAIN.LAND);
        }
    }
    
    // Initialize fog of war for a player
    initializeFogOfWar(playerId) {
        this.visibility[playerId] = [];
        for (let y = 0; y < this.height; y++) {
            this.visibility[playerId][y] = [];
            for (let x = 0; x < this.width; x++) {
                this.visibility[playerId][y][x] = false;
            }
        }
    }
    
    // Update visibility around units for a player
    updateVisibility(playerId, units) {
        if (!this.visibility[playerId]) {
            this.initializeFogOfWar(playerId);
        }
        
        // Clear previous visibility (optional - for moving fog of war)
        // Comment out these lines if you want persistent exploration
        /*
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.visibility[playerId][y][x] = false;
            }
        }
        */
        
        // Update visibility around each unit
        units.forEach(unit => {
            if (unit.owner === playerId) {
                this.revealAroundPosition(playerId, unit.x, unit.y, GAME_CONSTANTS.VISIBILITY_RANGE);
            }
        });
        
        // Update visibility around cities owned by player
        this.cities.forEach(city => {
            if (city.owner === playerId) {
                this.revealAroundPosition(playerId, city.x, city.y, GAME_CONSTANTS.VISIBILITY_RANGE);
            }
        });
    }
    
    // Reveal tiles around a position
    revealAroundPosition(playerId, centerX, centerY, range) {
        for (let y = centerY - range; y <= centerY + range; y++) {
            for (let x = centerX - range; x <= centerX + range; x++) {
                if (GameHelpers.isValidPosition(x, y)) {
                    const distance = GameHelpers.getDistance(centerX, centerY, x, y);
                    if (distance <= range) {
                        this.visibility[playerId][y][x] = true;
                    }
                }
            }
        }
    }
    
    // Check if position is visible to player
    isVisibleTo(playerId, x, y) {
        if (!this.visibility[playerId]) {
            return false;
        }
        return this.visibility[playerId][y] && this.visibility[playerId][y][x];
    }
    
    // Get all cities owned by a player
    getCitiesOwnedBy(playerId) {
        return this.cities.filter(city => city.owner === playerId);
    }
    
    // Get all neutral (unowned) cities
    getNeutralCities() {
        return this.cities.filter(city => city.owner === null);
    }
    
    // Check if position is adjacent to ocean (for naval unit production)
    isCoastal(x, y) {
        const directions = [
            {dx: 0, dy: -1}, {dx: 1, dy: -1}, {dx: 1, dy: 0},
            {dx: 1, dy: 1}, {dx: 0, dy: 1}, {dx: -1, dy: 1},
            {dx: -1, dy: 0}, {dx: -1, dy: -1}
        ];
        
        return directions.some(dir => {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            return GameHelpers.isValidPosition(newX, newY) && 
                   this.getTerrain(newX, newY) === GAME_CONSTANTS.TERRAIN.OCEAN;
        });
    }
    
    // Get adjacent positions
    getAdjacentPositions(x, y) {
        const directions = [
            {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
        ];
        
        return directions
            .map(dir => ({x: x + dir.x, y: y + dir.y}))
            .filter(pos => GameHelpers.isValidPosition(pos.x, pos.y));
    }
    
    // Export map data
    export() {
        return {
            width: this.width,
            height: this.height,
            terrain: this.terrain,
            cities: this.cities.map(city => city.getInfo())
        };
    }
    
    // Import map data
    import(mapData) {
        this.width = mapData.width;
        this.height = mapData.height;
        this.terrain = mapData.terrain;
        
        // Recreate cities
        this.cities = mapData.cities.map(cityData => {
            const city = new City(cityData.x, cityData.y, cityData.owner);
            city.name = cityData.name;
            city.population = cityData.population;
            city.isCapital = cityData.isCapital;
            return city;
        });
    }
}