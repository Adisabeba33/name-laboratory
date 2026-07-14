import { useEffect, useState } from 'react'

/**
 * The loading state, told as what the engine actually does (Engine V6). Instead of
 * a blank spinner, the run narrates its own lexical evolution: read the meaning,
 * breed a population of candidate forms, let selection pressure kill most of them,
 * watch the survivors emerge, then name them. The copy is honest — these are the
 * real pipeline stages (breed → gate → survive → passport), not decoration.
 *
 * Timing is UI-only (a mount interval), so it never touches the deterministic
 * engine. Stages advance and hold on the last one until the run resolves, rather
 * than looping — we don't know real per-stage progress, so we don't fake it.
 */
const EVOLUTION_STAGES = [
  { title: 'Reading the meaning', detail: 'Understanding what you actually said.' },
  { title: 'Breeding a population', detail: 'Synthesising a large field of candidate forms.' },
  { title: 'Applying selection pressure', detail: 'Most forms fail the gates and die off.' },
  { title: 'Survivors emerging', detail: 'Only the strongest, most inevitable remain.' },
  { title: 'Naming the survivors', detail: 'Writing each surviving word its passport.' },
]

const STEP_MS = 1100

export function EvolutionLoader() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, EVOLUTION_STAGES.length - 1)),
      STEP_MS,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <div className="evoload" aria-live="polite" aria-busy="true">
      <h3 className="evoload-title">Evolving language</h3>
      <div className="evoload-orb" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <ol className="evoload-list">
        {EVOLUTION_STAGES.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'on' : 'todo'
          return (
            <li key={s.title} className={`evoload-item ${state}`}>
              <span className="evoload-dot" aria-hidden />
              <span className="evoload-body">
                <span className="evoload-name">{s.title}</span>
                <span className="evoload-detail">{s.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
