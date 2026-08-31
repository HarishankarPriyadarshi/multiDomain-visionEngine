import { coordinate } from '../utils/regionGrowingUtils'

const lineForPhase = { ADD_SEED: 1, DEQUEUE: 4, SHOW_NEIGHBOURS: 5, TEST_NEIGHBOUR: 6, CALCULATE_DIFFERENCE: 7, ACCEPT_OR_REJECT: 8, NEXT_NEIGHBOUR: 6, COMPLETE: 12 }
const code = ['Add seed to region', 'Add seed to queue', 'While queue is not empty', '  Remove current pixel', '  Find neighbours', '  For each unvisited neighbour', '    Calculate difference', '    If difference ≤ threshold', '      Add neighbour to region', '      Add neighbour to queue', '    Else reject neighbour', 'End when queue is empty']

export function Explanation({ sim }) {
  const { process, seed, threshold } = sim
  const decision = process.decision
  const currentVal = process.current ? sim.image[process.current.row][process.current.col] : null
  const candidateVal = process.candidate ? sim.image[process.candidate.row][process.candidate.col] : null
  return <div className="explain-stack">
    <section className="card explanation-card derivative-card" style={{ padding: '0' }}>
      <div className="card-header-derivative" style={{ borderRadius: '12px 12px 0 0' }}>
        <h4>Live Reasoning · Step {process.stepCount}</h4>
      </div>
      <div className="card-body-derivative">
        <div className="card-heading">
          <div>
            <span className="eyebrow">LIVE REASONING</span>
            <h3>Current Algorithm Step</h3>
          </div>
          <span className="step-badge">Step {process.stepCount}</span>
        </div>
        <p className="step-message">{process.message}</p>
        {seed && <div className="detail-grid"><div><span>Seed reference</span><b>{coordinate(seed)} · {seed.intensity}</b></div><div><span>Current pixel</span><b>{coordinate(process.current)}{currentVal !== null && ` · ${currentVal}`}</b></div>{process.candidate && <div className="testing"><span>Testing neighbour</span><b>{coordinate(process.candidate)} · {candidateVal}</b></div>}<div><span>Threshold</span><b>{threshold}</b></div></div>}
        {decision && <div className={`calculation ${decision.accepted ? 'accepted-calc' : 'rejected-calc'}`}><span>Fixed-seed comparison</span><strong>| {decision.value} − {seed.intensity} | = {decision.difference}</strong><b>{decision.difference} {decision.accepted ? '≤' : '>'} {threshold} &nbsp; {decision.accepted ? '✓ ACCEPT' : '× REJECT'}</b></div>}
        <p className="educational-note">{decision ? (decision.accepted ? 'This spatially connected pixel is within the fixed seed intensity threshold, so BFS adds it to the growing region.' : 'This connected pixel differs too much from the original seed. It remains outside the region.') : 'Region Growing checks only connected neighbours; it never searches the whole image for similar pixels.'}</p>
      </div>
    </section>
    <section className="card pseudocode derivative-card" style={{ padding: '0' }}>
      <div className="card-header-light" style={{ borderRadius: '12px 12px 0 0' }}>
        <h4>Queue-based BFS Algorithm</h4>
      </div>
      <div className="card-body-derivative">
        <span className="eyebrow">ALGORITHM</span>
        <h3>Pseudocode</h3>
        <ol>{code.map((text, index) => <li key={text} className={lineForPhase[process.phase] === index + 1 ? 'active-line' : ''}>{text}</li>)}</ol>
      </div>
    </section>
  </div>
}
