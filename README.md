# 🎨 Color War - Chain Reaction Game (Web Version) 🎮

## 🌟 Overview
This is a web-based implementation of the Color War chain reaction game, ported from the original Rust version. The game features the same strategic gameplay, animations, and mechanics as the original, but runs in any modern web browser without requiring installation.

## 🚀 Game Features
- **Multiplayer Support**: Play with up to 4 players on the same device
- **Strategic Gameplay**: Balance offense and defense to dominate the board
- **Chain Reactions**: Watch as your moves trigger cascading explosions across the board
- **Animated Interface**: Enjoy smooth animations for tile placement and explosions
- **Elimination Mechanics**: Players are eliminated when they lose all their tiles
- **Responsive Design**: Play on desktop or mobile devices

## 📜 Game Rules

### 🛠️ Setup
- The game is played on an 8x8 grid
- Players take turns in a randomized order
- Each player is assigned a unique color (Red, Green, Blue, or Yellow)

### 🎲 First Move
- On a player's first turn, they can place a tile on any empty cell
- First move tiles start with a power level of 3

### 🔄 Subsequent Moves
- After the first move, players can only add tiles to cells they already own
- Each placement increases the cell's power level by 1

### 💥 Explosions
- When a cell's power level exceeds its capacity (4 for all cells), it explodes
- An explosion resets the cell's power to 0 and distributes power to adjacent cells
- Adjacent cells are captured by the exploding player regardless of previous ownership
- This can trigger chain reactions if adjacent cells also exceed their capacity

### 🏆 Winning
- A player is eliminated when they have no tiles left on the board
- The last player with tiles on the board wins the game

## 🎛️ Controls
- **Mouse/Touch**: Click or tap on a cell to place a tile

## 📥 Running the Game

### 🌐 Local Setup
1. Clone or download the repository
2. Open the `index.html` file in any modern web browser
3. Start playing immediately!

## License

Copyright (C) 2023 LulzSec6824

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

```
                    GNU GENERAL PUBLIC LICENSE
                    Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The GNU General Public License is a free, copyleft license for
software and other kinds of works... [Full license text continues] 
```

#### 💻 Implementation
- Written in vanilla JavaScript for maximum compatibility
- Uses HTML5 Canvas for rendering graphics
- Features smooth animations for explosions and tile captures
- Implements the same turn-based system and player elimination logic as the original

## 🧠 Strategy Tips
- Corner cells are strategic as they only have two adjacent cells
- Edge cells are also valuable with only three adjacent cells
- Try to create chain reactions to capture multiple cells at once
- Be careful not to place tiles that could be easily captured by opponents
- Sometimes it's better to reinforce your existing positions than to expand

## 🙏 Credits
Web implementation of the classic Chain Reaction game concept, ported from the original Rust version.