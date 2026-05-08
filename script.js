// Crossword Puzzle Game Logic

// Game state
let currentWord = null;
let currentDirection = 'across';
let puzzleData = null;
let filledCells = {};
let completedWords = new Set();

// DOM Elements
let gridElement = document.getElementById('grid');
let clueNumberInput = document.getElementById('clue-number');
let letterInput = document.getElementById('letter-input');
let clearCellBtn = document.getElementById('clear-cell');
let checkAnswerBtn = document.getElementById('check-answer');
let acrossCluesList = document.getElementById('across-clues');
let downCluesList = document.getElementById('down-clues');
let currentWordDisplay = document.getElementById('current-word');
let completionModal = document.getElementById('completion-modal');
let restartBtn = document.getElementById('restart-btn');
let directionButtons = document.querySelectorAll('.direction-btn');

// Load puzzle data
async function loadPuzzleData() {
    try {
        const response = await fetch('words.json');
        puzzleData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading puzzle data:', error);
        return false;
    }
}

// Initialize the game
async function initGame() {
    if (!await loadPuzzleData()) {
        alert('Failed to load puzzle data');
        return;
    }
    
    createGrid();
    createClueLists();
    setupEventListeners();
    
    // Select first word by default
    selectWord(1, 'across');
}

// Create the crossword grid
function createGrid() {
    gridElement.innerHTML = '';
    
    for (let row = 0; row < puzzleData.gridSize; row++) {
        for (let col = 0; col < puzzleData.gridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const cellKey = `${row},${col}`;
            const wordIds = puzzleData.cellMapping[cellKey];
            
            if (wordIds) {
                // Find if this cell has a word starting here
                const startingWord = puzzleData.words.find(word => 
                    word.startRow === row && 
                    word.startCol === col
                );
                
                if (startingWord) {
                    const numberSpan = document.createElement('span');
                    numberSpan.className = 'cell-number';
                    numberSpan.textContent = startingWord.number;
                    cell.appendChild(numberSpan);
                }
            } else {
                cell.classList.add('black');
            }
            
            gridElement.appendChild(cell);
        }
    }
}

// Create clue lists
function createClueLists() {
    acrossCluesList.innerHTML = '';
    downCluesList.innerHTML = '';
    
    puzzleData.words.forEach(word => {
        const li = document.createElement('li');
        li.dataset.wordId = word.id;
        li.innerHTML = `
            <span class="clue-number">${word.number}</span>
            <span class="clue-text">${word.clue}</span>
            <span class="word-length">(${word.length})</span>
        `;
        
        if (word.direction === 'across') {
            acrossCluesList.appendChild(li);
        } else {
            downCluesList.appendChild(li);
        }
        
        li.addEventListener('click', () => {
            selectWord(word.number, word.direction);
        });
    });
}

// Select a word by number and direction
function selectWord(number, direction) {
    currentDirection = direction;
    
    // Update direction buttons
    directionButtons.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.dataset.direction === direction);
    });
    
    // Update clue number input
    clueNumberInput.value = number;
    
    // Find the word
    currentWord = puzzleData.words.find(word => 
        word.number === number && 
        word.direction === direction
    );
    
    updateCurrentWordDisplay();
    highlightActiveWord();
    
    // Focus letter input
    letterInput.focus();
}

// Update current word display
function updateCurrentWordDisplay() {
    if (currentWord) {
        currentWordDisplay.textContent = `Word ${currentWord.number} (${currentDirection}): ${currentWord.clue}`;
    } else {
        currentWordDisplay.textContent = '';
    }
}

// Highlight active word cells
function highlightActiveWord() {
    // Clear previous highlights
    document.querySelectorAll('.cell.active').forEach(cell => {
        cell.classList.remove('active');
    });
    
    if (!currentWord) return;
    
    // Highlight cells for current word
    for (let i = 0; i < currentWord.length; i++) {
        let row = currentWord.startRow;
        let col = currentWord.startCol;
        
        if (currentDirection === 'across') {
            col += i;
        } else {
            row += i;
        }
        
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('active');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Direction buttons
    directionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentDirection = btn.dataset.direction;
            directionButtons.forEach(b => b.setAttribute('aria-pressed', b === btn));
            
            // Update current word with new direction
            if (currentWord) {
                selectWord(currentWord.number, currentDirection);
            }
        });
    });
    
    // Clue number input
    clueNumberInput.addEventListener('input', (e) => {
        const number = parseInt(e.target.value);
        if (!isNaN(number) && number > 0) {
            selectWord(number, currentDirection);
        }
    });
    
    // Letter input
    letterInput.addEventListener('input', (e) => {
        const letter = e.target.value.toUpperCase().charAt(0);
        if (letter && /^[A-Z]$/.test(letter)) {
            fillLetter(letter);
        }
    });
    
    // Handle arrow keys for navigation
    letterInput.addEventListener('keydown', (e) => {
        if (!currentWord) return;
        
        let currentRow = currentWord.startRow;
        let currentCol = currentWord.startCol;
        
        // Find current filled position
        const filledPositions = Object.keys(filledCells);
        const currentWordPositions = [];
        
        for (let i = 0; i < currentWord.length; i++) {
            let row = currentWord.startRow;
            let col = currentWord.startCol;
            
            if (currentDirection === 'across') {
                col += i;
            } else {
                row += i;
            }
            
            currentWordPositions.push(`${row},${col}`);
        }
        
        // Find the last filled position or first unfilled position
        let lastFilledIndex = -1;
        for (let i = 0; i < currentWordPositions.length; i++) {
            if (filledCells[currentWordPositions[i]]) {
                lastFilledIndex = i;
            }
        }
        
        let nextIndex;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextIndex = lastFilledIndex + 1;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextIndex = lastFilledIndex > 0 ? lastFilledIndex - 1 : 0;
        } else if (e.key === 'Backspace') {
            if (letterInput.value === '' && lastFilledIndex >= 0) {
                clearCurrentCell();
                e.preventDefault();
                return;
            }
            return;
        } else {
            return;
        }
        
        if (nextIndex >= 0 && nextIndex < currentWord.length) {
            // Move to next cell
            let row = currentWord.startRow;
            let col = currentWord.startCol;
            
            if (currentDirection === 'across') {
                col += nextIndex;
            } else {
                row += nextIndex;
            }
            
            // Move to that cell
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.focus();
                letterInput.value = filledCells[`${row},${col}`] || '';
            }
        }
    });
    
    // Clear cell button
    clearCellBtn.addEventListener('click', () => {
        clearCurrentCell();
        letterInput.focus();
    });
    
    // Check answer button
    checkAnswerBtn.addEventListener('click', () => {
        checkCurrentWord();
        letterInput.focus();
    });
    
    // Restart button
    restartBtn.addEventListener('click', () => {
        resetGame();
    });
}

// Fill a letter in the current position
function fillLetter(letter) {
    if (!currentWord) return;
    
    let currentRow = currentWord.startRow;
    let currentCol = currentWord.startCol;
    
    // Find the last filled position
    let lastFilledIndex = -1;
    for (let i = 0; i < currentWord.length; i++) {
        let row = currentWord.startRow;
        let col = currentWord.startCol;
        
        if (currentDirection === 'across') {
            col += i;
        } else {
            row += i;
        }
        
        if (filledCells[`${row},${col}`]) {
            lastFilledIndex = i;
        }
    }
    
    const nextIndex = lastFilledIndex + 1;
    
    if (nextIndex < currentWord.length) {
        let row = currentWord.startRow;
        let col = currentWord.startCol;
        
        if (currentDirection === 'across') {
            col += nextIndex;
        } else {
            row += nextIndex;
        }
        
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.textContent = letter;
            filledCells[`${row},${col}`] = letter;
            letterInput.value = '';
            
            // Check if word is complete
            if (nextIndex === currentWord.length - 1) {
                checkCurrentWord();
            }
        }
    }
}

// Clear current cell
function clearCurrentCell() {
    if (!currentWord) return;
    
    let currentRow = currentWord.startRow;
    let currentCol = currentWord.startCol;
    
    // Find the last filled position
    let lastFilledIndex = -1;
    for (let i = 0; i < currentWord.length; i++) {
        let row = currentWord.startRow;
        let col = currentWord.startCol;
        
        if (currentDirection === 'across') {
            col += i;
        } else {
            row += i;
        }
        
        if (filledCells[`${row},${col}`]) {
            lastFilledIndex = i;
        }
    }
    
    if (lastFilledIndex >= 0) {
        let row = currentWord.startRow;
        let col = currentWord.startCol;
        
        if (currentDirection === 'across') {
            col += lastFilledIndex;
        } else {
            row += lastFilledIndex;
        }
        
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.textContent = '';
            delete filledCells[`${row},${col}`];
            cell.classList.remove('correct', 'incorrect');
        }
    }
}

// Check current word
function checkCurrentWord() {
    if (!currentWord) return;
    
    let isCorrect = true;
    
    for (let i = 0; i < currentWord.length; i++) {
        let row = currentWord.startRow;
        let col = currentWord.startCol;
        
        if (currentDirection === 'across') {
            col += i;
        } else {
            row += i;
        }
        
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        const expectedLetter = currentWord.answer[i];
        const actualLetter = filledCells[`${row},${col}`] || '';
        
        if (actualLetter.toUpperCase() !== expectedLetter) {
            isCorrect = false;
            cell.classList.add('incorrect');
            setTimeout(() => cell.classList.remove('incorrect'), 500);
        } else {
            cell.classList.add('correct');
            cell.classList.remove('incorrect');
        }
    }
    
    if (isCorrect) {
        completedWords.add(currentWord.id);
        document.querySelector(`li[data-word-id="${currentWord.id}"]`)?.classList.add('completed');
        highlightActiveWord();
        
        // Move to next word
        const nextWord = findNextWord();
        if (nextWord) {
            setTimeout(() => selectWord(nextWord.number, nextWord.direction), 500);
        }
    }
}

// Find next available word
function findNextWord() {
    const currentWordIndex = puzzleData.words.findIndex(word => word.id === currentWord.id);
    
    // Try to find the next word in the same direction
    for (let i = currentWordIndex + 1; i < puzzleData.words.length; i++) {
        if (puzzleData.words[i].direction === currentDirection && 
            !completedWords.has(puzzleData.words[i].id)) {
            return puzzleData.words[i];
        }
    }
    
    // Try to find any uncompleted word
    for (let word of puzzleData.words) {
        if (!completedWords.has(word.id)) {
            return word;
        }
    }
    
    return null;
}

// Check if puzzle is complete
function checkPuzzleComplete() {
    const allWordsCompleted = puzzleData.words.every(word => 
        completedWords.has(word.id)
    );
    
    if (allWordsCompleted) {
        setTimeout(() => {
            completionModal.classList.add('show');
        }, 300);
    }
}

// Reset game
function resetGame() {
    filledCells = {};
    completedWords.clear();
    
    // Clear all cells
    document.querySelectorAll('.cell').forEach(cell => {
        if (!cell.classList.contains('black')) {
            cell.textContent = '';
        }
        cell.classList.remove('correct', 'incorrect', 'active');
    });
    
    // Reset clue lists
    document.querySelectorAll('.clue-list li').forEach(li => {
        li.classList.remove('completed');
    });
    
    // Reset UI
    completionModal.classList.remove('show');
    letterInput.value = '';
    currentWordDisplay.textContent = '';
    currentWord = null;
    
    // Select first word
    selectWord(1, 'across');
    
    // Focus input
    letterInput.focus();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});
