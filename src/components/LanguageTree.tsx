import type { WordFamily } from '../engine'

/**
 * The Language Tree — a visual overview of the species discovered in a run.
 *
 * It reframes the result: not "nine random names" but a handful of distinct
 * linguistic branches, each with its native speakers hanging off it. Clicking a
 * word scrolls to its full passport below.
 */
export function LanguageTree({
  families,
  onPick,
}: {
  families: WordFamily[]
  onPick: (word: string) => void
}) {
  return (
    <div className="tree" role="tree" aria-label="Discovered languages">
      <div className="tree-root">Word Laboratory</div>
      <div className="tree-sub">
        ↳ {families.length} linguistic species discovered
      </div>
      <div className="tree-branches">
        {families.map((fam) => (
          <div className="tree-lang" key={fam.id} role="treeitem">
            <div className="tree-lang-name">
              <span className="dot" aria-hidden />
              {fam.character}
            </div>
            <ul className="tree-words">
              {fam.words.map((w, i) => (
                <li key={w.word}>
                  <span className="branch" aria-hidden>
                    {i === fam.words.length - 1 ? '└──' : '├──'}
                  </span>
                  <button className="tree-word" onClick={() => onPick(w.word)}>
                    {w.word}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
