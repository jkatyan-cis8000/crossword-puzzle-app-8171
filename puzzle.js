class CrosswordPuzzle {
  constructor(wordsData) {
    this.gridSize = wordsData.gridSize;
    this.words = wordsData.words;
    this.cellMapping = wordsData.cellMapping;
    this.userGrid = this.createEmptyGrid();
    this.filledCells = new Set();
    this.correctAnswers = new Set();
  }

  createEmptyGrid() {
    const grid = [];
    for (let row = 0; row < this.gridSize; row++) {
      grid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        grid[row][col] = null;
      }
    }
    return grid;
  }

  getWordByNumber(number, direction) {
    return this.words.find(
      (w) => w.number === number && w.direction === direction
    );
  }

  getWordsByDirection(direction) {
    return this.words.filter((w) => w.direction === direction);
  }

  isValidPosition(row, col) {
    return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
  }

  placeLetter(row, col, letter) {
    if (!this.isValidPosition(row, col)) {
      return { success: false, error: 'Invalid position' };
    }

    const cellKey = `${row},${col}`;
    const wordsAtCell = this.cellMapping[cellKey];

    if (!wordsAtCell || wordsAtCell.length === 0) {
      return { success: false, error: 'No words at this position' };
    }

    const upperLetter = letter.toUpperCase();
    this.userGrid[row][col] = upperLetter;
    this.filledCells.add(cellKey);

    const wordId = wordsAtCell[0];
    const word = this.words.find((w) => w.id === wordId);
    if (!word) {
      return { success: false, error: 'Word not found' };
    }

    const index = word.direction === 'across' ? col - word.startCol : row - word.startRow;
    const isCorrect = upperLetter === word.answer[index];
    if (isCorrect) {
      this.correctAnswers.add(cellKey);
    }

    return { success: true, isCorrect };
  }

  checkWord(wordId) {
    const word = this.words.find((w) => w.id === wordId);
    if (!word) return false;

    for (let i = 0; i < word.length; i++) {
      const row = word.startRow + (word.direction === 'down' ? i : 0);
      const col = word.startCol + (word.direction === 'across' ? i : 0);
      const cellKey = `${row},${col}`;
      const letter = this.userGrid[row][col];

      if (letter !== word.answer[i]) {
        return false;
      }
    }

    return true;
  }

  checkIntersection(row, col) {
    if (!this.isValidPosition(row, col)) return false;

    const cellKey = `${row},${col}`;
    const wordsAtCell = this.cellMapping[cellKey];
    if (!wordsAtCell || wordsAtCell.length < 2) return true;

    const letters = wordsAtCell.map((wordId) => {
      const word = this.words.find((w) => w.id === wordId);
      if (!word) return null;

      const index =
        word.direction === 'across' ? col - word.startCol : row - word.startRow;
      if (index < 0 || index >= word.length) return null;

      return this.userGrid[row][col];
    });

    return letters.every((letter) => letter === letters[0]) && letters[0] !== null;
  }

  isWordComplete(wordId) {
    const word = this.words.find((w) => w.id === wordId);
    if (!word) return false;

    for (let i = 0; i < word.length; i++) {
      const row = word.startRow + (word.direction === 'down' ? i : 0);
      const col = word.startCol + (word.direction === 'across' ? i : 0);
      const letter = this.userGrid[row][col];

      if (letter === null || letter !== word.answer[i]) {
        return false;
      }
    }

    return true;
  }

  isPuzzleComplete() {
    for (const word of this.words) {
      if (!this.isWordComplete(word.id)) {
        return false;
      }
    }

    for (const row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cellKey = `${row},${col}`;
        if (this.cellMapping[cellKey]) {
          if (this.userGrid[row][col] === null) {
            return false;
          }
        }
      }
    }

    return true;
  }

  getFilledCellsCount() {
    return this.filledCells.size;
  }

  getTotalCellsCount() {
    let count = 0;
    for (const row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cellKey = `${row},${col}`;
        if (this.cellMapping[cellKey]) {
          count++;
        }
      }
    }
    return count;
  }

  getProgress() {
    const total = this.getTotalCellsCount();
    const filled = this.getFilledCellsCount();
    return Math.round((filled / total) * 100);
  }

  reset() {
    this.userGrid = this.createEmptyGrid();
    this.filledCells.clear();
    this.correctAnswers.clear();
  }

  checkAllWords() {
    const results = {};
    for (const word of this.words) {
      results[word.id] = this.isWordComplete(word.id);
    }
    return results;
  }
}
