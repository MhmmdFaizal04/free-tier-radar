/**
 * Submission validator.
 *
 * This file is the difference between a useful directory and a wall of vendor
 * marketing. Any list of free tiers attracts submissions from the vendors
 * themselves — that is the growth engine, and it is fine, but only if every
 * entry still has to state real numbers.
 *
 * So the rules that matter here are the ones that reject adjectives.
 *
 *   npm run validate
 */

import { readFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { DATA_DIR, listEntryFiles } from './load.js'
import {
  CATEGORIES,
  LIMITS,
  REQUIRED_FIELDS,
  daysSince,
  type Category,
  type Service,
  type TierExpiry,
} from './types.js'

interface Problem {
  file: string
  message: string
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const EXPIRY_VALUES: TierExpiry[] = ['never', 'trial', 'usage']

/**
 * Marketing language that carries no information.
 *
 * "Generous free tier" tells a reader nothing they can plan around.
 * "500 MB storage, 100 GB bandwidth" does. Every one of these has turned up
 * in a real awesome-list submission.
 */
const MARKETING_PHRASES = [
  'generous', 'best in class', 'industry leading', 'world class',
  'affordable', 'cheap', 'powerful', 'blazing', 'seamless', 'cutting edge',
  'no limits', 'as much as you need',
]

/** A limit is only useful if it contains a quantity. */
const HAS_NUMBER = /\d/

/**
 * Terms that carry real information without a number.
 *
 * An earlier version of this validator simply required a digit in every
 * limit, which was wrong: "unlimited bandwidth" is a specific, checkable
 * claim and one of the most useful things a free tier can say. "Shared vCPU"
 * likewise tells you exactly what you are getting.
 *
 * The thing actually worth rejecting is a promise with no content —
 * "generous limits" — and MARKETING_PHRASES already covers that.
 */
const CONCRETE_QUALIFIERS =
  /\b(unlimited|shared|dedicated|per[- ]model|self[- ]host|no (permanent )?free tier|varies)\b/i

/** Double-encoded UTF-8, which renders as garbage on GitHub. */
const MOJIBAKE = /Â[\s\u00A0]|â€|Ã[©¢«»]/

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function validateEntry(
  file: string,
  raw: unknown,
  seenSlugs: Map<string, string>,
  seenUrls: Map<string, string>,
): Problem[] {
  const problems: Problem[] = []
  const add = (message: string) => problems.push({ file, message })

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return [{ file, message: 'must be a JSON object' }]
  }

  const entry = raw as Partial<Service>

  for (const field of REQUIRED_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      add(`missing required field "${field}"`)
    }
  }

  // ── slug ──
  const expectedSlug = basename(file, '.json')
  if (typeof entry.slug === 'string') {
    if (!SLUG_PATTERN.test(entry.slug)) {
      add(`slug "${entry.slug}" must be lowercase words joined by hyphens`)
    }
    if (entry.slug !== expectedSlug) {
      add(`slug "${entry.slug}" does not match filename "${expectedSlug}.json"`)
    }

    const duplicate = seenSlugs.get(entry.slug)
    if (duplicate) add(`slug "${entry.slug}" already used by ${duplicate}`)
    else seenSlugs.set(entry.slug, file)
  }

  // ── urls ──
  for (const field of ['url', 'pricingUrl'] as const) {
    const value = entry[field]
    if (typeof value === 'string' && !isHttps(value)) {
      add(`${field} "${value}" must be a valid https:// address`)
    }
  }

  if (typeof entry.url === 'string') {
    const host = (() => {
      try { return new URL(entry.url).hostname.replace(/^www\./, '') } catch { return entry.url }
    })()

    const duplicate = seenUrls.get(host)
    if (duplicate) add(`${host} is already listed in ${duplicate}`)
    else seenUrls.set(host, file)
  }

  // The pricing page is what a reader checks when the numbers look stale.
  // Pointing it at the homepage defeats the purpose.
  if (
    typeof entry.pricingUrl === 'string' &&
    typeof entry.url === 'string' &&
    entry.pricingUrl.replace(/\/+$/, '') === entry.url.replace(/\/+$/, '')
  ) {
    add('pricingUrl must point at the pricing page, not the homepage')
  }

  // ── category ──
  if (entry.category !== undefined && !CATEGORIES.includes(entry.category as Category)) {
    add(`unknown category "${String(entry.category)}" — allowed: ${CATEGORIES.join(', ')}`)
  }

  // ── description ──
  if (typeof entry.description === 'string') {
    const text = entry.description.trim()

    if (text.length < LIMITS.descriptionMin) {
      add(`description is ${text.length} characters, minimum ${LIMITS.descriptionMin}`)
    }
    if (text.length > LIMITS.descriptionMax) {
      add(`description is ${text.length} characters, maximum ${LIMITS.descriptionMax}`)
    }

    const marketing = MARKETING_PHRASES.filter((p) =>
      text.toLowerCase().includes(p.replace('*', '')),
    )
    if (marketing.length > 0) {
      add(`description reads as marketing copy ("${marketing[0]}") — describe what the service does`)
    }
  }

  // ── limits ── the field this whole repository exists for
  if (Array.isArray(entry.limits)) {
    if (entry.limits.length < LIMITS.limitsMin) add('limits needs at least one entry')
    if (entry.limits.length > LIMITS.limitsMax) {
      add(`limits has ${entry.limits.length} entries, maximum ${LIMITS.limitsMax}`)
    }

    for (const limit of entry.limits) {
      if (typeof limit !== 'string') {
        add('every limit must be a string')
        continue
      }

      const marketing = MARKETING_PHRASES.filter((p) =>
        limit.toLowerCase().includes(p.replace('*', '')),
      )
      if (marketing.length > 0) {
        add(`limit "${limit}" reads as marketing ("${marketing[0]}") — state the actual quota`)
        continue
      }

      // Must be quantified, or say something concrete without a number.
      if (!HAS_NUMBER.test(limit) && !CONCRETE_QUALIFIERS.test(limit)) {
        add(`limit "${limit}" is not specific enough — give a quota or say "unlimited"`)
      }
    }
  }

  // ── creditCardRequired ──
  if (entry.creditCardRequired !== undefined && typeof entry.creditCardRequired !== 'boolean') {
    add('creditCardRequired must be true or false')
  }

  // ── expires ──
  if (entry.expires !== undefined && !EXPIRY_VALUES.includes(entry.expires as TierExpiry)) {
    add(`expires must be one of: ${EXPIRY_VALUES.join(', ')}`)
  }

  // ── lastVerified ──
  if (typeof entry.lastVerified === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastVerified)) {
      add(`lastVerified "${entry.lastVerified}" must be a date in YYYY-MM-DD form`)
    } else {
      const age = daysSince(entry.lastVerified)

      // A future date means someone typed the year wrong, or is claiming a
      // verification that has not happened.
      if (age < 0) add(`lastVerified "${entry.lastVerified}" is in the future`)
    }
  }

  return problems
}

async function main(): Promise<void> {
  let files: string[]
  try {
    files = await listEntryFiles()
  } catch {
    console.error(`\n  Cannot read ${DATA_DIR}\n`)
    process.exit(1)
  }

  const problems: Problem[] = []
  const seenSlugs = new Map<string, string>()
  const seenUrls = new Map<string, string>()

  for (const file of files) {
    const text = await readFile(join(DATA_DIR, file), 'utf-8')

    if (MOJIBAKE.test(text)) {
      problems.push({
        file,
        message: 'text looks double-encoded — save the file as UTF-8 without a BOM',
      })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (error) {
      problems.push({
        file,
        message: `invalid JSON — ${error instanceof Error ? error.message : 'parse failed'}`,
      })
      continue
    }

    problems.push(...validateEntry(file, parsed, seenSlugs, seenUrls))
  }

  console.log('')

  if (problems.length === 0) {
    console.log(`  ✓ ${files.length} services, all valid`)
    console.log('')
    return
  }

  const byFile = new Map<string, string[]>()
  for (const p of problems) {
    const list = byFile.get(p.file)
    if (list) list.push(p.message)
    else byFile.set(p.file, [p.message])
  }

  console.log(`  ✗ ${problems.length} problem(s) in ${byFile.size} file(s)`)
  console.log('')

  for (const [file, messages] of byFile) {
    console.log(`  ${file}`)
    for (const message of messages) console.log(`    · ${message}`)
    console.log('')
  }

  console.log('  See CONTRIBUTING.md for the expected shape.')
  console.log('')
  process.exit(1)
}

void main()
