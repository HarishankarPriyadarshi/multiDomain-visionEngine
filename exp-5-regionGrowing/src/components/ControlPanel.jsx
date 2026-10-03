export function ControlPanel({ sim }) {
  const hasSeed = Boolean(sim.seed);

  return (
    <div className="derivative-card">
      <div className="card-header-derivative">
        <h4>
         Simulation Controls
        </h4>
      </div>
      <div className="card-body-derivative">
        <aside
          className="control-panel"
          style={{
            border: "none",
            boxShadow: "none",
            padding: "0",
            position: "static",
          }}
        >
          <div className="panel-title" style={{ display: "none" }}>
            <span className="panel-icon">⚙</span>
            <div>
              <h2>Simulation Controls</h2>

            </div>
          </div>
          <section className="control-section">
            <label className="section-label">GRID SIZE</label>
            <select
              className="grid-size-select"
              value={sim.size}
              onChange={(e) => sim.changeSize(Number(e.target.value))}
            >
              <option value={8}>8 × 8</option>
              <option value={16}>16 × 16</option>
            </select>
            <label className="section-label">GENERATE IMAGE</label>
            <button className="wide-button secondary" onClick={sim.generate}>
              ↻ Generate New Image
            </button>

          </section>

          <section className="control-section">
            <label className="section-label">SEED SELECTION</label>
            <p className="instruction">
              ⌁ Click a pixel in the grayscale image to select the seed.
            </p>
            <div className="seed-info">
              {hasSeed ? (
                <>
                  <span>
                    <b>Row</b> {sim.seed.row + 1}
                  </span>
                  <span>
                    <b>Column</b> {sim.seed.col + 1}
                  </span>
                  <span>
                    <b>Intensity</b> {sim.seed.intensity}
                  </span>
                </>
              ) : (
                <span className="muted">No seed selected</span>
              )}
            </div>
            <label className="section-label">CONNECTIVITY</label>
            {[4, 8].map((n) => (
              <label key={n} className="radio-row">
                <input
                  type="radio"
                  checked={sim.connectivity === n}
                  onChange={() => sim.setConnectivity(n)}
                />{" "}
                <span>{n}-Connectivity</span>
                <small>
                  {n === 4 ? "N · S · E · W" : "Includes diagonal neighbours"}
                </small>
              </label>
            ))}
            <div className="range-heading">
              <label className="section-label">THRESHOLD</label>
              <input
                className="number-input"
                type="number"
                min="0"
                max="100"
                value={sim.threshold}
                onChange={(e) =>
                  sim.setThreshold(
                    Math.max(0, Math.min(100, Number(e.target.value))),
                  )
                }
              />
            </div>
            <input
              className="threshold-slider"
              type="range"
              min="0"
              max="100"
              value={sim.threshold}
              onChange={(e) => sim.setThreshold(Number(e.target.value))}
            />
            <div className="range-endpoints">
              <span>0</span>
              <span>100</span>
            </div>
          </section>

          <section className="control-section simulation-buttons">
            <label className="section-label">SIMULATION CONTROLS</label>
            <div className="button-grid">
              <button
                className="primary"
                onClick={sim.step}
                disabled={!hasSeed || sim.process.phase === "COMPLETE"}
              >
                Prev <kbd>←</kbd>
              </button>
              <button
                onClick={() => sim.setIsPlaying(!sim.isPlaying)}
                disabled={!hasSeed || sim.process.phase === "COMPLETE"}
              >
                {sim.isPlaying ? "     Ⅱ Pause" : "                ▶ Play"}
              </button>
                            <button
                className="primary"
                onClick={sim.step}
                disabled={!hasSeed || sim.process.phase === "COMPLETE"}
              >
                Next <kbd>→</kbd>
              </button>
              
              <button onClick={sim.reset}>↺ Reset</button>
            </div>

            <div className="speed-row">
              <label className="section-label">SPEED</label>
              <input
                className="speed-slider"
                type="range"
                min="0.1"
                max="10"
                value={sim.speed}
                onChange={(e) => sim.setSpeed(Number(e.target.value))}
              />
            <div className="range-endpoints">
              <span>slow</span>
              <span>fast</span>
            </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
