document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            themeToggle.classList.remove('fa-moon');
            themeToggle.classList.add('fa-sun');
        } else {
            themeToggle.classList.remove('fa-sun');
            themeToggle.classList.add('fa-moon');
        }
    });

    const gameBoard = document.getElementById('game-board');
    const turnMessage = document.getElementById('turnMessage');
    const playerSelection = document.getElementById('player-selection');
    const gameContainer = document.querySelector('.game-container');
    const welcomeMessage = document.getElementById('welcome-message');
    const winnerDisplay = document.getElementById('winner-display');
    const evaluationBoxes = [
        document.getElementById('evaluation-box-1'),
        document.getElementById('evaluation-box-2'),
        document.getElementById('evaluation-box-3'),
        document.getElementById('evaluation-box-4')
    ];
    let cols = 8;
    let rows = 10;
    let num_players;
    let players;
    let initialPlayers;
    let currentPlayerIndex;
    let board;
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

    window.startGame = function (selectedPlayers) {
        num_players = selectedPlayers;
        if (num_players === 2) {
            cols = 6;
            rows = 6;
        } else {
            cols = 8;
            rows = 8;
        }

        players = Array.from({
            length: num_players
        }, (_, i) => i + 1);
        initialPlayers = [...players];
        currentPlayerIndex = 0;
        board = Array(rows * cols).fill(null).map(() => ({
            orbs: 0,
            player: null
        }));

        playerSelection.style.display = 'none';
        welcomeMessage.style.display = 'none';
        gameContainer.style.display = 'block';

        createBoard();
        updateTurnMessage();
        updateEvaluationBoxes();
    }

    function getThreshold() {
        return 4;
    }

    function createBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        gameBoard.style.aspectRatio = `${cols} / ${rows}`;
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
        board[index].orbs++;
        board[index].player = player;
        updateBoard();

        if (board[index].orbs < getThreshold()) {
            return;
        }

        // Explode
        const x = index % cols;
        const y = Math.floor(index / cols);
        board[index].orbs = 0;
        board[index].player = null;
        updateBoard(); // show empty cell

        await new Promise(resolve => setTimeout(resolve, 50)); // short pause

        const neighbors = [{
            dx: -1,
            dy: 0,
            animation: 'explode-left'
        }, {
            dx: 1,
            dy: 0,
            animation: 'explode-right'
        }, {
            dx: 0,
            dy: -1,
            animation: 'explode-up'
        }, {
            dx: 0,
            dy: 1,
            animation: 'explode-down'
        }];

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

                const dotsContainer = document.createElement('div');
                dotsContainer.classList.add('dots-container');
                dotsContainer.dataset.orbs = cellData.orbs;

                for (let i = 0; i < cellData.orbs; i++) {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    dotsContainer.appendChild(dot);
                }

                orb.appendChild(dotsContainer);
                cell.appendChild(orb);
            } else {
                cell.classList.remove('occupied');
            }
        });
        updateScores();
    }

    function updateEvaluationBoxes() {
        evaluationBoxes.forEach(box => box.style.display = 'none');

        for (let i = 0; i < num_players; i++) {
            const player = players[i];
            let boxIndex = i;
            if (num_players === 2 && i === 1) {
                boxIndex = 3; // Player 2 gets box 4 (index 3) for opposite corner
            }

            const box = evaluationBoxes[boxIndex];
            if (box) {
                box.style.display = 'block';
                box.style.backgroundColor = playerColors[player];
                box.style.color = (player === 4) ? '#333' : 'white';
                box.textContent = '0';
            }
        }
    }

    function updateScores() {
        const scores = {};
        initialPlayers.forEach(p => scores[p] = 0);

        for (const cell of board) {
            if (cell.player) {
                scores[cell.player] += cell.orbs;
            }
        }

        initialPlayers.forEach((player, i) => {
            let boxIndex = i;
            if (num_players === 2 && i === 1) {
                boxIndex = 3;
            }

            const box = evaluationBoxes[boxIndex];
            if (box) {
                if (players.includes(player)) {
                    box.textContent = scores[player] || 0;
                } else {
                    box.style.display = 'none';
                }
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
            updateScores();
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
            document.body.style.backgroundColor = playerColors[currentPlayer];
            turnMessage.classList.add('flash');
            setTimeout(() => {
                turnMessage.classList.remove('flash');
            }, 500);
            return;
        }
        if (players.length <= 1) return;
        const currentPlayer = players[currentPlayerIndex];
        const playerName = playerNames[currentPlayer];
        turnMessage.textContent = `${playerName} player\'s turn`;
        turnMessage.style.backgroundColor = playerColors[currentPlayer];
        turnMessage.style.color = (currentPlayer === 4) ? '#333' : 'white';
        document.body.style.backgroundColor = playerColors[currentPlayer];
        turnMessage.classList.add('flash');
        setTimeout(() => {
            turnMessage.classList.remove('flash');
        }, 500);
    }

    function checkWinCondition() {
        const boardPlayers = new Set(board.filter(c => c.player).map(c => c.player));

        if (board.some(c => c.player) && boardPlayers.size === 1) {
            const winner = boardPlayers.values().next().value;
            winnerDisplay.textContent = `${playerNames[winner]} wins!`;
            turnMessage.style.backgroundColor = playerColors[winner];
            turnMessage.style.color = (winner === 4) ? '#333' : 'white';
            document.body.style.backgroundColor = playerColors[winner];

            // Disable further clicks
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                const newCell = cell.cloneNode(true);
                cell.parentNode.replaceChild(newCell, cell);
            });
            players = [winner];
            updateScores();
            return true;
        }
        return false;
    }
});