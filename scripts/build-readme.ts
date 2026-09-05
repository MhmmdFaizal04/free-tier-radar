/**
 * README generator.
 *
 * Generated, never edited by hand — that is what lets pull requests stack up
 * without conflicting.
 *
 *   npm run build
 */

import { writeFile } from 'node:fs/promises'
import { loadServices } from './load.js'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  EXPIRY_LABELS,
  STALE_AFTER_DAYS,
  daysSince,
  isStale,
  type Category,
  type Service,
} from './types.js'

const REPO = 'MhmmdFaizal04/free-tier-radar'
const SITE = 'https://mhmmdfaizal04.github.io/free-tier-radar/site/'

function verifiedCell(service: Service): string {
  const age = daysSince(service.lastVerified)

  // The stale marker is the point of this column. An entry nobody has checked
  // in four months should not look as trustworthy as one checked last week.
  if (age > STALE_AFTER_DAYS) {
    return `\`${service.lastVerified}\` **stale**`
  }
  return `\`${service.lastVerified}\``
}

function renderRow(service: Service): string {
  const name = `**[${service.name}](${service.url})**`
  const limits = service.limits.join('<br>')
  const card = service.creditCardRequired ? 'Required' : 'No'
  const expiry = EXPIRY_LABELS[service.expires]

  return `| ${name} | ${limits} | ${card} | ${expiry} | ${verifiedCell(service)} |`
}

function renderCategory(category: Category, services: Service[]): string {
  if (services.length === 0) return ''

  const sorted = [...services].sort((a, b) => a.name.localeCompare(b.name))

  const rows = [
    `### ${CATEGORY_LABELS[category]}`,
    '',
    '| Service | Free tier limits | Card | Type | Verified |',
    '|---------|-----------------|------|------|----------|',
    ...sorted.map(renderRow),
  ]

  // Caveats go under the table rather than in a column — they are the part
  // that changes a decision, and squeezing them into a cell makes them
  // unreadable.
  const withCaveats = sorted.filter((s) => s.caveats && s.caveats.length > 0)

  if (withCaveats.length > 0) {
    rows.push('')
    for (const service of withCaveats) {
      for (const caveat of service.caveats!) {
        rows.push(`> **${service.name}** — ${caveat}`)
      }
    }
  }

  return rows.join('\n')
}

function buildReadme(services: Service[]): string {
  const stale = services.filter(isStale)
  const noCard = services.filter((s) => !s.creditCardRequired).length
  const permanent = services.filter((s) => s.expires === 'never').length

  const byCategory = CATEGORIES.map((category) => ({
    category,
    services: services.filter((s) => s.category === category),
  })).filter((g) => g.services.length > 0)

  const staleSection =
    stale.length === 0
      ? `Every entry has been verified in the last ${STALE_AFTER_DAYS} days.`
      : [
          `**${stale.length} ${stale.length === 1 ? 'entry needs' : 'entries need'} re-checking.**`,
          '',
          'Each is a two-minute contribution: open the pricing page, confirm the',
          'numbers, update `lastVerified`.',
          '',
          ...stale
            .sort((a, b) => daysSince(b.lastVerified) - daysSince(a.lastVerified))
            .map(
              (s) =>
                `- [${s.name}](${s.pricingUrl}) — last checked ${daysSince(s.lastVerified)} days ago · [\`data/services/${s.slug}.json\`](data/services/${s.slug}.json)`,
            ),
        ].join('\n')

  return `<div align="center">

# Free Tier Radar

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=15&pause=1200&color=22D3EE&center=true&vCenter=true&width=560&lines=Free+tiers+with+the+actual+limits;And+the+date+each+was+last+checked;Stale+entries+get+flagged%2C+not+hidden;Because+quotas+change+without+warning" alt="" />

<br/>

[![Stars](https://img.shields.io/github/stars/${REPO}?style=for-the-badge&color=22d3ee&labelColor=0a0e14&logo=github)](https://github.com/${REPO}/stargazers)
[![Services](https://img.shields.io/badge/services-${services.length}-22d3ee?style=for-the-badge&labelColor=0a0e14)](#the-list)
[![Contributors](https://img.shields.io/github/contributors/${REPO}?style=for-the-badge&color=4ade80&labelColor=0a0e14)](https://github.com/${REPO}/graphs/contributors)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-4ade80?style=for-the-badge&labelColor=0a0e14)](CONTRIBUTING.md)

<br/>

> Most free tier lists rot quietly. Quotas get cut, card requirements appear,
> tiers get sunset — and the list keeps saying what was true two years ago,
> which is worse than saying nothing.
>
> **Every entry here carries the date it was last checked.** Anything older
> than ${STALE_AFTER_DAYS} days is marked stale in public.

<br/>

[**Browse with filters**](${SITE}) · [Add a service](#adding-a-service) · [Fix a stale entry](#entries-needing-a-check)

</div>

---

<div align="center">
<img src="assets/previews/cycle.svg" width="740" alt="Entries go stale, get flagged, and become small contributions" />
</div>

---

## At a glance

| | |
|---|---|
| Services listed | **${services.length}** |
| No card required | **${noCard}** |
| Permanently free | **${permanent}** |
| Needing a re-check | **${stale.length}** |

---

## Entries needing a check

${staleSection}

---

## The list

${byCategory.map((g) => renderCategory(g.category, g.services)).join('\n\n')}

---

## Adding a service

One file, and your pull request cannot conflict with anyone else's.

\`\`\`jsonc
// data/services/your-service.json
{
  "slug": "your-service",
  "name": "Your Service",
  "url": "https://yourservice.com",
  "pricingUrl": "https://yourservice.com/pricing",
  "category": "database",
  "description": "What the service does. Not what the free tier gives.",
  "limits": [
    "500 MB storage",
    "100 GB bandwidth per month"
  ],
  "creditCardRequired": false,
  "expires": "never",
  "caveats": ["Anything worth knowing before committing to it"],
  "lastVerified": "2026-09-05",
  "verifiedBy": "yourhandle"
}
\`\`\`

**The limits field is the whole point.** The validator rejects marketing
language — "generous free tier" fails, "500 MB storage" passes. That rule
exists because directories like this attract vendor submissions, and a list
of adjectives helps nobody.

Run \`npm run validate\` before opening the pull request. It takes a second and
catches everything a reviewer would.

---

## Are vendors welcome?

Yes, listing your own service is fine. Two conditions:

1. The numbers are real and match your pricing page
2. \`caveats\` mentions anything that would surprise someone — sleep timers,
   commercial-use restrictions, regional limits

An entry that hides a caveat gets removed when someone notices, and someone
always notices.

---

## Why the verification date

A free tier directory without dates is a liability. Someone reads "500 MB
free", plans around it, and discovers on deployment day that it became 100 MB
eighteen months ago.

The date makes the list honest about what it does not know. It also means the
data decaying is not a failure — it is a queue of small, obvious contributions
that anyone can pick up.

---

## Licence

[CC0 1.0](LICENSE) — public domain. Quotas belong to their respective vendors
and change without notice; always confirm on the pricing page before
committing to anything.

---

<div align="center">

<a href="https://github.com/${REPO}/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=${REPO}" alt="Contributors" />
</a>

<br/><br/>

Maintained by [MhmmdFaizal04](https://github.com/MhmmdFaizal04)

<sub>This file is generated. Edit \`data/services/\`, not this.</sub>

</div>
`
}

async function main(): Promise<void> {
  const services = await loadServices()
  await writeFile('README.md', buildReadme(services), 'utf-8')

  const stale = services.filter(isStale).length

  console.log('')
  console.log(`  ✓ README.md generated from ${services.length} services`)
  if (stale > 0) console.log(`    ${stale} marked stale`)
  console.log('')
}

void main()
