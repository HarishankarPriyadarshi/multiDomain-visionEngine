export function ControlPanel({ sim }) {
  const hasSeed = Boolean(sim.seed);

  return (
    <div className="left-panel-stack">
      <div className="panel-subbox">
        <div className="subbox-header">
          <h4>Generate Image</h4>
        </div>
        <div className="subbox-body">
          <section className="control-section">
            <label className="section-label" htmlFor="grid-size">Grid Size</label>
            <select
              id="grid-size"
              className="grid-size-select"
              value={sim.size}
              onChange={(e) => sim.changeSize(Number(e.target.value))}
            >
              <option value={8}>8 × 8</option>
              <option value={16}>16 × 16</option>
            </select>

            <button className="wide-button button-primary" onClick={sim.generate}>
              ↻ Generate New Image
            </button>
          </section>
        </div>
      </div>

      <div className="panel-subbox">
        <div className="subbox-header">
          <h4>Region Growing Parameters</h4>
        </div>
        <div className="subbox-body">
          <section className="control-section">
            <p className="section-label">Select Seed</p>
            <div className={`seed-status ${hasSeed ? "seed-status--success" : "seed-status--warning"}`}>
              {hasSeed ? (
                <>
                  <span className="seed-status__icon">✓</span>
                  <span><strong>Seed Selected</strong><small>Row {sim.seed.row + 1} · Column {sim.seed.col + 1} · Intensity {sim.seed.intensity}</small></span>
                </>
              ) : (
                <>
                  <span className="seed-status__icon">✖</span>
                  <span><strong>No seed selected</strong><small>Click a pixel in the grayscale image to select the seed.</small></span>
                </>
              )}
            </div>

            <label className="section-label" htmlFor="connectivity">Connectivity</label>
            <select
              id="connectivity"
              className="connectivity-select"
              value={sim.connectivity}
              onChange={(e) => sim.setConnectivity(Number(e.target.value))}
            >
              <option value={4}>4-connectivity</option>
              <option value={8}>8-connectivity</option>
            </select>

            <div className="range-heading control-heading">
              <label className="section-label" htmlFor="threshold-slider">Threshold</label>
              <span className="range-value">{sim.threshold}</span>
            </div>
            <input
              id="threshold-slider"
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
        </div>
      </div>

      <div className="panel-subbox">
        <div className="subbox-header">
          <h4>Simulation Controls</h4>
        </div>
        <div className="subbox-body">
          <section className="control-section simulation-buttons">
            <div className="speed-row">
              <div className="speed-heading-row control-heading">
                <label className="section-label" htmlFor="speed-slider">Set Speed</label>
                <span className="range-value">{Number(sim.speed).toString()}×</span>
              </div>
              <input
                id="speed-slider"
                className="speed-slider"
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={sim.speed}
                onChange={(e) => sim.setSpeed(Number(e.target.value))}
              />
              <div className="range-endpoints">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            <div className="button-grid">
              <button
                className="button-secondary"
                onClick={sim.previousStep}
                disabled={!sim.history.length}
              >
                ← Previous
              </button>
              <button
                className="button-primary"
                onClick={() => sim.setIsPlaying(!sim.isPlaying)}
                disabled={!hasSeed || sim.process.phase === "COMPLETE"}
              >
                {sim.isPlaying ? "❚❚ Pause" : "▶ Play"}
              </button>
              <button
                className="button-primary"
                onClick={sim.step}
                disabled={!hasSeed || sim.process.phase === "COMPLETE"}
              >
                Next →
              </button>
              <button className="button-secondary" onClick={sim.reset}>
                ↻ Reset
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
