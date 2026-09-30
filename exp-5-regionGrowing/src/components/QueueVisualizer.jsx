import { coordinate } from "../utils/regionGrowingUtils";
export function QueueVisualizer({ queue }) {
  return (
    <section className="card queue-card">
      <div className="card-heading">
        <div>
          <span className="eyebrow">BREADTH-FIRST TRAVERSAL</span>
          <h3>Processing Queue</h3>
        </div>
        <span className="queue-count">
          {queue.length} item{queue.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="queue-track">
        <span className="queue-label">Front</span>
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
        <span className="queue-label">Back</span>
      </div>
    </section>
  );
}
