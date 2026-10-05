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
  const { process, seed, threshold } = sim;
  const decision = process.decision;
  const currentVal = process.current ? sim.image[process.current.row][process.current.col] : null;
  const candidateVal = process.candidate ? sim.image[process.candidate.row][process.candidate.col] : null;

  return (
    <div className="explain-stack">
      <section className="card explanation-card derivative-card" style={{ padding: "0" }}>
        <div className="card-header-derivative" style={{ borderRadius: "12px 12px 0 0" }}>
          <h4>Explanation · Step {process.stepCount}</h4>
        </div>
        <div className="card-body-derivative">
          <div className={`seed-state-box ${seed ? "seed-state-box--selected" : "seed-state-box--empty"}`}>
            <span className="seed-state-label">Seed status</span>
            {seed ? (
              <strong>✓ Seed Selected <small>Row {seed.row + 1} · Column {seed.col + 1} · Intensity {seed.intensity}</small></strong>
            ) : (
              <strong>⚠ No seed selected</strong>
            )}
          </div>

          <div className="explanation-section">
            <h5>What is happening?</h5>
            <p className="step-message">{process.message}</p>
          </div>
          <QueueVisualizer queue={sim.process.queue} lastDequeued={process.lastDequeued} />

          <div className="explanation-section">
            <h5>Current state</h5>
            <div className="detail-grid">
            <div>
              <span>Selected seed</span>
              <b>{seed ? `${coordinate(seed)} · ${seed.intensity}` : "No seed selected"}</b>
            </div>
            <div>
              <span>Threshold</span>
              <b>{threshold}</b>
            </div>
            <div>
              <span>Current pixel</span>
              <b>{process.current ? `${coordinate(process.current)} · ${currentVal}` : "None"}</b>
            </div>
            <div>
              <span>Testing neighbour</span>
              <b>{process.candidate ? `${coordinate(process.candidate)} · ${candidateVal}` : "None"}</b>
            </div>
            </div>
          </div>

          {decision && (
            <div className={`calculation ${decision.accepted ? "accepted-calc" : "rejected-calc"}`}>
              <h5>Decision · {decision.accepted ? "✓ Accepted" : "✖ Rejected"}</h5>
              <span>Fixed-seed comparison</span>
              <strong>
                | {decision.value} − {seed ? seed.intensity : 0} | = {decision.difference}
              </strong>
              <b>
                {decision.difference} {decision.accepted ? "≤" : ">"} {threshold} · {decision.accepted ? "✓ ACCEPTED" : "✖ REJECTED"}
              </b>
            </div>
          )}

          <div className="explanation-section explanation-why"><h5>Why?</h5><p className="educational-note">
            {decision
              ? decision.accepted
                ? "This spatially connected pixel is within the fixed seed intensity threshold, so BFS adds it to the growing region."
                : "This connected pixel differs too much from the original seed. It remains outside the region."
              : "Region Growing checks only connected neighbours; it never searches the whole image for similar pixels."}</p></div>
        </div>
      </section>

      <section className="card pseudocode derivative-card" style={{ padding: "0" }}>
        <div className="card-header-light" style={{ borderRadius: "12px 12px 0 0" }}>
          <h4>Queue-based BFS Algorithm</h4>
        </div>
        <div className="card-body-derivative">
          <h3>Pseudocode</h3>
          <ol>
            {code.map((text, index) => (
              <li
                key={text}
                className={lineForPhase[process.phase] === index + 1 ? "active-line" : ""}
              >
                {text}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
