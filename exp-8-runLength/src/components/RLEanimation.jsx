import "../template.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Close,
  Pause,
  PlayArrow,
  RestartAlt,
  Shuffle,
} from "@mui/icons-material";
import divide from "../assets/images/divide_sign.png";
import multiply from "../assets/images/x_sign.png";
import minus from "../assets/images/minus_sign.png";
import plus from "../assets/images/plus_sign.png";

const PATTERNS = [
  {
    name: "Plus",
    icon: plus,
    matrix: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ],
  },
  {
    name: "Bar",
    icon: minus,
    matrix: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "Cross",
    icon: multiply,
    matrix: [
      [1, 0, 0, 0, 0, 0, 1],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 1],
    ],
  },
  {
    name: "Divide",
    icon: divide,
    matrix: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
];

const copyMatrix = (matrix) => matrix.map((row) => [...row]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function flattenMatrix(matrix, direction) {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const cells = [];

  if (direction === "vertical") {
    for (let col = 0; col < cols; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        cells.push({ value: matrix[row][col], row, col, order: cells.length });
      }
    }
    return cells;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells.push({ value: matrix[row][col], row, col, order: cells.length });
    }
  }

  return cells;
}

function encodeCells(cells, minRunLength) {
  if (!cells.length) return [];

  const encoded = [];
  let currentValue = cells[0].value;
  let positions = [cells[0]];

  const pushRun = () => {
    if (positions.length >= minRunLength) {
      encoded.push({
        id: encoded.length,
        value: currentValue,
        count: positions.length,
        positions,
      });
    } else {
      positions.forEach((position) => {
        encoded.push({
          id: encoded.length,
          value: currentValue,
          count: 1,
          positions: [position],
        });
      });
    }
  };

  cells.slice(1).forEach((cell) => {
    if (cell.value === currentValue) {
      positions = [...positions, cell];
    } else {
      pushRun();
      currentValue = cell.value;
      positions = [cell];
    }
  });

  pushRun();
  return encoded;
}

function encodeText(data, minRunLength) {
  if (!data) return [];

  const chars = [...data];
  const runs = [];
  let value = chars[0];
  let count = 1;

  const pushRun = () => {
    if (count >= minRunLength) {
      runs.push({ value, count });
    } else {
      Array.from({ length: count }).forEach(() =>
        runs.push({ value, count: 1 }),
      );
    }
  };

  chars.slice(1).forEach((char) => {
    if (char === value) {
      count += 1;
    } else {
      pushRun();
      value = char;
      count = 1;
    }
  });

  pushRun();
  return runs;
}

function makeRandomNoise(rows = 7, cols = 7) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() > 0.5 ? 1 : 0)),
  );
}

export default function RLEanimation({ handleClose2Modal }) {
  const [matrix, setMatrix] = useState(() => copyMatrix(PATTERNS[0].matrix));
  const [selectedPattern, setSelectedPattern] = useState("Plus");
  const [textData, setTextData] = useState("000111100001111000");
  const [minRunLength, setMinRunLength] = useState(1);
  const [scanDirection, setScanDirection] = useState("horizontal");
  const [activeCell, setActiveCell] = useState(null);
  const [currentRunValue, setCurrentRunValue] = useState(null);
  const [currentRunCount, setCurrentRunCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(450);
  const [visibleRunCount, setVisibleRunCount] = useState(0);
  const [hasAnimationProgress, setHasAnimationProgress] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hoveredRunId, setHoveredRunId] = useState(null);
  const [explanation, setExplanation] = useState(
    "Choose a pattern or edit pixels, then play the scan to watch RLE form runs.",
  );

  const isAnimatingRef = useRef(false);
  const resetRequestedRef = useRef(false);

  const scannedCells = useMemo(
    () => flattenMatrix(matrix, scanDirection),
    [matrix, scanDirection],
  );

  const encodedRuns = useMemo(
    () => encodeCells(scannedCells, Math.max(1, Number(minRunLength) || 1)),
    [scannedCells, minRunLength],
  );

  const textEncodedRuns = useMemo(
    () => encodeText(textData, Math.max(1, Number(minRunLength) || 1)),
    [textData, minRunLength],
  );

  const visibleRuns = hasAnimationProgress
    ? encodedRuns.slice(0, visibleRunCount)
    : encodedRuns;

  const highlightedPositions = useMemo(() => {
    if (hoveredRunId === null) return new Set();
    const run = encodedRuns.find((item) => item.id === hoveredRunId);
    return new Set(
      run?.positions.map((cell) => `${cell.row}-${cell.col}`) || [],
    );
  }, [encodedRuns, hoveredRunId]);

  const stats = useMemo(() => {
    const originalSize = scannedCells.length;
    const encodedSize = encodedRuns.length * 2;
    const compressionRatio = originalSize ? encodedSize / originalSize : 0;
    const spaceSaved = originalSize
      ? ((originalSize - encodedSize) / originalSize) * 100
      : 0;

    return {
      originalSize,
      encodedSize,
      compressionRatio,
      spaceSaved,
    };
  }, [encodedRuns.length, scannedCells.length]);

  const resetAnimation = useCallback(() => {
    resetRequestedRef.current = true;
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setActiveCell(null);
    setCurrentRunValue(null);
    setCurrentRunCount(0);
    setVisibleRunCount(0);
    setHasAnimationProgress(false);
    setStepIndex(0);
    setHoveredRunId(null);
    setExplanation("Animation reset. Press Play to begin.");
  }, []);

  const commitRunAtCell = useCallback(
    (cellOrder) => {
      const completedRuns = encodedRuns.filter(
        (run) => run.positions[run.positions.length - 1].order <= cellOrder,
      );
      const latestRun = completedRuns[completedRuns.length - 1];

      setVisibleRunCount(completedRuns.length);
      if (latestRun) {
        setExplanation(`Run encoded as ${latestRun.value}:${latestRun.count}.`);
      }
    },
    [encodedRuns],
  );

  const applyStep = useCallback(
    (index) => {
      const cell = scannedCells[index];
      if (!cell) {
        setExplanation(
          "Encoding complete. Compare the encoded blocks and statistics.",
        );
        return false;
      }

      setActiveCell({ row: cell.row, col: cell.col, order: cell.order });
      setStepIndex(index + 1);

      const runStart =
        index === 0 || scannedCells[index - 1]?.value !== cell.value;
      const nextCell = scannedCells[index + 1];
      let count = 1;

      for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        if (scannedCells[cursor].value !== cell.value) break;
        count += 1;
      }

      setCurrentRunValue(cell.value);
      setCurrentRunCount(count);

      if (runStart) {
        setExplanation(`New run started with pixel value ${cell.value}.`);
      } else {
        setExplanation(`${count} consecutive ${cell.value}s detected.`);
      }

      if (!nextCell || nextCell.value !== cell.value) {
        commitRunAtCell(cell.order);
      }

      return true;
    },
    [commitRunAtCell, scannedCells],
  );

  const playAnimation = useCallback(
    async (startAt = stepIndex) => {
      if (isAnimatingRef.current) return;

      resetRequestedRef.current = false;
      isAnimatingRef.current = true;
      setIsAnimating(true);
      setHasAnimationProgress(true);
      setVisibleRunCount(startAt === 0 ? 0 : visibleRunCount);
      let completed = true;

      for (let index = startAt; index < scannedCells.length; index += 1) {
        if (!isAnimatingRef.current || resetRequestedRef.current) {
          completed = false;
          break;
        }
        applyStep(index);
        await wait(animationSpeed);
      }

      if (!resetRequestedRef.current) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        if (completed) {
          setActiveCell(null);
          setExplanation(
            "Encoding complete. Hover any run to see its source pixels.",
          );
        }
      }
    },
    [
      animationSpeed,
      applyStep,
      scannedCells.length,
      stepIndex,
      visibleRunCount,
    ],
  );

  const pauseAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setExplanation("Paused. Continue with Play or inspect encoded runs.");
  }, []);

  const toggleCell = useCallback(
    (rowIndex, colIndex) => {
      pauseAnimation();
      setMatrix((prev) =>
        prev.map((row, r) =>
          row.map((value, c) =>
            r === rowIndex && c === colIndex ? Number(!value) : value,
          ),
        ),
      );
      setSelectedPattern("Custom");
      setExplanation("Pixel edited. Encoding updated automatically.");
      setVisibleRunCount(0);
      setHasAnimationProgress(false);
      setStepIndex(0);
      setActiveCell(null);
    },
    [pauseAnimation],
  );

  const selectPattern = useCallback(
    (patternName) => {
      const pattern = PATTERNS.find((item) => item.name === patternName);
      if (!pattern) return;
      pauseAnimation();
      setSelectedPattern(pattern.name);
      setMatrix(copyMatrix(pattern.matrix));
      resetAnimation();
      setExplanation(`${pattern.name} pattern loaded.`);
    },
    [pauseAnimation, resetAnimation],
  );

  const generateNoise = useCallback(() => {
    pauseAnimation();
    setSelectedPattern("Random Noise");
    setMatrix(makeRandomNoise());
    resetAnimation();
    setExplanation(
      "Random noise generated. RLE usually compresses this poorly.",
    );
  }, [pauseAnimation, resetAnimation]);

  useEffect(() => {
    resetAnimation();
  }, [minRunLength, resetAnimation, scanDirection]);

  useEffect(() => {
    return () => {
      isAnimatingRef.current = false;
      resetRequestedRef.current = true;
    };
  }, []);

  return (
    <div id="main-box-temp" className="rle-visualizer">
      <DialogTitle id="instructions-dialog-title" className="rle-titlebar">
        <span>Run Length Encoding Visualizer</span>
        <div className="rle-title-actions">
          <Tooltip title="Close">
            <Button
              onClick={handleClose2Modal}
              aria-label="Close visualizer"
              className="rle-icon-button"
            >
              <Close />
            </Button>
          </Tooltip>
        </div>
      </DialogTitle>
      <div className="ParentContainer">
        <div className="leftContainer">
          <div className="choosePanel">
            <div className="coolinput_comp rle-choose-box">
              <label htmlFor="rle-image-grid" className="text">
                Choose:
              </label>
              <div
                id="rle-image-grid"
                className="rle-classic-image-grid"
                role="group"
                aria-label="Binary image examples"
              >
                {PATTERNS.map((pattern) => (
                  <button
                    key={pattern.name}
                    type="button"
                    className={`rle-image-choice ${
                      selectedPattern === pattern.name ? "active" : ""
                    }`}
                    onClick={() => selectPattern(pattern.name)}
                    aria-label={`Select ${pattern.name} image`}
                    aria-pressed={selectedPattern === pattern.name}
                  >
                    <img src={pattern.icon} alt="" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <p>OR</p>
            <Button
              variant="contained"
              onClick={generateNoise}
              aria-label="Generate random noise pattern"
              className="rle-noise-button"
            >
              Generate Random Image
            </Button>
            <p>OR</p>
            <div>
              <div className="rle-section-heading">
                <h3>Text RLE</h3>
                <p>Text encoding updates with the same minimum run length.</p>
              </div>
              <TextField
                multiline
                minRows={3}
                value={textData}
                onChange={(event) => setTextData(event.target.value)}
                label="Text input"
                aria-label="Text input for run length encoding"
              />
            </div>
          </div>
          <div className="rle-InputPanel">
            <div>
              <TextField
                label="Minimum run length"
                type="number"
                value={minRunLength}
                onChange={(event) =>
                  setMinRunLength(Math.max(1, Number(event.target.value) || 1))
                }
                inputProps={{ min: 1, "aria-label": "Minimum run length" }}
                size="small"
              />
            </div>
          </div>
          <div
            className="rle-input-panel rle-control-panel"
            aria-label="RLE controls"
          >
            <div className="rle-section-heading">
              <h3>Controls</h3>
            </div>

            <FormControl size="small">
              <InputLabel id="scan-direction-label">Scan direction</InputLabel>
              <Select
                labelId="scan-direction-label"
                label="Scan direction"
                value={scanDirection}
                onChange={(event) => setScanDirection(event.target.value)}
                aria-label="Scan direction"
              >
                <MenuItem value="horizontal">Horizontal Scan</MenuItem>
                <MenuItem value="vertical">Vertical Scan</MenuItem>
              </Select>
            </FormControl>

            <div
              className="rle-animation-buttons"
              role="group"
              aria-label="Animation controls"
            >
              <Tooltip title="Play">
                <span>
                  <Button
                    variant="contained"
                    onClick={() => playAnimation()}
                    disabled={isAnimating}
                    aria-label="Play animation"
                  >
                    <PlayArrow />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Pause">
                <span>
                  <Button
                    variant="outlined"
                    onClick={pauseAnimation}
                    disabled={!isAnimating}
                    aria-label="Pause animation"
                  >
                    <Pause />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Reset">
                <Button
                  variant="outlined"
                  onClick={resetAnimation}
                  aria-label="Reset animation"
                >
                  <RestartAlt />
                </Button>
              </Tooltip>
            </div>

            <div className="rle-speed-control">
              <label htmlFor="rle-speed-slider">Speed</label>
              <Slider
                id="rle-speed-slider"
                value={animationSpeed}
                min={120}
                max={900}
                step={30}
                onChange={(_, value) => setAnimationSpeed(Number(value))}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} ms`}
                aria-label="Animation speed"
              />
            </div>
          </div>
        </div>
        <div className="rightContainer">
          <div className="matrixPanel">
            <section
              className="rle-stage"
              aria-label="Binary image encoding stage"
            >
              <div className="rle-panel rle-matrix-panel">
                <div className="rle-section-heading">
                  <h3>Binary Matrix</h3>
                  <p>
                    {scanDirection === "horizontal"
                      ? "Rows are scanned left to right."
                      : "Columns are scanned top to bottom."}
                  </p>
                </div>

                <div
                  className="rle-matrix"
                  style={{
                    gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)`,
                  }}
                  role="grid"
                  aria-label="Editable binary pixel matrix"
                >
                  {matrix.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const key = `${rowIndex}-${colIndex}`;
                      const isActive =
                        activeCell?.row === rowIndex &&
                        activeCell?.col === colIndex;
                      const isHighlighted = highlightedPositions.has(key);

                      return (
                        <button
                          key={key}
                          type="button"
                          role="gridcell"
                          className={`rle-cell value-${cell} ${isActive ? "active" : ""} ${
                            isHighlighted ? "highlighted" : ""
                          }`}
                          onClick={() => toggleCell(rowIndex, colIndex)}
                          aria-label={`Pixel row ${rowIndex + 1}, column ${
                            colIndex + 1
                          }, value ${cell}. Click to toggle.`}
                        >
                          {cell}
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
            </section>
          </div>
          <div className="rle-explanation-panel">
            <section
              className="rle-panel rle-explanation-panel"
              aria-live="polite"
            >
              <div className="rle-section-heading compact">
                <h3>Explanation</h3>
                <div className="rle-live-run" aria-live="polite">
                  <div>
                    <span>Current value</span>
                    <strong>{currentRunValue ?? "-"}</strong>
                  </div>
                  <div>
                    <span>Current count</span>
                    <strong>{currentRunCount}</strong>
                  </div>
                  <div>
                    <span>Step</span>
                    <strong>
                      {Math.min(stepIndex, scannedCells.length)} /{" "}
                      {scannedCells.length}
                    </strong>
                  </div>
                </div>
              </div>
              <p>{explanation}</p>
            </section>
            <div className="rle-panel rle-output-panel">
              <div className="rle-section-heading">
                <h3>Encoded Runs</h3>
                <p>Hover a run to highlight its matching pixels.</p>
              </div>
              <div className="rle-runs" aria-label="Encoded run blocks">
                {visibleRuns.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    className={`rle-run-pill run-${run.value}`}
                    onMouseEnter={() => setHoveredRunId(run.id)}
                    onMouseLeave={() => setHoveredRunId(null)}
                    onFocus={() => setHoveredRunId(run.id)}
                    onBlur={() => setHoveredRunId(null)}
                    aria-label={`Run value ${run.value}, count ${run.count}`}
                  >
                    {run.value}:{run.count}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            className="rle-panel rle-stats-panel"
            aria-label="Compression statistics"
          >
            <div className="rle-section-heading">
              <h3>Statistics</h3>
            </div>
            <div className="rle-stat-grid">
              <div className="rle-stat-card">
                <span>Original Pixels</span>
                <strong>{stats.originalSize}</strong>
              </div>
              <div className="rle-stat-card">
                <span>Encoded Symbols</span>
                <strong>{stats.encodedSize}</strong>
              </div>
              <div className="rle-stat-card">
                <span>Compression Ratio</span>
                <strong>{stats.compressionRatio.toFixed(2)}</strong>
              </div>
              <div className="rle-stat-card">
                <span>Space Saved</span>
                <strong>{stats.spaceSaved.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
          <main className="rle-workspace">
            <aside className="rle-side-stack"></aside>

            <section
              className="rle-panel rle-text-panel"
              aria-label="Text RLE encoder"
            >
              <div
                className="rle-runs text-runs"
                aria-label="Encoded text output"
              >
                {textEncodedRuns.map((run, index) => (
                  <span
                    key={`${run.value}-${index}`}
                    className="rle-run-pill text-run"
                  >
                    {run.value === " " ? "space" : run.value}:{run.count}
                  </span>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
