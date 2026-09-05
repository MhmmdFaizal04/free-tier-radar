/**
 * Stale entry report.
 *
 * Meant to run on a schedule and open an issue listing what needs checking,
 * so the queue of small contributions maintains itself.
 *
 *   npm run stale
 */

import { loadServices } from './load.js'
import { STALE_AFTER_DAYS, daysSince, isStale } from './types.js'

async function main(): Promise<void> {
  const services = await loadServices()
  const stale = services
    .filter(isStale)
    .sort((a, b) => daysSince(b.lastVerified) - daysSince(a.lastVerified))

  console.log('')

  if (stale.length === 0) {
    console.log(`  ✓ every entry checked within ${STALE_AFTER_DAYS} days`)
    console.log('')
    return
  }

  console.log(`  ${stale.length} of ${services.length} entries need re-checking`)
  console.log('')

  for (const service of stale) {
    const age = daysSince(service.lastVerified)
    console.log(`  ${String(age).padStart(4)}d  ${service.name.padEnd(22)} ${service.pricingUrl}`)
  }

  console.log('')
  console.log('  Each is a two-minute fix: check the page, update lastVerified.')
  console.log('')

  // Machine-readable, for a workflow that turns this into an issue body.
  if (process.env.GITHUB_OUTPUT) {
    const body = stale
      .map((s) => `- [ ] [${s.name}](${s.pricingUrl}) — ${daysSince(s.lastVerified)} days`)
      .join('\n')

    console.log('::group::issue-body')
    console.log(body)
    console.log('::endgroup::')
  }
}

void main()
