import './App.css'
import { useRegionGrowingSimulation } from './hooks/useRegionGrowingSimulation'
import { ControlPanel } from './components/ControlPanel'
import { PixelGrid } from './components/PixelGrid'
import { Explanation } from './components/Explanation'
import { QueueVisualizer } from './components/QueueVisualizer'
import { ResultsPanel } from './components/ResultsPanel'

const Legend = () => <div className="legend"><span><i className="legend-seed" /> Seed</span><span><i className="legend-current" /> Current</span><span><i className="legend-candidate" /> Testing</span><span><i className="legend-accepted" /> Accepted</span><span><i className="legend-rejected" /> Rejected</span></div>

function App() {
  const sim = useRegionGrowingSimulation()
  return <main className="lab-shell"><header className="site-header"><div className="brand"><div className="brand-mark">VL</div><div><span>VIRTUAL LABS · IIT ROORKEE</span><strong>Digital Image Processing</strong></div></div><div className="experiment-tag"><i /> EXPERIMENT 05</div></header>
    <section className="hero-copy"><div><p className="eyebrow">INTERACTIVE SIMULATION</p><h1>Region Growing <em>Segmentation</em></h1><p>Watch a region expand one connected pixel at a time, using a fixed seed intensity and a queue-based breadth-first traversal.</p></div><div className="formula-card"><span>SIMILARITY RULE</span><strong>| I<sub>neighbour</sub> − I<sub>seed</sub> | ≤ Threshold</strong><small>The original seed value never changes.</small></div></section>
    <div className="workspace"><ControlPanel sim={sim} /><section className="visual-panel">
      <section className="visual-section"><div className="section-heading"><div><span className="eyebrow">01 · SELECT</span><h2>Generated Grayscale Image</h2><p>Click any pixel to establish the fixed intensity reference.</p></div><span className="grid-label">{sim.size} × {sim.size} pixels</span></div><PixelGrid image={sim.image} seed={sim.seed} process={sim.process} interactive onSelect={sim.selectSeed} /><Legend /></section>
      <section className="visual-section matrix-section"><div className="section-heading"><div><span className="eyebrow">02 · INSPECT</span><h2>Pixel Intensity Matrix</h2><p>Every value exactly matches its grayscale pixel above.</p></div></div><PixelGrid image={sim.image} seed={sim.seed} process={sim.process} mode="matrix" /></section>
      <section className="process-layout"><div className="visual-section grow-section"><div className="section-heading"><div><span className="eyebrow">03 · GROW</span><h2>Region Growing Process</h2><p>Only connected neighbours can join the region.</p></div></div><PixelGrid image={sim.image} seed={sim.seed} process={sim.process} mode="process" /><Legend /><QueueVisualizer queue={sim.process.queue} /></div><Explanation sim={sim} /></section>
      <ResultsPanel sim={sim} />
    </section></div><footer>© IIT Roorkee Virtual Labs · Region Growing uses <b>Seed-Based Similarity</b> and a <b>FIFO queue</b>.</footer></main>
}
export default App
