/**
 * Service entry shape.
 *
 * One file per service in `data/services/`, so pull requests never conflict.
 *
 * The field that makes this repository work is `lastVerified`. Free tier
 * limits change constantly — providers cut quotas, add credit card
 * requirements, or quietly sunset the tier entirely. A directory without
 * verification dates is worse than no directory, because it looks
 * authoritative while being wrong.
 *
 * Entries older than STALE_AFTER_DAYS are flagged in the README and the site.
 * That is deliberate: it converts the list's own decay into a steady stream of
 * small, obvious contributions.
 */

export interface Service {
  /** Lowercase, hyphenated. Must match the filename. */
  slug: string

  /** Product name as the vendor writes it. */
  name: string

  /** Marketing or docs page for the free tier. */
  url: string

  /** Direct link to the pricing page, where the limits can be checked. */
  pricingUrl: string

  category: Category

  /** One sentence on what the service does. Not what the free tier gives. */
  description: string

  /**
   * The actual limits. Numbers, not adjectives.
   *
   * "Generous free tier" is rejected by the validator. "500 MB storage,
   * 190 compute hours per month" is what someone needs to decide.
   */
  limits: string[]

  /** Does signing up require a card? The single most-asked question. */
  creditCardRequired: boolean

  /** Does the free tier expire, or is it permanent? */
  expires: TierExpiry

  /** Caveats worth knowing before committing to it. */
  caveats?: string[]

  /** ISO date the limits above were last checked against the pricing page. */
  lastVerified: string

  /** GitHub handle of whoever last verified. Credit where it is due. */
  verifiedBy?: string
}

export type Category =
  | 'database'
  | 'hosting'
  | 'ai-api'
  | 'storage'
  | 'email'
  | 'auth'
  | 'monitoring'
  | 'cdn'
  | 'ci-cd'
  | 'analytics'
  | 'search'
  | 'queue'

export const CATEGORIES: Category[] = [
  'database', 'hosting', 'ai-api', 'storage', 'email', 'auth',
  'monitoring', 'cdn', 'ci-cd', 'analytics', 'search', 'queue',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  'database':   'Databases',
  'hosting':    'Hosting & Compute',
  'ai-api':     'AI & LLM APIs',
  'storage':    'Object Storage',
  'email':      'Transactional Email',
  'auth':       'Authentication',
  'monitoring': 'Monitoring & Errors',
  'cdn':        'CDN & Edge',
  'ci-cd':      'CI/CD',
  'analytics':  'Analytics',
  'search':     'Search',
  'queue':      'Queues & Jobs',
}

/** How the free tier ends, if it does. */
export type TierExpiry =
  /** Free forever, subject to the limits. */
  | 'never'
  /** Trial credit that runs out. */
  | 'trial'
  /** Free while the project stays under a threshold, then paid. */
  | 'usage'

export const EXPIRY_LABELS: Record<TierExpiry, string> = {
  never: 'Permanent',
  trial: 'Trial only',
  usage: 'Until threshold',
}

/**
 * Entries older than this are marked stale.
 *
 * Ninety days is a compromise. Shorter and the list is permanently red;
 * longer and the data drifts far enough to mislead someone into a migration.
 */
export const STALE_AFTER_DAYS = 90

export const REQUIRED_FIELDS = [
  'slug', 'name', 'url', 'pricingUrl', 'category',
  'description', 'limits', 'creditCardRequired', 'expires', 'lastVerified',
] as const satisfies readonly (keyof Service)[]

export const LIMITS = {
  descriptionMin: 15,
  descriptionMax: 120,
  limitsMin: 1,
  limitsMax: 8,
} as const

/** Days since a date string. Negative means the date is in the future. */
export function daysSince(isoDate: string): number {
  const then = new Date(`${isoDate}T00:00:00Z`).getTime()
  const now = Date.now()
  return Math.floor((now - then) / 86_400_000)
}

export function isStale(service: Service): boolean {
  return daysSince(service.lastVerified) > STALE_AFTER_DAYS
}
