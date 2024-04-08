class TicTacToeAgent {
  constructor(
    boardSize = 3,
    learningRate = 0.001,
    gamma = 0.9,
    epsilonDecay = 0.995,
  ) {
    this.boardSize = boardSize;
    this.learningRate = learningRate;
    this.gamma = gamma;
    this.epsilonDecay = epsilonDecay;
    this.epsilon = 1.0;
    this.qTable = {};
    this.memory = [];
    this.batchSize = 32;
    this.winCounts = { X: 0, O: 0, Draw: 0 };
    this.highestWinningPercentage = 0;
    this.bestAgentData = null;
  }

  convertToInputTensor(gameState) {
    const flatState = gameState.flat();
    return flatState;
  }

  storeExperience(state, action, reward, nextState) {
    this.memory.push({ state, action, reward, nextState });
  }

  updateWinCounts(outcome) {
    if (outcome === 'X wins!') {
      this.winCounts.X++;
    } else if (outcome === 'O wins!') {
      this.winCounts.O++;
    } else {
      this.winCounts.Draw++;
    }

    const totalGames =
      this.winCounts.X + this.winCounts.O + this.winCounts.Draw;
    const winPercentage = (this.winCounts.X / totalGames) * 100;
    if (winPercentage > this.highestWinningPercentage) {
      this.highestWinningPercentage = winPercentage;
      this.bestAgentData = {
        boardSize: this.boardSize,
        learningRate: this.learningRate,
        gamma: this.gamma,
        epsilonDecay: this.epsilonDecay,
        epsilon: this.epsilon,
        memory: this.memory,
        batchSize: this.batchSize,
        winCounts: { ...this.winCounts },
      };
    }
  }

  async train(episodes) {
    for (let episode = 0; episode < episodes; episode++) {
      let gameState = Array(this.boardSize * this.boardSize).fill('-');
      let gameActive = true;

      while (gameActive) {
        const actionX = await this.makeMove(gameState);
        gameState[actionX] = 'X';
        if (this.checkWin(gameState, 'X')) {
          this.storeExperience(
            gameState,
            actionX,
            this.assignReward('X wins!'),
            Array(this.boardSize * this.boardSize).fill('-'),
          );
          this.updateWinCounts('X wins!');
          gameActive = false;
          break;
        } else if (this.checkDraw(gameState)) {
          this.storeExperience(
            gameState,
            actionX,
            this.assignReward("It's a draw!"),
            Array(this.boardSize * this.boardSize).fill('-'),
          );
          this.updateWinCounts("It's a draw!");
          gameActive = false;
          break;
        }

        const actionO = await this.makeMove(gameState);
        gameState[actionO] = 'O';
        if (this.checkWin(gameState, 'O')) {
          this.storeExperience(
            gameState,
            actionO,
            this.assignReward('O wins!'),
            Array(this.boardSize * this.boardSize).fill('-'),
          );
          this.updateWinCounts('O wins!');
          gameActive = false;
          break;
        } else if (this.checkDraw(gameState)) {
          this.storeExperience(
            gameState,
            actionO,
            this.assignReward("It's a draw!"),
            Array(this.boardSize * this.boardSize).fill('-'),
          );
          this.updateWinCounts("It's a draw!");
          gameActive = false;
          break;
        }
      }
    }

    this.saveBestAgent();
  }

  // makeMove(gameState) {
  //   if (Math.random() < this.epsilon) {
  //     const availableMoves = gameState
  //       .map((cell, index) => (cell === '-' ? index : -1))
  //       .filter((index) => index !== -1);
  //     return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  //   } else {
  //     // Use Q-table to make a move
  //     const stateIndex = this.getStateIndex(gameState);
  //     const qValues = this.qTable[stateIndex];
  //     const availableMoves = gameState
  //       .map((cell, index) => (cell === '-' ? index : -1))
  //       .filter((index) => index !== -1);
  //     const legalMovesQValues = availableMoves.map((move) => qValues[move]);
  //     const bestMoveIndex =
  //       availableMoves[
  //         legalMovesQValues.indexOf(Math.max(...legalMovesQValues))
  //       ];
  //     // console.log(bestMoveIndex);
  //     return bestMoveIndex;
  //   }
  // }
  makeMove(gameState) {
    // Function to check if a move blocks the opponent from winning
    const blockOpponentWinningMove = (gameState, index) => {
      const opponent = this.currentPlayer === 'X' ? 'O' : 'X';
      const nextState = [...gameState];
      nextState[index] = opponent;
      return this.checkWin(nextState, opponent);
    };

    // Function to check if a move leads to winning
    const winningMove = (gameState, index) => {
      const nextState = [...gameState];
      nextState[index] = this.currentPlayer;
      return this.checkWin(nextState, this.currentPlayer);
    };

    // Prioritize winning moves
    const winningMoves = gameState
      .map((cell, index) => (cell === '-' && winningMove(gameState, index) ? index : -1))
      .filter(index => index !== -1);

    if (winningMoves.length > 0) {
      // Make a winning move if available
      return winningMoves[0];
    }

    // If no winning move, prioritize blocking the opponent from winning
    const opponentWinningMoves = gameState
      .map((cell, index) => (cell === '-' && blockOpponentWinningMove(gameState, index) ? index : -1))
      .filter(index => index !== -1);

    if (opponentWinningMoves.length > 0) {
      // Block the opponent from winning
      return opponentWinningMoves[0];
    } else {
      // If no immediate threat or winning move, proceed with the default strategy
      if (Math.random() < this.epsilon) {
        // Random move with epsilon-greedy policy
        const availableMoves = gameState
          .map((cell, index) => (cell === '-' ? index : -1))
          .filter(index => index !== -1);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      } else {
        // Use Q-table to make a move
        const stateIndex = this.getStateIndex(gameState);
        const qValues = this.qTable[stateIndex];
        const availableMoves = gameState
          .map((cell, index) => (cell === '-' ? index : -1))
          .filter(index => index !== -1);
        const legalMovesQValues = availableMoves.map(move => qValues[move]);
        const bestMoveIndex = availableMoves[legalMovesQValues.indexOf(Math.max(...legalMovesQValues))];
        return bestMoveIndex;
      }
    }
  }


  assignReward(outcome) {
    if (outcome === 'X wins!') {
      return 1;
    } else if (outcome === 'O wins!') {
      return -1;
    } else {
      return 0;
    }
  }

  checkWin(gameState, player) {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];


    return winningCombinations.some((combination) => {
      const [a, b, c] = combination;
      if (
        gameState[a] === player &&
        gameState[b] === player &&
        gameState[c] === player
      ) {
        // console.log(`Player ${player} wins with combination: ${combination}`);
        return true;
      }
    });
  }

  checkDraw(gameState) {
    return gameState.every((cell) => cell !== '-');
  }

  async saveBestAgent() {
    localStorage.setItem('bestAgentData', JSON.stringify(this.bestAgentData));
    console.log('Best agent saved.');
  }
}
