// Simple HUD for Sovereign Tactics
export class HUD {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        console.log('🎛️ Setting up HUD event listeners');
        
        // Test that we can access DOM elements immediately
        const testElement = document.getElementById('selected-unit-details');
        console.log('🎛️ Initial DOM check - selected-unit-details element:', testElement);
        
        this.game.on('playerTurnStarted', (data) => {
            this.updateDisplay(data);
            this.updateHUDForTurnStart(data);
            this.updatePlayerStats(data.player);
        });
        this.game.on('unitSelected', (data) => {
            console.log('🎛️ HUD received unitSelected event:', data);
            this.showUnitInfo(data.unit);
        });
        this.game.on('citySelected', (data) => {
            console.log('🎛️ HUD received citySelected event:', data);
            this.showCityInfo(data.city);
        });
        this.game.on('unitMoved', (data) => {
            // Update unit info if the moved unit is selected
            if (this.game.selectedUnit && this.game.selectedUnit.id === data.unit.id) {
                this.showUnitInfo(data.unit);
            }
            // Update stats to reflect new available moves count
            const currentPlayer = this.game.getCurrentPlayer();
            if (currentPlayer) {
                this.updatePlayerStats(currentPlayer);
            }
        });
        
        this.game.on('unitProduced', (data) => {
            // Update stats when new unit is produced
            const currentPlayer = this.game.getCurrentPlayer();
            if (currentPlayer) {
                this.updatePlayerStats(currentPlayer);
            }
        });
        
        this.game.on('cityCapture', (data) => {
            // Update stats when city is captured
            const currentPlayer = this.game.getCurrentPlayer();
            if (currentPlayer) {
                this.updatePlayerStats(currentPlayer);
            }
        });
        
        this.game.on('unitDestroyed', (data) => {
            this.handleUnitDestroyed(data);
        });
        
        this.game.on('cityCapture', (data) => {
            this.handleCityCapture(data);
        });
        
        // Add a test update immediately to verify HUD works
        setTimeout(() => {
            console.log('🎛️ Testing HUD update after 2 seconds...');
            this.testHudUpdate();
        }, 2000);
    }
    
    updateDisplay(data) {
        console.log(`Turn ${data.turnNumber}: ${data.player.name}'s turn`);
        
        // Update any existing HUD elements
        const playerElement = document.getElementById('current-player');
        if (playerElement) {
            let displayText = data.player.name;
            if (!data.hasActions) {
                displayText += ' (No Actions - Auto Turn)';
            }
            playerElement.textContent = displayText;
            playerElement.style.color = data.player.color || '#3498db';
        }
        
        const turnElement = document.getElementById('turn-counter');
        if (turnElement) {
            turnElement.textContent = `Turn ${data.turnNumber}`;
        }
    }
    
    // Update HUD when player turn starts
    updateHUDForTurnStart(data) {
        // If there's a selected unit from the previous turn, refresh its info
        if (this.game.selectedUnit) {
            console.log(`🎛️ Refreshing HUD for selected unit at turn start`);
            this.showUnitInfo(this.game.selectedUnit);
        }
        
        // If there's a selected city, refresh its info
        if (this.game.selectedCity) {
            console.log(`🎛️ Refreshing HUD for selected city at turn start`);
            this.showCityInfo(this.game.selectedCity);
        }
        
        // If nothing is selected but it's the human player's turn, suggest units that need attention
        if (data.player.isHuman && !this.game.selectedUnit && !this.game.selectedCity) {
            const unitsNeedingAttention = this.game.units.filter(unit => 
                unit.owner === data.player.id && unit.needsPlayerAttention
            );
            
            if (unitsNeedingAttention.length > 0) {
                console.log(`🎛️ Found ${unitsNeedingAttention.length} units needing attention`);
                // Auto-select the first unit that needs attention
                this.game.selectUnit(unitsNeedingAttention[0]);
            }
        }
    }
    
    showUnitInfo(unit) {
        console.log(`🎛️ showUnitInfo called with unit:`, unit);
        
        if (!unit) {
            console.log(`�️ No unit provided, clearing unit info`);
            const unitDetails = document.getElementById('selected-unit-details');
            if (unitDetails) {
                unitDetails.innerHTML = '<p>No unit selected</p>';
            }
            return;
        }
        
        console.log(`🎛️ Showing info for: ${unit.type} at (${unit.x}, ${unit.y}) with ${unit.movesRemaining}/${unit.maxMoves} moves, isMovingAlongPath: ${unit.isMovingAlongPath}`);
        
        const unitDetails = document.getElementById('selected-unit-details');
        if (unitDetails) {
            console.log(`🎛️ Found unitDetails element, updating...`);
            try {
                unitDetails.innerHTML = `
                    <p><strong>${unit.type.toUpperCase()}</strong></p>
                    <p>Position: (${unit.x}, ${unit.y})</p>
                    <p>Moves: ${unit.movesRemaining}/${unit.maxMoves}</p>
                    <p>Health: ${unit.health}%</p>
                    <p>Owner: Player ${unit.owner}</p>
                    <p>Path: ${unit.isMovingAlongPath ? 'Following' : 'None'}</p>
                    <p>Attack: ${unit.getAttackStrength()}</p>
                    <p>Defense: ${unit.getDefenseStrength()}</p>
                `;
                console.log(`🎛️ Successfully updated unit details`);
            } catch (error) {
                console.error(`🎛️ Error updating unit details:`, error);
                unitDetails.innerHTML = `<p>Error displaying unit info</p>`;
            }
        } else {
            console.log(`🎛️ ERROR: Could not find selected-unit-details element in DOM`);
        }
    }

    // Test method to verify HUD functionality
    testHudUpdate() {
        console.log('🎛️ Running HUD test...');
        const unitDetails = document.getElementById('selected-unit-details');
        if (unitDetails) {
            unitDetails.innerHTML = `
                <p><strong>TEST UNIT</strong></p>
                <p>Position: (99, 99)</p>
                <p>This is a test to verify HUD updates work</p>
            `;
            console.log('🎛️ ✅ HUD test successful - element updated');
        } else {
            console.log('🎛️ ❌ HUD test failed - element not found');
        }
    }
    
    // Handle unit destroyed events
    handleUnitDestroyed(data) {
        const { unit, reason } = data;
        
        if (reason === 'failed_capture') {
            // Don't show notification here - it's handled by cityCapture event
            return;
        } else {
            this.showNotification(`💀 Your ${unit.type} at (${unit.x}, ${unit.y}) was destroyed`, 'warning');
        }
    }
    
    // Handle city capture events
    handleCityCapture(data) {
        const { city, unit, player, success, showUnitSelection } = data;
        const currentPlayer = this.game.getCurrentPlayer();
        
        // Only show notifications for the current human player
        if (player.id === currentPlayer.id && currentPlayer.isHuman) {
            if (success) {
                this.showNotification(`🏛️ SUCCESS! You captured ${city.name} at (${city.x}, ${city.y})!`, 'success');
                
                // Show unit selection popup if requested
                if (showUnitSelection) {
                    this.showUnitSelectionPopup(city, unit);
                }
            } else {
                this.showNotification(`⚔️ CAPTURE FAILED! Your ${unit.type} was destroyed attempting to capture ${city.name} at (${city.x}, ${city.y})`, 'error');
            }
        }
    }
    
    // Show unit selection popup for captured city
    showUnitSelectionPopup(city, capturingUnit) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'unit-selection-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        // Create popup content
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: white;
            border: 3px solid #333;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            min-width: 300px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        // Title
        const title = document.createElement('h3');
        title.textContent = `Choose Production for ${city.name}`;
        title.style.marginTop = '0';
        title.style.color = '#333';
        popup.appendChild(title);
        
        // Description
        const desc = document.createElement('p');
        desc.textContent = `Your ${capturingUnit.type.toUpperCase()} has captured ${city.name}! What unit should this city produce?`;
        desc.style.color = '#666';
        desc.style.marginBottom = '20px';
        popup.appendChild(desc);
        
        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 15px;
        `;
        
        // Army button
        const armyBtn = document.createElement('button');
        armyBtn.textContent = 'Army (A)';
        armyBtn.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            font-weight: bold;
            border: 2px solid #333;
            background: #4CAF50;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            min-width: 100px;
        `;
        armyBtn.onclick = () => {
            this.game.setCapturedCityProduction(city, 'army');
            document.body.removeChild(overlay);
        };
        
        // Tank button
        const tankBtn = document.createElement('button');
        tankBtn.textContent = 'Tank (T)';
        tankBtn.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            font-weight: bold;
            border: 2px solid #333;
            background: #FF9800;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            min-width: 100px;
        `;
        tankBtn.onclick = () => {
            this.game.setCapturedCityProduction(city, 'tank');
            document.body.removeChild(overlay);
        };
        
        // Add hover effects
        [armyBtn, tankBtn].forEach(btn => {
            btn.onmouseenter = () => btn.style.opacity = '0.8';
            btn.onmouseleave = () => btn.style.opacity = '1';
        });
        
        buttonContainer.appendChild(armyBtn);
        buttonContainer.appendChild(tankBtn);
        popup.appendChild(buttonContainer);
        
        // Stats info
        const statsInfo = document.createElement('div');
        statsInfo.style.cssText = `
            margin-top: 15px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        `;
        statsInfo.innerHTML = `
            <strong>Army:</strong> 6 turns, 1 move, Attack/Defense: 10<br>
            <strong>Tank:</strong> 12 turns, 2 moves, Attack/Defense: 20
        `;
        popup.appendChild(statsInfo);
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }
    
    // Show notification to user
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.top = '20px';
            notificationContainer.style.left = '50%';
            notificationContainer.style.transform = 'translateX(-50%)';
            notificationContainer.style.zIndex = '10000';
            notificationContainer.style.pointerEvents = 'none';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification
        const notification = document.createElement('div');
        const colors = {
            'error': '#dc3545',      // Red
            'warning': '#fd7e14',    // Orange  
            'success': '#28a745',    // Green
            'info': '#17a2b8'        // Blue
        };
        notification.style.background = colors[type] || colors['info'];
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '8px';
        notification.style.marginBottom = '10px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        notification.style.fontWeight = 'bold';
        notification.style.fontSize = '14px';
        notification.style.animation = 'slideInDown 0.3s ease-out';
        notification.textContent = message;
        
        // Add animation keyframes if they don't exist
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideOutUp {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notificationContainer.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    showCityInfo(city) {
        if (!city) return;
        
        console.log(`Selected city: ${city.name} at (${city.x}, ${city.y})`);
        
        const cityDetails = document.getElementById('selected-city-details');
        if (cityDetails) {
            const owner = this.game.getPlayerById(city.owner);
            cityDetails.innerHTML = `
                <p><strong>${city.name}</strong></p>
                <p>Position: (${city.x}, ${city.y})</p>
                <p>Owner: ${owner ? owner.name : 'Neutral'}</p>
                <p>Population: ${city.population}</p>
                ${city.currentProduction ? `<p>Producing: ${city.currentProduction} (${city.productionTurnsRemaining} turns)</p>` : '<p>No production</p>'}
            `;
        }
    }
    
    // Update player statistics display
    updatePlayerStats(player) {
        if (!player) return;
        
        // Get current game state counts
        const playerUnits = this.game.getUnitsOwnedBy(player.id);
        const playerCities = this.game.map.getCitiesOwnedBy(player.id);
        const availableMoves = playerUnits.filter(unit => 
            unit.movesRemaining > 0 && !unit.isMovingAlongPath
        ).length;
        
        // Debug: Compare HUD calculation with game's playerHasActions
        const gameHasActions = this.game.playerHasActions(player.id);
        console.log(`📊 HUD Stats: availableMoves=${availableMoves}, gameHasActions=${gameHasActions}`);
        
        // Update DOM elements
        const statCities = document.getElementById('stat-cities');
        const statUnits = document.getElementById('stat-units');
        const statBattlesWon = document.getElementById('stat-battles-won');
        const statBattlesLost = document.getElementById('stat-battles-lost');
        const statAvailableMoves = document.getElementById('stat-available-moves');
        const statUnitsCreated = document.getElementById('stat-units-created');
        
        if (statCities) statCities.textContent = playerCities.length;
        if (statUnits) statUnits.textContent = playerUnits.length;
        if (statBattlesWon) statBattlesWon.textContent = player.stats.battlesWon || 0;
        if (statBattlesLost) statBattlesLost.textContent = player.stats.battlesLost || 0;
        if (statAvailableMoves) statAvailableMoves.textContent = availableMoves;
        if (statUnitsCreated) statUnitsCreated.textContent = player.turnStats.unitsCreatedThisTurn || 0;
    }
}