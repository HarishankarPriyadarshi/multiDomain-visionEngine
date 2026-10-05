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
            <label className="section-label">Select Grid Size</label>
            <select
              className="grid-size-select"
              value={sim.size}
              onChange={(e) => sim.changeSize(Number(e.target.value))}
            >
              <option value={8}>8 × 8</option>
              <option value={16}>16 × 16</option>
            </select>
            <label className="section-label">Generate Image</label>
            <button className="wide-button secondary" onClick={sim.generate}>
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
            <label className="section-label">Select Seed</label>
            <p className="instruction">
              Click a pixel in the grayscale image to select the seed.
            </p>
            <div className="seed-info">
              {hasSeed ? (
                <div className="seed-info-content">
                <span>
                    <b>✔ Seed Selected ⇒</b> {"  "}
                  
                   (<b>Row</b> {sim.seed.row + 1}<b>, Column</b> {sim.seed.col + 1}) {" "}

                    <b>Intensity</b> {sim.seed.intensity}
                  </span>
                </div>
              ) : (
                <span className="muted">✖ No seed selected</span>
              )}
            </div>
            <label className="section-label">Select Connectivity</label>
            <select
              className="connectivity-select"
              value={sim.connectivity}
              onChange={(e) => sim.setConnectivity(Number(e.target.value))}
            >
              <option value={4}>4-connectivity</option>
              <option value={8}>8-connectivity</option>
            </select>

            <div className="range-heading">
              <label className="section-label">Select Threshold</label>
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
        </div>
      </div>

      <div className="panel-subbox">
        <div className="subbox-header">
          <h4>Simulation Controls</h4>
        </div>
        <div className="subbox-body">
          <section className="control-section simulation-buttons">
            <div className="speed-row">
              <label className="section-label">Set  Speed</label>
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
            <div className="button-grid">
              <button
                className="primary"
                onClick={sim.step}
                disabled={!hasSeed || sim.process.phase === "COMPLETE"}
              >
                  <span>⬅</span>
                  <span>Previous</span>
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
                  
                  <span>Next</span>
                  <span>➡</span>
              </button>
              
            </div>
            <div className="button-grid">
            <button onClick={sim.reset}>↺ Reset</button>
            </div>

            
          </section>
        </div>
      </div>
    </div>
  );
}
