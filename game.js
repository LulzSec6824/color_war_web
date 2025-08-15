document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const turnMessage = document.getElementById('turnMessage');
    const cols = 8;
    const rows = 10;
    const num_players = 4;
    let players = Array.from({ length: num_players }, (_, i) => i + 1);
    let currentPlayerIndex = 0;
    let board = Array(rows * cols).fill(null).map(() => ({ orbs: 0, player: null }));
    let playerColors = {
        1: '#ff4136',
        2: '#2ecc40',
        3: '#0074d9',
        4: '#ffdc00'
    };
    let playerNames = {
        1: 'Red',
        2: 'Green',
        3: 'Blue',
        4: 'Yellow'
    };
    let isAnimating = false;
    let placementPhase = true;
    let initialPlacements = 0;

    function getThreshold() {
        return 4;
    }

    function createBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            const handler = () => handleCellClick(i);
            cell.addEventListener('click', handler);
            cell.addEventListener('touchend', (e) => {
                e.preventDefault();
                handler();
            });
            gameBoard.appendChild(cell);
        }
        updateBoard();
        updateTurnMessage();
    }

    function handleCellClick(index) {
        if (isAnimating) return;

        if (placementPhase) {
            handleInitialPlacement(index);
            return;
        }

        const cellData = board[index];
        if (cellData.player !== players[currentPlayerIndex]) {
            return; // Can only add to own cells
        }

        addOrb(index, players[currentPlayerIndex]);
    }

    function handleInitialPlacement(index) {
        if (board[index].player === null) {
            const currentPlayer = players[currentPlayerIndex];
            board[index].player = currentPlayer;
            board[index].orbs = 3;
            initialPlacements++;
            updateBoard();

            if (initialPlacements >= num_players) {
                placementPhase = false;
                currentPlayerIndex = -1;
            }
            nextTurn();
        }
    }

    function addOrb(index, player) {
        isAnimating = true;
        addOrbAndChainReaction(index, player).then(() => {
            isAnimating = false;
            if (checkWinCondition()) {
                return;
            }
            nextTurn();
        });
    }

    async function addOrbAndChainReaction(index, player) {
        const originalPlayer = board[index].player;
        const isConversion = originalPlayer !== null && originalPlayer !== player;

        board[index].orbs++;
        board[index].player = player;
        updateBoard();

        const threshold = getThreshold();
        let shouldExplode = board[index].orbs >= threshold;

        if (isConversion && board[index].orbs === 3) {
            shouldExplode = true;
        }

        if (!shouldExplode) {
            return;
        }

        // Explode
        const x = index % cols;
        const y = Math.floor(index / cols);
        board[index].orbs = 0;
        board[index].player = null;
        updateBoard(); // show empty cell

        await new Promise(resolve => setTimeout(resolve, 50)); // short pause

        const neighbors = [
            { dx: -1, dy: 0, animation: 'explode-left' },
            { dx: 1, dy: 0, animation: 'explode-right' },
            { dx: 0, dy: -1, animation: 'explode-up' },
            { dx: 0, dy: 1, animation: 'explode-down' }
        ];

        const sourceCell = document.querySelector(`[data-index="${index}"]`);

        const explosionPromises = [];
        for (const neighbor of neighbors) {
            const newX = x + neighbor.dx;
            const newY = y + neighbor.dy;

            if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
                const tempOrb = document.createElement('div');
                tempOrb.classList.add('orb', `player-${player}`);
                tempOrb.style.animation = `${neighbor.animation} 0.3s ease-out forwards`;
                sourceCell.appendChild(tempOrb);
                setTimeout(() => tempOrb.remove(), 300);

                const neighborIndex = newY * cols + newX;
                explosionPromises.push(addOrbAndChainReaction(neighborIndex, player));
            }
        }
        await Promise.all(explosionPromises);
    }

    function updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const cellData = board[index];
            cell.innerHTML = '';
            if (cellData.player !== null) {
                cell.classList.add('occupied');
                const orb = document.createElement('div');
                orb.classList.add('orb', `player-${cellData.player}`);
                orb.textContent = cellData.orbs;
                cell.appendChild(orb);
            } else {
                cell.classList.remove('occupied');
            }
        });
    }

    function nextTurn() {
        if (placementPhase) {
            currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            updateTurnMessage();
            isAnimating = false;
            return;
        }
        const activePlayers = [...new Set(board.filter(c => c.player !== null).map(c => c.player))];

        if (players.length > 1 && activePlayers.length < players.length && board.some(c => c.player)) {
            players = players.filter(p => activePlayers.includes(p));
        }

        if (players.length <= 1) return;

        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updateTurnMessage();
        isAnimating = false;
    }

    function updateTurnMessage() {
        if (placementPhase) {
            const currentPlayer = players[currentPlayerIndex];
            const playerName = playerNames[currentPlayer];
            turnMessage.textContent = `${playerName}, select your start box.`;
            turnMessage.style.backgroundColor = playerColors[currentPlayer];
            turnMessage.style.color = (currentPlayer === 4) ? '#333' : 'white';
            turnMessage.classList.add('flash');
            setTimeout(() => {
                turnMessage.classList.remove('flash');
            }, 500);
            return;
        }
        if (players.length <= 1) return;
        const currentPlayer = players[currentPlayerIndex];
        const playerName = playerNames[currentPlayer];
        turnMessage.textContent = `${playerName} player's turn - Place your tile!`;
        turnMessage.style.backgroundColor = playerColors[currentPlayer];
        turnMessage.style.color = (currentPlayer === 4) ? '#333' : 'white';
        turnMessage.classList.add('flash');
        setTimeout(() => {
            turnMessage.classList.remove('flash');
        }, 500);
    }

    function checkWinCondition() {
        const boardPlayers = new Set(board.filter(c => c.player).map(c => c.player));

        if (board.some(c => c.player) && boardPlayers.size === 1) {
            const winner = boardPlayers.values().next().value;
            turnMessage.textContent = `${playerNames[winner]} wins!`;
            turnMessage.style.backgroundColor = playerColors[winner];
            turnMessage.style.color = (winner === 4) ? '#333' : 'white';

            // Disable further clicks
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                const newCell = cell.cloneNode(true);
                cell.parentNode.replaceChild(newCell, cell);
            });
            players = [winner];
            return true;
        }
        return false;
    }

    createBoard();
    updateTurnMessage();
});