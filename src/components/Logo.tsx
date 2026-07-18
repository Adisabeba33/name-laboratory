import markUrl from '../assets/sianelara-mark.png'
import wordmarkUrl from '../assets/sianelara-wordmark.png'
import subtitleUrl from '../assets/sianelara-subtitle.png'

/**
 * Sianelara identity — the actual champagne-gold artwork, extracted to
 * transparency from the master renders (not redrawn), so the exact metallic
 * finish and the branded letterforms (open-apex "A" with no crossbar) are
 * preserved. Each is one hashed asset bundled by Vite — no runtime request.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <img className={className} src={markUrl} width={570} height={631} alt="Sianelara" decoding="async" draggable={false} />
  )
}

/** The "SIANELARA" wordmark — real branded serif, crossbar-less A's. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <img className={className} src={wordmarkUrl} width={775} height={71} alt="Sianelara" decoding="async" draggable={false} />
  )
}

/** The "INSTITUTE OF MEANING" subtitle lockup. */
export function Subtitle({ className }: { className?: string }) {
  return (
    <img className={className} src={subtitleUrl} width={571} height={23} alt="Institute of Meaning" decoding="async" draggable={false} />
  )
}
