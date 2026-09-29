import "../region_animation.css";
import "../App.css";
import { useEffect, useMemo, useState } from "react";
import { OpenCvProvider } from "opencv-react";
import { Button, DialogTitle } from "@mui/material";
import { ToastContainer } from "react-toastify";

const MATRIX_SIZE = 8;
const REGION_COLORS = [
  "#A7F3D0",
  "#BFDBFE",
  "#FBCFE8",
  "#FDE68A",
  "#C7D2FE",
  "#FDBA74",
  "#FCA5A5",
  "#86EFAC",
  "#DDD6FE",
  "#F9A8D4",
  "#93C5FD",
  "#FCD34D",
  "#99F6E4",
  "#FECACA",
  "#D9F99D",
  "#E9D5FF",
  "#BAE6FD",
  "#FED7AA",
  "#C4B5FD",
  "#6EE7B7",
];
const TREE_NODE_SIZE = 55;
const TREE_X_GAP = 34;
const TREE_Y_GAP = 92;
const TREE_PADDING = 28;

function createRandom(seed) {
  let value = (seed + 1) * 2654435761;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function buildMatrix(seed = 0) {
  const random = createRandom(seed);
  const topLeftValue = randomInt(random, 1, 10);
  const bottomRightValue = randomInt(random, 1, 10);
  const topRightValues = shuffle([1, 4, 7, 10], random);
  const topRightBlocks = [
    [
      topRightValues[0],
      topRightValues[0],
      topRightValues[1],
      topRightValues[1],
    ],
    [
      topRightValues[0],
      topRightValues[0],
      topRightValues[1],
      topRightValues[1],
    ],
    [
      topRightValues[2],
      topRightValues[2],
      topRightValues[3],
      topRightValues[3],
    ],
    [
      topRightValues[2],
      topRightValues[2],
      topRightValues[3],
      topRightValues[3],
    ],
  ];
  const bottomLeft = Array.from({ length: 4 }, () => Array(4).fill(0));

  for (let blockRow = 0; blockRow < 2; blockRow += 1) {
    for (let blockCol = 0; blockCol < 2; blockCol += 1) {
      const low = randomInt(random, 1, 4);
      const high = randomInt(random, 7, 10);
      const pattern =
        random() > 0.5
          ? [
            [low, high],
            [high, low],
          ]
          : [
            [high, low],
            [low, high],
          ];

      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 2; col += 1) {
          bottomLeft[blockRow * 2 + row][blockCol * 2 + col] =
            pattern[row][col];
        }
      }
    }
  }

  return Array.from({ length: MATRIX_SIZE }, (_, row) =>
    Array.from({ length: MATRIX_SIZE }, (_, col) => {
      if (row < 4 && col < 4) return topLeftValue;
      if (row < 4) return topRightBlocks[row][col - 4];
      if (col < 4) return bottomLeft[row - 4][col];
      return bottomRightValue;
    }),
  );
}

function getRegionValues(matrix, x, y, size) {
  return matrix.slice(x, x + size).flatMap((row) => row.slice(y, y + size));
}

function getStandardDeviation(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getDynamicThreshold(matrix) {
  const topRightDeviation = getStandardDeviation(
    getRegionValues(matrix, 0, 4, 4),
  );
  const bottomLeftBlockDeviations = [
    getStandardDeviation(getRegionValues(matrix, 4, 0, 2)),
    getStandardDeviation(getRegionValues(matrix, 4, 2, 2)),
    getStandardDeviation(getRegionValues(matrix, 6, 0, 2)),
    getStandardDeviation(getRegionValues(matrix, 6, 2, 2)),
  ];
  const smallestRecursiveDeviation = Math.min(...bottomLeftBlockDeviations);
  const threshold = Math.min(
    topRightDeviation * 0.55,
    smallestRecursiveDeviation * 0.75,
  );

  return Number(Math.max(0.5, threshold).toFixed(2));
}

function buildSplitSteps(matrix, threshold) {
  const steps = [];
  const colorMap = new Map([["R0", REGION_COLORS[0]]]);
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
    const nextColorIndex = colorMap.size;
    const children = [
      { x: node.x, y: node.y },
      { x: node.x, y: node.y + half },
      { x: node.x + half, y: node.y },
      { x: node.x + half, y: node.y + half },
    ].map((region, index) => {
      const childId = `${node.id}${index + 1}`;
      colorMap.set(
        childId,
        REGION_COLORS[(nextColorIndex + index) % REGION_COLORS.length],
      );
      return {
        id: childId,
        x: region.x,
        y: region.y,
        size: half,
        status: "unprocessed",
        children: [],
      };
    });

    node.children = children;
    steps[steps.length - 1].childIds = children.map((child) => child.id);
    steps.push({
      type: "children",
      nodeId: node.id,
      x: node.x,
      y: node.y,
      size: node.size,
      sigma,
      childIds: children.map((child) => child.id),
    });
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
  steps.push(...buildMergeSteps(matrix, threshold, tree, colorMap));
  return { steps, tree, colorMap };
}

function getLeafRegions(node) {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(getLeafRegions);
}

function getRegionCells(region) {
  const cells = [];

  for (let row = region.x; row < region.x + region.size; row += 1) {
    for (let col = region.y; col < region.y + region.size; col += 1) {
      cells.push({ row, col });
    }
  }

  return cells;
}

function getMeanFromCells(matrix, cells) {
  return (
    cells.reduce((sum, cell) => sum + matrix[cell.row][cell.col], 0) /
    cells.length
  );
}

function areRegionGroupsAdjacent(leftGroup, rightGroup) {
  const rightCells = new Set(
    rightGroup.cells.map((cell) => `${cell.row},${cell.col}`),
  );

  return leftGroup.cells.some((cell) =>
    [
      [cell.row - 1, cell.col],
      [cell.row + 1, cell.col],
      [cell.row, cell.col - 1],
      [cell.row, cell.col + 1],
    ].some(([row, col]) => rightCells.has(`${row},${col}`)),
  );
}

function getGroupKey(group) {
  return [...group.leafIds].sort().join("+");
}

function getSharedParentId(regionIds) {
  if (regionIds.length === 0) return "R0";
  let prefix = regionIds[0];

  regionIds.slice(1).forEach((regionId) => {
    while (prefix && !regionId.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  });

  if (prefix.length > 2) return prefix.slice(0, -1);
  return "R0";
}

function buildMergeSteps(matrix, threshold, tree, colorMap) {
  const leafRegions = getLeafRegions(tree);
  let mergeCount = 0;
  let groups = leafRegions.map((region) => {
    const cells = getRegionCells(region);
    return {
      label: region.id,
      leafIds: [region.id],
      cells,
      mean: getMeanFromCells(matrix, cells),
    };
  });
  const checkedPairs = new Set();
  const mergeSteps = [];
  let hasMoreDecisions = true;

  while (hasMoreDecisions && mergeSteps.length < 120) {
    hasMoreDecisions = false;

    for (let leftIndex = 0; leftIndex < groups.length; leftIndex += 1) {
      let stepCreated = false;

      for (
        let rightIndex = leftIndex + 1;
        rightIndex < groups.length;
        rightIndex += 1
      ) {
        const leftGroup = groups[leftIndex];
        const rightGroup = groups[rightIndex];

        if (!areRegionGroupsAdjacent(leftGroup, rightGroup)) continue;

        const pairKey = [getGroupKey(leftGroup), getGroupKey(rightGroup)]
          .sort()
          .join("|");
        if (checkedPairs.has(pairKey)) continue;

        checkedPairs.add(pairKey);
        hasMoreDecisions = true;

        const difference = Math.abs(leftGroup.mean - rightGroup.mean);
        const allowed = difference <= threshold;
        const mergedId = allowed ? `M${mergeCount + 1}` : undefined;
        const mergedColor = allowed
          ? REGION_COLORS[(colorMap.size + mergeCount) % REGION_COLORS.length]
          : undefined;
        const mergedLeafIds = [...leftGroup.leafIds, ...rightGroup.leafIds];
        const mergedCells = [...leftGroup.cells, ...rightGroup.cells];

        mergeSteps.push({
          type: "merge",
          nodeId: allowed ? mergedId : leftGroup.label,
          leftLabel: leftGroup.label,
          rightLabel: rightGroup.label,
          leftIds: leftGroup.leafIds,
          rightIds: rightGroup.leafIds,
          leftMean: leftGroup.mean,
          rightMean: rightGroup.mean,
          difference,
          threshold,
          allowed,
          mergedId,
          mergedColor,
          parentId: getSharedParentId(mergedLeafIds),
        });

        if (allowed) {
          mergeCount += 1;
          groups = groups.filter(
            (group) => group !== leftGroup && group !== rightGroup,
          );
          groups.push({
            label: mergedId,
            leafIds: mergedLeafIds,
            cells: mergedCells,
            mean: getMeanFromCells(matrix, mergedCells),
          });
        }

        stepCreated = true;
        break;
      }

      if (stepCreated) break;
    }
  }

  mergeSteps.push({ type: "complete", nodeId: "final" });
  return mergeSteps;
}

function getStatusesForStep(steps, currentStep, tree) {
  const statuses = {};
  statuses[tree.id] = "unprocessed";

  steps.slice(0, currentStep + 1).forEach((step, index) => {
    if (step.type === "split") statuses[step.nodeId] = "split";
    if (step.type === "homogeneous") statuses[step.nodeId] = "homogeneous";
    if (step.type === "merged") statuses[step.nodeId] = "merged";
    if (step.type === "children") {
      statuses[step.nodeId] = "split";
      step.childIds.forEach((childId) => {
        if (!statuses[childId]) statuses[childId] = "unprocessed";
      });
    }
    if (index === currentStep) statuses[step.nodeId] = "current";
  });

  return statuses;
}

function flattenTree(node, regionsById = {}) {
  regionsById[node.id] = node;
  node.children.forEach((child) => flattenTree(child, regionsById));
  return regionsById;
}

function getRegionColor(regionId, colorMap = new Map()) {
  return colorMap.get(regionId) || REGION_COLORS[0];
}

function getActiveRegions(steps, currentStep, tree) {
  const regionsById = flattenTree(tree);
  const activeRegionIds = new Set([tree.id]);

  steps.slice(0, currentStep + 1).forEach((step) => {
    if (step.type !== "children") return;
    activeRegionIds.delete(step.nodeId);
    step.childIds.forEach((childId) => activeRegionIds.add(childId));
  });

  return [...activeRegionIds].map((regionId) => regionsById[regionId]);
}

function buildCellRegionMap(activeRegions) {
  const cellRegionMap = {};

  activeRegions.forEach((region) => {
    if (region.cells) {
      region.cells.forEach((cell) => {
        cellRegionMap[`${cell.row},${cell.col}`] = region.id;
      });
      return;
    }

    for (let row = region.x; row < region.x + region.size; row += 1) {
      for (let col = region.y; col < region.y + region.size; col += 1) {
        cellRegionMap[`${row},${col}`] = region.id;
      }
    }
  });

  return cellRegionMap;
}

function getRegionDisplayCells(region) {
  return region.cells || getRegionCells(region);
}

function getDisplayRegions(activeRegions, steps, currentStep) {
  const appliedMergeSteps = steps
    .slice(0, currentStep + 1)
    .filter((step) => step.type === "merge" && step.allowed);

  if (appliedMergeSteps.length === 0) return activeRegions;

  const parent = {};
  const meta = {};
  const baseRegions = {};

  activeRegions.forEach((region) => {
    parent[region.id] = region.id;
    baseRegions[region.id] = {
      id: region.id,
      cells: getRegionDisplayCells(region),
    };
  });

  const find = (regionId) => {
    if (parent[regionId] !== regionId) parent[regionId] = find(parent[regionId]);
    return parent[regionId];
  };

  const union = (leftId, rightId, step) => {
    const leftRoot = find(leftId);
    const rightRoot = find(rightId);
    if (leftRoot === rightRoot) return leftRoot;

    parent[rightRoot] = leftRoot;
    meta[leftRoot] = {
      id: step.mergedId,
      color: step.mergedColor,
    };
    delete meta[rightRoot];
    return leftRoot;
  };

  appliedMergeSteps.forEach((step) => {
    const [leftId] = step.leftIds;
    step.leftIds.forEach((regionId) => {
      if (!parent[regionId]) parent[regionId] = regionId;
      union(leftId, regionId, step);
    });
    step.rightIds.forEach((regionId) => {
      if (!parent[regionId]) parent[regionId] = regionId;
      union(leftId, regionId, step);
    });
  });

  const groups = {};
  activeRegions.forEach((region) => {
    const root = find(region.id);
    if (!groups[root]) groups[root] = [];
    groups[root].push(region);
  });

  return Object.entries(groups).map(([root, regions]) => {
    const cells = regions.flatMap(getRegionDisplayCells);
    return {
      id: meta[root]?.id || regions[0].id,
      cells,
    };
  });
}

function buildEffectiveColorMap(colorMap, steps) {
  const effectiveColorMap = new Map(colorMap);

  steps.forEach((step) => {
    if (step.type === "merge" && step.allowed && step.mergedId) {
      effectiveColorMap.set(step.mergedId, step.mergedColor);
    }
  });

  return effectiveColorMap;
}

function getCellRegionStyle(
  row,
  col,
  cellRegionMap,
  statuses,
  currentStepData,
  colorMap,
) {
  const regionId = cellRegionMap[`${row},${col}`] || "R0";
  const status = statuses[regionId] || "unprocessed";
  const isCurrentRegion = currentStepData?.nodeId === regionId;
  const isMergeCandidate =
    currentStepData?.type === "merge" &&
    (currentStepData.allowed
      ? currentStepData.mergedId === regionId
      : [currentStepData.leftLabel, currentStepData.rightLabel].includes(
        regionId,
      ));
  const decoration = {
    current: { color: "#facc15", width: 3 },
    homogeneous: { color: "#22c55e", width: 3 },
    split: { color: "#ef4444", width: 3 },
    merged: { color: "#2563eb", width: 3 },
  }[isMergeCandidate ? "current" : status];
  const isBoundary = (nextRow, nextCol) =>
    cellRegionMap[`${nextRow},${nextCol}`] !== regionId;
  const style = {
    backgroundColor: getRegionColor(regionId, colorMap),
  };

  if (!decoration) return style;

  const borderValue = `${decoration.width}px solid ${decoration.color}`;
  if (row === 0 || isBoundary(row - 1, col)) style.borderTop = borderValue;
  if (row === MATRIX_SIZE - 1 || isBoundary(row + 1, col)) {
    style.borderBottom = borderValue;
  }
  if (col === 0 || isBoundary(row, col - 1)) style.borderLeft = borderValue;
  if (col === MATRIX_SIZE - 1 || isBoundary(row, col + 1)) {
    style.borderRight = borderValue;
  }
  if (status === "current" || isMergeCandidate) {
    style.boxShadow = "0 0 18px rgba(250,204,21,.7)";
    style.zIndex = 2;
  }
  if (
    status === "split" ||
    (isCurrentRegion && currentStepData?.type === "split")
  ) {
    style.animation = "regionFlashRed 0.65s ease";
  }
  if (isMergeCandidate && currentStepData.allowed) {
    style.animation = "regionMergeUnify 1s ease";
  }

  return style;
}

function MatrixView({
  matrix,
  cellRegionMap = {},
  statuses = {},
  currentStepData = null,
  colorMap = new Map(),
  animated = false,
}) {
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
            className={`matrix-cell-region ${animated ? "matrix-animate" : ""}`}
            style={{
              animationDelay: `${rowIndex * 0.08}s`,
              ...(!animated
                ? getCellRegionStyle(
                  rowIndex,
                  cellIndex,
                  cellRegionMap,
                  statuses,
                  currentStepData,
                  colorMap,
                )
                : {}),
            }}
          >
            {cell}
          </div>
        )),
      )}
    </div>
  );
}

function getNomenclatureFontSize(region) {
  const cellCount = region.cells?.length || region.size ** 2;
  if (cellCount <= 1) return "8px";
  if (cellCount <= 2) return "9px";
  if (region.id.length >= 5) return "10px";
  if (region.id.length >= 4) return "12px";
  return "14px";
}

function getRegionLabelPosition(region) {
  const cells = getRegionDisplayCells(region);
  const rowCenter =
    cells.reduce((sum, cell) => sum + cell.row + 0.5, 0) / cells.length;
  const colCenter =
    cells.reduce((sum, cell) => sum + cell.col + 0.5, 0) / cells.length;

  return {
    left: `${(colCenter / MATRIX_SIZE) * 100}%`,
    top: `${(rowCenter / MATRIX_SIZE) * 100}%`,
  };
}

function NomenclatureMatrixView({
  cellRegionMap,
  activeRegions,
  statuses,
  currentStepData,
  colorMap,
}) {
  const cells = Array.from({ length: MATRIX_SIZE }, (_, row) =>
    Array.from({ length: MATRIX_SIZE }, (_, col) => ({ row, col })),
  ).flat();

  return (
    <div className="nomenclature-matrix-region">
      <div
        className="matrix-grid-region nomenclature-grid-region"
        style={{ gridTemplateColumns: `repeat(${MATRIX_SIZE}, 1fr)` }}
      >
        {cells.map(({ row, col }) => (
          <div
            key={`nomenclature-${row}-${col}`}
            id="original_matrix_region"
            className="matrix-cell-region nomenclature-cell-region"
            style={getCellRegionStyle(
              row,
              col,
              cellRegionMap,
              statuses,
              currentStepData,
              colorMap,
            )}
          />
        ))}
      </div>
      {activeRegions.map((region) => {
        const labelPosition = getRegionLabelPosition(region);
        return (
          <span
            key={`label-${region.id}`}
            className="nomenclature-label-region"
            style={{
              ...labelPosition,
              fontSize: getNomenclatureFontSize(region),
            }}
          >
            {region.id}
          </span>
        );
      })}
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

  if (step.type === "merge") {
    return (
      <div id="explanation-box">
        <h2>Step {stepNumber}</h2>
        <p>Checking Merge</p>
        <p>
          Current Regions: {step.leftLabel} and {step.rightLabel}
        </p>
        <p>
          Mean({step.leftLabel}) = {step.leftMean.toFixed(2)}
        </p>
        <p>
          Mean({step.rightLabel}) = {step.rightMean.toFixed(2)}
        </p>
        <p>Mean Difference = {step.difference.toFixed(2)}</p>
        <p>Threshold = {step.threshold.toFixed(2)}</p>
        <p>
          Decision:{" "}
          {step.allowed
            ? `Merged Successfully as ${step.mergedId}`
            : "Cannot Merge. Regions remain separate."}
        </p>
      </div>
    );
  }

  if (step.type === "complete") {
    return (
      <div id="explanation-box">
        <h2>Region Splitting and Merging Completed</h2>
        <p>All non-homogeneous regions were recursively divided.</p>
        <p>
          Adjacent homogeneous regions satisfying the similarity criterion were
          merged.
        </p>
        <p>The final segmented image is displayed.</p>
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
          <p>Region {step.nodeId} flashes before its child regions appear.</p>
        </>
      )}
      {step.type === "children" && (
        <p>
          Region {step.nodeId} splits into: {step.childIds.join(", ")}
        </p>
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

function getVisibleTree(node, revealedParents) {
  return {
    ...node,
    children: revealedParents.has(node.id)
      ? node.children.map((child) => getVisibleTree(child, revealedParents))
      : [],
  };
}

function getRevealedParents(steps, currentStep) {
  return new Set(
    steps
      .slice(0, currentStep + 1)
      .filter((step) => step.type === "children")
      .map((step) => step.nodeId),
  );
}

function buildTreeLayout(node) {
  const nodes = [];
  const lines = [];

  function measure(currentNode) {
    if (currentNode.children.length === 0) return TREE_NODE_SIZE;
    const childWidths = currentNode.children.map(measure);
    const childrenWidth =
      childWidths.reduce((sum, width) => sum + width, 0) +
      TREE_X_GAP * (childWidths.length - 1);
    return Math.max(TREE_NODE_SIZE, childrenWidth);
  }

  function place(currentNode, left, depth) {
    const subtreeWidth = measure(currentNode);
    const x = left + subtreeWidth / 2;
    const y = TREE_PADDING + depth * TREE_Y_GAP;

    nodes.push({ id: currentNode.id, x, y });

    let childLeft = left;
    currentNode.children.forEach((child) => {
      const childWidth = measure(child);
      const childPosition = place(child, childLeft, depth + 1);
      lines.push({
        fromX: x,
        fromY: y + TREE_NODE_SIZE / 2,
        toX: childPosition.x,
        toY: childPosition.y - TREE_NODE_SIZE / 2,
      });
      childLeft += childWidth + TREE_X_GAP;
    });

    return { x, y, width: subtreeWidth };
  }

  const width = measure(node) + TREE_PADDING * 2;
  place(node, TREE_PADDING, 0);

  const maxDepth = nodes.reduce(
    (largest, item) =>
      Math.max(largest, Math.round((item.y - TREE_PADDING) / TREE_Y_GAP)),
    0,
  );
  const height = TREE_PADDING * 2 + TREE_NODE_SIZE + maxDepth * TREE_Y_GAP;

  return { nodes, lines, width, height };
}

function getMergeTreeState(steps, currentStep) {
  const fadedNodeIds = new Set();
  const parentNodeIds = new Set();

  steps.slice(0, currentStep + 1).forEach((step) => {
    if (step.type !== "merge" || !step.allowed) return;
    [...step.leftIds, ...step.rightIds].forEach((regionId) => {
      fadedNodeIds.add(regionId);
    });
    if (step.parentId) parentNodeIds.add(step.parentId);
  });

  return { fadedNodeIds, parentNodeIds };
}

function TreeSVG({ lines, width, height }) {
  return (
    <svg
      className="tree-svg-region"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {lines.map((line) => (
        <path
          key={`${line.fromX}-${line.fromY}-${line.toX}-${line.toY}`}
          d={`M ${line.fromX} ${line.fromY} V ${(line.fromY + line.toY) / 2} H ${line.toX
            } V ${line.toY}`}
        />
      ))}
    </svg>
  );
}

function QuadtreeView({
  tree,
  steps,
  currentStep,
  statuses,
  currentStepData,
  colorMap,
}) {
  const visibleTree = useMemo(
    () => getVisibleTree(tree, getRevealedParents(steps, currentStep)),
    [tree, steps, currentStep],
  );
  const layout = useMemo(() => buildTreeLayout(visibleTree), [visibleTree]);
  const mergeTreeState = useMemo(
    () => getMergeTreeState(steps, currentStep),
    [steps, currentStep],
  );

  return (
    <div
      className="tree-region"
      style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
    >
      <TreeSVG
        lines={layout.lines}
        width={layout.width}
        height={layout.height}
      />
      {layout.nodes.map((node) => {
        const status = statuses[node.id] || "unprocessed";
        const isCurrentSplit =
          currentStepData?.nodeId === node.id &&
          currentStepData?.type === "split";
        const className = `tree-node-region tree-${isCurrentSplit ? "split" : status
          } ${status === "current" ? "tree-current" : ""} ${mergeTreeState.fadedNodeIds.has(node.id) ? "tree-merge-faded" : ""
          } ${mergeTreeState.parentNodeIds.has(node.id) ? "tree-merge-parent" : ""
          }`;
        return (
          <div
            key={node.id}
            className={className}
            style={{
              left: `${node.x - TREE_NODE_SIZE / 2}px`,
              top: `${node.y - TREE_NODE_SIZE / 2}px`,
              backgroundColor: getRegionColor(node.id, colorMap),
            }}
          >
            {node.id}
          </div>
        );
      })}
    </div>
  );
}

export default function SplitAndMerge({ handleClose3Modal }) {
  const [original, setOriginal] = useState(() => buildMatrix(0));
  const [threshold, setThreshold] = useState(() =>
    getDynamicThreshold(buildMatrix(0)),
  );
  const [generation, setGeneration] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(1200);

  const { steps, tree, colorMap } = useMemo(
    () => buildSplitSteps(original, threshold),
    [original, threshold],
  );
  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;
  const statuses = getStatusesForStep(steps, currentStep, tree);
  const activeRegions = useMemo(
    () => getActiveRegions(steps, currentStep, tree),
    [steps, currentStep, tree],
  );
  const displayRegions = useMemo(
    () => getDisplayRegions(activeRegions, steps, currentStep),
    [activeRegions, steps, currentStep],
  );
  const cellRegionMap = useMemo(
    () => buildCellRegionMap(displayRegions),
    [displayRegions],
  );
  const effectiveColorMap = useMemo(
    () => buildEffectiveColorMap(colorMap, steps),
    [colorMap, steps],
  );

  function handleGenerateMatrix() {
    const nextGeneration = generation + 1;
    const nextMatrix = buildMatrix(nextGeneration);
    setGeneration(nextGeneration);
    setOriginal(nextMatrix);
    setThreshold(getDynamicThreshold(nextMatrix));
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
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayInterval, isAutoPlaying, steps.length]);

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
              Instruction
            </Button>
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
        <div id="split-merge-layout">
          <aside id="split-merge-left-panel">
            <div id="generate-box-region">
              <div className="generate-card-region">
                <h2>Generate Matrix</h2>
                <Button className="tool_btn" onClick={handleGenerateMatrix}>
                  Generate Matrix
                </Button>
              </div>
            </div>

            <section className="threshold-card-region" aria-labelledby="threshold-heading">
              <h2 id="threshold-heading">Threshold</h2>
              <p>Suggested Threshold: {threshold.toFixed(2)}</p>
            </section>

            <section className="control-panel-region" aria-labelledby="simulation-controls-heading">
              <h2 id="simulation-controls-heading">Simulation Controls</h2>
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
              <label className="autoplay-speed-region" htmlFor="autoplay-speed">
                <span className="autoplay-speed-title-region">Speed</span>
                <input
                  id="autoplay-speed"
                  type="range"
                  min="600"
                  max="1800"
                  step="50"
                  value={autoPlayInterval}
                  onChange={(event) =>
                    setAutoPlayInterval(Number(event.target.value))
                  }
                  aria-label="Auto Play speed"
                />
              </label>
            </section>
          </aside>

          <main id="split-merge-right-panel">
            <div id="image-and-explanation-box-region">
              <div id="image-box-region">
                <div id="left-image-box-region">

                  <div id="head-image-temp">
                    <h1>Input Image Matrix</h1>
                  </div>
                  <div id="original-image-temp">
                    <MatrixView matrix={original} animated />
                  </div>
                </div>

                <div id="region_arrow">&#129066;</div>

                <div id="right-image-box-region">
                  <div id="head-image-temp">
                    <h1>Region Splitting Process</h1>
                  </div>
                  <div id="animated-image-temp-region">
                    <MatrixView
                      matrix={original}
                      cellRegionMap={cellRegionMap}
                      statuses={statuses}
                      currentStepData={currentStepData}
                      colorMap={effectiveColorMap}
                    />
                  </div>
                </div>

                <div id="nomenclature-arrow-region">&#129066;</div>

                <div id="nomenclature-image-box-region">
                  <div id="head-image-temp">
                    <h1>Region Labels</h1>
                  </div>
                  <div id="nomenclature-image-temp-region">
                    <NomenclatureMatrixView
                      cellRegionMap={cellRegionMap}
                      activeRegions={displayRegions}
                      statuses={statuses}
                      currentStepData={currentStepData}
                      colorMap={effectiveColorMap}
                    />
                  </div>
                </div>
              </div>
              <ExplanationBox
                step={currentStepData}
                stepNumber={currentStep + 1}
                threshold={threshold}
              />
            </div>

            <div id="tree-container-region">
              <h1>Recursive Quadtree Representation</h1>
              <QuadtreeView
                tree={tree}
                steps={steps}
                currentStep={currentStep}
                statuses={statuses}
                currentStepData={currentStepData}
                colorMap={effectiveColorMap}
              />
            </div>
          </main>
        </div>
        <ToastContainer position="bottom-left" />
      </div>
    </OpenCvProvider>
  );
}
