import { coordinate } from "../utils/regionGrowingUtils";

export function QueueVisualizer({ queue = [], lastDequeued = null }) {
  return (
    <section className="card queue-card">
      <div className="card-heading">
        <div>
          <p>Processing Queue (BFS Traversal)</p>
        </div>
        <span className="queue-count">
          {queue.length} item{queue.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="queue-shell">
        {lastDequeued && (
          <div className="queue-animation-layer" aria-hidden="true">
            <div className="queue-removed">
              <span className="queue-label queue-label--removed">Removed</span>
              <span className="queue-item queue-item--removed">{coordinate(lastDequeued)}</span>
            </div>
          </div>
        )}

        <div className="queue-track">
          <span className="queue-label queue-label--back">Back</span>
          <div className="queue-items">
            {queue.length ? (
              queue.map((p, i) => (
                <span className="queue-item" key={`${p.row}-${p.col}-${i}`}>
                  {coordinate(p)}
                </span>
              ))
            ) : (
              <span className="empty-queue">Queue is empty</span>
            )}
          </div>
          <span className="queue-label queue-label--front">Front</span>
        </div>
      </div>
    </section>
  );
}
