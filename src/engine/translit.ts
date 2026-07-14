/**
 * Latin → Russian (Cyrillic) transliteration for invented words.
 *
 * The product's core promise is that a new word can live inside an existing
 * language: a Russian speaker should be able to write it in Cyrillic and drop it
 * into a sentence ("прошёл через варетис"). This produces a natural, readable
 * Cyrillic spelling of a romanised word — approximate, but consistent, so the
 * word shown and the word used in the example sentences always match.
 */

/** Multi-letter sequences, tried longest-first. */
const DIGRAPHS: Array<[RegExp, string]> = [
  [/shch/g, 'щ'],
  [/sch/g, 'щ'],
  [/sh/g, 'ш'],
  [/ch/g, 'ч'],
  [/th/g, 'т'],
  [/ph/g, 'ф'],
  [/zh/g, 'ж'],
  [/kh/g, 'х'],
  [/ts/g, 'ц'],
  [/ya/g, 'я'],
  [/yo/g, 'ё'],
  [/yu/g, 'ю'],
  [/ye/g, 'е'],
  [/yi/g, 'йи'],
  [/ay/g, 'ай'],
  [/ey/g, 'ей'],
  [/oy/g, 'ой'],
  [/uy/g, 'уй'],
  [/ai/g, 'ай'],
  [/ei/g, 'ей'],
  [/oi/g, 'ой'],
  [/au/g, 'ау'],
  [/ou/g, 'оу'],
  [/ia/g, 'ия'],
  [/ie/g, 'ие'],
  [/io/g, 'ио'],
  [/iu/g, 'иу'],
]

const SINGLE: Record<string, string> = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и',
  j: 'дж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р',
  s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс', y: 'ы', z: 'з',
  ë: 'е', ï: 'и', ö: 'о', ü: 'у',
}

/** Transliterate one romanised word into a lowercase Cyrillic spelling. */
export function translitRu(word: string): string {
  let w = word.toLowerCase().replace(/[^a-zë-ü]/gi, '')
  if (!w) return word
  for (const [re, ru] of DIGRAPHS) w = w.replace(re, ru)
  let out = ''
  for (const ch of w) out += ch in SINGLE ? SINGLE[ch] : ch
  // Standalone Latin 'y' is a vowel here (→ 'ы'); Russian spelling wants 'и'
  // after ж/ш/ч/щ and the velars к/г/х (жи-ши, ки-ги-хи), so soften it there.
  out = out.replace(/([жшчщкгх])ы/g, '$1и')
  // A trailing hard 'й' after a consonant reads better dropped (e.g. "-syn" не "-сйн").
  return out.replace(/([бвгджзклмнпрстфхцчшщ])й(?![аеёиоуыэюя])/g, '$1')
}
