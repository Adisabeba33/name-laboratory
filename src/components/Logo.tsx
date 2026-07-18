import markUrl from '../assets/sianelara-mark.png'

/**
 * The Sianelara mark — the actual champagne-gold glyph artwork (extracted to
 * transparency from the master render), not a redraw. Rendered as an <img> so the
 * exact metallic finish and precise geometry are preserved at every size. Bundled
 * by Vite, so it still ships as one hashed asset with no runtime network request.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      className={className}
      src={markUrl}
      width={570}
      height={631}
      alt="Sianelara"
      decoding="async"
      draggable={false}
    />
  )
}
