import { useCallback, useEffect, useState } from "react";
import { generateStructuredImage } from "../utils/generateStructuredImage";
import { getNeighbours, keyOf } from "../utils/regionGrowingUtils";

const initialProcess = () => ({
  phase: "SELECT_SEED",
  queue: [],
  region: new Set(),
  visited: new Set(),
  rejected: new Set(),
  current: null,
  candidate: null,
  neighbours: [],
  neighbourIndex: 0,
  message: "Click a pixel in the grayscale image to select the seed.",
  decision: null,
  stepCount: 0,
  lastDequeued: null,
});

export function useRegionGrowingSimulation() {
  const [size, setSize] = useState(8);
  const [image, setImage] = useState(() => generateStructuredImage(8));
  const [threshold, setThresholdState] = useState(20);
  const [connectivity, setConnectivityState] = useState(4);
  const [seed, setSeed] = useState(null);
  const [process, setProcess] = useState(initialProcess);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [history, setHistory] = useState([]);

  const resetState = useCallback(() => {
    setIsPlaying(false);
    setSeed(null);
    setProcess(initialProcess());
    setHistory([]);
  }, []);

  const snapshotState = useCallback(() => ({
    size,
    image,
    threshold,
    connectivity,
    seed,
    process: {
      ...process,
      queue: [...process.queue],
      region: new Set(process.region),
      visited: new Set(process.visited),
      rejected: new Set(process.rejected),
      neighbours: [...process.neighbours],
      current: process.current ? { ...process.current } : null,
      candidate: process.candidate ? { ...process.candidate } : null,
      decision: process.decision ? { ...process.decision } : null,
      lastDequeued: process.lastDequeued ? { ...process.lastDequeued } : null,
    },
  }), [size, image, threshold, connectivity, seed, process]);

  const reset = useCallback(() => {
    resetState();
  }, [resetState]);

  const generate = useCallback(() => {
    setIsPlaying(false);
    setImage(generateStructuredImage(size));
    setSeed(null);
    setProcess(initialProcess());
    setHistory([]);
  }, [size]);

  const changeSize = useCallback((next) => {
    setIsPlaying(false);
    setSize(next);
    setImage(generateStructuredImage(next));
    setSeed(null);
    setProcess(initialProcess());
    setHistory([]);
  }, []);

  const setThreshold = useCallback((next) => {
    setThresholdState(next);
    if (seed) {
      resetState();
    }
  }, [seed, resetState]);

  const setConnectivity = useCallback((next) => {
    setConnectivityState(next);
    if (seed) {
      resetState();
    }
  }, [seed, resetState]);

  const selectSeed = useCallback((row, col) => {
    if (process.phase !== "SELECT_SEED") return;
    setHistory([]);
    setSeed({ row, col, intensity: image[row][col] });
    setProcess({
      ...initialProcess(),
      phase: "ADD_SEED",
      message: `Seed selected at (${row + 1}, ${col + 1}). Its intensity stays fixed throughout the simulation.`,
      stepCount: 1,
    });
  }, [image, process.phase]);

  const stepBackward = useCallback(() => {
    if (!history.length) return;
    const previousState = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    setSize(previousState.size);
    setImage(previousState.image);
    setThresholdState(previousState.threshold);
    setConnectivityState(previousState.connectivity);
    setSeed(previousState.seed);
    setProcess(previousState.process);
    setIsPlaying(false);
  }, [history]);

  const step = useCallback((fromPlayback = false) => {
    if (!seed || process.phase === "COMPLETE") return;
    setHistory((current) => [...current, snapshotState()]);
    // A manual advance pauses playback; a timer-driven advance keeps the one
    // playback loop alive until the algorithm reaches COMPLETE.
    if (!fromPlayback) setIsPlaying(false);
    if (process.phase === "DEQUEUE" && process.queue.length === 0) {
      setIsPlaying(false);
    }
    setProcess((previous) => {
      const next = { ...previous, stepCount: previous.stepCount + 1 };
      const seedKey = keyOf(seed.row, seed.col);
      if (previous.phase === "ADD_SEED") {
        next.region = new Set([seedKey]);
        next.visited = new Set([seedKey]);
        next.queue = [{ row: seed.row, col: seed.col }];
        next.phase = "DEQUEUE";
        next.message = "The seed is added to both the region and the front of the processing queue.";
        next.lastDequeued = null;
        return next;
      }
      if (previous.phase === "DEQUEUE") {
        if (!previous.queue.length) {
          next.phase = "COMPLETE";
          next.current = null;
          next.candidate = null;
          next.lastDequeued = null;
          next.message = "The processing queue is empty. Region Growing is complete.";
          return next;
        }
        const [current, ...remaining] = previous.queue;
        next.queue = remaining;
        next.current = current;
        next.candidate = null;
        next.phase = "SHOW_NEIGHBOURS";
        next.lastDequeued = { row: current.row, col: current.col };
        next.message = `Dequeued (${current.row + 1}, ${current.col + 1}) for neighbour examination.`;
        return next;
      }
      if (previous.phase === "SHOW_NEIGHBOURS") {
        next.neighbours = getNeighbours(previous.current.row, previous.current.col, size, connectivity);
        next.neighbourIndex = 0;
        next.phase = "TEST_NEIGHBOUR";
        next.message = `${connectivity}-connectivity provides ${next.neighbours.length} valid neighbour${next.neighbours.length === 1 ? "" : "s"} for this pixel.`;
        next.lastDequeued = null;
        return next;
      }
      if (previous.phase === "TEST_NEIGHBOUR") {
        const candidate = previous.neighbours[previous.neighbourIndex];
        if (!candidate) {
          next.phase = "DEQUEUE";
          next.candidate = null;
          next.message = "All neighbours were examined. Move to the next pixel in the queue.";
          next.lastDequeued = null;
          return next;
        }
        next.candidate = candidate;
        if (previous.visited.has(keyOf(candidate.row, candidate.col))) {
          next.phase = "NEXT_NEIGHBOUR";
          next.message = `(${candidate.row + 1}, ${candidate.col + 1}) was already visited, so it is not tested again.`;
          next.lastDequeued = null;
          return next;
        }
        next.phase = "CALCULATE_DIFFERENCE";
        next.message = `Testing connected neighbour (${candidate.row + 1}, ${candidate.col + 1}).`;
        next.lastDequeued = null;
        return next;
      }
      if (previous.phase === "CALCULATE_DIFFERENCE") {
        const value = image[previous.candidate.row][previous.candidate.col];
        const difference = Math.abs(value - seed.intensity);
        next.decision = { value, difference, accepted: difference <= threshold };
        next.phase = "ACCEPT_OR_REJECT";
        next.message = `|${value} − ${seed.intensity}| = ${difference}. Compare this fixed-seed difference with threshold ${threshold}.`;
        next.lastDequeued = null;
        return next;
      }
      if (previous.phase === "ACCEPT_OR_REJECT") {
        const candidateKey = keyOf(previous.candidate.row, previous.candidate.col);
        next.visited = new Set(previous.visited).add(candidateKey);
        if (previous.decision.accepted) {
          next.region = new Set(previous.region).add(candidateKey);
          next.queue = [...previous.queue, previous.candidate];
          next.message = `Accepted: difference ${previous.decision.difference} is within the threshold. The pixel enters the region and queue.`;
        } else {
          next.rejected = new Set(previous.rejected).add(candidateKey);
          next.message = `Rejected: difference ${previous.decision.difference} exceeds the threshold. It is marked visited and will not be retried.`;
        }
        next.phase = "NEXT_NEIGHBOUR";
        next.lastDequeued = null;
        return next;
      }
      if (previous.phase === "NEXT_NEIGHBOUR") {
        next.neighbourIndex = previous.neighbourIndex + 1;
        next.phase = "TEST_NEIGHBOUR";
        next.decision = null;
        next.lastDequeued = null;
        return next;
      }
      return next;
    });
  }, [seed, process, size, connectivity, image, threshold, snapshotState]);

  useEffect(() => {
    if (!isPlaying || !seed) return undefined;
    const delay = Math.max(10, 1000 / Math.max(speed, 0.1));
    const timer = window.setTimeout(() => {
      step(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [isPlaying, process, seed, speed, step]);

  return {
    size,
    image,
    threshold,
    connectivity,
    seed,
    process,
    isPlaying,
    speed,
    history,
    changeSize,
    generate,
    setThreshold,
    setConnectivity,
    selectSeed,
    step,
    previousStep: stepBackward,
    reset,
    setIsPlaying,
    setSpeed,
  };
}
