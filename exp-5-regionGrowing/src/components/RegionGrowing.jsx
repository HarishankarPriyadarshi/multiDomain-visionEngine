import ".././App.css";

import { useState } from "react";
import { useRegionGrowingSimulation } from "../hooks/useRegionGrowingSimulation";
import { ControlPanel } from "./ControlPanel";
import { PixelGrid } from "./PixelGrid";
import { Explanation } from "./Explanation";


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
            <i className="legend-neighbour" /> Neighbour
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
    const [showInstructions, setShowInstructions] = useState(false);


    return (
        <main className="lab-shell region-growing-lab">
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
                            aria-haspopup="dialog"
                            aria-expanded={showInstructions}
                            onClick={() => setShowInstructions(true)}
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

                {showInstructions && (
                    <div
                        className="instructions-overlay"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) {
                                setShowInstructions(false);
                            }
                        }}
                    >
                        <section
                            className="instructions-dialog"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="instructions-title"
                        >
                            <div className="instructions-dialog-header">
                                <h2 id="instructions-title">Instructions – Region Growing Segmentation</h2>
                            </div>
<ol className="instructions-list">
    <li><strong>Generate Image:</strong> Select the grid size and click Generate New Image.</li>
    <li><strong>Select Seed:</strong> Click any pixel to select it as the seed pixel.</li>
    <li><strong>Set Connectivity:</strong> Select 4-connectivity or 8-connectivity.</li>
    <li><strong>Set Threshold:</strong> Adjust the threshold to control pixel similarity with the seed.</li>
    <li><strong>Run Simulation:</strong> Click Next for step-by-step execution or Play for automatic execution.</li>
    <li><strong>Control Speed:</strong> Use the Speed slider and click Pause when needed.</li>
    <li><strong>Previous Step:</strong> Click Previous to view the previous simulation step.</li>
    <li><strong>Observe the Process:</strong> Monitor the pixel grid, queue, decisions, and explanation as the region grows.</li>
    <li><strong>Reset:</strong> Click Reset to restart the simulation.</li>
</ol>


                            <footer className="instructions-dialog-footer">
                                <p className="instructions-note">
                                    <strong>Note:</strong> A seed pixel must be selected before starting the simulation.
                                </p>
                                <button
                                    className="instructions-close"
                                    type="button"
                                    onClick={() => setShowInstructions(false)}
                                >
                                    Close
                                </button>
                            </footer>
                        </section>
                    </div>
                )}

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
                                    <div className=" derivative-card">
                                        <div className="card-header-light">
                                            <h4>Generated Grayscale Image ({sim.size} × {sim.size})</h4>
                                            {/* <p className="section-heading-p">
                                                Click any pixel to establish the fixed intensity
                                                reference.
                                            </p> */}
                                        </div>
                                        <div className="card-body-derivative">

                                            <PixelGrid
                                                image={sim.image}
                                                seed={sim.seed}
                                                process={sim.process}
                                                interactive
                                                onSelect={sim.selectSeed}
                                            />
                                            <Legend />
                                        </div>
                                    </div>

                                    <div className="visual-flow-arrow" aria-hidden="true">
                                        <div id="region_arrow">&#129066;</div>
                                    </div>

                                    <div className=" derivative-card">
                                        <div className="card-header-light">
                                            <h4>Pixel Intensity Matrix ({sim.size} × {sim.size})</h4>
                                            {/* <p className="section-heading-p">
                                                        Every value exactly matches its grayscale image.
                                                    </p> */}
                                        </div>
                                        <div className="card-body-derivative">

                                            <PixelGrid
                                                image={sim.image}
                                                seed={sim.seed}
                                                process={sim.process}
                                                mode="matrix"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="process-layout">
                                    <Explanation sim={sim} />
                                </div>

                                {/* <div className="visual-section grow-section derivative-card">
                                    <div className="card-header-light">
                                        <h4>Live Region Growing Process</h4>
                                    </div>
                                    <div className="visual-section card-body-derivative">
                                        <div className="section-heading">
                                            <div>


                                                <p>
                                                    Only similar connected neighbours can join the region.
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

                                    </div>
                                </div> */}


                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
