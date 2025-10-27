// Game constants for Sovereign Tactics
export const GAME_CONSTANTS = {
    // Map settings
    MAP_WIDTH: 50,
    MAP_HEIGHT: 40,
    TILE_SIZE: 16,
    
    // Unit types
    UNIT_TYPES: {
        ARMY: 'army',
        TANK: 'tank',
        FIGHTER: 'fighter',
        DESTROYER: 'destroyer',
        SUBMARINE: 'submarine',
        CRUISER: 'cruiser',
        BATTLESHIP: 'battleship',
        CARRIER: 'carrier'
    },
    
    // Terrain types
    TERRAIN: {
        OCEAN: 'ocean',
        LAND: 'land',
        CITY: 'city',
        MOUNTAINS: 'mountains'
    },
    
    // Unit production costs (in turns)
    PRODUCTION_COSTS: {
        army: 6,          // Takes 6 turns to produce 1 army unit
        tank: 12,         // Takes 12 turns to produce 1 tank unit (2x army cost)
        fighter: 8,
        destroyer: 12,
        submarine: 10,
        cruiser: 16,
        battleship: 20,
        carrier: 24
    },
    
    // Unit movement ranges
    MOVEMENT_RANGES: {
        army: 1,        // 1 tile per turn, but can set multi-turn paths
        tank: 2,        // 2 tiles per turn
        fighter: 8,
        destroyer: 4,
        submarine: 3,
        cruiser: 4,
        battleship: 2,
        carrier: 2
    },
    
    // Combat strengths
    COMBAT_STRENGTH: {
        army: { attack: 10, defense: 10 },
        tank: { attack: 20, defense: 20 },    // 2x army strength
        fighter: { attack: 12, defense: 8 },
        destroyer: { attack: 15, defense: 12 },
        submarine: { attack: 14, defense: 8 },
        cruiser: { attack: 18, defense: 16 },
        battleship: { attack: 25, defense: 20 },
        carrier: { attack: 8, defense: 14 }
    },
    
    // Game settings
    MAX_PLAYERS: 8,
    VISIBILITY_RANGE: 2,
    
    // Colors for different players
    PLAYER_COLORS: [
        '#800080', // Purple - Player 1
        '#FFFF00', // Yellow - Player 2  
        '#FF0000', // Red - Player 3
        '#00FF00', // Green - Player 4
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#FFA500', // Orange
        '#0000FF'  // Blue (reserved for water later)
    ]
};