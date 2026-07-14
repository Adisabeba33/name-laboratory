/**
 * Thin, uniform line icons — 1.5px strokes, currentColor, no fills.
 * Deliberately minimal (Linear / Raycast register), never Material.
 * All share a 24×24 box and inherit color/size from CSS so the whole set
 * reads as one family.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export function DiscoverIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 7.5 12.4 9.6 14.5 11 12.4 12.4 11 14.5 9.6 12.4 7.5 11 9.6 9.6Z" />
      <path d="m20 20-3.6-3.6" />
    </Base>
  )
}

export function LexiconIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 18.5Z" />
      <path d="M5 17.5A1.5 1.5 0 0 1 6.5 16H19" />
      <path d="M9 7.5h6" />
    </Base>
  )
}

export function LanguagesIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.3 2.3 3.5 5.3 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.3-3.5-8.5S9.7 5.8 12 3.5Z" />
    </Base>
  )
}

export function CollectionsIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Base>
  )
}

export function ExperimentsIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M9.5 3v6.3L5.2 16a2 2 0 0 0 1.7 3h10.2a2 2 0 0 0 1.7-3l-4.3-6.7V3" />
      <path d="M8 3h8" />
      <path d="M8.2 13.5h7.6" />
    </Base>
  )
}

export function SettingsIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
    </Base>
  )
}

export function HelpIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.4 2.4 0 0 1 4.7.6c0 1.6-2.3 2-2.3 3.6" />
      <path d="M12 16.6h.01" />
    </Base>
  )
}

export function ArrowIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Base>
  )
}

export function BackIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Base>
  )
}

export function ImageIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m4.5 17 4.4-4.3a2 2 0 0 1 2.7-.1L20 20" />
    </Base>
  )
}

export function HeartIcon({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Base {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7-4.4-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7-1.4c0 5-7 9.4-7 9.4Z" />
    </Base>
  )
}

export function CloseIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  )
}

export function SoundIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 9.5h3l4-3.5v12l-4-3.5H4Z" />
      <path d="M15.5 8.5a4 4 0 0 1 0 7M18 6a7 7 0 0 1 0 12" />
    </Base>
  )
}

export function SparkIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 3c.4 3.5 2.5 5.6 6 6-3.5.4-5.6 2.5-6 6-.4-3.5-2.5-5.6-6-6 3.5-.4 5.6-2.5 6-6Z" />
    </Base>
  )
}
