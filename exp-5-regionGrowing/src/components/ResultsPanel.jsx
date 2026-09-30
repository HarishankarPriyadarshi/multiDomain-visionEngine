import { PixelGrid } from "./PixelGrid";
import { coordinate } from "../utils/regionGrowingUtils";
export function ResultsPanel({ sim }) {
  if (sim.process.phase !== "COMPLETE" || !sim.seed) return null;
  return (
    <section
      className="card results-card derivative-card"
      style={{ padding: "0" }}
    >
      <div
        className="card-header-derivative"
        style={{ borderRadius: "12px 12px 0 0" }}
      >
        <h4>Final Output · Region Growing Complete</h4>
      </div>
      <div className="card-body-derivative">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 210px",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <div>
            <span className="eyebrow">FINAL OUTPUT</span>
            <h3 style={{ color: "#087f8a" }}>Region Growing Complete</h3>
            <p style={{ fontSize: "11px", color: "#68778d" }}>
              Connected pixels satisfying the fixed seed comparison are shown in
              cyan.
            </p>
            <div className="result-stats">
              <span>Seed {coordinate(sim.seed)}</span>
              <span>Intensity {sim.seed.intensity}</span>
              <span>Threshold {sim.threshold}</span>
              <span>{sim.connectivity}-connected</span>
              <b>{sim.process.region.size} pixels in region</b>
            </div>
          </div>
          <div className="result-grid">
            <PixelGrid
              image={sim.image}
              seed={null}
              process={sim.process}
              mode="image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
