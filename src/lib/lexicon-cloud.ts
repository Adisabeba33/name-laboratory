import { getClient } from './auth'
import { lexId, type LexEntry } from './lexicon'

/**
 * Cloud lexicon (Stage 2) — the signed-in user's dictionary in Supabase.
 *
 * The browser talks to Postgres directly through supabase-js; row-level security
 * (see supabase/schema.sql) guarantees a user can only ever read or write their
 * OWN rows, so no bespoke `/api` endpoint is needed for the private lexicon. All
 * functions no-op safely when auth isn't configured or the user is a guest, so the
 * app keeps working on localStorage. The shared PUBLIC dictionary (Stage 3) will
 * go through `/api` instead, because it needs server-side de-duplication.
 */

const TABLE = 'lexicon_entries'

/** DB row shape (snake_case) ↔ our LexEntry (camelCase). */
interface Row {
  entry_key: string
  word: string
  transliteration: string
  pronunciation_guide: string
  part_of_speech: string
  meaning: string
  short_meaning: string
  usage: { en: string[]; ru: string[] }
  language: string
  adoption_band: string
  adoption_score: number
  brief: string
}

export function toRow(e: LexEntry, userId: string): Row & { user_id: string } {
  return {
    user_id: userId,
    entry_key: e.id,
    word: e.word,
    transliteration: e.transliteration,
    pronunciation_guide: e.pronunciationGuide,
    part_of_speech: e.partOfSpeech,
    meaning: e.meaning,
    short_meaning: e.shortMeaning,
    usage: e.usage,
    language: e.language,
    adoption_band: e.adoptionBand,
    adoption_score: e.adoptionScore,
    brief: e.brief,
  }
}

export function fromRow(r: Row & { created_at?: string }): LexEntry {
  return {
    id: r.entry_key || lexId(r.word, r.brief),
    word: r.word,
    transliteration: r.transliteration ?? '',
    pronunciationGuide: r.pronunciation_guide ?? '',
    partOfSpeech: r.part_of_speech ?? 'noun',
    meaning: r.meaning ?? '',
    shortMeaning: r.short_meaning ?? '',
    usage: r.usage ?? { en: [], ru: [] },
    language: r.language ?? '',
    adoptionBand: r.adoption_band ?? '',
    adoptionScore: r.adoption_score ?? 0,
    brief: r.brief ?? '',
    savedAt: r.created_at ?? new Date().toISOString(),
  }
}

/** The signed-in user's id, or null (guest / not configured). */
async function currentUserId(): Promise<string | null> {
  const c = await getClient()
  if (!c) return null
  const { data } = await c.auth.getUser()
  return data.user?.id ?? null
}

/** Load the user's whole cloud lexicon (newest first). Empty for a guest. */
export async function cloudList(): Promise<LexEntry[]> {
  const c = await getClient()
  if (!c) return []
  const { data, error } = await c.from(TABLE).select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as (Row & { created_at?: string })[]).map(fromRow)
}

/** Insert or update one entry in the cloud. No-op for a guest. */
export async function cloudUpsert(entry: LexEntry): Promise<void> {
  const c = await getClient()
  if (!c) return
  const userId = await currentUserId()
  if (!userId) return
  await c.from(TABLE).upsert(toRow(entry, userId), { onConflict: 'user_id,entry_key' })
}

/** Remove one entry (by our lexId) from the cloud. No-op for a guest. */
export async function cloudRemove(entryKey: string): Promise<void> {
  const c = await getClient()
  if (!c) return
  const userId = await currentUserId()
  if (!userId) return
  await c.from(TABLE).delete().eq('user_id', userId).eq('entry_key', entryKey)
}
