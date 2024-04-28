class TicTacToeAgent {
  constructor() {
    this.board = [
      ['-', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-'],
    ];
    this.players = ['X', 'O'];
    this.num_players = this.players.length;
    this.Q = {};
    this.learningRate = 0.001;
    this.discountFactor = 0.5;
    this.explorationRate = 0.25;
    this.numEpisodes = 1000;
  }

  // printBoard() {
  //   for (let row of this.board) {
  //     console.log(row.join('  |  '));
  //     console.log('---------------');
  //   }
  // }

  boardToString() {
    return this.board.flat().join('');
  }

  isGameOver() {
    for (let row of this.board) {
      if (new Set(row).size === 1 && row[0] !== '-') {
        return [true, row[0]];
      }
    }

    const transpose = this.board[0].map((_, colIndex) =>
      this.board.map((row) => row[colIndex]),
    );
    for (let col of transpose) {
      if (new Set(col).size === 1 && col[0] !== '-') {
        return [true, col[0]];
      }
    }

    const mainDiagonal = this.board.map((row, index) => row[index]);
    const antiDiagonal = this.board.map(
      (row, index) => row[row.length - index - 1],
    );
    if (new Set(mainDiagonal).size === 1 && mainDiagonal[0] !== '-') {
      return [true, mainDiagonal[0]];
    }
    if (new Set(antiDiagonal).size === 1 && antiDiagonal[0] !== '-') {
      return [true, antiDiagonal[0]];
    }

    if (!this.board.flat().includes('-')) {
      return [true, 'draw'];
    }

    return [false, ''];
  }

  chooseAction() {
    const state = this.boardToString();
    console.log(this.Q[state]);
    if (Math.random() < this.explorationRate || !(state in this.Q)) {
      const emptyCells = this.board.reduce((acc, row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === '-') acc.push([rowIndex, colIndex]);
        });
        return acc;
      }, []);
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
      const qValues = this.Q[state];
      const emptyCells = this.board.reduce((acc, row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === '-') acc.push([rowIndex, colIndex]);
        });
        return acc;
      }, []);
      const emptyQValues = emptyCells.map((cell) => qValues[cell[0]][cell[1]]);
      const maxQValue = Math.max(...emptyQValues);
      const maxQIndices = emptyQValues.reduce((acc, val, index) => {
        if (val === maxQValue) acc.push(index);
        return acc;
      }, []);
      const maxQIndex =
        maxQIndices[Math.floor(Math.random() * maxQIndices.length)];
      return emptyCells[maxQIndex];
    }
  }

  boardNextState(cell) {
    const nextBoard = this.board.map((row) => [...row]);
    nextBoard[cell[0]][cell[1]] = this.players[0];
    return nextBoard;
  }

  updateQTable(state, action, nextState, reward) {
    const qValues =
      this.Q[state] || Array.from({ length: 3 }, () => Array(3).fill(0));

    const nextQValues =
      this.Q[this.boardToString(nextState)] ||
      Array.from({ length: 3 }, () => Array(3).fill(0));
    const maxNextQValue = Math.max(...nextQValues.flat());

    qValues[action[0]][action[1]] +=
      this.learningRate *
      (reward +
        this.discountFactor * maxNextQValue -
        qValues[action[0]][action[1]]);
    console.log(this.boardToString(nextState));
    this.Q[state] = qValues;
  }

  startTrain(episodes, learningRate) {
    this.numEpisodes = episodes;
    this.learningRate = learningRate;
    for (let episode = 0; episode < this.numEpisodes; episode++) {
      this.board = Array.from({ length: 3 }, () => Array(3).fill('-'));

      let current_player =
        this.players[Math.floor(Math.random() * this.num_players)];
      let isGameOverState = false;
      let winner;

      while (!isGameOverState) {
        const action = this.chooseAction();

        if (action) {
          const [row, col] = action;
          this.board[row][col] = current_player;
        } else {
          console.error('Action is undefined');
          break;
        }

        [isGameOverState, winner] = this.isGameOver();

        if (isGameOverState) {
          let reward;
          if (winner === current_player) reward = 1;
          else if (winner === 'draw') reward = 0.5;
          else reward = 0;
          this.updateQTable(this.boardToString(), action, this.board, reward);
        } else {
          current_player =
            this.players[
              (this.players.indexOf(current_player) + 1) % this.num_players
            ];
        }

        if (!isGameOverState) {
          const nextState = this.boardNextState(action);
          this.updateQTable(this.boardToString(), action, nextState, 0);
        }
      }

      this.explorationRate *= 0.99;
      console.log('Here');
    }
    localStorage.setItem('QState', JSON.stringify(this.Q));
    return true;
  }
  // playVsHuman() {
  //   let current_player =
  //     this.players[Math.floor(Math.random() * this.num_players)];
  //   let isGameOverState = false;
  //   let winner;
  //   this.board = [
  //     ['-', '-', '-'],
  //     ['-', '-', '-'],
  //     ['-', '-', '-'],
  //   ];

  //   while (!isGameOverState) {
  //     // Agent's turn
  //     if (current_player === 'X') {
  //       const action = this.chooseAction();
  //       const [row, col] = action;
  //       this.board[row][col] = current_player;
  //     } else {
  //       // Human's turn
  //       this.printBoard();
  //       let row = parseInt(prompt('Enter the row (0-2): '));
  //       let col = parseInt(prompt('Enter the column (0-2): '));
  //       while (
  //         isNaN(row) ||
  //         isNaN(col) ||
  //         row < 0 ||
  //         row > 2 ||
  //         col < 0 ||
  //         col > 2 ||
  //         this.board[row][col] !== '-'
  //       ) {
  //         console.log('Invalid input. Please enter again.');
  //         row = parseInt(prompt('Enter the row (0-2): '));
  //         col = parseInt(prompt('Enter the column (0-2): '));
  //       }
  //       this.board[row][col] = current_player;
  //     }

  //     // Check if game is over
  //     [isGameOverState, winner] = this.isGameOver();
  //     if (isGameOverState) {
  //       this.printBoard();
  //       if (winner === 'X') {
  //         console.log('Agent wins!');
  //       } else if (winner === 'O') {
  //         console.log('Human wins!');
  //       } else {
  //         console.log("It's a draw!");
  //       }
  //     } else {
  //       // Switch player
  //       current_player =
  //         this.players[
  //           (this.players.indexOf(current_player) + 1) % this.num_players
  //         ];
  //     }
  //   }
  // }

  loadQState() {
    // Load the Q-state from memory (e.g., localStorage)
    const savedQState = localStorage.getItem('QState');
    if (savedQState) {
      this.Q = JSON.parse(savedQState);
    }
  }
  agentTurn(board) {
    this.board = board;
    const action = this.chooseAction();

    return action;
  }
}
