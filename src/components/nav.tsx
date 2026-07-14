/**
 * Navigation model shared by the desktop Sidebar and the mobile BottomNav.
 *
 * One source of truth for the lab's "rooms". Each is a view the shell can show;
 * several are still future laboratories (marked `soon`) that render an inviting
 * placeholder rather than an unfinished screen.
 */
import type { ComponentType, SVGProps } from 'react'
import {
  CollectionsIcon,
  DiscoverIcon,
  ExperimentsIcon,
  HelpIcon,
  LanguagesIcon,
  LexiconIcon,
  SettingsIcon,
} from './icons'

export type ViewKey =
  | 'discover'
  | 'lexicon'
  | 'languages'
  | 'collections'
  | 'experiments'
  | 'settings'
  | 'help'

export interface NavItem {
  key: ViewKey
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  /** A future laboratory — renders a "coming soon" surface. */
  soon?: boolean
}

/** Full sidebar list (desktop). */
export const NAV_PRIMARY: NavItem[] = [
  { key: 'discover', label: 'Discover', Icon: DiscoverIcon },
  { key: 'lexicon', label: 'Lexicon', Icon: LexiconIcon },
  { key: 'languages', label: 'Languages', Icon: LanguagesIcon },
  { key: 'collections', label: 'Collections', Icon: CollectionsIcon, soon: true },
  { key: 'experiments', label: 'Experiments', Icon: ExperimentsIcon, soon: true },
]

export const NAV_SECONDARY: NavItem[] = [
  { key: 'settings', label: 'Settings', Icon: SettingsIcon, soon: true },
  { key: 'help', label: 'Help', Icon: HelpIcon, soon: true },
]

/** Condensed set for the mobile bottom bar (iOS-style). */
export const NAV_MOBILE: NavItem[] = [
  { key: 'discover', label: 'Discover', Icon: DiscoverIcon },
  { key: 'lexicon', label: 'Lexicon', Icon: LexiconIcon },
  { key: 'languages', label: 'Languages', Icon: LanguagesIcon },
  { key: 'collections', label: 'Collections', Icon: CollectionsIcon, soon: true },
  { key: 'settings', label: 'Settings', Icon: SettingsIcon, soon: true },
]
