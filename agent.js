
class TicTacToeAgent {
    constructor(boardSize = 4, learningRate = 0.001, gamma = 0.9, epsilonDecay = 0.995) {
      this.boardSize = boardSize;
      this.learningRate = learningRate;
      this.gamma = gamma;
      this.epsilonDecay = epsilonDecay;
      this.epsilon = 1.0;
      this.memory = [];
      this.batchSize = 32;
     
    }
    
    convertToInputTensor(gameState) {
        const flatState = gameState.flat();
        return flatState;
    }
  
    storeExperience(state, action, reward, nextState) {
      this.memory.push({ state, action, reward, nextState });
    }
  
    async train(episodes, rate) {
      console.log(episodes)
      for (let episode = 0; episode < episodes; episode++) {
        let gameState = Array(this.boardSize * this.boardSize).fill('-'); 
        let gameActive = true;
  
        while (gameActive) {
          const actionX = await this.makeMove(gameState);
          gameState[actionX] = 'X';
          if (this.checkWin(gameState, 'X')) {
            this.storeExperience(gameState, actionX, this.assignReward('X wins!'), Array(this.boardSize * this.boardSize).fill('-'));
            gameActive = false;
            console.log("X won")
            console.log(gameState)
            break;
          } else if (this.checkDraw(gameState)) {
            this.storeExperience(gameState, actionX, this.assignReward("It's a draw!"), Array(this.boardSize * this.boardSize).fill('-'));
            gameActive = false;
            break;
          }
  
          const actionO = await this.makeMove(gameState);
          gameState[actionO] = 'O';
          if (this.checkWin(gameState, 'O')) {
            this.storeExperience(gameState, actionO, this.assignReward('O wins!'), Array(this.boardSize * this.boardSize).fill('-'));
            gameActive = false;
            console.log("O won")
            break;
          } else if (this.checkDraw(gameState)) {
            this.storeExperience(gameState, actionO, this.assignReward("It's a draw!"), Array(this.boardSize * this.boardSize).fill('-'));
            gameActive = false;
            break;
          }
        }
      }
      await this.saveAgent();
  
    }
   
    async makeMove(gameState) {
      if (Math.random() < this.epsilon) {
        const availableMoves = gameState.map((cell, index) => (cell === '-' ? index : -1)).filter((index) => index !== -1);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      } else {
        const inputTensor = this.convertToInputTensor(gameState);
        const qValues = await this.model.predict(inputTensor);
        const qValuesArray = await qValues.array();
        const availableMoves = gameState.map((cell, index) => (cell === '-' ? index : -1)).filter((index) => index !== -1);
        const legalMovesQValues = availableMoves.map((move) => qValuesArray[0][move]);
        const bestMoveIndex = availableMoves[legalMovesQValues.indexOf(Math.max(...legalMovesQValues))];
        qValues.dispose();
        inputTensor.dispose();
        return bestMoveIndex;
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
        [0, 1, 2], [1, 2, 3], // Top row
        [4, 5, 6], [5, 6, 7], // Middle row
        [8, 9, 10], [9, 10, 11], // Bottom row
        [12, 13, 14], [13, 14, 15], // Last row
        [0, 4, 8], [4, 8, 12], // Left column
        [1, 5, 9], [5, 9, 13], // 2nd column
        [2, 6, 10], [6, 10, 14], // 3rd column
        [3, 7, 11], [7, 11, 15], // Right column
        [0, 5, 10], [5, 10, 15], // Diagonal from top-left to bottom-right
        [3, 6, 9], [6, 9, 12] // Diagonal from top-right to bottom-left
      ];
  
      return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        if (gameState[a] === player && gameState[b] === player && gameState[c] === player) {
          console.log(`Player ${player} wins with combination: ${combination}`);
          return true;
        }
      });
    }
  
    checkDraw(gameState) {
      return gameState.every(cell => cell !== '-');
    }
    async saveAgent() {
        const agentData = {
            boardSize: this.boardSize,
            learningRate: this.learningRate,
            gamma: this.gamma,
            epsilonDecay: this.epsilonDecay,
            epsilon: this.epsilon,
            memory: this.memory,
            batchSize: this.batchSize
        };

        localStorage.setItem('agentData', JSON.stringify(agentData));
        console.log("Agent saved.");
    }
  
    async playAgainstAgent() {
      const ticTacToe = new TicTacToeAgent();
      let gameState = Array(this.boardSize * this.boardSize).fill('-'); 
      let gameActive = true;
  
      while (gameActive) {
        const actionX = await this.makeMove(gameState);
        gameState[actionX] = 'X';
        if (this.checkWin(gameState, 'X')) {
          console.log("X won")
          console.log(gameState)
          gameActive = false;
          break;
        } else if (this.checkDraw(gameState)) {
          console.log("It's a draw!")
          gameActive = false;
          break;
        }
  
        const actionO = await this.makeMove(gameState);
        gameState[actionO] = 'O';
        if (this.checkWin(gameState, 'O')) {
          console.log("O won")
          break;
        } else if (this.checkDraw(gameState)) {
          console.log("It's a draw!")
          break;
        }
      }
    }
  }
