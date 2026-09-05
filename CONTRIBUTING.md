# Contributing

Two kinds of contribution, both small.

**Adding a service** — one new JSON file.
**Re-verifying an entry** — change one date.

The second is the one this project needs most, and it takes about two minutes.

---

## Re-verifying a stale entry

The README lists everything that has not been checked in 90 days. Pick one:

1. Open its pricing page
2. Compare the numbers against `data/services/<slug>.json`
3. Fix anything that changed
4. Update `lastVerified` to today, and put your handle in `verifiedBy`

That is a complete, welcome contribution. It is also the only thing keeping
this list from becoming the thing it was built to replace.

---

## Adding a service

Create `data/services/your-service.json`:

```json
{
  "slug": "your-service",
  "name": "Your Service",
  "url": "https://yourservice.com",
  "pricingUrl": "https://yourservice.com/pricing",
  "category": "database",
  "description": "What the service does. Not what the free tier gives.",
  "limits": [
    "500 MB storage",
    "100 GB bandwidth per month",
    "1 project"
  ],
  "creditCardRequired": false,
  "expires": "never",
  "caveats": [
    "Projects pause after 7 days of inactivity"
  ],
  "lastVerified": "2026-09-05",
  "verifiedBy": "yourhandle"
}
```

Open a pull request. **Do not edit `README.md` or `site/index.html`** — both
are generated, and editing them by hand reintroduces the merge conflicts this
structure exists to avoid.

No git? [Use the form](../../issues/new?template=add-service.yml).

---

## Fields

| Field | Required | Notes |
|-------|----------|-------|
| `slug` | yes | Lowercase, hyphenated. **Must match the filename** |
| `name` | yes | As the vendor writes it |
| `url` | yes | Product or docs page |
| `pricingUrl` | yes | Where the numbers can be checked. **Not the homepage** |
| `category` | yes | From the list below |
| `description` | yes | 15–120 chars. What it *does* |
| `limits` | yes | 1–8 entries. See below |
| `creditCardRequired` | yes | `true` or `false` |
| `expires` | yes | `never` · `usage` · `trial` |
| `caveats` | no | What would surprise someone |
| `lastVerified` | yes | `YYYY-MM-DD`, the day you checked |
| `verifiedBy` | no | Your GitHub handle |

### Categories

```
database · hosting · ai-api · storage · email · auth
monitoring · cdn · ci-cd · analytics · search · queue
```

---

## On the limits field

This is the field the whole project turns on, and the one that gets
submissions rejected.

The validator refuses marketing language:

```
✗  Generous free tier
✗  Blazing fast performance
✗  Best in class limits

✓  500 MB storage
✓  100 GB bandwidth per month
✓  Unlimited bandwidth
✓  Shared vCPU and RAM
```

Note that "unlimited" passes. It is a specific, checkable claim. "Generous" is
not — it tells a reader nothing they can plan around.

Anything without a number needs to be concrete in some other way: `unlimited`,
`shared`, `dedicated`, `no permanent free tier`. Those all state something.

---

## Listing your own product

Welcome, with two conditions.

**The numbers match your pricing page.** Someone will check, and an entry that
overstates gets removed rather than corrected.

**`caveats` mentions what would surprise someone.** Sleep timers,
commercial-use restrictions, regional availability, rate limits that differ
from the headline number.

A vendor entry that lists its own caveats honestly is more persuasive than one
that hides them, and it survives review. That is the trade being offered here.

---

## Check before you open the PR

```bash
npm install
npm run validate
```

One second, and it catches everything a reviewer would: slug mismatches,
marketing language, a pricing URL pointing at the homepage, a `lastVerified`
date in the future.

```bash
npm run check    # validate, then rebuild README and site
npm run stale    # list what needs re-verifying
```

Both generated files will show as modified after `check`. **Do not commit
them** — a maintainer regenerates on merge.

---

## What gets removed

- Numbers that do not match the pricing page
- Services whose free tier has quietly ended, unless the entry says so
- Entries hiding a material caveat
- Anything nobody has verified in a very long time, if the vendor also seems
  to have gone quiet

---

## Why the verification date exists

A free tier list without dates is worse than no list. Someone reads "500 MB
free", plans around it, and finds out on deployment day that it became 100 MB
eighteen months ago.

The date makes the list honest about what it does not know. It also means the
data decaying is not a failure mode — it is a queue of small, obvious
contributions that anybody can pick up.
