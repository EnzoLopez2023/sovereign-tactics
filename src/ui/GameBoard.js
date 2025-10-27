// Simple GameBoard implementation for Sovereign Tactics
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { GameHelpers } from '../utils/Helpers.js';

export class GameBoard {
    constructor(canvasOrId, game) {
        // Accept either canvas element or canvas ID
        if (typeof canvasOrId === 'string') {
            this.canvas = document.getElementById(canvasOrId);
        } else {
            this.canvas = canvasOrId;
        }
        this.ctx = this.canvas.getContext('2d');
        this.game = game;
        
        // Display settings
        this.tileSize = GAME_CONSTANTS.TILE_SIZE;
        this.camera = { x: 0, y: 0, zoom: 1 };
        
        // Mouse interaction
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredTile = null;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupEventListeners();
        this.setupGameEventListeners();
        
        // Start render loop
        this.startRenderLoop();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Handle right-click for pathfinding
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    }
    
    setupGameEventListeners() {
        this.game.on('unitMoved', () => this.render());
        this.game.on('unitSelected', () => this.render());
        this.game.on('citySelected', () => this.render());
        this.game.on('combatResolved', () => this.render());
        this.game.on('unitDestroyed', () => this.render());
        this.game.on('cityCaptured', () => this.render());
        this.game.on('playerTurnStarted', () => this.render());
    }
    
    startRenderLoop() {
        const render = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }
    
    stopRenderLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    render() {
        this.clearCanvas();
        
        if (!this.game.map) {
            return;
        }
        
        // Calculate visible area
        const visibleArea = this.getVisibleArea();
        
        // Render layers
        this.renderTerrain(visibleArea);
        this.renderCities(visibleArea);
        this.renderMovementPaths(visibleArea);
        this.renderUnits(visibleArea);
        
        // Render selection and highlights
        this.renderSelection();
        this.renderHover();
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    getVisibleArea() {
        const tilesX = Math.ceil(this.canvas.width / (this.tileSize * this.camera.zoom)) + 2;
        const tilesY = Math.ceil(this.canvas.height / (this.tileSize * this.camera.zoom)) + 2;
        
        return {
            startX: Math.floor(-this.camera.x / (this.tileSize * this.camera.zoom)),
            startY: Math.floor(-this.camera.y / (this.tileSize * this.camera.zoom)),
            endX: Math.floor(-this.camera.x / (this.tileSize * this.camera.zoom)) + tilesX,
            endY: Math.floor(-this.camera.y / (this.tileSize * this.camera.zoom)) + tilesY
        };
    }
    
    renderTerrain(visibleArea) {
        for (let y = Math.max(0, visibleArea.startY); y < Math.min(this.game.map.height, visibleArea.endY); y++) {
            for (let x = Math.max(0, visibleArea.startX); x < Math.min(this.game.map.width, visibleArea.endX); x++) {
                this.renderTile(x, y);
            }
        }
    }
    
    renderTile(x, y) {
        const screenPos = this.worldToScreen(x, y);
        const tileSize = this.tileSize * this.camera.zoom;
        const terrain = this.game.map.getTerrain(x, y);
        
        // Check fog of war first
        const currentPlayer = this.game.getCurrentPlayer();
        const inFogOfWar = this.game.settings.enableFogOfWar && 
            currentPlayer && !this.game.map.isVisibleTo(currentPlayer.id, x, y);
        
        if (inFogOfWar) {
            this.ctx.fillStyle = '#111111';
            this.ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);
            return;
        }
        
        // Render detailed terrain
        switch (terrain) {
            case GAME_CONSTANTS.TERRAIN.OCEAN:
            case GAME_CONSTANTS.TERRAIN.LAND:
            case GAME_CONSTANTS.TERRAIN.CITY:
                this.renderLandTile(screenPos.x, screenPos.y, tileSize, x, y);
                break;
            case GAME_CONSTANTS.TERRAIN.MOUNTAINS:
                this.renderMountainTile(screenPos.x, screenPos.y, tileSize, x, y);
                break;
        }
    }
    
    renderLandTile(screenX, screenY, tileSize, worldX, worldY) {
        // Base green terrain - clean and vibrant like reference image
        this.ctx.fillStyle = '#4A8B3B';
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        
        // Add subtle texture variation for natural look
        const seed = worldX * 73 + worldY * 37;
        
        // Small darker green spots for texture variation
        this.ctx.fillStyle = '#3A7B2B';
        for (let i = 0; i < 4; i++) {
            const rand1 = ((seed + i * 13) % 100) / 100;
            const rand2 = ((seed + i * 17) % 100) / 100;
            if (rand1 > 0.6) { // Only some tiles get spots
                const spotX = screenX + rand2 * tileSize;
                const spotY = screenY + ((seed + i * 19) % 100) / 100 * tileSize;
                const spotSize = tileSize * 0.12;
                
                this.ctx.fillRect(spotX - spotSize/2, spotY - spotSize/2, spotSize, spotSize);
            }
        }
        
        // Lighter green highlights - very sparse
        this.ctx.fillStyle = '#5A9B4B';
        for (let i = 0; i < 2; i++) {
            const rand1 = ((seed + i * 23) % 100) / 100;
            const rand2 = ((seed + i * 29) % 100) / 100;
            if (rand1 > 0.75) { // Even fewer light spots
                const spotX = screenX + rand2 * tileSize;
                const spotY = screenY + ((seed + i * 31) % 100) / 100 * tileSize;
                const spotSize = tileSize * 0.08;
                
                this.ctx.fillRect(spotX - spotSize/2, spotY - spotSize/2, spotSize, spotSize);
            }
        }
    }
    
    renderMountainTile(screenX, screenY, tileSize, worldX, worldY) {
        // Base gray mountain color - clean like reference image
        this.ctx.fillStyle = '#8B8B8B';
        this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
        
        const centerX = screenX + tileSize / 2;
        const centerY = screenY + tileSize / 2;
        const seed = worldX * 89 + worldY * 67;
        
        // Create simple mountain shape - single main peak
        const peakHeight = tileSize * 0.35;
        const peakWidth = tileSize * 0.4;
        
        // Main mountain body - darker gray
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - peakWidth, centerY + peakHeight * 0.5);
        this.ctx.lineTo(centerX, centerY - peakHeight);
        this.ctx.lineTo(centerX + peakWidth, centerY + peakHeight * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Mountain highlight on left side
        this.ctx.fillStyle = '#A0A0A0';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - peakWidth, centerY + peakHeight * 0.5);
        this.ctx.lineTo(centerX, centerY - peakHeight);
        this.ctx.lineTo(centerX - peakWidth * 0.3, centerY - peakHeight * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add some texture variation with small rocky details
        this.ctx.fillStyle = '#5A5A5A';
        for (let i = 0; i < 3; i++) {
            const rand1 = ((seed + i * 41) % 100) / 100;
            const rand2 = ((seed + i * 43) % 100) / 100;
            if (rand1 > 0.6) { // Only some mountains get details
                const detailX = screenX + rand2 * tileSize;
                const detailY = screenY + ((seed + i * 47) % 100) / 100 * tileSize;
                const detailSize = tileSize * 0.06;
                
                this.ctx.fillRect(detailX - detailSize/2, detailY - detailSize/2, detailSize, detailSize);
            }
        }
        
        // Grid lines
        if (this.game.showGrid) {
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screenX, screenY, tileSize, tileSize);
        }
    }
    
    renderCities(visibleArea) {
        this.game.map.cities.forEach(city => {
            if (city.x >= visibleArea.startX && city.x < visibleArea.endX &&
                city.y >= visibleArea.startY && city.y < visibleArea.endY) {
                this.renderCity(city);
            }
        });
    }
    
    renderCity(city) {
        const screenPos = this.worldToScreen(city.x, city.y);
        const tileSize = this.tileSize * this.camera.zoom;
        
        // Check if visible
        const currentPlayer = this.game.getCurrentPlayer();
        if (this.game.settings.enableFogOfWar && 
            !this.game.map.isVisibleTo(currentPlayer.id, city.x, city.y)) {
            return;
        }
        
        this.renderDetailedCity(city, screenPos, tileSize);
    }
    
    renderDetailedCity(city, screenPos, tileSize) {
        const isOwned = city.owner !== null;
        const playerColor = isOwned ? GAME_CONSTANTS.PLAYER_COLORS[city.owner] : null;
        
        // City base - player color if owned, light gray if neutral
        this.ctx.fillStyle = isOwned ? playerColor : '#F5F5F5';
        const citySize = tileSize * 0.8;
        const offset = (tileSize - citySize) / 2;
        this.ctx.fillRect(screenPos.x + offset, screenPos.y + offset, citySize, citySize);
        
        // Simple building representation
        const buildingSize = citySize * 0.3;
        const centerX = screenPos.x + tileSize / 2;
        const centerY = screenPos.y + tileSize / 2;
        
        if (city.isCapital) {
            // Capital cities - multiple white buildings
            const buildings = [
                { x: centerX - buildingSize * 0.6, y: centerY - buildingSize * 0.3, size: buildingSize * 0.8 },
                { x: centerX + buildingSize * 0.2, y: centerY - buildingSize * 0.5, size: buildingSize },
                { x: centerX - buildingSize * 0.1, y: centerY + buildingSize * 0.3, size: buildingSize * 0.6 },
                { x: centerX + buildingSize * 0.5, y: centerY + buildingSize * 0.1, size: buildingSize * 0.7 }
            ];
            
            buildings.forEach(building => {
                // Building shadow
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(building.x + 1, building.y + 1, building.size, building.size);
                
                // Building color - lighter shade of player color if owned, white if neutral
                if (isOwned) {
                    // Create a lighter version of the player color for buildings
                    const r = parseInt(playerColor.slice(1, 3), 16);
                    const g = parseInt(playerColor.slice(3, 5), 16);
                    const b = parseInt(playerColor.slice(5, 7), 16);
                    const lightR = Math.min(255, r + 60);
                    const lightG = Math.min(255, g + 60);
                    const lightB = Math.min(255, b + 60);
                    this.ctx.fillStyle = `rgb(${lightR}, ${lightG}, ${lightB})`;
                } else {
                    this.ctx.fillStyle = '#FFFFFF';
                }
                this.ctx.fillRect(building.x, building.y, building.size, building.size);
                
                // Building outline
                this.ctx.strokeStyle = isOwned ? '#000000' : '#CCCCCC';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(building.x, building.y, building.size, building.size);
            });
            
            // Capital star indicator
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY - tileSize * 0.25, tileSize * 0.08, 0, 2 * Math.PI);
            this.ctx.fill();
            
        } else {
            // Regular cities - simple buildings
            const buildings = [
                { x: centerX - buildingSize * 0.4, y: centerY - buildingSize * 0.3, size: buildingSize * 0.7 },
                { x: centerX + buildingSize * 0.1, y: centerY - buildingSize * 0.2, size: buildingSize * 0.8 },
                { x: centerX - buildingSize * 0.1, y: centerY + buildingSize * 0.2, size: buildingSize * 0.6 }
            ];
            
            buildings.forEach(building => {
                // Building shadow
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(building.x + 1, building.y + 1, building.size, building.size);
                
                // Building color - lighter shade of player color if owned, white if neutral
                if (isOwned) {
                    // Create a lighter version of the player color for buildings
                    const r = parseInt(playerColor.slice(1, 3), 16);
                    const g = parseInt(playerColor.slice(3, 5), 16);
                    const b = parseInt(playerColor.slice(5, 7), 16);
                    const lightR = Math.min(255, r + 60);
                    const lightG = Math.min(255, g + 60);
                    const lightB = Math.min(255, b + 60);
                    this.ctx.fillStyle = `rgb(${lightR}, ${lightG}, ${lightB})`;
                } else {
                    this.ctx.fillStyle = '#FFFFFF';
                }
                this.ctx.fillRect(building.x, building.y, building.size, building.size);
                
                // Building outline
                this.ctx.strokeStyle = isOwned ? '#000000' : '#CCCCCC';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(building.x, building.y, building.size, building.size);
            });
        }
        
        // City border
        this.ctx.strokeStyle = isOwned ? '#000000' : '#999999';
        this.ctx.lineWidth = isOwned ? 2 : 1;
        this.ctx.strokeRect(screenPos.x + offset, screenPos.y + offset, citySize, citySize);
        
        // Production indicator
        if (city.currentProduction) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x + tileSize - tileSize * 0.12, 
                        screenPos.y + tileSize * 0.12, 
                        tileSize * 0.04, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    renderUnits(visibleArea) {
        this.game.units.forEach(unit => {
            if (unit.x >= visibleArea.startX && unit.x < visibleArea.endX &&
                unit.y >= visibleArea.startY && unit.y < visibleArea.endY) {
                this.renderUnit(unit);
            }
        });
    }
    
    renderUnit(unit) {
        const screenPos = this.worldToScreen(unit.x, unit.y);
        const tileSize = this.tileSize * this.camera.zoom;
        
        // Check if visible
        const currentPlayer = this.game.getCurrentPlayer();
        if (this.game.settings.enableFogOfWar && 
            !this.game.map.isVisibleTo(currentPlayer.id, unit.x, unit.y)) {
            return;
        }
        
        // Unit color - no more global alpha/shadow effects
        let unitColor = GAME_CONSTANTS.PLAYER_COLORS[unit.owner];
        this.ctx.fillStyle = unitColor;        const unitSize = tileSize * 0.6;
        const centerX = screenPos.x + tileSize / 2;
        const centerY = screenPos.y + tileSize / 2;
        
        // Different shapes for different unit types
        this.ctx.save();
        
        switch (unit.type) {
            case GAME_CONSTANTS.UNIT_TYPES.ARMY:
                // Square for army
                this.ctx.fillRect(centerX - unitSize/2, centerY - unitSize/2, unitSize, unitSize);
                break;
            case GAME_CONSTANTS.UNIT_TYPES.TANK:
                // Rectangle for tank (wider than army)
                this.ctx.fillRect(centerX - unitSize/2 * 1.2, centerY - unitSize/2 * 0.8, unitSize * 1.2, unitSize * 0.8);
                break;
            case GAME_CONSTANTS.UNIT_TYPES.FIGHTER:
                // Triangle for fighter
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - unitSize/2);
                this.ctx.lineTo(centerX - unitSize/2, centerY + unitSize/2);
                this.ctx.lineTo(centerX + unitSize/2, centerY + unitSize/2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            default:
                // Circle for ships
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, unitSize/2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
        
        // Add unit type letter
        this.ctx.fillStyle = '#FFFFFF'; // White text
        this.ctx.font = `bold ${Math.max(10, unitSize * 0.5)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let unitLetter = '';
        switch (unit.type) {
            case GAME_CONSTANTS.UNIT_TYPES.ARMY:
                unitLetter = 'A';
                break;
            case GAME_CONSTANTS.UNIT_TYPES.TANK:
                unitLetter = 'T';
                break;
            case GAME_CONSTANTS.UNIT_TYPES.FIGHTER:
                unitLetter = 'F';
                break;
            case GAME_CONSTANTS.UNIT_TYPES.DESTROYER:
                unitLetter = 'D';
                break;
            case GAME_CONSTANTS.UNIT_TYPES.CRUISER:
                unitLetter = 'R'; // Use 'R' for cRuiser to avoid conflict with Carrier
                break;
            case GAME_CONSTANTS.UNIT_TYPES.BATTLESHIP:
                unitLetter = 'B';
                break;
            case GAME_CONSTANTS.UNIT_TYPES.CARRIER:
                unitLetter = 'C';
                break;
            case GAME_CONSTANTS.UNIT_TYPES.SUBMARINE:
                unitLetter = 'S';
                break;
            default:
                unitLetter = '?';
        }
        
        // Draw black outline for better visibility
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(unitLetter, centerX, centerY);
        
        // Draw white letter on top
        this.ctx.fillText(unitLetter, centerX, centerY);
        
        // Unit border with different indicators
        const player = this.game.getCurrentPlayer();
        if (!player) {
            // If no current player, skip special border effects and use default
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.restore();
            return;
        }
        
        const hasAvailableMoves = unit.owner === player.id && unit.movesRemaining > 0 && !unit.isMovingAlongPath;
        

        
        if (unit.needsPlayerAttention && unit.owner === player.id) {
            // Flash the border color between yellow and orange for attention
            const blinkTime = Math.sin(Date.now() * 0.005);
            this.ctx.strokeStyle = blinkTime > 0 ? '#FFD700' : '#FF8C00'; // Gold to Dark Orange
            this.ctx.lineWidth = 3; // Slightly thicker for attention
        } else if (unit.isSelected) {
            // Selected unit gets yellow border
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
        } else if (hasAvailableMoves) {
            // Units with available moves get very bright pulsing border
            const time = Date.now();
            const pulse = Math.sin(time / 300) * 0.5 + 0.5; // Faster pulsing
            
            // Bright yellow/gold outer border that pulses
            this.ctx.strokeStyle = '#FFD700'; // Bright gold
            this.ctx.lineWidth = 4 + pulse * 3; // Varies between 4 and 7 (thicker)
            this.ctx.globalAlpha = 0.8 + pulse * 0.2; // Varies between 0.8 and 1.0
            this.ctx.strokeRect(screenPos.x - 1, screenPos.y - 1, tileSize + 2, tileSize + 2);
            
            // Inner bright green border for extra visibility
            this.ctx.strokeStyle = '#00FF00'; // Bright lime green
            this.ctx.lineWidth = 2 + pulse * 2; // Varies between 2 and 4
            this.ctx.globalAlpha = 0.9 + pulse * 0.1;
            this.ctx.strokeRect(screenPos.x + 1, screenPos.y + 1, tileSize - 2, tileSize - 2);
            
            // Reset alpha
            this.ctx.globalAlpha = 1.0;
            
            // Skip the normal stroke since we already drew our borders  
            this.ctx.restore();
            return;
        } else {
            // Normal border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
        }
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderMovementPaths(visibleArea) {
        // Render movement paths for all units
        this.game.units.forEach(unit => {
            if (unit.hasMovementPath()) {
                this.renderUnitPath(unit);
            }
        });
    }

    renderUnitPath(unit) {
        if (!unit.movementPath || unit.movementPath.length === 0) return;

        this.ctx.save();
        
        // Thin, subtle continuous line style
        this.ctx.strokeStyle = unit.owner === this.game.getCurrentPlayer().id ? '#FFD700' : '#888888';
        this.ctx.lineWidth = 1; // Much thinner line
        this.ctx.setLineDash([]); // Solid line instead of dashed
        this.ctx.globalAlpha = 0.4; // Subtle transparency
        
        // Draw continuous path from current position through all waypoints
        this.ctx.beginPath();
        
        // Start from unit's current position
        const startPos = this.worldToScreen(unit.x, unit.y);
        const tileSize = this.tileSize * this.camera.zoom;
        const centerX = startPos.x + tileSize / 2;
        const centerY = startPos.y + tileSize / 2;
        
        this.ctx.moveTo(centerX, centerY);
        
        // Draw one continuous line through each waypoint
        unit.movementPath.forEach(waypoint => {
            const waypointPos = this.worldToScreen(waypoint.x, waypoint.y);
            const wpCenterX = waypointPos.x + tileSize / 2;
            const wpCenterY = waypointPos.y + tileSize / 2;
            this.ctx.lineTo(wpCenterX, wpCenterY);
        });
        
        this.ctx.stroke();
        
        // Only draw destination marker (no intermediate waypoint dots)
        if (unit.movementPath.length > 0) {
            const destination = unit.movementPath[unit.movementPath.length - 1];
            const destPos = this.worldToScreen(destination.x, destination.y);
            const destCenterX = destPos.x + tileSize / 2;
            const destCenterY = destPos.y + tileSize / 2;
            
            // Small subtle destination marker
            this.ctx.fillStyle = unit.owner === this.game.getCurrentPlayer().id ? '#FFD700' : '#888888';
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.arc(destCenterX, destCenterY, 2, 0, Math.PI * 2); // Smaller circle
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderSelection() {
        if (this.game.selectedUnit) {
            this.renderUnitSelection(this.game.selectedUnit);
        }
        
        if (this.game.selectedCity) {
            this.renderCitySelection(this.game.selectedCity);
        }
    }
    
    renderUnitSelection(unit) {
        const screenPos = this.worldToScreen(unit.x, unit.y);
        const tileSize = this.tileSize * this.camera.zoom;
        
        // Selection border
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(screenPos.x, screenPos.y, tileSize, tileSize);
    }
    
    renderCitySelection(city) {
        const screenPos = this.worldToScreen(city.x, city.y);
        const tileSize = this.tileSize * this.camera.zoom;
        
        // Selection border
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(screenPos.x, screenPos.y, tileSize, tileSize);
    }
    
    renderHover() {
        if (this.hoveredTile) {
            const screenPos = this.worldToScreen(this.hoveredTile.x, this.hoveredTile.y);
            const tileSize = this.tileSize * this.camera.zoom;
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(screenPos.x, screenPos.y, tileSize, tileSize);
        }
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX * this.tileSize * this.camera.zoom) + this.camera.x,
            y: (worldY * this.tileSize * this.camera.zoom) + this.camera.y
        };
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: Math.floor((screenX - this.camera.x) / (this.tileSize * this.camera.zoom)),
            y: Math.floor((screenY - this.camera.y) / (this.tileSize * this.camera.zoom))
        };
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // Update hovered tile
        const worldPos = this.screenToWorld(this.mouseX, this.mouseY);
        if (GameHelpers.isValidPosition(worldPos.x, worldPos.y)) {
            this.hoveredTile = worldPos;
        } else {
            this.hoveredTile = null;
        }
        
        // Handle camera dragging
        if (this.isDragging) {
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            
            this.camera.x += deltaX;
            this.camera.y += deltaY;
            
            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
        }
    }
    
    handleMouseDown(e) {
        if (e.button === 2) { // Right click
            this.isDragging = true;
            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
        }
    }
    
    handleMouseUp(e) {
        if (e.button === 2) { // Right click
            this.isDragging = false;
        }
    }
    
    handleClick(e) {
        console.log(`🖱️ Click event received at screen (${this.mouseX}, ${this.mouseY})`);
        if (e.button !== 0) return; // Only left click
        
        const worldPos = this.screenToWorld(this.mouseX, this.mouseY);
        console.log(`🖱️ World position: (${worldPos.x}, ${worldPos.y})`);
        if (!GameHelpers.isValidPosition(worldPos.x, worldPos.y)) {
            console.log(`🖱️ Invalid position, ignoring click`);
            return;
        }
        
        const currentPlayer = this.game.getCurrentPlayer();
        
        // Check if it's current player's turn and they are human
        if (!currentPlayer.isHuman) {
            return;
        }
        
        // Check what's at the clicked position
        const unit = this.game.getUnitAt(worldPos.x, worldPos.y);
        const city = this.game.map.getCityAt(worldPos.x, worldPos.y);
        
        const terrain = this.game.map.getTerrain(worldPos.x, worldPos.y);
        console.log(`🖱️ Click at (${worldPos.x}, ${worldPos.y}): terrain="${terrain}", unit=${unit ? unit.type + ' at (' + unit.x + ',' + unit.y + ')' : 'none'}, city=${city ? city.name : 'none'}`);
        console.log(`🖱️ Map bounds: ${this.game.map.width}x${this.game.map.height}, clicked position valid: ${worldPos.x >= 0 && worldPos.x < this.game.map.width && worldPos.y >= 0 && worldPos.y < this.game.map.height}`);
        
        // Handle unit selection and movement
        if (unit && unit.owner === currentPlayer.id) {
            // Select own unit
            console.log(`🖱️ GameBoard: Selecting unit at (${worldPos.x}, ${worldPos.y}):`, unit);
            this.game.selectUnit(unit);
        } else if (this.game.selectedUnit && this.game.selectedUnit.owner === currentPlayer.id) {
            // Try to move or attack with selected unit
            const selectedUnit = this.game.selectedUnit;
            
            if (unit && unit.owner !== currentPlayer.id) {
                // Attack enemy unit
                if (selectedUnit.canAttack && selectedUnit.canAttack(worldPos.x, worldPos.y)) {
                    this.game.attackUnit(selectedUnit, unit);
                }
            } else {
                // Check if it's an adjacent tile for immediate movement
                const distance = GameHelpers.getDistance(selectedUnit.x, selectedUnit.y, worldPos.x, worldPos.y);
                
                if (distance <= selectedUnit.movesRemaining && selectedUnit.movesRemaining > 0 && selectedUnit.canImmediatelyMoveTo(worldPos.x, worldPos.y, this.game.map)) {
                    // Direct move within unit's remaining movement range
                    console.log(`✅ Direct move to (${worldPos.x}, ${worldPos.y}) - distance ${distance}, moves remaining: ${selectedUnit.movesRemaining}`);
                    this.game.moveUnit(selectedUnit, worldPos.x, worldPos.y);
                } else if (distance > selectedUnit.movesRemaining) {
                    // Set movement path to clicked position (can be multiple tiles away)
                    console.log(`Setting path for movement to (${worldPos.x}, ${worldPos.y}), distance: ${distance}`);
                    const pathSet = selectedUnit.setMovementPath(worldPos.x, worldPos.y, this.game.map);
                    if (pathSet) {
                        console.log(`✅ Path set for ${selectedUnit.type} to (${worldPos.x}, ${worldPos.y})`);
                        selectedUnit.needsPlayerAttention = false; // Clear attention state since new orders given
                        this.game.selectUnit(null); // Deselect unit after giving orders
                    } else {
                        console.log(`❌ No valid path found to (${worldPos.x}, ${worldPos.y})`);
                    }
                } else {
                    console.log(`❌ Cannot move: distance=${distance}, moves=${selectedUnit.movesRemaining}/${selectedUnit.maxMoves}, canMove=${selectedUnit.canImmediatelyMoveTo(worldPos.x, worldPos.y, this.game.map)}`);
                }
            }
        } else if (city) {
            // Select any city to view information
            console.log(`🖱️ GameBoard: Selecting city at (${worldPos.x}, ${worldPos.y}):`, city);
            this.game.selectCity(city);
        } else {
            // Deselect everything
            this.game.selectUnit(null);
            this.game.selectCity(null);
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.5, Math.min(3.0, this.camera.zoom * zoomFactor));
        
        // Zoom toward mouse position
        const mouseWorldBefore = this.screenToWorld(this.mouseX, this.mouseY);
        this.camera.zoom = newZoom;
        const mouseWorldAfter = this.screenToWorld(this.mouseX, this.mouseY);
        
        this.camera.x += (mouseWorldAfter.x - mouseWorldBefore.x) * this.tileSize * this.camera.zoom;
        this.camera.y += (mouseWorldAfter.y - mouseWorldBefore.y) * this.tileSize * this.camera.zoom;
    }
    
    handleKeyDown(e) {
        const currentPlayer = this.game.getCurrentPlayer();
        if (!currentPlayer.isHuman) {
            return;
        }
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                // End turn
                this.game.endPlayerTurn();
                break;
            case 'Escape':
                // Deselect everything
                this.game.selectUnit(null);
                this.game.selectCity(null);
                break;
            case 'KeyG':
                // Toggle grid
                this.game.showGrid = !this.game.showGrid;
                break;
            case 'KeyC':
                // Toggle coordinates
                this.game.showCoordinates = !this.game.showCoordinates;
                break;
        }
    }
    
    handleRightClick(e) {
        e.preventDefault(); // Prevent context menu
        
        const worldPos = this.screenToWorld(this.mouseX, this.mouseY);
        if (!GameHelpers.isValidPosition(worldPos.x, worldPos.y)) {
            return;
        }
        
        const currentPlayer = this.game.getCurrentPlayer();
        
        // Check if it's current player's turn and they are human
        if (!currentPlayer.isHuman) {
            return;
        }
        
        // Only handle right-click if we have a selected unit
        if (this.game.selectedUnit && this.game.selectedUnit.owner === currentPlayer.id) {
            const selectedUnit = this.game.selectedUnit;
            const distance = GameHelpers.getDistance(selectedUnit.x, selectedUnit.y, worldPos.x, worldPos.y);
            
            if (distance > 1) {
                // Check if path exists before showing confirmation
                const pathExists = selectedUnit.canPathTo(worldPos.x, worldPos.y, this.game.map);
                
                if (pathExists) {
                    // Show confirmation dialog for multi-turn movement
                    const confirmed = confirm(`Set destination for ${selectedUnit.type} to tile (${worldPos.x}, ${worldPos.y})?\nThis may take multiple turns to reach.`);
                    
                    if (confirmed) {
                        console.log(`🎯 Right-click: Setting multi-turn path to (${worldPos.x}, ${worldPos.y})`);
                        const pathSet = selectedUnit.setMovementPath(worldPos.x, worldPos.y, this.game.map);
                        if (pathSet) {
                            console.log(`✅ Multi-turn path set for ${selectedUnit.type}`);
                            selectedUnit.needsPlayerAttention = false;
                            this.game.selectUnit(null); // Deselect after giving orders
                        }
                    }
                } else {
                    alert(`No valid path found to (${worldPos.x}, ${worldPos.y})`);
                }
            } else if (distance === 1 && selectedUnit.movesRemaining > 0) {
                // Right-click on adjacent tile - just move there directly
                if (selectedUnit.canImmediatelyMoveTo(worldPos.x, worldPos.y, this.game.map)) {
                    console.log(`🎯 Right-click: Direct move to adjacent (${worldPos.x}, ${worldPos.y})`);
                    this.game.moveUnit(selectedUnit, worldPos.x, worldPos.y);
                }
            }
        }
    }

    centerOn(x, y) {
        this.camera.x = -(x * this.tileSize * this.camera.zoom) + this.canvas.width / 2;
        this.camera.y = -(y * this.tileSize * this.camera.zoom) + this.canvas.height / 2;
    }
    
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }
}