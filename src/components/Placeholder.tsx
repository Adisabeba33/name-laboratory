import { ImageIcon } from './icons'

/**
 * A deliberate, labelled placeholder that stands in for a future visual asset
 * (3D artifact, illustration, crystal, semantic map…). Never looks broken:
 * a thin outline, a single image glyph, the intended pixel size and a short
 * note, so a designer or developer can drop the real asset in later.
 *
 * `ratio` (w/h) drives an aspect-box so the frame keeps its proportions while
 * scaling down responsively; `width`/`height` are shown as the label only.
 */
export function Placeholder({
  width,
  height,
  title,
  note,
  className = '',
}: {
  width: number
  height: number
  title?: string
  note?: string
  className?: string
}) {
  return (
    <div
      className={`placeholder ${className}`}
      style={{ aspectRatio: `${width} / ${height}`, maxWidth: width }}
      role="img"
      aria-label={`Placeholder ${width}×${height}${note ? ` — ${note}` : ''}`}
    >
      <div className="placeholder-glow" aria-hidden />
      <div className="placeholder-inner">
        <ImageIcon className="placeholder-ico" />
        <span className="placeholder-tag">Placeholder</span>
        <span className="placeholder-size">
          {width} × {height}
        </span>
        {title && <span className="placeholder-title">{title}</span>}
        {note && <span className="placeholder-note">{note}</span>}
      </div>
    </div>
  )
}
