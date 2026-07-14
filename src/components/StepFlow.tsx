/**
 * The narrative spine of a discovery: Idea → Meaning → Concept → Language →
 * Word → Lexicon. Every screen answers "where in the process am I?", so the
 * product reads as a method, not a button.
 *
 * `active` marks the current stage; earlier stages read as done. Vertical in the
 * workspace centre column, it turns a form-and-result into a story.
 */
export interface FlowStage {
  key: string
  title: string
  detail: string
}

export const FLOW_STAGES: FlowStage[] = [
  { key: 'idea', title: 'Idea', detail: 'You describe a feeling, moment or experience.' },
  { key: 'meaning', title: 'Meaning', detail: 'The lab reads what you really mean.' },
  { key: 'concept', title: 'Concept', detail: 'Hidden meaning and tensions are named.' },
  { key: 'language', title: 'Language', detail: 'Living sound-worlds are discovered.' },
  { key: 'word', title: 'Word', detail: 'New words are grown to carry it.' },
  { key: 'lexicon', title: 'Lexicon', detail: 'You keep the ones that ring true.' },
]

export function StepFlow({ active }: { active: string }) {
  const activeIndex = FLOW_STAGES.findIndex((s) => s.key === active)
  return (
    <div className="stepflow" aria-label="Discovery stages">
      <h3 className="stepflow-title">The process</h3>
      <ol className="stepflow-list">
        {FLOW_STAGES.map((stage, i) => {
          const state = i < activeIndex ? 'done' : i === activeIndex ? 'on' : 'todo'
          return (
            <li key={stage.key} className={`stepflow-item ${state}`}>
              <span className="stepflow-rail" aria-hidden>
                <span className="stepflow-node" />
                {i < FLOW_STAGES.length - 1 && <span className="stepflow-line" />}
              </span>
              <span className="stepflow-body">
                <span className="stepflow-name">{stage.title}</span>
                <span className="stepflow-detail">{stage.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
