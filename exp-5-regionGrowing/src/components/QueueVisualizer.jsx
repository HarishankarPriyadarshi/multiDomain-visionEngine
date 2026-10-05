import { useEffect, useRef, useState } from "react";
import { coordinate } from "../utils/regionGrowingUtils";

export function QueueVisualizer({ queue }) {
  const previousQueueRef = useRef([]);
  const [removedItem, setRemovedItem] = useState(null);

  useEffect(() => {
    const previousQueue = previousQueueRef.current;

    if (previousQueue.length > queue.length) {
      const removed = previousQueue[0];

      if (removed) {
        setRemovedItem({
          ...removed,
          id: `${removed.row}-${removed.col}-${Date.now()}`,
        });

        const timer = setTimeout(() => {
          setRemovedItem(null);
        }, 770);

        return () => clearTimeout(timer);
      }
    }

    previousQueueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    previousQueueRef.current = queue;
  }, []);

  return (
    <section className="card queue-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Processing Queue (BFS Traversal)</p>
        </div>

        <span className="queue-count">
          {queue.length} item{queue.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="queue-track">
        <span className="queue-label">
          Back
        </span>

        <div className="queue-items">

          {/* RED: Dequeued item */}
          {removedItem && (
            <span
              className="queue-item queue-item--removed"
              key={removedItem.id}
            >
              {coordinate(removedItem)}
            </span>
          )}

          {/* NORMAL + GREEN: Current queue */}
          {queue.length ? (
            queue.map((p, i) => (
              <span
                className="queue-item"
                key={`${p.row}-${p.col}-${i}`}
              >
                {coordinate(p)}
              </span>
            ))
          ) : (
            !removedItem && (
              <span className="empty-queue">
                Queue is empty
              </span>
            )
          )}
        </div>

        <span className="queue-label">
          Front
        </span>
      </div>
    </section>
  );
}