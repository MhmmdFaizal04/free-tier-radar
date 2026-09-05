/**
 * Showcase site.
 *
 * One self-contained HTML file with client-side filtering.
 *
 *   npm run build:site
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
  type Service,
} from './types.js'

const REPO = 'MhmmdFaizal04/free-tier-radar'

function buildSite(services: Service[]): string {
  const sorted = [...services].sort((a, b) => a.name.localeCompare(b.name))
  const used = CATEGORIES.filter((c) => services.some((s) => s.category === c))

  const enriched = sorted.map((s) => ({
    ...s,
    _age: daysSince(s.lastVerified),
    _stale: isStale(s),
    _categoryLabel: CATEGORY_LABELS[s.category],
    _expiryLabel: EXPIRY_LABELS[s.expires],
  }))

  const staleCount = services.filter(isStale).length
  const noCardCount = services.filter((s) => !s.creditCardRequired).length

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Free Tier Radar — ${services.length} developer free tiers with real limits</title>
<meta name="description" content="Free tiers for databases, hosting, AI APIs and more — with the actual quotas and the date each was last verified."/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0e14;--s1:#11161f;--s2:#181f2a;--bd:#222b38;--bd2:#303c4d;
  --tx:#e3e8ef;--tx2:#94a3b8;--tx3:#546174;
  --cy:#22d3ee;--gr:#4ade80;--am:#fbbf24;--rd:#f87171;
}
html{scroll-behavior:smooth}
body{font-family:Inter,sans-serif;background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px}
a{color:inherit;text-decoration:none}
.mono{font-family:'JetBrains Mono',monospace}

header{position:sticky;top:0;z-index:50;background:rgba(10,14,20,.93);backdrop-filter:blur(14px);border-bottom:1px solid var(--bd)}
.hin{max-width:1240px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:600}
.mark{width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,var(--cy),var(--gr))}
.ghb{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--tx2);padding:6px 13px;border:1px solid var(--bd2);border-radius:7px;background:var(--s2);transition:border-color .15s,color .15s}
.ghb:hover{border-color:var(--cy);color:var(--tx)}
.ghb svg{width:13px;height:13px;fill:var(--tx3)}

.wrap{max-width:1240px;margin:0 auto;padding:0 24px}
.hero{padding:52px 0 30px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--cy);margin-bottom:14px}
.eyebrow::before,.eyebrow::after{content:'';width:16px;height:1px;background:var(--cy);opacity:.4}
h1{font-size:clamp(29px,5vw,44px);font-weight:700;letter-spacing:-1.3px;line-height:1.09;margin-bottom:13px}
h1 em{font-style:normal;background:linear-gradient(120deg,var(--cy),var(--gr));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lede{font-size:15px;color:var(--tx2);line-height:1.7;max-width:560px;margin-bottom:20px}
.stats{display:flex;gap:26px;flex-wrap:wrap}
.stat b{display:block;font-size:20px;font-weight:700;letter-spacing:-.4px}
.stat span{font-size:11px;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em}

.filters{border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:16px 0;margin:24px 0 22px}
.frow{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:11px}
.frow:last-child{margin-bottom:0}
.flabel{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--tx3);min-width:52px}
.search{flex:1;min-width:200px;font-family:Inter,sans-serif;font-size:13px;background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:8px 13px;color:var(--tx);outline:none;transition:border-color .15s}
.search:focus{border-color:var(--cy)}
.search::placeholder{color:var(--tx3)}
.chip{font-size:11.5px;font-weight:500;font-family:Inter,sans-serif;padding:4px 11px;border-radius:99px;border:1px solid var(--bd);background:transparent;color:var(--tx2);cursor:pointer;transition:all .15s;white-space:nowrap}
.chip:hover{border-color:var(--bd2);color:var(--tx)}
.chip.on{background:var(--cy);border-color:var(--cy);color:#0a0e14;font-weight:600}
.count{font-size:12px;color:var(--tx3);margin-left:auto;white-space:nowrap}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:13px;padding-bottom:52px}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:17px;display:flex;flex-direction:column;transition:border-color .2s,transform .2s}
.card:hover{border-color:var(--bd2);transform:translateY(-2px)}
.card.stale{border-color:rgba(251,191,36,.28)}
.ctop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:5px}
.cname{font-size:15px;font-weight:600;letter-spacing:-.2px}
.cname:hover{color:var(--cy)}
.ccat{font-size:10px;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
.cdesc{font-size:12.5px;color:var(--tx2);line-height:1.55;margin-bottom:13px}
.lim{list-style:none;margin-bottom:12px}
.lim li{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--tx);padding:3px 0 3px 14px;position:relative}
.lim li::before{content:'';position:absolute;left:0;top:10px;width:5px;height:5px;border-radius:50%;background:var(--bd2)}
.cav{font-size:11.5px;color:var(--am);line-height:1.5;padding:8px 10px;background:rgba(251,191,36,.07);border-radius:6px;margin-bottom:12px}
.badges{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px}
.bg{font-size:10px;font-weight:500;padding:2px 8px;border-radius:99px}
.bg.card-no{background:rgba(74,222,128,.13);color:var(--gr)}
.bg.card-yes{background:rgba(248,113,113,.13);color:var(--rd)}
.bg.perm{background:rgba(34,211,238,.13);color:var(--cy)}
.bg.trial{background:rgba(251,191,36,.13);color:var(--am)}
.bg.usage{background:rgba(148,163,184,.13);color:var(--tx2)}
.cfoot{display:flex;align-items:center;gap:11px;padding-top:11px;border-top:1px solid var(--bd);margin-top:auto}
.cfoot a{font-size:11.5px;color:var(--tx3);transition:color .15s}
.cfoot a:hover{color:var(--cy)}
.ver{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--tx3)}
.ver.old{color:var(--am)}

.empty{grid-column:1/-1;padding:52px 0;text-align:center;color:var(--tx3);font-size:14px}

footer{border-top:1px solid var(--bd);padding:30px 24px;text-align:center}
footer p{font-size:12.5px;color:var(--tx3);line-height:1.7}
footer a{color:var(--cy)}
</style>
</head>
<body>

<header>
  <div class="hin">
    <a href="#" class="brand"><span class="mark"></span>Free Tier Radar</a>
    <a href="https://github.com/${REPO}" class="ghb" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      Star
    </a>
  </div>
</header>

<div class="wrap">
  <div class="hero">
    <div class="eyebrow">${services.length} services · verified, not guessed</div>
    <h1>Free tiers, with<br><em>the actual numbers.</em></h1>
    <p class="lede">Quotas change without notice and most lists never notice. Every entry here carries the date it was last checked against the pricing page, and anything older than ${STALE_AFTER_DAYS} days is flagged.</p>
    <div class="stats">
      <div class="stat"><b>${services.length}</b><span>Services</span></div>
      <div class="stat"><b>${noCardCount}</b><span>No card</span></div>
      <div class="stat"><b style="color:${staleCount > 0 ? 'var(--am)' : 'var(--gr)'}">${staleCount}</b><span>Need a check</span></div>
    </div>
  </div>

  <div class="filters">
    <div class="frow">
      <span class="flabel">Search</span>
      <input type="text" class="search" id="q" placeholder="Service, limit, or category..."/>
      <span class="count" id="count"></span>
    </div>
    <div class="frow">
      <span class="flabel">Category</span>
      <div id="cats" style="display:flex;gap:6px;flex-wrap:wrap"></div>
    </div>
    <div class="frow">
      <span class="flabel">Filter</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="chip" data-f="nocard">No card required</button>
        <button class="chip" data-f="permanent">Permanently free</button>
        <button class="chip" data-f="fresh">Recently verified</button>
      </div>
    </div>
  </div>

  <div class="grid" id="grid"></div>
</div>

<footer>
  <p>
    CC0 · Quotas belong to their vendors and change without notice — always confirm on the pricing page.<br/>
    <a href="https://github.com/${REPO}" target="_blank" rel="noopener">Source</a> ·
    <a href="https://github.com/${REPO}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Add a service</a>
  </p>
</footer>

<script>
const DATA = ${JSON.stringify(enriched)};
const CATS = ${JSON.stringify(used.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })))};

let activeCats = new Set();
let activeFlags = new Set();
let query = '';

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

function card(s){
  const cardBadge = s.creditCardRequired
    ? '<span class="bg card-yes">Card required</span>'
    : '<span class="bg card-no">No card</span>';

  const expiryClass = s.expires === 'never' ? 'perm' : s.expires === 'trial' ? 'trial' : 'usage';

  return \`<article class="card \${s._stale ? 'stale' : ''}">
    <div class="ctop">
      <a class="cname" href="\${s.url}" target="_blank" rel="noopener">\${esc(s.name)}</a>
      <span class="ccat">\${esc(s._categoryLabel)}</span>
    </div>
    <p class="cdesc">\${esc(s.description)}</p>
    <ul class="lim">\${s.limits.map(l=>\`<li>\${esc(l)}</li>\`).join('')}</ul>
    \${s.caveats ? s.caveats.map(c=>\`<div class="cav">\${esc(c)}</div>\`).join('') : ''}
    <div class="badges">
      \${cardBadge}
      <span class="bg \${expiryClass}">\${esc(s._expiryLabel)}</span>
    </div>
    <div class="cfoot">
      <a href="\${s.pricingUrl}" target="_blank" rel="noopener">Pricing page</a>
      <span class="ver \${s._stale ? 'old' : ''}" title="Last verified">\${s._stale ? \`\${s._age}d old\` : s.lastVerified}</span>
    </div>
  </article>\`;
}

function render(){
  const q = query.toLowerCase();

  const shown = DATA.filter(s=>{
    if(activeCats.size && !activeCats.has(s.category)) return false;
    if(activeFlags.has('nocard')    && s.creditCardRequired) return false;
    if(activeFlags.has('permanent') && s.expires !== 'never') return false;
    if(activeFlags.has('fresh')     && s._stale) return false;
    if(!q) return true;

    return (s.name+' '+s.description+' '+s.limits.join(' ')+' '+s._categoryLabel)
      .toLowerCase().includes(q);
  });

  document.getElementById('grid').innerHTML =
    shown.length ? shown.map(card).join('') : '<div class="empty">Nothing matches those filters.</div>';

  document.getElementById('count').textContent =
    shown.length === DATA.length ? \`\${DATA.length} services\` : \`\${shown.length} of \${DATA.length}\`;
}

document.getElementById('cats').innerHTML =
  CATS.map(c=>\`<button class="chip" data-c="\${c.id}">\${esc(c.label)}</button>\`).join('');

document.getElementById('cats').addEventListener('click', ev=>{
  const b = ev.target.closest('.chip'); if(!b) return;
  const v = b.dataset.c;
  if(activeCats.has(v)) activeCats.delete(v); else activeCats.add(v);
  b.classList.toggle('on'); render();
});

document.querySelectorAll('[data-f]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const v = b.dataset.f;
    if(activeFlags.has(v)) activeFlags.delete(v); else activeFlags.add(v);
    b.classList.toggle('on'); render();
  });
});

document.getElementById('q').addEventListener('input', ev=>{
  query = ev.target.value; render();
});

render();
</script>
</body>
</html>
`
}

async function main(): Promise<void> {
  const services = await loadServices()
  await writeFile('site/index.html', buildSite(services), 'utf-8')

  console.log('')
  console.log(`  ✓ site/index.html generated from ${services.length} services`)
  console.log('')
}

void main()
