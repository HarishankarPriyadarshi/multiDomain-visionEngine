import { useState } from "react";
import { coordinate } from "../utils/regionGrowingUtils";
import { QueueVisualizer } from "./QueueVisualizer";

const lineForPhase = {
  ADD_SEED: 1,
  DEQUEUE: 4,
  SHOW_NEIGHBOURS: 5,
  TEST_NEIGHBOUR: 6,
  CALCULATE_DIFFERENCE: 7,
  ACCEPT_OR_REJECT: 8,
  NEXT_NEIGHBOUR: 6,
  COMPLETE: 12,
};

const code = [
  "Add seed to region",
  "Add seed to queue",
  "While queue is not empty",
  "  Remove current pixel",
  "  Find neighbours",
  "  For each unvisited neighbour",
  "    Calculate difference",
  "    If difference ≤ threshold",
  "      Add neighbour to region",
  "      Add neighbour to queue",
  "    Else reject neighbour",
  "End when queue is empty",
];

export function Explanation({ sim }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPseudocodeOpen, setIsPseudocodeOpen] = useState(true);
  const { process, seed, threshold } = sim;
  const decision = process.decision;
  const currentVal = process.current
    ? sim.image[process.current.row][process.current.col]
    : null;
  const candidateVal = process.candidate
    ? sim.image[process.candidate.row][process.candidate.col]
    : null;

  return (


    <div className="explain-stack">
      <section className="card explanation-card">
        <header className="explanation-header">
          <span className="explanation-title">
            {isExpanded ? `Explanation (Step : ${process.stepCount})` : ""}
          </span>

          <button
            className="explanation-toggle"
            type="button"
            aria-expanded={isExpanded}
            aria-controls="region-growing-explanation-content"
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? "▼ Hide" : "▶ Show Explanation"}
          </button>
        </header>

        <div
          className="explanation-content"
          id="region-growing-explanation-content"
          hidden={!isExpanded}
        >
          <section className="explanation-section">

            <p className="step-message">{process.message}</p>
          </section>
          <div className="state-queue-panel">
            <section className="current-state-section">
              <h5>Current State</h5>
              <div className="current-state-rows">
                <div>
                  <span>Selected seed</span>
                  <b>
                    {seed
                      ? `${coordinate(seed)} · ${seed.intensity}`
                      : "No seed selected"}
                  </b>
                </div>
                <div>
                  <span>Current pixel</span>
                  <b>
                    {process.current
                      ? `${coordinate(process.current)} · ${currentVal}`
                      : "None"}
                  </b>
                </div>
                <div>
                  <span>Testing neighbour</span>
                  <b>
                    {process.candidate
                      ? `${coordinate(process.candidate)} · ${candidateVal}`
                      : "None"}
                  </b>
                </div>
                <div>
                  <span>Threshold</span>
                  <b>{threshold}</b>
                </div>
              </div>
            </section>

            <QueueVisualizer
              queue={sim.process.queue}
              lastDequeued={process.lastDequeued}
            />
          </div>
          {decision && (
            <section
              className={`calculation ${decision.accepted ? "accepted-calc" : "rejected-calc"}`}
            >

              <span>Fixed-seed comparison</span>
              <strong>
                | {decision.value} − {seed ? seed.intensity : 0} | ={" "}
                {decision.difference}
              </strong>

              <b>
                {decision.difference} {decision.accepted ? "≤" : ">"}{" "}
                {threshold}
              </b>
              <p className="educational-note">
                {decision
                  ? decision.accepted
                    ? "This spatially connected pixel is within the fixed seed intensity threshold, so BFS adds it to the growing region."
                    : "This connected pixel differs too much from the original seed. It remains outside the region."
                  : "Region Growing checks only connected neighbours; it never searches the whole image for similar pixels."}
              </p>
              <h5>
                Decision · {decision.accepted ? "✓ Accepted" : "✖ Rejected"}
              </h5>
            </section>
          )}
        </div>
      </section>

<div className="card pseudocode pseudocode-disclosure">
  <div className="pseudocode-header">
    <span className="pseudocode-title">
     {isPseudocodeOpen ? "Queue-based BFS Algorithm" : ""}
    </span>

    <button
      type="button"
      className="pseudocode-toggle"
      onClick={() => setIsPseudocodeOpen((open) => !open)}
      aria-expanded={isPseudocodeOpen}
    >
      {isPseudocodeOpen ? "▼ Hide" : "▶ Show Queue-based BFS Algorithm"}
    </button>
  </div>

  {isPseudocodeOpen && (
    <div className="pseudocode-content">
      <h3>Pseudocode</h3>

      <ol>
        {code.map((text, index) => (
          <li
            key={`${text}-${index}`}
            className={
              lineForPhase[process.phase] === index + 1
                ? "active-line"
                : ""
            }
          >
            {text}
          </li>
        ))}
      </ol>
    </div>
  )}
</div>

    </div>
  );
}
