# Sovereign Tactics

A web-based turn-based strategy game of tactical dominance and empire building. Built with HTML5 Canvas and vanilla JavaScript.

## About Sovereign Tactics

Sovereign Tactics is a modern turn-based strategy game featuring:

- **Turn-based strategy gameplay** with multiple unit types
- **Fog of war** and exploration mechanics
- **City-based unit production** system
- **Naval, ground, and air units** with different capabilities
- **Multiple game modes** (Basic, Standard, Advanced)

## Features

### Current Implementation

- ✅ **Complete Game Architecture**: Modular design with separate classes for Game, Map, Units, Cities, Players, and AI
- ✅ **Unit System**: 8 different unit types (Army, Fighter, Destroyer, Submarine, Cruiser, Battleship, Carrier, Transport)
- ✅ **City Management**: Cities produce units over time, can be captured and controlled
- ✅ **Turn-Based Gameplay**: Players take turns moving units and managing production
- ✅ **AI Opponents**: Basic AI with different difficulty levels and strategies
- ✅ **Map Generation**: Procedural map generation with terrain types
- ✅ **Fog of War**: Limited visibility system for strategic gameplay
- ✅ **Combat System**: Unit vs unit combat with strength calculations
- ✅ **Game UI**: Canvas-based rendering with HUD panels
- ✅ **Menu System**: Main menu, game setup, settings, and help screens
- ✅ **Save/Load**: Game state persistence

### Game Mechanics

- **Units**: Each unit type has different movement ranges, combat strengths, and terrain restrictions
- **Cities**: Serve as production centers and victory objectives
- **Combat**: Simple but effective combat system based on attack/defense values
- **Victory**: Capture all cities or eliminate all enemy units
- **Multiplayer**: Support for up to 8 players (human or AI)

## Getting Started

### Prerequisites

- Modern web browser with HTML5 Canvas support
- Local web server (for module imports) or just open index.html directly

### Installation

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Start playing!

### Controls

- **Left Click**: Select unit/city, move unit, attack enemy
- **Right Click + Drag**: Pan camera around map
- **Mouse Wheel**: Zoom in/out
- **Space**: End current turn
- **Escape**: Deselect current selection or show pause menu
- **G**: Toggle grid display
- **C**: Toggle coordinate display
- **Ctrl+S**: Quick save
- **Ctrl+L**: Quick load
- **F1**: Show help

## Project Structure

```
sovereign-tactics/
├── index.html              # Main HTML file
├── styles/
│   └── main.css            # Game styles
├── src/
│   ├── game/               # Core game logic
│   │   ├── Game.js         # Main game class
│   │   ├── Map.js          # Map and terrain system
│   │   ├── Unit.js         # Unit classes and logic
│   │   ├── City.js         # City management
│   │   ├── Player.js       # Player management
│   │   └── AI.js           # AI opponent logic
│   ├── ui/                 # User interface
│   │   ├── GameBoard.js    # Canvas rendering
│   │   ├── HUD.js          # UI panels and controls
│   │   └── Menu.js         # Menu system
│   ├── utils/              # Utility functions
│   │   ├── Constants.js    # Game constants
│   │   └── Helpers.js      # Helper functions
│   └── main.js             # Application entry point
└── assets/
    ├── sprites/            # Unit and terrain graphics (placeholder)
    └── sounds/             # Game audio files (placeholder)
```

## Unit Types

| Unit | Movement | Terrain | Special Abilities |
|------|----------|---------|------------------|
| Army | 1 | Land | Can capture cities |
| Fighter | 8 | Any | Long range attack (2 tiles) |
| Destroyer | 4 | Ocean | Fast naval reconnaissance |
| Submarine | 3 | Ocean | Stealth capabilities |
| Cruiser | 4 | Ocean | Balanced naval combat |
| Battleship | 2 | Ocean | Heavy armor and firepower |
| Carrier | 2 | Ocean | Launches fighters |
| Transport | 2 | Ocean | Carries ground units |

## Game Modes

- **Basic**: Simple rules, visible map, basic unit types
- **Standard**: Fog of war, full unit roster, balanced gameplay
- **Advanced**: Complex terrain effects, advanced rules

## Development

This project is built using:

- **HTML5 Canvas** for graphics rendering
- **Vanilla JavaScript** with ES6 modules
- **CSS3** for UI styling
- **No external dependencies** for maximum compatibility

### Adding New Features

The modular architecture makes it easy to extend:

1. **New Unit Types**: Add to `UNIT_TYPES` in Constants.js and implement in Unit.js
2. **Terrain Types**: Extend `TERRAIN` constants and update rendering
3. **AI Strategies**: Add new strategies to AI.js
4. **Game Modes**: Implement additional rules in Game.js

## Learning Objectives

This project demonstrates:

- **Game Architecture**: Clean separation of concerns with modular design
- **Canvas Programming**: 2D graphics, user input, and rendering optimization
- **State Management**: Complex game state with turn-based mechanics
- **AI Programming**: Basic game AI with different behaviors
- **UI/UX Design**: Intuitive game interface and user experience

## Credits

- Inspired by classic turn-based strategy games
- Original Empire concept by **Walter Bright** (1977)
- Built as a learning project and tribute to classic strategy games

## License

This project is for educational and entertainment purposes.

## Next Steps

Potential improvements for learning:

1. **Enhanced Graphics**: Sprite-based rendering instead of simple shapes
2. **Sound Effects**: Audio feedback for actions and events
3. **Network Multiplayer**: Real-time multiplayer over websockets
4. **Map Editor**: Custom map creation tools
5. **Campaign Mode**: Scenarios and progressive difficulty
6. **Advanced AI**: More sophisticated AI strategies and pathfinding
7. **Animations**: Smooth unit movement and combat effects
8. **Mobile Support**: Touch controls and responsive design

---

**Note**: This is an original game created for educational and entertainment purposes.