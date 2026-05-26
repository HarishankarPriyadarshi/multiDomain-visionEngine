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

function buildScanGroups(matrix, direction) {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const groups = [];
  let order = 0;

  if (direction === "vertical") {
    for (let col = 0; col < cols; col += 1) {
      const cells = [];
      for (let row = 0; row < rows; row += 1) {
        cells.push({
          value: matrix[row][col],
          row,
          col,
          order,
          groupIndex: col,
          groupLabel: `Column ${col + 1}`,
        });
        order += 1;
      }
      groups.push({ groupLabel: `Column ${col + 1}`, runs: [], cells });
    }
    return groups;
  }

  for (let row = 0; row < rows; row += 1) {
    const cells = [];
    for (let col = 0; col < cols; col += 1) {
      cells.push({
        value: matrix[row][col],
        row,
        col,
        order,
        groupIndex: row,
        groupLabel: `Row ${row + 1}`,
      });
      order += 1;
    }
    groups.push({ groupLabel: `Row ${row + 1}`, runs: [], cells });
  }

  return groups;
}

function encodeCells(cells, minRunLength, startId = 0) {
  if (!cells.length) return [];

  const encoded = [];
  let currentValue = cells[0].value;
  let positions = [cells[0]];

  const pushRun = () => {
    if (positions.length >= minRunLength) {
      encoded.push({
        id: startId + encoded.length,
        value: currentValue,
        count: positions.length,
        positions,
      });
    } else {
      positions.forEach((position) => {
        encoded.push({
          id: startId + encoded.length,
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

function encodeScanGroups(scanGroups, minRunLength) {
  let nextId = 0;

  return scanGroups.map((group) => {
    const runs = encodeCells(group.cells, minRunLength, nextId);
    nextId += runs.length;
    return {
      groupLabel: group.groupLabel,
      runs,
    };
  });
}

function encodeText(data, minRunLength) {
  if (!data) return [];

  const chars = [...data];
  const runs = [];
  let value = chars[0];
  let count = 1;
  let startIndex = 0;

  const pushRun = () => {
    const positions = Array.from(
      { length: count },
      (_, offset) => startIndex + offset,
    );

    if (count >= minRunLength) {
      runs.push({
        id: runs.length,
        value,
        count,
        positions,
      });
    } else {
      positions.forEach((position) => {
        runs.push({
          id: runs.length,
          value,
          count: 1,
          positions: [position],
        });
      });
    }
  };

  chars.slice(1).forEach((char, offset) => {
    if (char === value) {
      count += 1;
    } else {
      pushRun();
      value = char;
      count = 1;
      startIndex = offset + 1;
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
  const [simulationMode, setSimulationMode] = useState("image");
  const [selectedPattern, setSelectedPattern] = useState("Plus");
  const [textData, setTextData] = useState("");
  const [minRunLength, setMinRunLength] = useState(1);
  const [scanDirection, setScanDirection] = useState("horizontal");
  const [activeCell, setActiveCell] = useState(null);
  const [currentRunValue, setCurrentRunValue] = useState(null);
  const [currentRunCount, setCurrentRunCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [visibleRunCount, setVisibleRunCount] = useState(0);
  const [hasAnimationProgress, setHasAnimationProgress] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [imageStepIndex, setImageStepIndex] = useState(0);
  const [activeTextIndex, setActiveTextIndex] = useState(null);
  const [visibleTextRunCount, setVisibleTextRunCount] = useState(0);
  const [textHasAnimationProgress, setTextHasAnimationProgress] =
    useState(false);
  const [textStepIndex, setTextStepIndex] = useState(0);
  const [hoveredTextRunId, setHoveredTextRunId] = useState(null);
  const [hoveredRunId, setHoveredRunId] = useState(null);
  const [explanation, setExplanation] = useState(
    "Choose a pattern or edit pixels, then play the scan to watch RLE form runs.",
  );

  const isAnimatingRef = useRef(false);
  const resetRequestedRef = useRef(false);

  const scanGroups = useMemo(
    () => buildScanGroups(matrix, scanDirection),
    [matrix, scanDirection],
  );

  const scannedCells = useMemo(
    () => scanGroups.flatMap((group) => group.cells),
    [scanGroups],
  );

  const encodedRunGroups = useMemo(
    () => encodeScanGroups(scanGroups, Math.max(1, Number(minRunLength) || 1)),
    [scanGroups, minRunLength],
  );

  const encodedRuns = useMemo(
    () => encodedRunGroups.flatMap((group) => group.runs),
    [encodedRunGroups],
  );

  const textEncodedRuns = useMemo(
    () => encodeText(textData, Math.max(1, Number(minRunLength) || 1)),
    [textData, minRunLength],
  );

  const textCells = useMemo(
    () => [...textData].map((value, index) => ({ value, index })),
    [textData],
  );

  const visibleRuns = hasAnimationProgress
    ? encodedRuns.slice(0, visibleRunCount)
    : encodedRuns;

  const visibleRunGroups = useMemo(() => {
    const visibleRunIds = new Set(visibleRuns.map((run) => run.id));
    return encodedRunGroups.map((group) => ({
      ...group,
      runs: group.runs.filter((run) => visibleRunIds.has(run.id)),
    }));
  }, [encodedRunGroups, visibleRuns]);

  const visibleTextRuns = textHasAnimationProgress
    ? textEncodedRuns.slice(0, visibleTextRunCount)
    : [];

  const highlightedPositions = useMemo(() => {
    if (hoveredRunId === null) return new Set();
    const run = encodedRuns.find((item) => item.id === hoveredRunId);
    return new Set(
      run?.positions.map((cell) => `${cell.row}-${cell.col}`) || [],
    );
  }, [encodedRuns, hoveredRunId]);

  const highlightedTextPositions = useMemo(() => {
    if (hoveredTextRunId === null) return new Set();
    const run = textEncodedRuns.find((item) => item.id === hoveredTextRunId);
    return new Set(run?.positions || []);
  }, [hoveredTextRunId, textEncodedRuns]);

  const imageStats = useMemo(() => {
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

  const textStats = useMemo(() => {
    const originalSize = textCells.length;
    const encodedSize = textEncodedRuns.length * 2;
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
  }, [textCells.length, textEncodedRuns.length]);

  const stats = simulationMode === "image" ? imageStats : textStats;
  const statLabels =
    simulationMode === "image"
      ? {
          original: "Original Pixels",
          encoded: "Encoded Symbols",
        }
      : {
          original: "Original Characters",
          encoded: "Encoded Character Runs",
        };
  const activeStepIndex = stepIndex;
  const activeStepTotal =
    simulationMode === "image" ? scannedCells.length : textCells.length;

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
    setImageStepIndex(0);
    setHoveredRunId(null);
    setExplanation(
      "Scanning pixels row-wise and grouping consecutive binary values.",
    );
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
      setImageStepIndex(index + 1);

      const previousCell = scannedCells[index - 1];
      const nextCell = scannedCells[index + 1];
      const groupChanged =
        index > 0 && previousCell?.groupIndex !== cell.groupIndex;
      const runStart =
        index === 0 || groupChanged || previousCell?.value !== cell.value;
      let count = 1;

      for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        if (scannedCells[cursor].groupIndex !== cell.groupIndex) break;
        if (scannedCells[cursor].value !== cell.value) break;
        count += 1;
      }

      setCurrentRunValue(cell.value);
      setCurrentRunCount(count);

      if (groupChanged) {
        const groupName = scanDirection === "horizontal" ? "row" : "column";
        setExplanation(
          `Moving to next ${groupName}. New run started with pixel value ${cell.value}.`,
        );
      } else if (runStart) {
        setExplanation(`New run started with pixel value ${cell.value}.`);
      } else {
        setExplanation(`${count} consecutive ${cell.value}s detected.`);
      }

      if (
        !nextCell ||
        nextCell.groupIndex !== cell.groupIndex ||
        nextCell.value !== cell.value
      ) {
        commitRunAtCell(cell.order);
      }

      return true;
    },
    [commitRunAtCell, scanDirection, scannedCells],
  );

  const playAnimation = useCallback(
    async (startAt = imageStepIndex) => {
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
      imageStepIndex,
      scannedCells.length,
      visibleRunCount,
    ],
  );

  const pauseAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setExplanation("Paused. Continue with Play or inspect encoded runs.");
  }, []);

  const resetTextAnimation = useCallback(() => {
    resetRequestedRef.current = true;
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setActiveTextIndex(null);
    setVisibleTextRunCount(0);
    setTextHasAnimationProgress(false);
    setTextStepIndex(0);
    setStepIndex(0);
    setCurrentRunValue(null);
    setCurrentRunCount(0);
    setHoveredTextRunId(null);
    setExplanation(
      "Scanning characters sequentially and grouping repeated symbols.",
    );
  }, []);

  const commitTextRunAtIndex = useCallback(
    (textIndex) => {
      const completedRuns = textEncodedRuns.filter(
        (run) => run.positions[run.positions.length - 1] <= textIndex,
      );
      const latestRun = completedRuns[completedRuns.length - 1];

      setVisibleTextRunCount(completedRuns.length);
      if (latestRun) {
        setExplanation(`Run encoded as ${latestRun.value}:${latestRun.count}.`);
      }
    },
    [textEncodedRuns],
  );

  const applyTextStep = useCallback(
    (index) => {
      const cell = textCells[index];
      if (!cell) {
        setExplanation("Text encoding complete.");
        return false;
      }

      setActiveTextIndex(index);
      setTextStepIndex(index + 1);
      setStepIndex(index + 1);

      const previousCell = textCells[index - 1];
      const nextCell = textCells[index + 1];
      const runStart = index === 0 || previousCell?.value !== cell.value;
      let count = 1;

      for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        if (textCells[cursor].value !== cell.value) break;
        count += 1;
      }

      setCurrentRunValue(cell.value);
      setCurrentRunCount(count);

      if (runStart) {
        setExplanation(`New run started with character ${cell.value}.`);
      } else {
        setExplanation(`${count} consecutive ${cell.value}s detected.`);
      }

      if (!nextCell || nextCell.value !== cell.value) {
        commitTextRunAtIndex(index);
      }

      return true;
    },
    [commitTextRunAtIndex, textCells],
  );

  const playTextAnimation = useCallback(
    async (startAt = textStepIndex) => {
      if (isAnimatingRef.current) return;
      if (!textCells.length) {
        setExplanation("Enter text to animate Text RLE.");
        return;
      }

      resetRequestedRef.current = false;
      isAnimatingRef.current = true;
      setIsAnimating(true);
      setTextHasAnimationProgress(true);
      setVisibleTextRunCount(startAt === 0 ? 0 : visibleTextRunCount);
      let completed = true;

      for (let index = startAt; index < textCells.length; index += 1) {
        if (!isAnimatingRef.current || resetRequestedRef.current) {
          completed = false;
          break;
        }
        applyTextStep(index);
        await wait(animationSpeed);
      }

      if (!resetRequestedRef.current) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        if (completed) {
          setActiveTextIndex(null);
          setExplanation("Text encoding complete. Hover any run to see its source characters.");
        }
      }
    },
    [
      animationSpeed,
      applyTextStep,
      textCells.length,
      textStepIndex,
      visibleTextRunCount,
    ],
  );

  const handlePlayAnimation = useCallback(() => {
    if (simulationMode === "image") {
      playAnimation();
    } else {
      playTextAnimation();
    }
  }, [playAnimation, playTextAnimation, simulationMode]);

  const handleResetAnimation = useCallback(() => {
    if (simulationMode === "image") {
      resetAnimation();
    } else {
      resetTextAnimation();
    }
  }, [resetAnimation, resetTextAnimation, simulationMode]);

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
    resetTextAnimation();
  }, [minRunLength, resetTextAnimation]);

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
            <h2 className="rle-input-heading">Input Source</h2>
            <div className="rle-mode-selector" aria-label="Simulation mode">
              <button
                type="button"
                className={`rle-mode-option ${
                  simulationMode === "image" ? "active" : ""
                }`}
                onClick={() => {
                  pauseAnimation();
                  setSimulationMode("image");
                  setStepIndex(imageStepIndex);
                  setExplanation(
                    "Scanning pixels row-wise and grouping consecutive binary values.",
                  );
                }}
                aria-pressed={simulationMode === "image"}
              >
                Binary Image
              </button>
              <button
                type="button"
                className={`rle-mode-option ${
                  simulationMode === "text" ? "active" : ""
                }`}
                onClick={() => {
                  pauseAnimation();
                  setSimulationMode("text");
                  setStepIndex(textStepIndex);
                  setExplanation(
                    "Scanning characters sequentially and grouping repeated symbols.",
                  );
                }}
                aria-pressed={simulationMode === "text"}
              >
                Text RLE
              </button>
            </div>

            {simulationMode === "image" ? (
              <>
                <div className="coolinput_comp rle-choose-box">
                  <label htmlFor="rle-image-grid" className="text">
                    Choose Binary Image:
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
              </>
            ) : (
              <div>
                <div className="rle-section-heading">
                  <h3>Enter Text Data:</h3>
                </div>
                <TextField
                  multiline
                  minRows={1}
                  value={textData}
                  onChange={(event) => {
                    setTextData(event.target.value);
                    resetTextAnimation();
                    setCurrentRunValue(null);
                    setCurrentRunCount(0);
                    setStepIndex(0);
                    setExplanation(
                      "Text updated. Press Play to animate Text RLE.",
                    );
                  }}
                  aria-label="Text input for run length encoding"
                />
              </div>
            )}
            <div className="rle-section-heading compact">
              <h3>Minimum Run Length:</h3>
            </div>
            <TextField
              id="rle-section-input"
              type="number"
              value={minRunLength}
              onChange={(event) =>
                setMinRunLength(Math.max(1, Number(event.target.value) || 1))
              }
              inputProps={{ min: 1, "aria-label": "Minimum run length" }}
              size="small"
            />
          </div>

          <div
            className="rle-input-panel rle-control-panel"
            aria-label="RLE controls"
          >
            <div className="rle-section-heading">
              <h2 className="rle-input-heading">Simulation Control</h2>
            </div>

            {simulationMode === "image" && (
              <FormControl size="small">
                <div className="rle-section-heading">
                  <h3>Scan direction:</h3>
                </div>

                <Select
                  labelId="scan-direction-label"
                  value={scanDirection}
                  onChange={(event) => setScanDirection(event.target.value)}
                  aria-label="Scan direction"
                >
                  <MenuItem value="horizontal">Horizontal Scan</MenuItem>
                  <MenuItem value="vertical">Vertical Scan</MenuItem>
                </Select>
              </FormControl>
            )}

            <div
              className="rle-animation-buttons"
              role="group"
              aria-label="Animation controls"
            >
              <Tooltip title="Play">
                <span>
                  <Button
                    variant="contained"
                    onClick={handlePlayAnimation}
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
                  onClick={handleResetAnimation}
                  aria-label="Reset animation"
                >
                  <RestartAlt />
                </Button>
              </Tooltip>
            </div>

            <div className="rle-speed-control">
              <label htmlFor="rle-speed-slider">Speed:</label>
              <Slider
                id="rle-speed-slider"
                value={animationSpeed}
                min={100}
                max={2000}
                step={30}
                onChange={(_, value) => setAnimationSpeed(Number(value))}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} ms delay`}
                aria-label="Animation speed"
              />
            </div>
          </div>
        </div>
        <div
          className={`rightContainer ${
            simulationMode === "text" ? "text-mode" : "image-mode"
          }`}
        >
          {simulationMode === "image" && (
          <div className="matrixPanel">
            <section
              className="rle-stage"
              aria-label="Binary image encoding stage"
            >
              <div
                className="rle-matrix-encoded-container"
                style={{
                  display: "flex",
                  gap: "5px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  width: "100%",
                  padding: "5px",
                  overflowX: "auto", // Responsive section
                }}
              >
                <div
                  className="rle-panel rle-matrix-panel"
                  style={{ flex: "0 0 auto", minWidth: "fit-content" }}
                >
                  <div className="rle-section-heading">
                    <h3>Choosen Binary Image</h3>
                  </div>

                  <div
                    className="rle-matrix"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${matrix[0].length}, 36px)`,
                      gridAutoRows: "36px",
                      gap: "4px",
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
                            style={{
                              width: "36px",
                              height: "36px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                            }}
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

                <div
                  className="rle-output-panel rle-output-panel-inline"
                  style={{
                    flex: "1 1 300px",
                    minWidth: "280px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div className="rle-section-heading">
                    <h3>Encoded Runs</h3>
                    <p>Hover a run to highlight its matching pixels.</p>
                  </div>
                  <div
                    className="rle-grouped-runs"
                    style={{
                      display: "flex",
                      gridAutoRows: "36px",
                      gap: "4px",
                      paddingTop: "0px",
                    }}
                    aria-label="Encoded run blocks grouped by scan line"
                  >
                    {/* Map through each row of the matrix to align runs with rows */}
                    {matrix.map((_, rowIndex) => {
                      const groupLabel =
                        scanDirection === "horizontal"
                          ? `Row ${rowIndex + 1}`
                          : `Column ${rowIndex + 1}`;
                      const group = visibleRunGroups.find(
                        (g) => g.groupLabel === groupLabel,
                      );

                      return (
                        <div
                          key={rowIndex}
                          className="rle-run-group"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0px",
                            height: "36px",
                          }}
                        >
                          <div
                            style={{
                              minWidth: "70px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#24963fff",
                            }}
                          >
                            <span className="rle-run-group-label">
                              {groupLabel}:
                            </span>
                          </div>

                          <div
                            className="rle-runs"
                            style={{
                              display: "flex",
                              gap: "4px",
                              alignItems: "center",
                              minHeight: "24px",
                              flexWrap: "nowrap",
                              overflow: "hidden",
                            }}
                          >
                            {group?.runs.map((run) => (
                              <button
                                key={run.id}
                                type="button"
                                className={`rle-run-pill run-${run.value}`}
                                onMouseEnter={() => setHoveredRunId(run.id)}
                                onMouseLeave={() => setHoveredRunId(null)}
                                onFocus={() => setHoveredRunId(run.id)}
                                onBlur={() => setHoveredRunId(null)}
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "13px",
                                  fontWeight: "500",
                            
                                  height: "24px",
                                  minWidth: "fit-content",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                aria-label={`${groupLabel}, run value ${run.value}, count ${run.count}`}
                              >
                                {run.value}:{run.count}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
          )}

          <section
            className="rle-panel rle-live-explanation-box"
            aria-live="polite"
          >
            <div className="rle-live-heading">
              <h3>Encoding Progress (Live scanning information and algorithm explanation.)</h3>
            </div>
            <div className="rle-live-content">
              <span className="rle-step-badge">
                Step :{" "}
                <strong>{Math.min(activeStepIndex, activeStepTotal)}</strong>
                <span>/ {activeStepTotal}</span>
              </span>
              <span>Current Value: <span style={{color: "red"}}> {currentRunValue ?? "-"}</span></span>
              <span>Run Count: {currentRunCount}</span>
              <span className="rle-explanation">{explanation}</span>
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
                  <span>{statLabels.original}</span>
                  <strong>{stats.originalSize}</strong>
                </div>
                <div className="rle-stat-card">
                  <span>{statLabels.encoded}</span>
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
          </section>

          {simulationMode === "text" && (
          <main className="rle-workspace">
            <aside className="rle-side-stack"></aside>

            <section
              className="rle-panel rle-text-panel"
              aria-label="Text RLE encoder"
            >
              <div className="rle-section-heading">
                <h3>Text RLE Visualization</h3>
                <p>Focus the text input, then press Play to scan characters.</p>
              </div>

              <div
                className="rle-text-character-row"
                aria-label="Animated text scan characters"
              >
                {textCells.length === 0 && (
                  <span className="rle-text-empty">
                    Enter text to visualize character runs.
                  </span>
                )}
                {textCells.map((cell) => {
                  const isActive = activeTextIndex === cell.index;
                  const isCompleted =
                    textHasAnimationProgress &&
                    cell.index < textStepIndex &&
                    !isActive;
                  const isHighlighted = highlightedTextPositions.has(
                    cell.index,
                  );

                  return (
                    <span
                      key={`${cell.value}-${cell.index}`}
                      className={`rle-text-cell ${
                        isActive ? "active" : ""
                      } ${isCompleted ? "completed" : ""} ${
                        isHighlighted ? "highlighted" : ""
                      }`}
                      aria-label={`Character ${cell.value === " " ? "space" : cell.value} at position ${
                        cell.index + 1
                      }`}
                    >
                      {cell.value === " " ? "space" : cell.value}
                    </span>
                  );
                })}
              </div>

              <div className="rle-section-heading compact">
                <h3>Encoded Text Runs</h3>
              </div>
              <div
                className="rle-runs text-runs"
                aria-label="Encoded text output"
              >
                {visibleTextRuns.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    className="rle-run-pill text-run"
                    onMouseEnter={() => setHoveredTextRunId(run.id)}
                    onMouseLeave={() => setHoveredTextRunId(null)}
                    onFocus={() => setHoveredTextRunId(run.id)}
                    onBlur={() => setHoveredTextRunId(null)}
                    aria-label={`Text run value ${
                      run.value === " " ? "space" : run.value
                    }, count ${run.count}`}
                  >
                    {run.value === " " ? "space" : run.value}:{run.count}
                  </button>
                ))}
              </div>
            </section>
          </main>
          )}
        </div>
      </div>
    </div>
  );
}
