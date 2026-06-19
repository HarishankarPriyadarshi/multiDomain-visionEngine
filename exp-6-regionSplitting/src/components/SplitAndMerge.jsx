import "../region_animation.css";
import "../App.css";
import { useEffect, useMemo, useState } from "react";
import { OpenCvProvider } from "opencv-react";
import { Button, DialogTitle } from "@mui/material";
import { ToastContainer } from "react-toastify";

const MATRIX_SIZE = 8;

function buildMatrix(seed = 0) {
  const topLeftValue = (seed % 3) + 1;
  const topRightBlocks = [
    [6, 6, 8, 8],
    [6, 6, 8, 8],
    [7, 7, 9, 9],
    [7, 7, 9, 9],
  ];
  const bottomLeft = [
    [1, 10, 2, 9],
    [8, 3, 10, 1],
    [2, 9, 4, 10],
    [10, 1, 8, 3],
  ];
  const bottomRight = [
    [4, 4, 4, 4],
    [4, 5, 4, 4],
    [4, 4, 4, 4],
    [4, 4, 4, 5],
  ];

  return Array.from({ length: MATRIX_SIZE }, (_, row) =>
    Array.from({ length: MATRIX_SIZE }, (_, col) => {
      if (row < 4 && col < 4) return topLeftValue;
      if (row < 4) return topRightBlocks[row][col - 4];
      if (col < 4) return bottomLeft[row - 4][col];
      return bottomRight[row - 4][col - 4];
    }),
  );
}

function getRegionValues(matrix, x, y, size) {
  return matrix.slice(x, x + size).flatMap((row) => row.slice(y, y + size));
}

function getStandardDeviation(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
}

function buildSplitSteps(matrix, threshold) {
  let regionCounter = 0;
  const steps = [];
  const tree = {
    id: "R0",
    x: 0,
    y: 0,
    size: MATRIX_SIZE,
    status: "unprocessed",
    children: [],
  };

  const recursiveSplit = (node) => {
    const values = getRegionValues(matrix, node.x, node.y, node.size);
    const sigma = getStandardDeviation(values);
    const shouldSplit = sigma > threshold && node.size > 1;

    steps.push({
      type: shouldSplit ? "split" : "homogeneous",
      nodeId: node.id,
      x: node.x,
      y: node.y,
      size: node.size,
      sigma,
      childIds: shouldSplit ? [] : undefined,
    });

    if (!shouldSplit) return;

    const half = Math.ceil(node.size / 2);
    const children = [
      { x: node.x, y: node.y },
      { x: node.x, y: node.y + half },
      { x: node.x + half, y: node.y },
      { x: node.x + half, y: node.y + half },
    ].map((region) => ({
      id: `R${++regionCounter}`,
      x: region.x,
      y: region.y,
      size: half,
      status: "unprocessed",
      children: [],
    }));

    node.children = children;
    steps[steps.length - 1].childIds = children.map((child) => child.id);
    children.forEach(recursiveSplit);
    steps.push({
      type: "merged",
      nodeId: node.id,
      x: node.x,
      y: node.y,
      size: node.size,
      sigma,
      childIds: children.map((child) => child.id),
    });
  };

  recursiveSplit(tree);
  return { steps, tree };
}

function getStatusesForStep(steps, currentStep) {
  const statuses = {};

  steps.slice(0, currentStep + 1).forEach((step, index) => {
    if (step.type === "split") statuses[step.nodeId] = "split";
    if (step.type === "homogeneous") statuses[step.nodeId] = "homogeneous";
    if (step.type === "merged") statuses[step.nodeId] = "merged";
    if (index === currentStep) statuses[step.nodeId] = "current";
  });

  return statuses;
}

function getVisibleRegions(steps, currentStep) {
  const regionsByNode = {};

  steps.slice(0, currentStep + 1).forEach((step, index) => {
    regionsByNode[step.nodeId] = {
      ...step,
      isCurrent: index === currentStep,
    };
  });

  return Object.values(regionsByNode);
}

function MatrixView({ matrix, visibleRegions = [], animated = false }) {
  return (
    <div
      className="matrix-grid-region"
      style={{ gridTemplateColumns: `repeat(${MATRIX_SIZE}, 1fr)` }}
    >
      {matrix.map((row, rowIndex) =>
        row.map((cell, cellIndex) => (
          <div
            key={`${rowIndex}-${cellIndex}-${animated ? "animated" : "base"}`}
            id="original_matrix_region"
            className={animated ? "matrix-animate" : ""}
            style={{
              animationDelay: `${rowIndex * 0.08}s`,
            }}
          >
            {cell}
          </div>
        )),
      )}
      {visibleRegions.map((region) => (
        <div
          key={`${region.nodeId}-${region.type}`}
          className={`region-overlay region-${region.type} ${
            region.isCurrent ? "region-current" : ""
          }`}
          style={{
            gridColumn: `${region.y + 1} / span ${region.size}`,
            gridRow: `${region.x + 1} / span ${region.size}`,
          }}
        />
      ))}
    </div>
  );
}

function ExplanationBox({ step, stepNumber, threshold }) {
  if (!step) {
    return (
      <div id="explanation-box">
        <h2>Ready to Split</h2>
        <p>
          Generate a structured matrix, then use Next or Auto Play to inspect
          each recursive region check.
        </p>
      </div>
    );
  }

  const relation = step.sigma > threshold ? ">" : "<=";

  return (
    <div id="explanation-box">
      <h2>Step {stepNumber}</h2>
      <p>Checking region {step.nodeId}</p>
      <p>Standard deviation = {step.sigma.toFixed(2)}</p>
      <p>Threshold = {threshold.toFixed(2)}</p>
      {step.type === "split" && (
        <>
          <p>
            Since: sigma {relation} threshold, region {step.nodeId} is not
            homogeneous.
          </p>
          <p>Splitting into: {step.childIds.join(", ")}</p>
        </>
      )}
      {step.type === "homogeneous" && (
        <p>
          Since: sigma {relation} threshold, region {step.nodeId} is
          homogeneous. No further splitting required.
        </p>
      )}
      {step.type === "merged" && (
        <p>
          Children {step.childIds.join(", ")} are complete, so region{" "}
          {step.nodeId} is merged into the final segmentation tree.
        </p>
      )}
    </div>
  );
}

function TreeNode({ node, statuses }) {
  const status = statuses[node.id] || "unprocessed";

  return (
    <div className="tree-node-wrap-region">
      <div className={`tree-node-region tree-${status}`}>{node.id}</div>
      {node.children.length > 0 && (
        <div className="tree-children-region">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} statuses={statuses} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SplitAndMerge({ handleClose3Modal }) {
  const [original, setOriginal] = useState(() => buildMatrix(0));
  const [threshold, setThreshold] = useState(0.8);
  const [generation, setGeneration] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const { steps, tree } = useMemo(
    () => buildSplitSteps(original, threshold),
    [original, threshold],
  );
  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;
  const statuses = getStatusesForStep(steps, currentStep);
  const visibleRegions = getVisibleRegions(steps, currentStep);

  function handleGenerateMatrix() {
    const nextGeneration = generation + 1;
    setGeneration(nextGeneration);
    setOriginal(buildMatrix(nextGeneration));
    setThreshold(Number((0.75 + (nextGeneration % 2) * 0.1).toFixed(2)));
    setCurrentStep(-1);
    setIsAutoPlaying(false);
  }

  function handleReset() {
    setCurrentStep(-1);
    setIsAutoPlaying(false);
  }

  function handleNextStep() {
    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  }

  function handlePreviousStep() {
    setCurrentStep((prev) => Math.max(-1, prev - 1));
    setIsAutoPlaying(false);
  }

  useEffect(() => {
    if (!isAutoPlaying) return undefined;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isAutoPlaying, steps.length]);

  const instructions = [
    "1. Click to select an image and observe the resulting image.",
    "2. Click the 'Process' button to see the output.",
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

  return (
    <OpenCvProvider>
      <div id="main-box-region">
        <DialogTitle id="instructions-dialog-title" className="rle-titlebar">
          <div
            style={{
              width: "50%",
              justifyContent: "flex-start",
              display: "flex",
            }}
          >
            Region Splitting and Merging
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
              onClick={() => {
                handleClose3Modal();
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
        <div id="generate-box-region">
          <div className="generate-card-region">
            <div>
              <h2>Generate Matrix</h2>
              <p>Threshold: {threshold.toFixed(2)}</p>
            </div>
            <Button className="tool_btn" onClick={handleGenerateMatrix}>
              Generate Matrix
            </Button>
          </div>
        </div>

        <div id="image-box-region">
          <div id="left-image-box-region">
            <div id="head-image-temp">
              <h1>Original Matrix</h1>
            </div>
            <div id="original-image-temp">
              <MatrixView matrix={original} animated />
            </div>
          </div>

          <div id="region_arrow">&#129066;</div>

          <div id="right-image-box-region">
            <div id="head-image-temp">
              <h1>Splitting Animation</h1>
            </div>
            <div id="animated-image-temp-region">
              <MatrixView
                matrix={original}
                visibleRegions={visibleRegions}
              />
            </div>
            <ExplanationBox
              step={currentStepData}
              stepNumber={currentStep + 1}
              threshold={threshold}
            />
            <div className="control-buttons">
              <button id="reset-btn" onClick={handleReset}>
                <span>↻</span>
                <span>Reset</span>
              </button>

              <button onClick={handlePreviousStep} disabled={currentStep < 0}>
                <span>⬅</span>
                <span>Previous</span>
              </button>

              <button
                id="next-btn"
                onClick={handleNextStep}
                disabled={currentStep >= steps.length - 1}
              >
                <span>➡</span>
                <span>Next</span>
              </button>

              <button
                onClick={() => setIsAutoPlaying((prev) => !prev)}
                disabled={currentStep >= steps.length - 1}
              >
                <span>▶</span>
                <span>{isAutoPlaying ? "Pause" : "Auto Play"}</span>
              </button>
            </div>
          </div>
        </div>

        <div id="tree-container-region">
          <h1>Quadtree Representation</h1>
          <div className="tree-region">
            <TreeNode node={tree} statuses={statuses} />
          </div>
        </div>
        <ToastContainer position="bottom-left" />
      </div>
    </OpenCvProvider>
  );
}
