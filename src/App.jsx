
import { useState } from 'react';
import './App.css';

function emptyCell() {
  return {
    center: [], // array of center numbers
    pencil: [[], [], [], []], // 4 corners: TL, TR, BL, BR
    locked: false, // true if initial numbers are locked
  };
}

function App() {
  const [board, setBoard] = useState(
    Array(9)
      .fill(0)
      .map(() => Array(9).fill(0).map(emptyCell))
  );
  const [lockedMode, setLockedMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selected, setSelected] = useState({ row: null, col: null });
  const [corner, setCorner] = useState(0); // 0:TL, 1:TR, 2:BL, 3:BR
  const [theme, setTheme] = useState('dark'); // 'light', 'dark', 'grey'

  // Save board to history and clear redo stack
  function pushHistory(newBoard) {
    setHistory((prev) => [...prev, JSON.stringify(board)]);
    setRedoStack([]);
    setBoard(newBoard);
  }

  function handleCellClick(row, col) {
    setSelected({ row, col });
  }

  // Keyboard navigation and input
  function handleKeyDown(e) {
    // Global undo: Ctrl+Z
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      if (history.length > 0) {
        const prevBoard = JSON.parse(history[history.length - 1]);
        setRedoStack((r) => [...r, JSON.stringify(board)]);
        setBoard(prevBoard);
        setHistory((h) => h.slice(0, h.length - 1));
      }
      e.preventDefault();
      return;
    }
    // Global redo: Ctrl+Y
    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      if (redoStack.length > 0) {
        const nextBoard = JSON.parse(redoStack[redoStack.length - 1]);
        setHistory((h) => [...h, JSON.stringify(board)]);
        setBoard(nextBoard);
        setRedoStack((r) => r.slice(0, r.length - 1));
      }
      e.preventDefault();
      return;
    }
    if (selected.row === null || selected.col === null) return;
    let { row, col } = selected;
    if (e.key === 'ArrowUp') {
      row = row > 0 ? row - 1 : row;
      setSelected({ row, col });
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      row = row < 8 ? row + 1 : row;
      setSelected({ row, col });
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      col = col > 0 ? col - 1 : col;
      setSelected({ row, col });
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      col = col < 8 ? col + 1 : col;
      setSelected({ row, col });
      e.preventDefault();
    } else if (/^[1-9]$/.test(e.key)) {
      // Enter number: Control for pencil, normal for center
      pushHistory((() => {
        const next = board.map((r) => r.map((c) => ({ ...c, pencil: c.pencil.map(arr => [...arr]), center: [...c.center], locked: c.locked })));
        const cell = next[row][col];
        if (cell.locked && !e.ctrlKey) return next; // Prevent editing locked center numbers
        if (e.ctrlKey) {
          if (!cell.pencil[corner].includes(e.key)) cell.pencil[corner].push(e.key);
        } else {
          if (!cell.center.includes(e.key)) cell.center.push(e.key);
        }
        return next;
      })());
      e.preventDefault();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      pushHistory((() => {
        const next = board.map((r) => r.map((c) => ({ ...c, pencil: c.pencil.map(arr => [...arr]), center: [...c.center], locked: c.locked })));
        const cell = next[row][col];
        if (cell.locked && !e.ctrlKey) return next; // Prevent erasing locked center numbers
        if (e.ctrlKey) {
          cell.pencil[corner] = [];
        } else {
          cell.center = [];
        }
        return next;
      })());
      e.preventDefault();
    }
  }

  function handleInput(e) {
    const val = e.target.value.replace(/[^1-9]/g, '');
    if (selected.row === null || selected.col === null) return;
    setBoard((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c, pencil: c.pencil.map(arr => [...arr]), center: [...c.center] })));
      const cell = next[selected.row][selected.col];
      if (inputMode === 'center') {
        // Add each digit not already present
        for (const digit of val) {
          if (!cell.center.includes(digit)) cell.center.push(digit);
        }
      } else {
        if (val) {
          for (const digit of val) {
            if (!cell.pencil[corner].includes(digit)) cell.pencil[corner].push(digit);
          }
        }
      }
      return next;
    });
  }

  function handleErase() {
    if (selected.row === null || selected.col === null) return;
    setBoard((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c, pencil: c.pencil.map(arr => [...arr]), center: [...c.center] })));
      const cell = next[selected.row][selected.col];
      if (inputMode === 'center') {
        cell.center = [];
      } else {
        cell.pencil[corner] = [];
      }
      return next;
    });
  }

  // Theme background colors
  const themeStyles = {
    light: { background: '#f5f5f5', color: '#222' },
    dark: { background: '#222', color: '#f5f5f5' },
    grey: { background: '#888', color: '#222' },
  };

  // Lock initial numbers
  function lockInitialNumbers() {
    setBoard((prev) => prev.map((row) => row.map((cell) => {
      if (cell.center.length > 0) {
        return { ...cell, locked: true };
      }
      return cell;
    })));
    setLockedMode(true);
  }

  return (
    <div className="sudoku-app" style={themeStyles[theme]}>
      <h1>Sudoku</h1>
      <div className="controls">
        <span>Hold <b>Control</b> for pencil marks</span>
        <select value={corner} onChange={e => setCorner(Number(e.target.value))}>
          <option value={0}>Top Left</option>
          <option value={1}>Top Right</option>
          <option value={2}>Bottom Left</option>
          <option value={3}>Bottom Right</option>
        </select>
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="grey">Grey</option>
        </select>
        <button onClick={handleErase}>Erase</button>
        <button onClick={lockInitialNumbers} disabled={lockedMode}>Lock Initial Numbers</button>
      </div>
      <div
        className="sudoku-board"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ outline: 'none', background: themeStyles[theme].background, color: themeStyles[theme].color }}
      >
        {board.map((row, rIdx) => (
          <div className="sudoku-row" key={rIdx}>
            {row.map((cell, cIdx) => {
              // Sort center and pencil numbers before rendering
              const sortedCenter = [...cell.center].sort();
              const sortedPencil = cell.pencil.map(arr => [...arr].sort());
              return (
                <div
                  className={
                    'sudoku-cell' +
                    (selected.row === rIdx && selected.col === cIdx ? ' selected' : '') +
                    (cell.locked ? ' locked' : '')
                  }
                  key={cIdx}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                >
                  <div className="cell-center">
                    <div className="center-grid">
                      {sortedCenter.map((num, idx) => (
                        <span key={idx} className="center-num" style={cell.locked ? { color: '#000', fontWeight: 'bold' } : { color: '#660' }}>{num}</span>
                      ))}
                    </div>
                  </div>
                  <div className="cell-corner tl">{sortedPencil[0].join(' ')}</div>
                  <div className="cell-corner tr">{sortedPencil[1].join(' ')}</div>
                  <div className="cell-corner bl">{sortedPencil[2].join(' ')}</div>
                  <div className="cell-corner br">{sortedPencil[3].join(' ')}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
