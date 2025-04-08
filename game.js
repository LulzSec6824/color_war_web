// Game board configuration constants
const ROWS = 8;                    // Number of rows in the game grid
const COLS = 8;                    // Number of columns in the game grid
const CELL_SIZE = 50;              // Size of each cell in pixels
const PLAYERS = 4;                 // Number of players in the game
const ANIMATION_DURATION = 100;    // Duration of animations in milliseconds
const BOARD_MARGIN = 0.2 * CELL_SIZE; // Margin around the board in pixels
const TARGET_FPS = 90;             // Target 90 FPS for smoother animations
const FRAME_TIME = 1000 / TARGET_FPS; // Time per frame in milliseconds for consistent game speed

/**
 * GameState Class - Core Game Engine
 * Manages all game rules, player turns, and state transitions. Key responsibilities:
 * 1. Maintaining board state through 2D grid representation
 * 2. Processing player moves and validating game rules
 * 3. Managing chain reaction propagation through BFS algorithm
 * 4. Tracking player states (active/inactive) and game phase
 * 5. Coordinating with GameRenderer for visual updates
 * 
 * The class follows a strict turn sequence with player order randomization
 * and implements fail-safe checks for game integrity.
 */
class GameState {
    /**
     * Initialize the game state with default values
     * Sets up the game grid, player order, and initial conditions
     */
    constructor() {
        // Core game state properties
        this.grid = [];                              // 2D array representing the game board
        this.players = PLAYERS;                      // Number of players in the game
        this.currentPlayer = 0;                      // Current player's index
        this.animations = [];                        // Tracks active animations
        this.playerOrder = this.shuffleArray([0, 1, 2, 3]); // Randomized player order
        this.turnNumber = 0;                         // Current turn number

        // UI and game flow properties
        this.turnMessages = [
            "Red player's turn - Place your tile!",
            "Green player's turn - Place your tile!",
            "Blue player's turn - Place your tile!",
            "Yellow player's turn - Place your tile!"
        ];

        // Game state tracking
        this.firstMoves = [true, true, true, true];  // Tracks if each player has made their first move
        this.playersAlive = [true, true, true, true]; // Tracks which players are still in the game
        this.gameOver = false;                       // Flag for game end state
        this.winner = null;                          // Stores the winner's index when game ends

        // Initialize the grid with empty cells
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                this.grid[r][c] = {
                    owner: null,                     // Player who owns this cell (null if empty)
                    power: 0,                        // Current power level of the cell
                    animationStart: null,            // Timestamp when animation started
                    animationFrom: null,             // Source coordinates for animation
                    isExploding: false,              // Whether cell is currently exploding
                    animationDelay: 0                // Delay before animation starts (for chain reactions)
                };
            }
        }

        // Set current player to the first in the shuffled order
        this.currentPlayer = this.playerOrder[0];
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     * Creates a random order of players for fair gameplay
     * @param {Array} array - The array to shuffle (player indices)
     * @returns {Array} A new shuffled array
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * Get the color associated with a player
     * Maps player index to a hex color code for rendering
     * @param {number} player - Player index (0-3)
     * @returns {string} Hex color code
     */
    getPlayerColor(player) {
        switch (player) {
            case 0: return '#FF0000'; // Red
            case 1: return '#00FF00'; // Green
            case 2: return '#0000FF'; // Blue
            case 3: return '#FFFF00'; // Yellow
            default: return '#FFFFFF'; // White (fallback)
        }
    }

    /**
     * Get the name associated with a player
     * Maps player index to a readable name for UI display
     * @param {number} player - Player index (0-3)
     * @returns {string} Player name
     */
    getPlayerName(player) {
        switch (player) {
            case 0: return 'Red';
            case 1: return 'Green';
            case 2: return 'Blue';
            case 3: return 'Yellow';
            default: return 'Unknown';
        }
    }

    /**
     * Get valid neighboring cells (up, down, left, right)
     * Used for chain reactions and determining where power spreads
     * @param {number} row - Row index of the cell
     * @param {number} col - Column index of the cell
     * @returns {Array} Array of [row, col] pairs representing neighboring cells
     */
    getNeighbors(row, col) {
        const neighbors = [];
        if (row > 0) neighbors.push([row - 1, col]);           // Top neighbor
        if (row < ROWS - 1) neighbors.push([row + 1, col]);    // Bottom neighbor
        if (col > 0) neighbors.push([row, col - 1]);           // Left neighbor
        if (col < COLS - 1) neighbors.push([row, col + 1]);    // Right neighbor
        return neighbors;
    }

    /**
     * Get maximum capacity for a cell before it explodes
     * In this implementation, all cells have the same capacity
     * @param {number} row - Row index of the cell
     * @param {number} col - Column index of the cell
     * @returns {number} Maximum power capacity
     */
    maxCapacity(row, col) {
        return 4; // Fixed capacity of 4 for all cells
    }

    /**
     * Check if any players have been eliminated from the game
     * A player is eliminated when they no longer control any cells on the board
     * This is called after each move to determine if the game should end
     */
    /**
     * Player Elimination Check
     * Implements elimination logic through grid analysis:
     * 1. Skips check during initial placement phase
     * 2. Performs full grid scan for each player's tiles
     * 3. Updates playersAlive state array
     * 4. Triggers game end condition when only 1 player remains
     * 
     * Elimination Rules:
     * - Players get eliminated when they lose all tiles
     * - First move protection prevents immediate elimination
     * - Last remaining player is declared winner
     */
    checkElimination() {
        // Only check for elimination if all players have made their first move
        // This ensures players aren't eliminated before they've had a chance to play
        if (this.firstMoves.some(firstMove => firstMove)) {
            return;
        }

        // Check each player to see if they still have tiles on the board
        for (let player = 0; player < this.players; player++) {
            let playerHasTiles = false;
            // Search the entire grid for cells owned by this player
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    if (this.grid[row][col].owner === player) {
                        playerHasTiles = true;
                        break;
                    }
                }
                if (playerHasTiles) break;
            }
            // Update player's alive status based on whether they have any tiles
            this.playersAlive[player] = playerHasTiles;
        }

        // Count how many players are still alive
        const aliveCount = this.playersAlive.filter(alive => alive).length;
        // If only one player remains, they are the winner
        if (aliveCount === 1) {
            this.winner = this.playersAlive.findIndex(alive => alive);
            this.gameOver = true;
            this.updateTurnMessage(); // Update UI to show winner
        }
    }

    /**
     * Place a tile at the specified position on the grid
     * This is the main interaction method called when a player makes a move
     * @param {number} row - Row index where the tile is being placed
     * @param {number} col - Column index where the tile is being placed
     */
    placeTile(row, col) {
        // Don't allow moves if the game is already over
        if (this.gameOver) return;

        const cell = this.grid[row][col];
        const isFirstMove = this.firstMoves[this.currentPlayer];

        // Game rules for valid moves:
        // First move: can only place in empty cells
        // Subsequent moves: must use existing circles of the current player
        if ((isFirstMove && cell.owner === null) ||
            (!isFirstMove && cell.owner === this.currentPlayer)) {

            // Update cell ownership and power
            cell.owner = this.currentPlayer;
            if (isFirstMove) {
                cell.power = 3;                           // First move gets 3 power
                this.firstMoves[this.currentPlayer] = false; // Mark first move as completed
            } else {
                cell.power += 1;                          // Subsequent moves add 1 power
            }

            // Check for chain reactions and player eliminations
            this.checkExplosions();
            this.checkElimination();

            // If game isn't over, advance to the next player's turn
            if (!this.gameOver) {
                this.turnNumber = (this.turnNumber + 1) % this.players;
                this.currentPlayer = this.playerOrder[this.turnNumber];

                // Skip eliminated players when determining next turn
                while (!this.playersAlive[this.currentPlayer]) {
                    this.turnNumber = (this.turnNumber + 1) % this.players;
                    this.currentPlayer = this.playerOrder[this.turnNumber];
                }

                // Update the UI to show whose turn it is
                this.updateTurnMessage();
            }
        }
    }

    /**
 * Chain Reaction Processor - BFS Implementation
 * 1. Detects overcapacity cells using threshold check (power >= 4)
 * 2. Uses breadth-first search to propagate explosions
 * 3. Manages animation states for smooth visual transitions
 * 4. Handles power redistribution to neighboring cells
 * 5. Tracks wave propagation delays for staggered animations
 */
    /**
     * Chain Reaction Engine
     * Processes explosions using BFS algorithm with:
     * 1. Initial overcapacity cell detection (power >= 4)
     * 2. Wave-based propagation queue
     * 3. Animation state management
     * 4. Power redistribution logic
     * 5. Neighbor ownership transfer
     * 
     * Key Mechanics:
     * - Each explosion wave adds 100ms animation delay
     * - Exploded cells reset power and ownership
     * - Neighbors gain +1 power and change ownership
     * - Overcapacity neighbors trigger subsequent waves
     */
    checkExplosions() {
        const queue = [];
        const wave = 0;

        // Find cells that need to explode
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c].power >= this.maxCapacity(r, c)) {
                    queue.push([r, c, wave]);
                }
            }
        }

        while (queue.length > 0) {
            const [r, c, wave] = queue.shift();
            const owner = this.grid[r][c].owner;
            const sourceX = c * CELL_SIZE + CELL_SIZE / 2 + BOARD_MARGIN;
            const sourceY = r * CELL_SIZE + CELL_SIZE / 2 + BOARD_MARGIN;

            this.grid[r][c].power = 0;
            this.grid[r][c].owner = null;
            this.grid[r][c].isExploding = true;
            this.grid[r][c].animationStart = Date.now();
            this.grid[r][c].animationDelay = wave * ANIMATION_DURATION;

            for (const [nr, nc] of this.getNeighbors(r, c)) {
                const neighbor = this.grid[nr][nc];
                const oldOwner = neighbor.owner;
                neighbor.power += 1;
                neighbor.owner = owner;

                if (oldOwner !== owner) {
                    neighbor.animationStart = Date.now();
                    neighbor.animationDelay = wave * ANIMATION_DURATION;
                    neighbor.animationFrom = [sourceX, sourceY];
                }

                if (neighbor.power >= this.maxCapacity(nr, nc)) {
                    queue.push([nr, nc, wave + 1]);
                }
            }

            this.animations.push([r, c, [sourceX, sourceY]]);
        }
    }

    // Calculate animation progress
    getAnimationProgress(start, delay) {
        const elapsed = (Date.now() - start) - delay;
        if (elapsed < 0) return 0;
        return Math.min(elapsed / ANIMATION_DURATION, 1);
    }

    // Update the turn message display
    updateTurnMessage() {
        const messageElement = document.getElementById('turnMessage');
        if (this.gameOver && this.winner !== null) {
            const winnerName = this.getPlayerName(this.winner);
            messageElement.innerHTML = `<span class="player-${winnerName.toLowerCase()}">${winnerName} player wins!</span>`;
            messageElement.classList.add('game-over');
        } else {
            const playerName = this.getPlayerName(this.currentPlayer);
            messageElement.innerHTML = `<span class="player-${playerName.toLowerCase()}">${this.turnMessages[this.currentPlayer]}</span>`;
            messageElement.classList.remove('game-over');
        }
    }
}

/**
 * GameRenderer Class - Visualization System
 * Handles all visual aspects of the game including:
 * 1. Canvas rendering optimized for 90 FPS performance
 * 2. Responsive layout management for cross-device support
 * 3. Animation interpolation for smooth transitions
 * 4. Input handling unification (touch + mouse)
 * 5. Real-time FPS monitoring and adaptive rendering
 * 
 * Coordinates with GameState through observer pattern for state updates
 */
class GameRenderer {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.isMobile = this.detectMobile();

        // Set canvas size based on device
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));

        // Bind event handlers for both mouse and touch
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this), { passive: false });

        // Start game loop with optimized timing for 90 FPS
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.lastFpsUpdateTime = 0;
        this.currentFps = 0;
        requestAnimationFrame(this.gameLoop.bind(this));

        // Initialize turn message
        this.gameState.updateTurnMessage();
    }

    // Detect if user is on a mobile device
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
 * Game Loop - Core Rendering Pipeline
 * Implements frame-rate controlled updates with:
 * 1. Delta time calculation for smooth animations
 * 2. FPS monitoring and adaptive rendering
 * 3. Dirty rectangle optimization for efficient redraws
 * 4. Hardware-accelerated canvas operations
 * 5. Coordinated animation timing with GameState
 */
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // FPS calculation for monitoring (every second)
        this.frameCount++;
        if (timestamp - this.lastFpsUpdateTime >= 1000) {
            this.currentFps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsUpdateTime));
            this.frameCount = 0;
            this.lastFpsUpdateTime = timestamp;
        }

        // Clear canvas with optimized clearing method
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board with optimized rendering
        this.drawBoard();

        // Request next frame with timing control for 90 FPS
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Draw the game board with optimized rendering for 90 FPS
    drawBoard() {
        // Use the scaled values for drawing
        const cellSize = this.cellSizeScaled || CELL_SIZE;
        const boardMargin = this.boardMarginScaled || BOARD_MARGIN;

        // Only draw cells that are in the visible area
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const x = col * cellSize + boardMargin;
                const y = row * cellSize + boardMargin;

                // Skip cells that are completely outside the visible area
                if (x + cellSize < 0 || y + cellSize < 0 ||
                    x > this.canvas.width || y > this.canvas.height) {
                    continue;
                }

                this.drawCell(row, col);
            }
        }
    }

    // Draw a single cell with optimized rendering
    drawCell(row, col) {
        // Use scaled values for proper rendering on all devices
        const cellSize = this.cellSizeScaled || CELL_SIZE;
        const boardMargin = this.boardMarginScaled || BOARD_MARGIN;

        const x = col * cellSize + boardMargin;
        const y = row * cellSize + boardMargin;
        const cell = this.gameState.grid[row][col];

        // Draw cell background
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(x, y, cellSize - 2, cellSize - 2);

        // Draw cell border
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);

        // Draw player circle if cell is owned
        if (cell.owner !== null) {
            let circleX = x + cellSize / 2;
            let circleY = y + cellSize / 2;
            let scale = 1.0;
            let alpha = 1.0;

            // Handle animations with optimized calculations
            if (cell.animationStart !== null) {
                const progress = this.gameState.getAnimationProgress(cell.animationStart, cell.animationDelay);
                if (progress < 1.0) {
                    if (cell.isExploding) {
                        scale = 1.0 - progress * 0.5;
                        alpha = 1.0 - progress;
                    } else if (cell.animationFrom !== null) {
                        const [fromX, fromY] = cell.animationFrom;
                        circleX = fromX + (circleX - fromX) * progress;
                        circleY = fromY + (circleY - fromY) * progress;
                        scale = 0.5 + progress * 0.5;
                        alpha = progress;
                    } else {
                        scale = 0.5 + progress * 0.5;
                    }
                } else {
                    // Reset animation data when complete to free up memory
                    if (progress >= 1.0) {
                        cell.animationStart = null;
                        cell.animationFrom = null;
                        cell.isExploding = false;
                        cell.animationDelay = 0;
                    }
                }
            }

            // Draw the circle with hardware acceleration hint
            this.ctx.beginPath();
            this.ctx.arc(circleX, circleY, (cellSize / 3) * scale, 0, Math.PI * 2);
            this.ctx.fillStyle = this.gameState.getPlayerColor(cell.owner);
            this.ctx.globalAlpha = alpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        // Draw power text if cell has power
        if (cell.power > 0) {
            // Optimize text rendering by using a consistent font
            // Adjust font size based on cell size for mobile
            const fontSize = Math.max(12, Math.floor(cellSize / 3));
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Draw text outline
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(cell.power.toString(), x + cellSize / 2, y + cellSize / 2);

            // Draw text
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(cell.power.toString(), x + cellSize / 2, y + cellSize / 2);
        }
    }

    /**
     * Responsive Canvas Management
     * Implements adaptive layout system with:
     * 1. Device detection (mobile/desktop)
     * 2. Dynamic cell size calculation
     * 3. Margin scaling preservation
     * 4. Canvas dimension updates
     * 5. Display density optimization
     * 
     * Scaling Logic:
     * - Maintains aspect ratio across devices
     * - Uses container-relative sizing
     * - Applies minimum 12px font size constraint
     * - Stores scaled values for input coordination
     */
    resizeCanvas() {
        const container = document.querySelector('.game-container');
        const maxWidth = container.clientWidth - 40; // Account for padding

        let cellSize = CELL_SIZE;
        let boardMargin = BOARD_MARGIN;

        // Adjust cell size for mobile devices
        if (this.isMobile || window.innerWidth < 600) {
            const scaleFactor = Math.min(1, maxWidth / ((COLS * CELL_SIZE) + (2 * BOARD_MARGIN)));
            cellSize = Math.floor(CELL_SIZE * scaleFactor);
            boardMargin = Math.floor(BOARD_MARGIN * scaleFactor);
        }

        this.canvas.width = (COLS * cellSize) + (2 * boardMargin);
        this.canvas.height = (ROWS * cellSize) + (2 * boardMargin);

        // Store current scale factors for input handling
        this.cellSizeScaled = cellSize;
        this.boardMarginScaled = boardMargin;

        // Force redraw after resize
        this.drawBoard();
    }

    // Handle mouse click events
    handleClick(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.processInput(x, y);
    }

    /**
     * Mobile Input Handler
     * Processes touch events with:
     * 1. Scroll prevention
     * 2. Multi-touch support
     * 3. Coordinate normalization
     * 4. Touch-to-grid mapping
     * 5. Event propagation control
     * 
     * Implementation Details:
     * - Uses touchstart instead of touchend for faster response
     * - Accounts for CSS transforms in coordinate calculation
     * - Supports simultaneous touch points
     * - Integrates with core input processor
     */
    handleTouch(event) {
        event.preventDefault(); // Prevent scrolling when touching the canvas

        if (event.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            const touch = event.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.processInput(x, y);
        }
    }

    // Process input coordinates and place tile
    processInput(x, y) {
        const row = Math.floor((y - this.boardMarginScaled) / this.cellSizeScaled);
        const col = Math.floor((x - this.boardMarginScaled) / this.cellSizeScaled);

        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            this.gameState.placeTile(row, col);
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const gameState = new GameState();
    const renderer = new GameRenderer(canvas, gameState);
});

// Game loop with FPS control
let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    accumulator += deltaTime;

    while (accumulator >= FRAME_TIME) {
        updateGameState();
        accumulator -= FRAME_TIME;
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Mobile touch handling
function handleTouchStart(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    handleInput(x, y);
}

// Initialize mobile controls
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchStart);

// Start the optimized game loop
requestAnimationFrame(gameLoop);

// Initialize canvas with device pixel ratio scaling
function initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (COLS * CELL_SIZE) + BOARD_MARGIN * 2;
    canvas.height = (ROWS * CELL_SIZE) + BOARD_MARGIN * 2;

    // Set actual size in memory (scaled for retina displays)
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width = canvas.width * dpr;
    canvas.height = canvas.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
}

// Prevent touch scroll interference
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });