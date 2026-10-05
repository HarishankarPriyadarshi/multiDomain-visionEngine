import ".././App.css";

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
                                            <h4>Generated Grayscale Image ({sim.size} × {sim.size})</h4>
                                        </div>
                                        <div className="card-body-derivative">
                                            <div className="section-heading">
                                                <div>
                                                    <p>
                                                        Click any pixel to establish the fixed intensity
                                                        reference.
                                                    </p>
                                                </div>

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

                                    <div className="visual-flow-arrow" aria-hidden="true">
                                        <div id="region_arrow">&#129066;</div>
                                    </div>

                                    <section className="visual-section derivative-card">
                                        <div className="card-header-light">
                                            <h4>Pixel Intensity Matrix ({sim.size} × {sim.size})</h4>
                                        </div>
                                        <div className="card-body-derivative">
                                            <div className="section-heading">
                                                <div>

                                                    <p>
                                                        Every value exactly matches its grayscale image.
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

                                    <Explanation sim={sim} />

                                </section>
                                <div className="visual-section grow-section derivative-card">
                                    <div className="card-header-light">
                                        <h4>Live Region Growing Process</h4>
                                    </div>
                                    <div className="card-body-derivative">
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
                                </div>


                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
