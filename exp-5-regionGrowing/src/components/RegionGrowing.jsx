import ".././App.css";

import { useRegionGrowingSimulation } from "../hooks/useRegionGrowingSimulation";
import { ControlPanel } from "./ControlPanel";
import { PixelGrid } from "./PixelGrid";
import { Explanation } from "./Explanation";
import { QueueVisualizer } from "./QueueVisualizer";


import voice from "../assets/voice-play.png";

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

export const RegionGrowing = () => {
    const sim = useRegionGrowingSimulation();



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
                            onClick={() => { }}
                        >
                            <img src={voice} alt="voice" style={{ width: "40px", height: "auto" }} />
                        </button>

                        <button
                            id="instruction-btn"
                            className="instruction-btn"
                            onClick={() => { }}
                        >
                            Instructions
                        </button>

                        <button
                            id="guided-tutor-btn"
                            className="tutor-btn"
                            onClick={() => { }}
                        >
                            Guided Tutor
                        </button>
                    </div>
                </div>

                <div id="mainbox">


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


                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

