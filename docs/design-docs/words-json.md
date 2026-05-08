# Crossword Puzzle Data Structure

## Overview

The `words.json` file defines the crossword puzzle structure including a 10x10 grid and 8 words (4 across, 4 down).

## Structure

### Grid Size
- `gridSize`: 10 (10x10 grid)

### Words Array
Each word object contains:
- `id`: Unique identifier (e.g., "1-across")
- `number`: Clue number
- `direction`: "across" or "down"
- `answer`: The correct answer string
- `clue`: The clue text for players
- `startRow`, `startCol`: Starting position (0-indexed)
- `length`: Number of letters

### Cell Mapping
- Maps each cell coordinate to the word IDs that pass through it
- Enables quick lookup of which words intersect at a given cell
- Format: `"row,col": ["word-id-1", "word-id-2"]`

## Example Word
```json
{
  "id": "1-across",
  "number": 1,
  "direction": "across",
  "answer": "SUNFLOWER",
  "clue": "Tall plant with a yellow head",
  "startRow": 0,
  "startCol": 0,
  "length": 9
}
```

## Design Decisions

1. **10x10 Grid**: Balanced puzzle size for playability
2. **8 Words**: 4 across + 4 down provides good coverage without being overwhelming
3. **Explicit Intersections**: Cell mapping enables efficient validation
4. **Unique IDs**: Each word has a unique ID for precise tracking
