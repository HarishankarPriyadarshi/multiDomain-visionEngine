import "../template.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
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

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SimContext } from "./context/SimContext";

import voice from "../assets/images/voice-play.png";
import voice_pause from "../assets/images/voice-pause.png";
import TutorSim from "./features/tutor/TutorSim";
import {
  appendRunLengthEncoding,
  downloadRunLengthReport,
  hasRunLengthReportData,
} from "./features/report/reportGenerator";

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
  const [matrix, setMatrix] = useState(null);
  const [simulationMode, setSimulationMode] = useState("image");
  const [selectedPattern, setSelectedPattern] = useState("");
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
  const animationSpeedRef = useRef(animationSpeed);
  const imageStartedAtRef = useRef(null);
  const textStartedAtRef = useRef(null);

  const [isMatrixVisible, setIsMatrixVisible] = useState(false);
  const [isEncodedVisible, setIsEncodedVisible] = useState(false);
  const [isEncodingLiveVisible, setIsEncodingLiveVisible] = useState(false);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [isEncodingTextVisible, setIsEncodingTextVisible] = useState(false);
  const [hasReportData, setHasReportData] = useState(() =>
    hasRunLengthReportData(),
  );
  const scanGroups = useMemo(
    () => (matrix ? buildScanGroups(matrix, scanDirection) : []),
    [matrix, scanDirection],
  );
  const scannedCells = useMemo(
    () => (scanGroups.length ? scanGroups.flatMap((group) => group.cells) : []),
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
  const isInputValid =
    simulationMode === "image" ? !!matrix : !!textData.trim();
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

  const saveCompletedImageReport = useCallback(() => {
    const completedAt = new Date().toISOString();
    appendRunLengthEncoding({
      inputType: "Binary Image",
      inputPattern: selectedPattern || "Custom",
      input: copyMatrix(matrix),
      scanDirection: scanDirection === "horizontal" ? "Horizontal" : "Vertical",
      minRunLength: Math.max(1, Number(minRunLength) || 1),
      startedAt: imageStartedAtRef.current || completedAt,
      completedAt,
      encodedGroups: encodedRunGroups.map((group) => ({
        groupLabel: group.groupLabel,
        runs: group.runs.map(({ value, count }) => ({ value, count })),
      })),
      encodedRuns: encodedRuns.map(({ value, count }) => ({ value, count })),
      stats: { ...imageStats, encodedRuns: encodedRuns.length },
    });
    setHasReportData(true);
  }, [
    encodedRunGroups,
    encodedRuns,
    imageStats,
    matrix,
    minRunLength,
    scanDirection,
    selectedPattern,
  ]);

  const saveCompletedTextReport = useCallback(() => {
    const completedAt = new Date().toISOString();
    appendRunLengthEncoding({
      inputType: "Text",
      input: textData,
      minRunLength: Math.max(1, Number(minRunLength) || 1),
      startedAt: textStartedAtRef.current || completedAt,
      completedAt,
      encodedRuns: textEncodedRuns.map(({ value, count }) => ({
        value,
        count,
      })),
      stats: { ...textStats, encodedRuns: textEncodedRuns.length },
    });
    setHasReportData(true);
  }, [minRunLength, textData, textEncodedRuns, textStats]);

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
    setIsEncodedVisible(false);
    setIsEncodingLiveVisible(false);
    setIsStatsVisible(false);
    imageStartedAtRef.current = null;
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
      if (startAt === 0 || !imageStartedAtRef.current) {
        imageStartedAtRef.current = new Date().toISOString();
      }
      isAnimatingRef.current = true;
      setIsAnimating(true);
      setHasAnimationProgress(true);
      setIsEncodingLiveVisible(true); // Show live encoding on start
      setIsEncodedVisible(true); // Show encoded run on play
      setVisibleRunCount(startAt === 0 ? 0 : visibleRunCount);
      let completed = true;

      for (let index = startAt; index < scannedCells.length; index += 1) {
        if (!isAnimatingRef.current || resetRequestedRef.current) {
          completed = false;
          break;
        }
        applyStep(index);
        await wait(2100 - animationSpeedRef.current);
      }

      if (!resetRequestedRef.current) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        if (completed) {
          setActiveCell(null);
          setIsStatsVisible(true); // Show stats on completion
          setExplanation(
            "Encoding complete. Hover any run to see its source pixels.",
          );
          saveCompletedImageReport();
        }
      }
    },
    [
      animationSpeed,
      applyStep,
      imageStepIndex,
      scannedCells.length,
      saveCompletedImageReport,
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
    setIsEncodingLiveVisible(false);
    setIsStatsVisible(false);
    textStartedAtRef.current = null;
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
      if (startAt === 0 || !textStartedAtRef.current) {
        textStartedAtRef.current = new Date().toISOString();
      }
      isAnimatingRef.current = true;
      setIsAnimating(true);
      setTextHasAnimationProgress(true);
      setIsEncodingLiveVisible(true); // Show live encoding on start
      setVisibleTextRunCount(startAt === 0 ? 0 : visibleTextRunCount);
      let completed = true;

      for (let index = startAt; index < textCells.length; index += 1) {
        if (!isAnimatingRef.current || resetRequestedRef.current) {
          completed = false;
          break;
        }
        applyTextStep(index);
        await wait(2100 - animationSpeedRef.current);
      }

      if (!resetRequestedRef.current) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        if (completed) {
          setActiveTextIndex(null);
          setIsStatsVisible(true); // Show stats on completion
          setExplanation(
            "Text encoding complete. Hover any run to see its source characters.",
          );
          saveCompletedTextReport();
        }
      }
    },
    [
      animationSpeed,
      applyTextStep,
      textCells.length,
      textStepIndex,
      saveCompletedTextReport,
      visibleTextRunCount,
    ],
  );

  const handlePlayAnimation = useCallback(() => {
    if (simulationMode === "image") {
      if (!matrix) {
        toast.error("Please select an image first");
        return;
      }
      playAnimation();
    } else {
      setIsEncodingTextVisible(true);
      if (!textData.trim()) {
        toast.error("Please enter the text first");
        return;
      }
      playTextAnimation();
    }
  }, [playAnimation, playTextAnimation, simulationMode, matrix, textData]);

  const handlePauseAnimation = useCallback(() => {
    if (simulationMode === "image") {
      if (!matrix) {
        toast.error("Please select an image first");
        return;
      }
    } else {
      if (!textData.trim()) {
        toast.error("Please enter the text first");
        return;
      }
    }
    pauseAnimation();
  }, [pauseAnimation, simulationMode, matrix, textData]);

  const handleResetAnimation = useCallback(() => {
    if (simulationMode === "image") {
      if (!matrix) {
        toast.error("Please select an image first");
        return;
      }
      resetAnimation();
    } else {
      setIsEncodingTextVisible(false);
      if (!textData.trim()) {
        toast.error("Please enter the text first");
        return;
      }
      resetTextAnimation();
    }
  }, [resetAnimation, resetTextAnimation, simulationMode, matrix, textData]);

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
      setIsMatrixVisible(true); // Show matrix on selection
      resetAnimation();
      setExplanation(`${pattern.name} pattern loaded.`);
    },
    [pauseAnimation, resetAnimation],
  );

  const generateNoise = useCallback(() => {
    pauseAnimation();
    setSelectedPattern("Random Noise");
    setMatrix(makeRandomNoise());
    setIsMatrixVisible(true); // Show matrix on noise generation
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
  const instructions = [
    "1. Select the simulation mode: Binary Image or Text RLE.",
    "2. Choose a binary image pattern or enter text data.",
    "3. Adjust the minimum run length if required.",
    "4. Click on the 'Play' button to start the animation.",
    "5. Observe the live scanning process and encoded runs.",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % instructions.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + instructions.length) % instructions.length,
    );
  };
  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  // tutor implimentation

  // tutor implementation
  const {
    isMobile,
    startTutorSim,
    handleSpeechToggleSim,
    tutorBtnRefSim,
    isSpeaking,
    isPaused,
    setTutorStepsSim,
    resetTutorSim,
    tutorStepSim,
    isTutorOpenSim,
    setTutorStepSim,
  } = useContext(SimContext);

  // Dynamic Tutor Steps for Run Length Encoding Simulation
  useEffect(() => {
    const baseSteps = [
      {
        title: "Welcome to Run Length Encoding Simulation",
        content:
          "This guided walkthrough demonstrates Run Length Encoding (RLE), a lossless compression technique that replaces consecutive repeated values with compact (value, count) pairs.",
        targetId: "guided-tutor-btn-sim",
        placement: "bottom",
      },

      {
        title: "Instruction Panel",
        content:
          "Use the navigation arrows here to read step-by-step instructions for performing the experiment correctly.",
        targetId: "inst_content_container",
        placement: "bottom",
      },

      {
        title: "Choose Input Type",
        content:
          "Select whether you want to perform Run Length Encoding on an image matrix or textual data.",
        targetId: "rle-mode-selection",
        placement: "right",
        offset: [-12, 10],
      },
    ];

    // IMAGE MODE
    if (simulationMode === "image") {
      baseSteps.push(
        {
          title: "Choose Binary Image",
          content:
            "This binary image acts as the input image for Run Length Encoding. ",
          targetId: "rle-image-grid",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Generate Random Binary Image",
          content:
            "Alternatively, you can generate a random binary image pattern. ",
          targetId: "generate-random-binary-image-btn",
          placement: "right",
          offset: [0, 10],
        },
      );
      if (!isMatrixVisible) {
        baseSteps.push({
          title: "Action Required",
          content:
            "Please first choose a binary image pattern or generate a random one.",
          targetId: "generate-random-binary-image-btn",
          placement: "left",
          offset: [0, 10],
        });

        setTutorStepsSim(baseSteps);
      }
      baseSteps.push(
        {
          title: "Chosen Binary Image",
          content:
            "This binary image acts as the input matrix for Run Length Encoding. ",
          targetId: "chosen-image-matrix-zone",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Minimum Run Length",
          content:
            "The Minimum Run Length decides when repeated values should be compressed. If the same value repeats enough times to meet the selected limit, it is stored as a compact (value, count) pair. Smaller repeated groups are stored normally without compression.",
          targetId: "rle-section-input",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Select Scan Direction",
          content:
            "Choose how the encoder will process the matrix. Horizontal scanning processes rows left-to-right, while vertical scanning processes columns top-to-bottom.",
          targetId: "scan-direction-zone",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Pause Animation",
          content:
            "During Encoding, You can click the Pause button to temporarily stop the Run Length Encoding animation. ",
          targetId: "pause-btn-zone",
          placement: "left",
          offset: [0, 10],
        },
        {
          title: "Reset Simulation",
          content:
            " You can click the Reset button to return to its initial state .",
          targetId: "reset-btn-zone",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Animation Speed Control",
          content:
            "Use the speed slider to control how fast the Run Length Encoding animation runs. ",
          targetId: "rle-speed-slider",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Start Run Length Encoding",
          content:
            "Click the 'Play' button to begin animated scanning and run detection.",
          targetId: "play-rle-btn-zone",
          placement: "left",
          offset: [0, 10],
        },
      );
      if (!isEncodedVisible) {
        baseSteps.push({
          title: "Action Required",
          content:
            "Please first click the 'Play' button to start the Run Length Encoding animation. ",
          targetId: "play-rle-btn-zone",
          placement: "left",
          offset: [0, 10],
        });
        setTutorStepsSim(baseSteps);
        return;
      }
      baseSteps.push(
        {
          title: "Current Scanned Cell",
          content:
            "The highlighted red cell shows the current pixel being processed by the Run Length Encoding algorithm. The encoder scans the matrix one value at a time according to the selected scan direction and checks whether consecutive values are repeating.",
          targetId: "chosen-image-matrix-zone",
          placement: "left",
          offset: [0, 10],
        },

        {
          title: "Encoded Run Output",
          content:
            "Whenever a sequence of repeated values is completed, the encoder stores it as a compact (value, count) pair inside this encoded run box. For example, four consecutive 1s are stored as (1,4).",
          targetId: "encoded-runs-box-zone",
          placement: "top",
          offset: [130, 10],
        },

        {
          title: "Live Encoding Progress",
          content:
            "This section displays the current encoding process in real time. It shows the current pixel value being scanned, the active run value, and the number of consecutive repetitions detected so far.",
          targetId: "rle-live-progress-zone",
          placement: "right",
          offset: [0, 10],
        },
      );
      if (!isStatsVisible) {
        baseSteps.push({
          title: "Action Required",
          content: "Please wait for the encoding process to complete.",
          targetId: "rle-live-progress-zone",
          placement: "left",
          offset: [0, 10],
        });
        setTutorStepsSim(baseSteps);
        return;
      }
      baseSteps.push(
        {
          title: "Compression Statistics",
          content:
            "These statistics summarize the compression performance after encoding. The compression ratio compares the encoded data size with the original data size. Better compression occurs when longer repeated runs are present.",
          targetId: "rle-statistics-zone",
          placement: "top",
          offset: [0, 10],
        },

        {
          title: "Binary Image Encoding Completed",
          content:
            "Congratulations! The binary image has been successfully encoded using Run Length Encoding. You can now switch to Text RLE mode to observe how the same compression technique works on character sequences.",
          targetId: "rle-statistics-zone",
          placement: "bottom",
          offset: [0, 10],
        },
      );
      setTutorStepsSim(baseSteps);
    }

    // TEXT MODE
    if (simulationMode === "text") {
      baseSteps.push({
        title: "Enter Text Input",
        content:
          "Type any sequence of characters here. Run Length Encoding will compress consecutive repeated characters into compact (character, count) pairs.",
        targetId: "text-input-zone",
        placement: "left",
        offset: [0, 10],
      });

      if (textCells.length === 0) {
        baseSteps.push({
          title: "Action Required",
          content: "Please first enter a text sequence to compress it.",
          targetId: "text-input-zone",
          placement: "left",
          offset: [0, 10],
        });

        setTutorStepsSim(baseSteps);
        return;
      }
      baseSteps.push(
        {
          title: "Input Text Sequence",
          content:
            "This is the original input text that will be scanned character-by-character during the Run Length Encoding process.",
          targetId: "text-rle-visualization-zone",
          placement: "top",
          offset: [0, 10],
        },
        {
          title: "Minimum Run Length",
          content:
            "The Minimum Run Length decides when repeated values should be compressed. If the same value repeats enough times to meet the selected limit, it is stored as a compact (value, count) pair. Smaller repeated groups are stored normally without compression.",
          targetId: "rle-section-input",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Pause Animation",
          content:
            "During Encoding, You can click the Pause button to temporarily stop the Run Length Encoding animation. ",
          targetId: "pause-btn-zone",
          placement: "left",
          offset: [0, 10],
        },
        {
          title: "Reset Simulation",
          content:
            " You can click the Reset button to return to its initial state .",
          targetId: "reset-btn-zone",
          placement: "right",
          offset: [0, 10],
        },
        {
          title: "Animation Speed Control",
          content:
            "Use the speed slider to control how fast the Run Length Encoding animation runs. ",
          targetId: "rle-speed-slider",
          placement: "right",
          offset: [0, 10],
        },

        {
          title: "Start Text Encoding",
          content:
            "Click the 'Play' button to begin animated Run Length Encoding on the entered text sequence.",
          targetId: "play-rle-btn-zone",
          placement: "left",
          offset: [0, 10],
        },
      );

      if (!isEncodingTextVisible) {
        baseSteps.push({
          title: "Action Required",
          content: "Please, click the Run button to continue encoding.",
          targetId: "play-rle-btn-zone",
          placement: "left",
          offset: [0, 10],
        });
        setTutorStepsSim(baseSteps);
        return;
      }

      baseSteps.push(
        {
          title: "Current Highlighted Character",
          content:
            "The highlighted character shows the current position being processed by the encoder. Consecutive repeated characters are grouped into runs.",
          targetId: "text-input-container-zone",
          placement: "right",
          offset: [0, 10],
        },

        {
          title: "Encoded Text Runs",
          content:
            "Completed character runs are displayed here as compact (character, count) pairs. For example, AAAA becomes (A,4).",
          targetId: "text-encoded-output-zone",
          placement: "right",
          offset: [0, 10],
        },

        {
          title: "Live Encoding Progress",
          content:
            "This section shows the current character, active run value, and run count while the text is being encoded step-by-step.",
          targetId: "rle-live-progress-zone",
          placement: "right",
          offset: [0, 10],
        },
      );
      if (!isStatsVisible) {
        baseSteps.push({
          title: "Action Required",
          content: "Please wait for the encoding process to complete.",
          targetId: "rle-live-progress-zone",
          placement: "left",
          offset: [0, 10],
        });
        setTutorStepsSim(baseSteps);
        return;
      }
      baseSteps.push(
        {
          title: "Compression Statistics",
          content:
            "These statistics compare the original text length with the encoded output length and display the achieved compression ratio.",
          targetId: "rle-statistics-zone",
          placement: "top",
          offset: [0, 10],
        },

        {
          title: "Text Run Length Encoding Completed",
          content:
            "Congratulations! The text sequence has been successfully compressed using Run Length Encoding. You have now completed both Binary Image RLE and Text RLE simulations.",
          targetId: "rle-statistics-zone",
          placement: "bottom",
          offset: [0, 10],
        },
      );
    }

    setTutorStepsSim(baseSteps);
  }, [
    simulationMode,
    matrix,
    textData,
    scanDirection,
    minRunLength,
    isAnimating,
    visibleRunCount,
    isEncodedVisible,
    hoveredRunId,
    selectedPattern,
    activeCell,
    currentRunValue,
    currentRunCount,
    stepIndex,
    textCells,
    isStatsVisible,
  ]);

  return (
    <div id="main-box-temp" className="rle-visualizer">
      <ToastContainer position="bottom-left" />
      <DialogTitle id="instructions-dialog-title" className="rle-titlebar">
        {/* <span>Run Length Encoding Visualizer</span>
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
        </div> */}
        <div
          style={{
            width: "50%",
            justifyContent: "flex-start",
            display: "flex",
          }}
        >
          {isMobile ? "Simulation" : "Run Length Encoding Visualizer"}
        </div>
        <div
          style={{
            width: "50%",

            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Button
            id="guided-tutor-btn-sim"
            ref={tutorBtnRefSim}
            style={{
              color: "#1D2A6D",
              backgroundColor: "#FFD700",
              fontWeight: "bold",
              margin: "auto auto",
              marginRight: "10px",
              borderRadius: "20px",
              padding: "5px 15px",
              height: "40px",
            }}
            onClick={startTutorSim}
          >
            {isMobile ? "Tutor" : "Guided Tutor"}
          </Button>
          <Button
            id="download-report-btn-rle"
            disabled={!hasReportData}
            onClick={downloadRunLengthReport}
            className="morph-report-btn"
          >
            {isMobile ? "Report" : "Download Report"}
          </Button>

          <Button
            id="sound-btn-sim"
            title={isSpeaking && !isPaused ? "Pause" : "Play"}
            onClick={handleSpeechToggleSim}
          >
            <img
              src={isSpeaking && !isPaused ? voice_pause : voice}
              alt="voice"
              style={{ width: "40px", height: "auto", marginRight: "10px" }}
            />
          </Button>
          <Button
            className="close-btn"
            onClick={() => {
              resetTutorSim();
              handleClose2Modal();
            }}
            color="primary"
            style={{ backgroundColor: "beige", marginRight: "10px" }}
          >
            Close
          </Button>
        </div>
      </DialogTitle>
      <div id="inst_div_edge">
        <div
          id="inst_content_container"
          style={{
            padding: "2px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            minHeight: "30px",
            backgroundColor: "black",
            color: "white",
          }}
        >
          <div id="inst_content_edge">
            <button onClick={prevSlide} style={{ marginRight: "10px" }}>
              <span className="prev-icon" aria-hidden="true">
                ⮜
              </span>
            </button>
            <span>{instructions[currentIndex]}</span>
            <button onClick={nextSlide} style={{ zIndex: 10001 }}>
              <span className="next-icon" aria-hidden="true">
                ⮞
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="ParentContainer">
        <div className="leftContainer">
          <div className="choosePanel">
            <h2 className="rle-input-heading">Input Source</h2>
            <div
              id="rle-mode-selection"
              className="rle-mode-selector"
              aria-label="Simulation mode"
            >
              <button
                type="button"
                className={`rle-mode-option ${
                  simulationMode === "image" ? "active" : ""
                }`}
                onClick={() => {
                  if (isTutorOpenSim && tutorStepSim >= 2) {
                    setTutorStepSim(3);
                  }
                  pauseAnimation();
                  setSimulationMode("image");
                  setStepIndex(imageStepIndex);
                  // Reset states for mode switch
                  setMatrix(null);
                  setSelectedPattern("");
                  setTextData("");
                  setIsMatrixVisible(false);
                  setIsEncodedVisible(false);
                  setIsEncodingLiveVisible(false);
                  setIsStatsVisible(false);
                  resetAnimation();
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
                  if (isTutorOpenSim && tutorStepSim >= 2) {
                    setTutorStepSim(3);
                  }
                  pauseAnimation();
                  setSimulationMode("text");
                  setStepIndex(textStepIndex);
                  // Reset states for mode switch
                  setMatrix(null);
                  setSelectedPattern("");
                  setTextData("");
                  setIsMatrixVisible(false);
                  setIsEncodedVisible(false);
                  setIsEncodingLiveVisible(false);
                  setIsStatsVisible(false);
                  resetTextAnimation();
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
                  id="generate-random-binary-image-btn"
                  variant="contained"
                  onClick={generateNoise}
                  aria-label="Generate random noise pattern"
                  className="rle-noise-button"
                >
                  Generate Random Binary Image
                </Button>
              </>
            ) : (
              <div>
                <div className="rle-section-heading">
                  <h3>Enter Text Data:</h3>
                </div>
                <div id="text-input-zone">
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
                  id="scan-direction-zone"
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
                    id="play-rle-btn-zone"
                    variant="contained"
                    onClick={handlePlayAnimation}
                    // disabled={isAnimating || !isInputValid}
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
                    id="pause-btn-zone"
                    variant="outlined"
                    onClick={handlePauseAnimation}
                    disabled={!isAnimating}
                    aria-label="Pause animation"
                  >
                    <Pause />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Reset">
                <Button
                  id="reset-btn-zone"
                  variant="outlined"
                  onClick={handleResetAnimation}
                  disabled={!isInputValid}
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
                //valueLabelDisplay="auto"
                // valueLabelFormat={(value) => `${value} ms delay`}
                aria-label="Animation speed"
              />
            </div>
          </div>
        </div>
        <div
          className={`rightContainer ${
            simulationMode === "text" ? "text-mode" : "image-mode"
          }`}
          style={{
            visibility:
              simulationMode === "image" && !isMatrixVisible
                ? "hidden"
                : "visible",
          }}
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
                    <div
                      id="chosen-image-matrix-heading-zone"
                      className="rle-section-heading"
                    >
                      <h3>Chosen Binary Image</h3>
                    </div>

                    <div
                      id="chosen-image-matrix-zone"
                      className="rle-matrix"
                      style={{
                        display: "grid",
                        gridTemplateColumns: matrix
                          ? `repeat(${matrix[0].length}, 36px)`
                          : "none",
                        gridAutoRows: "36px",
                        gap: "4px",
                      }}
                      role="grid"
                      aria-label="Editable binary pixel matrix"
                    >
                      {matrix &&
                        matrix.map((row, rowIndex) =>
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
                      display: isEncodedVisible ? "flex" : "none",
                      flexDirection: "column",
                    }}
                  >
                    <div className="rle-section-heading">
                      <h3>Encoded Runs</h3>
                      <p>Hover a run to highlight its matching pixels.</p>
                    </div>
                    <div
                      id="encoded-runs-box-zone"
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
                      {matrix &&
                        matrix.map((_, rowIndex) => {
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
            id="rle-live-progress-zone"
            className="rle-panel rle-live-explanation-box"
            aria-live="polite"
            style={{ display: isEncodingLiveVisible ? "block" : "none" }}
          >
            <div className="rle-live-heading">
              <h3>
                Encoding Progress (Live scanning information and algorithm
                explanation.)
              </h3>
            </div>
            <div className="rle-live-content">
              <span className="rle-step-badge">
                Step :{" "}
                <strong>{Math.min(activeStepIndex, activeStepTotal)}</strong>
                <span>/ {activeStepTotal}</span>
              </span>
              <span>
                Current Value:{" "}
                <span style={{ color: "red" }}> {currentRunValue ?? "-"}</span>
              </span>
              <span>Run Count: {currentRunCount}</span>
              <span className="rle-explanation">{explanation}</span>
            </div>

            <div
              id="rle-statistics-zone"
              className="rle-panel rle-stats-panel"
              aria-label="Compression statistics"
              style={{ display: isStatsVisible ? "block" : "none" }}
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
                  <p>
                    Focus the text input, then press Play to scan characters.
                  </p>
                </div>

                <div
                  id="text-rle-visualization-zone"
                  className="rle-text-character-row"
                  aria-label="Animated text scan characters"
                >
                  {textCells.length === 0 && (
                    <span className="rle-text-empty">
                      Enter text to visualize character runs.
                    </span>
                  )}
                  <div id="text-input-container-zone">
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
                </div>

                <div className="rle-section-heading compact">
                  <h3>Encoded Text Runs</h3>
                </div>
                <div
                  id="text-encoded-output-zone"
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
      {/* tutor modal */}
      <TutorSim />
    </div>
  );
}
