import "./App.css";

import { useRegionGrowingSimulation } from "./hooks/useRegionGrowingSimulation";
import { ControlPanel } from "./components/ControlPanel";
import { PixelGrid } from "./components/PixelGrid";
import { Explanation } from "./components/Explanation";
import { QueueVisualizer } from "./components/QueueVisualizer";
import { ResultsPanel } from "./components/ResultsPanel";

import voice from "./assets/voice-play.png";

const Legend = () => (
  <div className="legend">
    <span>
      <i className="legend-seed" /> Seed
    </span>
    <span>
      <i className="legend-current" /> Current
    </span>
    <span>
      <i className="legend-candidate" /> Testing
    </span>
    <span>
      <i className="legend-accepted" /> Accepted
    </span>
    <span>
      <i className="legend-rejected" /> Rejected
    </span>
  </div>
);

function App() {
  const sim = useRegionGrowingSimulation();

  const hasSeed = Boolean(sim.seed);
  const isComplete = sim.process.phase === "COMPLETE";

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="lab-shell">
      <div id="main-box">
        <div id="bottom-footer">
          © 2026 Virtual Labs, IIT Roorkee
        </div>

        <div id="top-header">
          <h2 className="header-heading">Region Growing Segmentation</h2>

          <div id="header_button">
            <button
              id="sound-btn"
              className="voice-btn"
              title="Voice Play"
              onClick={() => {}}
            >
              <img src={voice} alt="voice" style={{ width: "40px", height: "auto" }} />
            </button>

            <button
              id="instruction-btn"
              className="instruction-btn"
              onClick={() => {}}
            >
              Instructions
            </button>

            <button
              id="guided-tutor-btn"
              className="tutor-btn"
              onClick={() => {}}
            >
              Guided Tutor
            </button>
          </div>
        </div>

        <div id="mainbox">
          <div className="content-header">
            <h2>Region Based Segmentation</h2>
            <h4>
              Seed-based region growing using pixel intensity similarity and
              FIFO queue traversal
            </h4>
          </div>

          <div className="flex-container">
            <div className="flex-item-left">
              <div id="left_bar">
                <ControlPanel sim={sim} />
              </div>
            </div>

            <div className="flex-item-right">
              <section className="visual-panel">
                <div className="input-output-row">
                  <section className="visual-section derivative-card">
                    <div className="card-header-light">
                      <h4>Generated Grayscale Image</h4>
                    </div>
                    <div className="card-body-derivative">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">01 · SELECT</span>
                          <h2>Grayscale Pixel Grid</h2>
                          <p>
                            Click any pixel to establish the fixed intensity
                            reference.
                          </p>
                        </div>
                        <span className="grid-label">
                          {sim.size} × {sim.size} pixels
                        </span>
                      </div>
                      <PixelGrid
                        image={sim.image}
                        seed={sim.seed}
                        process={sim.process}
                        interactive
                        onSelect={sim.selectSeed}
                      />
                      <Legend />
                    </div>
                  </section>

                  <section className="visual-section derivative-card">
                    <div className="card-header-light">
                      <h4>Pixel Intensity Matrix</h4>
                    </div>
                    <div className="card-body-derivative">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">02 · INSPECT</span>
                          <h2>Intensity Values</h2>
                          <p>
                            Every value exactly matches its grayscale pixel
                            above.
                          </p>
                        </div>
                      </div>
                      <PixelGrid
                        image={sim.image}
                        seed={sim.seed}
                        process={sim.process}
                        mode="matrix"
                      />
                    </div>
                  </section>
                </div>

                <section className="process-layout">
                  <div className="visual-section grow-section derivative-card">
                    <div className="card-header-light">
                      <h4>Region Growing Process</h4>
                    </div>
                    <div className="card-body-derivative">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">03 · GROW</span>
                          <h2>Live BFS Traversal</h2>
                          <p>
                            Only connected neighbours can join the region.
                          </p>
                        </div>
                      </div>
                      <PixelGrid
                        image={sim.image}
                        seed={sim.seed}
                        process={sim.process}
                        mode="process"
                      />
                      <Legend />
                      <QueueVisualizer queue={sim.process.queue} />
                    </div>
                  </div>
                  <Explanation sim={sim} />
                </section>

                <ResultsPanel sim={sim} />
              </section>

              <div className="bottom-action-bar">
                <button
                  className="action-btn"
                  onClick={sim.step}
                  disabled={!hasSeed || isComplete}
                >
                  Step
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M5 4v16l14-8z" />
                  </svg>
                </button>

                <button
                  className="action-btn"
                  onClick={() => sim.setIsPlaying(true)}
                  disabled={!hasSeed || isComplete}
                >
                  ▶ Play
                </button>

                <button
                  className="action-btn"
                  onClick={() => sim.setIsPlaying(false)}
                  disabled={!sim.isPlaying}
                >
                  Ⅱ Pause
                </button>

                <button className="action-btn" onClick={sim.reset}>
                  ↺ Reset
                </button>

                <button className="action-btn" onClick={handlePrint}>
                  Print
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 8V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h2zm2-3h8V5H8v3zM4 10v8h16V10H4zm8 10h-2v2h2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
export default App;
